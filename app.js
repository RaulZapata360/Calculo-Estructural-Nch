/**
 * EstructuraCalc - Motor de Análisis Estructural 2D
 * Albañilería Confinada · NCh430 · Zero-Dependency
 *
 * Módulos:
 * - state.js: Modelo de estado global jerárquico
 * - geometry.js: Sistema de coordenadas y layout
 * - solver.js: Cálculo estructural y diseño de armadura
 * - ui/panels.js: Renderizado del panel derecho
 */

// Renderer está ahora en modules/renderer/renderer.js

// LEGACY: Renderer coordinates
/* const Renderer = {
  draw() {
    recalcLayout();
    ['supports-layer','wall-layer','beams-layer','columns-layer',
     'loads-layer','dims-layer','diagrams-layer','labels-layer'].forEach(id => {
      document.getElementById(id).innerHTML = '';
    });
    this.drawSupports();
    this.drawWall();      // renders wall visual + hit-area in wall-layer (bottom)
    this.drawColumns();   // renders above wall
    this.drawBeams();     // renders above wall
    this.drawLoads();
    this.drawDims();
    if (S.diagrams.moment) this.drawMomentDiagram();
    if (S.diagrams.shear)  this.drawShearDiagram();
    if (S.diagrams.axial)  this.drawAxialDiagram();
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

  drawSupports() {
    const layer = document.getElementById('supports-layer');
    const y0 = sy(0);
    const makeSupport = (x) => {
      const pts = `${x},${y0} ${x-12},${y0+20} ${x+12},${y0+20}`;
      this.el('polygon', { points: pts, class: 'support-tri' }, layer);
      this.el('line', { x1: x-16, y1: y0+22, x2: x+16, y2: y0+22,
                        stroke: 'var(--accent)', 'stroke-width': 2 }, layer);
    };
    makeSupport(sx(0));
    makeSupport(sx(S.geometry.L));
  },

  drawWall() {
    const layer = document.getElementById('wall-layer');
    const g = S.geometry;
    this.el('rect', {
      x: sx(0), y: sy(g.H), width: px(g.L), height: px(g.H),
      class: 'el-wall', id: 'el-wall', 'data-eltype': 'wall',
      'pointer-events': 'none'
    }, layer);
    const hit = this.el('rect', {
      x: sx(0), y: sy(g.H), width: px(g.L), height: px(g.H),
      fill: 'transparent', 'pointer-events': 'all', style: 'cursor:pointer'
    }, layer);
    hit.addEventListener('click', () => UI.selectElement('wall'));
    this.txt(`Muro Albañilería (${g.L}×${g.H} m)`,
      sx(g.L/2), sy(g.H/2) + 4, 'svg-label', document.getElementById('labels-layer'));
  },

  drawColumns() {
    const layer = document.getElementById('columns-layer');
    const col_b = S.elements.column.section.b;
    const g = S.geometry;
    const positions = [
      { id: 'el-col-l', x: -col_b/2, label: 'P1' },
      { id: 'el-col-r', x: g.L - col_b/2, label: 'P2' }
    ];
    positions.forEach(p => {
      const el = this.el('rect', {
        x: sx(p.x), y: sy(g.H), width: px(col_b), height: px(g.H),
        class: 'el-column', id: p.id, 'data-eltype': 'column',
        'pointer-events': 'all'
      }, layer);
      el.addEventListener('click', (e) => { e.stopPropagation(); UI.selectElement('column'); });
      this.txt(p.label, sx(p.x + col_b/2), sy(g.H/2) + 4,
        'svg-label primary', document.getElementById('labels-layer'));
    });
  },

  drawBeams() {
    const layer = document.getElementById('beams-layer');
    const g = S.geometry;
    const beam_h = S.elements.beam_top.section.h;
    const beams = [
      { id: 'el-beam-top', y: g.H - beam_h/2, label: 'Viga/Cadena Superior', eltype: 'beam_top' },
      { id: 'el-beam-bot', y: -beam_h/2, label: 'Sobrecimiento/Cadena Inf.', eltype: 'beam_bot' }
    ];
    beams.forEach(b => {
      const el = this.el('rect', {
        x: sx(0), y: sy(b.y + beam_h), width: px(g.L), height: px(beam_h),
        class: 'el-beam', id: b.id, 'data-eltype': b.eltype,
        'pointer-events': 'all'
      }, layer);
      el.addEventListener('click', (e) => { e.stopPropagation(); UI.selectElement(b.eltype); });
      const ly = b.y > g.H/2 ? sy(b.y + beam_h/2) - 14 : sy(b.y + beam_h/2) + 16;
      this.txt(b.label, sx(g.L/2), ly, 'svg-label', document.getElementById('labels-layer'));
    });
  },

  drawLoads() {
    const layer = document.getElementById('loads-layer');
    const qu = parseFloat(S.results.qu) || 0;
    const g = S.geometry;
    const n = 10;
    for (let i = 0; i <= n; i++) {
      const x = i * g.L / n;
      const xa = sx(x), ya1 = sy(g.H + 0.6), ya2 = sy(g.H);
      this.el('line', { x1: xa, y1: ya1, x2: xa, y2: ya2 + 2,
                        class: 'load-arrow', 'marker-end': 'url(#arrow-warn)' }, layer);
    }
    this.el('line', { x1: sx(0), y1: sy(g.H + 0.6), x2: sx(g.L), y2: sy(g.H + 0.6),
                      stroke: 'var(--warning)', 'stroke-width': 2, class: 'load-line' }, layer);
    this.txt(`q = ${S.results.qu} kN/m`, sx(g.L/2), sy(g.H + 0.75), 'load-text',
      document.getElementById('labels-layer'));
  },

  drawDims() {
    const layer = document.getElementById('dims-layer');
    const g = S.geometry;
    const y = sy(-0.4);
    this.el('line', { x1: sx(0), y1: sy(0), x2: sx(0), y2: y + 10, class: 'dim-line' }, layer);
    this.el('line', { x1: sx(g.L), y1: sy(0), x2: sx(g.L), y2: y + 10, class: 'dim-line' }, layer);
    this.el('line', { x1: sx(0), y1: y, x2: sx(g.L), y2: y, class: 'dim-line',
                      stroke: 'rgba(255,255,255,0.3)' }, layer);
    this.txt(`L = ${g.L} m`, sx(g.L/2), y - 6, 'dim-text', layer);
    const x = sx(-0.5);
    this.el('line', { x1: x, y1: sy(0), x2: x, y2: sy(g.H), class: 'dim-line',
                      stroke: 'rgba(255,255,255,0.3)' }, layer);
    const ht = document.createElementNS('http://www.w3.org/2000/svg','text');
    ht.setAttribute('x', x - 8); ht.setAttribute('y', sy(g.H/2));
    ht.setAttribute('class', 'dim-text');
    ht.setAttribute('transform', `rotate(-90,${x-8},${sy(g.H/2)})`);
    ht.textContent = `H = ${g.H} m`;
    layer.appendChild(ht);
  },

  drawMomentDiagram() {
    const layer = document.getElementById('diagrams-layer');
    const g = S.geometry;
    const m = S.materials;
    const elements = (!S.ui.selectedEl || S.ui.selectedEl === 'wall') ? ['beam_top', 'beam_bot', 'column'] : [S.ui.selectedEl];

    elements.forEach(type => {
      const r = S.results[type];
      if (!r || !r.Mu) return;
      const Mu = parseFloat(r.Mu);
      if (Mu === 0) return;

      if (type === 'beam_top' || type === 'beam_bot') {
        const isTop = type === 'beam_top';
        const sect = S.elements[type].section;
        const q_eff = isTop ? (parseFloat(S.results.qu) + m.gc * sect.b * sect.h) : ((S.results.wall?.P || 0) / g.L + m.gc * sect.b * sect.h);

        let msc = px(1) / (q_eff * g.L * g.L / 8) * 40;
        if (S.diagrams.normalize) msc = px(0.3) / Mu;

        const pts = [];
        const n = 40;
        const yBase = isTop ? g.H : 0;
        const yDir = isTop ? 1 : -1;

        for (let i = 0; i <= n; i++) {
          const x = i / n * g.L;
          const M_iso = (q_eff * x / 2) * (g.L - x);
          const M_hyp = M_iso - (q_eff * g.L * g.L / 12);
          pts.push(`${sx(x)},${sy(yBase) + yDir * M_hyp * msc}`);
        }

        const polyStr = pts.join(' ');
        const fillPts = `${sx(0)},${sy(yBase) + yDir * (-q_eff * g.L * g.L / 12) * msc} ${polyStr} ${sx(g.L)},${sy(yBase) + yDir * (-q_eff * g.L * g.L / 12) * msc} ${sx(g.L)},${sy(yBase)} ${sx(0)},${sy(yBase)}`;

        this.el('polygon', { points: fillPts, class: 'moment-fill' }, layer);
        this.el('polyline', { points: polyStr, class: 'moment-line' }, layer);
        this.el('line', { x1: sx(0), y1: sy(yBase), x2: sx(g.L), y2: sy(yBase), stroke: 'rgba(47,129,247,0.3)', 'stroke-width': 1}, layer);

        this.txt(`Mu=${Mu.toFixed(1)} kN·m`, sx(g.L/2), sy(yBase) + yDir * msc * Mu / 2 + (isTop ? 8 : -2), 'dim-text', layer);
      }

      if (type === 'column') {
        let msc = px(1) / (Mu * 2) * 40;
        if (S.diagrams.normalize) msc = px(0.3) / Mu;

        [ {x: sx(0), sign: -1}, {x: sx(g.L), sign: 1} ].forEach(col => {
          const yTop = sy(g.H), yBot = sy(0);

          this.el('polygon', { points: `${col.x},${yBot} ${col.x + col.sign * Mu * msc},${yTop} ${col.x},${yTop}`, class: 'moment-fill' }, layer);
          this.el('line', { x1: col.x, y1: yBot, x2: col.x + col.sign * Mu * msc, y2: yTop, class: 'moment-line' }, layer);

          this.txt(`Mu=${Mu.toFixed(1)}`, col.x + col.sign * (Mu * msc + 15), yTop + 10, 'dim-text', layer);
        });
      }
    });
  },

  drawShearDiagram() {
    const layer = document.getElementById('diagrams-layer');
    const g = S.geometry;
    const elements = (!S.ui.selectedEl || S.ui.selectedEl === 'wall') ? ['beam_top', 'beam_bot', 'column'] : [S.ui.selectedEl];

    elements.forEach(type => {
      const r = S.results[type];
      if (!r || !r.Vu) return;
      const Vu = parseFloat(r.Vu);
      if (Vu === 0) return;

      let sc = px(0.3) / Vu;
      if (S.diagrams.normalize) sc = px(0.15) / Vu;

      if (type === 'beam_top' || type === 'beam_bot') {
        const isTop = type === 'beam_top';
        const yBase = isTop ? g.H : 0;
        const xL = sx(0), xR = sx(g.L);
        const yb = sy(yBase) + (isTop ? 40 : -40);

        const pts = `${xL},${yb} ${xL},${yb - Vu * sc} ${xR},${yb + Vu * sc} ${xR},${yb}`;
        this.el('polygon', { points: pts, class: 'shear-fill' }, layer);
        this.el('polyline', { points: `${xL},${yb - Vu * sc} ${xR},${yb + Vu * sc}`, class: 'shear-line' }, layer);
        this.el('line', { x1: xL, y1: yb, x2: xR, y2: yb, stroke: 'rgba(248,81,73,0.3)', 'stroke-width': 1}, layer);

        this.txt(`Vu=${Vu.toFixed(1)} kN`, xL + 45, yb - Vu * sc - 6, 'dim-text', layer);
        this.txt(`Vu=${Vu.toFixed(1)} kN`, xR - 45, yb + Vu * sc + 14, 'dim-text', layer);
      }

      if (type === 'column') {
        [ {x: sx(0), sign: -1}, {x: sx(g.L), sign: 1} ].forEach(col => {
          const yTop = sy(g.H), yBot = sy(0);
          const dx = col.sign * Vu * sc;

          const pts = `${col.x},${yBot} ${col.x + dx},${yBot} ${col.x + dx},${yTop} ${col.x},${yTop}`;
          this.el('polygon', { points: pts, class: 'shear-fill' }, layer);
          this.el('polyline', { points: `${col.x + dx},${yBot} ${col.x + dx},${yTop}`, class: 'shear-line' }, layer);
          this.el('line', { x1: col.x, y1: yBot, x2: col.x, y2: yTop, stroke: 'rgba(248,81,73,0.3)', 'stroke-width': 1}, layer);

          this.txt(`Vu=${Vu.toFixed(1)}`, col.x + dx + col.sign*15, sy(g.H/2), 'dim-text', layer);
        });
      }
    });
  },

  drawAxialDiagram() {
    const layer = document.getElementById('diagrams-layer');
    const g = S.geometry;
    const elements = (!S.ui.selectedEl || S.ui.selectedEl === 'wall') ? ['column'] : [S.ui.selectedEl];

    if (!elements.includes('column')) return;

    const Nu = parseFloat(S.results.column?.Nu) || 0;
    if (Nu === 0) return;

    let sc = px(0.3) / Nu;
    if (S.diagrams.normalize) sc = px(0.15) / Nu;

    [sx(0), sx(g.L)].forEach(xBase => {
      const xL = xBase;
      const yT = sy(g.H), yB = sy(0);
      const pts = `${xL},${yB} ${xL - Nu * sc},${yB} ${xL - Nu * sc},${yT} ${xL},${yT}`;

      this.el('polygon', { points: pts, class: 'axial-fill' }, layer);
      this.el('polyline', { points: `${xL - Nu * sc},${yB} ${xL - Nu * sc},${yT}`, class: 'axial-line' }, layer);

      const txt = this.txt(`Nu,máx = ${Nu.toFixed(1)} kN`, xL - Nu * sc - 6, sy(g.H / 2), 'dim-text', layer);
      txt.setAttribute('transform', `rotate(-90, ${xL - Nu * sc - 6}, ${sy(g.H / 2)})`);
    });
  }
};
*/

