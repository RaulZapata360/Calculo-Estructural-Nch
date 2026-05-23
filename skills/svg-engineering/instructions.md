# SVG Engineering — Guía de Buenas Prácticas

Extraído de las skills de diseño SVG del proyecto.
Aplicable a todos los renderizadores del proyecto (memoryReport.js, muro-contencion.html).

---

## 1. Tipografía PDF-safe

Siempre usar un stack de fuentes con fallbacks para que el PDF no pierda el texto:

```javascript
// En _t / _tv (memoryReport.js) y tx (muro-contencion.html):
'font-family': 'Inter,Arial,Helvetica,sans-serif'
//              ^screen  ^PDF fallback1  ^PDF fallback2
```

**Por qué:** Los renderizadores PDF (puppeteer, wkhtmltopdf, prince) no siempre tienen `Inter`
instalado. `Arial` o `Helvetica` aseguran legibilidad siempre.

---

## 2. Patrones de Material (convención ingenieril)

### Hormigón armado
```javascript
const defs   = el('defs', {});
const pConc  = el('pattern', {
  id: 'p-conc',
  x:0, y:0, width:8, height:8,
  patternUnits: 'userSpaceOnUse',
  patternTransform: 'rotate(45 0 0)'
}, defs);
el('line', { x1:0, y1:0, x2:0, y2:8,
  stroke:'#999', 'stroke-width':0.8, opacity:'0.25' }, pConc);
// Aplicar: fill:'url(#p-conc)'
```

- Líneas diagonales 45°, color neutro (#999)
- stroke-width ≤ 1px (evitar saturar la sección)
- opacity 0.20–0.30 (no tapar las barras)

### Suelo retenido (tierra)
```javascript
const pSoil = el('pattern', {
  id: 'p-soil',
  x:0, y:0, width:14, height:14,
  patternUnits: 'userSpaceOnUse'
}, defs);
// Dos diagonales cruzadas → crosshatch
el('line', { x1:0, y1:14, x2:14, y2:0,  stroke:'#8B6914', 'stroke-width':0.85, opacity:0.6 }, pSoil);
el('line', { x1:0, y1:0,  x2:14, y2:14, stroke:'#8B6914', 'stroke-width':0.85, opacity:0.6 }, pSoil);
// Aplicar: fill:'url(#p-soil)'
```

- Crosshatch (dos sentidos) es la convención estándar para suelo en sección
- Color tierra: `#8B6914`
- tile 14×14px con `patternUnits:'userSpaceOnUse'` (escala absoluta, no relativa)

### Ladrillo / Mampostería
```javascript
// Horizontal lines — convención para albañilería
el('line', { x1:0, y1:hy, x2:x1+spPx, y2:hy,
  stroke:'rgba(210,160,80,0.10)', 'stroke-width':0.5 });
// (bucle cada 8px)
```

---

## 3. `patternUnits: 'userSpaceOnUse'`

**Siempre usar** `patternUnits:'userSpaceOnUse'`, no `'objectBoundingBox'`.

- `objectBoundingBox`: el patrón se escala con el elemento → el tile se distorsiona si el rect es muy ancho o alto
- `userSpaceOnUse`: el tile mantiene dimensiones absolutas → aspecto fijo independiente del rect

---

## 4. Stroke-width mínimo

Todo `stroke` visible en PDF debe ser **≥ 0.5px**. Por debajo se pierde en impresión o en PDF de baja resolución.

| Uso             | stroke-width recomendado |
|-----------------|--------------------------|
| Contorno sección | 1.5                     |
| Estribo          | 2.5                     |
| Dimensiones      | 0.8                     |
| Tramado hormigón | 0.7–0.8                  |
| Tramado suelo    | 0.8–1.0                  |
| Líneas de suelo  | 0.5 (mínimo absoluto)    |

---

## 5. IDs únicos por SVG

Cuando múltiples SVGs se renderizan en la misma página PDF (ej. varias secciones transversales),
los IDs de patterns deben ser únicos para evitar que un SVG robe el patrón de otro:

```javascript
// Mal: id:'p-conc'  → colisión si hay 3 secciones en la misma página
// Bien: id con dimensión como discriminador
const pConc = el('pattern', { id:`pxs-conc-${W}`, ... });
// O con un índice incremental:
const uid = Date.now();
const pConc = el('pattern', { id:`p-conc-${uid}`, ... });
```

---

## 6. Fondo explícito para PDF

Agregar un `<rect>` de fondo como **primer elemento** del SVG cuando se use en PDF:

```javascript
// Para fondo blanco (PDF impreso):
el('rect', { x:0, y:0, width:W, height:H, fill:'#ffffff' });

// Para fondo oscuro (modo dark en UI):
el('rect', { x:0, y:0, width:W, height:H, fill:'#0d1117' });
```

Si el SVG se embebe en HTML con fondo blanco, el fondo transparente es aceptable.
Si se embebe directamente en PDF (no en HTML), el fondo explícito evita artefactos.

---

## 7. Sin coordenadas negativas

Los renderizadores PDF clampean el SVG al `viewBox`. Si un elemento tiene `x < 0`, queda cortado.

```javascript
// Mal: línea que sale del viewBox
el('line', { x1:-10, y1:20, x2:0, y2:20 });

// Bien: calcular márgenes suficientes antes de dibujar
const PAD_L = 48;  // margen izquierdo ≥ espacio de cotas
const x0 = PAD_L;
// ... todos los elementos: x = x0 + offset (siempre ≥ 0)
```

---

## 8. Grupos `<g transform="translate(x,y)">` para zonas

Agrupa elementos de una misma zona con un `<g transform>` en vez de calcular coordenadas
absolutas para cada elemento. Más limpio y fácil de mover:

```javascript
const gStem = el('g', { transform:`translate(${x_sl},${y_surf})` });
// Dentro del grupo: coordenadas relativas al grupo
el('rect', { x:0, y:0, width:stemW, height:stemH, ... }, gStem);
el('text', { x:stemW/2, y:stemH/2, ... }, gStem);
```

---

## Archivos que aplican estas prácticas

| Archivo | Patrón hormigón | Patrón suelo | Font PDF-safe |
|---------|----------------|--------------|--------------|
| `modules/renderer/memoryReport.js` → `_drawXS` | ✅ `pxs-conc-${W}` | — | ✅ `_t/_tv` |
| `muro-contencion.html` → `drawWallSVG` | ✅ `p-conc` | ✅ `p-soil` crosshatch | ✅ `tx` |

---

*Actualizado: 2026-05-22 — basado en skills canvas-design, algorithmic-art, svg-to-pdf del repo RaulZapata360/Cumpleaños*
