# Skills de EstructuraCalc

Librería modular de **procedimientos reutilizables** para mejorar el flujo de trabajo en cálculo estructural bajo normativa chilena (NCh430, NCh433, NCh2123, NCh3171).

## 📋 Índice de Skills

Hay **3 skills principales** organizados por patrón y categoría:

### 1. 📄 [structural-report-generator](structural-report-generator/instructions.md)
**Generador de Reportes Estructurales**

- **Patrón:** Sequential Workflow
- **Categoría:** Document Creation
- **Complejidad:** Media
- **Tiempo:** 15-30 min

**Qué hace:**
- Genera PDF profesionales con resultados de cálculo
- Incluye: resumen, tablas, diagramas M/V/N, especificación de armadura, verificaciones NCh430
- Extrae gráficas SVG desde renderer.js
- Genera tablas de especificación técnica

**Cuándo usarlo:**
```
✓ Necesitas documentar los resultados de diseño
✓ Quieres entregar un reporte ejecutivo al cliente
✓ Precisas especificación técnica para el contratista
✓ Requieres auditoría de cumplimiento normativo
```

**Entrada:** Estado global S (story, spans, columns, results)  
**Salida:** PDF con portada, resumen, tablas, diagramas, checklist

---

### 2. 🔄 [iterative-design-workflow](iterative-design-workflow/instructions.md)
**Flujo de Diseño Iterativo**

- **Patrón:** Iterative Refinement
- **Categoría:** Workflow Automation
- **Complejidad:** Alta
- **Tiempo:** 30-60 min

**Qué hace:**
- Procedimiento paso a paso: asumir → calcular → validar → refinar
- Itera sobre combinaciones de cargas críticas (LRFD)
- Diseña armadura (As vertical, horizontal, estribos)
- Valida contra límites NCh430 (As_min, As_max, s_max)
- Reporta convergencia y especificación final

**Cuándo usarlo:**
```
✓ Estás diseñando un nuevo elemento (muro, losa, viga)
✓ Necesitas explorar múltiples combinaciones de carga
✓ Quieres optimizar armadura respetando normas
✓ Precisas documentar el procedimiento de diseño
```

**Entrada:** Geometría, cargas, materiales, criterios de convergencia  
**Salida:** Armadura final convergida, especificación técnica, tabla de iteraciones

---

### 3. 📊 [structural-dashboard](structural-dashboard/instructions.md)
**Dashboard Estructural**

- **Patrón:** Context-Aware Branching
- **Categoría:** Workflow Automation
- **Complejidad:** Media
- **Tiempo:** 20-40 min

**Qué hace:**
- Calcula KPIs en tiempo real: cargas, momento, cortante, armadura
- Visualiza utilización (%) por métrica
- Genera alertas automáticas (incumplimientos, criticidades)
- Produce gráficas interactivas de utilización
- Exportable a PDF

**Cuándo usarlo:**
```
✓ Monitoreas el estado del diseño mientras iteras
✓ Necesitas feedback visual rápido (rojo/amarillo/verde)
✓ Quieres ver qué elemento es crítico
✓ Requieres alertas de incumplimientos normativos
✓ Exportas reportes visuales para clientes
```

**Entrada:** Resultados de cálculo (S.results)  
**Salida:** Dashboard HTML interactivo + alertas

---

## 🏗️ Estructura de Carpetas

```
skills/
├── README.md                          ← Este archivo
├── index.yaml                         ← Catálogo (Progressive Disclosure)
│
├── structural-report-generator/
│   ├── instructions.md                ← Guía paso a paso
│   └── files/
│       ├── template-report.html       ← Plantilla HTML base
│       └── nch-compliance-checklist.md ← Lista de verificaciones
│
├── iterative-design-workflow/
│   ├── instructions.md                ← Guía paso a paso
│   └── files/
│       ├── test-cases.md             ← Casos de prueba validados
│       └── solver-pseudocode.md      ← Pseudocódigo del solucionador
│
└── structural-dashboard/
    ├── instructions.md                ← Guía paso a paso
    └── files/
        └── kpi-definitions.md         ← Definiciones matemáticas de KPIs
```

