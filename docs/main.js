// ── Equivalencias ─────────────────────────────────────────────────────────────

const EQUIVALENCIAS = [
  {
    nombre: "Hospital Barros Luco",
    icon: "hospital",
    color: "#0000FF",
    consumo_anual_mwh: 8500,
    consumo_dia_mwh: 23.29,
    cols: 16,
  },
  {
    nombre: "Aeropuerto de Santiago",
    icon: "plane",
    color: "#0000FF",
    consumo_anual_mwh: 58901,
    consumo_dia_mwh: 161.4,
    cols: 3,
  },
  {
    nombre: "Metro de Santiago",
    icon: "train-front-tunnel",
    color: "#0000FF",
    consumo_anual_mwh: 487599,
    consumo_dia_mwh: 1335.9,
    cols: 1,
  }
];

// ── Estado ────────────────────────────────────────────────────────────────────

// DAILY_TOTALS viene de data/daily_totals.js (evita fetch con file://)
const JAN_DAYS = Array.from({ length: 31 }, (_, i) =>
  new Date(Date.UTC(2024, 0, i + 1)).toISOString().slice(0, 10)
);

let vertMwh = 0;

const state = {
  mode: "calendar",  // "calendar" | "timeline"
  selStart: "2024-01-06",
  selEnd:   "2024-01-06",
};

// ── Init ──────────────────────────────────────────────────────────────────────

function init() {
  document.getElementById("btn-calendar").addEventListener("click", () => setMode("calendar"));
  document.getElementById("btn-timeline").addEventListener("click", () => setMode("timeline"));

  initAudio();
  document.querySelectorAll(".audio-play-btn").forEach(btn => {
    btn.addEventListener("click", () => {
      const ref = btn.closest(".audio-player").dataset.ref;
      playSound(ref, btn);
    });
  });

  renderSelector();
  updatePanel();
  renderPictograma();
  lucide.createIcons();
}

function setMode(mode) {
  state.mode = mode;
  document.getElementById("btn-calendar").classList.toggle("active", mode === "calendar");
  document.getElementById("btn-timeline").classList.toggle("active", mode === "timeline");
  renderSelector();
}

// ── Selector ──────────────────────────────────────────────────────────────────

function renderSelector() {
  const container = document.getElementById("selector-viz");
  container.innerHTML = "";
  if (state.mode === "calendar") buildCalendar(container);
  else buildTimeline(container);
}

// ── Calendar ──────────────────────────────────────────────────────────────────

function buildCalendar(container) {
  const values = JAN_DAYS.map(d => DAILY_TOTALS[d]?.vert ?? 0);
  const maxVal = Math.max(...values);

  let dragging  = false;
  let dragStart = null;

  const grid = document.createElement("div");
  grid.className = "cal-grid";

  ["Lu","Ma","Mi","Ju","Vi","Sá","Do"].forEach(d => {
    const h = document.createElement("div");
    h.className = "cal-header";
    h.textContent = d;
    grid.appendChild(h);
  });

  const cells = JAN_DAYS.map((date, i) => {
    const pct   = maxVal > 0 ? values[i] / maxVal : 0;
    const inSel = date >= state.selStart && date <= state.selEnd;
    const dow   = new Date(date + "T12:00:00").getDay();
    const isEnd = dow === 0 || dow === 6;

    const cell = document.createElement("div");
    cell.className = "cal-cell" + (inSel ? " selected" : "") + (isEnd ? " weekend" : "");
    cell.dataset.date = date;
    cell.title = `${formatDate(date)}: ${values[i].toLocaleString("es-CL")} MWh`;
    cell.style.setProperty("--pct", pct.toFixed(3));
    cell.innerHTML = `<span class="cal-day">${i + 1}</span>`;
    return cell;
  });

  cells.forEach(c => grid.appendChild(c));
  container.appendChild(grid);

  function applyDrag(date) {
    const [s, e] = [dragStart, date].sort();
    state.selStart = s;
    state.selEnd   = e;
    cells.forEach(c => c.classList.toggle("selected",
      c.dataset.date >= state.selStart && c.dataset.date <= state.selEnd));
    updatePanel();
  }

  grid.addEventListener("mousedown", e => {
    const cell = e.target.closest(".cal-cell");
    if (!cell) return;
    dragging  = true;
    dragStart = cell.dataset.date;
    applyDrag(dragStart);
    e.preventDefault();
  });

  grid.addEventListener("mouseover", e => {
    if (!dragging) return;
    const cell = e.target.closest(".cal-cell");
    if (cell) applyDrag(cell.dataset.date);
  });

  document.addEventListener("mouseup", () => {
    if (dragging) { dragging = false; renderPictograma(); lucide.createIcons(); }
  });
}

