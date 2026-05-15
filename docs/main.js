// ── Equivalencia ──────────────────────────────────────────────────────────────

// Fuente primaria: ICAO Aircraft Engine Emissions Databank, EASA, Issue 32 (marzo 2026)
// Motor: Rolls-Royce Trent XWB-84 — equipa el Airbus A350-900
// Flujo a C/O (climb-out, 85 % empuje, nivel del mar, ciclo LTO ICAO): 2,306 kg/s
// Energía: 2,306 kg/s × 3.600 s/h × 43,2 MJ/kg ÷ 3.600.000 MJ/MWh = 99,6 MWh por hora de turbina
// Condición LTO (nivel del mar); el consumo en crucero es aprox. 30-35 % de este valor.
const TURBINA = {
  nombre: "Rolls-Royce Trent XWB-84",
  avion: "Airbus A350-900",
  consumo_hora_mwh: 99.6,
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
  renderTurbineGrid();
  setBtnState(false);
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
  renderTurbineGrid();
}

// ── Calendar ──────────────────────────────────────────────────────────────────

function renderSelector() {
  const container = document.getElementById("selector-viz");
  container.innerHTML = "";
  buildCalendar(container);
}

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
  const totalV = dates.reduce((s, d) => s + (DAILY_TOTALS[d]?.vert ?? 0), 0);
  vertMwh = Math.round(totalV);

  document.getElementById("loss-number").textContent =
    vertMwh.toLocaleString("es-CL") + " MWh";

  const n = dates.length;
  let subText;
  subText = n === 0 ? "selecciona días en el calendario" : "";
  document.getElementById("loss-sub").textContent = subText;

}

// ── Equivalencia ─────────────────────────────────────────────────────────────

const TOTAL_ICONOS = 16;
const HORAS_ENERO  = 4701; // todo enero → todas activas

function renderEquiv() {
  const container = document.getElementById("equiv-display");
  if (!container) return;
  const horas = Math.round(vertMwh / TURBINA.consumo_hora_mwh);
  container.innerHTML = `
    <div class="equiv-numero">${horas.toLocaleString("es-CL")}</div>
    <div class="equiv-label">horas de turbina</div>
  `.trim();
}

function renderTurbineGrid() {
  const grid = document.getElementById("turbine-grid");
  if (!grid) return;
  const horas   = Math.round(vertMwh / TURBINA.consumo_hora_mwh);
  const nActive = Math.min(TOTAL_ICONOS, Math.round(horas / HORAS_ENERO * TOTAL_ICONOS));
  grid.innerHTML = "";
  for (let i = 0; i < TOTAL_ICONOS; i++) {
    const wrap = document.createElement("div");
    wrap.className = "turbine-icon-wrap " + (i < nActive ? "active" : "inactive");
    wrap.innerHTML = '<i data-lucide="loader-pinwheel"></i>';
    grid.appendChild(wrap);
  }
  lucide.createIcons({ nodes: [grid] });
  if (activeSource) setTurbineSpinning(true, activeRate);
}

// ── Sonido ────────────────────────────────────────────────────────────────────

const HORA_MIN      = 76;    // horas turbina día mínimo (24 ene 2024, 7.533 MWh)
const HORA_MAX      = 345;   // horas turbina día máximo (14 ene 2024, 34.385 MWh)
const RATE_MIN      = 0.3;   // velocidad baja (día de menor vertimiento)
const RATE_MAX      = 2.0;   // velocidad alta (día de mayor vertimiento)
const PLAY_DURATION = 7;     // segundos

let audioCtx           = null;
let turbineBuffer      = null;
let activeSource       = null;
let activeGain         = null;
let activeRate         = null;
let soundDebounceTimer = null;

function calcPlaybackRate(horas) {
  const v = Math.max(HORA_MIN, Math.min(HORA_MAX, horas));
  const t = Math.log(v / HORA_MIN) / Math.log(HORA_MAX / HORA_MIN);
  return RATE_MIN + t * (RATE_MAX - RATE_MIN);
}

function setTurbineSpinning(spinning, rate) {
  const grid = document.getElementById("turbine-grid");
  if (!grid) return;
  if (spinning && rate) {
    grid.style.setProperty("--spin-dur", (2 / rate).toFixed(2) + "s");
    grid.classList.add("spinning");
  } else {
    grid.classList.remove("spinning");
  }
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
  setTurbineSpinning(false);
  activeRate = null;
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
  if (vertMwh <= 0) return;
  const horas = Math.round(vertMwh / TURBINA.consumo_hora_mwh);
  loadTurbineBuffer().then(buf => {
    stopTurbine();

    const ctx  = ensureAudioCtx();
    const rate = calcPlaybackRate(horas);

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
    activeRate   = rate;
    setBtnState(true);
    setTurbineSpinning(true, rate);

    src.onended = () => {
      if (activeSource === src) {
        activeSource = null;
        activeGain   = null;
        activeRate   = null;
        setBtnState(false);
        setTurbineSpinning(false);
      }
    };
  }).catch(err => console.warn(err.message));
}

function scheduleSound() {
  clearTimeout(soundDebounceTimer);
  soundDebounceTimer = setTimeout(playTurbine, 1000);
}

// ── Utils ─────────────────────────────────────────────────────────────────────

function formatDate(dateStr) {
  return new Date(dateStr + "T12:00:00").toLocaleDateString("es-CL", {
    day: "numeric", month: "long",
  });
}

// ── Boot ──────────────────────────────────────────────────────────────────────

document.addEventListener("DOMContentLoaded", init);
