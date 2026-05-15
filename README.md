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
  - *Texto:* número de horas de turbina equivalentes al vertimiento seleccionado, más los MWh totales.
  - *Grid de turbinas:* 16 íconos de rueda (loader-pinwheel). El número de íconos activos (azul) es proporcional al vertimiento seleccionado respecto al total de enero (4.701 h = 16/16 activas). Los íconos inactivos se muestran en gris.

### Equivalencia: motor Rolls-Royce Trent XWB-84

La energía vertida se expresa en horas de funcionamiento del motor Trent XWB-84 a potencia de ascenso (condición C/O del ciclo LTO ICAO).

| Selección | Vertimiento | Horas de turbina | Íconos activos |
|---|---|---|---|
| Día mínimo (24 ene) | 7.533 MWh | ~76 h | 1/16 |
| Día típico (6 ene) | 14.665 MWh | ~147 h | 1/16 |
| Día máximo (14 ene) | 34.385 MWh | ~345 h | 1/16 |
| Todo enero | 468.175 MWh | ~4.701 h | 16/16 |

### Sonificación

Al pulsar "Escuchar" se reproduce una grabación de motor jet real (CC0, Freesound, sound ID 205581, qubodup). La velocidad de reproducción varía en escala logarítmica entre 0,3× y 2,0× según las horas de turbina del período seleccionado:

- **Día mínimo (76 h):** 0,3× — tono grave, RPM bajas
- **Día máximo (345 h):** 2,0× — tono agudo, RPM altas
- **Todo enero (4.701 h):** 2,0× (techo)

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

### Motor Rolls-Royce Trent XWB-84

**Flujo de combustible a C/O (climb-out, 85 % de empuje):** 2,306 kg/s

**Fuente:** ICAO Aircraft Engine Emissions Databank, Agencia Europea de Seguridad Aérea (EASA), Issue 32 (marzo 2026).  
Descargable desde easa.europa.eu/en/domains/environment/icao-aircraft-engine-emissions-databank

**Cálculo:**
```
2,306 kg/s × 3.600 s/h × 43,2 MJ/kg ÷ 3.600.000 = 99,6 MWh por hora de turbina
```

> Condición LTO (nivel del mar, 85 % de empuje). El consumo en crucero es aproximadamente el 30–35 % de este valor. Se usa como referencia de potencia nominal certificada por la ICAO/EASA.

---

## Contexto académico

Curso IIC2026 — Visualización de Información, Pontificia Universidad Católica de Chile.  
Entrega 2 — Visualización interactiva + sonificación.  
Grupo 20.
