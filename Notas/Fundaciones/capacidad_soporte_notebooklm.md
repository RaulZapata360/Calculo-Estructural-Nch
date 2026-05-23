# Documento de Cálculo: Capacidad de Soporte en Cimentaciones Superficiales

La estimación de la capacidad portante (o capacidad de soporte) es un componente fundamental en el diseño geotécnico, ya que define la carga máxima que puede soportar el suelo antes de fallar por corte [1]. A continuación se detalla el proceso de cálculo paso a paso, integrando las condiciones del suelo, las ecuaciones generales y los ajustes por proximidad a taludes.

## 1. Evaluación de Condiciones Drenadas y No Drenadas
Antes de iniciar el cálculo, es necesario distinguir el tipo de suelo y sus condiciones de drenaje, ya que esto determina los parámetros de resistencia a utilizar:
*   **Condiciones No Drenadas:** Las arcillas y los limos tienen baja permeabilidad, por lo que su capacidad portante se ajusta a condiciones sin drenaje [2, 3]. En este caso, el análisis se realiza en términos de esfuerzos totales utilizando la cohesión no drenada ($c_u$) y asumiendo un ángulo de fricción interna nulo ($\phi = 0$) [3, 4].
*   **Condiciones Drenadas:** Las arenas y gravas, debido a su alta permeabilidad, se evalúan en condiciones drenadas [3]. En este caso, el cálculo se basa en parámetros efectivos, utilizando el ángulo de fricción interna ($\phi > 0$) y la cohesión efectiva ($c$) [3, 5].

## 2. Ecuación General de Capacidad de Carga
La capacidad de soporte última ($q_{ult}$ o $q_u$) depende de factores como la profundidad de fundación, forma geométrica, inclinación del terreno, pesos unitarios y parámetros de resistencia al corte [6]. Partiendo de la ecuación fundamental de Terzaghi, diversos autores (Meyerhof, Hansen, Vesic) han propuesto una ecuación generalizada que incorpora factores de corrección [6, 7].

La expresión general para la capacidad de carga es:
$q_{ult} = c N_c F_{cs} F_{cd} F_{ci} + q N_q F_{qs} F_{qd} F_{qi} + \frac{1}{2} \gamma B N_\gamma F_{\gamma s} F_{\gamma d} F_{\gamma i}$ [6, 8, 9]

Donde:
*   $c$: Cohesión del suelo [8, 10].
*   $q$: Esfuerzo efectivo o sobrecarga al nivel del sello de fundación ($q = \gamma \cdot D_f$) [8, 9].
*   $\gamma$: Peso unitario del suelo bajo la cimentación [8, 9].
*   $B$: Ancho de la cimentación [8, 9].
*   $N_c, N_q, N_\gamma$: Factores de capacidad de soporte en función del ángulo de fricción ($\phi$) [8].
*   $F_{cs}, F_{qs}, F_{\gamma s}$: Factores de forma (también denotados como $s_c, s_q, s_\gamma$) [8, 9].
*   $F_{cd}, F_{qd}, F_{\gamma d}$: Factores de profundidad (también denotados como $d_c, d_q, d_\gamma$) [8, 9].
*   $F_{ci}, F_{qi}, F_{\gamma i}$: Factores de inclinación de la carga (también denotados como $i_c, i_q, i_\gamma$) [8, 9].

## 3. Factores de Capacidad de Carga ($N_q, N_c, N_\gamma$)
Estos factores adimensionales dependen del ángulo de fricción interna del suelo ($\phi$). Se calculan de la siguiente manera:

*   **Factor por sobrecarga ($N_q$):**
    $N_q = e^{\pi \tan \phi} \tan^2(45 + \phi/2)$ [11]
    (Hansen y Vesic también lo expresan equivalentemente como $N_q = e^{\pi \tan \phi} (\frac{1 + \sin \phi}{1 - \sin \phi})$) [12].

