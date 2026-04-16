const VERTIMIENTO_MWH = 13514;

// Consumo diario de cada referencia (MWh/día)
// Hospital: ~5,5 GWh/año ÷ 365 (derivado: techo solar 100 kW = 2% del consumo)
// Aeropuerto: 105 GWh/año ÷ 365 (contrato ENGIE–Nuevo Pudahuel, 2018)
// Metro: ~300 GWh/año ÷ 365 (Memoria Anual Metro de Santiago)
const EQUIVALENCIAS = [
  {
    nombre: "Hospital Barros Luco",
    emoji: "🏥",
    color: "#e05c5c",
    consumo_dia_mwh: 15.07,
    cols: 16,
    fuente: "Derivado: techo solar 100 kW cubre el 2% del consumo anual"
  },
  {
    nombre: "Aeropuerto de Santiago",
    emoji: "✈️",
    color: "#4a90d9",
    consumo_dia_mwh: 287.7,
    cols: 7,
    fuente: "Contrato ENGIE–Nuevo Pudahuel (2018): 105 GWh/año"
  },
  {
    nombre: "Metro de Santiago",
    emoji: "🚇",
    color: "#e05c5c",
    consumo_dia_mwh: 821.9,
    cols: 2,
    fuente: "Memoria Anual Metro de Santiago: ~300 GWh/año"
  }
];

function renderEquivalencia(eq) {
  const dias = VERTIMIENTO_MWH / eq.consumo_dia_mwh;
  const semanas = Math.round(dias / 7);
  const anios = semanas / 52;

  const duracionLabel = `~${semanas} semanas`;
  const aniosLabel = anios >= 1 ? `~${anios.toFixed(1)} años` : "";

  let iconsHTML = "";
  for (let i = 0; i < semanas; i++) {
    iconsHTML += `<span class="icon-week" style="background:${eq.color}" title="${eq.nombre} — semana ${i + 1} de ${semanas}">${eq.emoji}</span>`;
  }

  return `
    <div class="equivalence">
      <div class="equiv-label">
        <div class="equiv-name">${eq.emoji} ${eq.nombre}</div>
        <div class="equiv-duration" style="color:${eq.color}">
          ${duracionLabel}
          ${aniosLabel ? `<span class="equiv-years">${aniosLabel}</span>` : ""}
        </div>
        <div class="equiv-note">${eq.fuente}</div>
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
}

document.addEventListener("DOMContentLoaded", renderPictograma);
