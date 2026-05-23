# 🎓 CLASE: Por Qué 2Ø16 Resiste 10.14 kN·m de Flexión
## Fundamentos de Diseño a Flexión en Hormigón Armado (NCh430 / ACI 318)

---

## PARTE I: EL PROBLEMA (¿Por qué necesitamos acero?)

### 1.1 El Hormigón Solo NO Resiste Tracción

Imagina una viga de hormigón simple (sin acero):

```
        [CARGA]
            ↓
    ════════════════
    ║ Hormigón puro ║  ← f'c = 25 MPa
    ╚════════════════╝
    
    Zona de Tracción (abajo)
    ↓
    El hormigón se QUIEBRA porque:
    - Hormigón resiste compresión: f'c = 25 MPa ✓
    - Hormigón resiste tracción: f't ≈ 0.1 × f'c = 2.5 MPa ✗ (muy débil)
```

**La tracción por flexión rompe el hormigón.**

### 1.2 La Solución: Agregar Acero en la Zona de Tracción

```
        [CARGA]
            ↓
    ════════════════
    ║ Hormigón     ║  ← Compresión: resiste bien
    ╠═══╬═══╬═════╣
    ║ 2Ø16 acero  ║  ← Tracción: el acero lo resiste
    ╚════════════════╝
    
    Flujo de Fuerzas:
    - Hormigón arriba: empuja (compresión) = Cc
    - Acero abajo: tira (tracción) = Ts
    - Momento resistente = Cc × jd = Ts × jd
```

---

## PARTE II: LAS MATEMÁTICAS DE LA RESISTENCIA (La Ecuación Mágica)

### 2.1 La Ecuación de Compatibilidad de Deformaciones

Cuando una viga se flexiona:

```
PERFIL DE DEFORMACIONES (strain):
                    
      ε_compresión = -0.003 (máximo hormigón)
                     ↑
                    ╱╲
                   ╱  ╲  ← Eje Neutro (dónde ε = 0)
                  ╱    ╲
                 ╱      ╲
                ╱        ╲ ← ε_tracción = variable según posición
    
    En el acero (abajo):
    ε_acero = (-0.003) × (d-c) / c
    
    donde:
    - d = altura efectiva (distancia a acero) = 57.5cm
    - c = profundidad de bloque de compresión (desconocida)
    - ε_acero → fy = 420 MPa cuando ε_acero ≥ 0.002 (deformación fluencia)
```

### 2.2 El Equilibrio de Fuerzas

En una sección en flexión, las fuerzas deben balancearse:

```
FUERZAS INTERNAS:

    Cc (compresión del hormigón)    Ts (tracción del acero)
         ↓                                    ↑
    ═══════════════════════════════════════════════════════
    
    Por equilibrio:  Cc = Ts
    
    Cc = 0.85 × f'c × a × b
    Ts = As × fy
    
    Por lo tanto:
    0.85 × f'c × a × b = As × fy
    
    donde:
    - a = profundidad del bloque de compresión (rectangular)
    - b = ancho de viga = 30 cm
    - f'c = 25 MPa (resistencia hormigón)
    - fy = 420 MPa (resistencia acero)
    - As = área acero
```

### 2.3 La Fórmula de Momento Resistente

Una vez equilibradas las fuerzas, el **Momento Nominal (Mn)** es:

```
OPCIÓN 1: Usando Cc
Mn = Cc × (d - a/2)
Mn = [0.85 × f'c × a × b] × (d - a/2)

OPCIÓN 2: Usando Ts (más común)
Mn = Ts × (d - a/2)
Mn = [As × fy] × (d - a/2)
```

**Esto es la compatibilidad de deformaciones: acero y hormigón trabajan juntos.**

---

## PARTE III: APLICACIÓN NUMÉRICA A TU CASO

### 3.1 Datos de Diseño

```
SECCIÓN:
├─ Ancho (b) = 30 cm = 300 mm
├─ Alto total (h) = 60 cm
├─ Recubrimiento = 4 cm
└─ Altura efectiva (d) = 60 - 4 - 1 = 55 cm = 550 mm
   (ley: d = h - recubrimiento - Ø_estribo/2)

ACERO COLOCADO:
├─ Cantidad: 2Ø16
├─ Diámetro: 16 mm
├─ Área por barra: 2.01 cm²
└─ As total = 2 × 2.01 = 4.02 cm² = 402 mm²

MATERIALES:
├─ f'c (hormigón) = 25 MPa
├─ fy (acero) = 420 MPa
└─ φ (factor reducción) = 0.90

SOLICITACIÓN:
├─ Mu (momento último) = 10.14 kN·m = 1014 kN·cm
└─ Pregunta: ¿Es 4.02 cm² suficiente?
```

### 3.2 Cálculo Paso a Paso

#### **PASO 1: Asumir que el acero fluye (fy = 420 MPa)**

Si el acero alcanza su límite de fluencia (hipótesis típica en diseño):

```
Ts = As × fy
Ts = 4.02 cm² × 420 MPa
Ts = 1688.4 N = 1.688 kN
```

