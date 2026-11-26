/* =========================================================================
   maze-app.js // the maze instrument: controls, loop and keys

   PRODUCT CODE. It joins the maze engine (the maze and how it is drawn) to
   design-system-ASK's instrument pattern (frame, view, save) and to the
   controls on the page. It never draws a cell itself and never sizes the
   canvas.

   Only an explicit action makes a new maze: `new maze`, space, or changing
   the algorithm, the grid or the density. Resizing, changing the frame or
   the view, switching light or dark, and saving draw the maze that exists.

   URL parameters, for review and for tests (none is needed for ordinary use):
     seed=<n>          the first maze's seed
     algorithm=<id or 1-8>, grid=rect|hex|triangle|radial, density=<0.5..2.5>
     aspect=<w / h>    the frame shape the first maze is composed for; without
                       it, the shape of the frame on screen
     speed=<1..240>    building steps per 1/60 s
     ends=1, solution=1, label=0
     finish=1          show each new maze complete at once
     play=0            start paused
     frame             as the control values
     store=0           neither read nor write remembered settings
   A value that cannot be read is ignored; the value in force stays.
   ========================================================================= */
(function () {
  'use strict';

  var STORE = 'mazeASK';
  var params = new URLSearchParams(location.search);
  var useStore = params.get('store') !== '0';
  var number = new Intl.NumberFormat('en-US');
  var ALGORITHMS = MazeEngine.ALGORITHMS;
  var TOPOLOGIES = MazeEngine.TOPOLOGIES;
  var LIMITS = { density: [0.5, 2.5, 0.25], speed: [1, 240, 1] };
  var UNDO_MS = 8000;
  var ADVICE_TOLERANCE = 0.1;     // a frame more than 10% wider or narrower than the maze's

  function $(id) { return document.getElementById(id); }
  function parse(raw) {
    if (raw == null || String(raw).trim() === '') return null;
    var n = Number(raw);
    return isFinite(n) ? n : null;
  }
  function snap(v, limit) {
    var clamped = v < limit[0] ? limit[0] : (v > limit[1] ? limit[1] : v);
    return Math.round(Math.round((clamped - limit[0]) / limit[2]) * limit[2] * 1000 + limit[0] * 1000) / 1000;
  }
  function setText(node, text) { if (node.textContent !== text) node.textContent = text; }
  function inputs(name) { return document.querySelectorAll('input[name="' + name + '"]'); }
  function checkRadio(name, value) {
    var list = inputs(name);
    for (var i = 0; i < list.length; i++) list[i].checked = list[i].value === value;
  }
  function algorithmById(id) { for (var i = 0; i < ALGORITHMS.length; i++) if (ALGORITHMS[i].id === id) return ALGORITHMS[i]; return null; }
  function topologyById(id) { for (var i = 0; i < TOPOLOGIES.length; i++) if (TOPOLOGIES[i].id === id) return TOPOLOGIES[i]; return null; }
  function trim(v) { return String(Math.round(v * 100) / 100); }

  var host = $('inst');
  var canvas = $('canvas');
  var seedParam = parse(params.get('seed'));
  var aspectParam = parse(params.get('aspect'));
  var engine = MazeEngine.create({ seed: seedParam == null ? undefined : Math.floor(Math.abs(seedParam)) % 4294967296 });
  var settings = engine.settings;
  /* A native host (app/maze-native.js inside the iOS app) registers itself
     before this file runs. On the web there is none, and everything below
     that names it is skipped. */
  var nativeHost = window.MazeNativeHost && typeof window.MazeNativeHost.attach === 'function' ? window.MazeNativeHost : null;
  var hostListeners = [];
  function tellHost(kind) { for (var i = 0; i < hostListeners.length; i++) hostListeners[i](kind); }

  /* ---- remembered settings, then the URL ------------------------------- */

  function recall() {
    if (!useStore) return;
    try {
      var saved = JSON.parse(localStorage.getItem(STORE) || 'null');
      if (!saved || typeof saved !== 'object') return;
      if (typeof saved.algorithm === 'string' && algorithmById(saved.algorithm)) settings.algorithm = saved.algorithm;
      if (typeof saved.topology === 'string' && topologyById(saved.topology)) settings.topology = saved.topology;
      if (typeof saved.density === 'number' && isFinite(saved.density)) settings.density = snap(saved.density, LIMITS.density);
      if (typeof saved.speed === 'number' && isFinite(saved.speed)) settings.speed = snap(saved.speed, LIMITS.speed);
      if (typeof saved.ends === 'boolean') settings.ends = saved.ends;
      if (typeof saved.solution === 'boolean') settings.solution = saved.solution;
      if (typeof saved.label === 'boolean') settings.label = saved.label;
    } catch (e) { /* storage is a convenience only */ }
  }
  function remember() {
    if (!useStore) return;
    try {
      localStorage.setItem(STORE, JSON.stringify({
        algorithm: settings.algorithm, topology: settings.topology, density: settings.density,
        speed: settings.speed, ends: settings.ends, solution: settings.solution, label: settings.label
      }));
    } catch (e) { /* ignore */ }
  }

  recall();
  (function fromUrl() {
    var v = params.get('algorithm');
    if (v != null) {
      if (/^[1-8]$/.test(v)) settings.algorithm = ALGORITHMS[Number(v) - 1].id;
      else if (algorithmById(v)) settings.algorithm = v;
    }
    v = params.get('grid');
    if (v != null && topologyById(v)) settings.topology = v;
    v = parse(params.get('density'));
    if (v != null) settings.density = snap(v, LIMITS.density);
    v = parse(params.get('speed'));
    if (v != null) settings.speed = snap(v, LIMITS.speed);
    if (params.get('ends') === '1') settings.ends = true; else if (params.get('ends') === '0') settings.ends = false;
    if (params.get('solution') === '1') settings.solution = true; else if (params.get('solution') === '0') settings.solution = false;
    if (params.get('label') === '0') settings.label = false; else if (params.get('label') === '1') settings.label = true;
  })();
  /* The grid in force must suit the algorithm (Sidewinder, Eller: squares). */
  if (!MazeEngine.supports(settings.algorithm, settings.topology)) settings.topology = 'rect';

  var reducedMotion = !!(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches);
  var finishAtOnce = params.get('finish') === '1' || reducedMotion;
  var playing = params.get('play') !== '0';

  var undoStack = [];
  var undoTimer = 0;
  var notice = '';
  var noticeUntil = 0;
  var noticeTimer = 0;
  var lastInfo = { view: null, export: null };   // what render was last told, per purpose (tests)

  /* ---- the instrument pattern ------------------------------------------ */

  var instrument = INSTRUMENT.create({
    root: host,
    stage: $('fit'),
    canvas: canvas,
    pin: $('pin'),
    name: 'mazes-ASK',
    frame: params.get('frame') || undefined,
    storageKey: useStore ? STORE + '/frame' : null,
    render: function (ctx, width, height, info) {
      lastInfo[info.purpose] = { frame: info.frame, width: width, height: height, aspect: info.aspect };
      if (!engine.work) { ctx.clearRect(0, 0, width, height); return; }
      engine.render(ctx, width, height);
    },
    fileSuffix: function () {
      var w = engine.work;
      return w ? w.algorithm + '-' + w.topology + '-' + w.seed : '';
    },
    formatSize: nativeHost ? function (w, h) { return 'PNG ' + w + ' × ' + h + ' px'; } : undefined
  });

  /* The shape a new maze is composed for: a fixed frame's exact aspect, or
     the canvas's shape in `free`. */
  function frameAspect() { return instrument.frame.aspect || instrument.metrics.aspect; }

  /* The settings line: URL parameters that make this maze again. The aspect
     sizes the grid, so it is written in full: String() of a number reads back
     as the same number, where a rounded aspect can size a different grid. */
  function replayLine(w) {
    return 'seed=' + w.seed + '&algorithm=' + w.algorithm + '&grid=' + w.topology +
      '&density=' + w.density + '&aspect=' + String(w.compositionAspect);
  }

  /* ---- status ---------------------------------------------------------- */

  function announce(text) {
    var node = $('announce');
    node.textContent = node.textContent === text ? text + ' ' : text;
  }
  function say(shown, spoken, ms) {
    notice = shown;
    noticeUntil = performance.now() + (ms || 4000);
    window.clearTimeout(noticeTimer);
    noticeTimer = window.setTimeout(renderStatus, (ms || 4000) + 30);
    if (spoken) announce(spoken);
    renderStatus();
  }
  function gridText(w) {
    var t = topologyById(w.topology).label;
    return w.topology === 'radial' ? w.rows + ' ' + t : w.cols + ' × ' + w.rows + ' ' + t;
  }
  /* The algorithm's name as its control shows it, so the line stays short. */
  function shortName(id) {
    var input = document.querySelector('input[name="algorithm"][value="' + id + '"]');
    return input && input.nextElementSibling ? input.nextElementSibling.textContent : id;
  }
  function renderStatus() {
    var w = engine.work;
    if (!w) return;
    var state;
    if (w.complete) state = 'complete';
    else if (!playing) state = 'paused';
    else state = 'building ' + Math.floor(100 * w.visited / Math.max(1, w.cellCount)) + '%';
    var text = notice && performance.now() < noticeUntil ? notice : state;
    setText($('status'), text + ' // ' + shortName(w.algorithm) + ' // ' + gridText(w));
  }

  /* ---- controls ---------------------------------------------------------- */

  function setRange(id, value, valueId, shown, spoken) {
    var input = $(id);
    if (String(input.value) !== String(value)) input.value = value;
    if (input.getAttribute('aria-valuetext') !== spoken) input.setAttribute('aria-valuetext', spoken);
    setText($(valueId), shown);
  }

  function advice() {
    var w = engine.work;
    var node = $('fit-note');
    if (!w) { node.hidden = true; return; }
    var ratio = frameAspect() / w.compositionAspect;
    var off = Math.abs(Math.log(ratio)) > Math.log(1 + ADVICE_TOLERANCE);
    var hadFocus = node.contains(document.activeElement);
    if (!off) {
      /* Hiding the note must not drop keyboard focus to the page. */
      if (!node.hidden) { if (hadFocus) $('new').focus(); node.hidden = true; }
      return;
    }
    var word = ratio > 1 ? 'narrower' : 'wider';
    var text = 'This maze was made for a ' + word + ' frame, so it sits inside this one with more ground around it.';
    if (node.getAttribute('data-text') !== text) {
      node.setAttribute('data-text', text);
      node.textContent = text + ' ';
      var button = document.createElement('button');
      button.type = 'button';
      button.className = 'surface-action surface-action--secondary';
      button.textContent = 'new maze for this frame';
      button.addEventListener('click', function () { makeNew('New maze for this frame.'); });
      node.appendChild(button);
      if (hadFocus) button.focus();
    }
    node.hidden = false;
  }

  function syncControls() {
    var w = engine.work;
    var i;
    checkRadio('algorithm', settings.algorithm);
    checkRadio('grid', settings.topology);
    var grids = inputs('grid');
    var rowOnly = !MazeEngine.supports(settings.algorithm, 'hex');
    for (i = 0; i < grids.length; i++) grids[i].disabled = grids[i].value !== 'rect' && rowOnly;
    setText($('algorithm-note'), algorithmById(settings.algorithm).note);
    setText($('grid-note'), rowOnly ? algorithmById(settings.algorithm).label + ' builds row by row, so it uses squares only.' : '');
    $('grid-note').hidden = !rowOnly;
    setRange('density', settings.density, 'density-value', trim(settings.density) + ' ×', trim(settings.density) + ' times');
    setRange('speed', settings.speed, 'speed-value', String(settings.speed), settings.speed + ' steps');
    var shows = inputs('show');
    for (i = 0; i < shows.length; i++) shows[i].checked = !!settings[shows[i].value];
    setText($('play'), playing ? 'pause' : 'play');
    $('undo').hidden = undoStack.length === 0;
    host.setAttribute('data-undo', undoStack.length ? 'true' : 'false');
    /* On a phone in full window that hides save PNG; focus must not fall to the page. */
    if (document.activeElement === $('save') && !$('save').getClientRects().length) $('undo').focus();
    if (w) setText($('settings-line'), replayLine(w));
    advice();
    renderStatus();
  }

  function changed() { remember(); syncControls(); tellHost('change'); }

  /* ---- undo ---------------------------------------------------------------
     Every action that replaces the maze or its colors can be taken back,
     newest first, until 8 seconds pass with no further such action. */

  function pushUndo(restore) {
    undoStack.push(restore);
    if (undoStack.length > 8) undoStack.shift();
    window.clearTimeout(undoTimer);
    undoTimer = window.setTimeout(endUndo, UNDO_MS);
  }
  function endUndo() {
    undoStack = [];
    window.clearTimeout(undoTimer);
    if (document.activeElement === $('undo')) $('new').focus();
    syncControls();
  }
  $('undo').addEventListener('click', function () {
    var restore = undoStack.pop();
    if (!restore) return;
    restore();
    var w = engine.work;
    settings.algorithm = w.algorithm;
    settings.topology = w.requestedTopology;
    settings.density = w.density;
    if (!MazeEngine.supports(settings.algorithm, settings.topology)) settings.topology = 'rect';
    instrument.redraw();
    if (undoStack.length === 0) {
      window.clearTimeout(undoTimer);
      if (document.activeElement === $('undo')) $('new').focus();
    }
    changed();
    kick();
    say('restored', 'Restored.', 3000);
  });

  /* ---- new work ---------------------------------------------------------- */

  function makeNew(spoken, quiet, aspect) {
    var hadWork = !!engine.work;
    var restore = engine.newMaze(aspect || frameAspect());
    if (hadWork) pushUndo(restore);
    if (finishAtOnce) engine.finish();
    tellHost('new');
    instrument.redraw();
    changed();
    kick();
    if (!quiet) say('new maze // undo for 8 s', (spoken || 'New maze.') + ' Undo is available for 8 seconds.', 3000);
  }

  function setAlgorithm(id) {
    if (!algorithmById(id)) return;
    settings.algorithm = id;
    if (!MazeEngine.supports(settings.algorithm, settings.topology)) settings.topology = 'rect';
    makeNew('New ' + algorithmById(id).label + ' maze.');
  }
  function setTopology(id) {
    if (!topologyById(id) || !MazeEngine.supports(settings.algorithm, id)) return;
    settings.topology = id;
    makeNew('New maze on ' + topologyById(id).label + '.');
  }
  function setDensity(v) {
    var next = snap(v, LIMITS.density);
    if (next === settings.density && engine.work && engine.work.density === next) { syncControls(); return; }
    settings.density = next;
    makeNew('New maze at density ' + trim(next) + '.');
  }
  function recolor() {
    if (!engine.work) return;          // in the app, before the first maze
    pushUndo(engine.recolor());
    instrument.redraw();
    changed();
    say('new colors // undo for 8 s', 'New colors. Undo is available for 8 seconds.', 3000);
  }
  function toggle(name) {
    settings[name] = !settings[name];
    instrument.redraw();
    changed();
  }

  var algoRadios = inputs('algorithm');
  for (var a = 0; a < algoRadios.length; a++) {
    algoRadios[a].addEventListener('change', function (e) { if (e.target.checked) setAlgorithm(e.target.value); });
  }
  var gridRadios = inputs('grid');
  for (var g = 0; g < gridRadios.length; g++) {
    gridRadios[g].addEventListener('change', function (e) { if (e.target.checked) setTopology(e.target.value); });
  }
  /* Dragging only shows the value; letting go makes the maze. */
  $('density').addEventListener('input', function (e) {
    var v = snap(Number(e.target.value), LIMITS.density);
    setText($('density-value'), trim(v) + ' ×');
  });
  $('density').addEventListener('change', function (e) { setDensity(Number(e.target.value)); });
  $('speed').addEventListener('input', function (e) { settings.speed = snap(Number(e.target.value), LIMITS.speed); changed(); });
  var showBoxes = inputs('show');
  for (var s = 0; s < showBoxes.length; s++) {
    showBoxes[s].addEventListener('change', function (e) { settings[e.target.value] = e.target.checked; instrument.redraw(); changed(); });
  }
  $('new').addEventListener('click', function () { makeNew(); });
  $('recolor').addEventListener('click', recolor);
  $('tuning-trigger').addEventListener('click', function (e) {
    var trigger = e.currentTarget;
    var open = trigger.getAttribute('aria-expanded') !== 'true';
    trigger.setAttribute('aria-expanded', open ? 'true' : 'false');
    $('tuning').hidden = !open;
  });

  /* ---- keys ---------------------------------------------------------------
     The sketch's keys, minus O and P (output mode is the frame selector
     now) and minus click-to-save. Ignored inside form controls and with a
     modifier held, so they never fight a control or a browser shortcut. */

  function fromControl(target) {
    if (!target || target === document.body || target === canvas) return false;
    var tag = target.tagName;
    return tag === 'INPUT' || tag === 'SELECT' || tag === 'TEXTAREA' || tag === 'BUTTON' || tag === 'A' ||
      tag === 'LABEL' || target.isContentEditable;
  }
  document.addEventListener('keydown', function (e) {
    if (e.defaultPrevented || e.ctrlKey || e.metaKey || e.altKey || e.repeat) return;
    if (fromControl(e.target)) return;
    var k = e.key;
    var handled = true;
    if (k === ' ' || e.code === 'Space') makeNew();
    else if (/^[1-8]$/.test(k)) setAlgorithm(ALGORITHMS[Number(k) - 1].id);
    else if (k === 'h' || k === 'H') setTopology(settings.topology === 'hex' ? 'rect' : 'hex');
    else if (k === 't' || k === 'T') setTopology(settings.topology === 'triangle' ? 'rect' : 'triangle');
    else if (k === 'c' || k === 'C') setTopology(settings.topology === 'radial' ? 'rect' : 'radial');
    else if (k === 'r' || k === 'R') recolor();
    else if (k === 'e' || k === 'E') toggle('ends');
    else if (k === 's' || k === 'S') toggle('solution');
    else if (k === '[') setDensity(settings.density - 0.25);
    else if (k === ']') setDensity(settings.density + 0.25);
    else if (k === '-') { settings.speed = snap(settings.speed - 1, LIMITS.speed); changed(); }
    else if (k === '=' || k === '+') { settings.speed = snap(settings.speed + 1, LIMITS.speed); changed(); }
    else if (k === 'p' || k === 'P') setPlaying(!playing);
    else handled = false;
    if (handled) e.preventDefault();
  });

  /* ---- the loop ----------------------------------------------------------
     While a maze is being built and the page is playing, each frame runs the
     steps due for the time that passed and draws the maze once. A complete
     maze stops the loop: nothing is drawn again until something changes. */

  var frameRequest = 0;
  var last = 0;
  function frame(now) {
    frameRequest = 0;
    var w = engine.work;
    if (!playing || !w || w.complete) return;
    var dt = last ? now - last : 0;
    last = now;
    if (!document.hidden && engine.advance(dt) > 0) {
      instrument.redraw();
      if (w.complete) {
        syncControls();
        announce('Maze complete.');
        tellHost('complete');
        return;
      }
      renderStatus();
    }
    frameRequest = window.requestAnimationFrame(frame);
  }
  function kick() {
    last = 0;
    if (playing && !frameRequest && engine.work && !engine.work.complete) frameRequest = window.requestAnimationFrame(frame);
  }
  function setPlaying(next, quiet) {
    playing = !!next;
    if (!playing && frameRequest) { window.cancelAnimationFrame(frameRequest); frameRequest = 0; }
    kick();
    syncControls();
    if (!quiet) announce(playing ? 'Building.' : 'Paused.');
  }
  $('play').addEventListener('click', function () { setPlaying(!playing); });
  document.addEventListener('visibilitychange', function () { last = 0; });

  instrument.on('change', advice);
  instrument.on('change', function (s) { if (s.reason === 'frame') tellHost('change'); });
  instrument.on('resize', advice);
  instrument.on('export', function (result) {
    if (!result.downloaded) return;
    say('download started // ' + result.width + ' × ' + result.height + ' px',
      'Download started, ' + result.width + ' by ' + result.height + ' pixels.', 6000);
  });
  instrument.on('error', function (error) {
    var why = error && error.message ? error.message : 'unknown error';
    say('could not save // ' + why, 'Could not save. ' + why, 8000);
  });
  instrument.bind({
    frame: $('frame'),
    size: $('save-size'),
    save: nativeHost ? null : $('save'),     // the native host shares the PNG instead
    fullWindow: $('view-window'),
    fullscreen: [$('view-fullscreen'), $('view-fullscreen-bar')],
    exit: $('view-exit'),
    panelToggle: $('panel-toggle')
  });

  /* ---- the native host seam ------------------------------------------------
     What a native host may do: read the complete maze as a saved-maze record,
     open a record as the current maze, export the PNG without a download,
     speak in the status line, and hear when the maze or how it looks
     changes. It never reaches the engine or the instrument itself. */

  function appearance() {
    return { frame: instrument.frame.id, ends: settings.ends, solution: settings.solution, label: settings.label };
  }
  /* A record opened as the current maze. Throws, leaving the current maze, if
     it does not rebuild. `undoable`: the maze it replaces can be brought back. */
  function openRecord(record, undoable) {
    var read = MazeEngine.readRecord(record);
    var before = appearance();
    var restoreWork = engine.adopt(read.work);
    var w = engine.work;
    settings.algorithm = w.algorithm;
    settings.topology = MazeEngine.supports(w.algorithm, w.requestedTopology) ? w.requestedTopology : 'rect';
    settings.density = w.density;
    settings.ends = read.appearance.ends;
    settings.solution = read.appearance.solution;
    settings.label = read.appearance.label;
    if (read.appearance.frame) instrument.setFrame(read.appearance.frame);
    if (undoable) {
      pushUndo(function () {
        restoreWork();
        settings.ends = before.ends; settings.solution = before.solution; settings.label = before.label;
        instrument.setFrame(before.frame);
      });
    }
    instrument.redraw();
    changed();
    kick();
    return read;
  }
  /* A record kept under undo instead of opened: the maze showing stays, and undo
     brings the record's maze back, with how it looked. It becomes the only undo step,
     since the steps before it belong to mazes it does not follow. Throws if it does
     not rebuild. */
  function offerRecord(record) {
    var read = MazeEngine.readRecord(record);
    undoStack = [];
    pushUndo(function () {
      engine.adopt(read.work);
      settings.ends = read.appearance.ends; settings.solution = read.appearance.solution; settings.label = read.appearance.label;
      if (read.appearance.frame) instrument.setFrame(read.appearance.frame);
    });
    syncControls();
    return read;
  }

  /* The first maze in the app. The host answers once, with the record it kept or
     none. It may answer late: the page shows after a second whether or not the
     host has answered, and makes its own first maze then (`fallback`), and the
     person may make or recolor a maze before the answer comes. A late record
     opens over the page's own maze, with undo, while that maze is showing with
     the colors it was made with. Otherwise the maze showing is one the person
     made or recolored: it stays, and the record goes under undo instead. */
  var answered = false;
  var pageWork = null, pageColors = '';     // the page's own first maze, as it was made
  var startTimer = 0;
  function firstAspect() { return aspectParam != null && aspectParam > 0 ? aspectParam : null; }
  function firstMaze() { makeNew(null, true, firstAspect()); }
  function fallback() {
    if (engine.work) return;
    firstMaze();
    pageWork = engine.work;
    pageColors = JSON.stringify(pageWork.colors);
  }
  function pageMazeShowing() { return !!pageWork && engine.work === pageWork && JSON.stringify(pageWork.colors) === pageColors; }
  function start(record) {
    if (answered) return null;
    answered = true;
    window.clearTimeout(startTimer);
    if (!engine.work) {
      if (record) {
        try { return { opened: true, read: openRecord(record, false) }; }
        catch (e) { firstMaze(); return { opened: false, error: e }; }
      }
      firstMaze();
      return { opened: false };
    }
    if (!record) return { opened: false };
    try {
      if (pageMazeShowing()) return { opened: true, late: true, read: openRecord(record, true) };
      return { opened: false, offered: true, read: offerRecord(record) };
    } catch (e) { return { opened: false, error: e }; }
  }

  if (nativeHost) {
    /* A host that never attaches or never starts still gets a maze. */
    startTimer = window.setTimeout(fallback, 2000);
    nativeHost.attach({
      start: start,
      fallback: fallback,
      record: function (meta) {
        var w = engine.work;
        return w && w.complete ? MazeEngine.toRecord(w, appearance(), meta) : null;
      },
      open: function (record) { return openRecord(record, true); },
      complete: function () { return !!(engine.work && engine.work.complete); },
      describe: function () { var w = engine.work; return w ? shortName(w.algorithm) + ' // ' + gridText(w) : ''; },
      exportPNG: function () { return instrument.exportPNG({ download: false, defer: true }); },
      say: say,
      on: function (fn) { hostListeners.push(fn); }
    });
  } else {
    /* The first maze, for the shape the URL names or else the frame the page opened with. */
    makeNew(null, true, firstAspect());
  }
  /* The label uses the design system's mono face; draw again once it has loaded. */
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(function () { instrument.redraw(); });

  /* Verification hook for browser checks. Not an API. */
  window.__maze = {
    engine: engine,
    instrument: instrument,
    setPlaying: setPlaying,
    get playing() { return playing; },
    get undoDepth() { return undoStack.length; },
    lastInfo: lastInfo,
    makeNew: makeNew
  };
})();
