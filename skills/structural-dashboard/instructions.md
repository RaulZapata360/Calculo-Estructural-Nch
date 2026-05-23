# Skill: Dashboard Estructural

## Descripción
Visualización de **KPIs y métricas** en tiempo real. Monitorea:
- Cargas (qD, qL vs capacidad)
- Fuerzas críticas (M_max, V_max por elemento)
- Armadura (As_req vs As_selected vs As_min/max)
- Factores de seguridad (flexión, corte)
- Alertas (incumplimientos NCh430)

## Entrada

```javascript
{
  // Resultados de cálculo (S.results)
  results: {
    qu: 3.304,  // carga combinada (kN/m²)
    spans: [
      {
        id: 'sp1',
        M_max: 10.14,  // kN·m
        V_max: 4.25,   // kN
        N: 2.50        // kN (carga axial)
      },
      // ... más spans
    ],
    columns: [
      {
        id: 'c0',
        As_req: 7.23,      // cm² requerido
        As_min: 4.02,      // cm² mínimo (NCh430)
        As_max: 36.8,      // cm² máximo (NCh430)
        As_selected: 8.04, // cm² seleccionado (ej: 4Ø16)
        Vc: 8.5,           // kN (cortante sin refuerzo)
        Vs: 2.3,           // kN (cortante acero proporciona)
        s_max_nch: 0.20,   // m (espaciamiento máximo NCh430)
        s_selected: 0.15   // m (espaciamiento seleccionado)
      },
      // ... más columnas/elementos
    ]
  },
  
  // Metadatos del proyecto
  story: {
    H: 1.0,
    materials: { fc: 25, fy: 420, rec: 0.03 },
    loads: { qD: 1.18, qL: 1.18 }
  }
}
```

## Proceso

### Paso 1: Calcular KPIs

```javascript
const kpis = {};

// KPI 1: Utilización de capacidad (Cargas)
kpis.carga = {
  qD: S.story.loads.qD,
  qL: S.story.loads.qL,
  qu_total: S.results.qu,
  capacidad_asumida: 4.5, // kN/m² (típico muro)
  utilization_percent: (S.results.qu / 4.5) * 100,
  status: (S.results.qu / 4.5) < 0.85 ? "verde" : 
          (S.results.qu / 4.5) < 1.0 ? "amarillo" : "rojo"
};

// KPI 2: Momento máximo (seguridad flexión)
const M_max_global = Math.max(...S.results.spans.map(sp => sp.M_max));
const M_capacidad = calculaCapacidadFlexion(S.story.materials); // kN·m
kpis.flexion = {
  M_max: M_max_global,
  M_capacidad: M_capacidad,
  factor_seguridad: M_capacidad / M_max_global,
  utilization_percent: (M_max_global / M_capacidad) * 100,
  status: (M_max_global / M_capacidad) < 0.85 ? "verde" : 
          (M_max_global / M_capacidad) < 1.0 ? "amarillo" : "rojo"
};

// KPI 3: Cortante máximo (seguridad corte)
const V_max_global = Math.max(...S.results.spans.map(sp => sp.V_max));
const V_capacidad = calculaCapacidadCorte(S.story.materials); // kN
kpis.corte = {
  V_max: V_max_global,
  V_capacidad: V_capacidad,
  factor_seguridad: V_capacidad / V_max_global,
  utilization_percent: (V_max_global / V_capacidad) * 100,
  status: (V_max_global / V_capacidad) < 0.85 ? "verde" : 
          (V_max_global / V_capacidad) < 1.0 ? "amarillo" : "rojo"
};

// KPI 4: Armadura (utilización)
const armadura_stats = S.results.columns.map(col => ({
  element_id: col.id,
  As_req: col.As_req,
  As_min: col.As_min,
  As_selected: col.As_selected,
  utilization: col.As_req / col.As_selected,
  cumple_min: col.As_selected >= col.As_min,
  cumple_max: col.As_selected <= col.As_max
}));

kpis.armadura = {
  elementos_ok: armadura_stats.filter(a => a.cumple_min && a.cumple_max).length,
  elementos_total: armadura_stats.length,
  percent_ok: (armadura_stats.filter(a => a.cumple_min && a.cumple_max).length / 
               armadura_stats.length) * 100,
  utilizacion_promedio: armadura_stats.reduce((sum, a) => sum + a.utilization, 0) / 
                        armadura_stats.length,
  status: armadura_stats.every(a => a.cumple_min && a.cumple_max) ? "verde" : "rojo"
};

// KPI 5: Estribos (espaciamiento)
const estribos_stats = S.results.columns.map(col => ({
  element_id: col.id,
  s_max_nch: col.s_max_nch,
  s_selected: col.s_selected,
  cumple: col.s_selected <= col.s_max_nch
}));

kpis.estribos = {
  elementos_ok: estribos_stats.filter(e => e.cumple).length,
  elementos_total: estribos_stats.length,
  status: estribos_stats.every(e => e.cumple) ? "verde" : "rojo"
};

console.log("KPIs calculados:", kpis);
```

