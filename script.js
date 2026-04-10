const canvas = document.getElementById("drawing-surface");
const context = canvas.getContext("2d");
const loadingScreenEl = document.getElementById("loading-screen");
const loadingMessageEl = document.getElementById("loading-message");
const loadingProgressBarEl = document.getElementById("loading-progress-bar");
const loadingPercentEl = document.getElementById("loading-percent");
const loadingPhaseEl = document.getElementById("loading-phase");
const playerCountEl = document.getElementById("player-count");
const playerCounterNoteEl = document.getElementById("player-counter-note");

const brushToolBtn = document.getElementById("brush-tool");
const eraserToolBtn = document.getElementById("eraser-tool");
const colorPicker = document.getElementById("color-picker");
const colorValue = document.getElementById("color-value");
const brushSize = document.getElementById("brush-size");
const brushSizeValue = document.getElementById("brush-size-value");
const toggleMirrorBtn = document.getElementById("toggle-mirror");
const mirrorOffBtn = document.getElementById("mirror-off");
const mirrorVerticalBtn = document.getElementById("mirror-vertical");
const mirrorHorizontalBtn = document.getElementById("mirror-horizontal");
const mirrorQuadBtn = document.getElementById("mirror-quad");
const mirrorDescriptionEl = document.getElementById("mirror-description");
const mirrorGuidesEl = document.getElementById("mirror-guides");
const backgroundPicker = document.getElementById("background-picker");
const fillBackgroundBtn = document.getElementById("fill-background");
const clearCanvasBtn = document.getElementById("clear-canvas");
const saveImageBtn = document.getElementById("save-image");
const resetViewBtn = document.getElementById("reset-view");
const strokeCountEl = document.getElementById("stroke-count");
const pointerStateEl = document.getElementById("pointer-state");
const statusMessageEl = document.getElementById("status-message");
const toolIndicatorEl = document.getElementById("tool-indicator");
const swatches = document.querySelectorAll(".swatch");

const state = {
  tool: "brush",
  mirrorMode: "vertical",
  mirrorEnabled: false,
  color: colorPicker.value,
  brushSize: Number(brushSize.value),
  background: backgroundPicker.value,
  isDrawing: false,
  lastPoint: null,
  strokeCount: 0
};

const loadingSteps = [
  {
    percent: 18,
    phase: "Canvas",
    message: "Stretching the canvas and finding the right proportions."
  },
  {
    percent: 42,
    phase: "Tools",
    message: "Laying out brushes, colors, and studio controls."
  },
  {
    percent: 71,
    phase: "Effects",
    message: "Balancing mirror guides and smoothing the drawing surface."
  },
  {
    percent: 100,
    phase: "Ready",
    message: "Studio loaded. Time to make something."
  }
];

async function updatePlayerCount() {
  if (!playerCountEl || typeof Counter === "undefined") {
    return;
  }

  try {
    const counter = new Counter({ workspace: "bearberlin-site" });
    const result = await counter.up("color-current-players");
    playerCountEl.textContent = String(result.data.up_count);

    if (playerCounterNoteEl) {
      playerCounterNoteEl.textContent = "Counting everyone who opens the drawing app.";
    }
  } catch (error) {
    playerCountEl.textContent = "?";

    if (playerCounterNoteEl) {
      playerCounterNoteEl.textContent = "Counter could not load right now.";
    }
  }
}

function setLoadingState(step) {
  loadingMessageEl.textContent = step.message;
  loadingProgressBarEl.style.width = `${step.percent}%`;
  loadingPercentEl.textContent = `${step.percent}%`;
  loadingPhaseEl.textContent = step.phase;
}

function runLoadingSequence() {
  document.body.classList.add("is-loading");
  setLoadingState({
    percent: 0,
    phase: "Starting",
    message: "Warming up brushes and balancing the canvas."
  });

  loadingSteps.forEach((step, index) => {
    window.setTimeout(() => {
      setLoadingState(step);
    }, 260 + index * 360);
  });

  window.setTimeout(() => {
    loadingScreenEl.classList.add("is-hidden");
    document.body.classList.remove("is-loading");
  }, 1900);
}

function updateBrushLabel() {
  brushSizeValue.textContent = `${state.brushSize} px`;
}

function updateColorLabel() {
  colorValue.textContent = state.color.toUpperCase();
}

function updateToolUI() {
  const isBrush = state.tool === "brush";

  brushToolBtn.classList.toggle("is-active", isBrush);
  eraserToolBtn.classList.toggle("is-active", !isBrush);
  toolIndicatorEl.textContent = isBrush ? "Brush mode" : "Eraser mode";
  statusMessageEl.textContent = isBrush
    ? "Press and drag to draw. Touch works too."
    : "Eraser is active. Drag across the canvas to remove marks.";
}

