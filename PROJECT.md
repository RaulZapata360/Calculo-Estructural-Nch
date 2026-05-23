# EstructuraCalc — Corazón del Proyecto

**Propósito Esencial**: Herramienta interactiva de análisis estructural 2D para **albañilería confinada** (muros + pilares + vigas), con diseño de armadura según **NCh430** (norma chilena de hormigón armado).

## Visión Neuronal

EstructuraCalc es un **simulador de ingeniería en tiempo real**. Mientras el usuario ajusta dimensiones, cargas y materiales en el sidebar, el sistema:
1. **Calcula** fuerzas internas (M, V, N) por bajada de cargas
2. **Diseña** armadura (As, estribos) según norma
3. **Renderiza** diagramas y secciones en el canvas SVG
4. **Acumula** cargas en columnas compartidas de vanos múltiples

El usuario "siente" la estructura mientras la diseña — cada cambio refleja instantáneamente en diagramas y recomendaciones.

---

## Arquitectura Técnica

### Stack
- **Frontend**: HTML5 + CSS3 (glassmorphism dark theme) + Vanilla JavaScript
- **Storage**: localStorage (rebar data), file download (JSON projects)
- **No dependencies** — cero librerías externas. SVG puro para gráficos.
- **Design codes**: NCh430 (Chile) / ACI 318-19 (USA)

### Matriz de Archivos

| Archivo | Rol | Lógica |
|---|---|---|
| `index.html` | DOM + layout | 10 capas SVG (supports/walls/beams/columns/loads/diagrams/labels) + modals + sidebar |
| `style.css` | Tema + estilos | Glassmorphism, CSS variables, responsive grid |
| `app.js` | Controlador | Binding de inputs, eventos canvas, gestión de vanos, pan/zoom |
| `modules/state.js` | Modelo global | Schema v2: nodes[], spans[], columns{}, story{H,loads,materials} |
| `modules/geometry.js` | Coordinatas | Conversión mundo (m) ↔ SVG (px), márgenes dinámicos |
| `modules/solver.js` | Motor de cálculo | LRFD, bajada de cargas, diseño de As, estribos NCh430 |
| `modules/renderer/renderer.js` | Renderizado multi-vano | Dibuja spans + nodos + diagramas M/V/N normalizados |
| `modules/renderer/elementDetail.js` | Vista longitudinal | Overlay pantalla completa: elevación + armadura esquemática + M/V |
| `modules/renderer/crossSection.js` | Sección transversal | Círculos de barras, validación de As, estado visual |
| `modules/ui/panels.js` | Panel derecho | Propiedades geométricas, fuerzas, armadura, botones |
| `modules/ui/rebarEditor.js` | Editor modal | Agregar/editar barras por cara (superior/inferior), estribos |
| `modules/ui/validators.js` | Validación | Chequear As min/max, ρ de ductilidad |
| `modules/storage/rebarStorage.js` | Persistencia | Load/save rebar en localStorage y S.spans/S.columns |

---

## Estado Global (S) — La Médula

```javascript
S = {
  // Nivel único (compartido por todos los vanos)
  story: {
    H: 2.5,                    // altura nivel (m)
    loads: {qD, qL, fd, fl},   // cargas y factores LRFD
    materials: {fc, fy, gc, gm, rec}  // hormigón, acero, pesos, recubrimiento
  },

  // Geometría de vanos (v2 multi-elemento)
  nodes: [                      // posiciones X absolutas
    {id: 'n0', x: 0.0},
    {id: 'n1', x: 4.0},
    {id: 'n2', x: 7.0}  // si hay 2+ vanos
  ],
  
  spans: [                      // tramos entre nodos
    {
      id: 'sp0', fromNode: 'n0', toNode: 'n1',
      type: 'muro',            // 'muro' | 'portico'
      tw: 0.14,                // espesor muro (m)
      beamTop: { section: {b, h}, rebar: {...} },
      beamBot: { section: {b, h}, rebar: {...} }
    },
    {...}  // span 2, etc
  ],

  columns: {                    // pilar en cada nodo
    'n0': { section: {b, h}, rebar: {...} },
    'n1': { section: {b, h}, rebar: {...} },  // acumula cargas de sp0 + sp1
    ...
  },

  // Resultados calculados
  results: {
    qu: '16.00',
    spans: {
      'sp0': { beamTop: {Mu, Vu, Nu, rebar}, beamBot: {...}, wall: {P} },
      'sp1': {...}
    },
    columns: {
      'n0': { Mu, Vu, Nu, rebar },
      'n1': { Mu, Vu, Nu, rebar },  // Nu = Σ de cargas axiales adyacentes + auto-peso
      ...
    }
  },

  // Estado UI
  ui: {
    selectedEl: 'beam_top',     // qué está seleccionado
    selectedSpan: 'sp0',        // en qué vano
    selectedNode: 'n0',         // en qué nodo (para columna)
    view: { x, y, zoom },       // pan/zoom del canvas
    projectDirty: false
  },

  diagrams: { moment, shear, axial, normalize }  // visualización
};
```

