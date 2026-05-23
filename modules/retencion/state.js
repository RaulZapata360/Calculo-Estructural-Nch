/**
 * STATE-RW.JS — Estado del Muro de Contención v1
 * Modelo independiente — no modifica el estado S del muro de adosamiento
 * Valores iniciales: muro 6m × 1m desnivel, grava drenante GP (φ=35°)
 *
 * Zonas de suelo consideradas:
 *   RELLENO   : grava drenante GP/GW  (detrás del muro, lado retenido)
 *   FUNDACIÓN : base estabilizada CBR~80% (sello bajo zapata)
 *   LIBRE     : terreno natural (frente del muro, lado libre)
 */

function initRW() {
  return {
    // ── Geometría ────────────────────────────────────────────────
    geometry: {
      H_libre: 1.00,   // m  altura libre sobre N.T.N. (coronación del muro)
      H_emp:   0.40,   // m  empotramiento bajo N.T.N. (frente / lado libre)
      t_muro:  0.25,   // m  espesor de la pantalla de hormigón
      L:       6.00,   // m  longitud total del muro
      B_zap:   1.20,   // m  ancho total de la zapata corrida (60 cm c/lado del eje)
      Hf:      0.25,   // m  altura de la zapata
      B_toe:   0.50,   // m  proyección delantera (60cm - t_muro/2)
      // B_talon = B_zap - B_toe - t_muro  →  calculado en solver
    },

    // ── Suelo retenido (RELLENO: grava drenante GP/GW) ──────────
    soil: {
      gamma:   19.0,   // kN/m³  grava drenante compactada
      phi:     35,     // °  ángulo de fricción interna grava GP
      c:        0,     // kPa  sin cohesión (granular)
      delta:    0,     // °  fricción muro–suelo (0 = Rankine puro)
      NF:       3.0,   // m  nivel freático (grava drena → NF profundo)
      uscs:   'GP',    // Grava mal graduada, drenante

      // ── Sello de fundación (base estabilizada) ───────────────
      qAdm:   200,     // kPa  capacidad portante admisible (pre-mecánica)
      cbr:     80,     // %   CBR base estabilizada compactada
    },

    // ── Cargas ───────────────────────────────────────────────────
    loads: {
      qSobrecarga: 0,  // kPa  sobrecarga distribuida sobre el relleno (vehículos…)
    },

    // ── Materiales ───────────────────────────────────────────────
    materials: {
      fc:    25,       // MPa  resistencia hormigón H25
      fy:   420,       // MPa  acero A630-420H (NCh430)
      gc:    25.0,     // kN/m³  peso específico hormigón armado
      rec:      0.07,    // m  recubrimiento libre base zapata (contacto directo suelo)
      rec_pant: 0.05,    // m  recubrimiento pantalla (con encofrado, NCh430 §3.1)
    },

    // ── Resultados (actualizado por RWSolver.run()) ───────────────
    results: null,

    // ── UI ───────────────────────────────────────────────────────
    ui: { tab: 'geo' },
  };
}

/** Instancia global del estado del muro de contención */
let RW = initRW();
