const SLIDE_MS = 20000;
const RING_C = 2 * Math.PI * 26; // countdown ring circumference

const deck = document.getElementById("deck");
const slides = Array.from(deck.querySelectorAll(".slide"));
const timerEl = document.getElementById("timer");
const counterEl = document.getElementById("counter");
const countdownEl = document.getElementById("countdown");
const secondsEl = document.getElementById("seconds");
const ringEl = countdownEl.querySelector(".ring");

let index = 0;
let started = false;   // play button pressed
let paused = false;
let elapsed = 0;       // ms consumed on the current slide
let lastTick = null;
let rafId = null;

// build the 20-segment timer bar
const segments = slides.map(() => {
  const seg = document.createElement("div");
  seg.className = "seg";
  const fill = document.createElement("div");
  fill.className = "fill";
  seg.appendChild(fill);
  timerEl.appendChild(seg);
  return seg;
});

// load images lazily, two slides ahead
function preload(i) {
  const s = slides[i];
  if (s && s.dataset.img && !s.style.getPropertyValue("--img")) {
    s.style.setProperty(`--img`, `url("${s.dataset.img}")`);
  }
}

function renderCountdown() {
  const remaining = Math.max(0, SLIDE_MS - elapsed);
  const secs = Math.ceil(remaining / 1000);
  secondsEl.textContent = secs;
  ringEl.style.strokeDashoffset = `${RING_C * (elapsed / SLIDE_MS)}`;
  countdownEl.classList.toggle("hot", secs <= 5 && remaining > 0);
}

function show(i, resetTimer) {
  index = Math.max(0, Math.min(slides.length - 1, i));
  slides.forEach((s, n) => s.classList.toggle("active", n === index));
  counterEl.textContent = `${index + 1} / ${slides.length}`;
  segments.forEach((seg, n) => seg.classList.toggle("done", n < index));
  preload(index + 1);
  preload(index + 2);
  if (resetTimer) {
    elapsed = 0;
    // un-started state: fresh 20 on the countdown until play is pressed
    if (!started) renderCountdown();
  }
  renderCountdown();
}

function tick(now) {
  if (lastTick !== null && started && !paused) {
    elapsed += now - lastTick;
    const p = Math.min(1, elapsed / SLIDE_MS);
    segments[index].firstElementChild.style.width = `${p * 100}%`;
    renderCountdown();
    if (elapsed >= SLIDE_MS) {
      if (index < slides.length - 1) {
        elapsed = 0;
        show(index + 1, true);
      } else {
        // deck finished: hold on the last slide, bar and ring full
        segments[index].firstElementChild.style.width = "100%";
      }
    }
  }
  lastTick = now;
  rafId = requestAnimationFrame(tick);
}

function startDeck() {
  started = true;
  document.body.classList.add("playing");
  document.getElementById("play").style.display = "none";
  // click zones only exist while playing, so the play button is reachable on the title slide
  document.body.appendChild(zones);
}

function togglePause() {
  paused = !paused;
  document.body.classList.toggle("paused", paused);
  document.getElementById("pause").textContent = paused ? "▶" : "❚❚";
}

document.getElementById("play").addEventListener("click", (e) => {
  e.stopPropagation();
  startDeck();
});

window.addEventListener("keydown", (e) => {
  if (e.key === "Enter" && !started) {
    e.preventDefault();
    startDeck();
    return;
  }
  if (e.key === "ArrowRight" || e.key === " ") {
    e.preventDefault();
    show(index + 1, true);
  } else if (e.key === "ArrowLeft") {
    e.preventDefault();
    show(index - 1, true);
  } else if (e.key.toLowerCase() === "p") {
    if (started) togglePause();
  } else if (e.key.toLowerCase() === "f") {
    document.fullscreenElement
      ? document.exitFullscreen()
      : document.documentElement.requestFullscreen();
  } else if (e.key === "Home") {
    show(0, true);
  }
});

// click zones: right two-thirds advance, left third goes back
const zones = document.createElement("div");
zones.id = "zones";
zones.innerHTML = `<div class="zone" data-d="-1"></div><div class="zone"></div><div class="zone"></div>`;
zones.addEventListener("click", (e) => {
  if (e.target.classList.contains("zone")) {
    const dir = e.target === zones.firstElementChild ? -1 : 1;
    show(index + dir, true);
  }
});
// appended to the DOM only in startDeck()

document.getElementById("next").addEventListener("click", () => show(index + 1, true));
document.getElementById("prev").addEventListener("click", () => show(index - 1, true));
document.getElementById("pause").addEventListener("click", togglePause);

show(0, true);
rafId = requestAnimationFrame(tick);
