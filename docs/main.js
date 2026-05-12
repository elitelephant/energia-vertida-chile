// ── Equivalencia ──────────────────────────────────────────────────────────────

const AEROPUERTO = {
  nombre: "Aeropuerto de Santiago",
  consumo_anual_mwh: 58901,
  consumo_dia_mwh: 161.4,
};

// ── Estado ────────────────────────────────────────────────────────────────────

// DAILY_TOTALS viene de data/daily_totals.js (evita fetch con file://)
const JAN_DAYS = Array.from({ length: 31 }, (_, i) =>
  new Date(Date.UTC(2024, 0, i + 1)).toISOString().slice(0, 10)
);

let vertMwh = 0;

const state = {
  selectedDays: new Set(JAN_DAYS), // todo enero por defecto
};

// ── Init ──────────────────────────────────────────────────────────────────────

function init() {
  document.getElementById("btn-select-all").addEventListener("click", selectAll);
  document.getElementById("btn-clear-all").addEventListener("click", clearAll);
  document.getElementById("btn-play-sound").addEventListener("click", () => {
    if (activeSources.length > 0) stopFiums();
    else playFiums();
  });

  renderSelector();
  updatePanel();
  renderEquiv();
  lucide.createIcons();
}

function selectAll() {
  JAN_DAYS.forEach(d => state.selectedDays.add(d));
  refresh();
  scheduleSound();
}

function clearAll() {
  state.selectedDays.clear();
  refresh();
  scheduleSound();
}

function refresh() {
  renderSelector();
  updatePanel();
  renderEquiv();
}

// ── Selector ──────────────────────────────────────────────────────────────────

function renderSelector() {
  const container = document.getElementById("selector-viz");
  container.innerHTML = "";
  buildCalendar(container);
}

// ── Calendar ──────────────────────────────────────────────────────────────────

function buildCalendar(container) {
  const values = JAN_DAYS.map(d => DAILY_TOTALS[d]?.vert ?? 0);
  const maxVal = Math.max(...values);

  const grid = document.createElement("div");
  grid.className = "cal-grid";

  ["Lu","Ma","Mi","Ju","Vi","Sá","Do"].forEach(d => {
    const h = document.createElement("div");
    h.className = "cal-header";
    h.textContent = d;
    grid.appendChild(h);
  });

  JAN_DAYS.forEach((date, i) => {
    const pct   = maxVal > 0 ? values[i] / maxVal : 0;
    const inSel = state.selectedDays.has(date);
    const dow   = new Date(date + "T12:00:00").getDay();
    const isEnd = dow === 0 || dow === 6;

    const cell = document.createElement("div");
    cell.className = "cal-cell" + (inSel ? " selected" : "") + (isEnd ? " weekend" : "");
    cell.dataset.date = date;
    cell.title = `${formatDate(date)}: ${values[i].toLocaleString("es-CL")} MWh`;
    cell.style.setProperty("--pct", pct.toFixed(3));
    cell.innerHTML = `<span class="cal-day">${i + 1}</span>`;

    cell.addEventListener("click", () => {
      if (state.selectedDays.has(date)) {
        state.selectedDays.delete(date);
      } else {
        state.selectedDays.add(date);
      }
      refresh();
      scheduleSound();
    });

    grid.appendChild(cell);
  });

  container.appendChild(grid);
}

// ── Panel número ──────────────────────────────────────────────────────────────

function updatePanel() {
  const dates  = JAN_DAYS.filter(d => state.selectedDays.has(d));
  const totalV = dates.reduce((s, d) => s + (DAILY_TOTALS[d]?.vert     ?? 0), 0);
  const totalG = dates.reduce((s, d) => s + (DAILY_TOTALS[d]?.genTotal ?? 0), 0);
  vertMwh = Math.round(totalV);

  document.getElementById("loss-number").textContent =
    vertMwh.toLocaleString("es-CL") + " MWh";

  const n = dates.length;
  let subText;
  if (n === 0)       subText = "selecciona días en el calendario";
  else if (n === 1)  subText = `vertidos el ${formatDate(dates[0])}`;
  else if (n === 31) subText = "vertidos en enero de 2024";
  else               subText = `vertidos en ${n} días de enero de 2024`;
  document.getElementById("loss-sub").textContent = subText;

  if (totalG > 0 && n > 0) {
    const pct    = Math.round(totalV / totalG * 100);
    const period = n === 1 ? " ese día" : " en ese período";
    document.getElementById("loss-context").textContent =
      `el ${pct}% de toda la energía generada${period}`;
  } else {
    document.getElementById("loss-context").textContent = "";
  }
}

