const canvas = document.getElementById("arcade-canvas");
const context = canvas.getContext("2d");
const scoreEl = document.getElementById("arcade-score");
const livesEl = document.getElementById("arcade-side");
const waveEl = document.getElementById("arcade-round");
const onlineEl = document.getElementById("arcade-online");
const statusEl = document.getElementById("arcade-status");
const confettiLayerEl = document.getElementById("arcade-confetti-layer");
const overlayCardEl = document.getElementById("arcade-overlay-card");
const overlayTitleEl = document.getElementById("arcade-overlay-title");
const overlayCopyEl = document.getElementById("arcade-overlay-copy");
const arcadeFullscreenBtn = document.getElementById("arcade-fullscreen");
const arcadeShootBtn = document.getElementById("arcade-shoot");
const startBtn = document.getElementById("arcade-start");
const restartBtn = document.getElementById("arcade-restart");
const saveNameBtn = document.getElementById("arcade-save-name");
const playerNameInput = document.getElementById("arcade-player-name");
const leaderboardEl = document.getElementById("arcade-leaderboard");
const playerListEl = document.getElementById("arcade-player-list");
const winnerEl = document.getElementById("arcade-winner");
const roundCopyEl = document.getElementById("arcade-round-copy");
const pickSingleBtn = document.getElementById("pick-single");
const pickMultiplayerBtn = document.getElementById("pick-multiplayer");
const pickShooterBtn = document.getElementById("pick-shooter");
const pickDoodleBtn = document.getElementById("pick-doodle");
const arcadeCanvasShellEl = document.querySelector(".arcade-canvas-shell");
const openArcadeAdminBtn = document.getElementById("open-arcade-admin");
const closeArcadeAdminBtn = document.getElementById("close-arcade-admin");
const claimArcadeAdminBtn = document.getElementById("claim-arcade-admin");
const arcadeAdminPanelEl = document.getElementById("arcade-admin-panel");
const arcadeAdminLockedEl = document.getElementById("arcade-admin-locked");
const arcadeAdminControlsEl = document.getElementById("arcade-admin-controls");
const arcadeAdminModeLabelEl = document.getElementById("arcade-admin-mode-label");
const arcadeOnlinePlayersCountEl = document.getElementById("arcade-online-players-count");
const arcadePartyButtons = document.querySelectorAll("[data-arcade-party]");
const arcadeAdminStartBtn = document.getElementById("arcade-admin-start");
const arcadeAdminResetBtn = document.getElementById("arcade-admin-reset");
const arcadeAdminFullscreenBtn = document.getElementById("arcade-admin-fullscreen");
const arcadeAdminConfettiBtn = document.getElementById("arcade-admin-confetti");
const arcadeAdminSpawnBtn = document.getElementById("arcade-admin-spawn");
const arcadeAdminClearDoodlesBtn = document.getElementById("arcade-admin-clear-doodles");
const arcadeAdminPlusScoreBtn = document.getElementById("arcade-admin-plus-score");
const arcadeAdminClearScoreBtn = document.getElementById("arcade-admin-clear-score");
const arcadeAdminEasyBtn = document.getElementById("arcade-admin-easy");
const arcadeAdminNormalBtn = document.getElementById("arcade-admin-normal");
const arcadeAdminHardBtn = document.getElementById("arcade-admin-hard");
const arcadeAdminTeleportBtn = document.getElementById("arcade-admin-teleport");
const arcadeAdminClearEscapedBtn = document.getElementById("arcade-admin-clear-escaped");
const arcadeAdminForceShootersBtn = document.getElementById("arcade-admin-force-shooters");
const arcadeAdminForceDoodlesBtn = document.getElementById("arcade-admin-force-doodles");
const arcadeAdminNextRoundBtn = document.getElementById("arcade-admin-next-round");
const arcadeAdminBonusRoundBtn = document.getElementById("arcade-admin-bonus-round");
const arcadeAdminSlowDoodlesBtn = document.getElementById("arcade-admin-slow-doodles");
const arcadeAdminSpeedDoodlesBtn = document.getElementById("arcade-admin-speed-doodles");
const arcadeAdminRandomBtn = document.getElementById("arcade-admin-random");
const arcadeAdminPlus200Btn = document.getElementById("arcade-admin-plus-200");
const arcadeAdminMinus50Btn = document.getElementById("arcade-admin-minus-50");
const arcadeAdminSpawn3Btn = document.getElementById("arcade-admin-spawn-3");
const arcadeAdminRemove1Btn = document.getElementById("arcade-admin-remove-1");
const arcadeAdminFreezeBtn = document.getElementById("arcade-admin-freeze");
const arcadeAdminThawBtn = document.getElementById("arcade-admin-thaw");
const arcadeAdminPartyBurstBtn = document.getElementById("arcade-admin-party-burst");
const arcadeAdminResetPartyBtn = document.getElementById("arcade-admin-reset-party");
const arcadeAdminSingleNowBtn = document.getElementById("arcade-admin-single-now");
const arcadeAdminMultiNowBtn = document.getElementById("arcade-admin-multi-now");

const PLAYER_NAME_KEY = "notebook-defender-name";
const SESSION_KEY = "notebook-defender-session";
const ADMIN_KEY = "notebook-defender-admin";
const FIREBASE_CONFIG = window.COLOR_CURRENT_FIREBASE_CONFIG || { enabled: false };
const sessionId = window.localStorage.getItem(SESSION_KEY) || `arcade-${Date.now()}-${Math.random().toString(16).slice(2, 8)}`;
window.localStorage.setItem(SESSION_KEY, sessionId);

const BOTTOM_LINE_Y = canvas.height - 72;
const PLAYER_RADIUS = 18;
const SHOT_LIFETIME = 1400;
const MAX_DOODLE_ESCAPES = 5;

const state = {
  connected: false,
  running: false,
  mode: "single",
  selectedSide: "shooter",
  localPlayer: null,
  players: {},
  rawShots: [],
  shots: [],
  singleEnemies: [],
  singleParticles: [],
  leaderboard: [],
  keys: new Set(),
  lastFrame: 0,
  lastSync: 0,
  fireCooldown: 0,
  onlineCount: 0,
  roundNumber: 1,
  roundWinner: "",
  roundPhase: "waiting",
  escapedDoodles: 0,
  myScore: 0,
  adminOpen: false,
  adminUnlocked: window.localStorage.getItem(ADMIN_KEY) === "true",
  arcadePartyMode: "normal",
  resolvingRound: false,
  processingTag: false,
  singleBest: 0,
  singleEscaped: 0,
  singleSpawnTimer: 0,
  singleDifficulty: 1
};

let animationFrameId = null;
let firebaseDatabase = null;
let firebaseFns = null;
let playerRef = null;
let presenceRef = null;
let presenceListRef = null;
let playersRef = null;
let shotsRef = null;
let roundRef = null;
let leaderboardRef = null;
let saveScore = null;
let incrementPlayerScore = null;
let resetRound = null;
let setRoundWinner = null;
let registerDoodleEscape = null;

