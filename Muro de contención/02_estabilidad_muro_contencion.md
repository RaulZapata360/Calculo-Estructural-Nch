# 02. Guía de Cálculo: Estabilidad Externa de Muros de Contención

Esta guía establece el procedimiento detallado para la verificación de la estabilidad geotécnica externa de un muro de contención en voladizo (gravedad de hormigón armado) de acuerdo con los criterios normativos chilenos, tales como las combinaciones de carga de la norma **NCh3171**, la zonificación sísmica de la **NCh433** y las recomendaciones generales del Manual de Carreteras del MOP.

---

## 1. Teoría de Empujes de Suelo y Cargas Laterales

El muro de contención está sujeto a empujes horizontales debido a la masa de suelo retenida en su trasdós (lado trasero) y a las sobrecargas aplicadas sobre esta.

### 1.1 Empuje Activo Estático ($P_a$) - Teoría de Rankine
Se asume un relleno horizontal homogéneo sin cohesión ($c=0$), sin fricción entre el muro y el suelo ($\delta=0$), y drenaje libre (sin presión hidrostática). El coeficiente de empuje activo de Rankine ($K_a$) es:

$$K_a = \tan^2\left(45^\circ - \frac{\phi}{2}\right) = \frac{1 - \sin \phi}{1 + \sin \phi}$$

La presión activa a una profundidad $z$ medida desde la superficie del relleno es:
$$\sigma_a(z) = K_a \cdot \gamma \cdot z + K_a \cdot q$$

Donde:
*   $\gamma$: Peso unitario del suelo retenido ($\text{kN/m}^3$).
*   $q$: Sobrecarga distribuida uniforme en la superficie del relleno ($\text{kPa}$).

#### Fuerzas Activas por Metro Lineal ($kN/m$):
*   **Debido al peso del suelo ($P_{a,suelo}$):** Actúa a una altura de $H/3$ medida desde la base de la zapata.
    $$P_{a,suelo} = \frac{1}{2} K_a \cdot \gamma \cdot H^2$$
*   **Debido a la sobrecarga ($P_{a,sc}$):** Actúa a una altura de $H/2$ medida desde la base de la zapata.
    $$P_{a,sc} = K_a \cdot q \cdot H$$
*   **Fuerza activa total ($P_a$):**
    $$P_a = P_{a,suelo} + P_{a,sc}$$

*Nota: $H$ es la altura total del suelo retenido desde la base inferior de la zapata hasta la superficie libre del relleno ($H = H_{libre} + H_{emp} + H_f$).*

---

### 1.2 Incremento Sísmico de Empujes - Método de Mononobe-Okabe (M-O)
Debido a la sismicidad en Chile, se debe verificar la estabilidad del muro frente a solicitaciones dinámicas. La norma **NCh433** define la aceleración efectiva máxima del suelo ($A_0$) según la zona sísmica:

*   **Zona Sísmica 1:** $A_0 = 0.20g$
*   **Zona Sísmica 2:** $A_0 = 0.30g$ (Ej. Santiago)
*   **Zona Sísmica 3:** $A_0 = 0.40g$ (Zonas costeras)

De acuerdo con las directrices geotécnicas locales y el Manual de Carreteras, el coeficiente sísmico horizontal de diseño ($k_h$) y el vertical ($k_v$) se estiman como una fracción de la aceleración máxima, asumiendo cierto desplazamiento permisible en el muro:
$$k_h = C_s \cdot \left( \frac{A_0}{g} \right)$$
*(Donde $C_s$ suele tomarse entre $0.5$ y $0.6$ para muros que permiten pequeños desplazamientos de la parte superior).*
Típicamente, el coeficiente vertical se asume nulo ($k_v = 0$) por simplificación conservadora en el diseño de muros.

#### Coeficiente de Empuje Activo Dinámico ($K_{ae}$):
El ángulo de inercia sísmica ($\theta$) se define como:
$$\theta = \arctan\left( \frac{k_h}{1 - k_v} \right)$$

El coeficiente de empuje activo total (estático + dinámico) según Mononobe-Okabe para trasdós vertical y relleno horizontal es:

$$K_{ae} = \frac{\cos^2(\phi - \theta)}{\cos\theta \left( 1 + \sqrt{\frac{\sin\phi \cdot \sin(\phi - \theta)}{\cos\theta}} \right)^2}$$

#### Fuerza Sísmica Activa Total ($P_{ae}$):
$$P_{ae} = \frac{1}{2} K_{ae} \cdot \gamma \cdot H^2 (1 - k_v) + K_{ae} \cdot q \cdot H$$