// ── Equivalencia ─────────────────────────────────────────────────────────────

function renderEquiv() {
  const container = document.getElementById("equiv-display");
  if (!container) return;
  const semanas = Math.round(vertMwh / AEROPUERTO.consumo_dia_mwh / 7);
  const label   = semanas === 1 ? "semana" : "semanas";
  container.innerHTML = `
    <div class="equiv-numero">${semanas} ${label}</div>
    <div class="equiv-lugar">${AEROPUERTO.nombre}</div>
  `.trim();
}

// ── Sonido ────────────────────────────────────────────────────────────────────

const VERT_MIN  = 9000;
const VERT_MAX  = 470000;
const N_MIN     = 2;
const N_MAX     = 10;
const SPACING_S = 0.6;

let audioCtx          = null;
let audioBuffer       = null;
let activeSources     = [];
let soundDebounceTimer = null;

function calcN(mwh) {
  if (mwh <= 0) return 0;
  const v = Math.max(VERT_MIN, Math.min(VERT_MAX, mwh));
  const t = Math.log(v / VERT_MIN) / Math.log(VERT_MAX / VERT_MIN);
  return Math.round(N_MIN + t * (N_MAX - N_MIN));
}

function ensureAudioCtx() {
  if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  if (audioCtx.state === "suspended") audioCtx.resume();
  return audioCtx;
}

function loadAudioBuffer() {
  const ctx = ensureAudioCtx();
  if (audioBuffer) return Promise.resolve(audioBuffer);
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open("GET", "audio/air-move.mp3");
    xhr.responseType = "arraybuffer";
    xhr.onload  = () => ctx.decodeAudioData(xhr.response)
      .then(buf => { audioBuffer = buf; resolve(buf); }).catch(reject);
    xhr.onerror = reject;
    xhr.send();
  });
}

function stopFiums() {
  activeSources.forEach(s => { try { s.stop(0); } catch(e) {} });
  activeSources = [];
  const btn = document.getElementById("btn-play-sound");
  btn.classList.remove("playing");
  btn.innerHTML = '<i data-lucide="volume-2"></i> Escuchar';
  lucide.createIcons({ nodes: [btn] });
}

function playFiums() {
  loadAudioBuffer().then(buf => {
    stopFiums();
    const n = calcN(vertMwh);
    if (n === 0) return;

    const ctx = ensureAudioCtx();
    const btn = document.getElementById("btn-play-sound");
    btn.classList.add("playing");
    btn.innerHTML = '<i data-lucide="volume-x"></i> Detener';
    lucide.createIcons({ nodes: [btn] });

    for (let i = 0; i < n; i++) {
      const src = ctx.createBufferSource();
      src.buffer = buf;
      src.playbackRate.value = 1;
      src.connect(ctx.destination);
      src.start(ctx.currentTime + i * SPACING_S);
      activeSources.push(src);
    }

    const totalMs = ((n - 1) * SPACING_S + buf.duration) * 1000 + 200;
    setTimeout(() => {
      activeSources = [];
      btn.classList.remove("playing");
      btn.textContent = "▶ Escuchar";
    }, totalMs);
  });
}

function scheduleSound() {
  clearTimeout(soundDebounceTimer);
  soundDebounceTimer = setTimeout(playFiums, 500);
}

// ── Utils ─────────────────────────────────────────────────────────────────────

function formatDate(dateStr) {
  return new Date(dateStr + "T12:00:00").toLocaleDateString("es-CL", {
    day: "numeric", month: "long",
  });
}

// ── Boot ──────────────────────────────────────────────────────────────────────

document.addEventListener("DOMContentLoaded", init);
