// Copyright (c) 2026 >> Andrew S Klug // ASK
// Licensed under the Apache License, Version 2.0

// =====================================================
// mazeASK // p5.js maze lab
// - viewing mode vs output mode
// - clean algorithm comparison
// - implemented:
//   1 Recursive Backtracker
//   2 Binary Tree
//   3 Prim
//   4 Sidewinder
//   5 Eller
//   6 Kruskal
//   7 Wilson
//   8 Aldous-Broder
// =====================================================

/*
=====================================================
BIG PICTURE
=====================================================

A maze is really a bunch of little boxes, called cells,
that can connect to their neighbors.

You can think of the grid like a city of rooms.
Each room has walls.
A maze algorithm decides which walls to knock down.

Most of the time, we are trying to make a "perfect maze":
- every cell can be reached
- there is only one path between any two cells
- there are no loops

That means the maze is really a kind of connected tree.

=====================================================
BIG CONCEPTUAL TAKEAWAY
=====================================================

These different maze algorithms are not magic tricks.
They are different ways to build a connected network.

They mostly differ in:
1. how they choose the next cell
2. whether they like going deep, wide, or by frontier
3. how much visual bias they create
4. what kind of maze "texture" they make

Examples:
- Recursive Backtracker likes long winding paths
- Binary Tree is very simple but biased
- Prim grows outward from a frontier
- Sidewinder likes horizontal runs with occasional links upward
- Eller builds row by row
- Kruskal chooses walls while avoiding cycles
- Wilson uses loop-erased random walks
- Aldous-Broder uses a random walk that only carves on first visits

So the real lesson is not "memorize 8 algorithms".
The real lesson is:
selection strategy changes the look of the maze.

=====================================================
CRITICAL PERSPECTIVE
=====================================================

People often talk about these as if they are totally
different things. That is only partly true.

A better way to see them:
they are all ways of building one connected structure
while avoiding broken regions.

So when you compare algorithms, ask:
- How does it choose where to grow next?
- What visual bias does it create?
- What tradeoff does it make between simplicity,
  speed, and maze style?

That is the deeper idea.

=====================================================
ALGORITHMS IN THIS SKETCH
=====================================================

1 // Recursive Backtracker
2 // Binary Tree
3 // Prim
4 // Sidewinder
5 // Eller
6 // Kruskal
7 // Wilson
8 // Aldous-Broder

Each algorithm below has comments that explain the
basic idea, plus pros and cons.

=====================================================
SIMPLE ANALOGIES
=====================================================

Recursive Backtracker:
"Walk until stuck, then walk backward until you find
 a place where you can choose a new path."

Binary Tree:
"In each room, choose one of two favorite directions."

Prim:
"Grow the maze from the edge of the already-built part."

Sidewinder:
"Make horizontal runs, and sometimes punch a hole upward."

Eller:
"Build one row at a time, but remember which rooms are
 already connected."

Kruskal:
"Look at possible walls and remove only the ones that
 join two different regions."

Wilson:
"Take a wandering path, erase loops, then attach the
 clean path to the maze."

Aldous-Broder:
"Wander randomly forever, and only carve when you step
 into a room for the first time."

=====================================================
WHAT TO NOTICE WHILE PLAYING
=====================================================

When you press keys 1-8, do not just ask:
"Does it work?"

Also ask:
- Which one makes longer hallways?
- Which one feels more messy?
- Which one feels more fair?
- Which one looks most artificial?
- Which one looks most elegant?

That is how you learn to see the algorithm through
the drawing.

=====================================================
*/

// =====================================================
// TOP-OF-FILE MODE SETTINGS
// =====================================================

let outputASK = false;
let aspectModeASK = "widescreen";

const renderPresetsASK = {
  square: [2160, 2160],
  widescreen: [3840, 2160]
};

// =====================================================
// GLOBALS
// =====================================================

let colorBackgroundASK, color1ASK, color2ASK, color3ASK, color4ASK;
let sizeASK;
let weightASK = 0.0009;
let colorsASK = [];
let opacASK = 1;

let timeASK = 0;
let canvasWidthASK = 0;
let canvasHeightASK = 0;

let mousePressedASK = false;
let dragStartASK = null;
let dragCurrentASK = null;
let dragLengthASK = 0;
let dragVectorASK = { x: 0, y: 0 };

let zoomASK = 1.0;
let centerXASK = 0.5;
let centerYASK = 0.5;

// =====================================================
// MAZE LAB STATE
// =====================================================

let mazeASK = [];
let mazeStateASK = null;
let topologyASK = null;
let topologyModeASK = "rect";
let colsMazeASK = 40;
let rowsMazeASK = 24;
let cellSizeASK = 0.02;

let mazeOriginXASK = 0;
let mazeOriginYASK = 0;
let mazeWidthNormASK = 0.82;
let mazeHeightNormASK = 0.62;

let currentCellASK = null;
let stackASK = [];
let frontierASK = [];
let mazeCompleteASK = false;
let stepsPerFrameASK = 16;

let algorithmASK = "recursiveBacktracker";
let algorithmLabelASK = "Recursive Backtracker";

let sidewinderRowASK = 0;
let sidewinderColASK = 0;
let sidewinderRunASK = [];

let visitOrderCounterASK = 0;
let visitedCountASK = 0;
let manualColsASK = null;
let manualRowsASK = null;

// Eller state
let ellerCurrentRowASK = 0;
let ellerSetsASK = [];
let ellerNextSetIdASK = 1;
let ellerPreparedASK = false;

// Kruskal state
let kruskalWallsASK = [];
let kruskalParentASK = [];
let kruskalRankASK = [];
let kruskalStepIndexASK = 0;

// Wilson state
let wilsonWalkASK = [];
let wilsonWalkIndexByKeyASK = {};
let wilsonModeASK = "idle";
let wilsonCarveIndexASK = 0;

// Aldous-Broder state
let aldousCurrentASK = null;

// =====================================================
// SETUP
// =====================================================

function setup() {
  updateCanvasSizeASK();
  createCanvas(canvasWidthASK, canvasHeightASK);

  pixelDensity(1);
  noFill();
  smooth();

  sizeASK = min(canvasWidthASK, canvasHeightASK);

  initColorsASK();
  renderColorsASK();
  setupASK();
}

function setupASK() {
  configureCompositionASK();
  initializeMazeASK();
}

// =====================================================
// DRAW
// =====================================================

function draw() {
  background(colorBackgroundASK);

  pushASKView();
  updateMazeASK();
  drawASK();
  drawASKOverlay();
  pop();

  timeASK += 0.02;
}

function drawASK() {
  drawVisitedFieldsASK();
  drawWallsASK();
  drawWilsonWalkOverlayASK();
  drawCurrentCellASK();
  drawBorderASK();
  drawLabOverlayASK();
}

function drawASKOverlay() {
  if (mousePressedASK && dragStartASK && dragCurrentASK) {
    stroke(red(color4ASK), green(color4ASK), blue(color4ASK), 180);
    strokeWeight(weightASK * 3.0);
    line(dragStartASK.x, dragStartASK.y, dragCurrentASK.x, dragCurrentASK.y);
  }
}

// =====================================================
// VIEW / NORMALIZED SPACE
// =====================================================

function pushASKView() {
  push();
  scale(canvasWidthASK, canvasHeightASK);
  translate(centerXASK, centerYASK);
  scale(zoomASK);
}

function screenToASK(pxASK, pyASK) {
  let nxASK = pxASK / canvasWidthASK;
  let nyASK = pyASK / canvasHeightASK;

  return {
    x: (nxASK - centerXASK) / zoomASK,
    y: (nyASK - centerYASK) / zoomASK
  };
}

// =====================================================
// CANVAS SIZE HELPERS
// =====================================================

function updateCanvasSizeASK() {
  if (outputASK) {
    let presetASK = renderPresetsASK[aspectModeASK] || renderPresetsASK.widescreen;
    canvasWidthASK = presetASK[0];
    canvasHeightASK = presetASK[1];
  } else {
    canvasWidthASK = windowWidth;
    canvasHeightASK = windowHeight;
  }
}

function applyCanvasSizeASK() {
  updateCanvasSizeASK();
  resizeCanvas(canvasWidthASK, canvasHeightASK);
  sizeASK = min(canvasWidthASK, canvasHeightASK);
}

// =====================================================
// COMPOSITION
// =====================================================

function isSquareCompositionASK() {
  if (outputASK) {
    return aspectModeASK === "square";
  }
  return canvasWidthASK / canvasHeightASK < 1.15;
}