// ══════════════════════════════════════════
// UI — Selection & Panel Logic
// ══════════════════════════════════════════
const UI = {
  // spanId: span ID for beams/wall; nodeId: node ID for columns
  selectElement(type, spanId, nodeId) {
    if (CanvasNav.handMode) return;
    S.ui.selectedEl = type;
    if (spanId)  S.ui.selectedSpan = spanId;
    if (nodeId)  S.ui.selectedNode = nodeId;

    // Also pick a reasonable nodeId when selecting a beam (use span's fromNode)
    if (!nodeId && spanId) {
      const span = S.spans.find(sp => sp.id === spanId);
      if (span) S.ui.selectedNode = span.fromNode;
    }

    // Sync legacy elements for rebar editor / crossSection backward compat
    Solver._syncLegacyElements(
      S.spans.find(sp => sp.id === S.ui.selectedSpan) || S.spans[0],
      S.ui.selectedNode || S.nodes[0]?.id
    );

    // Redraw to update highlights
    Renderer.draw();

    // Update right panel
    const panel = document.getElementById('panel-right');
    panel.classList.remove('hidden');

    const names  = { beam_top: 'Viga Superior', beam_bot: 'Sobrecimiento', column: 'Pilar', wall: 'Muro Albañilería' };
    const colors = { beam_top: '#2f81f7', beam_bot: '#8b5cf6', column: '#3fb950', wall: '#d29922' };
    const badge  = document.getElementById('el-badge');
    const nameEl = document.getElementById('el-name');
    badge.textContent = names[type] || type;
    badge.style.background = (colors[type] || '#555') + '22';
    badge.style.color = colors[type] || '#fff';

    // Span/node label suffix
    const selSpan = S.spans.find(sp => sp.id === S.ui.selectedSpan);
    const spanIdx = selSpan ? S.spans.indexOf(selSpan) + 1 : '';
    nameEl.textContent = spanIdx > 1 ? `${names[type]} (V${spanIdx})` : (names[type] || type);

    document.getElementById('sb-selected').textContent = `Sel: ${names[type]}`;

    renderProperties(type);
    renderForces(type);
    renderRebar(type);
    renderAIRecommendations(type);

    const csContainer = document.getElementById('cross-section-content');
    const csCard = document.getElementById('cross-section-card');
    if (type === 'wall') {
      csCard.style.display = 'none';
    } else {
      csCard.style.display = '';
      CrossSection.draw(type, csContainer);
    }
  },

  updateLoadCombinations() {
    const combos = Solver.calculateLoadCombinations();
    this.renderLRFDCombos(combos.lrfd);
    this.renderASCombos(combos.asd);
  },

  renderLRFDCombos(combos) {
    const container = document.getElementById('lrfd-combos-container');
    if (!container) return;
    container.innerHTML = combos.map(c => {
      const lateral = c.lateral ? `<div style="font-size:0.65rem;color:rgba(210,153,34,0.8);margin-top:3px;">⚡ ${c.lateral}</div>` : '';
      return `<div style="margin-bottom:0.75rem;padding:0.6rem;background:rgba(88,166,255,0.06);border-radius:3px;border-left:3px solid rgba(88,166,255,0.3);">
        <div style="display:flex;justify-content:space-between;align-items:baseline;margin-bottom:4px;">
          <strong style="font-size:0.75rem;color:#58a6ff;">Combinación ${c.num}:</strong>
          <span style="font-weight:600;color:var(--text-primary);font-size:0.75rem;">${c.result} kN/m</span>
        </div>
        <div style="font-size:0.68rem;color:var(--text-muted);">${c.formula}</div>
        ${lateral}
      </div>`;
    }).join('');
  },

  renderASCombos(combos) {
    const container = document.getElementById('asd-combos-container');
    if (!container) return;
    container.innerHTML = combos.map(c => {
      const lateral = c.lateral ? `<div style="font-size:0.65rem;color:rgba(210,153,34,0.8);margin-top:3px;">⚡ ${c.lateral}</div>` : '';
      return `<div style="margin-bottom:0.75rem;padding:0.6rem;background:rgba(45,194,107,0.06);border-radius:3px;border-left:3px solid rgba(45,194,107,0.3);">
        <div style="display:flex;justify-content:space-between;align-items:baseline;margin-bottom:4px;">
          <strong style="font-size:0.75rem;color:#2dc26b;">Combinación ${c.num}:</strong>
          <span style="font-weight:600;color:var(--text-primary);font-size:0.75rem;">${c.result} kN/m</span>
        </div>
        <div style="font-size:0.68rem;color:var(--text-muted);">${c.formula}</div>
        ${lateral}
      </div>`;
    }).join('');
  },

  updateFoundationStability() {
    const lat = S.results.lateral;
    if (!lat) {
      document.getElementById('fs-volc-pos').textContent = '—';
      document.getElementById('fs-volc-neg').textContent = '—';
      document.getElementById('fs-desl').textContent = '—';
      return;
    }

    const fsvPos = lat.FS_volc_pos ? lat.FS_volc_pos.toFixed(2) : '—';
    const fsvNeg = lat.FS_volc_neg ? lat.FS_volc_neg.toFixed(2) : '—';
    const fsDesl = lat.FS_desl ? lat.FS_desl.toFixed(2) : '—';

    const posEl = document.getElementById('fs-volc-pos');
    const negEl = document.getElementById('fs-volc-neg');
    const deslEl = document.getElementById('fs-desl');

    if (posEl) {
      posEl.textContent = fsvPos;
      posEl.style.color = (parseFloat(fsvPos) < 1.5) ? '#ff6b6b' : '#58a6ff';
    }
    if (negEl) {
      negEl.textContent = fsvNeg;
      negEl.style.color = (parseFloat(fsvNeg) < 1.5) ? '#ff6b6b' : '#58a6ff';
    }
    if (deslEl) {
      deslEl.textContent = fsDesl;
      deslEl.style.color = (parseFloat(fsDesl) < 1.3) ? '#ff6b6b' : '#2dc26b';
    }
  }
};

