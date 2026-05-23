/**
 * SOLVER.JS — Motor de Cálculo Multi-Vano
 * Bajada de cargas, fuerzas internas, diseño NCh430 / ACI 318-19
 */

const Solver = {
  run() {
    const m = S.story.materials;
    const H = S.story.H;
    const ld = S.story.loads;

    const qu = ld.fd * ld.qD + ld.fl * ld.qL;

    // Sync legacy aliases so sidebar inputs still work
    S.loads     = S.story.loads;
    S.materials = S.story.materials;
    S.geometry.H  = H;
    S.geometry.tw = (S.spans[0]?.tw) ?? S.geometry.tw;
    S.geometry.L  = getTotalL();

    S.results.qu = qu.toFixed(2);
    S.results.spans   = {};
    S.results.columns = {};

    // ── Per-span calculations ─────────────────────────────────────
    S.spans.forEach(span => {
      const L = getSpanL(span);
      const btSec = span.beamTop.section;
      const bbSec = span.beamBot.section;

      // Tributary width/roof calculations for unfactored components
      const wBeamTop = m.gc * btSec.b * btSec.h;
      const D_top = wBeamTop + ld.qD;
      const L_top = ld.qL;
      const Lr_top = ld.qRoof || 0;
      const W_top = ld.metalcon_qw || 0;
      
      // We calculate Cs here at the beginning so we can use it
      const lat = S.story.lateral || {};
      const A0_g = ({ 1: 0.20, 2: 0.30, 3: 0.40 })[parseInt(lat.seismic?.zone)] || 0.40;
      const S_fac = ({ A: 0.90, B: 1.00, C: 1.05, D: 1.20, E: 1.30 })[lat.seismic?.soilType] || 1.20;
      const I_fac = parseFloat(lat.seismic?.I) || 1.0;
      const R_fac = parseFloat(lat.seismic?.R) || 4;
      const Cs = Math.min(Math.max((2.75 * A0_g * S_fac * I_fac) / R_fac, A0_g * I_fac / 6), 0.35);
      const E_top = Cs * D_top;

      // ── BeamTop LRFD Combinations ──
      const beamTopCombs = [
        { name: '1.4 D', q_v: 1.4 * D_top, q_h: 0 },
        { name: '1.2 D + 1.6 L + 0.5 Lr', q_v: 1.2 * D_top + 1.6 * L_top + 0.5 * Lr_top, q_h: 0 },
        { name: '1.2 D + 1.6 Lr + 1.0 L', q_v: 1.2 * D_top + 1.6 * Lr_top + 1.0 * L_top, q_h: 0 },
        { name: '1.2 D + 1.6 Lr + 0.8 W', q_v: 1.2 * D_top + 1.6 * Lr_top, q_h: 0.8 * W_top },
        { name: '1.2 D + 1.0 W + L + 0.5 Lr', q_v: 1.2 * D_top + 1.0 * L_top + 0.5 * Lr_top, q_h: 1.0 * W_top },
        { name: '1.2 D + 1.0 E + L + 0.2 Lr (Sismo)', q_v: 1.2 * D_top + 1.0 * L_top + 0.2 * Lr_top, q_h: 1.0 * E_top },
        { name: '0.9 D + 1.0 W', q_v: 0.9 * D_top, q_h: 1.0 * W_top },
        { name: '0.9 D + 1.0 E (Volcamiento)', q_v: 0.9 * D_top, q_h: 1.0 * E_top }
      ];

      let MuBeam = 0;
      let VuBeam_design = 0;
      let worstCombTopName = '';
      const Leff = span.type === 'muro' ? Math.min(0.8, L) : L;

      beamTopCombs.forEach(comb => {
        let Vu_comb, Mu_comb;
        if (span.type === 'muro') {
          Vu_comb = comb.q_v * Leff / 2 + comb.q_h * Leff / 2;
          const MuEnd = comb.q_v * Leff * Leff / 12 + comb.q_h * Leff * Leff / 12;
          const MuMid = comb.q_v * Leff * Leff / 24 + comb.q_h * Leff * Leff / 24;
          Mu_comb = Math.max(MuEnd, MuMid);
        } else {
          Vu_comb = comb.q_v * L / 2 + comb.q_h * L / 2;
          const MuEnd = comb.q_v * L * L / 12 + comb.q_h * L * L / 12;
          const MuMid = comb.q_v * L * L / 24 + comb.q_h * L * L / 24;
          Mu_comb = Math.max(MuEnd, MuMid);
        }
        if (Mu_comb > MuBeam) {
          MuBeam = Mu_comb;
          VuBeam_design = Vu_comb;
          worstCombTopName = comb.name;
        }
      });

      // Muro (si aplica)
      let wallP = 0;
      if (span.type === 'muro') {
        wallP = m.gm * span.tw * L * H;
      }

      // ── BeamBot LRFD Combinations ──
      const wBeamBot = m.gc * bbSec.b * bbSec.h;
      let D_bot = wBeamBot;
      let L_bot = 0;
      let Lr_bot = 0;
      if (span.type === 'muro') {
        D_bot += wallP / L + D_top;
        L_bot += L_top;
        Lr_bot += Lr_top;
      }

      const beamBotCombs = [
        { name: '1.4 D', q_v: 1.4 * D_bot },
        { name: '1.2 D + 1.6 L + 0.5 Lr', q_v: 1.2 * D_bot + 1.6 * L_bot + 0.5 * Lr_bot },
        { name: '1.2 D + 1.6 Lr + 1.0 L', q_v: 1.2 * D_bot + 1.6 * Lr_bot + 1.0 * L_bot },
        { name: '1.2 D + 1.0 W + L + 0.5 Lr', q_v: 1.2 * D_bot + 1.0 * L_bot + 0.5 * Lr_bot },
        { name: '1.2 D + 1.0 E + L + 0.2 Lr', q_v: 1.2 * D_bot + 1.0 * L_bot + 0.2 * Lr_bot },
        { name: '0.9 D', q_v: 0.9 * D_bot }
      ];

      let MuBot = 0;
      let VuBot = 0;
      let worstCombBotName = '';

      beamBotCombs.forEach(comb => {
        const Vu_comb = comb.q_v * L / 2;
        const MuEnd = comb.q_v * L * L / 12;
        const MuMid = comb.q_v * L * L / 24;
        const Mu_comb = Math.max(MuEnd, MuMid);
        if (Mu_comb > MuBot) {
          MuBot = Mu_comb;
          VuBot = Vu_comb;
          worstCombBotName = comb.name;
        }
      });

      // Store unfactored reactions for column accumulation
      span._unfactored = {
        N_D: D_top * L / 2,
        N_L: L_top * L / 2,
        N_Roof: Lr_top * L / 2,
        M_D: D_top * L * L / 12,
        M_L: L_top * L * L / 12,
        M_Roof: Lr_top * L * L / 12
      };

      const btRebarDesign = this._designRebar(MuBeam, VuBeam_design, btSec.b, btSec.h, m);
      const bbRebarDesign = this._designRebar(MuBot, VuBot, bbSec.b, bbSec.h, m);
      // Write auto-selected commercial bars back to model objects
      span.beamTop.rebar = this._autoSelectRebar(btRebarDesign, false);
      span.beamBot.rebar = this._autoSelectRebar(bbRebarDesign, false, true);

      S.results.spans[span.id] = {
        qu: (1.2 * D_top + 1.6 * L_top).toFixed(2),
        beamTop: {
          Mu: MuBeam.toFixed(2), Vu: VuBeam_design.toFixed(2), Nu: '0.00',
          worstComb: worstCombTopName,
          rebar: btRebarDesign
        },
        beamBot: {
          Mu: MuBot.toFixed(2), Vu: VuBot.toFixed(2), Nu: '0.00',
          worstComb: worstCombBotName,
          rebar: bbRebarDesign
        },
        wall: span.type === 'muro' ? { P: wallP.toFixed(2) } : null
      };
    });

    // ── Per-node (column) calculations ──────────────────────────
    const Fc_mc = ld.metalcon_Fc || 0;

    // Lateral force parameters (NCh433/NCh432)
    const lat = S.story.lateral || {};
    const A0_g = ({ 1: 0.20, 2: 0.30, 3: 0.40 })[parseInt(lat.seismic?.zone)] || 0.40;
    const S_fac = ({ A: 0.90, B: 1.00, C: 1.05, D: 1.20, E: 1.30 })[lat.seismic?.soilType] || 1.20;
    const I_fac = parseFloat(lat.seismic?.I) || 1.0;
    const R_fac = parseFloat(lat.seismic?.R) || 4;
    const Cs = Math.min(Math.max((2.75 * A0_g * S_fac * I_fac) / R_fac, A0_g * I_fac / 6), 0.35);

    S.nodes.forEach(node => {
      const leftSpan  = S.spans.find(sp => sp.toNode   === node.id);
      const rightSpan = S.spans.find(sp => sp.fromNode === node.id);

      const N_D_top = (leftSpan ? leftSpan._unfactored.N_D : 0) + (rightSpan ? rightSpan._unfactored.N_D : 0);
      const N_L_top = (leftSpan ? leftSpan._unfactored.N_L : 0) + (rightSpan ? rightSpan._unfactored.N_L : 0);
      const N_Roof_top = (leftSpan ? leftSpan._unfactored.N_Roof : 0) + (rightSpan ? rightSpan._unfactored.N_Roof : 0);

      const col = S.columns[node.id];
      const wColSelf = m.gc * col.section.b * col.section.h * H;

      const N_D_base = N_D_top + wColSelf;
      const N_L_base = N_L_top;
      const N_Roof_base = N_Roof_top;

      // Beam moments
      const M_D_beams = Math.max(
        leftSpan  ? Math.abs(leftSpan._unfactored.M_D)  : 0,
        rightSpan ? Math.abs(rightSpan._unfactored.M_D) : 0
      );
      const M_L_beams = Math.max(
        leftSpan  ? Math.abs(leftSpan._unfactored.M_L)  : 0,
        rightSpan ? Math.abs(rightSpan._unfactored.M_L) : 0
      );
      const M_Roof_beams = Math.max(
        leftSpan  ? Math.abs(leftSpan._unfactored.M_Roof)  : 0,
        rightSpan ? Math.abs(rightSpan._unfactored.M_Roof) : 0
      );

      // Tributary width for lateral loads
      const Ltrib = ((leftSpan  ? getSpanL(leftSpan)  : 0) +
                     (rightSpan ? getSpanL(rightSpan) : 0)) / 2;
      const W_trib = N_D_base; // Dead load mass for seismic base shear

      // Unfactored lateral loads
      const F_point = Fc_mc;

      // Viento NCh432
      const V_wind = parseFloat(lat.wind?.V_basic) || 35;
      const q_w = (0.613 * V_wind * V_wind) / 1000;   // kPa
      const w_wind_calc = q_w * Ltrib;
      const w_wind_user = parseFloat(ld.w_wind) || 0;
      const w_wind = w_wind_user > 0 ? w_wind_user : w_wind_calc;

      // Sismo NCh433
      const F_seis_col = Cs * W_trib;
      const w_seis_calc = F_seis_col / H;
      const w_sismo_user = parseFloat(ld.w_sismo) || 0;
      const w_seis = w_sismo_user > 0 ? w_sismo_user : w_seis_calc;

      // LRFD Combinations for column
      const colCombs = [
        {
          name: '1.4 D',
          Nu_top: 1.4 * N_D_top,
          Nu_base: 1.4 * N_D_base,
          Vu_top: 0,
          Vu_base: 0,
          Mu: 1.4 * M_D_beams,
          w_d: 0, F_p: 0
        },
        {
          name: '1.2 D + 1.6 L + 0.5 Lr',
          Nu_top: 1.2 * N_D_top + 1.6 * N_L_top + 0.5 * N_Roof_top,
          Nu_base: 1.2 * N_D_base + 1.6 * N_L_base + 0.5 * N_Roof_base,
          Vu_top: 0,
          Vu_base: 0,
          Mu: 1.2 * M_D_beams + 1.6 * M_L_beams + 0.5 * M_Roof_beams,
          w_d: 0, F_p: 0
        },
        {
          name: '1.2 D + 1.6 Lr + 1.0 L',
          Nu_top: 1.2 * N_D_top + 1.6 * N_Roof_top + 1.0 * N_L_top,
          Nu_base: 1.2 * N_D_base + 1.6 * N_Roof_base + 1.0 * N_L_base,
          Vu_top: 0,
          Vu_base: 0,
          Mu: 1.2 * M_D_beams + 1.6 * M_Roof_beams + 1.0 * M_L_beams,
          w_d: 0, F_p: 0
        },
        {
          name: '1.2 D + 1.6 Lr + 0.8 W',
          Nu_top: 1.2 * N_D_top + 1.6 * N_Roof_top,
          Nu_base: 1.2 * N_D_base + 1.6 * N_Roof_base,
          Vu_top: 0.8 * F_point,
          Vu_base: 0.8 * (F_point + w_wind * H),
          Mu: Math.max(1.2 * M_D_beams + 1.6 * M_Roof_beams, 0.8 * (F_point * H + w_wind * H * H / 2)),
          w_d: 0.8 * w_wind, F_p: 0.8 * F_point
        },
        {
          name: '1.2 D + 1.0 W + L + 0.5 Lr',
          Nu_top: 1.2 * N_D_top + 1.0 * N_L_top + 0.5 * N_Roof_top,
          Nu_base: 1.2 * N_D_base + 1.0 * N_L_base + 0.5 * N_Roof_base,
          Vu_top: 1.0 * F_point,
          Vu_base: 1.0 * (F_point + w_wind * H),
          Mu: Math.max(1.2 * M_D_beams + 1.0 * M_L_beams + 0.5 * M_Roof_beams, 1.0 * (F_point * H + w_wind * H * H / 2)),
          w_d: 1.0 * w_wind, F_p: 1.0 * F_point
        },
        {
          name: '1.2 D + 1.0 E + L + 0.2 Lr (Sismo)',
          Nu_top: 1.2 * N_D_top + 1.0 * N_L_top + 0.2 * N_Roof_top,
          Nu_base: 1.2 * N_D_base + 1.0 * N_L_base + 0.2 * N_Roof_base,
          Vu_top: 1.0 * F_point,
          Vu_base: 1.0 * (F_point + w_seis * H),
          Mu: Math.max(1.2 * M_D_beams + 1.0 * M_L_beams + 0.2 * M_Roof_beams, 1.0 * (F_point * H + w_seis * H * H / 2)),
          w_d: 1.0 * w_seis, F_p: 1.0 * F_point
        },
        {
          name: '0.9 D + 1.0 W',
          Nu_top: 0.9 * N_D_top,
          Nu_base: 0.9 * N_D_base,
          Vu_top: 1.0 * F_point,
          Vu_base: 1.0 * (F_point + w_wind * H),
          Mu: Math.max(0.9 * M_D_beams, 1.0 * (F_point * H + w_wind * H * H / 2)),
          w_d: 1.0 * w_wind, F_p: 1.0 * F_point
        },
        {
          name: '0.9 D + 1.0 E (Volcamiento)',
          Nu_top: 0.9 * N_D_top,
          Nu_base: 0.9 * N_D_base,
          Vu_top: 1.0 * F_point,
          Vu_base: 1.0 * (F_point + w_seis * H),
          Mu: Math.max(0.9 * M_D_beams, 1.0 * (F_point * H + w_seis * H * H / 2)),
          w_d: 1.0 * w_seis, F_p: 1.0 * F_point
        }
      ];

      // Find the absolute maximum efforts from all combinations (envelope)
      let Mu = 0;
      let Vu = 0;
      let Nu = 0;
      let Nu_top = 0;
      let Vu_top = 0;
      let Vu_base = 0;
      let w_dist = 0;
      let F_p = 0;
      let worstCombName = '';

      colCombs.forEach(comb => {
        // We find the combination that governs based on bending moment Mu,
        // which represents the most unfavorable state for overturning and design.
        if (comb.Mu > Mu) {
          Mu = comb.Mu;
          Vu = comb.Vu_base;
          Nu = comb.Nu_base;
          Nu_top = comb.Nu_top;
          Vu_top = comb.Vu_top;
          Vu_base = comb.Vu_base;
          w_dist = comb.w_d;
          F_p = comb.F_p;
          worstCombName = comb.name;
        }
      });

      // Ensure zero limits
      if (Mu === 0) {
        Mu = colCombs[0].Mu;
        Nu = colCombs[0].Nu_base;
        Nu_top = colCombs[0].Nu_top;
        worstCombName = colCombs[0].name;
      }

      const isCorner = (!leftSpan || !rightSpan);
      const colRebarDesign = this._designRebar(Mu, Vu, col.section.b, col.section.h, m, true);
      // Selección automática de barras comerciales
      col.rebar = this._autoSelectRebar(colRebarDesign, true);

      // ── Armadura seleccionada (área total ambas caras) ─────────────
      const As_face_sel = col.rebar.faces?.superior?.AsTotal || 0;
      const As_selected = +(As_face_sel + (col.rebar.faces?.inferior?.AsTotal || 0)).toFixed(2);
      const s_sel_m     = col.rebar.estribos?.espaciamiento  || 0.10;
      const barDia      = col.rebar.faces?.superior?.barras?.[0]?.diámetro || 0;
      const nPerFace    = col.rebar.faces?.superior?.barras?.[0]?.cantidad  || 0;
      const As_req      = parseFloat(colRebarDesign.AsReq);
      const As_min      = parseFloat(colRebarDesign.AsMinCm2);
      const As_max      = parseFloat(colRebarDesign.AsMaxCm2);

      // ── Verificaciones NCh430 ──────────────────────────────────────
      const cumple_min  = As_selected >= As_min;
      const cumple_max  = As_selected <= As_max;
      const cumple_req  = As_selected >= As_req;
      const s_max_m     = parseFloat(colRebarDesign.s_max_cm) / 100;
      const cumple_smax = s_sel_m <= s_max_m;

      S.results.columns[node.id] = {
        // Esfuerzos de diseño (combinación gobernante con cargas laterales)
        Mu: Mu.toFixed(2),
        Vu: Vu.toFixed(2),
        Nu: Nu.toFixed(2),
        Nu_top: Nu_top.toFixed(2),
        Vu_top: Vu_top.toFixed(2),
        Vu_base: Vu_base.toFixed(2),
        w_dist: w_dist.toFixed(3),
        F_point: F_p.toFixed(2),
        F_lat: w_dist > 0 ? (F_p + w_dist * H).toFixed(2) : F_p.toFixed(2),
        F_seis: F_seis_col.toFixed(2),
        F_wind: (w_wind * H).toFixed(2),
        Ltrib: Ltrib.toFixed(2),
        isCorner,
        isCombined: w_dist > 0,
        caseLabel: worstCombName,
        combinations: colCombs,
        rebar: colRebarDesign,
        // ── Campos de cumplimiento auditables ─────────────────────────
        As_req,
        As_min,
        As_max,
        As_selected,
        As_selected_face: As_face_sel,
        s_selected: s_sel_m,
        s_max: s_max_m,
        bar_dia: barDia,
        bar_n_face: nPerFace,
        rebar_desc: `${nPerFace}ø${barDia} c/cara`,
        cumple_min,
        cumple_max,
        cumple_req,
        cumple_smax,
        cumple_all: cumple_min && cumple_max && cumple_req && cumple_smax
      };
    });

    // ── Foundation calculations — Método de Hansen ────────────────
    const f = S.story.foundation;
    let totalL = getTotalL() || 4.0;
    let sumD = 0, sumL_load = 0;

    S.spans.forEach(span => {
      const L = getSpanL(span);
      const btSec = span.beamTop.section;
      const bbSec = span.beamBot.section;
      const wBeamTop = m.gc * btSec.b * btSec.h;
      const wBeamBot = m.gc * bbSec.b * bbSec.h;
      const wWall = span.type === 'muro' ? m.gm * span.tw * H : 0;
      const qRoof = ld.qRoof || 0;  // Carga del techo en kN/m (no factorizada aquí, solo peso)
      sumD += (ld.qD + wBeamTop + wBeamBot + wWall + qRoof) * L;
      sumL_load += ld.qL * L;
    });
    Object.values(S.columns).forEach(col => {
      sumD += m.gc * col.section.b * col.section.h * H;
    });

    const qD_avg = sumD / totalL;
    const qL_avg = sumL_load / totalL;

    // ── Hansen: Calcular presión efectiva de sobrecarga (q_bar) ──
    // Suma el peso de cada estrato desde z=0 hasta z=Df
    const strata = f.strata || [];
    const NF = parseFloat(f.NF) ?? 3.0;
    const FS = parseFloat(f.FS) ?? 3.0;
    const beta_deg = parseFloat(f.beta) ?? 0;
    const beta_rad = beta_deg * Math.PI / 180;
    const gw = 9.81; // kN/m³ peso agua

    let q_bar = 0;
    let z = 0;
    let supportStratum = null;

    // Traverse strata to build q_bar and find support stratum at Df
    const stCopy = strata.map(s => ({ ...s }));
    for (let i = 0; i < stCopy.length; i++) {
      const st = stCopy[i];
      const z_top = z;
      const z_bot = z + st.h;

      if (z_top >= f.Df) break; // Already past Df

      const z_eff_top = Math.min(z_top, f.Df);
      const z_eff_bot = Math.min(z_bot, f.Df);
      const dz = z_eff_bot - z_eff_top;

      // Determine effective unit weight in this slice
      // (weight above NF = gamma_nat, weight below NF = gamma' = gamma - gw)
      let gamma_eff;
      if (z_eff_top >= NF) {
        // Fully submerged
        gamma_eff = Math.max(0, st.gamma - gw);
      } else if (z_eff_bot <= NF) {
        // Fully above NF (dry/moist)
        gamma_eff = st.gamma;
      } else {
        // NF splits this slice
        const dry_h  = NF - z_eff_top;
        const sub_h  = z_eff_bot - NF;
        gamma_eff = (st.gamma * dry_h + (st.gamma - gw) * sub_h) / dz;
      }

      q_bar += gamma_eff * dz;

      // Support stratum: the one that contains Df
      if (z_top < f.Df && z_bot >= f.Df) {
        supportStratum = st;
      }
      z = z_bot;
    }

    // If Df is beyond all defined strata, use last stratum as support
    if (!supportStratum && stCopy.length > 0) {
      supportStratum = stCopy[stCopy.length - 1];
    }
    if (!supportStratum) {
      supportStratum = { type: 'drenado', gamma: 18, phi: 30, c: 0 };
    }

    // ── Hansen: Factores de Capacidad de Soporte ─────────────────
    const phi_deg = parseFloat(supportStratum.phi) ?? 30;
    const c_soil  = parseFloat(supportStratum.c)   ?? 0;
    const phi_rad = phi_deg * Math.PI / 180;
    const isDrained = supportStratum.type !== 'no_drenado';

    let Nc_h, Nq_h, Ng_h; // N_c, N_q, N_gamma (Hansen)
    if (!isDrained || phi_deg < 0.5) {
      // Undrained: phi=0 special case
      Nc_h = 5.14;
      Nq_h = 1.0;
      Ng_h = 0.0;
    } else {
      Nq_h = Math.exp(Math.PI * Math.tan(phi_rad)) * Math.pow(Math.tan(Math.PI/4 + phi_rad/2), 2);
      Nc_h = (Nq_h - 1) / Math.tan(phi_rad);
      Ng_h = 1.5 * (Nq_h - 1) * Math.tan(phi_rad);
    }

    // ── Factores de Forma (zapata corrida → s=1.0) ────────────────
    const sc = 1.0, sq = 1.0, sg = 1.0;

    // ── Factores de Profundidad (Hansen) ──────────────────────────
    const k = f.Df / f.B;
    let dc, dq, dg;
    if (k <= 1) {
      dq = 1 + 2 * Math.tan(phi_rad) * Math.pow(1 - Math.sin(phi_rad), 2) * k;
      dc = !isDrained ? (1 + 0.4 * k) : dq - (1 - dq) / (Nq_h * Math.tan(phi_rad));
    } else {
      const kAtan = Math.atan(k); // en radianes
      dq = 1 + 2 * Math.tan(phi_rad) * Math.pow(1 - Math.sin(phi_rad), 2) * kAtan;
      dc = !isDrained ? (1 + 0.4 * kAtan) : dq - (1 - dq) / (Nq_h * Math.tan(phi_rad));
    }
    dg = 1.0;

    // ── Factores de Inclinación del Terreno (talud) ───────────────
    let gc_f, gq_f, gg_f;
    if (!isDrained || phi_deg < 0.5) {
      gc_f = 1.0 - (beta_deg / 147);
      gq_f = 1.0;
      gg_f = 1.0;
    } else {
      gq_f = Math.pow(1 - 0.5 * Math.tan(beta_rad), 5);
      gg_f = gq_f;
      gc_f = gq_f - (1 - gq_f) / (Nq_h * Math.tan(phi_rad));
    }

    // ── Peso efectivo del suelo bajo zapata (γ' si NF en z=Df) ───
    let gamma_base = supportStratum.gamma;
    if (NF <= f.Df) gamma_base = Math.max(0, supportStratum.gamma - gw); // submerged

    // ── Capacidad Última de Hansen ────────────────────────────────
    const q_ult_hansen = (
      c_soil * Nc_h * sc * dc * gc_f +
      q_bar  * Nq_h * sq * dq * gq_f +
      0.5 * gamma_base * f.B * Ng_h * sg * dg * gg_f
    );

    const q_adm = q_ult_hansen / FS;

    // ── Verificación de tensión de contacto ───────────────────────
    let b_bot_avg = 0.20;
    if (S.spans.length > 0) b_bot_avg = S.spans[0].tw || S.spans[0].beamBot.section.b;

    const wFooting = m.gc * f.B * f.Hf;
    const wSoil_above = q_bar * Math.max(0, (f.B - b_bot_avg) / 2); // Peso del suelo sobre los talones (simplificado)
    const P_service = qD_avg + qL_avg + wFooting + wSoil_above;
    const sigma_contact = P_service / f.B;
    const DCR_soil = q_adm > 0 ? sigma_contact / q_adm : 999;

    // ── Diseño estructural de la zapata ──────────────────────────
    const P_u_net = 1.2 * qD_avg + 1.6 * qL_avg;
    const q_u_net = P_u_net / f.B;
    // Voladizo: zapata L tiene voladizo completo (B - ancho_muro), T tiene voladizo en cada lado
    const isLType = (f.type === 'L' || f.type === 'L-inv');
    const L_c = isLType
      ? Math.max(0, f.B - b_bot_avg)          // voladizo total hacia un lado
      : Math.max(0, (f.B - b_bot_avg) / 2);   // voladizo simétrico (T)

    // Excentricidad para zapata L: carga en el borde → distribución no uniforme
    const e_L = isLType ? f.B / 2 - b_bot_avg / 2 : 0;  // distancia centroide zapata → punto de carga
    const sigma_max = (P_u_net / f.B) * (1 + 6 * e_L / f.B);  // presión máxima en el borde con carga
    const q_u_design = isLType ? sigma_max : P_u_net / f.B;    // presión de diseño para Mu

    const Mu_f = (q_u_design * (L_c ** 2)) / 2;

    const rec_footing = 0.075;
    const d_f = f.Hf - rec_footing - 0.005;
    const d_f_mm = d_f * 1000;

    const rho_min_f = 0.0018;
    const AsMin_f_mm2 = rho_min_f * 1000 * (f.Hf * 1000);
    const AsMin_f_cm2 = AsMin_f_mm2 / 100;

    const phi_b = 0.90, b_mm = 1000;
    const Mu_Nmm = Mu_f * 1e6;
    const A_coef = (phi_b * m.fy * m.fy) / (1.7 * m.fc * b_mm);
    const B_coef = phi_b * m.fy * d_f_mm;
    const disc = (B_coef ** 2) - (4 * A_coef * Mu_Nmm);
    const AsMuCm2 = disc >= 0 ? (B_coef - Math.sqrt(disc)) / (2 * A_coef) / 100 : null;
    const AsReq_f = AsMuCm2 !== null ? Math.max(AsMuCm2, AsMin_f_cm2) : AsMin_f_cm2;
    const AsLong_cm2 = 0.0018 * (f.B * 1000) * (f.Hf * 1000) / 100;

    const Vu_f = Math.max(0, q_u_net * (L_c - d_f));
    const phi_v = 0.75;
    const Vc_f = (0.17 * Math.sqrt(m.fc) * b_mm * d_f_mm) / 1000;
    const phi_Vc = phi_v * Vc_f;

    // ── CARGAS LATERALES (NCh433 sismo + NCh432 viento) ──────────
    S.results.lateral = this._designOverturning(f, supportStratum, q_bar, totalL, H);

    S.results.foundation = {
      // Geotecnia
      q_bar:        q_bar.toFixed(1),
      Nc:           Nc_h.toFixed(2),
      Nq:           Nq_h.toFixed(2),
      Ng:           Ng_h.toFixed(2),
      dq:           dq.toFixed(3),
      dc:           dc.toFixed(3),
      gq:           gq_f.toFixed(3),
      q_ult:        q_ult_hansen.toFixed(1),
      q_adm:        q_adm.toFixed(1),
      FS,
      supportStrat: supportStratum.name || supportStratum.type,
      phi_design:   phi_deg,
      c_design:     c_soil,
      // Cargas y contacto
      qD_avg:       qD_avg.toFixed(1),
      qL_avg:       qL_avg.toFixed(1),
      wFooting:     wFooting.toFixed(1),
      wSoil_above:  wSoil_above.toFixed(1),
      P_service:    P_service.toFixed(1),
      sigma_contact:sigma_contact.toFixed(1),
      DCR_soil:     DCR_soil.toFixed(2),
      // Diseño estructural
      q_u_net:      q_u_net.toFixed(1),
      L_c:          L_c.toFixed(2),
      Mu:           Mu_f.toFixed(2),
      Vu:           Vu_f.toFixed(2),
      phi_Vc:       phi_Vc.toFixed(2),
      rebar: {
        AsReq:     AsReq_f.toFixed(2),
        AsMinCm2:  AsMin_f_cm2.toFixed(2),
        AsLongCm2: AsLong_cm2.toFixed(2),
        d_eff_cm:  (d_f * 100).toFixed(1)
      }
    };

    // ── Legado: apuntar al vano/nodo seleccionado ─────────────────
    const selSpan = S.spans.find(sp => sp.id === S.ui.selectedSpan) || S.spans[0];
    if (selSpan) {
      const spanRes = S.results.spans[selSpan.id];
      S.results.beam_top = spanRes?.beamTop;
      S.results.beam_bot = spanRes?.beamBot;
      S.results.wall     = spanRes?.wall;
    }
    const selNodeId = S.ui.selectedNode || S.nodes[0]?.id;
    S.results.column = S.results.columns[selNodeId] || null;

    // Legacy elements sync (for rebarEditor / crossSection backward compat)
    this._syncLegacyElements(selSpan, selNodeId);

    document.getElementById('sb-qu').innerHTML = `q<sub>u</sub>: <b>${qu.toFixed(2)} kN/m</b>`;
  },

  /**
   * Calcula esfuerzos en columna para múltiples casos de carga
   * Retorna el caso más desfavorable según momento flector máximo
   */
  calculateColumnCases(F_point, H, w_wind, w_sismo) {
    const cases = [];

    // Caso 1: Solo peso + carga puntual
    cases.push({
      name: 'Peso + Vertical',
      F_p: F_point,
      w_d: 0,
      Vu_top: F_point,
      Vu_base: F_point,
      Mu_lat: F_point * H
    });

    // Caso 2: Peso + Vertical + Viento (si w_wind > 0)
    if (w_wind > 0) {
      cases.push({
        name: 'Peso + Vertical + Viento',
        F_p: F_point,
        w_d: w_wind,
        Vu_top: F_point,
        Vu_base: F_point + w_wind * H,
        Mu_lat: F_point * H + (w_wind * H * H) / 2
      });
    }

    // Caso 3: Peso + Vertical + Sismo (si w_sismo > 0)
    if (w_sismo > 0) {
      cases.push({
        name: 'Peso + Vertical + Sismo',
        F_p: F_point,
        w_d: w_sismo,
        Vu_top: F_point,
        Vu_base: F_point + w_sismo * H,
        Mu_lat: F_point * H + (w_sismo * H * H) / 2
      });
    }

    // Seleccionar caso crítico (máximo momento flector)
    const critical = cases.reduce((prev, curr) =>
      curr.Mu_lat > prev.Mu_lat ? curr : prev
    );

    return {
      allCases: cases,
      critical: critical,
      isCombined: critical.w_d > 0  // true si hay carga distribuida lateral
    };
  },

  _syncLegacyElements(span, nodeId) {
    if (!span) return;
    const m = S.story.materials;

    // beam_top / beam_bot: mirror span sections into S.elements
    if (!S.elements) S.elements = {};
    S.elements.beam_top = {
      id: 'beam_top', name: 'Viga Superior',
      section: span.beamTop.section,
      rebar:   span.beamTop.rebar,
      design:  S.results.spans[span.id]?.beamTop?.rebar || {}
    };
    S.elements.beam_bot = {
      id: 'beam_bot', name: 'Sobrecimiento',
      section: span.beamBot.section,
      rebar:   span.beamBot.rebar,
      design:  S.results.spans[span.id]?.beamBot?.rebar || {}
    };
    const col = S.columns[nodeId] || Object.values(S.columns)[0];
    S.elements.column = {
      id: 'column', name: 'Pilar',
      section: col.section,
      rebar:   col.rebar,
      design:  S.results.columns[nodeId] || {}
    };
    S.elements.wall = {
      id: 'wall', name: 'Muro Albañilería',
      section: { b: span.tw, h: S.story.H },
      rebar: null, design: {}
    };
    S.materials = m;
    S.geometry.L  = getTotalL();
    S.geometry.H  = S.story.H;
    S.geometry.tw = span.tw;
  },

  // ── Volcamiento + Deslizamiento bidireccional (NCh433 / NCh432) ──
  _designOverturning(f, supportStratum, q_bar, totalL, H) {
    const m   = S.story.materials;
    const ld  = S.story.loads;
    const lat = S.story.lateral || {
      seismic: { zone: 3, soilType: 'D', I: 1.0, R: 4 },
      wind: { V_basic: 35 },
      hApplyMode: 'auto'
    };

    // ── NCh433: Coef. sísmico C estático simplificado ──
    const A0_g = ({ 1: 0.20, 2: 0.30, 3: 0.40 })[parseInt(lat.seismic.zone)] || 0.40;
    const S_fac = ({ A: 0.90, B: 1.00, C: 1.05, D: 1.20, E: 1.30 })[lat.seismic.soilType] || 1.20;
    const I_fac = parseFloat(lat.seismic.I) || 1.0;
    const R_fac = parseFloat(lat.seismic.R) || 4;
    const Cs_calc = (2.75 * A0_g * S_fac * I_fac) / R_fac;
    const Cs_min  = A0_g * I_fac / 6;
    const Cs_max  = 0.35;
    const Cs = Math.max(Cs_min, Math.min(Cs_calc, Cs_max));

    // ── NCh432: q dinámica viento = 0.613 V² (Pa → kPa) ──
    const V_basic = parseFloat(lat.wind.V_basic) || 35;
    const q_w = (0.613 * V_basic * V_basic) / 1000;  // kPa

    // ── Pesos por metro lineal del muro de adosamiento ──
    let W_supra = 0;  // peso involucrado en sismo (sobre la zapata)
    S.spans.forEach(span => {
      const Lsp = getSpanL(span);
      const btSec = span.beamTop.section;
      const bbSec = span.beamBot.section;
      W_supra += m.gc * btSec.b * btSec.h * Lsp;
      W_supra += m.gc * bbSec.b * bbSec.h * Lsp;
      if (span.type === 'muro') W_supra += m.gm * span.tw * H * Lsp;
    });
    Object.values(S.columns).forEach(col => {
      W_supra += m.gc * col.section.b * col.section.h * H;
    });
    W_supra += (ld.qRoof || 0) * totalL;  // techo (peso D)
    const W_supra_lin = W_supra / totalL;

    // ── F_h por metro lineal ──
    const F_seismic = Cs * W_supra_lin;          // kN/m
    const F_wind    = q_w * H;                    // kN/m (q × H × 1m)
    const F_h       = Math.max(F_seismic, F_wind);
    const governing = F_seismic >= F_wind ? 'sismo' : 'viento';

    // Altura de aplicación: por defecto centroide del muro
    const hApply = (lat.hApplyMode === 'top') ? H : H / 2;

    // ── Geometría: posiciones de pesos respecto al toe izquierdo (x=0) ──
    const tw   = S.spans[0]?.tw || 0.14;
    const fType = f.type || 'T';

    // Para L: muro al borde IZQ, voladizo a la DER
    // Para L-inv: muro al borde DER, voladizo a la IZQ
    // Para T: muro centrado
    let x_wall;
    if (fType === 'L')          x_wall = tw / 2;
    else if (fType === 'L-inv') x_wall = f.B - tw / 2;
    else                        x_wall = f.B / 2;

    const x_footing = f.B / 2;
    let x_overburden;
    if (fType === 'L')          x_overburden = (tw + f.B) / 2;
    else if (fType === 'L-inv') x_overburden = (f.B - tw) / 2;
    else                        x_overburden = f.B / 2;

    // Componentes verticales por metro lineal
    const w_wall_lin     = S.spans[0]?.type === 'muro' ? m.gm * tw * H : 0;
    const w_bt_lin       = m.gc * (S.spans[0]?.beamTop.section.b || 0.2) * (S.spans[0]?.beamTop.section.h || 0.15);
    const w_bb_lin       = m.gc * (S.spans[0]?.beamBot.section.b || 0.2) * (S.spans[0]?.beamBot.section.h || 0.15);
    const colCount       = Object.keys(S.columns).length;
    const colSec         = Object.values(S.columns)[0]?.section || { b: 0.2, h: 0.15 };
    const w_col_lin      = (colCount * m.gc * colSec.b * colSec.h * H) / totalL;
    const w_footing_lin  = m.gc * f.B * f.Hf;
    const w_roof_lin     = ld.qRoof || 0;
    const w_overburden_lin = q_bar * Math.max(0, f.B - tw);  // suelo sobre cantilever

    const N_supra_lin = w_wall_lin + w_bt_lin + w_bb_lin + w_col_lin + w_roof_lin;
    const N_total_lin = N_supra_lin + w_footing_lin + w_overburden_lin;

    // ── M_R: momento resistente alrededor de cada borde ──
    // Empuje (+) hacia DERECHA → vuelca alrededor del right toe (x = B)
    const MR_pos = N_supra_lin * (f.B - x_wall)
                 + w_footing_lin * (f.B - x_footing)
                 + w_overburden_lin * (f.B - x_overburden);
    // Empuje (-) hacia IZQUIERDA → vuelca alrededor del left toe (x = 0)
    const MR_neg = N_supra_lin * x_wall
                 + w_footing_lin * x_footing
                 + w_overburden_lin * x_overburden;

    // M_O: momento volcante alrededor de la base de la zapata
    // F_h actúa a (hApply + Hf) sobre la base
    const M_O = F_h * (hApply + f.Hf);

    const FS_v_pos = M_O > 0 ? MR_pos / M_O : 999;
    const FS_v_neg = M_O > 0 ? MR_neg / M_O : 999;

    // ── Deslizamiento ──
    // μ recomendado: (2/3) tan(φ) para hormigón-suelo + cohesión×B
    const phi_b = parseFloat(supportStratum?.phi) || 30;
    const c_b   = parseFloat(supportStratum?.c)   || 0;
    const mu_fric = (2 / 3) * Math.tan(phi_b * Math.PI / 180);
    const F_R_desl = mu_fric * N_total_lin + c_b * f.B;
    const FS_d = F_h > 0 ? F_R_desl / F_h : 999;

    // ── Excentricidad combinada y presión máxima ──
    // M alrededor del centroide del footing (x = B/2). Empuje (+) momento (+).
    const M_grav_cent = N_supra_lin * (x_wall - f.B / 2)
                      + w_overburden_lin * (x_overburden - f.B / 2);
    const M_lat = F_h * hApply;
    const e_pos = Math.abs(M_grav_cent + M_lat) / N_total_lin;
    const e_neg = Math.abs(M_grav_cent - M_lat) / N_total_lin;

    const sigmaMax = (e) => {
      if (e >= f.B / 2) return Infinity;
      if (e <= f.B / 6) return (N_total_lin / f.B) * (1 + 6 * e / f.B);
      return (2 * N_total_lin) / (3 * (f.B / 2 - e));  // triangular
    };
    const s_pos = sigmaMax(e_pos);
    const s_neg = sigmaMax(e_neg);

    const FS_LIMIT = 1.5;
    return {
      // Inputs computados
      A0:           A0_g.toFixed(2),
      S_factor:     S_fac.toFixed(2),
      Cs:           Cs.toFixed(3),
      q_w:          q_w.toFixed(2),
      V_basic:      V_basic.toFixed(0),
      // Fuerzas
      W_supra:      W_supra_lin.toFixed(2),
      N_total:      N_total_lin.toFixed(2),
      F_seismic:    F_seismic.toFixed(2),
      F_wind:       F_wind.toFixed(2),
      F_h:          F_h.toFixed(2),
      governing:    governing,
      hApply:       hApply.toFixed(2),
      // Volcamiento
      M_O:          M_O.toFixed(2),
      MR_pos:       MR_pos.toFixed(2),
      MR_neg:       MR_neg.toFixed(2),
      FS_v_pos:     FS_v_pos.toFixed(2),
      FS_v_neg:     FS_v_neg.toFixed(2),
      FS_v_critico: Math.min(FS_v_pos, FS_v_neg).toFixed(2),
      // Deslizamiento
      mu:           mu_fric.toFixed(2),
      F_R_desl:     F_R_desl.toFixed(2),
      FS_d:         FS_d.toFixed(2),
      // Excentricidad / presión
      e_pos:        e_pos.toFixed(3),
      e_neg:        e_neg.toFixed(3),
      e_max:        Math.max(e_pos, e_neg).toFixed(3),
      e_kern:       (f.B / 6).toFixed(3),
      sigma_pos:    s_pos === Infinity ? '∞ (vuelca)' : s_pos.toFixed(1),
      sigma_neg:    s_neg === Infinity ? '∞ (vuelca)' : s_neg.toFixed(1),
      // Verificaciones
      cumple_volc:  (Math.min(FS_v_pos, FS_v_neg) >= FS_LIMIT),
      cumple_desl:  (FS_d >= FS_LIMIT),
      cumple_kern:  (Math.max(e_pos, e_neg) <= f.B / 6),
      FS_limit:     FS_LIMIT
    };
  },

  _designRebar(Mu, Vu, b, h, m, isColumn = false, Nu = 0) {
    const phi_b = 0.9, phi_v = 0.75;
    // Para pilares (isColumn): barra mínima ø16 → radio = 0.008 m
    // Para vigas/cadenas: barra típica ø12 → radio = 0.006 m
    // rec = recubrimiento libre (hasta cara exterior del estribo ø8)
    const barR = isColumn ? 0.008 : 0.006;     // radio barra longitudinal
    const d    = h - m.rec - 0.008 - barR;     // tension-side effective depth
    const d_pr = m.rec + 0.008 + barR;         // compression-side cover to bar centroid
    const b_mm = b * 1000, d_mm = d * 1000, d_pr_mm = d_pr * 1000;

    const rho_min = isColumn
      ? Math.max(0.01, (0.25 * Math.sqrt(m.fc)) / m.fy)  // NCh430: min 1% Ag
      : Math.max((0.25 * Math.sqrt(m.fc)) / m.fy, 1.4 / m.fy);
    const AsMin_mm2 = isColumn ? rho_min * b_mm * (h * 1000) : rho_min * b_mm * d_mm;
    const AsMinCm2  = AsMin_mm2 / 100;

    const beta1 = m.fc <= 28 ? 0.85 : Math.max(0.65, 0.85 - 0.05 * (m.fc - 28) / 7);
    const rho_b  = (0.85 * beta1 * m.fc / m.fy) * (600 / (600 + m.fy));
    // Columnas: límite 4% Ag (NCh430); Vigas: 0.75ρb
    const AsMax_mm2 = isColumn ? 0.04 * b_mm * (h * 1000) : 0.75 * rho_b * b_mm * d_mm;
    const AsMaxCm2  = AsMax_mm2 / 100;

    let AsReq;
    if (!isColumn) {
      // BEAM — singly-reinforced cuadratic (NCh430 §9 / ACI 318-19)
      const Mu_Nmm = Mu * 1e6;
      const A_coef = (phi_b * m.fy * m.fy) / (1.7 * m.fc * b_mm);
      const B_coef = phi_b * m.fy * d_mm;
      const disc   = B_coef ** 2 - 4 * A_coef * Mu_Nmm;
      const AsMuCm2 = disc >= 0 ? (B_coef - Math.sqrt(disc)) / (2 * A_coef) / 100 : null;
      AsReq = AsMuCm2 !== null ? Math.max(AsMuCm2, AsMinCm2) : AsMinCm2;
    } else {
      // COLUMN — sección doblemente armada simétrica (NCh430 §10)
      // As_t = As_c = As_cara  (una cara a la vez)
      // F. equilibrio: Φ[As_cara*fy*(d-a/2) + As_cara*(fy-0.85f'c)*(d-d')] = Mu
      // Donde a = As_cara*fy / (0.85*f'c*b)  (acero de comp. compensa a la tensión, solo hormigón carga neta)
      // Resolución cuadrática en As_cara:
      const Cf   = 0.85 * m.fc * b_mm;                   // 0.85*f'c*b  [N/mm]
      const fy_pr = m.fy - 0.85 * m.fc;                   // esfuerzo efectivo acero compresión
      const arm   = d_mm - d_pr_mm;                       // brazo entre caras de acero
      const Mu_Nmm = Mu * 1e6;
      // -Φ*fy²/(2Cf)*As² + Φ*fy*(d + fy'/fy*arm)*As - Mu = 0
      const K  = phi_b * m.fy * (d_mm + (fy_pr / m.fy) * arm);
      const Jc = phi_b * m.fy * m.fy / (2 * Cf);
      const discC = K * K - 4 * Jc * Mu_Nmm;
      const As_face_mm2 = discC >= 0 ? (K - Math.sqrt(discC)) / (2 * Jc) : null;
      // Mínimo por cara = 1%Ag / 2 caras
      const AsMin_face = AsMinCm2 / 2;
      const As_face_req = As_face_mm2 !== null ? Math.max(As_face_mm2 / 100, AsMin_face) : AsMin_face;
      AsReq = 2 * As_face_req;   // total simétrico
    }

    const Vc_N = 0.17 * Math.sqrt(m.fc) * b_mm * d_mm;
    const Vc   = Vc_N / 1000;
    const Vs   = Math.max(0, Vu / phi_v - Vc);

    const s_max_mm = Math.min(d_mm / 2, 600);
    const stirrups = [8, 10].map(dia => {
      const Av_mm2 = 2 * Math.PI * (dia / 2) ** 2 / 4;
      const s_mm   = Vs > 0 ? (Av_mm2 * m.fy * d_mm) / (Vs * 1000) : s_max_mm;
      const s_adopt = Math.min(Math.floor(s_mm / 5) * 5, s_max_mm);
      return { dia, s_req: s_mm.toFixed(0), s_adopt: s_adopt.toFixed(0),
               s_max: s_max_mm.toFixed(0), ok: s_mm >= s_max_mm * 0.5 };
    });

    // ── NCh2123 §7.7.8 Prescriptive spacing for confining elements (Albañilería Confinada) ──
    // For small residential confining elements (columns/beams approx 15-20cm), tall frame ductile formulas
    // (d/4, b/3) are not applicable as they result in extremely tight, unbuildable spacing (<5cm) that
    // violates aggregate placement rules (creating voids / nidos de piedra).
    // NCh2123 §7.7.8 mandates:
    // - Critical confinement zones (ends): s_crit ≤ 100 mm (10 cm)
    // - Central zones: s_central ≤ 200 mm (typically 150 mm adopted for design safety)
    // If high shear requires tighter spacing, we calculate the steel demand, but enforce a minimum of 80 mm for aggregate flow.
    const de_mm = 8;  // typical Φ8 stirrup
    const Av_mm2 = 2 * Math.PI * (de_mm / 2) ** 2 / 4;
    const s_shear_mm = Vs > 0 ? (Av_mm2 * m.fy * d_mm) / (Vs * 1000) : 150;

    const s_crit_raw = Math.min(100, s_shear_mm);
    const s_crit_mm  = Math.max(80, Math.floor(s_crit_raw / 5) * 5);  // round to 5mm, min 80mm for buildability

    const s_central_raw = Math.min(150, s_shear_mm * 1.5);
    const s_central_mm = Math.max(100, Math.floor(s_central_raw / 5) * 5);

    return {
      AsReq:    AsReq.toFixed(2),
      AsMinCm2: AsMinCm2.toFixed(2),
      AsMaxCm2: AsMaxCm2.toFixed(2),
      Vc: Vc.toFixed(2), Vs: Vs.toFixed(2),
      d_eff_cm: (d * 100).toFixed(1),
      s_max_cm: (s_max_mm / 10).toFixed(1),
      s_crit_mm: s_crit_mm.toFixed(0),
      s_central_mm: s_central_mm.toFixed(0),
      stirrups
    };
  },

  /**
   * Selecciona barras comerciales chilenas para satisfacer AsReq.
   * Escribe el resultado directamente en el objeto rebar del modelo.
   * @param {object} designResult — salida de _designRebar
   * @param {boolean} isColumn
   * @returns rebar object {faces, estribos}
   */
  _autoSelectRebar(designResult, isColumn, isBeamBot = false) {
    const DIAMS_MM = [8, 10, 12, 16, 18, 22, 25, 28, 32];
    const pi = Math.PI;
    const barArea = D => pi * (D / 2) ** 2 / 100;  // mm² → cm²
    const AsReqCm2 = parseFloat(designResult.AsReq)    || 0;
    const AsMinCm2 = parseFloat(designResult.AsMinCm2) || 0;
    const AsTarget = Math.max(AsReqCm2, AsMinCm2, 0.01);

    const stDia   = 8;
    // Espaciamiento gobernante = más restrictivo entre NCh2123 §7.7.8 (s_crit) y NCh430 §11.2 (d/2)
    // Esto garantiza que el armado seleccionado siempre pase la verificación cumple_smax.
    const sMax_m   = parseFloat(designResult.s_max_cm || 60) / 100;       // NCh430 §11.2 → d/2
    const sNCh_m   = Math.max(0.05, parseFloat(designResult.s_crit_mm || 100) / 1000); // NCh2123 §7.7.8
    // Redondear hacia abajo al múltiplo de 5mm más cercano, mínimo 50mm (constructivo)
    const sCrit_raw = Math.min(sNCh_m, sMax_m);
    const sCrit_m   = Math.max(0.05, Math.floor(sCrit_raw * 200) / 200);  // múltiplo de 5mm

    if (isColumn) {
      // ── 4 barras simétricas (2 por cara) — diámetro mínimo ø16 para pilares de confinamiento ──
      // Criterio constructivo: ø16 garantiza rigidez del armado, facilita el amarre de estribos
      // y mantiene consistencia con la sección 20×20 (pilar de albañilería confinada).
      const COL_DIAMS_MM = DIAMS_MM.filter(D => D >= 16);  // mínimo ø16
      let nBars = 4, selectedD = null;
      for (const D of COL_DIAMS_MM) {
        if (nBars * barArea(D) >= AsTarget) { selectedD = D; break; }
      }
      // Si supera ø22 con 4 barras: escalar a 6 barras (3 por cara)
      if (!selectedD || (nBars === 4 && selectedD > 22)) {
        nBars = 6; selectedD = null;
        for (const D of COL_DIAMS_MM) {
          if (nBars * barArea(D) >= AsTarget) { selectedD = D; break; }
        }
      }
      if (!selectedD) selectedD = 32;  // máximo posible

      const nPerFace = nBars / 2;
      const AsFace   = +(nPerFace * barArea(selectedD)).toFixed(2);
      return {
        faces: {
          superior: { nombre:'Superior', barras:[{cantidad:nPerFace, diámetro:selectedD}], AsTotal:AsFace, cumple:true },
          inferior: { nombre:'Inferior',  barras:[{cantidad:nPerFace, diámetro:selectedD}], AsTotal:AsFace, cumple:true }
        },
        estribos: { diámetro:stDia, espaciamiento:sCrit_m, cumple:true },
        _auto: true
      };
    } else {
      if (isBeamBot) {
        // Sobrecimiento (mínimo ø12 para flexión)
        const BEAM_DIAMS = [12, 16, 18, 22, 25, 28, 32];
        let selectedD = null;
        for (const D of BEAM_DIAMS) {
          if (2 * barArea(D) >= AsTarget) { selectedD = D; break; }
        }
        if (!selectedD) selectedD = 32;

        const AsFace = +(2 * barArea(selectedD)).toFixed(2);
        return {
          faces: {
            superior: { nombre:'Superior', barras:[{cantidad:2, diámetro:selectedD}], AsTotal:AsFace, cumple:true },
            piel: { nombre:'De Piel (Intermedia)', barras:[{cantidad:2, diámetro:10}], AsTotal:1.57, cumple:true },
            inferior: { nombre:'Inferior',  barras:[{cantidad:2, diámetro:selectedD}], AsTotal:AsFace, cumple:AsFace>=AsTarget }
          },
          estribos: { diámetro:stDia, espaciamiento:sCrit_m, cumple:true },
          _auto: true
        };
      }

      // ── VIGA/CADENA: 2 barras por cara — mín ø10 (NCh2123 §7.7.8: 4ø10 cadenas) ──
      const BEAM_DIAMS = [10, 12, 16, 18, 22, 25, 28, 32];
      let selectedD = null;
      for (const D of BEAM_DIAMS) {
        if (2 * barArea(D) >= AsTarget) { selectedD = D; break; }
      }
      if (!selectedD) selectedD = 32;

      const AsFace = +(2 * barArea(selectedD)).toFixed(2);
      return {
        faces: {
          superior: { nombre:'Superior', barras:[{cantidad:2, diámetro:selectedD}], AsTotal:AsFace, cumple:true },
          inferior: { nombre:'Inferior',  barras:[{cantidad:2, diámetro:selectedD}], AsTotal:AsFace, cumple:AsFace>=AsTarget }
        },
        estribos: { diámetro:stDia, espaciamiento:sCrit_m, cumple:true },
        _auto: true
      };
    }
  },

  // ── Combinaciones de Cargas LRFD y ASD ──────────────────────
  calculateLoadCombinations() {
    const ld = S.story.loads;
    const qD = ld.qD || 0;
    const qL = ld.qL || 0;
    const qRoof = ld.qRoof || 0;

    // Cargas laterales
    const cs = this._calculateCs();
    const qw = this._calculateWindPressure();
    const F_seismic = cs * 11.05; // ~11.05 kN/m peso típico
    const F_wind = qw;

    // LRFD Combinations (factores mayorados)
    const lrfd = [
      {
        num: 1,
        name: '1.4 D',
        formula: '1.4·D',
        result: (1.4 * qD).toFixed(2),
        lateral: null
      },
      {
        num: 2,
        name: '1.2 D + 1.6 L + 0.5 Roof',
        formula: '1.2·D + 1.6·L + 0.5·Techo',
        result: (1.2 * qD + 1.6 * qL + 0.5 * qRoof).toFixed(2),
        lateral: null
      },
      {
        num: '3a',
        name: '1.2 D + 1.6 Roof + L',
        formula: '1.2·D + 1.6·Techo + L',
        result: (1.2 * qD + 1.6 * qRoof + qL).toFixed(2),
        lateral: null
      },
      {
        num: '3b',
        name: '1.2 D + 1.6 Roof + 0.8 W',
        formula: '1.2·D + 1.6·Techo + 0.8·W',
        result: (1.2 * qD + 1.6 * qRoof + 0.8 * F_wind).toFixed(2),
        lateral: '0.8 W (viento)'
      },
      {
        num: 4,
        name: '1.2 D + 1.6 W + L + 0.5 Roof',
        formula: '1.2·D + 1.6·W + L + 0.5·Techo',
        result: (1.2 * qD + 1.6 * F_wind + qL + 0.5 * qRoof).toFixed(2),
        lateral: '1.6 W (viento)'
      },
      {
        num: 5,
        name: '1.2 D + 1.4 E + L + 0.2 Roof',
        formula: '1.2·D + 1.4·E + L + 0.2·Techo',
        result: (1.2 * qD + 1.4 * F_seismic + qL + 0.2 * qRoof).toFixed(2),
        lateral: '1.4 E (sismo bidireccional)'
      },
      {
        num: 6,
        name: '0.9 D + 1.6 W',
        formula: '0.9·D + 1.6·W',
        result: (0.9 * qD + 1.6 * F_wind).toFixed(2),
        lateral: '1.6 W (viento)'
      },
      {
        num: 7,
        name: '0.9 D + 1.4 E',
        formula: '0.9·D + 1.4·E',
        result: (0.9 * qD + 1.4 * F_seismic).toFixed(2),
        lateral: '1.4 E (sismo bidireccional)'
      }
    ];

    // ASD Combinations (cargas nominales)
    const asd = [
      {
        num: 1,
        name: 'D',
        formula: 'D',
        result: qD.toFixed(2),
        lateral: null
      },
      {
        num: 2,
        name: 'D + L',
        formula: 'D + L',
        result: (qD + qL).toFixed(2),
        lateral: null
      },
      {
        num: 3,
        name: 'D + Roof',
        formula: 'D + Techo',
        result: (qD + qRoof).toFixed(2),
        lateral: null
      },
      {
        num: 4,
        name: 'D + 0.75 L + 0.75 Roof',
        formula: 'D + 0.75·L + 0.75·Techo',
        result: (qD + 0.75 * qL + 0.75 * qRoof).toFixed(2),
        lateral: null
      },
      {
        num: '5a',
        name: 'D + W',
        formula: 'D + W',
        result: (qD + F_wind).toFixed(2),
        lateral: 'W (viento)'
      },
      {
        num: '5b',
        name: 'D + E',
        formula: 'D + E',
        result: (qD + F_seismic).toFixed(2),
        lateral: 'E (sismo bidireccional)'
      },
      {
        num: '6a',
        name: 'D + 0.75 W + 0.75 L + 0.75 Roof',
        formula: 'D + 0.75·W + 0.75·L + 0.75·Techo',
        result: (qD + 0.75 * F_wind + 0.75 * qL + 0.75 * qRoof).toFixed(2),
        lateral: '0.75 W (viento)'
      },
      {
        num: '6b',
        name: 'D + 0.75 E + 0.75 L + 0.75 Roof',
        formula: 'D + 0.75·E + 0.75·L + 0.75·Techo',
        result: (qD + 0.75 * F_seismic + 0.75 * qL + 0.75 * qRoof).toFixed(2),
        lateral: '0.75 E (sismo bidireccional)'
      },
      {
        num: '7',
        name: '0.6 D + W',
        formula: '0.6·D + W',
        result: (0.6 * qD + F_wind).toFixed(2),
        lateral: 'W (viento)'
      },
      {
        num: 8,
        name: '0.6 D + E',
        formula: '0.6·D + E',
        result: (0.6 * qD + F_seismic).toFixed(2),
        lateral: 'E (sismo bidireccional)'
      }
    ];

    return { lrfd, asd };
  },

  _calculateCs() {
    const ld = S.story.lateral || {};
    const seismicData = ld.seismic || { zone: 3, soilType: 'D', I: 1.0, R: 4 };

    const A0_map = { 1: 0.20, 2: 0.30, 3: 0.40 };
    const S_soil_map = { A: 0.90, B: 1.00, C: 1.05, D: 1.20, E: 1.30 };

    const A0 = A0_map[seismicData.zone] || 0.40;
    const S_soil = S_soil_map[seismicData.soilType] || 1.20;
    const I = seismicData.I || 1.0;
    const R = seismicData.R || 4;

    const Cs_calc = (2.75 * A0 * S_soil * I) / R;
    const Cs_min = (A0 * I) / 6;
    const Cs_max = 0.35;

    return Math.max(Cs_min, Math.min(Cs_calc, Cs_max));
  },

  _calculateWindPressure() {
    const ld = S.story.lateral || {};
    const windData = ld.wind || { V_basic: 35 };
    const V = windData.V_basic || 35;

    // q_w = 0.00613 × V² (SI units) para qw en kPa
    // Convertir a kN/m para consistencia con cargas verticales
    return (0.00613 * V * V) / 1.0;
  }
};
