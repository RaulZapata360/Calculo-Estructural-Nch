/**
 * GEOMETRY.JS — Sistema de Coordenadas y Layout
 * Convierte entre mundo (metros) y SVG (píxeles)
 */

// Dynamic coordinate system — set from actual canvas size
const C = { scale: 120, ox: 180, oy: 530 };

/**
 * Recalcula el sistema de coordenadas basado en tamaño real del canvas
 */
function recalcLayout() {
  const canvas = document.getElementById('structural-canvas');
  const W = canvas.clientWidth || 800;
  const H = canvas.clientHeight || 600;
  canvas.setAttribute('width', W);
  canvas.setAttribute('height', H);

  // Fit the wall within canvas with margins
  const marginL = 200, marginR = 100, marginB = 120, marginT = 140;
  const totalL = typeof getTotalL === 'function' ? getTotalL() : S.geometry.L;
  const totalH = S.story?.H ?? S.geometry.H;
  const scaleX = Math.max(1, (W - marginL - marginR) / totalL);
  const scaleY = Math.max(1, (H - marginT - marginB) / totalH);
  C.scale = Math.min(scaleX, scaleY, 200);
  C.ox = marginL;
  C.oy = H - marginB;
}

/**
 * Convertir metros → píxeles (escala)
 */
const px = m => m * C.scale;

/**
 * Convertir coordenada mundial X → SVG X
 */
const sx = m => C.ox + px(m);

/**
 * Convertir coordenada mundial Y → SVG Y (invertida, porque SVG Y crece hacia abajo)
 */
const sy = m => C.oy - px(m);

/**
 * Coordenada Y para diagrama de momento (offset arriba o abajo del eje)
 */
const sy_moment = (yBase, mVal, msc, direction) => sy(yBase) + direction * mVal * msc;

/**
 * Coordenada Y para diagrama de corte (offset vertical para no solapar)
 */
const sy_shear = (yBase, vVal, sc, isTop) => sy(yBase) + (isTop ? 40 : -40) - vVal * sc;

/**
 * Prueba si un punto (px, py) en SVG está dentro de un rectángulo
 */
function hitTest(px, py, x, y, w, h) {
  return px >= x && px <= x + w && py >= y && py <= y + h;
}