// ══════════════════════════════════════════
// CONTROLLER — Init & Events
// ══════════════════════════════════════════
const Controller = {
  init() {
    this.bindInputs();
    this.bindTabs();
    this.bindChips();
    this.bindPanel();
    CanvasNav.bind();
    CanvasNav.setTool('hand');
    SpanManager.bind();
    // Ejecutar solver completo al arrancar — misma secuencia que refresh()
    this._fullRefresh();
    fitToContent();
    if (typeof FoundationUI !== 'undefined') FoundationUI.renderStrataUI();
  },

  // Secuencia completa de actualización — usada en init y en cada cambio de input
  _fullRefresh() {
    Solver.run();
    Renderer.draw();
    if (typeof updateSoilStressUI === 'function') updateSoilStressUI();
    this.updateLateralDisplays();
    if (typeof UI !== 'undefined') {
      if (typeof UI.updateLoadCombinations === 'function') UI.updateLoadCombinations();
      if (typeof UI.updateFoundationStability === 'function') UI.updateFoundationStability();
    }
    this.updateCriticalCaseDisplay();
    if (S.ui?.selectedEl) UI.selectElement(S.ui.selectedEl, S.ui.selectedSpan, S.ui.selectedNode);
    
    // Auto-save state to localStorage for generic CAD exporter
    try {
      if (typeof S !== 'undefined') {
        const pilar_b = (S.elements && S.elements.column && S.elements.column.section) ? S.elements.column.section.b : 0.20;
        const pilar_h = (S.elements && S.elements.column && S.elements.column.section) ? S.elements.column.section.h : 0.25;
        const cadena_sup_h = (S.elements && S.elements.beam_top && S.elements.beam_top.section) ? S.elements.beam_top.section.h : 0.15;
        const sobrecimiento_h = (S.elements && S.elements.beam_bot && S.elements.beam_bot.section) ? S.elements.beam_bot.section.h : 0.60;
        const sobrecimiento_b = (S.elements && S.elements.beam_bot && S.elements.beam_bot.section) ? S.elements.beam_bot.section.b : 0.20;
        
        const stateToSave = {
          H_muro: S.geometry ? S.geometry.H : 2.50,
          L_total: S.geometry && S.spans ? S.geometry.L * S.spans.length : 17.28,
          t_muro: S.geometry ? S.geometry.tw : 0.14,
          pilar_b: pilar_b,
          pilar_h: pilar_h,
          pilar_s: S.geometry ? S.geometry.L : 2.88,
          cadena_sup_h: cadena_sup_h,
          sobrecimiento_h: sobrecimiento_h,
          sobrecimiento_b: sobrecimiento_b,
          B_zapata: S.foundation ? S.foundation.B : 0.80,
          H_zapata: S.foundation ? S.foundation.Hf : 0.60,
          D_fundacion: S.foundation ? S.foundation.Df : 0.85,
          tipo_zapata: S.foundation ? S.foundation.type : 'L'
        };
        localStorage.setItem('ADOSAMIENTO_PROJECT_STATE', JSON.stringify(stateToSave));
      }
    } catch(err) {
      console.error("Error auto-guardando estado para CAD:", err);
    }
  },

  updateLateralDisplays() {
    const lat = S.results.lateral;
    if (!lat) return;

    // Actualizar chips de Cs y q_w
    const csEl = document.getElementById('l-Cs-display');
    if (csEl) csEl.textContent = `${lat.Cs} W`;
    const qwEl = document.getElementById('l-qw-display');
    if (qwEl) qwEl.textContent = `${lat.q_w} kPa`;

    // Renderizar esquema visual de cargas laterales
    this.renderLateralSchematic(lat);
  },

  renderLateralSchematic(lat) {
    const container = document.getElementById('lateral-load-schematic');
    const svg       = document.getElementById('lateral-scheme-svg');
    const summary   = document.getElementById('lateral-summary-table');
    if (!container || !svg) return;

    const F_wind = parseFloat(lat.F_wind)    || 0;
    const F_seis = parseFloat(lat.F_seismic) || 0;
    const F_h    = parseFloat(lat.F_h)       || 0;
    const gov    = lat.governing || 'sismo';
    const H      = S.story.H;
    const hApply = parseFloat(lat.hApply)    || H / 2;

    container.style.display = 'block';

    // ── Dimensiones del canvas ──────────────────────────────────────
    const VW = 240, VH = 165;
    // Muro (rectángulo vertical centrado)
    const wX = 115, wY = 18, wW = 20, wH = 110;
    // Zapata
    const fX = wX - 24, fY = wY + wH, fW = wW + 48, fH = 12;

    // Escala de flechas (máx 60px para la fuerza mayor)
    const maxF  = Math.max(F_wind, F_seis, 0.01);
    const scale = 60 / maxF;
    const lenW  = Math.max(6, Math.min(F_wind * scale, 60));
    const lenS  = Math.max(6, Math.min(F_seis * scale, 60));

    // Colores según quién gobierna
    const cWind = gov === 'viento'
      ? '#58a6ff'
      : 'rgba(88,166,255,0.45)';
    const cSeis = gov === 'sismo'
      ? '#ff7b54'
      : 'rgba(255,123,84,0.45)';
    const cGov  = gov === 'viento' ? '#58a6ff' : '#ff7b54';

    // ── Flechas de viento distribuidas ─────────────────────────────
    const N_ARROWS = 5;
    const sp = wH / (N_ARROWS + 1);
    let windSVG = '';
    for (let i = 1; i <= N_ARROWS; i++) {
      const ay = wY + i * sp;
      const ax1 = wX - lenW, ax2 = wX - 1;
      windSVG += `<line x1="${ax1}" y1="${ay}" x2="${ax2}" y2="${ay}"
                    stroke="${cWind}" stroke-width="1.4" stroke-linecap="round"/>
                  <polygon points="${ax2},${ay-2.5} ${ax2+6},${ay} ${ax2},${ay+2.5}"
                    fill="${cWind}"/>`;
    }

    // ── Flecha sísmica (resultante en hApply, bidireccional) ────────
    const sY   = wY + wH - (hApply / H) * wH;   // altura de aplicación en px
    const sX1  = wX - lenS - 4;
    const sX2  = wX - 1;
    // → derecha (principal)
    const seisRightSVG = `
      <line x1="${sX1}" y1="${sY}" x2="${sX2}" y2="${sY}"
        stroke="${cSeis}" stroke-width="2.2" stroke-linecap="round"/>
      <polygon points="${sX2},${sY-4} ${sX2+8},${sY} ${sX2},${sY+4}" fill="${cSeis}"/>`;
    // ← izquierda (secundaria, bidireccional)
    const sX1b = wX + wW + 1, sX2b = wX + wW + lenS + 4;
    const seisLeftSVG = `
      <line x1="${sX1b}" y1="${sY}" x2="${sX2b}" y2="${sY}"
        stroke="${cSeis}" stroke-width="2.2" stroke-linecap="round" stroke-dasharray="4,2" opacity="0.5"/>
      <polygon points="${sX2b},${sY-4} ${sX2b-8},${sY} ${sX2b},${sY+4}" fill="${cSeis}" opacity="0.5"/>`;

    // ── Línea de altura de aplicación (hApply) ─────────────────────
    const hLineY = sY;
    const hLineSVG = `
      <line x1="${wX + wW + 2}" y1="${wY + wH}" x2="${wX + wW + 2}" y2="${wY}"
        stroke="#444" stroke-width="0.6" stroke-dasharray="2,3"/>
      <line x1="${wX + wW}" y1="${hLineY}" x2="${wX + wW + 12}" y2="${hLineY}"
        stroke="${cSeis}" stroke-width="0.8" opacity="0.7"/>
      <text x="${wX + wW + 14}" y="${hLineY + 3}" fill="${cSeis}"
        font-size="6.5" font-family="monospace" opacity="0.8">h=${hApply.toFixed(2)}m</text>`;

    // ── Etiquetas ──────────────────────────────────────────────────
    const labelWindY = wY + 8;
    const labelSeisY = sY - 14;
    const labelWindSVG = `
      <text x="${wX - lenW - 4}" y="${labelWindY}" fill="${cWind}"
        font-size="7" font-family="monospace" text-anchor="end" font-weight="600">VIENTO</text>
      <text x="${wX - lenW - 4}" y="${labelWindY + 10}" fill="${cWind}"
        font-size="8" font-family="monospace" text-anchor="end">${F_wind.toFixed(2)} kN/m</text>`;
    const labelSeisSVG = `
      <text x="${wX - lenS - 6}" y="${labelSeisY}" fill="${cSeis}"
        font-size="7" font-family="monospace" text-anchor="end" font-weight="600">SISMO</text>
      <text x="${wX - lenS - 6}" y="${labelSeisY + 10}" fill="${cSeis}"
        font-size="8" font-family="monospace" text-anchor="end">${F_seis.toFixed(2)} kN/m</text>`;

    // ── Chip "Gobierna" ──────────────────────────────────────────
    const govLabel = gov.toUpperCase();
    const govChipSVG = `
      <rect x="${VW - 84}" y="6" width="78" height="24" rx="3"
        fill="rgba(0,0,0,0.35)" stroke="${cGov}" stroke-width="0.8"/>
      <text x="${VW - 45}" y="15" fill="${cGov}" font-size="6.5"
        font-family="monospace" text-anchor="middle" font-weight="600">▲ GOBIERNA</text>
      <text x="${VW - 45}" y="26" fill="${cGov}" font-size="8.5"
        font-family="monospace" text-anchor="middle" font-weight="bold">
        ${govLabel}: ${F_h.toFixed(2)} kN/m</text>`;

    // ── Terreno ────────────────────────────────────────────────────
    const groundY  = fY + fH + 2;
    let groundHatch = `<line x1="12" y1="${groundY}" x2="${VW - 12}" y2="${groundY}"
      stroke="#555" stroke-width="0.8"/>`;
    for (let i = 0; i < 11; i++) {
      const hx = 14 + i * 20;
      groundHatch += `<line x1="${hx + 6}" y1="${groundY}" x2="${hx - 4}" y2="${groundY + 8}"
        stroke="#444" stroke-width="0.7"/>`;
    }

    // ── Cota H ─────────────────────────────────────────────────────
    const cotaSVG = `
      <line x1="${wX + wW + 25}" y1="${wY}" x2="${wX + wW + 25}" y2="${wY + wH}"
        stroke="#6e7681" stroke-width="0.7"/>
      <line x1="${wX + wW + 22}" y1="${wY}" x2="${wX + wW + 28}" y2="${wY}"
        stroke="#6e7681" stroke-width="0.7"/>
      <line x1="${wX + wW + 22}" y1="${wY + wH}" x2="${wX + wW + 28}" y2="${wY + wH}"
        stroke="#6e7681" stroke-width="0.7"/>
      <text x="${wX + wW + 30}" y="${wY + wH / 2 + 3}" fill="#6e7681"
        font-size="7" font-family="monospace">H=${H}m</text>`;

    svg.innerHTML = `
      <rect width="${VW}" height="${VH}" fill="#0d1117"/>
      ${groundHatch}
      <rect x="${fX}" y="${fY}" width="${fW}" height="${fH}"
        fill="rgba(80,100,130,0.3)" stroke="#8b949e" stroke-width="1" rx="1"/>
      <rect x="${wX}" y="${wY}" width="${wW}" height="${wH}"
        fill="rgba(30,64,175,0.2)" stroke="#3b82f6" stroke-width="1.5" rx="1"/>
      ${cotaSVG}
      ${hLineSVG}
      ${windSVG}
      ${seisRightSVG}
      ${seisLeftSVG}
      ${labelWindSVG}
      ${labelSeisSVG}
      ${govChipSVG}
    `;

    // ── Tabla resumen debajo del SVG ────────────────────────────────
    if (summary) {
      const Cs   = lat.Cs  || '—';
      const q_w  = lat.q_w || '—';
      const MO   = lat.M_O || '—';
      const FSv  = lat.FS_v_critico || '—';
      const FSd  = lat.FS_d || '—';
      const FS_OK = parseFloat(FSv) >= 1.5 && parseFloat(FSd) >= 1.5;

      summary.innerHTML = `
        <table style="width:100%;border-collapse:collapse;font-size:0.68rem;color:var(--text);">
          <tr>
            <td style="padding:2px 4px;color:var(--text-muted);">C<sub>s</sub> (NCh433)</td>
            <td style="padding:2px 4px;text-align:right;font-weight:600;color:#d29922;">${Cs} W</td>
          </tr>
          <tr>
            <td style="padding:2px 4px;color:var(--text-muted);">q viento (NCh432)</td>
            <td style="padding:2px 4px;text-align:right;font-weight:600;color:#58a6ff;">${q_w} kPa</td>
          </tr>
          <tr>
            <td style="padding:2px 4px;color:var(--text-muted);">F sísmica</td>
            <td style="padding:2px 4px;text-align:right;color:#ff7b54;">${F_seis.toFixed(2)} kN/m</td>
          </tr>
          <tr>
            <td style="padding:2px 4px;color:var(--text-muted);">F viento</td>
            <td style="padding:2px 4px;text-align:right;color:#58a6ff;">${F_wind.toFixed(2)} kN/m</td>
          </tr>
          <tr>
            <td style="padding:2px 4px;color:var(--text-muted);">M volcante M<sub>O</sub></td>
            <td style="padding:2px 4px;text-align:right;">${MO} kN·m/m</td>
          </tr>
          <tr style="border-top:1px solid rgba(255,255,255,0.08);">
            <td style="padding:3px 4px;color:var(--text-muted);">FS volcamiento</td>
            <td style="padding:3px 4px;text-align:right;font-weight:600;
              color:${parseFloat(FSv) >= 1.5 ? '#3fb950' : '#f85149'};">${FSv} ${parseFloat(FSv) >= 1.5 ? '✓' : '✗'}</td>
          </tr>
          <tr>
            <td style="padding:3px 4px;color:var(--text-muted);">FS deslizamiento</td>
            <td style="padding:3px 4px;text-align:right;font-weight:600;
              color:${parseFloat(FSd) >= 1.5 ? '#3fb950' : '#f85149'};">${FSd} ${parseFloat(FSd) >= 1.5 ? '✓' : '✗'}</td>
          </tr>
        </table>`;
    }
  },

  updateCriticalCaseDisplay() {
    // Actualizar display del caso crítico en el panel de cargas
    const dispEl = document.getElementById('critical-case-display');
    const labelEl = document.getElementById('critical-case-label');

    if (!dispEl || !labelEl) return;

    // Obtener el primer nodo (columna) para mostrar su caso crítico
    const firstNodeId = S.nodes[0]?.id;
    if (!firstNodeId || !S.results.columns || !S.results.columns[firstNodeId]) {
      dispEl.style.display = 'none';
      return;
    }

    const colResult = S.results.columns[firstNodeId];
    if (colResult.isCombined && colResult.caseLabel) {
      // Mostrar si hay cargas distribuidas
      dispEl.style.display = 'block';
      labelEl.textContent = colResult.caseLabel;
    } else {
      // Ocultar si no hay cargas distribuidas
      dispEl.style.display = 'none';
    }
  },

  bindInputs() {
    const refresh = () => this._fullRefresh();
    const renderStrata = () => { if (typeof FoundationUI !== 'undefined') FoundationUI.renderStrataUI(); };

    // g-L applies to the FIRST span (single-span mode)
    const gL = document.getElementById('g-L');
    if (gL) gL.addEventListener('input', () => {
      const v = parseFloat(gL.value);
      if (!isNaN(v) && v > 0) {
        S.nodes[1].x = v;  // Move second node
        refresh();
      }
    });

    const gH = document.getElementById('g-H');
    if (gH) gH.addEventListener('input', () => {
      const v = parseFloat(gH.value);
      if (!isNaN(v)) { S.story.H = v; refresh(); }
    });

    const gtw = document.getElementById('g-tw');
    if (gtw) gtw.addEventListener('input', () => {
      const v = parseFloat(gtw.value);
      if (!isNaN(v)) {
        S.spans.forEach(sp => { if (sp.type === 'muro') sp.tw = v / 100; });
        refresh();
      }
    });

    // Column inputs — apply to ALL columns
    const gcb = document.getElementById('g-cb');
    if (gcb) gcb.addEventListener('input', () => {
      const v = parseFloat(gcb.value) / 100;
      if (!isNaN(v)) { Object.values(S.columns).forEach(c => c.section.b = v); refresh(); }
    });
    const gch = document.getElementById('g-ch');
    if (gch) gch.addEventListener('input', () => {
      const v = parseFloat(gch.value) / 100;
      if (!isNaN(v)) { Object.values(S.columns).forEach(c => c.section.h = v); refresh(); }
    });

    // Beam inputs — apply to ALL spans
    const gbb = document.getElementById('g-bb');
    if (gbb) gbb.addEventListener('input', () => {
      const v = parseFloat(gbb.value) / 100;
      if (!isNaN(v)) { S.spans.forEach(sp => { sp.beamTop.section.b = v; sp.beamBot.section.b = v; }); refresh(); }
    });
    const gbh = document.getElementById('g-bh');
    if (gbh) gbh.addEventListener('input', () => {
      const v = parseFloat(gbh.value) / 100;
      if (!isNaN(v)) { S.spans.forEach(sp => { sp.beamTop.section.h = v; sp.beamBot.section.h = v; }); refresh(); }
    });

    // Loads
    [['l-qD','qD',1],['l-qL','qL',1],['l-fd','fd',1],['l-fl','fl',1],['l-qRoof','qRoof',1],['l-fRoof','fRoof',1]].forEach(([id,key,sc]) => {
      const el = document.getElementById(id);
      if (!el) return;
      el.addEventListener('input', () => {
        const v = parseFloat(el.value);
        if (!isNaN(v)) { S.story.loads[key] = v * sc; refresh(); }
      });
    });

    // Cargas Laterales (sismo + viento)
    const bindLateral = (id, path, parseFn = parseFloat) => {
      const el = document.getElementById(id);
      if (!el) return;
      el.addEventListener('change', () => {
        const v = parseFn(el.value);
        if (v !== null && !isNaN(v)) {
          const keys = path.split('.');
          let obj = S.story.lateral;
          for (let i = 0; i < keys.length - 1; i++) obj = obj[keys[i]];
          obj[keys[keys.length - 1]] = v;
          refresh();
        }
      });
    };
    bindLateral('l-seismic-zone', 'seismic.zone', x => parseInt(x));
    bindLateral('l-soil-type',    'seismic.soilType', x => x);
    bindLateral('l-importance',   'seismic.I', parseFloat);
    bindLateral('l-wind-v',       'wind.V_basic', parseFloat);

    // Cargas distribuidas laterales (inputs explícitos para columnas)
    [['l-ww','w_wind',1],['l-ws','w_sismo',1]].forEach(([id,key,sc]) => {
      const el = document.getElementById(id);
      if (!el) return;
      el.addEventListener('input', () => {
        const v = parseFloat(el.value);
        if (!isNaN(v)) { S.story.loads[key] = v * sc; refresh(); }
      });
    });

    // Materials
    [['m-fc','fc',1],['m-fy','fy',1],['m-gc','gc',1],['m-gm','gm',1],['m-rec','rec',0.01]].forEach(([id,key,sc]) => {
      const el = document.getElementById(id);
      if (!el) return;
      el.addEventListener('input', () => {
        const v = parseFloat(el.value);
        if (!isNaN(v)) { S.story.materials[key] = v * sc; refresh(); }
      });
    });

    // Brick preset
    document.getElementById('m-brick')?.addEventListener('change', e => {
      S.story.materials.gm = parseFloat(e.target.value);
      document.getElementById('m-gm').value = S.story.materials.gm;
      refresh();
    });

    // Foundation geometry + geotechnical scalar inputs
    [['f-B','B',1],['f-Hf','Hf',1],['f-Df','Df',1],
     ['f-NF','NF',1],['f-FS','FS',1],['f-beta','beta',1]].forEach(([id,key,sc]) => {
      const el = document.getElementById(id);
      if (!el) return;
      el.addEventListener('input', () => {
        const v = parseFloat(el.value);
        if (!isNaN(v)) {
          S.story.foundation[key] = v * sc;
          S.foundation[key] = v * sc;
          refresh();
          FoundationUI.renderStrataUI();
        }
      });
    });

    // "Add stratum" button
    document.getElementById('btn-add-stratum')?.addEventListener('click', () => {
      const newId = 'str' + Date.now();
      const newStratum = { id: newId, name: 'Nuevo Estrato', h: 1.0, type: 'drenado', gamma: 18, phi: 30, c: 0 };
      S.story.foundation.strata.push(newStratum);
      S.foundation.strata.push(newStratum);
      FoundationUI.renderStrataUI();
      refresh();
    });

    document.getElementById('solve-btn')?.addEventListener('click', () => MemoryReport.open());

    // Load combinations toggle buttons
    document.getElementById('combo-toggle-lrfd')?.addEventListener('click', (e) => {
      document.getElementById('combo-toggle-lrfd').classList.add('active');
      document.getElementById('combo-toggle-asd').classList.remove('active');
      document.getElementById('combo-lrfd-list').style.display = 'block';
      document.getElementById('combo-asd-list').style.display = 'none';
    });
    document.getElementById('combo-toggle-asd')?.addEventListener('click', (e) => {
      document.getElementById('combo-toggle-asd').classList.add('active');
      document.getElementById('combo-toggle-lrfd').classList.remove('active');
      document.getElementById('combo-asd-list').style.display = 'block';
      document.getElementById('combo-lrfd-list').style.display = 'none';
    });
  },

  bindTabs() {
    const ALL_TABS = ['config', 'geometry', 'loads', 'materials', 'foundation', 'ai-advisor', 'compositor'];
    document.querySelectorAll('.tab-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
        ALL_TABS.forEach(t => {
          const el = document.getElementById(`tab-content-${t}`);
          if (el) el.style.display = 'none';
        });
        btn.classList.add('active');
        const activeContent = document.getElementById(`tab-content-${btn.dataset.tab}`);
        if (activeContent) activeContent.style.display = '';

        // Activar/desactivar modo compositor según tab seleccionado
        const isCompositor = btn.dataset.tab === 'compositor';
        if (typeof S !== 'undefined' && S.composer) {
          S.composer.active = isCompositor;
          if (typeof ComposerRenderer !== 'undefined') ComposerRenderer.draw();
          if (!isCompositor && typeof ComposerEngine !== 'undefined') ComposerEngine.clearTool();
          btn.style.borderBottomColor = isCompositor ? '#3fb950' : '';
          btn.style.color = isCompositor ? '#56d364' : '';
        }
      });
    });
  },

  bindChips() {
    // ── New canvas filter bar toggles ─────────────────────────────

    // Diagram toggles: M / V / N
    document.querySelectorAll('.cfb-toggle[data-type]').forEach(btn => {
      btn.addEventListener('click', () => {
        btn.classList.toggle('active');
        const type = btn.dataset.type;
        S.diagrams[type] = btn.classList.contains('active');
        // Sync legacy hidden chips
        const legacyChip = document.querySelector(`#diagram-chips .chip[data-type="${type}"]`);
        if (legacyChip) legacyChip.classList.toggle('active', S.diagrams[type]);
        Renderer.draw();
      });
    });

    // Layer toggles: loads / dims / labels / reactions
    document.querySelectorAll('.cfb-toggle[data-layer]').forEach(btn => {
      btn.addEventListener('click', () => {
        btn.classList.toggle('active');
        const layer = btn.dataset.layer;
        const visible = btn.classList.contains('active');
        // Map layer names to SVG group IDs
        const layerMap = {
          loads:     'loads-layer',
          dims:      'dims-layer',
          labels:    'labels-layer',
          reactions: 'supports-layer'
        };
        const el = document.getElementById(layerMap[layer]);
        if (el) el.style.display = visible ? '' : 'none';
        S.ui.layers = S.ui.layers || {};
        S.ui.layers[layer] = visible;
      });
    });

    // Normalize toggle
    document.getElementById('chip-normalize')?.addEventListener('click', function() {
      this.classList.toggle('active');
      S.diagrams.normalize = this.classList.contains('active');
      Renderer.draw();
    });

    // Legacy hidden chips (backward compat for any code that touches them)
    document.querySelectorAll('#diagram-chips .chip').forEach(chip => {
      chip.addEventListener('click', () => {
        chip.classList.toggle('active');
        if (chip.id === 'chip-normalize') {
          S.diagrams.normalize = chip.classList.contains('active');
        } else {
          S.diagrams[chip.dataset.type] = chip.classList.contains('active');
        }
        Renderer.draw();
      });
    });
  },

  bindPanel() {
    document.getElementById('panel-close').addEventListener('click', () => {
      document.getElementById('panel-right').classList.add('hidden');
      document.querySelectorAll('.el-beam, .el-column, .el-wall').forEach(e => e.classList.remove('selected'));
      S.ui.selectedEl = null;
      document.getElementById('sb-selected').textContent = 'Sin selección';
    });

    document.getElementById('btn-open-detail')?.addEventListener('click', () => {
      if (S.ui.selectedEl && S.ui.selectedEl !== 'wall') {
        ElementDetail.open(S.ui.selectedEl);
      }
    });

    document.getElementById('btn-open-memory')?.addEventListener('click', () => {
      MemoryReport.open();
    });

    document.getElementById('tool-view-all-sections')?.addEventListener('click', () => {
      document.getElementById('all-sections-overlay').classList.remove('hidden');
      ElementDetail.draw('beam_top', 'svg-all-beam-top');
      ElementDetail.draw('beam_bot', 'svg-all-beam-bot');
      ElementDetail.draw('column', 'svg-all-column');
      // Foundation has its own internal draw that doesn't easily take target id right now
      // so we use a trick: temporarily swap id
      const origSvg = document.getElementById('el-detail-svg');
      const targetSvg = document.getElementById('svg-all-foundation');
      if (origSvg && targetSvg) {
        origSvg.id = 'temp-svg';
        targetSvg.id = 'el-detail-svg';
        ElementDetail._drawFoundation();
        targetSvg.id = 'svg-all-foundation';
        origSvg.id = 'el-detail-svg';
      }
    });

    document.getElementById('btn-all-sections-close')?.addEventListener('click', () => {
      document.getElementById('all-sections-overlay').classList.add('hidden');
    });

    document.addEventListener('keydown', e => {
      if (e.key === 'Escape') {
        ElementDetail.close();
        document.getElementById('all-sections-overlay')?.classList.add('hidden');
      }
    });
  }
};