**Helpers clave** en `state.js`:
```javascript
getSpanL(span)           // longitud del vano
getSpanFromX(span)       // X inicial del vano
getTotalL()              // suma de todos los vanos
getActiveElement(type)   // busca el elemento en el vano/nodo seleccionado
getActiveResults(type)   // busca los resultados
```

---

## Flujo de Cálculo (El Pulso)

### 1. **Entrada**: Usuario ajusta inputs en sidebar
```javascript
// Ejemplo: cambia g-L (largo del primer vano)
S.nodes[1].x = valor;  // mueve segundo nodo
Solver.run();
Renderer.draw();
```

### 2. **Solver.run()** — Motor de cálculo
```javascript
qu = fd·qD + fl·qL  // carga factorizada

// Por cada vano:
//   - Calcula peso propio de vigas
//   - q total = qu + peso propio
//   - Vu = q·L/2 (isostático)
//   - Mu = max(q·L²/12, q·L²/24)
//   - Guarda en S.results.spans[spanId]
//   - Acumula reacción en nodos adyacentes

// Por cada nodo (pilar):
//   - P_axial = reacción_izq + reacción_der + peso_columna
//   - M = max(momento_extremo_vano_izq, momento_extremo_vano_der)
//   - V = M / H
//   - Guarda en S.results.columns[nodeId]

// Diseño de armadura (por elemento):
//   - As_min = ρ_min · b · d
//   - As_max = 0.75 · ρ_b · b · d
//   - As_req = solución cuadrática: φ·fy²/(1.7·fc·b)·As² - φ·fy·d·As + Mu = 0
//   - Vc = 0.17·√fc·b·d (cortante hormigón)
//   - Vs = Vu/φ_v - Vc (cortante acero)
//   - Estribos: s = Av·fy·d / Vs, con s_max = min(d/2, 600mm)
```

**Resultado**: `S.results` lleno, listo para UI.

### 3. **Renderer.draw()** — Dibuja todo
```javascript
recalcLayout()           // recalcula escala según getTotalL()

// Dibuja en orden:
drawSupports()           // triángulos en cada nodo
S.spans.forEach(span => {
  drawWall(span, fromX, L, H)      // rectángulo gris, si type='muro'
  drawBeams(span, fromX, L, H)     // vigas sup e inf en gris
  drawLoads(span, fromX, L, H)     // flechas de carga
})
S.nodes.forEach(node => {
  drawColumn(node, H)              // columna en cada nodo
})
drawDims()               // cotas L y H
drawMomentDiagrams()     // por cada vano y columna
drawShearDiagrams()
drawAxialDiagrams()
```

**Canvas result**: Estructura + diagramas en tiempo real, responsive a zoom/pan.

### 4. **UI.selectElement(type, spanId, nodeId)** — Selecciona + panel
```javascript
// Actualiza highlight en SVG
// Abre panel derecho con:
// - Propiedades geométricas (L, H, sección)
// - Fuerzas internas (Mu, Vu, Nu)
// - Armadura requerida (As, estribos)
// - Sección transversal (barras en círculos)
// - Botón "VISUALIZAR ELEMENTO" → ElementDetail.open()
```

---

## Características Clave (Las Neuronas)

### 1. **Multi-Vano**
- Botón "+" en toolbar → SpanManager.addSpan(L, type)
- Crea nuevo nodo, nuevo vano, nuevo pilar compartido
- Solver automáticamente acumula cargas en columnascompartidas
- Cada vano puede ser muro, pórtico, o vacío

### 2. **Pan / Zoom**
- `wheel` → zoom centrado en cursor (factor 1.12x)
- `alt+drag` → desplazar canvas
- Doble-click / reset button → volver a vista original
- Todas las transformaciones en `<g id="transform-layer">`

### 3. **Visualización de Detalle**
- ElementDetail.open(type) → overlay pantalla completa
- Elevación del elemento con barras longitudinales (círculos)
- Estribos verticales (más densos en zona crítica d)
- Diagrama M y V debajo con escala normalizada
- Cierra con Esc

### 4. **Persistencia**
- ProjectSaver.save() → JSON v2.0 (nodes, spans, columns, story)
- ProjectLoader.restore(data) → detecta v1 (legacy) vs v2, migra automáticamente
- RebarStorage: localStorage con clave `ec_rebar_${type}_${spanId}`

### 5. **Validación Armadura**
- RebarValidator.check() → verifica As_min ≤ As_colocado ≤ As_max
- Color-coded: ✓ verde (cumple), ✗ rojo (insuficiente)
- Modal de confirmación si As < As_req pero dentro de rango aceptable

---

## Decisiones Arquitectónicas

### ¿Por qué Vanilla JS (cero librerías)?
- **Responsabilidad clara**: No hay magia de framework
- **Renderizado SVG directo**: Control preciso de cada elemento gráfico
- **Estado predecible**: S es la única fuente de verdad
- **Extensible**: Cualquier IA/humano puede leerlo y extender

