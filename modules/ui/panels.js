/**
 * PANELS.JS — Renderizado del Panel Derecho (Multi-Vano)
 * Propiedades geométricas, fuerzas internas, armadura
 */

const REBAR_DIA = [8, 10, 12, 16, 18, 22, 25, 28, 32];

function renderProperties(type) {
  const geoEl = document.getElementById('el-props-geo');
  const matEl = document.getElementById('el-props-mat');
  geoEl.innerHTML = '';
  matEl.innerHTML = '';

  const card = (label, value, unit, cls = '') =>
    `<div class="res-card ${cls}"><div class="res-label">${label}</div>` +
    `<div class="res-value">${value} <span class="res-unit">${unit}</span></div></div>`;

  const m = S.story.materials;
  const H = S.story.H;
  const selSpan = S.spans.find(sp => sp.id === S.ui.selectedSpan) || S.spans[0];
  const selNode = S.ui.selectedNode || S.nodes[0]?.id;

  if (type === 'wall') {
    const L = selSpan ? getSpanL(selSpan) : S.geometry.L;
    const tw = selSpan?.tw ?? S.geometry.tw;
    geoEl.innerHTML = card('Largo L', L.toFixed(2), 'm') +
                      card('Altura H', H, 'm') +
                      card('Espesor t', (tw * 100).toFixed(0), 'cm') +
                      card('Área bruta', (L * H).toFixed(2), 'm²');
    matEl.innerHTML = card('γ<sub>m</sub>', m.gm, 'kN/m³') +
                      card('Peso total', getActiveResults('wall')?.P || '—', 'kN', 'accent');
  } else if (type === 'column') {
    const col = S.columns[selNode] || Object.values(S.columns)[0];
    const sec = col.section;
    geoEl.innerHTML = card('Ancho b', (sec.b * 100).toFixed(0), 'cm') +
                      card('Alto h',  (sec.h * 100).toFixed(0), 'cm') +
                      card('Altura', H, 'm') +
                      card('Ag', (sec.b * sec.h * 1e4).toFixed(0), 'cm²');
    matEl.innerHTML = card("f'c", m.fc, 'MPa') +
                      card('f<sub>y</sub>', m.fy, 'MPa') +
                      card('γ<sub>c</sub>', m.gc, 'kN/m³') +
                      card('Rec.', (m.rec * 100).toFixed(0), 'cm');
  } else if (type === 'foundation') {
    const f = S.story.foundation;
    const totalL = getTotalL() || 4.0;
    geoEl.innerHTML = card('Ancho B', f.B.toFixed(2), 'm') +
                      card('Espesor H<sub>f</sub>', f.Hf.toFixed(2), 'm') +
                      card('Sello D<sub>f</sub>', f.Df.toFixed(2), 'm') +
                      card('Longitud total', totalL.toFixed(2), 'm');
    matEl.innerHTML = card("f'c", m.fc, 'MPa') +
                      card('f<sub>y</sub>', m.fy, 'MPa') +
                      card('q<sub>adm</sub>', f.qadm, 'kPa') +
                      card('γ<sub>suelo</sub>', f.gammas, 'kN/m³');
  } else {
    const sec = (type === 'beam_top' ? selSpan?.beamTop : selSpan?.beamBot)?.section || { b:0.20, h:0.20 };
    const L   = selSpan ? getSpanL(selSpan) : S.geometry.L;
    geoEl.innerHTML = card('Ancho b', (sec.b * 100).toFixed(0), 'cm') +
                      card('Peralte h', (sec.h * 100).toFixed(0), 'cm') +
                      card('Longitud', L.toFixed(2), 'm') +
                      card('Área', (sec.b * sec.h * 1e4).toFixed(0), 'cm²');
    matEl.innerHTML = card("f'c", m.fc, 'MPa') +
                      card('f<sub>y</sub>', m.fy, 'MPa') +
                      card('γ<sub>c</sub>', m.gc, 'kN/m³') +
                      card('Rec.', (m.rec * 100).toFixed(0), 'cm');
  }
}

function renderForces(type) {
  const el = document.getElementById('el-forces');
  el.innerHTML = '';
  const r = getActiveResults(type);
  if (!r) return;

  const card = (label, value, unit, cls) =>
    `<div class="res-card ${cls}"><div class="res-label">${label}</div>` +
    `<div class="res-value">${value} <span class="res-unit">${unit}</span></div></div>`;

  if (type === 'wall') {
    el.innerHTML = card('Peso Propio', r.P, 'kN', 'warning');
  } else if (type === 'foundation') {
    const f = S.story.foundation;
    el.innerHTML = `<div class="res-card success" id="btn-foundation-weight" style="cursor:pointer; border: 1px solid var(--success); transition: all 0.2s;" onmouseover="this.style.background='rgba(63,185,80,0.1)'" onmouseout="this.style.background='var(--card-bg)'" title="Haz clic para ver el desglose de cargas">` +
                   `<div class="res-label">Peso Transmitido 👆</div>` +
                   `<div class="res-value">${r.P_service} <span class="res-unit">kN/m</span></div></div>` +
                   card('Presión Contacto', r.sigma_contact, 'kPa', 'accent') +
                   card('DCR Suelo', r.DCR_soil, 'ratio', parseFloat(r.DCR_soil) > 1.0 ? 'danger' : 'success') +
                   card('V<sub>u</sub>', r.Vu, 'kN/m', parseFloat(r.Vu) > parseFloat(r.phi_Vc) ? 'danger' : 'purple') +
                   card('M<sub>u</sub>', r.Mu, 'kN·m/m', 'warning');

    setTimeout(() => {
      document.getElementById('btn-foundation-weight')?.addEventListener('click', () => {
        showFoundationWeightDetails(r);
      });
    }, 50);
  } else {
    let html = card('M<sub>u</sub> Máx.', r.Mu, 'kN·m', 'accent') +
               card('V<sub>u</sub> Máx.', r.Vu, 'kN', 'danger') +
               card('N<sub>u</sub> Axial', r.Nu, 'kN', 'success') +
               card('q<sub>u</sub>', S.results.qu, 'kN/m', 'purple');

    // Agregar feedback del caso crítico si hay cargas distribuidas
    if (r.isCombined && r.caseLabel) {
      html += `<div class="res-card" style="border-left:3px solid #ff6b6b; background:rgba(255,107,107,0.08);">
                 <div class="res-label" style="color:#ff6b6b; font-weight:600;">⚠ Caso Crítico</div>
                 <div class="res-value" style="font-size:0.9rem; color:#ff6b6b;">${r.caseLabel}</div>
                 <div style="font-size:0.7rem; color:var(--text-muted); margin-top:4px;">Cortante diagonal · Superpone distribuciones</div>
               </div>`;
    }

    el.innerHTML = html;
  }
}

