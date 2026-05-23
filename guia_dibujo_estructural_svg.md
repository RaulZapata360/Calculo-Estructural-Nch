# Guía Práctica y Reglas para Dibujo Estructural en SVG

Este documento recopila las directrices, consideraciones técnicas y buenas prácticas aprendidas iterativamente para la generación de planimetría y esquemas estructurales (especialmente albañilería confinada y hormigón armado) utilizando SVG paramétrico. El objetivo es que estos dibujos reflejen con precisión el proceso constructivo real y eviten inconsistencias gráficas.

## 1. Tratamiento de Nudos y Confinamiento
- **Prioridad en las Intersecciones:** En las uniones entre pilares y cadenas (nudos), las armaduras longitudinales del pilar pasan, pero **los estribos del pilar NO deben dibujarse dentro del volumen de la cadena**.
- **Distribución de Estribos por Vanos:** Los estribos de los pilares deben calcularse y distribuirse de forma independiente para cada tramo libre (vano). La distribución debe comenzar a una distancia mínima (ej. 5 cm) desde la cara superior o inferior de la cadena más cercana, y avanzar hacia el centro del vano. Esto asegura que el nudo quede limpio, tal como se armaría en terreno.

## 2. Detallamiento de Armaduras y Anclajes
- **Ganchos de Anclaje (Ld):** Si la cubicación o el cuadro de especificaciones indica un "Largo Total de Corte" que incluye ganchos, el dibujo **debe mostrar explícitamente los ganchos** en los extremos correspondientes. Por ejemplo, la armadura longitudinal de un pilar debe doblarse formando un gancho al llegar a la zapata (inferior) y a la cadena de coronación (superior).
- **Consistencia Matemática:** La suma visual de las longitudes rectas (descontando los recubrimientos) más la longitud de los ganchos debe coincidir con el largo de corte indicado en los textos y tablas.

## 3. Recubrimientos (Cover)
- **Posicionamiento Visual:** Las cotas de recubrimiento (ej. `r = 2.5 cm` o `r = 4.0 cm (hacia terreno)`) deben ser claras y apuntar exactamente a la separación entre la armadura y el borde exterior del elemento de hormigón.
- **Diferenciación de Bordes:** Considerar que los recubrimientos cambian dependiendo de si la cara está expuesta a terreno (mayor recubrimiento, ej. 4-5 cm) o hacia el interior/moldaje (ej. 2-2.5 cm).

## 4. Legibilidad y Textos (Evitar Superposiciones)
- **Cero Superposición:** Es una regla estricta que ningún texto, cota o línea indicadora debe cruzarse ni sobreponerse a otra. La sobreposición destruye la legibilidad del plano.
- **Uso Inteligente del Espacio (Callouts):** 
  - Utiliza los espacios en blanco alrededor de la estructura para posicionar las llamadas (callouts).
  - Si un texto está a la izquierda, usa `text-anchor="end"`; si está a la derecha, usa `text-anchor="start"`.
  - Juega con las coordenadas (Y) y los ángulos de las líneas indicadoras para separar etiquetas que estén lógicamente cerca (ej. diámetro del acero vs. longitud de corte).
- **Zonas Limpias:** Evita poner textos descriptivos directamente sobre las líneas de las armaduras densas. Extrae la información hacia afuera mediante líneas de referencia de un color tenue pero visible.

## 5. Dimensionamiento General y Márgenes (ViewBox)
- **Márgenes de Seguridad:** Asegúrate de que las cotas generales (acotamiento lateral, basal o superior) no queden cortadas por el límite del `viewBox` ni por el salto de página al imprimir.
- **Punto Base de Dibujo (`pyBase` / `px0`):** Al definir el lienzo paramétrico, deja suficiente espacio o "padding" interno (ej. restando 100-150px a la altura total) para que las cotas horizontales inferiores respiren correctamente y sean legibles en el formato PDF exportado.

## Resumen del Workflow de Verificación
Antes de dar por finalizado un esquema SVG estructural, realiza este checklist mental:
1. [ ] ¿Los estribos atraviesan los nudos de las cadenas? (No deben).
2. [ ] ¿Las armaduras tienen sus ganchos de anclaje dibujados si el cálculo los contempla?
3. [ ] ¿Hay algún texto chocando con una línea u otro texto?
4. [ ] ¿Están todas las cotas dentro del viewBox y visibles en el layout de impresión?
5. [ ] ¿Los recubrimientos coinciden visualmente con la separación dibujada?