// ── Timeline ──────────────────────────────────────────────────────────────────

function buildTimeline(container) {
  const values = JAN_DAYS.map(d => DAILY_TOTALS[d]?.vert ?? 0);
  const maxVal = Math.max(...values);
  const BAR_H  = 52;

  let dragging  = false;
  let dragStart = null;

  const wrap = document.createElement("div");
  wrap.className = "timeline-bars";

  const cols = JAN_DAYS.map((date, i) => {
    const pct   = maxVal > 0 ? values[i] / maxVal : 0;
    const h     = Math.max(2, Math.round(pct * BAR_H));
    const dow   = new Date(date + "T12:00:00").getDay();
    const isEnd = dow === 0 || dow === 6;
    const inSel = date >= state.selStart && date <= state.selEnd;

    const col = document.createElement("div");
    col.className = "tl-col" + (inSel ? " selected" : "");
    col.dataset.date = date;
    col.title = `${formatDate(date)}: ${values[i].toLocaleString("es-CL")} MWh`;
    col.innerHTML = `<div class="tl-bar" style="height:${h}px"></div>
      <div class="tl-label${isEnd ? " weekend" : ""}">${i + 1}</div>`;
    return col;
  });

  cols.forEach(c => wrap.appendChild(c));
  container.appendChild(wrap);

  function applyDrag(date) {
    const [s, e] = [dragStart, date].sort();
    state.selStart = s;
    state.selEnd   = e;
    cols.forEach(c => c.classList.toggle("selected",
      c.dataset.date >= state.selStart && c.dataset.date <= state.selEnd));
    updatePanel();
  }

  wrap.addEventListener("mousedown", e => {
    const col = e.target.closest(".tl-col");
    if (!col) return;
    dragging  = true;
    dragStart = col.dataset.date;
    applyDrag(dragStart);
    e.preventDefault();
  });

  wrap.addEventListener("mouseover", e => {
    if (!dragging) return;
    const col = e.target.closest(".tl-col");
    if (col) applyDrag(col.dataset.date);
  });

  document.addEventListener("mouseup", () => {
    if (dragging) { dragging = false; renderPictograma(); lucide.createIcons(); }
  });
}

// ── Panel número ──────────────────────────────────────────────────────────────

function updatePanel() {
  const dates   = JAN_DAYS.filter(d => d >= state.selStart && d <= state.selEnd);
  const totalV  = dates.reduce((s, d) => s + (DAILY_TOTALS[d]?.vert     ?? 0), 0);
  const totalG  = dates.reduce((s, d) => s + (DAILY_TOTALS[d]?.genTotal ?? 0), 0);
  vertMwh = Math.round(totalV);

  document.getElementById("loss-number").textContent =
    vertMwh.toLocaleString("es-CL") + " MWh";

  document.getElementById("loss-sub").textContent =
    state.selStart === state.selEnd
      ? `vertidos el ${formatDate(state.selStart)}`
      : `vertidos entre el ${formatDate(state.selStart)} y el ${formatDate(state.selEnd)}`;

  if (totalG > 0) {
    const pct    = Math.round(totalV / totalG * 100);
    const period = dates.length === 1 ? " ese día" : " en ese período";
    document.getElementById("loss-context").textContent =
      `el ${pct}% de toda la energía generada${period}`;
  }
}

// ── Pictograma ────────────────────────────────────────────────────────────────

function fmtMwh(mwh) {
  return Math.round(mwh).toLocaleString("es-CL") + " MWh";
}

function calcUnidad(totalMwh, consumoDiaMwh) {
  const dias = totalMwh / consumoDiaMwh;
  const s = Math.round(dias / 7);
  if (s <= 52)
    return { n: s, singular: "semana", plural: "semanas",
             consumoUnidad: consumoDiaMwh * 7, labelUnidad: "Semanal" };
  const m = Math.round(dias / 30.44);
  if (m <= 24)
    return { n: m, singular: "mes", plural: "meses",
             consumoUnidad: consumoDiaMwh * 30.44, labelUnidad: "Mensual" };
  const a = Math.round(dias / 365.25);
  return { n: a, singular: "año", plural: "años",
           consumoUnidad: consumoDiaMwh * 365.25, labelUnidad: "Anual" };
}

function calcCols(n, preferredCols) {
  if (n <= 1) return 1;
  // Apunta a 2-5 filas; si el preferido da más de 6 filas, aumenta columnas
  const rows = Math.ceil(n / preferredCols);
  if (rows <= 5) return preferredCols;
  return Math.ceil(n / 5);
}