// ══════════════════════════════════════════
// PROJECT SAVER — Guardar proyecto como JSON
// ══════════════════════════════════════════
const ProjectSaver = {
  save() {
    const now = new Date();
    const ts = now.toISOString().replace(/[:.]/g, '-').slice(0, 19);
    const fileName = `proyecto_${ts}.json`;

    const data = {
      version: '2.0',
      savedAt: now.toISOString(),
      story:   S.story,
      nodes:   S.nodes,
      spans:   S.spans,
      columns: S.columns
    };

    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = fileName;
    a.click();
    URL.revokeObjectURL(url);

    S.ui.projectDirty = false;
    document.getElementById('save-btn').textContent = '✓ Guardado';
    setTimeout(() => {
      document.getElementById('save-btn').innerHTML = `
        <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/></svg>
        GUARDAR PROYECTO`;
    }, 2000);
  }
};

// ══════════════════════════════════════════
// SPAN MANAGER — Gestión de vanos multi-elemento
// ══════════════════════════════════════════
const SpanManager = {
  showForm() {
    document.getElementById('add-span-form').classList.remove('hidden');
  },
  hideForm() {
    document.getElementById('add-span-form').classList.add('hidden');
  },

  addSpan(L, type) {
    const lastNode = S.nodes[S.nodes.length - 1];
    const newX = lastNode.x + L;

    const newNodeId = `n${Date.now()}`;
    S.nodes.push({ id: newNodeId, x: newX });

    const newSpanId = `sp${Date.now()}`;
    S.spans.push({
      id: newSpanId,
      fromNode: lastNode.id,
      toNode:   newNodeId,
      type,
      tw: S.spans[0]?.tw ?? 0.14,
      beamTop: { section: { ...S.spans[0].beamTop.section }, rebar: defaultRebar('beam_top') },
      beamBot: { section: { ...S.spans[0].beamBot.section }, rebar: defaultRebar('beam_bot') }
    });

    S.columns[newNodeId] = {
      section: { ...Object.values(S.columns)[0].section },
      rebar: defaultRebar('column')
    };

    // Update g-L input to reflect first span length only
    document.getElementById('g-L').value = getSpanL(S.spans[0]).toFixed(1);

    // Show/hide remove button
    document.getElementById('tool-remove-span').style.display =
      S.spans.length > 1 ? '' : 'none';

    Solver.run();
    Renderer.draw();

    S.ui.selectedSpan = newSpanId;
    S.ui.selectedNode = newNodeId;
  },

  removeLastSpan() {
    if (S.spans.length <= 1) return;
    const lastSpan = S.spans.pop();
    const lastNode = S.nodes.pop();
    delete S.columns[lastNode.id];

    if (S.ui.selectedSpan === lastSpan.id) S.ui.selectedSpan = S.spans[S.spans.length - 1].id;
    if (S.ui.selectedNode === lastNode.id) S.ui.selectedNode = S.nodes[S.nodes.length - 1].id;

    document.getElementById('tool-remove-span').style.display =
      S.spans.length > 1 ? '' : 'none';

    Solver.run();
    Renderer.draw();
  },

  bind() {
    document.getElementById('tool-add-span')?.addEventListener('click', () => this.showForm());

    document.getElementById('btn-add-span-ok')?.addEventListener('click', () => {
      const L    = parseFloat(document.getElementById('new-span-L').value) || 4;
      const type = document.getElementById('new-span-type').value;
      this.addSpan(L, type);
      this.hideForm();
    });

    document.getElementById('btn-add-span-cancel')?.addEventListener('click', () => this.hideForm());

    document.getElementById('tool-remove-span')?.addEventListener('click', () => {
      if (S.spans.length > 1) this.removeLastSpan();
    });
  }
};

