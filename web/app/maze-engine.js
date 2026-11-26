/* =========================================================================
   maze-engine.js // the maze: generation, solving and drawing. No DOM.

   PRODUCT CODE for mazeASK. Ported from `mazeASK.js` (apexSolarKiss/mazeASK
   at 3d06e9ce6408ece7064288b14412e0911f5dceb3, blob 54c1ce1d), the p5.js
   maze lab. The eight algorithms, the four grids, the colors and the drawing
   order are the sketch's. What changed, and why:

   - No p5. `random`, `floor` and the other helpers are local, and every
     random number comes from a seeded stream, so a maze can be named by its
     seed and drawn again.
   - One work, many drawings. A maze is generated for a frame shape and
     keeps that composition. Resizing, changing the view, switching the
     system's light or dark setting and saving all draw the same maze again;
     only `newMaze` makes another one.
   - One scale. The sketch scaled its unit square to the canvas on each axis
     separately, so cells took the window's proportions. Here a cell is
     square (or a true hexagon or triangle) at every size, and the grid is
     sized to fill the composition box instead.
   - Binary Tree repaired on two grids. On hexagons the last cell of every
     odd row had no wall it was allowed to open, which left the maze in
     separate pieces. On rings every cell of a ring could choose its
     clockwise neighbor and close a loop. Both now always make one maze.
   - Wilson repaired on every grid. It could stop one link short and leave
     the last few cells cut off from the rest.
   - The puzzle's two ends are found with two searches instead of one from
     every boundary cell: the same longest distance, much faster.
   - Puzzle ends and the solution path are worked out once, when the maze
     is complete, not while drawing.
   ========================================================================= */