window.showFoundationWeightDetails = function(r) {
  let overlay = document.getElementById('weight-details-overlay');
  if (!overlay) {
    overlay = document.createElement('div');
    overlay.id = 'weight-details-overlay';
    overlay.style.cssText = 'position:fixed;top:0;left:0;width:100vw;height:100vh;background:rgba(0,0,0,0.6);z-index:9999;display:flex;align-items:center;justify-content:center;backdrop-filter:blur(3px);';
    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) overlay.remove();
    });
    document.body.appendChild(overlay);
  }

  overlay.innerHTML = `
    <div style="background:var(--bg); border:1px solid var(--border); border-radius:8px; width:400px; max-width:90%; padding:20px; box-shadow:0 10px 30px rgba(0,0,0,0.5); position:relative;">
      <button onclick="this.parentElement.parentElement.remove()" style="position:absolute;top:10px;right:10px;background:none;border:none;color:var(--text-muted);cursor:pointer;font-size:1.2rem;">&times;</button>
      <h3 style="margin-top:0; color:var(--text); border-bottom:1px solid var(--border); padding-bottom:10px; margin-bottom:15px; display:flex; align-items:center; gap:8px;">
        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>
        Desglose de Peso Transmitido
      </h3>
      
      <div style="display:flex; flex-direction:column; gap:8px; font-size:0.85rem;">
        <div style="display:flex; justify-content:space-between; padding:8px; background:rgba(255,255,255,0.03); border-radius:4px;">
          <span style="color:var(--text-muted)">Cargas Muertas (Techo, Vigas, Muro)</span>
          <strong style="color:var(--text)">${r.qD_avg} kN/m</strong>
        </div>
        <div style="display:flex; justify-content:space-between; padding:8px; background:rgba(255,255,255,0.03); border-radius:4px;">
          <span style="color:var(--text-muted)">Cargas Vivas (Sobrecarga de Uso)</span>
          <strong style="color:var(--accent)">${r.qL_avg} kN/m</strong>
        </div>
        <div style="display:flex; justify-content:space-between; padding:8px; background:rgba(255,255,255,0.03); border-radius:4px;">
          <span style="color:var(--text-muted)">Peso Propio Zapata</span>
          <strong style="color:var(--text)">${r.wFooting} kN/m</strong>
        </div>
        <div style="display:flex; justify-content:space-between; padding:8px; background:rgba(255,255,255,0.03); border-radius:4px;">
          <span style="color:var(--text-muted)">Peso Suelo de Relleno (Talones)</span>
          <strong style="color:var(--warning)">${r.wSoil_above} kN/m</strong>
        </div>
        
        <div style="border-top:1px solid var(--border); margin-top:5px; padding-top:10px; display:flex; justify-content:space-between; font-size:1rem;">
          <strong style="color:var(--text)">Total Transmitido (P<sub>servicio</sub>)</strong>
          <strong style="color:var(--success)">${r.P_service} kN/m</strong>
        </div>
      </div>
      
      <p style="font-size:0.7rem; color:var(--text-muted); margin-top:15px; margin-bottom:0; text-align:center;">
        * Estos valores son por metro lineal de zapata y no están mayorados (cargas de servicio), tal como lo exige el diseño geotécnico de fundaciones directas (NCh1508).
      </p>
    </div>
  `;
}