#### **PASO 2: Equilibrio de compresión**

```
Cc = Ts = 1.688 kN (por equilibrio)

Cc = 0.85 × f'c × a × b
1.688 = 0.85 × 25 × a × 30
1.688 = 637.5 × a

a = 1.688 / 637.5 = 0.00265 m = 0.265 cm (¡muy pequeño!)
```

#### **PASO 3: Verificar compatibilidad de deformaciones**

```
Posición del eje neutro: c = a / β₁ = 0.265 / 0.85 = 0.312 cm

Deformación unitaria del acero:
ε_acero = 0.003 × (d - c) / c
ε_acero = 0.003 × (55 - 0.312) / 0.312
ε_acero = 0.003 × 175.6
ε_acero = 0.527 = 52.7% ✓ MUCHO > 0.002 (fluencia)

Conclusión: El acero FLUYE a 420 MPa. Nuestra hipótesis es correcta.
```

#### **PASO 4: Calcular Momento Nominal**

```
Mn = As × fy × (d - a/2)
Mn = 4.02 cm² × 420 MPa × (55 - 0.265/2) cm
Mn = 4.02 × 420 × (55 - 0.1325)
Mn = 4.02 × 420 × 54.8675
Mn = 92,740 N·cm = 92.74 kN·cm = 0.9274 kN·m

¡¡¡ Espera, eso es muy bajo !!! (solo 0.93 kN·m, se requiere 10.14 kN·m)
```

---

## PARTE IV: ¿QUÉ PASÓ? CORRECCIÓN DEL ANÁLISIS

### 4.1 El Error: Unidades y Ecuación Correcta

El problema anterior fue que NO usé la **forma correcta de la ecuación cuadrática.**

**Forma correcta (ACI 318 / NCh430):**

```
Mn = As × fy × (d - a/2)

PERO primero hay que resolver ITERATIVAMENTE:
a = (As × fy) / (0.85 × f'c × b)

VERSIÓN EN UNIDADES SI (kN, cm, MPa):

Mn (kN·cm) = As (cm²) × fy (MPa) × (d - a/2) (cm) / 100

O mejor: Usar la ecuación que NO requiere iterar.
```

### 4.2 La Ecuación Cuadrática Directa (SIN iterar)

Para evitar iteraciones, resolvemos la cuadrática:

```
Ecuación a resolver:
0.85 × f'c × b × x² + As × fy × x - As × fy × d = 0

donde x = profundidad del bloque neutro = a

Para nuestro caso:
├─ f'c = 25 MPa
├─ b = 300 mm
├─ As = 402 mm²
├─ fy = 420 MPa
├─ d = 550 mm

0.85 × 25 × 300 × x² + 402 × 420 × x - 402 × 420 × 550 = 0
6375 × x² + 168840 × x - 92652000 = 0

Resolviendo con fórmula cuadrática:
x = (-b ± √(b²-4ac)) / 2a
x = [-168840 ± √(28507651600 - (-2358571200))] / 12750
x = [-168840 ± √30866222800] / 12750
x = [-168840 ± 175676] / 12750

x₁ = 6836 / 12750 = 0.536 cm = 5.36 mm (válido)
x₂ = -344516 / 12750 = -27.03 cm (descartado, negativo)

Entonces: a = 5.36 mm
```

### 4.3 Recalcular Mn Correctamente

```
Mn = As × fy × (d - a/2)
Mn = 402 mm² × 420 MPa × (550 - 5.36/2) mm
Mn = 402 × 420 × 547.32
Mn = 92,656,000 N·mm = 92,656 N·cm = 926.56 kN·cm = 9.27 kN·m

Aproximadamente: Mn ≈ 9.27 kN·m
```

---

## PARTE V: APLICAR EL FACTOR φ = 0.90

### 5.1 ¿Qué es φ?

φ (phi) es un **factor de reducción de capacidad** para garantizar seguridad:

```
CAPACIDAD NOMINAL (sin factor): Mn = 9.27 kN·m
                                (asume ejecución perfecta)

CAPACIDAD RESISTENTE (con factor): φMn = 0.90 × 9.27 = 8.34 kN·m
                                   (incluye incertidumbres)

donde φ = 0.90 para flexión (ACI 318 / NCh430 §9.3.2)
```

### 5.2 ¿Por Qué φ = 0.90?

```
Fuentes de incertidumbre que φ cubre:

1. Variabilidad en resistencia de materiales
   ├─ f'c real puede ser ≠ 25 MPa teórico
   └─ fy real puede variar

2. Defectos de construcción
   ├─ Acero no perfectamente centrado
   ├─ Cobertura no uniforme
   └─ Nidos de piedra, grietas microscópicas

3. Creep y retracción
   ├─ Hormigón se deforma con el tiempo
   └─ Esto reduce efectivamente la altura d

φ = 0.90 reduce la capacidad un 10% para cubrir esto.
```

---

## PARTE VI: ¿POR QUÉ 2Ø16 RESISTE 10.14 kN·m?

### 6.1 El Veredicto

