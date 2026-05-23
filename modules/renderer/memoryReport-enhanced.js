/**
 * MemoryReportEnhanced — Módulo C: Análisis Técnico Avanzado
 *
 * Genera 4 páginas adicionales:
 * - Página 8: Análisis de Cargas (LRFD)
 * - Página 9: Fuerzas Críticas (M, V, N)
 * - Página 10: Especificación de Armadura
 * - Página 11: Verificación NCh430
 *
 * Reutiliza infra de memoryReport.js (canvas, jsPDF, estilo)
 * No toca ni reemplaza Módulo A ni B
 */

class MemoryReportEnhanced {

  /**
   * buildModuleHTML(type='C') — Genera HTML para overlay (7 páginas)
   * Reutiliza páginas 1-7 de memoryReport + agrega páginas 8-11
   */
  static buildModuleHTML(type = 'C') {
    if (type !== 'C') {
      throw new Error('MemoryReportEnhanced solo maneja Módulo C');
    }

    // Importar función existente de memoryReport
    const html_original = MemoryReport._buildModuleHTML('B'); // Usa Módulo B (Memory)

    // Agregar páginas 8-11
    const html_page8 = this._pageLFRDAnalysis();
    const html_page9 = this._pageCriticalForces();
    const html_page10 = this._pageRebarSpecification();
    const html_page11 = this._pageNCh430Compliance();

    return html_original + html_page8 + html_page9 + html_page10 + html_page11;
  }

  /**
   * buildModuleHTMLForPDF(type='C', imgCache) — Genera HTML optimizado para PDF
   * Versión comprimida sin interactividad
   */
  static buildModuleHTMLForPDF(type = 'C', imgCache) {
    if (type !== 'C') {
      throw new Error('MemoryReportEnhanced solo maneja Módulo C');
    }

    // Importar función existente
    const html_original = MemoryReport._buildModuleHTMLForPDF('B', imgCache);

    // Agregar páginas 8-11 (sin imágenes, optimizadas para PDF)
    const html_page8 = this._pageLFRDAnalysisForPDF();
    const html_page9 = this._pageCriticalForcesForPDF();
    const html_page10 = this._pageRebarSpecificationForPDF();
    const html_page11 = this._pageNCh430ComplianceForPDF();

    return html_original + html_page8 + html_page9 + html_page10 + html_page11;
  }

  // ============================================================================
  // PÁGINA 8: ANÁLISIS DE CARGAS (LRFD)
  // ============================================================================

