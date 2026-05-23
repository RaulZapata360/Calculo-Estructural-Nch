# Diseño de Armadura para Losas de Hormigón Armado
## Método de Marcus — Losas en Dos Direcciones
### NCh430 Of.2008 / ACI 318-19

> **Referencia:** Apunte 2 — Tarea 7: Campo de 4 losas continuas (3×4, 2×4, 3×5, 2×5 m)  
> **Materiales:** Hormigón G20 (f'c = 200 kg/cm²) · Acero A630-420H (fy = 4200 kg/cm²)  
> **Combinación de cargas:** U = 1.2D + 1.6L (NCh3171)

---

## 0. Introducción: Losa en Una vs. Dos Direcciones

| Condición | Tipo | Método |
|-----------|------|--------|
| m = lx/ly < 0.5 | Losa en **una dirección** | Franjas de 1 m, como viga |
| m = lx/ly ≥ 0.5 | Losa en **dos direcciones** | Método de Marcus (tablas) |

> `lx` = dimensión corta · `ly` = dimensión larga

La losa trabaja en **ambos sentidos** cuando las cargas se distribuyen hacia los apoyos en las dos direcciones. El **Método de Marcus** (Nilson, Cap. 12, Tablas pags. 378-380) entrega coeficientes tabulados según la relación `m = lx/ly` y el caso de borde (continuo o discontinuo).

---

## 1. Datos de Entrada

### 1.1 Materiales

```
f'c = 200 kg/cm²  (G20)
fy  = 4200 kg/cm²  (A630-420H)
γ_hormigón = 2500 kg/m³
```

### 1.2 Geometría de la Losa

```
Espesor losa: e = 18 cm = 0.18 m
Recubrimiento libre: r = 2.5 cm
Diámetro barra principal: φ8 → db = 0.8 cm
```

### 1.3 Peralte Efectivo

```
d = e - r - db/2
d = 18 - 2.5 - 0.8/2 = 18 - 2.5 - 0.4 = 15.1 cm ≈ 15 cm
```

> En losas en dos direcciones, el acero en la dirección `x` se coloca más abajo (capa exterior) y el de la dirección `y` va sobre él. Esto hace que `d_x ≠ d_y`. En la práctica se trabaja con un `d` único conservador.

---

## 2. Cálculo de Cargas de Diseño

### 2.1 Carga muerta (D) — Peso propio

```
D = γ_h · e = 2500 kg/m³ × 0.18 m = 450 kg/m²
```

### 2.2 Carga viva (L) — Sobrecarga de uso

```
L = 400 kg/m²  (sobrecarga de uso residencial, valor del enunciado)
```

### 2.3 Carga última de diseño (U) — Combinación LRFD

```
wu = 1.2·D + 1.6·L = 1.2 × 450 + 1.6 × 400
   = 540 + 640
   = 1180 kg/m²
```

> Para el cálculo de momentos positivos, separar las cargas:
> - `wu,D = 1.2 × D = 540 kg/m²`
> - `wu,L = 1.6 × L = 640 kg/m²`

---

## 3. Método de Marcus — Teoría y Coeficientes

### 3.1 Fórmula de momentos

Los momentos de diseño se obtienen para cada franja de **1 metro de ancho** de la losa:

```
Mi = Ci · wu · lx²     [kg·m/m]
```

| Símbolo | Descripción |
|---------|-------------|
| `Ci` | Coeficiente de Marcus (de tabla, según caso y relación m) |
| `wu` | Carga última [kg/m²] |
| `lx` | Dimensión corta de la losa [m] |
| `Mi` | Momento de diseño por metro lineal [kg·m/m] |

### 3.2 Relación de aspecto

```
m = lx / ly     (siempre ≤ 1.0, con lx = lado corto)
```

### 3.3 Tipos de momentos que entrega la tabla

| Momento | Símbolo | Descripción |
|---------|---------|-------------|
| Negativo en borde continuo | `Ca,neg` / `Cb,neg` | Borde apoyado sobre viga continua |
| Positivo por carga muerta | `Ca,d` / `Cb,d` | Momento positivo al centro |
| Positivo por carga viva | `Ca,l` / `Cb,l` | Momento positivo al centro |

> `a` = dirección del eje corto (x) · `b` = dirección del eje largo (y)

### 3.4 Momento positivo total

```
Ma(+) = Ca,D · wu,D · lx²  +  Ca,L · wu,L · lx²
Mb(+) = Cb,D · wu,D · lx²  +  Cb,L · wu,L · lx²
```

### 3.5 Momento en bordes discontinuos (sin continuidad)

En los bordes donde la losa no es continua (borde libre o sobre viga de borde):

```
M_borde_discontinuo = (1/3) · M_positivo del mismo sentido
```

---

## 4. Cálculo de Armadura por Momento — Metodología General

El procedimiento es idéntico al diseño de vigas, aplicado por franja de **1 metro** de ancho (b = 100 cm).

### Paso 1: Calcular As requerido por momento

**Ecuación cuadrática directa:**

```
A · As² - B · As + Mu = 0

Donde:
  A = φ · fy² / (1.7 · f'c · b)
  B = φ · fy · d

As = (B - √(B² - 4·A·Mu)) / (2·A)
```

O bien, aproximación simplificada (válida para losas delgadas):

```
As ≈ Mu / (φ · fy · 0.9 · d)
```

> Mu en kg·cm, fy en kg/cm², d en cm → As en cm²

### Paso 2: Verificar armadura mínima para losas (NCh430 Art. 7.12)

```
ρ_min,losa = 0.0018    (para acero fy = 4200 kg/cm², i.e. A630-420H)
ρ_min,losa = 0.0020    (para acero fy = 2800 kg/cm², i.e. A440-280H)

As_min = ρ_min · b · e     (con b = 100 cm y e = espesor total)
As_min = 0.0018 × 100 × 18 = 3.24 cm²/m
```

> **Diferencia clave con vigas:** En losas se usa el espesor total `e` (no el peralte `d`) para calcular `As_min`.

### Paso 3: Adoptar el mayor valor

```
As_diseño = max(As_req , As_min)
```

### Paso 4: Seleccionar barras y espaciado

```
As_adoptado = n_barras · As_barra / espaciado × 100     [cm²/m]
```

**Tabla de referencia φ8:**

| Espaciado (cm) | As (cm²/m) |
|---------------|------------|
| 10 | 5.03 |
| 12 | 4.19 |
| 15 | **3.35** |
| 20 | 2.51 |
| 25 | 2.01 |
| 30 | 1.68 |

> La solución adoptada en el apunte es **φ8 @ 15 cm** (As = 3.35 cm²/m) como armadura base en ambas direcciones.

### Paso 5: Verificar espaciado máximo normativo

```
s_max = min(3·e, 450 mm)     NCh430 Art. 7.12.2.2
s_max = min(3 × 18, 45) = min(54, 45) = 45 cm
```

---

## 5. Aplicación — Ejemplo Detallado por Losa

### Configuración del campo de losas

```
    Eje 1        Eje 2        Eje 3
    |←— 3.0 m —→|←— 2.0 m —→|
Eje C ┌──────────┬─────────┐
      │          │         │
      │   L1     │   L2    │  4.0 m
      │  3×4 m   │  2×4 m  │
Eje B ├──────────┼─────────┤
      │          │         │
      │   L3     │   L4    │  5.0 m
      │  3×5 m   │  2×5 m  │
Eje A └──────────┴─────────┘
```

---

### 5.1 Losa L1 — 3.0 × 4.0 m

```
lx = 3.0 m  ·  ly = 4.0 m  ·  m = 3/4 = 0.75
Caso de apoyo: Caso 4 (bordes continuos en 3 lados, discontinuo en Eje 1 y Eje C)
```

**Momentos Negativos (bordes continuos):**
```
Ca,neg = 0.076  →  Ma(-) = 0.076 × 1180 × 3² = 807 kg·m/m
Cb,neg = 0.024  →  Mb(-) = 0.024 × 1180 × 4² = 453 kg·m/m

(Nota: Mb usa ly en la fórmula cuando el coeficiente es en dirección b)
```

**Momentos Positivos (separando D y L):**
```
Carga Viva (wu,L = 640 kg/m²):
  Ca,L = 0.052  →  Ma,L(+) = 0.052 × 640 × 3² = 300 kg·m/m
  Cb,L = 0.021  →  Mb,L(+) = 0.021 × 640 × 4² = 215 kg·m/m

Carga Muerta (wu,D = 540 kg/m²):
  Ca,D = 0.043  →  Ma,D(+) = 0.043 × 540 × 3² = 209 kg·m/m
  Cb,D = 0.013  →  Mb,D(+) = 0.013 × 540 × 4² = 112 kg·m/m

Total positivos:
  Ma(+) = 300 + 209 = 509 kg·m/m
  Mb(+) = 215 + 112 = 327 kg·m/m  (aprox. 276 en apunte por otros coeficientes)
```

**Momento en borde discontinuo (Eje 1 y Eje C):**
```
Ma,disc = (1/3) × Ma(+) = 509/3 = 170 kg·m/m
Mb,disc = (1/3) × Mb(+) = 276/3 =  92 kg·m/m
```

**Diseño de armadura — Caso Ma(-) = 807 kg·m/m (momento crítico):**
```
As_req = 807 × 100 / (0.9 × 4200 × 0.9 × 15) = 80,700 / 51,030 = 1.58 cm²/m
As_min = 0.0018 × 100 × 18 = 3.24 cm²/m

As_diseño = max(1.58, 3.24) = 3.24 cm²/m

→ Adoptar φ8 @ 15 cm  →  As = 3.35 cm²/m  ✓
```

---

### 5.2 Losa L2 — 2.0 × 4.0 m

```
lx = 2.0 m  ·  ly = 4.0 m  ·  m = 2/4 = 0.50
Caso de apoyo: Caso 2 (borde discontinuo en Eje 3)
```

**Momentos:**
```
Ma(+) = 324.5 kg·m/m
Mb(+) =  85.7 kg·m/m
```
→ As_req < As_min en todos los casos → **φ8 @ 15 cm** en ambas direcciones.

---

### 5.3 Losa L3 — 3.0 × 5.0 m

```
lx = 3.0 m  ·  ly = 5.0 m  ·  m = 3/5 = 0.60
Caso de apoyo: Caso 4 (continuos en B y 2, discontinuos en A y 1)
```

**Momentos críticos:**
```
Ma(-) = 881.4 kg·m/m  (borde continuo Eje 2)
Mb(-) = 619.5 kg·m/m  (borde continuo Eje B)
Ma(+) = 643.5 kg·m/m
Mb(+) = 123.3 kg·m/m
```
→ As_req < As_min → **φ8 @ 15 cm** domina.

---

### 5.4 Losa L4 — 2.0 × 5.0 m

```
lx = 2.0 m  ·  ly = 5.0 m  ·  m = 2/5 = 0.40
→ m < 0.5 → Técnicamente losa en UNA DIRECCIÓN
  Se diseña en la dirección corta únicamente como viga continua.
```

**Momentos:**
```
Ma(-) = 462.5 kg·m/m
Mb(-) = 147.5 kg·m/m
Ma(+) = 389   kg·m/m
Mb(+) =  46   kg·m/m
```
→ Todos controlados por As_min → **φ8 @ 15 cm** en ambas direcciones.

---

## 6. Armadura en Bordes entre Losas (Continuidad)

En el eje compartido entre dos losas se genera un **momento negativo de continuidad**. Se toman los momentos negativos de cada losa a cada lado y se usa el **mayor** de los dos:

```
M_neg,diseño = max(M_neg,losa_izq , M_neg,losa_der)
```

Si la diferencia entre ambos lados es mayor al 20%, se puede redistribuir el 20% del momento mayor hacia el menor (NCh430 Art. 8.4 — Redistribución de momentos).

---

## 7. Resumen — Plano de Armado

```
              Eje 1      Eje 2      Eje 3
              |          |          |
Eje C  ───────┤──────────┤──────────┤
              │ φ8@15cm  │ φ8@15cm  │ ← Sent. X
              │ φ8@15cm  │ φ8@15cm  │ ← Sent. Y
Eje B  ───────┤──────────┤──────────┤
              │ φ8@15cm  │ φ8@15cm  │ ← Sent. X
              │ φ8@15cm  │ φ8@15cm  │ ← Sent. Y
Eje A  ───────┴──────────┴──────────┘

Refuerzo superior en ejes continuos (B y 2): φ8@15cm (negativo)
Refuerzo inferior en luces (positivo): φ8@15cm
```

> **Resultado:** En este caso particular, la **armadura mínima** (φ8@15cm → 3.35 cm²/m) controla el diseño en la totalidad del campo de losas. Esto es común en losas de baja sobrecarga con hormigón G20 y acero A630-420H.

---

## 8. Flujo de Diseño — Resumen

```
1. GEOMETRÍA
   └─ Definir lx, ly, e (espesor losa)
   └─ Calcular m = lx/ly

2. TIPO DE LOSA
   ├─ m ≥ 0.5  → Dos direcciones → Método de Marcus
   └─ m < 0.5  → Una dirección  → Franjas como viga

3. CARGAS
   └─ wu = 1.2D + 1.6L  (carga total)
   └─ wu,D y wu,L por separado (para momentos positivos)

4. IDENTIFICAR CASO DE BORDE (Tabla Marcus)
   └─ Continuo / Discontinuo / Libre

5. CALCULAR MOMENTOS
   ├─ M_neg = C_neg × wu × lx²
   ├─ M_pos = C_D × wu,D × lx²  +  C_L × wu,L × lx²
   └─ M_borde_disc = (1/3) × M_pos

6. DISEÑO DE ARMADURA POR FRANJA (b = 100 cm)
   ├─ As_req = Mu / (φ × fy × 0.9 × d)
   ├─ As_min = ρ_min × b × e  (ρ_min = 0.0018 para A630-420H)
   └─ As_diseño = max(As_req, As_min)

7. SELECCIONAR BARRAS Y ESPACIADO
   └─ Verificar s ≤ min(3e, 45cm)

8. VERIFICAR CONTINUIDAD ENTRE LOSAS
   └─ En ejes compartidos: usar M_neg = max de ambos lados
```

---

## 9. Verificación de Espesor Mínimo (Control de Deflexiones)

NCh430 Art. 9.5.3 establece espesores mínimos para losas en dos direcciones:

```
e_min = ln / 33     (para losas sin vigas interiores)
```

Para losas con vigas de borde (caso del apunte):

```
e_min ≥ 90 mm     (mínimo absoluto)
e_min = ln × (800 + 0.2·fy) / (36000 + 9·β)
```

Donde `β = ly/lx` y `ln` es la luz neta menor.

**Verificación del apunte:**
```
e = 18 cm = 180 mm ≫ 90 mm  ✓
ln ≈ 3000 mm → e_min = 3000/33 = 91 mm  →  180 mm > 91 mm  ✓
```

---

## 10. Diferencias Clave entre Losas y Vigas

| Aspecto | Viga | Losa |
|---------|------|------|
| Ancho de diseño | b real (cm) | b = 100 cm (franja unitaria) |
| Armadura mínima | ρ_min × b × d | **ρ_min × b × e** (espesor total) |
| ρ_min (A630-420H) | 0.25√f'c/fy ó 1.4/fy | **0.0018 fijo** |
| Estribos | Sí, siempre | No se usan estribos (corte lo absorbe el hormigón) |
| Dirección | 1 dirección | 1 ó 2 direcciones |
| Armadura positiva | Solo en tracción | **Ambas caras en zonas de inversión de momento** |
| Refuerzo retráctil (temp.) | No requerido | **Sí, en dirección perpendicular a la armadura principal** |

---

*Documento elaborado en base al Apunte 2 — Tarea 7 Hormigón Armado (2022) y NCh430 Of.2008 / ACI 318-19.*  
*Tablas de coeficientes: Nilson, A.H., Darwin, D. & Dolan, C. (2004), Design of Concrete Structures, Cap. 12, pp. 378-380.*