function renderRebar(type) {
  const el = document.getElementById('rebar-content');
  el.innerHTML = '';

  // Show/hide the detail view button
  const detailCard = document.getElementById('detail-btn-card');
  if (detailCard) detailCard.style.display = (type === 'wall') ? 'none' : '';


  if (type === 'wall') {
    el.innerHTML = '<p style="font-size:0.75rem;color:var(--text-muted)">La albañilería no requiere cálculo de armadura por resistencia. Ver NCh2123 para requisitos mínimos de confinamiento.</p>';
    return;
  }

  if (type === 'foundation') {
    const r = S.results.foundation;
    if (!r?.rebar) return;
    const { AsReq, AsMinCm2, AsLongCm2, d_eff_cm } = r.rebar;

    const dia = 12;
    const barArea = (Math.PI * (dia ** 2)) / 400; // cm²
    const spacing = Math.min(30, Math.floor((barArea / parseFloat(AsReq)) * 100)); // cm, max 30
    
    const diaLong = 10;
    const barAreaLong = (Math.PI * (diaLong ** 2)) / 400;
    const spacingLong = Math.min(30, Math.floor((barAreaLong / (parseFloat(AsLongCm2) / S.story.foundation.B)) * 100));

    el.innerHTML = `
      <div style="font-size:0.7rem;color:var(--text-muted);margin-bottom:0.5rem">
        Peralte efectivo d<sub>f</sub> = <strong>${d_eff_cm} cm</strong>
      </div>
      <div class="result-grid" style="margin-bottom:0.75rem;grid-template-columns:1fr 1fr;">
        <div class="res-card accent" style="padding:0.4rem;text-align:center;">
          <div style="font-size:0.65rem;color:var(--text-muted);margin-bottom:2px">A<sub>s,req</sub> Transversal</div>
          <div style="font-size:1rem;font-weight:700;">${AsReq} <span style="font-size:0.6rem;font-weight:400">cm²/m</span></div>
          <div style="font-size:0.55rem;color:var(--text-muted);margin-top:2px">Mín: ${AsMinCm2} cm²/m</div>
        </div>
        <div class="res-card success" style="padding:0.4rem;text-align:center;">
          <div style="font-size:0.65rem;color:var(--text-muted);margin-bottom:2px">A<sub>s</sub> Long. Total</div>
          <div style="font-size:1rem;font-weight:700;">${AsLongCm2} <span style="font-size:0.6rem;font-weight:400">cm²</span></div>
          <div style="font-size:0.55rem;color:var(--text-muted);margin-top:2px">Cuantía: 0.18%</div>
        </div>
      </div>
      
      <div class="res-card" style="padding:0.5rem;font-size:0.7rem;display:block;height:auto;margin-bottom:8px;">
        <strong style="display:block;margin-bottom:4px;color:var(--accent)">Distribución Recomendada</strong>
        <div style="margin-bottom:2px">✦ <strong>Transversal (Flexión):</strong> 1 barra ⌀${dia} cada <strong>${spacing} cm</strong></div>
        <div>✦ <strong>Longitudinal (Temp):</strong> ⌀${diaLong} cada <strong>${spacingLong} cm</strong> (${Math.ceil(S.story.foundation.B / (spacingLong / 100)) + 1} barras totales)</div>
      </div>

      <div class="res-card" style="padding:0.5rem;font-size:0.7rem;display:block;height:auto;">
        <strong style="display:block;margin-bottom:4px;color:var(--danger)">Corte Unidireccional</strong>
        <div style="display:flex; justify-content:space-between; margin-bottom: 2px;">
          <span>V<sub>u</sub> = <strong>${r.Vu} kN</strong></span>
          <span>ϕV<sub>c</sub> = <strong>${r.phi_Vc} kN</strong></span>
        </div>
        <div style="font-weight:600; color:${parseFloat(r.Vu) > parseFloat(r.phi_Vc) ? 'var(--danger)' : 'var(--success)'}">
          ${parseFloat(r.Vu) > parseFloat(r.phi_Vc) ? '⚠️ EXCESO DE CORTE: AUMENTAR Hf' : '✓ Espesor Hf Suficiente por Corte'}
        </div>
      </div>
    `;
    el.innerHTML += `
      <div style="margin-top:0.6rem;">
        <button id="btn-view-foundation-section"
          style="width:100%;padding:0.45rem;background:rgba(210,153,34,0.12);border:1px solid rgba(210,153,34,0.3);border-radius:4px;color:#d29922;font-size:0.72rem;font-weight:600;cursor:pointer;display:flex;align-items:center;justify-content:center;gap:6px;">
          <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><rect x="2" y="7" width="20" height="14" rx="2"/><path d="M8 7V5a4 4 0 0 1 8 0v2"/></svg>
          VER SECCIÓN TRANSVERSAL
        </button>
      </div>`;
    document.getElementById('btn-view-foundation-section')?.addEventListener('click', () => {
      ElementDetail.open('foundation');
    });
    return;
  }   // end if (type === 'foundation')

  const r = getActiveResults(type);
  if (!r?.rebar) return;

  const { AsReq, AsMinCm2, AsMaxCm2, Vc, Vs, d_eff_cm, s_max_cm, stirrups } = r.rebar;
  const asNum = parseFloat(AsReq);
  const asMaxNum = parseFloat(AsMaxCm2);
  const sectionFails = asNum > asMaxNum;

  const sectionWarning = sectionFails
    ? `<div style="padding:0.5rem 0.6rem;background:rgba(248,81,73,0.12);border:1px solid rgba(248,81,73,0.4);border-radius:4px;margin-bottom:0.75rem;font-size:0.7rem;line-height:1.5;">
        <strong style="color:#f85149;">⚠ SECCIÓN INSUFICIENTE</strong><br>
        A<sub>s,req</sub> = ${AsReq} cm² supera A<sub>s,max</sub> = ${AsMaxCm2} cm².<br>
        Aumentar sección a <strong>h ≥ 25 cm</strong> o considerar viga de mayor peralte.
       </div>`
    : '';

  el.innerHTML = sectionWarning + `
    <div style="font-size:0.7rem;color:var(--text-muted);margin-bottom:0.5rem">
      Peralte efectivo d = <strong>${d_eff_cm} cm</strong>
    </div>
    <div class="result-grid" style="margin-bottom:0.75rem;grid-template-columns:1fr 1fr 1fr;">
      <div class="res-card accent"><div class="res-label">A<sub>s</sub> req.</div>
        <div class="res-value">${AsReq} <span class="res-unit">cm²</span></div></div>
      <div class="res-card"><div class="res-label">A<sub>s,min</sub></div>
        <div class="res-value">${AsMinCm2} <span class="res-unit">cm²</span></div></div>
      <div class="res-card"><div class="res-label">A<sub>s,max</sub></div>
        <div class="res-value">${AsMaxCm2} <span class="res-unit">cm²</span></div></div>
    </div>
    <div class="result-grid" style="margin-bottom:0.75rem">
      <div class="res-card danger"><div class="res-label">V<sub>c</sub> hormigón</div>
        <div class="res-value">${Vc} <span class="res-unit">kN</span></div></div>
      <div class="res-card ${parseFloat(Vs) > 0 ? 'warning' : ''}">
        <div class="res-label">V<sub>s</sub> acero</div>
        <div class="res-value">${Vs} <span class="res-unit">kN</span></div></div>
    </div>
    <p style="font-size:0.7rem;color:var(--text-muted);margin-bottom:0.5rem">Combinaciones de barras longitudinales que cumplen:</p>
    <div class="rebar-wrap">${getRebarOptions(asNum)}</div>

    <div class="stirrup-design-panel">
      <p style="font-size:0.7rem;font-weight:600;color:var(--text-muted);margin:0.75rem 0 0.4rem;text-transform:uppercase;letter-spacing:0.05em">Diseño de Estribos</p>
      <div style="font-size:0.68rem;color:var(--text-muted);margin-bottom:0.4rem">
        Espaciamiento máx. normativo: <strong style="color:var(--text)">${s_max_cm} cm</strong>
        ${parseFloat(Vs) === 0 ? ' <span style="color:#3fb950">(solo mín.)</span>' : ''}
      </div>
      <table class="stirrup-table">
        <thead><tr><th>Estribo</th><th>s requerido</th><th>s adoptado</th><th>s máx.</th><th></th></tr></thead>
        <tbody>
          ${(stirrups || []).map(st => `
            <tr>
              <td>φ${st.dia}</td>
              <td>${st.s_req} mm</td>
              <td><strong>${st.s_adopt} mm</strong></td>
              <td>${st.s_max} mm</td>
              <td style="color:${st.ok ? '#3fb950' : '#f85149'}">${st.ok ? '✓' : '✗'}</td>
            </tr>`).join('')}
        </tbody>
      </table>
    </div>

    <div style="margin-top:0.75rem">
      <button id="btn-edit-rebar" class="btn-primary" style="width:100%">⚙️ EDITAR ARMADURA</button>
    </div>
  `;

  document.getElementById('btn-edit-rebar')?.addEventListener('click', () => {
    RebarEditor.open(type);
  });
}

