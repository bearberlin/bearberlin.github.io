const playIntroSongBtn = document.getElementById("play-intro-song");
const homeSongLineEl = document.getElementById("home-song-line");
const homeVisitCountEl = document.getElementById("home-visit-count");
const homeVisitTodayCountEl = document.getElementById("home-visit-today-count");
const homeVisitNoteEl = document.getElementById("home-visit-note");

const introSongLines = [
  "So just draw me",
  "or you become a bee",
  "So just draw me",
  "or you become a bee",
  "So just draw me"
];

const introSongMelody = [
  ["C5", "E5", "G5", "E5"],
  ["B4", "D5", "G5", "D5"],
  ["C5", "E5", "A5", "E5"],
  ["B4", "D5", "G5", "D5"],
  ["C5", "E5", "G5", "C6"]
];

const noteFrequencies = {
  B4: 493.88,
  C5: 523.25,
  D5: 587.33,
  E5: 659.25,
  G5: 783.99,
  A5: 880,
  C6: 1046.5
};

let introSongStarted = false;
let introSongActive = false;
let audioContext = null;
const HOME_VISIT_STORAGE_KEY = "bear-home-visit-counted";
const HOME_VISIT_TODAY_STORAGE_KEY = "bear-home-visit-today";
const HOME_OWNER_EXCLUDED_KEY = "bear-home-owner-excluded";
const HOME_VISIT_PATH = "siteStats/homeVisits";
const OWNER_STORAGE_KEY = "color-current-owner-access";

function setHomeSongLine(line) {
  if (!homeSongLineEl) {
    return;
  }

  homeSongLineEl.textContent = line;
}

function setSongPlayingState(isPlaying) {
  if (!homeSongLineEl) {
    return;
  }

  homeSongLineEl.classList.toggle("is-singing", isPlaying);
}

function setVisitCounterState(totalLabel, todayLabel, noteLabel) {
  if (homeVisitCountEl) {
    homeVisitCountEl.textContent = totalLabel;
  }

  if (homeVisitTodayCountEl) {
    homeVisitTodayCountEl.textContent = todayLabel;
  }

  if (homeVisitNoteEl) {
    homeVisitNoteEl.textContent = noteLabel;
  }
}

function getTodayKey() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

async function initVisitCounter() {
  if (!homeVisitCountEl || !homeVisitTodayCountEl || !homeVisitNoteEl) {
    return;
  }

  const firebaseConfig = window.COLOR_CURRENT_FIREBASE_CONFIG;
  if (!firebaseConfig || !firebaseConfig.enabled) {
    setVisitCounterState("Offline", "Offline", "Firebase is not connected yet.");
    return;
  }

  setVisitCounterState("Loading...", "Loading...", "Connecting to the counter.");

  try {
    const [{ initializeApp, getApps }, { getDatabase, onValue, ref, runTransaction }] = await Promise.all([
      import("https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js"),
      import("https://www.gstatic.com/firebasejs/10.12.2/firebase-database.js")
    ]);

    const app = getApps().find((entry) => entry.name === "bear-home-counter")
      || initializeApp(firebaseConfig, "bear-home-counter");
    const database = getDatabase(app);
    const visitRootRef = ref(database, HOME_VISIT_PATH);
    const totalVisitsRef = ref(database, `${HOME_VISIT_PATH}/total`);
    const todayKey = getTodayKey();
    const todayVisitsRef = ref(database, `${HOME_VISIT_PATH}/days/${todayKey}`);
    const alreadyCounted = window.localStorage.getItem(HOME_VISIT_STORAGE_KEY) === "true";
    const alreadyCountedToday = window.localStorage.getItem(HOME_VISIT_TODAY_STORAGE_KEY) === todayKey;
    const isOwnerBrowser = window.localStorage.getItem(OWNER_STORAGE_KEY) === "true";
    const ownerAlreadyExcluded = window.localStorage.getItem(HOME_OWNER_EXCLUDED_KEY) === "true";

    onValue(visitRootRef, (snapshot) => {
      const stats = snapshot.val() || {};
      const total = Number(stats.total) || 0;
      const today = Number(stats.days?.[todayKey]) || 0;
      const visitLabel = String(total);
      const todayLabel = String(today);
      const browserLabel = isOwnerBrowser
        ? "Your browser is not counted."
        : alreadyCountedToday
          ? "This browser already counted today."
          : "This browser was counted today.";
      setVisitCounterState(visitLabel, todayLabel, `Ever and today. ${browserLabel}`);
    });

    if (isOwnerBrowser) {
      window.localStorage.removeItem(HOME_VISIT_STORAGE_KEY);
      window.localStorage.removeItem(HOME_VISIT_TODAY_STORAGE_KEY);

      if (alreadyCounted && !ownerAlreadyExcluded) {
        await runTransaction(totalVisitsRef, (current) => Math.max(0, (Number(current) || 0) - 1));
        window.localStorage.setItem(HOME_OWNER_EXCLUDED_KEY, "true");
      }

      return;
    }

    if (!alreadyCounted) {
      await runTransaction(totalVisitsRef, (current) => (Number(current) || 0) + 1);
      window.localStorage.setItem(HOME_VISIT_STORAGE_KEY, "true");
    }

    if (!alreadyCountedToday) {
      await runTransaction(todayVisitsRef, (current) => (Number(current) || 0) + 1);
      window.localStorage.setItem(HOME_VISIT_TODAY_STORAGE_KEY, todayKey);
    }
  } catch (error) {
    console.error("Visit counter failed", error);
    setVisitCounterState("Offline", "Offline", "The visit counter could not connect right now.");
  }
}

