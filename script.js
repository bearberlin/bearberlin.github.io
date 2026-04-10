const canvas = document.getElementById("drawing-surface");
const context = canvas.getContext("2d");
const loadingScreenEl = document.getElementById("loading-screen");
const loadingMessageEl = document.getElementById("loading-message");
const loadingProgressBarEl = document.getElementById("loading-progress-bar");
const loadingPercentEl = document.getElementById("loading-percent");
const loadingPhaseEl = document.getElementById("loading-phase");
const confettiLayerEl = document.getElementById("confetti-layer");
const adminPanelEl = document.getElementById("admin-panel");
const adminLockedEl = document.getElementById("admin-locked");
const adminControlsEl = document.getElementById("admin-controls");
const openAdminBtn = document.getElementById("open-admin");
const claimOwnerAccessBtn = document.getElementById("claim-owner-access");
const closeAdminBtn = document.getElementById("close-admin");
const permissionLinkEl = document.getElementById("permission-link");
const copyPermissionLinkBtn = document.getElementById("copy-permission-link");
const adminModeLabelEl = document.getElementById("admin-mode-label");
const adminModeButtons = document.querySelectorAll(".admin-mode-button");
const burstConfettiBtn = document.getElementById("burst-confetti");
const resetPartyBtn = document.getElementById("reset-party");
const globalBurstBtn = document.getElementById("global-burst");
const globalClearBtn = document.getElementById("global-clear");
const globalShakeBtn = document.getElementById("global-shake");
const surpriseColorBtn = document.getElementById("surprise-color");
const darkCanvasBtn = document.getElementById("dark-canvas");
const lightCanvasBtn = document.getElementById("light-canvas");
const rainbowStormBtn = document.getElementById("rainbow-storm");
const goldRushBtn = document.getElementById("gold-rush");
const nightPartyBtn = document.getElementById("night-party");
const flipColorsBtn = document.getElementById("flip-colors");
const oceanWashBtn = document.getElementById("ocean-wash");
const pinkPopBtn = document.getElementById("pink-pop");
const megaPartyBtn = document.getElementById("mega-party");
const randomCommandBtn = document.getElementById("random-command");
const lavaBlastBtn = document.getElementById("lava-blast");
const iceFlashBtn = document.getElementById("ice-flash");
const superBlackoutBtn = document.getElementById("super-blackout");
const forestWashBtn = document.getElementById("forest-wash");
const galaxyBurstBtn = document.getElementById("galaxy-burst");
const lemonZingBtn = document.getElementById("lemon-zing");
const stormSlamBtn = document.getElementById("storm-slam");
const zebraFlipBtn = document.getElementById("zebra-flip");
const pixelPopBtn = document.getElementById("pixel-pop");
const roseRushBtn = document.getElementById("rose-rush");
const mintSplashBtn = document.getElementById("mint-splash");
const shadowDropBtn = document.getElementById("shadow-drop");
const glowUpBtn = document.getElementById("glow-up");
const drawMotorcycleBtn = document.getElementById("draw-motorcycle");
const multiplayerStatusEl = document.getElementById("multiplayer-status");
const multiplayerNoteEl = document.getElementById("multiplayer-note");
const realtimePreviewEl = document.getElementById("realtime-preview");
const globalBannerEl = document.getElementById("global-banner");
const globalBannerTitleEl = document.getElementById("global-banner-title");
const globalBannerTextEl = document.getElementById("global-banner-text");
const gameTextOverlayEl = document.getElementById("game-text-overlay");
const gameTextTitleEl = document.getElementById("game-text-title");
const gameTextValueEl = document.getElementById("game-text-value");
const globalMessageInputEl = document.getElementById("global-message-input");
const sendGlobalMessageBtn = document.getElementById("send-global-message");
const clearGlobalMessageBtn = document.getElementById("clear-global-message");
const watchModeStatusEl = document.getElementById("watch-mode-status");
const startWatchModeBtn = document.getElementById("start-watch-mode");
const stopWatchModeBtn = document.getElementById("stop-watch-mode");

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
  adminOpen: false,
  adminUnlocked: false,
  adminMode: "normal",
  color: colorPicker.value,
  brushSize: Number(brushSize.value),
  background: backgroundPicker.value,
  watchModeEnabled: false,
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

const OWNER_STORAGE_KEY = "color-current-owner-access";
const FRIEND_STORAGE_KEY = "color-current-friend-access";
const PERMISSION_QUERY_KEY = "permission";
const OWNER_QUERY_KEY = "bear";
const FIREBASE_CONFIG = window.COLOR_CURRENT_FIREBASE_CONFIG || { enabled: false };

let confettiIntervalId = null;
const defaultBrushSize = state.brushSize;
let firebaseDatabase = null;
let firebaseConnectedRef = null;
let firebaseBearPresenceRef = null;
let firebaseGlobalModeRef = null;
let firebaseGlobalMessageRef = null;
let firebaseGlobalActionRef = null;
let firebaseWatchModeRef = null;
let firebaseWatchStrokeRef = null;
let firebasePresenceReady = false;
let firebaseReady = false;
let firebaseAppBooted = false;
let lastGlobalActionToken = null;
let lastWatchStrokeToken = null;
const surprisePalette = ["#1530ff", "#ff5f36", "#f5c400", "#08b981", "#ff7fbe", "#171717"];

