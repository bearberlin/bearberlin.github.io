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

function setHomeSongLine(line) {
  if (!homeSongLineEl) {
    return;
  }

  homeSongLineEl.textContent = line;
}

function singLine(line, delay) {
  window.setTimeout(() => {
    setHomeSongLine(line);

    if (!("speechSynthesis" in window)) {
      return;
    }

    const utterance = new SpeechSynthesisUtterance(line);
    utterance.rate = 1.1;
    utterance.pitch = 1.45;
    utterance.volume = 0.95;
    window.speechSynthesis.speak(utterance);
  }, delay);
}

function playIntroSong() {
  if (introSongActive) {
    return;
  }

  introSongStarted = true;
  introSongActive = true;

  if ("speechSynthesis" in window) {
    window.speechSynthesis.cancel();
  }

  introSongLines.forEach((line, index) => {
    singLine(line, index * 1200);
  });

  window.setTimeout(() => {
    introSongActive = false;
    setHomeSongLine("So just draw me...");
  }, introSongLines.length * 1200 + 500);
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