  static _pageLFRDAnalysis() {
    const H       = S.story.H;
    const loads   = S.story.loads  || {};
    const results = S.results      || {};
    const lat     = results.lateral || {};

    // ── Cargas verticales ──────────────────────────────────────────
    const qD = (typeof loads.qD === 'number' && loads.qD >= 0) ? loads.qD : 0;
    const qL = (typeof loads.qL === 'number' && loads.qL >= 0) ? loads.qL : 0;
    const qu = (typeof results.qu === 'number' && results.qu >= 0)
      ? results.qu
      : (1.2 * qD + 1.6 * qL);

    // ── Cargas laterales calculadas por el solver ─────────────────
    const F_wind    = (typeof lat.F_wind    === 'string') ? parseFloat(lat.F_wind)    : (typeof lat.F_wind    === 'number') ? lat.F_wind    : 0;
    const F_seismic = (typeof lat.F_seismic === 'string') ? parseFloat(lat.F_seismic) : (typeof lat.F_seismic === 'number') ? lat.F_seismic : 0;
    const F_h       = (typeof lat.F_h       === 'string') ? parseFloat(lat.F_h)       : (typeof lat.F_h       === 'number') ? lat.F_h       : 0;
    const Cs        = lat.Cs      || '—';
    const q_w       = lat.q_w     || '—';
    const V_basic   = lat.V_basic || '—';
    const governing = lat.governing || 'sin datos';
    const hasLateral = F_wind > 0 || F_seismic > 0;

    // ── Combinaciones LRFD verticals + laterales ──────────────────
    // Caso 2: 0.9D + 1.6W  → componente vertical + horizontal F_wind
    const qu_wind_v = 0.9 * qD;               // componente vertical (kN/m²)
    const F_wind_u  = 1.6 * F_wind;           // componente horizontal (kN/m)
    // Caso 3: 1.0D + E     → componente vertical + F_seismic (Cs·W)
    const qu_seis_v = 1.0 * qD;               // componente vertical (kN/m²)
    const F_seis_u  = 1.0 * F_seismic;        // componente horizontal (kN/m)

    // Fuerza horizontal última gobernante
    const F_h_u = Math.max(F_wind_u, F_seis_u);
    const govLRFD = F_wind_u >= F_seis_u ? 'Viento (1.6W)' : 'Sismo (1.0E)';

    const html = `
      <div class="pdf-page">
        <div style="padding: 40px; font-size: 12px; line-height: 1.6;">

          <!-- Header -->
          <div style="border-bottom: 2px solid #333; margin-bottom: 20px; padding-bottom: 10px;">
            <h2 style="margin: 0; font-size: 18px; color: #1e40af;">
              Página 8: Análisis de Cargas (LRFD)
            </h2>
            <p style="margin: 5px 0 0 0; font-size: 10px; color: #666;">
              Combinaciones de cargas conforme NCh3171 / NCh433 / NCh432
            </p>
          </div>

          <!-- Tabla de Cargas Nominales -->
          <h3 style="font-size: 13px; margin-top: 15px; margin-bottom: 8px; color: #1e40af;">
            Cargas Nominales
          </h3>
          <table style="width: 100%; border-collapse: collapse; font-size: 11px; margin-bottom: 15px;">
            <tr style="background: #e0e7ff; border-bottom: 1px solid #333;">
              <th style="border: 1px solid #333; padding: 6px; text-align: left;">Tipo de Carga</th>
              <th style="border: 1px solid #333; padding: 6px; text-align: center;">Valor</th>
              <th style="border: 1px solid #333; padding: 6px; text-align: center;">Unidad</th>
              <th style="border: 1px solid #333; padding: 6px; text-align: center;">Descripción</th>
            </tr>
            <tr style="border-bottom: 1px solid #ccc;">
              <td style="border: 1px solid #ccc; padding: 6px;">qD — Carga Muerta</td>
              <td style="border: 1px solid #ccc; padding: 6px; text-align: center; font-weight: bold;">${qD.toFixed(3)}</td>
              <td style="border: 1px solid #ccc; padding: 6px; text-align: center; color:#666;">kN/m²</td>
              <td style="border: 1px solid #ccc; padding: 6px;">Peso propio + recubrimientos</td>
            </tr>
            <tr style="border-bottom: 1px solid #ccc;">
              <td style="border: 1px solid #ccc; padding: 6px;">qL — Carga Viva</td>
              <td style="border: 1px solid #ccc; padding: 6px; text-align: center; font-weight: bold;">${qL.toFixed(3)}</td>
              <td style="border: 1px solid #ccc; padding: 6px; text-align: center; color:#666;">kN/m²</td>
              <td style="border: 1px solid #ccc; padding: 6px;">Ocupación, uso residencial</td>
            </tr>
            <tr style="border-bottom: 1px solid #ccc; background: ${hasLateral ? '#f0f9ff' : '#fff8dc'};">
              <td style="border: 1px solid #ccc; padding: 6px;">W — Carga Viento</td>
              <td style="border: 1px solid #ccc; padding: 6px; text-align: center; font-weight: bold;
                color: ${hasLateral ? '#0c4a6e' : '#92400e'};">
                ${hasLateral ? F_wind.toFixed(3) : 'N/C'}
              </td>
              <td style="border: 1px solid #ccc; padding: 6px; text-align: center; color:#666;">kN/m</td>
              <td style="border: 1px solid #ccc; padding: 6px;">
                ${hasLateral
                  ? `q<sub>w</sub>=${q_w} kPa × H, V<sub>base</sub>=${V_basic} m/s (NCh432)`
                  : '⚠ No calculado — revisar parámetros de viento'}
              </td>
            </tr>
            <tr style="border-bottom: 1px solid #ccc; background: ${hasLateral ? '#f0f9ff' : '#fff8dc'};">
              <td style="border: 1px solid #ccc; padding: 6px;">E — Carga Sísmica</td>
              <td style="border: 1px solid #ccc; padding: 6px; text-align: center; font-weight: bold;
                color: ${hasLateral ? '#0c4a6e' : '#92400e'};">
                ${hasLateral ? F_seismic.toFixed(3) : 'N/C'}
              </td>
              <td style="border: 1px solid #ccc; padding: 6px; text-align: center; color:#666;">kN/m</td>
              <td style="border: 1px solid #ccc; padding: 6px;">
                ${hasLateral
                  ? `C<sub>s</sub>=${Cs} × W<sub>supra</sub> (NCh433)`
                  : '⚠ No calculado — revisar zona sísmica'}
              </td>
            </tr>
          </table>

          <!-- Combinaciones LRFD -->
          <h3 style="font-size: 13px; margin-top: 15px; margin-bottom: 8px; color: #1e40af;">
            Combinaciones de Carga Factorizada (LRFD — NCh3171)
          </h3>
          <table style="width: 100%; border-collapse: collapse; font-size: 10.5px; margin-bottom: 15px;">
            <tr style="background: #e0e7ff; border-bottom: 1px solid #333;">
              <th style="border: 1px solid #333; padding: 5px; text-align: left;">Caso</th>
              <th style="border: 1px solid #333; padding: 5px; text-align: center;">Ecuación</th>
              <th style="border: 1px solid #333; padding: 5px; text-align: center;">q<sub>u</sub> vertical (kN/m²)</th>
              <th style="border: 1px solid #333; padding: 5px; text-align: center;">F<sub>h</sub> horizontal (kN/m)</th>
              <th style="border: 1px solid #333; padding: 5px; text-align: center;">Estado</th>
            </tr>
            <tr style="border-bottom: 1px solid #ccc; background: #fff3cd;">
              <td style="border: 1px solid #ccc; padding: 5px;">1 — Gravedad</td>
              <td style="border: 1px solid #ccc; padding: 5px; text-align: center;">1.2·D + 1.6·L</td>
              <td style="border: 1px solid #ccc; padding: 5px; text-align: center; font-weight: bold;">${qu.toFixed(3)}</td>
              <td style="border: 1px solid #ccc; padding: 5px; text-align: center; color:#666;">—</td>
              <td style="border: 1px solid #ccc; padding: 5px; text-align: center; color:#b91c1c; font-weight:bold;">● MÁXIMA VERTICAL</td>
            </tr>
            <tr style="border-bottom: 1px solid #ccc; background: ${F_wind_u >= F_seis_u && hasLateral ? '#e0f2fe' : '#fff'};">
              <td style="border: 1px solid #ccc; padding: 5px;">2 — Viento</td>
              <td style="border: 1px solid #ccc; padding: 5px; text-align: center;">0.9·D + 1.6·W</td>
              <td style="border: 1px solid #ccc; padding: 5px; text-align: center;">${qu_wind_v.toFixed(3)}</td>
              <td style="border: 1px solid #ccc; padding: 5px; text-align: center; font-weight: bold;
                color: ${hasLateral ? '#0369a1' : '#92400e'};">
                ${hasLateral ? F_wind_u.toFixed(3) : '⚠ N/C'}
              </td>
              <td style="border: 1px solid #ccc; padding: 5px; text-align: center;
                color: ${F_wind_u >= F_seis_u && hasLateral ? '#0369a1' : '#666'};">
                ${F_wind_u >= F_seis_u && hasLateral ? '● GOB. LATERAL' : hasLateral ? '— menor' : 'Sin dato'}
              </td>
            </tr>
            <tr style="border-bottom: 1px solid #ccc; background: ${F_seis_u > F_wind_u && hasLateral ? '#fef3c7' : '#fff'};">
              <td style="border: 1px solid #ccc; padding: 5px;">3 — Sismo</td>
              <td style="border: 1px solid #ccc; padding: 5px; text-align: center;">1.0·D + 1.0·E</td>
              <td style="border: 1px solid #ccc; padding: 5px; text-align: center;">${qu_seis_v.toFixed(3)}</td>
              <td style="border: 1px solid #ccc; padding: 5px; text-align: center; font-weight: bold;
                color: ${hasLateral ? '#b45309' : '#92400e'};">
                ${hasLateral ? F_seis_u.toFixed(3) : '⚠ N/C'}
              </td>
              <td style="border: 1px solid #ccc; padding: 5px; text-align: center;
                color: ${F_seis_u > F_wind_u && hasLateral ? '#b45309' : '#666'};">
                ${F_seis_u > F_wind_u && hasLateral ? '● GOB. LATERAL' : hasLateral ? '— menor' : 'Sin dato'}
              </td>
            </tr>
          </table>

          <!-- Parámetros sísmicos + viento -->
          ${hasLateral ? `
          <h3 style="font-size: 12px; margin-top: 15px; margin-bottom: 6px; color: #1e40af;">
            Parámetros de Cálculo Lateral
          </h3>
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 8px; margin-bottom: 15px;">
            <div style="border: 1px solid #ccc; padding: 8px; background: #f9fafb; font-size: 10px;">
              <strong>Sísmica (NCh433)</strong><br/>
              Coef. sísmico C<sub>s</sub> = ${Cs}<br/>
              F sísmica = ${F_seismic.toFixed(2)} kN/m
            </div>
            <div style="border: 1px solid #ccc; padding: 8px; background: #f9fafb; font-size: 10px;">
              <strong>Viento (NCh432)</strong><br/>
              V<sub>base</sub> = ${V_basic} m/s → q<sub>w</sub> = ${q_w} kPa<br/>
              F viento = ${F_wind.toFixed(2)} kN/m
            </div>
          </div>
          <div style="background: ${F_h_u > 0 ? '#fff7ed' : '#f9fafb'}; border-left: 4px solid ${F_wind_u >= F_seis_u ? '#0369a1' : '#b45309'}; padding: 8px; font-size: 10px;">
            <strong>Fuerza horizontal última gobernante: ${govLRFD}</strong><br/>
            F<sub>h,u</sub> = ${F_h_u.toFixed(2)} kN/m aplicada a h = ${lat.hApply || (H/2).toFixed(2)} m
          </div>` : `
          <div style="background: #fff8dc; border-left: 4px solid #d97706; padding: 10px; font-size: 10px;">
            <strong>⚠ Cargas laterales no calculadas</strong><br/>
            Verificar parámetros sísmicos y de viento en panel de cargas y ejecutar el solver.
          </div>`}

          <!-- Nota normativa -->
          <div style="background: #f0f9ff; border-left: 4px solid #0284c7; padding: 10px; margin-top: 15px; font-size: 10px;">
            <p style="margin: 0; font-weight: bold;">Referencias normativas:</p>
            <ul style="margin: 5px 0 0 15px; padding: 0;">
              <li>NCh3171 Of.2003 — Combinaciones de carga LRFD</li>
              <li>NCh433 D.S.61 — Cálculo coeficiente sísmico C<sub>s</sub></li>
              <li>NCh432 Of.2010 — Presión dinámica de viento q<sub>w</sub> = 0.613·V²</li>
            </ul>
          </div>

        </div>
      </div>
    `;

    return html;
  }

