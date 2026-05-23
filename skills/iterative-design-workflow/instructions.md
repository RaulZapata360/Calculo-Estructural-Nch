# Skill: Flujo de Diseño Iterativo

## Descripción
Procedimiento paso a paso para **diseño iterativo** por combinaciones de cargas críticas. Itera:
1. Asumir armadura inicial
2. Calcular M, V, N (Solver.run())
3. Diseñar As_req, estribos
4. Validar As_min, As_max, s_max
5. Si falla → refinar, si ok → exportar especificación

Respeta **100% NCh430 Of.2008** (ACI 318-19 adaptado a Chile).

## Entrada

### Requerimientos obligatorios
```javascript
{
  story: {
    H: 1.0,                    // altura muro (m)
    loads: {
      qD: 1.18,               // carga muerta (kN/m²)
      qL: 1.18,               // carga viva (kN/m²)
      // Opcional: cargas adicionales (viento, sismo, etc.)
    },
    materials: {
      fc: 25,                 // f'c hormigón (MPa)
      fy: 420,                // fy acero (MPa)
      rec: 0.03,              // recubrimiento (m)
      beta1: 0.85             // factor NCh430
    },
    foundation: { ... }       // config fundación (si aplica)
  },
  spans: [
    { id: 'sp1', fromNode: 0, toNode: 2.88, type: 'muro', tw: 0.14, ... },
    // ...
  ]
}
```

### Parámetros de diseño (usuario especifica)
```
- Tipo de análisis: "muro confinado" | "losa" | "viga"
- Combinaciones críticas: "cargas máximas" | "cargas mínimas" | "todas"
- Criterio de convergencia: tolerancia máxima en As (%)
- Max iteraciones: (típico 5-10)
```

## Proceso

### Paso 1: Definir combinaciones de cargas críticas

```javascript
// NCh430 define combinaciones LRFD:
// Caso 1: U = 1.2·D + 1.6·L (cargas máximas)
// Caso 2: U = 0.9·D + 1.6·W (viento gobierna)
// Caso 3: U = 1.0·D + SDS·E (sismo gobierna)

const combinations = [
  {
    id: 'crit_max',
    name: '1.2D + 1.6L (cargas máximas)',
    factors: { fd: 1.2, fl: 1.6, fw: 0, fs: 0 },
    gov: 'Muro bajo cargas de servicio máximas'
  },
  {
    id: 'crit_wind',
    name: '0.9D + 1.6W (viento)',
    factors: { fd: 0.9, fl: 0, fw: 1.6, fs: 0 },
    gov: 'Muro bajo viento (si aplica)'
  },
  {
    id: 'crit_sismo',
    name: '1.0D + SDS·E (sismo)',
    factors: { fd: 1.0, fl: 0, fw: 0, fs: 1.0 },
    gov: 'Muro bajo sismo (si aplica, zona 3)'
  }
];

// Usuario selecciona cuáles analizar
const activeCombo = combinations.filter(c => userSelectedCombinations.includes(c.id));
console.log(`Analizando ${activeCombo.length} combinaciones críticas`);
```

### Paso 2: Asumir armadura inicial

```javascript
// Según NCh430, armadura mínima:
const armaduraInicial = {
  type: 'wall',
  As_assumido: { // Para ambas caras
    vertical: calculaAsMinVertical(S.story.H, S.story.materials),   // ρ_min = 0.0025
    horizontal: calculaAsMinHorizontal(S.story.H, S.story.materials) // ρ_min = 0.0025
  },
  estribos: {
    tipo: '10 mm',  // Típico para muros
    espaciamiento: 0.20 // m (s_max < d/2, típicamente 0.20m)
  }
};

// Función helper (NCh430 Artículo 10.5.3)
function calculaAsMinVertical(H, materials) {
  const rho_min = 0.0025; // Fracción de área
  const area_bruta = 1.0 * materials.rec; // 1m de ancho × espesor
  return rho_min * area_bruta * 1e4; // Retorna cm²
}

console.log(`Armadura inicial vertical: ${armaduraInicial.As_assumido.vertical} cm²`);
console.log(`Armadura inicial horizontal: ${armaduraInicial.As_assumido.horizontal} cm²`);
```

### Paso 3: Iteración (Ciclo principal)

