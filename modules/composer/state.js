/**
 * COMPOSER/STATE.JS — Estado del Compositor Interactivo
 *
 * CS es el estado del módulo compositor (independiente de S).
 * Los elementos colocados aquí son convertidos a S.spans[] por el bridge
 * una vez que el reconocedor identifica la estructura.
 */

let CS = initCS();

function initCS() {
  return {
    // ── Elementos colocados en el canvas ─────────────────────────
    // type: 'column' | 'beam' | 'wall-panel' | 'footing'
    // (x1,y1) → (x2,y2) en metros, sistema mundo (Y↑)
    elements: [],

    // ── Nodos de conexión (intersecciones entre elementos) ───────
    nodes: [],

    // ── Estructuras reconocidas ──────────────────────────────────
    recognitions: [],

    // ── Herramienta activa ───────────────────────────────────────
    activeTool: null,   // 'column' | 'beam' | 'wall-panel' | 'footing' | null

    // ── Placement en curso (ghost) ───────────────────────────────
    ghost: null,        // {type, x1,y1,x2,y2} mientras el usuario arrastra

    // ── Configuración ────────────────────────────────────────────
    snapGrid: 0.10,     // m — snap a grid de 10 cm
    snapNodeDist: 0.15, // m — distancia para snap a nodo existente

    // ── Contadores de ID ─────────────────────────────────────────
    _elCount:   0,
    _nodeCount: 0,
    _compCount: 0,
  };
}

/** Limpia el estado del compositor */
function resetCS() {
  CS = initCS();
}

/** Genera un ID único para elemento */
function _csElId()   { return 'el_'   + (CS._elCount++); }
function _csNodeId() { return 'cn_'   + (CS._nodeCount++); }
function _csCompId() { return 'comp_' + (CS._compCount++); }

/**
 * Crea o reutiliza un nodo en (wx, wy).
 * Si ya existe uno dentro de snapNodeDist, lo retorna.
 * @returns {string} nodeId
 */
function csGetOrCreateNode(wx, wy) {
  const thr = CS.snapNodeDist;
  const existing = CS.nodes.find(n =>
    Math.abs(n.x - wx) < thr && Math.abs(n.y - wy) < thr
  );
  if (existing) return existing.id;
  const id = _csNodeId();
  CS.nodes.push({ id, x: wx, y: wy, elementIds: [] });
  return id;
}

/**
 * Registra un elemento en el compositor.
 * @param {string} type - 'column' | 'beam' | 'wall-panel' | 'footing'
 * @param {number} x1, y1, x2, y2 - en metros
 * @param {object} [opts] - section, etc.
 * @returns {string} elementId
 */
function csAddElement(type, x1, y1, x2, y2, opts = {}) {
  const id = _csElId();

  // Snap de coordenadas finales a nodos existentes
  const nid1 = csGetOrCreateNode(x1, y1);
  const nid2 = csGetOrCreateNode(x2, y2);

  // Defaults de sección según tipo
  const defaultSection = {
    column:      { b: 0.20, h: 0.20 },
    beam:        { b: 0.20, h: 0.15 },
    'wall-panel':{ tw: 0.14 },
    footing:     { b: 0.60, h: 0.35 },
  }[type] || { b: 0.20, h: 0.20 };

  const el = {
    id,
    type,
    x1, y1, x2, y2,
    section: opts.section || defaultSection,
    nodeIds: [nid1, nid2],
  };

  CS.elements.push(el);

  // Registrar elemento en sus nodos
  const n1 = CS.nodes.find(n => n.id === nid1);
  const n2 = CS.nodes.find(n => n.id === nid2);
  if (n1 && !n1.elementIds.includes(id)) n1.elementIds.push(id);
  if (n2 && !n2.elementIds.includes(id)) n2.elementIds.push(id);

  return id;
}

/** Elimina el último elemento añadido (Undo simple) */
function csUndoLast() {
  const el = CS.elements.pop();
  if (!el) return;
  // Limpiar referencia en nodos; eliminar nodos huérfanos
  el.nodeIds.forEach(nid => {
    const node = CS.nodes.find(n => n.id === nid);
    if (!node) return;
    node.elementIds = node.elementIds.filter(eid => eid !== el.id);
    if (node.elementIds.length === 0) {
      CS.nodes = CS.nodes.filter(n => n.id !== nid);
    }
  });
  CS.recognitions = []; // recompute
}