El **Incremento Sísmico de Empuje ($\Delta P_e$)** se aísla restando la componente estática:
$$\Delta P_e = P_{ae} - P_a$$

*   **Punto de aplicación:** Mientras que el empuje estático del suelo se aplica a $H/3$ desde la base, el incremento sísmico se modela aplicándose a una altura de **$0.6H$** (o $0.5H$) desde la base de la zapata, representando la distribución invertida de presiones dinámicas.

---

### 1.3 Fuerzas Inerciales de la Estructura y del Relleno ($P_{ir}$)
En el análisis pseudoestático, además del empuje dinámico del suelo ($\Delta P_e$), el sismo induce fuerzas de inercia horizontales directamente proporcionales a las masas del muro y de la cuña de suelo que se mueve rígidamente con la zapata:
$$P_{ir} = k_h \cdot W$$

Estas fuerzas inerciales actúan en los centros de gravedad de cada elemento y empujan el muro en sentido desfavorable (hacia adelante), sumándose al volcamiento y deslizamiento:

1. **Fuerza Inercial de la Pantalla ($P_{ir,pantalla}$):**
   $$P_{ir,pantalla} = k_h \cdot W_{pantalla}$$
   * **Punto de aplicación (altura respecto a la base de la zapata):** $y_{ir,pant} = H_f + \frac{H_{stem}}{2}$
2. **Fuerza Inercial de la Zapata ($P_{ir,zapata}$):**
   $$P_{ir,zapata} = k_h \cdot W_{zapata}$$
   * **Punto de aplicación (altura respecto a la base de la zapata):** $y_{ir,zap} = \frac{H_f}{2}$
3. **Fuerza Inercial del Suelo sobre el Talón ($P_{ir,suelo}$):**
   Dado que la masa de suelo directamente apoyada sobre el talón se mueve de forma solidaria con la estructura, debe incluirse su inercia horizontal:
   $$P_{ir,suelo} = k_h \cdot W_{suelo}$$
   * **Punto de aplicación (altura respecto a la base de la zapata):** $y_{ir,suelo} = H_f + \frac{H_{stem}}{2}$

---

## 2. Fuerzas Actuantes y Resistentes

Para el análisis de estabilidad por metro lineal de muro, se determinan las fuerzas verticales ($V$) y horizontales ($H$), así como sus momentos volcantes ($M_o$) y resistentes ($M_r$) respecto al punto de giro situado en el extremo delantero inferior de la zapata (Punta o "Toe", $x = 0$):

```
                       │ █ █ █ █ █ Sobrecarga (q)
                       ▼ ▼ ▼ ▼ ▼ 
                      ┌───┐ 
                      │   │
                      │ P │ ◄─── Suelo Retenido (γ)
                      │ A │
                      │ N │ 
                      │ T │
        Terreno       │ A │   Pa (Fuerza lateral)
        Natural       │ L │ ◄─── (a H/3 o 0.6H)
        (frente)      │ L │
  ────────────────────┼───┤
    H_emp             │   │
  ┌───────────────────┴───┴───────┐
  │         ZAPATA (B_zap)        │
  └───────────────────────────────┘
  ▲                               ▲
  Punta (x=0)                     Talón (heel)
```

### 2.1 Cargas Verticales y Brazos de Momento
1.  **Peso Propio de la Pantalla ($W_{pantalla}$):**
    $$W_{pantalla} = \gamma_c \cdot t_{muro} \cdot (H_{libre} + H_{emp})$$
    *   Brazo desde la punta ($x_1$): $x_1 = B_{toe} + \frac{t_{muro}}{2}$
2.  **Peso Propio de la Zapata ($W_{zapata}$):**
    $$W_{zapata} = \gamma_c \cdot B_{zap} \cdot H_f$$
    *   Brazo desde la punta ($x_2$): $x_2 = \frac{B_{zap}}{2}$
3.  **Peso del Suelo sobre el Talón ($W_{suelo}$):**
    $$W_{suelo} = \gamma_{relleno} \cdot B_{talon} \cdot (H_{libre} + H_{emp})$$
    *   Brazo desde la punta ($x_3$): $x_3 = B_{toe} + t_{muro} + \frac{B_{talon}}{2}$
4.  **Sobrecarga sobre el Talón ($W_{sc}$):**
    $$W_{sc} = q \cdot B_{talon}$$
    *   Brazo desde la punta ($x_4$): $x_4 = x_3$