const randomAdminCommands = [
  { label: "Disco", run: () => applyAdminMode("disco") },
  { label: "Confetti", run: () => applyAdminMode("confetti") },
  { label: "Rainbow", run: () => applyAdminMode("rainbow") },
  { label: "Spotlight", run: () => applyAdminMode("spotlight") },
  { label: "Neon", run: () => applyAdminMode("neon") },
  { label: "Ghost", run: () => applyAdminMode("ghost") },
  { label: "Sunset", run: () => applyAdminMode("sunset") },
  { label: "Ocean", run: () => applyAdminMode("ocean") },
  { label: "Candy", run: () => applyAdminMode("candy") },
  { label: "Forest", run: () => applyAdminMode("forest") },
  { label: "Galaxy", run: () => applyAdminMode("galaxy") },
  { label: "Lemonade", run: () => applyAdminMode("lemonade") },
  { label: "Storm", run: () => applyAdminMode("storm") },
  { label: "Zebra", run: () => applyAdminMode("zebra") },
  { label: "Pixel", run: () => applyAdminMode("pixel") },
  { label: "Rose", run: () => applyAdminMode("rose") },
  { label: "Mint", run: () => applyAdminMode("mint") },
  { label: "Shadow", run: () => applyAdminMode("shadow") },
  { label: "Glow", run: () => applyAdminMode("glow") },
  {
    label: "Global Burst",
    run: () => {
      spawnConfettiBurst();
      pushGlobalAction("burst");
    }
  },
  {
    label: "Screen Shake",
    run: () => {
      document.body.classList.remove("screen-shake");
      void document.body.offsetWidth;
      document.body.classList.add("screen-shake");
      window.setTimeout(() => {
        document.body.classList.remove("screen-shake");
      }, 650);
      pushGlobalAction("shake");
    }
  },
  {
    label: "Gold Rush",
    run: () => {
      const nextColor = "#f5c400";
      state.color = nextColor;
      colorPicker.value = nextColor;
      updateColorLabel();
      setTool("brush");
      pushGlobalActionPayload({
        type: "surprise-color",
        color: nextColor
      });
    }
  },
  {
    label: "Pink Pop",
    run: () => {
      const nextColor = "#ff7fbe";
      state.color = nextColor;
      colorPicker.value = nextColor;
      updateColorLabel();
      setTool("brush");
      pushGlobalActionPayload({
        type: "surprise-color",
        color: nextColor
      });
    }
  },
  {
    label: "Ocean Wash",
    run: () => {
      const nextColor = "#bfe9ff";
      state.background = nextColor;
      backgroundPicker.value = nextColor;
      fillCanvas(nextColor);
      pushGlobalActionPayload({
        type: "background-fill",
        color: nextColor
      });
    }
  },
  {
    label: "Night Party",
    run: () => {
      applyAdminMode("blackout");
      pushGlobalActionPayload({
        type: "background-fill",
        color: "#101723"
      });
    }
  },
  {
    label: "Mega Party",
    run: () => {
      applyAdminMode("rainbow");
      for (let index = 0; index < 4; index += 1) {
        window.setTimeout(spawnConfettiBurst, index * 220);
      }
      pushGlobalAction("rainbow-storm");
    }
  }
];

function setLoadingState(step) {
  loadingMessageEl.textContent = step.message;
  loadingProgressBarEl.style.width = `${step.percent}%`;
  loadingPercentEl.textContent = `${step.percent}%`;
  loadingPhaseEl.textContent = step.phase;
}

function updateMultiplayerPreview() {
  if (!multiplayerStatusEl || !multiplayerNoteEl || !realtimePreviewEl) {
    return;
  }

  if (!FIREBASE_CONFIG.enabled) {
    multiplayerStatusEl.textContent = "Live status not connected";
    multiplayerNoteEl.textContent = "Add a Firebase project later to make Bear online/offline real.";
    realtimePreviewEl.textContent = "Firebase is not connected yet. When it is, this panel can show real Bear online/offline status.";
    return;
  }

  if (!firebasePresenceReady) {
    multiplayerStatusEl.textContent = "Connecting live status...";
    multiplayerNoteEl.textContent = "Trying to reach the realtime server.";
    realtimePreviewEl.textContent = "Firebase is turned on, and the app is waiting for the live connection.";
  }
}

function setRealtimeStatus(status, note, preview) {
  if (multiplayerStatusEl) {
    multiplayerStatusEl.textContent = status;
  }

  if (multiplayerNoteEl) {
    multiplayerNoteEl.textContent = note;
  }

  if (realtimePreviewEl) {
    realtimePreviewEl.textContent = preview;
  }
}

function showGlobalBanner(message) {
  const trimmedMessage = String(message || "").trim();
  const hasMessage = trimmedMessage.length > 0;
  globalBannerEl.classList.toggle("is-hidden", !hasMessage);
  gameTextOverlayEl.classList.toggle("is-hidden", !hasMessage);

  if (!hasMessage) {
    globalBannerTextEl.textContent = "";
    gameTextValueEl.textContent = "";
    return;
  }

  globalBannerTitleEl.textContent = "Bear Broadcast";
  globalBannerTextEl.textContent = trimmedMessage;
  gameTextTitleEl.textContent = "Bear Broadcast";
  gameTextValueEl.textContent = trimmedMessage;
}

function isDrawingFrozen() {
  return state.adminMode === "freeze";
}

function areColorsLocked() {
  return state.adminMode === "lockcolor";
}

function isOwnerBrowser() {
  return window.localStorage.getItem(OWNER_STORAGE_KEY) === "true";
}

function updateWatchModeStatus(enabled) {
  if (!watchModeStatusEl) {
    return;
  }

  watchModeStatusEl.textContent = enabled
    ? "On. Everyone can watch Bear draw right now."
    : "Off for everyone right now.";
}

function hasFirebaseConfig() {
  const requiredKeys = ["apiKey", "authDomain", "databaseURL", "projectId", "appId"];
  return FIREBASE_CONFIG.enabled && requiredKeys.every((key) => typeof FIREBASE_CONFIG[key] === "string" && FIREBASE_CONFIG[key].trim());
}