function configureCompositionASK() {
  let activeTopologyModeASK = getActiveTopologyModeASK();

  if (isSquareCompositionASK()) {
    zoomASK = 1.0;
    centerXASK = 0.5;
    centerYASK = 0.5;
    mazeWidthNormASK = 0.78;
    mazeHeightNormASK = 0.78;

    if (manualColsASK === null || manualRowsASK === null) {
      if (activeTopologyModeASK === "hex") {
        colsMazeASK = 20;
        rowsMazeASK = 20;
      } else if (activeTopologyModeASK === "triangle") {
        colsMazeASK = 34;
        rowsMazeASK = 34;
      } else if (algorithmASK === "sidewinder" || algorithmASK === "eller") {
        colsMazeASK = 34;
        rowsMazeASK = 34;
      } else {
        colsMazeASK = 36;
        rowsMazeASK = 36;
      }
    } else {
      colsMazeASK = manualColsASK;
      rowsMazeASK = manualRowsASK;
    }
  } else {
    zoomASK = 1.0;
    centerXASK = 0.5;
    centerYASK = 0.515;
    mazeWidthNormASK = 0.82;
    mazeHeightNormASK = 0.62;

    if (manualColsASK === null || manualRowsASK === null) {
      if (activeTopologyModeASK === "hex") {
        colsMazeASK = 28;
        rowsMazeASK = 16;
      } else if (activeTopologyModeASK === "triangle") {
        colsMazeASK = 46;
        rowsMazeASK = 24;
      } else if (algorithmASK === "sidewinder" || algorithmASK === "eller") {
        colsMazeASK = 44;
        rowsMazeASK = 24;
      } else {
        colsMazeASK = 46;
        rowsMazeASK = 24;
      }
    } else {
      colsMazeASK = manualColsASK;
      rowsMazeASK = manualRowsASK;
    }
  }
}

// =====================================================
// MAZE INITIALIZATION
// =====================================================

function initializeMazeASK() {
  configureCompositionASK();

  mazeASK = [];
  mazeStateASK = {
    linksASK: new Set()
  };
  stackASK = [];
  frontierASK = [];
  sidewinderRunASK = [];
  mazeCompleteASK = false;
  currentCellASK = null;
  visitOrderCounterASK = 0;
  visitedCountASK = 0;
  sidewinderRowASK = 0;
  sidewinderColASK = 0;

  // reset Eller
  ellerCurrentRowASK = 0;
  ellerSetsASK = [];
  ellerNextSetIdASK = 1;
  ellerPreparedASK = false;

  // reset Kruskal
  kruskalWallsASK = [];
  kruskalParentASK = [];
  kruskalRankASK = [];
  kruskalStepIndexASK = 0;

  // reset Wilson
  wilsonWalkASK = [];
  wilsonWalkIndexByKeyASK = {};
  wilsonModeASK = "idle";
  wilsonCarveIndexASK = 0;

  // reset Aldous-Broder
  aldousCurrentASK = null;

  for (let rowASK = 0; rowASK < rowsMazeASK; rowASK++) {
    let rowCellsASK = [];
    for (let colASK = 0; colASK < colsMazeASK; colASK++) {
      rowCellsASK.push(makeCellASK(colASK, rowASK));
    }
    mazeASK.push(rowCellsASK);
  }

  topologyASK =
    getActiveTopologyModeASK() === "hex"
      ? makeHexTopologyASK()
      : getActiveTopologyModeASK() === "triangle"
        ? makeTriangleTopologyASK()
        : makeRectTopologyASK();

  setupAlgorithmASK();
}

function makeCellASK(colASK, rowASK) {
  return {
    colASK,
    rowASK,
    visitedASK: false,
    frontierASK: false,
    depthASK: -1,
    visitOrderASK: -1
  };
}

function setupAlgorithmASK() {
  // --------------------------------------------------
  // RECURSIVE BACKTRACKER
  // --------------------------------------------------
  // Start in one room. Keep walking to a room you
  // haven't visited yet. If you get stuck, walk
  // backward until you find a room with another choice.
  //
  // Pros:
  // - easy to understand
  // - makes long twisty hallways
  // - very fun to animate
  //
  // Cons:
  // - can make lots of deep branches
  // - not very balanced or uniform
  if (algorithmASK === "recursiveBacktracker") {
    algorithmLabelASK = "Recursive Backtracker";
    currentCellASK = mazeASK[0][0];
    markVisitedASK(currentCellASK, 0);
  }

  // --------------------------------------------------
  // BINARY TREE
  // --------------------------------------------------
  // At every room, pick one of just two favorite
  // directions and break that wall.
  //
  // Pros:
  // - super simple
  // - very fast
  // - easy to code
  //
  // Cons:
  // - strongly biased
  // - can feel artificial
  else if (algorithmASK === "binaryTree") {
    algorithmLabelASK = "Binary Tree";
  }

  // --------------------------------------------------
  // PRIM
  // --------------------------------------------------
  // Start somewhere. Then grow the maze from the edge
  // of the part you already built.
  //
  // Pros:
  // - more evenly spread
  // - good comparison against backtracker
  //
  // Cons:
  // - often makes shorter dead ends
  else if (algorithmASK === "prim") {
    algorithmLabelASK = "Prim";
    currentCellASK = mazeASK[floor(rowsMazeASK / 2)][floor(colsMazeASK / 2)];
    markVisitedASK(currentCellASK, 0);
    addFrontierNeighborsASK(currentCellASK);
  }

  // --------------------------------------------------
  // SIDEWINDER
  // --------------------------------------------------
  // Go across a row, making a run of connected rooms.
  // Every so often, punch one passage upward.
  else if (algorithmASK === "sidewinder") {
    algorithmLabelASK = "Sidewinder";
  }

  // --------------------------------------------------
  // ELLER
  // --------------------------------------------------
  // Build one row at a time while remembering which
  // rooms are already connected.
  else if (algorithmASK === "eller") {
    algorithmLabelASK = "Eller";
    initializeEllerASK();
  }

  // --------------------------------------------------
  // KRUSKAL
  // --------------------------------------------------
  // Look at possible walls and remove only the ones
  // that join two different regions.
  else if (algorithmASK === "kruskal") {
    algorithmLabelASK = "Kruskal";
    initializeKruskalASK();
  }

  // --------------------------------------------------
  // WILSON
  // --------------------------------------------------
  // Start a random walk from an unvisited room.
  // If the walk loops back on itself, erase the loop.
  // When the walk reaches the maze, carve the cleaned
  // path into the maze.
  //
  // Pros:
  // - mathematically elegant
  // - produces a uniform spanning tree
  //
  // Cons:
  // - more complex to explain
  // - slower than the simpler starters
  else if (algorithmASK === "wilson") {
    algorithmLabelASK = "Wilson";
    initializeWilsonASK();
  }

  // --------------------------------------------------
  // ALDOUS-BRODER
  // --------------------------------------------------
  // Wander randomly forever, and only carve when you
  // step into a room for the first time.
  //
  // Pros:
  // - conceptually simple
  // - mathematically important
  //
  // Cons:
  // - very slow
  else if (algorithmASK === "aldousBroder") {
    algorithmLabelASK = "Aldous-Broder";
    initializeAldousBroderASK();
  }
}

// =====================================================
// MAZE UPDATE
// =====================================================

function updateMazeASK() {
  if (mazeCompleteASK) return;

  // Binary Tree completes in one pass; the other algorithms advance incrementally.
  if (algorithmASK === "binaryTree") {
    runBinaryTreeASK();
    mazeCompleteASK = true;
    return;
  }

  // Run a bounded number of generation steps each frame for the active algorithm.
  for (let iASK = 0; iASK < stepsPerFrameASK; iASK++) {
    if (algorithmASK === "recursiveBacktracker") {
      stepRecursiveBacktrackerASK();
    } else if (algorithmASK === "prim") {
      stepPrimASK();
    } else if (algorithmASK === "sidewinder") {
      stepSidewinderASK();
    } else if (algorithmASK === "eller") {
      stepEllerASK();
    } else if (algorithmASK === "kruskal") {
      stepKruskalASK();
    } else if (algorithmASK === "wilson") {
      stepWilsonASK();
    } else if (algorithmASK === "aldousBroder") {
      stepAldousBroderASK();
    }

    if (mazeCompleteASK) break;
  }
}

// =====================================================
// ALGORITHMS
// =====================================================

function stepRecursiveBacktrackerASK() {
  let neighborsASK = getNeighborCellsASK(currentCellASK).filter(
    (neighborASK) => !neighborASK.visitedASK
  );

  if (neighborsASK.length > 0) {
    let nextCellASK = random(neighborsASK);
    stackASK.push(currentCellASK);
    linkCellsASK(currentCellASK, nextCellASK);
    markVisitedASK(nextCellASK, stackASK.length);
    currentCellASK = nextCellASK;
    return;
  }

  if (stackASK.length > 0) {
    currentCellASK = stackASK.pop();
    return;
  }

  mazeCompleteASK = true;
}

function runBinaryTreeASK() {
  for (let rowASK = 0; rowASK < rowsMazeASK; rowASK++) {
    for (let colASK = 0; colASK < colsMazeASK; colASK++) {
      let cellASK = mazeASK[rowASK][colASK];
      markVisitedASK(cellASK, rowASK + colASK);

      let neighborsASK = getBinaryTreeCandidatesASK(cellASK).filter(Boolean);

      if (neighborsASK.length > 0) {
        removeWallsASK(cellASK, random(neighborsASK));
      }
    }
  }
}

