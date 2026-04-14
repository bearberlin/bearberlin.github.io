const canvas = document.getElementById("arcade-canvas");
const context = canvas.getContext("2d");
const scoreEl = document.getElementById("arcade-score");
const livesEl = document.getElementById("arcade-lives");
const waveEl = document.getElementById("arcade-wave");
const onlineEl = document.getElementById("arcade-online");
const statusEl = document.getElementById("arcade-status");
const overlayCardEl = document.getElementById("arcade-overlay-card");
const overlayTitleEl = document.getElementById("arcade-overlay-title");
const overlayCopyEl = document.getElementById("arcade-overlay-copy");
const startBtn = document.getElementById("arcade-start");
const restartBtn = document.getElementById("arcade-restart");
const saveNameBtn = document.getElementById("arcade-save-name");
const playerNameInput = document.getElementById("arcade-player-name");
const leaderboardEl = document.getElementById("arcade-leaderboard");

const PLAYER_NAME_KEY = "notebook-defender-name";
const SESSION_KEY = "notebook-defender-session";
const FIREBASE_CONFIG = window.COLOR_CURRENT_FIREBASE_CONFIG || { enabled: false };
const sessionId = window.localStorage.getItem(SESSION_KEY) || `arcade-${Date.now()}-${Math.random().toString(16).slice(2, 8)}`;
window.localStorage.setItem(SESSION_KEY, sessionId);

const state = {
  running: false,
  score: 0,
  lives: 0,
  wave: 1,
  player: { x: canvas.width / 2, y: canvas.height - 62, radius: 20, speed: 360 },
  bullets: [],
  enemies: [],
  particles: [],
  keys: new Set(),
  fireCooldown: 0,
  spawnTimer: 0,
  waveTimer: 0,
  lastFrame: 0,
  bestScore: 0,
  submittedBestScore: 0,
  leaderboard: [],
  onlineCount: 0,
  saveScore: null
};

let animationFrameId = null;
let firebaseDatabase = null;
let leaderboardRef = null;
let presenceRef = null;
let presenceListRef = null;

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

function resetGame() {
  state.running = false;
  state.score = 0;
  state.lives = state.bestScore;
  state.wave = 1;
  state.player.x = canvas.width / 2;
  state.player.y = canvas.height - 62;
  state.bullets = [];
  state.enemies = [];
  state.particles = [];
  state.fireCooldown = 0;
  state.spawnTimer = 0;
  state.waveTimer = 0;
  updateHud();
}

function startGame() {
  resetGame();
  state.running = true;
  state.lastFrame = performance.now();
  overlayCardEl.classList.add("is-hidden");
  statusEl.textContent = "Wave 1 started. Endless mode is on, so go for a huge score.";
  if (!animationFrameId) {
    animationFrameId = requestAnimationFrame(gameLoop);
  }
}

function updateHud() {
  scoreEl.textContent = String(state.score);
  livesEl.textContent = String(state.bestScore);
  waveEl.textContent = String(state.wave);
  onlineEl.textContent = String(state.onlineCount);
}

function spawnEnemy() {
  const roll = Math.random();
  const enemy = {
    x: 40 + Math.random() * (canvas.width - 80),
    y: -24,
    radius: roll > 0.88 ? 18 : roll > 0.45 ? 20 : 24,
    speed: roll > 0.88 ? 170 : roll > 0.45 ? 140 : 95,
    type: roll > 0.88 ? "gold-star" : roll > 0.45 ? "paper-plane" : "doodle-blob",
    wobble: Math.random() * Math.PI * 2
  };
  state.enemies.push(enemy);
}

function fireBullet() {
  if (state.fireCooldown > 0) {
    return;
  }

  state.bullets.push({
    x: state.player.x,
    y: state.player.y - 18,
    radius: 6,
    speed: 520
  });
  state.fireCooldown = 0.22;
}

function addBurst(x, y, color) {
  for (let index = 0; index < 8; index += 1) {
    state.particles.push({
      x,
      y,
      vx: (Math.random() - 0.5) * 180,
      vy: (Math.random() - 0.5) * 180,
      life: 0.5 + Math.random() * 0.4,
      color
    });
  }
}

function updatePlayer(delta) {
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

  state.player.x = Math.max(28, Math.min(canvas.width - 28, state.player.x + dx * state.player.speed * delta));
  state.player.y = Math.max(70, Math.min(canvas.height - 34, state.player.y + dy * state.player.speed * delta));
}

function updateBullets(delta) {
  state.bullets = state.bullets.filter((bullet) => {
    bullet.y -= bullet.speed * delta;
    return bullet.y > -20;
  });
}