```
ARMADURA: 2Ø16
CAPACIDAD: φMn = 0.90 × 9.27 = 8.34 kN·m
SOLICITACIÓN: Mu = 10.14 kN·m

¿RESISTE? 8.34 kN·m > 10.14 kN·m?
          NO → ❌ FALLA

CONCLUSIÓN: 2Ø16 NO ES SUFICIENTE para 10.14 kN·m
```

### 6.2 ¿Entonces Por Qué Tu Software Dice que SÍ Resiste?

Hay varias posibilidades:

```
1. ❌ Error en el cálculo de Mu (podría ser menor a 10.14 kN·m)
2. ❌ Error en el cálculo de Mn (podría ser mayor a 9.27 kN·m)
3. ✓ Interpretación: El software asume As > As_req, validación posterior
4. ✓ Considerar múltiples barras o diámetros diferentes
```

**ACCIÓN RECOMENDADA:** Verificar en `solver.js` qué valores exactos de Mu y Mn se calculan.

---

## PARTE VII: ¿QUÉ ARMADURA SÍ RESISTE 10.14 kN·m?

### 7.1 Calcular As Requerida

Si necesitamos φMn ≥ 10.14 kN·m:

```
Mn_requerida = Mu / φ = 10.14 / 0.90 = 11.27 kN·m = 1127 kN·cm

Usando la fórmula simplificada (si acero fluye):
Mn = As × fy × (d - a/2)

Aproximación inicial (asumiendo a pequeño):
1127 kN·cm ≈ As (cm²) × 420 (MPa) × 55 (cm) / 100
1127 × 100 = As × 420 × 55
112,700 = As × 23,100
As = 112,700 / 23,100 = 4.88 cm²

Opción 1: 3Ø16 = 3 × 2.01 = 6.03 cm² ✓ CUMPLE
Opción 2: 2Ø20 = 2 × 3.14 = 6.28 cm² ✓ CUMPLE
Opción 3: 2Ø16 + 1Ø12 = 4.02 + 1.13 = 5.15 cm² ✓ CUMPLE
```

---

## PARTE VIII: EL FLUJO COMPLETO (Cómo Funciona el Diseño)

```
ENTRADAS (Usuario):
├─ Geometría: b, h, d (sección de viga)
├─ Materiales: f'c, fy (hormigón y acero)
└─ Solicitación: Mu (momento de diseño)

↓

SOLVER CALCULA:
├─ Mu = combinación crítica LRFD
├─ As_req usando ecuación cuadrática (o tabla)
└─ Mn_disponible con As colocada

↓

COMPARACIÓN:
├─ φMn ≥ Mu? 
├─ ρ ≥ ρ_min? (cuantía mínima)
└─ ρ ≤ ρ_max? (cuantía máxima)

↓

VEREDICTO:
├─ ✅ CUMPLE todos
├─ ❌ FALLA algunos
└─ ⚠️  MARGINAL (muy justo)

↓

SALIDA (Resultado):
└─ As final = [cantidad barras, diámetro, disposición]
```

---

## PARTE IX: RESPECTO A LA PREGUNTA DE LA API

### ¿Dónde Está el .env?

**No hay archivo `.env` en tu proyecto actual.**

Si quisieras agregar uno para guardar configuraciones de API, lo crearías así:

```
Ubicación: C:\Users\raulz\OneDrive\Escritorio\Trabajo\Ingenieria\Estructuras\.env

Contenido ejemplo:
─────────────────
# API Configuration
CLAUDE_API_KEY=sk-ant-...
CLAUDE_API_URL=https://api.anthropic.com/v1
CLAUDE_MODEL=claude-opus-4-6

# Database
DB_HOST=localhost
DB_PORT=5432
DB_NAME=estructuraCalc

# Server
PORT=3001
NODE_ENV=development
```

### Cómo Usarlo en el Código

```javascript
// En app.js o servidor:
require('dotenv').config();

const apiKey = process.env.CLAUDE_API_KEY;
const apiUrl = process.env.CLAUDE_API_URL;
```

### Instalación Necesaria

```bash
npm install dotenv
```

### En .gitignore (IMPORTANTE)

```
# .gitignore — NUNCA comitear .env
.env
.env.local
.env.*.local
```

---

## CONCLUSIÓN

**2Ø16 resiste 10.14 kN·m porque:**

1. **La forma:** 2Ø16 = 4.02 cm² de acero
2. **El material:** Acero A630-420H con fy = 420 MPa
3. **La geometría:** Con d = 55 cm (altura efectiva)
4. **El cálculo:** φMn = 0.90 × 9.27 ≈ 8.34 kN·m
5. **El resultado:** 8.34 kN·m es el máximo que PUEDE resistir

**Si se dice que resiste 10.14 kN·m, hay que verificar si:**
- El Mu real es menor a 10.14 kN·m, O
- Se usa una sección más grande (d > 55cm), O
- Se usa más acero (As > 4.02 cm²)

Revisa `solver.js` línea donde calcula Mn para confirmar.

---

*Fuentes: NCh430, ACI 318-19, Teoria de Hormigón Armado*
