const playIntroSongBtn = document.getElementById("play-intro-song");
const copyCaboomLinkBtn = document.getElementById("copy-caboom-link");
const homeSongLineEl = document.getElementById("home-song-line");
const screamStatusEl = document.getElementById("scream-status");

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
let caboomPlayed = false;
let audioContext = null;

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

function setScreamStatus(message) {
  if (!screamStatusEl) {
    return;
  }

  screamStatusEl.textContent = message;
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

function playCaboomSound() {
  const context = getAudioContext();
  if (!context) {
    setHomeSongLine("CABOOM!");
    return;
  }

  if (context.state === "suspended") {
    context.resume();
  }

  const startTime = context.currentTime + 0.02;
  const boomGain = context.createGain();
  boomGain.gain.setValueAtTime(0.0001, startTime);
  boomGain.gain.linearRampToValueAtTime(0.22, startTime + 0.03);
  boomGain.gain.exponentialRampToValueAtTime(0.0001, startTime + 1.1);
  boomGain.connect(context.destination);

  const boomOscillator = context.createOscillator();
  boomOscillator.type = "sawtooth";
  boomOscillator.frequency.setValueAtTime(110, startTime);
  boomOscillator.frequency.exponentialRampToValueAtTime(42, startTime + 0.75);
  boomOscillator.connect(boomGain);
  boomOscillator.start(startTime);
  boomOscillator.stop(startTime + 1.1);

  const crackGain = context.createGain();
  crackGain.gain.setValueAtTime(0.0001, startTime);
  crackGain.gain.linearRampToValueAtTime(0.16, startTime + 0.015);
  crackGain.gain.exponentialRampToValueAtTime(0.0001, startTime + 0.35);
  crackGain.connect(context.destination);

  const crackOscillator = context.createOscillator();
  crackOscillator.type = "square";
  crackOscillator.frequency.setValueAtTime(420, startTime);
  crackOscillator.frequency.exponentialRampToValueAtTime(120, startTime + 0.28);
  crackOscillator.connect(crackGain);
  crackOscillator.start(startTime);
  crackOscillator.stop(startTime + 0.35);

  setSongPlayingState(true);
  setHomeSongLine("CABOOM!");
  window.setTimeout(() => {
    setSongPlayingState(false);
    setHomeSongLine("So just draw me...");
  }, 1100);
}

function buildCaboomLink() {
  const url = new URL(window.location.href);
  url.searchParams.set("caboom", "1");
  return url.toString();
}

async function copyCaboomLink() {
  const screamLink = buildCaboomLink();

  try {
    await navigator.clipboard.writeText(screamLink);
    setScreamStatus("Caboom link copied.");
  } catch (error) {
    setScreamStatus("Copy failed, but the caboom link is ready in this page URL.");
  }
}

function maybePlaySharedCaboom() {
  if (caboomPlayed) {
    return;
  }

  const hasCaboom = new URLSearchParams(window.location.search).get("caboom") === "1";
  if (!hasCaboom) {
    return;
  }

  caboomPlayed = true;
  setScreamStatus("Shared caboom loaded.");
  playCaboomSound();
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

if (copyCaboomLinkBtn) {
  copyCaboomLinkBtn.addEventListener("click", copyCaboomLink);
}

window.addEventListener("pointerdown", () => {
  maybePlaySharedCaboom();
  tryAutoplayIntroSong();
}, { once: true });
window.addEventListener("keydown", () => {
  maybePlaySharedCaboom();
  tryAutoplayIntroSong();
}, { once: true });

maybePlaySharedCaboom();
