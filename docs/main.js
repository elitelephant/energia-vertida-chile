// ── Turbina ───────────────────────────────────────────────────────────────────

// Nordex N163-5.7MW — Parque Eólico Atacama, Freirina, Región de Atacama
// 29 unidades, operativo desde enero 2023, desarrollado por Repsol con Nordex
const TURBINA = {
  nombre: "Nordex N163-5.7MW",
  parque: "Parque Eólico Atacama",
  produccion_hora_mwh: 5.7,
};

// ── Constantes ────────────────────────────────────────────────────────────────

// DAILY_TOTALS viene de data/daily_totals.js (evita fetch con file://)
const JAN_DAYS = Array.from({ length: 31 }, (_, i) =>
  new Date(Date.UTC(2024, 0, i + 1)).toISOString().slice(0, 10)
);

const TOTAL_ICONOS = 16;
const HORA_MIN     = 1281;   // horas turbina día mínimo (24 ene, ~7.300 MWh)
const HORA_MAX     = 6033;   // horas turbina día máximo (14 ene, ~34.385 MWh)
const HORAS_ENERO  = 82136;  // horas totales enero → 16 íconos
const RATE_MIN     = 0.3;    // playbackRate mínimo
const RATE_MAX     = 2.0;    // playbackRate máximo
const PLAY_DUR     = 6;     // duración fija de reproducción (segundos)
const FADE_IN      = 0.8;    // fade-in del audio (segundos)
const FADE_OUT     = 1.2;    // fade-out del audio (segundos)

// ── Estado ────────────────────────────────────────────────────────────────────

const state = {
  selectedDays: new Set(JAN_DAYS),
};

let vertMwh = 0;

// ── Init ──────────────────────────────────────────────────────────────────────

function init() {
  document.getElementById("btn-select-all").addEventListener("click", selectAll);
  document.getElementById("btn-clear-all").addEventListener("click", clearAll);
  document.getElementById("btn-connect-serial").addEventListener("click", connectSerial);
  document.getElementById("btn-play-sound").addEventListener("click", onPlayBtn);
  refresh();
  setBtnState(false);
}

function selectAll() {
  JAN_DAYS.forEach(d => state.selectedDays.add(d));
  refresh();
}

function clearAll() {
  state.selectedDays.clear();
  refresh();
}

function refresh() {
  updatePanel();
  renderSelector();
  renderEquiv();
  renderTurbineGrid();
}

// ── Calendario ────────────────────────────────────────────────────────────────

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
      if (state.selectedDays.has(date)) state.selectedDays.delete(date);
      else state.selectedDays.add(date);
      refresh();
    });

    grid.appendChild(cell);
  });

  container.appendChild(grid);
}

// ── Panel ─────────────────────────────────────────────────────────────────────

function updatePanel() {
  vertMwh = Math.round(
    JAN_DAYS.reduce((s, d) =>
      state.selectedDays.has(d) ? s + (DAILY_TOTALS[d]?.vert ?? 0) : s, 0)
  );
}

// ── Equivalencia ──────────────────────────────────────────────────────────────

function renderEquiv() {
  const container = document.getElementById("equiv-display");
  if (!container) return;
  const horas = Math.round(vertMwh / TURBINA.produccion_hora_mwh);
  container.innerHTML = `
    <p class="equiv-frase">
      <span class="equiv-num-mwh">${vertMwh.toLocaleString("es-CL")}</span> MWh vertidos equivalen a
      <span class="equiv-num-horas">${horas.toLocaleString("es-CL")}</span> horas de turbina eólica como las del ${TURBINA.parque}.
    </p>
  `.trim();
}

// ── Turbine grid ──────────────────────────────────────────────────────────────

function calcActiveIcons(horas) {
  if (horas <= 0) return 0;
  const t = Math.min(1, horas / HORAS_ENERO);  // 0–1 lineal, tope = todo enero
  const curved = Math.pow(t, 0.4);             // potencia suave: 1 día → 2–4 íconos
  return Math.max(1, Math.round(curved * TOTAL_ICONOS));
}

