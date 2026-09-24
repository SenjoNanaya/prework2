const KEY = "upskill.prework.v1";
const STAGE_COUNT = 7;

const defaults = {
  slide: 0,
  stage: 0,
  visited: [],
  hook: null,
  sequence: [],
  quiz: [null, null, null],
  question: "",
};

const STAGES = [
  { n: 1, name: "Problem understanding" },
  { n: 2, name: "Data ingestion" },
  { n: 3, name: "Data storage & processing" },
  { n: 4, name: "Data analysis" },
  { n: 5, name: "Data modeling" },
  { n: 6, name: "Model deployment" },
  { n: 7, name: "Storytelling & communication" },
];

const POOL_ORDER = [3, 6, 1, 5, 2, 7, 4];

const HOOK_NOTES = {
  0: "Home cooking leaves data too: what you bought, where, and when.",
  1: "Every order is a row: restaurant, amount, timestamp, address.",
  2: "A skipped meal still leaves traces if an app, a receipt, or a message knows about it. Absence is data too.",
};

const QUIZ = [
  {
    correct: 1,
    note: "Every project starts by framing the problem with domain experts.",
  },
  {
    correct: 2,
    note: "Extract, transform, load: pull the data, shape it, store it.",
  },
  {
    correct: 0,
    note: "The model memorized the training set instead of learning the pattern.",
  },
];

const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

const slides = Array.from(document.querySelectorAll("[data-slide]"));
const deck = document.getElementById("deck");
const mapSlide = document.getElementById("s03");
const traveler = document.querySelector("[data-traveler]");
const readout = document.querySelector("[data-readout]");
const bandNode = document.querySelector("[data-band-node]");
const ticks = document.querySelectorAll("[data-ticks] li");
const prevBtn = document.querySelector("[data-prev]");
const nextBtn = document.querySelector("[data-next]");

let state = load();
let index = 0;
let travelerStage = 0;
let travelTimer;

function load() {
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? { ...defaults, ...JSON.parse(raw) } : { ...defaults };
  } catch {
    return { ...defaults };
  }
}

function save() {
  try {
    localStorage.setItem(KEY, JSON.stringify(state));
  } catch {
    return;
  }
}

function pad(n) {
  return String(n).padStart(2, "0");
}

function clockTime() {
  const d = new Date();
  return `${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function band() {
  readout.textContent = pad(index + 1);
  const label = slides[index] ? slides[index].dataset.label || "" : "";
  bandNode.textContent = label ? `  //  ${label}` : "";
  ticks.forEach((tick, i) => {
    tick.classList.toggle("is-on", state.visited.includes(i + 1));
  });
  prevBtn.disabled = index === 0;
  nextBtn.disabled = index === slides.length - 1;
}

function renderMap() {
  document.querySelectorAll("[data-goto][data-stage]").forEach((btn) => {
    const n = Number(btn.dataset.stage);
    btn.classList.toggle("is-visited", state.visited.includes(n));
    btn.classList.toggle("is-current", state.stage === n);
  });
}

function placeTraveler(animate, stageOverride) {
  if (!traveler || !mapSlide) {
    return;
  }
  const id = stageOverride === undefined ? state.stage : stageOverride;
  if (!id || !mapSlide.classList.contains("is-active")) {
    traveler.hidden = true;
    return;
  }
  const slot = mapSlide.querySelector(`[data-marker="${id}"]`);
  const host = mapSlide.querySelector(".map");
  if (!slot || !host) {
    traveler.hidden = true;
    return;
  }
  traveler.hidden = false;
  const hostBox = host.getBoundingClientRect();
  const slotBox = slot.getBoundingClientRect();
  const size = traveler.offsetWidth || 28;
  const x = Math.round(slotBox.left - hostBox.left + slotBox.width / 2 - size / 2);
  const y = Math.round(slotBox.top - hostBox.top + slotBox.height / 2 - size / 2);
  if (!animate) {
    traveler.classList.add("is-snap");
  }
  traveler.style.transform = `translate(${x}px, ${y}px)`;
  if (!animate) {
    requestAnimationFrame(() => traveler.classList.remove("is-snap"));
  }
  travelerStage = id;
}

function enterMap() {
  if (!traveler) {
    return;
  }
  if (!state.stage) {
    traveler.hidden = true;
    return;
  }
  if (travelerStage && travelerStage !== state.stage) {
    placeTraveler(false, travelerStage);
    requestAnimationFrame(() => placeTraveler(true));
    return;
  }
  placeTraveler(false);
}

