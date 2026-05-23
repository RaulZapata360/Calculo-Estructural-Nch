/**
 * memoryReport-calc.js — MÓDULO B: Memoria de Cálculo Técnica
 *
 * Documento de ingeniería que narra el proceso completo de cálculo:
 *   Pág 1 — Portada + identificación del proyecto
 *   Pág 2 — Datos de entrada (geometría, materiales, cargas)
 *   Pág 3 — Modelo estructural (nodos, vanos, secciones)
 *   Pág 4 — Combinaciones LRFD — iteración completa (NCh3171)
 *   Pág 5 — Análisis de cargas laterales (NCh432 viento / NCh433 sismo)
 *   Pág 6 — Esfuerzos de diseño por elemento (Mu, Vu, Nu)
 *   Pág 7 — Diseño y verificación de armadura (NCh430)
 *
 * Lee exclusivamente de S.results (calculado por Solver.run en init).
 * No modifica el solver ni los parámetros normativos.
 */

const MemoryReportCalc = {

  build(imgCache = {}) {
    const m    = S.story.materials;
    const H    = S.story.H;
    const ld   = S.story.loads    || {};
    const lat  = S.story.lateral  || {};
    const res  = S.results        || {};
    const latR = res.lateral      || {};
    const f    = S.story.foundation;
    const today = new Date().toLocaleDateString('es-CL');
    const totalL = S.spans.reduce((s, sp) => s + (sp.nodes
      ? Math.abs((S.nodes.find(n=>n.id===sp.toNode)?.x||0) - (S.nodes.find(n=>n.id===sp.fromNode)?.x||0))
      : (typeof getSpanL === 'function' ? getSpanL(sp) : 1)), 0);

    // ── Helpers ─────────────────────────────────────────────────────
    const TOTAL_PAGS = 7;
    const css = `
      *{margin:0;padding:0;box-sizing:border-box;}
      .pdf-page{width:794px;height:1123px;padding:50px 60px 44px;background:#fff;
                overflow:hidden;font-family:Arial,Helvetica,sans-serif;
                font-size:10pt;color:#111;position:relative;}
      .ph{border-bottom:2px solid #1a3a6b;padding-bottom:8px;margin-bottom:16px;
          display:flex;align-items:baseline;gap:10px;}
      .ph h1{font-size:13pt;font-weight:700;color:#1a3a6b;flex:1;}
      .ph .sub{font-size:8pt;color:#666;white-space:nowrap;}
      .pf{position:absolute;bottom:18px;left:60px;right:60px;
          border-top:0.5px solid #ccc;padding-top:4px;
          display:flex;justify-content:space-between;font-size:7.5pt;color:#999;}
      h2{font-size:10.5pt;font-weight:700;color:#1a3a6b;margin:12px 0 5px;}
      h3{font-size:9pt;font-weight:600;color:#333;margin:8px 0 3px;}
      table{width:100%;border-collapse:collapse;font-size:8.5pt;margin:4px 0;}
      th{background:#dce8f7;color:#1a3a6b;font-weight:700;padding:5px 8px;
         text-align:left;border:1px solid #aac;}
      td{padding:4px 8px;border-bottom:0.4px solid #e0e0e0;vertical-align:top;}
      tr:nth-child(even) td{background:#f7f9fc;}
      .ok{color:#15803d;font-weight:700;}
      .fail{color:#b91c1c;font-weight:700;}
      .gov{background:#fff3cd !important;}
      .box{border:1px solid #c0ccdc;border-radius:2px;padding:8px 12px;
           margin:5px 0;background:#f4f7fb;}
      .formula{font-family:'Courier New',monospace;font-size:9pt;
               background:#f0f0f0;padding:4px 8px;border-left:3px solid #1a3a6b;
               margin:4px 0;}
      .two{display:flex;gap:14px;}
      .two .col{flex:1;}
      .note{font-size:7.5pt;color:#666;margin-top:5px;line-height:1.4;}
    `;

    const ph = (n, title, sub='') =>
      `<div class="ph"><h1>§${n}. ${title}</h1>${sub?`<span class="sub">${sub}</span>`:''}</div>`;
    const footer = (n) =>
      `<div class="pf"><span>NCh2123 · NCh430 · NCh433 · NCh3171 · NCh432</span><span></span><span>Pág. ${n} / ${TOTAL_PAGS}</span></div>`;
    const row = (label, value, bold=false) =>
      `<tr><td style="width:58%;color:#444;">${label}</td>` +
      `<td style="text-align:right;${bold?'font-weight:700;':''}">${value}</td></tr>`;
    const fmt = (v, dec=3) => (typeof v === 'number') ? v.toFixed(dec) : (parseFloat(v)||0).toFixed(dec);

    let html = `<style>${css}</style>`;

    // ══════════════════════════════════════════════════════════════
    // PÁG 1 — PORTADA
    // ══════════════════════════════════════════════════════════════
    html += `
    <div class="pdf-page" style="display:flex;flex-direction:column;justify-content:center;align-items:center;text-align:center;">
      <div style="width:100%;border-top:5px solid #1a3a6b;padding-top:20px;margin-bottom:32px;">
        <div style="font-size:7pt;font-weight:700;letter-spacing:3px;color:#666;
                    text-transform:uppercase;margin-bottom:12px;">
          Ingeniería Estructural — Albañilería Confinada
        </div>
        <div style="font-size:20pt;font-weight:700;color:#1a3a6b;line-height:1.2;
                    letter-spacing:-0.3px;margin-bottom:6px;">
          MEMORIA DE CÁLCULO ESTRUCTURAL
        </div>
        <div style="font-size:10pt;color:#444;margin-bottom:24px;">
          Muro de Adosamiento en Albañilería Confinada<br/>
          Predimensionamiento y Verificación de Elementos
        </div>
        <div style="border-bottom:1px solid #ccc;margin:0 40px;"></div>
      </div>

      <table style="max-width:480px;width:100%;border:1px solid #ccc;
                    font-size:9.5pt;margin-bottom:40px;">
        ${row('Tipo de estructura','Muro de albañilería confinada')}
        ${row('Longitud total de muro',`${totalL.toFixed(2)} m`)}
        ${row('Altura entrepiso H',`${H.toFixed(2)} m`)}
        ${row("Resistencia hormigón f'c",`${m.fc} MPa`)}
        ${row('Límite de fluencia acero fy',`${m.fy} MPa`)}
        ${row('Normativa de diseño',`NCh2123 · NCh430 · NCh433 · NCh3171 · NCh432`)}
        ${row('Zona sísmica',`Zona ${lat.seismic?.zone||3} (A₀ = ${({1:'0.20',2:'0.30',3:'0.40'})[lat.seismic?.zone||3]} g)`)}
        ${row('Fecha de cálculo',today)}
      </table>

      <div style="display:flex;gap:80px;margin-bottom:36px;">
        <div style="text-align:center;">
          <div style="width:180px;height:36px;border-bottom:1px solid #888;"></div>
          <div style="font-size:8pt;color:#666;padding-top:5px;">Ing. Proyectista / Revisor</div>
        </div>
        <div style="text-align:center;">
          <div style="width:180px;height:36px;border-bottom:1px solid #888;"></div>
          <div style="font-size:8pt;color:#666;padding-top:5px;">Jefe de Obras</div>
        </div>
      </div>

      <div style="border-bottom:3px solid #1a3a6b;width:100%;"></div>
      <div style="margin-top:12px;font-size:7.5pt;color:#888;text-align:center;line-height:1.6;">
        Este documento ha sido generado automáticamente por EstructuraCalc.<br/>
        El ingeniero proyectista es responsable de la verificación de los resultados.
      </div>
    </div>`;

    // ══════════════════════════════════════════════════════════════
    // PÁG 2 — DATOS DE ENTRADA
    // ══════════════════════════════════════════════════════════════
    const A0_val = ({1:0.20,2:0.30,3:0.40})[parseInt(lat.seismic?.zone)||3] || 0.40;
    const S_val  = ({A:0.90,B:1.00,C:1.05,D:1.20,E:1.30})[lat.seismic?.soilType||'D'] || 1.20;

    html += `
    <div class="pdf-page">
      ${ph(1,'Datos de Entrada','Geometría, Materiales y Cargas de Diseño')}

      <div class="two">
        <div class="col">
          <h2>1.1 Geometría</h2>
          <table>
            ${row('Altura entrepiso H', `${H.toFixed(2)} m`)}
            ${row('Longitud total muro', `${totalL.toFixed(2)} m`)}
            ${row('N° de vanos', `${S.spans.length}`)}
            ${row('N° de pilares / nodos', `${S.nodes.length}`)}
            ${row('Tipo de zapata', `${f?.type||'T'} (corrida)`)}
            ${row('Ancho zapata B', `${(f?.B||1.0).toFixed(2)} m`)}
            ${row('Espesor zapata Hf', `${(f?.Hf||0.40).toFixed(2)} m`)}
            ${row('Sello de fundación Df', `${(f?.Df||0.60).toFixed(2)} m`)}
          </table>

          <h2 style="margin-top:10px;">1.2 Materiales</h2>
          <table>
            ${row("f'c hormigón (NCh170)", `${m.fc} MPa`)}
            ${row('fy acero A630-420H (NCh204)', `${m.fy} MPa`)}
            ${row('γc hormigón armado', `${m.gc} kN/m³`)}
            ${row('γm albañilería', `${m.gm} kN/m³`)}
            ${row('Recubrimiento mínimo', `${(m.rec*100).toFixed(0)} mm`)}
            ${row('β₁ (f\'c ≤ 28 MPa)', `${(m.fc<=28?0.85:Math.max(0.65,0.85-0.05*(m.fc-28)/7)).toFixed(2)}`)}
          </table>
        </div>
        <div class="col">
          <h2>1.3 Cargas de Diseño</h2>
          <table>
            ${row('Carga muerta qD', `${(ld.qD||0).toFixed(3)} kN/m²`)}
            ${row('Carga viva qL', `${(ld.qL||0).toFixed(3)} kN/m²`)}
            ${row('Carga de techo qRoof', `${(ld.qRoof||0).toFixed(3)} kN/m²`)}
            ${row('Factor mayoración D (fd)', `${(ld.fd||1.2).toFixed(2)}`)}
            ${row('Factor mayoración L (fl)', `${(ld.fl||1.6).toFixed(2)}`)}
            ${row('Carga factorizada qu', `${fmt(res.qu||0,3)} kN/m²`, true)}
          </table>

          <h2 style="margin-top:10px;">1.4 Parámetros Sísmicos y Viento</h2>
          <table>
            ${row('Zona sísmica (NCh433)', `Zona ${lat.seismic?.zone||3}`)}
            ${row('Aceleración zona A₀', `${A0_val.toFixed(2)} g`)}
            ${row('Tipo de suelo', `${lat.seismic?.soilType||'D'}`)}
            ${row('Factor suelo S', `${S_val.toFixed(2)}`)}
            ${row('Categoría importancia I', `${(lat.seismic?.I||1.0).toFixed(1)}`)}
            ${row('Factor reducción R', `${lat.seismic?.R||4}`)}
            ${row('Velocidad viento Vbase (NCh432)', `${lat.wind?.V_basic||35} m/s`)}
          </table>
        </div>
      </div>

      <div class="box" style="margin-top:10px;">
        <strong>Criterio de diseño:</strong> Método de Resistencia Última (LRFD) conforme NCh3171 Of.2003.
        Todas las combinaciones de carga son factorizadas antes de calcular esfuerzos de diseño.
        Los factores de reducción φ provienen de NCh430 Of.2008 (Tabla 9.3.2).
      </div>

      ${footer(2)}
    </div>`;

    // ══════════════════════════════════════════════════════════════
    // PÁG 3 — MODELO ESTRUCTURAL
    // ══════════════════════════════════════════════════════════════
    let spanRows = '';
    S.spans.forEach((sp, i) => {
      const L = (typeof getSpanL === 'function') ? getSpanL(sp) : 1.0;
      const btS = sp.beamTop?.section || {b:0.20,h:0.15};
      const bbS = sp.beamBot?.section || {b:0.20,h:0.15};
      spanRows += `<tr>
        <td style="font-weight:600;">${sp.id}</td>
        <td>${sp.fromNode} → ${sp.toNode}</td>
        <td style="text-align:center;">${L.toFixed(2)}</td>
        <td style="text-align:center;">${sp.type}</td>
        <td style="text-align:center;">${(sp.tw*100).toFixed(0)} cm</td>
        <td style="text-align:center;">${(btS.b*100).toFixed(0)}×${(btS.h*100).toFixed(0)} cm</td>
        <td style="text-align:center;">${(bbS.b*100).toFixed(0)}×${(bbS.h*100).toFixed(0)} cm</td>
      </tr>`;
    });

    let colRows = '';
    S.nodes.forEach(nd => {
      const col = S.columns[nd.id];
      const colR = res.columns?.[nd.id];
      if (!col) return;
      const sec = col.section;
      colRows += `<tr>
        <td style="font-weight:600;">${nd.id}</td>
        <td style="text-align:center;">x = ${nd.x.toFixed(2)} m</td>
        <td style="text-align:center;">${(sec.b*100).toFixed(0)} cm</td>
        <td style="text-align:center;">${(sec.h*100).toFixed(0)} cm</td>
        <td style="text-align:center;">${(sec.b*sec.h*1e4).toFixed(1)} cm²</td>
        <td style="text-align:center;">${colR?.isCombined ? '← con lateral' : '— solo vertical'}</td>
      </tr>`;
    });

    html += `
    <div class="pdf-page">
      ${ph(2,'Modelo Estructural','Descripción de Nodos, Vanos y Secciones')}

      <h2>2.1 Descripción del Sistema Estructural</h2>
      <div class="box">
        El muro de adosamiento se modela como un <strong>pórtico plano de albañilería confinada</strong>
        con ${S.spans.length} vano(s) y ${S.nodes.length} pilar(es).
        Cada vano contiene una cadena superior (beamTop) y un sobrecimiento (beamBot)
        que actúan como elementos de confinamiento conforme NCh2123 §6.
        Los pilares (confining columns) transmiten cargas verticales y resistentes laterales.
      </div>

      <h2 style="margin-top:10px;">2.2 Vanos (Spans)</h2>
      <table>
        <tr>
          <th>ID</th><th>Nodos</th><th style="text-align:center;">L (m)</th>
          <th style="text-align:center;">Tipo</th><th style="text-align:center;">tw</th>
          <th style="text-align:center;">Cadena Sup.</th><th style="text-align:center;">Sobrecimiento</th>
        </tr>
        ${spanRows}
      </table>

      <h2 style="margin-top:10px;">2.3 Pilares / Nodos</h2>
      <table>
        <tr>
          <th>Nodo</th><th style="text-align:center;">Posición</th>
          <th style="text-align:center;">b (cm)</th><th style="text-align:center;">h (cm)</th>
          <th style="text-align:center;">Ag (cm²)</th><th>Carga lateral</th>
        </tr>
        ${colRows}
      </table>

      <h2 style="margin-top:10px;">2.4 Secuencia de Cálculo (Iteración)</h2>
      <div class="box">
        <strong>El solver ejecuta los siguientes pasos en orden:</strong>
        <ol style="margin:6px 0 0 18px;line-height:1.8;font-size:9pt;">
          <li>Calcular cargas gravitacionales por vano: N_D, N_L, N_Roof (bajada de cargas)</li>
          <li>Calcular fuerzas laterales: C_s (NCh433) y q_w (NCh432) → F_wind, F_seis</li>
          <li>Evaluar 8 combinaciones LRFD por columna (NCh3171) → obtener combinación gobernante</li>
          <li>Diseñar armadura longitudinal: As_req de M_u con ecuación cuadrática (NCh430 §10)</li>
          <li>Diseñar estribos: V_c, V_s → espaciamiento s (NCh430 Art.12.3 + NCh2123 §7.7.8)</li>
          <li>Verificar: As_min ≤ As_sel ≤ As_max ; s_sel ≤ s_max</li>
          <li>Diseñar fundación: método de Hansen, FS volcamiento y deslizamiento (NCh3171)</li>
        </ol>
      </div>

      ${footer(3)}
    </div>`;

    // ══════════════════════════════════════════════════════════════
    // PÁG 4 — COMBINACIONES LRFD
    // ══════════════════════════════════════════════════════════════
    const COMBO_NAMES = [
      '1.4 D',
      '1.2 D + 1.6 L + 0.5 Lr',
      '1.2 D + 1.6 Lr + 1.0 L',
      '1.2 D + 1.6 Lr + 0.8 W',
      '1.2 D + 1.0 W + L + 0.5 Lr',
      '1.2 D + 1.0 E + L + 0.2 Lr',
      '0.9 D + 1.0 W',
      '0.9 D + 1.0 E'
    ];
    const COMBO_REFS = [
      'NCh3171 §5.2.1','NCh3171 §5.2.2','NCh3171 §5.2.3',
      'NCh3171 §5.2.4','NCh3171 §5.2.5','NCh3171 §5.2.6 (Sismo)',
      'NCh3171 §5.2.7','NCh3171 §5.2.8 (Volcam.)'
    ];

    // Tabla de combinaciones por nodo (primer nodo con datos)
    const firstNodeId = Object.keys(res.columns||{})[0];
    const firstColRes = firstNodeId ? res.columns[firstNodeId] : null;
    const combs = firstColRes?.combinations || [];

    let combRows = '';
    combs.forEach((c, i) => {
      const isGov = c.name === firstColRes?.caseLabel;
      combRows += `<tr class="${isGov?'gov':''}">
        <td style="font-weight:${isGov?700:400};">${COMBO_NAMES[i]||c.name}</td>
        <td style="text-align:center;">${fmt(c.Nu_base,2)}</td>
        <td style="text-align:center;">${fmt(c.Vu_base,2)}</td>
        <td style="text-align:center;${isGov?'font-weight:700;color:#b45309;':''}">${fmt(c.Mu,2)}</td>
        <td style="text-align:center;font-size:7.5pt;color:#555;">${COMBO_REFS[i]||''}</td>
        <td style="text-align:center;">${isGov?'<strong>▶ GOB.</strong>':''}</td>
      </tr>`;
    });

    html += `
    <div class="pdf-page">
      ${ph(3,'Combinaciones de Carga LRFD','NCh3171 Of.2003 — Iteración Completa')}

      <h2>3.1 Fundamento LRFD</h2>
      <div class="box">
        El Diseño por Resistencia Última (LRFD) requiere verificar que la resistencia factorizada φR_n
        supera el efecto máximo de todas las combinaciones de carga mayoradas.
        Se evalúan <strong>${COMBO_NAMES.length} combinaciones</strong> por elemento.
        La combinación que produce el mayor momento flector M_u es la <strong>gobernante</strong>.
      </div>

      <h2 style="margin-top:10px;">3.2 Cargas Gravitacionales (Bajada de Cargas — Primer Nodo: ${firstNodeId||'—'})</h2>
      <table>
        <tr><th>Componente</th><th style="text-align:center;">Carga nominal</th><th style="text-align:center;">Descripción</th></tr>
        <tr><td>Carga muerta D</td><td style="text-align:center;">${fmt(ld.qD||0,3)} kN/m²</td><td>Peso propio vigas + losa + albañilería</td></tr>
        <tr><td>Carga viva L</td><td style="text-align:center;">${fmt(ld.qL||0,3)} kN/m²</td><td>Uso residencial (NCh1537 Tabla 3.1)</td></tr>
        <tr><td>Carga de techo Lr</td><td style="text-align:center;">${fmt(ld.qRoof||0,3)} kN/m²</td><td>Metalcon coronación</td></tr>
        <tr><td>Axial base N_D</td><td style="text-align:center;">${fmt(firstColRes?.Nu,2)||'—'} kN</td><td>Factorizado en combinación gobernante</td></tr>
      </table>

      <h2 style="margin-top:10px;">3.3 Tabla de Combinaciones (Nodo: ${firstNodeId||'—'})</h2>
      ${combs.length ? `
      <table>
        <tr>
          <th style="width:30%;">Combinación (NCh3171)</th>
          <th style="text-align:center;">N_u base (kN)</th>
          <th style="text-align:center;">V_u base (kN)</th>
          <th style="text-align:center;">M_u (kN·m)</th>
          <th style="text-align:center;">Ref. norm.</th>
          <th style="text-align:center;">Estado</th>
        </tr>
        ${combRows}
      </table>
      <div class="note">Filas en amarillo = combinación gobernante (máximo M_u). Todas las combinaciones incluidas garantizan que el diseño considera el peor estado de carga posible.</div>`
      : '<div class="box">Tabla no disponible — ejecutar solver.</div>'}

      <h2 style="margin-top:10px;">3.4 Combinación Gobernante</h2>
      <div class="formula">
        Combinación: ${firstColRes?.caseLabel || '—'}<br/>
        M_u = ${fmt(firstColRes?.Mu,2)} kN·m &nbsp;|&nbsp;
        V_u = ${fmt(firstColRes?.Vu,2)} kN &nbsp;|&nbsp;
        N_u = ${fmt(firstColRes?.Nu,2)} kN
      </div>

      ${footer(4)}
    </div>`;

    // ══════════════════════════════════════════════════════════════
    // PÁG 5 — CARGAS LATERALES (NCh432 + NCh433)
    // ══════════════════════════════════════════════════════════════
    const Cs_calc = (2.75 * A0_val * S_val * (parseFloat(lat.seismic?.I)||1.0)) / (parseFloat(lat.seismic?.R)||4);
    const Cs_min  = A0_val * (parseFloat(lat.seismic?.I)||1.0) / 6;
    const Cs      = parseFloat(latR.Cs) || Math.min(Math.max(Cs_calc, Cs_min), 0.35);
    const V_basic = parseFloat(latR.V_basic) || parseFloat(lat.wind?.V_basic) || 35;
    const q_w     = parseFloat(latR.q_w)     || (0.613 * V_basic * V_basic / 1000);
    const F_wind  = parseFloat(latR.F_wind)  || q_w * H;
    const F_seis  = parseFloat(latR.F_seismic)|| 0;
    const F_h     = parseFloat(latR.F_h)     || Math.max(F_wind, F_seis);
    const gov     = latR.governing || (F_seis >= F_wind ? 'sismo' : 'viento');
    const W_supra = parseFloat(latR.W_supra) || 0;
    const hApply  = parseFloat(latR.hApply)  || H/2;
    const M_O     = parseFloat(latR.M_O)     || F_h*(hApply+(f?.Hf||0.4));
    const MR_pos  = parseFloat(latR.MR_pos)  || 0;
    const MR_neg  = parseFloat(latR.MR_neg)  || 0;
    const FSv     = parseFloat(latR.FS_v_critico) || 0;
    const FSd     = parseFloat(latR.FS_d)    || 0;

    const okStr = (v,lim) => parseFloat(v)>=lim
      ? `<span class="ok">${parseFloat(v).toFixed(2)} ≥ ${lim} ✓</span>`
      : `<span class="fail">${parseFloat(v).toFixed(2)} < ${lim} ✗</span>`;

    html += `
    <div class="pdf-page">
      ${ph(4,'Análisis de Cargas Laterales','NCh432 (Viento) · NCh433 D.S.61 (Sismo)')}

      <div class="two">
        <div class="col">
          <h2>4.1 Presión de Viento — NCh432 Of.2010</h2>
          <div class="formula">
            q_w = 0.613 · V²_base [Pa] / 1000<br/>
            q_w = 0.613 × ${V_basic}² / 1000 = <strong>${q_w.toFixed(3)} kPa</strong>
          </div>
          <div class="formula">
            F_viento = q_w · H · 1 m<br/>
            F_viento = ${q_w.toFixed(3)} × ${H.toFixed(2)} = <strong>${F_wind.toFixed(3)} kN/m</strong>
          </div>
          <div class="note">Presión uniforme sobre altura H (modelo conservador simplificado).
          Resultante aplicada en h = H/2 = ${(H/2).toFixed(2)} m desde la base del muro.</div>
        </div>
        <div class="col">
          <h2>4.2 Fuerza Sísmica — NCh433 D.S.61</h2>
          <div class="formula">
            C_s,calc = (2.75 · A₀ · S · I) / R<br/>
            = (2.75 × ${A0_val.toFixed(2)} × ${S_val.toFixed(2)} × ${(lat.seismic?.I||1).toFixed(1)}) / ${lat.seismic?.R||4}<br/>
            = ${Cs_calc.toFixed(4)}
          </div>
          <div class="formula">
            C_s,min = A₀ · I / 6 = ${Cs_min.toFixed(4)}<br/>
            C_s = max(C_s,min, min(C_s,calc, 0.35)) = <strong>${Cs.toFixed(4)}</strong>
          </div>
          <div class="formula">
            W_supra = ${W_supra.toFixed(2)} kN/m (masa sobre zapata)<br/>
            F_sismo = C_s · W_supra = ${Cs.toFixed(4)} × ${W_supra.toFixed(2)}<br/>
            F_sismo = <strong>${F_seis.toFixed(3)} kN/m</strong>
          </div>
        </div>
      </div>

      <h2 style="margin-top:10px;">4.3 Fuerza Horizontal Gobernante</h2>
      <table>
        <tr><th>Caso</th><th style="text-align:center;">F_h (kN/m)</th><th>¿Gobierna?</th></tr>
        <tr class="${gov==='viento'?'gov':''}">
          <td>Viento (NCh432)</td>
          <td style="text-align:center;font-weight:600;">${F_wind.toFixed(3)}</td>
          <td>${gov==='viento'?'<strong>▶ GOBIERNA</strong>':'—'}</td>
        </tr>
        <tr class="${gov==='sismo'?'gov':''}">
          <td>Sismo (NCh433)</td>
          <td style="text-align:center;font-weight:600;">${F_seis.toFixed(3)}</td>
          <td>${gov==='sismo'?'<strong>▶ GOBIERNA</strong>':'—'}</td>
        </tr>
      </table>
      <div class="formula" style="margin-top:6px;">
        F_h,diseño = max(F_viento, F_sismo) = <strong>${F_h.toFixed(3)} kN/m</strong>
        &nbsp; aplicada en h = ${hApply.toFixed(2)} m
      </div>

      <h2 style="margin-top:10px;">4.4 Verificación de Estabilidad de Fundación</h2>
      <table>
        <tr><th>Verificación</th><th>Fórmula</th><th style="text-align:center;">Resultado</th><th>Estado (FS ≥ 1.5)</th></tr>
        <tr>
          <td>Volcamiento</td>
          <td style="font-size:8pt;">FS = M_R / M_O = ${MR_neg.toFixed(2)} / ${M_O.toFixed(2)}</td>
          <td style="text-align:center;">${FSv.toFixed(2)}</td>
          <td>${okStr(FSv,1.5)}</td>
        </tr>
        <tr>
          <td>Deslizamiento</td>
          <td style="font-size:8pt;">FS = F_R / F_h = ${fmt(latR.F_R_desl,2)} / ${F_h.toFixed(2)}</td>
          <td style="text-align:center;">${FSd.toFixed(2)}</td>
          <td>${okStr(FSd,1.5)}</td>
        </tr>
      </table>

      ${footer(5)}
    </div>`;

    // ══════════════════════════════════════════════════════════════
    // PÁG 6 — ESFUERZOS DE DISEÑO POR ELEMENTO
    // ══════════════════════════════════════════════════════════════
    let efRows = '';
    Object.entries(res.columns||{}).forEach(([nodeId, col]) => {
      efRows += `<tr>
        <td style="font-weight:700;">${nodeId}</td>
        <td style="font-size:8pt;color:#444;">${col.caseLabel||'—'}</td>
        <td style="text-align:center;">${fmt(col.Mu,2)}</td>
        <td style="text-align:center;">${fmt(col.Vu,2)}</td>
        <td style="text-align:center;">${fmt(col.Nu,2)}</td>
        <td style="text-align:center;">${col.isCombined?`${fmt(col.F_lat,2)} kN`:'—'}</td>
        <td style="text-align:center;font-size:8pt;">${col.Ltrib||'—'} m</td>
      </tr>`;
    });

    html += `
    <div class="pdf-page">
      ${ph(5,'Esfuerzos de Diseño por Elemento','Envolvente LRFD — Combinación Gobernante')}

      <h2>5.1 Metodología</h2>
      <div class="box">
        Para cada pilar/nodo se evalúan las ${COMBO_NAMES.length} combinaciones LRFD.
        Se selecciona la combinación que produce el mayor momento flector M_u (estado crítico de
        diseño). Esta envolvente garantiza que el diseño cubre todos los posibles estados de carga.
        Los esfuerzos de corte V_u y axial N_u corresponden a la misma combinación gobernante.
      </div>

      <h2 style="margin-top:10px;">5.2 Tabla de Esfuerzos de Diseño</h2>
      <table>
        <tr>
          <th>Nodo</th>
          <th>Combinación gobernante</th>
          <th style="text-align:center;">M_u (kN·m)</th>
          <th style="text-align:center;">V_u (kN)</th>
          <th style="text-align:center;">N_u (kN)</th>
          <th style="text-align:center;">F_lat</th>
          <th style="text-align:center;">Ltrib</th>
        </tr>
        ${efRows || '<tr><td colspan="7">Sin datos — ejecutar solver</td></tr>'}
      </table>

      <h2 style="margin-top:10px;">5.3 Ecuaciones de Diseño por Flexión (NCh430 §10)</h2>
      <div class="box">
        <strong>Columna doblemente armada simétrica:</strong>
        <div class="formula" style="margin-top:6px;">
          φ = 0.90 (flexión) &nbsp;|&nbsp; φ = 0.75 (corte)
        </div>
        <div class="formula">
          Ecuación cuadrática: −φ·fy²/(2Cf)·As² + φ·fy·(d + fy'/fy·arm)·As − M_u = 0<br/>
          Donde: Cf = 0.85·f'c·b &nbsp;|&nbsp; fy' = fy − 0.85·f'c &nbsp;|&nbsp; arm = d − d'
        </div>
        <div class="formula">
          As_req = 2 × As_cara &nbsp; (simétrico, total ambas caras)
        </div>
        <div class="formula">
          ρ_min = max(0.01, 0.25√f'c/fy) &nbsp;→&nbsp; As_min = ρ_min · b · h<br/>
          ρ_max = 0.04 &nbsp;→&nbsp; As_max = 0.04 · b · h
        </div>
      </div>

      <h2 style="margin-top:10px;">5.4 Ecuaciones de Diseño por Corte (NCh430 Art.12)</h2>
      <div class="formula">
        V_c = 0.17√f'c · b · d &nbsp; [resistencia hormigón]<br/>
        V_s = (V_u / φ_v) − V_c &nbsp; [requerido al acero]<br/>
        s = A_v · fy · d / (V_s) &nbsp;≤&nbsp; s_max = min(d/2, 600 mm)
      </div>

      ${footer(6)}
    </div>`;

    // ══════════════════════════════════════════════════════════════
    // PÁG 7 — ARMADURA RECOMENDADA POR ELEMENTO
    // ══════════════════════════════════════════════════════════════

    // Helpers locales para esta página
    const rebarDescP7 = (rebarObj) => {
      const sup = rebarObj?.faces?.superior;
      if (!sup?.barras?.[0]) return 'N/D';
      const b = sup.barras[0];
      return `${b.cantidad}ø${b.diámetro} c/cara`;
    };
    const stirrupDescP7 = (rebarObj) => {
      const e = rebarObj?.estribos;
      if (!e) return 'N/D';
      return `ø${e.diámetro}@${(e.espaciamiento * 100).toFixed(0)} cm`;
    };
    const asTotalP7 = (rebarObj) => {
      const s = rebarObj?.faces?.superior?.AsTotal || 0;
      const i = rebarObj?.faces?.inferior?.AsTotal  || 0;
      return +(s + i).toFixed(2);
    };
    const statusCell = (pass) =>
      pass ? '<td style="text-align:center;font-weight:700;color:#15803d;">✓ OK</td>'
           : '<td style="text-align:center;font-weight:700;color:#b91c1c;">✗ FALLA</td>';

    // Cabecera de sección (color, número, título, subtítulo)
    const secHdrP7 = (bg, num, title, sub) =>
      `<div style="background:${bg};border-left:3px solid #1a3a6b;padding:4px 8px;margin:8px 0 3px;">
         <strong style="color:#1a3a6b;">${num} ${title}</strong>
         <span style="font-size:8pt;color:#555;margin-left:6px;">${sub}</span>
       </div>`;

    // ── ① Pilar de confinamiento — elemento más crítico ─────────────────────
    let p7_col = '<tr><td colspan="9" style="color:#999;text-align:center;">Sin datos de columnas</td></tr>';
    let p7_col_note = '';
    let allOK = true;
    const colEntries7 = Object.entries(res.columns || {});
    if (colEntries7.length > 0) {
      const [critId, critCol] = colEntries7.reduce((mx, cur) =>
        parseFloat(cur[1].Mu) > parseFloat(mx[1].Mu) ? cur : mx, colEntries7[0]);
      const cOk = critCol.cumple_all ?? true;
      if (!cOk) allOK = false;
      const colObj  = S.columns[critId];
      const sec     = colObj?.section || { b:0.20, h:0.25 };
      const rObj    = colObj?.rebar;
      const AsSel   = asTotalP7(rObj);
      const sSel_cm = ((critCol.s_selected||0)*100).toFixed(0);
      const sMax_cm = ((critCol.s_max||0)*100).toFixed(0);
      const allIds  = colEntries7.map(([id])=>id).join(', ');
      p7_col = `<tr>
        <td style="font-weight:700;">${critId} ★</td>
        <td style="text-align:center;">${fmt(critCol.As_req,2)}</td>
        <td style="text-align:center;">${fmt(critCol.As_min,2)}</td>
        <td style="text-align:center;">${fmt(critCol.As_max,2)}</td>
        <td style="text-align:center;font-weight:700;color:${critCol.cumple_req?'#15803d':'#b91c1c'};">${fmt(AsSel,2)}</td>
        <td style="text-align:center;">${rebarDescP7(rObj)}</td>
        <td style="text-align:center;">${stirrupDescP7(rObj)}</td>
        <td style="text-align:center;">${sSel_cm} / ${sMax_cm} cm</td>
        ${statusCell(cOk)}
      </tr>`;
      p7_col_note = `★ Todos los pilares (${allIds}) se calculan con igual sección ${(sec.b*100).toFixed(0)}×${(sec.h*100).toFixed(0)} cm y misma armadura.
        Estribos: zona crítica (45 cm en extremos) ø8@${sSel_cm}cm · zona central ø8@15cm — NCh2123 §7.7.8.`;
    }

    // ── ② Cadena Superior — vano más crítico ───────────────────────────────
    let p7_bt = '<tr><td colspan="8" style="color:#999;text-align:center;">Sin datos de cadena superior</td></tr>';
    const spEntries7 = Object.entries(res.spans || {});
    let critBTSpanId = '';
    if (spEntries7.length > 0) {
      const [critSpId, critSpRes] = spEntries7.reduce((mx, cur) =>
        parseFloat(cur[1].beamTop?.Mu||0) > parseFloat(mx[1].beamTop?.Mu||0) ? cur : mx, spEntries7[0]);
      critBTSpanId = critSpId;
      const bt   = critSpRes.beamTop || {};
      const span = S.spans.find(sp => sp.id === critSpId);
      const rObj = span?.beamTop?.rebar;
      const des  = bt.rebar || {};
      const AsSel  = asTotalP7(rObj);
      const AsReq  = parseFloat(des.AsReq)    || 0;
      const AsMin  = parseFloat(des.AsMinCm2) || 0;
      const AsMax  = parseFloat(des.AsMaxCm2) || 0;
      const sCrit  = parseFloat(des.s_crit_mm||100)/10;
      const sMax   = parseFloat(des.s_max_cm ||20);
      const btOk   = AsSel >= AsMin && AsSel <= AsMax && AsSel >= AsReq && sCrit <= sMax;
      if (!btOk) allOK = false;
      p7_bt = `<tr>
        <td style="font-weight:700;">${critSpId}</td>
        <td style="text-align:center;">${fmt(bt.Mu,2)}</td>
        <td style="text-align:center;">${fmt(bt.Vu,2)}</td>
        <td style="text-align:center;">${fmt(AsReq,2)}</td>
        <td style="text-align:center;">${fmt(AsMin,2)}</td>
        <td style="text-align:center;font-weight:700;color:${AsSel>=AsMin?'#15803d':'#b91c1c'};">${fmt(AsSel,2)}</td>
        <td style="text-align:center;">${rebarDescP7(rObj)}</td>
        <td style="text-align:center;">${stirrupDescP7(rObj)}</td>
        ${statusCell(btOk)}
      </tr>`;
    }

    // ── ③ Sobrecimiento — vano más crítico ─────────────────────────────────
    let p7_bb = '<tr><td colspan="8" style="color:#999;text-align:center;">Sin datos de sobrecimiento</td></tr>';
    if (spEntries7.length > 0) {
      const [critSpId, critSpRes] = spEntries7.reduce((mx, cur) =>
        parseFloat(cur[1].beamBot?.Mu||0) > parseFloat(mx[1].beamBot?.Mu||0) ? cur : mx, spEntries7[0]);
      const bb   = critSpRes.beamBot || {};
      const span = S.spans.find(sp => sp.id === critSpId);
      const rObj = span?.beamBot?.rebar;
      const des  = bb.rebar || {};
      const AsSel  = asTotalP7(rObj);
      const AsReq  = parseFloat(des.AsReq)    || 0;
      const AsMin  = parseFloat(des.AsMinCm2) || 0;
      const AsMax  = parseFloat(des.AsMaxCm2) || 0;
      const sCrit  = parseFloat(des.s_crit_mm||100)/10;
      const sMax   = parseFloat(des.s_max_cm ||30);
      const bbOk   = AsSel >= AsMin && AsSel <= AsMax && AsSel >= AsReq && sCrit <= sMax;
      if (!bbOk) allOK = false;
      const piel = rObj?.faces?.piel?.barras?.[0];
      const pielDesc = piel ? ` + ${piel.cantidad}ø${piel.diámetro} piel` : '';
      p7_bb = `<tr>
        <td style="font-weight:700;">${critSpId}</td>
        <td style="text-align:center;">${fmt(bb.Mu,2)}</td>
        <td style="text-align:center;">${fmt(bb.Vu,2)}</td>
        <td style="text-align:center;">${fmt(AsReq,2)}</td>
        <td style="text-align:center;">${fmt(AsMin,2)}</td>
        <td style="text-align:center;font-weight:700;color:${AsSel>=AsMin?'#15803d':'#b91c1c'};">${fmt(AsSel,2)}</td>
        <td style="text-align:center;">${rebarDescP7(rObj)}${pielDesc}</td>
        <td style="text-align:center;">${stirrupDescP7(rObj)}</td>
        ${statusCell(bbOk)}
      </tr>`;
    }

    // ── ④ Fundación — zapata corrida ───────────────────────────────────────
    let p7_found = '<tr><td colspan="8" style="color:#999;text-align:center;">Sin datos de fundación</td></tr>';
    const fRes7  = res.foundation || {};
    const fSec7  = S.story.foundation;
    if (fRes7.rebar) {
      const fRebar  = fSec7?.rebar;
      const AsReqT  = parseFloat(fRes7.rebar.AsReq)    || 0;
      const AsMinT  = parseFloat(fRes7.rebar.AsMinCm2) || 0;
      const AsLong  = parseFloat(fRes7.rebar.AsLongCm2)|| 0;
      const dEff    = parseFloat(fRes7.rebar.d_eff_cm) || 0;
      const Vu_f    = parseFloat(fRes7.Vu)     || 0;
      const phiVc   = parseFloat(fRes7.phi_Vc) || 0;
      const Mu_f    = parseFloat(fRes7.Mu)     || 0;
      const AsSel   = fRebar?.faces?.superior?.AsTotal || 0;
      const cumpleV = Vu_f <= phiVc;
      const fOk     = AsSel >= AsMinT && AsSel >= AsReqT && cumpleV;
      if (!fOk) allOK = false;
      const fTransBars = fRebar?.faces?.superior?.barras?.[0];
      const fTransDesc = fTransBars ? `${fTransBars.cantidad}ø${fTransBars.diámetro}/m` : 'N/D';
      const fPielBars  = fRebar?.faces?.piel?.barras?.[0];
      const fLongDesc  = fPielBars  ? `${fPielBars.cantidad}ø${fPielBars.diámetro}/m`  : 'N/D';
      p7_found = `<tr>
        <td style="text-align:center;">${fmt(Mu_f,2)}</td>
        <td style="text-align:center;">${fmt(Vu_f,2)}</td>
        <td style="text-align:center;color:${cumpleV?'#15803d':'#b91c1c'};">${fmt(phiVc,2)}</td>
        <td style="text-align:center;">${fmt(dEff,1)}</td>
        <td style="text-align:center;">${fmt(AsReqT,2)}</td>
        <td style="text-align:center;">${fmt(AsMinT,2)}</td>
        <td style="text-align:center;font-weight:700;color:${AsSel>=AsMinT?'#15803d':'#b91c1c'};">${fmt(AsSel,2)}</td>
        <td style="text-align:center;">${fTransDesc}</td>
        <td style="text-align:center;">${fLongDesc}</td>
        ${statusCell(fOk)}
      </tr>`;
    }

    html += `
    <div class="pdf-page">
      ${ph(6,'Armadura Recomendada por Elemento','NCh430 Of.2008 · NCh2123 Of.2003 — Verificación Completa')}

      ${secHdrP7('#e8f0fe','①','Pilar de Confinamiento — elemento más crítico',
        `Sección ${S.columns[colEntries7[0]?.[0]]?.section ? ((S.columns[colEntries7[0][0]].section.b*100).toFixed(0)+'×'+(S.columns[colEntries7[0][0]].section.h*100).toFixed(0)+' cm') : '20×25 cm'}`)}
      <table>
        <tr>
          <th>Nodo</th>
          <th style="text-align:center;">As_req (cm²)</th>
          <th style="text-align:center;">As_min (cm²)</th>
          <th style="text-align:center;">As_max (cm²)</th>
          <th style="text-align:center;">As_sel (cm²)</th>
          <th style="text-align:center;">Long.</th>
          <th style="text-align:center;">Estribos</th>
          <th style="text-align:center;">s_sel / s_max</th>
          <th style="text-align:center;">Estado</th>
        </tr>
        ${p7_col}
      </table>
      <div class="note" style="font-size:7.5pt;margin:2px 0 6px 2px;">${p7_col_note}</div>

      ${secHdrP7('#e8f5e9','②','Cadena Superior (Viga de Confinamiento)',
        `Vano más crítico · Sección ${S.spans[0]?.beamTop?.section ? ((S.spans[0].beamTop.section.b*100).toFixed(0)+'×'+(S.spans[0].beamTop.section.h*100).toFixed(0)+' cm') : '20×25 cm'}`)}
      <table>
        <tr>
          <th>Vano</th><th style="text-align:center;">Mu (kN·m)</th><th style="text-align:center;">Vu (kN)</th>
          <th style="text-align:center;">As_req (cm²)</th><th style="text-align:center;">As_min (cm²)</th>
          <th style="text-align:center;">As_sel (cm²)</th><th style="text-align:center;">Long.</th>
          <th style="text-align:center;">Estribos</th><th style="text-align:center;">Estado</th>
        </tr>
        ${p7_bt}
      </table>
      <div class="note" style="font-size:7.5pt;margin:2px 0 6px 2px;">
        NCh2123 §7.7.8 — mínimo 4ø10 en cadenas. Todos los vanos comparten la misma especificación.
      </div>

      ${secHdrP7('#fff8e1','③','Sobrecimiento / Cadena Inferior',
        `Vano más crítico · Sección ${S.spans[0]?.beamBot?.section ? ((S.spans[0].beamBot.section.b*100).toFixed(0)+'×'+(S.spans[0].beamBot.section.h*100).toFixed(0)+' cm') : '15×60 cm'}`)}
      <table>
        <tr>
          <th>Vano</th><th style="text-align:center;">Mu (kN·m)</th><th style="text-align:center;">Vu (kN)</th>
          <th style="text-align:center;">As_req (cm²)</th><th style="text-align:center;">As_min (cm²)</th>
          <th style="text-align:center;">As_sel (cm²)</th><th style="text-align:center;">Long. + piel</th>
          <th style="text-align:center;">Estribos</th><th style="text-align:center;">Estado</th>
        </tr>
        ${p7_bb}
      </table>
      <div class="note" style="font-size:7.5pt;margin:2px 0 6px 2px;">
        Armadura de piel por h ≥ 400 mm — NCh430 §10.6.7. Todos los vanos comparten la misma especificación.
      </div>

      ${secHdrP7('#fce4ec','④','Fundación — Zapata Corrida',
        `B=${parseFloat(fSec7?.B||0.80).toFixed(2)} m · Hf=${parseFloat(fSec7?.Hf||0.60).toFixed(2)} m · Df=${parseFloat(fSec7?.Df||0.85).toFixed(2)} m`)}
      <table>
        <tr>
          <th style="text-align:center;">Mu (kN·m/m)</th><th style="text-align:center;">Vu (kN/m)</th>
          <th style="text-align:center;">φVc (kN/m)</th><th style="text-align:center;">d_ef (cm)</th>
          <th style="text-align:center;">As_req (cm²/m)</th><th style="text-align:center;">As_min (cm²/m)</th>
          <th style="text-align:center;">As_sel (cm²/m)</th>
          <th style="text-align:center;">Transv.</th><th style="text-align:center;">Long.</th>
          <th style="text-align:center;">Estado</th>
        </tr>
        ${p7_found}
      </table>
      <div class="note" style="font-size:7.5pt;margin:2px 0 6px 2px;">
        Acero long. = temperatura y contracción ρ=0.0018 — NCh430 §7.12. Verificación corte simple (Vu ≤ φVc).
      </div>

      <h2 style="margin-top:8px;">6.2 Conclusión General</h2>
      <div class="box" style="border-left:4px solid ${allOK?'#15803d':'#b91c1c'};">
        ${allOK
          ? '<strong style="color:#15803d;">✓ DISEÑO CONFORME — NCh430 / NCh2123</strong> — Todos los elementos verifican armadura mínima, máxima y espaciamiento de estribos. Cálculo incluye combinaciones con cargas laterales (sismo + viento, NCh433/NCh432).'
          : '<strong style="color:#b91c1c;">✗ INCUMPLIMIENTOS DETECTADOS</strong> — Revisar elementos marcados. Las armaduras seleccionadas no cumplen los requisitos normativos para las cargas de diseño. Se requiere rediseño.'}
      </div>

      <div class="note" style="font-size:7.5pt;line-height:1.7;margin-top:6px;">
        • NCh430 Of.2008 — Hormigón armado (ACI 318-19) &nbsp;•&nbsp; NCh2123 Of.2003 — Albañilería confinada
        &nbsp;•&nbsp; NCh433 Of.2009 / D.S.61 — Sísmico &nbsp;•&nbsp; NCh432 Of.2010 — Viento &nbsp;•&nbsp; NCh3171 Of.2003 — Combinaciones
      </div>

      ${footer(7)}
    </div>`;

    return html;
  }
};

window.MemoryReportCalc = MemoryReportCalc;
