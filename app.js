const SLIDE_MS = 20000;
const deck = document.getElementById("deck");
const slides = Array.from(deck.querySelectorAll(".slide"));
const timerEl = document.getElementById("timer");
const counterEl = document.getElementById("counter");
const pausedNote = document.getElementById("paused-note");

let index = 0;
let paused = false;
let elapsed = 0;        // ms consumed on the current slide
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

function show(i, resetTimer) {
  index = Math.max(0, Math.min(slides.length - 1, i));
  slides.forEach((s, n) => s.classList.toggle("active", n === index));
  counterEl.textContent = `${index + 1} / ${slides.length}`;
  segments.forEach((seg, n) => {
    seg.classList.toggle("done", n < index);
    const fill = seg.firstElementChild;
    if (n === index && resetTimer) fill.style.width = "0%";
  });
  preload(index + 1);
  preload(index + 2);
  if (resetTimer) elapsed = 0;
}

function tick(now) {
  if (lastTick !== null && !paused) {
    elapsed += now - lastTick;
    const p = Math.min(1, elapsed / SLIDE_MS);
    segments[index].firstElementChild.style.width = `${p * 100}%`;
    if (elapsed >= SLIDE_MS) {
      if (index < slides.length - 1) {
        show(index + 1, true);
      } else {
        // deck finished: hold on the last slide, bar full
        segments[index].firstElementChild.style.width = "100%";
      }
    }
  }
  lastTick = now;
  rafId = requestAnimationFrame(tick);
}

function togglePause() {
  paused = !paused;
  document.body.classList.toggle("paused", paused);
  document.getElementById("pause").textContent = paused ? "▶" : "❚❚";
}

document.addEventListener("keydown", (e) => {
  if (e.key === "ArrowRight" || e.key === " ") {
    e.preventDefault();
    show(index + 1, true);
  } else if (e.key === "ArrowLeft") {
    e.preventDefault();
    show(index - 1, true);
  } else if (e.key.toLowerCase() === "p") {
    togglePause();
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
document.body.appendChild(zones);

document.getElementById("next").addEventListener("click", () => show(index + 1, true));
document.getElementById("prev").addEventListener("click", () => show(index - 1, true));
document.getElementById("pause").addEventListener("click", togglePause);

show(0, true);
rafId = requestAnimationFrame(tick);
