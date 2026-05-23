# EstructuraCalc — Plan de Mejora de Interfaz de Edición
**Versión 1.0 · Mayo 2026**

---

## 1. Diagnóstico de Problemas Actuales

### Limitaciones de UX
| Aspecto | Situación Actual | Impacto |
|---------|------------------|---------|
| **Edición de Elementos** | Solo parámetros globales | No se puede ajustar columnas/vigas por separado |
| **Panel Derecho** | Solo lectura | El usuario no puede refinar valores directamente |
| **Armadura Visual** | Solo cálculos numéricos | Falta contexto espacial de dónde va el fierro |
| **Diagramas M, V** | Gráficas desconectadas | No indican dónde se necesita acero |

---

## 2. Visión de la Solución

### Objetivo: **Editor de Armadura Integrado**

Transformar EstructuraCalc en una herramienta donde:

1. **Edición modular**: Cada elemento (viga, pilar) tiene propiedades editables
2. **Armadura visual**: Los diagramas M y V muestran directamente dónde va la armadura
3. **Interactividad**: El usuario puede agregar/modificar barras de forma gráfica
4. **Exportación**: Generar documentación de planos de armadura

---

## 3. Arquitectura Propuesta

### 3.1. Modelo de Datos Extendido

Agregar propiedades de **armadura** a cada elemento:

```javascript
const ElementArmature = {
  id: 'beam_top',
  
  // Propiedades geométricas existentes
  geometry: { b: 0.20, h: 0.20, L: 4.0 },
  
  // NUEVO: Propiedades de armadura
  armature: {
    longitudinal: [
      { position: 'top',    barCount: 2, diameter: 16, spacing: 'uniform', status: 'required' },
      { position: 'bottom', barCount: 3, diameter: 12, spacing: 'uniform', status: 'user-added' }
    ],
    stirrups: [
      { diameter: 8, spacing: 0.15, startZone: 0.0, endZone: 0.5, status: 'required' },
      { diameter: 8, spacing: 0.25, startZone: 0.5, endZone: 1.0, status: 'required' }
    ]
  },
  
  // Cálculos vinculados
  design: {
    momentRequired: { value: 45.2, diagram: 'M' },
    shearRequired:  { value: 22.1, diagram: 'V' },
    asRequired: 12.5,      // cm²
    asMinimum: 4.2         // cm²
  }
}
```

### 3.2. Módulo de Editor de Elementos

Crear archivo `element-editor.js` con responsabilidades:

#### **ElementEditor Module**
```javascript
const ElementEditor = {
  // Modal para editar elemento seleccionado
  openEditorPanel(elementType),
  
  // Agregar/remover barra de armadura
  addLongitudinalBar(elementId, position, diameter),
  removeLongitudinalBar(elementId, barId),
  
  // Cambiar espaciamiento de estribos
  setStirrupSpacing(elementId, zone, spacing),
  
  // Validar cumplimiento con diagrama M, V
  validateArmature(elementId),
  
  // Exportar especificaciones de armadura
  generateRebarSchedule()
}
```

### 3.3. Visualización de Armadura en Diagramas

#### **Mejoras al Renderer**

**Antes**: Solo dibuja líneas de M, V
```
  ╱╲ Momento
 ╱  ╲
```

**Después**: Gráficas con indicadores de armadura requerida

```
  ╱╲ Momento (azul)
 ╱  ╲
 ════════ Zonas donde se requiere acero (verde)
```

#### **Indicadores Visuales**:
- ✅ **Zona de armadura requerida**: Sombreado en verde detrás del diagrama
- ✅ **Barras dibujadas**: Círculos en sección transversal (de lado)
- ✅ **Estado de cumplimiento**: 
  - 🟢 Verde = Armadura suficiente
  - 🟡 Amarillo = Armadura insuficiente
  - 🔴 Rojo = Sin armadura en zona crítica

---

## 4. Mejoras a la Interfaz

### 4.1. Panel Derecho — ANTES (Actual)
```
┌─────────────────────────────┐
│ 🔹 Viga Superior    [x]     │
├─────────────────────────────┤
│ Propiedades Geométricas     │
│ [SOLO LECTURA]              │
│ Ancho b:   20 cm           │
│ Altura h:  20 cm           │
├─────────────────────────────┤
│ Armadura Requerida          │
│ As req: 12.5 cm²           │
│ [CHIPS DE COMBINACIONES]    │
└─────────────────────────────┘
```

### 4.2. Panel Derecho — DESPUÉS (Mejorado)
```
┌────────────────────────────────┐
│ 🔹 Viga Superior    [⚙️] [x]   │
├────────────────────────────────┤
│ DIMENSIONES (EDITABLES)        │
│ Ancho b:   [20] cm   🔄       │
│ Altura h:  [20] cm   🔄       │
│ Longitud:  [4.0] m   🔄       │
├────────────────────────────────┤
│ ARMADURA LONGITUDINAL          │
│ ┌──────────────────────────┐   │
│ │ Cara Superior:           │   │
│ │ [+] 2 φ16 @ 20cm       │   │
│ │ [+] 1 φ12 @ 15cm       │   │
│ │ ┌────────────────────┐  │   │
│ │ │ As: 5.5 cm² ✓      │  │   │
│ │ └────────────────────┘  │   │
│ │                          │   │
│ │ Cara Inferior:           │   │
│ │ [+] 3 φ12 @ 25cm       │   │
│ │ ┌────────────────────┐  │   │
│ │ │ As: 3.4 cm²        │  │   │
│ │ │ ⚠ Insuficiente     │  │   │
│ │ └────────────────────┘  │   │
│ └──────────────────────────┘   │
├────────────────────────────────┤
│ ESTRIBOS (CORTE)              │
│ Diámetro φ8                    │
│ Zona 1 (0–2m): s=15cm ✓      │
│ Zona 2 (2–4m): s=25cm ✓      │
│ [+ Agregar zona]              │
└────────────────────────────────┘
```

