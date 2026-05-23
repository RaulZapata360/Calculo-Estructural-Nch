# EstructuraCalc — Contexto para Claude Code

## ¿Qué es EstructuraCalc?

**EstructuraCalc** es una herramienta de **cálculo estructural iterativo** para diseño de muros, fundaciones y estructuras de hormigón armado bajo normativa chilena (NCh430).

- **Frontend**: Vanilla JavaScript + SVG puro (cero librerías)
- **Backend**: Python (server estático)
- **Modelo**: Estado global `S` (única fuente de verdad)
- **Motor**: LRFD + NCh430 (ACI 318-19 adaptado a Chile)

---

## 🔒 Lo que NO debes tocar (CRÍTICO)

### 1. Solver.run() — Motor LRFD + Diseño NCh430
**Ubicación:** `modules/solver.js`

Este es el corazón del cálculo. Implementa:
- Cálculo combinaciones LRFD: qu = fd·qD + fl·qL
- Diseño por flexión: As_req, As_min, As_max (NCh430)
- Diseño por corte: Vc, Vs, estribos, s_max (NCh430)
- Bajada de cargas multi-vano

**Cambios aquí requieren:**
1. Auditoría contra NCh430 (¡obligatorio!)
2. Actualizar `INFORME_FINAL_ESTRUCTURA.md` con nuevos resultados
3. Agregar test case en `PROJECT.md §Testing Mental`

---

### 2. Estructura de Estado S
**Ubicación:** `modules/state.js`

```javascript
S = {
  story: { H, loads: {...}, materials: {...}, lateral: {...}, foundation },
  nodes: [{id, x}, ...],
  spans: [{id, fromNode, toNode, type, tw, beamTop, beamBot}, ...],
  columns: {'n0': {section, rebar}, ...},
  results: { qu, spans: {...}, columns: {...} },
  ui: { ... }
}
```

**NO cambiar:**
- Schema de `nodes`, `spans`, `columns`
- Claves de localStorage: `ec_rebar_${type}_${spanId}`
- Tipos de `type: 'muro' | 'portico'`

**SÍ es seguro cambiar:**
- `story.loads` (agregar nuevas cargas siempre que sean vectores)
- `results` (agregar nuevos outputs de cálculo)
- `ui` (interfaz)

---

### 3. Parámetros Normativos (NO son "constantes", son decisiones)
**Ubicación:** `modules/state.js` (inicialización) + `Nch/*.md` (justificación)

Estos valores vienen de normas:
- `fc = 25 MPa` — Hormigón NCh2369
- `fy = 420 MPa` — Acero A630-270H NCh430
- `rec = 0.03 m` — Recubrimiento mínimo NCh430
- `β₁ = 0.85` — Factor para f'c ≤ 28 MPa
- `φ_flex = 0.90`, `φ_shear = 0.75` — Factores LRFD

**Cambiar sin justificación normativa = falla de seguridad**

Si necesitas cambiar: crea un issue documentando la norma nueva.

---

## ✅ Lo que SÍ puedes hacer (y debes)

### 1. Agregar nuevas cargas
En `story.loads`:
```javascript
story.loads = {
  qD: 1.18,           // ← existente
  qL: 1.18,           // ← existente
  custom_new: 0.50    // ← TÚ agregaste (documenta en INFORME_FINAL_ESTRUCTURA.md)
}
```

**Luego:** Actualizar `Solver.run()` para usarla en LRFD (si corresponde).

---

### 2. Extender UI (panels.js, validators.js)
- Agregar campos en panel derecho
- Validadores adicionales (As min/max, s_max)
- Nuevas vistas (3D mejorado, planos PDF)

**No afecta cálculo, seguro modificar.**

---

### 3. Mejorar persistencia y exportación
- Nuevo formato de reporte (PDF, JSON, XML)
- Sincronización en nube
- Versionado de proyectos

**No afecta core, seguro modificar.**

---

## 📋 Archivos Clave (por rol)

### Para entender el flujo
| Archivo | Qué es | Léeme para |
|---------|--------|-----------|
| `PROJECT.md` | Arquitectura técnica completa (333 líneas) | Entender TODO |
| `INFORME_FINAL_ESTRUCTURA.md` | Estado v2.1: resultados, cargas, materiales | Validar outputs |
| `SKILL_LOAD_COMBINATION_DESIGN.md` | Procedimiento iterativo (plantilla para skills) | Crear nuevos flujos |

### Para normas
| Archivo | Tema | Consulta para |
|---------|------|--------------|
| `Nch/normas_cargas_combinaciones.md` | LRFD basics | Cambiar factores fd, fl |
| `Nch/normas_diseno_sismico.md` | NCh433 | Agregar cargas sísmicas |
| `Nch/normas_diseno_hormigon.md` | NCh430 | Modificar Solver.run() |
| `Notas/diseno_armadura_NCh430.md` | Procedimiento As min/max | Validar armadura |
| `Notas/procedimiento_diseno_fundaciones.md` | Fundaciones (zapata, volcamiento) | Nuevo skill: cimentación |

