# 📊 MÓDULO C: Análisis Técnico Avanzado

## ¿Qué es el Módulo C?

Es una **mejora del PDF de exportación** que agrega **4 páginas técnicas avanzadas** con análisis detallado de cargas, fuerzas y verificaciones normativas.

## 📄 Contenido del Módulo C

El PDF descargado contiene **11 páginas en total**:

### Páginas 1-7 (Módulo B — Memoria de Cálculo)
- Portada formal
- Generalidades
- Especificación de materiales
- Criterios de diseño
- Análisis sísmico automatizado
- Solver de fuerzas
- Bibliografía

### Páginas 8-11 (NUEVAS — Módulo C)

**Página 8: Análisis de Cargas (LRFD)**
- Tabla de cargas nominales (qD, qL)
- Combinaciones LRFD (1.2D + 1.6L, 0.9D + 1.6W, 1.0D + SDS·E)
- Carga combinada final (qu)
- Notas normativas

**Página 9: Fuerzas Internas Críticas**
- Resumen de máximos: M_max, V_max, N_max
- Distribución de fuerzas por vano
- Tabla de momento, cortante y axial en cada elemento
- Identificación de elementos críticos (destacados en amarillo)

**Página 10: Especificación de Armadura Longitudinal**
- Tabla detallada de armadura por elemento
- As_req (requerido), As_min, As_max (límites NCh430)
- As_selected (armadura elegida)
- Tipo de barras
- Estado de cumplimiento (✓ OK / ✗ FALLA)
- Criterios de diseño NCh430

**Página 11: Verificación de Cumplimiento NCh430**
- Checklist automático de validaciones
- Armadura mínima (ρ_min = 0.0025)
- Armadura máxima (ρ_max = 0.75·ρ_balanceada)
- Recubrimiento mínimo
- Espaciamiento máximo estribos
- Factores de seguridad (φ)
- Especificación de materiales
- Conclusión de cumplimiento

## 🚀 Cómo usar el Módulo C

### En la app:
1. Abre EstructuraCalc (http://localhost:3001)
2. Configura tu proyecto (cargas, geometría, materiales)
3. Haz clic en **"MEMORIA DE CÁLCULO"** (botón azul, panel derecho)
4. En el overlay que se abre, haz clic en **"Imprimir / PDF"**
5. Selecciona **"MÓDULO C: Análisis Técnico Avanzado"**
6. Se descargará un PDF con todas las páginas

### Nombre del archivo:
```
Analisis_Tecnico_Avanzado_YYYY-MM-DD.pdf
```

## ✅ Verificaciones Automáticas

El Módulo C calcula automáticamente:

- ✓ Combinaciones LRFD (factores 1.2 y 1.6)
- ✓ Cargas máximas por vano
- ✓ Momento y cortante críticos
- ✓ Armadura requerida vs límites normativos
- ✓ Validaciones NCh430 (ρ_min, ρ_max, s_max)
- ✓ Estado de cumplimiento

## 🔒 Normativa aplicada

- **NCh430 Of.2008** — Diseño hormigón armado (ACI 318-19)
- **Artículo 10.3** — Requisitos LRFD
- **Artículo 10.5** — Límites de armadura (ρ_min, ρ_max)
- **Artículo 12.3** — Espaciamiento estribos
- **Tabla 7.1** — Recubrimiento mínimo

## 📌 Para quién es el Módulo C

| Rol | Uso |
|-----|-----|
| **Ingeniero proyectista** | Análisis detallado de cargas y verificaciones |
| **Dirección de Obras** | Documentación técnica de respaldo |
| **Fiscalizador** | Validación de cumplimiento normativo |
| **Contratista avanzado** | Entiende qué se especificó técnicamente |

## ❌ Limitaciones conocidas

- Requiere que Solver.run() haya ejecutado correctamente
- Si falta `memoryReport-enhanced.js`, muestra error
- CDN externas (jsPDF, html2canvas) deben estar disponibles
- Tamaño de PDF: ~2-3 MB (depende de imágenes)

## 📞 Troubleshooting

### "Error: Módulo C no disponible"
**Causa:** memoryReport-enhanced.js no cargó  
**Solución:** Verifica que:
1. El archivo existe: `modules/renderer/memoryReport-enhanced.js`
2. index.html carga el script (línea ~889)
3. No hay errores en consola (F12 → Console)
4. Recarga la página

### "Página 8 muestra datos sin cargas"
**Causa:** S.results.qu es 0 o indefinido  
**Solución:**
1. Verifica que ejecutaste Solver (botón "Resolver" o abrir overlay)
2. Comprueba que configuraste cargas (qD, qL > 0)
3. Recalcula antes de exportar

### PDF se ve pixelado
**Causa:** Resolución baja en html2canvas  
**Solución:** Normal a escala 2. Imprime con aceleración de hardware (Ctrl+P → opciones)

## 📈 Evolución futura

Mejoras planeadas:
- [ ] Agregar diagramas M, V, N gráficos (no solo tablas)
- [ ] Cálculo automático de combinaciones sísmicas
- [ ] Validación de fundaciones (volcamiento, deslizamiento)
- [ ] Exportar a DOCX/JSON además de PDF
- [ ] Generador de planos automatizado

## 📚 Archivos relacionados

```
C:\Users\raulz\OneDrive\Escritorio\Trabajo\Ingenieria\Estructuras\
├── modules/renderer/
│   ├── memoryReport.js (Módulos A y B, código original)
│   ├── memoryReport-enhanced.js (Módulo C, NUEVO)
│   └── ...
├── index.html (carga los scripts)
├── skills/ (documentación de mejoras)
│   ├── structural-report-generator/
│   └── ...
└── MODULO_C_AYUDA.md (este archivo)
```

## 🎯 Resumen

| Aspecto | Módulo A | Módulo B | Módulo C |
|--------|----------|----------|----------|
| **Páginas** | 7 | 7 | 11 (7+4) |
| **Audiencia** | Constructor | Dirección Obras | Ingeniero técnico |
| **Contenido** | Planos, fichas, cubicación | Memoria formal, criterios | Análisis LRFD, validaciones NCh430 |
| **Útil para** | Ejecución en obra | Aprobación municipal | Auditoría técnica |

---

**Última actualización:** 2026-05-21  
**Versión:** 1.0  
**Estado:** ✅ Listo para usar
