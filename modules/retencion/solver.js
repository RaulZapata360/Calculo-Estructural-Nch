/**
 * SOLVER-RW.JS — Cálculo Muro de Contención v2
 *
 * Teoría:  Rankine (c=0, δ=0, relleno horizontal)
 * Norma:   NCh3171 — FS_vol ≥ 1.5, FS_des ≥ 1.5 (estático)
 *          NCh430  — Diseño LRFD pantalla y zapata
 *
 * Convención de signos:
 *   x = 0  →  punta (toe) del pie de zapata (esquina delantera inferior)
 *   x > 0  →  hacia el talón (lado retenido)
 *   y = 0  →  superficie del relleno retenido
 *   y > 0  →  profundidad (hacia abajo)
 */

const RWSolver = {

  run(rw = RW) {
    const g = rw.geometry;
    const s = rw.soil;
    const l = rw.loads;
    const m = rw.materials;

    const φ = s.phi * Math.PI / 180;

    // ── 1. Coeficientes de Rankine ─────────────────────────────────
    const Ka = Math.pow(Math.tan(Math.PI / 4 - φ / 2), 2);
    const Kp = Math.pow(Math.tan(Math.PI / 4 + φ / 2), 2);

    // ── 2. Geometría derivada ──────────────────────────────────────
    const B_talon  = Math.max(0, g.B_zap - g.B_toe - g.t_muro);
    const H_stem   = g.H_libre + g.H_emp;      // m  altura pantalla (para diseño estructural)
    const H        = H_stem + g.Hf;             // m  altura TOTAL retenida (NCh 02 §1.1 nota)
    const H_total  = H;                          // alias explícito

    // ── 3. Diagrama de presión activa ─────────────────────────────
    //  σa(z) = Ka·γ·z + Ka·q   [kPa]   z desde superficie libre del relleno
    const σa_sup   = Ka * l.qSobrecarga;
    const σa_base  = Ka * (s.gamma * H + l.qSobrecarga);  // presión en BASE de zapata

    //  Pa sobre altura total H (NCh 02 §1.1 nota: H incluye H_f)
    const Pa_tri   = 0.5 * Ka * s.gamma * H * H;   // kN/m  triángulo (suelo)
    const Pa_rec   = σa_sup * H;                    // kN/m  rectángulo (sobrecarga)
    const Pa       = Pa_tri + Pa_rec;               // kN/m  fuerza activa total

    //  Brazos desde BASE de la zapata (punta = x=0):
    const ya_tri   = H / 3;                         // m  brazo triángulo (H_total/3)
    const ya_rec   = H / 2;                         // m  brazo rectángulo

    //  Momento volcamiento sobre la PUNTA:
    const Mo       = Pa_tri * ya_tri + Pa_rec * ya_rec;  // kN·m/m

    // ── 4. Presión pasiva ─────────────────────────────────────────
    //  Se calcula para mostrar informativamente, pero NO se incluye en FS_d.
    //  NCh 02 §3.2: práctica conservadora chilena → omisión total de Pp.
    const Pp       = 0.5 * Kp * s.gamma * g.H_emp * g.H_emp;  // kN/m (solo informativo)

    // ── 5. Pesos por metro lineal ──────────────────────────────────
    const W_pantalla = m.gc    * g.t_muro * H_stem;          // kN/m
    const W_zapata   = m.gc    * g.B_zap  * g.Hf;            // kN/m
    const W_suelo    = s.gamma * B_talon  * H_stem;           // kN/m  suelo sobre talón
    const W_sc       = l.qSobrecarga * B_talon;               // kN/m  sobrecarga sobre talón
    const N          = W_pantalla + W_zapata + W_suelo + W_sc;// kN/m  resultante vertical

    // ── 6. Brazos desde la punta ──────────────────────────────────
    const x_pantalla = g.B_toe + g.t_muro / 2;
    const x_zapata   = g.B_zap / 2;
    const x_suelo    = g.B_toe + g.t_muro + B_talon / 2;
    const x_sc       = x_suelo;

    const Mr = W_pantalla * x_pantalla
             + W_zapata   * x_zapata
             + W_suelo    * x_suelo
             + W_sc       * x_sc;               // kN·m/m  momento resistente

    // ── 7. Factores de seguridad (NCh3171 ASD) ────────────────────
    const FS_volcamiento   = (Mo > 0) ? Mr / Mo : Infinity;

    const μ                = Math.tan((2 / 3) * φ);        // fricción concreto–suelo
    //  NCh 02 §3.2: Pp = 0 (omisión total, práctica conservadora Chile)
    const FS_deslizamiento = (Pa > 0) ? (μ * N) / Pa : Infinity;

    // ── 8. Excentricidad y presión bajo zapata ─────────────────────
    const xR    = (Mr - Mo) / N;
    const e     = g.B_zap / 2 - xR;
    const e_max = g.B_zap / 6;

    let q_punta, q_talon;
    if (Math.abs(e) <= e_max) {
      // Distribución trapezoidal (núcleo central)
      q_punta = (N / g.B_zap) * (1 + 6 * Math.abs(e) / g.B_zap);
      q_talon = (N / g.B_zap) * (1 - 6 * Math.abs(e) / g.B_zap);
      if (e < 0) { [q_punta, q_talon] = [q_talon, q_punta]; }
    } else {
      // Fuera del núcleo → triángulo Meyerhof (sin tracción)
      const xR_safe = Math.max(0.01, xR);
      q_punta = (2 * N) / (3 * xR_safe);
      q_talon = 0;
    }

    // ── 9. Diseño estructural pantalla (voladizo, NCh430 §3) ───────
    //  Sección crítica: base de pantalla / interfaz pantalla–zapata (z = H_stem)
    //  Presión activa actúa sobre H_stem (cara de la pantalla, no la zapata)
    const Pa_stem_tri  = 0.5 * Ka * s.gamma * H_stem * H_stem;
    const Pa_stem_rec  = σa_sup * H_stem;
    const M_base       = Pa_stem_tri * (H_stem / 3) + Pa_stem_rec * (H_stem / 2);  // kN·m/m serv.
    const V_base       = Pa_stem_tri + Pa_stem_rec;                                  // kN/m serv.

    //  Combinación LRFD: U = 1.2D + 1.6H (D no contribuye a M en pantalla)
    const Mu_stem = 1.6 * M_base;  // kN·m/m
    const Vu_stem = 1.6 * V_base;  // kN/m

    //  Peralte efectivo pantalla (rec_pant = 5cm con encofrado, NCh430 §3.1)
    const rec_pant  = m.rec_pant !== undefined ? m.rec_pant : 0.05;  // m
    const d_stem    = Math.max(0.01, g.t_muro - rec_pant - 0.006);   // m (barra Ø12)

    const φ_flex   = 0.90;
    const φ_shear  = 0.75;

    //  As_req pantalla (NCh430 §3.2)
    //  Rn [MPa] = (Mu[kN·m/m] / φ) / (d[m]² × 1000)  — ver derivación dimensional
    const Rn_stem  = (Mu_stem / φ_flex) / (d_stem * d_stem * 1000);  // MPa
    const arg_stem = Math.max(0, 1 - 2 * Rn_stem / (0.85 * m.fc));   // fc en MPa
    const ρ_req_stem = (0.85 * m.fc / m.fy) * (1 - Math.sqrt(arg_stem));
    const ρ_min_wall = 0.0015;   // NCh430 §14.3 para barras ≤ Ø16 mm
    const ρ_stem   = Math.max(ρ_req_stem, ρ_min_wall);
    const As_req   = ρ_stem * d_stem * 10000;   // cm²/m (b = 1 m)

    //  Verificación corte pantalla: φVc ≥ Vu (si falla → aumentar t_muro)
    //  φVc [kN/m] = 0.75 × 0.17 × √f'c [MPa] × 1000 mm × d [m]
    const φVc_stem    = φ_shear * 0.17 * Math.sqrt(m.fc) * 1000 * d_stem;  // kN/m
    const shear_ok_stem = φVc_stem >= Vu_stem;

    // ── 10. Diseño estructural zapata (NCh430 §4) ──────────────────
    //  Peralte efectivo zapata (rec_zapata = 7 cm base, NCh430 §5.1)
    const rec_zap   = m.rec;                                        // m (0.07 por defecto)
    const d_zap     = Math.max(0.01, g.Hf - rec_zap - 0.006);     // m

    //  Presión lineal en puntos clave (x desde punta)
    //  q(x) = q_punta + (q_talon − q_punta) × x / B_zap
    const x_carA    = g.B_toe;                    // cara anterior pantalla
    const x_carB    = g.B_toe + g.t_muro;         // cara posterior pantalla
    const q_carA    = q_punta + (q_talon - q_punta) * x_carA / g.B_zap;
    const q_carB    = q_punta + (q_talon - q_punta) * x_carB / g.B_zap;

    // ── PUNTA (Toe): voladizo de longitud B_toe ───────────────────
    //  Carga neta ascendente = presión suelo − peso propio zapata
    const w_toe_0   = q_punta - m.gc * g.Hf;    // en x=0 (punta)
    const w_toe_A   = q_carA  - m.gc * g.Hf;    // en cara anterior pantalla
    //  M en cara anterior (momento = ∫ w·ξ dξ desde punta → L²/6×(w₀+2wA))
    const M_toe_srv = g.B_toe * g.B_toe / 6 * (2 * w_toe_0 + w_toe_A);  // kN·m/m serv.
    const Mu_toe    = Math.max(0, 1.6 * M_toe_srv);

    //  V a distancia d de cara anterior (cortante en punta)
    const xi_v_toe  = Math.max(0, g.B_toe - d_zap);
    const q_v_toe   = q_punta + (q_talon - q_punta) * xi_v_toe / g.B_zap;
    const w_v_toe   = q_v_toe - m.gc * g.Hf;
    const V_toe_srv = (w_toe_0 + w_v_toe) / 2 * xi_v_toe;               // kN/m serv.
    const Vu_toe    = Math.max(0, 1.6 * V_toe_srv);

    //  As punta (acero en cara inferior)
    const Rn_toe    = (Mu_toe / φ_flex) / (d_zap * d_zap * 1000);  // MPa
    const arg_toe   = Math.max(0, 1 - 2 * Rn_toe / (0.85 * m.fc));   // fc en MPa
    const ρ_req_toe = (0.85 * m.fc / m.fy) * (1 - Math.sqrt(arg_toe));
    const ρ_min_zap = 0.0018;   // NCh430 §14.3 zapata
    const As_toe    = Math.max(ρ_req_toe, ρ_min_zap) * d_zap * 10000;  // cm²/m

    // ── TALÓN (Heel): voladizo de longitud B_talon ─────────────────
    //  Carga neta descendente = (suelo + zapata + sc) − presión suelo
    const w_down    = s.gamma * H_stem + m.gc * g.Hf + l.qSobrecarga;  // kPa ↓ total
    const w_heel_B  = w_down - q_carB;    // neto descendente en cara posterior
    const w_heel_T  = w_down - q_talon;   // neto descendente en talón
    //  M en cara posterior (momento = L²/6×(w_B + 2w_T))
    const M_heel_srv = B_talon * B_talon / 6 * (w_heel_B + 2 * w_heel_T);  // kN·m/m serv.
    const Mu_heel    = Math.max(0, 1.6 * M_heel_srv);

    //  V en cara posterior (cortante talón)
    const V_heel_srv = (w_heel_B + w_heel_T) / 2 * B_talon;
    const Vu_heel    = Math.max(0, 1.6 * V_heel_srv);

    //  As talón (acero en cara superior)
    const Rn_heel   = (Mu_heel / φ_flex) / (d_zap * d_zap * 1000);  // MPa
    const arg_heel  = Math.max(0, 1 - 2 * Rn_heel / (0.85 * m.fc));   // fc en MPa
    const ρ_req_heel = (0.85 * m.fc / m.fy) * (1 - Math.sqrt(arg_heel));
    const As_heel   = Math.max(ρ_req_heel, ρ_min_zap) * d_zap * 10000;  // cm²/m

    //  φVc zapata (misma fórmula, d_zap)
    const φVc_zap     = φ_shear * 0.17 * Math.sqrt(m.fc) * 1000 * d_zap;  // kN/m
    const shear_ok_toe  = φVc_zap >= Vu_toe;
    const shear_ok_heel = φVc_zap >= Vu_heel;

    return {
      // Coeficientes
      Ka, Kp, μ,

      // Presiones activas
      σa_sup, σa_base,
      Pa_tri, Pa_rec, Pa,
      ya_tri, ya_rec, Mo,

      // Pasivo (solo informativo — no se usa en FS_d por NCh)
      Pp,

      // Pesos
      W_pantalla, W_zapata, W_suelo, W_sc, N,
      x_pantalla, x_zapata, x_suelo,

      // Estabilidad
      Mr, FS_volcamiento, FS_deslizamiento,

      // Presión base
      xR, e, e_max, q_punta, q_talon,
      q_carA, q_carB,

      // Diseño pantalla (stem)
      M_base, V_base, Mu_stem, Vu_stem,
      d_stem, As_req, φVc_stem, shear_ok_stem,

      // Diseño zapata — punta
      d_zap, Mu_toe, Vu_toe, As_toe, shear_ok_toe, φVc_zap,
      w_toe_0, w_toe_A,

      // Diseño zapata — talón
      Mu_heel, Vu_heel, As_heel, shear_ok_heel,
      w_heel_B, w_heel_T, w_down,

      // Geometría derivada
      B_talon, H_stem, H, H_total,
    };
  },
};
