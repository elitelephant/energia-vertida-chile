const VERTIMIENTO_MWH = 14665; // ERNC (solar + eólica), 6 enero 2024

// Consumo diario de cada referencia (MWh/día)
// Hospital: 100 kW solar = 2% consumo (MINENERGIA 2017) + rendimiento solar Santiago ~1.700 kWh/kWp/año → 8.500 MWh/año
// Aeropuerto: Reporte Sostenibilidad 2024 Nuevo Pudahuel p.132 → 58.901 MWh/año
// Metro: Memoria Integrada 2024 (GRI 302-1, p. 191) → 487.599 MWh eléctricos en 2024
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

function fmtMwh(mwh) {
  return Math.round(mwh).toLocaleString("es-CL") + " MWh";
}

function renderEquivalencia(eq) {
  const semanas = Math.round(VERTIMIENTO_MWH / eq.consumo_dia_mwh / 7);
  const consumo_semana_mwh = eq.consumo_dia_mwh * 7;

  let iconsHTML = "";
  for (let i = 0; i < semanas; i++) {
    iconsHTML += `<span class="icon-week" title="${eq.nombre} — semana ${i + 1} de ${semanas}"><i data-lucide="${eq.icon}"></i></span>`;
  }

  return `
    <div class="equivalence">
      <div class="equiv-label">
        <div class="equiv-duration" style="color:${eq.color}">
          ${semanas} semanas
        </div>
        <div class="equiv-name">${eq.nombre}</div>
        <div class="equiv-stats">
          <span>Anual: ${fmtMwh(eq.consumo_anual_mwh)}</span>
          <span>Semanal: ${fmtMwh(consumo_semana_mwh)}</span>
        </div>
      </div>
      <div class="equiv-icons" style="--cols: ${eq.cols}">
        ${iconsHTML}
      </div>
    </div>
  `.trim();
}

function renderPictograma() {
  const container = document.getElementById("pictogram");
  if (!container) return;
  container.innerHTML = EQUIVALENCIAS.map(renderEquivalencia).join("\n");
  if (window.lucide) lucide.createIcons();
}

document.addEventListener("DOMContentLoaded", renderPictograma);
