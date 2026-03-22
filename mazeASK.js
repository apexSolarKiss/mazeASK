// Copyright (c) 2026 >> Andrew S Klug // ASK
// Licensed under the Apache License, Version 2.0

// =====================================================
// mazeASK 2 // ASK p5.js Maze Lab
// template 2 version
// - viewing mode vs output mode
// - clean algorithm comparison
// - implemented:
//   1 Recursive Backtracker
//   2 Binary Tree
//   3 Prim
//   4 Sidewinder
//   5 Eller
//   6 Kruskal
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

So the real lesson is not "memorize 6 algorithms".
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

=====================================================
WHAT TO NOTICE WHILE PLAYING
=====================================================

When you press keys 1-6, do not just ask:
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

let layersASK = [];
let nodesASK = [];

let zoomASK = 1.0;
let centerXASK = 0.5;
let centerYASK = 0.5;

// =====================================================
// MAZE LAB STATE
// =====================================================

let mazeASK = [];
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
  if (isSquareCompositionASK()) {
    zoomASK = 1.0;
    centerXASK = 0.5;
    centerYASK = 0.5;
    mazeWidthNormASK = 0.78;
    mazeHeightNormASK = 0.78;

    if (manualColsASK === null || manualRowsASK === null) {
      if (algorithmASK === "sidewinder" || algorithmASK === "eller") {
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
      if (algorithmASK === "sidewinder" || algorithmASK === "eller") {
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
  stackASK = [];
  frontierASK = [];
  sidewinderRunASK = [];
  mazeCompleteASK = false;
  currentCellASK = null;
  visitOrderCounterASK = 0;
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

  for (let rowASK = 0; rowASK < rowsMazeASK; rowASK++) {
    let rowCellsASK = [];
    for (let colASK = 0; colASK < colsMazeASK; colASK++) {
      rowCellsASK.push(makeCellASK(colASK, rowASK));
    }
    mazeASK.push(rowCellsASK);
  }

  setupAlgorithmASK();
}

function makeCellASK(colASK, rowASK) {
  return {
    colASK,
    rowASK,
    visitedASK: false,
    frontierASK: false,
    depthASK: -1,
    visitOrderASK: -1,
    wallsASK: {
      topASK: true,
      rightASK: true,
      bottomASK: true,
      leftASK: true
    }
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
  //
  // Note:
  // This is depth-first search with backtracking.
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
  // In this sketch, each cell tries north or east.
  //
  // Pros:
  // - super simple
  // - very fast
  // - easy to code
  //
  // Cons:
  // - strongly biased
  // - mazes can feel artificial
  // - some directions get favored too much
  else if (algorithmASK === "binaryTree") {
    algorithmLabelASK = "Binary Tree";
  }

  // --------------------------------------------------
  // PRIM
  // --------------------------------------------------
  // Start somewhere. Then grow the maze from the edge
  // of the part you already built.
  //
  // It is like building a snowball bigger by adding
  // new pieces around the outside.
  //
  // Pros:
  // - feels more evenly spread out
  // - grows outward in a nice way
  // - good comparison against backtracker
  //
  // Cons:
  // - does not make corridors as long and dramatic
  // - often makes lots of short dead ends
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
  //
  // Pros:
  // - simple but more interesting than Binary Tree
  // - makes nice horizontal runs
  //
  // Cons:
  // - still has a directional bias
  // - can look row-ish and structured
  else if (algorithmASK === "sidewinder") {
    algorithmLabelASK = "Sidewinder";
    sidewinderRowASK = 0;
    sidewinderColASK = 0;
    sidewinderRunASK = [];
  }

  // --------------------------------------------------
  // ELLER
  // --------------------------------------------------
  // Build one row at a time while remembering which
  // cells are already connected.
  //
  // Pros:
  // - memory efficient
  // - teaches connectivity sets
  // - elegant row-by-row logic
  //
  // Cons:
  // - harder to understand
  // - more bookkeeping
  else if (algorithmASK === "eller") {
    algorithmLabelASK = "Eller";
    initializeEllerASK();
  }

  // --------------------------------------------------
  // KRUSKAL
  // --------------------------------------------------
  // Look at possible walls and remove only the ones
  // that join two different regions.
  //
  // Pros:
  // - great for learning cycle avoidance
  // - graph-theoretic
  // - clean logic
  //
  // Cons:
  // - abstract bookkeeping
  // - needs disjoint-set tracking
  else if (algorithmASK === "kruskal") {
    algorithmLabelASK = "Kruskal";
    initializeKruskalASK();
  }
}

// =====================================================
// MAZE UPDATE
// =====================================================

function updateMazeASK() {
  if (mazeCompleteASK) return;

  // binary tree completes instantly
  if (algorithmASK === "binaryTree") {
    runBinaryTreeASK();
    mazeCompleteASK = true;
    return;
  }

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
    }

    if (mazeCompleteASK) break;
  }
}

// =====================================================
// ALGORITHMS
// =====================================================

function stepRecursiveBacktrackerASK() {
  let neighborsASK = getUnvisitedNeighborsASK(currentCellASK);

  if (neighborsASK.length > 0) {
    let nextCellASK = random(neighborsASK);

    stackASK.push(currentCellASK);
    removeWallsASK(currentCellASK, nextCellASK);

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

      let neighborsASK = [];
      let northASK = getCellASK(colASK, rowASK - 1);
      let eastASK = getCellASK(colASK + 1, rowASK);

      if (northASK) neighborsASK.push(northASK);
      if (eastASK) neighborsASK.push(eastASK);

      if (neighborsASK.length > 0) {
        let targetASK = random(neighborsASK);
        removeWallsASK(cellASK, targetASK);
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
      if (northASK) {
        removeWallsASK(memberASK, northASK);
      }
    }
    sidewinderRunASK = [];
  } else {
    let eastASK = getCellASK(sidewinderColASK + 1, sidewinderRowASK);
    if (eastASK) {
      removeWallsASK(cellASK, eastASK);
    }
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
    let colsInSetASK = groupsASK[setIdASK];
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
    let sameSetASK = ellerSetsASK[colASK] === ellerSetsASK[colASK + 1];
    if (sameSetASK) continue;

    let shouldJoinASK;
    if (rowASK === rowsMazeASK - 1) {
      shouldJoinASK = true;
    } else {
      shouldJoinASK = random() < 0.5;
    }

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
    if (!groupsASK[setIdASK]) {
      groupsASK[setIdASK] = [];
    }
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
  let totalCellsASK = rowsMazeASK * colsMazeASK;

  kruskalParentASK = new Array(totalCellsASK);
  kruskalRankASK = new Array(totalCellsASK).fill(0);
  for (let iASK = 0; iASK < totalCellsASK; iASK++) {
    kruskalParentASK[iASK] = iASK;
  }

  kruskalWallsASK = [];
  for (let rowASK = 0; rowASK < rowsMazeASK; rowASK++) {
    for (let colASK = 0; colASK < colsMazeASK; colASK++) {
      if (colASK < colsMazeASK - 1) {
        kruskalWallsASK.push({
          aColASK: colASK,
          aRowASK: rowASK,
          bColASK: colASK + 1,
          bRowASK: rowASK
        });
      }
      if (rowASK < rowsMazeASK - 1) {
        kruskalWallsASK.push({
          aColASK: colASK,
          aRowASK: rowASK,
          bColASK: colASK,
          bRowASK: rowASK + 1
        });
      }
    }
  }

  shuffleArrayASK(kruskalWallsASK);
  kruskalStepIndexASK = 0;

  currentCellASK = mazeASK[0][0];
  markVisitedASK(currentCellASK, 0);
}

function stepKruskalASK() {
  if (kruskalStepIndexASK >= kruskalWallsASK.length) {
    markAllCellsVisitedASK();
    mazeCompleteASK = true;
    return;
  }

  let wallASK = kruskalWallsASK[kruskalStepIndexASK];
  kruskalStepIndexASK++;

  let cellAASK = getCellASK(wallASK.aColASK, wallASK.aRowASK);
  let cellBASK = getCellASK(wallASK.bColASK, wallASK.bRowASK);

  let idAASK = cellIndexASK(cellAASK.colASK, cellAASK.rowASK);
  let idBASK = cellIndexASK(cellBASK.colASK, cellBASK.rowASK);

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

function cellIndexASK(colASK, rowASK) {
  return rowASK * colsMazeASK + colASK;
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
      let depthASK = rowASK + colASK;
      markVisitedASK(mazeASK[rowASK][colASK], depthASK);
    }
  }
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

function getNeighborCellsASK(cellASK) {
  let neighborsASK = [];
  let colASK = cellASK.colASK;
  let rowASK = cellASK.rowASK;

  let topASK = getCellASK(colASK, rowASK - 1);
  let rightASK = getCellASK(colASK + 1, rowASK);
  let bottomASK = getCellASK(colASK, rowASK + 1);
  let leftASK = getCellASK(colASK - 1, rowASK);

  if (topASK) neighborsASK.push(topASK);
  if (rightASK) neighborsASK.push(rightASK);
  if (bottomASK) neighborsASK.push(bottomASK);
  if (leftASK) neighborsASK.push(leftASK);

  return neighborsASK;
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

function removeWallsASK(cellAASK, cellBASK) {
  let deltaColASK = cellBASK.colASK - cellAASK.colASK;
  let deltaRowASK = cellBASK.rowASK - cellAASK.rowASK;

  if (deltaColASK === 1) {
    cellAASK.wallsASK.rightASK = false;
    cellBASK.wallsASK.leftASK = false;
  } else if (deltaColASK === -1) {
    cellAASK.wallsASK.leftASK = false;
    cellBASK.wallsASK.rightASK = false;
  }

  if (deltaRowASK === 1) {
    cellAASK.wallsASK.bottomASK = false;
    cellBASK.wallsASK.topASK = false;
  } else if (deltaRowASK === -1) {
    cellAASK.wallsASK.topASK = false;
    cellBASK.wallsASK.bottomASK = false;
  }
}

function setAlgorithmASK(nameASK) {
  algorithmASK = nameASK;
  manualColsASK = null;
  manualRowsASK = null;
  initializeMazeASK();
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

      let xASK = mazeOriginXASK + colASK * cellSizeASK;
      let yASK = mazeOriginYASK + rowASK * cellSizeASK;

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

      rect(xASK, yASK, cellSizeASK, cellSizeASK);
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
  let xASK = mazeOriginXASK + cellASK.colASK * cellSizeASK;
  let yASK = mazeOriginYASK + cellASK.rowASK * cellSizeASK;

  let mixASK = getEdgeMixASK(cellASK);
  let wallColorASK = colorLerpASK(color1ASK, color4ASK, mixASK, 255);

  stroke(
    red(wallColorASK),
    green(wallColorASK),
    blue(wallColorASK),
    alpha(wallColorASK)
  );

  if (cellASK.wallsASK.topASK) {
    line(xASK, yASK, xASK + cellSizeASK, yASK);
  }
  if (cellASK.wallsASK.rightASK) {
    line(xASK + cellSizeASK, yASK, xASK + cellSizeASK, yASK + cellSizeASK);
  }
  if (cellASK.wallsASK.bottomASK) {
    line(xASK, yASK + cellSizeASK, xASK + cellSizeASK, yASK + cellSizeASK);
  }
  if (cellASK.wallsASK.leftASK) {
    line(xASK, yASK, xASK, yASK + cellSizeASK);
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

  let xASK = mazeOriginXASK + currentCellASK.colASK * cellSizeASK;
  let yASK = mazeOriginYASK + currentCellASK.rowASK * cellSizeASK;

  noStroke();
  fill(red(color4ASK), green(color4ASK), blue(color4ASK), 120);
  rect(xASK, yASK, cellSizeASK, cellSizeASK);
  noFill();
}

function drawBorderASK() {
  let mazeWidthASK = colsMazeASK * cellSizeASK;
  let mazeHeightASK = rowsMazeASK * cellSizeASK;

  stroke(red(color4ASK), green(color4ASK), blue(color4ASK), 90);
  strokeWeight(weightASK * 2.0);
  noFill();
  rect(mazeOriginXASK, mazeOriginYASK, mazeWidthASK, mazeHeightASK);
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
  colorBackgroundASK = random(colorsASK);
  color1ASK = random(colorsASK);
  color2ASK = random(colorsASK);
  color3ASK = random(colorsASK);
  color4ASK = random(colorsASK);

  let attemptsASK = 0;
  while (
    attemptsASK < 20 &&
    sameColorASK(colorBackgroundASK, color1ASK) &&
    sameColorASK(colorBackgroundASK, color2ASK) &&
    sameColorASK(colorBackgroundASK, color3ASK) &&
    sameColorASK(colorBackgroundASK, color4ASK)
  ) {
    color1ASK = random(colorsASK);
    color2ASK = random(colorsASK);
    color3ASK = random(colorsASK);
    color4ASK = random(colorsASK);
    attemptsASK++;
  }
}

function sameColorASK(colorAASK, colorBASK) {
  return (
    red(colorAASK) === red(colorBASK) &&
    green(colorAASK) === green(colorBASK) &&
    blue(colorAASK) === blue(colorBASK)
  );
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

  if (key === "1") setAlgorithmASK("recursiveBacktracker");
  if (key === "2") setAlgorithmASK("binaryTree");
  if (key === "3") setAlgorithmASK("prim");
  if (key === "4") setAlgorithmASK("sidewinder");
  if (key === "5") setAlgorithmASK("eller");
  if (key === "6") setAlgorithmASK("kruskal");

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