### Código
| Archivo | Rol | Tocar para |
|---------|-----|-----------|
| `modules/solver.js` | Motor LRFD + NCh430 | ⚠️ SOLO con auditoría normativa |
| `modules/state.js` | Modelo S + inicialización | ✅ Agregar cargas, resultados |
| `app.js` | Controlador principal | ✅ Cambiar flujo UI |
| `modules/ui/panels.js` | Panel propiedades derecho | ✅ Agregar campos |
| `modules/renderer/renderer.js` | SVG renderizado | ✅ Nuevas capas/vistas |

---

## 🏗️ Stack y Restricciones

### Frontend
- **Lenguaje:** Vanilla JavaScript (NO React, Vue, etc.)
- **Renderizado:** SVG puro
- **HTTP:** Fetch API (NO axios, jQuery)
- **Persistencia:** localStorage + JSON

**Por qué:** Velocidad, control total, sin dependencias.

### Backend
- **Lenguaje:** Python 3.9+
- **Servidor:** `server.py` (SimpleHTTPServer + CORS)
- **Puerto:** 3001

**Por qué:** Ligero, matemáticas vectoriales (numpy).

### Normativa
- **Diseño:** NCh430 Of.2008 (ACI 318-19 adoptado)
- **Sísmico:** NCh433-2009
- **Albañilería:** NCh2123-2003
- **Fundaciones:** NCh3171-2010/2017

**NO negociable:** Todos los cálculos deben ser auditables contra normas.

---

## 🎯 Cómo escribir Skills para EstructuraCalc

### Patrón 1: Validador Normativo
```
Entrada: Estructura (S), tipo de análisis
Proceso: Revisar contra normas (NCh430, NCh433, etc.)
Salida: Checklist de cumplimiento, alertas
Ejemplo: "Validar As_min, s_max estribos, recubrimiento"
```

### Patrón 2: Flujo Iterativo de Diseño
```
Entrada: Cargas, geometry, restricciones
Proceso: 
  1. Asumir armadura inicial
  2. Calcular M, V, N (Solver.run())
  3. Diseñar As_req, estribos
  4. Validar As_min, As_max
  5. Si falla → iterar, si ok → exportar
Salida: Plano con armadura final, especificaciones
Ejemplo: "Diseño iterativo por combinaciones de cargas críticas"
```

### Patrón 3: Generador de Reportes
```
Entrada: Resultados de cálculo (S.results)
Proceso: Formato → PDF/HTML/Markdown (tablas, gráficas)
Salida: Documento listo para entregar
Ejemplo: "Reporte ejecutivo: cargas, fuerzas, armadura, verificaciones"
```

### Patrón 4: Visualización / Dashboard
```
Entrada: S.results (qu, momentos, cortantes, fuerzas axiales)
Proceso: Transformar → KPIs, gráficas, comparativas
Salida: Dashboard interactivo
Ejemplo: "Dashboard: cargas vs capacidad, armadura, criticidades"
```

---

## 📁 Estructura de Carpetas

```
Estructuras/
├── CLAUDE.md                    ← Este archivo (contexto para IA)
├── PROJECT.md                   ← Biblia técnica
├── INFORME_FINAL_ESTRUCTURA.md  ← Estado actual + resultados
├── SKILL_LOAD_COMBINATION_DESIGN.md
├── skills/                      ← NUEVA: Librería de skills
│   ├── index.yaml              ← Catálogo (Progressive Disclosure)
│   ├── structural-report-generator/
│   │   ├── instructions.md     ← Flujo de generación PDF
│   │   └── files/
│   │       ├── template-report.html
│   │       └── nch-compliance-checklist.md
│   ├── iterative-design-workflow/
│   │   ├── instructions.md     ← Procedimiento iterativo
│   │   └── files/
│   │       ├── test-cases.md   ← Casos de prueba NCh430
│   │       └── solver-pseudocode.md
│   ├── structural-dashboard/
│   │   ├── instructions.md     ← Guía de visualización
│   │   └── files/
│   │       └── kpi-definitions.md
│   └── README.md               ← Índice de skills
├── modules/
├── Nch/
├── Notas/
├── ...
```

---

## 🚀 Directrices Operacionales

1. **Cambios a Solver.run()** → SIEMPRE auditar contra NCh430 + actualizar documentación
2. **Nuevas cargas** → Agregar en INFORME_FINAL_ESTRUCTURA.md con justificación
3. **Persistencia** → Probar con localStorage antes de cambiar schema
4. **Tests** → Usar "testing mental" en PROJECT.md (ver §Testing Mental)
5. **Skills** → Documentar entrada/proceso/salida en `instructions.md`
6. **Vanilla JS** → NO traer librerías externas (jQuery, lodash, etc.)

---

## 📞 Contacto y Preguntas

Si necesitas:
- **Entender una ecuación:** Ver `PROJECT.md` + `Notas/`
- **Cambiar normativa:** Consultar `Nch/*.md` + normas PDF
- **Agregar skill nuevo:** Copiar estructura en `skills/` + template en `SKILL_LOAD_COMBINATION_DESIGN.md`
- **Debuggear Solver:** Ver `PROJECT.md §Testing Mental`

---

**Última actualización:** 2026-05-21  
**Versión del proyecto:** v2.1  
**Normativa:** NCh430 Of.2008, NCh433-2009, NCh2123-2003, NCh3171-2017