*   **Factor por cohesión ($N_c$):**
    $N_c = (N_q - 1)\cot \phi$ [7, 11, 12]

*   **Factor por peso específico ($N_\gamma$):** Este factor varía según la teoría del autor utilizada:
    *   *Meyerhof:* $N_\gamma = (N_q - 1)\tan(1.4\phi)$ [13]
    *   *Hansen:* $N_\gamma = 1.5(N_q - 1)\tan \phi$ [12, 14]
    *   *Vesic:* $N_\gamma = 2(N_q + 1)\tan \phi$ [15]

**Nota para condición no drenada ($\phi = 0$):**
En arcillas saturadas, los factores adoptan valores fijos: $N_c = 5.14$, $N_q = 1$, y $N_\gamma = 0$ [16]. 

## 4. Ajustes por Proximidad a Taludes (Terrenos Inclinados)
Cuando la cimentación se ubica sobre o adyacente a un talud, su comportamiento y mecanismo de falla se ven sustancialmente modificados debido a la falta de confinamiento lateral [17, 18]. Existen diversas metodologías analíticas para realizar estos ajustes:

### Método de Meyerhof (1957)
Meyerhof replanteó la ecuación utilizando factores de capacidad de carga modificados ($N_{cq}$ y $N_{\gamma q}$) que dependen de la inclinación del talud ($\beta$) y de la distancia al borde del talud ($b$) obtenidos mediante ábacos [4].
La ecuación propuesta es:
$q_u = c N_{cq} + \frac{1}{2} \gamma B N_{\gamma q}$ [4]
*   Para un **suelo puramente cohesivo** ($\phi = 0$, condición no drenada), la ecuación se reduce a:
    $q_u = c N_{cq}$ [4]
    El factor $N_{cq}$ depende de $\beta$ y del número de estabilidad del talud $N_s = \frac{\gamma H}{c}$ (donde $H$ es la altura del talud) [19].
*   Para un **suelo puramente granular** ($c = 0$), la ecuación se reduce a:
    $q_u = \frac{1}{2} \gamma B N_{\gamma q}$ [19]

### Método de Hansen (1970)
Hansen introdujo factores correctores específicos de talud ($\lambda_{q\beta}, \lambda_{\gamma\beta}, \lambda_{c\beta}$) asumiendo que la cimentación está justo en el borde del talud ($b=0$) [12]. La ecuación es:
$q_u = c N_c \lambda_{c\beta} + q N_q \lambda_{q\beta} + \frac{1}{2} \gamma B N_\gamma \lambda_{\gamma\beta}$ [12]
Donde:
*   $\lambda_{q\beta} = \lambda_{\gamma\beta} = (1 - \tan \beta)^2$ [12]
*   $\lambda_{c\beta} = \frac{N_q \lambda_{q\beta} - 1}{N_q - 1}$ (para $\phi > 0$) [12]
*   $\lambda_{c\beta} = 1 - \frac{2\beta}{\pi + 2}$ (para $\phi = 0$) [12]

Alternativamente, Hansen plantea factores de terreno ($g_i$) cuando la base está cercana a un talud con inclinación $\beta$:
*   $g_c = 1 - \beta^\circ / 147^\circ$ [20]
*   $g_q = g_\gamma = (1 - 0.5 \tan \beta)^5$ [20]

### Método de Vesic (1975)
Vesic desarrolló una teoría muy similar a la de Hansen, aplicando la misma ecuación general con ligeras diferencias en los factores [21].
Para la condición $\phi = 0$, Vesic establece un factor $N_\gamma$ negativo debido a la ausencia del peso aportado por el suelo faltante en la pendiente:
$N_\gamma = -2\sin \beta$ [21]
De forma que, para $\phi = 0$ (con $N_c=5.14$ y $N_q=1$), la ecuación queda:
$q_u = (5.14 - 2\beta)c + \gamma D_f(1 - \tan \beta)^2 - \gamma B \sin \beta (1 - \tan \beta)^2$ [21]