function getAudioContext() {
  const AudioContextClass = window.AudioContext || window.webkitAudioContext;
  if (!AudioContextClass) {
    return null;
  }

  if (!audioContext) {
    audioContext = new AudioContextClass();
  }

  return audioContext;
}

function playLovelyNote(frequency, startTime, duration, gainBoost = 1) {
  const context = getAudioContext();
  if (!context || !frequency) {
    return;
  }

  const masterGain = context.createGain();
  masterGain.gain.setValueAtTime(0.0001, startTime);
  masterGain.gain.linearRampToValueAtTime(0.14 * gainBoost, startTime + 0.05);
  masterGain.gain.exponentialRampToValueAtTime(0.0001, startTime + duration);
  masterGain.connect(context.destination);

  const mainOscillator = context.createOscillator();
  mainOscillator.type = "triangle";
  mainOscillator.frequency.setValueAtTime(frequency, startTime);
  mainOscillator.connect(masterGain);

  const shimmerOscillator = context.createOscillator();
  shimmerOscillator.type = "sine";
  shimmerOscillator.frequency.setValueAtTime(frequency * 2, startTime);

  const shimmerGain = context.createGain();
  shimmerGain.gain.setValueAtTime(0.0001, startTime);
  shimmerGain.gain.linearRampToValueAtTime(0.05 * gainBoost, startTime + 0.04);
  shimmerGain.gain.exponentialRampToValueAtTime(0.0001, startTime + duration * 0.9);
  shimmerOscillator.connect(shimmerGain);
  shimmerGain.connect(context.destination);

  mainOscillator.start(startTime);
  shimmerOscillator.start(startTime);
  mainOscillator.stop(startTime + duration);
  shimmerOscillator.stop(startTime + duration);
}

function playLovelyChord(noteNames, startTime) {
  noteNames.forEach((noteName, index) => {
    playLovelyNote(noteFrequencies[noteName], startTime + index * 0.18, 0.9, index === noteNames.length - 1 ? 1.15 : 1);
  });
}

function playIntroSong() {
  if (introSongActive) {
    return;
  }

  const context = getAudioContext();
  if (context && context.state === "suspended") {
    context.resume();
  }

  introSongStarted = true;
  introSongActive = true;
  setSongPlayingState(true);

  const startTime = context ? context.currentTime + 0.08 : 0;

  introSongLines.forEach((line, index) => {
    const lineDelay = index * 1.65;
    window.setTimeout(() => {
      setHomeSongLine(line);
    }, lineDelay * 1000);

    playLovelyChord(introSongMelody[index], startTime + lineDelay);
  });

  window.setTimeout(() => {
    introSongActive = false;
    setSongPlayingState(false);
    setHomeSongLine("So just draw me...");
  }, introSongLines.length * 1650 + 450);
}

function tryAutoplayIntroSong() {
  if (introSongStarted) {
    return;
  }

  playIntroSong();
}

if (playIntroSongBtn) {
  playIntroSongBtn.addEventListener("click", playIntroSong);
}

window.addEventListener("pointerdown", tryAutoplayIntroSong, { once: true });
window.addEventListener("keydown", tryAutoplayIntroSong, { once: true });

initVisitCounter();