function renderEquivalencia(eq) {
  const { n, singular, plural, consumoUnidad, labelUnidad } = calcUnidad(vertMwh, eq.consumo_dia_mwh);
  const label = n === 1 ? singular : plural;
  const cols  = calcCols(n, eq.cols);

  let iconsHTML = "";
  for (let i = 0; i < n; i++) {
    iconsHTML += `<span class="icon-week" title="${eq.nombre} — ${singular} ${i + 1} de ${n}"><i data-lucide="${eq.icon}"></i></span>`;
  }

  return `
    <div class="equivalence">
      <div class="equiv-label">
        <div class="equiv-duration" style="color:${eq.color}">${n} ${label}</div>
        <div class="equiv-name">${eq.nombre}</div>
        <div class="equiv-stats">
          <span>Anual: ${fmtMwh(eq.consumo_anual_mwh)}</span>
          <span>${labelUnidad}: ${fmtMwh(consumoUnidad)}</span>
        </div>
      </div>
      <div class="equiv-icons" style="--cols: ${cols}">${iconsHTML}</div>
    </div>
  `.trim();
}

function renderPictograma() {
  const container = document.getElementById("pictogram");
  if (!container) return;
  container.innerHTML = EQUIVALENCIAS.map(renderEquivalencia).join("\n");
}

// ── Sonido ────────────────────────────────────────────────────────────────────

// Clips: hospital 2.30s, aeropuerto 1.46s, metro 2.76s
// maxLoops y maxSem calibrados para que todo enero use el máximo de loops
// maxSem = semanas-equivalencia de todo enero para cada referencia
const AUDIO_CONFIG = {
  hospital:   { src: "audio/hospital.mp3",   consumoDia: 23.29,   maxLoops: 4, maxSem: 2876 },
  aeropuerto: { src: "audio/aeropuerto.mp3", consumoDia: 161.4,   maxLoops: 5, maxSem:  415 },
  metro:      { src: "audio/metro.mp3",       consumoDia: 1335.9,  maxLoops: 2, maxSem:   50 },
};

function calcLoops(ref) {
  const { consumoDia, maxLoops, maxSem } = AUDIO_CONFIG[ref];
  const semanas = vertMwh / consumoDia / 7;
  const t = Math.log(semanas + 1) / Math.log(maxSem + 1);
  return Math.max(1, Math.round(1 + t * (maxLoops - 1)));
}

const audioEls      = {};
const audioLoopData = {}; // { loopsDone, targetLoops, totalMs, t0, animId }

function initAudio() {
  for (const [ref, cfg] of Object.entries(AUDIO_CONFIG)) {
    const a = new Audio(cfg.src);
    a.loop = false;
    audioEls[ref] = a;
  }
}

function playSound(ref, btn) {
  for (const r of Object.keys(audioEls)) {
    if (r !== ref) stopSound(r);
  }

  const audio  = audioEls[ref];
  const player = btn.closest(".audio-player");
  const fill   = player.querySelector(".audio-fill");

  if (!audio.paused || audio.currentTime > 0) {
    stopSound(ref);
    return;
  }

  const targetLoops = calcLoops(ref);

  function start() {
    const clipDur  = audio.duration;        // segundos, disponible tras loadedmetadata
    const totalMs  = targetLoops * clipDur * 1000;
    let loopsDone  = 0;

    audioLoopData[ref] = { loopsDone: 0, targetLoops, totalMs, t0: Date.now() };

    audio.currentTime = 0;
    audio.play();
    player.classList.add("playing");

    // Animar barra de progreso sobre la duración total real
    const t0 = Date.now();
    function tick() {
      const pct = Math.min(100, (Date.now() - t0) / totalMs * 100);
      fill.style.width = pct + "%";
      if (pct < 100 && !audio.paused) requestAnimationFrame(tick);
    }
    requestAnimationFrame(tick);

    // Contar loops completos con evento 'ended'
    function onEnded() {
      loopsDone++;
      if (loopsDone < targetLoops) {
        audio.currentTime = 0;
        audio.play();
      } else {
        audio.removeEventListener("ended", onEnded);
        stopSound(ref);
      }
    }
    audio.addEventListener("ended", onEnded);
  }

  // Esperar metadatos si el clip aún no cargó
  if (audio.readyState >= 1) {
    start();
  } else {
    audio.addEventListener("loadedmetadata", start, { once: true });
  }
}

function stopSound(ref) {
  const audio  = audioEls[ref];
  const player = document.querySelector(`.audio-player[data-ref="${ref}"]`);
  audio.pause();
  audio.currentTime = 0;
  if (player) {
    player.classList.remove("playing");
    player.querySelector(".audio-fill").style.width = "0%";
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