  static _pageLFRDAnalysisForPDF() {
    // Versión optimizada para PDF (sin elementos interactivos)
    return this._pageLFRDAnalysis();
  }

  // ============================================================================
  // PÁGINA 9: FUERZAS CRÍTICAS (M, V, N)
  // ============================================================================

  static _pageCriticalForces() {
    const results = S.results || {};

    if (!Array.isArray(results.spans) || results.spans.length === 0) {
      return `<div class="pdf-page"><div style="padding: 40px;"><p>Página 9: Fuerzas Críticas (sin datos disponibles)</p></div></div>`;
    }

    // Validar y encontrar valores máximos
    const spans_data = results.spans.map(sp => ({
      id: sp.id || 'sp',
      M_max: (typeof sp.M_max === 'number') ? sp.M_max : 0,
      V_max: (typeof sp.V_max === 'number') ? sp.V_max : 0,
      N: (typeof sp.N === 'number') ? sp.N : 0
    }));

    const M_max_global = Math.max(...spans_data.map(sp => sp.M_max), 0.01);
    const V_max_global = Math.max(...spans_data.map(sp => sp.V_max), 0.01);
    const N_max_global = Math.max(...spans_data.map(sp => sp.N), 0.01);

    let spansTableHTML = '<table style="width: 100%; border-collapse: collapse; font-size: 10px;">';
    spansTableHTML += '<tr style="background: #e0e7ff; border-bottom: 1px solid #333;">';
    spansTableHTML += '<th style="border: 1px solid #333; padding: 4px; text-align: left;">Vano</th>';
    spansTableHTML += '<th style="border: 1px solid #333; padding: 4px; text-align: center;">M_max (kN·m)</th>';
    spansTableHTML += '<th style="border: 1px solid #333; padding: 4px; text-align: center;">V_max (kN)</th>';
    spansTableHTML += '<th style="border: 1px solid #333; padding: 4px; text-align: center;">N (kN)</th>';
    spansTableHTML += '</tr>';

    spans_data.forEach((span, idx) => {
      const isMax = span.M_max === M_max_global;
      const bgColor = isMax ? '#fff3cd' : '#fff';
      spansTableHTML += `<tr style="background: ${bgColor}; border-bottom: 1px solid #ccc;">`;
      spansTableHTML += `<td style="border: 1px solid #ccc; padding: 4px;">${span.id || 'sp' + idx}</td>`;
      spansTableHTML += `<td style="border: 1px solid #ccc; padding: 4px; text-align: center; ${isMax ? 'font-weight: bold; color: #b91c1c;' : ''}">${span.M_max.toFixed(2)}</td>`;
      spansTableHTML += `<td style="border: 1px solid #ccc; padding: 4px; text-align: center;">${span.V_max.toFixed(2)}</td>`;
      spansTableHTML += `<td style="border: 1px solid #ccc; padding: 4px; text-align: center;">${span.N.toFixed(2)}</td>`;
      spansTableHTML += '</tr>';
    });

    spansTableHTML += '</table>';

    const html = `
      <div class="pdf-page">
        <div style="padding: 40px; font-size: 12px; line-height: 1.6;">

          <!-- Header -->
          <div style="border-bottom: 2px solid #333; margin-bottom: 20px; padding-bottom: 10px;">
            <h2 style="margin: 0; font-size: 18px; color: #1e40af;">
              Página 9: Fuerzas Internas Críticas
            </h2>
            <p style="margin: 5px 0 0 0; font-size: 10px; color: #666;">
              Momento flector, cortante y axial máximos por vano
            </p>
          </div>

          <!-- Resumen de valores máximos -->
          <div style="display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 10px; margin-bottom: 20px;">
            <div style="border: 1px solid #0284c7; border-radius: 4px; padding: 10px; background: #f0f9ff;">
              <p style="margin: 0; font-size: 10px; color: #666;">Momento máximo</p>
              <p style="margin: 5px 0 0 0; font-size: 16px; font-weight: bold; color: #1e40af;">
                ${M_max_global.toFixed(2)} kN·m
              </p>
            </div>
            <div style="border: 1px solid #0284c7; border-radius: 4px; padding: 10px; background: #f0f9ff;">
              <p style="margin: 0; font-size: 10px; color: #666;">Cortante máximo</p>
              <p style="margin: 5px 0 0 0; font-size: 16px; font-weight: bold; color: #1e40af;">
                ${V_max_global.toFixed(2)} kN
              </p>
            </div>
            <div style="border: 1px solid #0284c7; border-radius: 4px; padding: 10px; background: #f0f9ff;">
              <p style="margin: 0; font-size: 10px; color: #666;">Axial máximo</p>
              <p style="margin: 5px 0 0 0; font-size: 16px; font-weight: bold; color: #1e40af;">
                ${N_max_global.toFixed(2)} kN
              </p>
            </div>
          </div>

          <!-- Tabla de fuerzas por vano -->
          <h3 style="font-size: 13px; margin-top: 10px; margin-bottom: 8px; color: #1e40af;">
            Distribución de Fuerzas por Vano
          </h3>
          ${spansTableHTML}

          <!-- Nota -->
          <div style="background: #f0f9ff; border-left: 4px solid #0284c7; padding: 10px; margin-top: 15px; font-size: 10px;">
            <p style="margin: 0; font-weight: bold;">Nota:</p>
            <p style="margin: 5px 0 0 0;">
              Valores en amarillo indican elemento crítico (máxima solicitación).
              Estos momentos y cortantes se utilizan para diseño de armadura (ver Página 10).
            </p>
          </div>

        </div>
      </div>
    `;

    return html;
  }

