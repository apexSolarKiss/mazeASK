/* =========================================================================
   maze-native.js // the iOS app's host: saved maze, recovery, PNG sharing

   PRODUCT CODE. It runs only inside the mazes-ASK iOS app, where Capacitor's
   bridge marks the page as native. On the web it returns at once and the page
   is unchanged. It registers a host before maze-app.js runs, loads the
   Capacitor core runtime from the app's own bundle, and then keeps:

     saved maze   one maze saved on purpose. Only saving again replaces it;
                  a new maze never does.
     recovery     the last complete maze and how it looked. It is written when
                  a maze completes or its look changes, and when the app goes
                  to the background, and opened when the app starts. A maze
                  still being built when the app was closed is not resumed,
                  and the app says so.
     share PNG    the PNG the page exports at the frame's size, handed to the
                  system share sheet: Save Image, Save to Files and the rest.

   Files live in the app's Library folder under mazes-ASK/. Each is written
   to a temporary copy and then renamed over the old file, so the temporary
   copy, when it is good, is never older than the file. A read takes the newer
   good copy and makes the file match it before anything can write again. A
   write is refused while a copy it would replace cannot be read, or while a
   good copy cannot be made the file; and a last maze this session never
   opened is set aside, not written over. See "files" below. It reaches the
   maze only through the seam maze-app.js hands it.
   ========================================================================= */
