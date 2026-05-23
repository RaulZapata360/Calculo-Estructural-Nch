# Normativa Chilena: Diseño Sísmico

Resumen técnico de la norma **NCh 433 (1996 Mod. 2009)**.

## 1. Zonificación Sísmica (Sección 4.1)

Chile se divide en tres zonas de intensidad sísmica creciente de cordillera a mar.

| Zona Sísmica | Aceleración Efectiva $A_o$ | Ubicación Típica |
| :--- | :---: | :--- |
| **Zona 1** | $0.20g$ | Sectores cordilleranos |
| **Zona 2** | $0.30g$ | Valles centrales (Ej: Santiago) |
| **Zona 3** | $0.40g$ | Sectores costeros (Máximo riesgo) |

---

## 2. Clasificación de Suelos (Sección 4.2)

El comportamiento sísmico depende fuertemente del tipo de suelo de fundación.

| Tipo de Suelo | Descripción | Parámetro $S$ | $T_o$ (s) | $T'$ (s) | $n$ |
| :--- | :--- | :---: | :---: | :---: | :---: |
| **Suelo I** | Roca, suelo muy firme | 0.90 | 0.15 | 0.20 | 1.00 |
| **Suelo II** | Suelo firme, arena densa | 1.00 | 0.30 | 0.35 | 1.33 |
| **Suelo III** | Suelo medianamente denso | 1.20 | 0.40 | 0.45 | 1.80 |
| **Suelo IV** | Suelo blando | 1.30 | 0.90 | 1.00 | 1.80 |

---

## 3. Categoría de Ocupación e Importancia ($I$)

*   **Categoría I (Peligro bajo):** Estructuras aisladas, galpones ($I = 0.8$).
*   **Categoría II (Normal):** **Viviendas**, oficinas, hoteles ($I = 1.0$).
*   **Categoría III (Pública):** Colegios, iglesias, cines ($I = 1.2$).
*   **Categoría IV (Gubernamental/Emergencia):** Hospitales, cuarteles ($I = 1.4$).

---

## 4. Coeficientes de Respuesta ($R$)

Define la capacidad de disipación de energía de la estructura.

| Sistema Estructural | Coeficiente $R$ (Ductilidad) |
| :--- | :---: |
| **Hormigón Armado (Marcos/Muros)** | 7.0 |
| **Albañilería Confinada** | 4.0 |
| **Albañilería Armada** | 4.0 |
| **Madera** | 5.5 |

---

## 5. Esfuerzo de Corte Basal Mínimo ($V_{min}$)
La normativa exige que el corte de diseño no sea inferior a un valor mínimo, típicamente:
$$V_{min} = \frac{I \cdot A_o}{6g} \cdot P$$
*(Donde $P$ es el peso total de la estructura)*
