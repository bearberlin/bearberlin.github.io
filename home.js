const playIntroSongBtn = document.getElementById("play-intro-song");
const copyRandomScreamBtn = document.getElementById("copy-random-scream");
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

const screamPhrases = [
  "AAAAA!",
  "EEEEEK!",
  "WAAAH!",
  "BEEEE!",
  "SKREEEE!",
  "AHHHHH!",
  "YOWWW!",
  "haaaahaaaaaahaaaaaahhaaaaaahhaaaaaahaaaaaa"
];

let introSongStarted = false;
let introSongActive = false;
let screamPlayed = false;
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

function playScreamSound(screamText) {
  const context = getAudioContext();
  if (!context) {
    setHomeSongLine(screamText);
    return;
  }

  if (context.state === "suspended") {
    context.resume();
  }

  const startTime = context.currentTime + 0.02;
  const frequencies = [880, 740, 980, 660, 1120];

  frequencies.forEach((frequency, index) => {
    const oscillator = context.createOscillator();
    const gain = context.createGain();
    oscillator.type = index % 2 === 0 ? "sawtooth" : "square";
    oscillator.frequency.setValueAtTime(frequency, startTime + index * 0.06);
    oscillator.frequency.exponentialRampToValueAtTime(Math.max(220, frequency * 0.45), startTime + 0.48 + index * 0.02);
    gain.gain.setValueAtTime(0.0001, startTime + index * 0.04);
    gain.gain.linearRampToValueAtTime(0.08, startTime + 0.05 + index * 0.04);
    gain.gain.exponentialRampToValueAtTime(0.0001, startTime + 0.6);
    oscillator.connect(gain);
    gain.connect(context.destination);
    oscillator.start(startTime + index * 0.04);
    oscillator.stop(startTime + 0.62);
  });

  setSongPlayingState(true);
  setHomeSongLine(screamText);
  window.setTimeout(() => {
    setSongPlayingState(false);
    setHomeSongLine("So just draw me...");
  }, 850);
}

function getRandomScreamPhrase() {
  return screamPhrases[Math.floor(Math.random() * screamPhrases.length)];
}

function buildRandomScreamLink() {
  const url = new URL(window.location.href);
  url.searchParams.set("scream", getRandomScreamPhrase());
  return url.toString();
}

async function copyRandomScreamLink() {
  const screamLink = buildRandomScreamLink();

  try {
    await navigator.clipboard.writeText(screamLink);
    setScreamStatus("Random scream link copied.");
  } catch (error) {
    setScreamStatus("Copy failed, but the scream link is ready in this page URL.");
  }
}

function maybePlaySharedScream() {
  if (screamPlayed) {
    return;
  }

  const screamText = new URLSearchParams(window.location.search).get("scream");
  if (!screamText) {
    return;
  }

  screamPlayed = true;
  setScreamStatus(`Shared scream loaded: ${screamText}`);
  playScreamSound(String(screamText).slice(0, 24));
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

if (copyRandomScreamBtn) {
  copyRandomScreamBtn.addEventListener("click", copyRandomScreamLink);
}

window.addEventListener("pointerdown", () => {
  maybePlaySharedScream();
  tryAutoplayIntroSong();
}, { once: true });
window.addEventListener("keydown", () => {
  maybePlaySharedScream();
  tryAutoplayIntroSong();
}, { once: true });

maybePlaySharedScream();
