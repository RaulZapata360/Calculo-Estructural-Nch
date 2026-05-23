# Diseño de Armadura en Hormigón Armado
## Metodología según NCh430 / ACI 318-19

> **Referencia:** Apunte de tarea (viga continua con f'c = 200 kg/cm², fy = 2800 kg/cm²)  
> **Norma:** NCh430 Of.2008 (equivalente a ACI 318) — Sistema LRFD

---

## 0. Definiciones y Parámetros Previos

Antes de comenzar cualquier diseño, se deben tener claros los siguientes datos de entrada:

| Parámetro | Símbolo | Descripción |
|-----------|---------|-------------|
| Resistencia del hormigón | f'c | kg/cm² o MPa |
| Fluencia del acero | fy | kg/cm² o MPa |
| Ancho de la sección | b | cm |
| Altura total de la sección | h | cm |
| Recubrimiento libre | r | mm o cm |
| Peralte efectivo | d = h - r - db/2 | cm |
| Momento último | Mu | kg·m o kN·m |
| Cortante último | Vu | kg o kN |
| Factor de reducción flexión | φ_b = 0.90 | — |
| Factor de reducción corte | φ_v = 0.75 | — |

> **Nota sobre unidades:** El Apunte 1 usa el sistema kgf/cm². En NCh430 moderna (SI), usar MPa y kN. Las fórmulas son equivalentes ajustando unidades.

---

## 1. Determinación del Peralte Efectivo (d)

```
d = h - r_libre - d_estribo - d_barra_principal/2
```

**Ejemplo del Apunte:**
- h = 70 cm, r = 40 mm = 4 cm
- Se asumió d = 66 cm (conservador, descontando estribo φ8 + mitad barra principal)

---

## 2. Cálculo de Armadura Mínima (ρ_min y As_min)

La armadura mínima garantiza que la viga no falle de forma frágil al agrietarse.

### Fórmula (NCh430 Art. 9.6.1 / ACI 318 Sec. 9.6.1.2):

```
ρ_min = max(  0.25 · √f'c / fy  ,  1.4 / fy  )
```

> Las unidades de f'c y fy deben estar en las **mismas unidades** (ambas en kg/cm² o ambas en MPa).

### Luego:
```
As_min = ρ_min · b · d     [cm²]
```

**Ejemplo del Apunte:**
```
ρ_min = max( 0.25 · √200 / 2800 ,  1.4 / 2800 )
      = max( 0.0016 ,  0.0005 )
      = 0.0016

→ Nota: En kgf/cm² con f'c=200, fy=2800:
  0.25·√200/2800 = 0.25·14.14/2800 ≈ 0.00126
  1.4/2800 = 0.0005
  ρ_min = 0.00126

→ El apunte usa ρ_min = 0.005 (en MPa equivalente):
  0.25·√f'c[MPa]/fy[MPa]  o bien como constante directa de la norma

As_min = 0.005 · 25 · 66 = 8.25 cm²
Solución inicial adoptada: 4φ18 → As = 10.18 cm²
```

---

## 3. Cálculo de Armadura Máxima (ρ_max y As_max)

Limita la cuantía para garantizar falla dúctil (el acero fluye antes que falle el hormigón).

### Paso 1: Cuantía balanceada (ρ_b)

```
ρ_b = (0.85 · β₁ · f'c / fy) · (6000 / (6000 + fy))
```

Donde β₁ depende de f'c:
- Si f'c ≤ 280 kg/cm² (≤ 28 MPa): β₁ = 0.85
- Si f'c > 280 kg/cm²: β₁ = 0.85 - 0.05·(f'c - 280)/70 ≥ 0.65

> En unidades MPa, el numerador del segundo factor es **600** en lugar de 6000.

### Paso 2: Armadura máxima

```
ρ_max = 0.75 · ρ_b
As_max = ρ_max · b · d     [cm²]
```

**Ejemplo del Apunte (kgf/cm²):**
```
β₁ = 0.85 (f'c = 200 kg/cm² < 280)
ρ_b = (0.85 · 0.85 · 200 / 2800) · (6000 / (6000 + 2800))
    = 0.05154 · 0.6818
    = 0.0351

ρ_max = 0.75 · 0.0351 = 0.0263
As_max = 0.0263 · 25 · 66 = 43.4 cm²
```

---

## 4. Verificación de la Armadura Adoptada (Iteración)

Este es el **proceso iterativo central** del diseño. Se evalúa si la armadura adoptada soporta el momento último de diseño.

### Paso a paso:

#### 4.1 Calcular la profundidad del bloque de compresión (a)

```
a = (As · fy) / (0.85 · f'c · b)     [cm]
```