function goTo(n, opts = {}) {
  const next = Math.max(0, Math.min(slides.length - 1, n));
  index = next;
  const slide = slides[next];

  slides.forEach((s, i) => {
    const active = i === next;
    s.classList.toggle("is-active", active);
    if (active) {
      s.removeAttribute("inert");
      s.removeAttribute("aria-hidden");
    } else {
      s.setAttribute("inert", "");
      s.setAttribute("aria-hidden", "true");
    }
  });

  const inner = slide.querySelector(".slide__inner");
  if (inner) {
    inner.scrollTop = 0;
  }

  const stage = Number(slide.dataset.stage || 0);
  if (stage) {
    state.stage = stage;
    if (!state.visited.includes(stage)) {
      state.visited.push(stage);
    }
  }
  state.slide = next;
  save();

  band();
  renderMap();

  if (slide === mapSlide) {
    enterMap();
  } else if (traveler) {
    traveler.hidden = true;
  }

  history.replaceState(null, "", `#${slide.id}`);

  if (opts.focus !== false) {
    slide.focus({ preventScroll: true });
  }
}

function bindDeck() {
  prevBtn.addEventListener("click", () => goTo(index - 1));
  nextBtn.addEventListener("click", () => goTo(index + 1));

  document.querySelectorAll("[data-goto]").forEach((btn) => {
    btn.addEventListener("click", () => goTo(Number(btn.dataset.goto) - 1));
  });

  document.addEventListener("keydown", (event) => {
    if (event.defaultPrevented || event.metaKey || event.ctrlKey || event.altKey) {
      return;
    }
    const target = event.target;
    if (target && target.closest && target.closest("button, a, textarea, input, select")) {
      return;
    }
    switch (event.key) {
      case "ArrowRight":
      case "ArrowDown":
      case "PageDown":
      case " ":
        event.preventDefault();
        goTo(index + 1);
        break;
      case "ArrowLeft":
      case "ArrowUp":
      case "PageUp":
        event.preventDefault();
        goTo(index - 1);
        break;
      case "Home":
        event.preventDefault();
        goTo(0);
        break;
      case "End":
        event.preventDefault();
        goTo(slides.length - 1);
        break;
      default:
        break;
    }
  });

  let touchX = 0;
  let touchY = 0;
  deck.addEventListener(
    "touchstart",
    (event) => {
      const touch = event.changedTouches[0];
      touchX = touch.clientX;
      touchY = touch.clientY;
    },
    { passive: true }
  );
  deck.addEventListener(
    "touchend",
    (event) => {
      const touch = event.changedTouches[0];
      const dx = touch.clientX - touchX;
      const dy = touch.clientY - touchY;
      if (event.target.closest && event.target.closest("textarea")) {
        return;
      }
      if (Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(dy) * 1.5) {
        goTo(index + (dx < 0 ? 1 : -1));
      }
    },
    { passive: true }
  );

  let resizeTimer;
  window.addEventListener("resize", () => {
    window.clearTimeout(resizeTimer);
    resizeTimer = window.setTimeout(() => {
      if (mapSlide.classList.contains("is-active")) {
        placeTraveler(false);
      }
    }, 120);
  });

  if (document.fonts && document.fonts.ready) {
    document.fonts.ready.then(() => {
      if (mapSlide.classList.contains("is-active")) {
        placeTraveler(false);
      }
    });
  }
}

function hook() {
  const group = document.querySelector("[data-hook]");
  const feedback = document.querySelector("[data-hook-feedback]");
  const reveal = document.querySelector("[data-hook-reveal]");
  const buttons = group.querySelectorAll("[data-hook-answer]");

  function render() {
    if (state.hook === null) {
      return;
    }
    buttons.forEach((btn) => {
      const chosen = Number(btn.dataset.hookAnswer) === state.hook;
      btn.classList.toggle("is-chosen", chosen);
      btn.disabled = true;
    });
    reveal.hidden = false;
    feedback.textContent = HOOK_NOTES[state.hook];
    feedback.classList.add("is-ok");
  }

  buttons.forEach((btn) => {
    btn.addEventListener("click", () => {
      if (state.hook !== null) {
        return;
      }
      state.hook = Number(btn.dataset.hookAnswer);
      save();
      render();
    });
  });

  render();
}