function updateEnemies(delta) {
  state.enemies = state.enemies.filter((enemy) => {
    enemy.y += enemy.speed * delta;
    enemy.x += Math.sin(enemy.wobble + enemy.y * 0.01) * 22 * delta;

    if (enemy.y > canvas.height + 40) {
      state.score = Math.max(0, state.score - 10);
      updateHud();
      statusEl.textContent = "A target slipped past, so you lost 10 points.";
      return false;
    }

    return true;
  });
}

function updateParticles(delta) {
  state.particles = state.particles.filter((particle) => {
    particle.life -= delta;
    particle.x += particle.vx * delta;
    particle.y += particle.vy * delta;
    return particle.life > 0;
  });
}

function handleCollisions() {
  state.enemies = state.enemies.filter((enemy) => {
    const playerHit = Math.hypot(enemy.x - state.player.x, enemy.y - state.player.y) < enemy.radius + state.player.radius;
    if (playerHit) {
      state.score = Math.max(0, state.score - 15);
      addBurst(enemy.x, enemy.y, "#ff5f36");
      updateHud();
      statusEl.textContent = "Bonk. You lost 15 points, but the run keeps going.";
      return false;
    }

    const bulletIndex = state.bullets.findIndex((bullet) => Math.hypot(enemy.x - bullet.x, enemy.y - bullet.y) < enemy.radius + bullet.radius);
    if (bulletIndex !== -1) {
      state.bullets.splice(bulletIndex, 1);
      const points = enemy.type === "gold-star" ? 40 : enemy.type === "paper-plane" ? 18 : 12;
      state.score += points;
      state.bestScore = Math.max(state.bestScore, state.score);
      state.lives = state.bestScore;
      addBurst(enemy.x, enemy.y, enemy.type === "gold-star" ? "#f5c400" : "#1530ff");
      updateHud();
      saveScore();
      return false;
    }

    return true;
  });
}

function maybeAdvanceWave(delta) {
  state.waveTimer += delta;
  if (state.waveTimer > 12) {
    state.wave += 1;
    state.waveTimer = 0;
    statusEl.textContent = `Wave ${state.wave}! Targets are speeding up.`;
    updateHud();
  }
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

  context.strokeStyle = "rgba(255, 95, 54, 0.18)";
  context.beginPath();
  context.moveTo(76, 0);
  context.lineTo(76, canvas.height);
  context.stroke();
}

function drawPlayer() {
  context.save();
  context.translate(state.player.x, state.player.y);

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
  context.restore();
}