function renderTurbineGrid() {
  const grid = document.getElementById("turbine-grid");
  if (!grid) return;
  const horas   = Math.round(vertMwh / TURBINA.produccion_hora_mwh);
  const nActive = calcActiveIcons(horas);
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

// ── Audio ─────────────────────────────────────────────────────────────────────

let audioCtx      = null;
let turbineBuffer = null;
let activeSource  = null;
let activeGain    = null;
let activeRate    = null;

function calcPlaybackRate(horas) {
  const v = Math.max(HORA_MIN, Math.min(HORA_MAX, horas));
  const t = Math.log(v / HORA_MIN) / Math.log(HORA_MAX / HORA_MIN);
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
    xhr.onerror = () => reject(new Error("No se pudo cargar audio — servir con HTTP"));
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

function onPlayBtn() {
  if (activeSource) stopAll();
  else startAll();
}

function startAll() {
  if (vertMwh <= 0) return;
  const horas = Math.round(vertMwh / TURBINA.produccion_hora_mwh);

  loadTurbineBuffer().then(buf => {
    const ctx  = ensureAudioCtx();
    const rate = calcPlaybackRate(horas);
    const now  = ctx.currentTime;

    const src = ctx.createBufferSource();
    src.buffer = buf;
    src.loop   = true;
    src.playbackRate.value = rate;

    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0, now);
    gain.gain.linearRampToValueAtTime(0.85, now + FADE_IN);
    gain.gain.setValueAtTime(0.85, now + PLAY_DUR - FADE_OUT);
    gain.gain.linearRampToValueAtTime(0, now + PLAY_DUR);

    src.connect(gain);
    gain.connect(ctx.destination);
    src.start(now);
    src.stop(now + PLAY_DUR);

    activeSource = src;
    activeGain   = gain;
    activeRate   = rate;

    // arrancan los tres juntos
    setTurbineSpinning(true, rate);
    sendSerialSpeed(calcSerialSpeed(vertMwh));
    setBtnState(true);

    src.onended = () => {
      if (activeSource !== src) return;
      activeSource = null;
      activeGain   = null;
      activeRate   = null;
      setTurbineSpinning(false);
      sendSerialSpeed(0);
      setBtnState(false);
    };
  }).catch(err => console.warn(err.message));
}

function stopAll() {
  // íconos paran de inmediato
  setTurbineSpinning(false);
  // servo para de inmediato
  sendSerialSpeed(0);
  // audio: fade rápido luego stop
  if (activeGain) {
    const ctx = ensureAudioCtx();
    activeGain.gain.cancelScheduledValues(ctx.currentTime);
    activeGain.gain.setValueAtTime(activeGain.gain.value, ctx.currentTime);
    activeGain.gain.linearRampToValueAtTime(0, ctx.currentTime + 0.15);
  }
  const src = activeSource;
  activeSource = null;
  activeGain   = null;
  activeRate   = null;
  setBtnState(false);
  if (src) setTimeout(() => { try { src.stop(0); } catch(e) {} }, 200);
}

// ── WebSerial ─────────────────────────────────────────────────────────────────

let serialWriter = null;

async function connectSerial() {
  try {
    const port = await navigator.serial.requestPort();
    await port.open({ baudRate: 9600 });
    const encoder = new TextEncoderStream();
    encoder.readable.pipeTo(port.writable).catch(err => console.warn("Serial pipe:", err));
    serialWriter = encoder.writable.getWriter();
    const btn = document.getElementById("btn-connect-serial");
    btn.classList.add("connected");
    btn.innerHTML = '<i data-lucide="cpu"></i> Arduino conectado';
    lucide.createIcons({ nodes: [btn] });
    port.addEventListener("disconnect", () => {
      serialWriter = null;
      btn.classList.remove("connected");
      btn.innerHTML = '<i data-lucide="cpu"></i> Conectar Arduino';
      lucide.createIcons({ nodes: [btn] });
    });
  } catch (err) {
    console.warn("WebSerial:", err.message);
  }
}

function calcSerialSpeed(mwh) {
  if (mwh <= 0) return 0;
  const MWH_MIN = 7300;
  const MWH_MAX = 468175;
  const v   = Math.max(MWH_MIN, Math.min(MWH_MAX, mwh));
  const raw = Math.log(v / MWH_MIN) / Math.log(MWH_MAX / MWH_MIN);
  const t   = raw * raw * (3 - 2 * raw); // smoothstep
  return Math.round(t * 70 + 20);        // 20–90
}

async function sendSerialSpeed(speed) {
  if (!serialWriter) return;
  try {
    await serialWriter.write(speed + "\n");
  } catch (err) {
    console.warn("Serial write:", err.message);
  }
}

// ── Utils ─────────────────────────────────────────────────────────────────────

function formatDate(dateStr) {
  return new Date(dateStr + "T12:00:00").toLocaleDateString("es-CL", {
    day: "numeric", month: "long",
  });
}

// ── Boot ──────────────────────────────────────────────────────────────────────

document.addEventListener("DOMContentLoaded", init);
