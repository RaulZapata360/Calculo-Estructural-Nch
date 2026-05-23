# Skill: Diseño por Combinaciones de Carga Crítica

## Procedimiento: Iteración de Armadura por Combinación de Cargas Críticas

**Contexto:** Este procedimiento implementa el diseño iterativo de armadura en columnas/muros que reciben cargas horizontales (viento/sismo) combinadas con cargas verticales, según NCh430/ACI 318-19.

### 1. Ingreso de Datos

Antes de iniciar el diseño, asegurar que están definidos:

#### 1.1 Geometría
- **H**: Altura de la columna/muro (m)
- **b**: Ancho de la sección (cm)
- **h**: Altura/peralte de la sección (cm)
- **r**: Recubrimiento libre (cm) → d = h - r - db_estribo - db_long/2

#### 1.2 Materiales (NCh430)
- **f'c**: Resistencia del hormigón (MPa) [20, 25, 30, 35]
- **fy**: Fluencia del acero (MPa) [280 o 420 para acero estructural chileno]

#### 1.3 Cargas en Coronación
- **P**: Carga puntual en el extremo (kN) [ej: Metalcon 4.0 kN]
- **w_wind**: Carga distribuida lateral por viento (kN/m) [calculada según NCh432 o ingreso manual]
- **w_sismo**: Carga distribuida lateral por sismo (kN/m) [calculada según NCh433 o ingreso manual]

---

### 2. Generación de Casos de Carga (Superposición)

El sistema automáticamente genera **todos los casos relevantes**:

#### Caso 1: Base (sin cargas distribuidas)
```
V_base = P
M_base = P · H
```
**Nombre:** "Peso + Vertical"

#### Caso 2: Con viento (si w_wind > 0)
```
V_base = P + w_wind · H
M_base = P · H + (w_wind · H²) / 2
```
**Nombre:** "Peso + Vertical + Viento"

#### Caso 3: Con sismo (si w_sismo > 0)
```
V_base = P + w_sismo · H
M_base = P · H + (w_sismo · H²) / 2
```
**Nombre:** "Peso + Vertical + Sismo"

---

### 3. Selección del Caso Crítico

El sistema **selecciona automáticamente** el caso que produce el **máximo momento**:

```javascript
critical_case = max(M_caso1, M_caso2, M_caso3)
```

**Regla práctica:**
- Si w_wind > w_sismo → caso viento es crítico
- Si w_sismo > w_wind → caso sismo es crítico
- Si w_wind = w_sismo = 0 → caso base

---

### 4. Cálculo de Esfuerzos para Caso Crítico

Usando M y V del **caso crítico seleccionado**:

#### 4.1 Cortante máximo en base
```
Vu_base = (Caso crítico).V_base
```

#### 4.2 Momento máximo en base  
```
Mu_max = (Caso crítico).M_base
```

#### 4.3 Peralte efectivo
```
d = h - r - db_estribo - db_long/2  [cm]
```

---

### 5. Diseño de Armadura Longitudinal según NCh430

Seguir el procedimiento documentado en `diseno_armadura_NCh430.md`:

#### 5.1 Límites de armadura

**Cuantía mínima:**
```
ρ_min = max(0.25·√f'c / fy,  1.4/fy)
As_min = ρ_min · b · d
```

**Cuantía máxima:**
```
ρ_b = (0.85·β₁·f'c/fy) · (600/(600+fy))
ρ_max = 0.75·ρ_b
As_max = ρ_max · b · d
```

#### 5.2 Cálculo directo de As requerida (ecuación cuadrática)

```
A = φ·fy² / (1.7·f'c·b)
B = φ·fy·d
C = Mu

As = (B - √(B²-4AC)) / (2A)
```

Donde φ = 0.90 para flexión.

#### 5.3 Selección de barras comerciales

Adoptar: **As_adopto ≥ max(As_req, As_min)**

Verificar:
```
As_min ≤ As_adopto ≤ As_max  ✓
```

---