function stepPrimASK() {
  if (frontierASK.length === 0) {
    mazeCompleteASK = true;
    return;
  }

  let frontierIndexASK = floor(random(frontierASK.length));
  let cellASK = frontierASK.splice(frontierIndexASK, 1)[0];
  cellASK.frontierASK = false;

  let visitedNeighborsASK = getVisitedNeighborsASK(cellASK);
  if (visitedNeighborsASK.length > 0) {
    let connectASK = random(visitedNeighborsASK);
    removeWallsASK(cellASK, connectASK);
  }

  let depthASK = visitedNeighborsASK.length > 0
    ? minVisitedNeighborDepthASK(visitedNeighborsASK) + 1
    : 0;

  markVisitedASK(cellASK, depthASK);
  currentCellASK = cellASK;
  addFrontierNeighborsASK(cellASK);
}

function stepSidewinderASK() {
  if (sidewinderRowASK >= rowsMazeASK) {
    mazeCompleteASK = true;
    return;
  }

  let cellASK = mazeASK[sidewinderRowASK][sidewinderColASK];
  markVisitedASK(cellASK, sidewinderRowASK);
  currentCellASK = cellASK;
  sidewinderRunASK.push(cellASK);

  let atEasternBoundaryASK = sidewinderColASK === colsMazeASK - 1;
  let atNorthernBoundaryASK = sidewinderRowASK === 0;

  let carveNorthASK =
    atEasternBoundaryASK || (!atNorthernBoundaryASK && random() < 0.33);

  if (carveNorthASK) {
    if (!atNorthernBoundaryASK) {
      let memberASK = random(sidewinderRunASK);
      let northASK = getCellASK(memberASK.colASK, memberASK.rowASK - 1);
      if (northASK) removeWallsASK(memberASK, northASK);
    }
    sidewinderRunASK = [];
  } else {
    let eastASK = getCellASK(sidewinderColASK + 1, sidewinderRowASK);
    if (eastASK) removeWallsASK(cellASK, eastASK);
  }

  sidewinderColASK++;
  if (sidewinderColASK >= colsMazeASK) {
    sidewinderColASK = 0;
    sidewinderRowASK++;
    sidewinderRunASK = [];
  }
}

// =====================================================
// ELLER
// =====================================================

function initializeEllerASK() {
  ellerCurrentRowASK = 0;
  ellerNextSetIdASK = 1;
  ellerPreparedASK = false;
  ellerSetsASK = new Array(colsMazeASK).fill(0);
}

function stepEllerASK() {
  if (ellerCurrentRowASK >= rowsMazeASK) {
    mazeCompleteASK = true;
    return;
  }

  if (!ellerPreparedASK) {
    prepareEllerRowASK(ellerCurrentRowASK);
    currentCellASK = mazeASK[ellerCurrentRowASK][0];
    ellerPreparedASK = true;
    return;
  }

  let rowASK = ellerCurrentRowASK;

  if (rowASK === rowsMazeASK - 1) {
    finishLastEllerRowASK(rowASK);
    markEntireRowVisitedASK(rowASK, rowASK);
    currentCellASK = mazeASK[rowASK][colsMazeASK - 1];
    ellerCurrentRowASK++;
    mazeCompleteASK = true;
    return;
  }

  let nextRowSetsASK = new Array(colsMazeASK).fill(0);
  let groupsASK = groupColumnsBySetASK(ellerSetsASK);

  for (let setIdASK in groupsASK) {
    let colsInSetASK = groupsASK[setIdASK].slice();
    shuffleArrayASK(colsInSetASK);

    let requiredCountASK = 1 + floor(random(colsInSetASK.length));
    for (let iASK = 0; iASK < requiredCountASK; iASK++) {
      let colASK = colsInSetASK[iASK];
      let cellASK = mazeASK[rowASK][colASK];
      let downASK = getCellASK(colASK, rowASK + 1);
      if (downASK) {
        removeWallsASK(cellASK, downASK);
        nextRowSetsASK[colASK] = int(setIdASK);
      }
    }
  }

  markEntireRowVisitedASK(rowASK, rowASK);
  currentCellASK = mazeASK[rowASK][colsMazeASK - 1];

  ellerSetsASK = nextRowSetsASK;
  ellerCurrentRowASK++;
  ellerPreparedASK = false;
}

function prepareEllerRowASK(rowASK) {
  for (let colASK = 0; colASK < colsMazeASK; colASK++) {
    if (ellerSetsASK[colASK] === 0) {
      ellerSetsASK[colASK] = ellerNextSetIdASK++;
    }
  }

  for (let colASK = 0; colASK < colsMazeASK - 1; colASK++) {
    if (ellerSetsASK[colASK] === ellerSetsASK[colASK + 1]) continue;

    let shouldJoinASK = rowASK === rowsMazeASK - 1 || random() < 0.5;

    if (shouldJoinASK) {
      let leftCellASK = mazeASK[rowASK][colASK];
      let rightCellASK = mazeASK[rowASK][colASK + 1];
      removeWallsASK(leftCellASK, rightCellASK);

      let oldSetASK = ellerSetsASK[colASK + 1];
      let newSetASK = ellerSetsASK[colASK];

      for (let iASK = 0; iASK < colsMazeASK; iASK++) {
        if (ellerSetsASK[iASK] === oldSetASK) {
          ellerSetsASK[iASK] = newSetASK;
        }
      }
    }
  }
}

function finishLastEllerRowASK(rowASK) {
  for (let colASK = 0; colASK < colsMazeASK; colASK++) {
    if (ellerSetsASK[colASK] === 0) {
      ellerSetsASK[colASK] = ellerNextSetIdASK++;
    }
  }

  for (let colASK = 0; colASK < colsMazeASK - 1; colASK++) {
    if (ellerSetsASK[colASK] !== ellerSetsASK[colASK + 1]) {
      let leftCellASK = mazeASK[rowASK][colASK];
      let rightCellASK = mazeASK[rowASK][colASK + 1];
      removeWallsASK(leftCellASK, rightCellASK);

      let oldSetASK = ellerSetsASK[colASK + 1];
      let newSetASK = ellerSetsASK[colASK];

      for (let iASK = 0; iASK < colsMazeASK; iASK++) {
        if (ellerSetsASK[iASK] === oldSetASK) {
          ellerSetsASK[iASK] = newSetASK;
        }
      }
    }
  }
}

function groupColumnsBySetASK(setArrayASK) {
  let groupsASK = {};
  for (let colASK = 0; colASK < setArrayASK.length; colASK++) {
    let setIdASK = setArrayASK[colASK];
    if (!groupsASK[setIdASK]) groupsASK[setIdASK] = [];
    groupsASK[setIdASK].push(colASK);
  }
  return groupsASK;
}

function markEntireRowVisitedASK(rowASK, depthASK) {
  for (let colASK = 0; colASK < colsMazeASK; colASK++) {
    markVisitedASK(mazeASK[rowASK][colASK], depthASK);
  }
}

// =====================================================
// KRUSKAL
// =====================================================

function initializeKruskalASK() {
  kruskalParentASK = {};
  kruskalRankASK = {};

  for (let rowASK = 0; rowASK < rowsMazeASK; rowASK++) {
    for (let colASK = 0; colASK < colsMazeASK; colASK++) {
      let cellASK = mazeASK[rowASK][colASK];
      let cellIdASK = cellKeyASK(cellASK);
      kruskalParentASK[cellIdASK] = cellIdASK;
      kruskalRankASK[cellIdASK] = 0;
    }
  }

  kruskalWallsASK = getKruskalEdgesASK();

  shuffleArrayASK(kruskalWallsASK);
  kruskalStepIndexASK = 0;
  currentCellASK = mazeASK[0][0];
}

function stepKruskalASK() {
  if (kruskalStepIndexASK >= kruskalWallsASK.length) {
    markAllCellsVisitedASK();
    mazeCompleteASK = true;
    return;
  }

  let wallASK = kruskalWallsASK[kruskalStepIndexASK++];
  let cellAASK = wallASK.cellAASK;
  let cellBASK = wallASK.cellBASK;

  let idAASK = cellKeyASK(cellAASK);
  let idBASK = cellKeyASK(cellBASK);

  let rootAASK = kruskalFindASK(idAASK);
  let rootBASK = kruskalFindASK(idBASK);

  currentCellASK = cellAASK;

  if (rootAASK !== rootBASK) {
    removeWallsASK(cellAASK, cellBASK);
    kruskalUnionASK(rootAASK, rootBASK);

    let depthASK = floor(kruskalStepIndexASK / max(1, colsMazeASK));
    markVisitedASK(cellAASK, depthASK);
    markVisitedASK(cellBASK, depthASK);
    currentCellASK = cellBASK;
  }
}