### Paso 2: Definir alertas

```javascript
const alertas = [];

// Alerta 1: Carga próxima a capacidad
if (kpis.carga.utilization_percent > 85) {
  alertas.push({
    nivel: kpis.carga.utilization_percent > 100 ? "crítica" : "advertencia",
    mensaje: `Cargas al ${kpis.carga.utilization_percent.toFixed(1)}% de capacidad`,
    recomendacion: "Revisar combinaciones de carga"
  });
}

// Alerta 2: Momento crítico
if (kpis.flexion.utilization_percent > 85) {
  alertas.push({
    nivel: kpis.flexion.utilization_percent > 100 ? "crítica" : "advertencia",
    mensaje: `Momento al ${kpis.flexion.utilization_percent.toFixed(1)}% de capacidad`,
    recomendacion: "Aumentar armadura vertical"
  });
}

// Alerta 3: Cortante crítico
if (kpis.corte.utilization_percent > 85) {
  alertas.push({
    nivel: kpis.corte.utilization_percent > 100 ? "crítica" : "advertencia",
    mensaje: `Cortante al ${kpis.corte.utilization_percent.toFixed(1)}% de capacidad`,
    recomendacion: "Aumentar estribos o f'c"
  });
}

// Alerta 4: Incumplimiento As_min/max
const elem_incumplen = armadura_stats.filter(a => !a.cumple_min || !a.cumple_max);
if (elem_incumplen.length > 0) {
  alertas.push({
    nivel: "crítica",
    mensaje: `${elem_incumplen.length} elemento(s) incumplen As_min/As_max`,
    elementos: elem_incumplen.map(a => a.element_id),
    recomendacion: "Ajustar armadura seleccionada"
  });
}

// Alerta 5: Espaciamiento estribos fuera de norma
const estribos_incumplen = estribos_stats.filter(e => !e.cumple);
if (estribos_incumplen.length > 0) {
  alertas.push({
    nivel: "advertencia",
    mensaje: `${estribos_incumplen.length} elemento(s) con s > s_max_nch`,
    elementos: estribos_incumplen.map(e => e.element_id),
    recomendacion: "Reducir espaciamiento de estribos"
  });
}

console.log("Alertas generadas:", alertas);
```

### Paso 3: Generar visualizaciones HTML/SVG

