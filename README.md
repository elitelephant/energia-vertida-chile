# Energía vertida en Chile

Visualización interactiva del vertimiento de energía en Chile.  
**Proyecto IIC2026 — Visualización de la Información, Grupo 20**  
**Sitio:** [elitelephant.github.io/energia-vertida-chile](https://elitelephant.github.io/energia-vertida-chile)

---

## El problema

Chile tiene un excedente que no puede usar. El norte del país genera más electricidad renovable de la que puede consumir localmente. La red de transmisión no tiene capacidad suficiente para transportar ese excedente hacia el sur, donde está la mayor parte del consumo.

Cuando eso ocurre, los operadores ordenan reducir o detener la generación. La energía que se pierde en ese proceso se llama **vertimiento**.

---

## Qué muestra

La visualización muestra cuánta energía renovable se vertió en enero de 2024, con selección interactiva de días y sonificación.

### Layout

Dos paneles principales:

- **Izquierda — Calendario:** heatmap de enero 2024. El color de cada celda es proporcional al vertimiento de ese día (azul más intenso = más vertimiento). Click en cualquier día para seleccionar/deseleccionar. Botones "Seleccionar todo" y "Limpiar". Botón "Escuchar" para reproducir el sonido de turbina.

- **Derecha — Equivalencia:** el panel se divide en dos columnas.
  - *Texto:* los MWh vertidos del período seleccionado y las horas equivalentes de una turbina eólica como las del Parque Eólico Atacama ("X MWh vertidos equivalen a Y horas de una turbina eólica").
  - *Grid de turbinas:* 16 íconos de rueda (loader-pinwheel). El número de íconos activos (azul) es proporcional al vertimiento seleccionado respecto al total de enero (82.136 h = 16/16 activas). Los íconos inactivos se muestran en gris.

### Equivalencia: aerogenerador Nordex N163-5.7MW

La energía vertida se expresa en horas que tardó una turbina eólica en generarla, operando a plena capacidad.

| Selección | Vertimiento | Horas de turbina | Íconos activos |
|---|---|---|---|
| Día mínimo (24 ene) | ~7.300 MWh | ~1.281 h | 0/16 |
| Día típico (6 ene) | 14.665 MWh | ~2.573 h | 0/16 |
| Día máximo (14 ene) | 34.385 MWh | ~6.033 h | 1/16 |
| Todo enero | 468.175 MWh | ~82.136 h | 16/16 |

### Sonificación

Al pulsar "Escuchar" se reproduce una grabación de turbina eólica (CC0, Freesound, sound ID 205581, qubodup). La velocidad de reproducción varía en escala logarítmica entre 0,3× y 2,0× según las horas de turbina del período seleccionado:

- **Día mínimo (1.281 h):** 0,3× — tono grave, RPM bajas
- **Día máximo (6.033 h):** 2,0× — tono agudo, RPM altas
- **Todo enero (82.136 h):** 2,0× (techo)

Los íconos activos del grid giran mientras suena el audio, a la misma velocidad que el playbackRate.

Duración: 7 segundos con fade in (0,8 s) y fade out (1,2 s). Debounce de 1 segundo al cambiar la selección.

**Nota CORS:** el audio usa Web Audio API con XHR, que requiere servidor HTTP. Servir con `python -m http.server 8000` en `codigo/docs/docs/`.

---

## Datos

### Generación y demanda

**Fuente:** API pública del Coordinador Eléctrico Nacional (CEN SIPub)
- Período: enero 2024 completo (31 días)

**Proxy de vertimiento:** `max(0, capacidad_disponible_mw − gen_programada_mw)` para plantas ERNC de costo marginal ≈ 0 (`tipo_tecnologia` en `"Solares"` o `"Eólicas"`), agregado por región.

El vertimiento ocurre exclusivamente en el norte: Arica y Parinacota, Tarapacá, Antofagasta y Atacama.

### Aerogenerador Nordex N163-5.7MW

**Parque:** Parque Eólico Atacama, Freirina, Región de Atacama, Chile. 29 aerogeneradores Nordex N163-5.7MW. Capacidad total: 165 MW. Desarrollado por Repsol. Operativo desde enero 2023.

**Potencia unitaria:** 5,70 MW → produce **5,7 MWh por hora de operación** a plena carga.

**Fuente modelo base (N163/5.X):** The Wind Power, turbine ID 1721.  
thewindpower.net/turbine_en_1721_nordex_n163-5.x.php  
Rotor: 163 m de diámetro. Velocidad de arranque: 3 m/s. Velocidad de corte: 26 m/s.

**Cálculo de equivalencia:**
```
vertMwh ÷ 5,7 MW = horas que tardó una turbina eólica en generar esa energía
```

---

## Contexto académico

Curso IIC2026 — Visualización de Información, Pontificia Universidad Católica de Chile.  
Entrega 3 — Visualización física, interactiva y con sonificación.  
Grupo 20.