function updateMirrorUI() {
  const mirrorButtons = {
    off: mirrorOffBtn,
    vertical: mirrorVerticalBtn,
    horizontal: mirrorHorizontalBtn,
    quad: mirrorQuadBtn
  };

  Object.entries(mirrorButtons).forEach(([mode, button]) => {
    button.classList.toggle("is-active", state.mirrorMode === mode);
  });

  toggleMirrorBtn.textContent = state.mirrorEnabled ? "Stop Mirror" : "Start Mirror";
  toggleMirrorBtn.classList.toggle("is-stopped", !state.mirrorEnabled);
  toggleMirrorBtn.disabled = state.mirrorMode === "off";

  const showVertical = state.mirrorEnabled && (state.mirrorMode === "vertical" || state.mirrorMode === "quad");
  const showHorizontal = state.mirrorEnabled && (state.mirrorMode === "horizontal" || state.mirrorMode === "quad");

  mirrorGuidesEl.classList.toggle("show-vertical", showVertical);
  mirrorGuidesEl.classList.toggle("show-horizontal", showHorizontal);

  if (!state.mirrorEnabled || state.mirrorMode === "off") {
    if (state.mirrorMode === "off") {
      mirrorDescriptionEl.textContent = "Draw normally with no mirrored copies.";
    } else {
      mirrorDescriptionEl.textContent = "Mirror mode is selected. Press Start Mirror to turn it on.";
    }
    return;
  }

  if (state.mirrorMode === "vertical") {
    mirrorDescriptionEl.textContent = "Each stroke is mirrored across the center vertical axis.";
    return;
  }

  if (state.mirrorMode === "horizontal") {
    mirrorDescriptionEl.textContent = "Each stroke is mirrored across the center horizontal axis.";
    return;
  }

  if (state.mirrorMode === "quad") {
    mirrorDescriptionEl.textContent = "Draw once and echo the stroke into all four quadrants.";
    return;
  }
}

function updateStats(pointerLabel = pointerStateEl.textContent) {
  strokeCountEl.textContent = String(state.strokeCount);
  pointerStateEl.textContent = pointerLabel;
}

function fillCanvas(color) {
  context.save();
  context.globalCompositeOperation = "source-over";
  context.fillStyle = color;
  context.fillRect(0, 0, canvas.width, canvas.height);
  context.restore();
}

function resetCanvas() {
  fillCanvas(state.background);
  updateStats("Idle");
}

function resizeCanvas() {
  const frame = canvas.parentElement;
  const displayWidth = Math.floor(frame.clientWidth - 2);
  const displayHeight = Math.floor(
    Math.min(window.innerHeight * 0.72, 780)
  );

  const snapshot = document.createElement("canvas");
  snapshot.width = canvas.width;
  snapshot.height = canvas.height;
  snapshot.getContext("2d").drawImage(canvas, 0, 0);

  canvas.width = Math.max(displayWidth, 320);
  canvas.height = Math.max(displayHeight, 320);

  fillCanvas(state.background);
  context.drawImage(snapshot, 0, 0, snapshot.width, snapshot.height, 0, 0, canvas.width, canvas.height);
  context.lineCap = "round";
  context.lineJoin = "round";
}

function getPoint(event) {
  const rect = canvas.getBoundingClientRect();
  const scaleX = canvas.width / rect.width;
  const scaleY = canvas.height / rect.height;

  return {
    x: (event.clientX - rect.left) * scaleX,
    y: (event.clientY - rect.top) * scaleY
  };
}

function mirrorPoint(point, mirrorX, mirrorY) {
  return {
    x: mirrorX ? canvas.width - point.x : point.x,
    y: mirrorY ? canvas.height - point.y : point.y
  };
}

function getMirroredSegments(from, to) {
  const variants = [{ mirrorX: false, mirrorY: false }];

  if (!state.mirrorEnabled || state.mirrorMode === "off") {
    return [{ from, to }];
  }

  if (state.mirrorMode === "vertical" || state.mirrorMode === "quad") {
    variants.push({ mirrorX: true, mirrorY: false });
  }

  if (state.mirrorMode === "horizontal" || state.mirrorMode === "quad") {
    variants.push({ mirrorX: false, mirrorY: true });
  }

  if (state.mirrorMode === "quad") {
    variants.push({ mirrorX: true, mirrorY: true });
  }

  return variants.map(({ mirrorX, mirrorY }) => ({
    from: mirrorPoint(from, mirrorX, mirrorY),
    to: mirrorPoint(to, mirrorX, mirrorY)
  }));
}

function setDrawingStyle() {
  context.lineWidth = state.brushSize;

  if (state.tool === "eraser") {
    context.globalCompositeOperation = "destination-out";
    context.strokeStyle = "rgba(0, 0, 0, 1)";
  } else {
    context.globalCompositeOperation = "source-over";
    context.strokeStyle = state.color;
  }
}

function drawSegment(from, to) {
  setDrawingStyle();
  getMirroredSegments(from, to).forEach((segment) => {
    context.beginPath();
    context.moveTo(segment.from.x, segment.from.y);
    context.lineTo(segment.to.x, segment.to.y);
    context.stroke();
  });
}

