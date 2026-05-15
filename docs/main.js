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
    if (activeSource) stopTurbine();
    else playTurbine();
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

const VERT_MIN      = 9000;
const VERT_MAX      = 470000;
const RATE_MIN      = 0.35;  // RPM baja (poco vertimiento)
const RATE_MAX      = 1.9;   // RPM alta (mucho vertimiento)
const PLAY_DURATION = 7;     // segundos

let audioCtx          = null;
let turbineBuffer     = null;
let activeSource      = null;
let activeGain        = null;
let soundDebounceTimer = null;

function calcPlaybackRate(mwh) {
  if (mwh <= 0) return RATE_MIN;
  const v = Math.max(VERT_MIN, Math.min(VERT_MAX, mwh));
  const t = Math.log(v / VERT_MIN) / Math.log(VERT_MAX / VERT_MIN);
  return RATE_MIN + t * (RATE_MAX - RATE_MIN);
}

function ensureAudioCtx() {
  if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  if (audioCtx.state === "suspended") audioCtx.resume();
  return audioCtx;
}

function loadTurbineBuffer() {
  const ctx = ensureAudioCtx();
  if (turbineBuffer) return Promise.resolve(turbineBuffer);
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open("GET", "audio/turbine.flac");
    xhr.responseType = "arraybuffer";
    xhr.onload  = () => ctx.decodeAudioData(xhr.response)
      .then(buf => { turbineBuffer = buf; resolve(buf); }).catch(reject);
    xhr.onerror = () => reject(new Error("No se pudo cargar audio/turbine.flac — servir con HTTP server"));
    xhr.send();
  });
}

function setBtnState(playing) {
  const btn = document.getElementById("btn-play-sound");
  if (!btn) return;
  btn.classList.toggle("playing", playing);
  btn.innerHTML = playing
    ? '<i data-lucide="volume-x"></i> Detener'
    : '<i data-lucide="volume-2"></i> Escuchar';
  lucide.createIcons({ nodes: [btn] });
}

function stopTurbine() {
  if (activeGain) {
    const ctx = ensureAudioCtx();
    activeGain.gain.cancelScheduledValues(ctx.currentTime);
    activeGain.gain.setValueAtTime(activeGain.gain.value, ctx.currentTime);
    activeGain.gain.linearRampToValueAtTime(0, ctx.currentTime + 0.3);
  }
  if (activeSource) {
    const src = activeSource;
    setTimeout(() => { try { src.stop(0); } catch(e) {} }, 350);
    activeSource = null;
    activeGain   = null;
  }
  setBtnState(false);
}

function playTurbine() {
  loadTurbineBuffer().then(buf => {
    stopTurbine();

    const ctx  = ensureAudioCtx();
    const rate = calcPlaybackRate(vertMwh);

    const src  = ctx.createBufferSource();
    src.buffer = buf;
    src.loop   = true;
    src.playbackRate.value = rate;

    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0, ctx.currentTime);
    gain.gain.linearRampToValueAtTime(0.85, ctx.currentTime + 0.8);
    gain.gain.setValueAtTime(0.85, ctx.currentTime + PLAY_DURATION - 1.2);
    gain.gain.linearRampToValueAtTime(0, ctx.currentTime + PLAY_DURATION);

    src.connect(gain);
    gain.connect(ctx.destination);
    src.start(ctx.currentTime);
    src.stop(ctx.currentTime + PLAY_DURATION);

    activeSource = src;
    activeGain   = gain;
    setBtnState(true);

    src.onended = () => {
      if (activeSource === src) {
        activeSource = null;
        activeGain   = null;
        setBtnState(false);
      }
    };
  }).catch(err => console.warn(err.message));
}

function scheduleSound() {
  clearTimeout(soundDebounceTimer);
  soundDebounceTimer = setTimeout(playTurbine, 500);
}

// ── Utils ─────────────────────────────────────────────────────────────────────

function formatDate(dateStr) {
  return new Date(dateStr + "T12:00:00").toLocaleDateString("es-CL", {
    day: "numeric", month: "long",
  });
}

// ── Boot ──────────────────────────────────────────────────────────────────────

document.addEventListener("DOMContentLoaded", init);