// ══════════════════════════════════════════
// PAN / ZOOM — Navegación en canvas
// ══════════════════════════════════════════

/**
 * Centra y escala la vista para mostrar toda la estructura.
 * Se llama en el reset y en el render inicial.
 */
function fitToContent() {
  recalcLayout();
  const canvas = document.getElementById('structural-canvas');
  if (!canvas) return;
  const W  = canvas.clientWidth  || 900;
  const Hc = canvas.clientHeight || 500;

  const f      = S.story.foundation;
  const totalL = getTotalL();
  const wallH  = S.story.H;
  const btH    = S.spans[0]?.beamTop?.section?.h || 0.15;
  const Hf     = f.Hf || 0.60;
  const Df     = f.Df || 0.85;
  const B      = f.B  || 0.80;

  // Bounding box de la estructura en coordenadas SVG
  const svgLeft  = C.ox - C.scale * (f.type === 'L-inv' ? B : 0);
  const svgRight = C.ox + C.scale * (totalL + (f.type === 'L' ? B : f.type === 'T' ? B / 2 : 0));
  const svgTop   = C.oy - C.scale * (wallH + btH + 0.4);
  const svgBot   = C.oy + C.scale * (Df + 0.3);

  const svgW  = svgRight - svgLeft;
  const svgH  = svgBot   - svgTop;
  const svgCx = (svgLeft + svgRight) / 2;
  const svgCy = (svgTop  + svgBot)   / 2;

  const pad  = 60;
  const zoom = Math.min(
    (W  - pad * 2) / svgW,
    (Hc - pad * 2) / svgH,
    2.5
  );

  const v = S.ui.view;
  v.zoom = Math.max(zoom, 0.15);
  v.x    = W  / 2 - svgCx * v.zoom;
  v.y    = Hc / 2 - svgCy * v.zoom;
  applyViewTransform();
}