### 6. Diseño de Armadura de Corte (Estribos)

#### 6.1 Resistencia del hormigón a corte

```
Vc = 0.17·√f'c·b·d  [kN]  (f'c en MPa, b y d en mm)
```

#### 6.2 Fuerza en acero de corte

```
Vs = Vu/φ_v - Vc
φ_v = 0.75
```

#### 6.3 Espaciado de estribos

```
s = Av·fy·d / Vs  [mm]
```

Donde Av = 2 × área_barra_estribo (dos ramas por estribo).

#### 6.4 Límite normativo

```
s_max = min(d/2, 600mm)  [zona sin confinamiento especial]
s_max = min(d/4, 8·db_long, 24·db_est, 300mm)  [zona de confinamiento sísmico]
```

Adoptar: **s_adopto = min(s_calculado, s_max)**

---

### 7. Iteración y Validación

Si **φMn < Mu** ó **φVn < Vu**, aumentar armadura:

1. Volver a paso 5.2 con nueva combinación de barras
2. Recalcular φMn y φVn
3. Repetir hasta cumplir

---

### 8. Resultado Final

**Especificar en plano:**
- Barras longitudinales: **n·φdb_long** (cantidad × diámetro)
- Estribos: **φdb_est @ s_adopto** (diámetro @ espaciamiento)
- Recubrimiento: **r = [valor] cm**

**Ejemplo:**
```
Longitudinal: 4φ16
Estribos: φ8 @ 15cm (zona crítica), φ8 @ 25cm (zona intermedia)
Recubrimiento: 3 cm (ambiente normal)
```

---

## Diferencia Crítica: Carga Distribuida vs. Puntual

### Sin carga distribuida (caso simple)
```
Diagrama de cortante: RECTANGULAR (línea paralela a columna)
Diagrama de momento: LINEAL (triangular)

V(z) = P  (constante)
M(z) = P·(H-z)
```

### Con carga distribuida (caso combinado)
```
Diagrama de cortante: TRAPEZOIDAL (línea DIAGONAL)
Diagrama de momento: PARABÓLICO (curva)

V(z) = P + w·(H-z)
M(z) = P·(H-z) + w·(H-z)²/2
```

**Implicación de diseño:**
- El **momento es significativamente mayor** cuando hay distribución
- La **armadura aumenta** en el caso crítico
- El **diagrama se vuelve no lineal**

---

## Ejemplo Práctico

**Datos de entrada:**
- H = 2.5 m, b = 20 cm, h = 15 cm, r = 3 cm
- f'c = 25 MPa, fy = 420 MPa
- P = 4.0 kN, w_wind = 2.5 kN/m, w_sismo = 1.5 kN/m

**Cálculo de casos:**

| Caso | V_base | M_base | Crítico |
|------|--------|--------|---------|
| Peso + Vertical | 4.0 | 10.0 | — |
| Peso + Viento | 4.0 + 2.5×2.5 = 10.25 | 4×2.5 + 2.5×2.5²/2 = **17.81** | ✓ |
| Peso + Sismo | 4.0 + 1.5×2.5 = 7.75 | 4×2.5 + 1.5×2.5²/2 = **14.69** | — |

**Caso crítico:** "Peso + Vertical + Viento" con Mu = 17.81 kN·m

**Diseño:**
- As_req ≈ 6.31 cm² (por ecuación cuadrática)
- As_min ≈ 3.00 cm² 
- As_adopto = **8φ12** (As = 9.05 cm²) ✓
- Estribos: **φ8 @ 15 cm**

---

## Referencias Normativas

- **NCh430 Of.2008**: Diseño de estructuras de hormigón armado
- **ACI 318-19**: Building Code Requirements for Structural Concrete
- **NCh432 Of.2010**: Diseño sísmico de edificios (sobrecarga de nieve)
- **NCh433 Of.2009**: Diseño sísmico de edificios

---

**Última actualización:** 2026-05-17  
**Responsable:** Sistema EstructuraCalc v2.1
