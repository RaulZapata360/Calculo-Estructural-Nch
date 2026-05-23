# Normativa Chilena: Cargas y Combinaciones

Resumen técnico de las normas **NCh 1537 (2009)** y **NCh 3171 (2010/2017)** enfocado en la construcción de viviendas.

## 1. Cargas de Uso (NCh 1537:2009)

Define las cargas vivas ($L$) mínimas para diferentes áreas de una vivienda.

| Área / Uso | Carga Uniforme (kN/m²) | Carga Concentrada (kN) |
| :--- | :---: | :---: |
| **Dormitorios y salas de estar** | 2.0 | 4.5 |
| **Cocinas y baños** | 2.0 | 4.5 |
| **Escaleras (viviendas)** | 2.0 | 4.5 |
| **Balcones y terrazas** | 3.0 | - |
| **Techos (pend. < 3%)** | 1.0 | 1.0 |
| **Techos (pend. > 3%)** | 0.4 (proy. horiz.) | 1.0 |

> [!NOTE]
> Para viviendas unifamiliares, se suele usar un valor general de **2.0 kN/m²** (aprox. 200 kg/m²) para pisos habitables.

---

## 2. Combinaciones de Carga (NCh 3171)

Establece cómo combinar las diferentes cargas (Muerta $D$, Viva $L$, Sismo $E$, Nieve $S$, Viento $W$) para el diseño estructural.

### 2.1 Método LRFD (Diseño por Resistencia Ultima)
Se usa típicamente para Hormigón Armado.

1.  $1.4D$
2.  $1.2D + 1.6L + 0.5(L_r \text{ o } S \text{ o } R)$
3.  $1.2D + 1.6(L_r \text{ o } S \text{ o } R) + (L \text{ o } 0.5W)$
4.  $1.2D + 1.0W + L + 0.5(L_r \text{ o } S \text{ o } R)$
5.  **$1.2D + 1.0E + L + 0.2S$ (Sismo Crítico)**
6.  $0.9D + 1.0W$
7.  **$0.9D + 1.0E$ (Volcamiento/Levantamiento)**

### 2.2 Método ASD (Tensiones Admisibles)
Se usa comúnmente para fundaciones y albañilería.

1.  $D$
2.  $D + L$
3.  $D + (L_r \text{ o } S \text{ o } R)$
4.  $D + 0.75L + 0.75(L_r \text{ o } S \text{ o } R)$
5.  $D \pm 0.6W$
6.  $D \pm 0.7E$
7.  $D + 0.75L + 0.75(0.6W) + 0.75(L_r \text{ o } S \text{ o } R)$
8.  $D + 0.75L + 0.75(0.7E) + 0.75S$
9.  $0.6D \pm 0.6W$
10. $0.6D \pm 0.7E$

---

## 3. Definición de Cargas
*   **$D$ (Dead):** Peso propio de la estructura y elementos permanentes.
*   **$L$ (Live):** Cargas de uso (personas, muebles).
*   **$E$ (Earthquake):** Solicitaciones sísmicas (NCh 433).
*   **$L_r$ (Roof Live):** Carga viva en techo.
*   **$S$ (Snow):** Carga de nieve (NCh 431).
*   **$W$ (Wind):** Carga de viento (NCh 432).
