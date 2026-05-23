/**
 * lateralDCL.js — Diagrama de Cuerpo Libre de Cargas Laterales
 *
 * Genera una vista de revisión técnica con:
 *   - DCL SVG (fuerzas de viento + sismo + reacciones de fundación)
 *   - Memoria de cálculo paso a paso (NCh432 / NCh433 / NCh3171)
 *   - Verificaciones de volcamiento y deslizamiento
 *
 * Respeta las normativas del proyecto: NCh430, NCh432, NCh433, NCh3171
 * NO modifica Solver.run() — solo lee S.results.lateral
 */

const LateralDCL = {

  // ── Abrir overlay ─────────────────────────────────────────────────
  open() {
    const lat = S.results?.lateral;
    if (!lat) {
      alert('Ejecuta el solver primero (botón Resolver) para calcular cargas laterales.');
      return;
    }

    let overlay = document.getElementById('lateral-dcl-overlay');
    if (!overlay) {
      overlay = document.createElement('div');
      overlay.id = 'lateral-dcl-overlay';
      overlay.style.cssText = `
        position:fixed; inset:0; z-index:3000;
        background:rgba(0,0,0,0.85);
        display:flex; flex-direction:column;
        font-family: 'Courier New', monospace;
        overflow:hidden;
      `;
      document.body.appendChild(overlay);
    }

    overlay.innerHTML = this._buildHTML(lat);
    overlay.style.display = 'flex';

    // Cerrar con Escape
    overlay._escHandler = (e) => { if (e.key === 'Escape') this.close(); };
    document.addEventListener('keydown', overlay._escHandler);
  },

  close() {
    const overlay = document.getElementById('lateral-dcl-overlay');
    if (!overlay) return;
    if (overlay._escHandler) document.removeEventListener('keydown', overlay._escHandler);
    overlay.style.display = 'none';
  },

  // ── HTML principal del overlay ────────────────────────────────────
  _buildHTML(lat) {
    const H      = S.story.H;
    const f      = S.story.foundation;
    const m      = S.story.materials;
    const loads  = S.story.loads || {};
    const lateral = S.story.lateral || {};

    // Extraer todos los valores calculados
    const A0        = parseFloat(lat.A0)        || 0;
    const S_fac     = parseFloat(lat.S_factor)  || 0;
    const I_fac     = parseFloat(lateral.seismic?.I) || 1.0;
    const R_fac     = parseFloat(lateral.seismic?.R) || 4;
    const Cs        = parseFloat(lat.Cs)        || 0;
    const V_basic   = parseFloat(lat.V_basic)   || 35;
    const q_w       = parseFloat(lat.q_w)       || 0;
    const W_supra   = parseFloat(lat.W_supra)   || 0;
    const F_seismic = parseFloat(lat.F_seismic) || 0;
    const F_wind    = parseFloat(lat.F_wind)    || 0;
    const F_h       = parseFloat(lat.F_h)       || 0;
    const governing = lat.governing || '—';
    const hApply    = parseFloat(lat.hApply)    || H / 2;
    const Hf        = f?.Hf  || 0.4;
    const B         = f?.B   || 1.2;
    const M_O       = parseFloat(lat.M_O)       || 0;
    const MR_pos    = parseFloat(lat.MR_pos)    || 0;
    const MR_neg    = parseFloat(lat.MR_neg)    || 0;
    const FS_v_pos  = parseFloat(lat.FS_v_pos)  || 0;
    const FS_v_neg  = parseFloat(lat.FS_v_neg)  || 0;
    const FS_critico = parseFloat(lat.FS_v_critico) || 0;
    const N_total   = parseFloat(lat.N_total)   || 0;
    const mu        = parseFloat(lat.mu)        || 0;
    const F_R_desl  = parseFloat(lat.F_R_desl)  || 0;
    const FS_d      = parseFloat(lat.FS_d)      || 0;
    const e_pos     = parseFloat(lat.e_pos)     || 0;
    const e_neg     = parseFloat(lat.e_neg)     || 0;
    const e_kern    = parseFloat(lat.e_kern)    || B / 6;
    const sigma_pos = lat.sigma_pos || '—';
    const sigma_neg = lat.sigma_neg || '—';

    const OK  = (val, lim) => parseFloat(val) >= lim
      ? `<span style="color:#3fb950;font-weight:bold;">✓ ${val} ≥ ${lim}</span>`
      : `<span style="color:#f85149;font-weight:bold;">✗ ${val} < ${lim}</span>`;

    const svgDCL = this._buildDCL({
      H, Hf, B, hApply,
      F_wind, F_seismic, F_h, governing,
      q_w, W_supra, N_total, F_R_desl,
      M_O, MR_neg, FS_critico
    });

    return `
      <!-- ── Barra superior ──────────────────────────────────────── -->
      <div style="
        flex-shrink:0;
        display:flex; align-items:center; justify-content:space-between;
        padding:10px 20px;
        background:#161b22;
        border-bottom:1px solid #30363d;
      ">
        <div>
          <span style="color:#58a6ff;font-size:14px;font-weight:700;letter-spacing:.05em;">
            DCL — ANÁLISIS DE CARGAS LATERALES
          </span>
          <span style="color:#8b949e;font-size:11px;margin-left:12px;">
            NCh432 (Viento) · NCh433 (Sismo) · NCh3171 (LRFD)
          </span>
        </div>
        <button onclick="LateralDCL.close()" style="
          background:transparent; border:1px solid #30363d; color:#cdd9e5;
          padding:4px 14px; border-radius:5px; cursor:pointer; font-size:12px;
        ">✕ Cerrar [Esc]</button>
      </div>

      <!-- ── Cuerpo principal (dos columnas) ───────────────────────── -->
      <div style="flex:1; display:flex; overflow:hidden; gap:0;">

        <!-- COLUMNA IZQUIERDA: DCL SVG -->
        <div style="
          flex:0 0 52%;
          background:#0d1117;
          border-right:1px solid #30363d;
          display:flex; flex-direction:column;
          overflow:hidden;
        ">
          <div style="padding:12px 16px 6px; color:#8b949e; font-size:10px; font-weight:600; letter-spacing:.06em; text-transform:uppercase;">
            Diagrama de Cuerpo Libre (DCL) — Vista Frontal
          </div>
          <div style="flex:1; display:flex; align-items:center; justify-content:center; padding:10px;">
            ${svgDCL}
          </div>

          <!-- Leyenda de colores -->
          <div style="
            flex-shrink:0; padding:8px 16px;
            border-top:1px solid #21262d;
            display:flex; flex-wrap:wrap; gap:12px; font-size:10px;
          ">
            <span><span style="color:#58a6ff;">━━</span> Viento (NCh432)</span>
            <span><span style="color:#ff7b54;">━━</span> Sismo (NCh433)</span>
            <span><span style="color:#a8dadc;">━━</span> Carga gravitacional</span>
            <span><span style="color:#3fb950;">━━</span> Reacciones terreno</span>
            <span><span style="color:#d29922;">- -</span> Línea de referencia</span>
          </div>
        </div>

        <!-- COLUMNA DERECHA: Memoria de cálculo -->
        <div style="
          flex:1;
          background:#0d1117;
          overflow-y:auto;
          padding:16px 20px;
          color:#cdd9e5;
          font-size:11px;
          line-height:1.7;
        ">

          <!-- ── 1. DATOS DE ENTRADA ──────────────────────────────── -->
          ${this._section('1. Datos de Entrada', `
            <table style="${this._tbl()}">
              <tr><th style="${this._th()}">Parámetro</th><th style="${this._th()}">Valor</th><th style="${this._th()}">Referencia</th></tr>
              <tr><td style="${this._td()}">Zona sísmica</td>       <td style="${this._tdv()}">${lateral.seismic?.zone || 3}</td>   <td style="${this._tdn()}">NCh433 Art.5.2</td></tr>
              <tr><td style="${this._td()}">Ac. zona A₀</td>        <td style="${this._tdv()}">${A0.toFixed(2)} g</td>              <td style="${this._tdn()}">NCh433 Tabla 4.1</td></tr>
              <tr><td style="${this._td()}">Tipo de suelo</td>       <td style="${this._tdv()}">${lateral.seismic?.soilType || 'D'}</td> <td style="${this._tdn()}">D.S.61 Tabla 1</td></tr>
              <tr><td style="${this._td()}">Factor suelo S</td>      <td style="${this._tdv()}">${S_fac.toFixed(2)}</td>             <td style="${this._tdn()}">D.S.61 Tabla 2</td></tr>
              <tr><td style="${this._td()}">Importancia I</td>       <td style="${this._tdv()}">${I_fac.toFixed(1)}</td>             <td style="${this._tdn()}">NCh433 Tabla 5.1</td></tr>
              <tr><td style="${this._td()}">Factor R</td>            <td style="${this._tdv()}">${R_fac.toFixed(0)}</td>             <td style="${this._tdn()}">NCh433 Tabla 6.2</td></tr>
              <tr><td style="${this._td()}">V<sub>básica</sub> viento</td><td style="${this._tdv()}">${V_basic.toFixed(0)} m/s</td><td style="${this._tdn()}">NCh432 Tabla A.1</td></tr>
              <tr><td style="${this._td()}">Altura muro H</td>       <td style="${this._tdv()}">${H.toFixed(2)} m</td>              <td style="${this._tdn()}">Geometría proyecto</td></tr>
              <tr><td style="${this._td()}">Ancho zapata B</td>      <td style="${this._tdv()}">${B.toFixed(2)} m</td>              <td style="${this._tdn()}">Geometría proyecto</td></tr>
              <tr><td style="${this._td()}">Altura zapata H<sub>f</sub></td><td style="${this._tdv()}">${Hf.toFixed(2)} m</td>    <td style="${this._tdn()}">Geometría proyecto</td></tr>
            </table>
          `)}

          <!-- ── 2. CÁLCULO VIENTO (NCh432) ─────────────────────── -->
          ${this._section('2. Carga de Viento — NCh432 Of.2010', `
            <div style="${this._step()}">
              <div style="color:#58a6ff;font-weight:700;margin-bottom:4px;">Presión dinámica de viento:</div>
              <div style="font-size:12px;">
                q<sub>w</sub> = 0.613 · V²<sub>base</sub>  [Pa]<br/>
                q<sub>w</sub> = 0.613 × ${V_basic}² / 1000 = <strong style="color:#58a6ff;">${q_w.toFixed(3)} kPa</strong>
              </div>
            </div>
            <div style="${this._step()}">
              <div style="color:#58a6ff;font-weight:700;margin-bottom:4px;">Fuerza horizontal distribuida por metro lineal:</div>
              <div style="font-size:12px;">
                F<sub>viento</sub> = q<sub>w</sub> · H · 1m &nbsp; (presión uniforme, sin perfil de altura)<br/>
                F<sub>viento</sub> = ${q_w.toFixed(3)} × ${H.toFixed(2)} × 1 = <strong style="color:#58a6ff;">${F_wind.toFixed(3)} kN/m</strong><br/>
                <span style="color:#8b949e;font-size:10px;">Actúa distribuida. Resultante aplicada en h = H/2 = ${(H/2).toFixed(2)} m</span>
              </div>
            </div>
            <div style="font-size:10px;color:#8b949e;padding:6px 0;">
              Nota: Se aplica presión uniforme (modelo simplificado conservador). Para estructura
              &lt; 20m de altura, perfil de velocidades es opcional según NCh432 §6.3.
            </div>
          `)}

          <!-- ── 3. CÁLCULO SÍSMICO (NCh433) ──────────────────────── -->
          ${this._section('3. Carga Sísmica — NCh433 D.S.61', `
            <div style="${this._step()}">
              <div style="color:#ff7b54;font-weight:700;margin-bottom:4px;">Coeficiente sísmico estático (Art. 6.2):</div>
              <div style="font-size:12px;">
                C<sub>s,calc</sub> = (2.75 · A₀ · S · I) / R<br/>
                C<sub>s,calc</sub> = (2.75 × ${A0.toFixed(2)} × ${S_fac.toFixed(2)} × ${I_fac.toFixed(1)}) / ${R_fac}<br/>
                C<sub>s,calc</sub> = ${((2.75 * A0 * S_fac * I_fac) / R_fac).toFixed(4)}<br/><br/>
                C<sub>s,min</sub> = A₀ · I / 6 = ${A0.toFixed(2)} × ${I_fac.toFixed(1)} / 6 = ${(A0 * I_fac / 6).toFixed(4)}<br/>
                C<sub>s,max</sub> = 0.35<br/><br/>
                <strong>C<sub>s</sub> = max(C<sub>s,min</sub>, min(C<sub>s,calc</sub>, 0.35)) = <span style="color:#ff7b54;">${Cs.toFixed(4)}</span></strong>
              </div>
            </div>
            <div style="${this._step()}">
              <div style="color:#ff7b54;font-weight:700;margin-bottom:4px;">Peso sísmico W<sub>supra</sub> (masa sobre zapata):</div>
              <div style="font-size:12px;">
                W<sub>supra</sub> = Σ(pesos estructura: muros + vigas + columnas + techo)<br/>
                W<sub>supra</sub> = <strong>${W_supra.toFixed(3)} kN/m</strong>
                <span style="color:#8b949e;font-size:10px;"> [por metro lineal de estructura]</span>
              </div>
            </div>
            <div style="${this._step()}">
              <div style="color:#ff7b54;font-weight:700;margin-bottom:4px;">Fuerza sísmica horizontal:</div>
              <div style="font-size:12px;">
                F<sub>sismo</sub> = C<sub>s</sub> · W<sub>supra</sub><br/>
                F<sub>sismo</sub> = ${Cs.toFixed(4)} × ${W_supra.toFixed(3)} = <strong style="color:#ff7b54;">${F_seismic.toFixed(3)} kN/m</strong><br/>
                <span style="color:#8b949e;font-size:10px;">Resultante en h<sub>ap</sub> = H/2 = ${hApply.toFixed(2)} m</span>
              </div>
            </div>
          `)}

          <!-- ── 4. FUERZA GOBERNANTE ───────────────────────────────── -->
          ${this._section('4. Fuerza Horizontal Gobernante', `
            <table style="${this._tbl()}">
              <tr><th style="${this._th()}">Caso</th><th style="${this._th()}">F<sub>h</sub> (kN/m)</th><th style="${this._th()}">¿Gobierna?</th></tr>
              <tr style="background:${governing==='viento'?'rgba(88,166,255,0.1)':''}">
                <td style="${this._td()}">Viento (NCh432)</td>
                <td style="${this._tdv()}">${F_wind.toFixed(3)}</td>
                <td style="${this._tdn()}">${governing==='viento'?'<span style="color:#58a6ff;font-weight:700;">✓ GOBIERNA</span>':'—'}</td>
              </tr>
              <tr style="background:${governing==='sismo'?'rgba(255,123,84,0.1)':''}">
                <td style="${this._td()}">Sismo (NCh433)</td>
                <td style="${this._tdv()}">${F_seismic.toFixed(3)}</td>
                <td style="${this._tdn()}">${governing==='sismo'?'<span style="color:#ff7b54;font-weight:700;">✓ GOBIERNA</span>':'—'}</td>
              </tr>
            </table>
            <div style="margin-top:8px;padding:8px;background:rgba(255,255,255,0.04);border-radius:4px;font-size:11px;">
              <strong>F<sub>h</sub> diseño = max(F<sub>viento</sub>, F<sub>sismo</sub>) = ${F_h.toFixed(3)} kN/m</strong>
            </div>
          `)}

          <!-- ── 5. VOLCAMIENTO ───────────────────────────────────── -->
          ${this._section('5. Verificación de Volcamiento', `
            <div style="${this._step()}">
              <div style="color:#d29922;font-weight:700;margin-bottom:4px;">Momento volcante M<sub>O</sub> (en base de zapata):</div>
              <div style="font-size:12px;">
                M<sub>O</sub> = F<sub>h</sub> · (h<sub>ap</sub> + H<sub>f</sub>)<br/>
                M<sub>O</sub> = ${F_h.toFixed(3)} × (${hApply.toFixed(2)} + ${Hf.toFixed(2)})<br/>
                M<sub>O</sub> = <strong>${M_O.toFixed(3)} kN·m/m</strong>
              </div>
            </div>
            <div style="${this._step()}">
              <div style="color:#3fb950;font-weight:700;margin-bottom:4px;">Momentos resistentes M<sub>R</sub> (Σ peso · brazo):</div>
              <div style="font-size:12px;">
                Empuje → der. (vuelca en borde der.): M<sub>R+</sub> = ${MR_pos.toFixed(3)} kN·m/m<br/>
                Empuje → izq. (vuelca en borde izq.): M<sub>R-</sub> = ${MR_neg.toFixed(3)} kN·m/m<br/>
                <span style="color:#8b949e;font-size:10px;">Incluye: muro + vigas + columnas + zapata + sobrecarga</span>
              </div>
            </div>
            <div style="${this._step()}">
              <div style="color:#d29922;font-weight:700;margin-bottom:4px;">Factores de seguridad (FS ≥ 1.5):</div>
              <div style="font-size:12px;">
                FS<sub>volc+</sub> = M<sub>R+</sub> / M<sub>O</sub> = ${MR_pos.toFixed(3)} / ${M_O.toFixed(3)} = ${OK(FS_v_pos.toFixed(2), 1.5)}<br/>
                FS<sub>volc-</sub> = M<sub>R-</sub> / M<sub>O</sub> = ${MR_neg.toFixed(3)} / ${M_O.toFixed(3)} = ${OK(FS_v_neg.toFixed(2), 1.5)}<br/>
                <strong>FS<sub>crítico</sub> = min(${FS_v_pos.toFixed(2)}, ${FS_v_neg.toFixed(2)}) = ${OK(FS_critico.toFixed(2), 1.5)}</strong>
              </div>
            </div>
          `)}

          <!-- ── 6. DESLIZAMIENTO ──────────────────────────────────── -->
          ${this._section('6. Verificación de Deslizamiento', `
            <div style="${this._step()}">
              <div style="color:#3fb950;font-weight:700;margin-bottom:4px;">Fuerza resistente al deslizamiento:</div>
              <div style="font-size:12px;">
                μ = (2/3) · tan(φ) = (2/3) · tan(${(Math.asin(mu * 3/2) * 180/Math.PI).toFixed(0)}°) = ${mu.toFixed(3)}<br/>
                F<sub>R</sub> = μ · N<sub>total</sub> + c · B<br/>
                F<sub>R</sub> = ${mu.toFixed(3)} × ${N_total.toFixed(3)} + 0 = <strong>${F_R_desl.toFixed(3)} kN/m</strong><br/>
                <span style="color:#8b949e;font-size:10px;">N<sub>total</sub> = peso estructura + zapata + sobrecarga suelo</span>
              </div>
            </div>
            <div style="${this._step()}">
              <div style="color:#3fb950;font-weight:700;margin-bottom:4px;">Factor de seguridad (FS ≥ 1.5):</div>
              <div style="font-size:12px;">
                FS<sub>desl</sub> = F<sub>R</sub> / F<sub>h</sub> = ${F_R_desl.toFixed(3)} / ${F_h.toFixed(3)} = ${OK(FS_d.toFixed(2), 1.5)}
              </div>
            </div>
          `)}

          <!-- ── 7. EXCENTRICIDAD Y PRESIÓN MÁXIMA ─────────────────── -->
          ${this._section('7. Excentricidad y Presión de Contacto', `
            <div style="${this._step()}">
              <div style="font-size:12px;">
                Núcleo kern = B/6 = ${B.toFixed(2)}/6 = ${e_kern.toFixed(3)} m<br/>
                e<sub>+</sub> (empuje derecha) = ${e_pos.toFixed(3)} m &nbsp; ${e_pos <= e_kern ? '→ <span style="color:#3fb950;">Dentro del kern ✓</span>' : '→ <span style="color:#f85149;">Fuera del kern ✗</span>'}<br/>
                e<sub>-</sub> (empuje izquierda) = ${e_neg.toFixed(3)} m &nbsp; ${e_neg <= e_kern ? '→ <span style="color:#3fb950;">Dentro del kern ✓</span>' : '→ <span style="color:#f85149;">Fuera del kern ✗</span>'}<br/>
                <br/>
                σ<sub>máx+</sub> = ${sigma_pos} kPa<br/>
                σ<sub>máx-</sub> = ${sigma_neg} kPa
              </div>
            </div>
          `)}

          <!-- ── 8. RESUMEN DE VERIFICACIONES ─────────────────────── -->
          ${this._section('8. Resumen de Verificaciones', `
            <table style="${this._tbl()}">
              <tr><th style="${this._th()}">Verificación</th><th style="${this._th()}">Req.</th><th style="${this._th()}">Resultado</th></tr>
              <tr>
                <td style="${this._td()}">Volcamiento (borde crítico)</td>
                <td style="${this._tdn()}">FS ≥ 1.5</td>
                <td style="${this._tdn()}">${OK(FS_critico.toFixed(2), 1.5)}</td>
              </tr>
              <tr>
                <td style="${this._td()}">Deslizamiento</td>
                <td style="${this._tdn()}">FS ≥ 1.5</td>
                <td style="${this._tdn()}">${OK(FS_d.toFixed(2), 1.5)}</td>
              </tr>
              <tr>
                <td style="${this._td()}">Excentricidad (kern)</td>
                <td style="${this._tdn()}">e ≤ B/6 = ${e_kern.toFixed(3)}m</td>
                <td style="${this._tdn()}">${Math.max(e_pos, e_neg) <= e_kern
                  ? `<span style="color:#3fb950;font-weight:700;">✓ e=${Math.max(e_pos,e_neg).toFixed(3)}m</span>`
                  : `<span style="color:#f85149;font-weight:700;">✗ e=${Math.max(e_pos,e_neg).toFixed(3)}m</span>`}</td>
              </tr>
            </table>
          `)}

          <div style="height:20px;"></div>
        </div>
      </div>
    `;
  },

  // ── DCL SVG ──────────────────────────────────────────────────────
  _buildDCL({ H, Hf, B, hApply, F_wind, F_seismic, F_h, governing,
              q_w, W_supra, N_total, F_R_desl, M_O, MR_neg, FS_critico }) {

    // Dimensiones del SVG (px)
    const VW = 500, VH = 520;

    // Posicionamiento de la estructura en el SVG
    // Referencia: base de la zapata al centro-bajo del canvas
    const baseY  = 390;         // y = base de la zapata
    const groundY = baseY + 8;  // línea de terreno

    // Escala px/m
    const scaleH = 200 / H;     // muro de H metros → 200px
    const scaleB = 80 / B;      // zapata de B metros → 80px, hasta 120px

    const fH_px  = Math.min(Hf * scaleH, 35);     // zapata px
    const fW_px  = Math.min(B * 60, 180);          // ancho zapata px (cap 180px)
    const wallH_px = 200;                           // muro siempre 200px
    const wallW_px = 22;                            // espesor visual

    // Posición horizontal del muro (centrado)
    const centerX = VW / 2;
    const wallX   = centerX - wallW_px / 2;
    const wallY   = baseY - fH_px - wallH_px;
    const fX      = centerX - fW_px / 2;
    const fY      = baseY - fH_px;

    // Punto de aplicación de fuerza lateral (en px)
    const hApply_px = hApply * (wallH_px / H);
    const forceY    = wallY + wallH_px - hApply_px;

    // Longitudes de flechas (max 100px)
    const maxF  = Math.max(F_wind, F_seismic, 0.01);
    const arrowScale = 90 / maxF;
    const lenW  = Math.max(8, Math.min(F_wind    * arrowScale, 95));
    const lenS  = Math.max(8, Math.min(F_seismic * arrowScale, 95));
    const lenN  = Math.min(N_total * 0.7, 90);
    const lenFR = Math.min(F_R_desl * 1.2, 70);

    const arrowHead = (x2, y, color, size = 5, dir = 'right') => {
      if (dir === 'right')
        return `<polygon points="${x2},${y-size} ${x2+size*2},${y} ${x2},${y+size}" fill="${color}"/>`;
      if (dir === 'left')
        return `<polygon points="${x2},${y-size} ${x2-size*2},${y} ${x2},${y+size}" fill="${color}"/>`;
      if (dir === 'up')
        return `<polygon points="${x2-size},${y} ${x2},${y-size*2} ${x2+size},${y}" fill="${color}"/>`;
      if (dir === 'down')
        return `<polygon points="${x2-size},${y} ${x2},${y+size*2} ${x2+size},${y}" fill="${color}"/>`;
    };

    // ── Cargas verticales superiores (qD+qL distribuidas) ──────────
    let vertArrows = '';
    for (let i = 0; i < 7; i++) {
      const ax = wallX + 2 + i * (wallW_px / 6);
      const ay1 = wallY - 30;
      const ay2 = wallY - 2;
      vertArrows += `<line x1="${ax}" y1="${ay1}" x2="${ax}" y2="${ay2}" stroke="#a8dadc" stroke-width="1.5"/>`;
      vertArrows += arrowHead(ax, ay2, '#a8dadc', 3, 'down');
    }
    vertArrows += `
      <line x1="${wallX}" y1="${wallY - 30}" x2="${wallX + wallW_px}" y2="${wallY - 30}"
        stroke="#a8dadc" stroke-width="1.2"/>
      <text x="${centerX}" y="${wallY - 38}" fill="#a8dadc" font-size="9"
        text-anchor="middle" font-family="Courier New">qD + qL</text>`;

    // ── Flechas de viento (distribuidas en altura) ─────────────────
    let windArrows = '';
    const numW = 6;
    const windSpacing = wallH_px / (numW + 1);
    for (let i = 1; i <= numW; i++) {
      const ay = wallY + i * windSpacing;
      const ax1 = wallX - lenW;
      const ax2 = wallX - 2;
      windArrows += `<line x1="${ax1}" y1="${ay}" x2="${ax2}" y2="${ay}"
        stroke="#58a6ff" stroke-width="${governing === 'viento' ? 1.8 : 1.2}" opacity="${governing === 'viento' ? 1 : 0.55}"/>`;
      windArrows += arrowHead(ax2, ay, governing === 'viento' ? '#58a6ff' : 'rgba(88,166,255,0.55)', 3);
    }
    // Línea distribución
    windArrows += `<line x1="${wallX - lenW}" y1="${wallY + windSpacing}"
      x2="${wallX - lenW}" y2="${wallY + numW * windSpacing}"
      stroke="#58a6ff" stroke-width="1" opacity="${governing === 'viento' ? 1 : 0.55}" stroke-dasharray="2,2"/>`;
    // Label viento
    windArrows += `
      <text x="${wallX - lenW - 6}" y="${wallY + wallH_px / 2 - 8}" fill="#58a6ff"
        font-size="9" text-anchor="end" font-family="Courier New"
        opacity="${governing === 'viento' ? 1 : 0.6}">VIENTO</text>
      <text x="${wallX - lenW - 6}" y="${wallY + wallH_px / 2 + 4}" fill="#58a6ff"
        font-size="8" text-anchor="end" font-family="Courier New"
        opacity="${governing === 'viento' ? 1 : 0.6}">q=${q_w.toFixed(2)}kPa</text>
      <text x="${wallX - lenW - 6}" y="${wallY + wallH_px / 2 + 14}" fill="#58a6ff"
        font-size="9" text-anchor="end" font-family="Courier New" font-weight="bold"
        opacity="${governing === 'viento' ? 1 : 0.6}">F=${F_wind.toFixed(2)}kN/m</text>`;

    // ── Flecha sísmica (resultante en hApply) ─────────────────────
    const seis_ax1 = wallX - lenS - 10;
    const seis_ax2 = wallX - 2;
    const seisArrow = `
      <line x1="${seis_ax1}" y1="${forceY}" x2="${seis_ax2}" y2="${forceY}"
        stroke="#ff7b54" stroke-width="${governing === 'sismo' ? 2.8 : 1.5}"
        opacity="${governing === 'sismo' ? 1 : 0.5}"/>
      ${arrowHead(seis_ax2, forceY, governing === 'sismo' ? '#ff7b54' : 'rgba(255,123,84,0.5)', 5)}
      <line x1="${wallX + wallW_px + 2}" y1="${forceY}" x2="${wallX + wallW_px + lenS + 10}" y2="${forceY}"
        stroke="#ff7b54" stroke-width="${governing === 'sismo' ? 2.8 : 1.5}"
        stroke-dasharray="5,3" opacity="${governing === 'sismo' ? 0.5 : 0.3}"/>
      ${arrowHead(wallX + wallW_px + lenS + 10, forceY, governing === 'sismo' ? 'rgba(255,123,84,0.5)' : 'rgba(255,123,84,0.3)', 5, 'right')}
      <text x="${seis_ax1 - 4}" y="${forceY - 10}" fill="#ff7b54"
        font-size="9" text-anchor="end" font-family="Courier New"
        opacity="${governing === 'sismo' ? 1 : 0.55}">SISMO (Cs·W)</text>
      <text x="${seis_ax1 - 4}" y="${forceY + 4}" fill="#ff7b54"
        font-size="9" text-anchor="end" font-family="Courier New" font-weight="bold"
        opacity="${governing === 'sismo' ? 1 : 0.55}">F=${F_seismic.toFixed(2)}kN/m</text>`;

    // ── Línea de altura de aplicación ─────────────────────────────
    const dimLines = `
      <line x1="${wallX + wallW_px + 5}" y1="${wallY + wallH_px}" x2="${wallX + wallW_px + 5}" y2="${wallY}"
        stroke="#444" stroke-width="0.6" stroke-dasharray="2,3"/>
      <line x1="${wallX + wallW_px + 5}" y1="${forceY}" x2="${wallX + wallW_px + 36}" y2="${forceY}"
        stroke="#d29922" stroke-width="0.8" stroke-dasharray="3,2"/>
      <text x="${wallX + wallW_px + 38}" y="${forceY + 4}" fill="#d29922"
        font-size="8" font-family="Courier New">h=${hApply.toFixed(2)}m</text>
      <!-- Cota H del muro -->
      <line x1="${centerX + 70}" y1="${wallY}" x2="${centerX + 70}" y2="${wallY + wallH_px}"
        stroke="#555" stroke-width="0.7"/>
      <line x1="${centerX + 67}" y1="${wallY}" x2="${centerX + 73}" y2="${wallY}" stroke="#555" stroke-width="0.7"/>
      <line x1="${centerX + 67}" y1="${wallY + wallH_px}" x2="${centerX + 73}" y2="${wallY + wallH_px}" stroke="#555" stroke-width="0.7"/>
      <text x="${centerX + 74}" y="${wallY + wallH_px / 2 + 4}" fill="#6e7681"
        font-size="8.5" font-family="Courier New">H=${H}m</text>
      <!-- Cota Hf -->
      <text x="${centerX + 74}" y="${fY + fH_px / 2 + 4}" fill="#6e7681"
        font-size="7.5" font-family="Courier New">Hf=${Hf}m</text>
      <!-- Cota B zapata -->
      <line x1="${fX}" y1="${baseY + 14}" x2="${fX + fW_px}" y2="${baseY + 14}"
        stroke="#555" stroke-width="0.7"/>
      <text x="${centerX}" y="${baseY + 24}" fill="#6e7681"
        font-size="8" text-anchor="middle" font-family="Courier New">B = ${B.toFixed(2)} m</text>`;

    // ── Reacciones del terreno (↑N y ←F_R) ─────────────────────────
    const reactions = `
      <!-- N vertical (arriba) -->
      <line x1="${centerX}" y1="${baseY + 2}" x2="${centerX}" y2="${baseY + 2 + lenN}"
        stroke="#3fb950" stroke-width="2.5"/>
      ${arrowHead(centerX, baseY + 2, '#3fb950', 5, 'up')}
      <text x="${centerX + 8}" y="${baseY + 2 + lenN / 2 + 4}" fill="#3fb950"
        font-size="9" font-family="Courier New">N=${N_total.toFixed(1)}kN/m</text>
      <!-- F_R horizontal (izquierda, resistencia deslizamiento) -->
      <line x1="${fX}" y1="${baseY}" x2="${fX - lenFR}" y2="${baseY}"
        stroke="#3fb950" stroke-width="2"/>
      ${arrowHead(fX, baseY, '#3fb950', 4, 'left')}
      <text x="${fX - lenFR - 4}" y="${baseY - 6}" fill="#3fb950"
        font-size="8" text-anchor="end" font-family="Courier New">F_R=${F_R_desl.toFixed(1)}kN/m</text>`;

    // ── M_O arco (momento volcante) ─────────────────────────────────
    const arcX = fX, arcY = baseY;   // vuelca en toe izquierdo
    const arcR = 28;
    const momentArc = `
      <path d="M ${arcX + arcR} ${arcY} A ${arcR} ${arcR} 0 0 0 ${arcX} ${arcY - arcR}"
        stroke="#d29922" stroke-width="1.5" fill="none" stroke-dasharray="4,2"/>
      <polygon points="${arcX},${arcY - arcR - 1} ${arcX - 5},${arcY - arcR + 5} ${arcX + 5},${arcY - arcR + 5}"
        fill="#d29922"/>
      <text x="${arcX - 8}" y="${arcY - arcR - 6}" fill="#d29922"
        font-size="8" text-anchor="end" font-family="Courier New">M_O=${M_O.toFixed(1)}</text>`;

    // ── Borde crítico (punto de vuelco) ────────────────────────────
    const pivotMark = `
      <circle cx="${fX}" cy="${baseY}" r="4" fill="none" stroke="#d29922" stroke-width="1.5"/>
      <text x="${fX - 6}" y="${baseY + 14}" fill="#d29922"
        font-size="8" text-anchor="middle" font-family="Courier New">▲ pivot</text>`;

    // ── Terreno (ground hatch) ─────────────────────────────────────
    let ground = `<line x1="20" y1="${groundY}" x2="${VW - 20}" y2="${groundY}"
      stroke="#6e7681" stroke-width="1"/>`;
    for (let i = 0; i < 16; i++) {
      const gx = 22 + i * 30;
      ground += `<line x1="${gx + 8}" y1="${groundY}" x2="${gx - 4}" y2="${groundY + 10}"
        stroke="#444" stroke-width="0.8"/>`;
    }

    // ── Chip FS ────────────────────────────────────────────────────
    const fsCritOK = FS_critico >= 1.5;
    const fsSVG = `
      <rect x="${VW - 100}" y="8" width="90" height="36" rx="4"
        fill="rgba(0,0,0,0.5)" stroke="${fsCritOK ? '#3fb950' : '#f85149'}" stroke-width="1.2"/>
      <text x="${VW - 55}" y="21" fill="${fsCritOK ? '#3fb950' : '#f85149'}"
        font-size="7.5" text-anchor="middle" font-family="Courier New" font-weight="bold">
        VOLCAMIENTO</text>
      <text x="${VW - 55}" y="34" fill="${fsCritOK ? '#3fb950' : '#f85149'}"
        font-size="11" text-anchor="middle" font-family="Courier New" font-weight="bold">
        FS = ${FS_critico.toFixed(2)} ${fsCritOK ? '✓' : '✗'}</text>`;

    return `<svg width="${VW}" height="${VH}" viewBox="0 0 ${VW} ${VH}"
              xmlns="http://www.w3.org/2000/svg"
              style="display:block; max-height:100%;">
      <rect width="${VW}" height="${VH}" fill="#0d1117"/>
      ${ground}
      <!-- Zapata -->
      <rect x="${fX}" y="${fY}" width="${fW_px}" height="${fH_px}"
        fill="rgba(70,90,120,0.35)" stroke="#8b949e" stroke-width="1.2" rx="1"/>
      <!-- Muro -->
      <rect x="${wallX}" y="${wallY}" width="${wallW_px}" height="${wallH_px}"
        fill="rgba(30,64,175,0.22)" stroke="#3b82f6" stroke-width="1.8" rx="1"/>
      ${vertArrows}
      ${windArrows}
      ${seisArrow}
      ${dimLines}
      ${reactions}
      ${momentArc}
      ${pivotMark}
      ${fsSVG}
    </svg>`;
  },

  // ── Helpers de estilo ──────────────────────────────────────────────
  _section(title, body) {
    return `
      <div style="margin-bottom:16px;">
        <div style="
          font-size:11px; font-weight:700; color:#cdd9e5;
          border-bottom:1px solid #30363d; padding-bottom:4px; margin-bottom:8px;
          letter-spacing:.04em;
        ">${title}</div>
        ${body}
      </div>`;
  },
  _step() { return 'padding:8px;background:rgba(255,255,255,0.03);border-radius:4px;margin-bottom:6px;'; },
  _tbl()  { return 'width:100%;border-collapse:collapse;font-size:10.5px;'; },
  _th()   { return 'border:1px solid #30363d;padding:4px 6px;background:#161b22;text-align:left;color:#8b949e;font-weight:600;'; },
  _td()   { return 'border:1px solid #21262d;padding:4px 6px;color:#cdd9e5;'; },
  _tdv()  { return 'border:1px solid #21262d;padding:4px 6px;font-weight:700;text-align:center;color:#e6edf3;'; },
  _tdn()  { return 'border:1px solid #21262d;padding:4px 6px;color:#8b949e;font-size:10px;'; },
};

window.LateralDCL = LateralDCL;