function kruskalFindASK(indexASK) {
  if (kruskalParentASK[indexASK] !== indexASK) {
    kruskalParentASK[indexASK] = kruskalFindASK(kruskalParentASK[indexASK]);
  }
  return kruskalParentASK[indexASK];
}

function kruskalUnionASK(aASK, bASK) {
  let rootAASK = kruskalFindASK(aASK);
  let rootBASK = kruskalFindASK(bASK);

  if (rootAASK === rootBASK) return;

  if (kruskalRankASK[rootAASK] < kruskalRankASK[rootBASK]) {
    kruskalParentASK[rootAASK] = rootBASK;
  } else if (kruskalRankASK[rootAASK] > kruskalRankASK[rootBASK]) {
    kruskalParentASK[rootBASK] = rootAASK;
  } else {
    kruskalParentASK[rootBASK] = rootAASK;
    kruskalRankASK[rootAASK]++;
  }
}

function markAllCellsVisitedASK() {
  for (let rowASK = 0; rowASK < rowsMazeASK; rowASK++) {
    for (let colASK = 0; colASK < colsMazeASK; colASK++) {
      markVisitedASK(mazeASK[rowASK][colASK], rowASK + colASK);
    }
  }
}

// =====================================================
// WILSON
// =====================================================

function initializeWilsonASK() {
  let seedASK = mazeASK[0][0];
  markVisitedASK(seedASK, 0);
  currentCellASK = seedASK;
  wilsonModeASK = "chooseStart";
}

function stepWilsonASK() {
  if (visitedCountASK >= rowsMazeASK * colsMazeASK) {
    mazeCompleteASK = true;
    return;
  }

  if (wilsonModeASK === "chooseStart") {
    let startASK = getRandomUnvisitedCellASK();
    if (!startASK) {
      mazeCompleteASK = true;
      return;
    }

    wilsonWalkASK = [startASK];
    wilsonWalkIndexByKeyASK = {};
    wilsonWalkIndexByKeyASK[cellKeyASK(startASK)] = 0;
    wilsonCarveIndexASK = 0;
    currentCellASK = startASK;
    wilsonModeASK = "walk";
    return;
  }

  if (wilsonModeASK === "walk") {
    let tailASK = wilsonWalkASK[wilsonWalkASK.length - 1];
    let neighborsASK = getNeighborCellsASK(tailASK);
    let nextASK = random(neighborsASK);
    currentCellASK = nextASK;

    if (nextASK.visitedASK) {
      wilsonWalkASK.push(nextASK);
      wilsonModeASK = "carve";
      wilsonCarveIndexASK = 0;
      return;
    }

    let keyASK = cellKeyASK(nextASK);
    if (wilsonWalkIndexByKeyASK.hasOwnProperty(keyASK)) {
      let loopStartASK = wilsonWalkIndexByKeyASK[keyASK];
      wilsonWalkASK = wilsonWalkASK.slice(0, loopStartASK + 1);

      wilsonWalkIndexByKeyASK = {};
      for (let iASK = 0; iASK < wilsonWalkASK.length; iASK++) {
        wilsonWalkIndexByKeyASK[cellKeyASK(wilsonWalkASK[iASK])] = iASK;
      }
      currentCellASK = wilsonWalkASK[wilsonWalkASK.length - 1];
      return;
    }

    wilsonWalkASK.push(nextASK);
    wilsonWalkIndexByKeyASK[keyASK] = wilsonWalkASK.length - 1;
    return;
  }

  if (wilsonModeASK === "carve") {
    if (wilsonCarveIndexASK >= wilsonWalkASK.length - 1) {
      wilsonWalkASK = [];
      wilsonWalkIndexByKeyASK = {};
      wilsonModeASK = "chooseStart";
      return;
    }

    let cellAASK = wilsonWalkASK[wilsonCarveIndexASK];
    let cellBASK = wilsonWalkASK[wilsonCarveIndexASK + 1];
    removeWallsASK(cellAASK, cellBASK);
    markVisitedASK(cellAASK, wilsonCarveIndexASK);
    markVisitedASK(cellBASK, wilsonCarveIndexASK + 1);
    currentCellASK = cellBASK;
    wilsonCarveIndexASK++;
  }
}

// =====================================================
// ALDOUS-BRODER
// =====================================================

function initializeAldousBroderASK() {
  aldousCurrentASK = mazeASK[0][0];
  currentCellASK = aldousCurrentASK;
  markVisitedASK(aldousCurrentASK, 0);
}

function stepAldousBroderASK() {
  if (visitedCountASK >= rowsMazeASK * colsMazeASK) {
    mazeCompleteASK = true;
    return;
  }

  let neighborsASK = getNeighborCellsASK(aldousCurrentASK);
  let nextASK = random(neighborsASK);

  if (!nextASK.visitedASK) {
    removeWallsASK(aldousCurrentASK, nextASK);
    markVisitedASK(nextASK, visitedCountASK);
  }

  aldousCurrentASK = nextASK;
  currentCellASK = nextASK;
}

// =====================================================
// MAZE HELPERS
// =====================================================

function markVisitedASK(cellASK, depthASK) {
  if (!cellASK.visitedASK) {
    cellASK.visitedASK = true;
    cellASK.depthASK = depthASK;
    cellASK.visitOrderASK = visitOrderCounterASK;
    visitOrderCounterASK++;
    visitedCountASK++;
  }
}

function addFrontierNeighborsASK(cellASK) {
  let neighborsASK = getNeighborCellsASK(cellASK);

  for (let neighborASK of neighborsASK) {
    if (!neighborASK.visitedASK && !neighborASK.frontierASK) {
      neighborASK.frontierASK = true;
      frontierASK.push(neighborASK);
    }
  }
}

function makeRectTopologyASK() {
  cellSizeASK = min(
    mazeWidthNormASK / colsMazeASK,
    mazeHeightNormASK / rowsMazeASK
  );

  let mazeWidthASK = colsMazeASK * cellSizeASK;
  let mazeHeightASK = rowsMazeASK * cellSizeASK;

  mazeOriginXASK = -mazeWidthASK * 0.5;
  mazeOriginYASK = isSquareCompositionASK()
    ? -mazeHeightASK * 0.5
    : -mazeHeightASK * 0.42;

  return {
    modeASK: "rect",

    getNeighborCellASK(cellASK, directionASK) {
      if (!cellASK) return null;

      if (directionASK === "topASK") {
        return getCellASK(cellASK.colASK, cellASK.rowASK - 1);
      }
      if (directionASK === "rightASK") {
        return getCellASK(cellASK.colASK + 1, cellASK.rowASK);
      }
      if (directionASK === "bottomASK") {
        return getCellASK(cellASK.colASK, cellASK.rowASK + 1);
      }
      if (directionASK === "leftASK") {
        return getCellASK(cellASK.colASK - 1, cellASK.rowASK);
      }

      return null;
    },

    getRectNeighborsASK(cellASK) {
      return {
        topASK: this.getNeighborCellASK(cellASK, "topASK"),
        rightASK: this.getNeighborCellASK(cellASK, "rightASK"),
        bottomASK: this.getNeighborCellASK(cellASK, "bottomASK"),
        leftASK: this.getNeighborCellASK(cellASK, "leftASK")
      };
    },

    getNeighborsASK(cellASK) {
      if (!cellASK) return [];
      let neighborsASK = [];
      let rectNeighborsASK = this.getRectNeighborsASK(cellASK);

      if (rectNeighborsASK.topASK) neighborsASK.push(rectNeighborsASK.topASK);
      if (rectNeighborsASK.rightASK) neighborsASK.push(rectNeighborsASK.rightASK);
      if (rectNeighborsASK.bottomASK) neighborsASK.push(rectNeighborsASK.bottomASK);
      if (rectNeighborsASK.leftASK) neighborsASK.push(rectNeighborsASK.leftASK);

      return neighborsASK;
    },

    getBinaryTreeCandidatesASK(cellASK) {
      let rectNeighborsASK = this.getRectNeighborsASK(cellASK);
      return [
        rectNeighborsASK.topASK,
        rectNeighborsASK.rightASK
      ];
    },

    getKruskalEdgesASK(cellASK) {
      let rectNeighborsASK = this.getRectNeighborsASK(cellASK);
      let edgesASK = [];

      if (rectNeighborsASK.rightASK) {
        edgesASK.push({
          cellAASK: cellASK,
          cellBASK: rectNeighborsASK.rightASK
        });
      }

      if (rectNeighborsASK.bottomASK) {
        edgesASK.push({
          cellAASK: cellASK,
          cellBASK: rectNeighborsASK.bottomASK
        });
      }

      return edgesASK;
    },

    areAdjacentCellsASK(cellAASK, cellBASK) {
      if (!cellAASK || !cellBASK) return false;
      return this.getNeighborsASK(cellAASK).includes(cellBASK);
    },

    getCellCenterASK(cellASK) {
      return {
        x: mazeOriginXASK + cellASK.colASK * cellSizeASK + cellSizeASK * 0.5,
        y: mazeOriginYASK + cellASK.rowASK * cellSizeASK + cellSizeASK * 0.5
      };
    },

    getCellPolygonASK(cellASK, insetASK = 0) {
      let xASK = mazeOriginXASK + cellASK.colASK * cellSizeASK + insetASK;
      let yASK = mazeOriginYASK + cellASK.rowASK * cellSizeASK + insetASK;
      let sizeASK = max(0, cellSizeASK - insetASK * 2);

      return [
        { xASK, yASK },
        { xASK: xASK + sizeASK, yASK },
        { xASK: xASK + sizeASK, yASK: yASK + sizeASK },
        { xASK, yASK: yASK + sizeASK }
      ];
    },

    getCellEdgeSegmentsASK(cellASK) {
      let xASK = mazeOriginXASK + cellASK.colASK * cellSizeASK;
      let yASK = mazeOriginYASK + cellASK.rowASK * cellSizeASK;
      let rectNeighborsASK = this.getRectNeighborsASK(cellASK);

      return [
        {
          neighborASK: rectNeighborsASK.topASK,
          axASK: xASK,
          ayASK: yASK,
          bxASK: xASK + cellSizeASK,
          byASK: yASK
        },
        {
          neighborASK: rectNeighborsASK.rightASK,
          axASK: xASK + cellSizeASK,
          ayASK: yASK,
          bxASK: xASK + cellSizeASK,
          byASK: yASK + cellSizeASK
        },
        {
          neighborASK: rectNeighborsASK.bottomASK,
          axASK: xASK,
          ayASK: yASK + cellSizeASK,
          bxASK: xASK + cellSizeASK,
          byASK: yASK + cellSizeASK
        },
        {
          neighborASK: rectNeighborsASK.leftASK,
          axASK: xASK,
          ayASK: yASK,
          bxASK: xASK,
          byASK: yASK + cellSizeASK
        }
      ];
    },

    getBorderSegmentsASK() {
      return [
        {
          axASK: mazeOriginXASK,
          ayASK: mazeOriginYASK,
          bxASK: mazeOriginXASK + mazeWidthASK,
          byASK: mazeOriginYASK
        },
        {
          axASK: mazeOriginXASK + mazeWidthASK,
          ayASK: mazeOriginYASK,
          bxASK: mazeOriginXASK + mazeWidthASK,
          byASK: mazeOriginYASK + mazeHeightASK
        },
        {
          axASK: mazeOriginXASK + mazeWidthASK,
          ayASK: mazeOriginYASK + mazeHeightASK,
          bxASK: mazeOriginXASK,
          byASK: mazeOriginYASK + mazeHeightASK
        },
        {
          axASK: mazeOriginXASK,
          ayASK: mazeOriginYASK + mazeHeightASK,
          bxASK: mazeOriginXASK,
          byASK: mazeOriginYASK
        }
      ];
    }
  };
}