function clampView() {
  const canvas = document.getElementById('structural-canvas');
  if (!canvas) return;
  const W  = canvas.clientWidth  || 900;
  const Hc = canvas.clientHeight || 500;
  const v  = S.ui.view;
  const tl = document.getElementById('transform-layer');

  if (!tl) return;

  // ──────────────────────────────────────────────
  // RESTRICCIÓN DE ZOOM
  // ──────────────────────────────────────────────
  // Mínimo: 0.15x (para ver toda la estructura con margen)
  // Máximo: 8.0x (no acercarse demasiado)
  const MIN_ZOOM = 0.15;
  const MAX_ZOOM = 8.0;
  v.zoom = Math.min(Math.max(v.zoom, MIN_ZOOM), MAX_ZOOM);

  // ──────────────────────────────────────────────
  // RESTRICCIÓN DE PAN (movimiento)
  // ──────────────────────────────────────────────
  // Fórmula: un punto SVG (px,py) aparece en pantalla en:
  //   screenX = px * zoom + v.x
  //   screenY = py * zoom + v.y
  // Para mantener al menos MARGIN px del modelo visible:
  //   - borde derecho del contenido en pantalla >= MARGIN  → v.x >= MARGIN - contentRight*zoom
  //   - borde izquierdo del contenido en pantalla <= W-MARGIN → v.x <= (W-MARGIN) - contentLeft*zoom
  try {
    const bbox = tl.getBBox();
    if (bbox && bbox.width > 0 && bbox.height > 0) {
      const contentLeft   = bbox.x;
      const contentTop    = bbox.y;
      const contentRight  = bbox.x + bbox.width;
      const contentBottom = bbox.y + bbox.height;

      const MARGIN = 80; // px mínimos del modelo que deben seguir visibles

      const minX = MARGIN - contentRight  * v.zoom;  // borde derecho en pantalla
      const maxX = (W  - MARGIN) - contentLeft   * v.zoom;  // borde izquierdo en pantalla
      const minY = MARGIN - contentBottom * v.zoom;  // borde inferior en pantalla
      const maxY = (Hc - MARGIN) - contentTop    * v.zoom;  // borde superior en pantalla

      v.x = Math.min(Math.max(v.x, minX), maxX);
      v.y = Math.min(Math.max(v.y, minY), maxY);
    }
  } catch (e) {
    // Si getBBox falla, restricciones básicas
    const pad = 80;
    const sW = C.scale * getTotalL() * v.zoom;
    const sH = C.scale * S.story.H * v.zoom;
    const originX = C.ox * v.zoom;

    v.x = Math.min(Math.max(v.x, -(originX + sW - pad)), W - pad);
    v.y = Math.min(Math.max(v.y, -(Hc + sH * 0.5)), Hc * 0.85);
  }
}