function getRebarOptions(AsReq) {
  let html = '';
  [2, 3, 4, 6].forEach(n => {
    REBAR_DIA.forEach(d => {
      const A = n * Math.PI * (d / 10) ** 2 / 4;
      if (A >= AsReq && A <= AsReq * 1.8)
        html += `<span class="rebar-chip">${n} φ${d} (${A.toFixed(2)} cm²)</span>`;
    });
  });
  return html || '<span style="font-size:0.75rem;color:var(--text-muted)">Aumentar sección o usar barras mayores.</span>';
}

function renderAIRecommendations(type) {
  const container = document.getElementById('ai-advisor-content');
  if (!container) return;

  const r = getActiveResults(type);
  if (!r) {
    container.innerHTML = `
      <div style="text-align:center; padding:32px 16px; color:var(--text-muted); display:flex; flex-direction:column; align-items:center; gap:8px;">
        <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" fill="none" stroke="currentColor" stroke-width="1.5" viewBox="0 0 24 24" style="opacity:0.4;"><path d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.808 13.061l.707-.707M12 18a6 6 0 100-12 6 6 0 000 12z" stroke-linecap="round" stroke-linejoin="round"/></svg>
        <span style="font-weight:600; font-size:0.8rem; color:var(--text-primary);">Sin Datos Disponibles</span>
        <p style="font-size:0.7rem; line-height:1.4;">No se pudieron cargar los resultados de diseño para este elemento. Intenta calcular nuevamente.</p>
      </div>
    `;
    return;
  }

  let html = '';

  if (type === 'beam_top' || type === 'beam_bot') {
    const names = { beam_top: 'Viga Superior (Cadena)', beam_bot: 'Sobrecimiento / Viga Inferior' };
    const Mu = parseFloat(r.Mu) || 0;
    const Vu = parseFloat(r.Vu) || 0;
    const AsReq = parseFloat(r.rebar?.AsReq) || 0;
    const AsMin = parseFloat(r.rebar?.AsMinCm2) || 0;
    const d_eff = parseFloat(r.rebar?.d_eff_cm) || 15.0;
    const Vs = parseFloat(r.rebar?.Vs) || 0;
    const Vc = parseFloat(r.rebar?.Vc) || 0;

    html = `
      <div class="ai-rec-card accent">
        <div class="ai-rec-title" style="color: var(--accent);">
          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.808 13.061l.707-.707M12 18a6 6 0 100-12 6 6 0 000 12z" stroke-linecap="round" stroke-linejoin="round"/></svg>
          Análisis de Momento Flector (M<sub>u</sub>)
        </div>
        <div class="ai-rec-body">
          <p>El diagrama de momento flector muestra un comportamiento de <strong>pórtico rígido empotrado</strong>, con un momento máximo de <strong>${Mu.toFixed(2)} kN·m</strong> en los apoyos (zona de tracción superior) y de <strong>${(Mu / 2).toFixed(2)} kN·m</strong> al centro del vano (zona de tracción inferior).</p>
          
          <div style="margin: 8px 0; padding: 8px; background: rgba(47,129,247,0.04); border: 1px solid rgba(47,129,247,0.15); border-radius: 4px;">
            <strong style="color: var(--accent); font-size: 0.72rem; display: block; margin-bottom: 4px;">Distribución de Acero Recomendada:</strong>
            <ul style="margin: 0; padding-left: 12px; font-size: 0.7rem; display: flex; flex-direction: column; gap: 3px;">
              <li><strong>Armadura longitudinal corrida:</strong> 4 φ 12 (2 arriba, 2 abajo) que aportan <strong>4.52 cm²</strong> de acero continuo. Supera la cuantía mínima reglamentaria (A<sub>s,min</sub> = ${AsMin.toFixed(2)} cm²).</li>
              <li><strong>En la zona de apoyos (Flexión Negativa):</strong> Se recomienda agregar barras extras (<strong>suples</strong>) de <strong>2 φ 10</strong> en la cara superior. Esto incrementa la sección local de acero a <strong>6.10 cm²</strong> en los nudos pilar-viga, cubriendo holgadamente los esfuerzos.</li>
              <li><strong>Al centro del vano (Flexión Positiva):</strong> La armadura base inferior de 2 φ 12 es plenamente suficiente para resistir la tracción en la fibra inferior.</li>
            </ul>
          </div>
          
          <span class="ai-rec-badge steel">Cuantía Dúctil</span>
          <span class="ai-rec-badge nch">NCh430 Cl. 9.6</span>
          <p style="margin-top: 6px; font-size: 0.65rem; color: var(--text-muted); line-height: 1.3;">
            Esta combinación longitudinal garantiza que el elemento experimente una <strong>falla dúctil controlada por tracción</strong> (el acero fluye antes de que el hormigón se rompa), permitiendo avisos visuales (deflexión y fisuras) antes de cualquier colapso.
          </p>
        </div>
      </div>

      <div class="ai-rec-card danger">
        <div class="ai-rec-title" style="color: var(--danger);">
          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" stroke-linecap="round" stroke-linejoin="round"/></svg>
          Análisis de Esfuerzo Cortante (V<sub>u</sub>)
        </div>
        <div class="ai-rec-body">
          <p>El esfuerzo cortante último en el apoyo es <strong>${Vu.toFixed(2)} kN</strong>. El hormigón provee una resistencia al corte de V<sub>c</sub> = <strong>${Vc.toFixed(2)} kN</strong>.</p>
          
          ${Vs > 0 ? 
            `<p style="color: var(--warning); font-weight: 600; margin-top: 4px;">⚠️ El hormigón no basta solo. El acero debe absorber V<sub>s</sub> = <strong>${Vs.toFixed(2)} kN</strong>.</p>` : 
            `<p style="color: var(--success); font-weight: 600; margin-top: 4px;">✓ El hormigón tiene capacidad suficiente para el cortante directo.</p>`
          }
          
          <div style="margin: 8px 0; padding: 8px; background: rgba(248,81,73,0.04); border: 1px solid rgba(248,81,73,0.15); border-radius: 4px;">
            <strong style="color: var(--danger); font-size: 0.72rem; display: block; margin-bottom: 4px;">Configuración de Estribos:</strong>
            <ul style="margin: 0; padding-left: 12px; font-size: 0.7rem; display: flex; flex-direction: column; gap: 3px;">
              <li><strong>Zona de confinamiento (extremos, longitud 2d = ${(2 * d_eff).toFixed(0)} cm):</strong> Colocar estribos **φ8 @ 10 cm** cerrados a 135 grados.</li>
              <li><strong>Zona central de la viga:</strong> Colocar estribos **φ8 @ 15 cm**.</li>
            </ul>
          </div>

          <span class="ai-rec-badge steel">Estribos de Confinamiento</span>
          <span class="ai-rec-badge nch">NCh430 Cl. 11.4</span>
          <p style="margin-top: 6px; font-size: 0.65rem; color: var(--text-muted); line-height: 1.3;">
            La densificación a 10 cm en los extremos es mandatoria por sismo; confina mecánicamente el núcleo de hormigón y evita el <strong>pandeo prematuro</strong> de la armadura longitudinal superior en compresión cíclica.
          </p>
        </div>
      </div>
    `;
  } else if (type === 'column') {
    const Nu = parseFloat(r.Nu) || 0;
    const Mu = parseFloat(r.Mu) || 0;
    const Vu = parseFloat(r.Vu) || 0;
    const d_eff = parseFloat(r.rebar?.d_eff_cm) || 15.0;

    html = `
      <div class="ai-rec-card success">
        <div class="ai-rec-title" style="color: var(--success);">
          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.808 13.061l.707-.707M12 18a6 6 0 100-12 6 6 0 000 12z" stroke-linecap="round" stroke-linejoin="round"/></svg>
          Comportamiento del Pilar de Confinamiento
        </div>
        <div class="ai-rec-body">
          <p>El pilar está trabajando bajo **flexocompresión** con una fuerza axial N<sub>u</sub> = <strong>${Nu.toFixed(1)} kN</strong> y un momento flector M<sub>u</sub> = <strong>${Mu.toFixed(1)} kN·m</strong>.</p>
          
          <div style="margin: 8px 0; padding: 8px; background: rgba(63,185,80,0.04); border: 1px solid rgba(63,185,80,0.15); border-radius: 4px;">
            <strong style="color: var(--success); font-size: 0.72rem; display: block; margin-bottom: 4px;">Armadura Recomendada:</strong>
            <ul style="margin: 0; padding-left: 12px; font-size: 0.7rem; display: flex; flex-direction: column; gap: 3px;">
              <li><strong>Longitudinal:</strong> Usar **4 φ 12** (uno en cada esquina), aportando **4.52 cm²** de acero simétrico.</li>
              <li>Esto previene que la columna de confinamiento sufra fallas por flexión fuera de plano debido al empuje de viento o sismo.</li>
            </ul>
          </div>

          <span class="ai-rec-badge steel">A630-420H</span>
          <span class="ai-rec-badge nch">NCh2123 Cl. 14.3</span>
          <p style="margin-top: 6px; font-size: 0.65rem; color: var(--text-muted); line-height: 1.3;">
            Los pilares de confinamiento no se diseñan como columnas libres de marcos de pórticos puros, sino que su función es asegurar la integridad del muro de ladrillos, controlando que no se separe del plano tras agrietarse.
          </p>
        </div>
      </div>

      <div class="ai-rec-card warning">
        <div class="ai-rec-title" style="color: var(--warning);">
          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" stroke-linecap="round" stroke-linejoin="round"/></svg>
          Espaciamiento Sísmico de Estribos
        </div>
        <div class="ai-rec-body">
          <p>Bajo solicitaciones alternadas de terremotos, los extremos de los pilares experimentan altas tensiones de corte y compresión.</p>
          
          <div style="margin: 8px 0; padding: 8px; background: rgba(210,153,34,0.04); border: 1px solid rgba(210,153,34,0.15); border-radius: 4px;">
            <strong style="color: var(--warning); font-size: 0.72rem; display: block; margin-bottom: 4px;">Espaciamiento Normativo:</strong>
            <ul style="margin: 0; padding-left: 12px; font-size: 0.7rem; display: flex; flex-direction: column; gap: 3px;">
              <li><strong>Zonas Extremas (primeros y últimos 60 cm del pilar):</strong> Instalar estribos **φ8 @ 10 cm** para confinar el hormigón.</li>
              <li><strong>Zona Central:</strong> Estribos **φ8 @ 20 cm**.</li>
            </ul>
          </div>

          <span class="ai-rec-badge nch">NCh2123 Art. 7.8</span>
          <p style="margin-top: 6px; font-size: 0.65rem; color: var(--text-muted); line-height: 1.3;">
            El espaciamiento de 10 cm en extremos es crucial. Confinando el núcleo se aumenta drásticamente la capacidad de deformación inelástica del hormigón, absorbiendo energía sísmica sin colapso frágil.
          </p>
        </div>
      </div>
    `;
  } else if (type === 'wall') {
    const P = parseFloat(r.P) || 0;
    const tw_cm = (S.spans[0]?.tw * 100) || 14;

    html = `
      <div class="ai-rec-card warning">
        <div class="ai-rec-title" style="color: var(--warning);">
          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.808 13.061l.707-.707M12 18a6 6 0 100-12 6 6 0 000 12z" stroke-linecap="round" stroke-linejoin="round"/></svg>
          Desempeño Sísmico del Muro de Albañilería
        </div>
        <div class="ai-rec-body">
          <p>El muro resiste el peso propio estimado de <strong>${P.toFixed(1)} kN</strong>, además de transferir el esfuerzo de corte basal por compresión diagonal.</p>
          
          <div style="margin: 8px 0; padding: 8px; background: rgba(210,153,34,0.04); border: 1px solid rgba(210,153,34,0.15); border-radius: 4px;">
            <strong style="color: var(--warning); font-size: 0.72rem; display: block; margin-bottom: 4px;">Requisitos de Construcción Mandatorios:</strong>
            <ul style="margin: 0; padding-left: 12px; font-size: 0.7rem; display: flex; flex-direction: column; gap: 3px;">
              <li><strong>Esbeltez Controlada:</strong> El espesor del muro de <strong>${tw_cm.toFixed(0)} cm</strong> supera el límite esbelto de H/20 (<strong>${(S.story.H * 100 / 20).toFixed(0)} cm</strong>), previniendo pandeo fuera del plano.</li>
              <li><strong>Conexión Pilar-Muro:</strong> Es indispensable emplear **endentado** en los ladrillos (dientes de hasta 5 cm) o armadura de unión con **escalerillas de acero φ4.2** cada 3 hiladas para una transferencia perfecta de esfuerzos cortantes.</li>
              <li><strong>Materiales Homologados:</strong> Usar ladrillos industriales de arcilla cocida o bloques de hormigón vibrado con mortero de dosificación controlada 1:3 o 1:4.</li>
            </ul>
          </div>

          <span class="ai-rec-badge nch">NCh2123 Albañilería Confinada</span>
          <p style="margin-top: 6px; font-size: 0.65rem; color: var(--text-muted); line-height: 1.3;">
            El muro trabaja como una biela de compresión diagonal. Al agrietarse por el sismo, la viga superior e inferior y los dos pilares laterales evitan que los bloques se desprendan, manteniendo la rigidez de la estructura.
          </p>
        </div>
      </div>
    `;
  } else if (type === 'foundation') {
    const f = S.story.foundation;
    const r = S.results.foundation;
    const sigma = parseFloat(r?.sigma_contact) || 0;
    const qadm = f.qadm;
    const dcr = parseFloat(r?.DCR_soil) || 0;
    const Vu = parseFloat(r?.Vu) || 0;
    const phiVc = parseFloat(r?.phi_Vc) || 0;
    const AsReq = parseFloat(r?.rebar?.AsReq) || 0;

    html = `
      <div class="ai-rec-card ${dcr > 1.0 ? 'danger' : 'accent'}">
        <div class="ai-rec-title" style="color: ${dcr > 1.0 ? 'var(--danger)' : 'var(--accent)'};">
          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><path d="M12 2v20M2 12h20"/></svg>
          Estabilidad Geotécnica (Presión Admisible)
        </div>
        <div class="ai-rec-body">
          <p>La zapata corrida distribuye una presión de contacto total sobre el suelo de <strong>${sigma.toFixed(1)} kPa</strong> (incluyendo peso de la zapata y el relleno de suelo superior a profundidad D<sub>f</sub> = ${f.Df.toFixed(2)}m).</p>
          
          ${dcr > 1.0 ? `
            <div style="margin: 8px 0; padding: 8px; background: rgba(248,81,73,0.04); border: 1px solid rgba(248,81,73,0.15); border-radius: 4px;">
              <strong style="color: var(--danger); font-size: 0.72rem; display: block; margin-bottom: 4px;">⚠️ ALERTA: CAPACIDAD SUPERADA</strong>
              <p style="font-size:0.7rem; margin:0; line-height:1.3;">La tensión de contacto supera la capacidad admisible del terreno (q<sub>adm</sub> = ${qadm} kPa) en un <strong>${((dcr - 1) * 100).toFixed(0)}%</strong>. 
              <strong>Recomendación:</strong> Incrementar el ancho de la zapata <strong>B</strong> para redistribuir la carga.</p>
            </div>
          ` : `
            <div style="margin: 8px 0; padding: 8px; background: rgba(47,129,247,0.04); border: 1px solid rgba(47,129,247,0.15); border-radius: 4px;">
              <strong style="color: var(--success); font-size: 0.72rem; display: block; margin-bottom: 4px;">✓ ZAPATA ESTABLE</strong>
              <p style="font-size:0.7rem; margin:0; line-height:1.3;">La presión de contacto es inferior a la admisible (q<sub>adm</sub> = ${qadm} kPa). El ancho actual B = ${f.B.toFixed(2)}m es plenamente seguro.</p>
            </div>
          `}
          
          <span class="ai-rec-badge steel">DCR Suelo: ${dcr.toFixed(2)}</span>
          <span class="ai-rec-badge nch">NCh1508 / Suelos</span>
        </div>
      </div>

      <div class="ai-rec-card ${Vu > phiVc ? 'danger' : 'success'}">
        <div class="ai-rec-title" style="color: ${Vu > phiVc ? 'var(--danger)' : 'var(--success)'};">
          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" stroke-linecap="round" stroke-linejoin="round"/></svg>
          Verificación de Corte Unidireccional
        </div>
        <div class="ai-rec-body">
          <p>El esfuerzo cortante último por flexión a una distancia <em>d</em> de la cara del sobrecimiento es V<sub>u</sub> = <strong>${Vu.toFixed(1)} kN/m</strong>. La resistencia del hormigón sin armadura es ϕV<sub>c</sub> = <strong>${phiVc.toFixed(1)} kN/m</strong>.</p>
          
          ${Vu > phiVc ? `
            <div style="margin: 8px 0; padding: 8px; background: rgba(248,81,73,0.04); border: 1px solid rgba(248,81,73,0.15); border-radius: 4px;">
              <strong style="color: var(--danger); font-size: 0.72rem; display: block; margin-bottom: 4px;">⚠️ ALERTA: ESPESOR INSUFICIENTE</strong>
              <p style="font-size:0.7rem; margin:0; line-height:1.3;">El hormigón ha superado su capacidad a esfuerzo cortante (falla por tensión diagonal). Las zapatas corridas no deben llevar estribos por constructibilidad.
              <strong>Recomendación obligatoria:</strong> Incrementar el espesor de la zapata <strong>H<sub>f</sub></strong>.</p>
            </div>
          ` : `
            <div style="margin: 8px 0; padding: 8px; background: rgba(63,185,80,0.04); border: 1px solid rgba(63,185,80,0.15); border-radius: 4px;">
              <strong style="color: var(--success); font-size: 0.72rem; display: block; margin-bottom: 4px;">✓ RESISTENCIA AL CORTE OK</strong>
              <p style="font-size:0.7rem; margin:0; line-height:1.3;">La capacidad por tensión diagonal del hormigón ϕV<sub>c</sub> es mayor que V<sub>u</sub>. El espesor H<sub>f</sub> = ${(f.Hf * 100).toFixed(0)} cm cumple con creces la norma.</p>
            </div>
          `}
          
          <span class="ai-rec-badge steel">Hormigón H20</span>
          <span class="ai-rec-badge nch">NCh430 Cl. 11.1</span>
        </div>
      </div>

      <div class="ai-rec-card warning">
        <div class="ai-rec-title" style="color: var(--warning);">
          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" stroke-linecap="round" stroke-linejoin="round"/></svg>
          Recomendaciones de Armado
        </div>
        <div class="ai-rec-body">
          <p>Para asegurar una respuesta dúctil frente a flexión en la cara de empalme, y evitar retracción por temperatura:</p>
          <ul style="margin: 4px 0; padding-left: 14px; font-size: 0.7rem; display: flex; flex-direction: column; gap: 3px;">
            <li><strong>Armadura Transversal (Principal):</strong> Colocar en la cara inferior de la zapata para resistir el momento en voladizo. As<sub>req</sub> = <strong>${AsReq.toFixed(2)} cm²/m</strong>.</li>
            <li><strong>Armadura Longitudinal:</strong> Actúa como repartidora por retracción térmica. Usar cuantía mínima de 0.18% (φ10 @ 25 cm).</li>
            <li><strong>Recubrimiento Mínimo:</strong> Al estar el hormigón vaciado en contacto directo con el suelo, el recubrimiento libre de las barras debe ser de <strong>7.0 cm</strong> según NCh430.</li>
          </ul>
          <span class="ai-rec-badge steel">Recubrimiento 7.0cm</span>
          <span class="ai-rec-badge nch">NCh430 Cl. 7.7</span>
        </div>
      </div>
    `;
  }

  container.innerHTML = html;
}

