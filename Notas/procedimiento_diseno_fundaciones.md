# Procedimiento de Cálculo: Capacidad de Soporte en Fundaciones Superficiales

El siguiente procedimiento describe la metodología analítica para determinar la capacidad de soporte (o capacidad portante) última y admisible de fundaciones superficiales (zapatas aisladas o corridas) transmitidas al suelo, basándose en la formulación general clásica de **Hansen (1970)** y **Vesić (1973, 1975)**. 

Este enfoque considera los efectos combinados de la geometría de la zapata, inclinación de la carga, proximidad de taludes y presencia de nivel freático.

---

## 1. Identificación de la Estratigrafía y Parámetros del Suelo

Antes de aplicar cualquier ecuación, es fundamental definir el perfil del suelo bajo la zapata a partir de un ensayo de mecánica de suelos:

*   **Cohesión ($c$)**: En $\text{kPa}$ o $\text{kN/m}^2$.
*   **Ángulo de Fricción Interna ($\phi$)**: En grados.
*   **Peso Unitario del Suelo ($\gamma$)**: En $\text{kN/m}^3$. Si el suelo está bajo el agua, se debe usar el peso unitario sumergido/boyante ($\gamma'$).
*   **Profundidad del Nivel Freático (NF)**: Distancia desde la superficie hasta la napa de agua ($d_w$).
*   **Geometría de la Fundación**:
    *   Ancho de zapata ($B$).
    *   Largo de zapata ($L$).
    *   Profundidad de sello o desplante ($D_f$).

### Casos de Análisis: Drenado vs. No Drenado
1.  **Condición Drenada (Corto y Largo Plazo en Granulares):**
    *   Se aplica a arenas y gravas (SP, SM, GW, etc.).
    *   Se utilizan los parámetros efectivos de resistencia ($\phi'$ y $c'$).
    *   Las presiones de poros se disipan casi instantáneamente.
2.  **Condición No Drenada (Corto Plazo en Cohesivos):**
    *   Se aplica a arcillas saturadas (CH, CL).
    *   El análisis se realiza considerando que el agua no tiene tiempo para escapar, por ende, el ángulo de fricción aparente es $\phi = 0^\circ$.
    *   La resistencia depende únicamente de la cohesión no drenada o resistencia al corte no drenada ($s_u$ o $c_u$).

---

## 2. Ecuación General de Capacidad de Soporte (Hansen)

La ecuación general que gobierna la rotura por corte del suelo establece la capacidad última $q_{ult}$ mediante tres sumandos principales (Término de cohesión + Término de sobrecarga + Término de gravedad/fricción):

$$q_{ult} = c \cdot N_c \cdot s_c \cdot d_c \cdot i_c \cdot g_c \cdot b_c + \bar{q} \cdot N_q \cdot s_q \cdot d_q \cdot i_q \cdot g_q \cdot b_q + 0.5 \cdot \gamma \cdot B' \cdot N_\gamma \cdot s_\gamma \cdot d_\gamma \cdot i_\gamma \cdot g_\gamma \cdot b_\gamma$$

Donde:
*   $\bar{q}$: Presión de sobrecarga efectiva al nivel de sello ($\bar{q} = \gamma \cdot D_f$).
*   $B'$: Ancho efectivo de la zapata considerando excentricidades de carga ($B' = B - 2e_B$).

---

## 3. Determinación de los Factores de la Ecuación

La metodología requiere obtener iterativa o tabuladamente cinco (5) tipos de factores empíricos:

### A. Factores de Capacidad de Soporte ($N_c, N_q, N_\gamma$)
Dependen exclusivamente del ángulo de fricción interna ($\phi$) del suelo de apoyo:
*   $N_q = e^{\pi \tan\phi} \tan^2(45^\circ + \phi/2)$
*   $N_c = (N_q - 1)\cot\phi$
*   $N_\gamma = 1.5(N_q - 1)\tan\phi$ *(Según Hansen)* ó $N_\gamma = 2(N_q + 1)\tan\phi$ *(Según Vesić)*.

