/**
 * STATE.JS — Modelo de Estado Global v2
 * Arquitectura multi-vano: nodes / spans / columns
 */

function defaultRebar(type = 'beam') {
  if (type === 'foundation') {
    return {
      faces: {
        superior: { nombre: 'Superior', barras: [{ cantidad: 2, diámetro: 12 }], AsTotal: 2.26, cumple: true },
        piel: { nombre: 'De Piel', barras: [{ cantidad: 2, diámetro: 8 }], AsTotal: 1.01, cumple: true },
        inferior: { nombre: 'Inferior', barras: [{ cantidad: 2, diámetro: 12 }], AsTotal: 2.26, cumple: true }
      },
      estribos: { diámetro: 8, espaciamiento: 0.15, cumple: true }
    };
  }

  // Cadena superior: Mu≈0.22kN·m, Vu≈1.62kN (cargas Metalcon real)
  // NCh2123 §7.7.8 mín 4Ø10 en confinamientos → 2Ø10 c/cara + Ø8@150mm
  if (type === 'beam_top') {
    return {
      faces: {
        superior: { nombre: 'Superior', barras: [{ cantidad: 2, diámetro: 10 }], AsTotal: 1.57, cumple: true },
        inferior: { nombre: 'Inferior', barras: [{ cantidad: 2, diámetro: 10 }], AsTotal: 1.57, cumple: true }
      },
      estribos: { diámetro: 8, espaciamiento: 0.15, cumple: true }
    };
  }

  // Cadena inferior: Mu≈7.67kN·m, As_req≈2.12cm² (muro+cargas Metalcon)
  // NCh2123 §7.7.8 mín 4Ø10 → 2Ø10 c/cara (As=3.14cm²>As_req) — sección OK
  if (type === 'beam_bot') {
    return {
      faces: {
        superior: { nombre: 'Superior', barras: [{ cantidad: 2, diámetro: 12 }], AsTotal: 2.26, cumple: true },
        piel: { nombre: 'De Piel (Intermedia)', barras: [{ cantidad: 2, diámetro: 8 }], AsTotal: 1.01, cumple: true },
        inferior: { nombre: 'Inferior', barras: [{ cantidad: 2, diámetro: 12 }], AsTotal: 2.26, cumple: true }
      },
      estribos: { diámetro: 8, espaciamiento: 0.15, cumple: true }
    };
  }

  // Pilares: As_req≈2.75cm² (columna esquina con Fc=4kN Metalcon)
  // NCh2123 §7.7.8 mín 4Ø10 → 2Ø10 c/cara (As=3.14cm²>As_req) — cumple
  if (type === 'column') {
    return {
      faces: {
        superior: { nombre: 'Superior', barras: [{ cantidad: 2, diámetro: 10 }], AsTotal: 1.57, cumple: true },
        inferior: { nombre: 'Inferior', barras: [{ cantidad: 2, diámetro: 10 }], AsTotal: 1.57, cumple: true }
      },
      estribos: { diámetro: 8, espaciamiento: 0.15, cumple: true }
    };
  }

  return {
    faces: {
      superior: { nombre: 'Superior', barras: [{ cantidad: 2, diámetro: 10 }], AsTotal: 1.57, cumple: true },
      inferior: { nombre: 'Inferior', barras: [{ cantidad: 2, diámetro: 10 }], AsTotal: 1.57, cumple: true }
    },
    estribos: { diámetro: 8, espaciamiento: 0.15, cumple: true }
  };
}

