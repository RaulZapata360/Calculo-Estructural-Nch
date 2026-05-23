# 03. Guía de Cálculo: Diseño Estructural de Muros de Contención

Esta guía describe el procedimiento de diseño estructural del hormigón armado para la pantalla (muro) y la zapata corrida de un muro de contención en voladizo. Se basa en las exigencias de la norma chilena **NCh430.Of2008** (que oficializa el reglamento **ACI 318** en Chile) y las combinaciones de carga de la **NCh3171**.

---

## 1. Bases de Diseño y Parámetros de los Materiales

El diseño se realiza por el método de **Diseño por Resistencia Última (LRFD)**. Las solicitaciones de servicio obtenidas en el análisis de estabilidad (ver guía `02_estabilidad_muro_contencion.md`) se mayoran por factores de carga y la resistencia nominal se reduce por factores de reducción ($\phi$).

### 1.1 Calidades de Materiales Comunes en Chile
*   **Hormigón:** Designado por su resistencia cilíndrica a los 28 días ($f'_c$).
    *   Ejemplo: **G25** o **G30** (donde $f'_c \ge 25 \text{ MPa}$ o $30 \text{ MPa}$ respectivamente).
    *   Peso específico del hormigón armado: $\gamma_c = 25.0 \text{ kN/m}^3$ (NCh1537).
*   **Acero de Refuerzo:** Barras con resaltes de alta ductilidad.
    *   Designación estándar: **A630-420H** (límite de fluencia nominal $f_y = 420 \text{ MPa}$ o $4200 \text{ kgf/cm}^2$).

### 1.2 Factores de Reducción de Resistencia ($\phi$)
*   **Flexión (secciones controladas por tracción):** $\phi_b = 0.90$
*   **Esfuerzo de Corte (cizalle):** $\phi_v = 0.75$

---

## 2. Combinaciones de Carga de Diseño (LRFD - NCh3171)

Para el diseño por resistencia última, las fuerzas internas (momentos flectores $M_u$ y cortantes $V_u$) se evalúan bajo las siguientes combinaciones límite de la norma **NCh3171**:

1.  **Caso Estático (Controlado por empuje de suelo):**
    $$U = 1.2 D + 1.6 H + 1.6 L$$
2.  **Caso Sísmico (Controlado por sismo + incremento sísmico de empujes):**
    $$U = 1.2 D + 1.0 E + L + 0.2 S$$
    $$U = 0.9 D + 1.0 E$$ (crítico para verificar tracción y flexión en el talón)

Donde:
*   $D$: Cargas muertas (peso propio del hormigón y del suelo estable).
*   $H$: Empuje lateral de tierra estático (suelo + sobrecargas en trasdós).
*   $L$: Sobrecargas de uso de corta duración.
*   $E$: Carga sísmica que incluye la inercia propia del muro y el incremento dinámico del empuje de tierra ($\Delta P_e$).
*   $S$: Carga de nieve (si aplica en zonas cordilleranas).

---

## 3. Diseño Estructural de la Pantalla (Stem)

La pantalla trabaja como una viga en voladizo empotrada en la zapata. La sección crítica para flexión y corte se localiza en la base de la pantalla (justo en la interfaz con la zapata, $z = H_{stem}$).

```
  ┌───┐ 
  │   │
  │   │ ◄─── Empuje Activo del Suelo (H)
  │   │
  │   │
  └───┘
 ═══════ ◄─── SECCIÓN CRÍTICA DE DISEÑO (Momento Mu, Cortante Vu)
 ┌─────┐
 │     │  Zapata
 └─────┘
```

### 3.1 Cálculo del Peralte Efectivo ($d$)
El peralte efectivo es la distancia desde la fibra extrema comprimida hasta el centroide de la armadura traccionada:
$$d = t_{muro} - rec - \frac{\phi_{barra}}{2}$$

De acuerdo con **NCh430 §6.4 / ACI 318**:
*   **Recubrimiento mínimo ($rec$):** **5.0 cm** (50 mm) para caras en contacto con el suelo pero encofradas (cara posterior expuesta al relleno). Si no hay encofrado y se vacía contra el suelo directo, el recubrimiento es **7.0 cm** (70 mm).

---

### 3.2 Diseño por Flexión (Armadura Vertical Posterior)
Para una franja unitaria de muro ($b = 1.0 \text{ m} = 1000 \text{ mm}$), se determina la cuantía de acero requerida para soportar el momento último mayorado ($M_u$):

1.  **Parámetro de Resistencia ($R_n$):**
    $$R_n = \frac{M_u}{\phi_b \cdot b \cdot d^2}$$
2.  **Cuantía de Acero Requerida ($\rho_{req}$):**
    $$\rho_{req} = \frac{0.85 \cdot f'_c}{f_y} \left( 1 - \sqrt{1 - \frac{2 \cdot R_n}{0.85 \cdot f'_c}} \right)$$
3.  **Área de Acero Necesaria ($As_{req}$):**
    $$As_{req} = \rho_{req} \cdot b \cdot d \quad [\text{cm}^2/\text{m}]$$