function makeHexTopologyASK() {
  const sqrtThreeASK = sqrt(3);
  const hexRadiusASK = min(
    mazeWidthNormASK / (sqrtThreeASK * (colsMazeASK + 0.5)),
    mazeHeightNormASK / (rowsMazeASK * 1.5 + 0.5)
  );
  const hexWidthASK = sqrtThreeASK * hexRadiusASK;
  const mazeWidthASK = hexWidthASK * (colsMazeASK + 0.5);
  const mazeHeightASK = hexRadiusASK * (rowsMazeASK * 1.5 + 0.5);

  cellSizeASK = hexRadiusASK;
  mazeOriginXASK = -mazeWidthASK * 0.5;
  mazeOriginYASK = isSquareCompositionASK()
    ? -mazeHeightASK * 0.5
    : -mazeHeightASK * 0.42;

  function getOffsetNeighborsASK(cellASK) {
    let rowOffsetASK = cellASK.rowASK % 2 === 0 ? 0 : 1;

    return {
      topRightASK: getCellASK(cellASK.colASK + rowOffsetASK, cellASK.rowASK - 1),
      rightASK: getCellASK(cellASK.colASK + 1, cellASK.rowASK),
      bottomRightASK: getCellASK(cellASK.colASK + rowOffsetASK, cellASK.rowASK + 1),
      bottomLeftASK: getCellASK(cellASK.colASK - 1 + rowOffsetASK, cellASK.rowASK + 1),
      leftASK: getCellASK(cellASK.colASK - 1, cellASK.rowASK),
      topLeftASK: getCellASK(cellASK.colASK - 1 + rowOffsetASK, cellASK.rowASK - 1)
    };
  }

  function getHexCenterASK(cellASK) {
    return {
      x: mazeOriginXASK + hexWidthASK * (cellASK.colASK + 0.5 * (cellASK.rowASK % 2)) + hexWidthASK * 0.5,
      y: mazeOriginYASK + cellASK.rowASK * hexRadiusASK * 1.5 + hexRadiusASK
    };
  }

  function getHexPolygonASK(cellASK, insetASK = 0) {
    let centerASK = getHexCenterASK(cellASK);
    let radiusASK = max(0, hexRadiusASK - insetASK);
    let halfWidthASK = sqrtThreeASK * 0.5 * radiusASK;

    return [
      { xASK: centerASK.x, yASK: centerASK.y - radiusASK },
      { xASK: centerASK.x + halfWidthASK, yASK: centerASK.y - radiusASK * 0.5 },
      { xASK: centerASK.x + halfWidthASK, yASK: centerASK.y + radiusASK * 0.5 },
      { xASK: centerASK.x, yASK: centerASK.y + radiusASK },
      { xASK: centerASK.x - halfWidthASK, yASK: centerASK.y + radiusASK * 0.5 },
      { xASK: centerASK.x - halfWidthASK, yASK: centerASK.y - radiusASK * 0.5 }
    ];
  }

  return {
    modeASK: "hex",

    getNeighborCellASK(cellASK, directionASK) {
      if (!cellASK) return null;
      let neighborsASK = getOffsetNeighborsASK(cellASK);
      return neighborsASK[directionASK] || null;
    },

    getRectNeighborsASK() {
      return {
        topASK: null,
        rightASK: null,
        bottomASK: null,
        leftASK: null
      };
    },

    getNeighborsASK(cellASK) {
      if (!cellASK) return [];
      let neighborsASK = getOffsetNeighborsASK(cellASK);

      return [
        neighborsASK.topRightASK,
        neighborsASK.rightASK,
        neighborsASK.bottomRightASK,
        neighborsASK.bottomLeftASK,
        neighborsASK.leftASK,
        neighborsASK.topLeftASK
      ].filter(Boolean);
    },

    getBinaryTreeCandidatesASK(cellASK) {
      if (!cellASK) return [];
      let neighborsASK = getOffsetNeighborsASK(cellASK);
      return [
        neighborsASK.topRightASK,
        neighborsASK.rightASK
      ];
    },

    getKruskalEdgesASK(cellASK) {
      if (!cellASK) return [];
      let neighborsASK = getOffsetNeighborsASK(cellASK);
      let edgesASK = [];

      if (neighborsASK.rightASK) {
        edgesASK.push({
          cellAASK: cellASK,
          cellBASK: neighborsASK.rightASK
        });
      }

      if (neighborsASK.bottomRightASK) {
        edgesASK.push({
          cellAASK: cellASK,
          cellBASK: neighborsASK.bottomRightASK
        });
      }

      if (neighborsASK.bottomLeftASK) {
        edgesASK.push({
          cellAASK: cellASK,
          cellBASK: neighborsASK.bottomLeftASK
        });
      }

      return edgesASK;
    },

    areAdjacentCellsASK(cellAASK, cellBASK) {
      if (!cellAASK || !cellBASK) return false;
      return this.getNeighborsASK(cellAASK).includes(cellBASK);
    },

    getCellCenterASK(cellASK) {
      return getHexCenterASK(cellASK);
    },

    getCellPolygonASK(cellASK, insetASK = 0) {
      return getHexPolygonASK(cellASK, insetASK);
    },

    getCellEdgeSegmentsASK(cellASK) {
      let polygonASK = getHexPolygonASK(cellASK);
      let neighborsASK = getOffsetNeighborsASK(cellASK);

      return [
        {
          neighborASK: neighborsASK.topRightASK,
          axASK: polygonASK[0].xASK,
          ayASK: polygonASK[0].yASK,
          bxASK: polygonASK[1].xASK,
          byASK: polygonASK[1].yASK
        },
        {
          neighborASK: neighborsASK.rightASK,
          axASK: polygonASK[1].xASK,
          ayASK: polygonASK[1].yASK,
          bxASK: polygonASK[2].xASK,
          byASK: polygonASK[2].yASK
        },
        {
          neighborASK: neighborsASK.bottomRightASK,
          axASK: polygonASK[2].xASK,
          ayASK: polygonASK[2].yASK,
          bxASK: polygonASK[3].xASK,
          byASK: polygonASK[3].yASK
        },
        {
          neighborASK: neighborsASK.bottomLeftASK,
          axASK: polygonASK[3].xASK,
          ayASK: polygonASK[3].yASK,
          bxASK: polygonASK[4].xASK,
          byASK: polygonASK[4].yASK
        },
        {
          neighborASK: neighborsASK.leftASK,
          axASK: polygonASK[4].xASK,
          ayASK: polygonASK[4].yASK,
          bxASK: polygonASK[5].xASK,
          byASK: polygonASK[5].yASK
        },
        {
          neighborASK: neighborsASK.topLeftASK,
          axASK: polygonASK[5].xASK,
          ayASK: polygonASK[5].yASK,
          bxASK: polygonASK[0].xASK,
          byASK: polygonASK[0].yASK
        }
      ];
    },

    getBorderSegmentsASK() {
      let borderSegmentsASK = [];

      for (let rowASK = 0; rowASK < rowsMazeASK; rowASK++) {
        for (let colASK = 0; colASK < colsMazeASK; colASK++) {
          let edgeSegmentsASK = this.getCellEdgeSegmentsASK(mazeASK[rowASK][colASK]);

          for (let edgeASK of edgeSegmentsASK) {
            if (!edgeASK.neighborASK) {
              borderSegmentsASK.push(edgeASK);
            }
          }
        }
      }

      return borderSegmentsASK;
    }
  };
}