### ¿Por qué v2 schema (nodes/spans)?
- **Escalable**: Soporta N vanos, no solo 1 muro
- **Físicamente preciso**: Nodos en posiciones reales (X), no indices
- **Acumulación correcta**: Pilares compartidos heredan de múltiples fuentes
- **Backward-compatible**: load() migra v1 → v2 automáticamente

### ¿Por qué normalizar diagramas?
- **Comparabilidad**: Mu=22.67 vs Mu=15.3 se ven en la misma escala
- **Readabilidad**: Diagrama no ocupa todo el canvas con un extremo grande

### ¿Por qué NCh430 específicamente?
- **Contexto chileno**: Usuario es ingeniero estructural en Chile
- **Norma actualizada**: NCh430 adopta filosofía ACI 318-19 (LRFD, φ factors)
- **Parámetros clave**: β₁, ρ_min, ρ_max, Vc, estribos — todos implementados

---

## Extensiones Naturales

### Próximos Pasos (Roadmap Mental)
1. **Cargas distribuidas personalizadas** — ahora es uniforme qu
2. **Apoyos elásticos** — no solo empotramientos
3. **Análisis modal** — frecuencias propias (sísmico)
4. **Exportar a DWG** — integración CAD
5. **Múltiples pisos** — estructura tridimensional simplificada
6. **Detector de conflictos** — As vs. espaciamiento físico de barras

### Cómo Extender
1. **Nuevo elemento**: Agregar a `S.spans[].tipoX`, `S.columns[]`, `S.results.spans[].tipoX`
2. **Nueva fuerza**: Calcular en Solver.run(), dibujar en Renderer._drawXDiagram()
3. **Nuevo validador**: Crear RebarValidator.checkX(), llamar en rebarEditor.save()
4. **Nueva UI**: Botón en toolbar → SpanManager.action(), panel en sidebar

---

## Filosofía de Diseño

### Principios Neurales
1. **Claridad sobre Cleverness** — el código debe ser legible, no minimal
2. **Una sola fuente de verdad** — S.* es el modelo, todo lo demás es derivado
3. **Reactividad en tiempo real** — cambio en input → Solver.run() + Renderer.draw()
4. **Norma es lo primero** — NCh430 governa toda lógica de diseño
5. **Tolerancia a error de usuario** — validar, sugerir, no bloquear

### Patrones Recurrentes
```javascript
// Pattern 1: Cambio de input
document.getElementById('input-id').addEventListener('input', () => {
  S.story.property = value;
  Solver.run();
  Renderer.draw();
  UI.selectElement(...);  // refresh panel
});

// Pattern 2: Selección de elemento
UI.selectElement(type, spanId, nodeId);
// → Solver._syncLegacyElements()
// → renderProperties(), renderForces(), renderRebar()

// Pattern 3: Diseño por elemento
const design = Solver._designRebar(Mu, Vu, b, h, materials);
// → returns {AsReq, AsMinCm2, AsMaxCm2, Vc, Vs, d_eff_cm, s_max_cm, stirrups}
```

---

## Testing Mental (¿Cómo Verifica una IA que Esto Funciona?)

### Golden Path
1. **Carga inicial**: S populado, solver corre, canvas renderiza muro+pilar+diagrama ✓
2. **Cambiar L**: nodo se mueve, Mu/Vu actualizan, canvas redibuja ✓
3. **Agregar vano**: +1 span, +1 nodo, pilar compartido acumula ✓
4. **Seleccionar elemento**: panel muestra datos correctos ✓
5. **Abrir detail**: elevación+M/V rendering ✓
6. **Zoom/pan**: transform-layer actualiza, clicks siguen funcionando ✓
7. **Guardar/cargar**: JSON guardado, recargado, mismos resultados ✓

### Puntos de Falla Posibles
- **Acumulación en pilares**: ¿suma correctamente Vu de ambos vanos?
- **Normalización diagrama**: ¿escala correcta con zoom?
- **Rebar persistencia**: ¿guarda/carga en localStorage?
- **Multi-vano rendering**: ¿cada span dibuja en su X correcto?

---

## Conclusión: La Esencia

EstructuraCalc es un **puente entre intuición estructural e implementación matemática**. 

El usuario dice "quiero un muro de 4 metros con 2 pilares de 20×20 cm", y el sistema:
- ✓ Calcula LRFD (carga factorizada)
- ✓ Diseña As (barras longitudinales + estribos)
- ✓ Visualiza M/V/N (entiende fuerzas)
- ✓ Valida NCh430 (cumple norma)
- ✓ Persiste (guarda/carga proyecto)
- ✓ Evoluciona (agrega vanos, multi-elemento)

**Todo sin librerías, todo con SVG puro, todo en tiempo real.**

Para el próximo asistente IA: este archivo ES el código. Léelo antes de tocar S.* o Solver.run().
