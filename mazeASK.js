// Copyright (c) 2026 >> Andrew S Klug // ASK
// Licensed under the Apache License, Version 2.0

// =====================================================
// ASK p5.js maze scaffold
// Recursive Backtracker / Depth-First Search
// Updated for template 2
// - safe ASK naming
// - viewing mode vs output mode
// - square vs widescreen composition rules
// =====================================================

// =====================================================
// TOP-OF-FILE MODE SETTINGS
// =====================================================

// false = viewing mode >> use current browser window size
// true  = output mode  >> use fixed export dimensions
let outputASK = false;

// options: "square" or "widescreen"
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

// interaction state
let mousePressedASK = false;
let dragStartASK = null;
let dragCurrentASK = null;
let dragLengthASK = 0;
let dragVectorASK = { x: 0, y: 0 };

// optional containers
let layersASK = [];
let nodesASK = [];

// global view controls
let zoomASK = 1.0;
let centerXASK = 0.5;
let centerYASK = 0.5;

// =====================================================
// MAZE STATE
// =====================================================

let mazeASK = [];
let colsMazeASK = 64;
let rowsMazeASK = 64;
let cellSizeASK = 0.02;

let currentCellASK = null;
let stackASK = [];
let mazeCompleteASK = false;
let stepsPerFrameASK = 12;

// composition
let mazeOriginXASK = 0;
let mazeOriginYASK = 0;
let mazeWidthNormASK = 0.7;
let mazeHeightNormASK = 0.7;

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
  drawMazeASK();
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

  let ratioASK = canvasWidthASK / canvasHeightASK;
  return ratioASK < 1.15;
}

function configureCompositionASK() {
  let squareASK = isSquareCompositionASK();

  if (squareASK) {
    // dense, centered, stable
    zoomASK = 1.0;
    centerXASK = 0.5;
    centerYASK = 0.5;

    mazeWidthNormASK = 0.78;
    mazeHeightNormASK = 0.78;

    colsMazeASK = 34;
    rowsMazeASK = 34;
  } else {
    // cinematic, wider spread, slightly lower visual anchor
    zoomASK = 1.0;
    centerXASK = 0.5;
    centerYASK = 0.515;

    mazeWidthNormASK = 0.82;
    mazeHeightNormASK = 0.62;

    colsMazeASK = 44;
    rowsMazeASK = 24;
  }
}

// =====================================================
// MAZE LOGIC
// =====================================================

function initializeMazeASK() {
  mazeASK = [];
  stackASK = [];
  mazeCompleteASK = false;

  configureCompositionASK();

  cellSizeASK = min(
    mazeWidthNormASK / colsMazeASK,
    mazeHeightNormASK / rowsMazeASK
  );

  let mazeWidthASK = colsMazeASK * cellSizeASK;
  let mazeHeightASK = rowsMazeASK * cellSizeASK;

  mazeOriginXASK = -mazeWidthASK * 0.5;

  // centered in square, slightly lower in widescreen
  if (isSquareCompositionASK()) {
    mazeOriginYASK = -mazeHeightASK * 0.5;
  } else {
    mazeOriginYASK = -mazeHeightASK * 0.42;
  }

  for (let rowASK = 0; rowASK < rowsMazeASK; rowASK++) {
    let rowCellsASK = [];

    for (let colASK = 0; colASK < colsMazeASK; colASK++) {
      rowCellsASK.push(makeCellASK(colASK, rowASK));
    }

    mazeASK.push(rowCellsASK);
  }

  currentCellASK = mazeASK[0][0];
  currentCellASK.visitedASK = true;
}

function makeCellASK(colASK, rowASK) {
  return {
    colASK,
    rowASK,
    visitedASK: false,
    depthASK: -1,
    wallsASK: {
      topASK: true,
      rightASK: true,
      bottomASK: true,
      leftASK: true
    }
  };
}

function updateMazeASK() {
  if (mazeCompleteASK) return;

  for (let iASK = 0; iASK < stepsPerFrameASK; iASK++) {
    stepRecursiveBacktrackerASK();
    if (mazeCompleteASK) break;
  }
}