function makeTriangleTopologyASK() {
  const sqrtThreeASK = sqrt(3);
  const triangleHeightASKFactorASK = sqrtThreeASK * 0.5;
  const triangleSideASK = min(
    (mazeWidthNormASK * 2) / (colsMazeASK + 1),
    mazeHeightNormASK / (rowsMazeASK * triangleHeightASKFactorASK)
  );
  const triangleHeightASK = triangleSideASK * triangleHeightASKFactorASK;
  const mazeWidthASK = triangleSideASK * (colsMazeASK + 1) * 0.5;
  const mazeHeightASK = triangleHeightASK * rowsMazeASK;

  cellSizeASK = triangleSideASK;
  mazeOriginXASK = -mazeWidthASK * 0.5;
  mazeOriginYASK = isSquareCompositionASK()
    ? -mazeHeightASK * 0.5
    : -mazeHeightASK * 0.42;

  function isUpTriangleASK(cellASK) {
    return (cellASK.colASK + cellASK.rowASK) % 2 === 0;
  }

  function getTriangleNeighborsASK(cellASK) {
    let isUpASK = isUpTriangleASK(cellASK);
    let verticalASK = isUpASK
      ? getCellASK(cellASK.colASK, cellASK.rowASK + 1)
      : getCellASK(cellASK.colASK, cellASK.rowASK - 1);

    return {
      topASK: isUpASK ? null : verticalASK,
      rightASK: getCellASK(cellASK.colASK + 1, cellASK.rowASK),
      bottomASK: isUpASK ? verticalASK : null,
      leftASK: getCellASK(cellASK.colASK - 1, cellASK.rowASK),
      verticalASK
    };
  }

  function getTriangleMidXASK(cellASK) {
    return mazeOriginXASK + triangleSideASK * (cellASK.colASK + 1) * 0.5;
  }

  function getTriangleTopYASK(cellASK) {
    return mazeOriginYASK + cellASK.rowASK * triangleHeightASK;
  }

  function getTriangleCenterASK(cellASK) {
    let isUpASK = isUpTriangleASK(cellASK);
    return {
      x: getTriangleMidXASK(cellASK),
      y: getTriangleTopYASK(cellASK) + triangleHeightASK * (isUpASK ? 2 / 3 : 1 / 3)
    };
  }

  function insetTrianglePolygonASK(polygonASK, centerASK, insetASK) {
    if (insetASK <= 0) return polygonASK;

    return polygonASK.map((pointASK) => {
      let dxASK = pointASK.xASK - centerASK.x;
      let dyASK = pointASK.yASK - centerASK.y;
      let distanceASK = sqrt(dxASK * dxASK + dyASK * dyASK);

      if (distanceASK === 0) return pointASK;

      let scaleASK = max(0, (distanceASK - insetASK) / distanceASK);
      return {
        xASK: centerASK.x + dxASK * scaleASK,
        yASK: centerASK.y + dyASK * scaleASK
      };
    });
  }

  function getTrianglePolygonASK(cellASK, insetASK = 0) {
    let midXASK = getTriangleMidXASK(cellASK);
    let topYASK = getTriangleTopYASK(cellASK);
    let isUpASK = isUpTriangleASK(cellASK);

    let polygonASK = isUpASK
      ? [
          { xASK: midXASK, yASK: topYASK },
          { xASK: midXASK + triangleSideASK * 0.5, yASK: topYASK + triangleHeightASK },
          { xASK: midXASK - triangleSideASK * 0.5, yASK: topYASK + triangleHeightASK }
        ]
      : [
          { xASK: midXASK - triangleSideASK * 0.5, yASK: topYASK },
          { xASK: midXASK + triangleSideASK * 0.5, yASK: topYASK },
          { xASK: midXASK, yASK: topYASK + triangleHeightASK }
        ];

    return insetTrianglePolygonASK(polygonASK, getTriangleCenterASK(cellASK), insetASK);
  }

  return {
    modeASK: "triangle",

    getNeighborCellASK(cellASK, directionASK) {
      if (!cellASK) return null;
      let neighborsASK = getTriangleNeighborsASK(cellASK);
      return neighborsASK[directionASK] || null;
    },

    getRectNeighborsASK(cellASK) {
      let neighborsASK = getTriangleNeighborsASK(cellASK);
      return {
        topASK: neighborsASK.topASK,
        rightASK: neighborsASK.rightASK,
        bottomASK: neighborsASK.bottomASK,
        leftASK: neighborsASK.leftASK
      };
    },

    getNeighborsASK(cellASK) {
      if (!cellASK) return [];
      let neighborsASK = getTriangleNeighborsASK(cellASK);

      return [
        neighborsASK.leftASK,
        neighborsASK.rightASK,
        neighborsASK.verticalASK
      ].filter(Boolean);
    },

    getBinaryTreeCandidatesASK(cellASK) {
      if (!cellASK) return [];

      let neighborsASK = getTriangleNeighborsASK(cellASK);
      let horizontalASK = cellASK.rowASK % 2 === 0
        ? neighborsASK.rightASK
        : neighborsASK.leftASK;
      let verticalASK = isUpTriangleASK(cellASK)
        ? null
        : neighborsASK.topASK;

      return [verticalASK, horizontalASK];
    },

    getKruskalEdgesASK(cellASK) {
      if (!cellASK) return [];

      let neighborsASK = getTriangleNeighborsASK(cellASK);
      let edgesASK = [];

      if (neighborsASK.rightASK) {
        edgesASK.push({
          cellAASK: cellASK,
          cellBASK: neighborsASK.rightASK
        });
      }

      if (neighborsASK.verticalASK) {
        edgesASK.push({
          cellAASK: cellASK,
          cellBASK: neighborsASK.verticalASK
        });
      }

      return edgesASK;
    },

    areAdjacentCellsASK(cellAASK, cellBASK) {
      if (!cellAASK || !cellBASK) return false;
      return this.getNeighborsASK(cellAASK).includes(cellBASK);
    },

    getCellCenterASK(cellASK) {
      return getTriangleCenterASK(cellASK);
    },

    getCellPolygonASK(cellASK, insetASK = 0) {
      return getTrianglePolygonASK(cellASK, insetASK);
    },

    getCellEdgeSegmentsASK(cellASK) {
      let polygonASK = getTrianglePolygonASK(cellASK);
      let neighborsASK = getTriangleNeighborsASK(cellASK);

      if (isUpTriangleASK(cellASK)) {
        return [
          {
            neighborASK: neighborsASK.rightASK,
            axASK: polygonASK[0].xASK,
            ayASK: polygonASK[0].yASK,
            bxASK: polygonASK[1].xASK,
            byASK: polygonASK[1].yASK
          },
          {
            neighborASK: neighborsASK.bottomASK,
            axASK: polygonASK[1].xASK,
            ayASK: polygonASK[1].yASK,
            bxASK: polygonASK[2].xASK,
            byASK: polygonASK[2].yASK
          },
          {
            neighborASK: neighborsASK.leftASK,
            axASK: polygonASK[2].xASK,
            ayASK: polygonASK[2].yASK,
            bxASK: polygonASK[0].xASK,
            byASK: polygonASK[0].yASK
          }
        ];
      }

      return [
        {
          neighborASK: neighborsASK.leftASK,
          axASK: polygonASK[0].xASK,
          ayASK: polygonASK[0].yASK,
          bxASK: polygonASK[2].xASK,
          byASK: polygonASK[2].yASK
        },
        {
          neighborASK: neighborsASK.rightASK,
          axASK: polygonASK[2].xASK,
          ayASK: polygonASK[2].yASK,
          bxASK: polygonASK[1].xASK,
          byASK: polygonASK[1].yASK
        },
        {
          neighborASK: neighborsASK.topASK,
          axASK: polygonASK[1].xASK,
          ayASK: polygonASK[1].yASK,
          bxASK: polygonASK[0].xASK,
          byASK: polygonASK[0].yASK
        }
      ];
    },

    getBorderSegmentsASK() {
      let borderSegmentsASK = [];

      for (let rowASK = 0; rowASK < rowsMazeASK; rowASK++) {
        for (let colASK = 0; colASK < colsMazeASK; colASK++) {
          let edgeSegmentsASK = this.getCellEdgeSegmentsASK(mazeASK[rowASK][colASK]);

          for (let edgeASK of edgeSegmentsASK) {
            if (!edgeASK.neighborASK) {
              borderSegmentsASK.push(edgeASK);
            }
          }
        }
      }

      return borderSegmentsASK;
    }
  };
}

