/**
 * RENDERER.JS — Renderizado SVG Multi-Vano
 * Itera sobre spans y nodes para dibujar la estructura completa
 */

const Renderer = {
  draw() {
    recalcLayout();
    ['supports-layer','wall-layer','beams-layer','columns-layer',
     'loads-layer','dims-layer','diagrams-layer','labels-layer'].forEach(id => {
      document.getElementById(id).innerHTML = '';
    });

    const H = S.story.H;

    // Draw in order: supports, walls, beams, columns, loads, dims, diagrams
    this._drawSupports(H);

    S.spans.forEach(span => {
      const fromX = getSpanFromX(span);
      const L     = getSpanL(span);
      if (span.type === 'muro') this._drawWall(span, fromX, L, H);
      this._drawBeams(span, fromX, L, H);
      this._drawLoads(span, fromX, L, H);
    });

    S.nodes.forEach(node => this._drawColumn(node, H));
    this._drawNodeMarkers(H);
    this._drawDims(H);

    this._drawStrata(H);

    if (S.diagrams.moment) this._drawMomentDiagrams(H);
    if (S.diagrams.shear)  this._drawShearDiagrams(H);
    if (S.diagrams.axial)  this._drawAxialDiagrams(H);
  },

  el(tag, attrs, parent) {
    const e = document.createElementNS('http://www.w3.org/2000/svg', tag);
    Object.entries(attrs).forEach(([k, v]) => e.setAttribute(k, v));
    parent.appendChild(e);
    return e;
  },

  txt(content, x, y, cls, parent) {
    const t = document.createElementNS('http://www.w3.org/2000/svg', 'text');
    t.setAttribute('x', x); t.setAttribute('y', y);
    t.setAttribute('class', cls); t.textContent = content;
    parent.appendChild(t);
    return t;
  },

  _drawSupports(H) {
    const layer = document.getElementById('supports-layer');
    const labels = document.getElementById('labels-layer');

    const f = S.story.foundation;
    const bbH = S.spans[0]?.beamBot?.section?.h || 0.20;
    const L_total = getTotalL();

    // Calcular posición de zapata según tipo
    let x_left, x_right, footingWidth;
    if (f.type === 'L') {
      // Zapata L hacia la derecha (solo voladizo a la derecha)
      x_left = 0;
      x_right = L_total + f.B;
      footingWidth = L_total + f.B;
    } else if (f.type === 'L-inv') {
      // Zapata L invertida hacia la izquierda (solo voladizo a la izquierda)
      x_left = -f.B;
      x_right = L_total;
      footingWidth = L_total + f.B;
    } else {
      // Zapata T simétrica (voladizo a ambos lados)
      x_left = - f.B / 2;
      x_right = L_total + f.B / 2;
      footingWidth = L_total + f.B;
    }

    const isSelected = S.ui.selectedEl === 'foundation';

    // 1. Draw continuous footing block (Zapata Corrida)
    const footing = this.el('rect', {
      x: sx(x_left),
      y: sy(-f.Df + f.Hf),
      width: px(footingWidth),
      height: px(f.Hf),
      class: 'el-foundation' + (isSelected ? ' selected' : ''),
      id: 'el-foundation-block',
      'pointer-events': 'all'
    }, layer);

    // 1.5 Draw Sobrecimiento connecting ground (Y=0) to Zapata
    if (f.Df > f.Hf) {
      this.el('rect', {
        x: sx(0),
        y: sy(0),
        width: px(L_total),
        height: px(f.Df - f.Hf),
        fill: 'rgba(120, 120, 125, 0.9)',
        stroke: 'var(--border)',
        'stroke-width': 1,
        class: 'el-sobrecimiento'
      }, layer);
    }

    footing.addEventListener('click', (e) => {
      e.stopPropagation();
      UI.selectElement('foundation');
    });

    // 2. Draw ground level line (sello de fundacion Df above the bottom of footing)
    const groundY = 0;
    const gLine = this.el('line', {
      x1: sx(x_left - 1.0),
      y1: sy(groundY),
      x2: sx(x_right + 1.0),
      y2: sy(groundY),
      stroke: 'rgba(139,94,60,0.5)',
      'stroke-width': 2,
      'stroke-dasharray': '5 3',
      class: 'ground-line'
    }, layer);

    // Ground label
    this.txt('N.T.N. (Nivel Terreno Natural)', sx(x_left - 0.9), sy(groundY) - 6, 'dim-text', labels);

    // 3. Draw foundation label and type with a background to make it readable
    const tipoStr = f.type === 'L' ? 'L (Derecha)' : (f.type === 'L-inv' ? 'L (Izquierda)' : 'T (Central)');
    const fundText = `Zapata Corrida ${tipoStr}`;
    
    const fundLabelGroup = this.el('g', { class: 'fund-label-group' }, labels);
    this.el('rect', {
      x: sx(L_total / 2) - 80,
      y: sy(-f.Df + f.Hf / 2) - 10,
      width: 160,
      height: 20,
      rx: 4,
      fill: 'rgba(20,20,25,0.85)',
      stroke: 'rgba(150,150,150,0.5)',
      'stroke-width': 1
    }, fundLabelGroup);
    
    const tF = this.txt(fundText, sx(L_total / 2), sy(-f.Df + f.Hf / 2) + 4, 'dim-text', fundLabelGroup);
    tF.setAttribute('style', 'font-size: 10px; font-weight: bold; fill: #fff;');

    // 4. Draw starter dowels (chicotes de acero) going from footing up into the columns
    S.nodes.forEach(node => {
      const x = sx(node.x);
      const yFootingBottom = sy(-f.Df + 0.05);
      const yColTop = sy(H * 0.2); // goes 20% up the column
      
      const col = S.columns[node.id];
      const cb = col?.section?.b || 0.20;
      const xL = sx(node.x - cb/3);
      const xR = sx(node.x + cb/3);

      this.el('line', {
        x1: xL,
        y1: yFootingBottom,
        x2: xL,
        y2: yColTop,
        stroke: 'rgba(255,255,255,0.45)',
        'stroke-width': 1.5
      }, layer);

      this.el('line', {
        x1: xR,
        y1: yFootingBottom,
        x2: xR,
        y2: yColTop,
        stroke: 'rgba(255,255,255,0.45)',
        'stroke-width': 1.5
      }, layer);

      // Hook at the bottom of the footing
      this.el('line', {
        x1: xL,
        y1: yFootingBottom,
        x2: xL + 12,
        y2: yFootingBottom,
        stroke: 'rgba(255,255,255,0.45)',
        'stroke-width': 1.5
      }, layer);

      this.el('line', {
        x1: xR,
        y1: yFootingBottom,
        x2: xR - 12,
        y2: yFootingBottom,
        stroke: 'rgba(255,255,255,0.45)',
        'stroke-width': 1.5
      }, layer);
    });

    // 5. Draw dimension lines for B and Hf
    const dimY = sy(-f.Df - 0.25);
    const footingBottomY = sy(-f.Df);
    const footingTopY = sy(-f.Df + f.Hf);

    // Horizontal dimension for B (drawn at the left end)
    this.el('line', {
      x1: sx(x_left),
      y1: footingBottomY,
      x2: sx(x_left),
      y2: dimY + 10,
      class: 'dim-line'
    }, layer);
    this.el('line', {
      x1: sx(x_left + f.B),
      y1: footingBottomY,
      x2: sx(x_left + f.B),
      y2: dimY + 10,
      class: 'dim-line'
    }, layer);
    this.el('line', {
      x1: sx(x_left),
      y1: dimY,
      x2: sx(x_left + f.B),
      y2: dimY,
      stroke: 'var(--accent)',
      'stroke-width': 1
    }, layer);
    this.txt(`B = ${f.B.toFixed(2)}m`, sx(x_left + f.B/2), dimY - 4, 'dim-text', labels);

    // Vertical dimension for Hf (drawn at the right end)
    const dimX = sx(x_right + 0.25);
    this.el('line', {
      x1: sx(x_right),
      y1: footingTopY,
      x2: dimX + 10,
      y2: footingTopY,
      class: 'dim-line'
    }, layer);
    this.el('line', {
      x1: sx(x_right),
      y1: footingBottomY,
      x2: dimX + 10,
      y2: footingBottomY,
      class: 'dim-line'
    }, layer);
    this.el('line', {
      x1: dimX,
      y1: footingTopY,
      x2: dimX,
      y2: footingBottomY,
      stroke: 'var(--accent)',
      'stroke-width': 1
    }, layer);
    const labelHf = this.txt(`Hf = ${f.Hf.toFixed(2)}m`, dimX + 12, sy(-f.Df + f.Hf/2) + 3, 'dim-text', labels);
    labelHf.setAttribute('text-anchor', 'start');
  },

  _drawStrata(H) {
    const layer  = document.getElementById('supports-layer');
    const labels = document.getElementById('labels-layer');
    const f      = S.story.foundation;
    const strata = f.strata || [];
    if (!strata.length) return;

    const bbH      = S.spans[0]?.beamBot?.section?.h || 0.20;
    const L_total  = getTotalL();
    const footBotY = -f.Df;                     // mundo: fondo de la zapata
    const groundY  = 0;                         // mundo: NTN (z=0 suelo)

    // Colores por tipo USCS
    const strataColor = uscs => {
      if (!uscs) return 'rgba(140,120,90,0.18)';
      const u = uscs.toUpperCase();
      if (/^S/.test(u)) return 'rgba(194,164,72,0.22)';   // arenas → ocre
      if (/^G/.test(u)) return 'rgba(140,130,100,0.22)';  // gravas → gris-beige
      if (/^C/.test(u)) return 'rgba(160,90,60,0.22)';    // arcillas → terracota
      if (/^M/.test(u)) return 'rgba(100,140,80,0.22)';   // limos → verde oliva
      return 'rgba(80,80,90,0.22)';                        // roca / otro → gris
    };
    const strataStroke = uscs => {
      if (!uscs) return 'rgba(150,130,90,0.4)';
      const u = uscs.toUpperCase();
      if (/^S/.test(u)) return 'rgba(194,164,72,0.55)';
      if (/^G/.test(u)) return 'rgba(140,130,100,0.55)';
      if (/^C/.test(u)) return 'rgba(160,90,60,0.55)';
      if (/^M/.test(u)) return 'rgba(100,140,80,0.55)';
      return 'rgba(80,80,90,0.55)';
    };

    // Ancho del recuadro de estratos (ampliamos el margen izquierdo para el texto)
    let x_left_world = f.type === 'L-inv' ? -f.B : (f.type === 'L' ? 0 : -f.B/2);
    let x_right_world = f.type === 'L' ? L_total + f.B : (f.type === 'L-inv' ? L_total : L_total + f.B/2);

    const xA = sx(x_left_world - 3.5); // 3.5m extra a la izquierda para los textos
    const xB = sx(x_right_world + 0.5); // 0.5m extra a la derecha
    const xL = Math.min(xA, xB);
    const xR = Math.max(xA, xB);
    const strataW = xR - xL;

    // Dibujar zona de suelo entre NTN y zapata (relleno sobre la zapata)
    const syGround   = sy(groundY);
    const syFootBot  = sy(-bbH / 2 - f.Hf);
    const fillTop    = Math.min(syGround, syFootBot);
    const fillBot    = Math.max(syGround, syFootBot);
    if (fillBot - fillTop > 2) {
      this.el('rect', {
        x: xL, y: fillTop,
        width: strataW, height: fillBot - fillTop,
        fill: 'rgba(100,80,50,0.12)', stroke: 'none',
        'pointer-events': 'none'
      }, layer);
    }

    // Dibujar cada estrato
    let z = 0;  // profundidad acumulada desde NTN (m)
    strata.forEach((st, idx) => {
      const h     = parseFloat(st.h) || 1.0;
      const yTop  = groundY - z;       // mundo: techo del estrato
      const yBot  = groundY - z - h;   // mundo: piso del estrato
      // sy() mapea mundo→SVG (Y invertida); ordenar para que svgTop < svgBot siempre
      const svgA = sy(yTop);
      const svgB = sy(yBot);
      const svgTop = Math.min(svgA, svgB);
      const svgBot = Math.max(svgA, svgB);
      const bandH  = svgBot - svgTop;

      if (bandH < 1) { z += h; return; }  // demasiado delgado → saltar

      // Rectángulo del estrato
      this.el('rect', {
        x: xL, y: svgTop,
        width: strataW, height: bandH,
        fill: strataColor(st.uscs),
        stroke: strataStroke(st.uscs),
        'stroke-width': 1,
        'pointer-events': 'none'
      }, layer);

      // Línea divisoria superior (solo si no es el primer estrato)
      if (idx > 0) {
        this.el('line', {
          x1: xL, y1: svgTop, x2: xR, y2: svgTop,
          stroke: strataStroke(st.uscs), 'stroke-width': 1.5,
          'stroke-dasharray': '6 3'
        }, layer);
      }

      // Contenido de texto dentro del estrato
      let midY   = (svgTop + svgBot) / 2;
      if (idx === 0) midY += 35; // Desplazamos el primer estrato hacia abajo
      const textX  = xA + 15;   // Fijamos el texto en el margen izquierdo extra
      const lineH  = 11;   // interlineado px

      // Nombre del estrato (negrita)
      const nameEl = document.createElementNS('http://www.w3.org/2000/svg', 'text');
      nameEl.setAttribute('x', textX);
      nameEl.setAttribute('y', midY - lineH * 1.5);
      nameEl.setAttribute('font-size', '9.5');
      nameEl.setAttribute('font-weight', '600');
      nameEl.setAttribute('fill', 'rgba(220,200,160,0.9)');
      nameEl.setAttribute('font-family', 'monospace');
      nameEl.textContent = st.name || `Estrato ${idx + 1}`;
      labels.appendChild(nameEl);

      // Clasificación USCS
      if (st.uscs) {
        const uscsEl = document.createElementNS('http://www.w3.org/2000/svg', 'text');
        uscsEl.setAttribute('x', textX);
        uscsEl.setAttribute('y', midY - lineH * 0.5);
        uscsEl.setAttribute('font-size', '9');
        uscsEl.setAttribute('fill', 'rgba(180,180,140,0.8)');
        uscsEl.setAttribute('font-family', 'monospace');
        uscsEl.textContent = `USCS: ${st.uscs}  |  e = ${h.toFixed(1)} m`;
        labels.appendChild(uscsEl);
      }

      // Parámetros geotécnicos en una línea
      const paramsEl = document.createElementNS('http://www.w3.org/2000/svg', 'text');
      paramsEl.setAttribute('x', textX);
      paramsEl.setAttribute('y', midY + lineH * 0.5);
      paramsEl.setAttribute('font-size', '9');
      paramsEl.setAttribute('fill', 'rgba(160,180,200,0.85)');
      paramsEl.setAttribute('font-family', 'monospace');
      paramsEl.textContent = `γ=${st.gamma ?? '?'} kN/m³  φ=${st.phi ?? '?'}°  c=${st.c ?? '?'} kPa`;
      labels.appendChild(paramsEl);

      // Tipo de análisis (drenado / no drenado)
      const drainEl = document.createElementNS('http://www.w3.org/2000/svg', 'text');
      drainEl.setAttribute('x', textX);
      drainEl.setAttribute('y', midY + lineH * 1.5);
      drainEl.setAttribute('font-size', '8.5');
      drainEl.setAttribute('fill', 'rgba(140,160,140,0.75)');
      drainEl.setAttribute('font-family', 'monospace');
      drainEl.textContent = st.type === 'drenado' ? 'Análisis Drenado (CD)' : 'Análisis No Drenado (CU)';
      labels.appendChild(drainEl);

      // Cota del techo del estrato (lado derecho, en el borde superior de la banda)
      const cotaEl = document.createElementNS('http://www.w3.org/2000/svg', 'text');
      cotaEl.setAttribute('x', xR + 6);
      cotaEl.setAttribute('y', svgTop + 10);
      cotaEl.setAttribute('font-size', '8');
      cotaEl.setAttribute('fill', 'rgba(180,180,180,0.75)');
      cotaEl.setAttribute('font-family', 'monospace');
      cotaEl.textContent = `↓ z=${z.toFixed(1)}m`;
      labels.appendChild(cotaEl);

      z += h;
    });

    // Cota del fondo del último estrato
    const lastCotaEl = document.createElementNS('http://www.w3.org/2000/svg', 'text');
    lastCotaEl.setAttribute('x', xR + 6);
    lastCotaEl.setAttribute('y', sy(groundY - z) + 10);
    lastCotaEl.setAttribute('font-size', '8');
    lastCotaEl.setAttribute('fill', 'rgba(160,160,160,0.7)');
    lastCotaEl.setAttribute('font-family', 'monospace');
    lastCotaEl.textContent = `z = ${z.toFixed(1)} m`;
    labels.appendChild(lastCotaEl);

    // Nivel freático (NF) si está dentro del rango visible
    const nf = parseFloat(f.NF) || 3.0;
    const nfY_world = groundY - nf;
    const nfY_svg   = sy(nfY_world);
    const canvasH   = document.getElementById('structural-canvas').clientHeight || 600;
    if (nfY_svg > sy(groundY) && nfY_svg < canvasH + 40) {
      this.el('line', {
        x1: xL - 10, y1: nfY_svg, x2: xR + 10, y2: nfY_svg,
        stroke: 'rgba(88,166,255,0.6)', 'stroke-width': 1.5,
        'stroke-dasharray': '8 4'
      }, layer);
      const nfTxt = document.createElementNS('http://www.w3.org/2000/svg', 'text');
      nfTxt.setAttribute('x', xR + 14);
      nfTxt.setAttribute('y', nfY_svg + 4);
      nfTxt.setAttribute('font-size', '9');
      nfTxt.setAttribute('fill', 'rgba(88,166,255,0.85)');
      nfTxt.setAttribute('font-family', 'monospace');
      nfTxt.textContent = `▼ NF (z=${nf.toFixed(1)}m)`;
      labels.appendChild(nfTxt);
    }
  },

  _drawWall(span, fromX, L, H) {
    const layer = document.getElementById('wall-layer');
    const labels = document.getElementById('labels-layer');
    const isSelected = S.ui.selectedEl === 'wall' && S.ui.selectedSpan === span.id;

    const wall = this.el('rect', {
      x: sx(fromX), y: sy(H), width: px(L), height: px(H),
      class: 'el-wall' + (isSelected ? ' selected' : ''),
      id: `el-wall-${span.id}`, 'pointer-events': 'none'
    }, layer);

    const hit = this.el('rect', {
      x: sx(fromX), y: sy(H), width: px(L), height: px(H),
      fill: 'transparent', 'pointer-events': 'all', style: 'cursor:pointer'
    }, layer);
    hit.addEventListener('click', () => UI.selectElement('wall', span.id));

    this.txt(`Muro (${L.toFixed(1)}×${H}m)`,
      sx(fromX + L / 2), sy(H / 2) + 4, 'svg-label wall-label', labels);
  },

  _drawBeams(span, fromX, L, H) {
    const layer  = document.getElementById('beams-layer');
    const labels = document.getElementById('labels-layer');
    const btH = span.beamTop.section.h;
    const bbH = span.beamBot.section.h;

    const beams = [
      { id: `el-beam-top-${span.id}`, y: H - btH/2, bh: btH, eltype: 'beam_top',
        label: 'Viga Sup.' },
      { id: `el-beam-bot-${span.id}`, y: 0, bh: bbH, eltype: 'beam_bot',
        label: 'Viga Inferior' }
    ];

    beams.forEach(b => {
      const isSelected = S.ui.selectedEl === b.eltype && S.ui.selectedSpan === span.id;
      const el = this.el('rect', {
        x: sx(fromX), y: sy(b.y + b.bh), width: px(L), height: px(b.bh),
        class: 'el-beam' + (isSelected ? ' selected' : ''),
        id: b.id, 'pointer-events': 'all'
      }, layer);
      el.addEventListener('click', e => {
        e.stopPropagation();
        UI.selectElement(b.eltype, span.id);
      });
      const ly = b.y > H / 2 ? sy(b.y + b.bh / 2) - 14 : sy(b.y + b.bh / 2) + 14;
      if (S.spans.length === 1) {
        this.txt(b.label, sx(fromX + L / 2), ly, 'svg-label', labels);
      }
    });
  },

  _drawColumn(node, H) {
    const layer  = document.getElementById('columns-layer');
    const labels = document.getElementById('labels-layer');
    const col    = S.columns[node.id];
    const cb     = col.section.b;
    const isSelected = S.ui.selectedEl === 'column' && S.ui.selectedNode === node.id;

    const el = this.el('rect', {
      x: sx(node.x - cb / 2), y: sy(H), width: px(cb), height: px(H),
      class: 'el-column' + (isSelected ? ' selected' : ''),
      id: `el-col-${node.id}`, 'pointer-events': 'all'
    }, layer);
    el.addEventListener('click', e => {
      e.stopPropagation();
      UI.selectElement('column', null, node.id);
    });

    const idx = S.nodes.indexOf(node) + 1;
    this.txt(`P${idx}`, sx(node.x), sy(H / 2) + 4,
      'svg-label primary', labels);
  },

  _drawNodeMarkers(H) {
    const layer = document.getElementById('supports-layer');
    S.nodes.forEach(node => {
      const marker = this.el('circle', {
        cx: sx(node.x), cy: sy(0) - 28,
        r: 5, class: 'node-marker',
        title: `Nodo ${node.id} (x=${node.x}m)`
      }, layer);
    });
  },

  _drawLoads(span, fromX, L, H) {
    const layer  = document.getElementById('loads-layer');
    const spanRes = S.results.spans[span.id];
    const qu = parseFloat(spanRes?.qu || S.results.qu) || 0;

    // Enhanced load visualization with more arrows for better visual impact
    const n = 12; // More arrows for better distribution
    const arrowSpacing = L / n;

    for (let i = 0; i <= n; i++) {
      const x = fromX + i * arrowSpacing;
      const arrowHeight = 0.65;

      // Arrow line
      this.el('line', {
        x1: sx(x), y1: sy(H + arrowHeight), x2: sx(x), y2: sy(H) + 1,
        class: 'load-arrow', 'marker-end': 'url(#arrow-warn)'
      }, layer);
    }

    // Horizontal load line with gradient effect (dashed for distribution)
    this.el('line', {
      x1: sx(fromX), y1: sy(H + 0.65), x2: sx(fromX + L), y2: sy(H + 0.65),
      stroke: 'var(--warning)', 'stroke-width': 2.5,
      class: 'load-line', 'stroke-dasharray': '8 4'
    }, layer);

    // Solid accent line underneath for visual hierarchy
    this.el('line', {
      x1: sx(fromX), y1: sy(H + 0.70), x2: sx(fromX + L), y2: sy(H + 0.70),
      stroke: 'rgba(210,153,34,0.4)', 'stroke-width': 1,
      'vector-effect': 'non-scaling-stroke'
    }, layer);

    // Load value pill - improved styling
    const cx = sx(fromX + L / 2);
    const cy = sy(H + 0.55);
    const textVal = `q = ${qu.toFixed(2)} kN/m`;
    const charCount = textVal.length;
    const rectW = charCount * 6.5 + 16;
    const rectH = 20;

    const pill = this.el('g', { class: 'load-pill-group' }, layer);

    // Pill background with subtle shadow
    this.el('rect', {
      x: cx - rectW / 2, y: cy - rectH / 2, width: rectW, height: rectH, rx: 10,
      fill: 'rgba(13,17,23,0.95)',
      stroke: 'var(--warning)',
      'stroke-width': 1.5,
      filter: 'drop-shadow(0 2px 4px rgba(210,153,34,0.3))'
    }, pill);

    const t = this.txt(textVal, cx, cy + 4, 'load-text', pill);
    t.setAttribute('text-anchor', 'middle');
    t.setAttribute('style', 'font-size: 10px; font-weight: 700; fill: var(--warning); letter-spacing: 0.02em;');
  },

  _drawDims(H) {
    const layer = document.getElementById('dims-layer');
    const totalL = getTotalL();

    // Horizontal: total dimension
    const y = sy(-0.35);
    this.el('line', { x1: sx(0), y1: sy(0), x2: sx(0), y2: y + 10, class: 'dim-line' }, layer);
    this.el('line', { x1: sx(totalL), y1: sy(0), x2: sx(totalL), y2: y + 10, class: 'dim-line' }, layer);
    this.el('line', { x1: sx(0), y1: y, x2: sx(totalL), y2: y, class: 'dim-line',
                      stroke: 'rgba(255,255,255,0.3)' }, layer);
    this.txt(`L = ${totalL.toFixed(2)} m`, sx(totalL / 2), y - 6, 'dim-text', layer);

    // Per-span sub-dimensions (if more than 1 span)
    if (S.spans.length > 1) {
      S.spans.forEach(span => {
        const fromX = getSpanFromX(span);
        const L     = getSpanL(span);
        this.txt(`${L.toFixed(1)}m`, sx(fromX + L / 2), y - 18, 'dim-text', layer);
        this.el('line', { x1: sx(fromX), y1: y - 12, x2: sx(fromX + L), y2: y - 12,
          class: 'dim-line', stroke: 'rgba(255,255,255,0.15)' }, layer);
      });
    }

    // Vertical height
    const x = sx(-0.45);
    this.el('line', { x1: x, y1: sy(0), x2: x, y2: sy(H), class: 'dim-line',
                      stroke: 'rgba(255,255,255,0.3)' }, layer);
    const ht = document.createElementNS('http://www.w3.org/2000/svg', 'text');
    ht.setAttribute('x', x - 8); ht.setAttribute('y', sy(H / 2));
    ht.setAttribute('class', 'dim-text');
    ht.setAttribute('transform', `rotate(-90,${x-8},${sy(H/2)})`);
    ht.textContent = `H = ${H} m`;
    layer.appendChild(ht);

    // Status bar scale
    document.getElementById('sb-scale').textContent = `Escala: 1m = ${C.scale.toFixed(0)}px`;
  },

  // ── Diagrams ───────────────────────────────────────────────────────

  _drawMomentDiagrams(H) {
    const layer = document.getElementById('diagrams-layer');
    const m = S.story.materials;

    S.spans.forEach(span => {
      const fromX = getSpanFromX(span);
      const L = getSpanL(span);
      const spanRes = S.results.spans[span.id];
      if (!spanRes) return;

      const selSpan = S.ui.selectedSpan;
      const selEl   = S.ui.selectedEl;
      const drawTop = !selEl || selEl === 'wall' || selEl === 'beam_top' || (selSpan && selSpan !== span.id);
      const drawBot = !selEl || selEl === 'wall' || selEl === 'beam_bot' || (selSpan && selSpan !== span.id);

      ['beam_top', 'beam_bot'].forEach(type => {
        if (type === 'beam_top' && !drawTop) return;
        if (type === 'beam_bot' && !drawBot) return;

        const r = spanRes[type === 'beam_top' ? 'beamTop' : 'beamBot'];
        if (!r?.Mu) return;
        const Mu = parseFloat(r.Mu);
        if (Mu === 0) return;

        const isTop = type === 'beam_top';
        const sect  = isTop ? span.beamTop.section : span.beamBot.section;
        const wSelf = m.gc * sect.b * sect.h;
        const qu    = parseFloat(spanRes.qu);
        const q_eff = isTop
          ? qu + wSelf
          : (parseFloat(spanRes.wall?.P || 0) / L + wSelf);

        let msc = S.diagrams.normalize ? px(0.3) / Mu : px(1) / (q_eff * L * L / 8) * 40;

        const yBase = isTop ? H : 0;
        const yDir  = isTop ? 1 : -1;
        const n = 40;
        const pts = [];
        for (let i = 0; i <= n; i++) {
          const x = i / n * L;
          const Miso = (q_eff * x / 2) * (L - x);
          const Mhyp = Miso - (q_eff * L * L / 12);
          pts.push(`${sx(fromX + x)},${sy(yBase) + yDir * Mhyp * msc}`);
        }
        const endM = -(q_eff * L * L / 12);
        const y0svg = sy(yBase) + yDir * endM * msc;
        const fillPts = `${sx(fromX)},${y0svg} ${pts.join(' ')} ${sx(fromX+L)},${y0svg} ${sx(fromX+L)},${sy(yBase)} ${sx(fromX)},${sy(yBase)}`;

        this.el('polygon', { points: fillPts, class: 'moment-fill' }, layer);
        this.el('polyline', { points: pts.join(' '), class: 'moment-line' }, layer);
        this.el('line', { x1: sx(fromX), y1: sy(yBase), x2: sx(fromX+L), y2: sy(yBase),
                          stroke: 'rgba(47,129,247,0.3)', 'stroke-width': 1 }, layer);
        this.txt(`Mu=${Mu.toFixed(1)}`, sx(fromX + L/2), sy(yBase) + yDir * msc * Mu/2 + (isTop?8:-2), 'dim-text', layer);
      });
    });

    // Column moment diagrams
    const drawCol = !S.ui.selectedEl || S.ui.selectedEl === 'wall' || S.ui.selectedEl === 'column';
    if (!drawCol) return;

    S.nodes.forEach(node => {
      const colRes = S.results.columns[node.id];
      if (!colRes?.Mu) return;
      const Mu = parseFloat(colRes.Mu);
      if (Mu === 0) return;
      const msc = S.diagrams.normalize ? px(0.3) / Mu : px(1) / (Mu * 2) * 40;

      const leftSpan  = S.spans.find(sp => sp.toNode   === node.id);
      const rightSpan = S.spans.find(sp => sp.fromNode === node.id);
      const sign = rightSpan ? 1 : -1;

      const xc = sx(node.x), yTop = sy(H), yBot = sy(0);
      this.el('polygon', { points: `${xc},${yBot} ${xc + sign * Mu * msc},${yTop} ${xc},${yTop}`, class: 'moment-fill' }, layer);
      this.el('line', { x1: xc, y1: yBot, x2: xc + sign * Mu * msc, y2: yTop, class: 'moment-line' }, layer);
      this.txt(`Mu=${Mu.toFixed(1)}`, xc + sign * (Mu * msc + 14), yTop + 10, 'dim-text', layer);
    });
  },

  _drawShearDiagrams(H) {
    const layer = document.getElementById('diagrams-layer');

    S.spans.forEach(span => {
      const fromX = getSpanFromX(span);
      const L = getSpanL(span);
      const spanRes = S.results.spans[span.id];
      if (!spanRes) return;

      ['beam_top', 'beam_bot'].forEach(type => {
        const r = spanRes[type === 'beam_top' ? 'beamTop' : 'beamBot'];
        if (!r?.Vu) return;
        const Vu = parseFloat(r.Vu);
        if (Vu === 0) return;

        const isTop = type === 'beam_top';
        const sc = S.diagrams.normalize ? px(0.15) / Vu : px(0.3) / Vu;
        const yBase = isTop ? H : 0;
        const xL = sx(fromX), xR = sx(fromX + L);
        const yb = sy(yBase) + (isTop ? 40 : -40);

        this.el('polygon', { points: `${xL},${yb} ${xL},${yb - Vu*sc} ${xR},${yb + Vu*sc} ${xR},${yb}`, class: 'shear-fill' }, layer);
        this.el('polyline', { points: `${xL},${yb - Vu*sc} ${xR},${yb + Vu*sc}`, class: 'shear-line' }, layer);
        this.el('line', { x1: xL, y1: yb, x2: xR, y2: yb, stroke: 'rgba(248,81,73,0.3)', 'stroke-width': 1 }, layer);
        this.txt(`Vu=${Vu.toFixed(1)} kN`, xL + 40, yb - Vu*sc - 5, 'dim-text', layer);
      });
    });

    // Column shear
    S.nodes.forEach(node => {
      const colRes = S.results.columns[node.id];
      if (!colRes?.Vu) return;
      const Vu = parseFloat(colRes.Vu);
      if (Vu === 0) return;

      const sc = S.diagrams.normalize ? px(0.15) / Vu : px(0.3) / Vu;
      const leftSpan  = S.spans.find(sp => sp.toNode   === node.id);
      const rightSpan = S.spans.find(sp => sp.fromNode === node.id);
      const sign = rightSpan ? 1 : -1;
      const xc = sx(node.x), yTop = sy(H), yBot = sy(0);
      const dx = sign * Vu * sc;

      this.el('polygon', { points: `${xc},${yBot} ${xc+dx},${yBot} ${xc+dx},${yTop} ${xc},${yTop}`, class: 'shear-fill' }, layer);
      this.el('polyline', { points: `${xc+dx},${yBot} ${xc+dx},${yTop}`, class: 'shear-line' }, layer);
      this.el('line', { x1: xc, y1: yBot, x2: xc, y2: yTop, stroke: 'rgba(248,81,73,0.3)', 'stroke-width': 1 }, layer);
      this.txt(`Vu=${Vu.toFixed(1)}`, xc + dx + sign*14, sy(H/2), 'dim-text', layer);
    });
  },

  _drawAxialDiagrams(H) {
    const layer = document.getElementById('diagrams-layer');

    S.nodes.forEach(node => {
      const colRes = S.results.columns[node.id];
      if (!colRes?.Nu) return;
      const Nu = parseFloat(colRes.Nu);
      if (Nu === 0) return;

      const sc = S.diagrams.normalize ? px(0.15) / Nu : px(0.3) / Nu;
      const xc = sx(node.x), yT = sy(H), yB = sy(0);
      const rightSpan = S.spans.find(sp => sp.fromNode === node.id);
      const sign = rightSpan ? -1 : 1;

      this.el('polygon', { points: `${xc},${yB} ${xc + sign*Nu*sc},${yB} ${xc + sign*Nu*sc},${yT} ${xc},${yT}`, class: 'axial-fill' }, layer);
      this.el('polyline', { points: `${xc + sign*Nu*sc},${yB} ${xc + sign*Nu*sc},${yT}`, class: 'axial-line' }, layer);

      const lbl = this.txt(`Nu=${Nu.toFixed(1)} kN`, xc + sign*Nu*sc - 6, sy(H/2), 'dim-text', layer);
      lbl.setAttribute('transform', `rotate(-90,${xc + sign*Nu*sc - 6},${sy(H/2)})`);
    });
  }
};