async function setupRealtimePresence() {
  if (!hasFirebaseConfig()) {
    updateMultiplayerPreview();
    return;
  }

  try {
    const [{ initializeApp }, { getDatabase, ref, onValue, onDisconnect, set }] = await Promise.all([
      import("https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js"),
      import("https://www.gstatic.com/firebasejs/10.12.2/firebase-database.js")
    ]);

    if (!firebaseAppBooted) {
      const app = initializeApp(FIREBASE_CONFIG);
      firebaseDatabase = getDatabase(app);
      firebaseConnectedRef = ref(firebaseDatabase, ".info/connected");
      firebaseBearPresenceRef = ref(firebaseDatabase, "presence/bear");
      firebaseGlobalModeRef = ref(firebaseDatabase, "global/mode");
      firebaseGlobalMessageRef = ref(firebaseDatabase, "global/message");
      firebaseGlobalActionRef = ref(firebaseDatabase, "global/action");
      firebaseWatchModeRef = ref(firebaseDatabase, "global/watchEnabled");
      firebaseWatchStrokeRef = ref(firebaseDatabase, "global/watchStroke");
      firebaseAppBooted = true;
    }

    if (!firebaseReady) {
      onValue(firebaseBearPresenceRef, (snapshot) => {
        firebasePresenceReady = true;
        const isOnline = snapshot.val() === true;
        setRealtimeStatus(
          isOnline ? "Bear is online" : "Bear is offline",
          isOnline
            ? "Bear's browser is connected right now."
            : "Bear's browser is not connected right now.",
          "Realtime status is live from Firebase."
        );
      });

      onValue(firebaseGlobalModeRef, (snapshot) => {
        const nextMode = typeof snapshot.val() === "string" ? snapshot.val() : "normal";
        applyAdminMode(nextMode, { fromRemote: true });
      });

      onValue(firebaseGlobalMessageRef, (snapshot) => {
        const payload = snapshot.val();
        const nextMessage = payload && typeof payload.text === "string" ? payload.text : "";
        showGlobalBanner(nextMessage);
      });

      onValue(firebaseWatchModeRef, (snapshot) => {
        const enabled = snapshot.val() === true;
        state.watchModeEnabled = enabled;
        updateWatchModeStatus(enabled);
      });

      onValue(firebaseWatchStrokeRef, (snapshot) => {
        const payload = snapshot.val();
        if (!payload || !payload.token || payload.token === lastWatchStrokeToken) {
          return;
        }

        lastWatchStrokeToken = payload.token;

        if (payload.watchEnabled !== true || payload.sender !== "bear" || isOwnerBrowser()) {
          return;
        }

        drawRemoteSegment(payload);
      });

      onValue(firebaseGlobalActionRef, (snapshot) => {
        const payload = snapshot.val();
        if (!payload || !payload.token || payload.token === lastGlobalActionToken) {
          return;
        }

        lastGlobalActionToken = payload.token;

        if (payload.type === "burst") {
          spawnConfettiBurst();
        }

        if (payload.type === "clear") {
          state.strokeCount = 0;
          resetCanvas();
          statusMessageEl.textContent = "Bear cleared the canvas for everyone.";
        }

        if (payload.type === "shake") {
          document.body.classList.remove("screen-shake");
          void document.body.offsetWidth;
          document.body.classList.add("screen-shake");
          window.setTimeout(() => {
            document.body.classList.remove("screen-shake");
          }, 650);
        }

        if (payload.type === "surprise-color" && typeof payload.color === "string") {
          state.color = payload.color;
          colorPicker.value = payload.color;
          updateColorLabel();
          setTool("brush");
          statusMessageEl.textContent = "Bear changed the color for everyone.";
        }

        if (payload.type === "background-fill" && typeof payload.color === "string") {
          state.background = payload.color;
          backgroundPicker.value = payload.color;
          fillCanvas(payload.color);
          statusMessageEl.textContent = "Bear changed the canvas background for everyone.";
        }

        if (payload.type === "rainbow-storm") {
          for (let index = 0; index < 3; index += 1) {
            window.setTimeout(spawnConfettiBurst, index * 260);
          }
        }

        if (payload.type === "mode-set" && typeof payload.mode === "string") {
          applyAdminMode(payload.mode, { fromRemote: true });
        }
      });

      firebaseReady = true;
    }

    if (window.localStorage.getItem(OWNER_STORAGE_KEY) === "true") {
      onValue(firebaseConnectedRef, async (snapshot) => {
        if (snapshot.val() !== true) {
          return;
        }

        await onDisconnect(firebaseBearPresenceRef).set(false);
        await set(firebaseBearPresenceRef, true);
      });
    }
  } catch (error) {
    setRealtimeStatus(
      "Live status failed",
      "Firebase could not connect from this page.",
      "Check the Firebase config and database setup before trying again."
    );
  }
}

function pushGlobalMode(mode) {
  if (!firebaseGlobalModeRef) {
    statusMessageEl.textContent = "Firebase is not ready yet.";
    return;
  }

  import("https://www.gstatic.com/firebasejs/10.12.2/firebase-database.js")
    .then(({ set }) => set(firebaseGlobalModeRef, mode))
    .catch(() => {
      statusMessageEl.textContent = "Global mode could not update.";
    });
}

function pushGlobalMessage(message) {
  if (!firebaseGlobalMessageRef) {
    statusMessageEl.textContent = "Firebase is not ready yet.";
    return;
  }

  import("https://www.gstatic.com/firebasejs/10.12.2/firebase-database.js")
    .then(({ set }) => set(firebaseGlobalMessageRef, {
      text: message.trim(),
      updatedAt: Date.now()
    }))
    .catch(() => {
      statusMessageEl.textContent = "Global text could not update.";
    });
}

function pushGlobalAction(type) {
  if (!firebaseGlobalActionRef) {
    statusMessageEl.textContent = "Firebase is not ready yet.";
    return;
  }

  import("https://www.gstatic.com/firebasejs/10.12.2/firebase-database.js")
    .then(({ set }) => set(firebaseGlobalActionRef, {
      type,
      token: `${type}-${Date.now()}`
    }))
    .catch(() => {
      statusMessageEl.textContent = "Global command could not update.";
    });
}

function pushGlobalActionPayload(payload) {
  if (!firebaseGlobalActionRef) {
    statusMessageEl.textContent = "Firebase is not ready yet.";
    return;
  }

  import("https://www.gstatic.com/firebasejs/10.12.2/firebase-database.js")
    .then(({ set }) => set(firebaseGlobalActionRef, {
      ...payload,
      token: `${payload.type}-${Date.now()}-${Math.random().toString(16).slice(2, 8)}`
    }))
    .catch(() => {
      statusMessageEl.textContent = "Global command could not update.";
    });
}

function pushWatchMode(enabled) {
  if (!firebaseWatchModeRef) {
    statusMessageEl.textContent = "Firebase is not ready yet.";
    return;
  }

  import("https://www.gstatic.com/firebasejs/10.12.2/firebase-database.js")
    .then(({ set }) => set(firebaseWatchModeRef, enabled))
    .catch(() => {
      statusMessageEl.textContent = "Watch mode could not update.";
    });
}

