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

La visualización muestra cuánta energía renovable se vertió.

Para hacer tangible esa cifra, se muestra a cuántas semanas de funcionamiento equivale respecto a tres referencias de consumo eléctrico conocidas en Santiago:

| Referencia | Consumo eléctrico | Equivalencia |
|---|---|---|
| Hospital Barros Luco | 8.500 MWh/año | 80 semanas |
| Aeropuerto de Santiago | 58.901 MWh/año | 12 semanas |
| Metro de Santiago | 487.599 MWh/año | 1 semana |

---

## Datos

### Generación y demanda

**Fuente:** API pública del Coordinador Eléctrico Nacional (CEN SIPub)
- Endpoint generación: `generacion-programada-pcp/v4/findByDate`
- Endpoint demanda: `demanda-programada-pcp/v4/findByDate`
- Fecha: 6 de enero de 2024

**Proxy de vertimiento:** `max(0, capacidad_disponible_mw − gen_programada_mw)` para plantas renovables de costo marginal ≈ 0 (`tipo_tecnologia` en `"Solares"` o `"Eólicas"`), agregado por región.

El vertimiento corresponde principalmente a las regiones del norte: Arica y Parinacota, Tarapacá, Antofagasta y Atacama.

### Hospital Barros Luco

**Consumo estimado:** 8.500 MWh/año (23,3 MWh/día)

No existe una fuente que publique el consumo anual directamente. Se deriva a partir del dato confirmado por el Ministerio de Energía: el techo solar de **100 kW** instalado en el hospital cubre el **2 %** de su consumo total.

Usando el rendimiento solar típico para Santiago (1.700 kWh/kWp/año):

```
100 kW × 1.700 kWh/kWp/año = 170.000 kWh = 170 MWh/año  (generación solar)
170 MWh/año = 2 % del consumo total
Consumo total alrededor de 8.500 MWh/año
```

**Fuente:** Ministerio de Energía — [Inauguración techo solar Hospital Barros Luco](https://energia.gob.cl/noticias/nacional/ministro-de-energia-y-ministra-de-salud-inauguran-techo-solar-del-hospital-barros-luco) (2017)

### Aeropuerto de Santiago (Arturo Merino Benítez)

**Consumo real 2024:** 58.901 MWh/año (161,4 MWh/día)

El aeropuerto opera con 100 % de energía renovable certificada (IREC) desde 2019, a través de un contrato con ENGIE. Tiene además una pequeña planta solar in-situ que autogenera 1.463 MWh/año (2,43 % del consumo).

**Fuente:** [Reporte de Sostenibilidad 2024, Aeropuerto Santiago de Chile](https://www.nuevopudahuel.cl/sites/pdf/ASCL_Reporte_270226.pdf), Capítulo 6.5, p. 132

> Nota: el contrato ENGIE–Nuevo Pudahuel firmado en 2018 contemplaba 105 GWh/año — probablemente proyectado para la expansión completa del T2. El consumo real medido en 2024 es 58,9 GWh.

### Metro de Santiago

**Consumo:** 487.599 MWh/año

El Metro es abastecido principalmente por dos fuentes renovables:

- **Planta solar El Pelícano** (100 MW, La Higuera, Coquimbo). El Pelícano inaugurado en enero de 2018 aporta 300 GWh/año al Metro de Santiago, cubriendo el **42 %** de su consumo.
- **Parque eólico San Juan de Aceituno** (185 MWp, Freirina, Atacama) — cubre el **18 %** de su consumo.

Desde 2023, el Metro opera con **100 % de energía renovable** (certificación I-REC).

**Fuente:** Metro de Santiago, Memoria Integrada 2024, sección 8.3.10, GRI 302-1, p. 191.

---

## Contexto académico

Curso IIC2026 — Visualización de Información, Pontificia Universidad Católica de Chile.  
Entrega 2 — Visualización interactiva + sonificación.  
Grupo 20.