### 4.3. Canvas Central — Sección Transversal

**Modo nuevo: Vista de sección** (al hacer doble click en elemento)

```
    VISTA DE SECCIÓN (Viga Superior)

    ┌─────────────────────────┐
    │  rec = 3cm              │
    │  ┌───────────────────┐  │
    │  │ ○ ○     recub.   │  │  Cara superior
    │  │                   │  │  (2 φ16, As=4.02cm²) ✓
    │  │   [   ]           │  │  
    │  │   [ c ]  HORMIGÓN │  │  Centroide
    │  │   [   ]           │  │
    │  │                   │  │
    │  │ ○ ○ ○ ○           │  │  Cara inferior
    │  │ ○                 │  │  (3 φ12, As=3.39cm²) ⚠
    │  │                   │  │
    │  │ ┌───────────────┐ │  │
    │  │ │ estribos φ8  │ │  │  Transversales
    │  │ │ s=15cm       │ │  │
    │  │ └───────────────┘ │  │
    │  └───────────────────┘  │
    │       20cm × 20cm       │
    └─────────────────────────┘

    ELEVACIÓN (Viga Superior, L=4m)

    ┌────────────────────────────────┐
    │    M máx = 45.2 kN·m (azul)   │
    │  ╱╲                            │
    │ ╱  ╲  Zona que requiere        │
    │╱────╲ armadura superior        │
    │══════ ✓ 2 φ16 colocados OK    │
    │                                │
    │ Zona central                   │
    │ ═════════════ ⚠ 3 φ12 < req.  │
    │                                │
    │    V máx = 22.1 kN (rojo)     │
    │  ███ Estribos φ8 @ 15cm ✓     │
    │  ████                          │
    │  ███ Estribos φ8 @ 25cm ✓     │
    │                                │
    │ 0   1m    2m    3m    4m      │
    └────────────────────────────────┘
```

---

## 5. Plan de Implementación (Fases)

### **FASE 1: Editor Modal (Semana 1)**
- [ ] Crear modal de edición para cada elemento
- [ ] Permitir editar dimensiones individuales
- [ ] Validar cambios en tiempo real
- [ ] Vincular cambios al solver (Solver.run())

**Deliverable**: `element-editor.js` + CSS para modal

---

### **FASE 2: Interfaz de Armadura (Semana 2)**
- [ ] Panel de armadura longitudinal (agregar/remover barras)
- [ ] Panel de estribos (definir zonas y espaciamientos)
- [ ] Cálculo automático de As cubierta
- [ ] Indicadores de cumplimiento (verde/amarillo/rojo)

**Deliverable**: UI para edición de armadura + validación

---

### **FASE 3: Visualización en Diagramas (Semana 3)**
- [ ] Sombreado de zonas con armadura requerida detrás de M, V
- [ ] Vistas de sección transversal interactivas
- [ ] Mostrar ubicación de barras gráficamente
- [ ] Indicador de estado (✓, ⚠, ✗)

**Deliverable**: Renderer mejorado con visualización de armadura

---

### **FASE 4: Exportación y Reportes (Semana 4)**
- [ ] Generar detallado de armadura (schedule)
- [ ] Exportar como PDF con planos
- [ ] Especificaciones de corte y doblado

**Deliverable**: Función `generateRebarSchedule()` y export PDF

---

## 6. Estructura de Archivos Propuesta

```
Estructuras/
├── index.html              (mantener)
├── style.css               (mantener, agregar estilos)
├── app.js                  (refactorizar)
├── solver.js               (NUEVO - extraer Solver)
├── renderer.js             (NUEVO - extraer Renderer)
├── element-editor.js       (NUEVO - editor modal)
├── armature-visualizer.js  (NUEVO - visualización M,V,armadura)
└── PLAN_MEJORA_UI.md       (este documento)
```

---

## 7. Beneficios de Esta Arquitectura

| Beneficio | Impacto |
|-----------|---------|
| **Modularidad** | Fácil mantener y extender |
| **Escalabilidad** | Preparado para agregar más elementos |
| **UX** | Usuario tiene control fino sobre cada elemento |
| **Documentación** | Genera automáticamente planos de armadura |
| **Validación** | Indicadores visuales de cumplimiento normativo |

---

## 8. Próximos Pasos

1. ✅ **Revisión de este plan** - ¿Alineado con tu visión?
2. 📝 **Refactorización de app.js** - Modularizar en solver.js, renderer.js
3. 🎨 **Crear CSS para modal editor** - Glassmorphism coherente
4. ⚙️ **Implementar elemento-editor.js** - Fase 1 completa

---

**¿Aprobado el plan? Puedo comenzar con la Fase 1 de inmediato.**