#### Armadura Mínima por Flexión y Retracción (NCh430 §14.3)
Para muros de contención sometidos a flexión, se deben cumplir los límites mínimos de cuantía para controlar la fisuración por retracción hidráulica y térmica:
*   **Cuantía Mínima Vertical ($\rho_{v,min}$):**
    *   $\rho_{v,min} = 0.0015$ (para barras deformadas de diámetro $\le 16 \text{ mm}$ o $\phi 5/8"$).
    *   $\rho_{v,min} = 0.0018$ (para otros casos).
*   **Cuantía Mínima Horizontal ($\rho_{h,min}$):**
    *   $\rho_{h,min} = 0.0020$ (para barras deformadas de diámetro $\le 16 \text{ mm}$).
    *   $\rho_{h,min} = 0.0025$ (para otros casos).

El área de acero final adoptada será:
$$As_{adoptado} = \max(As_{req}, \rho_{min} \cdot b \cdot t_{muro})$$

---

### 3.3 Diseño por Esfuerzo de Corte en la Pantalla
El esfuerzo de corte último en la base de la pantalla ($V_u$) debe ser resistido por el hormigón. Dado que colocar estribos en pantallas de muros de contención dificulta enormemente el hormigonado, la práctica estándar de diseño es **dimensionar el espesor de la pantalla ($t_{muro}$)** para que el hormigón resista por sí solo el corte sin necesidad de armadura de cizalle.

1.  **Resistencia al Corte del Hormigón ($\phi V_c$):**
    $$\phi V_c = \phi_v \cdot 0.17 \cdot \sqrt{f'_c} \cdot b \cdot d \quad (\text{en unidades SI: } f'_c \text{ en MPa, } b, d \text{ en mm})$$
    *(en unidades MKS: $\phi V_c = \phi_v \cdot 0.53 \cdot \sqrt{f'_c} \cdot b \cdot d$ con $f'_c$ en $\text{kgf/cm}^2$, $b, d$ en cm)*
2.  **Condición de Aceptación:**
    $$\phi V_c \ge V_u$$
    *   Si no se cumple la condición, se debe **aumentar el espesor del muro ($t_{muro}$)** y recalcular.

---

## 4. Diseño Estructural de la Zapata

La zapata se modela estructuralmente como dos voladizos sometidos a las presiones del terreno de fundación y al peso de los elementos sobre ellos.

```
                  ┌─────────┐
                  │ PANTALLA│
                  │         │
  ◄─── VOLADIZO   ├─────────┤   VOLADIZO ───►
      Punta (Toe) │ ZAPATA  │   Talón (Heel)
  ┌───────────────┴─────────┴───────────────┐
  │                                         │
  └─────────────────────────────────────────┘
```

### 4.1 Diseño de la Punta (Toe)
La punta vuela hacia adelante de la pantalla y tiende a flexionarse hacia arriba debido a las altas presiones de contacto con el suelo.

*   **Cargas Actuantes (hacia arriba):** Presión del suelo ($q_{punta}$ y distribución trapezoidal).
*   **Cargas Resistentes (hacia abajo, estabilizadoras):** Peso propio de la zapata en la punta ($\gamma_c \cdot H_f$) y peso del suelo de relleno frontal (si se considera).
*   **Momento Último ($M_{u,punta}$):** Evaluado en la cara anterior de la pantalla.
*   **Cortante Último ($V_{u,punta}$):** Evaluado a una distancia $d$ desde la cara anterior de la pantalla.
*   **Armadura:** Acero principal en la **cara inferior** de la zapata (longitudinal).

---

### 4.2 Diseño del Talón (Heel)
El talón vuela hacia atrás de la pantalla y tiende a flexionarse hacia abajo debido al peso de la gran cuña de suelo de relleno y de la sobrecargas aplicadas sobre él, las cuales superan las presiones de reacción ascendentes del suelo.

*   **Cargas Actuantes (hacia abajo):** Peso del suelo retenido sobre el talón ($W_{suelo}$), sobrecarga ($W_{sc}$) y peso propio de la zapata en el talón.
*   **Cargas Resistentes (hacia arriba):** Presión de contacto ascendente del suelo ($q_{talon}$ y distribución trapezoidal).
*   **Momento Último ($M_{u,talon}$):** Evaluado en la cara posterior de la pantalla (empotramiento).
*   **Cortante Último ($V_{u,talon}$):** Evaluado en la cara posterior de la pantalla.
*   **Armadura:** Acero principal en la **cara superior** de la zapata (longitudinal).

---

## 5. Especificaciones de Detallado y Disposición de Armaduras

Para garantizar la durabilidad y un comportamiento adecuado ante sismos, se deben seguir las siguientes reglas de detallado (NCh430):

1.  **Recubrimiento en Zapata:**
    *   **7.0 cm** (70 mm) en la base inferior (en contacto directo con el suelo, sin plantilla).
    *   **5.0 cm** (50 mm) en la cara superior y laterales.
2.  **Longitud de Desarrollo y Anclaje:**
    *   La armadura vertical de la pantalla debe prolongarse dentro de la zapata mediante un gancho estándar a $90^\circ$ orientado hacia el talón para garantizar un anclaje completo del momento de empotramiento.
3.  **Espaciamiento de Barras ($s$):**
    *   El espaciamiento máximo entre barras principales no debe superar a:
        $$s_{max} = \min(3 \cdot t_{muro}, 45 \text{ cm})$$
    *   En zonas sísmicas, se recomienda un espaciamiento máximo de **30 cm** para la armadura principal de flexión.

---

## 6. Resumen de Armaduras en Muro de Contención

El siguiente esquema resume la ubicación y denominación de las distintas barras en el muro:

```
                      │   │
                      │ 1 │ ◄─── 1. Armadura vertical de flexión (atrás)
                      │   │      (Resiste el empuje activo lateral)
                      ├───┤
                      │ 2 │ ◄─── 2. Armadura de retracción y temperatura (horizontal)
                      │   │
          ┌───────────┴───┴───────────┐
          │      ooo  3               │ ◄─── 3. Armadura superior del talón (flexión)
          │  ┌─────────────────────┐  │
          │  │ 4                   │  │ ◄─── 4. Armadura inferior de la punta (flexión)
          └──┴─────────────────────┴──┘
```