function drawBullet(bullet) {
  context.save();
  context.translate(bullet.x, bullet.y);
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

function drawEnemy(enemy) {
  context.save();
  context.translate(enemy.x, enemy.y);

  if (enemy.type === "paper-plane") {
    context.fillStyle = "#ffffff";
    context.strokeStyle = "#1530ff";
    context.lineWidth = 2;
    context.beginPath();
    context.moveTo(-20, -10);
    context.lineTo(22, 0);
    context.lineTo(-20, 10);
    context.lineTo(-4, 0);
    context.closePath();
    context.fill();
    context.stroke();
  } else if (enemy.type === "gold-star") {
    context.fillStyle = "#f5c400";
    context.beginPath();
    for (let point = 0; point < 5; point += 1) {
      const outerAngle = (Math.PI * 2 * point) / 5 - Math.PI / 2;
      const innerAngle = outerAngle + Math.PI / 5;
      context.lineTo(Math.cos(outerAngle) * 20, Math.sin(outerAngle) * 20);
      context.lineTo(Math.cos(innerAngle) * 8, Math.sin(innerAngle) * 8);
    }
    context.closePath();
    context.fill();
  } else {
    context.fillStyle = "#ff5f36";
    context.beginPath();
    context.arc(0, 0, enemy.radius, 0, Math.PI * 2);
    context.fill();
    context.fillStyle = "#171717";
    context.fillRect(-10, -4, 5, 5);
    context.fillRect(5, -4, 5, 5);
    context.fillRect(-8, 7, 16, 3);
  }

  context.restore();
}

function drawParticles() {
  state.particles.forEach((particle) => {
    context.fillStyle = particle.color;
    context.globalAlpha = Math.max(0, particle.life);
    context.beginPath();
    context.arc(particle.x, particle.y, 3, 0, Math.PI * 2);
    context.fill();
    context.globalAlpha = 1;
  });
}

function render() {
  drawBackground();
  drawPlayer();
  state.bullets.forEach(drawBullet);
  state.enemies.forEach(drawEnemy);
  drawParticles();
}

function gameLoop(timestamp) {
  const delta = Math.min(0.033, (timestamp - state.lastFrame) / 1000 || 0);
  state.lastFrame = timestamp;

  if (state.running) {
    state.fireCooldown = Math.max(0, state.fireCooldown - delta);
    state.spawnTimer += delta;
    updatePlayer(delta);
    updateBullets(delta);
    updateEnemies(delta);
    updateParticles(delta);
    handleCollisions();
    maybeAdvanceWave(delta);

    const spawnEvery = Math.max(0.28, 1 - state.wave * 0.06);
    if (state.spawnTimer > spawnEvery) {
      state.spawnTimer = 0;
      spawnEnemy();
    }

    if (state.keys.has(" ") || state.keys.has("space")) {
      fireBullet();
    }

  }

  render();
  animationFrameId = requestAnimationFrame(gameLoop);
}

async function setupFirebase() {
  if (!FIREBASE_CONFIG.enabled) {
    statusEl.textContent = "Firebase leaderboard is not connected.";
    return;
  }

  try {
    const [{ initializeApp }, firebaseDb] = await Promise.all([
      import("https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js"),
      import("https://www.gstatic.com/firebasejs/10.12.2/firebase-database.js")
    ]);

    const {
      getDatabase,
      ref,
      set,
      query,
      orderByChild,
      limitToLast,
      onValue,
      onDisconnect,
      remove
    } = firebaseDb;

    const app = initializeApp(FIREBASE_CONFIG, "notebook-defender");
    firebaseDatabase = getDatabase(app);
    leaderboardRef = ref(firebaseDatabase, "shooterArcade/highScores");
    presenceListRef = ref(firebaseDatabase, "shooterArcade/presence");
    presenceRef = ref(firebaseDatabase, `shooterArcade/presence/${sessionId}`);

    onValue(query(leaderboardRef, orderByChild("score"), limitToLast(8)), (snapshot) => {
      const entries = Object.values(snapshot.val() || {})
        .filter((entry) => entry && typeof entry.score === "number")
        .sort((left, right) => right.score - left.score)
        .slice(0, 8);
      state.leaderboard = entries;
      renderLeaderboard();
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

    window.addEventListener("beforeunload", () => {
      if (presenceRef) {
        remove(presenceRef);
      }
    });

    state.saveScore = async (score) => {
      const playerName = getPlayerName();
      await set(ref(firebaseDatabase, `shooterArcade/highScores/${sessionId}`), {
        name: playerName,
        score,
        updatedAt: Date.now()
      });
    };
  } catch (error) {
    statusEl.textContent = "Firebase leaderboard could not connect, but the game still works.";
  }
}

function renderLeaderboard() {
  if (!state.leaderboard.length) {
    leaderboardEl.innerHTML = `
      <div class="leaderboard-row">
        <span class="leaderboard-rank">1</span>
        <span class="leaderboard-name">Be the first defender</span>
        <span class="leaderboard-score">0</span>
      </div>
    `;
    return;
  }

  leaderboardEl.innerHTML = state.leaderboard.map((entry, index) => `
    <div class="leaderboard-row">
      <span class="leaderboard-rank">${index + 1}</span>
      <span class="leaderboard-name">${escapeHtml(entry.name)}</span>
      <span class="leaderboard-score">${entry.score}</span>
    </div>
  `).join("");
}

async function saveScore() {
  if (!state.saveScore) {
    return;
  }

  if (state.score <= state.submittedBestScore) {
    return;
  }

  try {
    await state.saveScore(state.score);
    state.submittedBestScore = state.score;
  } catch (error) {
    statusEl.textContent = "Your score was great, but Firebase could not save it.";
  }
}

function handleKeyDown(event) {
  const key = event.key.toLowerCase();
  if (["arrowleft", "arrowright", "arrowup", "arrowdown", "a", "d", "w", "s", " "].includes(key)) {
    event.preventDefault();
  }
  state.keys.add(key);
  if (key === " " && state.running) {
    fireBullet();
  }
}

function handleKeyUp(event) {
  state.keys.delete(event.key.toLowerCase());
}

playerNameInput.value = getPlayerName();
updateHud();
renderLeaderboard();
render();
setupFirebase();

startBtn.addEventListener("click", startGame);
restartBtn.addEventListener("click", startGame);
saveNameBtn.addEventListener("click", () => {
  setPlayerName(playerNameInput.value);
  if (presenceRef) {
    import("https://www.gstatic.com/firebasejs/10.12.2/firebase-database.js")
      .then(({ set }) => set(presenceRef, { name: getPlayerName(), updatedAt: Date.now() }))
      .catch(() => {});
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
