const playIntroSongBtn = document.getElementById("play-intro-song");
const homeSongLineEl = document.getElementById("home-song-line");
const homeVisitCountEl = document.getElementById("home-visit-count");
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
const HOME_VISIT_PATH = "siteStats/homeVisits";

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

function setVisitCounterState(countLabel, noteLabel) {
  if (homeVisitCountEl) {
    homeVisitCountEl.textContent = countLabel;
  }

  if (homeVisitNoteEl) {
    homeVisitNoteEl.textContent = noteLabel;
  }
}

async function initVisitCounter() {
  if (!homeVisitCountEl || !homeVisitNoteEl) {
    return;
  }

  const firebaseConfig = window.COLOR_CURRENT_FIREBASE_CONFIG;
  if (!firebaseConfig || !firebaseConfig.enabled) {
    setVisitCounterState("Counter offline", "Firebase is not connected yet.");
    return;
  }

  setVisitCounterState("Loading visits...", "Connecting to the counter.");

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
    const alreadyCounted = window.localStorage.getItem(HOME_VISIT_STORAGE_KEY) === "true";

    onValue(visitRootRef, (snapshot) => {
      const stats = snapshot.val() || {};
      const total = Number(stats.total) || 0;
      const visitLabel = total === 1 ? "1 visit" : `${total} visits`;
      const browserLabel = alreadyCounted
        ? "This browser already counted."
        : "This browser was counted.";
      setVisitCounterState(visitLabel, `Forever counter. ${browserLabel}`);
    });

    if (!alreadyCounted) {
      await runTransaction(totalVisitsRef, (current) => (Number(current) || 0) + 1);
      window.localStorage.setItem(HOME_VISIT_STORAGE_KEY, "true");
    }
  } catch (error) {
    console.error("Visit counter failed", error);
    setVisitCounterState("Counter offline", "The visit counter could not connect right now.");
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