*Donde:*
*   $\gamma_c$: Peso específico del hormigón armado (típicamente $25.0 \text{ kN/m}^3$ según NCh170/NCh1537).
*   $B_{talon} = B_{zap} - B_{toe} - t_{muro}$

**Resultante Vertical Total ($N$):**
$$N = W_{pantalla} + W_{zapata} + W_{suelo} + W_{sc}$$

**Momento Resistente Total ($M_r$):**
$$M_r = W_{pantalla} \cdot x_1 + W_{zapata} \cdot x_2 + W_{suelo} \cdot x_3 + W_{sc} \cdot x_4$$

---

### 2.2 Cargas Horizontales y Momentos Volcantes
Las fuerzas horizontales empujan el muro hacia adelante y tienden a volcarlo sobre la punta.

#### Caso A: Análisis Estático
*   **Fuerzas Horizontales Actuantes ($H_{act}$):**
    $$H_{act} = P_{a,suelo} + P_{a,sc}$$
*   **Momento Volcante ($M_o$):**
    $$M_o = P_{a,suelo} \cdot \left(H_f + \frac{H_{stem}}{3}\right) + P_{a,sc} \cdot \left(H_f + \frac{H_{stem}}{2}\right)$$
    *(donde $H_{stem} = H_{libre} + H_{emp}$)*

#### Caso B: Análisis Sísmico (Pseudoestático)
En el análisis pseudoestático, la fuerza horizontal actuante y el momento volcante acumulado se incrementan por el empuje dinámico del terreno ($\Delta P_e$) y por las fuerzas inerciales de la propia estructura y del suelo apoyado sobre el talón ($P_{ir}$):

*   **Fuerzas Horizontales Actuantes Sísmicas ($H_{act,sis}$):**
    $$H_{act,sis} = P_{a,suelo} + P_{a,sc} + \Delta P_e + P_{ir,pantalla} + P_{ir,zapata} + P_{ir,suelo}$$
*   **Momento Volcante Sísmico ($M_{o,sis}$):**
    $$M_{o,sis} = M_{o,estatico} + \Delta P_e \cdot (0.6 \cdot H_{total}) + P_{ir,pantalla} \cdot y_{ir,pant} + P_{ir,zapata} \cdot y_{ir,zap} + P_{ir,suelo} \cdot y_{ir,suelo}$$
    *(donde $M_{o,estatico}$ es el momento volcante sin sismo).*

---

## 3. Verificaciones de Estabilidad Externa (ASD)

De acuerdo con la norma **NCh3171**, la verificación geotécnica de estabilidad se realiza bajo el método de **Tensiones Admisibles (ASD)**.

### 3.1 Seguridad al Volcamiento ($FS_v$)
El factor de seguridad al volcamiento es la relación entre el momento que estabiliza el muro y el momento que tiende a voltearlo respecto a la punta (Toe):

*   **Caso Estático:**
    $$FS_{v,est} = \frac{M_r}{M_{o,estatico}}$$
*   **Caso Sísmico:**
    $$FS_{v,sis} = \frac{M_r}{M_{o,sis}}$$

#### Criterios de Aceptación:
*   **Condición Estática (Combinación $D + H$):**
    $$FS_{v,est} \ge 1.5$$
*   **Condición Sísmica (Combinación $D + 0.7E + H_{din}$):**
    $$FS_{v,sis} \ge 1.15 \quad (\text{o } 1.20 \text{ según requerimiento específico del proyecto})$$

---

### 3.2 Seguridad al Deslizamiento ($FS_d$)
El factor de seguridad al deslizamiento es la relación entre la fuerza resistente en el plano de contacto base–suelo y el empuje horizontal total.

#### Fuerza de Resistencia al Deslizamiento ($F_{res}$):
La resistencia se genera por la fricción y la cohesión en la base de la zapata:
$$F_{res} = N \cdot \tan(\delta_b) + c_a \cdot B_{zap}$$

Donde:
*   $\delta_b$: Ángulo de fricción base-suelo. Conservadoramente se adopta $\delta_b = \frac{2}{3}\phi_{fundacion}$.
*   $c_a$: Cohesión de adhesión base-suelo. Se suele tomar $c_a = \frac{2}{3}c_{fundacion}$.

#### Omisión del Empuje Pasivo ($P_p$):
> [!IMPORTANT]
> Siguiendo una **práctica de diseño conservadora estándar en Chile**, se asume la **omisión total del empuje pasivo ($P_p = 0$)** del terreno ubicado frente al pie de la zapata. Esto resguarda la estructura frente a pérdidas de confinamiento por:
> 1. Excavaciones futuras no controladas para el tendido de tuberías o urbanización.
> 2. Desgaste o erosión superficial del terreno natural in situ.
> 3. Pérdida de confinamiento durante el proceso constructivo.