### Método de Georgiadis (2010) para Condiciones No Drenadas
A través de elementos finitos, Georgiadis propuso ajustar el factor $N_c$ para zapatas sobre taludes de arcilla sin drenaje ($\phi=0$) [22].
$q_u = C_u N_c$ [23]
El factor $N_c$ se calcula en función de la distancia normalizada $\lambda = b/B$ [23]:
*   Para $\lambda < \lambda_o$: $N_c = N_{Co} + (5.14 - N_{Co}) \frac{\lambda}{\lambda_o} [1 + \frac{\beta}{2}(1 - \frac{\lambda}{\lambda_o})]$ [23]
*   Para $\lambda \geq \lambda_o$: $N_c = 5.14$ [23] (Nota: La fuente proporciona la ecuación general, denotando que para distancias amplias el efecto desaparece).
Donde $\lambda_o = (\frac{5.14}{2})^\beta$ y $N_{Co} = 5.14 - \frac{2\beta}{1 - \frac{\gamma B}{5.14 C_u}}$ (con $\beta$ en radianes) [23].

## 5. Cálculo de la Capacidad de Soporte Admisible ($q_{adm}$)
Finalmente, la carga máxima que la cimentación soportará de forma segura es la capacidad admisible ($q_{adm}$), la cual resulta de dividir la capacidad de carga última ($q_{ult}$ o $q_u$) entre un Factor de Seguridad ($FS$) [24, 25].

$q_{adm} = \frac{q_{ult}}{FS}$ [24, 26]

**Valores típicos del Factor de Seguridad:**
*   **Caso Estático:** Usualmente se adopta un factor de seguridad de $FS = 3$ [24-26].
*   **Caso Sísmico / Eventual:** El factor de seguridad es menor y suele adoptarse $FS = 2$ [24, 27].

## 6. Consideraciones Especiales para Zapatas Corridas (Cimentaciones Continuas)
Las zapatas corridas son elementos cuya longitud es considerablemente mayor que su anchura, ideales para soportar muros de carga o hileras de columnas muy próximas. Debido a su geometría ($L \to \infty$), se deben considerar las siguientes particularidades:

### Factores de Forma Simplificados
Dado que la relación geométrica $B/L$ tiende a cero, **todos los factores de forma ($s_c$, $s_q$, $s_\gamma$) se asumen iguales a 1**. La ecuación de capacidad de carga se simplifica drásticamente para terreno horizontal (Terzaghi):
$q_c = c N_c + q N_q + 0.5 \gamma B N_\gamma$
*(Si ocurre una falla por corte local, los parámetros de cohesión se reducen a $\frac{2}{3}c$ y se utilizan factores modificados $N'_c, N'_q, N'_\gamma$).*

### Comportamiento frente a Taludes
Si la zapata corrida se ubica paralela a un talud, sufre una **falta de confinamiento lateral** en toda su extensión, pudiendo reducir la capacidad portante entre un 50% y 60%. En estos casos se emplean directamente las correcciones de Meyerhof o Georgiadis expuestas en la sección 4, sin reducción por efectos de tridimensionalidad.

### Diseño Estructural (Momentos Máximos)
Para el diseño de armadura en zapatas corridas (sin vigas de fundación o contratrabes), el cuaderno menciona una metodología práctica que evita modelos complejos de elementos finitos (MEF). Utiliza coeficientes de ajuste $\delta$ basados en el módulo de reacción de la subrasante ($k_s$):
$M_u = \frac{P_u}{1000} \cdot M_{k0} \cdot \delta$
*   $P_u$: Carga máxima de diseño.
*   $M_{k0}$: Momento de la viga de referencia.
*   $\delta$: Coeficiente de ajuste (extraído de tablas según la geometría y el tipo de suelo).