function getNeighborCellASK(cellASK, directionASK) {
  return topologyASK.getNeighborCellASK(cellASK, directionASK);
}

function getRectNeighborsASK(cellASK) {
  return topologyASK.getRectNeighborsASK(cellASK);
}

function getNeighborCellsASK(cellASK) {
  return topologyASK.getNeighborsASK(cellASK);
}

function getBinaryTreeCandidatesASK(cellASK) {
  return topologyASK.getBinaryTreeCandidatesASK(cellASK);
}

function getKruskalEdgesASK() {
  let edgesASK = [];

  for (let rowASK = 0; rowASK < rowsMazeASK; rowASK++) {
    for (let colASK = 0; colASK < colsMazeASK; colASK++) {
      edgesASK.push(...topologyASK.getKruskalEdgesASK(mazeASK[rowASK][colASK]));
    }
  }

  return edgesASK;
}

function getUnvisitedNeighborsASK(cellASK) {
  if (!cellASK) return [];
  return getNeighborCellsASK(cellASK).filter(
    (neighborASK) => !neighborASK.visitedASK
  );
}

function getVisitedNeighborsASK(cellASK) {
  return getNeighborCellsASK(cellASK).filter(
    (neighborASK) => neighborASK.visitedASK
  );
}

function minVisitedNeighborDepthASK(neighborsASK) {
  let minDepthASK = Infinity;
  for (let neighborASK of neighborsASK) {
    minDepthASK = min(minDepthASK, neighborASK.depthASK);
  }
  return minDepthASK === Infinity ? 0 : minDepthASK;
}

function getCellASK(colASK, rowASK) {
  if (
    colASK < 0 ||
    colASK >= colsMazeASK ||
    rowASK < 0 ||
    rowASK >= rowsMazeASK
  ) {
    return null;
  }
  return mazeASK[rowASK][colASK];
}

function areAdjacentCellsASK(cellAASK, cellBASK) {
  return topologyASK.areAdjacentCellsASK(cellAASK, cellBASK);
}

function makeLinkKeyASK(cellAASK, cellBASK) {
  let keyAASK = cellKeyASK(cellAASK);
  let keyBASK = cellKeyASK(cellBASK);
  return keyAASK < keyBASK
    ? keyAASK + "|" + keyBASK
    : keyBASK + "|" + keyAASK;
}

function linkCellsASK(cellAASK, cellBASK) {
  if (!areAdjacentCellsASK(cellAASK, cellBASK)) return;
  mazeStateASK.linksASK.add(makeLinkKeyASK(cellAASK, cellBASK));
}

function areCellsLinkedASK(cellAASK, cellBASK) {
  if (!areAdjacentCellsASK(cellAASK, cellBASK)) return false;
  return mazeStateASK.linksASK.has(makeLinkKeyASK(cellAASK, cellBASK));
}

function removeWallsASK(cellAASK, cellBASK) {
  linkCellsASK(cellAASK, cellBASK);
}

function getRandomUnvisitedCellASK() {
  let optionsASK = [];
  for (let rowASK = 0; rowASK < rowsMazeASK; rowASK++) {
    for (let colASK = 0; colASK < colsMazeASK; colASK++) {
      let cellASK = mazeASK[rowASK][colASK];
      if (!cellASK.visitedASK) optionsASK.push(cellASK);
    }
  }
  return optionsASK.length > 0 ? random(optionsASK) : null;
}

function cellKeyASK(cellASK) {
  return cellASK.colASK + "," + cellASK.rowASK;
}

function setAlgorithmASK(nameASK) {
  algorithmASK = nameASK;
  manualColsASK = null;
  manualRowsASK = null;
  initializeMazeASK();
}

function setTopologyASK(modeASK) {
  topologyModeASK =
    modeASK === "hex" || modeASK === "triangle"
      ? modeASK
      : "rect";
  manualColsASK = null;
  manualRowsASK = null;
  initializeMazeASK();
}

function isHexEnabledAlgorithmASK() {
  return (
    algorithmASK === "recursiveBacktracker" ||
    algorithmASK === "binaryTree" ||
    algorithmASK === "prim" ||
    algorithmASK === "aldousBroder" ||
    algorithmASK === "wilson" ||
    algorithmASK === "kruskal"
  );
}

function isTriangleEnabledAlgorithmASK() {
  return (
    algorithmASK === "recursiveBacktracker" ||
    algorithmASK === "binaryTree" ||
    algorithmASK === "prim" ||
    algorithmASK === "aldousBroder" ||
    algorithmASK === "wilson" ||
    algorithmASK === "kruskal"
  );
}

function getActiveTopologyModeASK() {
  if (topologyModeASK === "hex" && isHexEnabledAlgorithmASK()) {
    return "hex";
  }
  if (topologyModeASK === "triangle" && isTriangleEnabledAlgorithmASK()) {
    return "triangle";
  }
  return "rect";
}

function shuffleArrayASK(arrayASK) {
  for (let iASK = arrayASK.length - 1; iASK > 0; iASK--) {
    let jASK = floor(random(iASK + 1));
    let tempASK = arrayASK[iASK];
    arrayASK[iASK] = arrayASK[jASK];
    arrayASK[jASK] = tempASK;
  }
}

// =====================================================
// DRAWING
// =====================================================

function drawVisitedFieldsASK() {
  noStroke();

  for (let rowASK = 0; rowASK < rowsMazeASK; rowASK++) {
    for (let colASK = 0; colASK < colsMazeASK; colASK++) {
      let cellASK = mazeASK[rowASK][colASK];
      if (!cellASK.visitedASK) continue;

      let tASK =
        cellASK.visitOrderASK <= 0
          ? 0
          : cellASK.visitOrderASK / max(1, visitOrderCounterASK - 1);

      let fillColorASK = colorLerpASK(
        color2ASK,
        color3ASK,
        tASK,
        mazeCompleteASK ? 34 : 20
      );

      fill(
        red(fillColorASK),
        green(fillColorASK),
        blue(fillColorASK),
        alpha(fillColorASK)
      );

      drawCellPolygonASK(topologyASK.getCellPolygonASK(cellASK));
    }
  }

  noFill();
}

function drawWallsASK() {
  strokeWeight(weightASK);

  for (let rowASK = 0; rowASK < rowsMazeASK; rowASK++) {
    for (let colASK = 0; colASK < colsMazeASK; colASK++) {
      drawCellWallsASK(mazeASK[rowASK][colASK]);
    }
  }
}

function drawCellWallsASK(cellASK) {
  let edgeSegmentsASK = topologyASK.getCellEdgeSegmentsASK(cellASK);

  let mixASK = getEdgeMixASK(cellASK);
  let wallColorASK = colorLerpASK(color1ASK, color4ASK, mixASK, 255);

  stroke(
    red(wallColorASK),
    green(wallColorASK),
    blue(wallColorASK),
    alpha(wallColorASK)
  );

  for (let edgeASK of edgeSegmentsASK) {
    if (!edgeASK.neighborASK || !areCellsLinkedASK(cellASK, edgeASK.neighborASK)) {
      line(edgeASK.axASK, edgeASK.ayASK, edgeASK.bxASK, edgeASK.byASK);
    }
  }
}

function drawWilsonWalkOverlayASK() {
  if (algorithmASK !== "wilson") return;
  if (wilsonModeASK !== "walk" && wilsonModeASK !== "carve") return;
  if (wilsonWalkASK.length < 2) return;

  stroke(red(color4ASK), green(color4ASK), blue(color4ASK), 80);
  strokeWeight(weightASK * 2.0);

  for (let iASK = 0; iASK < wilsonWalkASK.length - 1; iASK++) {
    let aASK = wilsonWalkASK[iASK];
    let bASK = wilsonWalkASK[iASK + 1];
    let centerAASK = topologyASK.getCellCenterASK(aASK);
    let centerBASK = topologyASK.getCellCenterASK(bASK);

    line(centerAASK.x, centerAASK.y, centerBASK.x, centerBASK.y);
  }
}

