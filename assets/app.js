const KEY = "dafa.prework.v1";
const STAGE_COUNT = 7;

const defaults = {
  visited: [],
  current: null,
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

let state = load();
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

function scrollToNode(head) {
  const box = head.getBoundingClientRect();
  const top = window.scrollY + box.top - 70;
  window.scrollTo({ top, behavior: reduced ? "auto" : "smooth" });
}

function band() {
  const readout = document.querySelector("[data-readout]");
  const ticks = document.querySelectorAll("[data-ticks] li");
  const count = state.visited.length;
  readout.textContent = pad(count);
  ticks.forEach((tick, i) => {
    tick.classList.toggle("is-on", state.visited.includes(i + 1));
  });
  const label = document.querySelector("[data-band-node]");
  if (label) {
    const id = state.current;
    label.textContent =
      id === null ? "" : `  //  ${pad(id)} :: ${STAGES.find((s) => s.n === id).name.toUpperCase()}`;
  }
}

function placeTraveler(animate) {
  const host = document.querySelector("[data-traveler-host]");
  const traveler = document.querySelector("[data-traveler]");
  if (!host || !traveler) {
    return;
  }
  const id = state.current === null ? 0 : state.current;
  const slot = document.querySelector(`[data-marker="${id}"]`);
  if (!slot) {
    return;
  }
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
}

function setNodeState(wrap) {
  const id = Number(wrap.dataset.nodeWrap);
  const head = wrap.querySelector("[data-node]");
  const label = wrap.querySelector("[data-state]");
  const isOpen = state.current === id && id !== 0;
  const isCurrent = id === 0 ? state.current === null : state.current === id;
  wrap.classList.toggle("is-open", id === 0 || isOpen);
  wrap.classList.toggle("is-visited", id !== 0 && state.visited.includes(id));
  wrap.classList.toggle("is-current", isCurrent);
  if (head) {
    head.setAttribute("aria-expanded", String(isOpen));
    label.textContent = isOpen ? "CLOSE" : "OPEN";
  }
}

function renderNodes() {
  document.querySelectorAll("[data-node-wrap]").forEach(setNodeState);
}

function travelTo() {
  placeTraveler(true);
  window.clearTimeout(travelTimer);
  travelTimer = window.setTimeout(() => placeTraveler(true), 460);
}

function openNode(id, scroll) {
  state.current = id;
  if (!state.visited.includes(id)) {
    state.visited.push(id);
  }
  save();
  renderNodes();
  band();
  travelTo();
  if (scroll) {
    const head = document.querySelector(`[data-node="${id}"]`);
    if (head) {
      scrollToNode(head);
    }
  }
}

function bindNodes() {
  document.querySelectorAll("[data-node]").forEach((head) => {
    head.addEventListener("click", () => {
      const id = Number(head.dataset.node);
      if (state.current === id) {
        state.current = null;
        save();
        renderNodes();
        band();
        travelTo();
        return;
      }
      openNode(id, false);
      const wrap = head.closest("[data-node-wrap]");
      wrap.scrollIntoView({ block: "nearest", behavior: reduced ? "auto" : "smooth" });
    });
  });

  document.querySelectorAll("[data-open-node]").forEach((btn) => {
    btn.addEventListener("click", () => openNode(Number(btn.dataset.openNode), true));
  });

  document.querySelectorAll("[data-jump]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const target = document.getElementById(btn.dataset.jump);
      if (target) {
        target.scrollIntoView({ behavior: reduced ? "auto" : "smooth", block: "start" });
      }
    });
  });
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
      const index = [...pool.querySelectorAll("[data-stage]")].findIndex(
        (chip) => Number(chip.dataset.stage) === n
      );
      state.sequence.push(n);
      save();
      render();
      const chips = pool.querySelectorAll("[data-stage]");
      const next = chips[Math.min(index, chips.length - 1)];
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
          ? "Path confirmed. This is the order the session uses."
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
      feedback.textContent = "Path confirmed. This is the order the session uses.";
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
  const readout = document.querySelector("[data-quiz-readout]");
  const score = document.querySelector("[data-quiz-score]");
  const note = document.querySelector("[data-quiz-note]");

  function renderItem(item, index) {
    const buttons = item.querySelectorAll("[data-quiz-answer]");
    const feedback = item.querySelector(".feedback");
    const answer = state.quiz[index];
    if (answer === null) {
      return;
    }
    const correct = QUIZ[index].correct;
    buttons.forEach((btn) => {
      const value = Number(btn.dataset.quizAnswer);
      btn.disabled = true;
      btn.classList.toggle("is-chosen", value === answer);
      btn.classList.toggle("is-correct", value === correct);
      btn.classList.toggle("is-wrong", value === answer && value !== correct);
    });
    const hit = answer === correct;
    feedback.classList.toggle("is-ok", hit);
    feedback.textContent = hit ? `Correct. ${QUIZ[index].note}` : `Not quite. ${QUIZ[index].note}`;
  }

  function renderReadout() {
    if (state.quiz.some((a) => a === null)) {
      readout.hidden = true;
      return;
    }
    const hits = state.quiz.filter((a, i) => a === QUIZ[i].correct).length;
    score.textContent = String(hits);
    note.textContent =
      hits === 3
        ? "Ready. You know the map; the session adds the Python."
        : hits === 2
          ? "Close. Reread the node you missed; it takes a minute."
          : "Worth another pass. Open the map again before the session.";
    readout.hidden = false;
  }

  items.forEach((item, index) => {
    item.querySelectorAll("[data-quiz-answer]").forEach((btn) => {
      btn.addEventListener("click", () => {
        if (state.quiz[index] !== null) {
          return;
        }
        state.quiz[index] = Number(btn.dataset.quizAnswer);
        save();
        renderItem(item, index);
        renderReadout();
      });
    });
    renderItem(item, index);
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

renderNodes();
bindNodes();
hook();
sequence();
quiz();
closing();
band();
placeTraveler(false);

let resizeTimer;
window.addEventListener("resize", () => {
  window.clearTimeout(resizeTimer);
  resizeTimer = window.setTimeout(() => placeTraveler(false), 120);
});

if (document.fonts && document.fonts.ready) {
  document.fonts.ready.then(() => placeTraveler(false));
}