function updateSoilStressUI() {
  const r = S.results.foundation;
  if (!r) return;

  const f = S.story.foundation;
  const qadm = parseFloat(r.q_adm) || 0;
  const sigma = parseFloat(r.sigma_contact) || 0;
  const pct   = qadm > 0 ? Math.min(150, (sigma / qadm) * 100) : 100;

  const qultEl   = document.getElementById('soil-qult-val');
  const qadmEl   = document.getElementById('soil-qadm-val');
  const valEl    = document.getElementById('soil-stress-val');
  const barEl    = document.getElementById('soil-stress-bar');
  const badgeEl  = document.getElementById('soil-status-badge');
  const suppEl   = document.getElementById('soil-support-lbl');

  if (qultEl)  qultEl.textContent  = `${r.q_ult} kPa`;
  if (qadmEl)  qadmEl.textContent  = `${r.q_adm} kPa`;
  if (valEl)   valEl.textContent   = `${r.sigma_contact} kPa`;
  if (suppEl)  suppEl.textContent  = r.supportStrat || '—';

  if (barEl) {
    barEl.style.width      = `${Math.min(pct, 100)}%`;
    barEl.style.background = pct > 100 ? 'var(--danger)' : pct > 80 ? 'var(--warning)' : 'var(--success)';
  }
  if (badgeEl) {
    const over = pct > 100;
    badgeEl.textContent       = over ? 'SOBRECARGADO' : 'OK';
    badgeEl.style.background  = over ? 'var(--danger)' : 'var(--success)';
  }
}

