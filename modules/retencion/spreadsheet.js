/**
 * SPREADSHEET.JS — Sistema de Planillas Tipo Excel para Muro de Contención
 *
 * Genera tablas HTML con estructura clara:
 * - Filas INPUT: fondo blanco, editable, borde azul
 * - Filas CALC: fondo gris, no editable, con ecuación visible
 *
 * Trazabilidad: cada celda muestra su fórmula de cálculo
 */

const RWSpreadsheet = {
  /**
   * Renderiza todas las planillas de cálculo
   * @param {object} rw - Estado RW completo
   * @param {object} res - Resultados de RWSolver.run()
   * @returns {string} HTML de todas las secciones
   */
  render(rw, res) {
    const sections = [
      this.section1_geometry(rw, res),
      this.section2_rankine(rw, res),
      this.section3_active_force(rw, res),
      this.section4_weights_resistance(rw, res),
      this.section5_footing_pressure(rw, res),
      this.section6_stem_design(rw, res),
      this.section7_toe_design(rw, res),
      this.section8_heel_design(rw, res),
    ];
    return sections.join('');
  },

  /**
   * Crea estructura de una sección con título
   */
  section(title, rows) {
    const tableRows = rows.map(row => {
      const isInput = row.type === 'INPUT';
      const isSeparator = row.type === 'SEPARATOR';

      if (isSeparator) {
        return `<tr class="table-separator"><td colspan="4"></td></tr>`;
      }

      const cellClass = isInput ? 'cell-input' : 'cell-output';
      const inputAttr = isInput
        ? `<input type="number" step="any" value="${row.value.toFixed(row.decimals || 2)}"
           data-key="${row.key}" class="spreadsheet-input">`
        : `<span class="calc-value">${row.value.toFixed(row.decimals || 2)}</span>`;

      const formulaHTML = row.formula
        ? `<div class="formula-cell" title="${row.formula}">📐 ${row.formula}</div>`
        : '';

      return `
        <tr class="calc-row">
          <td class="label-cell">${row.label}</td>
          <td class="${cellClass}">${inputAttr}</td>
          <td class="unit-cell">${row.unit || ''}</td>
          <td class="status-cell">${row.status || ''}</td>
        </tr>
        ${formulaHTML}
      `;
    }).join('');

    return `
      <div class="spreadsheet-section">
        <h3 class="section-title">${title}</h3>
        <table class="spreadsheet-table">
          <tbody>
            ${tableRows}
          </tbody>
        </table>
      </div>
    `;
  },

  /**
   * ① GEOMETRÍA
   */
  section1_geometry(rw, res) {
    const g = rw.geometry;
    return this.section('① GEOMETRÍA DE LA ESTRUCTURA', [
      { type: 'INPUT', label: 'H libre (coronación)', key: 'H_libre', value: g.H_libre, unit: 'm', decimals: 2 },
      { type: 'INPUT', label: 'H empotramiento (frente)', key: 'H_emp', value: g.H_emp, unit: 'm', decimals: 2 },
      { type: 'INPUT', label: 'Espesor pantalla (t)', key: 't_muro', value: g.t_muro, unit: 'm', decimals: 2 },
      { type: 'INPUT', label: 'Longitud muro (L)', key: 'L', value: g.L, unit: 'm', decimals: 2 },
      { type: 'INPUT', label: 'Ancho zapata (B)', key: 'B_zap', value: g.B_zap, unit: 'm', decimals: 2 },
      { type: 'INPUT', label: 'Altura zapata (Hf)', key: 'Hf', value: g.Hf, unit: 'm', decimals: 2 },
      { type: 'INPUT', label: 'Pie (toe)', key: 'B_toe', value: g.B_toe, unit: 'm', decimals: 2 },

      { type: 'SEPARATOR' },

      { type: 'CALC', label: 'Talón (B_talon)', value: res.B_talon, unit: 'm', decimals: 3,
        formula: 'B_zap − B_toe − t_muro' },
      { type: 'CALC', label: 'Altura pantalla (H_stem)', value: res.H_stem, unit: 'm', decimals: 3,
        formula: 'H_libre + H_emp' },
      { type: 'CALC', label: 'Altura total (H)', value: res.H_total, unit: 'm', decimals: 3,
        formula: 'H_stem + Hf' },
    ]);
  },

  /**
   * ② COEFICIENTES RANKINE
   */
  section2_rankine(rw, res) {
    const s = rw.soil;
    const φ_deg = s.phi;
    const φ_half = φ_deg / 2;

    return this.section('② COEFICIENTES DE RANKINE', [
      { type: 'INPUT', label: 'Ángulo de fricción (φ)', key: 'phi', value: φ_deg, unit: '°', decimals: 0 },

      { type: 'SEPARATOR' },

      { type: 'CALC', label: 'Ka (coef. activo)', value: res.Ka, unit: '—', decimals: 4,
        formula: `tan²(45° − φ/2) = tan²(45° − ${φ_half.toFixed(1)}°)` },
      { type: 'CALC', label: 'Kp (coef. pasivo)', value: res.Kp, unit: '—', decimals: 4,
        formula: `tan²(45° + φ/2) = tan²(45° + ${φ_half.toFixed(1)}°)` },
      { type: 'CALC', label: 'μ (rozamiento)', value: res.μ, unit: '—', decimals: 4,
        formula: `tan(⅔·φ) = tan(⅔·${φ_deg}°)` },
    ]);
  },

  /**
   * ③ EMPUJE ACTIVO
   */
  section3_active_force(rw, res) {
    const s = rw.soil;
    const l = rw.loads;
    const q = l.qSobrecarga;

    return this.section('③ EMPUJE ACTIVO (Pa) — RANKINE', [
      { type: 'INPUT', label: 'γ relleno (grava GP)', key: 'gamma', value: s.gamma, unit: 'kN/m³', decimals: 1 },
      { type: 'INPUT', label: 'Sobrecarga (q)', key: 'qSobrecarga', value: q, unit: 'kPa', decimals: 1 },

      { type: 'SEPARATOR' },

      { type: 'CALC', label: 'σa superficie (z=0)', value: res.σa_sup, unit: 'kPa', decimals: 2,
        formula: 'Ka · q' },
      { type: 'CALC', label: 'σa en base (z=H)', value: res.σa_base, unit: 'kPa', decimals: 1,
        formula: 'Ka · (γ·H + q)' },

      { type: 'SEPARATOR' },

      { type: 'CALC', label: 'Pa triangular (suelo)', value: res.Pa_tri, unit: 'kN/m', decimals: 2,
        formula: '½·Ka·γ·H²' },
      { type: 'CALC', label: 'Pa rectangular (q)', value: res.Pa_rec, unit: 'kN/m', decimals: 2,
        formula: 'Ka·q·H' },
      { type: 'CALC', label: 'Pa TOTAL', value: res.Pa, unit: 'kN/m', decimals: 2,
        formula: 'Pa_tri + Pa_rec', status: this.statusIcon(res.Pa > 0 ? 'info' : 'warning') },

      { type: 'SEPARATOR' },

      { type: 'CALC', label: 'Brazo triángulo (ya_tri)', value: res.ya_tri, unit: 'm', decimals: 3,
        formula: 'H / 3' },
      { type: 'CALC', label: 'Brazo rectángulo (ya_rec)', value: res.ya_rec, unit: 'm', decimals: 3,
        formula: 'H / 2' },
      { type: 'CALC', label: 'Mo volcamiento (punta)', value: res.Mo, unit: 'kN·m/m', decimals: 2,
        formula: 'Pa_tri·ya_tri + Pa_rec·ya_rec' },
    ]);
  },

  /**
   * ④ PESOS Y FACTORES DE SEGURIDAD
   */
  section4_weights_resistance(rw, res) {
    const m = rw.materials;
    const fsv = res.FS_volcamiento;
    const fsd = res.FS_deslizamiento;

    return this.section('④ PESOS PROPIOS Y RESISTENCIA', [
      { type: 'INPUT', label: 'γc hormigón', key: 'gc', value: m.gc, unit: 'kN/m³', decimals: 1 },

      { type: 'SEPARATOR' },

      { type: 'CALC', label: 'W pantalla', value: res.W_pantalla, unit: 'kN/m', decimals: 2,
        formula: 'γc · t · H_stem' },
      { type: 'CALC', label: 'W zapata', value: res.W_zapata, unit: 'kN/m', decimals: 2,
        formula: 'γc · B · Hf' },
      { type: 'CALC', label: 'W suelo sobre talón', value: res.W_suelo, unit: 'kN/m', decimals: 2,
        formula: 'γ · B_talon · H_stem' },
      { type: 'CALC', label: 'W sobrecarga sobre talón', value: res.W_sc, unit: 'kN/m', decimals: 2,
        formula: 'q · B_talon' },
      { type: 'CALC', label: 'N TOTAL (vertical)', value: res.N, unit: 'kN/m', decimals: 2,
        formula: 'W₁+W₂+W₃+W₄', status: this.statusIcon(res.N > 0 ? 'info' : 'danger') },

      { type: 'SEPARATOR' },

      { type: 'CALC', label: 'Mr resistente (punta)', value: res.Mr, unit: 'kN·m/m', decimals: 2,
        formula: 'Σ(W_i · x_i)' },

      { type: 'SEPARATOR' },

      { type: 'CALC', label: 'FS volcamiento', value: fsv, unit: '—', decimals: 2,
        formula: 'Mr / Mo', status: this.statusIcon(fsv >= 1.5 ? 'ok' : (fsv >= 1.2 ? 'warn' : 'danger')) },
      { type: 'CALC', label: 'FS deslizamiento', value: fsd, unit: '—', decimals: 2,
        formula: '(μ·N) / Pa  [Pp=0, NCh02]', status: this.statusIcon(fsd >= 1.5 ? 'ok' : (fsd >= 1.2 ? 'warn' : 'danger')) },
    ]);
  },

  /**
   * ⑤ PRESIONES BAJO ZAPATA
   */
  section5_footing_pressure(rw, res) {
    const g = rw.geometry;
    const qAdm = rw.soil.qAdm;
    const qMax = Math.max(res.q_punta, res.q_talon);

    return this.section('⑤ PRESIÓN BAJO ZAPATA (NCh3171)', [
      { type: 'INPUT', label: 'q admisible (CBR~80%)', key: 'qAdm', value: qAdm, unit: 'kPa', decimals: 0 },

      { type: 'SEPARATOR' },

      { type: 'CALC', label: 'Posición resultante (xR)', value: res.xR, unit: 'm', decimals: 3,
        formula: '(Mr − Mo) / N' },
      { type: 'CALC', label: 'Excentricidad (e)', value: res.e, unit: 'm', decimals: 3,
        formula: 'B/2 − xR' },
      { type: 'CALC', label: 'e máximo permitido', value: res.e_max, unit: 'm', decimals: 3,
        formula: 'B / 6' },
      { type: 'CALC', label: 'Núcleo', value: 0, unit: '✓', decimals: 0,
        status: this.statusIcon(Math.abs(res.e) <= res.e_max ? 'ok' : 'danger') },

      { type: 'SEPARATOR' },

      { type: 'CALC', label: 'q en punta', value: res.q_punta, unit: 'kPa', decimals: 1,
        formula: 'N/B · (1 ± 6e/B)' },
      { type: 'CALC', label: 'q en talón', value: res.q_talon, unit: 'kPa', decimals: 1,
        formula: 'N/B · (1 ∓ 6e/B)' },
      { type: 'CALC', label: 'q máximo', value: qMax, unit: 'kPa', decimals: 1,
        formula: 'max(q_punta, q_talon)', status: this.statusIcon(qMax <= qAdm ? 'ok' : 'danger') },
    ]);
  },

  /**
   * ⑥ DISEÑO PANTALLA (Stem)
   */
  section6_stem_design(rw, res) {
    const m = rw.materials;
    const g = rw.geometry;

    return this.section('⑥ DISEÑO PANTALLA (voladizo, NCh430 §3)', [
      { type: 'INPUT', label: 'f\'c hormigón', key: 'fc', value: m.fc, unit: 'MPa', decimals: 0 },
      { type: 'INPUT', label: 'fy acero', key: 'fy', value: m.fy, unit: 'MPa', decimals: 0 },
      { type: 'INPUT', label: 'Rec. pantalla', key: 'rec_pant', value: m.rec_pant * 100, unit: 'cm', decimals: 0 },

      { type: 'SEPARATOR' },

      { type: 'CALC', label: 'd efectivo (pantalla)', value: res.d_stem * 100, unit: 'cm', decimals: 1,
        formula: 't − rec − φbarra/2' },
      { type: 'CALC', label: 'M servicio (base pantalla)', value: res.M_base, unit: 'kN·m/m', decimals: 2,
        formula: '½Ka·γ·H_stem³/3 + Ka·q·H_stem²/2' },
      { type: 'CALC', label: 'Mu LRFD (1.6M)', value: res.Mu_stem, unit: 'kN·m/m', decimals: 2,
        formula: '1.6 · M_serv' },
      { type: 'CALC', label: 'Vu LRFD (1.6V)', value: res.Vu_stem, unit: 'kN/m', decimals: 2,
        formula: '1.6 · V_serv' },

      { type: 'SEPARATOR' },

      { type: 'CALC', label: 'As requerida (flexión)', value: res.As_req, unit: 'cm²/m', decimals: 2,
        formula: 'ρ · b · d  (ρ = max(ρ_req, ρ_min))', status: this.statusIcon(res.As_req > 0 ? 'info' : 'warning') },

      { type: 'SEPARATOR' },

      { type: 'CALC', label: 'φVc cortante', value: res.φVc_stem, unit: 'kN/m', decimals: 2,
        formula: '0.75 × 0.17 × √f\'c × b × d' },
      { type: 'CALC', label: 'Vu solicitante', value: res.Vu_stem, unit: 'kN/m', decimals: 2,
        formula: 'Del análisis' },
      { type: 'CALC', label: 'Corte pantalla', value: 0, unit: '✓', decimals: 0,
        status: this.statusIcon(res.shear_ok_stem ? 'ok' : 'danger') },
    ]);
  },

  /**
   * ⑦ DISEÑO ZAPATA — PUNTA (Toe)
   */
  section7_toe_design(rw, res) {
    const m = rw.materials;

    return this.section('⑦ DISEÑO ZAPATA — PUNTA (voladizo ascendente, NCh430 §4.1)', [
      { type: 'INPUT', label: 'Rec. zapata', key: 'rec', value: m.rec * 100, unit: 'cm', decimals: 0 },

      { type: 'SEPARATOR' },

      { type: 'CALC', label: 'd efectivo (zapata)', value: res.d_zap * 100, unit: 'cm', decimals: 1,
        formula: 'Hf − rec − φbarra/2' },
      { type: 'CALC', label: 'q en punta (x=0)', value: res.q_punta, unit: 'kPa', decimals: 1,
        formula: 'Del análisis' },
      { type: 'CALC', label: 'w neto = q − γc·Hf', value: res.w_toe_0, unit: 'kPa', decimals: 1,
        formula: 'Presión − peso zapata' },
      { type: 'CALC', label: 'Mu punta (1.6M)', value: res.Mu_toe, unit: 'kN·m/m', decimals: 2,
        formula: '1.6 × B²/6 × (2w₀ + wA)' },

      { type: 'SEPARATOR' },

      { type: 'CALC', label: 'As punta (cara inferior)', value: res.As_toe, unit: 'cm²/m', decimals: 2,
        formula: 'ρ · d_zap · 1000  (acero paralelo a L)' },

      { type: 'SEPARATOR' },

      { type: 'CALC', label: 'Vu a distancia d', value: res.Vu_toe, unit: 'kN/m', decimals: 2,
        formula: 'Cortante a d de la cara' },
      { type: 'CALC', label: 'Corte punta', value: 0, unit: '✓', decimals: 0,
        status: this.statusIcon(res.shear_ok_toe ? 'ok' : 'danger') },
    ]);
  },

  /**
   * ⑧ DISEÑO ZAPATA — TALÓN (Heel)
   */
  section8_heel_design(rw, res) {
    const s = rw.soil;
    const m = rw.materials;

    return this.section('⑧ DISEÑO ZAPATA — TALÓN (voladizo descendente, NCh430 §4.2)', [
      { type: 'INPUT', label: 'γ relleno', key: 'gamma', value: s.gamma, unit: 'kN/m³', decimals: 1 },

      { type: 'SEPARATOR' },

      { type: 'CALC', label: 'Carga descendente total', value: res.w_down, unit: 'kPa', decimals: 1,
        formula: 'γ·H_stem + γc·Hf + q' },
      { type: 'CALC', label: 'Neto en talón', value: res.w_heel_T, unit: 'kPa', decimals: 1,
        formula: 'w_down − q_talon' },
      { type: 'CALC', label: 'Mu talón (1.6M)', value: res.Mu_heel, unit: 'kN·m/m', decimals: 2,
        formula: '1.6 × B²/6 × (w_B + 2w_T)' },

      { type: 'SEPARATOR' },

      { type: 'CALC', label: 'As talón (cara superior)', value: res.As_heel, unit: 'cm²/m', decimals: 2,
        formula: 'ρ · d_zap · 1000  (acero paralelo a L)' },

      { type: 'SEPARATOR' },

      { type: 'CALC', label: 'Vu a distancia d', value: res.Vu_heel, unit: 'kN/m', decimals: 2,
        formula: 'Cortante a d de la cara' },
      { type: 'CALC', label: 'Corte talón', value: 0, unit: '✓', decimals: 0,
        status: this.statusIcon(res.shear_ok_heel ? 'ok' : 'danger') },
    ]);
  },

  /**
   * Helper: genera icono de estado
   */
  statusIcon(type) {
    const icons = {
      'ok': '✓',
      'warn': '⚠',
      'danger': '✗',
      'info': '•'
    };
    return `<span class="status-${type}">${icons[type] || ''}</span>`;
  },

  /**
   * Helper: obtiene clave del estado desde HTML (para actualizar)
   */
  extractInputChanges() {
    const changes = {};
    document.querySelectorAll('.spreadsheet-input').forEach(input => {
      const key = input.dataset.key;
      if (key) {
        changes[key] = parseFloat(input.value) || 0;
      }
    });
    return changes;
  }
};