```html
<!-- Dashboard Structure -->
<div class="dashboard-container">
  
  <!-- Encabezado -->
  <header class="dashboard-header">
    <h1>Dashboard Estructural — EstructuraCalc</h1>
    <span class="timestamp">Actualizado: {now}</span>
  </header>
  
  <!-- KPIs principales (cards) -->
  <section class="kpis-grid">
    
    <div class="kpi-card {kpis.carga.status}">
      <h3>Cargas</h3>
      <div class="kpi-value">{kpis.carga.utilization_percent.toFixed(1)}%</div>
      <div class="kpi-detail">
        qD={kpis.carga.qD} | qL={kpis.carga.qL} | qu={kpis.carga.qu_total.toFixed(3)}
      </div>
      <div class="kpi-bar">
        <div class="fill" style="width: {kpis.carga.utilization_percent}%"></div>
      </div>
    </div>
    
    <div class="kpi-card {kpis.flexion.status}">
      <h3>Momento (Flexión)</h3>
      <div class="kpi-value">{kpis.flexion.utilization_percent.toFixed(1)}%</div>
      <div class="kpi-detail">
        M_max={kpis.flexion.M_max.toFixed(2)} / {kpis.flexion.M_capacidad.toFixed(2)} kN·m
      </div>
      <div class="kpi-bar">
        <div class="fill" style="width: {kpis.flexion.utilization_percent}%"></div>
      </div>
    </div>
    
    <div class="kpi-card {kpis.corte.status}">
      <h3>Cortante</h3>
      <div class="kpi-value">{kpis.corte.utilization_percent.toFixed(1)}%</div>
      <div class="kpi-detail">
        V_max={kpis.corte.V_max.toFixed(2)} / {kpis.corte.V_capacidad.toFixed(2)} kN
      </div>
      <div class="kpi-bar">
        <div class="fill" style="width: {kpis.corte.utilization_percent}%"></div>
      </div>
    </div>
    
    <div class="kpi-card {kpis.armadura.status}">
      <h3>Armadura</h3>
      <div class="kpi-value">{kpis.armadura.percent_ok.toFixed(0)}%</div>
      <div class="kpi-detail">
        {kpis.armadura.elementos_ok} / {kpis.armadura.elementos_total} elementos OK
      </div>
      <div class="kpi-bar">
        <div class="fill" style="width: {kpis.armadura.percent_ok}%"></div>
      </div>
    </div>
    
  </section>
  
  <!-- Alertas -->
  {if alertas.length > 0:
  <section class="alertas">
    <h2>⚠️ Alertas y Recomendaciones</h2>
    {for each alert in alertas:
      <div class="alert alert-{alert.nivel}">
        <h4>{alert.mensaje}</h4>
        <p>{alert.recomendacion}</p>
        {if alert.elementos:
          <ul>
            {for each elem in alert.elementos: <li>{elem}</li>}
          </ul>
        }
      </div>
    }
  </section>
  }
  
  <!-- Gráficas -->
  <section class="charts">
    
    <!-- Gráfica 1: Cargas por elemento -->
    <div class="chart-container">
      <h3>Cargas por Vano (qD + qL = qu)</h3>
      <canvas id="chart-loads"></canvas>
    </div>
    
    <!-- Gráfica 2: Momento vs Capacidad (por span) -->
    <div class="chart-container">
      <h3>Momento Flector (M) — Utilización por Elemento</h3>
      <svg id="chart-moments">
        {for each span in S.results.spans:
          <g class="bar-group" transform="translate({span.id_index * 50}, 0)">
            <rect class="bar-capacity" height="200" width="40" fill="#ddd" />
            <rect class="bar-actual" height="{span.M_max / kpis.flexion.M_capacidad * 200}" 
                  width="40" fill="{span.M_max / kpis.flexion.M_capacidad > 0.85 ? 'red' : 'green'}" />
            <text y="220" x="20" text-anchor="middle">{span.id}</text>
          </g>
        }
      </svg>
    </div>
    
    <!-- Gráfica 3: Armadura vs Requerimientos -->
    <div class="chart-container">
      <h3>Armadura Longitudinal (As) — Utilización por Elemento</h3>
      <table class="rebar-table">
        <thead>
          <tr>
            <th>Elemento</th>
            <th>As_req (cm²)</th>
            <th>As_min (cm²)</th>
            <th>As_max (cm²)</th>
            <th>As_selec (cm²)</th>
            <th>Util. (%)</th>
            <th>Estado</th>
          </tr>
        </thead>
        <tbody>
          {for each col in S.results.columns:
            <tr class="row-{col.As_selected >= col.As_min && col.As_selected <= col.As_max ? 'ok' : 'fail'}">
              <td>{col.id}</td>
              <td>{col.As_req.toFixed(2)}</td>
              <td>{col.As_min.toFixed(2)}</td>
              <td>{col.As_max.toFixed(2)}</td>
              <td>{col.As_selected.toFixed(2)}</td>
              <td>{(col.As_req / col.As_selected * 100).toFixed(1)}</td>
              <td class="status-{col.As_selected >= col.As_min ? 'ok' : 'fail'}">
                {col.As_selected >= col.As_min && col.As_selected <= col.As_max ? '✓' : '✗'}
              </td>
            </tr>
          }
        </tbody>
      </table>
    </div>
    
    <!-- Gráfica 4: Cortante vs Capacidad -->
    <div class="chart-container">
      <h3>Cortante (V) — Utilización por Elemento</h3>
      {similar bar chart para V vs Vc}
    </div>
    
  </section>
  
  <!-- Resumen ejecutivo -->
  <section class="summary">
    <h2>Resumen Ejecutivo</h2>
    <table class="summary-table">
      <tr>
        <td>Altura total (H)</td>
        <td>{S.story.H} m</td>
      </tr>
      <tr>
        <td>Carga combinada (qu)</td>
        <td>{S.results.qu.toFixed(3)} kN/m²</td>
      </tr>
      <tr>
        <td>Momento máximo</td>
        <td>{kpis.flexion.M_max.toFixed(2)} kN·m</td>
      </tr>
      <tr>
        <td>Cortante máximo</td>
        <td>{kpis.corte.V_max.toFixed(2)} kN</td>
      </tr>
      <tr>
        <td>Armadura promedio</td>
        <td>{(kpis.armadura.utilizacion_promedia * 100).toFixed(1)}% utilizada</td>
      </tr>
      <tr>
        <td>Normativa</td>
        <td>NCh430 Of.2008 (ACI 318-19)</td>
      </tr>
    </table>
  </section>
  
</div>
```

### Paso 4: Aplicar estilos (CSS)