function trySetPointerCapture(event) {
  if (typeof canvas.setPointerCapture !== "function") {
    return;
  }

  try {
    canvas.setPointerCapture(event.pointerId);
  } catch (error) {
    // Some browsers are picky here; drawing should still continue.
  }
}

function tryReleasePointerCapture(event) {
  if (typeof canvas.releasePointerCapture !== "function") {
    return;
  }

  try {
    canvas.releasePointerCapture(event.pointerId);
  } catch (error) {
    // Ignore release errors so ending a stroke never breaks the app.
  }
}

function startStroke(event) {
  event.preventDefault();
  trySetPointerCapture(event);
  state.isDrawing = true;
  state.lastPoint = getPoint(event);
  state.strokeCount += 1;
  updateStats("Drawing");
  drawSegment(state.lastPoint, state.lastPoint);
}

function moveStroke(event) {
  if (!state.isDrawing) {
    return;
  }

  event.preventDefault();
  const nextPoint = getPoint(event);
  drawSegment(state.lastPoint, nextPoint);
  state.lastPoint = nextPoint;
}

function endStroke(event) {
  if (!state.isDrawing) {
    return;
  }

  if (event) {
    tryReleasePointerCapture(event);
  }

  state.isDrawing = false;
  state.lastPoint = null;
  updateStats("Idle");
}

function setTool(tool) {
  state.tool = tool;
  updateToolUI();
}

function saveImage() {
  const link = document.createElement("a");
  link.download = "color-current.png";
  link.href = canvas.toDataURL("image/png");
  link.click();
  statusMessageEl.textContent = "PNG download started.";
}

function setMirrorMode(mode) {
  state.mirrorMode = mode;

  if (mode === "off") {
    state.mirrorEnabled = false;
    updateMirrorUI();
    statusMessageEl.textContent = "Mirror brush is off. Draw normally.";
    return;
  }

  updateMirrorUI();
  statusMessageEl.textContent = "Mirror mode selected. Press Start Mirror to turn it on.";
}

function toggleMirror() {
  if (state.mirrorMode === "off") {
    statusMessageEl.textContent = "Choose Left/Right, Top/Bottom, or Quad first.";
    return;
  }

  state.mirrorEnabled = !state.mirrorEnabled;
  updateMirrorUI();

  if (state.mirrorEnabled) {
    if (state.mirrorMode === "vertical") {
      statusMessageEl.textContent = "Mirror brush started in Left/Right mode.";
      return;
    }

    if (state.mirrorMode === "horizontal") {
      statusMessageEl.textContent = "Mirror brush started in Top/Bottom mode.";
      return;
    }

    statusMessageEl.textContent = "Mirror brush started in Quad mode.";
  } else {
    statusMessageEl.textContent = "Mirror brush stopped.";
  }
}

brushToolBtn.addEventListener("click", () => setTool("brush"));
eraserToolBtn.addEventListener("click", () => setTool("eraser"));
mirrorOffBtn.addEventListener("click", () => setMirrorMode("off"));
mirrorVerticalBtn.addEventListener("click", () => setMirrorMode("vertical"));
mirrorHorizontalBtn.addEventListener("click", () => setMirrorMode("horizontal"));
mirrorQuadBtn.addEventListener("click", () => setMirrorMode("quad"));
toggleMirrorBtn.addEventListener("click", toggleMirror);

colorPicker.addEventListener("input", () => {
  state.color = colorPicker.value;
  updateColorLabel();

  if (state.tool !== "brush") {
    setTool("brush");
  }
});

swatches.forEach((swatch) => {
  swatch.addEventListener("click", () => {
    state.color = swatch.dataset.color;
    colorPicker.value = state.color;
    updateColorLabel();

    if (state.tool !== "brush") {
      setTool("brush");
    }
  });
});

brushSize.addEventListener("input", () => {
  state.brushSize = Number(brushSize.value);
  updateBrushLabel();
});

fillBackgroundBtn.addEventListener("click", () => {
  state.background = backgroundPicker.value;
  fillCanvas(state.background);
  statusMessageEl.textContent = "Canvas base color updated.";
});

clearCanvasBtn.addEventListener("click", () => {
  state.strokeCount = 0;
  resetCanvas();
  statusMessageEl.textContent = "Canvas cleared.";
});

saveImageBtn.addEventListener("click", saveImage);

resetViewBtn.addEventListener("click", () => {
  resizeCanvas();
  statusMessageEl.textContent = "Canvas resized to fit the window.";
});

canvas.addEventListener("pointerdown", startStroke);
canvas.addEventListener("pointermove", moveStroke);
canvas.addEventListener("pointerup", endStroke);
canvas.addEventListener("pointerleave", endStroke);
canvas.addEventListener("pointercancel", endStroke);

window.addEventListener("resize", resizeCanvas);

updateColorLabel();
updateBrushLabel();
updateToolUI();
updateMirrorUI();
resizeCanvas();
runLoadingSequence();
updatePlayerCount();
