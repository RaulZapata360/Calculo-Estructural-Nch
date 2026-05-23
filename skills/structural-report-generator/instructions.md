# Skill: Generador de Reportes Estructurales

## Descripción
Genera **PDF profesionales** con resultados completos de cálculo estructural. Incluye:
- Resumen ejecutivo (cargas, materiales, geometría)
- Tablas de fuerzas (momento, cortante, axial) por elemento
- Gráficas de diagramas (M, V, N) normalizadas
- Especificación de armadura (As, estribos, espaciamiento)
- Checklist de cumplimiento NCh430

## Entrada
```javascript
// Estado global del proyecto (S)
{
  story: { H, loads: {...}, materials: {...}, lateral: {...}, foundation },
  spans: [...],
  columns: {...},
  results: { qu, spans: {...}, columns: {...} }
}
```

## Proceso

### Paso 1: Recolectar datos de S
```javascript
const reportData = {
  // Geometría
  height: S.story.H,
  spans: S.spans.map(sp => ({ id: sp.id, width: sp.toNode - sp.fromNode, type: sp.type })),
  
  // Cargas
  loads: S.story.loads,
  combination: { fd: 1.2, fl: 1.6, qu: S.results.qu },
  
  // Materiales
  materials: S.story.materials, // fc, fy, rec, beta1
  
  // Resultados
  results: {
    spans: S.results.spans, // M_max, V_max, N por span
    columns: S.results.columns // As_req, As_min, As_max, As_selected, s_estribos
  }
}
```

### Paso 2: Validar datos (antes de exportar)
```javascript
// Checklist pre-export
const validation = {
  has_loads: reportData.loads && Object.keys(reportData.loads).length > 0,
  has_results: reportData.results && reportData.results.spans,
  materials_complete: reportData.materials && reportData.materials.fc && reportData.materials.fy,
  qu_calculated: reportData.combination.qu > 0,
  nch430_compliance: validateNCh430(reportData) // ver nch-compliance-checklist.md
};

if (!Object.values(validation).every(v => v)) {
  throw new Error("Validación fallida. Verifica datos antes de exportar.");
}
```

### Paso 3: Generar HTML (plantilla)
Usa `template-report.html` como base:
```html
<!-- Resumen ejecutivo -->
<section id="executive">
  <h2>Resumen Ejecutivo</h2>
  <table class="summary-table">
    <tr><td>Altura total (H)</td><td>{reportData.height} m</td></tr>
    <tr><td>Cargas combinadas (qu)</td><td>{reportData.combination.qu} kN/m²</td></tr>
    <tr><td>f'c (hormigón)</td><td>{reportData.materials.fc} MPa</td></tr>
    <tr><td>fy (acero)</td><td>{reportData.materials.fy} MPa</td></tr>
  </table>
</section>

<!-- Diagramas -->
<section id="diagrams">
  <h2>Diagramas de Fuerzas Internas</h2>
  {insertSVGs for M, V, N from S.renderer}
</section>

<!-- Especificación de armadura -->
<section id="rebar">
  <h2>Especificación de Armadura</h2>
  <table class="rebar-table">
    <thead>
      <tr><th>Elemento</th><th>As_req (cm²)</th><th>As_min (cm²)</th><th>As_max (cm²)</th><th>As_selec (cm²)</th><th>Barras</th><th>Estado</th></tr>
    </thead>
    <tbody>
      {for each column in reportData.results.columns:
        <tr>
          <td>{column.id}</td>
          <td>{column.As_req}</td>
          <td>{column.As_min}</td>
          <td>{column.As_max}</td>
          <td>{column.As_selected}</td>
          <td>{column.rebar_desc}</td>
          <td class="status-{column.status}">{column.status}</td>
        </tr>
      }
    </tbody>
  </table>
</section>

<!-- Verificaciones NCh430 -->
<section id="compliance">
  <h2>Verificación de Cumplimiento NCh430</h2>
  {insertChecklist from nch-compliance-checklist.md}
</section>
```

### Paso 4: Convertir HTML a PDF
**Opción A (recomendada): Usar MCP de PDF**
```javascript
// Si tienes acceso a MCP de generación PDF
const pdf = await generatePDFFromHTML(htmlContent, {
  format: "A4",
  margin: { top: 1, bottom: 1, left: 0.75, right: 0.75 }, // cm
  filename: `EstructuraCalc_Reporte_${new Date().toISOString().split('T')[0]}.pdf`
});
return pdf;
```

