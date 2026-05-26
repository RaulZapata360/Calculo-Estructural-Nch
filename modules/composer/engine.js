/**
 * COMPOSER/ENGINE.JS — Motor de Placement e Interacción
 *
 * Gestiona:
 *  - Conversión pantalla → SVG → mundo (metros)
 *  - Snap a grid y a nodos existentes
 *  - Ciclo click-1 / click-2 para colocar elementos
 *  - Ghost (previsualización) durante placement
 */

const ComposerEngine = {

  // Estado de placement en progreso
  _placing: false,      // true entre click-1 y click-2
  _p1: null,            // {wx, wy} primer punto en metros

  // ── Conversión de coordenadas ──────────────────────────────────

  /** Pantalla (clientX/Y) → coordenadas SVG brutas */
  screenToSvg(clientX, clientY) {
    const canvas = document.getElementById('structural-canvas');
    const rect   = canvas.getBoundingClientRect();
    return {
      sx: clientX - rect.left,
      sy: clientY - rect.top,
    };
  },

  /** Coordenadas SVG (relativas al canvas) → mundo (metros, Y↑) */
  svgToWorld(sx, sy) {
    const v = S.ui.view;
    // Deshacer el transform: translate(v.x,v.y) scale(v.zoom)
    const rawX = (sx - v.x) / v.zoom;
    const rawY = (sy - v.y) / v.zoom;
    // Deshacer sx(m)=C.ox+m*C.scale  →  m=(rawX-C.ox)/C.scale
    // Deshacer sy(m)=C.oy-m*C.scale  →  m=(C.oy-rawY)/C.scale
    return {
      wx: (rawX - C.ox) / C.scale,
      wy: (C.oy - rawY) / C.scale,
    };
  },

  /** Snap de un valor al grid más cercano */
  snapVal(v) {
    const g = CS.snapGrid;
    return Math.round(v / g) * g;
  },

  /** Snap de (wx,wy) a grid; si hay nodo cercano, usa sus coords exactas */
  snap(wx, wy) {
    let sx = this.snapVal(wx);
    let sy = this.snapVal(wy);

    // Snap a nodo existente si está dentro de snapNodeDist
    const thr = CS.snapNodeDist;
    const near = CS.nodes.find(n =>
      Math.abs(n.x - wx) < thr && Math.abs(n.y - wy) < thr
    );
    if (near) { sx = near.x; sy = near.y; }

    return { wx: sx, wy: sy };
  },

  /** Convierte clientX/Y → mundo snappado */
  clientToSnappedWorld(clientX, clientY) {
    const { sx, sy } = this.screenToSvg(clientX, clientY);
    const { wx, wy } = this.svgToWorld(sx, sy);
    return this.snap(wx, wy);
  },

  // ── Ciclo de placement ─────────────────────────────────────────

  /**
   * Click en el canvas mientras hay herramienta activa.
   * Primera llamada → fija p1. Segunda → coloca elemento.
   */
  handleClick(clientX, clientY) {
    if (!CS.activeTool) return;
    const pt = this.clientToSnappedWorld(clientX, clientY);

    if (!this._placing) {
      // Primer click — fija punto inicial
      this._p1 = pt;
      this._placing = true;
      CS.ghost = { type: CS.activeTool, x1: pt.wx, y1: pt.wy, x2: pt.wx, y2: pt.wy };
    } else {
      // Segundo click — confirma elemento
      const p1 = this._p1;
      const p2 = pt;
      this._placing = false;
      this._p1 = null;
      CS.ghost = null;

      const { x1, y1, x2, y2 } = this._normalizePoints(CS.activeTool, p1, p2);
      csAddElement(CS.activeTool, x1, y1, x2, y2);

      // Reconocimiento automático tras cada nuevo elemento
      ComposerRecognizer.analyze();
      ComposerRenderer.draw();
    }
  },

  /**
   * Mouse move — actualiza el ghost
   */
  handleMove(clientX, clientY) {
    if (!CS.activeTool || !this._placing) return;
    const pt = this.clientToSnappedWorld(clientX, clientY);
    CS.ghost = { type: CS.activeTool, x1: this._p1.wx, y1: this._p1.wy, x2: pt.wx, y2: pt.wy };
    ComposerRenderer.drawGhost();
  },

  /**
   * Escape — cancela placement en curso
   */
  cancel() {
    this._placing = false;
    this._p1 = null;
    CS.ghost = null;
    ComposerRenderer.clearGhost();
  },

  // ── Normalización de puntos por tipo de elemento ───────────────

  /**
   * Ajusta (x1,y1)→(x2,y2) para que tengan sentido estructural:
   *   column  : vertical → x1=x2, y1=base, y2=top
   *   beam    : horizontal → y1=y2, x1=izq, x2=der
   *   wall-panel: rectángulo → esquina inferior-izq a superior-der
   *   footing : horizontal → y1=y2 (cota base)
   */
  _normalizePoints(type, p1, p2) {
    let { wx: x1, wy: y1 } = p1;
    let { wx: x2, wy: y2 } = p2;

    if (type === 'column') {
      // Forzar misma X, y1=min (base), y2=max (top)
      const xMid = this.snapVal((x1 + x2) / 2);
      x1 = xMid; x2 = xMid;
      if (y1 > y2) [y1, y2] = [y2, y1];
      // Altura mínima 0.5m
      if (y2 - y1 < 0.50) y2 = y1 + 2.50;
    } else if (type === 'beam') {
      // Forzar misma Y (media), x ordenado
      const yMid = this.snapVal((y1 + y2) / 2);
      y1 = yMid; y2 = yMid;
      if (x1 > x2) [x1, x2] = [x2, x1];
    } else if (type === 'wall-panel') {
      // Rectángulo: inferior-izq → superior-der
      if (x1 > x2) [x1, x2] = [x2, x1];
      if (y1 > y2) [y1, y2] = [y2, y1];
    } else if (type === 'footing') {
      // Horizontal a y1 (cotar menor)
      const yBase = Math.min(y1, y2);
      y1 = yBase - 0.35; y2 = yBase;
      if (x1 > x2) [x1, x2] = [x2, x1];
    }

    return { x1, y1, x2, y2 };
  },

  // ── Activar / desactivar herramienta ──────────────────────────

  setTool(type) {
    CS.activeTool = type;
    this.cancel(); // resetea estado de placement

    const canvas = document.getElementById('structural-canvas');
    if (canvas) canvas.style.cursor = type ? 'crosshair' : 'default';

    // Highlight el botón de paleta activo
    document.querySelectorAll('.composer-tool-btn').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.tool === type);
    });

    // En modo dibujo, desactivar pointer-events sobre transform-layer
    // para que no se seleccionen elementos existentes
    const tl = document.getElementById('transform-layer');
    if (tl) tl.style.pointerEvents = type ? 'none' : '';
  },

  clearTool() {
    this.setTool(null);
    const canvas = document.getElementById('structural-canvas');
    if (canvas) canvas.style.cursor = '';
    // Restaurar pointer-events
    const tl = document.getElementById('transform-layer');
    if (tl) tl.style.pointerEvents = '';
  },

  // ── Bind de eventos de canvas ─────────────────────────────────

  bind() {
    const canvas = document.getElementById('structural-canvas');
    if (!canvas) return;

    canvas.addEventListener('click', e => {
      if (!CS.activeTool) return;
      e.stopPropagation();
      this.handleClick(e.clientX, e.clientY);
    });

    canvas.addEventListener('mousemove', e => {
      if (!CS.activeTool || !this._placing) return;
      this.handleMove(e.clientX, e.clientY);
    });

    // Escape cancela placement
    window.addEventListener('keydown', e => {
      if (e.key === 'Escape' && CS.activeTool) {
        this.cancel();
      }
      // Ctrl+Z / Cmd+Z → Undo
      if ((e.ctrlKey || e.metaKey) && e.key === 'z' && CS.activeTool !== null) {
        csUndoLast();
        ComposerRecognizer.analyze();
        ComposerRenderer.draw();
      }
    });
  },
};
