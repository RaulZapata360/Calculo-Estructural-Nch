# Imágenes de Referencia para PDF

Este directorio contiene las imágenes de referencia técnicas (detalles de secciones transversales) que se integran automáticamente en el PDF de la Carpeta de Obra.

## Sistema de Mapeo Automático

El código en `memoryReport.js` (línea ~337) mapea automáticamente los elementos a sus imágenes:

```javascript
const imageMap = {
  'sobrecimiento': 'Sobrecimiento.png',
  'cadena_superior': 'Cadena Superior.png',
  'columna': 'Columna.png',
  'zapata': 'Sobrecimiento - Zapata.png',
  'foundation': 'Sobrecimiento - Zapata.png'
};
```

## Estructura de Imágenes

Cada imagen debe ser:
- **Formato**: PNG con fondo blanco
- **Resolución**: Mínimo 600×800 px para legibilidad en PDF
- **Contenido**: Sección técnica con todas las anotaciones (armadura, dimensiones, especificaciones)

## Convención de Nombres

Los nombres de archivo deben corresponderse con los elementos estructurales:

| Elemento | Nombre Archivo | Ubicación en PDF |
|----------|---|---|
| Sobrecimiento | `Sobrecimiento.png` | Página 6 (Sección Transversal) |
| Cadena Superior | `Cadena Superior.png` | Página 5 (Sección Transversal) |
| Columna/Pilar | `Columna.png` | Página 4 (Sección Transversal) |
| Zapata Excéntrica | `Sobrecimiento - Zapata.png` | Página 7 (Detalle Fundación) |

## Cómo Agregar una Nueva Imagen

### Paso 1: Preparar la Imagen
1. Crear la imagen técnica en AutoCAD, Illustrator o similar
2. Exportar como PNG (600×800 px mínimo)
3. Asegurar que tenga fondo blanco y líneas claras

### Paso 2: Guardar en esta Carpeta
Guardar con el nombre exacto de la tabla anterior:
```
C:\Users\raulz\OneDrive\Escritorio\Trabajo\Ingenieria\Estructuras\imagenes\Sobrecimiento.png
```

### Paso 3: Actualizar el Mapeo (si es necesario)
Si es un elemento nuevo no en la tabla, editar `memoryReport.js` línea ~337:
```javascript
const imageMap = {
  ...
  'tu_elemento': 'tu_imagen.png'
};
```

### Paso 4: Recargar y Generar PDF
1. Recargar navegador: `Ctrl+F5`
2. Generar PDF
3. Verificar que la imagen aparezca en lugar del SVG dinámico

## Comportamiento de Fallback

Si una imagen **no existe o no se carga**:
- El sistema muestra automáticamente el SVG dinámico (generado código)
- El PDF se genera correctamente, solo sin la imagen de referencia
- No hay errores; simplemente indica que falta el archivo de imagen

## Imágenes Actualmente Implementadas

✓ **Sobrecimiento.png** - Sección transversal 15×60 cm
   - Línea de integración: `memoryReport.js:618`
   - Mostrada en: Página 6, columna izquierda

## Imágenes Pendientes de Integración

Para agregar una imagen a una nueva sección:
1. Colocar imagen en esta carpeta
2. Encontrar la línea de código que genera el SVG:
   ```javascript
   ${pSvg(this._drawXS(b,h,elem.rebar,m,bDes,260,200))}
   ```
3. Reemplazar con:
   ```javascript
   ${pImg('NombreImagen.png', this._drawXS(b,h,elem.rebar,m,bDes,260,200))}
   ```
4. Actualizar el mapeo en `imageMap`

## Notas Técnicas

- Las imágenes se cargan vía referencia URL relativa (`imagenes/...`)
- Compatible con html2canvas y jsPDF
- Las imágenes se incrustan en el PDF final
- Tamaño máximo recomendado: 2 MB por imagen

---
**Última actualización**: 2026-05-18
