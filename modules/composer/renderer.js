/**
 * COMPOSER/RENDERER.JS — Renderizado SVG del Compositor
 *
 * Dibuja los elementos de CS en la capa #composer-layer.
 * Reutiliza el sistema de coordenadas de geometry.js (C, sx, sy, px).
 */

const ComposerRenderer = {

  // ── Helpers ───────────────────────────────────────────────────

  el(tag, attrs, parent) {
    const e = document.createElementNS('http://www.w3.org/2000/svg', tag);
    Object.entries(attrs).forEach(([k, v]) => e.setAttribute(k, v));
    if (parent) parent.appendChild(e);
    return e;
  },

  layer() {
    return document.getElementById('composer-layer');
  },

  ghostLayer() {
    return document.getElementById('composer-ghost-layer');
  },

  // ── Colores por tipo de elemento ──────────────────────────────
  COLORS: {
    'column':     { fill: 'rgba(47,129,247,0.22)', stroke: '#2f81f7', label: '#58a6ff' },
    'beam':       { fill: 'rgba(63,185,80,0.22)',  stroke: '#3fb950', label: '#56d364' },
    'wall-panel': { fill: 'rgba(210,153,34,0.18)', stroke: '#d29922', label: '#e3b341' },
    'footing':    { fill: 'rgba(139,92,246,0.22)', stroke: '#8b5cf6', label: '#a78bfa' },
  },

  LABEL: {
    'column':     'Pilar',
    'beam':       'Cadena',
    'wall-panel': 'Muro',
    'footing':    'Zapata',
  },

  // ── Dibujo principal ──────────────────────────────────────────

  draw() {
    const layer = this.layer();
    if (!layer) return;
    layer.innerHTML = '';

    // Si el compositor no está activo, no dibuja nada
    if (!S.composer || !S.composer.active) return;

    // Grid de referencia del compositor (puntos cada 10cm)
    this._drawSnapGrid(layer);

    // Elementos
    CS.elements.forEach(el => this._drawElement(el, layer, false));

    // Nodos de conexión
    CS.nodes.forEach(node => this._drawNode(node, layer));

    // Overlay de reconocimiento sobre marcos detectados
    CS.recognitions.forEach(comp => this._drawRecognition(comp, layer));
  },

  // ── Grid de puntos (solo en modo compositor) ──────────────────

  _drawSnapGrid(layer) {
    const g = CS.snapGrid;
    const canvas = document.getElementById('structural-canvas');
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const W = rect.width, H = rect.height;
    const v = S.ui.view;

    // Rango del mundo visible
    const worldX0 = (-v.x / v.zoom - C.ox) / C.scale;
    const worldX1 = ((W - v.x) / v.zoom - C.ox) / C.scale;
    const worldY0 = (C.oy - (H - v.y) / v.zoom) / C.scale;
    const worldY1 = (C.oy - (-v.y) / v.zoom) / C.scale;

    const snap = g;
    const xStart = Math.floor(worldX0 / snap) * snap;
    const yStart = Math.floor(worldY0 / snap) * snap;

    for (let wx = xStart; wx <= worldX1 + snap; wx += snap) {
      for (let wy = yStart; wy <= worldY1 + snap; wy += snap) {
        // Solo dibujar si está dentro de un rango razonable
        if (wx < -2 || wx > 30 || wy < -2 || wy > 15) continue;
        this.el('circle', {
          cx: sx(wx), cy: sy(wy), r: 1.2,
          fill: 'rgba(255,255,255,0.12)',
        }, layer);
      }
    }
  },

  // ── Elemento individual ───────────────────────────────────────

  _drawElement(el, layer, isGhost) {
    const c = this.COLORS[el.type] || this.COLORS['column'];
    const opacity = isGhost ? 0.55 : 1;

    if (el.type === 'column') {
      this._drawColumn(el, layer, c, isGhost, opacity);
    } else if (el.type === 'beam') {
      this._drawBeam(el, layer, c, isGhost, opacity);
    } else if (el.type === 'wall-panel') {
      this._drawWallPanel(el, layer, c, isGhost, opacity);
    } else if (el.type === 'footing') {
      this._drawFooting(el, layer, c, isGhost, opacity);
    }
  },

  _drawColumn(el, layer, c, isGhost, opacity) {
    const { section } = el;
    const b = section.b || 0.20;
    const svgX = sx(el.x1) - px(b) / 2;
    const svgY = sy(el.y2); // top (Y mayor)
    const W = px(b);
    const H = px(el.y2 - el.y1);

    this.el('rect', {
      x: svgX, y: svgY, width: W, height: H,
      fill: c.fill, stroke: c.stroke, 'stroke-width': isGhost ? 1.5 : 2,
      'stroke-dasharray': isGhost ? '5,3' : 'none',
      opacity,
    }, layer);

    if (!isGhost) {
      // Hatching
      this._drawHatch(svgX, svgY, W, H, c.stroke, layer);
      // Label
      this.el('text', {
        x: sx(el.x1), y: sy((el.y1 + el.y2) / 2),
        'text-anchor': 'middle', 'dominant-baseline': 'middle',
        fill: c.label, 'font-size': 9, 'font-family': 'Arial', 'font-weight': 'bold',
      }, layer).textContent = 'C';
    }
  },

  _drawBeam(el, layer, c, isGhost, opacity) {
    const { section } = el;
    const h = section.h || 0.15;
    const svgX = sx(el.x1);
    const svgY = sy(el.y1) - px(h) / 2;
    const W = px(el.x2 - el.x1);
    const H = px(h);

    this.el('rect', {
      x: svgX, y: svgY - H / 2, width: W, height: H,
      fill: c.fill, stroke: c.stroke, 'stroke-width': isGhost ? 1.5 : 2,
      'stroke-dasharray': isGhost ? '5,3' : 'none',
      opacity,
    }, layer);

    if (!isGhost) {
      this._drawHatch(svgX, svgY - H / 2, W, H, c.stroke, layer);
      this.el('text', {
        x: sx((el.x1 + el.x2) / 2), y: sy(el.y1),
        'text-anchor': 'middle', 'dominant-baseline': 'middle',
        fill: c.label, 'font-size': 9, 'font-family': 'Arial', 'font-weight': 'bold',
      }, layer).textContent = 'B';
    }
  },

  _drawWallPanel(el, layer, c, isGhost, opacity) {
    const svgX = sx(el.x1);
    const svgY = sy(el.y2);
    const W = px(el.x2 - el.x1);
    const H = px(el.y2 - el.y1);

    // Fondo
    this.el('rect', {
      x: svgX, y: svgY, width: W, height: H,
      fill: c.fill, stroke: c.stroke, 'stroke-width': isGhost ? 1.5 : 1.5,
      'stroke-dasharray': isGhost ? '5,3' : 'none',
      opacity,
    }, layer);

    if (!isGhost) {
      // Líneas de ladrillo (pattern manual simplificado)
      const rowH = Math.max(8, px(0.065)); // ~6.5 cm por hilada
      const nRows = Math.floor(H / rowH);
      for (let i = 1; i < nRows; i++) {
        this.el('line', {
          x1: svgX, y1: svgY + i * rowH,
          x2: svgX + W, y2: svgY + i * rowH,
          stroke: c.stroke, 'stroke-width': 0.5, opacity: 0.4,
        }, layer);
      }
      this.el('text', {
        x: svgX + W / 2, y: svgY + H / 2,
        'text-anchor': 'middle', 'dominant-baseline': 'middle',
        fill: c.label, 'font-size': 9, 'font-family': 'Arial', 'font-style': 'italic',
      }, layer).textContent = 'Muro';
    }
  },

  _drawFooting(el, layer, c, isGhost, opacity) {
    const svgX = sx(el.x1);
    const svgY = sy(el.y2);
    const W = px(el.x2 - el.x1);
    const H = px(el.y2 - el.y1);

    this.el('rect', {
      x: svgX, y: svgY, width: W, height: H,
      fill: c.fill, stroke: c.stroke, 'stroke-width': isGhost ? 1.5 : 2,
      'stroke-dasharray': isGhost ? '5,3' : 'none',
      opacity,
    }, layer);

    if (!isGhost) {
      this._drawHatch(svgX, svgY, W, H, c.stroke, layer);
      this.el('text', {
        x: svgX + W / 2, y: svgY + H / 2,
        'text-anchor': 'middle', 'dominant-baseline': 'middle',
        fill: c.label, 'font-size': 8, 'font-family': 'Arial',
      }, layer).textContent = 'Zap.';
    }
  },

  _drawHatch(x, y, w, h, stroke, layer) {
    const step = 8;
    for (let d = -h; d < w; d += step) {
      const x1c = Math.max(x, x + d);
      const y1c = (d < 0) ? y - d : y;
      const x2c = Math.min(x + w, x + d + h);
      const y2c = (d + h > w) ? y + w - d : y + h;
      if (x2c <= x1c) continue;
      this.el('line', {
        x1: x1c, y1: y1c, x2: x2c, y2: y2c,
        stroke, 'stroke-width': 0.5, opacity: 0.3,
      }, layer);
    }
  },

  // ── Nodos de conexión ─────────────────────────────────────────

  _drawNode(node, layer) {
    const isHub = node.elementIds.length >= 2;
    this.el('circle', {
      cx: sx(node.x), cy: sy(node.y),
      r: isHub ? 5 : 3.5,
      fill: isHub ? 'rgba(255,215,0,0.85)' : 'rgba(255,255,255,0.55)',
      stroke: isHub ? '#f0c000' : '#aaa',
      'stroke-width': 1.2,
    }, layer);
  },

  // ── Overlay de reconocimiento ─────────────────────────────────

  _drawRecognition(comp, layer) {
    const b = comp.bounds;
    const svgX = sx(b.x);
    const svgY = sy(b.y + b.h);
    const W = px(b.w);
    const H = px(b.h);

    // Marco verde punteado
    this.el('rect', {
      x: svgX - 4, y: svgY - 4, width: W + 8, height: H + 8,
      fill: 'none', stroke: '#3fb950', 'stroke-width': 2,
      'stroke-dasharray': '8,4', rx: 4, ry: 4,
    }, layer);

    // Badge de reconocimiento
    const NAMES = {
      'muro-albanileria-confinada': '✓ Muro Confinado · NCh2123',
      'portico-ha':                 '✓ Pórtico H.A. · NCh430',
      'muro-multi-vano':            '✓ Muro Multi-vano · NCh2123',
    };
    const label = NAMES[comp.type] || '✓ Estructura Reconocida';

    const badgeW = label.length * 5.5 + 16;
    const bx = svgX + W / 2 - badgeW / 2;
    const by = svgY - 22;

    this.el('rect', {
      x: bx, y: by, width: badgeW, height: 16,
      fill: 'rgba(14,68,14,0.92)', stroke: '#3fb950', 'stroke-width': 1,
      rx: 3, ry: 3,
    }, layer);

    this.el('text', {
      x: bx + badgeW / 2, y: by + 11,
      'text-anchor': 'middle', fill: '#56d364',
      'font-size': 9, 'font-family': 'Arial', 'font-weight': 'bold',
    }, layer).textContent = label;
  },

  // ── Ghost (previsualización durante placement) ────────────────

  drawGhost() {
    const layer = this.ghostLayer();
    if (!layer || !CS.ghost) return;
    layer.innerHTML = '';
    const c = this.COLORS[CS.ghost.type] || this.COLORS['column'];
    this._drawElement(CS.ghost, layer, true);

    // Crosshair en p2
    const { x2, y2 } = CS.ghost;
    this.el('circle', {
      cx: sx(x2), cy: sy(y2), r: 6,
      fill: 'none', stroke: '#fff', 'stroke-width': 1.2, opacity: 0.7,
    }, layer);
    this.el('line', {
      x1: sx(x2) - 10, y1: sy(y2), x2: sx(x2) + 10, y2: sy(y2),
      stroke: '#fff', 'stroke-width': 1, opacity: 0.7,
    }, layer);
    this.el('line', {
      x1: sx(x2), y1: sy(y2) - 10, x2: sx(x2), y2: sy(y2) + 10,
      stroke: '#fff', 'stroke-width': 1, opacity: 0.7,
    }, layer);

    // Tooltip con coordenadas
    const txt = `(${x2.toFixed(2)}m, ${y2.toFixed(2)}m)`;
    this.el('text', {
      x: sx(x2) + 12, y: sy(y2) - 5,
      fill: '#ccc', 'font-size': 8, 'font-family': 'JetBrains Mono, monospace',
    }, layer).textContent = txt;
  },

  clearGhost() {
    const layer = this.ghostLayer();
    if (layer) layer.innerHTML = '';
  },
};