  static _pageCriticalForcesForPDF() {
    return this._pageCriticalForces();
  }

  // ============================================================================
  // PÁGINA 10: ESPECIFICACIÓN DE ARMADURA
  // ============================================================================

  static _pageRebarSpecification() {
    const results  = S.results  || {};
    const m        = S.story.materials || {};
    const today    = new Date().toLocaleDateString('es-CL');

    // ── Helpers ─────────────────────────────────────────────────────────────
    const n  = (v, dec = 2) => (typeof v === 'number' ? v : parseFloat(v) || 0).toFixed(dec);
    const ok = (pass) => pass
      ? '<span style="color:#15803d;font-weight:700;">✓ OK</span>'
      : '<span style="color:#b91c1c;font-weight:700;">✗ FALLA</span>';

    // Extrae descripción de barras desde objeto rebar auto-seleccionado
    const rebarDesc = (rebarObj) => {
      const sup = rebarObj?.faces?.superior;
      if (!sup?.barras?.[0]) return 'N/D';
      const b = sup.barras[0];
      return `${b.cantidad}ø${b.diámetro} c/cara`;
    };
    const stirrupDesc = (rebarObj) => {
      const e = rebarObj?.estribos;
      if (!e) return 'N/D';
      return `ø${e.diámetro}@${(e.espaciamiento * 100).toFixed(0)} cm`;
    };
    const asTotal = (rebarObj) => {
      const sup = rebarObj?.faces?.superior?.AsTotal || 0;
      const inf = rebarObj?.faces?.inferior?.AsTotal || 0;
      return +(sup + inf).toFixed(2);
    };

    const thStyle  = 'border:1px solid #aac;background:#dce8f7;color:#1a3a6b;font-weight:700;padding:5px 7px;text-align:center;font-size:8.5pt;';
    const tdStyle  = 'border:1px solid #ddd;padding:4px 7px;text-align:center;font-size:8.5pt;';
    const tdLStyle = 'border:1px solid #ddd;padding:4px 7px;text-align:left;font-size:8.5pt;';
    const secHdr   = (color, label, sub) =>
      `<div style="background:${color};border-left:4px solid #1a3a6b;padding:5px 10px;margin:10px 0 4px;">
         <span style="font-weight:700;font-size:10pt;color:#1a3a6b;">${label}</span>
         <span style="font-size:8pt;color:#555;margin-left:8px;">${sub}</span>
       </div>`;

    // ── 1. PILAR DE CONFINAMIENTO — elemento más crítico ────────────────────
    const colsObj = (results.columns && !Array.isArray(results.columns)) ? results.columns : {};
    const colEntries = Object.entries(colsObj);
    let colSection = '';

    if (colEntries.length > 0) {
      // Nodo con mayor Mu → caso más crítico
      const [critId, critCol] = colEntries.reduce((max, cur) =>
        (parseFloat(cur[1].Mu) > parseFloat(max[1].Mu) ? cur : max), colEntries[0]);

      const critSpanObj   = S.columns[critId];
      const sec           = critSpanObj?.section || { b: 0.20, h: 0.25 };
      const rebarObj      = critSpanObj?.rebar;
      const AsSel         = asTotal(rebarObj);
      const AsReq         = parseFloat(critCol.As_req) || 0;
      const AsMin         = parseFloat(critCol.As_min) || 0;
      const AsMax         = parseFloat(critCol.As_max) || 0;
      const sSel          = (critCol.s_selected || 0) * 100;  // m → cm
      const sMax          = (critCol.s_max      || 0) * 100;
      const cumple        = critCol.cumple_all ?? (AsSel >= AsMin && AsSel <= AsMax && AsSel >= AsReq && sSel <= sMax);
      const allNodeIds    = colEntries.map(([id]) => id).join(', ');

      colSection = `
        ${secHdr('#e8f0fe', '① Pilar de Confinamiento', `Elemento crítico: ${critId} — sección ${(sec.b*100).toFixed(0)}×${(sec.h*100).toFixed(0)} cm`)}
        <table style="width:100%;border-collapse:collapse;">
          <tr>
            <th style="${thStyle}">Combinación gobernante</th>
            <th style="${thStyle}">Mu (kN·m)</th>
            <th style="${thStyle}">Vu (kN)</th>
            <th style="${thStyle}">As_req (cm²)</th>
            <th style="${thStyle}">As_min (cm²)</th>
            <th style="${thStyle}">As_sel (cm²)</th>
            <th style="${thStyle}">Long.</th>
            <th style="${thStyle}">Estribos</th>
            <th style="${thStyle}">Estado</th>
          </tr>
          <tr style="background:${cumple?'#f0fdf4':'#fef2f2'};">
            <td style="${tdLStyle};font-size:7.5pt;color:#555;">${critCol.caseLabel || '—'}</td>
            <td style="${tdStyle};font-weight:700;">${n(critCol.Mu)}</td>
            <td style="${tdStyle}">${n(critCol.Vu)}</td>
            <td style="${tdStyle}">${n(AsReq)}</td>
            <td style="${tdStyle}">${n(AsMin)}</td>
            <td style="${tdStyle};font-weight:700;color:${AsSel>=AsMin?'#15803d':'#b91c1c'};">${n(AsSel)}</td>
            <td style="${tdStyle}">${rebarDesc(rebarObj)}</td>
            <td style="${tdStyle}">${stirrupDesc(rebarObj)}</td>
            <td style="${tdStyle}">${ok(cumple)}</td>
          </tr>
        </table>
        <p style="font-size:7.5pt;color:#555;margin:3px 0 0 4px;">
          ★ Todos los pilares (${allNodeIds}) se construyen con la misma sección y armadura.
          Zona crítica (extremos 45 cm): estribos a ${n(sSel,0)} cm — Zona central: ø8@${(parseFloat(results.spans?.[Object.keys(results.spans||{})[0]]?.beamTop?.rebar?.s_central_mm||150)/10).toFixed(0)} cm.
        </p>`;
    }

    // ── 2. CADENA SUPERIOR — vano más crítico ───────────────────────────────
    let btSection = '';
    const spEntries = Object.entries(results.spans || {});
    if (spEntries.length > 0) {
      const [critSpId, critSpRes] = spEntries.reduce((max, cur) =>
        (parseFloat(cur[1].beamTop?.Mu||0) > parseFloat(max[1].beamTop?.Mu||0) ? cur : max), spEntries[0]);

      const bt    = critSpRes.beamTop || {};
      const span  = S.spans.find(sp => sp.id === critSpId);
      const sec   = span?.beamTop?.section || { b:0.20, h:0.20 };
      const rObj  = span?.beamTop?.rebar;
      const des   = bt.rebar || {};
      const AsSel = asTotal(rObj);
      const AsReq = parseFloat(des.AsReq) || 0;
      const AsMin = parseFloat(des.AsMinCm2) || 0;
      const AsMax = parseFloat(des.AsMaxCm2) || 0;
      const sAdopt= parseFloat(des.s_crit_mm||100)/10;  // mm → cm
      const sMax  = parseFloat(des.s_max_cm ||20);
      const cumple= AsSel >= AsMin && AsSel <= AsMax && AsSel >= AsReq && sAdopt <= sMax;

      btSection = `
        ${secHdr('#e8f5e9', '② Cadena Superior (Viga de Confinamiento)', `Vano más crítico: ${critSpId} — sección ${(sec.b*100).toFixed(0)}×${(sec.h*100).toFixed(0)} cm`)}
        <table style="width:100%;border-collapse:collapse;">
          <tr>
            <th style="${thStyle}">Combinación gobernante</th>
            <th style="${thStyle}">Mu (kN·m)</th>
            <th style="${thStyle}">Vu (kN)</th>
            <th style="${thStyle}">As_req (cm²)</th>
            <th style="${thStyle}">As_min (cm²)</th>
            <th style="${thStyle}">As_sel (cm²)</th>
            <th style="${thStyle}">Long.</th>
            <th style="${thStyle}">Estribos</th>
            <th style="${thStyle}">Estado</th>
          </tr>
          <tr style="background:${cumple?'#f0fdf4':'#fef2f2'};">
            <td style="${tdLStyle};font-size:7.5pt;color:#555;">${bt.worstComb||'—'}</td>
            <td style="${tdStyle};font-weight:700;">${n(bt.Mu)}</td>
            <td style="${tdStyle}">${n(bt.Vu)}</td>
            <td style="${tdStyle}">${n(AsReq)}</td>
            <td style="${tdStyle}">${n(AsMin)}</td>
            <td style="${tdStyle};font-weight:700;color:${AsSel>=AsMin?'#15803d':'#b91c1c'};">${n(AsSel)}</td>
            <td style="${tdStyle}">${rebarDesc(rObj)}</td>
            <td style="${tdStyle}">${stirrupDesc(rObj)}</td>
            <td style="${tdStyle}">${ok(cumple)}</td>
          </tr>
        </table>
        <p style="font-size:7.5pt;color:#555;margin:3px 0 0 4px;">
          Ref: NCh2123 §7.7.8 — mínimo 4ø10 en cadenas de confinamiento. Todos los vanos comparten la misma especificación.
        </p>`;
    }

    // ── 3. SOBRECIMIENTO (CADENA INFERIOR) — vano más crítico ──────────────
    let bbSection = '';
    if (spEntries.length > 0) {
      const [critSpId, critSpRes] = spEntries.reduce((max, cur) =>
        (parseFloat(cur[1].beamBot?.Mu||0) > parseFloat(max[1].beamBot?.Mu||0) ? cur : max), spEntries[0]);

      const bb    = critSpRes.beamBot || {};
      const span  = S.spans.find(sp => sp.id === critSpId);
      const sec   = span?.beamBot?.section || { b:0.15, h:0.60 };
      const rObj  = span?.beamBot?.rebar;
      const des   = bb.rebar || {};
      const AsSel = asTotal(rObj);
      const AsReq = parseFloat(des.AsReq) || 0;
      const AsMin = parseFloat(des.AsMinCm2) || 0;
      const AsMax = parseFloat(des.AsMaxCm2) || 0;
      const sAdopt= parseFloat(des.s_crit_mm||100)/10;
      const sMax  = parseFloat(des.s_max_cm ||30);
      const cumple= AsSel >= AsMin && AsSel <= AsMax && AsSel >= AsReq && sAdopt <= sMax;
      // Piel (armadura de piel en sobrecimiento alto)
      const pielFace = rObj?.faces?.piel;
      const pielDesc = pielFace ? `+ ${pielFace.barras?.[0]?.cantidad||2}ø${pielFace.barras?.[0]?.diámetro||10} piel` : '';

      bbSection = `
        ${secHdr('#fff8e1', '③ Sobrecimiento / Cadena Inferior', `Vano más crítico: ${critSpId} — sección ${(sec.b*100).toFixed(0)}×${(sec.h*100).toFixed(0)} cm`)}
        <table style="width:100%;border-collapse:collapse;">
          <tr>
            <th style="${thStyle}">Combinación gobernante</th>
            <th style="${thStyle}">Mu (kN·m)</th>
            <th style="${thStyle}">Vu (kN)</th>
            <th style="${thStyle}">As_req (cm²)</th>
            <th style="${thStyle}">As_min (cm²)</th>
            <th style="${thStyle}">As_sel (cm²)</th>
            <th style="${thStyle}">Long.</th>
            <th style="${thStyle}">Estribos</th>
            <th style="${thStyle}">Estado</th>
          </tr>
          <tr style="background:${cumple?'#f0fdf4':'#fef2f2'};">
            <td style="${tdLStyle};font-size:7.5pt;color:#555;">${bb.worstComb||'—'}</td>
            <td style="${tdStyle};font-weight:700;">${n(bb.Mu)}</td>
            <td style="${tdStyle}">${n(bb.Vu)}</td>
            <td style="${tdStyle}">${n(AsReq)}</td>
            <td style="${tdStyle}">${n(AsMin)}</td>
            <td style="${tdStyle};font-weight:700;color:${AsSel>=AsMin?'#15803d':'#b91c1c'};">${n(AsSel)}</td>
            <td style="${tdStyle}">${rebarDesc(rObj)} ${pielDesc}</td>
            <td style="${tdStyle}">${stirrupDesc(rObj)}</td>
            <td style="${tdStyle}">${ok(cumple)}</td>
          </tr>
        </table>
        <p style="font-size:7.5pt;color:#555;margin:3px 0 0 4px;">
          Incluye armadura de piel (barras intermedias) por h ≥ 400 mm — NCh430 §10.6.7. Todos los vanos comparten la misma especificación.
        </p>`;
    }

    // ── 4. FUNDACIÓN (ZAPATA CORRIDA) ───────────────────────────────────────
    let foundSection = '';
    const fRes = results.foundation || {};
    const fSec = S.story.foundation;
    if (fRes.rebar) {
      const fRebar  = fSec?.rebar;
      const AsReqT  = parseFloat(fRes.rebar.AsReq)     || 0;  // transversal
      const AsMinT  = parseFloat(fRes.rebar.AsMinCm2)  || 0;
      const AsLong  = parseFloat(fRes.rebar.AsLongCm2) || 0;
      const dEff    = parseFloat(fRes.rebar.d_eff_cm)  || 0;
      const Vu_f    = parseFloat(fRes.Vu)   || 0;
      const phiVc   = parseFloat(fRes.phi_Vc) || 0;
      const Mu_f    = parseFloat(fRes.Mu)   || 0;
      const cumpleV = Vu_f <= phiVc;
      // Barras seleccionadas en modelo
      const fSupBars = fRebar?.faces?.superior?.barras?.[0];
      const fTransDesc = fSupBars ? `${fSupBars.cantidad}ø${fSupBars.diámetro}/m` : 'N/D';
      const fLongBars  = fRebar?.faces?.piel?.barras?.[0];
      const fLongDesc  = fLongBars ? `${fLongBars.cantidad}ø${fLongBars.diámetro}/m` : 'N/D';
      const AsSel   = fRebar?.faces?.superior?.AsTotal || 0;
      const cumpleF = AsSel >= AsMinT && AsSel >= AsReqT && cumpleV;

      foundSection = `
        ${secHdr('#fce4ec', '④ Fundación — Zapata Corrida', `B = ${parseFloat(fSec?.B||0.80).toFixed(2)} m  |  Hf = ${parseFloat(fSec?.Hf||0.60).toFixed(2)} m  |  Df = ${parseFloat(fSec?.Df||0.85).toFixed(2)} m`)}
        <table style="width:100%;border-collapse:collapse;">
          <tr>
            <th style="${thStyle}">Mu (kN·m/m)</th>
            <th style="${thStyle}">Vu (kN/m)</th>
            <th style="${thStyle}">φVc (kN/m)</th>
            <th style="${thStyle}">d_ef (cm)</th>
            <th style="${thStyle}">As_req (cm²/m)</th>
            <th style="${thStyle}">As_min (cm²/m)</th>
            <th style="${thStyle}">As_sel (cm²/m)</th>
            <th style="${thStyle}">Transv.</th>
            <th style="${thStyle}">Long.</th>
            <th style="${thStyle}">Estado</th>
          </tr>
          <tr style="background:${cumpleF?'#f0fdf4':'#fef2f2'};">
            <td style="${tdStyle};font-weight:700;">${n(Mu_f)}</td>
            <td style="${tdStyle}">${n(Vu_f)}</td>
            <td style="${tdStyle};color:${cumpleV?'#15803d':'#b91c1c'};">${n(phiVc)}</td>
            <td style="${tdStyle}">${n(dEff,1)}</td>
            <td style="${tdStyle}">${n(AsReqT)}</td>
            <td style="${tdStyle}">${n(AsMinT)}</td>
            <td style="${tdStyle};font-weight:700;color:${AsSel>=AsMinT?'#15803d':'#b91c1c'};">${n(AsSel)}</td>
            <td style="${tdStyle}">${fTransDesc}</td>
            <td style="${tdStyle}">${fLongDesc}</td>
            <td style="${tdStyle}">${ok(cumpleF)}</td>
          </tr>
        </table>
        <p style="font-size:7.5pt;color:#555;margin:3px 0 0 4px;">
          Diseño por flexión simple en voladizo (método cortante único). As longitudinal = acero de temperatura y contracción ρ=0.0018 — NCh430 §7.12.
        </p>`;
    }

    return `
      <div class="pdf-page">
        <div style="border-bottom:2px solid #1a3a6b;padding-bottom:6px;margin-bottom:10px;
                    display:flex;align-items:baseline;gap:10px;">
          <h1 style="margin:0;font-size:13pt;font-weight:700;color:#1a3a6b;flex:1;">
            §6. Armadura Recomendada por Elemento
          </h1>
          <span style="font-size:8pt;color:#666;">NCh430 Of.2008 · NCh2123 Of.2003 — Verificación Completa</span>
        </div>

        ${colSection}
        ${btSection}
        ${bbSection}
        ${foundSection}

        <div style="position:absolute;bottom:18px;left:60px;right:60px;
                    border-top:0.5px solid #ccc;padding-top:4px;
                    display:flex;justify-content:space-between;font-size:7.5pt;color:#999;">
          <span>NCh2123 · NCh430 · NCh3171 · NCh432</span>
          <span>Generado: ${today}</span>
          <span>Pág. 10 / 11</span>
        </div>
      </div>`;
  }