---

## 📖 Cómo Leer un Skill

Cada skill tiene esta estructura:

```markdown
# Skill: [Nombre]

## Descripción
Qué es, qué hace, para qué sirve

## Entrada
Datos esperados (esquema)

## Proceso
Paso a paso detallado (pseudocódigo, con ejemplos)

## Salida
Qué produce, formato

## Ejemplos de Uso
Casos prácticos

## Notas Importantes
Advertencias, restricciones, dependencias

## Archivos Relacionados
Dónde encontrar más información
```

---

## 🚀 Flujo de Trabajo Recomendado

### Escenario 1: Diseño de nuevo elemento

```
1. Abro EstructuraCalc
2. Defino cargas, geometría, materiales
3. Uso iterative-design-workflow
   → Itera hasta convergencia
   → Obtiene armadura final
4. Uso structural-dashboard
   → Valida KPIs y alertas
5. Uso structural-report-generator
   → Exporta PDF con especificación
```

### Escenario 2: Iteración de diseño (cliente pide cambios)

```
1. Modifica cargas/geometría en la UI
2. structural-dashboard se actualiza automáticamente
   → Muestra nuevo estado (rojo/amarillo/verde)
3. Si hay alertas → usa iterative-design-workflow de nuevo
4. Valida con dashboard
5. Exporta nuevo reporte
```

### Escenario 3: Auditoría de diseño existente

```
1. Carga proyecto existente
2. Usa structural-dashboard para ver estado actual
3. Si hay incumplimientos → revisa alertas
4. Usa structural-report-generator para generar PDF de auditoría
```

---

## 🔒 Restricciones y Límites

### ⚠️ NO MODIFICAR (sin auditoría normativa)
- `modules/solver.js` — Motor LRFD + NCh430
- Parámetros normativos (fc, fy, rec, β₁, φ factors)
- Fórmulas de diseño por flexión, corte, adherencia

### ✅ SEGURO MODIFICAR
- UI (panels.js, styling)
- Exportación (formatos PDF, HTML, JSON)
- Nuevas cargas (agregar a S.story.loads)
- Nuevos outputs (agregar a S.results)

### 🎯 REQUISITOS PARA USAR SKILLS
1. **Solver.run() debe estar actualizado** → Consulta PROJECT.md antes de cambiar
2. **S.results debe estar poblado** → Ejecuta cálculo antes de usar skills
3. **Normativa vigente** → NCh430 Of.2008 (referencia en todos los skills)
4. **Validación manual** → Revisa resultados; la máquina ayuda pero no reemplaza juicio estructural

---

## 📚 Archivos Críticos (Lee primero)

| Archivo | Por qué |
|---------|---------|
| `../CLAUDE.md` | Contexto general del proyecto |
| `../PROJECT.md` | Arquitectura técnica, schema S, Testing Mental |
| `../INFORME_FINAL_ESTRUCTURA.md` | Estado actual, ejemplos de resultados |
| `../SKILL_LOAD_COMBINATION_DESIGN.md` | Documento original (plantilla para skills) |

---

## 🔗 Dependencias entre Skills

```
iterative-design-workflow
        ↓
(produce armadura final)
        ↓
structural-dashboard ←→ structural-report-generator
  (valida KPIs)    (genera especificación)
```

**Flujo típico:**
1. iterative-design-workflow itera y converge
2. structural-dashboard valida que todo está OK
3. structural-report-generator exporta documentación

---

## 📊 Parámetros Globales (de S)

Todos los skills usan estos datos:

```javascript
S = {
  story: {
    H: 1.0,                    // Altura (m)
    loads: { qD, qL, ... },    // Cargas (kN/m²)
    materials: {
      fc: 25,                  // f'c hormigón (MPa)
      fy: 420,                 // fy acero (MPa)
      rec: 0.03,               // Recubrimiento (m)
      beta1: 0.85              // Factor NCh430
    }
  },
  spans: [{ id, fromNode, toNode, type, tw, ... }],
  columns: [{ id, section, rebar, ... }],
  results: {
    qu: 3.304,                 // Carga combinada (kN/m²)
    spans: [{ id, M_max, V_max, N }],
    columns: [{ id, As_req, As_min, As_max, As_selected, ... }]
  }
}
```

---

## 🆘 Troubleshooting

### Problema: Skills no reconocen cambios en Solver.run()

**Causa:** Solver.run() fue modificado pero S.results no está actualizado  
**Solución:** 
1. Verifica que Solver.run() se ejecutó
2. Lee PROJECT.md §Testing Mental para validar salida
3. Verifica schema de S.results vs lo que espera el skill

### Problema: Dashboard muestra alertas falsas (rojas)

**Causa:** KPI de "utilización" está mal calibrado  
**Solución:**
1. Revisa capacidades (M_capacidad, V_capacidad) en skill
2. Compara contra diseño manual en PROJECT.md
3. Ajusta thresholds (85%, 100%) si criterio es diferente

### Problema: Reporte PDF no incluye gráficas

**Causa:** renderer.js no expone SVGs en format correcto  
**Solución:**
1. Verifica que renderer.js tiene método getSVGForDiagram()
2. Revisa que SVGs tienen xmlns y dimensiones
3. Exporta como HTML first, luego convierte a PDF

---

## 📞 Cómo Agregar Nuevos Skills

Si necesitas un skill nuevo:

1. **Copia estructura existente:**
   ```
   skills/
   ├── my-new-skill/
   │   ├── instructions.md    (usa template de skill existente)
   │   └── files/
   │       ├── file1.md
   │       └── file2.md
   ```

2. **Edita `index.yaml`** con metadatos del skill nuevo:
   ```yaml
   - id: my-new-skill
     name: "My New Skill"
     pattern: sequential-workflow | iterative-refinement | context-aware-branching
     category: document-creation | workflow-automation | mcp-enhancement
     tags: [tag1, tag2, ...]
     instructions: skills/my-new-skill/instructions.md
     files: skills/my-new-skill/files/
   ```

3. **Documenta en `instructions.md`:**
   - Qué es y para qué
   - Entrada (esquema exacto)
   - Proceso (paso a paso)
   - Salida (qué produce)
   - Ejemplos de uso
   - Archivos relacionados

4. **Valida contra normativa** (NCh430, etc.)

5. **Agrégalo a este README** en Índice de Skills

---

## 📈 Evolución de Skills

| Versión | Fecha | Cambios |
|---------|-------|---------|
| 1.0 | 2026-05-21 | Inicial: 3 skills (reportes, flujo iterativo, dashboard) |
| (TBD) | (TBD) | Futuros: Diseño de fundaciones, Análisis sísmico, ... |

---

## ✅ Checklist Antes de Usar un Skill

- [ ] He leído el `instructions.md` completo
- [ ] Tengo los datos de entrada (S está poblado)
- [ ] Solver.run() ejecutó sin errores
- [ ] He consultado normas relevantes (NCh430, etc.)
- [ ] Entiendo las restricciones (ver sección "Restricciones y Límites")
- [ ] Haré validación manual del resultado

---

## 📝 Licencia y Autoría

- **Autor:** EstructuraCalc v2.1 (Raúl Zapata)
- **Normativa:** NCh430 Of.2008, NCh433-2009, NCh2123-2003, NCh3171-2017
- **Stack:** Vanilla JS + Python + SVG

---

**Última actualización:** 2026-05-21  
**Versión:** 1.0  
**Estado:** ✅ Producción