### B. Factores de Forma ($s_c, s_q, s_\gamma$)
Toman en cuenta la proporción geométrica de la base ($B/L$). Para zapatas cuadradas, los factores premian el confinamiento tridimensional:
*   Por ejemplo, para zapata cuadrada en arena ($s_\gamma \approx 0.6$).

### C. Factores de Profundidad ($d_c, d_q, d_\gamma$)
Aprovechan la resistencia al corte del suelo ubicado por encima del sello de fundación. 
*   Dependen de la relación $D_f / B$. 
*   Para $D_f/B > 1$, se ajustan mediante el arco tangente ($\tan^{-1}(D_f/B)$ en radianes).
*   En el método de Hansen, generalmente $d_\gamma = 1.0$.

### D. Factores de Inclinación de la Carga ($i_c, i_q, i_\gamma$)
Si la zapata está sometida a momentos flectores o cargas de corte horizontales (ej: fuerza sísmica o empuje de viento), la resultante penetra el terreno con cierta inclinación, reduciendo drásticamente la capacidad de soporte (los factores $i$ serán menores a $1.0$). 
*   Si la carga es puramente vertical, $i_c = i_q = i_\gamma = 1.0$.

### E. Factores por Topografía y Base ($g, b$)
*   **Factor por Inclinación del Terreno ($g_c, g_q, g_\gamma$)**: Disminuyen la capacidad si la fundación se asienta sobre o cerca de un talud con inclinación $\beta$.
    *   Ejemplo ($\phi > 0$): $g_q = g_\gamma = (1 - 0.5 \tan\beta)^5$.
*   **Factor por Base Inclinada ($b_c, b_q, b_\gamma$)**: Se aplican cuando el sello de fundación tiene un ángulo de caída $\eta$ respecto a la horizontal.

---

## 4. Efecto del Nivel Freático (NF)

El agua reduce el esfuerzo efectivo entre las partículas granulares, reduciendo la capacidad de soporte a la mitad. Se presentan tres escenarios posicionales del NF ($d_w$):

1.  **Caso 1: NF por encima o al nivel de fundación ($0 \le d_w \le D_f$)**:
    *   La sobrecarga lateral $\bar{q}$ disminuye su peso efectivo por flotación: 
        $$\bar{q} = \gamma_{seco} \cdot d_w + \gamma' \cdot (D_f - d_w)$$
    *   El término de gravedad (el tercer término) usa netamente el peso boyante: $\gamma' = \gamma_{sat} - \gamma_w$.
2.  **Caso 2: NF por debajo de la fundación ($D_f < d_w < D_f + B$)**:
    *   La sobrecarga $\bar{q}$ utiliza el peso natural húmedo $\gamma$.
    *   El peso en la cuña de falla bajo la zapata es un promedio ponderado entre $\gamma_{húmedo}$ y $\gamma'$.
3.  **Caso 3: NF profundo ($d_w \ge D_f + B$)**:
    *   El agua no afecta la rotura. Se usa $\gamma$ natural en todos los términos.

---

## 5. Cálculo de la Capacidad Admisible y Verificación

Una vez determinado $q_{ult}$, se debe aplicar un Factor de Seguridad Global ($FS$), típicamente $FS = 3.0$ en condiciones estáticas y $FS = 2.0$ bajo cargas eventuales o sísmicas.

$$q_{adm} = \frac{q_{ult}}{FS}$$

### Verificación Final (Sobrecarga de la Estructura):
La tensión máxima teórica de contacto $\sigma_{contacto}$ generada por el peso del edificio (Carga Muerta + Viva de todas las columnas y losas) dividida por el área de la zapata real ($A = B \cdot L$), no debe superar a $q_{adm}$:

$$\sigma_{contacto} = \frac{\sum P_{estructura}}{B \cdot L} \le q_{adm}$$

*Si $\sigma_{contacto} > q_{adm}$, se debe **ampliar el ancho de la zapata ($B$)** o mejorar mecánicamente el suelo bajo la estructura.*