function pushWatchStroke(segment) {
  if (!firebaseWatchStrokeRef || !state.watchModeEnabled || !isOwnerBrowser()) {
    return;
  }

  import("https://www.gstatic.com/firebasejs/10.12.2/firebase-database.js")
    .then(({ set }) => set(firebaseWatchStrokeRef, {
      ...segment,
      sender: "bear",
      watchEnabled: true,
      token: `stroke-${Date.now()}-${Math.random().toString(16).slice(2, 8)}`
    }))
    .catch(() => {
      statusMessageEl.textContent = "Watch draw could not update.";
    });
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

function getPermissionLink() {
  const url = new URL(window.location.href);
  url.searchParams.set(PERMISSION_QUERY_KEY, "granted");
  return url.toString();
}

function updateAdminAccessUI() {
  adminLockedEl.classList.toggle("is-hidden", state.adminUnlocked);
  adminControlsEl.classList.toggle("is-hidden", !state.adminUnlocked);
  openAdminBtn.classList.toggle("is-hidden", !state.adminUnlocked);

  if (permissionLinkEl) {
    permissionLinkEl.value = getPermissionLink();
  }
}

function updateAdminModeUI() {
  adminModeButtons.forEach((button) => {
    button.classList.toggle("is-active", button.dataset.adminMode === state.adminMode);
  });

  adminModeLabelEl.textContent = `Mode: ${state.adminMode.charAt(0).toUpperCase()}${state.adminMode.slice(1)}`;
}

function clearConfetti() {
  window.clearInterval(confettiIntervalId);
  confettiIntervalId = null;
  confettiLayerEl.innerHTML = "";
}

function spawnConfettiBurst() {
  const colors = ["#1530ff", "#ff5f36", "#f5c400", "#08b981", "#ff7fbe"];

  for (let index = 0; index < 18; index += 1) {
    const piece = document.createElement("span");
    piece.className = "confetti-piece";
    piece.style.left = `${Math.random() * 100}%`;
    piece.style.background = colors[Math.floor(Math.random() * colors.length)];
    piece.style.animationDuration = `${3 + Math.random() * 2.4}s`;
    piece.style.transform = `translateY(0) rotate(${Math.random() * 360}deg)`;
    confettiLayerEl.appendChild(piece);

    window.setTimeout(() => {
      piece.remove();
    }, 5600);
  }
}

function applyAdminMode(mode, options = {}) {
  const nextMode = ["normal", "disco", "confetti", "blackout", "rainbow", "giant", "invert", "freeze", "spotlight", "lockcolor", "mini", "neon", "ghost", "sunset", "ocean", "candy", "lava", "ice", "forest", "galaxy", "lemonade", "storm", "zebra", "pixel", "rose", "mint", "shadow", "glow"].includes(mode) ? mode : "normal";
  state.adminMode = nextMode;
  updateAdminModeUI();
  document.body.classList.toggle("party-disco", nextMode === "disco");
  document.body.classList.toggle("party-rainbow", nextMode === "rainbow");
  document.body.classList.toggle("party-blackout", nextMode === "blackout");
  document.body.classList.toggle("party-invert", nextMode === "invert");
  document.body.classList.toggle("party-spotlight", nextMode === "spotlight");
  document.body.classList.toggle("party-neon", nextMode === "neon");
  document.body.classList.toggle("party-ghost", nextMode === "ghost");
  document.body.classList.toggle("party-sunset", nextMode === "sunset");
  document.body.classList.toggle("party-ocean", nextMode === "ocean");
  document.body.classList.toggle("party-candy", nextMode === "candy");
  document.body.classList.toggle("party-lava", nextMode === "lava");
  document.body.classList.toggle("party-ice", nextMode === "ice");
  document.body.classList.toggle("party-forest", nextMode === "forest");
  document.body.classList.toggle("party-galaxy", nextMode === "galaxy");
  document.body.classList.toggle("party-lemonade", nextMode === "lemonade");
  document.body.classList.toggle("party-storm", nextMode === "storm");
  document.body.classList.toggle("party-zebra", nextMode === "zebra");
  document.body.classList.toggle("party-pixel", nextMode === "pixel");
  document.body.classList.toggle("party-rose", nextMode === "rose");
  document.body.classList.toggle("party-mint", nextMode === "mint");
  document.body.classList.toggle("party-shadow", nextMode === "shadow");
  document.body.classList.toggle("party-glow", nextMode === "glow");

  clearConfetti();

  state.brushSize = defaultBrushSize;
  brushSize.value = String(defaultBrushSize);
  updateBrushLabel();

  if (nextMode === "confetti") {
    spawnConfettiBurst();
    confettiIntervalId = window.setInterval(spawnConfettiBurst, 1800);
  }

  if (nextMode === "giant") {
    state.brushSize = 36;
    brushSize.value = "36";
    updateBrushLabel();
  }

  if (nextMode === "mini") {
    state.brushSize = 4;
    brushSize.value = "4";
    updateBrushLabel();
  }

  if (nextMode === "freeze") {
    updateStats("Frozen");
  } else if (!state.isDrawing) {
    updateStats("Idle");
  }

  if (!options.fromRemote && state.adminUnlocked) {
    pushGlobalMode(nextMode);
  }
}

function openAdminPanel() {
  state.adminOpen = true;
  adminPanelEl.classList.remove("is-hidden");
  statusMessageEl.textContent = "Bear controls opened.";
}

function closeAdminPanel() {
  state.adminOpen = false;
  adminPanelEl.classList.add("is-hidden");
}

function unlockAdminAccess() {
  state.adminUnlocked = true;
  updateAdminAccessUI();
  if (globalMessageInputEl) {
    globalMessageInputEl.disabled = false;
  }
}

function handleAdminShortcut(event) {
  const pressedE = event.code === "KeyE" || String(event.key).toLowerCase() === "e";

  if (!pressedE || event.metaKey || event.ctrlKey || event.altKey) {
    return;
  }

  const target = event.target;

  if (target instanceof HTMLInputElement || target instanceof HTMLTextAreaElement) {
    return;
  }

  event.preventDefault();

  if (state.adminOpen) {
    closeAdminPanel();
  } else {
    openAdminPanel();
  }
}

function focusPageForShortcuts(event) {
  const target = event.target;

  if (
    target instanceof HTMLInputElement ||
    target instanceof HTMLTextAreaElement ||
    target instanceof HTMLButtonElement
  ) {
    return;
  }

  document.body.focus();
}

async function copyPermissionLink() {
  const link = getPermissionLink();

  try {
    await navigator.clipboard.writeText(link);
    statusMessageEl.textContent = "Permission link copied.";
  } catch (error) {
    permissionLinkEl.focus();
    permissionLinkEl.select();
    statusMessageEl.textContent = "Permission link ready to copy.";
  }
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

function strokeLine(segment) {
  context.beginPath();
  context.moveTo(segment.from.x, segment.from.y);
  context.lineTo(segment.to.x, segment.to.y);
  context.stroke();
}

function fillCanvas(color) {
  context.save();
  context.globalCompositeOperation = "source-over";
  context.fillStyle = color;
  context.fillRect(0, 0, canvas.width, canvas.height);
  context.restore();
}

function drawMotorcycleArt() {
  const baseWidth = canvas.width;
  const baseHeight = canvas.height;
  const scale = Math.min(baseWidth / 1200, baseHeight / 780);
  const wheelY = baseHeight * 0.72;
  const rearX = baseWidth * 0.3;
  const frontX = baseWidth * 0.68;
  const wheelRadius = 62 * scale;

  context.save();
  context.globalCompositeOperation = "source-over";
  context.lineCap = "round";
  context.lineJoin = "round";

  context.strokeStyle = "#101723";
  context.fillStyle = "#ff5f36";
  context.lineWidth = 10 * scale;

  // Wheels
  context.beginPath();
  context.arc(rearX, wheelY, wheelRadius, 0, Math.PI * 2);
  context.arc(frontX, wheelY, wheelRadius, 0, Math.PI * 2);
  context.fillStyle = "#171717";
  context.fill();

  context.beginPath();
  context.arc(rearX, wheelY, wheelRadius * 0.45, 0, Math.PI * 2);
  context.arc(frontX, wheelY, wheelRadius * 0.45, 0, Math.PI * 2);
  context.fillStyle = "#f4f0e6";
  context.fill();

  // Frame
  context.beginPath();
  context.moveTo(rearX, wheelY);
  context.lineTo(baseWidth * 0.43, baseHeight * 0.5);
  context.lineTo(baseWidth * 0.57, baseHeight * 0.5);
  context.lineTo(frontX, wheelY);
  context.lineTo(baseWidth * 0.48, baseHeight * 0.6);
  context.closePath();
  context.stroke();

  // Seat
  context.beginPath();
  context.moveTo(baseWidth * 0.41, baseHeight * 0.46);
  context.lineTo(baseWidth * 0.53, baseHeight * 0.46);
  context.lineTo(baseWidth * 0.56, baseHeight * 0.49);
  context.lineTo(baseWidth * 0.43, baseHeight * 0.49);
  context.closePath();
  context.fillStyle = "#101723";
  context.fill();

  // Tank
  context.beginPath();
  context.moveTo(baseWidth * 0.5, baseHeight * 0.43);
  context.quadraticCurveTo(baseWidth * 0.58, baseHeight * 0.4, baseWidth * 0.6, baseHeight * 0.48);
  context.lineTo(baseWidth * 0.53, baseHeight * 0.51);
  context.quadraticCurveTo(baseWidth * 0.47, baseHeight * 0.49, baseWidth * 0.5, baseHeight * 0.43);
  context.fillStyle = "#ff5f36";
  context.fill();
  context.stroke();

  // Front fork and bars
  context.beginPath();
  context.moveTo(frontX, wheelY);
  context.lineTo(baseWidth * 0.61, baseHeight * 0.47);
  context.lineTo(baseWidth * 0.67, baseHeight * 0.39);
  context.moveTo(baseWidth * 0.67, baseHeight * 0.39);
  context.lineTo(baseWidth * 0.73, baseHeight * 0.37);
  context.stroke();

  // Rear frame and exhaust
  context.beginPath();
  context.moveTo(baseWidth * 0.43, baseHeight * 0.5);
  context.lineTo(baseWidth * 0.36, baseHeight * 0.42);
  context.moveTo(baseWidth * 0.38, baseHeight * 0.6);
  context.lineTo(baseWidth * 0.56, baseHeight * 0.63);
  context.stroke();

  // Headlight
  context.beginPath();
  context.arc(baseWidth * 0.655, baseHeight * 0.425, 14 * scale, 0, Math.PI * 2);
  context.fillStyle = "#f5c400";
  context.fill();
  context.stroke();

  // Ground line
  context.beginPath();
  context.moveTo(baseWidth * 0.18, wheelY + wheelRadius + 18 * scale);
  context.lineTo(baseWidth * 0.82, wheelY + wheelRadius + 18 * scale);
  context.strokeStyle = "rgba(20, 32, 51, 0.25)";
  context.lineWidth = 6 * scale;
  context.stroke();

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
    strokeLine(segment);
    pushWatchStroke({
      from: segment.from,
      to: segment.to,
      lineWidth: state.brushSize,
      erase: state.tool === "eraser",
      color: state.color
    });
  });
}