function applyViewTransform() {
  const g = document.getElementById('transform-layer');
  if (!g) return;
  clampView();
  const { x, y, zoom } = S.ui.view;
  g.setAttribute('transform', `translate(${x},${y}) scale(${zoom})`);

  // Set the zoom custom property on the canvas for dynamic CSS text scaling
  const canvas = document.getElementById('structural-canvas');
  if (canvas) {
    canvas.style.setProperty('--svg-zoom', zoom);
  }
}

const CanvasNav = {
  _dragging: false,
  _lastX: 0,
  _lastY: 0,
  _handMode: true,    // por defecto: arrastre con click izquierdo
  _selectMode: false, // true solo cuando el usuario activa explícitamente "Seleccionar"

  get handMode() { return this._handMode; },

  setTool(mode) {
    this._selectMode = (mode === 'select');
    this._handMode   = !this._selectMode; // hand mode activo en todo momento excepto al seleccionar
    const canvas = document.getElementById('structural-canvas');
    // Update toolbar button active states
    document.getElementById('tool-select')?.classList.toggle('active', this._selectMode);
    document.getElementById('tool-hand')?.classList.toggle('active',  !this._selectMode);
    // Update canvas cursor and CSS class
    if (canvas) {
      canvas.style.cursor = this._selectMode ? 'default' : 'grab';
      canvas.classList.toggle('hand-mode', !this._selectMode);
    }
    // En modo selección, los elementos estructurales reciben clics
    const tl = document.getElementById('transform-layer');
    if (tl) tl.style.pointerEvents = this._selectMode ? 'all' : 'none';
  },

  bind() {
    const canvas = document.getElementById('structural-canvas');
    if (!canvas) return;

    // ── Wheel → zoom centrado en el cursor ───────────────────────
    // Matemática exacta:
    //   svgX = punto fijo en coordenadas SVG bajo el cursor
    //   Tras cambiar zoom: v.x = mx - svgX * newZoom  (el punto sigue bajo el cursor)
    canvas.addEventListener('wheel', e => {
      e.preventDefault();

      // Normalizar deltaY — trackpads y mouses pueden dar valores muy distintos
      // Clampear a [-100, 100] y calcular factor suave
      const delta    = Math.max(-100, Math.min(100, e.deltaY));
      const factor   = Math.pow(1.0008, -delta);   // ~1.08 por cada 100 unidades

      const rect = canvas.getBoundingClientRect();
      const mx   = e.clientX - rect.left;
      const my   = e.clientY - rect.top;
      const v    = S.ui.view;

      // Punto fijo en espacio SVG (no cambia durante el zoom)
      const svgX = (mx - v.x) / v.zoom;
      const svgY = (my - v.y) / v.zoom;

      // Nuevo zoom dentro de límites
      const newZoom = Math.min(Math.max(v.zoom * factor, 0.15), 8);

      if (newZoom !== v.zoom) {
        v.zoom = newZoom;
        // Recalcular pan para mantener svgX/svgY exactamente bajo el cursor
        v.x = mx - svgX * v.zoom;
        v.y = my - svgY * v.zoom;
        applyViewTransform();
      }
    }, { passive: false });

    // ── Mousedown: hand tool or middle-button/Alt → start drag ───
    canvas.addEventListener('mousedown', e => {
      // Focus tool logic (Rectangle Zoom)
      if (this._focusMode && e.button === 0) {
        e.preventDefault();
        const rect = canvas.getBoundingClientRect();
        this._focusStart = {
          x: e.clientX - rect.left,
          y: e.clientY - rect.top
        };
        
        this._focusRect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
        this._focusRect.setAttribute('fill', 'rgba(47,129,247,0.2)');
        this._focusRect.setAttribute('stroke', 'rgba(47,129,247,0.8)');
        this._focusRect.setAttribute('stroke-width', '1');
        this._focusRect.setAttribute('x', this._focusStart.x);
        this._focusRect.setAttribute('y', this._focusStart.y);
        this._focusRect.setAttribute('width', 0);
        this._focusRect.setAttribute('height', 0);
        canvas.appendChild(this._focusRect);
        return;
      }

      // Pan: click izquierdo cuando NO está en modo selección, o botón central siempre
      const isPanEvent = (e.button === 0 && !this._selectMode) || e.button === 1;
      if (isPanEvent) {
        e.preventDefault();
        this._dragging = true;
        this._lastX = e.clientX;
        this._lastY = e.clientY;
        canvas.style.cursor = 'grabbing';
      }
    });

    window.addEventListener('mousemove', e => {
      if (this._focusMode && this._focusStart && this._focusRect) {
        const rect = canvas.getBoundingClientRect();
        const mx = Math.max(0, Math.min(e.clientX - rect.left, rect.width));
        const my = Math.max(0, Math.min(e.clientY - rect.top, rect.height));
        
        const x = Math.min(this._focusStart.x, mx);
        const y = Math.min(this._focusStart.y, my);
        const w = Math.abs(mx - this._focusStart.x);
        const h = Math.abs(my - this._focusStart.y);
        
        this._focusRect.setAttribute('x', x);
        this._focusRect.setAttribute('y', y);
        this._focusRect.setAttribute('width', w);
        this._focusRect.setAttribute('height', h);
        return;
      }

      if (!this._dragging) return;
      const dx = e.clientX - this._lastX;
      const dy = e.clientY - this._lastY;
      S.ui.view.x += dx;
      S.ui.view.y += dy;
      this._lastX = e.clientX;
      this._lastY = e.clientY;
      applyViewTransform();
    });

    window.addEventListener('mouseup', e => {
      if (this._focusMode && this._focusStart && this._focusRect) {
        const rect = canvas.getBoundingClientRect();
        const mx = Math.max(0, Math.min(e.clientX - rect.left, rect.width));
        const my = Math.max(0, Math.min(e.clientY - rect.top, rect.height));
        
        canvas.removeChild(this._focusRect);
        this._focusRect = null;
        
        const w = Math.abs(mx - this._focusStart.x);
        const h = Math.abs(my - this._focusStart.y);
        
        if (w > 10 && h > 10) {
           const cx = Math.min(this._focusStart.x, mx) + w / 2;
           const cy = Math.min(this._focusStart.y, my) + h / 2;
           
           const v = S.ui.view;
           const svgCx = (cx - v.x) / v.zoom;
           const svgCy = (cy - v.y) / v.zoom;
           
           const W = canvas.clientWidth || 900;
           const H_canvas = canvas.clientHeight || 500;
           
           const zoomX = W / w;
           const zoomY = H_canvas / h;
           const newZoom = v.zoom * Math.min(zoomX, zoomY) * 0.9; // 10% margin
           
           v.zoom = Math.min(newZoom, 8.0);
           v.x = W / 2 - svgCx * v.zoom;
           v.y = H_canvas / 2 - svgCy * v.zoom;
           applyViewTransform();
        }
        
        this._focusStart = null;
        this._focusMode = false;
        document.getElementById('tool-focus-selection')?.classList.remove('active');
        canvas.style.cursor = this._handMode ? 'grab' : 'default';
        const tl = document.getElementById('transform-layer');
        if (tl) tl.style.pointerEvents = this._handMode ? 'none' : 'all';
        return;
      }

      if (this._dragging) {
        this._dragging = false;
        canvas.style.cursor = this._focusMode ? 'crosshair'
          : this._selectMode ? 'default'
          : 'grab';
      }
    });

    // ── Double-click → siempre resetea la vista ───────────────────
    canvas.addEventListener('dblclick', e => {
      if (!this._focusMode) this.resetView();
    });

    // ── Toolbar buttons ───────────────────────────────────────────
    document.getElementById('tool-select')?.addEventListener('click', () => {
      this._focusMode = false;
      document.getElementById('tool-focus-selection')?.classList.remove('active');
      this.setTool('select');
    });
    document.getElementById('tool-hand')?.addEventListener('click', () => {
      this._focusMode = false;
      document.getElementById('tool-focus-selection')?.classList.remove('active');
      this.setTool('hand');
    });
    document.getElementById('tool-reset-view')?.addEventListener('click', () => this.resetView());
    
    document.getElementById('tool-zoom-in')?.addEventListener('click', () => {
      S.ui.view.zoom = Math.min(S.ui.view.zoom * 1.2, 8);
      applyViewTransform();
    });
    
    document.getElementById('tool-zoom-out')?.addEventListener('click', () => {
      S.ui.view.zoom = Math.max(S.ui.view.zoom / 1.2, 0.15);
      applyViewTransform();
    });
    
    document.getElementById('tool-focus-selection')?.addEventListener('click', (e) => {
      this._focusMode = true;
      // Disable other tools
      document.getElementById('tool-select')?.classList.remove('active');
      document.getElementById('tool-hand')?.classList.remove('active');
      this._handMode = false;
      
      e.currentTarget.classList.add('active');
      canvas.style.cursor = 'crosshair';
      
      const tl = document.getElementById('transform-layer');
      if (tl) tl.style.pointerEvents = 'none'; // disable element selection while focusing
    });

    // ── Keyboard shortcuts: S=select, H=hand ─────────────────────
    window.addEventListener('keydown', e => {
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
      if (e.key === 'h' || e.key === 'H') {
        this._focusMode = false;
        document.getElementById('tool-focus-selection')?.classList.remove('active');
        this.setTool('hand');
      }
      if (e.key === 's' || e.key === 'S') {
        this._focusMode = false;
        document.getElementById('tool-focus-selection')?.classList.remove('active');
        this.setTool('select');
      }
      if (e.key === 'Escape') {
        this._focusMode = false;
        document.getElementById('tool-focus-selection')?.classList.remove('active');
        this.setTool('select');
      }
    });
  },

  resetView() {
    fitToContent();
  }
};