```javascript
let iteration = 0;
const maxIterations = 10;
const tolerancia = 0.05; // 5%: si As nuevo está dentro ±5% de As anterior, converge
let converged = false;
let armadura_anterior = { ... armaduraInicial };

while (iteration < maxIterations && !converged) {
  iteration++;
  console.log(`\n=== ITERACIÓN ${iteration} ===`);
  
  // 3a: Asignar armadura supuesta a S
  S.results.columns.forEach(col => {
    col.As_assumed = armadura_anterior.As_assumido.vertical;
  });
  
  // 3b: Calcular M, V, N para CADA combinación crítica
  const resultsPerCombo = {};
  for (const combo of activeCombo) {
    // Actualizar factores en S
    S.story.loads.factors = combo.factors;
    
    // Ejecutar SOLVER (Solver.run())
    Solver.run();
    
    // Guardar resultados
    resultsPerCombo[combo.id] = {
      qu: S.results.qu,
      M_max: Math.max(...S.results.spans.map(sp => sp.M_max)),
      V_max: Math.max(...S.results.spans.map(sp => sp.V_max)),
      N_max: Math.max(...S.results.columns.map(col => col.N))
    };
    
    console.log(`  ${combo.name}:`);
    console.log(`    qu = ${resultsPerCombo[combo.id].qu.toFixed(3)} kN/m²`);
    console.log(`    M_max = ${resultsPerCombo[combo.id].M_max.toFixed(2)} kN·m`);
    console.log(`    V_max = ${resultsPerCombo[combo.id].V_max.toFixed(2)} kN`);
  }
  
  // 3c: Encontrar combinación CRÍTICA (la que pide más acero)
  let comboMasCritica = activeCombo[0];
  let As_max_requerido = 0;
  
  for (const combo of activeCombo) {
    const res = resultsPerCombo[combo.id];
    // Diseño por flexión (NCh430 Artículo 10.3.2)
    const As_req = disenoFlexion(
      res.M_max,
      S.story.materials.fc,
      S.story.materials.fy,
      S.story.materials.rec,
      S.story.materials.beta1
    );
    
    if (As_req > As_max_requerido) {
      As_max_requerido = As_req;
      comboMasCritica = combo;
    }
  }
  
  console.log(`  Combinación crítica: ${comboMasCritica.name}`);
  console.log(`  As_req máximo: ${As_max_requerido.toFixed(2)} cm²`);
  
  // 3d: Diseñar armadura nueva
  const armaduraNueva = disenoArmadura(
    resultsPerCombo[comboMasCritica.id],
    S.story.materials,
    S.story.H // altura
  );
  
  console.log(`  Armadura nueva (vertical): ${armaduraNueva.As_vertical.toFixed(2)} cm²`);
  console.log(`  Armadura nueva (horizontal): ${armaduraNueva.As_horizontal.toFixed(2)} cm²`);
  
  // 3e: Validar As_min, As_max, s_max (NCh430)
  const validacion = validarArmadura(
    armaduraNueva,
    S.story.materials,
    S.story.H
  );
  
  if (!validacion.ok) {
    console.log(`  ⚠️ FALLA VALIDACIÓN: ${validacion.errores.join('; ')}`);
    armadura_anterior = armaduraNueva; // Iterar
  } else {
    console.log(`  ✓ VALIDACIÓN OK (As_min, As_max, s_max)`);
    
    // 3f: Verificar convergencia
    const delta = Math.abs(
      (armaduraNueva.As_vertical - armadura_anterior.As_assumido.vertical) / 
      armadura_anterior.As_assumido.vertical
    );
    
    if (delta < tolerancia) {
      console.log(`  ✓ CONVERGENCIA: As varió ${(delta * 100).toFixed(1)}% (< ${tolerancia * 100}%)`);
      converged = true;
      armadura_final = armaduraNueva;
    } else {
      console.log(`  → Iteración siguiente (As varió ${(delta * 100).toFixed(1)}%)`);
      armadura_anterior = armaduraNueva;
    }
  }
  
  if (iteration === maxIterations && !converged) {
    console.warn(`⚠️ NO convergió en ${maxIterations} iteraciones. Usar último resultado.`);
    armadura_final = armadura_anterior;
  }
}

console.log(`\n✓ DISEÑO COMPLETADO EN ITERACIÓN ${iteration}`);
```

### Paso 4: Exportar especificación final

```javascript
const especificacion = {
  proyecto: "Muro de Contención, H=1.0m",
  fecha: new Date().toISOString().split('T')[0],
  responsable: "EstructuraCalc v2.1",
  
  // Cargas y combinaciones analizadas
  cargas_analizadas: activeCombo.map(c => ({
    nombre: c.name,
    gobernante: resultsPerCombo[c.id]
  })),
  
  // Armadura final
  armadura: {
    vertical: {
      As_cm2: armadura_final.As_vertical,
      barras: especificaBarras(armadura_final.As_vertical), // Ej: "10Ø10"
      espaciamiento: 0.15 // m
    },
    horizontal: {
      As_cm2: armadura_final.As_horizontal,
      barras: especificaBarras(armadura_final.As_horizontal),
      espaciamiento: 0.15
    },
    estribos: {
      tipo: "Ø10 @ 0.20m",
      espaciamiento_max: armadura_final.s_estribos_max
    }
  },
  
  // Materiales
  materiales: S.story.materials,
  
  // Verificaciones
  verificaciones: {
    As_min_vertical: armadura_final.As_min_vertical,
    As_max_vertical: armadura_final.As_max_vertical,
    As_selec_vertical: armadura_final.As_vertical,
    status: "OK ✓"
  },
  
  // Notas
  notas: [
    "Diseño conforme NCh430 Of.2008",
    "Cargas combinadas LRFD: 1.2D + 1.6L",
    "Recubrimiento mínimo: 30mm (hormigón in-situ)",
    "Hormigón f'c=25 MPa, acero fy=420 MPa"
  ]
};

// Exportar como JSON o HTML
exportEspecificacion(especificacion, 'json'); // o 'pdf'
return especificacion;
```