const arcadeRandomCommands = [];

function getPlayerName() {
  return String(window.localStorage.getItem(PLAYER_NAME_KEY) || "").trim() || "Bear Friend";
}

function setPlayerName(name) {
  const trimmed = String(name || "").trim().slice(0, 18);
  if (!trimmed) {
    return false;
  }

  window.localStorage.setItem(PLAYER_NAME_KEY, trimmed);
  playerNameInput.value = trimmed;
  statusEl.textContent = `Player name saved as ${trimmed}.`;
  return true;
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function getSpawnForSide(side) {
  if (side === "doodle") {
    return {
      x: 160 + Math.random() * (canvas.width - 320),
      y: 88 + Math.random() * 60
    };
  }

  return {
    x: 160 + Math.random() * (canvas.width - 320),
    y: canvas.height - 112 - Math.random() * 40
  };
}

function setSelectedSide(side) {
  state.selectedSide = side;
  pickShooterBtn.classList.toggle("is-active", side === "shooter");
  pickDoodleBtn.classList.toggle("is-active", side === "doodle");
  overlayTitleEl.textContent = side === "shooter" ? "Join as a shooter" : "Join as a doodle";
  overlayCopyEl.textContent = side === "shooter"
    ? "Shooters use WASD or arrow keys and press space to launch bright star shots at doodles."
    : "Doodles weave through the arena and try to reach the notebook line at the bottom.";
}

function setMode(mode) {
  state.mode = mode;
  pickSingleBtn.classList.toggle("is-active", mode === "single");
  pickMultiplayerBtn.classList.toggle("is-active", mode === "multiplayer");
  pickDoodleBtn.disabled = mode === "single";
  pickDoodleBtn.classList.toggle("is-hidden", mode === "single");

  if (mode === "single") {
    setSelectedSide("shooter");
    overlayTitleEl.textContent = "Single Player";
    overlayCopyEl.textContent = "Move with WASD or arrow keys and press space to launch star shots at doodle bots.";
    statusEl.textContent = "Single player is ready. Start when you want.";
  } else {
    overlayTitleEl.textContent = "Doodles vs Shooters";
    overlayCopyEl.textContent = "Pick a side for the live Firebase match. Shooters fire star shots and doodles race for the notebook line.";
    statusEl.textContent = "Pick a side and join the live match.";
  }

  updateRoundUi();
  renderPlayerList();
}

function updateArcadeAdminUi() {
  if (!arcadeAdminPanelEl) {
    return;
  }

  arcadeAdminPanelEl.classList.toggle("is-hidden", !state.adminOpen);
  arcadeAdminLockedEl.classList.toggle("is-hidden", state.adminUnlocked);
  arcadeAdminControlsEl.classList.toggle("is-hidden", !state.adminUnlocked);
  arcadeAdminModeLabelEl.textContent = `Mode: ${state.arcadePartyMode[0].toUpperCase()}${state.arcadePartyMode.slice(1)}`;
  arcadePartyButtons.forEach((button) => {
    button.classList.toggle("is-active", button.dataset.arcadeParty === state.arcadePartyMode);
  });
  if (arcadeOnlinePlayersCountEl) {
    const otherPlayers = Math.max(0, state.onlineCount - (state.localPlayer ? 1 : 0));
    arcadeOnlinePlayersCountEl.textContent = state.mode === "multiplayer"
      ? `${otherPlayers} other players online right now`
      : "Single player mode is active right now";
  }
}

function openArcadeAdmin() {
  state.adminOpen = true;
  updateArcadeAdminUi();
}

function closeArcadeAdmin() {
  state.adminOpen = false;
  updateArcadeAdminUi();
}

function unlockArcadeAdmin() {
  state.adminUnlocked = true;
  window.localStorage.setItem(ADMIN_KEY, "true");
  statusEl.textContent = "Bear Controls unlocked on this browser.";
  updateArcadeAdminUi();
}

function clearArcadePartyClasses() {
  document.body.classList.remove(
    "party-disco",
    "party-rainbow",
    "party-blackout",
    "party-ocean"
  );
}

function spawnConfettiBurst() {
  if (!confettiLayerEl) {
    return;
  }

  for (let index = 0; index < 18; index += 1) {
    const piece = document.createElement("span");
    piece.className = "confetti-piece";
    piece.style.left = `${Math.random() * 100}%`;
    piece.style.background = ["#1530ff", "#ff5f36", "#f5c400", "#08b981", "#ff7fbe"][index % 5];
    piece.style.animationDuration = `${2 + Math.random() * 1.6}s`;
    piece.style.transform = `rotate(${Math.random() * 360}deg)`;
    confettiLayerEl.appendChild(piece);
    window.setTimeout(() => piece.remove(), 3800);
  }
}

function applyArcadePartyMode(mode) {
  state.arcadePartyMode = mode;
  clearArcadePartyClasses();

  if (mode === "disco") {
    document.body.classList.add("party-disco");
  } else if (mode === "confetti") {
    spawnConfettiBurst();
  } else if (mode === "blackout") {
    document.body.classList.add("party-blackout");
  } else if (mode === "rainbow") {
    document.body.classList.add("party-rainbow");
  } else if (mode === "ocean") {
    document.body.classList.add("party-ocean");
  }

  statusEl.textContent = mode === "normal" ? "Bear Controls reset the party mode." : `Bear turned on ${mode} mode.`;
  updateArcadeAdminUi();
}

function setSingleDifficultyPreset(level) {
  if (level === "easy") {
    state.singleDifficulty = 1;
    statusEl.textContent = "Single player set to easy.";
  } else if (level === "normal") {
    state.singleDifficulty = 3;
    statusEl.textContent = "Single player set to normal.";
  } else {
    state.singleDifficulty = 6;
    statusEl.textContent = "Single player set to hard.";
  }
}

function addLocalScore(amount) {
  state.myScore = Math.max(0, state.myScore + amount);
  if (state.localPlayer) {
    state.localPlayer.score = state.myScore;
  }
  state.singleBest = Math.max(state.singleBest, state.myScore);
  updateHud();
  renderPlayerList();
}

function spawnAdminDoodle() {
  if (state.mode === "single") {
    state.singleEnemies.push(createSingleEnemy());
    statusEl.textContent = "Bear spawned one doodle.";
    return;
  }

  statusEl.textContent = "Spawn Doodle works in single player.";
}

function spawnAdminDoodles(count) {
  for (let index = 0; index < count; index += 1) {
    spawnAdminDoodle();
  }
}

function clearAdminDoodles() {
  if (state.mode === "single") {
    state.singleEnemies = [];
    statusEl.textContent = "Bear cleared the doodles.";
    return;
  }

  statusEl.textContent = "Clear Doodles works in single player.";
}

function removeOneAdminDoodle() {
  if (state.mode === "single") {
    state.singleEnemies.pop();
    statusEl.textContent = "Bear removed one doodle.";
    return;
  }

  statusEl.textContent = "Remove 1 Doodle works in single player.";
}

function teleportLocalPlayerToCenter() {
  if (!state.localPlayer) {
    return;
  }

  state.localPlayer.x = canvas.width / 2;
  state.localPlayer.y = state.mode === "single" ? canvas.height - 104 : canvas.height - 120;
  if (state.mode === "multiplayer") {
    publishLocalPlayer();
  }
  statusEl.textContent = "You moved back to the center.";
}

async function clearEscapedCount() {
  if (state.mode === "single") {
    state.escapedDoodles = 0;
    state.singleEscaped = 0;
    updateHud();
    updateRoundUi();
    statusEl.textContent = "Escaped doodles cleared.";
    return;
  }

  if (!roundRef || !firebaseFns) {
    statusEl.textContent = "Multiplayer is not connected yet.";
    return;
  }

  await firebaseFns.update(roundRef, {
    escaped: 0,
    phase: "live",
    winner: "",
    updatedAt: Date.now()
  });
  statusEl.textContent = "Escaped counter cleared for everyone.";
}

async function adminForceWinner(side) {
  if (state.mode === "single") {
    state.running = false;
    overlayCardEl.classList.remove("is-hidden");
    overlayTitleEl.textContent = side === "shooters" ? "Shooters Win" : "Doodles Win";
    overlayCopyEl.textContent = side === "shooters"
      ? "Bear ended the round with a shooter win."
      : "Bear ended the round with a doodle win.";
    statusEl.textContent = `Bear forced a ${side} win.`;
    return;
  }

  if (!roundRef || !firebaseFns) {
    statusEl.textContent = "Multiplayer is not connected yet.";
    return;
  }

  await firebaseFns.update(roundRef, {
    phase: "finished",
    winner: side,
    updatedAt: Date.now()
  });
  statusEl.textContent = `Bear forced a ${side} win.`;
}

async function adminNextRound() {
  if (state.mode === "single") {
    state.roundNumber += 1;
    state.singleEnemies = [];
    state.singleSpawnTimer = 999;
    updateHud();
    statusEl.textContent = "Bear skipped to the next round.";
    return;
  }

  if (!resetRound) {
    statusEl.textContent = "Multiplayer is not connected yet.";
    return;
  }

  await resetRound(state.roundNumber + 1);
  statusEl.textContent = "Bear started the next round.";
}

function setSingleSpeedPreset(preset) {
  if (preset === "slow") {
    state.singleDifficulty = 1;
    state.singleEnemies.forEach((enemy) => {
      enemy.speed = Math.max(8, enemy.speed * 0.7);
    });
    statusEl.textContent = "Doodles slowed down.";
  } else {
    state.singleDifficulty = Math.max(2, state.singleDifficulty + 1);
    state.singleEnemies.forEach((enemy) => {
      enemy.speed *= 1.2;
    });
    statusEl.textContent = "Doodles sped up a little.";
  }
}

function freezeSingleDoodles() {
  if (state.mode !== "single") {
    statusEl.textContent = "Freeze Doodles works in single player.";
    return;
  }

  state.singleEnemies.forEach((enemy) => {
    enemy.speed = 0;
  });
  statusEl.textContent = "Doodles are frozen.";
}

function thawSingleDoodles() {
  if (state.mode !== "single") {
    statusEl.textContent = "Unfreeze Doodles works in single player.";
    return;
  }

  state.singleEnemies = state.singleEnemies.map((enemy) => ({
    ...enemy,
    speed: Math.max(20, 112 + Math.random() * 24 + state.singleDifficulty * 10),
    drift: 40 + Math.random() * 36,
    wobble: Math.random() * Math.PI * 2
  }));
  statusEl.textContent = "Doodles can move again.";
}

async function adminStartGame() {
  await joinMatch();
}

async function adminResetGame() {
  await resetMySpot();
}

function adminBonusRound() {
  state.roundNumber += 1;
  addLocalScore(100);
  state.singleSpawnTimer = 999;
  updateHud();
  statusEl.textContent = "Bonus round started.";
}

function setModeNow(mode) {
  setMode(mode);
  statusEl.textContent = mode === "single" ? "Bear switched to single player." : "Bear switched to multiplayer.";
}

async function toggleArcadeFullscreen() {
  if (!arcadeCanvasShellEl) {
    return;
  }

  try {
    if (document.fullscreenElement === arcadeCanvasShellEl) {
      await document.exitFullscreen();
      return;
    }

    await arcadeCanvasShellEl.requestFullscreen();
  } catch (error) {
    statusEl.textContent = "Fullscreen is not available right now.";
  }
}

function updateArcadeFullscreenButton() {
  if (!arcadeFullscreenBtn || !arcadeCanvasShellEl) {
    return;
  }

  const isFullscreen = document.fullscreenElement === arcadeCanvasShellEl;
  arcadeFullscreenBtn.textContent = isFullscreen ? "Exit Full Screen" : "Go Full Screen";
}

function updateHud() {
  scoreEl.textContent = String(state.myScore);
  if (state.mode === "single") {
    livesEl.textContent = "Shooter";
  } else {
    livesEl.textContent = state.localPlayer ? (state.localPlayer.side === "shooter" ? "Shooter" : "Doodle") : "None";
  }
  waveEl.textContent = String(state.roundNumber);
  onlineEl.textContent = `${state.escapedDoodles}/${MAX_DOODLE_ESCAPES}`;
  if (arcadeShootBtn) {
    const canShoot = state.mode === "single" || (state.localPlayer && state.localPlayer.side === "shooter");
    arcadeShootBtn.disabled = !canShoot;
    arcadeShootBtn.textContent = canShoot ? "Shoot" : "Only Shooters Shoot";
  }
  updateArcadeAdminUi();
}

function renderLeaderboard() {
  if (!state.leaderboard.length) {
    leaderboardEl.innerHTML = `
      <div class="leaderboard-row">
        <span class="leaderboard-rank">1</span>
        <span class="leaderboard-name">Be the first champion</span>
        <span class="leaderboard-score">0</span>
      </div>
    `;
    return;
  }

  leaderboardEl.innerHTML = state.leaderboard.map((entry, index) => `
    <div class="leaderboard-row">
      <span class="leaderboard-rank">${index + 1}</span>
      <span class="leaderboard-name">${escapeHtml(entry.name)} (${escapeHtml(entry.side || "player")})</span>
      <span class="leaderboard-score">${entry.score}</span>
    </div>
  `).join("");
}

function renderPlayerList() {
  if (state.mode === "single") {
    playerListEl.innerHTML = `
      <div class="leaderboard-row">
        <span class="leaderboard-rank">1</span>
        <span class="leaderboard-name">You [S]</span>
        <span class="leaderboard-score">${state.myScore}</span>
      </div>
      <div class="leaderboard-row">
        <span class="leaderboard-rank">2</span>
        <span class="leaderboard-name">Best Solo Run</span>
        <span class="leaderboard-score">${state.singleBest}</span>
      </div>
    `;
    return;
  }

  const entries = Object.values(state.players)
    .filter((player) => player && player.online)
    .sort((left, right) => {
      if ((right.score || 0) !== (left.score || 0)) {
        return (right.score || 0) - (left.score || 0);
      }
      return String(left.name || "").localeCompare(String(right.name || ""));
    });

  if (!entries.length) {
    playerListEl.innerHTML = `
      <div class="leaderboard-row">
        <span class="leaderboard-rank">1</span>
        <span class="leaderboard-name">No players yet</span>
        <span class="leaderboard-score">--</span>
      </div>
    `;
    return;
  }

  playerListEl.innerHTML = entries.map((entry, index) => `
    <div class="leaderboard-row">
      <span class="leaderboard-rank">${index + 1}</span>
      <span class="leaderboard-name">${escapeHtml(entry.name)} [${entry.side === "doodle" ? "D" : "S"}]</span>
      <span class="leaderboard-score">${entry.alive ? entry.score || 0 : "tagged"}</span>
    </div>
  `).join("");
}

function updateRoundUi() {
  if (state.mode === "single") {
    winnerEl.textContent = "Single Player";
    roundCopyEl.textContent = `Blast doodle bots before ${MAX_DOODLE_ESCAPES} of them reach the notebook line.`;
    return;
  }

  if (state.roundPhase === "live") {
    winnerEl.textContent = "Round is live";
    roundCopyEl.textContent = `Doodles are trying to reach the notebook line. If ${MAX_DOODLE_ESCAPES} escape, shooters lose the round.`;
    return;
  }

  if (state.roundWinner === "doodles") {
    winnerEl.textContent = "Doodles win";
    roundCopyEl.textContent = `${MAX_DOODLE_ESCAPES} doodles reached the notebook line, so the shooters lost the round.`;
    return;
  }

  if (state.roundWinner === "shooters") {
    winnerEl.textContent = "Shooters win";
    roundCopyEl.textContent = "Every doodle got tagged, so the shooters took the round.";
    return;
  }

  winnerEl.textContent = "Waiting for teams";
  roundCopyEl.textContent = "At least one doodle and one shooter are needed for a real round.";
}

function drawBackground() {
  context.clearRect(0, 0, canvas.width, canvas.height);
  context.fillStyle = "#f7fbff";
  context.fillRect(0, 0, canvas.width, canvas.height);

  context.strokeStyle = "rgba(21, 48, 255, 0.08)";
  context.lineWidth = 2;
  for (let y = 32; y < canvas.height; y += 36) {
    context.beginPath();
    context.moveTo(0, y);
    context.lineTo(canvas.width, y);
    context.stroke();
  }

  context.strokeStyle = "rgba(255, 95, 54, 0.2)";
  context.beginPath();
  context.moveTo(76, 0);
  context.lineTo(76, canvas.height);
  context.stroke();

  context.strokeStyle = "rgba(8, 185, 129, 0.8)";
  context.lineWidth = 4;
  context.beginPath();
  context.moveTo(0, BOTTOM_LINE_Y);
  context.lineTo(canvas.width, BOTTOM_LINE_Y);
  context.stroke();

  context.fillStyle = "rgba(8, 185, 129, 0.14)";
  context.fillRect(0, BOTTOM_LINE_Y, canvas.width, canvas.height - BOTTOM_LINE_Y);
}

function drawPlayer(player) {
  if (!player || !player.online) {
    return;
  }

  context.save();
  context.translate(player.x || 0, player.y || 0);
  context.globalAlpha = player.alive === false ? 0.3 : 1;

  if (player.side === "doodle") {
    context.fillStyle = "#ff5f36";
    context.beginPath();
    context.arc(0, 0, PLAYER_RADIUS, 0, Math.PI * 2);
    context.fill();
    context.fillStyle = "#171717";
    context.fillRect(-10, -4, 5, 5);
    context.fillRect(5, -4, 5, 5);
    context.fillRect(-8, 7, 16, 3);
  } else {
    context.fillStyle = "#1530ff";
    context.beginPath();
    context.moveTo(0, -24);
    context.lineTo(18, 18);
    context.lineTo(0, 10);
    context.lineTo(-18, 18);
    context.closePath();
    context.fill();
    context.fillStyle = "#f5c400";
    context.beginPath();
    context.arc(0, -6, 7, 0, Math.PI * 2);
    context.fill();
  }

  if (player.id === sessionId) {
    context.strokeStyle = "#111111";
    context.lineWidth = 3;
    context.beginPath();
    context.arc(0, 0, 26, 0, Math.PI * 2);
    context.stroke();
  }

  context.globalAlpha = 1;
  context.fillStyle = "#142033";
  context.font = "600 15px Space Grotesk";
  context.textAlign = "center";
  context.fillText(player.name || "Player", 0, -30);
  context.restore();
}

function drawSingleEnemy(enemy) {
  context.save();
  context.translate(enemy.x, enemy.y);
  context.fillStyle = "#ff5f36";
  context.beginPath();
  context.arc(0, 0, PLAYER_RADIUS, 0, Math.PI * 2);
  context.fill();
  context.fillStyle = "#171717";
  context.fillRect(-10, -4, 5, 5);
  context.fillRect(5, -4, 5, 5);
  context.fillRect(-8, 7, 16, 3);
  context.restore();
}

function drawShot(shot) {
  if (!shot) {
    return;
  }

  context.save();
  context.translate(shot.x, shot.y);
  context.fillStyle = "#f5c400";
  context.beginPath();
  for (let point = 0; point < 5; point += 1) {
    const outerAngle = (Math.PI * 2 * point) / 5 - Math.PI / 2;
    const innerAngle = outerAngle + Math.PI / 5;
    context.lineTo(Math.cos(outerAngle) * 8, Math.sin(outerAngle) * 8);
    context.lineTo(Math.cos(innerAngle) * 3.5, Math.sin(innerAngle) * 3.5);
  }
  context.closePath();
  context.fill();
  context.restore();
}

function render() {
  drawBackground();
  if (state.mode === "single") {
    if (state.localPlayer) {
      drawPlayer(state.localPlayer);
    }
    state.singleEnemies.forEach(drawSingleEnemy);
    state.shots.forEach(drawShot);
    return;
  }

  Object.values(state.players).forEach(drawPlayer);
  state.shots.forEach(drawShot);
}

function createSingleEnemy() {
  return {
    x: 80 + Math.random() * (canvas.width - 160),
    y: 80 + Math.random() * 40,
    speed: 112 + Math.random() * 24 + state.singleDifficulty * 10,
    drift: 40 + Math.random() * 36,
    wobble: Math.random() * Math.PI * 2
  };
}

function resetSinglePlayer() {
  state.running = true;
  state.roundNumber = 1;
  state.myScore = 0;
  state.escapedDoodles = 0;
  state.singleEscaped = 0;
  state.singleDifficulty = 1;
  state.singleSpawnTimer = 0;
  state.rawShots = [];
  state.shots = [];
  state.singleEnemies = Array.from({ length: 1 }, () => createSingleEnemy());
  state.localPlayer = {
    id: sessionId,
    name: getPlayerName(),
    side: "shooter",
    x: canvas.width / 2,
    y: canvas.height - 104,
    alive: true,
    online: true,
    score: 0
  };
  overlayCardEl.classList.add("is-hidden");
  statusEl.textContent = "Single player started. Stop the doodles.";
  updateHud();
  renderPlayerList();
  updateRoundUi();
}

function fireSingleShot() {
  if (!state.localPlayer || state.fireCooldown > 0) {
    return;
  }

  state.fireCooldown = 0.24;
  state.shots.push({
    x: state.localPlayer.x,
    y: state.localPlayer.y - 24,
    vx: 0,
    vy: -420
  });
}

function updateSinglePlayer(delta) {
  if (!state.localPlayer) {
    return;
  }

  updateLocalMovement(delta);

  state.shots = state.shots
    .map((shot) => ({
      ...shot,
      x: shot.x + shot.vx * delta,
      y: shot.y + shot.vy * delta
    }))
    .filter((shot) => shot.y > -40);

  state.singleEnemies = state.singleEnemies.filter((enemy) => {
    enemy.y += enemy.speed * delta;
    enemy.x += Math.sin(enemy.wobble + enemy.y * 0.02) * enemy.drift * delta;
    enemy.x = clamp(enemy.x, 28, canvas.width - 28);

    const bodyHit = Math.hypot(state.localPlayer.x - enemy.x, state.localPlayer.y - enemy.y) < PLAYER_RADIUS * 2;
    if (bodyHit) {
      state.myScore += 10;
      state.singleBest = Math.max(state.singleBest, state.myScore);
      state.localPlayer.score = state.myScore;
      statusEl.textContent = "You bumped a doodle and tagged it.";
      updateHud();
      renderPlayerList();
      return false;
    }

    const hitIndex = state.shots.findIndex((shot) => Math.hypot(shot.x - enemy.x, shot.y - enemy.y) < PLAYER_RADIUS + 8);
    if (hitIndex !== -1) {
      state.shots.splice(hitIndex, 1);
      state.myScore += 10;
      state.singleBest = Math.max(state.singleBest, state.myScore);
      state.localPlayer.score = state.myScore;
      updateHud();
      renderPlayerList();
      return false;
    }

    if (enemy.y >= BOTTOM_LINE_Y) {
      state.singleEscaped += 1;
      state.escapedDoodles = state.singleEscaped;
      updateHud();

      if (state.singleEscaped >= MAX_DOODLE_ESCAPES) {
        state.running = false;
        overlayCardEl.classList.remove("is-hidden");
        overlayTitleEl.textContent = "Single Player Over";
        overlayCopyEl.textContent = `${MAX_DOODLE_ESCAPES} doodles escaped. You scored ${state.myScore}. Try again and beat ${state.singleBest}.`;
        statusEl.textContent = `${MAX_DOODLE_ESCAPES} doodles reached the notebook line.`;
      } else {
        statusEl.textContent = `${state.singleEscaped} of ${MAX_DOODLE_ESCAPES} doodles escaped.`;
      }
      return false;
    }

    return true;
  });

  state.singleSpawnTimer += delta;
  if (state.singleEnemies.length < 1 && state.singleSpawnTimer > Math.max(1.2, 2.4 - state.singleDifficulty * 0.08)) {
    state.singleSpawnTimer = 0;
    state.singleEnemies.push(createSingleEnemy());
  }

  if (state.myScore > 0 && state.myScore % 250 === 0) {
    state.singleDifficulty = 1 + Math.floor(state.myScore / 250);
    state.roundNumber = 1 + Math.floor(state.myScore / 250);
    updateHud();
  }
}

function getLiveShots(rawShots) {
  const now = Date.now();
  return rawShots
    .filter((shot) => shot && typeof shot.createdAt === "number")
    .map((shot) => {
      const age = now - shot.createdAt;
      return {
        ...shot,
        age,
        x: shot.startX + shot.vx * (age / 1000),
        y: shot.startY + shot.vy * (age / 1000)
      };
    })
    .filter((shot) => shot.age >= 0
      && shot.age <= SHOT_LIFETIME
      && shot.x >= -40
      && shot.x <= canvas.width + 40
      && shot.y >= -60
      && shot.y <= canvas.height + 60);
}

function getTeamCounts() {
  const players = Object.values(state.players).filter((player) => player && player.online);
  const doodles = players.filter((player) => player.side === "doodle");
  const shooters = players.filter((player) => player.side === "shooter");
  const liveDoodles = doodles.filter((player) => player.alive !== false);
  return { players, doodles, shooters, liveDoodles };
}

async function publishLocalPlayer() {
  if (!playerRef || !state.localPlayer) {
    return;
  }

  try {
    await firebaseFns.update(playerRef, {
      name: state.localPlayer.name,
      side: state.localPlayer.side,
      x: state.localPlayer.x,
      y: state.localPlayer.y,
      alive: state.localPlayer.alive,
      online: true,
      updatedAt: Date.now()
    });
  } catch (error) {
    statusEl.textContent = "Could not update your player right now.";
  }
}

async function joinMatch() {
  if (state.mode === "single") {
    resetSinglePlayer();
    return;
  }

  if (!firebaseDatabase) {
    statusEl.textContent = "Firebase is not connected yet.";
    return;
  }

  const spawn = getSpawnForSide(state.selectedSide);
  state.localPlayer = {
    id: sessionId,
    name: getPlayerName(),
    side: state.selectedSide,
    x: spawn.x,
    y: spawn.y,
    alive: true,
    online: true,
    score: state.players[sessionId]?.score || 0
  };
  state.myScore = state.localPlayer.score;
  state.escapedDoodles = 0;
  state.running = true;
  overlayCardEl.classList.add("is-hidden");
  statusEl.textContent = `You joined as a ${state.selectedSide}.`;
  updateHud();
  await firebaseFns.set(playerRef, {
    ...state.localPlayer,
    updatedAt: Date.now()
  });
  await maybeStartRound();
}

async function resetMySpot() {
  if (state.mode === "single") {
    resetSinglePlayer();
    return;
  }

  if (!state.localPlayer) {
    await joinMatch();
    return;
  }

  const spawn = getSpawnForSide(state.localPlayer.side);
  state.localPlayer.x = spawn.x;
  state.localPlayer.y = spawn.y;
  state.localPlayer.alive = true;
  statusEl.textContent = "Your player was reset into the arena.";
  await publishLocalPlayer();
}

function updateLocalMovement(delta) {
  if (!state.localPlayer || state.localPlayer.alive === false) {
    return;
  }

  let dx = 0;
  let dy = 0;

  if (state.keys.has("arrowleft") || state.keys.has("a")) {
    dx -= 1;
  }
  if (state.keys.has("arrowright") || state.keys.has("d")) {
    dx += 1;
  }
  if (state.keys.has("arrowup") || state.keys.has("w")) {
    dy -= 1;
  }
  if (state.keys.has("arrowdown") || state.keys.has("s")) {
    dy += 1;
  }

  const speed = state.localPlayer.side === "doodle" ? 210 : 260;
  state.localPlayer.x = clamp(state.localPlayer.x + dx * speed * delta, 30, canvas.width - 30);

  if (state.localPlayer.side === "doodle") {
    state.localPlayer.y = clamp(state.localPlayer.y + dy * speed * delta, 40, canvas.height - 40);
  } else {
    state.localPlayer.y = clamp(state.localPlayer.y + dy * speed * delta, canvas.height * 0.48, canvas.height - 40);
  }
}

async function fireShot() {
  if (!state.localPlayer || state.localPlayer.side !== "shooter" || state.localPlayer.alive === false || !shotsRef) {
    return;
  }

  if (state.fireCooldown > 0) {
    return;
  }

  state.fireCooldown = 0.28;
  const shot = {
    ownerId: sessionId,
    startX: state.localPlayer.x,
    startY: state.localPlayer.y - 24,
    vx: 0,
    vy: -420,
    createdAt: Date.now()
  };

  try {
    await firebaseFns.push(shotsRef, shot);
  } catch (error) {
    statusEl.textContent = "Shot could not sync right now.";
  }
}

function tryShoot() {
  if (!state.running) {
    statusEl.textContent = "Press Start Game first.";
    return;
  }

  if (state.mode === "single") {
    fireSingleShot();
    return;
  }

  if (!state.localPlayer || state.localPlayer.side !== "shooter") {
    statusEl.textContent = "Pick Shooter if you want to shoot.";
    return;
  }

  fireShot();
}

async function maybeStartRound() {
  if (!roundRef) {
    return;
  }

  const { doodles, shooters } = getTeamCounts();
  if (!doodles.length || !shooters.length) {
    return;
  }

  if (state.roundPhase !== "waiting") {
    return;
  }

  try {
    await firebaseFns.update(roundRef, {
      phase: "live",
      winner: "",
      escaped: 0,
      updatedAt: Date.now()
    });
  } catch (error) {
    statusEl.textContent = "Round could not start yet.";
  }
}

async function resetPlayersForNewRound(nextRound) {
  const updates = {};
  Object.entries(state.players).forEach(([id, player]) => {
    if (!player || !player.online) {
      return;
    }

    const spawn = getSpawnForSide(player.side);
    updates[`notebookArena/players/${id}/x`] = spawn.x;
    updates[`notebookArena/players/${id}/y`] = spawn.y;
    updates[`notebookArena/players/${id}/alive`] = true;
    updates[`notebookArena/players/${id}/updatedAt`] = Date.now();
  });

  updates["notebookArena/round/phase"] = "live";
  updates["notebookArena/round/winner"] = "";
  updates["notebookArena/round/escaped"] = 0;
  updates["notebookArena/round/number"] = nextRound;
  updates["notebookArena/round/updatedAt"] = Date.now();

  try {
    await firebaseFns.update(firebaseFns.ref(firebaseDatabase), updates);
  } catch (error) {
    statusEl.textContent = "Could not reset the round yet.";
  }
}

async function awardPoint(playerId) {
  if (!incrementPlayerScore || !playerId) {
    return;
  }

  const nextScore = await incrementPlayerScore(playerId);
  if (playerId === sessionId) {
    state.myScore = nextScore;
    updateHud();
  }
}

async function handleRoundWin(winnerSide, scorerId) {
  if (!setRoundWinner || state.roundPhase !== "live" || state.resolvingRound) {
    return;
  }

  state.resolvingRound = true;

  const changed = await setRoundWinner(winnerSide);
  if (!changed) {
    state.resolvingRound = false;
    return;
  }

  if (scorerId) {
    await awardPoint(scorerId);
  }

  statusEl.textContent = winnerSide === "doodles"
    ? "Doodles reached the notebook line."
    : "Shooters tagged every doodle.";

  window.setTimeout(() => {
    resetRound(state.roundNumber + 1);
  }, 1800);
}

async function respawnLocalDoodle() {
  if (!state.localPlayer || state.localPlayer.side !== "doodle") {
    return;
  }

  const spawn = getSpawnForSide("doodle");
  state.localPlayer.x = spawn.x;
  state.localPlayer.y = spawn.y;
  state.localPlayer.alive = true;
  await publishLocalPlayer();
}

async function handleLocalObjectives() {
  if (!state.localPlayer || state.roundPhase !== "live" || state.localPlayer.alive === false) {
    return;
  }

  const { doodles, shooters, liveDoodles } = getTeamCounts();
  if (!doodles.length || !shooters.length) {
    return;
  }

  if (state.localPlayer.side === "doodle" && state.localPlayer.y >= BOTTOM_LINE_Y) {
    if (registerDoodleEscape) {
      const result = await registerDoodleEscape();
      state.escapedDoodles = result.escaped;
      updateHud();

      if (result.winner === "doodles") {
        statusEl.textContent = `${MAX_DOODLE_ESCAPES} doodles escaped. Shooters lose the round.`;
      } else {
        statusEl.textContent = `${result.escaped} of ${MAX_DOODLE_ESCAPES} doodles escaped.`;
        await respawnLocalDoodle();
      }
    }
    return;
  }

  if (state.localPlayer.side === "shooter" && doodles.length > 0 && liveDoodles.length === 0) {
    await handleRoundWin("shooters", sessionId);
  }
}

async function handleLocalCollisions() {
  if (!state.localPlayer
    || state.localPlayer.side !== "doodle"
    || state.localPlayer.alive === false
    || state.roundPhase !== "live"
    || state.processingTag) {
    return;
  }

  const hits = state.shots.some((shot) => {
    if (!shot || shot.ownerId === sessionId) {
      return false;
    }

    return Math.hypot((shot.x || 0) - state.localPlayer.x, (shot.y || 0) - state.localPlayer.y) < PLAYER_RADIUS + 8;
  });

  const bodyHitPlayer = Object.values(state.players).find((player) => {
    if (!player || !player.online || player.id === sessionId || player.side !== "shooter" || player.alive === false) {
      return false;
    }

    return Math.hypot((player.x || 0) - state.localPlayer.x, (player.y || 0) - state.localPlayer.y) < PLAYER_RADIUS * 2;
  });

  if (!hits && !bodyHitPlayer) {
    return;
  }

  state.processingTag = true;
  state.localPlayer.alive = false;
  statusEl.textContent = bodyHitPlayer ? "A shooter ran into you and tagged you." : "You were tagged. Wait for the next round.";
  await publishLocalPlayer();

  const { doodles, shooters, liveDoodles } = getTeamCounts();
  if (doodles.length > 0 && shooters.length > 0 && liveDoodles.length <= 1) {
    const shooterShot = state.shots.find((shot) => {
      if (!shot || shot.ownerId === sessionId) {
        return false;
      }
      return Math.hypot((shot.x || 0) - state.localPlayer.x, (shot.y || 0) - state.localPlayer.y) < PLAYER_RADIUS + 8;
    });
    await handleRoundWin("shooters", shooterShot?.ownerId || bodyHitPlayer?.id || null);
  }

  state.processingTag = false;
}

function syncLoop(timestamp) {
  const delta = Math.min(0.033, (timestamp - state.lastFrame) / 1000 || 0);
  state.lastFrame = timestamp;

  if (state.running) {
    state.fireCooldown = Math.max(0, state.fireCooldown - delta);
    if (state.mode === "single") {
      updateSinglePlayer(delta);
    } else {
      state.shots = getLiveShots(state.rawShots);
      updateLocalMovement(delta);

      const now = performance.now();
      if (now - state.lastSync > 80) {
        state.lastSync = now;
        publishLocalPlayer();
      }

      handleLocalObjectives();
      handleLocalCollisions();
    }
  }

  render();
  animationFrameId = requestAnimationFrame(syncLoop);
}

async function setupFirebase() {
  if (!FIREBASE_CONFIG.enabled) {
    statusEl.textContent = "Firebase multiplayer is not connected.";
    return;
  }

  try {
    const [{ initializeApp }, firebaseDb] = await Promise.all([
      import("https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js"),
      import("https://www.gstatic.com/firebasejs/10.12.2/firebase-database.js")
    ]);

    firebaseFns = firebaseDb;
    const {
      getDatabase,
      ref,
      set,
      update,
      push,
      query,
      orderByChild,
      limitToLast,
      onValue,
      onDisconnect,
      remove,
      runTransaction
    } = firebaseDb;

    const app = initializeApp(FIREBASE_CONFIG, "notebook-defender-multiplayer");
    firebaseDatabase = getDatabase(app);
    playersRef = ref(firebaseDatabase, "notebookArena/players");
    playerRef = ref(firebaseDatabase, `notebookArena/players/${sessionId}`);
    shotsRef = ref(firebaseDatabase, "notebookArena/shots");
    roundRef = ref(firebaseDatabase, "notebookArena/round");
    leaderboardRef = ref(firebaseDatabase, "notebookArena/highScores");
    presenceListRef = ref(firebaseDatabase, "notebookArena/presence");
    presenceRef = ref(firebaseDatabase, `notebookArena/presence/${sessionId}`);

    incrementPlayerScore = async (playerId) => {
      const scoreRef = ref(firebaseDatabase, `notebookArena/players/${playerId}/score`);
      const result = await runTransaction(scoreRef, (value) => (value || 0) + 1);
      const nextScore = result.snapshot.val() || 0;
      const player = state.players[playerId];
      if (player) {
        await set(ref(firebaseDatabase, `notebookArena/highScores/${playerId}`), {
          name: player.name || "Player",
          side: player.side || "player",
          score: nextScore,
          updatedAt: Date.now()
        });
      }
      return nextScore;
    };

    registerDoodleEscape = async () => {
      const result = await runTransaction(roundRef, (current) => {
        const base = current || { number: 1, phase: "waiting", winner: "", escaped: 0 };
        if (base.phase !== "live") {
          return;
        }

        const escaped = (base.escaped || 0) + 1;
        return {
          ...base,
          escaped,
          phase: escaped >= MAX_DOODLE_ESCAPES ? "finished" : "live",
          winner: escaped >= MAX_DOODLE_ESCAPES ? "doodles" : "",
          updatedAt: Date.now()
        };
      });

      const value = result.snapshot.val() || {};
      return {
        escaped: value.escaped || 0,
        winner: value.winner || ""
      };
    };

    setRoundWinner = async (winnerSide) => {
      const result = await runTransaction(roundRef, (current) => {
        const base = current || { number: 1, phase: "waiting", winner: "" };
        if (base.phase !== "live") {
          return;
        }
        return {
          ...base,
          phase: "finished",
          winner: winnerSide,
          updatedAt: Date.now()
        };
      });
      return result.committed;
    };

    resetRound = async (nextRound) => {
      await resetPlayersForNewRound(nextRound);
    };

    saveScore = async () => {
      if (!state.localPlayer) {
        return;
      }

      await set(ref(firebaseDatabase, `notebookArena/highScores/${sessionId}`), {
        name: state.localPlayer.name,
        side: state.localPlayer.side,
        score: state.localPlayer.score || 0,
        updatedAt: Date.now()
      });
    };

    onValue(query(leaderboardRef, orderByChild("score"), limitToLast(8)), (snapshot) => {
      state.leaderboard = Object.values(snapshot.val() || {})
        .filter((entry) => entry && typeof entry.score === "number")
        .sort((left, right) => right.score - left.score)
        .slice(0, 8);
      renderLeaderboard();
    });

    onValue(playersRef, (snapshot) => {
      const players = snapshot.val() || {};
      state.players = Object.fromEntries(Object.entries(players).map(([id, player]) => [
        id,
        { ...player, id }
      ]));

      if (state.players[sessionId]) {
        state.localPlayer = { ...state.players[sessionId], id: sessionId };
        state.myScore = state.localPlayer.score || 0;
      }

      updateHud();
      renderPlayerList();
      maybeStartRound();
    });

    onValue(query(shotsRef, orderByChild("createdAt"), limitToLast(60)), (snapshot) => {
      state.rawShots = Object.values(snapshot.val() || {});
      state.shots = getLiveShots(state.rawShots);
    });

    onValue(roundRef, (snapshot) => {
      const round = snapshot.val() || { number: 1, phase: "waiting", winner: "", escaped: 0 };
      state.roundNumber = round.number || 1;
      state.roundPhase = round.phase || "waiting";
      state.roundWinner = round.winner || "";
      state.escapedDoodles = round.escaped || 0;
      state.resolvingRound = false;
      state.processingTag = false;
      updateHud();
      updateRoundUi();
    });

    onValue(presenceListRef, (snapshot) => {
      state.onlineCount = Object.keys(snapshot.val() || {}).length;
      updateHud();
    });

    await set(presenceRef, {
      name: getPlayerName(),
      updatedAt: Date.now()
    });
    await onDisconnect(presenceRef).remove();
    await onDisconnect(playerRef).remove();

    window.addEventListener("beforeunload", () => {
      if (presenceRef) {
        remove(presenceRef);
      }
      if (playerRef) {
        remove(playerRef);
      }
    });

    state.connected = true;
    if (state.mode === "multiplayer") {
      statusEl.textContent = "Firebase multiplayer connected. Pick a side and join.";
    }
  } catch (error) {
    if (state.mode === "multiplayer") {
      statusEl.textContent = "Firebase multiplayer could not connect.";
    }
  }
}

function handleKeyDown(event) {
  const key = event.key.toLowerCase();
  const isShootKey = key === " " || key === "space" || key === "spacebar" || event.code === "Space";
  if (["arrowleft", "arrowright", "arrowup", "arrowdown", "a", "d", "w", "s"].includes(key) || isShootKey) {
    event.preventDefault();
  }

  state.keys.add(key);
  if (isShootKey) {
    tryShoot();
  }
}

function handleKeyUp(event) {
  state.keys.delete(event.key.toLowerCase());
}

playerNameInput.value = getPlayerName();
updateHud();
renderLeaderboard();
renderPlayerList();
updateRoundUi();
setMode("single");
setSelectedSide("shooter");
render();
setupFirebase();

arcadeRandomCommands.push(
  () => applyArcadePartyMode("disco"),
  () => applyArcadePartyMode("confetti"),
  () => applyArcadePartyMode("rainbow"),
  () => spawnAdminDoodle(),
  () => spawnAdminDoodles(3),
  () => addLocalScore(50),
  () => addLocalScore(200),
  () => addLocalScore(-50),
  () => clearAdminDoodles(),
  () => removeOneAdminDoodle(),
  () => teleportLocalPlayerToCenter(),
  () => adminBonusRound(),
  () => setSingleSpeedPreset("slow"),
  () => setSingleSpeedPreset("fast"),
  () => freezeSingleDoodles(),
  () => thawSingleDoodles(),
  () => applyArcadePartyMode("normal")
);

if (openArcadeAdminBtn) {
  openArcadeAdminBtn.addEventListener("click", openArcadeAdmin);
}
if (closeArcadeAdminBtn) {
  closeArcadeAdminBtn.addEventListener("click", closeArcadeAdmin);
}
if (claimArcadeAdminBtn) {
  claimArcadeAdminBtn.addEventListener("click", unlockArcadeAdmin);
}
arcadePartyButtons.forEach((button) => {
  button.addEventListener("click", () => {
    applyArcadePartyMode(button.dataset.arcadeParty);
  });
});
arcadeAdminStartBtn?.addEventListener("click", () => { adminStartGame(); });
arcadeAdminResetBtn?.addEventListener("click", () => { adminResetGame(); });
arcadeAdminFullscreenBtn?.addEventListener("click", () => { toggleArcadeFullscreen(); });
arcadeAdminConfettiBtn?.addEventListener("click", spawnConfettiBurst);
arcadeAdminSpawnBtn?.addEventListener("click", spawnAdminDoodle);
arcadeAdminClearDoodlesBtn?.addEventListener("click", clearAdminDoodles);
arcadeAdminPlusScoreBtn?.addEventListener("click", () => addLocalScore(50));
arcadeAdminClearScoreBtn?.addEventListener("click", () => addLocalScore(-state.myScore));
arcadeAdminEasyBtn?.addEventListener("click", () => setSingleDifficultyPreset("easy"));
arcadeAdminNormalBtn?.addEventListener("click", () => setSingleDifficultyPreset("normal"));
arcadeAdminHardBtn?.addEventListener("click", () => setSingleDifficultyPreset("hard"));
arcadeAdminTeleportBtn?.addEventListener("click", teleportLocalPlayerToCenter);
arcadeAdminClearEscapedBtn?.addEventListener("click", () => { clearEscapedCount(); });
arcadeAdminForceShootersBtn?.addEventListener("click", () => { adminForceWinner("shooters"); });
arcadeAdminForceDoodlesBtn?.addEventListener("click", () => { adminForceWinner("doodles"); });
arcadeAdminNextRoundBtn?.addEventListener("click", () => { adminNextRound(); });
arcadeAdminBonusRoundBtn?.addEventListener("click", adminBonusRound);
arcadeAdminSlowDoodlesBtn?.addEventListener("click", () => setSingleSpeedPreset("slow"));
arcadeAdminSpeedDoodlesBtn?.addEventListener("click", () => setSingleSpeedPreset("fast"));
arcadeAdminPlus200Btn?.addEventListener("click", () => addLocalScore(200));
arcadeAdminMinus50Btn?.addEventListener("click", () => addLocalScore(-50));
arcadeAdminSpawn3Btn?.addEventListener("click", () => spawnAdminDoodles(3));
arcadeAdminRemove1Btn?.addEventListener("click", removeOneAdminDoodle);
arcadeAdminFreezeBtn?.addEventListener("click", freezeSingleDoodles);
arcadeAdminThawBtn?.addEventListener("click", thawSingleDoodles);
arcadeAdminPartyBurstBtn?.addEventListener("click", () => {
  applyArcadePartyMode("disco");
  spawnConfettiBurst();
});
arcadeAdminResetPartyBtn?.addEventListener("click", () => applyArcadePartyMode("normal"));
arcadeAdminSingleNowBtn?.addEventListener("click", () => setModeNow("single"));
arcadeAdminMultiNowBtn?.addEventListener("click", () => setModeNow("multiplayer"));
arcadeAdminRandomBtn?.addEventListener("click", () => {
  const command = arcadeRandomCommands[Math.floor(Math.random() * arcadeRandomCommands.length)];
  command?.();
});

pickSingleBtn.addEventListener("click", () => setMode("single"));
pickMultiplayerBtn.addEventListener("click", () => setMode("multiplayer"));
pickShooterBtn.addEventListener("click", () => setSelectedSide("shooter"));
pickDoodleBtn.addEventListener("click", () => setSelectedSide("doodle"));
startBtn.addEventListener("click", joinMatch);
restartBtn.addEventListener("click", resetMySpot);
if (arcadeShootBtn) {
  arcadeShootBtn.addEventListener("click", () => {
    tryShoot();
  });
}
if (arcadeFullscreenBtn) {
  arcadeFullscreenBtn.addEventListener("click", () => {
    toggleArcadeFullscreen();
  });
}
saveNameBtn.addEventListener("click", async () => {
  const saved = setPlayerName(playerNameInput.value);
  if (!saved) {
    statusEl.textContent = "Pick a name first.";
    return;
  }

  if (presenceRef) {
    firebaseFns.set(presenceRef, { name: getPlayerName(), updatedAt: Date.now() }).catch(() => {});
  }

  if (state.localPlayer) {
    state.localPlayer.name = getPlayerName();
    await publishLocalPlayer();
    await saveScore?.();
  }
});

playerNameInput.addEventListener("keydown", (event) => {
  if (event.key === "Enter") {
    event.preventDefault();
    saveNameBtn.click();
  }
});

window.addEventListener("keydown", handleKeyDown);
window.addEventListener("keyup", handleKeyUp);
document.addEventListener("fullscreenchange", updateArcadeFullscreenButton);
updateArcadeFullscreenButton();
updateArcadeAdminUi();

if (!animationFrameId) {
  animationFrameId = requestAnimationFrame(syncLoop);
}