(function () {
  'use strict';

  var cap = window.Capacitor;
  if (!cap || typeof cap.isNativePlatform !== 'function' || !cap.isNativePlatform()) return;

  /* The app's layout additions (safe areas), after the page's own stylesheets. */
  var css = document.createElement('link');
  css.rel = 'stylesheet';
  css.href = 'app/maze-native.css';
  document.head.appendChild(css);

  /* On a cold launch the web view draws its first frame before it knows the safe areas, so the
     page would be drawn once under the status bar and then jump into place; and the first maze
     waits for the app's files, so the canvas and status line would fill in a frame later. The
     page's content stays hidden over the page field until both are ready: the safe areas known
     (any inset above zero, which every iPhone and iPad has while its status bar shows) and the
     first maze on the canvas. It is shown after one second at most, and if the app's files have
     not answered by then, the page makes its first maze at that moment, so that nothing on it acts
     on an empty canvas (maze-app.js `fallback` and `start` say what a later answer does). This
     script runs in the head so that the content is hidden from the first frame. */
  var root = document.documentElement;
  root.classList.add('maze-wait');
  /* Safari on iPhone offers no element fullscreen, so there the web page shows full window
     only. The app's web view on iPhone does offer it, and there it runs under the Dynamic
     Island; so on iPhone the app shows full window only, like the web page (maze-native.css). */
  if (/\biPhone\b/.test(navigator.userAgent)) root.classList.add('maze-phone');
  var gate = document.createElement('style');
  gate.textContent = 'html.maze-wait body > * { visibility: hidden; }';
  document.head.appendChild(gate);
  var probe = document.createElement('div');
  probe.setAttribute('aria-hidden', 'true');
  probe.style.cssText = 'position: fixed; top: 0; left: 0; width: 1px; visibility: hidden; pointer-events: none; ' +
    'height: calc(env(safe-area-inset-top) + env(safe-area-inset-right) + env(safe-area-inset-bottom) + env(safe-area-inset-left));';
  root.appendChild(probe);
  var waitingFor = { insets: true, maze: true };
  var watcher = null;
  var deadlinePassed = false;
  var gateTimer = setTimeout(deadline, 1000);
  function deadline() {
    deadlinePassed = true;
    if (app) app.fallback();
    release();
  }
  function release() {
    clearTimeout(gateTimer);
    if (watcher) watcher.disconnect();
    watcher = null;
    if (probe.parentNode) probe.parentNode.removeChild(probe);
    root.classList.remove('maze-wait');
  }
  function arrived(what) {
    waitingFor[what] = false;
    if (!waitingFor.insets && !waitingFor.maze) release();
  }
  function insetsKnown() { return probe.getBoundingClientRect().height > 0; }
  function insetsArrived() {
    if (watcher) watcher.disconnect();
    watcher = null;
    if (probe.parentNode) probe.parentNode.removeChild(probe);
    arrived('insets');
  }
  if (insetsKnown()) insetsArrived();
  else if (typeof ResizeObserver === 'function') {
    watcher = new ResizeObserver(function () { if (insetsKnown()) insetsArrived(); });
    watcher.observe(probe);
  }

  /* The strip behind the status bar needs the body, so it waits for it. */
  function addSafeTop() {
    var safeTop = document.createElement('div');
    safeTop.className = 'maze-safe-top';
    safeTop.setAttribute('aria-hidden', 'true');
    document.body.insertBefore(safeTop, document.body.firstChild);
  }
  if (document.body) addSafeTop();
  else document.addEventListener('DOMContentLoaded', addSafeTop);

  var DIR = 'LIBRARY';
  /* Each file: its path, its name in messages, how its text is checked, and where a refused copy
     is set aside. The building note holds no maze, so it is `disposable`: a copy of it that cannot
     be read may be written over or removed. When the start cannot read the note at all, it says a
     build may not have been resumed. Recovery's `seen`: the records this session opened, offered
     or wrote. */
  var SAVED = { path: 'mazes-ASK/saved-maze.json', name: 'the saved maze', check: checkRecord };
  var RECOVERY = { path: 'mazes-ASK/recovery.json', name: 'the last maze', check: checkRecord, refused: 'mazes-ASK/recovery-refused.json', seen: {} };
  var BUILDING = { path: 'mazes-ASK/building.json', name: 'the building note', check: checkMarker, disposable: true };
  var EXPORTS = 'mazes-ASK-exports/';           // in the cache folder, emptied before each share
  var CHECKPOINT_MS = 500;

  var app = null;                 // the seam from maze-app.js
  var fs = null, share = null, lifecycle = null;
  var build = null;               // the source commit bundle.json records
  var queue = Promise.resolve();  // file operations, one at a time
  var pending = null;             // a recovery record waiting to be written
  var pendingTimer = 0;
  var kept = '';                  // the check of the newest recovery record written, or being written
  var keptAt = '';                // when the newest recovery record queued or written was taken
  var markedAt = '';              // when the building marker on disk was written; '' when there is none
  var lastMs = 0;
  var saved = null;               // { at, label, held } of the saved maze, { error, held } if it cannot be opened, null if none;
                                  // held: why saving over it is refused, or ''
  var recoveryHeld = '';          // why mazes are not kept for next time, or ''
  var startNotice = '';           // what the start showed, while it reported recovery being held
  var saving = false;             // a save is being written
  var ready = false;
  var unavailable = '';           // why storage could not be opened, if it could not
  var sharing = false;
  var ui = {};

  function $(id) { return document.getElementById(id); }
  /* An ISO time, always later than the one before and than any time read from the files, so a
     marker and a record never tie, even if the clock has gone back since they were written. */
  function notBefore(iso) {
    var t = typeof iso === 'string' ? Date.parse(iso) : NaN;
    if (!isNaN(t) && t > lastMs) lastMs = t;
  }
  function now() {
    var t = Date.now();
    if (t <= lastMs) t = lastMs + 1;
    lastMs = t;
    return new Date(t).toISOString();
  }
  function serial(task) {
    var run = queue.then(task, task);
    queue = run.catch(function () {});
    return run;
  }
  function message(e) { return e && e.message ? e.message : String(e); }
  function sentence(text) { return text.charAt(0).toUpperCase() + text.slice(1); }
  function when(iso) {
    var d = new Date(iso);
    if (isNaN(d.getTime())) return 'earlier';
    return d.toLocaleString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' });
  }

  /* ---- files --------------------------------------------------------------
     Each file has a temporary copy, <file>.tmp. A write goes to the copy, which
     is then renamed over the file. The rename removes the old file before it
     moves the copy in, a write can stop part-way, and the app can stop between
     the two. So the copy, when it is good, is never older than the file: equal
     to it, or newer when a write was stopped before its rename. And:

       - a read takes the copy if it is good and differs from the file, and
         otherwise the file if it is good. Taking the copy writes it back over
         the file, and reads it back, before anything else can write.
       - a damaged file, or one that cannot be read at all, is set aside first
         if the file keeps refused copies (recovery does).
       - a copy that cannot be read at all, the file or its temporary copy, is
         unknown. Unless it was set aside, the file is held: writes to it are
         refused, whatever else is good, since a write replaces both copies. A
         damaged copy (read, but cut short or refused) is not unknown. The
         building note is the exception: it is disposable.
       - if the copy is good but cannot be made the file, the file is held too.
       - a hold lasts only while its cause does: every read and every write
         reads both copies again first.
       - a recovery record this session has not opened, offered or written is
         set aside before a write replaces it: it is a last maze that could not
         be read when the app started.
       - nothing counts as missing unless the file and its copy both are.

     File operations run one at a time, so no write can come between a read and
     its repair. */

  function readText(path) {
    return fs.readFile({ path: path, directory: DIR, encoding: 'utf8' }).then(function (r) { return r.data; });
  }
  function parse(text) {
    try { return JSON.parse(text); }
    catch (e) { throw new Error('the file is cut short or damaged'); }
  }
  function checkRecord(text) {
    var record = parse(text);
    return { record: record, read: MazeEngine.readRecord(record) };
  }
  function checkMarker(text) {
    var marker = parse(text);
    if (!marker || typeof marker !== 'object' || typeof marker.startedAt !== 'string' || isNaN(new Date(marker.startedAt).getTime())) {
      throw new Error('the note of a maze being built is damaged');
    }
    return { marker: marker };
  }
  function isMissing(e) { return /does not exist|not exist|no such file/i.test(message(e)); }
  /* One copy read and checked: good (with its text and checked value), missing, unreadable or damaged. */
  function inspect(file, path) {
    return readText(path).then(function (text) {
      try { return { state: 'good', text: text, value: file.check(text) }; }
      catch (e) { return { state: 'damaged', error: e }; }
    }, function (e) { return { state: isMissing(e) ? 'missing' : 'unreadable', error: e }; });
  }
  /* The copy written back over the file and read back. */
  function restore(file, twin) {
    return fs.writeFile({ path: file.path, data: twin.text, directory: DIR, encoding: 'utf8', recursive: true })
      .then(function () { return readText(file.path); })
      .then(function (back) { if (back !== twin.text) throw new Error('the copy did not read back the same'); });
  }
  /* An error that says why a file is held. */
  function holdError(text) { var e = new Error(text); e.hold = true; return e; }
  function fromCopy(file, twin, aside) {
    return restore(file, twin).then(function () { return { value: twin.value, from: 'copy', aside: aside }; },
      function (e) {
        var held = file.disposable ? null : holdError('the newest copy of ' + file.name + ' could not be written back (' + message(e) + '), so it is not written over');
        return { value: twin.value, from: 'copy', held: held, aside: aside };
      });
  }
  /* The file made safe, inside serial(). Returns { value, from, held, aside } with the good copy
     to use; { absent: true } when the file and its copy are both missing; otherwise
     { error, path, unreadable, held, aside } for the file that was refused. `held`, an error that
     says why: a write would replace a copy that could not be read, or the good copy could not be
     made the file, so writes to the file are refused. `aside`: { path, error } when a refused file
     was set aside, or failed to be. */
  function settle(file) {
    var tmp = file.path + '.tmp';
    return inspect(file, file.path).then(function (main) {
      return inspect(file, tmp).then(function (twin) {
        /* The unknown copies a write would replace: the file unless it was set aside, and the
           temporary copy, which a write is first written over. */
        function hold(fileStays) {
          if (file.disposable) return null;
          var why = [];
          if (fileStays) why.push(file.name + '’s file could not be read (' + message(main.error) + '), so it is not written over');
          if (twin.state === 'unreadable') {
            why.push((main.state === 'missing' ? 'the only copy of ' + file.name : 'a copy of ' + file.name + ' that may be newer')
              + ' could not be read (' + message(twin.error) + '), so it is not written over');
          }
          return why.length ? holdError(why.join('; ')) : null;
        }
        function held(result, h) { if (h) result.held = h; return result; }
        if (main.state === 'good') {
          if (twin.state === 'good' && twin.text !== main.text) return fromCopy(file, twin, null);
          return held({ value: main.value, from: 'file' }, hold(false));
        }
        var aside = Promise.resolve(null);
        if (file.refused && main.state !== 'missing') {
          aside = fs.rename({ from: file.path, to: file.refused, directory: DIR, toDirectory: DIR })
            .then(function () { return { path: file.path }; }, function (e) { return { path: file.path, error: e }; });
        }
        return aside.then(function (asideResult) {
          var h = hold(main.state === 'unreadable' && !(asideResult && !asideResult.error));
          if (twin.state === 'good') {
            if (h) return { value: twin.value, from: 'copy', aside: asideResult, held: h };
            return fromCopy(file, twin, asideResult);
          }
          if (main.state === 'missing' && twin.state === 'missing') return { absent: true };
          if (main.state !== 'missing') return held({ error: main.error, path: file.path, unreadable: main.state === 'unreadable', aside: asideResult }, h);
          return held({ error: twin.error, path: tmp, unreadable: twin.state === 'unreadable' }, h);
        });
      });
    });
  }
  /* A file whose state could not be worked out is held as well. */
  function load(file) {
    return serial(function () { return settle(file); }).catch(function (e) {
      return { error: e, path: file.path, held: file.disposable ? null : holdError(file.name + ' could not be checked (' + message(e) + '), so it is not written over') };
    });
  }
  /* Resolves { setAside } when a recovery record this session never had was set aside first. */
  function writeText(file, text) {
    return serial(function () {
      return settle(file).then(function (state) {
        if (state.held) throw state.held;
        var tmp = file.path + '.tmp';
        var first = Promise.resolve(false);
        if (file.seen && state.value && !file.seen[state.value.record.check]) {
          first = fs.rename({ from: file.path, to: file.refused, directory: DIR, toDirectory: DIR }).then(function () { return true; }, function (e) {
            throw holdError(file.name + ' could be read again but could not be set aside (' + message(e) + '), so it is not written over');
          });
        }
        return first.then(function (setAside) {
          return fs.writeFile({ path: tmp, data: text, directory: DIR, encoding: 'utf8', recursive: true })
            .then(function () { return fs.rename({ from: tmp, to: file.path, directory: DIR, toDirectory: DIR }); })
            .then(function () { return { setAside: setAside }; });
        });
      });
    });
  }
  /* Both copies; the temporary one first, so that a stop in between leaves the file as it was.
     Resolves true when neither remains. */
  function remove(file) {
    function gone(path) {
      return fs.deleteFile({ path: path, directory: DIR }).then(function () { return true; },
        function (e) { return isMissing(e); });
    }
    return serial(function () {
      return gone(file.path + '.tmp').then(function (a) { return gone(file.path).then(function (b) { return a && b; }); });
    });
  }

  /* ---- recovery ------------------------------------------------------------ */

  /* The current maze, if complete, as the next recovery record. `immediately`: write
     it at once (a maze just completed) instead of after a pause (its look
     changing, perhaps several times). */
  function queueCheckpoint(immediately) {
    if (!ready || !app.complete()) return;
    var record = app.record({ build: build, savedAt: now() });
    if (!record) return;
    if (record.check === kept) {
      /* Already kept, as after undoing a new maze: nothing to write, and no maze is being built. */
      pending = null;
      window.clearTimeout(pendingTimer);
      clearMarker();
      return;
    }
    pending = record;
    keptAt = record.savedAt;
    window.clearTimeout(pendingTimer);
    if (immediately) flushCheckpoint();
    else pendingTimer = window.setTimeout(flushCheckpoint, CHECKPOINT_MS);
  }
  function flushCheckpoint() {
    window.clearTimeout(pendingTimer);
    var record = pending;
    pending = null;
    if (!record) return Promise.resolve();
    kept = record.check;
    return writeText(RECOVERY, JSON.stringify(record)).then(function (done) {
      RECOVERY.seen[record.check] = true;
      var wasHeld = !!recoveryHeld;
      recoveryHeld = '';
      syncUI();
      /* Only a complete current maze ends a build; a newer maze may be building by now. */
      if (app.complete()) clearMarker();
      if (done && done.setAside) {
        app.say('kept this maze for next time // the earlier last maze was set aside, not reopened',
           'This maze is kept for next time. The last maze from before could be read again; it was set aside, not reopened.', 8000);
      } else if (wasHeld) {
        app.say('mazes are kept for next time again', 'Mazes are kept for next time again.', 4000);
      }
    }, function (e) {
      if (kept === record.check) kept = '';
      if (e && e.hold) { recoveryHeld = message(e); syncUI(); }
      /* A complete maze that could not be kept was not a build that stopped: its loss is said now,
         so the next start does not report it as unfinished. */
      if (app.complete()) clearMarker();
      /* While the start's own notice about this is showing, the same news does not replace it. */
      if (startNotice && message(e) === recoveryHeld && ($('status').textContent || '').indexOf(startNotice) === 0) return;
      app.say('could not keep this maze for next time // ' + message(e), 'Could not keep this maze for next time. ' + message(e) + '.', 6000);
    });
  }
  /* The building marker says: an unfinished maze is the current one, and no
     complete maze has been kept since it became current. It is written when an
     unfinished maze becomes current (a new maze, or undo back to one) with no
     marker newer than the last kept maze, and cleared only while the current
     maze is complete. */
  function syncMarker() {
    if (!ready || app.complete()) return;
    if (markedAt && markedAt > keptAt) return;
    var at = now();
    markedAt = at;
    /* A note that was not written is tried again at the next change. */
    writeText(BUILDING, JSON.stringify({ startedAt: at, maze: app.describe() })).catch(function () { if (markedAt === at) markedAt = ''; });
  }
  function clearMarker() {
    if (!markedAt) return;
    var at = markedAt;
    markedAt = '';
    /* A note that could not be removed is removed again at the next clear. */
    remove(BUILDING).then(function (done) { if (!done && !markedAt) markedAt = at; });
  }

  function onAppEvent(kind) {
    if (kind === 'new') {
      flushCheckpoint();               // the maze before this one, if its write was still waiting
      if (ui.confirm) ui.confirm.hidden = true;
    }
    queueCheckpoint(kind === 'complete' || kind === 'new');
    syncMarker();
    syncUI();
  }

  /* ---- the saved maze ------------------------------------------------------ */

  function setSaved(read, record, held) {
    saved = { at: record.savedAt || (read && read.savedAt) || now(), label: describeRecord(record), held: held ? message(held) : '' };
  }
  /* What a read of the saved maze found. */
  function noteSaved(result) {
    if (result.value) setSaved(result.value.read, result.value.record, result.held);
    else if (result.absent) saved = null;
    else if (result.error) saved = { error: message(result.error), held: result.held ? message(result.held) : '', unreadable: !!result.unreadable };
  }
  function describeRecord(record) {
    var r = record.maze.recipe, g = record.maze.geometry;
    var input = document.querySelector('input[name="algorithm"][value="' + r.algorithm + '"]');
    var name = input && input.nextElementSibling ? input.nextElementSibling.textContent : r.algorithm;
    var grid = document.querySelector('input[name="grid"][value="' + g.topology + '"]');
    var gridName = grid && grid.nextElementSibling ? grid.nextElementSibling.textContent : g.topology;
    return name + ' // ' + (g.topology === 'radial' ? g.rows + ' ' + gridName : g.cols + ' × ' + g.rows + ' ' + gridName);
  }
  /* The record is taken when the person asks. While it is written, saving is off, and a second
     request is ignored. */
  function saveMaze() {
    if (saving) return;
    var record = app.record({ build: build, savedAt: now() });
    if (!record) { syncUI(); return; }
    ui.confirm.hidden = true;
    saving = true;
    syncUI();
    writeText(SAVED, JSON.stringify(record)).then(function () {
      saving = false;
      setSaved(null, record);
      app.say('saved this maze', 'Saved this maze. Open saved maze brings it back.', 4000);
      syncUI();
    }, function (e) {
      /* A failed write may still have changed the files (a rename removes the old file first):
         read the saved maze again, and say what it now is. */
      load(SAVED).then(function (result) {
        saving = false;
        noteSaved(result);
        /* The same maze and the same save time: this very record reached the file. */
        if (result.value && result.value.record.check === record.check && result.value.record.savedAt === record.savedAt) {
          app.say('saved this maze', 'Saved this maze. Open saved maze brings it back.', 4000);
        } else {
          app.say('could not save the maze // ' + message(e), 'Could not save the maze. ' + message(e), 8000);
        }
        syncUI();
      });
    });
  }
  function askToSave() {
    if (saving || !app.complete()) return;
    /* Saving over a held file is refused. Read it again first: if its cause has passed, ask as
       usual, about what is there now; if not, say why, without writing. */
    if (saved && saved.held) {
      saving = true;
      syncUI();
      load(SAVED).then(function (result) {
        saving = false;
        noteSaved(result);
        syncUI();
        if (saved && saved.held) app.say('could not save the maze // ' + saved.held, 'Could not save the maze. ' + saved.held + '.', 8000);
        else askToSave();
      });
      return;
    }
    if (!saved) { saveMaze(); return; }
    ui.confirmText.textContent = saved.error ? 'This replaces the saved maze that could not be read.'
      : 'This replaces the maze saved ' + when(saved.at) + '.';
    ui.confirm.hidden = false;
    ui.replace.focus();
  }
  function openSaved() {
    load(SAVED).then(function (result) {
      if (result.absent) { saved = null; syncUI(); app.say('nothing is saved', 'Nothing is saved.', 3000); return; }
      if (result.error) {
        noteSaved(result);
        syncUI();
        var why = saved && saved.held && saved.unreadable ? saved.held : message(result.error);
        app.say('could not open the saved maze // ' + why, 'Could not open the saved maze. ' + why, 8000);
        return;
      }
      try { app.open(result.value.record); }
      catch (e) { app.say('could not open the saved maze // ' + message(e), 'Could not open the saved maze. ' + message(e), 8000); return; }
      setSaved(result.value.read, result.value.record, result.held);
      app.say('opened the saved maze // undo for 8 s', 'Opened the saved maze. Undo is available for 8 seconds.', 4000);
      syncUI();
    });
  }

  /* ---- share PNG ------------------------------------------------------------ */

  function base64(blob) {
    return new Promise(function (resolve, reject) {
      var reader = new FileReader();
      reader.onload = function () { var s = String(reader.result); resolve(s.slice(s.indexOf(',') + 1)); };
      reader.onerror = function () { reject(reader.error || new Error('could not read the image')); };
      reader.readAsDataURL(blob);
    });
  }
  function sharePNG() {
    if (sharing || !ready) return;
    sharing = true;
    ui.save.setAttribute('aria-busy', 'true');
    var stage = 'export';
    var size = '';
    app.exportPNG().then(function (result) {
      stage = 'file';
      size = result.width + ' × ' + result.height + ' px';
      return base64(result.blob).then(function (data) {
        return serial(function () {
          return fs.rmdir({ path: EXPORTS, directory: 'CACHE', recursive: true }).catch(function () {}).then(function () {
            return fs.writeFile({ path: EXPORTS + result.filename, data: data, directory: 'CACHE', recursive: true });
          });
        });
      });
    }).then(function (written) {
      stage = 'share';
      return share.share({ files: [written.uri] });
    }).then(function () {
      app.say('shared // ' + size, 'Shared the PNG, ' + size.replace(' × ', ' by ') + '.', 5000);
    }, function (e) {
      /* An export failure is already announced by the page. */
      if (stage === 'export') return;
      if (stage === 'share' && /cancel/i.test(message(e))) app.say('share canceled', 'Share canceled.', 3000);
      else app.say('could not share the PNG // ' + message(e), 'Could not share the PNG. ' + message(e), 8000);
    }).then(function () {
      sharing = false;
      ui.save.removeAttribute('aria-busy');
    });
  }

  /* ---- controls --------------------------------------------------------------
     The share button takes the page's save PNG button; the saved-maze controls
     join the panel after new colors, in the design system's own classes. */

  function element(tag, attrs, text) {
    var node = document.createElement(tag);
    for (var k in attrs) node.setAttribute(k, attrs[k]);
    if (text) node.textContent = text;
    return node;
  }
  function setupUI() {
    ui.save = $('save');
    ui.save.textContent = 'share PNG';
    ui.save.addEventListener('click', sharePNG);

    var field = element('fieldset', { class: 'inst-field', id: 'saved' });
    field.appendChild(element('legend', { class: 'caption' }, 'saved maze'));
    var row = element('div', { class: 'inst-row' });
    ui.keep = element('button', { type: 'button', class: 'surface-action surface-action--secondary', id: 'saved-save' }, 'save this maze');
    ui.open = element('button', { type: 'button', class: 'surface-action surface-action--secondary', id: 'saved-open' }, 'open saved maze');
    row.appendChild(ui.keep);
    row.appendChild(ui.open);
    field.appendChild(row);
    ui.note = element('p', { class: 'inst-note', id: 'saved-note' });
    field.appendChild(ui.note);
    ui.keepNote = element('p', { class: 'inst-note', id: 'keep-note' });
    ui.keepNote.hidden = true;
    field.appendChild(ui.keepNote);
    ui.confirm = element('div', { class: 'inst-note maze-advice', id: 'saved-confirm' });
    ui.confirm.hidden = true;
    ui.confirmText = element('span');
    ui.confirm.appendChild(ui.confirmText);
    var choices = element('div', { class: 'inst-row' });
    ui.replace = element('button', { type: 'button', class: 'surface-action' }, 'replace it');
    var cancel = element('button', { type: 'button', class: 'surface-action surface-action--secondary' }, 'keep it');
    choices.appendChild(ui.replace);
    choices.appendChild(cancel);
    ui.confirm.appendChild(choices);
    field.appendChild(ui.confirm);
    var after = $('recolor').parentNode;
    after.parentNode.insertBefore(field, after.nextSibling);

    ui.keep.addEventListener('click', askToSave);
    ui.open.addEventListener('click', openSaved);
    ui.replace.addEventListener('click', saveMaze);
    cancel.addEventListener('click', function () { ui.confirm.hidden = true; ui.keep.focus(); });
    syncUI();
  }
  function syncUI() {
    if (!ui.note) return;
    var complete = app.complete();
    ui.keep.disabled = !ready || !complete || saving;
    /* A saved maze that is held can be opened to read it again. */
    ui.open.disabled = !ready || !saved || (!!saved.error && !saved.held);
    ui.save.disabled = !ready;      // sharing writes the PNG through the app's storage
    var text;
    if (unavailable) text = 'Saving and sharing are unavailable: ' + unavailable + '.';
    else if (!ready) text = 'Opening the app’s storage. Saving and sharing start once it is open.';
    else if (!saved) text = 'Nothing saved yet. The app keeps one saved maze: its walls, its colors, its frame and what it shows. A new maze never replaces it.';
    else if (saved.error && saved.held) text = 'The saved maze could not be opened' + (saved.unreadable ? '' : ': ' + saved.error) + '. ' + sentence(saved.held) + '. Saving again is refused while that lasts; opening or saving reads it again first.';
    else if (saved.error) text = 'The saved maze could not be read: ' + saved.error + '. Saving again replaces it.';
    else if (saved.held) text = 'Saved ' + when(saved.at) + ': ' + saved.label + '. ' + sentence(saved.held) + '. Saving again is refused while that lasts; each save reads it again first.';
    else text = 'Saved ' + when(saved.at) + ': ' + saved.label + '. Saving again replaces it.';
    if (ready && !complete) text += ' A maze can be saved once it is complete.';
    if (ui.note.textContent !== text) ui.note.textContent = text;
    var keepText = recoveryHeld ? 'Mazes are not kept for next time: ' + recoveryHeld + '. Each new maze or change tries again.' : '';
    if (ui.keepNote.textContent !== keepText) ui.keepNote.textContent = keepText;
    ui.keepNote.hidden = !keepText;
  }

  /* ---- start ------------------------------------------------------------------ */

  function loadScript(src) {
    return new Promise(function (resolve, reject) {
      var s = document.createElement('script');
      s.src = src;
      s.onload = resolve;
      s.onerror = function () { reject(new Error('could not load ' + src)); };
      document.head.appendChild(s);
    });
  }

  /* The first maze, once the three files are read. Each file's result stands on its own: a
     damaged one is reported and never stops the others or the app's storage. */
  function begin(recovery, marker, savedFile) {
    ready = true;
    var record = recovery.value ? recovery.value.record : null;
    var startedAt = marker.value ? marker.value.marker.startedAt : null;
    var checkpointAt = record && typeof record.savedAt === 'string' ? record.savedAt : '';
    notBefore(startedAt);
    notBefore(checkpointAt);
    var interrupted = !!startedAt && startedAt > checkpointAt;
    var unsure = !!marker.error;     // a note exists but cannot be read: a build may have been stopped
    /* The old note goes before the first maze can write its own. */
    if (!marker.absent) remove(BUILDING);
    if (record) { kept = record.check; keptAt = record.savedAt || ''; }
    var result = app.start(record) || {};
    if (record && !result.opened && !result.offered) kept = '';
    if (record && (result.opened || result.offered)) RECOVERY.seen[record.check] = true;
    /* The record opened is the file's while a copy that may be newer could not be read. */
    var older = !!recovery.held && !!recovery.value && recovery.from === 'file';
    noteSaved(savedFile);

    /* What the person is told: whether a build was stopped, then what the first maze is. */
    var shown = [], spoken = [], long = false;
    if (interrupted) {
      shown.push('the maze being built was not resumed');
      spoken.push('The maze that was being built when the app closed was not resumed.');
      long = true;
    } else if (unsure) {
      shown.push('a maze being built may not have been resumed');
      spoken.push('The app could not tell whether a maze was being built when it closed. If one was, it was not resumed.');
      long = true;
    }
    var problem = recovery.error || result.error;
    if (problem) {
      var why = message(problem);
      if (recovery.aside && recovery.aside.error) why += '; it could not be set aside either';
      shown.push('could not reopen the last maze // ' + why);
      spoken.push('Could not reopen the last maze. ' + why + '. This is a new maze.');
      long = true;
    } else if (result.offered) {
      shown.push('kept the maze you made // undo for 8 s reopens the last one' + (older ? ' that could be read' : ''));
      spoken.push('Kept the maze you made. Undo, for 8 seconds, reopens the last ' + (interrupted ? 'complete ' : '') + 'maze' + (older ? ' that could be read' : '') + '.');
    } else if (result.opened) {
      var lastOne = older ? 'the last maze that could be read' : 'the last maze';
      shown.push(interrupted ? 'this is the last complete maze' + (older ? ' that could be read' : '') : 'reopened ' + lastOne + (result.late ? ' // undo for 8 s' : ''));
      spoken.push((interrupted ? 'This is the last complete maze' + (older ? ' that could be read.' : '.') : 'Reopened ' + lastOne + '.') + (result.late ? ' Undo is available for 8 seconds.' : ''));
    } else if (interrupted) {
      shown.push('new maze');
      spoken.push('There is no complete maze to reopen, so this is a new maze.');
    }
    if (recovery.aside && recovery.aside.error && !problem) {
      shown.push('a refused recovery file could not be set aside');
      spoken.push('A recovery file that could not be used could not be set aside either.');
      long = true;
    }
    /* A copy of the last maze that a new one would replace is unknown, or could not be written
       back: the line leads with what follows, which the note under saved maze keeps saying. */
    if (recovery.held) {
      recoveryHeld = message(recovery.held);
      shown.unshift('mazes are not kept for next time');
      spoken.push(sentence(recoveryHeld) + '. Mazes are not kept for next time while that lasts.');
      long = true;
    }
    if (shown.length) app.say(shown.join(' // '), spoken.join(' '), long ? 9000 : result.offered ? 6000 : 4000);
    startNotice = recovery.held ? shown.join(' // ') : '';
    /* Catch up on a maze the page made before storage was ready. */
    queueCheckpoint(true);
    syncMarker();
    syncUI();
    arrived('maze');
  }

  window.MazeNativeHost = {
    attach: function (seam) {
      app = seam;
      app.on(onAppEvent);
      setupUI();
      if (deadlinePassed) app.fallback();
      loadScript('native/capacitor.js').then(function () {
        var core = window.capacitorExports;
        fs = core.registerPlugin('Filesystem');
        share = core.registerPlugin('Share');
        lifecycle = core.registerPlugin('App');
        lifecycle.addListener('pause', function () { flushCheckpoint(); });
        lifecycle.addListener('appStateChange', function (state) { if (!state.isActive) flushCheckpoint(); });
        return fetch('bundle.json').then(function (r) { return r.json(); }).then(function (b) {
          build = b && b.source ? b.source.commit + (b.source.uncommittedChanges ? '+changes' : '') : null;
        }, function () { build = null; });
      }).then(function () {
        return Promise.all([load(RECOVERY), load(BUILDING), load(SAVED)]);
      }).then(function (r) {
        begin(r[0], r[1], r[2]);
      }).catch(function (e) {
        /* Without its storage the app is the web page: the maze works; saving and sharing do not. */
        unavailable = message(e);
        app.start(null);
        app.say('saving and sharing are unavailable // ' + message(e), 'Saving and sharing are unavailable. ' + message(e), 9000);
        syncUI();
        arrived('maze');
      });
      document.addEventListener('visibilitychange', function () { if (document.hidden) flushCheckpoint(); });
    }
  };
})();