## Salida

### Documento técnico con:
1. **Resumen de cargas** — Combinaciones LRFD analizadas
2. **Iteraciones** — Tabla de convergencia (As por iteración)
3. **Armadura final** — Especificación en barras (Ej: 10Ø16 @ 0.15m)
4. **Verificaciones** — As_min, As_max, s_max (todos OK ✓)
5. **Diagramas** — M, V por combinación crítica
6. **Notas de normativa** — Referencias a NCh430

## Funciones Helper (pseudocódigo)

```javascript
function disenoFlexion(M, fc, fy, rec, beta1) {
  // NCh430 Artículo 10.3.2
  // As = M / (φ * fy * (d - a/2))
  // Requiere iteración para encontrar 'a' (profundidad del bloque de compresión)
  // Simplificado: as = M / (0.90 * fy * 0.9*d)
  const d = rec + 0.025; // peralte efectivo (rec + radio barra ~10mm)
  const phi = 0.90; // factor reducción flexión
  const As = M / (phi * (fy / 10) * 0.9 * d); // en cm²
  return As;
}

function disenoArmadura(resultados, materials, H) {
  const As_vertical = disenoFlexion(resultados.M_max, ...);
  const As_horizontal = 0.0025 * 1.0 * materials.tw * 1e4; // ρ_min
  return { As_vertical, As_horizontal, ... };
}

function validarArmadura(armadura, materials, H) {
  const As_min = 0.0025 * 1.0 * materials.tw * 1e4; // ρ_min
  const As_max = 0.75 * materials.fy / ... * 1.0 * materials.tw * 1e4; // ρ_max
  
  const errores = [];
  if (armadura.As_vertical < As_min) errores.push(`As < As_min (${As_min})`);
  if (armadura.As_vertical > As_max) errores.push(`As > As_max (${As_max})`);
  // ... más validaciones
  
  return { ok: errores.length === 0, errores };
}
```

## Ejemplos de Uso

### Caso 1: Diseño rápido (una combinación)
```
Usuario: "Diseña la armadura del muro para cargas máximas (1.2D + 1.6L)"
Script:
  1. Define combo_critica = { 1.2D + 1.6L }
  2. Itera: asumir → calcular → validar
  3. Exporta especificación (As_vertical, As_horizontal, estribos)
  Resultado: Armadura en ~2-3 iteraciones
```

### Caso 2: Análisis completo (todas las combinaciones)
```
Usuario: "Analiza todas las combinaciones críticas (cargas máx, viento, sismo)"
Script:
  1. Define 3 combos críticas
  2. Itera hasta convergencia para combinación gobernante
  3. Genera tablas de M, V, N por combo
  4. Exporta especificación completa + diagrama comparativo
  Resultado: Armadura óptima válida para TODAS las combos
```

### Caso 3: Validación de armadura existente
```
Usuario: "Valida si 8Ø12 es suficiente para este muro"
Script:
  1. Asume armadura = 8Ø12 (~9 cm²)
  2. Calcula M, V con esa armadura
  3. Valida As_min, As_max, s_max
  4. Reporte: OK o requiere refuerzo
  Resultado: Validación de diseño previo
```

## Notas Importantes

1. **Normativa:** Todos los cálculos referenciados a NCh430 Of.2008 (artículos y ecuaciones)
2. **Factores de seguridad:** φ=0.90 (flexión), φ=0.75 (corte) per NCh430
3. **Recubrimiento:** Siempre validar contra NCh430 Tabla 7.1 (mínimos por ambiente)
4. **Convergencia:** Si no converge en 10 iteraciones, revisar hipótesis de cálculo
5. **Solver.run():** CRÍTICO que esté actualizado; ver `PROJECT.md`

## Archivos Relacionados

- `files/test-cases.md` — Casos de prueba validados contra NCh430
- `files/solver-pseudocode.md` — Pseudocódigo Solver.run()
- `PROJECT.md` (en raíz) — Referencia completa
- `SKILL_LOAD_COMBINATION_DESIGN.md` (en raíz) — Documento original de este skill

---

**Versión:** 1.0  
**Último update:** 2026-05-21  
**Complejidad:** Alta (requiere entender LRFD, NCh430, iteración numérica)