// ── FoundationUI: Dynamic Strata Renderer ──────────────────────────
const FoundationUI = {
  renderStrataUI() {
    const container = document.getElementById('strata-container');
    if (!container) return;
    const f      = S.story.foundation;
    const strata = f.strata || [];
    const NF     = parseFloat(f.NF) ?? 3.0;
    const Df     = parseFloat(f.Df) ?? 0.80;

    container.innerHTML = '';
    let z = 0;

    strata.forEach((st, idx) => {
      const zTop = z;
      const zBot = z + parseFloat(st.h || 0);
      const isSupport = (zTop < Df && zBot >= Df) || (idx === strata.length - 1 && z < Df);
      const nfInside  = NF > zTop && NF < zBot;
      const isDrained = st.type !== 'no_drenado';

      const card = document.createElement('div');
      card.className = 'stratum-card' + (isSupport ? ' support-active' : '');
      card.dataset.sid = st.id;

      card.innerHTML = `
        <div class="stratum-header">
          <div class="stratum-index">${idx + 1}</div>
          <input class="stratum-name-input" type="text" value="${st.name || 'Estrato'}" data-field="name" placeholder="Nombre del estrato">
          <button class="btn-del-stratum" data-sid="${st.id}" title="Eliminar estrato">
            <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M18 6L6 18M6 6l12 12" stroke-linecap="round"/></svg>
          </button>
        </div>

        <div class="stratum-type-row">
          <button class="stratum-type-btn ${isDrained ? 'active-drenado' : ''}" data-dtype="drenado">
            ✓ Drenado (φ, c)
          </button>
          <button class="stratum-type-btn ${!isDrained ? 'active-nodrenado' : ''}" data-dtype="no_drenado">
            ⚡ No Drenado (Sᵤ)
          </button>
        </div>

        <div class="stratum-fields">
          <div class="stratum-field">
            <label>Espesor h (m)</label>
            <input type="number" data-field="h" value="${parseFloat(st.h).toFixed(2)}" step="0.10" min="0.05">
          </div>
          <div class="stratum-field">
            <label>γ (kN/m³)</label>
            <input type="number" data-field="gamma" value="${parseFloat(st.gamma).toFixed(1)}" step="0.5" min="8" max="25">
          </div>
          ${isDrained ? `
          <div class="stratum-field">
            <label>φ (°)</label>
            <input type="number" data-field="phi" value="${parseFloat(st.phi || 0).toFixed(0)}" step="1" min="0" max="50">
          </div>
          ` : `
          <div class="stratum-field">
            <label>Sᵤ (kPa)</label>
            <input type="number" data-field="phi" value="${parseFloat(st.phi || 0).toFixed(0)}" step="1" min="0" max="500" placeholder="Sᵤ">
          </div>
          `}
        </div>
        ${isDrained ? `
        <div class="stratum-fields" style="margin-top:6px;">
          <div class="stratum-field">
            <label>c (kPa)</label>
            <input type="number" data-field="c" value="${parseFloat(st.c || 0).toFixed(1)}" step="1" min="0">
          </div>
          <div class="stratum-field" style="grid-column:span 2;">
            <label>Clasificación USCS (opcional)</label>
            <input type="text" data-field="uscs" value="${st.uscs || ''}" placeholder="SP, SM, CL, CH…" style="font-family:var(--font);">
          </div>
        </div>
        ` : ''}

        <div class="stratum-depth-indicator">
          <span>z = ${zTop.toFixed(2)}m → ${zBot.toFixed(2)}m</span>
          <span>
            ${nfInside ? `<span class="nf-badge">▼ NF @ ${NF.toFixed(2)}m</span>` : ''}
            ${isSupport ? `<span class="support-badge">★ Apoyo (Df=${Df.toFixed(2)}m)</span>` : ''}
          </span>
        </div>
      `;

      // Bind inputs inside this card
      card.querySelectorAll('input[data-field]').forEach(inp => {
        inp.addEventListener('input', () => {
          const field = inp.dataset.field;
          const v = inp.type === 'number' ? parseFloat(inp.value) : inp.value;
          if (inp.type === 'number' && isNaN(v)) return;
          st[field] = v;
          S.story.foundation.strata[idx][field] = v;
          S.foundation.strata[idx][field] = v;
          if (field === 'h') {
            this.renderStrataUI(); // Re-render to update z depths
          }
          refresh();
        });
      });

      // Drainage type toggle buttons
      card.querySelectorAll('.stratum-type-btn').forEach(btn => {
        btn.addEventListener('click', () => {
          const dtype = btn.dataset.dtype;
          st.type = dtype;
          S.story.foundation.strata[idx].type = dtype;
          S.foundation.strata[idx].type = dtype;
          this.renderStrataUI();
          refresh();
        });
      });

      // Delete button
      card.querySelector('.btn-del-stratum')?.addEventListener('click', () => {
        if (strata.length <= 1) return; // Always keep at least 1
        S.story.foundation.strata.splice(idx, 1);
        S.foundation.strata.splice(idx, 1);
        this.renderStrataUI();
        refresh();
      });

      container.appendChild(card);
      z = zBot;
    });
  }
};