function stepRecursiveBacktrackerASK() {
  let neighborsASK = getUnvisitedNeighborsASK(currentCellASK);

  if (neighborsASK.length > 0) {
    let nextCellASK = random(neighborsASK);

    stackASK.push(currentCellASK);
    removeWallsASK(currentCellASK, nextCellASK);

    nextCellASK.visitedASK = true;
    nextCellASK.depthASK = stackASK.length;

    currentCellASK = nextCellASK;
    return;
  }

  if (stackASK.length > 0) {
    currentCellASK = stackASK.pop();
    return;
  }

  mazeCompleteASK = true;
}

function getUnvisitedNeighborsASK(cellASK) {
  let neighborsASK = [];
  let colASK = cellASK.colASK;
  let rowASK = cellASK.rowASK;

  let topASK = getCellASK(colASK, rowASK - 1);
  let rightASK = getCellASK(colASK + 1, rowASK);
  let bottomASK = getCellASK(colASK, rowASK + 1);
  let leftASK = getCellASK(colASK - 1, rowASK);

  if (topASK && !topASK.visitedASK) neighborsASK.push(topASK);
  if (rightASK && !rightASK.visitedASK) neighborsASK.push(rightASK);
  if (bottomASK && !bottomASK.visitedASK) neighborsASK.push(bottomASK);
  if (leftASK && !leftASK.visitedASK) neighborsASK.push(leftASK);

  return neighborsASK;
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

// =====================================================
// DRAWING
// =====================================================

function drawMazeASK() {
  drawVisitedFieldsASK();
  drawWallsASK();
  drawCurrentCellASK();
}

function drawVisitedFieldsASK() {
  noStroke();

  for (let rowASK = 0; rowASK < rowsMazeASK; rowASK++) {
    for (let colASK = 0; colASK < colsMazeASK; colASK++) {
      let cellASK = mazeASK[rowASK][colASK];

      if (!cellASK.visitedASK) continue;

      let xASK = mazeOriginXASK + cellASK.colASK * cellSizeASK;
      let yASK = mazeOriginYASK + cellASK.rowASK * cellSizeASK;

      let nxASK = colsMazeASK <= 1 ? 0 : colASK / (colsMazeASK - 1);
      let nyASK = rowsMazeASK <= 1 ? 0 : rowASK / (rowsMazeASK - 1);

      let mixASK = 0.5 + 0.25 * sin(nxASK * PI * 2 + timeASK * 0.4)
                        + 0.25 * cos(nyASK * PI * 2 - timeASK * 0.25);
      mixASK = constrain(mixASK, 0, 1);

      let fillColorASK = colorLerpASK(color2ASK, color3ASK, mixASK, mazeCompleteASK ? 42 : 24);

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

  let edgeMixASK = getEdgeMixASK(cellASK);
  let wallColorASK = colorLerpASK(color1ASK, color4ASK, edgeMixASK, 255 * opacASK);

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

  let radialASK = constrain((dxASK + dyASK) * 0.5, 0, 1);

  if (isSquareCompositionASK()) {
    return radialASK * 0.55;
  } else {
    return constrain(dxASK * 0.7 + dyASK * 0.25, 0, 1) * 0.65;
  }
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
  let dragAmountASK = constrain(abs(dragVectorASK.x) * 220, 1, 80);
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

  if (key === "[") {
    if (isSquareCompositionASK()) {
      colsMazeASK = max(8, colsMazeASK - 2);
      rowsMazeASK = max(8, rowsMazeASK - 2);
    } else {
      colsMazeASK = max(12, colsMazeASK - 2);
      rowsMazeASK = max(8, rowsMazeASK - 1);
    }
    initializeMazeASK();
  }

  if (key === "]") {
    if (isSquareCompositionASK()) {
      colsMazeASK = min(96, colsMazeASK + 2);
      rowsMazeASK = min(96, rowsMazeASK + 2);
    } else {
      colsMazeASK = min(120, colsMazeASK + 2);
      rowsMazeASK = min(72, rowsMazeASK + 1);
    }
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

// =====================================================
// RESIZE
// =====================================================

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