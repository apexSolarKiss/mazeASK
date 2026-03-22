// Copyright (c) 2026 >> Andrew S Klug // ASK
// Licensed under the Apache License, Version 2.0

// =====================================================
// ASK p5.js // Maze Lab
// template 2 version
// - viewing mode vs output mode
// - clean algorithm comparison
// - Recursive Backtracker / Binary Tree / Prim / Sidewinder
// =====================================================

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
let primVisitedCountASK = 0;

let mazeCompleteASK = false;
let stepsPerFrameASK = 16;

let algorithmASK = "recursiveBacktracker";
let algorithmLabelASK = "Recursive Backtracker";

let generationModeASK = "step"; // "step" or "instant"
let sidewinderRowASK = 0;
let sidewinderColASK = 0;
let sidewinderRunASK = [];
let visitOrderCounterASK = 0;

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

function askToScreen(xASK, yASK) {
  return {
    x: (xASK * zoomASK + centerXASK) * canvasWidthASK,
    y: (yASK * zoomASK + centerYASK) * canvasHeightASK
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

    if (algorithmASK === "sidewinder") {
      colsMazeASK = 34;
      rowsMazeASK = 34;
    } else {
      colsMazeASK = 36;
      rowsMazeASK = 36;
    }
  } else {
    zoomASK = 1.0;
    centerXASK = 0.5;
    centerYASK = 0.515;

    mazeWidthNormASK = 0.82;
    mazeHeightNormASK = 0.62;

    if (algorithmASK === "sidewinder") {
      colsMazeASK = 44;
      rowsMazeASK = 24;
    } else {
      colsMazeASK = 46;
      rowsMazeASK = 24;
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
  primVisitedCountASK = 0;
  visitOrderCounterASK = 0;
  sidewinderRowASK = 0;
  sidewinderColASK = 0;

  cellSizeASK = min(
    mazeWidthNormASK / colsMazeASK,
    mazeHeightNormASK / rowsMazeASK
  );

  let mazeWidthASK = colsMazeASK * cellSizeASK;
  let mazeHeightASK = rowsMazeASK * cellSizeASK;

  mazeOriginXASK = -mazeWidthASK * 0.5;
  mazeOriginYASK = isSquareCompositionASK() ? -mazeHeightASK * 0.5 : -mazeHeightASK * 0.42;

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
  if (algorithmASK === "recursiveBacktracker") {
    algorithmLabelASK = "Recursive Backtracker";
    currentCellASK = mazeASK[0][0];
    markVisitedASK(currentCellASK, 0);
  } else if (algorithmASK === "binaryTree") {
    algorithmLabelASK = "Binary Tree";
    generationModeASK = "instant";
  } else if (algorithmASK === "prim") {
    algorithmLabelASK = "Prim";
    currentCellASK = mazeASK[floor(rowsMazeASK / 2)][floor(colsMazeASK / 2)];
    markVisitedASK(currentCellASK, 0);
    addFrontierNeighborsASK(currentCellASK);
  } else if (algorithmASK === "sidewinder") {
    algorithmLabelASK = "Sidewinder";
    generationModeASK = "step";
    sidewinderRowASK = 0;
    sidewinderColASK = 0;
    sidewinderRunASK = [];
  }
}

// =====================================================
// MAZE UPDATE
// =====================================================

function updateMazeASK() {
  if (mazeCompleteASK) return;

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
    ? visitedNeighborsASK[0].depthASK + 1
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

  let carveNorthASK = atEasternBoundaryASK || (!atNorthernBoundaryASK && random() < 0.33);

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
  return getNeighborCellsASK(cellASK).filter(neighborASK => !neighborASK.visitedASK);
}

function getVisitedNeighborsASK(cellASK) {
  return getNeighborCellsASK(cellASK).filter(neighborASK => neighborASK.visitedASK);
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
  initializeMazeASK();
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

      let tASK = cellASK.visitOrderASK <= 0
        ? 0
        : cellASK.visitOrderASK / max(1, visitOrderCounterASK - 1);

      let fillColorASK = colorLerpASK(color2ASK, color3ASK, tASK, mazeCompleteASK ? 34 : 20);

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
      let cellASK = mazeASK[rowASK][colASK];
      drawCellWallsASK(cellASK);
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

  stroke(
    red(color4ASK),
    green(color4ASK),
    blue(color4ASK),
    90
  );
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

  mousePressedASKHook();
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

  mouseDraggedASKHook();
}

function mouseReleased() {
  let wasClickASK = dragLengthASK < 0.015;

  mouseReleasedASKHook(wasClickASK);

  if (wasClickASK) {
    clickASK();
  }

  mousePressedASK = false;
  dragStartASK = null;
  dragCurrentASK = null;
  dragLengthASK = 0;
  dragVectorASK = { x: 0, y: 0 };
}

function clickASK() {
  renderColorsASK();
  initializeMazeASK();
}

function mousePressedASKHook() {}

function mouseDraggedASKHook() {
  let dragAmountASK = constrain(abs(dragVectorASK.x) * 240, 1, 240);
  stepsPerFrameASK = floor(dragAmountASK);
}

function mouseReleasedASKHook(wasClickASK) {}

// =====================================================
// KEYBOARD
// =====================================================

function keyPressed() {
  if (key === "r" || key === "R") {
    renderColorsASK();
  }

  if (key === "c" || key === "C") {
    clearASK();
  }

  keyPressedASKHook();
}

function keyPressedASKHook() {
  if (key === " ") {
    initializeMazeASK();
  }

  if (key === "1") {
    setAlgorithmASK("recursiveBacktracker");
  }

  if (key === "2") {
    setAlgorithmASK("binaryTree");
  }

  if (key === "3") {
    setAlgorithmASK("prim");
  }

  if (key === "4") {
    setAlgorithmASK("sidewinder");
  }

  if (key === "[") {
    colsMazeASK = max(8, colsMazeASK - 2);
    rowsMazeASK = max(8, rowsMazeASK - 2);
    initializeMazeASK();
  }

  if (key === "]") {
    colsMazeASK = min(120, colsMazeASK + 2);
    rowsMazeASK = min(120, rowsMazeASK + 2);
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

function clearASK() {
  layersASK = [];
  nodesASK = [];
}

function windowResized() {
  if (!outputASK) {
    applyCanvasSizeASK();
    initializeMazeASK();
  }
  windowResizedASKHook();
}

function windowResizedASKHook() {}

// =====================================================
// OPTIONAL HELPERS
// =====================================================

function randomColorASK() {
  return random(colorsASK);
}

function colorLerpASK(colorAASK, colorBASK, amtASK, alphaASK = 255) {
  let mixedASK = lerpColor(colorAASK, colorBASK, amtASK);
  return color(
    red(mixedASK),
    green(mixedASK),
    blue(mixedASK),
    alphaASK
  );
}

function normalizedDirectionASK(xASK, yASK) {
  let magnitudeASK = sqrt(xASK * xASK + yASK * yASK);
  if (magnitudeASK === 0) {
    return { x: 0, y: 0 };
  }
  return {
    x: xASK / magnitudeASK,
    y: yASK / magnitudeASK
  };
}

function signedDistanceToLineASK(pointASK, originASK, directionASK) {
  return (
    -(pointASK.x - originASK.x) * directionASK.y +
    (pointASK.y - originASK.y) * directionASK.x
  );
}

function projectValueASK(valueASK, minInASK, maxInASK, minOutASK, maxOutASK) {
  return map(valueASK, minInASK, maxInASK, minOutASK, maxOutASK);
}
