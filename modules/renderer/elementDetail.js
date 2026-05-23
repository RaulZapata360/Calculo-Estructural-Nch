/**
 * ELEMENTDETAIL.JS — Vista Longitudinal de Elemento
 * Overlay de pantalla completa con armadura esquemática y diagramas M/V
 */

const ElementDetail = {
  _currentType: null,

  open(elementType) {
    if (elementType === 'wall') return;
    this._currentType = elementType;

    const overlay = document.getElementById('element-detail-overlay');
    const names = {
      beam_top:   'Viga Superior (Cadena)',
      beam_bot:   'Sobrecimiento',
      column:     'Pilar de Confinamiento',
      foundation: 'Zapata Corrida'
    };
    const colors = {
      beam_top: '#2f81f7', beam_bot: '#8b5cf6',
      column: '#3fb950', foundation: '#d29922'
    };

    const badge = document.getElementById('el-detail-badge');
    const title = document.getElementById('el-detail-title');
    badge.textContent = names[elementType] || elementType;
    badge.style.background = (colors[elementType] || '#555') + '22';
    badge.style.color = colors[elementType] || '#fff';
    badge.style.borderColor = (colors[elementType] || '#555') + '44';
    title.textContent = names[elementType] || elementType;

    overlay.classList.remove('hidden');

    // Populate LEFT panel
    const leftPanel = document.getElementById('el-detail-list');
    if (leftPanel) {
      leftPanel.innerHTML = '';
      const elements = [
        { id: 'beam_top', name: 'Viga Sup. (Cadena)', color: '#2f81f7' },
        { id: 'beam_bot', name: 'Sobrecimiento', color: '#8b5cf6' },
        { id: 'column', name: 'Pilar Confin.', color: '#3fb950' },
        { id: 'foundation', name: 'Zapata Corrida', color: '#d29922' }
      ];
      elements.forEach(el => {
        const li = document.createElement('li');
        const isActive = el.id === elementType;
        li.innerHTML = `<button style="width:100%; text-align:left; padding:8px 12px; background:${isActive ? el.color+'33' : 'transparent'}; border:1px solid ${isActive ? el.color+'66' : 'transparent'}; color:${isActive ? '#fff' : '#aaa'}; border-radius:4px; cursor:pointer; font-size:0.8rem; display:flex; align-items:center;">
          <span style="display:inline-block; width:8px; height:8px; border-radius:50%; background:${el.color}; margin-right:8px;"></span>
          ${el.name}
        </button>`;
        li.querySelector('button').onclick = () => {
          ElementDetail.open(el.id);
        };
        leftPanel.appendChild(li);

        // ── Sub-items: columns (one per node with results) ──
        if (el.id === 'column' && isActive) {
          const colNodes = S.nodes.filter(n => S.results.columns && S.results.columns[n.id]);
          colNodes.forEach((node, idx) => {
            const subLi = document.createElement('li');
            const isActiveSub = node.id === S.ui.selectedNode;
            subLi.innerHTML = `<button style="width:100%; text-align:left; padding:4px 12px 4px 26px; background:${isActiveSub ? el.color+'25' : 'transparent'}; border:1px solid ${isActiveSub ? el.color+'55' : 'transparent'}; color:${isActiveSub ? '#c8ffc8' : '#6a7a6a'}; border-radius:3px; cursor:pointer; font-size:0.72rem;">
              P${idx+1} <span style="opacity:0.55">(${node.id})</span>
            </button>`;
            subLi.querySelector('button').onclick = () => {
              S.ui.selectedNode = node.id;
              ElementDetail.open('column');
            };
            leftPanel.appendChild(subLi);
          });
        }

        // ── Sub-items: beams (one per span) ──
        if ((el.id === 'beam_top' || el.id === 'beam_bot') && isActive) {
          S.spans.forEach((span, idx) => {
            const subLi = document.createElement('li');
            const isActiveSub = span.id === S.ui.selectedSpan;
            subLi.innerHTML = `<button style="width:100%; text-align:left; padding:4px 12px 4px 26px; background:${isActiveSub ? el.color+'25' : 'transparent'}; border:1px solid ${isActiveSub ? el.color+'55' : 'transparent'}; color:${isActiveSub ? '#c8d8ff' : '#5a6a7a'}; border-radius:3px; cursor:pointer; font-size:0.72rem;">
              V${idx+1} <span style="opacity:0.55">(${span.id})</span>
            </button>`;
            subLi.querySelector('button').onclick = () => {
              S.ui.selectedSpan = span.id;
              ElementDetail.open(el.id);
            };
            leftPanel.appendChild(subLi);
          });
        }
      });
    }

    if (elementType === 'foundation') {
      this._drawFoundation();
    } else {
      this.draw(elementType);
    }
    document.getElementById('btn-detail-close').onclick = () => this.close();
  },

  close() {
    document.getElementById('element-detail-overlay').classList.add('hidden');
    this._currentType = null;
  },

  draw(elementType, targetSvgId = 'el-detail-svg') {
    const svgEl = document.getElementById(targetSvgId);
    svgEl.innerHTML = '';

    const elem = getActiveElement(elementType);
    const r = getActiveResults(elementType);
    if (!elem || !r) return;

    // Columns use dedicated vertical view
    if (elementType === 'column') {
      this._drawColumn(svgEl, elem, r);
      return;
    }

    const isColumn = false;
    const section = elem.section;
    const rebar   = elem.rebar;
    const design  = r.rebar || {};

    const { b, h } = section;
    // Use span length (not total wall length) for individual element view
    const selSpan = S.spans.find(sp => sp.id === S.ui.selectedSpan) || S.spans[0];
    const L = isColumn ? S.story.H : getSpanL(selSpan);
    const Mu = parseFloat(r.Mu) || 0;
    const Vu = parseFloat(r.Vu) || 0;
    const Vc = parseFloat(design.Vc) || 0;
    const d_eff = parseFloat(design.d_eff_cm) / 100 || (h - (S.story?.materials?.rec || S.materials?.rec || 0.03) - 0.014);

    // Layout: elevation in top 55%, diagrams in bottom 45%
    const svgW = svgEl.parentElement.clientWidth  || 900;
    const svgH = svgEl.parentElement.clientHeight || 500;
    svgEl.setAttribute('viewBox', `0 0 ${svgW} ${svgH}`);

    const mkEl = (tag, attrs, parent) => {
      const e = document.createElementNS('http://www.w3.org/2000/svg', tag);
      Object.entries(attrs).forEach(([k, v]) => e.setAttribute(k, v));
      (parent || svgEl).appendChild(e);
      return e;
    };
    const mkTxt = (text, x, y, attrs = {}) => {
      const t = document.createElementNS('http://www.w3.org/2000/svg', 'text');
      t.textContent = text;
      t.setAttribute('x', x); t.setAttribute('y', y);
      Object.entries(attrs).forEach(([k, v]) => t.setAttribute(k, v));
      svgEl.appendChild(t);
      return t;
    };

    // ═══════════════════════════════════════════════════════════════
    // LAYOUT: LEFT 60% = elevation + M/V diagrams
    //         RIGHT 40% = cross-section profesional + resumen
    // ═══════════════════════════════════════════════════════════════
    const splitX   = Math.round(svgW * 0.60);
    const elPadL   = 80, elPadT = 44;
    const elW      = splitX - elPadL - 16;
    const elX      = elPadL;

    // Rebar data
    const supBars  = rebar?.faces?.superior?.barras || [];
    const infBars  = rebar?.faces?.inferior?.barras || [];
    const nSup     = supBars.reduce((s, br) => s + (br.cantidad || br.qty || 1), 0);
    const nInf     = infBars.reduce((s, br) => s + (br.cantidad || br.qty || 1), 0);
    const diaLong  = supBars[0]?.diámetro || supBars[0]?.diam || 10;
    const diaEst   = rebar?.estribos?.diámetro || 8;
    const sEst_m   = rebar?.estribos?.espaciamiento || 0.15;

    // Stirrup zone spacings — read from solver (NCh2123 seismic zones)
    const stirrupData = design.stirrups;
    const bestSt   = stirrupData?.[0];
    // s_crit: confinement zone spacing (solver computed from NCh2123)
    // s_central: standard ACI max spacing for central zone
    const sCrit = bestSt && design.s_crit_mm
      ? parseFloat(design.s_crit_mm) / 1000
      : Math.min(d_eff / 4, 0.10);   // fallback: d/4 ≤ 10cm
    const sMax  = bestSt && design.s_central_mm
      ? parseFloat(design.s_central_mm) / 1000
      : (bestSt ? parseFloat(bestSt.s_max) / 1000 : 0.20);
    const sAdopt = bestSt ? parseFloat(bestSt.s_adopt) / 1000 : sEst_m;  // shear-driven (for reference)

    const scale    = elW / L;
    const critZone = Math.min(d_eff, 0.60);   // NCh2123: primeros 60cm
    const critPx   = critZone * scale;

    // Section height in pixels — enforce minimum for legibility
    const elevZoneH = Math.round(svgH * 0.46);
    const secH = Math.max(90, Math.min(Math.round(h / L * elW), Math.round(elevZoneH * 0.55)));
    const elY  = elPadT + (elevZoneH - secH) / 2;
    const matRec = elementType === 'beam_bot' ? 0.04 : (S.story?.materials?.rec || S.materials?.rec || 0.03);
    const recPx = (matRec / h) * secH;

    // ── Dimension line: L ──────────────────────────────────────────
    const dimY = elY - 20;
    mkEl('line', { x1: elX, y1: dimY, x2: elX + elW, y2: dimY,
      stroke: '#777', 'stroke-width': 0.8 });
    mkEl('line', { x1: elX,       y1: dimY - 5, x2: elX,       y2: elY,
      stroke: '#777', 'stroke-width': 0.8 });
    mkEl('line', { x1: elX + elW, y1: dimY - 5, x2: elX + elW, y2: elY,
      stroke: '#777', 'stroke-width': 0.8 });
    mkTxt(`L = ${L.toFixed(2)} m`, elX + elW / 2, dimY - 5,
      { 'font-size': '9', fill: '#aaa', 'text-anchor': 'middle' });

    // ── Concrete outline ───────────────────────────────────────────
    mkEl('rect', { x: elX, y: elY, width: elW, height: secH,
      fill: 'rgba(200,210,220,0.05)', stroke: '#7090a8', 'stroke-width': 2 });

    // Hatching (concrete fill simulation — diagonal lines)
    const hatchSpacing = 14;
    const clipId = `hatch-clip-${elementType}`;
    const defs = mkEl('defs', {});
    const clip = mkEl('clipPath', { id: clipId }, defs);
    mkEl('rect', { x: elX, y: elY, width: elW, height: secH }, clip);
    for (let hx = elX - secH; hx <= elX + elW + secH; hx += hatchSpacing) {
      mkEl('line', { x1: hx, y1: elY, x2: hx + secH, y2: elY + secH,
        stroke: 'rgba(160,175,190,0.12)', 'stroke-width': 1,
        'clip-path': `url(#${clipId})` });
    }

    // Cover boundary (dashed)
    mkEl('rect', { x: elX + recPx, y: elY + recPx,
      width: elW - 2 * recPx, height: secH - 2 * recPx,
      fill: 'none', stroke: 'rgba(150,160,170,0.35)',
      'stroke-width': 0.8, 'stroke-dasharray': '5,3' });

    // ── STIRRUPS as proper U-shape marks ──────────────────────────
    const stY1 = elY + recPx * 0.25;
    const stY2 = elY + secH - recPx * 0.25;
    const stH  = stY2 - stY1;

    const drawStirrupU = (xPx, thick, color) => {
      // Vertical sides
      mkEl('line', { x1: xPx, y1: stY1, x2: xPx, y2: stY2,
        stroke: color, 'stroke-width': thick, 'stroke-linecap': 'round' });
    };

    // Critical zone shading
    mkEl('rect', { x: elX, y: stY1, width: critPx, height: stH,
      fill: 'rgba(248,200,60,0.07)', rx: 2 });
    mkEl('rect', { x: elX + elW - critPx, y: stY1, width: critPx, height: stH,
      fill: 'rgba(248,200,60,0.07)', rx: 2 });

    // Stirrup marks — critical zones
    for (let x = 0; x <= critPx + 1; x += sCrit * scale)
      drawStirrupU(elX + x, 1.8, 'rgba(248,200,60,0.85)');
    for (let x = elW - critPx; x <= elW + 1; x += sCrit * scale)
      drawStirrupU(elX + x, 1.8, 'rgba(248,200,60,0.85)');
    // Stirrup marks — standard zone
    for (let x = critPx; x < elW - critPx; x += sMax * scale)
      drawStirrupU(elX + x, 1.4, 'rgba(200,170,50,0.55)');

    // Zone dimension lines below section
    const zoneY = elY + secH + 6;
    
    // Draw vertical delimiters for zones
    mkEl('line', { x1: elX + critPx, y1: elY - 5, x2: elX + critPx, y2: zoneY + 10,
      stroke: 'rgba(248,200,60,0.5)', 'stroke-width': 1, 'stroke-dasharray': '4,3' });
    mkEl('line', { x1: elX + elW - critPx, y1: elY - 5, x2: elX + elW - critPx, y2: zoneY + 10,
      stroke: 'rgba(248,200,60,0.5)', 'stroke-width': 1, 'stroke-dasharray': '4,3' });

    const ann = (x0, x1, y, label, sub, color) => {
      mkEl('line', { x1: x0, y1: y+4, x2: x0, y2: y-4, stroke: '#444', 'stroke-width': 1 });
      mkEl('line', { x1: x1, y1: y+4, x2: x1, y2: y-4, stroke: '#444', 'stroke-width': 1 });
      mkEl('line', { x1: x0, y1: y, x2: x1, y2: y, stroke: color, 'stroke-width': 0.9 });
      mkEl('line', { x1: x0-3, y1: y-3, x2: x0+3, y2: y+3, stroke: color, 'stroke-width': 1.5 });
      mkEl('line', { x1: x1-3, y1: y-3, x2: x1+3, y2: y+3, stroke: color, 'stroke-width': 1.5 });
      mkTxt(label, (x0 + x1) / 2, y - 5,
        { 'font-size': '8', fill: color, 'text-anchor': 'middle', 'font-weight': '600' });
      if (sub) mkTxt(sub, (x0 + x1) / 2, y + 12,
        { 'font-size': '7.5', fill: color, 'text-anchor': 'middle' });
    };
    ann(elX, elX + critPx, zoneY + 5,
      `tramo 1: 0 a ${(critPx/scale).toFixed(2)}m`, `E Ø${diaEst} @ ${(sCrit*100).toFixed(0)}cm`, 'rgba(248,200,60,0.8)');
    ann(elX + critPx, elX + elW - critPx, zoneY + 5,
      `tramo central: ${(critPx/scale).toFixed(2)} a ${(L - critPx/scale).toFixed(2)}m`, `E Ø${diaEst} @ ${(sMax*100).toFixed(0)}cm`, 'rgba(180,155,50,0.7)');
    ann(elX + elW - critPx, elX + elW, zoneY + 5,
      `tramo final: ${(L - critPx/scale).toFixed(2)} a ${L.toFixed(2)}m`, `E Ø${diaEst} @ ${(sCrit*100).toFixed(0)}cm`, 'rgba(248,200,60,0.8)');

    // ── Longitudinal bars as HORIZONTAL LINES ─────────────────────
    const barGap = Math.max(3.5, Math.min(6, secH / 15));
    const BAR_COLOR = '#00ffff'; // CAD Cyan

    const drawBarLines = (n, dia, yMid, color, hookDir) => {
      for (let i = 0; i < n; i++) {
        const cy = yMid - ((n - 1) / 2 - i) * barGap;
        // Main bar line (full length)
        mkEl('line', { x1: elX, y1: cy, x2: elX + elW, y2: cy,
          stroke: color, 'stroke-width': 2.2, 'stroke-linecap': 'round' });
        // Hook at left (vertical 90 deg)
        mkEl('line', { x1: elX, y1: cy, x2: elX, y2: cy + hookDir * 14,
          stroke: color, 'stroke-width': 2.2, 'stroke-linecap': 'round' });
        // Hook at right
        mkEl('line', { x1: elX + elW, y1: cy, x2: elX + elW, y2: cy + hookDir * 14,
          stroke: color, 'stroke-width': 2.2, 'stroke-linecap': 'round' });
      }
      // Label at left
      mkTxt(`${n}ø${dia}`, elX - 14, yMid + 4,
        { 'font-size': '10.5', fill: color, 'text-anchor': 'end', 'font-weight': '700' });
    };

    const yTop = elY + recPx + (nSup > 1 ? (nSup - 1) * barGap / 2 : 0);
    const yBot = elY + secH - recPx - (nInf > 1 ? (nInf - 1) * barGap / 2 : 0);
    drawBarLines(nSup, diaLong, yTop, BAR_COLOR, +1);
    drawBarLines(nInf, diaLong, yBot, BAR_COLOR, -1);

    // Render intermediate skin reinforcement in elevation if present
    const pielBars = rebar?.faces?.piel?.barras || [];
    const nPiel    = pielBars.reduce((s, br) => s + (br.cantidad || br.qty || 0), 0);
    const diaPiel  = pielBars[0]?.diámetro || pielBars[0]?.diam || 8;
    const hasPiel  = nPiel > 0;
    if (hasPiel) {
      const cy = elY + secH / 2;
      mkEl('line', { x1: elX, y1: cy, x2: elX + elW, y2: cy,
        stroke: BAR_COLOR, 'stroke-width': 1.8, 'stroke-linecap': 'round' });
      // Small 90-degree hooks
      mkEl('line', { x1: elX, y1: cy, x2: elX, y2: cy - 8,
        stroke: BAR_COLOR, 'stroke-width': 1.8, 'stroke-linecap': 'round' });
      mkEl('line', { x1: elX + elW, y1: cy, x2: elX + elW, y2: cy - 8,
        stroke: BAR_COLOR, 'stroke-width': 1.8, 'stroke-linecap': 'round' });
      // Label at left
      mkTxt(`${nPiel}ø${diaPiel}`, elX - 14, cy + 3.5,
        { 'font-size': '10', fill: BAR_COLOR, 'text-anchor': 'end', 'font-weight': '700' });
    }

    // d-effective marker
    mkEl('line', { x1: elX + elW + 10, y1: elY + recPx,
                   x2: elX + elW + 10, y2: elY + secH - recPx,
      stroke: 'rgba(120,180,140,0.7)', 'stroke-width': 1, 'stroke-dasharray': '3,2' });
    mkEl('line', { x1: elX + elW + 5,  y1: elY + secH - recPx,
                   x2: elX + elW + 24, y2: elY + secH - recPx,
      stroke: 'rgba(120,180,140,0.7)', 'stroke-width': 1 });
    mkTxt(`d=${(d_eff * 100).toFixed(1)}cm`, elX + elW + 26, elY + secH - recPx + 4,
      { 'font-size': '8', fill: 'rgba(120,180,140,0.85)', 'text-anchor': 'start' });

    // Section label at left
    mkTxt(`${(b*100).toFixed(0)}×${(h*100).toFixed(0)}`, elX - 14, elY + secH / 2 - 4,
      { 'font-size': '8', fill: 'rgba(180,190,200,0.5)', 'text-anchor': 'end' });
    mkTxt('cm', elX - 14, elY + secH / 2 + 8,
      { 'font-size': '7', fill: 'rgba(180,190,200,0.4)', 'text-anchor': 'end' });

    // ── M/V Diagrams (below elevation, left portion) ───────────────
    const diagY0 = elY + secH + 38;
    const diagH  = svgH - diagY0 - 20;
    const halfH  = Math.max(30, Math.floor(diagH / 2) - 10);
    const dtx    = (xRel) => elX + xRel / L * elW;

    if (Mu > 0) {
      const mAxis = diagY0 + halfH / 2;
      mkEl('line', { x1: elX, y1: mAxis, x2: elX + elW, y2: mAxis,
        stroke: 'rgba(47,129,247,0.2)', 'stroke-width': 1 });
      mkTxt('M (kN·m)', elX - 6, diagY0 + 8,
        { 'font-size': '8', fill: 'rgba(47,129,247,0.7)', 'text-anchor': 'end' });
      if (!isColumn) {
        const mat = S.story?.materials || S.materials || {};
        const ld  = S.story?.loads     || S.loads     || {};
        const gc  = mat.gc || 25;
        const qEff = (elementType === 'beam_top')
            ? (ld.qD || 0) + (ld.qL || 0) + gc * b * h
            : ((parseFloat(S.results.spans?.[selSpan?.id]?.wall?.P || 0) / L) + gc * b * h);
        
        let maxMhyp = Mu;
        const pts = [];
        for (let i = 0; i <= 60; i++) {
          const xm = i / 60 * L;
          const Mhyp = Math.abs(qEff * xm * (L - xm) / 2 - qEff * L * L / 12);
          if (Mhyp > maxMhyp) maxMhyp = Mhyp;
        }
        const msc = (halfH * 0.35) / Math.max(maxMhyp, 0.01);
        
        for (let i = 0; i <= 60; i++) {
          const xm = i / 60 * L;
          const Mhyp = qEff * xm * (L - xm) / 2 - qEff * L * L / 12;
          pts.push(`${dtx(xm)},${mAxis - Mhyp * msc}`);
        }
        mkEl('polygon', { points: `${elX},${mAxis} ${pts.join(' ')} ${elX+elW},${mAxis}`,
          fill: 'rgba(47,129,247,0.10)', stroke: 'none' });
        mkEl('polyline', { points: pts.join(' '), fill: 'none',
          stroke: '#3a80f0', 'stroke-width': 1.5 });
        mkTxt(`${Mu.toFixed(2)}`, dtx(L / 2), mAxis - Mu * msc - 5,
          { 'font-size': '8.5', fill: '#6ca5f8', 'text-anchor': 'middle' });
      } else {
        // Column: empotrada en base, carga lateral F en la cabeza
        // M(z) = F×(H-z) → máximo en z=0 (base), cero en z=H (cabeza)
        const msc2 = (halfH * 0.40) / Math.max(Mu, 0.01);
        const Mpx  = Math.min(Mu * msc2, halfH * 0.40);
        mkEl('polygon', { points: `${elX},${mAxis} ${elX},${mAxis - Mpx} ${elX+elW},${mAxis}`,
          fill: 'rgba(47,129,247,0.12)', stroke: 'none' });
        mkEl('line', { x1: elX, y1: mAxis - Mpx, x2: elX + elW, y2: mAxis,
          stroke: '#3a80f0', 'stroke-width': 1.8 });
        mkTxt(`M_base=${Mu.toFixed(2)} kN·m`, elX + 6, mAxis - Mpx - 6,
          { 'font-size': '8.5', fill: '#6ca5f8' });
        mkTxt(`(F×H = ${Vu.toFixed(2)}×${L.toFixed(2)})`, elX + 6, mAxis - Mpx + 9,
          { 'font-size': '7', fill: 'rgba(100,165,248,0.55)' });
        mkTxt(`M=0 (cabeza libre)`, elX + elW - 4, mAxis + 12,
          { 'font-size': '7', fill: 'rgba(100,165,248,0.55)', 'text-anchor': 'end' });
        mkEl('line', { x1: elX, y1: mAxis - 4, x2: elX, y2: mAxis + 4,
          stroke: '#3a80f0', 'stroke-width': 1.5 });
      }
    }

    if (Vu > 0) {
      const vY0  = diagY0 + halfH + 14;
      const vAxis = vY0 + halfH / 2;
      mkEl('line', { x1: elX, y1: vAxis, x2: elX + elW, y2: vAxis,
        stroke: 'rgba(248,81,73,0.2)', 'stroke-width': 1 });
      mkTxt('V (kN)', elX - 6, vY0 + 8,
        { 'font-size': '8', fill: 'rgba(248,81,73,0.7)', 'text-anchor': 'end' });
      const vsc = (halfH * 0.25) / Math.max(Vu, 0.01);
      if (!isColumn) {
        mkEl('polygon', {
          points: `${elX},${vAxis} ${elX},${vAxis-Vu*vsc} ${elX+elW},${vAxis+Vu*vsc} ${elX+elW},${vAxis}`,
          fill: 'rgba(248,81,73,0.10)' });
        mkEl('polyline', {
          points: `${elX},${vAxis-Vu*vsc} ${elX+elW},${vAxis+Vu*vsc}`,
          fill: 'none', stroke: '#e04040', 'stroke-width': 1.5 });
        const phiVc = 0.75 * Vc;
        mkTxt(`${Vu.toFixed(2)}`, elX + 6, vAxis - Vu * vsc - 4,
          { 'font-size': '8', fill: '#f08080' });
        mkTxt(`φVc=${phiVc.toFixed(2)}`, elX + elW / 2, vAxis - 4,
          { 'font-size': '7.5', fill: 'rgba(248,81,73,0.5)', 'text-anchor': 'middle' });
        
        if (phiVc > 0) {
          const pVY1 = vAxis - phiVc * vsc, pVY2 = vAxis + phiVc * vsc;
          mkEl('line', { x1: elX, y1: pVY1, x2: elX+elW, y2: pVY1, stroke: 'rgba(248,81,73,0.4)', 'stroke-width': 1, 'stroke-dasharray': '3,3' });
          mkEl('line', { x1: elX, y1: pVY2, x2: elX+elW, y2: pVY2, stroke: 'rgba(248,81,73,0.4)', 'stroke-width': 1, 'stroke-dasharray': '3,3' });
          if (Vu > phiVc) {
            mkTxt(`Excede φVc → Requiere estribos (135°)`, elX + elW / 2, vAxis + halfH - 4, { 'font-size': '8', fill: '#f85149', 'text-anchor': 'middle', 'font-weight': '600' });
          }
        }
      } else {
        mkEl('polygon', { points: `${elX},${vAxis} ${elX},${vAxis-Vu*vsc} ${elX+elW},${vAxis-Vu*vsc} ${elX+elW},${vAxis}`,
          fill: 'rgba(248,81,73,0.10)' });
        mkEl('polyline', { points: `${elX},${vAxis-Vu*vsc} ${elX+elW},${vAxis-Vu*vsc}`,
          fill: 'none', stroke: '#e04040', 'stroke-width': 1.5 });
        mkTxt(`${Vu.toFixed(2)}`, elX + elW / 2, vAxis - Vu * vsc - 4,
          { 'font-size': '8', fill: '#f08080', 'text-anchor': 'middle' });

        const phiVc = 0.75 * Vc;
        if (phiVc > 0) {
          const pVY1 = vAxis - phiVc * vsc;
          mkEl('line', { x1: elX, y1: pVY1, x2: elX+elW, y2: pVY1, stroke: 'rgba(248,81,73,0.4)', 'stroke-width': 1, 'stroke-dasharray': '3,3' });
          mkTxt(`φVc=${phiVc.toFixed(2)}`, elX + elW / 2, pVY1 + 8, { 'font-size': '7.5', fill: 'rgba(248,81,73,0.5)', 'text-anchor': 'middle' });
          if (Vu > phiVc) {
            mkTxt(`Excede φVc → Requiere estribos (135°)`, elX + elW / 2, vAxis + halfH - 4, { 'font-size': '8', fill: '#f85149', 'text-anchor': 'middle', 'font-weight': '600' });
          }
        }
      }
    }

    // ── POPULATE RIGHT PANEL (Methodology) ────────────────────────
    const rightPanel = document.getElementById('el-detail-methodology');
    if (rightPanel) {
      rightPanel.innerHTML = `
        <div style="margin-bottom:1rem;">
          <strong style="color:#fff;">1. Verificación a Flexión (φMn ≥ Mu)</strong><br>
          <span style="color:#6ca5f8">Mu = ${Mu.toFixed(2)} kN·m</span><br>
          La armadura longitudinal (${supBars[0]?supBars[0].cantidad:0}Ø${diaLong}) aporta una capacidad resistente nominal (Mn) calculada por compatibilidad de deformaciones.<br>
          Aplicando el factor φ=0.90, se asegura que <strong>φMn > Mu</strong>. Por lo tanto, la sección resiste las solicitaciones flectoras en sus zonas de momento máximo sin requerir mayor refuerzo.
        </div>
        <div style="margin-bottom:1rem;">
          <strong style="color:#fff;">2. Verificación al Corte (φVn ≥ Vu)</strong><br>
          <span style="color:#f08080">Vu = ${Vu.toFixed(2)} kN</span><br>
          <span style="color:#f08080">φVc = ${(0.75*Vc).toFixed(2)} kN</span> (Aporte del hormigón).<br>
          ${Vu > 0.75 * Vc ? 
            `<span style="color:#f85149; font-weight:bold;">Vu > φVc</span>: El hormigón no es suficiente por sí solo. Se requieren estribos para aportar la resistencia faltante φVs según NCh430.` : 
            `<span style="color:#3fb950; font-weight:bold;">Vu ≤ φVc</span>: El hormigón resiste el corte. Por norma sísmica (NCh433/NCh2123) se disponen estribos mínimos de confinamiento y amarre.`}
        </div>
        <div>
          <strong style="color:#fff;">3. Distribución de Estribos</strong><br>
          En los extremos (Zonas Críticas, Lc=${(critZone*100).toFixed(0)}cm), la norma exige un espaciamiento menor (<strong>s = ${(sCrit*100).toFixed(0)}cm</strong>) para asegurar ductilidad y evitar fallas frágiles frente a sismos.<br>
          En el tramo central, la menor solicitación permite un espaciamiento mayor (<strong>s = ${(sMax*100).toFixed(0)}cm</strong>).
        </div>
      `;
      document.getElementById('el-detail-right').style.display = 'block';
    }

    // Forces summary bottom-left
    const Nu = parseFloat(r.Nu) || 0;
    const sumY = svgH - 8;
    [
      { label: `Mu=${Mu.toFixed(2)} kN·m`, color: '#6ca5f8' },
      { label: `Vu=${Vu.toFixed(2)} kN`,   color: '#f08080' },
      { label: `Nu=${Nu.toFixed(2)} kN`,   color: '#6de072' }
    ].forEach((item, i) => {
      mkTxt(item.label, elX + i * (elW / 3) + elW / 6, sumY,
        { 'font-size': '8.5', fill: item.color, 'text-anchor': 'middle', 'font-weight': '600' });
    });

    // ═══════════════════════════════════════════════════════════════
    // CROSS-SECTION (right panel) — estilo dibujo de ingeniería
    // ═══════════════════════════════════════════════════════════════
    const csAreaX = splitX + 12;
    const csAreaW = svgW - csAreaX - 12;
    const csAreaH = svgH;

    // Scale cross-section to fit right panel
    const bh_asp = b / h;
    let cs_b, cs_h;
    const maxCSW = Math.min(csAreaW * 0.72, 200);
    const maxCSH = Math.min(csAreaH * 0.60, 280);
    if (bh_asp >= 1) {
      cs_b = maxCSW; cs_h = cs_b / bh_asp;
      if (cs_h > maxCSH) { cs_h = maxCSH; cs_b = cs_h * bh_asp; }
    } else {
      cs_h = maxCSH; cs_b = cs_h * bh_asp;
      if (cs_b > maxCSW) { cs_b = maxCSW; cs_h = cs_b / bh_asp; }
    }
    cs_b = Math.max(80, cs_b); cs_h = Math.max(70, cs_h);

    const csX0 = csAreaX + (csAreaW - cs_b) / 2;
    const csY0 = 28 + (csAreaH * 0.5 - cs_h) / 2;

    // ── Section title ──────────────────────────────────────────────
    const csLabel = { beam_top:'A-A — Cadena Superior', beam_bot:'A-A — Sobrecimiento',
                      column:'A-A — Pilar' }[elementType] || 'Sección Transversal';
    mkTxt(csLabel, csAreaX + csAreaW / 2, csY0 - 10,
      { 'font-size': '8.5', fill: '#aaa', 'text-anchor': 'middle', 'font-weight': '600' });

    // ── Concrete rectangle ─────────────────────────────────────────
    mkEl('rect', { x: csX0, y: csY0, width: cs_b, height: cs_h,
      fill: 'rgba(255,255,255,0.02)', stroke: '#e6e6e6', 'stroke-width': 1.5 });

    // ── Cover lines (dashed) ───────────────────────────────────────
    const cs_recB = (matRec / b) * cs_b;
    const cs_recH = (matRec / h) * cs_h;
    
    // ── Stirrup rectangle ─────────────────────────────────────────
    const stColor = '#f0b040'; // CAD Yellow
    const rColor = '#00ffff';  // CAD Cyan
    const estPx = Math.max(1.5, (diaEst / 1000 / b) * cs_b);
    
    mkEl('rect', {
      x: csX0 + cs_recB,
      y: csY0 + cs_recH,
      width:  cs_b - 2*cs_recB,
      height: cs_h - 2*cs_recH,
      fill: 'none', stroke: stColor, 'stroke-width': 1.5, rx: 2 });

    // 135° Hooks
    const hookLen = Math.min(cs_b, cs_h) * 0.15;
    const hkD = hookLen * 0.707;
    mkEl('line',{x1:csX0+cs_recB, y1:csY0+cs_recH, x2:csX0+cs_recB+hkD, y2:csY0+cs_recH+hkD, stroke:stColor,'stroke-width':1.5,'stroke-linecap':'round'});
    mkEl('line',{x1:csX0+cs_b-cs_recB, y1:csY0+cs_recH, x2:csX0+cs_b-cs_recB-hkD, y2:csY0+cs_recH+hkD, stroke:stColor,'stroke-width':1.5,'stroke-linecap':'round'});

    // ── Bar circles ───────────────────────────────────────────────
    const cs_diaB = Math.max(4, Math.min(11, (diaLong / 1000 / b) * cs_b * 1.6));
    const estCover = (diaEst / 1000 / b) * cs_b;
    const barOff_x = cs_recB + estCover + cs_diaB * 0.5;
    const barOff_y = cs_recH + estCover + cs_diaB * 0.5;

    const barXPositions = (n) => {
      if (n === 1) return [csX0 + cs_b / 2];
      if (n === 2) return [csX0 + barOff_x, csX0 + cs_b - barOff_x];
      if (n === 3) return [csX0 + barOff_x, csX0 + cs_b / 2, csX0 + cs_b - barOff_x];
      return Array.from({ length: n }, (_, i) => csX0 + barOff_x + i * (cs_b - 2*barOff_x) / (n - 1));
    };

    const drawBarCircles = (n, cyPx, color) => {
      barXPositions(n).forEach(cx => {
        mkEl('circle', { cx, cy: cyPx, r: cs_diaB, fill: color });
      });
    };

    drawBarCircles(nSup, csY0 + barOff_y, rColor);
    drawBarCircles(nInf, csY0 + cs_h - barOff_y, rColor);

    if (hasPiel) {
      // Draw 2 circles at the lateral faces of the stirrup at mid-height
      const cxLeft  = csX0 + barOff_x;
      const cxRight = csX0 + cs_b - barOff_x;
      const cyMid   = csY0 + cs_h / 2;
      const rPiel   = Math.max(3.5, Math.min(9, (diaPiel / 1000 / b) * cs_b * 1.6));
      mkEl('circle', { cx: cxLeft, cy: cyMid, r: rPiel, fill: rColor });
      mkEl('circle', { cx: cxRight, cy: cyMid, r: rPiel, fill: rColor });
    }

    // ── Dimension lines (CAD style) ────────────────────────────────────
    const dimColor = '#00ff00';

    const drawDimH = (x1, x2, y, lbl) => {
      mkEl('line',{x1:x1,y1:y+4,x2:x1,y2:y-6,stroke:'#444','stroke-width':1});
      mkEl('line',{x1:x2,y1:y+4,x2:x2,y2:y-6,stroke:'#444','stroke-width':1});
      mkEl('line',{x1:x1,y1:y,x2:x2,y2:y,stroke:dimColor,'stroke-width':1});
      mkEl('line',{x1:x1-3,y1:y-3,x2:x1+3,y2:y+3,stroke:dimColor,'stroke-width':1.5});
      mkEl('line',{x1:x2-3,y1:y-3,x2:x2+3,y2:y+3,stroke:dimColor,'stroke-width':1.5});
      mkTxt(lbl, (x1+x2)/2, y-4, {'font-size':'9','fill':dimColor,'text-anchor':'middle'});
    };
    const drawDimV = (y1, y2, x, lbl) => {
      mkEl('line',{x1:x-4,y1:y1,x2:x+6,y2:y1,stroke:'#444','stroke-width':1});
      mkEl('line',{x1:x-4,y1:y2,x2:x+6,y2:y2,stroke:'#444','stroke-width':1});
      mkEl('line',{x1:x,y1:y1,x2:x,y2:y2,stroke:dimColor,'stroke-width':1});
      mkEl('line',{x1:x-3,y1:y1-3,x2:x+3,y2:y1+3,stroke:dimColor,'stroke-width':1.5});
      mkEl('line',{x1:x-3,y1:y2-3,x2:x+3,y2:y2+3,stroke:dimColor,'stroke-width':1.5});
      const hLbl = document.createElementNS('http://www.w3.org/2000/svg', 'text');
      hLbl.textContent = lbl;
      hLbl.setAttribute('x', x + 10); hLbl.setAttribute('y', (y1+y2)/2 + 4);
      hLbl.setAttribute('font-size', '9'); hLbl.setAttribute('fill', dimColor);
      hLbl.setAttribute('text-anchor', 'middle'); hLbl.setAttribute('font-weight', '600');
      hLbl.setAttribute('transform', `rotate(90,${x+10},${(y1+y2)/2})`);
      svgEl.appendChild(hLbl);
    };

    drawDimH(csX0, csX0+cs_b, csY0-15, `${(b*100).toFixed(0)}`);
    drawDimV(csY0, csY0+cs_h, csX0+cs_b+15, `${(h*100).toFixed(0)}`);

    // ── Isolated Stirrup Detail ──
    const iY = csY0 + cs_h + 60;
    const iW = cs_b - 2*cs_recB, iH = cs_h - 2*cs_recH;
    
    // Scale down if needed
    let scI = Math.min(1, 100 / Math.max(iW, iH));
    const sw = iW * scI, sh = iH * scI;
    const iX = csX0 + (cs_b - sw)/2;
    
    // Stirrup
    mkEl('rect',{x:iX,y:iY,width:sw,height:sh,fill:'none',stroke:stColor,'stroke-width':1.5,'rx':2});
    mkEl('line',{x1:iX, y1:iY, x2:iX+hkD*scI, y2:iY+hkD*scI, stroke:stColor,'stroke-width':1.5,'stroke-linecap':'round'});
    mkEl('line',{x1:iX+sw, y1:iY, x2:iX+sw-hkD*scI, y2:iY+hkD*scI, stroke:stColor,'stroke-width':1.5,'stroke-linecap':'round'});
    
    // Dims
    const s_dia = diaEst;
    const s_sp = Math.round((sCrit)*100);
    const dw_cm = Math.round((b - 2*matRec)*100);
    const dh_cm = Math.round((h - 2*matRec)*100);
    const LT = Math.round(2*(dw_cm + dh_cm) + 2*(10 * s_dia/10));
 
    mkTxt(`${dw_cm}`, iX+sw/2, iY-4, {'font-size':'8','fill':'#888','text-anchor':'middle'});
    mkTxt(`${dh_cm}`, iX-4, iY+sh/2+3, {'font-size':'8','fill':'#888','text-anchor':'end'});
    
    mkTxt(`E ø${s_dia}@${s_sp}`, iX+sw/2, iY+sh+20, {'font-size':'9','fill':stColor,'text-anchor':'middle','font-weight':'bold'});
    mkEl('line',{x1:iX+sw/2-20, y1:iY+sh+24, x2:iX+sw/2+20, y2:iY+sh+24, stroke:'#444', 'stroke-width':1});
    mkTxt(`LT = ${LT}`, iX+sw/2, iY+sh+34, {'font-size':'8','fill':'#ccc','text-anchor':'middle'});
 
    // Cover callout
    const recMm = (matRec * 100).toFixed(0);
    mkTxt(`rec.=${recMm}cm`, csX0 + cs_b / 2, csY0 + cs_recH - 4,
      { 'font-size': '7', fill: 'rgba(150,160,170,0.7)', 'text-anchor': 'middle' });
 
    // ── Stirrup callout ────────────────────────────────────────────
    mkTxt(`E Ø${diaEst}@${(sCrit*100).toFixed(0)}/${(sMax*100).toFixed(0)}cm`,
      csAreaX + csAreaW / 2, csY0 + cs_h + 18,
      { 'font-size': '8.5', fill: 'rgba(220,185,50,0.9)', 'text-anchor': 'middle', 'font-weight': '600' });
 
    // ── Bar callout ────────────────────────────────────────────────
    if (hasPiel) {
      mkTxt(`${nSup}Ø${diaLong} Sup + ${nPiel}Ø${diaPiel} Piel + ${nInf}Ø${diaLong} Inf`,
        csAreaX + csAreaW / 2, csY0 + cs_h + 32,
        { 'font-size': '8', fill: 'rgba(88,166,255,0.9)', 'text-anchor': 'middle', 'font-weight': '600' });
    } else {
      mkTxt(`${nSup}Ø${diaLong} (sup+inf)`,
        csAreaX + csAreaW / 2, csY0 + cs_h + 32,
        { 'font-size': '8.5', fill: 'rgba(88,166,255,0.9)', 'text-anchor': 'middle', 'font-weight': '600' });
    }

    // ── Forces block bottom-right ──────────────────────────────────
    const frcY = svgH - 46;
    [
      { lbl: 'Mu', val: `${Mu.toFixed(2)} kN·m`, c: '#6ca5f8' },
      { lbl: 'Vu', val: `${Vu.toFixed(2)} kN`,   c: '#f08080' },
      { lbl: 'Nu', val: `${Nu.toFixed(2)} kN`,   c: '#6de072' }
    ].forEach((f, i) => {
      mkTxt(`${f.lbl} = ${f.val}`, csAreaX + csAreaW/2, frcY + i*14,
        { 'font-size': '8.5', fill: f.c, 'text-anchor': 'middle', 'font-weight': '600' });
    });

    // ── Details panel below SVG ──────────────────────────────────────
    this._drawDetailsPanel(elementType, elem, r, design, L, d_eff);
  },

  _drawColumn(svgEl, elem, r) {
    svgEl.innerHTML = '';
    const { b, h } = elem.section;
    const H   = S.story.H;
    const Mu  = parseFloat(r.Mu)    || 0;
    const Vu  = parseFloat(r.Vu)    || 0;
    const Nu  = parseFloat(r.Nu)    || 0;
    const NuT = parseFloat(r.Nu_top)|| 0;
    const Flc = parseFloat(r.F_lat) || Vu;
    const svgW = svgEl.parentElement.clientWidth  || 900;
    const svgH = svgEl.parentElement.clientHeight || 560;
    svgEl.setAttribute('viewBox', `0 0 ${svgW} ${svgH}`);

    const mk = (tag, at, par) => {
      const e = document.createElementNS('http://www.w3.org/2000/svg', tag);
      Object.entries(at).forEach(([k,v]) => e.setAttribute(k,v));
      (par || svgEl).appendChild(e); return e;
    };
    const txt = (s, x, y, at={}) => {
      const t = document.createElementNS('http://www.w3.org/2000/svg','text');
      t.textContent = s; t.setAttribute('x',x); t.setAttribute('y',y);
      Object.entries(at).forEach(([k,v])=>t.setAttribute(k,v));
      svgEl.appendChild(t); return t;
    };

    // ── Layout ─────────────────────────────────────────────────
    const PAD_T = 70, PAD_B = 50;
    const colHpx = svgH - PAD_T - PAD_B;   // pixels for H=2.50m
    const toY = z => PAD_T + (H - z) / H * colHpx;   // z=0→base, z=H→top
    const yBase = toY(0), yTop = toY(H);

    // X positions of panels
    const nW=70, gap=12, cW=24, mW=100, vW=70, xsW=150;
    const xN  = 30;
    const xC  = xN + nW + gap;
    const xM  = xC + cW + gap;
    const xV  = xM + mW + gap;
    const xXS = xV + vW + gap;
    const xMid = xC + cW/2;

    const mat = S.story?.materials || {};
    const rec = mat.rec || 0.03;
    const recPx = (rec / h) * cW;
    const rebar = elem.rebar;
    const supBars = rebar?.faces?.superior?.barras || [];
    const nBars = supBars.reduce((s,b)=>s+(b.cantidad||1),0);
    const diaL  = supBars[0]?.diámetro || 10;
    const diaE  = rebar?.estribos?.diámetro || 8;
    const design = r.rebar || {};
    const sCrit  = design.s_crit_mm ? parseFloat(design.s_crit_mm)/1000 : 0.05;
    const sMax   = design.s_central_mm ? parseFloat(design.s_central_mm)/1000 : 0.10;

    // ── LABELS ─────────────────────────────────────────────────
    txt('N (kN)', xN + nW/2, PAD_T - 18, {'font-size':'8','fill':'rgba(100,220,100,0.8)','text-anchor':'middle'});
    txt('PILAR', xMid, PAD_T - 22, {'font-size':'9','fill':'#aaa','text-anchor':'middle','font-weight':'600'});
    txt(`${(b*100).toFixed(0)}×${(h*100).toFixed(0)}cm`, xMid, PAD_T-10, {'font-size':'7.5','fill':'#666','text-anchor':'middle'});
    txt('M (kN·m)', xM + mW/2, PAD_T - 18, {'font-size':'8','fill':'rgba(47,129,247,0.8)','text-anchor':'middle'});
    txt('V (kN)',  xV + vW/2,  PAD_T - 18, {'font-size':'8','fill':'rgba(248,81,73,0.8)','text-anchor':'middle'});
    txt('SECCIÓN', xXS + xsW/2, PAD_T - 18, {'font-size':'8','fill':'#888','text-anchor':'middle'});

    // ── Column body (vertical rectangle) ───────────────────────
    mk('rect',{x:xC,y:yTop,width:cW,height:colHpx,fill:'rgba(200,210,220,0.05)',stroke:'#7090a8','stroke-width':2});
    // Hatching
    const clipId='col-vert-clip';
    const defs=mk('defs',{});
    const clip=mk('clipPath',{id:clipId},defs);
    mk('rect',{x:xC,y:yTop,width:cW,height:colHpx},clip);
    for(let hy=yTop-cW;hy<=yBase+cW;hy+=12)
      mk('line',{x1:xC,y1:hy,x2:xC+cW,y2:hy+cW,stroke:'rgba(160,175,190,0.12)','stroke-width':1,'clip-path':`url(#${clipId})`});
    // Cover rect
    mk('rect',{x:xC+recPx,y:yTop+recPx,width:cW-2*recPx,height:colHpx-2*recPx,fill:'none',stroke:'rgba(150,160,170,0.25)','stroke-width':0.8,'stroke-dasharray':'4,2'});

    // ── Stirrups (horizontal lines across column body) ──────────
    const scaleZ = colHpx / H;
    const critZ  = Math.min(0.60, H/4);
    const critPx = critZ * scaleZ;
    // Zone shading
    mk('rect',{x:xC,y:yTop,width:cW,height:critPx,fill:'rgba(248,200,60,0.07)'});
    mk('rect',{x:xC,y:yBase-critPx,width:cW,height:critPx,fill:'rgba(248,200,60,0.07)'});
    const drawHoriz = (zPx, color, thick) =>
      mk('line',{x1:xC-2,y1:yTop+zPx,x2:xC+cW+2,y2:yTop+zPx,stroke:color,'stroke-width':thick});
    for(let z=0;z<=critPx;z+=sCrit*scaleZ) drawHoriz(z,'rgba(248,200,60,0.75)',1.8);
    for(let z=colHpx-critPx;z<=colHpx+1;z+=sCrit*scaleZ) drawHoriz(z,'rgba(248,200,60,0.75)',1.8);
    for(let z=critPx;z<colHpx-critPx;z+=sMax*scaleZ) drawHoriz(z,'rgba(200,170,50,0.45)',1.2);
    // Delimiter lines
    mk('line',{x1:xC-10,y1:yTop+critPx,x2:xC+cW+10,y2:yTop+critPx,stroke:'rgba(248,200,60,0.5)','stroke-width':0.9,'stroke-dasharray':'4,2'});
    mk('line',{x1:xC-10,y1:yBase-critPx,x2:xC+cW+10,y2:yBase-critPx,stroke:'rgba(248,200,60,0.5)','stroke-width':0.9,'stroke-dasharray':'4,2'});

    // ── Longitudinal bars (vertical lines) ────────────────────
    // ── Longitudinal bars (vertical lines) ────────────────────
    const barOff = recPx + 3;
    const lColor = '#00ffff'; // CAD cyan
    const dowelPx = 35; // Visual lap length
    [[xC+barOff, 1], [xC+cW-barOff, -1]].forEach(([bx, dir])=>{
      // Main bar with dowels
      mk('line',{x1:bx,y1:yTop-dowelPx,x2:bx,y2:yBase+dowelPx,stroke:lColor,'stroke-width':2.5,'stroke-linecap':'round'});
      // Hook at the base
      mk('line',{x1:bx,y1:yBase+dowelPx,x2:bx+dir*6,y2:yBase+dowelPx,stroke:lColor,'stroke-width':2.5,'stroke-linecap':'round'});
    });
    txt(`${nBars}Ø${diaL}`, xC-6, (yTop+yBase)/2, {'font-size':'9','fill':lColor,'text-anchor':'end','font-weight':'700'});

    // ── Base support (hatching) ────────────────────────────────
    mk('rect',{x:xC-10,y:yBase+dowelPx+4,width:cW+20,height:8,fill:'rgba(120,140,160,0.5)',stroke:'#8090a0','stroke-width':1});
    mk('line',{x1:xC-20,y1:yBase+dowelPx+14,x2:xC+cW+20,y2:yBase+dowelPx+14,stroke:'#8090a0','stroke-width':1.5});
    txt('EMPOTRAMIENTO',xMid,yBase+dowelPx+26,{'font-size':'7','fill':'#666','text-anchor':'middle'});

    // ── Force arrows at head ──────────────────────────────────
    // Lateral force F→ (horizontal)
    mk('line',{x1:xC+cW+4,y1:yTop,x2:xC+cW+36,y2:yTop,stroke:'#f0b040','stroke-width':2});
    mk('polygon',{points:`${xC+cW+36},${yTop} ${xC+cW+26},${yTop-6} ${xC+cW+26},${yTop+6}`,fill:'#f0b040'});
    txt(`F=${Flc.toFixed(2)}kN`,xC+cW+40,yTop+4,{'font-size':'8','fill':'#f0b040'});
    // Axial Nu↓ (vertical arrow at top)
    mk('line',{x1:xMid,y1:yTop-35,x2:xMid,y2:yTop-4,stroke:'#6de072','stroke-width':2});
    mk('polygon',{points:`${xMid},${yTop} ${xMid-5},${yTop-12} ${xMid+5},${yTop-12}`,fill:'#6de072'});
    txt(`Nu_top=${NuT.toFixed(1)}kN`,xMid+8,yTop-20,{'font-size':'7.5','fill':'#6de072'});

    // Height dimension (CAD style)
    const cColor = '#00ff00';
    mk('line',{x1:xC-34,y1:yTop,x2:xC-28,y2:yTop,stroke:'#444','stroke-width':1});
    mk('line',{x1:xC-34,y1:yBase,x2:xC-28,y2:yBase,stroke:'#444','stroke-width':1});
    const dx=xC-28;
    mk('line',{x1:dx,y1:yTop,x2:dx,y2:yBase,stroke:cColor,'stroke-width':1});
    mk('line',{x1:dx-3,y1:yTop-3,x2:dx+3,y2:yTop+3,stroke:cColor,'stroke-width':1.5});
    mk('line',{x1:dx-3,y1:yBase-3,x2:dx+3,y2:yBase+3,stroke:cColor,'stroke-width':1.5});
    txt(`H=${H.toFixed(2)}m`,dx-4,(yTop+yBase)/2,{'font-size':'8','fill':cColor,'text-anchor':'end'});

    // ── N diagram (left of column) ─────────────────────────────
    const nsc = (nW*0.7)/Math.max(Nu,0.01);
    const nAxis = xN+nW;
    mk('line',{x1:nAxis,y1:yTop,x2:nAxis,y2:yBase,stroke:'rgba(100,220,100,0.15)','stroke-width':1});
    // N grows linearly: 0 at top → Nu at base (self-weight accumulates)
    const nPts=`${nAxis},${yTop} ${nAxis-NuT*nsc},${yTop} ${nAxis-Nu*nsc},${yBase} ${nAxis},${yBase}`;
    mk('polygon',{points:nPts,fill:'rgba(100,220,100,0.12)',stroke:'none'});
    mk('polyline',{points:`${nAxis-NuT*nsc},${yTop} ${nAxis-Nu*nsc},${yBase}`,fill:'none',stroke:'#4de070','stroke-width':1.8});
    txt(`${NuT.toFixed(1)}`,nAxis-NuT*nsc-3,yTop+10,{'font-size':'7.5','fill':'#6de072','text-anchor':'end'});
    txt(`${Nu.toFixed(1)}kN`,nAxis-Nu*nsc-3,yBase-4,{'font-size':'7.5','fill':'#6de072','text-anchor':'end'});

    // ── M diagram (right of column) ────────────────────────────
    const mAxis = xM;
    mk('line',{x1:mAxis,y1:yTop,x2:mAxis,y2:yBase,stroke:'rgba(47,129,247,0.15)','stroke-width':1});
    // M(z) = F_point*(H-z) + w_dist*(H-z)²/2  →  parabólico
    const wDist = parseFloat(r.w_dist) || 0;
    const Fp   = parseFloat(r.F_point) || Vu;
    const mPts = [];
    const NM   = 60;
    // First pass: find max M for scaling
    let maxM = 0.001;
    for(let i=0;i<=NM;i++){const hz=(1-i/NM)*H; const mv=Fp*hz+wDist*hz*hz/2; if(mv>maxM)maxM=mv;}
    const msc = (mW*0.82)/maxM;
    for(let i=0;i<=NM;i++){
      const hz=(1-i/NM)*H;
      const mv=Fp*hz+wDist*hz*hz/2;
      const yp=PAD_T+(i/NM)*colHpx;
      mPts.push(`${mAxis+mv*msc},${yp}`);
    }
    mk('polygon',{points:`${mAxis},${yTop} ${mPts.join(' ')} ${mAxis},${yBase}`,fill:'rgba(47,129,247,0.12)',stroke:'none'});
    mk('polyline',{points:mPts.join(' '),fill:'none',stroke:'#3a80f0','stroke-width':1.8});
    txt(`M=0`,mAxis+4,yTop+10,{'font-size':'7','fill':'rgba(100,165,248,0.6)'});
    txt(`Mu=${Mu.toFixed(2)}`,mAxis+mW*0.82+3,yBase-4,{'font-size':'8','fill':'#6ca5f8','font-weight':'600'});
    txt(`kN·m`,mAxis+mW*0.82+3,yBase+8,{'font-size':'7','fill':'#6ca5f8'});
    if(wDist>0) txt('(parábola)',mAxis+mW*0.4,yBase/2+yTop/2,{'font-size':'6.5','fill':'rgba(100,165,248,0.45)','text-anchor':'middle'});

    // ── V diagram — doble curvatura antisimétrica ──────────────────
    // Modelo sismo: +Vu en cabeza (z=H), V=0 en z=H/2, -Vu en base (z=0)
    const vAxis = xV + vW * 0.46;   // línea cero al centro del panel
    const VuT = parseFloat(r.Vu_top)  || parseFloat(r.Vu_base) || Vu;
    const VuB = parseFloat(r.Vu_base) || Vu;
    const vRef = Math.max(VuT, VuB, 0.01);
    const vsc  = (vW * 0.42) / vRef;  // escala: media-anchura por lado
    const yMid = (yTop + yBase) / 2;
    // Eje cero
    mk('line',{x1:vAxis,y1:yTop,x2:vAxis,y2:yBase,stroke:'rgba(248,81,73,0.25)','stroke-width':1,'stroke-dasharray':'4,3'});
    // Mitad superior: +VuT en cima → 0 en medio (hacia la derecha)
    mk('polygon',{points:`${vAxis},${yTop} ${vAxis+VuT*vsc},${yTop} ${vAxis},${yMid}`,fill:'rgba(248,81,73,0.13)',stroke:'none'});
    mk('polyline',{points:`${vAxis+VuT*vsc},${yTop} ${vAxis},${yMid}`,fill:'none',stroke:'#e04040','stroke-width':1.8});
    // Mitad inferior: 0 en medio → -VuB en base (hacia la izquierda)
    mk('polygon',{points:`${vAxis},${yMid} ${vAxis-VuB*vsc},${yBase} ${vAxis},${yBase}`,fill:'rgba(248,81,73,0.13)',stroke:'none'});
    mk('polyline',{points:`${vAxis},${yMid} ${vAxis-VuB*vsc},${yBase}`,fill:'none',stroke:'#e04040','stroke-width':1.8});
    // Etiquetas
    txt(`+${VuT.toFixed(1)}`,vAxis+VuT*vsc+3,yTop+10,{'font-size':'7','fill':'#f08080','font-weight':'600'});
    txt(`kN`,vAxis+VuT*vsc+3,yTop+19,{'font-size':'6.5','fill':'rgba(240,128,128,0.7)'});
    txt(`−${VuB.toFixed(1)}`,vAxis-VuB*vsc-3,yBase-5,{'font-size':'7','fill':'#f08080','font-weight':'600','text-anchor':'end'});
    txt(`kN`,vAxis-VuB*vsc-3,yBase+4,{'font-size':'6.5','fill':'rgba(240,128,128,0.7)','text-anchor':'end'});
    txt('V=0',vAxis+3,yMid-4,{'font-size':'6.5','fill':'rgba(248,81,73,0.5)'});
    const phiVc = 0.75*(parseFloat(design.Vc)||0);
    if(phiVc>0){
      const pVx=vAxis+phiVc*vsc;
      mk('line',{x1:pVx,y1:yTop,x2:pVx,y2:yMid,stroke:'rgba(248,81,73,0.4)','stroke-width':1,'stroke-dasharray':'3,3'});
      txt(`φVc=${phiVc.toFixed(1)}`,pVx+2,yTop+28,{'font-size':'7','fill':'rgba(248,81,73,0.6)'});
    }

    // ── Cross Section: AutoCAD Style ────
    // Draw the concrete section and an isolated stirrup below it
    const xs_b=Math.min(xsW*0.45,70), xs_h=Math.min(xsW*0.45,70)*h/b;
    const xsX=(xXS+(svgW-xXS)/2)-xs_b/2, xsY=yTop + 20;

    // Concrete outline (CAD White/Grey)
    mk('rect',{x:xsX,y:xsY,width:xs_b,height:xs_h,fill:'rgba(255,255,255,0.02)',stroke:'#e6e6e6','stroke-width':1.5});
    
    // Concrete dimensions
    mk('line',{x1:xsX,y1:xsY-4,x2:xsX,y2:xsY-10,stroke:'#444','stroke-width':1});
    mk('line',{x1:xsX+xs_b,y1:xsY-4,x2:xsX+xs_b,y2:xsY-10,stroke:'#444','stroke-width':1});
    mk('line',{x1:xsX,y1:xsY-7,x2:xsX+xs_b,y2:xsY-7,stroke:'#00ff00','stroke-width':1});
    txt(`${(b*100).toFixed(0)}`,xsX+xs_b/2,xsY-10,{'font-size':'8','fill':'#00ff00','text-anchor':'middle'});
    
    mk('line',{x1:xsX+xs_b+4,y1:xsY,x2:xsX+xs_b+10,y2:xsY,stroke:'#444','stroke-width':1});
    mk('line',{x1:xsX+xs_b+4,y1:xsY+xs_h,x2:xsX+xs_b+10,y2:xsY+xs_h,stroke:'#444','stroke-width':1});
    mk('line',{x1:xsX+xs_b+7,y1:xsY,x2:xsX+xs_b+7,y2:xsY+xs_h,stroke:'#00ff00','stroke-width':1});
    txt(`${(h*100).toFixed(0)}`,xsX+xs_b+12,xsY+xs_h/2,{'font-size':'8','fill':'#00ff00','text-anchor':'middle','transform':`rotate(90,${xsX+xs_b+12},${xsY+xs_h/2})`});

    // Rebar
    const br=3, bpad=recPx*xs_b/cW;
    const stColor = '#f0b040'; // CAD Yellow
    const rColor = '#00ffff';  // CAD Cyan

    // Stirrup outline (Yellow solid)
    mk('rect',{x:xsX+bpad,y:xsY+bpad,width:xs_b-2*bpad,height:xs_h-2*bpad,fill:'none',stroke:stColor,'stroke-width':1.5,'rx':2});
    
    // 135° Hooks
    const hkLen = Math.min(xs_b, xs_h) * 0.20;
    const hkD = hkLen * 0.707;
    const sX = xsX + bpad, sY = xsY + bpad;
    const eX = xsX + xs_b - bpad;
    mk('line',{x1:sX, y1:sY, x2:sX+hkD, y2:sY+hkD, stroke:stColor,'stroke-width':1.5,'stroke-linecap':'round'});
    mk('line',{x1:eX, y1:sY, x2:eX-hkD, y2:sY+hkD, stroke:stColor,'stroke-width':1.5,'stroke-linecap':'round'});

    // Bars in cross section (corners)
    [[xsX+bpad,xsY+bpad],[xsX+xs_b-bpad,xsY+bpad],[xsX+bpad,xsY+xs_h-bpad],[xsX+xs_b-bpad,xsY+xs_h-bpad]].forEach(([bx,by])=>{
      mk('circle',{cx:bx,cy:by,r:br,fill:rColor});
    });

    txt(`${nBars}Ø${diaL}`,xsX+xs_b/2,xsY+xs_h+12,{'font-size':'9','fill':rColor,'text-anchor':'middle','font-weight':'bold'});

    // ── Isolated Stirrup Detail ──
    const iY = xsY + xs_h + 40;
    const iW = xs_b - 2*bpad, iH = xs_h - 2*bpad;
    
    // Stirrup
    mk('rect',{x:xsX+bpad,y:iY,width:iW,height:iH,fill:'none',stroke:stColor,'stroke-width':1.5,'rx':2});
    mk('line',{x1:xsX+bpad, y1:iY, x2:xsX+bpad+hkD, y2:iY+hkD, stroke:stColor,'stroke-width':1.5,'stroke-linecap':'round'});
    mk('line',{x1:xsX+bpad+iW, y1:iY, x2:xsX+bpad+iW-hkD, y2:iY+hkD, stroke:stColor,'stroke-width':1.5,'stroke-linecap':'round'});
    
    // Stirrup dims
    const s_dia = design.estribos?.diámetro || 8;
    const s_sp = Math.round((sCrit)*100);
    const dw_cm = Math.round((b - 2*rec)*100);
    const dh_cm = Math.round((h - 2*rec)*100);
    const LT = Math.round(2*(dw_cm + dh_cm) + 2*(10 * s_dia/10));

    txt(`${dw_cm}`, xsX+xs_b/2, iY-4, {'font-size':'8','fill':'#888','text-anchor':'middle'});
    txt(`${dh_cm}`, xsX+bpad-4, iY+iH/2, {'font-size':'8','fill':'#888','text-anchor':'end'});
    
    txt(`E ø${s_dia}@${s_sp}`, xsX+xs_b/2, iY+iH+14, {'font-size':'9','fill':stColor,'text-anchor':'middle','font-weight':'bold'});
    mk('line',{x1:xsX+xs_b/2-20, y1:iY+iH+18, x2:xsX+xs_b/2+20, y2:iY+iH+18, stroke:'#444', 'stroke-width':1});
    txt(`LT = ${LT}`, xsX+xs_b/2, iY+iH+28, {'font-size':'8','fill':'#ccc','text-anchor':'middle'});

    // Zone labels
    txt(`Lc=${(critZ*100).toFixed(0)}cm`, xC+cW+4, yTop+critPx/2, {'font-size':'7','fill':'rgba(248,200,60,0.7)'});
    txt(`s=${(sCrit*100).toFixed(0)}cm`,  xC+cW+4, yTop+critPx/2+9,{'font-size':'7','fill':'rgba(248,200,60,0.7)'});
    txt(`s=${(sMax*100).toFixed(0)}cm`,   xC+cW+4,(yTop+yBase)/2,  {'font-size':'7','fill':'rgba(180,155,50,0.7)'});
    txt(`Lc=${(critZ*100).toFixed(0)}cm`, xC+cW+4, yBase-critPx/2, {'font-size':'7','fill':'rgba(248,200,60,0.7)'});
    txt(`s=${(sCrit*100).toFixed(0)}cm`,  xC+cW+4, yBase-critPx/2+9,{'font-size':'7','fill':'rgba(248,200,60,0.7)'});

    // ── Right panel: methodology ───────────────────────────────
    const rp = document.getElementById('el-detail-methodology');
    if(rp) {
      const Fseis = parseFloat(r.F_seis)||0, Fwind=parseFloat(r.F_wind)||0;
      const governs = Fseis>=Fwind ? 'Sismo NCh433' : 'Viento NCh432';
      rp.innerHTML=`
        <div style="margin-bottom:1rem;">
          <strong style="color:#fff;">1. Carga Axial (Nu)</strong><br>
          <span style="color:#6de072">Nu_top=${NuT.toFixed(1)} kN</span> (reacciones de vigas)<br>
          <span style="color:#6de072">Nu_base=${Nu.toFixed(1)} kN</span> (incl. peso propio)<br>
          Compresión pura: σ = Nu/Ag = ${(Nu*1000/(b*h*1e6)).toFixed(2)} MPa
          ${Nu/(b*h*1e6)*1e3<0.1*mat.fc?'<br><span style="color:#3fb950;font-weight:bold;">σ &lt;&lt; 0.10f\'c ✓ — Hormigón resiste sin problema</span>':'<br><span style="color:#f85149">σ cercano a límite</span>'}
        </div>
        <div style="margin-bottom:1rem;">
          <strong style="color:#fff;">2. Momento Volcante (Mu) — Bidireccional</strong><br>
          Caso desfavorable: <span style="color:#f0b040;font-weight:bold;">${governs}</span><br>
          F_sismo=${Fseis.toFixed(2)} kN, F_viento=${Fwind.toFixed(2)} kN<br>
          <span style="color:#6ca5f8">Mu_base=${Mu.toFixed(2)} kN·m</span><br>
          El sismo puede actuar en ±X: se toma |F_h| máximo.
        </div>
        <div>
          <strong style="color:#fff;">3. As requerido (doble armadura)</strong><br>
          As_req=${design.AsReq||'—'} cm² (simétrica por caras)<br>
          Armado actual: ${nBars}Ø${diaL} = ${(nBars*Math.PI*(diaL/2)**2/100).toFixed(2)} cm²
        </div>`;
      document.getElementById('el-detail-right').style.display='block';
    }
  },

  _drawDetailsPanel(elementType, elem, r, design, L, d_eff) {
    const panel = document.getElementById('el-detail-info');
    if (!panel) return;

    const { b, h } = elem.section;
    const m  = S.story.materials;
    const rebar = elem.rebar;
    const isColumn = (elementType === 'column');

    // Compute bar spacing (clear distance between bars)
    const supBars = rebar?.faces?.superior?.barras || [];
    const infBars = rebar?.faces?.inferior?.barras || [];
    const pielBars = rebar?.faces?.piel?.barras || [];
    const nSup = supBars.reduce((s, br) => s + (br.cantidad || br.qty || 1), 0);
    const nInf = infBars.reduce((s, br) => s + (br.cantidad || br.qty || 1), 0);
    const nPiel = pielBars.reduce((s, br) => s + (br.cantidad || br.qty || 0), 0);
    const diaLong = supBars[0]?.diámetro || supBars[0]?.diam || 10;
    const diaStr  = infBars[0]?.diámetro || infBars[0]?.diam || 10;
    const diaPiel  = pielBars[0]?.diámetro || pielBars[0]?.diam || 8;
    const hasPiel  = nPiel > 0;
    const rec_cm  = (elementType === 'beam_bot' ? 0.04 : (m.rec || 0.03)) * 100;
    const diaEst  = rebar?.estribos?.diámetro || 8;
    const sEst_cm = ((rebar?.estribos?.espaciamiento || 0.15) * 100).toFixed(0);

    // Clear bar spacing: (b - 2×rec - 2×diaEst - n×diam) / (n-1)
    const barsOnFace = Math.max(nSup, 2);
    const clearSpacing_cm = barsOnFace > 1
      ? ((b * 100 - 2 * rec_cm - 2 * diaEst / 10 - barsOnFace * diaLong / 10) / (barsOnFace - 1)).toFixed(1)
      : '—';

    // Development length Ld (ACI 318-19 §25.5.2, simplified):
    // Ld = (fy / (3.5 × √f'c)) × db  [mm]  — uncoated, normal-weight concrete
    const fy_MPa  = m.fy  || 420;
    const fpc_MPa = m.fc  || 25;
    const Ld_mm   = Math.ceil((fy_MPa / (3.5 * Math.sqrt(fpc_MPa))) * diaLong);
    const Ld_cm   = Math.ceil(Ld_mm / 10);
    const Ld_adopt_cm = Math.max(Ld_cm, 30);  // mínimo práctico 30cm

    // Lap splice = 1.3 × Ld (Clase B, ACI 318-19 §25.5.2)
    const Ls_cm = Math.ceil(1.3 * Ld_adopt_cm / 5) * 5;

    const AsReq = parseFloat(design.AsReq) || 0;
    const AsMax = parseFloat(design.AsMaxCm2) || 999;
    const AsProv = (rebar?.faces?.superior?.AsTotal || 0) + (rebar?.faces?.inferior?.AsTotal || 0);
    const statusColor = AsReq > AsMax ? '#f85149' : AsProv >= AsReq ? '#3fb950' : '#d29922';
    const statusTxt   = AsReq > AsMax ? '⚠ Sección Insuficiente' : AsProv >= AsReq ? '✓ Cumple' : '⚠ Insuficiente';

    const elNames = { beam_top: 'Cadena Superior', beam_bot: 'Sobrecimiento', column: 'Pilar de Confinamiento' };
    const elName  = elNames[elementType] || elementType;

    // NCh justification text by element
    const nchJust = isColumn
      ? 'NCh2123 §7.7.8: pilares mín. 4ø10 A630-420H + estribos ø≥6mm cada ≤20cm (central) y ≤10cm (zonas críticas, primeros 60cm). Pilar de esquina absorbe carga puntual Metalcon (Fc=4kN → Mu=10kN·m).'
      : elementType === 'beam_top'
      ? 'NCh2123 §7.7.8: cadenas mín. 4ø10 A630-420H. Cadena superior transmite carga vertical del techo Metalcon (qD+qL=2.36kN/m, trib.=2.36m) y lateral de viento (qw=0.42kN/m).'
      : 'NCh2123 §7.7.8: cadena inferior (sobrecimiento) mín. 4ø10 A630-420H. Acumula peso propio de albañilería + carga total del muro transmitida a la fundación.';

    panel.innerHTML = `
      <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(200px,1fr));gap:0.6rem 1rem;">

        <div>
          <div style="font-size:0.62rem;color:var(--text-muted);text-transform:uppercase;letter-spacing:0.06em;margin-bottom:4px">Material / Acero</div>
          <div style="font-size:0.72rem;line-height:1.7;">
            <span style="color:var(--text-muted)">Hormigón:</span> <strong>G${fpc_MPa} (f'c = ${fpc_MPa} MPa)</strong><br>
            <span style="color:var(--text-muted)">Acero:</span> <strong>A630-420H (fy = ${fy_MPa} MPa)</strong><br>
            <span style="color:var(--text-muted)">Norma:</span> NCh204, NCh170, NCh2123
          </div>
        </div>

        <div>
          <div style="font-size:0.62rem;color:var(--text-muted);text-transform:uppercase;letter-spacing:0.06em;margin-bottom:4px">Geometría</div>
          <div style="font-size:0.72rem;line-height:1.7;">
            <span style="color:var(--text-muted)">Sección:</span> <strong>b×h = ${(b*100).toFixed(0)}×${(h*100).toFixed(0)} cm</strong><br>
            <span style="color:var(--text-muted)">Longitud:</span> <strong>L = ${L.toFixed(2)} m</strong><br>
            <span style="color:var(--text-muted)">d efectivo:</span> <strong>${(d_eff*100).toFixed(1)} cm</strong>
          </div>
        </div>

        <div>
          <div style="font-size:0.62rem;color:var(--text-muted);text-transform:uppercase;letter-spacing:0.06em;margin-bottom:4px">Armadura Longitudinal</div>
          <div style="font-size:0.72rem;line-height:1.7;">
            <span style="color:var(--text-muted)">Sup:</span> <strong>${nSup}ø${diaLong}</strong>
              <span style="color:var(--text-muted);font-size:0.65rem;"> (${(rebar?.faces?.superior?.AsTotal||0).toFixed(2)} cm²)</span><br>
            ${hasPiel ? `
            <span style="color:var(--text-muted)">Piel:</span> <strong>${nPiel}ø${diaPiel}</strong>
              <span style="color:var(--text-muted);font-size:0.65rem;"> (${(rebar?.faces?.piel?.AsTotal||0).toFixed(2)} cm²)</span><br>
            ` : ''}
            <span style="color:var(--text-muted)">Inf:</span> <strong>${nInf}ø${diaStr}</strong>
              <span style="color:var(--text-muted);font-size:0.65rem;"> (${(rebar?.faces?.inferior?.AsTotal||0).toFixed(2)} cm²)</span><br>
            <span style="color:var(--text-muted)">Recub.:</span> <strong>${rec_cm.toFixed(0)} cm</strong>
            &nbsp;|&nbsp;
            <span style="color:var(--text-muted)">Sep. libre:</span> <strong>${clearSpacing_cm} cm</strong>
          </div>
        </div>

        <div>
          <div style="font-size:0.62rem;color:var(--text-muted);text-transform:uppercase;letter-spacing:0.06em;margin-bottom:4px">Estribos</div>
          <div style="font-size:0.72rem;line-height:1.7;">
            <span style="color:var(--text-muted)">Diám.:</span> <strong>ø${diaEst} mm</strong><br>
            <span style="color:var(--text-muted)">Zona central:</span> <strong>${sEst_cm} cm</strong><br>
            <span style="color:var(--text-muted)">Zona crítica (±60cm):</span> <strong>${Math.min(parseInt(sEst_cm), 10)} cm</strong>
          </div>
        </div>

        <div>
          <div style="font-size:0.62rem;color:var(--text-muted);text-transform:uppercase;letter-spacing:0.06em;margin-bottom:4px">Empalmes y Anclaje</div>
          <div style="font-size:0.72rem;line-height:1.7;">
            <span style="color:var(--text-muted)">Ld (desarr.):</span> <strong>${Ld_adopt_cm} cm</strong>
              <span style="color:var(--text-muted);font-size:0.65rem;"> ACI318 §25.5.2</span><br>
            <span style="color:var(--text-muted)">Ls (empalme Cl.B):</span> <strong>${Ls_cm} cm</strong>
              <span style="color:var(--text-muted);font-size:0.65rem;"> (1.3×Ld)</span><br>
            <span style="color:var(--text-muted)">Gancho estándar:</span> <strong>${Math.ceil(12*diaLong/10)} cm</strong>
          </div>
        </div>

        <div>
          <div style="font-size:0.62rem;color:var(--text-muted);text-transform:uppercase;letter-spacing:0.06em;margin-bottom:4px">Verificación NCh</div>
          <div style="font-size:0.72rem;line-height:1.7;">
            <span style="color:var(--text-muted)">As req.:</span> <strong>${AsReq.toFixed(2)} cm²</strong>
            &nbsp;|&nbsp;
            <span style="color:var(--text-muted)">As prov.:</span> <strong>${AsProv.toFixed(2)} cm²</strong><br>
            <span style="font-weight:700;color:${statusColor}">${statusTxt}</span>
          </div>
        </div>

      </div>
      <div style="margin-top:0.6rem;padding:0.5rem 0.7rem;background:rgba(88,166,255,0.06);border-left:3px solid rgba(88,166,255,0.3);border-radius:0 4px 4px 0;font-size:0.68rem;line-height:1.6;color:var(--text-muted);">
        <strong style="color:var(--text-primary)">${elName}</strong> — ${nchJust}
      </div>
    `;
  },

  // ── Foundation cross-section view — 3 paneles ───────────────────────
  _drawFoundation() {
    const svgEl = document.getElementById('el-detail-svg');
    svgEl.innerHTML = '';

    const f   = S.story.foundation;
    const r   = S.results.foundation;
    const lat = S.results.lateral;
    if (!f) return;

    const svgW = Math.max(svgEl.parentElement.clientWidth,  svgEl.clientWidth,  window.innerWidth  - 48, 960);
    const svgH = Math.max(svgEl.parentElement.clientHeight, svgEl.clientHeight, window.innerHeight - 80, 600);
    svgEl.setAttribute('viewBox', `0 0 ${svgW} ${svgH}`);

    const mk = (tag, attrs, parent) => {
      const e = document.createElementNS('http://www.w3.org/2000/svg', tag);
      Object.entries(attrs).forEach(([k, v]) => e.setAttribute(k, v));
      (parent || svgEl).appendChild(e); return e;
    };
    const txt = (text, x, y, attrs = {}, parent) => {
      const t = document.createElementNS('http://www.w3.org/2000/svg', 'text');
      t.textContent = text;
      t.setAttribute('x', x); t.setAttribute('y', y);
      Object.entries(attrs).forEach(([k, v]) => t.setAttribute(k, v));
      (parent || svgEl).appendChild(t); return t;
    };
    const line = (x1, y1, x2, y2, attrs = {}, parent) => mk('line', {x1,y1,x2,y2,...attrs}, parent || svgEl);
    const rect = (x, y, w, h, attrs = {}, parent)    => mk('rect',  {x,y,width:w,height:h,...attrs}, parent || svgEl);
    const circ = (cx, cy, r, attrs = {}, parent)     => mk('circle',{cx,cy,r,...attrs}, parent || svgEl);

    // ── Datos del modelo ─────────────────────────────────────────────
    const B    = parseFloat(f.B)  || 0.60;
    const Hf   = parseFloat(f.Hf) || 0.35;
    const Df   = parseFloat(f.Df) || 0.80;
    const NF   = parseFloat(f.NF) || 3.0;
    const rec  = 0.07;
    const fType = f.type || 'T';
    const dEff = Hf - rec - 0.006;

    // Barras del muro
    const wallTw  = S.spans[0]?.tw || 0.14;
    const colSec  = Object.values(S.columns)[0]?.section || { b: 0.20, h: 0.15 };
    const bbSec   = S.spans[0]?.beamBot?.section || { b: 0.20, h: 0.15 };

    // Armadura de la zapata
    const AsReqRaw = parseFloat(r?.rebar?.AsReq) || 2.0;
    const diaT = 12;
    const aBarT = Math.PI * (diaT/10)**2 / 4;
    const spacingT = Math.min(0.30, aBarT / AsReqRaw);
    const nBarsT   = Math.max(2, Math.ceil(B / spacingT) + 1);
    const diaL = 10;
    const nBarsL = 3;

    // Sigma y qadm para el diagrama de presión
    const sigma  = parseFloat(r?.sigma_contact) || 0;
    const qAdm   = parseFloat(r?.q_adm) || 150;
    const pctOk  = Math.min(1, sigma / qAdm);
    const presColor = pctOk > 0.9 ? '#f85149' : pctOk > 0.75 ? '#d29922' : '#3fb950';

    // ── Layout: 3 paneles con límites explícitos ──────────────────────
    const GAP  = 20;   // separación entre paneles
    const IPAD = 18;   // padding interno horizontal
    const IPAD_V = 14; // padding interno vertical (inferior)
    const TITLE_H = 46; // alto reservado para el título de cada panel

    // Límites exteriores de cada panel (px)
    const bx1 = 4,  bx2 = Math.round(svgW * 0.52);          // Panel 1
    const bx3 = bx2 + GAP, bx4 = svgW - 4;                  // Paneles 2 y 3
    const by1 = 4,  by2 = svgH - 4;                          // Panel 1 (alto completo)
    const p2bot = Math.round(by1 + (by2 - by1) * 0.50);      // Panel 2 bottom
    const p3top = p2bot + GAP;                                // Panel 3 top

    const panelStyle = { fill: 'rgba(255,255,255,0.03)', stroke: 'rgba(255,255,255,0.12)', 'stroke-width': 1, rx: 8 };
    rect(bx1, by1, bx2 - bx1,        by2 - by1,      panelStyle);
    rect(bx3, by1, bx4 - bx3,        p2bot - by1,    panelStyle);
    rect(bx3, p3top, bx4 - bx3,      by2 - p3top,    panelStyle);

    // Área de dibujo interior de cada panel
    const P1 = { x0: bx1 + IPAD + 55, y0: by1 + TITLE_H, x1: bx2 - IPAD, y1: by2 - IPAD_V };
    const P2 = { x0: bx3 + IPAD,      y0: by1 + TITLE_H, x1: bx4 - IPAD, y1: p2bot - IPAD_V };
    const P3 = { x0: bx3 + IPAD,      y0: p3top + TITLE_H, x1: bx4 - IPAD, y1: by2 - IPAD_V };

    // ════════════════════════════════════════════════════════════════
    // PANEL 1 — Sección Transversal (tipo L)
    // Área interior P1: {x0,y0,x1,y1} con padding ya aplicado
    // ════════════════════════════════════════════════════════════════
    {
      const dw = P1.x1 - P1.x0;   // ancho disponible para dibujar
      const dh = P1.y1 - P1.y0;   // alto disponible para dibujar

      // Escala: zapata ocupa ~50% del ancho, deja espacio a ambos lados
      const scaleM = (dw * 0.50) / B;
      // Vertical: reservar 30% arriba para muro/suelo, 30% abajo para cota+presión
      const scaleH = Math.min(scaleM, (dh * 0.35) / Hf);

      // Posición vertical: zapata empieza al 38% de dh
      const topY = P1.y0 + dh * 0.38;
      const botY = topY + Hf * scaleH;

      // Posición horizontal según tipo
      let footL, footR;
      if (fType === 'L') {
        footL = P1.x0 + dw * 0.05;
        footR = footL + B * scaleM;
      } else if (fType === 'L-inv') {
        footR = P1.x1 - dw * 0.05;
        footL = footR - B * scaleM;
      } else {
        const cx = (P1.x0 + P1.x1) / 2;
        footL = cx - B * scaleM / 2;
        footR = cx + B * scaleM / 2;
      }
      const pCx = (footL + footR) / 2;

      // Títulos (dentro del panel, encima de P1.y0)
      const titY1 = by1 + 22, titY2 = by1 + 36;
      txt('SECCIÓN TRANSVERSAL — Zapata Corrida', (bx1 + bx2) / 2, titY1,
        { 'font-size': '11', fill: 'rgba(255,255,255,0.55)', 'text-anchor': 'middle', 'font-weight': '600' });
      const typeStr = fType === 'L' ? 'Tipo L — voladizo →' : fType === 'L-inv' ? '← voladizo — Tipo L' : 'Tipo T (simétrica)';
      txt(typeStr, (bx1 + bx2) / 2, titY2,
        { 'font-size': '9', fill: '#d29922', 'text-anchor': 'middle', 'font-weight': 'bold' });

      // Suelo sobre la zapata
      const soilPx = (Df - Hf) * scaleH;
      const soilTop = Math.max(P1.y0 + 4, topY - soilPx);
      if (soilTop < topY)
        rect(footL - 16, soilTop, footR - footL + 32, topY - soilTop,
          { fill: 'rgba(100,80,50,0.15)', stroke: 'none' });

      // NTN
      line(footL - 20, soilTop, footR + 20, soilTop,
        { stroke: 'rgba(100,160,80,0.5)', 'stroke-width': 1.5, 'stroke-dasharray': '6 3' });
      txt('N.T.N.', footR + 22, soilTop + 4, { 'font-size': '8', fill: 'rgba(100,160,80,0.7)' });

      // Zapata
      rect(footL, topY, footR - footL, botY - topY,
        { fill: 'rgba(80,100,130,0.3)', stroke: '#7090b0', 'stroke-width': 2 });

      // Stub muro/sobrecimiento
      const stubW = Math.max(wallTw, bbSec.b) * scaleM;
      const stubH = Math.min(36, topY - P1.y0 - 20);
      const stubX = fType === 'L' ? footL
                  : fType === 'L-inv' ? footR - stubW
                  : pCx - stubW / 2;
      if (stubH > 8)
        rect(stubX, topY - stubH, stubW, stubH + 2,
          { fill: 'rgba(63,130,180,0.2)', stroke: '#6090b0', 'stroke-width': 1.5 });
      txt(`t=${Math.round(wallTw*100)}cm`, stubX + stubW / 2, topY - stubH - 5,
        { 'font-size': '8', fill: '#aaa', 'text-anchor': 'middle' });

      // Barras transversales (flexión) — fondo
      const recPx = Math.min(rec * scaleH, (botY - topY) * 0.25);
      const barYb = botY - recPx;
      const barYt = topY + recPx;
      for (let i = 0; i < nBarsT; i++) {
        const bx = footL + (i + 0.5) * ((footR - footL) / nBarsT);
        circ(bx, barYb, 5, { fill: '#2f81f7', stroke: 'rgba(0,0,0,0.6)', 'stroke-width': 1.5 });
      }
      for (let i = 1; i <= nBarsL; i++) {
        circ(footL + i * (footR - footL) / (nBarsL + 1), barYt, 4,
          { fill: '#8b5cf6', stroke: 'rgba(0,0,0,0.6)', 'stroke-width': 1.5 });
      }

      // Etiquetas barras (debajo de la zapata para no solapar)
      txt(`${nBarsT} φ${diaT} — Arm. Transversal (Flexión)`,
        pCx, botY + 14, { 'font-size': '8', fill: '#6ca5f8', 'text-anchor': 'middle' });
      txt(`${nBarsL} φ${diaL} — Arm. Longitudinal (Temp./retracción)`,
        pCx, botY + 25, { 'font-size': '8', fill: '#a371f7', 'text-anchor': 'middle' });

      // Flecha voladizo
      if (fType !== 'T') {
        const arrowY = botY + 38;
        const ax1 = fType === 'L' ? stubX + stubW : footL;
        const ax2 = fType === 'L' ? footR          : stubX;
        if (ax2 > ax1 + 4) {
          line(ax1, arrowY, ax2, arrowY, { stroke: '#f0a050', 'stroke-width': 1.5 });
          [ax1, ax2].forEach(x => line(x, arrowY - 4, x, arrowY + 4, { stroke: '#f0a050', 'stroke-width': 1.5 }));
          txt(`L_c = ${(B - bbSec.b).toFixed(2)} m`,
            (ax1 + ax2) / 2, arrowY + 13,
            { 'font-size': '8', fill: '#f0a050', 'text-anchor': 'middle' });
        }
      }

      // Cota B
      const cotaY = Math.min(botY + 56, P1.y1 - 16);
      line(footL, cotaY, footR, cotaY, { stroke: '#888', 'stroke-width': 1 });
      [footL, footR].forEach(x => line(x, cotaY - 4, x, cotaY + 4, { stroke: '#888', 'stroke-width': 1 }));
      txt(`B = ${B.toFixed(2)} m`, pCx, cotaY + 13,
        { 'font-size': '9', fill: '#ccc', 'text-anchor': 'middle' });

      // Cotas laterales Hf / Df
      const leftX = footL - 14;
      line(leftX, topY, leftX, botY, { stroke: '#aaa', 'stroke-width': 1 });
      txt(`Hf=${Math.round(Hf*100)}cm`, leftX - 3, (topY + botY) / 2 + 4,
        { 'font-size': '8', fill: '#ccc', 'text-anchor': 'end' });
      if (soilTop < topY - 10) {
        line(leftX, soilTop, leftX, topY, { stroke: '#666', 'stroke-width': 1, 'stroke-dasharray': '3 2' });
        txt(`Df=${Math.round(Df*100)}cm`, leftX - 3, (soilTop + topY) / 2 + 4,
          { 'font-size': '7.5', fill: '#888', 'text-anchor': 'end' });
      }

      // d efectivo (lado derecho de la zapata)
      const dRightX = footR + 10;
      if (dRightX + 40 < P1.x1) {
        line(dRightX, barYb, dRightX, topY, { stroke: '#58a6ff', 'stroke-width': 1 });
        txt(`d=${(dEff*100).toFixed(1)}cm`, dRightX + 3, (barYb + topY) / 2 + 4,
          { 'font-size': '8', fill: '#58a6ff' });
      }

      // Diagrama presión (si cabe)
      const presY = cotaY + 24;
      if (presY + 32 < P1.y1) {
        const presH = Math.min(24, P1.y1 - presY - 8);
        rect(footL, presY, footR - footL, presH * pctOk,
          { fill: presColor + '40', stroke: presColor, 'stroke-width': 1.5 });
        txt(`σ=${sigma} kPa  /  qadm=${qAdm} kPa`,
          pCx, presY + presH * pctOk + 13,
          { 'font-size': '8', fill: presColor, 'text-anchor': 'middle', 'font-weight': '600' });
      }

      // Tabla de resultados gravitacionales (parte superior, columna izquierda)
      const rX = bx1 + 6, rY0 = P1.y0 + 4;
      [
        { l: 'qult',    v: (r?.q_ult||'—') + ' kPa',         c: '#d29922' },
        { l: 'qadm',    v: (r?.q_adm||'—') + ' kPa',         c: '#3fb950' },
        { l: 'σ',       v: sigma + ' kPa',                    c: pctOk > 0.9 ? '#f85149' : '#ccc' },
        { l: 'Mu',      v: (r?.Mu||'—') + ' kN·m/m',          c: '#6ca5f8' },
        { l: 'L_c',     v: (r?.L_c||'—') + ' m',              c: '#f0a050' },
      ].forEach(({ l, v, c }, i) => {
        txt(l, rX, rY0 + i * 22 + 9, { 'font-size': '7', fill: '#666' });
        txt(v, rX, rY0 + i * 22 + 19, { 'font-size': '9', fill: c, 'font-weight': '600' });
      });

      // ── Bloque CARGAS LATERALES ──────────────────────────────────
      if (lat) {
        const latY0 = rY0 + 5 * 22 + 14;
        const colOk = '#3fb950', colBad = '#f85149';
        txt('— LATERALES —', rX, latY0, { 'font-size': '7', fill: '#888', 'font-weight': '600' });

        const latRows = [
          { l: 'F_h',     v: lat.F_h + ' kN/m',  c: '#f85149', sub: lat.governing },
          { l: 'C_s',     v: lat.Cs + ' W',      c: '#d29922', sub: `A₀=${lat.A0}g S=${lat.S_factor}` },
          { l: 'FS_v →',  v: lat.FS_v_pos,        c: parseFloat(lat.FS_v_pos) >= lat.FS_limit ? colOk : colBad },
          { l: 'FS_v ←',  v: lat.FS_v_neg,        c: parseFloat(lat.FS_v_neg) >= lat.FS_limit ? colOk : colBad },
          { l: 'FS_d',    v: lat.FS_d,            c: parseFloat(lat.FS_d) >= lat.FS_limit ? colOk : colBad },
          { l: 'e_max',   v: lat.e_max + ' m',    c: parseFloat(lat.e_max) <= parseFloat(lat.e_kern) ? colOk : '#d29922', sub: `kern ${lat.e_kern}` },
          { l: 'σ_max',   v: (lat.sigma_pos === '∞ (vuelca)' || lat.sigma_neg === '∞ (vuelca)' ? '∞ ⚠' : Math.max(parseFloat(lat.sigma_pos), parseFloat(lat.sigma_neg)).toFixed(1) + ' kPa'),
                          c: '#f08080' },
        ];
        latRows.forEach(({ l, v, c, sub }, i) => {
          const y = latY0 + 10 + i * 24;
          txt(l, rX, y, { 'font-size': '7', fill: '#666' });
          txt(v, rX, y + 10, { 'font-size': '9', fill: c, 'font-weight': '600' });
          if (sub) txt(sub, rX, y + 18, { 'font-size': '6.5', fill: '#555', 'font-style': 'italic' });
        });

        // Vector F_h sobre el stub del muro (flecha horizontal)
        const arrowLen = 38;
        const arrowY_h = topY - stubH / 2;
        const arrowDir = (fType === 'L') ? 1 : -1;  // L: empuje crítico hacia +x (cantilever); L-inv al revés
        const ax_start = (fType === 'L') ? stubX - arrowLen
                       : (fType === 'L-inv') ? stubX + stubW + arrowLen
                       : pCx - arrowLen / 2;
        const ax_end = ax_start + arrowDir * arrowLen;
        line(ax_start, arrowY_h, ax_end, arrowY_h, { stroke: '#f85149', 'stroke-width': 2.5 });
        // Punta de flecha
        line(ax_end - arrowDir * 6, arrowY_h - 4, ax_end, arrowY_h, { stroke: '#f85149', 'stroke-width': 2 });
        line(ax_end - arrowDir * 6, arrowY_h + 4, ax_end, arrowY_h, { stroke: '#f85149', 'stroke-width': 2 });
        txt(`F_h=${lat.F_h}kN/m`, (ax_start + ax_end) / 2, arrowY_h - 6,
          { 'font-size': '7.5', fill: '#f85149', 'text-anchor': 'middle', 'font-weight': '600' });
        txt(`(${lat.governing}, h=${lat.hApply}m)`, (ax_start + ax_end) / 2, arrowY_h + 12,
          { 'font-size': '6.5', fill: '#888', 'text-anchor': 'middle' });
      }
    }

    // ════════════════════════════════════════════════════════════════
    // PANEL 2 — Corte A-A: Conexión Zapata ↔ Viga Inferior
    // Escala derivada del espacio disponible, no del viewLen fijo
    // ════════════════════════════════════════════════════════════════
    {
      const dw2 = P2.x1 - P2.x0;
      const dh2 = P2.y1 - P2.y0;
      const cx2 = (P2.x0 + P2.x1) / 2;

      // Títulos
      txt('CORTE A–A  —  Zapata / Viga Inferior', (bx3 + bx4) / 2, by1 + 20,
        { 'font-size': '10', fill: 'rgba(255,255,255,0.55)', 'text-anchor': 'middle', 'font-weight': '600' });
      txt('(Vista longitudinal — barras corren ⊥ y ∥ al corte)', (bx3 + bx4) / 2, by1 + 33,
        { 'font-size': '7.5', fill: '#555', 'text-anchor': 'middle' });

      // Escala: Hf ocupa 35% del alto disponible
      const sc2 = (dh2 * 0.35) / Hf;
      // Suelo visible: lo que cabe arriba de la zapata
      const soilPx2 = Math.min((Df - Hf) * sc2, dh2 * 0.30);

      const footTop2 = P2.y0 + soilPx2 + dh2 * 0.04;
      const footBot2 = footTop2 + Hf * sc2;

      // Anchura del segmento de zapata = 88% del panel
      const fW2 = dw2 * 0.88;
      const fL2 = cx2 - fW2 / 2;
      const fR2 = cx2 + fW2 / 2;

      // Suelo a los lados (capeado a soilPx2)
      const soilTop2 = footTop2 - soilPx2;
      rect(fL2 - 16, soilTop2, 14, soilPx2,
        { fill: 'rgba(100,80,50,0.2)', stroke: 'rgba(100,80,50,0.3)', 'stroke-width': 1 });
      rect(fR2 + 2, soilTop2, 14, soilPx2,
        { fill: 'rgba(100,80,50,0.2)', stroke: 'rgba(100,80,50,0.3)', 'stroke-width': 1 });

      // NTN
      line(fL2 - 18, footTop2, fR2 + 18, footTop2,
        { stroke: 'rgba(100,160,80,0.45)', 'stroke-width': 1, 'stroke-dasharray': '5 3' });
      txt('N.T.N.', fR2 + 20, footTop2 + 4, { 'font-size': '7', fill: 'rgba(100,160,80,0.6)' });

      // Zapata (vista longitudinal)
      rect(fL2, footTop2, fW2, Hf * sc2,
        { fill: 'rgba(80,100,130,0.3)', stroke: '#7090b0', 'stroke-width': 2 });

      // Barras como líneas horizontales
      const recPx2 = Math.min(rec * sc2, Hf * sc2 * 0.22);
      line(fL2 + 8, footBot2 - recPx2, fR2 - 8, footBot2 - recPx2,
        { stroke: '#2f81f7', 'stroke-width': 3 });
      line(fL2 + 8, footTop2 + recPx2, fR2 - 8, footTop2 + recPx2,
        { stroke: '#8b5cf6', 'stroke-width': 2 });

      // Viga / sobrecimiento
      const beamH2 = Math.min(bbSec.h * sc2, footTop2 - P2.y0 - 20);
      const beamW2 = Math.min(fW2 * 0.68, bbSec.b * sc2 * 7);
      const bL2 = cx2 - beamW2 / 2, bR2 = cx2 + beamW2 / 2;
      if (beamH2 > 6) {
        rect(bL2, footTop2 - beamH2, beamW2, beamH2 + 2,
          { fill: 'rgba(63,130,180,0.2)', stroke: '#5080a0', 'stroke-width': 1.5 });
        line(bL2 + 5, footTop2 - recPx2 * 0.8, bR2 - 5, footTop2 - recPx2 * 0.8,
          { stroke: '#2f81f7', 'stroke-width': 2.5 });
        line(bL2 + 5, footTop2 - beamH2 + recPx2 * 0.8, bR2 - 5, footTop2 - beamH2 + recPx2 * 0.8,
          { stroke: '#8b5cf6', 'stroke-width': 2 });
        for (let i = 0; i <= 5; i++) {
          const sx = bL2 + i * beamW2 / 5;
          line(sx, footTop2 - beamH2 + 4, sx, footTop2 - 4,
            { stroke: 'rgba(255,255,255,0.22)', 'stroke-width': 1 });
        }
        txt('Viga / Sobrecimiento', cx2, footTop2 - beamH2 - 7,
          { 'font-size': '8', fill: '#8ab4d4', 'text-anchor': 'middle' });
        txt(`${Math.round(bbSec.b*100)}×${Math.round(bbSec.h*100)}cm`,
          cx2, footTop2 - beamH2 - 17,
          { 'font-size': '7.5', fill: '#555', 'text-anchor': 'middle' });
      }

      // Etiquetas barras — debajo de la zapata
      txt(`φ${diaT} @ ${Math.round(spacingT*100)}cm — Arm. Transversal  (⊥ a este corte)`,
        cx2, footBot2 + 14, { 'font-size': '7.5', fill: '#6ca5f8', 'text-anchor': 'middle' });
      txt(`φ${diaL} — Arm. Longitudinal  (∥ a este corte)`,
        cx2, footBot2 + 25, { 'font-size': '7.5', fill: '#a371f7', 'text-anchor': 'middle' });

      // Marcadores A–A
      txt('A', fL2 - 14, (footTop2 + footBot2) / 2 + 4,
        { 'font-size': '11', fill: '#d29922', 'font-weight': 'bold', 'text-anchor': 'middle' });
      txt('A', fR2 + 14, (footTop2 + footBot2) / 2 + 4,
        { 'font-size': '11', fill: '#d29922', 'font-weight': 'bold', 'text-anchor': 'middle' });

      // Cota Hf lateral
      line(fR2 + 18, footTop2, fR2 + 18, footBot2, { stroke: '#888', 'stroke-width': 1 });
      txt(`Hf=${Math.round(Hf*100)}cm`, fR2 + 20, (footTop2 + footBot2) / 2 + 4,
        { 'font-size': '7.5', fill: '#ccc' });
    }

    // ════════════════════════════════════════════════════════════════
    // PANEL 3 — Corte B-B: Conexión Zapata ↔ Columna
    // ════════════════════════════════════════════════════════════════
    {
      const dw3 = P3.x1 - P3.x0;
      const dh3 = P3.y1 - P3.y0;
      const cx3 = (P3.x0 + P3.x1) / 2;

      // Títulos
      txt('CORTE B–B  —  Zapata / Columna', (bx3 + bx4) / 2, p3top + 20,
        { 'font-size': '10', fill: 'rgba(255,255,255,0.55)', 'text-anchor': 'middle', 'font-weight': '600' });
      txt('(Vista transversal — barras de col. como círculos)', (bx3 + bx4) / 2, p3top + 33,
        { 'font-size': '7.5', fill: '#555', 'text-anchor': 'middle' });

      // Escala: B ocupa 55% del ancho, Hf ocupa 35% del alto
      const sc3w = (dw3 * 0.55) / B;
      const sc3h = (dh3 * 0.35) / Hf;
      const sc3  = Math.min(sc3w, sc3h);
      const soilPx3 = Math.min((Df - Hf) * sc3, dh3 * 0.28);

      const foot3Top = P3.y0 + soilPx3 + dh3 * 0.06;
      const foot3Bot = foot3Top + Hf * sc3;

      // Posición horizontal de la zapata
      let foot3L, foot3R;
      if (fType === 'L') {
        foot3L = cx3 - B * sc3 * 0.15;
        foot3R = foot3L + B * sc3;
      } else if (fType === 'L-inv') {
        foot3R = cx3 + B * sc3 * 0.15;
        foot3L = foot3R - B * sc3;
      } else {
        foot3L = cx3 - B * sc3 / 2;
        foot3R = cx3 + B * sc3 / 2;
      }

      // Suelo (capeado)
      const soilTop3 = foot3Top - soilPx3;
      rect(foot3L - 16, soilTop3, 14, soilPx3,
        { fill: 'rgba(100,80,50,0.2)', stroke: 'rgba(100,80,50,0.3)', 'stroke-width': 1 });
      rect(foot3R + 2, soilTop3, 14, soilPx3,
        { fill: 'rgba(100,80,50,0.2)', stroke: 'rgba(100,80,50,0.3)', 'stroke-width': 1 });
      line(foot3L - 18, foot3Top, foot3R + 18, foot3Top,
        { stroke: 'rgba(100,160,80,0.4)', 'stroke-width': 1, 'stroke-dasharray': '5 3' });

      // Zapata
      rect(foot3L, foot3Top, foot3R - foot3L, foot3Bot - foot3Top,
        { fill: 'rgba(80,100,130,0.3)', stroke: '#7090b0', 'stroke-width': 2 });

      // Barras como líneas
      const recPx3 = Math.min(rec * sc3, (foot3Bot - foot3Top) * 0.22);
      line(foot3L + 6, foot3Bot - recPx3, foot3R - 6, foot3Bot - recPx3,
        { stroke: '#2f81f7', 'stroke-width': 3.5 });
      line(foot3L + 6, foot3Top + recPx3, foot3R - 6, foot3Top + recPx3,
        { stroke: '#8b5cf6', 'stroke-width': 2 });

      // Columna
      const colHpx = colSec.h * sc3;
      let colX = fType === 'L' ? foot3L : fType === 'L-inv' ? foot3R - colHpx : cx3 - colHpx / 2;
      const colAvail = Math.min(dh3 * 0.38, foot3Top - P3.y0 - 28);
      const colHgt = Math.max(20, colAvail);
      rect(colX, foot3Top - colHgt, colHpx, colHgt + 2,
        { fill: 'rgba(63,130,180,0.22)', stroke: '#6090b0', 'stroke-width': 1.5 });

      // Barras columna (círculos)
      const cbr = 4;
      [colX + recPx3, colX + colHpx - recPx3].forEach(bx =>
        [foot3Top - colHgt + recPx3 * 1.5, foot3Top - recPx3 * 1.5].forEach(by =>
          circ(bx, by, cbr, { fill: '#3fb950', stroke: 'rgba(0,0,0,0.6)', 'stroke-width': 1.5 })
        )
      );

      // Chicotes (Dowels AutoCAD Style)
      const nDow = 2;
      const dColor = '#00ffff'; // CAD Cyan
      for (let i = 1; i <= nDow; i++) {
        const dx = colX + i * colHpx / (nDow + 1);
        const hookY = foot3Bot - recPx3 - 2; // Resting on mat
        const hDir = i===1 ? -1 : 1;
        // Vert
        line(dx, hookY, dx, foot3Top - colHgt - 10, { stroke: dColor, 'stroke-width': 2, 'stroke-linecap': 'round' });
        // Hook
        line(dx, hookY, dx + hDir*12, hookY, { stroke: dColor, 'stroke-width': 2, 'stroke-linecap': 'round' });
      }

      // Etiqueta columna
      txt('Columna', colX + colHpx / 2, foot3Top - colHgt - 7,
        { 'font-size': '8', fill: '#3fb950', 'text-anchor': 'middle' });
      txt(`${Math.round(colSec.b*100)}×${Math.round(colSec.h*100)}cm`,
        colX + colHpx / 2, foot3Top - colHgt - 17,
        { 'font-size': '7.5', fill: '#555', 'text-anchor': 'middle' });

      // Etiqueta chicotes (línea de referencia hacia el lado derecho)
      const chicLabelY = foot3Bot - (foot3Bot - foot3Top) * 0.35;
      const chicLabelX = Math.min(foot3R + 60, P3.x1 - 4);
      line(foot3R + 2, chicLabelY, chicLabelX, chicLabelY,
        { stroke: 'rgba(255,200,100,0.4)', 'stroke-width': 1 });
      txt('Chicotes', chicLabelX + 2, chicLabelY + 4,
        { 'font-size': '7.5', fill: 'rgba(255,200,100,0.85)' });

      // Indicador voladizo
      if (fType !== 'T') {
        const cantStart = fType === 'L' ? colX + colHpx : foot3L;
        const cantEnd   = fType === 'L' ? foot3R         : colX;
        if (cantEnd > cantStart + 6) {
          const arY3 = foot3Top - 8;
          line(cantStart, arY3, cantEnd, arY3, { stroke: '#f0a050', 'stroke-width': 1.5 });
          [cantStart, cantEnd].forEach(x =>
            line(x, arY3 - 4, x, arY3 + 4, { stroke: '#f0a050', 'stroke-width': 1.5 }));
          txt(`L_c=${(B - colSec.h).toFixed(2)}m`,
            (cantStart + cantEnd) / 2, arY3 - 5,
            { 'font-size': '7.5', fill: '#f0a050', 'text-anchor': 'middle' });
        }
      }

      // Cota B
      const cotaY3 = Math.min(foot3Bot + 28, P3.y1 - 22);
      line(foot3L, cotaY3, foot3R, cotaY3, { stroke: '#888', 'stroke-width': 1 });
      [foot3L, foot3R].forEach(x => line(x, cotaY3 - 4, x, cotaY3 + 4, { stroke: '#888', 'stroke-width': 1 }));
      txt(`B = ${B.toFixed(2)} m`, (foot3L + foot3R) / 2, cotaY3 + 13,
        { 'font-size': '8.5', fill: '#ccc', 'text-anchor': 'middle' });

      // Etiquetas barras
      txt(`φ${diaT}@${Math.round(spacingT*100)}cm  Arm.Transversal (flexión voladizo)`,
        (foot3L + foot3R) / 2, cotaY3 + 26,
        { 'font-size': '7.5', fill: '#6ca5f8', 'text-anchor': 'middle' });

      // Marcadores B–B
      txt('B', foot3L - 14, (foot3Top + foot3Bot) / 2 + 4,
        { 'font-size': '11', fill: '#d29922', 'font-weight': 'bold', 'text-anchor': 'middle' });
      txt('B', foot3R + 14, (foot3Top + foot3Bot) / 2 + 4,
        { 'font-size': '11', fill: '#d29922', 'font-weight': 'bold', 'text-anchor': 'middle' });
    }

    // ── POPULATE RIGHT PANEL (Methodology) ────────────────────────
    const rightPanel = document.getElementById('el-detail-methodology');
    if (rightPanel) {
      rightPanel.innerHTML = `
        <div style="margin-bottom:1rem;">
          <strong style="color:#fff;">1. Verificación Capacidad de Soporte (q ≤ qadm)</strong><br>
          <span style="color:#f85149">σ_max = ${sigma.toFixed(2)} kPa</span><br>
          <span style="color:#3fb950">q_adm = ${qAdm.toFixed(2)} kPa</span><br>
          ${sigma <= qAdm ? 
            `Las presiones de contacto no superan la capacidad admisible del suelo.` :
            `<span style="color:#f85149; font-weight:bold;">¡Falla por soporte!</span> La presión excede q_adm.`}
        </div>
        <div style="margin-bottom:1rem;">
          <strong style="color:#fff;">2. Flexión de Zapata (φMn ≥ Mu)</strong><br>
          <span style="color:#6ca5f8">Mu = ${(r?.Mu || 0)} kN·m/m</span><br>
          La normativa (NCh430) exige verificar que el voladizo de la zapata sea capaz de resistir el momento originado por la reacción del suelo.<br>
          Se calcula el As_req y se distribuye transversalmente asegurando una armadura dúctil.
        </div>
      `;
      document.getElementById('el-detail-right').style.display = 'block';
    }

    // Leyenda global (parte inferior del área derecha)
    {
      const lx = bx3 + 10;
      const ly = by2 - 10;
      circ(lx + 5, ly, 4, { fill: '#2f81f7' });
      txt('Transversal/Flexión', lx + 13, ly + 4, { 'font-size': '7.5', fill: '#6ca5f8' });
      circ(lx + 140, ly, 4, { fill: '#8b5cf6' });
      txt('Longitudinal/Temp.', lx + 148, ly + 4, { 'font-size': '7.5', fill: '#a371f7' });
      circ(lx + 280, ly, 4, { fill: '#3fb950' });
      txt('Barras columna', lx + 288, ly + 4, { 'font-size': '7.5', fill: '#3fb950' });
      line(lx + 390, ly - 3, lx + 408, ly - 3, { stroke: 'rgba(255,200,100,0.8)', 'stroke-width': 2 });
      txt('Chicotes', lx + 411, ly + 4, { 'font-size': '7.5', fill: 'rgba(255,200,100,0.85)' });
    }
  }
};