#### 4.2 Calcular el Momento Nominal (Mn)

```
Mn = As · fy · (d - a/2)     [kg·cm  →  dividir por 100 para kg·m]
```

#### 4.3 Aplicar factor de reducción φ

```
φMn = 0.90 · Mn
```

#### 4.4 Verificar que la sección resiste

```
φMn ≥ Mu    ✓  (si cumple, la armadura es suficiente)
φMn < Mu    ✗  (si no cumple, aumentar la armadura y reiterar desde 4.1)
```

**Ejemplo del Apunte — Primera iteración con 4φ18 (As = 10.18 cm²):**
```
a = (10.18 · 2800) / (0.85 · 200 · 25) = 28,504 / 4,250 = 6.71 cm
Mn = 10.18 · 2800 · (66 - 6.71/2) = 28,504 · 62.645 = 1,785,630 kg·cm = 17,856 kg·m
φMn = 0.90 · 17,856 = 16,070 kg·m

Resultado: 16,070 kg·m < 52,858 kg·m → FALLA ✗
```

**Segunda iteración con 8φ22 (As = 30.41 cm²) — para zona de apoyo (Mu = 42,840 kg·m):**
```
a = (30.41 · 2800) / (0.85 · 200 · 25) = 85,148 / 4,250 = 20.04 cm
Mn = 30.41 · 2800 · (66 - 20.04/2) = 85,148 · 55.98 = 4,767,600 kg·cm = 47,676 kg·m
φMn = 0.90 · 47,676 = 42,908 kg·m

Resultado: 42,908 kg·m ≈ 42,840 kg·m → CUMPLE ✓
```

---

## 5. Método Directo: Ecuación Cuadrática para As Requerido

En lugar de iterar "a ciegas", se puede resolver la ecuación para As directamente dado Mu:

```
φ · As · fy · (d - As·fy / (1.7 · f'c · b)) = Mu

→ Reordenando:

(φ · fy² / (1.7 · f'c · b)) · As² - (φ · fy · d) · As + Mu = 0
```

Esto es una ecuación cuadrática: **A·As² - B·As + C = 0**, donde:

```
A = φ · fy² / (1.7 · f'c · b)
B = φ · fy · d
C = Mu
```

Solución:
```
As = (B - √(B² - 4·A·C)) / (2·A)
```

> Se toma la raíz **menor** (la raíz mayor corresponde a la zona sobre-reforzada, que no es dúctil).

**Ejemplo del Apunte — Momento máximo en el vano (Mu = 52,858 kg·m = 5,285,800 kg·cm):**
```
A = 0.9 · 2800² / (1.7 · 200 · 25) = 7,056,000 / 8,500 = 830.12  → el apunte usa: 922.35
B = 0.9 · 2800 · 66 = 166,320  → el apunte usa: 184,800 (verif. unidades)
C = 5,285,800

Discriminante = B² - 4·A·C = 166,320² - 4·922.35·5,285,800
              = 27,662,342,400 - 19,491,267,600 = 8,171,074,800

As = (184,800 - √8,171,074,800) / (2 · 922.35)
   = (184,800 - 90,394) / 1,844.7
   = 94,406 / 1,844.7
   ≈ 51.2 cm²  (el apunte obtiene 39.58 cm² — diferencia por factor en fórmula)

Armadura adoptada: 8φ25 → As = 39.27 cm²
```

> **Aclaración:** Las diferencias entre el ejemplo y el desarrollo manual pueden deberse a si Mu se expresa en kg·m o kg·cm. Siempre verificar unidades antes de operar.

---

## 6. Diseño de Armadura de Corte (Estribos)

### Paso 1: Resistencia del hormigón a corte (Vc)

```
Vc = 0.53 · √f'c · b · d     [kg]     (f'c en kg/cm², b y d en cm)
```

En unidades MPa (NCh430/ACI 318):
```
Vc = 0.17 · √f'c · b · d     [N]     (f'c en MPa, b y d en mm)
```

**Ejemplo del Apunte:**
```
Vc = 0.53 · √200 · 25 · 66 = 0.53 · 14.14 · 25 · 66 = 12,367 kg
```

### Paso 2: Fuerza que debe resistir el acero (Vs)

```
Vs = Vu/φ_v - Vc = Vu/0.75 - Vc     [kg]
```

**Ejemplo:**
```
Vs = 36,176 / 0.75 - 12,367 = 48,235 - 12,367 = 35,868 kg
```

### Paso 3: Espaciado de estribos (s)

```
s = Av · fy · d / Vs     [cm]
```

Donde `Av = 2 · área_barra_estribo` (dos ramas por estribo).