function initState() {
  // ── Geometría: 6 muros de adosamiento (muro de contención) ──────────
  // Cada muro de 2.88m de ancho
  // 3 viviendas modulares de ~25m² (cada 2 muros = 1 vivienda)
  // H total = 2.50m (altura para casas de un piso + techo)
  // Sección pilares: b=0.20m, h=0.25m (Opción C: h aumentado de 0.15→0.25m)
  // Justificación NCh430 §11.2: s_max = d/2 → con h=0.25 da d≈204mm → s_max=102mm
  // NCh2123 §7.7.8: s_crit=100mm=10cm (zona extremo), s_central=150mm=15cm (zona central)
  // Con h=0.25: s_max(102mm) > s_crit(100mm) → estribos a 10cm sin sacrificar d/2
  // Muro tw=0.14m (ladrillo 14cm)
  const COL_H = 0.25;  // profundidad pilar (dirección de carga lateral)
  const COL_B = 0.20;  // ancho pilar
  const SPAN  = 2.88;  // ancho de cada muro
  const H_STORY = 2.50;

  function makeSpan(id, from, to) {
    return {
      id, fromNode: from, toNode: to,
      type: 'muro', tw: 0.14,
      beamTop: { section: { b: COL_B, h: 0.15 }, rebar: defaultRebar('beam_top') },  // h=0.15 fijo (cadena superior ≠ pilar)
      beamBot: { section: { b: 0.15, h: 0.60 }, rebar: defaultRebar('beam_bot') }  // b=0.15 fijo (espesor muro tw)
    };
  }
  function makeCol(id) {
    return { [id]: { section: { b: COL_B, h: COL_H }, rebar: defaultRebar('column') } };
  }

  // Arena mal graduada SP — Concepción, Chile
  const concepcionStrata = [
    { id: 'str0', name: 'Arena Mal Graduada SP (Relleno)', h: 3.0,
      type: 'drenado', gamma: 18.0, phi: 35, c: 0, uscs: 'SP' }
  ];

  const defaultFoundation = {
    B: 0.80, Hf: 0.60, Df: 0.85,
    NF: 3.0,           // Nivel Freático a 3m (al límite inferior del estrato)
    FS: 3.0,
    beta: 0,
    type: 'L',         // 'T' (simétrica) | 'L' (asimétrica hacia derecha) | 'L-inv' (asimétrica hacia izquierda)
    strata: concepcionStrata,
    rebar: defaultRebar('foundation')
  };

  return {
    story: {
      H: H_STORY,
      // Vivienda Metalcon 25m², tributario 2.36m: 50+50 kgf/m²×2.36 = 2.36kN/m total
      // Lateral Metalcon: 42 kgf/m distribuido en cadena sup, 400kgf puntual en esquina
      // qRoof = 0.50 kN/m² → techo no accesible (solo desvío aguas lluvias)
      // Justificación: NCh1537 Tabla 3.1 — techo no transitable, mínimo normativo por mantención
      loads:     { qD: 1.18, qL: 1.18, qRoof: 0.50, fd: 1.2, fl: 1.6, fRoof: 1.2,
                   metalcon_qw: 0.42, metalcon_Fc: 4.0,
                   w_wind: 0, w_sismo: 0 },
      materials: { fc: 25, fy: 420, gc: 25, gm: 18, rec: 0.03 },
      foundation: defaultFoundation,
      // ── Cargas laterales (NCh433 sismo + NCh432 viento) ──
      // Concepción: zona sísmica 3, suelo SP (~D), categoría II → I=1.0
      lateral: {
        seismic: { zone: 3, soilType: 'D', I: 1.0, R: 4 },
        wind:    { V_basic: 35 },  // m/s, NCh432 zona costera VIII
        // Altura de aplicación = centroide del muro (H/2) por defecto
        hApplyMode: 'auto'  // 'auto' = H/2  |  'top' = H
      }
    },

    nodes: [
      { id: 'n0', x: 0              },
      { id: 'n1', x: SPAN           },
      { id: 'n2', x: SPAN * 2       },
      { id: 'n3', x: SPAN * 3       },
      { id: 'n4', x: SPAN * 4       },
      { id: 'n5', x: SPAN * 5       },
      { id: 'n6', x: SPAN * 6       }
    ],

    spans: [
      makeSpan('sp0', 'n0', 'n1'),
      makeSpan('sp1', 'n1', 'n2'),
      makeSpan('sp2', 'n2', 'n3'),
      makeSpan('sp3', 'n3', 'n4'),
      makeSpan('sp4', 'n4', 'n5'),
      makeSpan('sp5', 'n5', 'n6')
    ],

    columns: {
      ...makeCol('n0'), ...makeCol('n1'), ...makeCol('n2'),
      ...makeCol('n3'), ...makeCol('n4'), ...makeCol('n5'),
      ...makeCol('n6')
    },

    // ── Legado: alias para inputs del sidebar ───────────────────────
    geometry:  { L: SPAN, H: H_STORY, tw: 0.14 },
    loads:     { qD: 1.18, qL: 1.18, qRoof: 0.50, fd: 1.2, fl: 1.6, fRoof: 1.2,
                 metalcon_qw: 0.42, metalcon_Fc: 4.0 },
    materials: { fc: 25, fy: 420, gc: 25, gm: 18, rec: 0.03 },
    foundation: { ...defaultFoundation,
                  strata: [...concepcionStrata.map(s => ({...s}))] },

    results: {
      qu: null,
      spans:   {},
      columns: {},
      foundation: null,
      lateral: null,   // { Cs, q_w, F_seismic, F_wind, F_h, hApply, byDir: {pos, neg} }
      beam_top: null, beam_bot: null, column: null, wall: null
    },

    ui: {
      selectedEl:   null,
      selectedSpan: 'sp0',
      selectedNode: 'n0',
      projectDirty: false,
      view: { x: 0, y: 0, zoom: 1 }
    },

    diagrams: { moment: false, shear: false, axial: false, normalize: true }
  };
}


let S = initState();

// ── Helpers de geometría multi-vano ────────────────────────────────
function getSpanL(span) {
  const from = S.nodes.find(n => n.id === span.fromNode);
  const to   = S.nodes.find(n => n.id === span.toNode);
  return to.x - from.x;
}

function getSpanFromX(span) {
  return S.nodes.find(n => n.id === span.fromNode).x;
}

function getTotalL() {
  if (!S.nodes || S.nodes.length < 2) return S.geometry.L;
  return S.nodes[S.nodes.length - 1].x - S.nodes[0].x;
}

// Devuelve el elemento raíz del vano activo (beamTop, beamBot)
// o el nodo activo (column)
function getActiveElement(elType) {
  if (elType === 'beam_top') return S.spans.find(sp => sp.id === S.ui.selectedSpan)?.beamTop;
  if (elType === 'beam_bot') return S.spans.find(sp => sp.id === S.ui.selectedSpan)?.beamBot;
  if (elType === 'column')   return S.columns[S.ui.selectedNode];
  if (elType === 'wall')     return S.spans.find(sp => sp.id === S.ui.selectedSpan);
  if (elType === 'foundation') return S.story.foundation;
  return null;
}

// Devuelve resultados del elemento activo
function getActiveResults(elType) {
  const spanRes = S.results.spans[S.ui.selectedSpan];
  if (elType === 'beam_top') return spanRes?.beamTop;
  if (elType === 'beam_bot') return spanRes?.beamBot;
  if (elType === 'column')   return S.results.columns[S.ui.selectedNode];
  if (elType === 'wall')     return spanRes?.wall;
  if (elType === 'foundation') return S.results.foundation;
  return null;
}