function getEdgeMixASK(cellASK) {
  let nxASK = colsMazeASK <= 1 ? 0.5 : cellASK.colASK / (colsMazeASK - 1);
  let nyASK = rowsMazeASK <= 1 ? 0.5 : cellASK.rowASK / (rowsMazeASK - 1);

  let dxASK = abs(nxASK - 0.5) * 2.0;
  let dyASK = abs(nyASK - 0.5) * 2.0;
  return constrain((dxASK + dyASK) * 0.35, 0, 1);
}

function drawCurrentCellASK() {
  if (!currentCellASK || mazeCompleteASK) return;

  noStroke();
  fill(red(color4ASK), green(color4ASK), blue(color4ASK), 120);
  drawCellPolygonASK(topologyASK.getCellPolygonASK(currentCellASK, cellSizeASK * 0.12));
  noFill();
}

function drawBorderASK() {
  stroke(red(color4ASK), green(color4ASK), blue(color4ASK), 90);
  strokeWeight(weightASK * 2.0);
  noFill();

  let borderSegmentsASK = topologyASK.getBorderSegmentsASK();
  for (let segmentASK of borderSegmentsASK) {
    line(segmentASK.axASK, segmentASK.ayASK, segmentASK.bxASK, segmentASK.byASK);
  }
}

function drawLabOverlayASK() {
  let overlayXASK = mazeOriginXASK;
  let overlayYASK = mazeOriginYASK - 0.04;

  noStroke();
  fill(red(color1ASK), green(color1ASK), blue(color1ASK), 160);
  textAlign(LEFT, TOP);
  textSize(0.018);
  text(
    algorithmLabelASK +
      "  //  " +
      getActiveTopologyModeASK() +
      "  //  " +
      colsMazeASK +
      "x" +
      rowsMazeASK +
      "  //  speed " +
      stepsPerFrameASK,
    overlayXASK,
    overlayYASK
  );
  noFill();
}

// =====================================================
// COLOR SYSTEM
// =====================================================

function initColorsASK() {
  colorsASK = [
    color(255, 255, 255),
    color(139, 121, 162),
    color(164, 146, 200),
    color(226, 211, 240),
    color(139, 121, 162),
    color(132, 80, 155),
    color(114, 85, 131),
    color(190, 63, 246),
    color(193, 154, 216),
    color(164, 146, 200),
    color(174, 135, 194)
  ];
}

function renderColorsASK() {
  // Stronger floor for the active cell, border, and overlay role against the background.
  const color4FloorASK = 95;
  // Lighter floor for wall readability without forcing every reroll into high contrast.
  const color1FloorASK = 52;

  colorBackgroundASK = pickPaletteColorASK(
    (candidateASK) => !isBannedBackgroundColorASK(candidateASK)
  );
  color4ASK = pickPaletteColorASK(
    (candidateASK) => colorDistanceASK(colorBackgroundASK, candidateASK) >= color4FloorASK,
    (candidateASK) => colorDistanceASK(colorBackgroundASK, candidateASK)
  );
  color1ASK = pickPaletteColorASK(
    (candidateASK) => colorDistanceASK(colorBackgroundASK, candidateASK) >= color1FloorASK,
    (candidateASK) => colorDistanceASK(colorBackgroundASK, candidateASK)
  );
  color2ASK = random(colorsASK);
  color3ASK = random(colorsASK);
}

function isBannedBackgroundColorASK(colorASK) {
  return (
    red(colorASK) === 190 &&
    green(colorASK) === 63 &&
    blue(colorASK) === 246
  );
}

function colorDistanceASK(colorAASK, colorBASK) {
  let drASK = red(colorAASK) - red(colorBASK);
  let dgASK = green(colorAASK) - green(colorBASK);
  let dbASK = blue(colorAASK) - blue(colorBASK);
  return sqrt(drASK * drASK + dgASK * dgASK + dbASK * dbASK);
}

function pickPaletteColorASK(isValidASK, scoreASK = null) {
  let validColorsASK = colorsASK.filter(isValidASK);
  if (validColorsASK.length > 0) {
    return random(validColorsASK);
  }

  if (!scoreASK) {
    return random(colorsASK);
  }

  let bestScoreASK = -Infinity;
  let fallbackColorsASK = [];

  for (let candidateASK of colorsASK) {
    let candidateScoreASK = scoreASK(candidateASK);

    if (candidateScoreASK > bestScoreASK) {
      bestScoreASK = candidateScoreASK;
      fallbackColorsASK = [candidateASK];
    } else if (candidateScoreASK === bestScoreASK) {
      fallbackColorsASK.push(candidateASK);
    }
  }

  return random(fallbackColorsASK);
}

// =====================================================
// INTERACTION
// =====================================================

function mousePressed() {
  mousePressedASK = true;
  dragStartASK = screenToASK(mouseX, mouseY);
  dragCurrentASK = screenToASK(mouseX, mouseY);
  dragLengthASK = 0;
  dragVectorASK = { x: 0, y: 0 };
}

function mouseDragged() {
  if (!mousePressedASK || !dragStartASK) return;

  dragCurrentASK = screenToASK(mouseX, mouseY);
  dragVectorASK = {
    x: dragCurrentASK.x - dragStartASK.x,
    y: dragCurrentASK.y - dragStartASK.y
  };

  dragLengthASK = dist(
    dragStartASK.x,
    dragStartASK.y,
    dragCurrentASK.x,
    dragCurrentASK.y
  );

  let dragAmountASK = constrain(abs(dragVectorASK.x) * 240, 1, 240);
  stepsPerFrameASK = floor(dragAmountASK);
}

function mouseReleased() {
  let wasClickASK = dragLengthASK < 0.015;

  if (wasClickASK) {
    renderColorsASK();
    initializeMazeASK();
  }

  mousePressedASK = false;
  dragStartASK = null;
  dragCurrentASK = null;
  dragLengthASK = 0;
  dragVectorASK = { x: 0, y: 0 };
}

// =====================================================
// KEYBOARD
// =====================================================

function keyPressed() {
  if (key === "r" || key === "R") {
    renderColorsASK();
  }

  if (key === " ") {
    initializeMazeASK();
  }

  if (key === "h" || key === "H") {
    setTopologyASK(topologyModeASK === "hex" ? "rect" : "hex");
  }

  if (key === "t" || key === "T") {
    setTopologyASK(topologyModeASK === "triangle" ? "rect" : "triangle");
  }

  if (key === "1") setAlgorithmASK("recursiveBacktracker");
  if (key === "2") setAlgorithmASK("binaryTree");
  if (key === "3") setAlgorithmASK("prim");
  if (key === "4") setAlgorithmASK("sidewinder");
  if (key === "5") setAlgorithmASK("eller");
  if (key === "6") setAlgorithmASK("kruskal");
  if (key === "7") setAlgorithmASK("wilson");
  if (key === "8") setAlgorithmASK("aldousBroder");

  if (key === "[") {
    colsMazeASK = max(8, colsMazeASK - 2);
    rowsMazeASK = max(8, rowsMazeASK - 2);
    manualColsASK = colsMazeASK;
    manualRowsASK = rowsMazeASK;
    initializeMazeASK();
  }

  if (key === "]") {
    colsMazeASK = min(120, colsMazeASK + 2);
    rowsMazeASK = min(120, rowsMazeASK + 2);
    manualColsASK = colsMazeASK;
    manualRowsASK = rowsMazeASK;
    initializeMazeASK();
  }

  if (key === "-") {
    stepsPerFrameASK = max(1, stepsPerFrameASK - 1);
  }

  if (key === "=" || key === "+") {
    stepsPerFrameASK = min(240, stepsPerFrameASK + 1);
  }

  if (key === "o" || key === "O") {
    outputASK = !outputASK;
    applyCanvasSizeASK();
    initializeMazeASK();
  }

  if (key === "p" || key === "P") {
    aspectModeASK = aspectModeASK === "square" ? "widescreen" : "square";
    if (outputASK) {
      applyCanvasSizeASK();
      initializeMazeASK();
    }
  }
}

function windowResized() {
  if (!outputASK) {
    applyCanvasSizeASK();
    initializeMazeASK();
  }
}

// =====================================================
// OPTIONAL HELPERS
// =====================================================

function colorLerpASK(colorAASK, colorBASK, amtASK, alphaASK = 255) {
  let mixedASK = lerpColor(colorAASK, colorBASK, amtASK);
  return color(
    red(mixedASK),
    green(mixedASK),
    blue(mixedASK),
    alphaASK
  );
}

function drawCellPolygonASK(pointsASK) {
  beginShape();
  for (let pointASK of pointsASK) {
    vertex(pointASK.xASK, pointASK.yASK);
  }
  endShape(CLOSE);
}