function drawRemoteSegment(payload) {
  context.save();
  context.lineCap = "round";
  context.lineJoin = "round";
  context.lineWidth = Number(payload.lineWidth) || defaultBrushSize;

  if (payload.erase) {
    context.globalCompositeOperation = "destination-out";
    context.strokeStyle = "rgba(0, 0, 0, 1)";
  } else {
    context.globalCompositeOperation = "source-over";
    context.strokeStyle = payload.color || "#1530ff";
  }

  strokeLine({
    from: payload.from,
    to: payload.to
  });
  context.restore();
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
  if (isDrawingFrozen()) {
    statusMessageEl.textContent = "Bear froze drawing right now.";
    updateStats("Frozen");
    return;
  }

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

const searchParams = new URLSearchParams(window.location.search);
const hasPermissionLink = searchParams.has(PERMISSION_QUERY_KEY);
const hasOwnerLink = searchParams.get(OWNER_QUERY_KEY) === "1";
const ownerAccess = window.localStorage.getItem(OWNER_STORAGE_KEY) === "true";
const friendAccess = window.localStorage.getItem(FRIEND_STORAGE_KEY) === "true";

if (ownerAccess || friendAccess || hasPermissionLink || hasOwnerLink) {
  if (hasPermissionLink) {
    window.localStorage.setItem(FRIEND_STORAGE_KEY, "true");
  }

  if (hasOwnerLink) {
    window.localStorage.setItem(OWNER_STORAGE_KEY, "true");
  }

  state.adminUnlocked = true;
}

brushToolBtn.addEventListener("click", () => setTool("brush"));
eraserToolBtn.addEventListener("click", () => setTool("eraser"));
mirrorOffBtn.addEventListener("click", () => setMirrorMode("off"));
mirrorVerticalBtn.addEventListener("click", () => setMirrorMode("vertical"));
mirrorHorizontalBtn.addEventListener("click", () => setMirrorMode("horizontal"));
mirrorQuadBtn.addEventListener("click", () => setMirrorMode("quad"));
toggleMirrorBtn.addEventListener("click", toggleMirror);
openAdminBtn.addEventListener("click", openAdminPanel);
closeAdminBtn.addEventListener("click", closeAdminPanel);
claimOwnerAccessBtn.addEventListener("click", () => {
  window.localStorage.setItem(OWNER_STORAGE_KEY, "true");
  unlockAdminAccess();
  statusMessageEl.textContent = "Bear controls unlocked on this browser.";
  setupRealtimePresence();
});
copyPermissionLinkBtn.addEventListener("click", copyPermissionLink);
burstConfettiBtn.addEventListener("click", () => {
  if (!state.adminUnlocked) {
    return;
  }

  spawnConfettiBurst();
  statusMessageEl.textContent = "Confetti burst launched.";
});
resetPartyBtn.addEventListener("click", () => {
  if (!state.adminUnlocked) {
    return;
  }

  applyAdminMode("normal");
  statusMessageEl.textContent = "Party powers reset to normal.";
});
globalBurstBtn.addEventListener("click", () => {
  if (!state.adminUnlocked) {
    return;
  }

  spawnConfettiBurst();
  pushGlobalAction("burst");
  statusMessageEl.textContent = "Global burst launched.";
});
globalClearBtn.addEventListener("click", () => {
  if (!state.adminUnlocked) {
    return;
  }

  state.strokeCount = 0;
  resetCanvas();
  pushGlobalAction("clear");
  statusMessageEl.textContent = "Global clear sent.";
});
globalShakeBtn.addEventListener("click", () => {
  if (!state.adminUnlocked) {
    return;
  }

  document.body.classList.remove("screen-shake");
  void document.body.offsetWidth;
  document.body.classList.add("screen-shake");
  window.setTimeout(() => {
    document.body.classList.remove("screen-shake");
  }, 650);
  pushGlobalAction("shake");
  statusMessageEl.textContent = "Global shake launched.";
});
surpriseColorBtn.addEventListener("click", () => {
  if (!state.adminUnlocked) {
    return;
  }

  const nextColor = surprisePalette[Math.floor(Math.random() * surprisePalette.length)];
  state.color = nextColor;
  colorPicker.value = nextColor;
  updateColorLabel();
  setTool("brush");
  pushGlobalActionPayload({
    type: "surprise-color",
    color: nextColor
  });
  statusMessageEl.textContent = "Surprise color launched.";
});
darkCanvasBtn.addEventListener("click", () => {
  if (!state.adminUnlocked) {
    return;
  }

  const nextColor = "#101723";
  state.background = nextColor;
  backgroundPicker.value = nextColor;
  fillCanvas(nextColor);
  pushGlobalActionPayload({
    type: "background-fill",
    color: nextColor
  });
  statusMessageEl.textContent = "Dark canvas launched.";
});
lightCanvasBtn.addEventListener("click", () => {
  if (!state.adminUnlocked) {
    return;
  }

  const nextColor = "#fffdf8";
  state.background = nextColor;
  backgroundPicker.value = nextColor;
  fillCanvas(nextColor);
  pushGlobalActionPayload({
    type: "background-fill",
    color: nextColor
  });
  statusMessageEl.textContent = "Light canvas launched.";
});
rainbowStormBtn.addEventListener("click", () => {
  if (!state.adminUnlocked) {
    return;
  }

  for (let index = 0; index < 3; index += 1) {
    window.setTimeout(spawnConfettiBurst, index * 260);
  }
  pushGlobalAction("rainbow-storm");
  statusMessageEl.textContent = "Rainbow storm launched.";
});
goldRushBtn.addEventListener("click", () => {
  if (!state.adminUnlocked) {
    return;
  }

  const nextColor = "#f5c400";
  state.color = nextColor;
  colorPicker.value = nextColor;
  updateColorLabel();
  setTool("brush");
  pushGlobalActionPayload({
    type: "surprise-color",
    color: nextColor
  });
  statusMessageEl.textContent = "Gold rush launched.";
});
nightPartyBtn.addEventListener("click", () => {
  if (!state.adminUnlocked) {
    return;
  }

  applyAdminMode("blackout");
  pushGlobalActionPayload({
    type: "background-fill",
    color: "#101723"
  });
  statusMessageEl.textContent = "Night party launched.";
});
flipColorsBtn.addEventListener("click", () => {
  if (!state.adminUnlocked) {
    return;
  }

  applyAdminMode("invert");
  pushGlobalActionPayload({
    type: "mode-set",
    mode: "invert"
  });
  statusMessageEl.textContent = "Flip colors launched.";
});
oceanWashBtn.addEventListener("click", () => {
  if (!state.adminUnlocked) {
    return;
  }

  const nextColor = "#bfe9ff";
  state.background = nextColor;
  backgroundPicker.value = nextColor;
  fillCanvas(nextColor);
  pushGlobalActionPayload({
    type: "background-fill",
    color: nextColor
  });
  statusMessageEl.textContent = "Ocean wash launched.";
});
pinkPopBtn.addEventListener("click", () => {
  if (!state.adminUnlocked) {
    return;
  }

  const nextColor = "#ff7fbe";
  state.color = nextColor;
  colorPicker.value = nextColor;
  updateColorLabel();
  setTool("brush");
  pushGlobalActionPayload({
    type: "surprise-color",
    color: nextColor
  });
  statusMessageEl.textContent = "Pink pop launched.";
});
megaPartyBtn.addEventListener("click", () => {
  if (!state.adminUnlocked) {
    return;
  }

  applyAdminMode("rainbow");
  for (let index = 0; index < 4; index += 1) {
    window.setTimeout(spawnConfettiBurst, index * 220);
  }
  pushGlobalAction("rainbow-storm");
  statusMessageEl.textContent = "Mega party launched.";
});
randomCommandBtn.addEventListener("click", () => {
  if (!state.adminUnlocked) {
    return;
  }

  const nextCommand = randomAdminCommands[Math.floor(Math.random() * randomAdminCommands.length)];
  nextCommand.run();
  statusMessageEl.textContent = `Random command chose ${nextCommand.label}.`;
});
lavaBlastBtn.addEventListener("click", () => {
  if (!state.adminUnlocked) {
    return;
  }

  applyAdminMode("lava");
  const nextColor = "#ff5f36";
  state.background = nextColor;
  backgroundPicker.value = nextColor;
  fillCanvas(nextColor);
  pushGlobalActionPayload({
    type: "background-fill",
    color: nextColor
  });
  statusMessageEl.textContent = "Lava blast launched.";
});
iceFlashBtn.addEventListener("click", () => {
  if (!state.adminUnlocked) {
    return;
  }

  applyAdminMode("ice");
  const nextColor = "#dff7ff";
  state.background = nextColor;
  backgroundPicker.value = nextColor;
  fillCanvas(nextColor);
  pushGlobalActionPayload({
    type: "background-fill",
    color: nextColor
  });
  statusMessageEl.textContent = "Ice flash launched.";
});
superBlackoutBtn.addEventListener("click", () => {
  if (!state.adminUnlocked) {
    return;
  }

  applyAdminMode("blackout");
  document.body.classList.remove("screen-shake");
  void document.body.offsetWidth;
  document.body.classList.add("screen-shake");
  window.setTimeout(() => {
    document.body.classList.remove("screen-shake");
  }, 650);
  pushGlobalAction("shake");
  pushGlobalActionPayload({
    type: "background-fill",
    color: "#101723"
  });
  statusMessageEl.textContent = "Super blackout launched.";
});
forestWashBtn.addEventListener("click", () => {
  if (!state.adminUnlocked) {
    return;
  }

  const nextColor = "#dff4d7";
  state.background = nextColor;
  backgroundPicker.value = nextColor;
  fillCanvas(nextColor);
  pushGlobalActionPayload({ type: "background-fill", color: nextColor });
  statusMessageEl.textContent = "Forest wash launched.";
});
galaxyBurstBtn.addEventListener("click", () => {
  if (!state.adminUnlocked) {
    return;
  }

  applyAdminMode("galaxy");
  for (let index = 0; index < 4; index += 1) {
    window.setTimeout(spawnConfettiBurst, index * 180);
  }
  pushGlobalAction("rainbow-storm");
  statusMessageEl.textContent = "Galaxy burst launched.";
});
lemonZingBtn.addEventListener("click", () => {
  if (!state.adminUnlocked) {
    return;
  }

  const nextColor = "#f5f08a";
  state.color = nextColor;
  colorPicker.value = nextColor;
  updateColorLabel();
  setTool("brush");
  pushGlobalActionPayload({ type: "surprise-color", color: nextColor });
  statusMessageEl.textContent = "Lemon zing launched.";
});
stormSlamBtn.addEventListener("click", () => {
  if (!state.adminUnlocked) {
    return;
  }

  applyAdminMode("storm");
  document.body.classList.remove("screen-shake");
  void document.body.offsetWidth;
  document.body.classList.add("screen-shake");
  window.setTimeout(() => {
    document.body.classList.remove("screen-shake");
  }, 650);
  pushGlobalAction("shake");
  statusMessageEl.textContent = "Storm slam launched.";
});
zebraFlipBtn.addEventListener("click", () => {
  if (!state.adminUnlocked) {
    return;
  }

  applyAdminMode("zebra");
  pushGlobalActionPayload({ type: "mode-set", mode: "zebra" });
  statusMessageEl.textContent = "Zebra flip launched.";
});
pixelPopBtn.addEventListener("click", () => {
  if (!state.adminUnlocked) {
    return;
  }

  applyAdminMode("pixel");
  pushGlobalActionPayload({ type: "mode-set", mode: "pixel" });
  statusMessageEl.textContent = "Pixel pop launched.";
});
roseRushBtn.addEventListener("click", () => {
  if (!state.adminUnlocked) {
    return;
  }

  const nextColor = "#ff9ac1";
  state.color = nextColor;
  colorPicker.value = nextColor;
  updateColorLabel();
  setTool("brush");
  pushGlobalActionPayload({ type: "surprise-color", color: nextColor });
  statusMessageEl.textContent = "Rose rush launched.";
});
mintSplashBtn.addEventListener("click", () => {
  if (!state.adminUnlocked) {
    return;
  }

  const nextColor = "#c7ffe2";
  state.background = nextColor;
  backgroundPicker.value = nextColor;
  fillCanvas(nextColor);
  pushGlobalActionPayload({ type: "background-fill", color: nextColor });
  statusMessageEl.textContent = "Mint splash launched.";
});
shadowDropBtn.addEventListener("click", () => {
  if (!state.adminUnlocked) {
    return;
  }

  applyAdminMode("shadow");
  pushGlobalActionPayload({ type: "mode-set", mode: "shadow" });
  statusMessageEl.textContent = "Shadow drop launched.";
});
glowUpBtn.addEventListener("click", () => {
  if (!state.adminUnlocked) {
    return;
  }

  applyAdminMode("glow");
  pushGlobalActionPayload({ type: "mode-set", mode: "glow" });
  statusMessageEl.textContent = "Glow up launched.";
});
drawMotorcycleBtn.addEventListener("click", () => {
  if (!state.adminUnlocked) {
    return;
  }

  drawMotorcycleArt();
  statusMessageEl.textContent = "Motorcycle drawn.";
});
startWatchModeBtn.addEventListener("click", () => {
  if (!state.adminUnlocked) {
    return;
  }

  pushWatchMode(true);
  updateWatchModeStatus(true);
  statusMessageEl.textContent = "Watch Bear Draw is on.";
});
stopWatchModeBtn.addEventListener("click", () => {
  if (!state.adminUnlocked) {
    return;
  }

  pushWatchMode(false);
  updateWatchModeStatus(false);
  statusMessageEl.textContent = "Watch Bear Draw is off.";
});
sendGlobalMessageBtn.addEventListener("click", () => {
  if (!state.adminUnlocked) {
    return;
  }

  let message = globalMessageInputEl.value.trim();

  if (!message) {
    const typedMessage = window.prompt("What should the global text say?");
    message = String(typedMessage || "").trim();
    globalMessageInputEl.value = message;
  }

  pushGlobalMessage(message);
  showGlobalBanner(message);
  statusMessageEl.textContent = message ? "Global text sent." : "Global text was empty.";
});
clearGlobalMessageBtn.addEventListener("click", () => {
  if (!state.adminUnlocked) {
    return;
  }

  globalMessageInputEl.value = "";
  pushGlobalMessage("");
  showGlobalBanner("");
  statusMessageEl.textContent = "Global text cleared.";
});
adminModeButtons.forEach((button) => {
  button.addEventListener("click", () => {
    if (!state.adminUnlocked) {
      return;
    }

    applyAdminMode(button.dataset.adminMode);
    if (button.dataset.adminMode === "giant") {
      statusMessageEl.textContent = "Bear mode changed to giant brush.";
      return;
    }

    if (button.dataset.adminMode === "freeze") {
      statusMessageEl.textContent = "Bear mode changed to freeze draw.";
      return;
    }

    if (button.dataset.adminMode === "invert") {
      statusMessageEl.textContent = "Bear mode changed to invert.";
      return;
    }

    if (button.dataset.adminMode === "spotlight") {
      statusMessageEl.textContent = "Bear mode changed to spotlight.";
      return;
    }

    if (button.dataset.adminMode === "lockcolor") {
      statusMessageEl.textContent = "Bear locked the colors.";
      return;
    }

    if (button.dataset.adminMode === "mini") {
      statusMessageEl.textContent = "Bear mode changed to mini brush.";
      return;
    }

    if (button.dataset.adminMode === "neon") {
      statusMessageEl.textContent = "Bear mode changed to neon.";
      return;
    }

    if (button.dataset.adminMode === "ghost") {
      statusMessageEl.textContent = "Bear mode changed to ghost.";
      return;
    }

    if (button.dataset.adminMode === "sunset") {
      statusMessageEl.textContent = "Bear mode changed to sunset.";
      return;
    }

    if (button.dataset.adminMode === "ocean") {
      statusMessageEl.textContent = "Bear mode changed to ocean.";
      return;
    }

    if (button.dataset.adminMode === "candy") {
      statusMessageEl.textContent = "Bear mode changed to candy.";
      return;
    }

    if (button.dataset.adminMode === "forest") {
      statusMessageEl.textContent = "Bear mode changed to forest.";
      return;
    }

    if (button.dataset.adminMode === "galaxy") {
      statusMessageEl.textContent = "Bear mode changed to galaxy.";
      return;
    }

    if (button.dataset.adminMode === "lemonade") {
      statusMessageEl.textContent = "Bear mode changed to lemonade.";
      return;
    }

    if (button.dataset.adminMode === "storm") {
      statusMessageEl.textContent = "Bear mode changed to storm.";
      return;
    }

    if (button.dataset.adminMode === "zebra") {
      statusMessageEl.textContent = "Bear mode changed to zebra.";
      return;
    }

    if (button.dataset.adminMode === "pixel") {
      statusMessageEl.textContent = "Bear mode changed to pixel.";
      return;
    }

    if (button.dataset.adminMode === "rose") {
      statusMessageEl.textContent = "Bear mode changed to rose.";
      return;
    }

    if (button.dataset.adminMode === "mint") {
      statusMessageEl.textContent = "Bear mode changed to mint.";
      return;
    }

    if (button.dataset.adminMode === "shadow") {
      statusMessageEl.textContent = "Bear mode changed to shadow.";
      return;
    }

    if (button.dataset.adminMode === "glow") {
      statusMessageEl.textContent = "Bear mode changed to glow.";
      return;
    }

    statusMessageEl.textContent = `Bear mode changed to ${button.dataset.adminMode}.`;
  });
});

colorPicker.addEventListener("input", () => {
  if (areColorsLocked()) {
    colorPicker.value = state.color;
    statusMessageEl.textContent = "Bear locked the colors right now.";
    return;
  }

  state.color = colorPicker.value;
  updateColorLabel();

  if (state.tool !== "brush") {
    setTool("brush");
  }
});

swatches.forEach((swatch) => {
  swatch.addEventListener("click", () => {
    if (areColorsLocked()) {
      statusMessageEl.textContent = "Bear locked the colors right now.";
      return;
    }

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
window.addEventListener("keydown", handleAdminShortcut);
window.addEventListener("keyup", handleAdminShortcut);
document.addEventListener("keydown", handleAdminShortcut);
document.addEventListener("keyup", handleAdminShortcut);
document.addEventListener("pointerdown", focusPageForShortcuts);

document.body.tabIndex = -1;
if (globalMessageInputEl) {
  globalMessageInputEl.disabled = !state.adminUnlocked;
}
updateColorLabel();
updateBrushLabel();
updateToolUI();
updateMirrorUI();
updateAdminAccessUI();
updateAdminModeUI();
updateMultiplayerPreview();
resizeCanvas();
runLoadingSequence();
setupRealtimePresence();
