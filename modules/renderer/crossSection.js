/**
 * CROSSSECTION.JS — Visualización de Sección Transversal
 * Dibuja sección con barras de armadura colocadas
 */

const CrossSection = {
  draw(elementId, container) {
    if (!container) return;

    const elem = S.elements[elementId];
    if (!elem || elem.id === 'wall') {
      container.innerHTML = '<p style="font-size:0.8rem;color:var(--text-muted)">No aplica para albañilería.</p>';
      return;
    }

    container.innerHTML = '';

    const section = elem.section;
    const rebar = elem.rebar;
    const validation = rebar ? RebarValidator.check(elementId, rebar) : null;

    // SVG canvas
    const svgW = 340, svgH = 220;
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('width', svgW);
    svg.setAttribute('height', svgH);
    svg.setAttribute('viewBox', `0 0 ${svgW} ${svgH}`);
    svg.style.cssText = 'display:block;margin:0 auto;background:#0d1117;border:1px solid var(--border-light);border-radius:4px;';

    const mkEl = (tag, attrs) => {
      const e = document.createElementNS('http://www.w3.org/2000/svg', tag);
      Object.entries(attrs).forEach(([k, v]) => e.setAttribute(k, v));
      svg.appendChild(e);
      return e;
    };
    const mkTxt = (content, x, y, attrs = {}) => {
      const t = document.createElementNS('http://www.w3.org/2000/svg', 'text');
      t.setAttribute('x', x); t.setAttribute('y', y);
      Object.entries(attrs).forEach(([k, v]) => t.setAttribute(k, v));
      t.textContent = content;
      svg.appendChild(t);
    };
    const drawDim = (x1, y1, x2, y2, label, offset, isVert=false) => {
      const cColor = '#00ff00';
      if(isVert) {
        mkEl('line', {x1:x1-4, y1:y1, x2:x1-offset, y2:y1, stroke:'#444', 'stroke-width':1});
        mkEl('line', {x1:x2-4, y1:y2, x2:x2-offset, y2:y2, stroke:'#444', 'stroke-width':1});
        const dx = x1 - offset + 6;
        mkEl('line', {x1:dx, y1:y1, x2:dx, y2:y2, stroke:cColor, 'stroke-width':1});
        mkEl('line', {x1:dx-3, y1:y1-3, x2:dx+3, y2:y1+3, stroke:cColor, 'stroke-width':1.5});
        mkEl('line', {x1:dx-3, y1:y2-3, x2:dx+3, y2:y2+3, stroke:cColor, 'stroke-width':1.5});
        mkTxt(label, dx-4, (y1+y2)/2+3, {'text-anchor':'end','font-size':'9','fill':cColor});
      } else {
        mkEl('line', {x1:x1, y1:y1+4, x2:x1, y2:y1+offset, stroke:'#444', 'stroke-width':1});
        mkEl('line', {x1:x2, y1:y2+4, x2:x2, y2:y2+offset, stroke:'#444', 'stroke-width':1});
        const dy = y1 + offset - 6;
        mkEl('line', {x1:x1, y1:dy, x2:x2, y2:dy, stroke:cColor, 'stroke-width':1});
        mkEl('line', {x1:x1-3, y1:dy-3, x2:x1+3, y2:dy+3, stroke:cColor, 'stroke-width':1.5});
        mkEl('line', {x1:x2-3, y1:dy-3, x2:x2+3, y2:dy+3, stroke:cColor, 'stroke-width':1.5});
        mkTxt(label, (x1+x2)/2, dy-4, {'text-anchor':'middle','font-size':'9','fill':cColor});
      }
    };

    // Concrete section rect (Left Pane: 0 to 200)
    const margin = 35;
    const paneW = 200;
    const aspect = section.b / section.h;
    let b_px, h_px;
    if (aspect >= 1) {
      b_px = paneW - 2 * margin;
      h_px = b_px / aspect;
    } else {
      h_px = svgH - 2 * margin;
      b_px = h_px * aspect;
    }
    b_px = Math.min(b_px, paneW - 2 * margin);
    h_px = Math.min(h_px, svgH - 2 * margin);

    const x0 = (paneW - b_px) / 2;
    const y0 = (svgH - h_px) / 2;

    // Concrete fill (CAD White/Grey)
    mkEl('rect', { x: x0, y: y0, width: b_px, height: h_px,
      fill: 'rgba(255,255,255,0.02)', stroke: '#e6e6e6', 'stroke-width': 1.5 });

    // Dimension labels
    drawDim(x0, y0, x0+b_px, y0, `${(section.b*100).toFixed(0)}`, -20, false);
    drawDim(x0, y0, x0, y0+h_px, `${(section.h*100).toFixed(0)}`, -20, true);

    // Draw bars if rebar data exists
    if (rebar?.faces) {
      const rec = S.materials.rec || 0.03;
      const recPx = (rec / section.h) * h_px;
      
      const infBars = rebar.faces.inferior?.barras || [];
      const supBars = rebar.faces.superior?.barras || [];
      const allBars = Math.max(infBars.reduce((s,b)=>s+b.cantidad,0), supBars.reduce((s,b)=>s+b.cantidad,0));
      const diaL = supBars[0]?.diámetro || 10;
      
      const stColor = '#f0b040'; // CAD Yellow/Gold
      const rColor = '#00ffff';  // CAD Cyan
      
      // Stirrup outline
      const sx0 = x0 + recPx;
      const sy0 = y0 + recPx;
      const sw = b_px - 2*recPx;
      const sh = h_px - 2*recPx;
      mkEl('rect', { x: sx0, y: sy0, width: sw, height: sh,
        fill:'none', stroke:stColor, 'stroke-width':1.5, rx:3 });
      
      // 135° Hooks (Top left corner)
      const hkL = Math.min(sw, sh) * 0.25;
      const hkD = hkL * 0.707;
      mkEl('line',{x1:sx0, y1:sy0, x2:sx0+hkD, y2:sy0+hkD, stroke:stColor,'stroke-width':1.5,'stroke-linecap':'round'});
      mkEl('line',{x1:sx0+sw, y1:sy0, x2:sx0+sw-hkD, y2:sy0+hkD, stroke:stColor,'stroke-width':1.5,'stroke-linecap':'round'});

      // Draw Longitudinal Bars
      const drawRow = (n, dia, cy) => {
        if(n === 0) return;
        const spacing = n > 1 ? sw / (n - 1) : 0;
        const rPx = Math.max(3, (dia / 20) * (recPx / 3)); // scale radius visually
        for (let j = 0; j < n; j++) {
          const cx = n > 1 ? sx0 + spacing * j : sx0 + sw/2;
          mkEl('circle', { cx, cy, r: rPx, fill: rColor });
        }
      };
      
      drawRow(supBars.reduce((s,b)=>s+b.cantidad,0), diaL, sy0);
      drawRow(infBars.reduce((s,b)=>s+b.cantidad,0), diaL, sy0 + sh);

      // Draw intermediate skin reinforcement (piel) if it exists
      const pielBars = rebar.faces.piel?.barras || [];
      const nPiel = pielBars.reduce((s,b)=>s+b.cantidad,0);
      const diaPiel = pielBars[0]?.diámetro || 8;
      const hasPiel = nPiel > 0;
      if (hasPiel) {
        const rPx = Math.max(3, (diaPiel / 20) * (recPx / 3)); // scale radius visually
        mkEl('circle', { cx: sx0, cy: sy0 + sh / 2, r: rPx, fill: rColor });
        mkEl('circle', { cx: sx0 + sw, cy: sy0 + sh / 2, r: rPx, fill: rColor });
      }

      // --- Right Pane: Isolated Stirrup Detail ---
      const p2X = 220; // start of right pane
      const stDia = rebar.estribos?.diámetro || 8;
      const s_spacing = Math.round((rebar.estribos?.espaciamiento || 0.15)*100);
      
      // scale isolated stirrup to fit well in right pane
      let isoScale = 80 / Math.max(section.b - 2*rec, section.h - 2*rec);
      let iW = (section.b - 2*rec) * isoScale;
      let iH = (section.h - 2*rec) * isoScale;
      
      const iX = p2X + (100 - iW)/2;
      const iY = y0 + (h_px - iH)/2;
      
      // Draw isolated stirrup
      mkEl('rect', { x: iX, y: iY, width: iW, height: iH, fill:'none', stroke:stColor, 'stroke-width':1.5, rx:3 });
      
      // Hooks inside
      const ihk = Math.min(iW, iH)*0.25;
      mkEl('line',{x1:iX, y1:iY, x2:iX+ihk*0.707, y2:iY+ihk*0.707, stroke:stColor,'stroke-width':1.5,'stroke-linecap':'round'});
      mkEl('line',{x1:iX+iW, y1:iY, x2:iX+iW-ihk*0.707, y2:iY+ihk*0.707, stroke:stColor,'stroke-width':1.5,'stroke-linecap':'round'});
      
      // Stirrup Dimensions
      const dw_cm = Math.round((section.b - 2*rec)*100);
      const dh_cm = Math.round((section.h - 2*rec)*100);
      mkTxt(`${dw_cm}`, iX+iW/2, iY - 6, {'text-anchor':'middle','font-size':'9','fill':'#888'});
      mkTxt(`${dw_cm}`, iX+iW/2, iY+iH + 12, {'text-anchor':'middle','font-size':'9','fill':'#888'});
      mkTxt(`${dh_cm}`, iX - 6, iY+iH/2 + 3, {'text-anchor':'end','font-size':'9','fill':'#888'});
      mkTxt(`${dh_cm}`, iX+iW + 6, iY+iH/2 + 3, {'text-anchor':'start','font-size':'9','fill':'#888'});
      mkTxt(`8`, iX+iW - 4, iY+16, {'text-anchor':'end','font-size':'8','fill':'#888'});
      mkTxt(`7`, iX+8, iY+16, {'text-anchor':'start','font-size':'8','fill':'#888'});
      
      // Calculate LT (Longitud Total)
      // LT = 2*(dw + dh) + 2*10db
      const LT = Math.round(2*(dw_cm + dh_cm) + 2*(10 * stDia/10));
      
      mkTxt(`E ø${stDia}@${s_spacing}`, p2X + 50, iY + iH + 30, {'text-anchor':'middle','font-size':'10','fill':stColor,'font-weight':'bold'});
      mkEl('line', {x1:p2X+10, y1:iY+iH+34, x2:p2X+90, y2:iY+iH+34, stroke:'#444', 'stroke-width':1});
      mkTxt(`LT = ${LT}`, p2X + 50, iY + iH + 46, {'text-anchor':'middle','font-size':'10','fill':'#fff'});
      
      // Section labels
      let lblText = `${allBars}ø${diaL}`;
      if (hasPiel) {
        lblText = `${supBars.reduce((s,b)=>s+b.cantidad,0)}ø${diaL} Sup + ${nPiel}ø${diaPiel} Piel + ${infBars.reduce((s,b)=>s+b.cantidad,0)}ø${diaL} Inf`;
      }
      mkTxt(lblText, x0+b_px/2, y0+h_px+25, {'text-anchor':'middle','font-size':'9','fill':rColor,'font-weight':'bold'});
    } else {
      mkTxt('Sin armadura colocada', svgW/2, svgH/2, {'text-anchor':'middle','font-size':'10','fill':'rgba(255,255,255,0.25)'});
    }

    container.appendChild(svg);

    // Summary table
    if (rebar?.faces && validation) {
      const div = document.createElement('div');
      div.style.cssText = 'margin-top:0.5rem;font-size:0.8rem;';
      const asInf = (rebar.faces.inferior?.AsTotal || 0).toFixed(2);
      const asSup = (rebar.faces.superior?.AsTotal || 0).toFixed(2);
      const pielBars = rebar.faces.piel?.barras || [];
      const hasPiel = pielBars.length > 0;
      const asPiel = hasPiel ? (rebar.faces.piel?.AsTotal || 0).toFixed(2) : '0.00';
      
      div.innerHTML = `
        <div style="display:grid;grid-template-columns:${hasPiel ? '1fr 1fr 1fr' : '1fr 1fr'};gap:0.4rem;margin-bottom:0.4rem;">
          <div style="background:var(--bg-card);border:1px solid var(--border-light);border-radius:4px;padding:0.4rem;">
            <div style="font-size:0.68rem;color:var(--text-muted)">As Superior</div>
            <div style="font-weight:600">${asSup} cm²</div>
          </div>
          ${hasPiel ? `
          <div style="background:var(--bg-card);border:1px solid var(--border-light);border-radius:4px;padding:0.4rem;">
            <div style="font-size:0.68rem;color:var(--text-muted)">As Piel</div>
            <div style="font-weight:600">${asPiel} cm²</div>
          </div>
          ` : ''}
          <div style="background:var(--bg-card);border:1px solid var(--border-light);border-radius:4px;padding:0.4rem;">
            <div style="font-size:0.68rem;color:var(--text-muted)">As Inferior</div>
            <div style="font-weight:600">${asInf} cm²</div>
          </div>
        </div>
        <div style="background:var(--bg-card);border:1px solid var(--border-light);border-radius:4px;padding:0.4rem;display:flex;justify-content:space-between;align-items:center;">
          <span style="color:var(--text-muted);font-size:0.75rem;">Estado Bending:</span>
          <span style="color:${validation.color};font-weight:600;font-size:0.8rem;">${validation.status}</span>
        </div>
      `;
      container.appendChild(div);
    }
  }
};