El factor de seguridad al deslizamiento se calcula como:
*   **Caso Estático:**
    $$FS_{d,est} = \frac{F_{res}}{H_{act}}$$
*   **Caso Sísmico:**
    $$FS_{d,sis} = \frac{F_{res,sis}}{H_{act,sis}}$$
    *(donde $F_{res,sis} = N_{sis} \cdot \tan(\delta_b) + c_a \cdot B_{zap}$. Si se considera aceleración vertical sísmica $k_v$ desfavorable ascendente, $N_{sis} = N - k_v \cdot W_{total}$, reduciendo la fuerza normal estabilizadora).*

#### Criterios de Aceptación:
*   **Condición Estática:**
    $$FS_{d,est} \ge 1.5$$
*   **Condición Sísmica:**
    $$FS_{d,sis} \ge 1.15 \quad (\text{o } 1.20 \text{ en infraestructuras críticas})$$

---

## 4. Presiones de Contacto y Excentricidad

La excentricidad de la resultante vertical en la base de la zapata afecta la distribución de las presiones de contacto sobre el sello de fundación.

### 4.1 Posición de la Resultante ($x_R$) y Excentricidad ($e$)
La distancia desde la punta ($x=0$) hasta el punto de aplicación de la fuerza resultante vertical es:
*   **Caso Estático:**
    $$x_R = \frac{M_r - M_{o,estatico}}{N}$$
    $$e = \frac{B_{zap}}{2} - x_R$$
*   **Caso Sísmico:**
    $$x_{R,sis} = \frac{M_{r,sis} - M_{o,sis}}{N_{sis}}$$
    $$e_{sis} = \frac{B_{zap}}{2} - x_{R,sis}$$
    *(donde $M_{r,sis}$ es el momento estabilizador sísmico. Si $k_v = 0$, entonces $M_{r,sis} = M_r$ y $N_{sis} = N$).*

*   Si $e > 0$, la resultante se desplaza hacia la punta (delante).
*   Si $e < 0$, la resultante se desplaza hacia el talón (detrás).

---

### 4.2 Distribución de Presiones en el Sello

#### Caso A: Resultante dentro del Tercio Medio ($|e| \le \frac{B_{zap}}{6}$)
La zapata se encuentra completamente apoyada, con un diagrama de presiones trapezoidal (o rectangular si $e=0$). No hay tensiones de tracción.
$$\sigma_{contacto} = \frac{N}{B_{zap}} \left( 1 \pm \frac{6e}{B_{zap}} \right)$$

*   **Presión Máxima (en la punta, si $e > 0$):**
    $$q_{punta} = \frac{N}{B_{zap}} \left( 1 + \frac{6|e|}{B_{zap}} \right)$$
*   **Presión Mínima (en el talón, si $e > 0$):**
    $$q_{talon} = \frac{N}{B_{zap}} \left( 1 - \frac{6|e|}{B_{zap}} \right)$$

#### Caso B: Resultante fuera del Tercio Medio ($|e| > \frac{B_{zap}}{6}$)
Dado que el suelo no tiene resistencia a la tracción, la zapata se levantará parcialmente en el talón. El diagrama de presiones se vuelve triangular para mantener el equilibrio estático (según el método de Meyerhof):
*   **Longitud de apoyo efectiva ($L_{apoyo}$):**
    $$L_{apoyo} = 3 \cdot x_R = 3 \cdot \left( \frac{B_{zap}}{2} - |e| \right)$$
*   **Presión Máxima (en la punta):**
    $$q_{punta} = \frac{2N}{3 \cdot x_R}$$
*   **Presión Mínima (en el talón):**
    $$q_{talon} = 0$$

---

### 4.3 Verificación de Tensiones Admisibles

Para evitar fallas por corte del suelo de fundación (hundimiento) y asentamientos excesivos:

$$\sigma_{contacto,max} \le q_{adm}$$

Donde:
*   $\sigma_{contacto,max} = q_{punta}$ (por lo general).
*   $q_{adm}$: Capacidad admisible calculada en la guía `01_capacidad_soporte_suelo.md`.
    *   Para condición estática se compara con el $q_{adm}$ estático ($FS=3.0$).
    *   Para condición sísmica se compara con el $q_{adm}$ sísmico ($FS=2.0$).