```css
.dashboard-container {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
  background: #1e1e1e;
  color: #fff;
  padding: 2rem;
  border-radius: 8px;
}

.kpis-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 1.5rem;
  margin: 2rem 0;
}

.kpi-card {
  padding: 1.5rem;
  border-radius: 8px;
  border-left: 4px solid;
  background: #2a2a2a;
}

.kpi-card.verde {
  border-color: #10b981;
  background: rgba(16, 185, 129, 0.1);
}

.kpi-card.amarillo {
  border-color: #f59e0b;
  background: rgba(245, 158, 11, 0.1);
}

.kpi-card.rojo {
  border-color: #ef4444;
  background: rgba(239, 68, 68, 0.1);
}

.kpi-value {
  font-size: 2.5rem;
  font-weight: bold;
  margin: 0.5rem 0;
}

.kpi-bar {
  width: 100%;
  height: 8px;
  background: #444;
  border-radius: 4px;
  overflow: hidden;
  margin-top: 1rem;
}

.kpi-bar .fill {
  height: 100%;
  background: currentColor;
  transition: width 0.3s ease;
}

.alertas {
  background: #3a3a3a;
  padding: 1.5rem;
  border-radius: 8px;
  margin: 2rem 0;
}

.alert {
  margin: 1rem 0;
  padding: 1rem;
  border-left: 4px solid;
  border-radius: 4px;
}

.alert-crítica {
  border-color: #ef4444;
  background: rgba(239, 68, 68, 0.1);
}

.alert-advertencia {
  border-color: #f59e0b;
  background: rgba(245, 158, 11, 0.1);
}

.charts {
  margin-top: 3rem;
  display: grid;
  gap: 2rem;
}

.chart-container {
  background: #2a2a2a;
  padding: 1.5rem;
  border-radius: 8px;
}

.rebar-table {
  width: 100%;
  border-collapse: collapse;
  margin-top: 1rem;
}

.rebar-table thead {
  background: #444;
}

.rebar-table th, .rebar-table td {
  padding: 0.75rem;
  text-align: left;
  border-bottom: 1px solid #444;
}

.row-ok {
  background: rgba(16, 185, 129, 0.1);
}

.row-fail {
  background: rgba(239, 68, 68, 0.1);
}

.status-ok {
  color: #10b981;
  font-weight: bold;
}

.status-fail {
  color: #ef4444;
  font-weight: bold;
}
```

## Salida

**Dashboard HTML interactivo** con:
1. Cards de KPIs (cargas, momento, cortante, armadura)
2. Barra de progreso y status por métrica
3. Alertas de incumplimientos (As_min, As_max, s_max, etc.)
4. Gráficas de utilización (por elemento)
5. Tabla de armadura vs requerimientos
6. Resumen ejecutivo

## Ejemplos de Uso

### Caso 1: Monitoreo en tiempo real
```
Usuario: "Muestra el estado del muro mientras itero el diseño"
Script:
  1. Cada cambio de armadura → recalcula KPIs
  2. Actualiza dashboard (colores rojo/amarillo/verde)
  3. Alerta si se incumple normativa
  Resultado: Feedback visual inmediato
```

### Caso 2: Comparativa de diseños
```
Usuario: "Compara las opciones: 8Ø12 vs 10Ø10 vs 12Ø8"
Script:
  1. Carga 3 escenarios (S.results diferentes)
  2. Calcula KPIs para cada uno
  3. Genera 3 dashboards lado a lado
  Resultado: Tabla comparativa (utilización, costo, facilidad constructiva)
```

### Caso 3: Exportar dashboard a PDF
```
Usuario: "Exporta el dashboard como PDF para el cliente"
Script:
  1. Renderiza HTML + CSS
  2. Convierte a PDF (Puppeteer, wkhtmltopdf)
  3. Incluye timestamp y firma digital
  Resultado: PDF entregable con estado actual del proyecto
```

## Notas Importantes

1. **Actualización:** Dashboard se recalcula CADA VEZ que Solver.run() termina
2. **Alertas:** Son automáticas; usuario debe actuar sobre ellas
3. **Colores:** Verde (< 70%), Amarillo (70-85%), Rojo (> 85% o incumplimiento)
4. **Métricas:** Todas normalizadas según NCh430 (factores φ, ρ_min, ρ_max incluidos)
5. **Performance:** Mantener < 500ms de cálculo de KPIs (para UI responsiva)

## Archivos Relacionados

- `files/kpi-definitions.md` — Definiciones matemáticas de cada KPI
- `PROJECT.md` (en raíz) — Referencia de S.results schema
- `structural-report-generator/` — Generar PDF desde dashboard
- `iterative-design-workflow/` — Itera basándose en alertas del dashboard

---

**Versión:** 1.0  
**Último update:** 2026-05-21  
**Complejidad:** Media (visualización + lógica de alertas)