**Opción B (fallback): Exportar HTML para impresión**
```javascript
// Usuario abre navegador y hace Ctrl+P → PDF
const reportWindow = window.open("about:blank");
reportWindow.document.write(htmlContent);
reportWindow.print();
```

### Paso 5: Generar tablas de especificación
```javascript
// Tabla 1: Cargas por span
const loadsTable = S.spans.map(span => ({
  span_id: span.id,
  qD: S.story.loads.qD,
  qL: S.story.loads.qL,
  qu: S.results.spans[span.id].qu
}));

// Tabla 2: Fuerzas máximas
const forcesTable = S.spans.map(span => ({
  span_id: span.id,
  M_max: S.results.spans[span.id].M_max,
  V_max: S.results.spans[span.id].V_max,
  N: S.results.spans[span.id].N
}));

// Tabla 3: Verificación estribos (s_max)
const stripesTable = S.results.columns.map(col => ({
  column_id: col.id,
  V_max: col.V_max,
  Vc: col.Vc,
  Vs: col.Vs,
  s_max_nch: col.s_max_nch,
  s_selec: col.s_selected,
  status: col.s_selected <= col.s_max_nch ? "✓ OK" : "✗ FALLA"
}));
```

### Paso 6: Insertar gráficas
```javascript
// Extraer gráficas SVG desde renderer.js
const diagramsHTML = `
  <div class="diagrams-container">
    <div class="diagram">
      <h3>Diagrama de Momento (kN·m)</h3>
      ${S.renderer.getSVGForDiagram('moment')}
    </div>
    <div class="diagram">
      <h3>Diagrama de Cortante (kN)</h3>
      ${S.renderer.getSVGForDiagram('shear')}
    </div>
    <div class="diagram">
      <h3>Diagrama de Axial (kN)</h3>
      ${S.renderer.getSVGForDiagram('axial')}
    </div>
  </div>
`;
```

## Salida

**Archivo PDF** con estructura:
```
1. Portada (proyecto, fecha, responsable)
2. Resumen ejecutivo (geometría, cargas, materiales)
3. Cálculos (combinaciones LRFD, cargas por elemento)
4. Diagramas (M, V, N normalizados)
5. Especificación de armadura (tablas detalladas)
6. Verificaciones (checklist NCh430)
7. Anexos (normativas aplicadas, hipótesis de cálculo)
```

## Ejemplos de Uso

### Caso 1: Generar reporte rápido (ejecutivo)
```
Usuario: "Genera un reporte PDF con resumen de cargas y armadura"
Script:
  1. Toma S actual
  2. Genera HTML minimalista (solo tablas + diagramas M, V)
  3. Exporta PDF ejecutivo (3-5 páginas)
```

### Caso 2: Reporte técnico completo
```
Usuario: "Genera reporte técnico completo con todas las verificaciones NCh430"
Script:
  1. Toma S actual
  2. Genera HTML full (resumen + tablas + diagramas + checklist)
  3. Incluye anexos de normativas
  4. Exporta PDF (10-15 páginas)
```

### Caso 3: Especificación de obra
```
Usuario: "Genera especificación técnica para contratista"
Script:
  1. Toma S actual
  2. Genera documento SOLO con:
     - Materiales (f'c, fy, recubrimiento)
     - Armadura (barras, espaciamiento por elemento)
     - Tolerancias (NCh2369)
  3. Formato HTML/PDF listo para imprimir en obra
```

## Notas Importantes

1. **Datos de entrada:** SIEMPRE validar que `S.results` esté actualizado (Solver.run() debe haberse ejecutado)
2. **Archivos de apoyo:** Ver `files/nch-compliance-checklist.md` para lista completa de verificaciones
3. **Template:** `files/template-report.html` es base; personalizar según proyecto
4. **Gráficas:** Extraer SVGs desde `renderer.js` (ya existen métodos getSVGForDiagram)
5. **Normativa:** Todas las verificaciones deben referenciarse a NCh430 Of.2008 (artículo, ecuación)

## Archivos Relacionados

- `files/template-report.html` — Plantilla HTML base
- `files/nch-compliance-checklist.md` — Lista de verificaciones NCh430
- `PROJECT.md` (en raíz) — Referencia de solver.js, S.results schema
- `INFORME_FINAL_ESTRUCTURA.md` (en raíz) — Ejemplos de reportes actuales

---

**Versión:** 1.0  
**Último update:** 2026-05-21  
**Complejidad:** Media (requiere entender schema S y normativa)
