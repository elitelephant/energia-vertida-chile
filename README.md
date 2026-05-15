# Energía vertida en Chile

Visualización interactiva del vertimiento de energía en Chile.  
**Proyecto IIC2026 — Visualización de la Información, Grupo 20**  
**Sitio:** [elitelephant.github.io/energia-vertida-chile](https://elitelephant.github.io/energia-vertida-chile)

---

## El problema

Chile tiene un excedente que no puede usar. El norte del país genera más electricidad de la que puede consumir localmente. La red de transmisión no tiene capacidad suficiente para transportar ese excedente hacia el sur, donde está la mayor parte del consumo.

Cuando eso ocurre, los operadores ordenan reducir o detener la generación. La energía que se pierde en ese proceso se llama **vertimiento**.

---

## Qué muestra

La visualización muestra cuánta energía renovable se vertió en enero de 2024, con interacción diaria y sonificación.

**Interacción:** calendario heatmap con selección individual de días. Al seleccionar días, los MWh vertidos y la equivalencia se actualizan en tiempo real.

**Equivalencia:** la energía vertida se expresa en horas de funcionamiento de un motor Rolls-Royce Trent XWB-84 (el motor del Airbus A350-900) a potencia de ascenso (85 % de empuje, condición C/O del ciclo LTO ICAO).

| Selección | Vertimiento | Horas de turbina |
|---|---|---|
| Día mínimo (24 ene) | 7.533 MWh | ~76 h |
| Día típico (6 ene) | 14.665 MWh | ~147 h |
| Día máximo (14 ene) | 34.385 MWh | ~345 h |
| Todo enero | 468.175 MWh | ~4.701 h |

**Sonificación:** al pulsar "Escuchar" se reproduce un motor de turbina real (CC0, Freesound) cuya velocidad de reproducción varía entre 0,3× y 2,0× según el vertimiento seleccionado, simulando las RPM del motor.

---

## Datos

### Generación y demanda

**Fuente:** API pública del Coordinador Eléctrico Nacional (CEN SIPub)
- Endpoint generación: `generacion-programada-pcp/v4/findByDate`
- Endpoint demanda: `demanda-programada-pcp/v4/findByDate`
- Período: enero 2024 completo (31 días)

**Proxy de vertimiento:** `max(0, capacidad_disponible_mw − gen_programada_mw)` para plantas ERNC de costo marginal ≈ 0 (`tipo_tecnologia` en `"Solares"` o `"Eólicas"`), agregado por región.

El vertimiento ocurre exclusivamente en el norte: Arica y Parinacota, Tarapacá, Antofagasta y Atacama.

### Motor Rolls-Royce Trent XWB-84

**Flujo de combustible a C/O (climb-out, 85 % de empuje):** 2,306 kg/s

**Fuente:** ICAO Aircraft Engine Emissions Databank, EASA, Issue 32 (marzo 2026).  
Descargable desde easa.europa.eu/en/domains/environment/icao-aircraft-engine-emissions-databank

**Cálculo:**
```
2,306 kg/s × 3.600 s/h × 43,2 MJ/kg ÷ 3.600.000 = 99,6 MWh por hora de turbina
```

> Nota: condición LTO (nivel del mar, 85 % de empuje). El consumo en crucero es aproximadamente el 30–35 % de este valor. Se usa como referencia de potencia nominal certificada por la ICAO/EASA.

---

## Contexto académico

Curso IIC2026 — Visualización de Información, Pontificia Universidad Católica de Chile.  
Entrega 2 — Visualización interactiva + sonificación.  
Grupo 20.