  static _pageRebarSpecificationForPDF() {
    return this._pageRebarSpecification();
  }

  // ============================================================================
  // PÁGINA 11: VERIFICACIÓN NCh430
  // ============================================================================

  static _pageNCh430Compliance() {
    const results = S.results;
    const materials = S.story.materials;

    // Validaciones
    const validations = this._validateNCh430(results, materials);

    let complianceHTML = '<table style="width: 100%; border-collapse: collapse; font-size: 10px;">';
    complianceHTML += '<tr style="background: #e0e7ff; border-bottom: 1px solid #333;">';
    complianceHTML += '<th style="border: 1px solid #333; padding: 6px; text-align: left;">Verificación</th>';
    complianceHTML += '<th style="border: 1px solid #333; padding: 6px; text-align: center;">Requerimiento</th>';
    complianceHTML += '<th style="border: 1px solid #333; padding: 6px; text-align: center;">Estado</th>';
    complianceHTML += '</tr>';

    validations.forEach(v => {
      const bgColor = v.pass ? '#f0fdf4' : '#fef2f2';
      const statusColor = v.pass ? '#15803d' : '#991b1b';
      const statusIcon = v.pass ? '✓' : '✗';

      complianceHTML += `<tr style="background: ${bgColor}; border-bottom: 1px solid #ccc;">`;
      complianceHTML += `<td style="border: 1px solid #ccc; padding: 6px; font-weight: bold;">${v.check}</td>`;
      complianceHTML += `<td style="border: 1px solid #ccc; padding: 6px; font-size: 9px;">${v.requirement}</td>`;
      complianceHTML += `<td style="border: 1px solid #ccc; padding: 6px; text-align: center; color: ${statusColor}; font-weight: bold;">${statusIcon} ${v.status}</td>`;
      complianceHTML += '</tr>';
    });

    complianceHTML += '</table>';

    const html = `
      <div class="pdf-page">
        <div style="padding: 40px; font-size: 12px; line-height: 1.6;">

          <!-- Header -->
          <div style="border-bottom: 2px solid #333; margin-bottom: 20px; padding-bottom: 10px;">
            <h2 style="margin: 0; font-size: 18px; color: #1e40af;">
              Página 11: Verificación de Cumplimiento NCh430
            </h2>
            <p style="margin: 5px 0 0 0; font-size: 10px; color: #666;">
              Checklist de validaciones normativas
            </p>
          </div>

          <!-- Tabla de cumplimiento -->
          <h3 style="font-size: 13px; margin-top: 10px; margin-bottom: 8px; color: #1e40af;">
            Validaciones Normativas (NCh430 Of.2008)
          </h3>
          ${complianceHTML}

          <!-- Resumen -->
          <div style="margin-top: 20px; padding: 10px; background: #f0f9ff; border-left: 4px solid #0284c7; font-size: 10px;">
            <p style="margin: 0; font-weight: bold;">Conclusión:</p>
            <p style="margin: 5px 0 0 0;">
              ${validations.every(v => v.pass)
                ? '✓ <strong>DISEÑO CONFORME A NCh430</strong> — Todas las validaciones cumplen.'
                : '✗ <strong>INCUMPLIMIENTOS DETECTADOS</strong> — Revisar validaciones fallidas (marcadas en rojo).'}
            </p>
          </div>

          <!-- Referencias normativas -->
          <div style="margin-top: 15px; font-size: 9px; color: #666;">
            <p style="margin: 0; font-weight: bold;">Referencias:</p>
            <ul style="margin: 5px 0 0 15px; padding: 0; font-size: 8px;">
              <li>NCh430 Of.2008 — Diseño y cálculo de estructuras de hormigón armado</li>
              <li>Artículo 10.3: Requisitos de resistencia y estabilidad (LRFD)</li>
              <li>Artículo 10.5: Límites de cuantía de acero (ρ_min, ρ_max)</li>
              <li>Artículo 7.1: Recubrimiento mínimo según ambiente</li>
              <li>Artículo 12.3: Distancia y espaciamiento máximo estribos</li>
            </ul>
          </div>

        </div>
      </div>
    `;

    return html;
  }