// ══════════════════════════════════════════
// PROJECT LOADER — Cargar proyecto desde JSON
// ══════════════════════════════════════════
const ProjectLoader = {
  load() {
    document.getElementById('file-load-input').click();
  },

  onFile(file) {
    const reader = new FileReader();
    reader.onload = e => {
      try {
        const data = JSON.parse(e.target.result);
        this.restore(data);
      } catch {
        alert('Archivo inválido — no se pudo leer el proyecto.');
      }
    };
    reader.readAsText(file);
  },

  restore(data) {
    if (data.version === '2.0' && data.spans) {
      // v2 format — direct restore
      S.story   = data.story;
      S.nodes   = data.nodes;
      S.spans   = data.spans;
      S.columns = data.columns;
    } else if (data.geometry) {
      // v1 format — migrate to v2
      const g = data.geometry || {};
      const ld = data.loads || {};
      const mat = data.materials || {};
      S.story = { H: g.H ?? 2.5, loads: ld, materials: mat };
      S.nodes = [{ id:'n0', x:0 }, { id:'n1', x: g.L ?? 4 }];
      const elBT = data.elements?.beam_top || {};
      const elBB = data.elements?.beam_bot || {};
      const elC  = data.elements?.column   || {};
      S.spans = [{
        id: 'sp0', fromNode:'n0', toNode:'n1',
        type: 'muro', tw: g.tw ?? 0.14,
        beamTop: { section: elBT.section || {b:0.20,h:0.20}, rebar: elBT.rebar || defaultRebar() },
        beamBot: { section: elBB.section || {b:0.20,h:0.20}, rebar: elBB.rebar || defaultRebar() }
      }];
      S.columns = {
        'n0': { section: elC.section || {b:0.20,h:0.20}, rebar: elC.rebar || defaultRebar() },
        'n1': { section: elC.section || {b:0.20,h:0.20}, rebar: elC.rebar || defaultRebar() }
      };
    } else {
      alert('Formato de archivo no reconocido.');
      return;
    }

    S.ui.selectedSpan = S.spans[0]?.id;
    S.ui.selectedNode = S.nodes[0]?.id;
    S.ui.selectedEl   = null;

    // Sync sidebar
    const set = (id, val) => { const el = document.getElementById(id); if (el) el.value = val; };
    set('g-L',  getSpanL(S.spans[0]).toFixed(1));
    set('g-H',  S.story.H);
    set('g-tw', (S.spans[0]?.tw ?? 0.14) * 100);
    set('l-qD', S.story.loads.qD);
    set('l-qL', S.story.loads.qL);
    set('l-fd', S.story.loads.fd);
    set('l-fl', S.story.loads.fl);
    set('l-qRoof', S.story.loads.qRoof);
    set('l-fRoof', S.story.loads.fRoof);
    // Cargas laterales
    if (S.story.lateral) {
      set('l-seismic-zone', S.story.lateral.seismic.zone);
      set('l-soil-type',    S.story.lateral.seismic.soilType);
      set('l-importance',   S.story.lateral.seismic.I.toFixed(1));
      set('l-wind-v',       S.story.lateral.wind.V_basic);
    }
    set('m-gc', S.story.materials.gc);
    set('m-gm', S.story.materials.gm);
    set('m-rec', S.story.materials.rec * 100);
    set('f-B', S.story.foundation.B.toFixed(2));
    set('f-Hf', S.story.foundation.Hf.toFixed(2));
    set('f-Df', S.story.foundation.Df.toFixed(2));
    set('f-NF', (S.story.foundation.NF ?? 3.0).toFixed(1));
    set('f-FS', (S.story.foundation.FS ?? 3.0).toFixed(1));
    set('f-beta', (S.story.foundation.beta ?? 0));

    const fcEl = document.getElementById('m-fc');
    if (fcEl) fcEl.value = S.story.materials.fc;
    const fyEl = document.getElementById('m-fy');
    if (fyEl) fyEl.value = S.story.materials.fy;

    document.getElementById('panel-right').classList.add('hidden');
    document.getElementById('tool-remove-span').style.display =
      S.spans.length > 1 ? '' : 'none';

    Solver.run();
    Renderer.draw();
    if (typeof updateSoilStressUI === 'function') updateSoilStressUI();

    document.getElementById('load-btn').textContent = '✓ Cargado';
    setTimeout(() => {
      document.getElementById('load-btn').innerHTML =
        `<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M5 12H19M12 5l7 7-7 7"/></svg> CARGAR PROYECTO`;
    }, 2000);
  }
};

document.addEventListener('DOMContentLoaded', () => {
  // Note: Config module is server-side only (uses Node.js fs/path APIs)
  // Configuration panel is available in the "Configuración" tab for future server-side integration

  // Initialize configuration (.env file persistence) - Server-side only
  // if (typeof Config !== 'undefined') {
  //   Config.initializeIfNeeded();
  //   const configStatus = Config.getApiKeyStatus();
  //   console.log('[App Startup] Configuration Status:', configStatus);
  // }

  // Note: API Key configuration UI is in the sidebar but requires server-side handler
  // Future: Connect to /api/config endpoints for save/test operations

  Controller.init();
  document.getElementById('save-btn').addEventListener('click', () => ProjectSaver.save());
  document.getElementById('load-btn').addEventListener('click', () => ProjectLoader.load());
  const fileInput = document.getElementById('file-load-input');
  if (fileInput) {
    fileInput.addEventListener('change', e => {
      const file = e.target.files[0];
      if (file) { ProjectLoader.onFile(file); fileInput.value = ''; }
    });
  }

  // ── Vista 3D ──────────────────────────────────────────────
  let view3dInited = false;
  const modal3d   = document.getElementById('modal-3d');
  const cont3d    = document.getElementById('container-3d');

  document.getElementById('tool-view-3d')?.addEventListener('click', () => {
    if (!modal3d) return;
    modal3d.style.display = 'flex';
    if (!view3dInited) {
      View3D.init(cont3d);
      view3dInited = true;
    } else {
      View3D.refresh();
    }
  });

  document.getElementById('btn-refresh-3d')?.addEventListener('click', () => {
    View3D.refresh();
  });

  document.getElementById('btn-close-3d')?.addEventListener('click', () => {
    if (modal3d) modal3d.style.display = 'none';
  });

  document.addEventListener('keydown', e => {
    if (e.key === 'Escape' && modal3d && modal3d.style.display !== 'none') {
      modal3d.style.display = 'none';
    }
  });

  // ── Compositor Interactivo ─────────────────────────────────
  ComposerEngine.bind();

  // Paleta: botones de herramientas
  document.querySelectorAll('.composer-tool-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const tool = btn.dataset.tool;
      if (CS.activeTool === tool) {
        // Toggle off
        ComposerEngine.setTool(null);
      } else {
        ComposerEngine.setTool(tool);
      }
    });
  });

  // Estilos activos para botones de paleta
  const originalSetTool = ComposerEngine.setTool.bind(ComposerEngine);
  ComposerEngine.setTool = function(type) {
    originalSetTool(type);
    document.querySelectorAll('.composer-tool-btn').forEach(btn => {
      const isActive = btn.dataset.tool === type;
      btn.style.opacity = type && !isActive ? '0.5' : '1';
      btn.style.transform = isActive ? 'scale(1.04)' : '';
      btn.style.boxShadow = isActive ? '0 0 0 2px currentColor' : '';
    });
  };

  // Botón Deshacer
  document.getElementById('composer-undo-btn')?.addEventListener('click', () => {
    csUndoLast();
    ComposerRecognizer.analyze();
    ComposerRenderer.draw();
  });

  // Botón Limpiar
  document.getElementById('composer-clear-btn')?.addEventListener('click', () => {
    if (confirm('¿Limpiar todos los elementos del compositor?')) {
      resetCS();
      ComposerRenderer.draw();
    }
  });

  // Botón Calcular
  document.getElementById('composer-calc-btn')?.addEventListener('click', () => {
    ComposerBridge.activate();
  });
});