function sequence() {
  const pool = document.querySelector("[data-sequence-pool]");
  const trace = document.querySelector("[data-sequence-trace]");
  const feedback = document.querySelector("[data-sequence-feedback]");
  const count = document.querySelector("[data-sequence-count]");
  const reset = document.querySelector("[data-sequence-reset]");

  function chip(stage) {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "choice";
    btn.dataset.stage = String(stage.n);
    btn.textContent = stage.name;
    btn.addEventListener("click", () => place(stage.n));
    return btn;
  }

  function place(n) {
    const expected = state.sequence.length + 1;
    const stage = STAGES.find((s) => s.n === n);
    if (n === expected) {
      const slotIndex = [...pool.querySelectorAll("[data-stage]")].findIndex(
        (chip) => Number(chip.dataset.stage) === n
      );
      state.sequence.push(n);
      save();
      render();
      const chips = pool.querySelectorAll("[data-stage]");
      const next = chips[Math.min(slotIndex, chips.length - 1)];
      if (next) {
        next.focus();
      } else {
        feedback.tabIndex = -1;
        feedback.focus();
      }
      const landed = trace.lastElementChild;
      if (landed) {
        landed.classList.add("is-landed");
      }
      feedback.classList.add("is-ok");
      feedback.textContent =
        state.sequence.length === STAGE_COUNT
          ? "Path confirmed. This is the order the workshop uses."
          : `Stage ${pad(n)} in place.`;
    } else {
      feedback.classList.remove("is-ok");
      feedback.textContent =
        n < expected
          ? `Not yet. ${stage.name} already ran in this cycle.`
          : `Not yet. ${stage.name} comes later.`;
    }
  }

  function render() {
    pool.innerHTML = "";
    POOL_ORDER.filter((n) => !state.sequence.includes(n)).forEach((n) => {
      pool.appendChild(chip(STAGES.find((s) => s.n === n)));
    });
    trace.innerHTML = "";
    state.sequence.forEach((n) => {
      const li = document.createElement("li");
      const num = document.createElement("span");
      num.className = "mono";
      num.textContent = pad(n);
      const label = document.createElement("span");
      label.textContent = STAGES.find((s) => s.n === n).name;
      li.append(num, label);
      trace.appendChild(li);
    });
    count.textContent = String(state.sequence.length);
    if (state.sequence.length === STAGE_COUNT) {
      feedback.classList.add("is-ok");
      feedback.textContent = "Path confirmed. This is the order the workshop uses.";
    }
  }

  reset.addEventListener("click", () => {
    state.sequence = [];
    save();
    feedback.textContent = "";
    feedback.classList.remove("is-ok");
    render();
  });

  render();
}

function quiz() {
  const items = document.querySelectorAll("[data-quiz]");
  const readoutBox = document.querySelector("[data-quiz-readout]");
  const score = document.querySelector("[data-quiz-score]");
  const note = document.querySelector("[data-quiz-note]");

  function renderItem(item, i) {
    const buttons = item.querySelectorAll("[data-quiz-answer]");
    const feedback = item.querySelector(".feedback");
    const answer = state.quiz[i];
    if (answer === null) {
      return;
    }
    const correct = QUIZ[i].correct;
    buttons.forEach((btn) => {
      const value = Number(btn.dataset.quizAnswer);
      btn.disabled = true;
      btn.classList.toggle("is-chosen", value === answer);
      btn.classList.toggle("is-correct", value === correct);
      btn.classList.toggle("is-wrong", value === answer && value !== correct);
    });
    const hit = answer === correct;
    feedback.classList.toggle("is-ok", hit);
    feedback.textContent = hit ? `Correct. ${QUIZ[i].note}` : `Not quite. ${QUIZ[i].note}`;
  }

  function renderReadout() {
    if (state.quiz.some((a) => a === null)) {
      readoutBox.hidden = true;
      return;
    }
    const hits = state.quiz.filter((a, i) => a === QUIZ[i].correct).length;
    score.textContent = String(hits);
    note.textContent =
      hits === 3
        ? "Ready. You know the map; the workshop adds the sheets and the Colab pass."
        : hits === 2
          ? "Close. Reread the stage you missed; it takes a minute."
          : "Worth another pass. Walk the map again before the workshop.";
    readoutBox.hidden = false;
  }

  items.forEach((item, i) => {
    item.querySelectorAll("[data-quiz-answer]").forEach((btn) => {
      btn.addEventListener("click", () => {
        if (state.quiz[i] !== null) {
          return;
        }
        state.quiz[i] = Number(btn.dataset.quizAnswer);
        save();
        renderItem(item, i);
        renderReadout();
      });
    });
    renderItem(item, i);
  });

  renderReadout();
}

function closing() {
  const field = document.querySelector("#question-field");
  const saveBtn = document.querySelector("[data-question-save]");
  const copyBtn = document.querySelector("[data-question-copy]");
  const status = document.querySelector("[data-question-status]");
  const reset = document.querySelector("[data-reset]");

  field.value = state.question;

  saveBtn.addEventListener("click", () => {
    state.question = field.value.trim();
    save();
    status.textContent = state.question
      ? `SAVED LOCALLY :: ${clockTime()}`
      : "NOTHING SAVED :: WRITE A QUESTION FIRST";
  });

  copyBtn.addEventListener("click", async () => {
    const text = field.value.trim();
    if (!text) {
      status.textContent = "NOTHING TO COPY :: WRITE A QUESTION FIRST";
      return;
    }
    try {
      await navigator.clipboard.writeText(text);
      status.textContent = "COPIED TO THE CLIPBOARD";
    } catch {
      field.select();
      status.textContent = "SELECTED :: COPY WITH YOUR KEYBOARD";
    }
  });

  reset.addEventListener("click", () => {
    try {
      localStorage.removeItem(KEY);
    } catch {
      return;
    }
    window.location.reload();
  });
}

function init() {
  const hash = window.location.hash.match(/^#(s\d+)$/);
  const hashIndex = hash ? slides.findIndex((s) => s.id === hash[1]) : -1;
  const start = hashIndex >= 0 ? hashIndex : Number(state.slide) || 0;

  hook();
  sequence();
  quiz();
  closing();
  bindDeck();
  goTo(start, { focus: false });
}

init();