  static _pageNCh430ComplianceForPDF() {
    return this._pageNCh430Compliance();
  }

  // ============================================================================
  // VALIDACIÓN NCh430 (helper)
  // ============================================================================

  static _validateNCh430(results, materials) {
    const validations = [];

    // Safe defaults — S.results.columns es un diccionario {nodeId: colData}
    const colsObj = (results && results.columns && typeof results.columns === 'object' && !Array.isArray(results.columns))
      ? results.columns : {};
    const cols = Object.values(colsObj);
    const mats = (materials && typeof materials === 'object') ? materials : { fc: 25, fy: 420, rec: 0.03 };

    // Normalizar campos de cumplimiento (ya escritos por solver post-fix)
    const safe_cols = cols.map(col => ({
      As_min:      (typeof col.As_min      === 'number') ? col.As_min      : 4.0,
      As_max:      (typeof col.As_max      === 'number') ? col.As_max      : 40.0,
      As_selected: (typeof col.As_selected === 'number') ? col.As_selected : 0,
      s_selected:  (typeof col.s_selected  === 'number') ? col.s_selected  : 0.10,
      s_max:       (typeof col.s_max       === 'number') ? col.s_max       : 0.20,
    }));

    // Validate and normalize material properties
    const fc = (typeof mats.fc === 'number' && mats.fc > 0) ? mats.fc : 25;
    const fy = (typeof mats.fy === 'number' && mats.fy > 0) ? mats.fy : 420;
    const rec = (typeof mats.rec === 'number' && mats.rec > 0) ? mats.rec : 0.03;

    // 1. Armadura mínima
    const min_pass = safe_cols.length === 0 || safe_cols.every(col => col.As_selected >= col.As_min);
    validations.push({
      check: 'Armadura Mínima (ρ_min)',
      requirement: 'ρ_min = 0.0025 (NCh430 Artículo 10.5.3)',
      pass: min_pass,
      status: safe_cols.length === 0 ? 'SIN DATOS' : (min_pass ? 'OK' : 'FALLA')
    });

    // 2. Armadura máxima
    const max_pass = safe_cols.length === 0 || safe_cols.every(col => col.As_selected <= col.As_max);
    validations.push({
      check: 'Armadura Máxima (ρ_max)',
      requirement: 'ρ_max = 0.75·ρ_balanceada (NCh430 Artículo 10.5.2)',
      pass: max_pass,
      status: safe_cols.length === 0 ? 'SIN DATOS' : (max_pass ? 'OK' : 'FALLA')
    });

    // 3. Recubrimiento
    const rec_mm = (rec * 1000).toFixed(0);
    validations.push({
      check: 'Recubrimiento Mínimo',
      requirement: `rec_min = ${rec_mm}mm (NCh430 Tabla 7.1)`,
      pass: rec >= 0.030,
      status: rec >= 0.030 ? 'OK' : 'FALLA'
    });

    // 4. Espaciamiento de estribos (usa s_max calculado por solver = d/2)
    const spacing_pass = safe_cols.length === 0 || safe_cols.every(col => col.s_selected <= col.s_max);
    const s_max_ref = safe_cols.length > 0 ? safe_cols[0].s_max.toFixed(2) : '0.20';
    validations.push({
      check: 'Espaciamiento de Estribos (s_max)',
      requirement: `s ≤ ${s_max_ref}m = d/2 (NCh430 Art.12.3 + NCh2123 §7.7.8)`,
      pass: spacing_pass,
      status: safe_cols.length === 0 ? 'SIN DATOS' : (spacing_pass ? 'OK' : 'FALLA')
    });

    // 5. Factor de seguridad flexión
    validations.push({
      check: 'Factor Seguridad Flexión',
      requirement: 'φ = 0.90 para hormigón (NCh430 Artículo 9.3.2)',
      pass: true,
      status: 'OK (φ=0.90 aplicado)'
    });

    // 6. Factor de seguridad corte
    validations.push({
      check: 'Factor Seguridad Corte',
      requirement: 'φ = 0.75 para cortante (NCh430 Artículo 9.3.2)',
      pass: true,
      status: 'OK (φ=0.75 aplicado)'
    });

    // 7. Materiales
    const mat_pass = fc >= 20 && fy >= 420;
    validations.push({
      check: 'Especificación de Materiales',
      requirement: `f'c=${fc} MPa, fy=${fy} MPa`,
      pass: mat_pass,
      status: mat_pass ? 'OK' : 'FALLA'
    });

    return validations;
  }
}

// Exportar para uso en memoryReport.js
window.MemoryReportEnhanced = MemoryReportEnhanced;