**Ejemplo con φ8 (area = 0.503 cm² → Av = 1.006 cm²):**
```
s = 1.006 · 2800 · 66 / 35,868 = 185,918 / 35,868 = 5.2 cm  → Muy estrecho ✗
```

**Con φ10 (area = 0.785 cm² → Av = 1.57 cm²):**
```
s = 1.57 · 2800 · 66 / 35,868 = 290,136 / 35,868 = 8.1 cm → ADOPTADO: φ10@8cm ✓
```

### Paso 4: Verificar espaciado máximo normativo

```
s_max = min(d/2, 600mm)     (zona sin confinamiento especial)
s_max = min(d/4, 8·db_long, 24·db_estribo, 300mm)     (zona de confinamiento sísmico NCh433)
```

---

## 7. Verificaciones Finales

Antes de dar por válido el diseño, verificar:

| Verificación | Condición | ¿Por qué? |
|---|---|---|
| Cuantía mínima | As ≥ As_min | Evita falla frágil |
| Cuantía máxima | As ≤ As_max | Garantiza ductilidad |
| Resistencia a flexión | φMn ≥ Mu | Equilibrio resistente |
| Resistencia a corte | φVn = φ(Vc+Vs) ≥ Vu | Evita falla frágil por corte |
| Espaciado de barras | s_libre ≥ max(db, 25mm) | Control de fisuración |
| Recubrimiento | r ≥ 20mm (ambiente normal) | Protección del acero |
| Diámetro estribo | db_est ≥ db_long/4 | Confinamiento efectivo |

---

## 8. Flujo de Diseño — Resumen en Pasos

```
1. DATOS DE ENTRADA
   └─ f'c, fy, b, h, Mu, Vu, recubrimiento

2. PERALTE EFECTIVO
   └─ d = h - r - db_estribo - db_long/2

3. LÍMITES DE ARMADURA
   ├─ As_min = ρ_min · b · d
   └─ As_max = ρ_max · b · d  (ρ_max = 0.75·ρ_b)

4. CÁLCULO DIRECTO POR CUADRÁTICA (o tanteo)
   └─ As_req = (B - √(B²-4AC)) / 2A

5. SELECCIÓN DE BARRAS COMERCIALES
   └─ Adoptar As_adopatado ≥ max(As_req, As_min)

6. VERIFICACIÓN FINAL DE φMn ≥ Mu
   └─ Si cumple → continuar
   └─ Si no cumple → aumentar barras y volver a paso 5

7. DISEÑO DE ESTRIBOS
   ├─ Vc = 0.17·√f'c·b·d  [MPa, mm]
   ├─ Vs = Vu/φ - Vc
   ├─ s = Av·fy·d / Vs
   └─ Verificar s ≤ s_max normativo

8. RESULTADO FINAL
   └─ Especificar: barra long. + estribo + espaciado
```

---

## 9. Barras Comerciales en Chile (Referencia)

| Designación | Diámetro nominal | Área (cm²) | Peso (kg/m) |
|-------------|-----------------|------------|-------------|
| φ6  | 6.0 mm | 0.283 | 0.222 |
| φ8  | 8.0 mm | 0.503 | 0.395 |
| φ10 | 10.0 mm | 0.785 | 0.617 |
| φ12 | 12.0 mm | 1.131 | 0.888 |
| φ16 | 16.0 mm | 2.011 | 1.578 |
| φ18 | 18.0 mm | 2.545 | 1.998 |
| φ20 | 20.0 mm | 3.142 | 2.466 |
| φ22 | 22.0 mm | 3.801 | 2.984 |
| φ25 | 25.0 mm | 4.909 | 3.854 |
| φ28 | 28.0 mm | 6.158 | 4.834 |
| φ32 | 32.0 mm | 8.042 | 6.313 |

> Acero estructural en Chile: **A630-420H** (fy = 420 MPa) y **A440-280H** (fy = 280 MPa)  
> El apunte utiliza A440-220H (fy = 2800 kgf/cm² ≈ 275 MPa), que corresponde a la antigua designación A440-280H.

---

## 10. Conversión de Unidades (Referencia Rápida)

| Magnitud | kgf/cm² → MPa | Factor |
|----------|--------------|--------|
| f'c = 200 kgf/cm² | = 19.6 MPa | × 0.0981 |
| fy = 2800 kgf/cm² | = 274.5 MPa | × 0.0981 |
| 1 kg·m de momento | = 9.81 N·m = 0.00981 kN·m | — |
| 1 kg de fuerza | = 9.81 N = 0.00981 kN | — |

---

*Documento elaborado en base al Apunte 1 (tarea manuscrita, 2026) y NCh430 Of.2008 / ACI 318-19.*
