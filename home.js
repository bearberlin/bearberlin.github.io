const playIntroSongBtn = document.getElementById("play-intro-song");
const homeSongLineEl = document.getElementById("home-song-line");

const introSongLines = [
  "So just draw me",
  "or you become a bee",
  "So just draw me",
  "or you become a bee",
  "So just draw me"
];

let introSongStarted = false;
let introSongActive = false;
let preferredIntroVoice = null;

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

function pickLovelyVoice() {
  if (!("speechSynthesis" in window)) {
    return null;
  }

  const voices = window.speechSynthesis.getVoices();
  if (!voices.length) {
    return null;
  }

  const lovelyVoice = voices.find((voice) => {
    const name = `${voice.name} ${voice.lang}`.toLowerCase();
    return name.includes("samantha")
      || name.includes("victoria")
      || name.includes("zira")
      || name.includes("ava")
      || name.includes("allison");
  });

  return lovelyVoice || voices.find((voice) => String(voice.lang || "").toLowerCase().startsWith("en")) || voices[0];
}

function singLine(line, delay) {
  window.setTimeout(() => {
    setHomeSongLine(line);

    if (!("speechSynthesis" in window)) {
      return;
    }

    const utterance = new SpeechSynthesisUtterance(line);
    utterance.rate = 0.84;
    utterance.pitch = 1.25;
    utterance.volume = 1;
    utterance.voice = preferredIntroVoice || pickLovelyVoice();
    window.speechSynthesis.speak(utterance);
  }, delay);
}

function playIntroSong() {
  if (introSongActive) {
    return;
  }

  introSongStarted = true;
  introSongActive = true;
  setSongPlayingState(true);

  if ("speechSynthesis" in window) {
    window.speechSynthesis.cancel();
  }

  preferredIntroVoice = pickLovelyVoice();

  introSongLines.forEach((line, index) => {
    singLine(line, index * 1450);
  });

  window.setTimeout(() => {
    introSongActive = false;
    setSongPlayingState(false);
    setHomeSongLine("So just draw me...");
  }, introSongLines.length * 1450 + 650);
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

if ("speechSynthesis" in window) {
  window.speechSynthesis.addEventListener("voiceschanged", () => {
    preferredIntroVoice = pickLovelyVoice();
  });
  preferredIntroVoice = pickLovelyVoice();
}

window.addEventListener("pointerdown", tryAutoplayIntroSong, { once: true });
window.addEventListener("keydown", tryAutoplayIntroSong, { once: true });