(function (root) {
  'use strict';

  /* ---- fixed data -------------------------------------------------------- */

  var ALGORITHMS = [
    { id: 'recursiveBacktracker', label: 'Recursive Backtracker', key: '1',
      note: 'Walk until stuck, then walk backward until you find a place where you can choose a new path.' },
    { id: 'binaryTree', label: 'Binary Tree', key: '2',
      note: 'In each room, choose one of two favorite directions.' },
    { id: 'prim', label: 'Prim', key: '3',
      note: 'Grow the maze from the edge of the already-built part.' },
    { id: 'sidewinder', label: 'Sidewinder', key: '4',
      note: 'Make horizontal runs, and sometimes punch a hole upward.' },
    { id: 'eller', label: 'Eller', key: '5',
      note: 'Build one row at a time, but remember which rooms are already connected.' },
    { id: 'kruskal', label: 'Kruskal', key: '6',
      note: 'Look at possible walls and remove only the ones that join two different regions.' },
    { id: 'wilson', label: 'Wilson', key: '7',
      note: 'Take a wandering path, erase loops, then attach the clean path to the maze.' },
    { id: 'aldousBroder', label: 'Aldous-Broder', key: '8',
      note: 'Wander randomly forever, and only carve when you step into a room for the first time.' }
  ];

  var TOPOLOGIES = [
    { id: 'rect', label: 'squares' },
    { id: 'hex', label: 'hexagons' },
    { id: 'triangle', label: 'triangles' },
    { id: 'radial', label: 'rings' }
  ];

  /* The sketch's rule: Sidewinder and Eller build row by row on squares only. */
  var ROW_ALGORITHMS = { sidewinder: true, eller: true };
  function supports(algorithm, topology) {
    return topology === 'rect' || !ROW_ALGORITHMS[algorithm];
  }

  /* The sketch's palette, weights included. */
  var SWATCHES = [
    { name: 'lavenderASK',       rgb: [212, 198, 225], weight: 2 },
    { name: 'white',             rgb: [255, 255, 255], weight: 1 },
    { name: 'smokey lavender 1', rgb: [139, 121, 162], weight: 2 },
    { name: 'warm lavender 1',   rgb: [193, 154, 216], weight: 1 },
    { name: 'warm lavender 2',   rgb: [164, 146, 200], weight: 2 },
    { name: 'warm lavender 4',   rgb: [174, 135, 194], weight: 1 },
    { name: 'warm lavender 5',   rgb: [226, 211, 240], weight: 1 },
    { name: 'smokey plum 1',     rgb: [132, 80, 155],  weight: 1 },
    { name: 'smokey plum 2',     rgb: [114, 85, 131],  weight: 1 },
    { name: 'violet 1',          rgb: [190, 63, 246],  weight: 1 }
  ];
  var WEIGHTED = [];
  SWATCHES.forEach(function (s) { for (var i = 0; i < s.weight; i++) WEIGHTED.push(s.rgb); });
  var SOLUTION_RGB = [255, 0, 255];

  /* Composition, from the sketch's configureComposition(). A frame narrower
     than 1.15 : 1 is composed as "square"; wider is "wide". The box is the
     share of the frame the maze may fill; `cy` is where the maze's center
     sits, as a share of the frame's height. */
  var SQUARE_BELOW = 1.15;
  var BOX = {
    square: { w: 0.78, h: 0.78, cy: 0.5 },
    wide:   { w: 0.82, h: 0.62, cy: 0.515 }
  };
  /* Default density. Square compositions fix the columns and wide ones fix
     the rows, as the sketch's defaults did; the other count is worked out
     so the grid fills the box with true-shaped cells. Rings: rings / most
     cells per ring. */
  var BASE = {
    square: { rect: 36, rowwise: 34, hex: 20, triangle: 34, rings: 10, perRing: 96 },
    wide:   { rect: 24, rowwise: 24, hex: 16, triangle: 24, rings: 8,  perRing: 96 }
  };
  var STROKE = 0.0009;        // the sketch's strokeWeightBase, in shares of the frame's height
  var LABEL_SIZE = 0.018;     // the sketch's textSize, likewise
  var LABEL_FONT = '"JetBrains Mono", ui-monospace, "SF Mono", Menlo, monospace';
  var MIN_COUNT = 4;
  var MAX_COUNT = 200;

  var DEFAULTS = {
    algorithm: 'recursiveBacktracker',
    topology: 'rect',
    density: 1,               // multiplies the default counts; 0.5 to 2.5
    speed: 16,                // generation steps per 1/60 s, as the sketch's stepsPerFrame
    ends: false,
    solution: false,
    label: true
  };

  /* ---- small helpers ----------------------------------------------------- */

  function mulberry32(seed) {
    var a = seed >>> 0;
    return function () {
      a = (a + 0x6D2B79F5) >>> 0;
      var t = a;
      t = Math.imul(t ^ (t >>> 15), t | 1);
      t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  function clampCount(n) { return Math.max(MIN_COUNT, Math.min(MAX_COUNT, Math.round(n))); }

  function lerpRGB(a, b, t) {
    return [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t];
  }
  function rgba(c, alpha255) {
    return 'rgba(' + Math.round(c[0]) + ',' + Math.round(c[1]) + ',' + Math.round(c[2]) + ',' +
      (Math.round(alpha255) / 255).toFixed(4) + ')';
  }
  function hex(c) {
    var s = '#';
    for (var i = 0; i < 3; i++) { var h = Math.round(c[i]).toString(16).toUpperCase(); s += h.length < 2 ? '0' + h : h; }
    return s;
  }
  function distance(a, b) {
    var dr = a[0] - b[0], dg = a[1] - b[1], db = a[2] - b[2];
    return Math.sqrt(dr * dr + dg * dg + db * db);
  }

  /* The sketch's renderColorsASK(), on a seeded stream. */
  function pickColors(rand) {
    function pick(list) { return list[Math.floor(rand() * list.length)]; }
    function pickValid(isValid, score) {
      var valid = WEIGHTED.filter(isValid);
      if (valid.length) return pick(valid);
      if (!score) return pick(WEIGHTED);
      var best = -Infinity, ties = [];
      WEIGHTED.forEach(function (c) {
        var s = score(c);
        if (s > best) { best = s; ties = [c]; } else if (s === best) ties.push(c);
      });
      return pick(ties);
    }
    var background = pickValid(function (c) { return !(c[0] === 190 && c[1] === 63 && c[2] === 246); });
    var c4 = pickValid(function (c) { return distance(background, c) >= 95; }, function (c) { return distance(background, c); });
    var c1 = pickValid(function (c) { return distance(background, c) >= 52; }, function (c) { return distance(background, c); });
    var c2 = pick(WEIGHTED);
    var c3 = pick(WEIGHTED);
    return { background: background, c1: c1, c2: c2, c3: c3, c4: c4 };
  }

  /* ---- one maze ------------------------------------------------------------
     A work holds everything needed to finish and draw one maze. The body is
     the sketch's code with its globals turned into this closure's variables. */

  function makeWork(spec) {
    var rand = mulberry32(spec.seed);
    var algorithm = spec.algorithm;
    var topologyMode = supports(spec.algorithm, spec.topology) ? spec.topology : 'rect';
    var compositionAspect = spec.aspect;
    var composition = compositionAspect < SQUARE_BELOW ? 'square' : 'wide';
    var box = BOX[composition];
    var mazeWidthNorm = box.w * compositionAspect;
    var mazeHeightNorm = box.h;
    var colors = spec.colors;
    /* spec.legacyBinaryTree, spec.legacyWilson (tests only): the sketch's unrepaired rules, to show the repairs matter. */

    /* p5 stand-ins on this maze's stream. */
    function random(a) {
      if (a === undefined) return rand();
      if (Array.isArray(a)) return a[Math.floor(rand() * a.length)];
      return rand() * a;
    }
    var floor = Math.floor, min = Math.min, max = Math.max, sqrt = Math.sqrt, abs = Math.abs;
    var cos = Math.cos, sin = Math.sin, ceil = Math.ceil;
    var PI = Math.PI, TWO_PI = Math.PI * 2, HALF_PI = Math.PI / 2;
    function lerp(a, b, t) { return a + (b - a) * t; }
    function constrain(v, lo, hi) { return v < lo ? lo : (v > hi ? hi : v); }

    /* ---- grid size for this composition and density ---------------------- */
    var base = BASE[composition];
    var d = spec.density;
    var mazeCols, mazeRows;
    var SQ3 = Math.sqrt(3);
    if (topologyMode === 'radial') {
      mazeRows = clampCount(base.rings * d);       // rings
      mazeCols = base.perRing;                     // most cells in one ring
    } else if (composition === 'wide') {
      if (topologyMode === 'hex') {
        mazeRows = clampCount(base.hex * d);
        var r = mazeHeightNorm / (mazeRows * 1.5 + 0.5);
        mazeCols = clampCount(floor(mazeWidthNorm / (SQ3 * r) - 0.5));
      } else if (topologyMode === 'triangle') {
        mazeRows = clampCount(base.triangle * d);
        var s = mazeHeightNorm / (mazeRows * SQ3 * 0.5);
        mazeCols = clampCount(floor(2 * mazeWidthNorm / s - 1));
      } else {
        mazeRows = clampCount((ROW_ALGORITHMS[algorithm] ? base.rowwise : base.rect) * d);
        mazeCols = clampCount(floor(mazeWidthNorm / (mazeHeightNorm / mazeRows)));
      }
    } else {
      if (topologyMode === 'hex') {
        mazeCols = clampCount(base.hex * d);
        var r2 = mazeWidthNorm / (SQ3 * (mazeCols + 0.5));
        mazeRows = clampCount(floor((mazeHeightNorm / r2 - 0.5) / 1.5));
      } else if (topologyMode === 'triangle') {
        mazeCols = clampCount(base.triangle * d);
        var s2 = 2 * mazeWidthNorm / (mazeCols + 1);
        mazeRows = clampCount(floor(mazeHeightNorm / (s2 * SQ3 * 0.5)));
      } else {
        mazeCols = clampCount((ROW_ALGORITHMS[algorithm] ? base.rowwise : base.rect) * d);
        mazeRows = clampCount(floor(mazeHeightNorm / (mazeWidthNorm / mazeCols)));
      }
    }
    /* Triangles: an even column count puts a downward triangle at the end
       of every row, which Binary Tree needs to reach the row above. */
    if (topologyMode === 'triangle' && mazeCols % 2 === 1) mazeCols -= 1;

    function isSquareComposition() { return composition === 'square'; }

    var cellSize = 0.02;
    var mazeOriginX = 0;
    var mazeOriginY = 0;

    var mazeASK = [];
    var links = new Set();
    var topology = null;
    var currentCell = null;
    var stack = [];
    var frontier = [];
    var mazeComplete = false;
    var sidewinderRow = 0, sidewinderCol = 0, sidewinderRun = [];
    var visitOrderCounter = 0, visitedCount = 0;
    var ellerCurrentRow = 0, ellerSets = [], ellerNextSetId = 1, ellerPrepared = false;
    var kruskalWalls = [], kruskalParent = {}, kruskalRank = {}, kruskalStepIndex = 0;
    var wilsonWalk = [], wilsonWalkIndexByKey = {}, wilsonMode = 'idle', wilsonCarveIndex = 0;
    var aldousCurrent = null;
    var puzzleStartCell = null, puzzleFinishCell = null, puzzleSolutionPath = [];
    var steps = 0;
    var cellCount = 0;

    function makeCell(col, row) {
      return { col: col, row: row, visited: false, frontier: false, depth: -1, visitOrder: -1 };
    }

    /* ---- MAZE HELPERS (sketch) ------------------------------------------- */

    function markVisited(cell, depth) {
      if (!cell.visited) {
        cell.visited = true;
        cell.depth = depth;
        cell.visitOrder = visitOrderCounter;
        visitOrderCounter++;
        visitedCount++;
      }
    }
    function addFrontierNeighbors(cell) {
      var neighbors = getNeighborCells(cell);
      for (var i = 0; i < neighbors.length; i++) {
        var n = neighbors[i];
        if (!n.visited && !n.frontier) { n.frontier = true; frontier.push(n); }
      }
    }
    /* Neighbor lists never change for a maze, so each cell keeps its own,
       built once (the sketch rebuilt them on every call). Callers never
       modify the returned list. */
    function getNeighborCells(cell) { return cell.nb || topology.getNeighbors(cell); }
    function getTopologyCells() { return topology.getCells(); }
    function getBoundaryCells() { return topology.getBoundaryCells(); }
    function getBinaryTreeCandidates(cell) { return topology.getBinaryTreeCandidates(cell); }
    function getKruskalEdges() {
      var edges = [];
      var cells = getTopologyCells();
      for (var i = 0; i < cells.length; i++) edges.push.apply(edges, topology.getKruskalEdges(cells[i]));
      return edges;
    }
    function getVisitedNeighbors(cell) { return getNeighborCells(cell).filter(function (n) { return n.visited; }); }
    function minVisitedNeighborDepth(neighbors) {
      var m = Infinity;
      for (var i = 0; i < neighbors.length; i++) m = min(m, neighbors[i].depth);
      return m === Infinity ? 0 : m;
    }
    function getCell(col, row) {
      if (col < 0 || col >= mazeCols || row < 0 || row >= mazeRows) return null;
      return mazeASK[row][col];
    }
    function cellKey(cell) { return cell.col + ',' + cell.row; }
    function makeLinkKey(a, b) {
      var ka = cellKey(a), kb = cellKey(b);
      return ka < kb ? ka + '|' + kb : kb + '|' + ka;
    }
    function areAdjacentCells(a, b) { return !!a && !!b && getNeighborCells(a).indexOf(b) >= 0; }
    function linkCells(a, b) {
      if (!areAdjacentCells(a, b)) return;
      links.add(makeLinkKey(a, b));
      a.lk.add(b);
      b.lk.add(a);
    }
    function areCellsLinked(a, b) { return !!a && !!b && !!a.lk && a.lk.has(b); }
    function removeWalls(a, b) { linkCells(a, b); }
    function getRandomUnvisitedCell() {
      var options = [];
      var cells = getTopologyCells();
      for (var i = 0; i < cells.length; i++) if (!cells[i].visited) options.push(cells[i]);
      return options.length > 0 ? random(options) : null;
    }
    function getTopologyFirstCell() { var c = getTopologyCells(); return c.length > 0 ? c[0] : null; }
    function getTopologyMiddleCell() { var c = getTopologyCells(); return c.length > 0 ? c[floor(c.length / 2)] : null; }
    function getLinkedNeighbors(cell) { return getNeighborCells(cell).filter(function (n) { return areCellsLinked(cell, n); }); }
    function shuffleArray(array) {
      for (var i = array.length - 1; i > 0; i--) {
        var j = floor(random(i + 1));
        var t = array[i]; array[i] = array[j]; array[j] = t;
      }
    }

    /* ---- TOPOLOGIES (sketch) --------------------------------------------- */

    function makeRectTopology() {
      var cells = [].concat.apply([], mazeASK);
      cellSize = min(mazeWidthNorm / mazeCols, mazeHeightNorm / mazeRows);
      var mazeWidth = mazeCols * cellSize;
      var mazeHeight = mazeRows * cellSize;
      mazeOriginX = -mazeWidth * 0.5;
      mazeOriginY = isSquareComposition() ? -mazeHeight * 0.5 : -mazeHeight * 0.42;
      var api = {
        mode: 'rect',
        getNeighborCell: function (cell, direction) {
          if (!cell) return null;
          if (direction === 'top') return getCell(cell.col, cell.row - 1);
          if (direction === 'right') return getCell(cell.col + 1, cell.row);
          if (direction === 'bottom') return getCell(cell.col, cell.row + 1);
          if (direction === 'left') return getCell(cell.col - 1, cell.row);
          return null;
        },
        getRectNeighbors: function (cell) {
          return { top: api.getNeighborCell(cell, 'top'), right: api.getNeighborCell(cell, 'right'),
            bottom: api.getNeighborCell(cell, 'bottom'), left: api.getNeighborCell(cell, 'left') };
        },
        getNeighbors: function (cell) {
          if (!cell) return [];
          var n = api.getRectNeighbors(cell);
          return [n.top, n.right, n.bottom, n.left].filter(Boolean);
        },
        getCells: function () { return cells; },
        getBoundaryCells: function () {
          return cells.filter(function (c) { return c.row === 0 || c.col === 0 || c.row === mazeRows - 1 || c.col === mazeCols - 1; });
        },
        getBinaryTreeCandidates: function (cell) { var n = api.getRectNeighbors(cell); return [n.top, n.right]; },
        getKruskalEdges: function (cell) {
          var n = api.getRectNeighbors(cell), edges = [];
          if (n.right) edges.push({ cellA: cell, cellB: n.right });
          if (n.bottom) edges.push({ cellA: cell, cellB: n.bottom });
          return edges;
        },
        areAdjacentCells: function (a, b) { if (!a || !b) return false; return api.getNeighbors(a).indexOf(b) >= 0; },
        getCellCenter: function (cell) {
          return { x: mazeOriginX + cell.col * cellSize + cellSize * 0.5, y: mazeOriginY + cell.row * cellSize + cellSize * 0.5 };
        },
        getCellPolygon: function (cell, inset) {
          inset = inset || 0;
          var x = mazeOriginX + cell.col * cellSize + inset;
          var y = mazeOriginY + cell.row * cellSize + inset;
          var size = max(0, cellSize - inset * 2);
          return [{ x: x, y: y }, { x: x + size, y: y }, { x: x + size, y: y + size }, { x: x, y: y + size }];
        },
        getCellEdgeSegments: function (cell) {
          var x = mazeOriginX + cell.col * cellSize, y = mazeOriginY + cell.row * cellSize;
          var n = api.getRectNeighbors(cell);
          return [
            { neighbor: n.top, ax: x, ay: y, bx: x + cellSize, by: y },
            { neighbor: n.right, ax: x + cellSize, ay: y, bx: x + cellSize, by: y + cellSize },
            { neighbor: n.bottom, ax: x, ay: y + cellSize, bx: x + cellSize, by: y + cellSize },
            { neighbor: n.left, ax: x, ay: y, bx: x, by: y + cellSize }
          ];
        },
        getBorderSegments: function () {
          var x0 = mazeOriginX, y0 = mazeOriginY, x1 = mazeOriginX + mazeWidth, y1 = mazeOriginY + mazeHeight;
          return [
            { ax: x0, ay: y0, bx: x1, by: y0 }, { ax: x1, ay: y0, bx: x1, by: y1 },
            { ax: x1, ay: y1, bx: x0, by: y1 }, { ax: x0, ay: y1, bx: x0, by: y0 }
          ];
        }
      };
      return api;
    }

    function makeHexTopology() {
      var cells = [].concat.apply([], mazeASK);
      var sqrtThree = sqrt(3);
      var hexRadius = min(mazeWidthNorm / (sqrtThree * (mazeCols + 0.5)), mazeHeightNorm / (mazeRows * 1.5 + 0.5));
      var hexWidth = sqrtThree * hexRadius;
      var mazeWidth = hexWidth * (mazeCols + 0.5);
      var mazeHeight = hexRadius * (mazeRows * 1.5 + 0.5);
      cellSize = hexRadius;
      mazeOriginX = -mazeWidth * 0.5;
      mazeOriginY = isSquareComposition() ? -mazeHeight * 0.5 : -mazeHeight * 0.42;

      function getOffsetNeighbors(cell) {
        var o = cell.row % 2 === 0 ? 0 : 1;
        return {
          topRight: getCell(cell.col + o, cell.row - 1),
          right: getCell(cell.col + 1, cell.row),
          bottomRight: getCell(cell.col + o, cell.row + 1),
          bottomLeft: getCell(cell.col - 1 + o, cell.row + 1),
          left: getCell(cell.col - 1, cell.row),
          topLeft: getCell(cell.col - 1 + o, cell.row - 1)
        };
      }
      function getHexCenter(cell) {
        return {
          x: mazeOriginX + hexWidth * (cell.col + 0.5 * (cell.row % 2)) + hexWidth * 0.5,
          y: mazeOriginY + cell.row * hexRadius * 1.5 + hexRadius
        };
      }
      function getHexPolygon(cell, inset) {
        inset = inset || 0;
        var c = getHexCenter(cell);
        var radius = max(0, hexRadius - inset);
        var hw = sqrtThree * 0.5 * radius;
        return [
          { x: c.x, y: c.y - radius }, { x: c.x + hw, y: c.y - radius * 0.5 }, { x: c.x + hw, y: c.y + radius * 0.5 },
          { x: c.x, y: c.y + radius }, { x: c.x - hw, y: c.y + radius * 0.5 }, { x: c.x - hw, y: c.y - radius * 0.5 }
        ];
      }
      var api = {
        mode: 'hex',
        getNeighborCell: function (cell, direction) { if (!cell) return null; return getOffsetNeighbors(cell)[direction] || null; },
        getNeighbors: function (cell) {
          if (!cell) return [];
          var n = getOffsetNeighbors(cell);
          return [n.topRight, n.right, n.bottomRight, n.bottomLeft, n.left, n.topLeft].filter(Boolean);
        },
        getCells: function () { return cells; },
        getBoundaryCells: function () {
          return cells.filter(function (c) { return api.getCellEdgeSegments(c).some(function (e) { return !e.neighbor; }); });
        },
        /* Sketch: top-right or right. REPAIR: the last cell of an odd row has
           neither, so it takes top-left. Every cell but the top row's last
           then opens a wall upward or rightward, which makes one tree. */
        getBinaryTreeCandidates: function (cell) {
          if (!cell) return [];
          var n = getOffsetNeighbors(cell);
          if (!spec.legacyBinaryTree && !n.topRight && !n.right && n.topLeft) return [n.topLeft];
          return [n.topRight, n.right];
        },
        getKruskalEdges: function (cell) {
          if (!cell) return [];
          var n = getOffsetNeighbors(cell), edges = [];
          if (n.right) edges.push({ cellA: cell, cellB: n.right });
          if (n.bottomRight) edges.push({ cellA: cell, cellB: n.bottomRight });
          if (n.bottomLeft) edges.push({ cellA: cell, cellB: n.bottomLeft });
          return edges;
        },
        areAdjacentCells: function (a, b) { if (!a || !b) return false; return api.getNeighbors(a).indexOf(b) >= 0; },
        getCellCenter: getHexCenter,
        getCellPolygon: getHexPolygon,
        getCellEdgeSegments: function (cell) {
          var p = getHexPolygon(cell), n = getOffsetNeighbors(cell);
          var order = [n.topRight, n.right, n.bottomRight, n.bottomLeft, n.left, n.topLeft];
          var out = [];
          for (var i = 0; i < 6; i++) {
            var a = p[i], b = p[(i + 1) % 6];
            out.push({ neighbor: order[i], ax: a.x, ay: a.y, bx: b.x, by: b.y });
          }
          return out;
        },
        getBorderSegments: function () {
          var out = [];
          for (var i = 0; i < cells.length; i++) {
            var segs = api.getCellEdgeSegments(cells[i]);
            for (var j = 0; j < segs.length; j++) if (!segs[j].neighbor) out.push(segs[j]);
          }
          return out;
        }
      };
      return api;
    }

    function makeRadialTopology() {
      var ringCount = mazeRows;
      var maxCellsPerRing = mazeCols;
      var cells = [];
      var radius = min(mazeWidthNorm, mazeHeightNorm) * 0.5;
      var ringThickness = radius / max(1, ringCount);
      var center = { x: 0, y: 0 };
      mazeOriginX = -radius;
      mazeOriginY = -radius;
      cellSize = ringThickness;

      var counts = [];
      for (var ring = 0; ring < ringCount; ring++) {
        if (ring === 0) { counts.push(1); continue; }
        if (ring === 1) { counts.push(min(maxCellsPerRing, 6)); continue; }
        var previous = counts[ring - 1];
        var arcLength = TWO_PI * (ring + 0.5) / previous;
        counts.push(arcLength > 1.8 && previous * 2 <= maxCellsPerRing ? previous * 2 : previous);
      }
      var rings = [];
      for (var rr = 0; rr < ringCount; rr++) {
        var ringCells = [];
        for (var index = 0; index < counts[rr]; index++) {
          var cell = mazeASK[rr][index];
          cell.ring = rr;
          cell.indexInRing = index;
          cell.ringCellCount = counts[rr];
          ringCells.push(cell);
          cells.push(cell);
        }
        rings.push(ringCells);
      }

      function getRingCell(ring, index) {
        if (ring < 0 || ring >= rings.length) return null;
        var rc = rings[ring];
        if (rc.length === 0) return null;
        return rc[((index % rc.length) + rc.length) % rc.length];
      }
      function getCellAngles(cell, inset) {
        inset = inset || 0;
        var count = max(1, cell.ringCellCount);
        var startAngle = -HALF_PI + TWO_PI * (cell.indexInRing / count);
        var endAngle = -HALF_PI + TWO_PI * ((cell.indexInRing + 1) / count);
        if (inset <= 0 || cell.ring === 0) return { startAngle: startAngle, endAngle: endAngle };
        var midRadius = (cell.ring + 0.5) * ringThickness;
        var angleInset = min((endAngle - startAngle) * 0.25, inset / max(midRadius, 0.0001));
        return { startAngle: startAngle + angleInset, endAngle: endAngle - angleInset };
      }
      function getArcPoints(r, a0, a1) {
        var n = max(2, ceil(abs(a1 - a0) / (PI / 18)) + 1);
        var pts = [];
        for (var i = 0; i < n; i++) {
          var a = lerp(a0, a1, i / (n - 1));
          pts.push({ x: center.x + cos(a) * r, y: center.y + sin(a) * r });
        }
        return pts;
      }
      function getRadialLinePoints(r0, r1, a) {
        return [{ x: center.x + cos(a) * r0, y: center.y + sin(a) * r0 }, { x: center.x + cos(a) * r1, y: center.y + sin(a) * r1 }];
      }
      function segmentsFromPoints(points, neighbor) {
        var segs = [];
        for (var i = 0; i < points.length - 1; i++) {
          segs.push({ neighbor: neighbor, ax: points[i].x, ay: points[i].y, bx: points[i + 1].x, by: points[i + 1].y });
        }
        return segs;
      }
      function getInwardNeighbor(cell) {
        if (!cell || cell.ring === 0) return null;
        var inner = rings[cell.ring - 1];
        var ratio = cell.ringCellCount / inner.length;
        return inner[floor(cell.indexInRing / ratio)] || null;
      }
      function getOutwardNeighbors(cell) {
        if (!cell || cell.ring >= rings.length - 1) return [];
        var outer = rings[cell.ring + 1];
        var ratio = outer.length / cell.ringCellCount;
        var out = [];
        for (var i = floor(cell.indexInRing * ratio); i < floor((cell.indexInRing + 1) * ratio); i++) if (outer[i]) out.push(outer[i]);
        return out;
      }
      function getRingNeighbors(cell) {
        if (!cell || cell.ringCellCount <= 1) return { clockwise: null, counterClockwise: null };
        return { clockwise: getRingCell(cell.ring, cell.indexInRing + 1), counterClockwise: getRingCell(cell.ring, cell.indexInRing - 1) };
      }
      function getRadialPolygon(cell, inset) {
        inset = inset || 0;
        if (!cell) return [];
        var outerRadius = max(0, (cell.ring + 1) * ringThickness - inset);
        if (cell.ring === 0) return getArcPoints(outerRadius, -HALF_PI, 1.5 * PI).slice(0, -1);
        var innerRadius = max(0, cell.ring * ringThickness + inset);
        var a = getCellAngles(cell, inset);
        return getArcPoints(outerRadius, a.startAngle, a.endAngle).concat(getArcPoints(innerRadius, a.endAngle, a.startAngle));
      }
      function getRadialEdgeSegments(cell) {
        if (!cell) return [];
        var innerRadius = cell.ring * ringThickness, outerRadius = (cell.ring + 1) * ringThickness;
        var a = getCellAngles(cell, 0);
        var rn = getRingNeighbors(cell), inward = getInwardNeighbor(cell), outward = getOutwardNeighbors(cell);
        var segs = [];
        if (cell.ringCellCount > 1) segs.push.apply(segs, segmentsFromPoints(getRadialLinePoints(innerRadius, outerRadius, a.endAngle), rn.clockwise));
        if (cell.ring > 0) segs.push.apply(segs, segmentsFromPoints(getArcPoints(innerRadius, a.startAngle, a.endAngle), inward));
        if (outward.length === 0) {
          segs.push.apply(segs, segmentsFromPoints(getArcPoints(outerRadius, a.startAngle, a.endAngle), null));
        } else {
          for (var i = 0; i < outward.length; i++) {
            var s0 = lerp(a.startAngle, a.endAngle, i / outward.length), s1 = lerp(a.startAngle, a.endAngle, (i + 1) / outward.length);
            segs.push.apply(segs, segmentsFromPoints(getArcPoints(outerRadius, s0, s1), outward[i]));
          }
        }
        return segs;
      }
      var api = {
        mode: 'radial',
        getNeighbors: function (cell) {
          if (!cell) return [];
          var rn = getRingNeighbors(cell);
          return [getInwardNeighbor(cell)].concat(getOutwardNeighbors(cell), [rn.clockwise, rn.counterClockwise]).filter(Boolean);
        },
        getCells: function () { return cells; },
        getBoundaryCells: function () { return rings.length > 0 ? rings[rings.length - 1].slice() : cells.slice(); },
        /* Sketch: inward or clockwise. REPAIR: the last cell of each ring may
           not choose clockwise, since that wraps to the ring's first cell and
           a whole ring choosing clockwise closed a loop cut off from the
           center. Every other choice moves inward or forward round the ring,
           which makes one tree. */
        getBinaryTreeCandidates: function (cell) {
          if (!cell) return [];
          var forward = spec.legacyBinaryTree || cell.indexInRing < cell.ringCellCount - 1 ? getRingNeighbors(cell).clockwise : null;
          return [getInwardNeighbor(cell), forward];
        },
        getKruskalEdges: function (cell) {
          if (!cell) return [];
          var edges = [], rn = getRingNeighbors(cell);
          if (rn.clockwise) edges.push({ cellA: cell, cellB: rn.clockwise });
          var out = getOutwardNeighbors(cell);
          for (var i = 0; i < out.length; i++) edges.push({ cellA: cell, cellB: out[i] });
          return edges;
        },
        areAdjacentCells: function (a, b) { if (!a || !b) return false; return api.getNeighbors(a).indexOf(b) >= 0; },
        getCellCenter: function (cell) {
          if (!cell || cell.ring === 0) return center;
          var a = getCellAngles(cell, 0), mid = (a.startAngle + a.endAngle) * 0.5, r = (cell.ring + 0.5) * ringThickness;
          return { x: center.x + cos(mid) * r, y: center.y + sin(mid) * r };
        },
        getCellPolygon: getRadialPolygon,
        getCellEdgeSegments: getRadialEdgeSegments,
        getBorderSegments: function () {
          var out = [];
          for (var i = 0; i < cells.length; i++) {
            var segs = getRadialEdgeSegments(cells[i]);
            for (var j = 0; j < segs.length; j++) if (!segs[j].neighbor) out.push(segs[j]);
          }
          return out;
        }
      };
      return api;
    }

    function makeTriangleTopology() {
      var cells = [].concat.apply([], mazeASK);
      var sqrtThree = sqrt(3);
      var hf = sqrtThree * 0.5;
      var triangleSide = min((mazeWidthNorm * 2) / (mazeCols + 1), mazeHeightNorm / (mazeRows * hf));
      var triangleHeight = triangleSide * hf;
      var mazeWidth = triangleSide * (mazeCols + 1) * 0.5;
      var mazeHeight = triangleHeight * mazeRows;
      cellSize = triangleSide;
      mazeOriginX = -mazeWidth * 0.5;
      mazeOriginY = isSquareComposition() ? -mazeHeight * 0.5 : -mazeHeight * 0.42;

      function isUp(cell) { return (cell.col + cell.row) % 2 === 0; }
      function nbrs(cell) {
        var up = isUp(cell);
        var vertical = up ? getCell(cell.col, cell.row + 1) : getCell(cell.col, cell.row - 1);
        return { top: up ? null : vertical, right: getCell(cell.col + 1, cell.row), bottom: up ? vertical : null,
          left: getCell(cell.col - 1, cell.row), vertical: vertical };
      }
      function midX(cell) { return mazeOriginX + triangleSide * (cell.col + 1) * 0.5; }
      function topY(cell) { return mazeOriginY + cell.row * triangleHeight; }
      function centerOf(cell) { return { x: midX(cell), y: topY(cell) + triangleHeight * (isUp(cell) ? 2 / 3 : 1 / 3) }; }
      function polygon(cell, inset) {
        inset = inset || 0;
        var mx = midX(cell), ty = topY(cell);
        var pts = isUp(cell)
          ? [{ x: mx, y: ty }, { x: mx + triangleSide * 0.5, y: ty + triangleHeight }, { x: mx - triangleSide * 0.5, y: ty + triangleHeight }]
          : [{ x: mx - triangleSide * 0.5, y: ty }, { x: mx + triangleSide * 0.5, y: ty }, { x: mx, y: ty + triangleHeight }];
        if (inset <= 0) return pts;
        var c = centerOf(cell);
        return pts.map(function (p) {
          var dx = p.x - c.x, dy = p.y - c.y, dist = sqrt(dx * dx + dy * dy);
          if (dist === 0) return p;
          var k = max(0, (dist - inset) / dist);
          return { x: c.x + dx * k, y: c.y + dy * k };
        });
      }
      var api = {
        mode: 'triangle',
        getNeighbors: function (cell) { if (!cell) return []; var n = nbrs(cell); return [n.left, n.right, n.vertical].filter(Boolean); },
        getCells: function () { return cells; },
        getBoundaryCells: function () {
          return cells.filter(function (c) { return api.getCellEdgeSegments(c).some(function (e) { return !e.neighbor; }); });
        },
        getBinaryTreeCandidates: function (cell) {
          if (!cell) return [];
          var n = nbrs(cell);
          var horizontal = cell.row % 2 === 0 ? n.right : n.left;
          var vertical = isUp(cell) ? null : n.top;
          return [vertical, horizontal];
        },
        getKruskalEdges: function (cell) {
          if (!cell) return [];
          var n = nbrs(cell), edges = [];
          if (n.right) edges.push({ cellA: cell, cellB: n.right });
          if (n.vertical) edges.push({ cellA: cell, cellB: n.vertical });
          return edges;
        },
        areAdjacentCells: function (a, b) { if (!a || !b) return false; return api.getNeighbors(a).indexOf(b) >= 0; },
        getCellCenter: centerOf,
        getCellPolygon: polygon,
        getCellEdgeSegments: function (cell) {
          var p = polygon(cell), n = nbrs(cell);
          if (isUp(cell)) {
            return [
              { neighbor: n.right, ax: p[0].x, ay: p[0].y, bx: p[1].x, by: p[1].y },
              { neighbor: n.bottom, ax: p[1].x, ay: p[1].y, bx: p[2].x, by: p[2].y },
              { neighbor: n.left, ax: p[2].x, ay: p[2].y, bx: p[0].x, by: p[0].y }
            ];
          }
          return [
            { neighbor: n.left, ax: p[0].x, ay: p[0].y, bx: p[2].x, by: p[2].y },
            { neighbor: n.right, ax: p[2].x, ay: p[2].y, bx: p[1].x, by: p[1].y },
            { neighbor: n.top, ax: p[1].x, ay: p[1].y, bx: p[0].x, by: p[0].y }
          ];
        },
        getBorderSegments: function () {
          var out = [];
          for (var i = 0; i < cells.length; i++) {
            var segs = api.getCellEdgeSegments(cells[i]);
            for (var j = 0; j < segs.length; j++) if (!segs[j].neighbor) out.push(segs[j]);
          }
          return out;
        }
      };
      return api;
    }

    /* ---- ALGORITHMS (sketch) --------------------------------------------- */

    function setupAlgorithm() {
      if (algorithm === 'recursiveBacktracker') {
        currentCell = getTopologyFirstCell();
        markVisited(currentCell, 0);
      } else if (algorithm === 'prim') {
        currentCell = topologyMode === 'radial' ? getTopologyFirstCell() : getTopologyMiddleCell();
        markVisited(currentCell, 0);
        addFrontierNeighbors(currentCell);
      } else if (algorithm === 'eller') {
        ellerCurrentRow = 0; ellerNextSetId = 1; ellerPrepared = false;
        ellerSets = new Array(mazeCols).fill(0);
      } else if (algorithm === 'kruskal') {
        kruskalParent = {}; kruskalRank = {};
        var cells = getTopologyCells();
        for (var i = 0; i < cells.length; i++) { var id = cellKey(cells[i]); kruskalParent[id] = id; kruskalRank[id] = 0; }
        kruskalWalls = getKruskalEdges();
        shuffleArray(kruskalWalls);
        kruskalStepIndex = 0;
        currentCell = getTopologyFirstCell();
      } else if (algorithm === 'wilson') {
        var seedCell = getTopologyFirstCell();
        markVisited(seedCell, 0);
        currentCell = seedCell;
        wilsonMode = 'chooseStart';
      } else if (algorithm === 'aldousBroder') {
        aldousCurrent = getTopologyFirstCell();
        currentCell = aldousCurrent;
        markVisited(aldousCurrent, 0);
      }
    }

    function stepRecursiveBacktracker() {
      var neighbors = getNeighborCells(currentCell).filter(function (n) { return !n.visited; });
      if (neighbors.length > 0) {
        var next = random(neighbors);
        stack.push(currentCell);
        linkCells(currentCell, next);
        markVisited(next, stack.length);
        currentCell = next;
        return;
      }
      if (stack.length > 0) { currentCell = stack.pop(); return; }
      mazeComplete = true;
    }

    function runBinaryTree() {
      var cells = getTopologyCells();
      for (var i = 0; i < cells.length; i++) {
        var cell = cells[i];
        markVisited(cell, i);
        var neighbors = getBinaryTreeCandidates(cell).filter(Boolean);
        if (neighbors.length > 0) removeWalls(cell, random(neighbors));
      }
    }

    function stepPrim() {
      if (frontier.length === 0) { mazeComplete = true; return; }
      var cell = frontier.splice(floor(random(frontier.length)), 1)[0];
      cell.frontier = false;
      var visitedNeighbors = getVisitedNeighbors(cell);
      if (visitedNeighbors.length > 0) removeWalls(cell, random(visitedNeighbors));
      var depth = visitedNeighbors.length > 0 ? minVisitedNeighborDepth(visitedNeighbors) + 1 : 0;
      markVisited(cell, depth);
      currentCell = cell;
      addFrontierNeighbors(cell);
    }

    function stepSidewinder() {
      if (sidewinderRow >= mazeRows) { mazeComplete = true; return; }
      var cell = mazeASK[sidewinderRow][sidewinderCol];
      markVisited(cell, sidewinderRow);
      currentCell = cell;
      sidewinderRun.push(cell);
      var atEast = sidewinderCol === mazeCols - 1;
      var atNorth = sidewinderRow === 0;
      var carveNorth = atEast || (!atNorth && random() < 0.33);
      if (carveNorth) {
        if (!atNorth) {
          var member = random(sidewinderRun);
          var north = getCell(member.col, member.row - 1);
          if (north) removeWalls(member, north);
        }
        sidewinderRun = [];
      } else {
        var east = getCell(sidewinderCol + 1, sidewinderRow);
        if (east) removeWalls(cell, east);
      }
      sidewinderCol++;
      if (sidewinderCol >= mazeCols) { sidewinderCol = 0; sidewinderRow++; sidewinderRun = []; }
    }

    function groupColumnsBySet(setArray) {
      var groups = {}, order = [];
      for (var col = 0; col < setArray.length; col++) {
        var id = setArray[col];
        if (!groups[id]) { groups[id] = []; order.push(id); }
        groups[id].push(col);
      }
      /* The sketch iterated `for (setId in groups)`, which visits integer
         keys in ascending order; keep that order so a seed means the same. */
      order.sort(function (a, b) { return a - b; });
      return { groups: groups, order: order };
    }
    function markEntireRowVisited(row, depth) { for (var col = 0; col < mazeCols; col++) markVisited(mazeASK[row][col], depth); }
    function mergeSets(oldSet, newSet) { for (var i = 0; i < mazeCols; i++) if (ellerSets[i] === oldSet) ellerSets[i] = newSet; }
    function prepareEllerRow(row) {
      for (var col = 0; col < mazeCols; col++) if (ellerSets[col] === 0) ellerSets[col] = ellerNextSetId++;
      for (var c = 0; c < mazeCols - 1; c++) {
        if (ellerSets[c] === ellerSets[c + 1]) continue;
        var shouldJoin = row === mazeRows - 1 || random() < 0.5;
        if (shouldJoin) {
          removeWalls(mazeASK[row][c], mazeASK[row][c + 1]);
          mergeSets(ellerSets[c + 1], ellerSets[c]);
        }
      }
    }
    function finishLastEllerRow(row) {
      for (var col = 0; col < mazeCols; col++) if (ellerSets[col] === 0) ellerSets[col] = ellerNextSetId++;
      for (var c = 0; c < mazeCols - 1; c++) {
        if (ellerSets[c] !== ellerSets[c + 1]) {
          removeWalls(mazeASK[row][c], mazeASK[row][c + 1]);
          mergeSets(ellerSets[c + 1], ellerSets[c]);
        }
      }
    }
    function stepEller() {
      if (ellerCurrentRow >= mazeRows) { mazeComplete = true; return; }
      if (!ellerPrepared) {
        prepareEllerRow(ellerCurrentRow);
        currentCell = mazeASK[ellerCurrentRow][0];
        ellerPrepared = true;
        return;
      }
      var row = ellerCurrentRow;
      if (row === mazeRows - 1) {
        finishLastEllerRow(row);
        markEntireRowVisited(row, row);
        currentCell = mazeASK[row][mazeCols - 1];
        ellerCurrentRow++;
        mazeComplete = true;
        return;
      }
      var nextRowSets = new Array(mazeCols).fill(0);
      var g = groupColumnsBySet(ellerSets);
      for (var k = 0; k < g.order.length; k++) {
        var setId = g.order[k];
        var colsInSet = g.groups[setId].slice();
        shuffleArray(colsInSet);
        var required = 1 + floor(random(colsInSet.length));
        for (var i = 0; i < required; i++) {
          var col = colsInSet[i];
          var down = getCell(col, row + 1);
          if (down) { removeWalls(mazeASK[row][col], down); nextRowSets[col] = setId; }
        }
      }
      markEntireRowVisited(row, row);
      currentCell = mazeASK[row][mazeCols - 1];
      ellerSets = nextRowSets;
      ellerCurrentRow++;
      ellerPrepared = false;
    }

    function kruskalFind(id) {
      while (kruskalParent[id] !== id) {
        kruskalParent[id] = kruskalParent[kruskalParent[id]];
        id = kruskalParent[id];
      }
      return id;
    }
    function kruskalUnion(a, b) {
      var ra = kruskalFind(a), rb = kruskalFind(b);
      if (ra === rb) return;
      if (kruskalRank[ra] < kruskalRank[rb]) kruskalParent[ra] = rb;
      else if (kruskalRank[ra] > kruskalRank[rb]) kruskalParent[rb] = ra;
      else { kruskalParent[rb] = ra; kruskalRank[ra]++; }
    }
    function markAllCellsVisited() { var c = getTopologyCells(); for (var i = 0; i < c.length; i++) markVisited(c[i], i); }
    function stepKruskal() {
      if (kruskalStepIndex >= kruskalWalls.length) { markAllCellsVisited(); mazeComplete = true; return; }
      var wall = kruskalWalls[kruskalStepIndex++];
      var ra = kruskalFind(cellKey(wall.cellA)), rb = kruskalFind(cellKey(wall.cellB));
      currentCell = wall.cellA;
      if (ra !== rb) {
        removeWalls(wall.cellA, wall.cellB);
        kruskalUnion(ra, rb);
        var depth = floor(kruskalStepIndex / max(1, mazeCols));
        markVisited(wall.cellA, depth);
        markVisited(wall.cellB, depth);
        currentCell = wall.cellB;
      }
    }

    /* REPAIR: the sketch stopped as soon as every cell was marked visited.
       Carving marks a cell one step before it carves that cell's link onward,
       so when the last walk added two or more new cells the maze stopped one
       link short and left them cut off. A walk being carved now finishes. */
    function stepWilson() {
      if ((spec.legacyWilson || wilsonMode !== 'carve') && visitedCount >= cellCount) { mazeComplete = true; return; }
      if (wilsonMode === 'chooseStart') {
        var start = getRandomUnvisitedCell();
        if (!start) { mazeComplete = true; return; }
        wilsonWalk = [start];
        wilsonWalkIndexByKey = {};
        wilsonWalkIndexByKey[cellKey(start)] = 0;
        wilsonCarveIndex = 0;
        currentCell = start;
        wilsonMode = 'walk';
        return;
      }
      if (wilsonMode === 'walk') {
        var tail = wilsonWalk[wilsonWalk.length - 1];
        var next = random(getNeighborCells(tail));
        currentCell = next;
        if (next.visited) { wilsonWalk.push(next); wilsonMode = 'carve'; wilsonCarveIndex = 0; return; }
        var key = cellKey(next);
        if (Object.prototype.hasOwnProperty.call(wilsonWalkIndexByKey, key)) {
          wilsonWalk = wilsonWalk.slice(0, wilsonWalkIndexByKey[key] + 1);
          wilsonWalkIndexByKey = {};
          for (var i = 0; i < wilsonWalk.length; i++) wilsonWalkIndexByKey[cellKey(wilsonWalk[i])] = i;
          currentCell = wilsonWalk[wilsonWalk.length - 1];
          return;
        }
        wilsonWalk.push(next);
        wilsonWalkIndexByKey[key] = wilsonWalk.length - 1;
        return;
      }
      if (wilsonMode === 'carve') {
        if (wilsonCarveIndex >= wilsonWalk.length - 1) {
          wilsonWalk = []; wilsonWalkIndexByKey = {}; wilsonMode = 'chooseStart';
          return;
        }
        var a = wilsonWalk[wilsonCarveIndex], b = wilsonWalk[wilsonCarveIndex + 1];
        removeWalls(a, b);
        markVisited(a, wilsonCarveIndex);
        markVisited(b, wilsonCarveIndex + 1);
        currentCell = b;
        wilsonCarveIndex++;
      }
    }

    function stepAldousBroder() {
      if (visitedCount >= cellCount) { mazeComplete = true; return; }
      var next = random(getNeighborCells(aldousCurrent));
      if (!next.visited) { removeWalls(aldousCurrent, next); markVisited(next, visitedCount); }
      aldousCurrent = next;
      currentCell = next;
    }

    /* ---- PUZZLE (sketch), worked out once on completion ------------------ */

    function getMazeDistanceMap(startCell) {
      var dist = {}, queue = [startCell], qi = 0;
      dist[cellKey(startCell)] = 0;
      while (qi < queue.length) {
        var cell = queue[qi++], depth = dist[cellKey(cell)];
        var ln = getLinkedNeighbors(cell);
        for (var i = 0; i < ln.length; i++) {
          var k = cellKey(ln[i]);
          if (Object.prototype.hasOwnProperty.call(dist, k)) continue;
          dist[k] = depth + 1;
          queue.push(ln[i]);
        }
      }
      return dist;
    }
    /* The sketch's goal: the two boundary cells farthest apart along the
       maze. It searched from every boundary cell. A finished maze is a tree,
       and in a tree two searches find a farthest pair: from any boundary
       cell to the farthest boundary cell A, then from A to the farthest
       boundary cell B. Same longest distance; ties may pick another pair. */
    function farthestBoundary(from, boundary) {
      var dist = getMazeDistanceMap(from), best = from, bestD = -1;
      for (var i = 0; i < boundary.length; i++) {
        var dd = dist[cellKey(boundary[i])];
        if (dd !== undefined && dd > bestD) { bestD = dd; best = boundary[i]; }
      }
      return best;
    }
    function choosePuzzleEndpoints() {
      var boundary = getBoundaryCells().filter(Boolean);
      if (boundary.length === 0) { var all = getTopologyCells(); return { start: all[0] || null, finish: all[all.length - 1] || null }; }
      if (boundary.length === 1) return { start: boundary[0], finish: boundary[0] };
      var a = farthestBoundary(boundary[0], boundary);
      var b = farthestBoundary(a, boundary);
      return a.id <= b.id ? { start: a, finish: b } : { start: b, finish: a };
    }
    function getMazePath(startCell, finishCell) {
      if (!startCell || !finishCell) return [];
      if (startCell === finishCell) return [startCell];
      var queue = [startCell], qi = 0, parent = {};
      parent[cellKey(startCell)] = null;
      while (qi < queue.length) {
        var cell = queue[qi++];
        if (cell === finishCell) break;
        var ln = getLinkedNeighbors(cell);
        for (var i = 0; i < ln.length; i++) {
          var k = cellKey(ln[i]);
          if (Object.prototype.hasOwnProperty.call(parent, k)) continue;
          parent[k] = cell;
          queue.push(ln[i]);
        }
      }
      if (!Object.prototype.hasOwnProperty.call(parent, cellKey(finishCell))) return [];
      var path = [], cur = finishCell;
      while (cur) { path.push(cur); cur = parent[cellKey(cur)]; }
      return path.reverse();
    }
    function completeNow() {
      mazeComplete = true;
      var ends = choosePuzzleEndpoints();
      puzzleStartCell = ends.start;
      puzzleFinishCell = ends.finish;
      puzzleSolutionPath = getMazePath(puzzleStartCell, puzzleFinishCell);
    }

    /* ---- build ------------------------------------------------------------ */

    for (var row = 0; row < mazeRows; row++) {
      var rowCells = [];
      for (var col = 0; col < mazeCols; col++) rowCells.push(makeCell(col, row));
      mazeASK.push(rowCells);
    }
    topology = topologyMode === 'hex' ? makeHexTopology()
      : topologyMode === 'radial' ? makeRadialTopology()
      : topologyMode === 'triangle' ? makeTriangleTopology()
      : makeRectTopology();
    (function index() {
      var all = getTopologyCells();
      for (var i = 0; i < all.length; i++) { all[i].id = i; all[i].lk = new Set(); }
      for (var j = 0; j < all.length; j++) all[j].nb = topology.getNeighbors(all[j]);
    })();
    cellCount = getTopologyCells().length;
    if (spec.graph) adoptGraph(spec.graph); else setupAlgorithm();

    /* ---- a saved graph ------------------------------------------------------
       A complete maze is fully described, for drawing, by its canonical carved
       links and the order its cells were reached (the visited fields' colors
       follow that order). `graph()` reads them; `spec.graph` rebuilds a
       complete maze from them on this grid instead of generating one, and
       throws if they do not fit it. */
    function readGraph() {
      if (!mazeComplete) return null;
      var cells = getTopologyCells();
      var order = new Array(cells.length);
      for (var i = 0; i < cells.length; i++) order[i] = cells[i].visitOrder;
      return { links: sortedLinks(), visitOrder: order, steps: steps };
    }
    function adoptGraph(graph) {
      var cells = getTopologyCells();
      if (!graph || !Array.isArray(graph.links) || !Array.isArray(graph.visitOrder)) throw new Error('the saved maze has no graph');
      if (graph.visitOrder.length !== cells.length) {
        throw new Error('the saved maze has ' + graph.visitOrder.length + ' cells; this grid has ' + cells.length);
      }
      var byKey = {};
      for (var i = 0; i < cells.length; i++) byKey[cellKey(cells[i])] = cells[i];
      for (var j = 0; j < graph.links.length; j++) {
        var key = graph.links[j];
        var ends = typeof key === 'string' ? key.split('|') : [];
        var a = ends.length === 2 ? byKey[ends[0]] : null;
        var b = ends.length === 2 ? byKey[ends[1]] : null;
        if (!a || !b || !areAdjacentCells(a, b) || makeLinkKey(a, b) !== key || links.has(key)) {
          throw new Error('the saved maze has a link that does not join two neighboring cells once: ' + String(key));
        }
        linkCells(a, b);
      }
      var seen = new Array(cells.length);
      for (var k = 0; k < cells.length; k++) {
        var v = graph.visitOrder[k];
        if (typeof v !== 'number' || v !== Math.floor(v) || v < 0 || v >= cells.length || seen[v]) {
          throw new Error('the saved maze does not reach each cell once');
        }
        seen[v] = true;
        cells[k].visited = true;
        cells[k].visitOrder = v;
      }
      visitOrderCounter = cells.length;
      visitedCount = cells.length;
      steps = typeof graph.steps === 'number' && graph.steps >= 0 ? Math.floor(graph.steps) : 0;
      if (!verify().perfect) throw new Error('the saved links do not make one perfect maze');
      completeNow();
    }

    /* One generation step, as the sketch's updateMaze() ran them. Binary Tree
       finishes in one pass. Returns true while there is more to do. */
    function step() {
      if (mazeComplete) return false;
      steps++;
      if (algorithm === 'binaryTree') runBinaryTree();
      else if (algorithm === 'recursiveBacktracker') stepRecursiveBacktracker();
      else if (algorithm === 'prim') stepPrim();
      else if (algorithm === 'sidewinder') stepSidewinder();
      else if (algorithm === 'eller') stepEller();
      else if (algorithm === 'kruskal') stepKruskal();
      else if (algorithm === 'wilson') stepWilson();
      else if (algorithm === 'aldousBroder') stepAldousBroder();
      if (algorithm === 'binaryTree') mazeComplete = true;
      if (mazeComplete) { completeNow(); return false; }
      return true;
    }

    /* ---- DRAWING ------------------------------------------------------------
       Maze units: the composition box's frame is `compositionAspect` wide and
       1 high, with the maze's center at (0, 0) placed at the sketch's center.
       That frame is fitted whole into the target with one scale factor; the
       ground fills the rest. */

    function placement(width, height) {
      var s = Math.min(width / compositionAspect, height);
      var x0 = (width - compositionAspect * s) / 2 + compositionAspect * s * 0.5;
      var y0 = (height - s) / 2 + box.cy * s;
      return { s: s, x0: x0, y0: y0 };
    }

    function render(ctx, width, height, opts) {
      opts = opts || {};
      var p = placement(width, height);
      var s = p.s;
      function X(x) { return p.x0 + x * s; }
      function Y(y) { return p.y0 + y * s; }
      function poly(points) {
        ctx.beginPath();
        for (var i = 0; i < points.length; i++) {
          if (i === 0) ctx.moveTo(X(points[i].x), Y(points[i].y));
          else ctx.lineTo(X(points[i].x), Y(points[i].y));
        }
        ctx.closePath();
      }
      function segment(seg) { ctx.moveTo(X(seg.ax), Y(seg.ay)); ctx.lineTo(X(seg.bx), Y(seg.by)); }

      ctx.fillStyle = rgba(colors.background, 255);
      ctx.fillRect(0, 0, width, height);
      ctx.lineCap = 'round';
      ctx.lineJoin = 'miter';

      var cells = getTopologyCells();
      var i, j, cell;

      /* visited fields */
      var fieldAlpha = mazeComplete ? 34 : 20;
      for (i = 0; i < cells.length; i++) {
        cell = cells[i];
        if (!cell.visited) continue;
        var t = cell.visitOrder <= 0 ? 0 : cell.visitOrder / max(1, visitOrderCounter - 1);
        ctx.fillStyle = rgba(lerpRGB(colors.c2, colors.c3, t), fieldAlpha);
        poly(topology.getCellPolygon(cell));
        ctx.fill();
      }

      /* walls: each cell draws its own unopened edges in its own color */
      ctx.lineWidth = STROKE * s;
      for (i = 0; i < cells.length; i++) {
        cell = cells[i];
        var nx = mazeCols <= 1 ? 0.5 : cell.col / (mazeCols - 1);
        var ny = mazeRows <= 1 ? 0.5 : cell.row / (mazeRows - 1);
        var mix = constrain((abs(nx - 0.5) * 2 + abs(ny - 0.5) * 2) * 0.35, 0, 1);
        ctx.strokeStyle = rgba(lerpRGB(colors.c1, colors.c4, mix), 255);
        var segs = topology.getCellEdgeSegments(cell);
        ctx.beginPath();
        var any = false;
        for (j = 0; j < segs.length; j++) {
          if (!segs[j].neighbor || !areCellsLinked(cell, segs[j].neighbor)) { segment(segs[j]); any = true; }
        }
        if (any) ctx.stroke();
      }

      /* Wilson's walk in progress */
      if (algorithm === 'wilson' && (wilsonMode === 'walk' || wilsonMode === 'carve') && wilsonWalk.length >= 2 && !mazeComplete) {
        ctx.strokeStyle = rgba(colors.c4, 80);
        ctx.lineWidth = STROKE * 2 * s;
        ctx.beginPath();
        for (i = 0; i < wilsonWalk.length - 1; i++) {
          var ca = topology.getCellCenter(wilsonWalk[i]), cb = topology.getCellCenter(wilsonWalk[i + 1]);
          ctx.moveTo(X(ca.x), Y(ca.y)); ctx.lineTo(X(cb.x), Y(cb.y));
        }
        ctx.stroke();
      }

      /* the current cell while building */
      if (currentCell && !mazeComplete) {
        ctx.fillStyle = rgba(colors.c4, 120);
        poly(topology.getCellPolygon(currentCell, cellSize * 0.12));
        ctx.fill();
      }

      /* border */
      ctx.strokeStyle = rgba(colors.c4, 90);
      ctx.lineWidth = STROKE * 2 * s;
      var border = topology.getBorderSegments();
      ctx.beginPath();
      for (i = 0; i < border.length; i++) segment(border[i]);
      ctx.stroke();

      /* solution */
      if (opts.solution && mazeComplete && puzzleSolutionPath.length >= 2) {
        ctx.strokeStyle = rgba(SOLUTION_RGB, 255);
        ctx.lineWidth = STROKE * 3 * s;
        ctx.lineJoin = 'round';
        ctx.beginPath();
        for (i = 0; i < puzzleSolutionPath.length; i++) {
          var cc = topology.getCellCenter(puzzleSolutionPath[i]);
          if (i === 0) ctx.moveTo(X(cc.x), Y(cc.y)); else ctx.lineTo(X(cc.x), Y(cc.y));
        }
        ctx.stroke();
        ctx.lineJoin = 'miter';
      }

      /* start and finish */
      if (opts.ends && mazeComplete && puzzleStartCell && puzzleFinishCell) {
        ctx.fillStyle = rgba(colors.c4, 200);
        poly(topology.getCellPolygon(puzzleStartCell, cellSize * 0.3));
        ctx.fill();
        ctx.strokeStyle = rgba(colors.c1, 220);
        ctx.lineWidth = STROKE * 2.4 * s;
        poly(topology.getCellPolygon(puzzleFinishCell, cellSize * 0.22));
        ctx.stroke();
      }

      /* label */
      if (opts.label) {
        ctx.fillStyle = rgba(colors.c1, 160);
        ctx.font = (LABEL_SIZE * s).toFixed(3) + 'px ' + LABEL_FONT;
        ctx.textAlign = 'left';
        ctx.textBaseline = 'top';
        ctx.fillText(labelText(), X(mazeOriginX), Y(mazeOriginY - 0.04));
      }
    }

    function algorithmLabel() {
      for (var i = 0; i < ALGORITHMS.length; i++) if (ALGORITHMS[i].id === algorithm) return ALGORITHMS[i].label;
      return algorithm;
    }
    function labelText() {
      return algorithmLabel() + '  //  ' + topologyMode + '  //  ' +
        (topologyMode === 'radial' ? mazeRows + ' rings' : mazeCols + 'x' + mazeRows);
    }

    /* ---- reading the work (tests, status) ---------------------------------- */

    function sortedLinks() { return Array.from(links).sort(); }
    function verify() {
      var cells = getTopologyCells();
      if (!cells.length) return { cells: 0, links: 0, reached: 0, perfect: false };
      var seen = {}, queue = [cells[0]], qi = 0;
      seen[cellKey(cells[0])] = true;
      while (qi < queue.length) {
        var ln = getLinkedNeighbors(queue[qi++]);
        for (var i = 0; i < ln.length; i++) {
          var k = cellKey(ln[i]);
          if (!seen[k]) { seen[k] = true; queue.push(ln[i]); }
        }
      }
      return { cells: cells.length, links: links.size, reached: queue.length,
        perfect: queue.length === cells.length && links.size === cells.length - 1 };
    }

    return {
      seed: spec.seed,
      colorSeed: spec.colorSeed,
      algorithm: algorithm,
      topology: topologyMode,
      requestedTopology: spec.topology,
      density: d,
      composition: composition,
      compositionAspect: compositionAspect,
      cols: mazeCols,
      rows: mazeRows,
      get cellCount() { return cellCount; },
      get visited() { return visitedCount; },
      get links() { return links.size; },
      get complete() { return mazeComplete; },
      get steps() { return steps; },
      get solutionLength() { return puzzleSolutionPath.length; },
      get colors() { return colors; },
      set colors(c) { colors = c; },
      label: labelText,
      step: step,
      render: render,
      sortedLinks: sortedLinks,
      verify: verify,
      /* Tests only: the cells, read-only by agreement. */
      cells: function () { return getTopologyCells(); },
      /* The complete maze's links and visit order (null while it is built). */
      graph: readGraph,
      restored: !!spec.graph
    };
  }

  /* ---- the engine: the current maze, settings, seeds ---------------------- */

  function create(options) {
    options = options || {};
    var settings = JSON.parse(JSON.stringify(DEFAULTS));
    var master = mulberry32(options.seed == null ? (Math.random() * 4294967296) >>> 0 : options.seed >>> 0);
    var firstSeed = options.seed == null ? null : options.seed >>> 0;
    var work = null;
    var carry = 0;

    function nextSeed() {
      if (firstSeed != null) { var s = firstSeed; firstSeed = null; return s; }
      return Math.floor(master() * 4294967296) >>> 0;
    }

    /* A new maze for a frame of this aspect, with the current settings.
       Returns a function that puts the previous maze back. */
    function newMaze(aspect, seed) {
      var previous = work;
      var mazeSeed = seed == null ? nextSeed() : seed >>> 0;
      var colorSeed = (Math.imul(mazeSeed ^ 0x9E3779B9, 2654435761) >>> 0);
      var colors = previous && !options.recolorEach ? previous.colors : pickColors(mulberry32(colorSeed));
      work = makeWork({
        seed: mazeSeed, colorSeed: colorSeed,
        algorithm: settings.algorithm, topology: settings.topology, density: settings.density,
        aspect: aspect > 0 && isFinite(aspect) ? aspect : 16 / 9,
        colors: colors
      });
      carry = 0;
      return function restore() { if (previous) work = previous; carry = 0; };
    }

    /* New colors for the current maze, from the sketch's palette rules.
       Returns a function that puts the previous colors back. */
    var colorStream = mulberry32(options.seed == null ? (Math.random() * 4294967296) >>> 0 : (options.seed >>> 0) ^ 0x51ED27);
    function recolor() {
      var target = work;
      var before = target.colors;
      target.colors = pickColors(colorStream);
      return function restore() { target.colors = before; };
    }

    /* Advance by elapsed time. The sketch ran `speed` steps per frame at
       60 frames a second; this runs the same number per second, whatever the
       display's refresh rate. A long gap is clamped. Returns steps run. */
    function advance(dtMs) {
      if (!work || work.complete) return 0;
      carry += Math.min(dtMs, 100) * settings.speed * 60 / 1000;
      var n = Math.floor(carry);
      carry -= n;
      var ran = 0;
      while (ran < n && !work.complete) { work.step(); ran++; }
      return ran;
    }

    function finish(limit) {
      var n = 0, cap = limit || 50000000;
      while (work && !work.complete && n < cap) { work.step(); n++; }
      return n;
    }

    function hash() {
      var s = JSON.stringify([work.seed, work.algorithm, work.topology, work.cols, work.rows, work.compositionAspect,
        work.complete, work.visited, work.steps, work.sortedLinks(), [work.colors.background, work.colors.c1, work.colors.c2, work.colors.c3, work.colors.c4]]);
      var h = 2166136261;
      for (var i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619) >>> 0; }
      return work.links + ':' + h.toString(16);
    }

    /* A complete maze rebuilt by readRecord as the current maze. Returns a
       function that puts the previous maze back. */
    function adopt(next) {
      if (!next || !next.restored || !next.complete) throw new Error('not a rebuilt saved maze');
      var previous = work;
      work = next;
      carry = 0;
      return function restore() { if (previous) work = previous; carry = 0; };
    }

    return {
      settings: settings,
      get work() { return work; },
      newMaze: newMaze,
      recolor: recolor,
      adopt: adopt,
      advance: advance,
      finish: finish,
      hash: hash,
      render: function (ctx, width, height) {
        work.render(ctx, width, height, { ends: settings.ends, solution: settings.solution, label: settings.label });
      }
    };
  }

  /* ---- saved mazes ----------------------------------------------------------
     A saved maze is a JSON record of a complete maze: the recipe that made it
     (provenance; replaying it can differ in colors), the grid it was built
     on, its canonical links and visit order, and how it looked: its colors,
     frame and what it showed. `readRecord` checks a record and rebuilds the
     maze from its graph, not from its seed, so a later change to an
     algorithm cannot change a saved maze. It throws, saying why, on a record
     it cannot rebuild exactly. */

  var RECORD_FORMAT = 'mazes-ASK/saved-maze';
  var RECORD_VERSION = 1;
  var ENGINE_ID = { name: 'mazes-ASK maze-engine', graph: 1 };
  var COLOR_KEYS = ['background', 'c1', 'c2', 'c3', 'c4'];

  /* JSON with sorted keys, so a record's check does not depend on key order. */
  function canonical(value) {
    if (Array.isArray(value)) return '[' + value.map(canonical).join(',') + ']';
    if (value && typeof value === 'object') {
      return '{' + Object.keys(value).sort().map(function (k) { return JSON.stringify(k) + ':' + canonical(value[k]); }).join(',') + '}';
    }
    return JSON.stringify(value);
  }
  /* Two 32-bit FNV-1a hashes with different starts: a check against damage, not a signature. */
  function digest(value) {
    var s = canonical(value), h1 = 2166136261, h2 = 0x811C9DC5 ^ 0x5BD1E995;
    for (var i = 0; i < s.length; i++) {
      var c = s.charCodeAt(i);
      h1 = Math.imul(h1 ^ c, 16777619) >>> 0;
      h2 = Math.imul(h2 ^ c, 16777619) >>> 0;
    }
    return ('0000000' + h1.toString(16)).slice(-8) + ('0000000' + h2.toString(16)).slice(-8);
  }

  function toRecord(work, appearance, meta) {
    var graph = work && work.graph ? work.graph() : null;
    if (!graph) throw new Error('only a complete maze can be saved');
    appearance = appearance || {};
    meta = meta || {};
    var colors = {};
    COLOR_KEYS.forEach(function (k) { colors[k] = work.colors[k].map(function (v) { return Math.round(v); }); });
    var maze = {
      recipe: { seed: work.seed, colorSeed: work.colorSeed, algorithm: work.algorithm, grid: work.requestedTopology,
        density: work.density, aspect: work.compositionAspect },
      geometry: { topology: work.topology, composition: work.composition, cols: work.cols, rows: work.rows, cells: work.cellCount },
      graph: graph,
      appearance: {
        colors: colors,
        frame: typeof appearance.frame === 'string' ? appearance.frame : null,
        show: { ends: !!appearance.ends, solution: !!appearance.solution, label: !!appearance.label }
      }
    };
    return {
      format: RECORD_FORMAT,
      version: RECORD_VERSION,
      engine: ENGINE_ID,
      build: meta.build == null ? null : meta.build,
      savedAt: meta.savedAt == null ? null : meta.savedAt,
      maze: maze,
      check: digest(maze)
    };
  }

  function readRecord(record) {
    function fail(why) { throw new Error(why); }
    function uint32(v) { return typeof v === 'number' && v === Math.floor(v) && v >= 0 && v <= 4294967295; }
    if (!record || typeof record !== 'object' || record.format !== RECORD_FORMAT) fail('this is not a saved maze');
    if (typeof record.version !== 'number' || record.version < 1) fail('the saved maze has no version');
    if (record.version > RECORD_VERSION) fail('the saved maze was made by a newer version of the app');
    var maze = record.maze;
    if (!maze || typeof maze !== 'object' || record.check !== digest(maze)) fail('the saved maze is damaged');
    var r = maze.recipe || {}, g = maze.geometry || {}, a = maze.appearance || {};
    if (!maze.graph || typeof maze.graph !== 'object') fail('the saved maze has no graph');
    if (!uint32(r.seed) || !uint32(r.colorSeed)) fail('the saved maze has no seed');
    var known = ALGORITHMS.some(function (x) { return x.id === r.algorithm; }) &&
      TOPOLOGIES.some(function (x) { return x.id === r.grid; });
    if (!known) fail('the saved maze names an algorithm or grid this version does not have');
    if (typeof r.density !== 'number' || r.density < 0.5 || r.density > 2.5 || Math.round(r.density * 4) !== r.density * 4) fail('the saved maze has an unknown density');
    if (typeof r.aspect !== 'number' || !isFinite(r.aspect) || r.aspect <= 0) fail('the saved maze has no frame shape');
    var colors = {};
    COLOR_KEYS.forEach(function (k) {
      var c = a.colors && a.colors[k];
      if (!Array.isArray(c) || c.length !== 3 || !c.every(function (v) { return typeof v === 'number' && v >= 0 && v <= 255; })) fail('the saved maze has no colors');
      colors[k] = c.slice();
    });
    var work = makeWork({
      seed: r.seed, colorSeed: r.colorSeed, algorithm: r.algorithm, topology: r.grid, density: r.density,
      aspect: r.aspect, colors: colors, graph: maze.graph
    });
    if (work.topology !== g.topology || work.composition !== g.composition || work.cols !== g.cols ||
        work.rows !== g.rows || work.cellCount !== g.cells) {
      fail('this version builds the saved maze\'s grid differently');
    }
    var show = a.show || {};
    return {
      work: work,
      appearance: { frame: typeof a.frame === 'string' ? a.frame : null, ends: show.ends === true, solution: show.solution === true, label: show.label !== false },
      savedAt: typeof record.savedAt === 'string' ? record.savedAt : null,
      build: record.build == null ? null : record.build
    };
  }

  var api = {
    create: create,
    makeWork: makeWork,
    toRecord: toRecord,
    readRecord: readRecord,
    RECORD_FORMAT: RECORD_FORMAT,
    RECORD_VERSION: RECORD_VERSION,
    pickColors: pickColors,
    mulberry32: mulberry32,
    supports: supports,
    ALGORITHMS: ALGORITHMS,
    TOPOLOGIES: TOPOLOGIES,
    SWATCHES: SWATCHES,
    DEFAULTS: DEFAULTS,
    SQUARE_BELOW: SQUARE_BELOW,
    hex: hex
  };

  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else root.MazeEngine = api;
})(typeof self !== 'undefined' ? self : this);
