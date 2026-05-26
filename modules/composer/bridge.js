/**
 * COMPOSER/BRIDGE.JS — Puente entre Compositor y Solver
 *
 * Convierte una estructura reconocida (CS.recognitions[0])
 * al formato S.spans[] / S.nodes[] / S.columns[] existente,
 * luego dispara Controller._fullRefresh() para calcular con el
 * solver actual sin cambios.
 */

const ComposerBridge = {

  /**
   * Activa el cálculo desde la estructura reconocida.
   * @param {object} [comp] - composite a convertir (por defecto CS.recognitions[0])
   */
  activate(comp) {
    comp = comp || CS.recognitions[0];
    if (!comp) {
      alert('No hay estructura reconocida. Dibuja los elementos y espera a que el sistema la identifique.');
      return;
    }

    if (comp.type === 'muro-albanileria-confinada') {
      this._buildMuroConfinado(comp);
    } else if (comp.type === 'portico-ha') {
      this._buildPortico(comp);
    } else {
      alert('Tipo de estructura "' + comp.type + '" no tiene bridge implementado aún.');
      return;
    }

    // Desactivar modo compositor → volver a modo formularios
    S.composer.active = false;
    document.getElementById('tab-compositor')?.classList.remove('active');

    // Activar tab de geometría para que el usuario vea los resultados
    document.getElementById('tab-geometry')?.click();

    // Recalcular con el solver existente
    if (typeof Controller !== 'undefined') {
      Controller._fullRefresh();
    }

    console.log('[ComposerBridge] Estructura convertida a S.spans[]:', S.spans);
  },

  // ── Muro de albañilería confinada ─────────────────────────────

  _buildMuroConfinado(comp) {
    const p = comp.solverParams;
    const vanos = comp.vanos || [p]; // Array de parámetros por vano

    // Reconstruir S desde cero con los parámetros del compositor
    S.story.H = p.H;

    // Geometría legacy (para compatibilidad con inputs del sidebar)
    S.geometry.H  = p.H;
    S.geometry.L  = vanos[0].L;
    S.geometry.tw = p.tw;

    // Reconstruir nodos
    S.nodes = [{ id: 'n0', x: 0 }];
    let xAccum = 0;
    vanos.forEach((v, i) => {
      xAccum += v.L;
      S.nodes.push({ id: `n${i+1}`, x: xAccum });
    });

    // Reconstruir spans
    S.spans = vanos.map((v, i) => ({
      id: `sp${i}`,
      fromNode: `n${i}`,
      toNode: `n${i+1}`,
      type: 'muro',
      tw: v.tw || p.tw,
      beamTop: {
        section: { b: v.cadSup_b || 0.20, h: v.cadSup_h || 0.15 },
        rebar: defaultRebar('beam_top'),
      },
      beamBot: {
        section: { b: v.cadInf_b || 0.20, h: v.cadInf_h || 0.20 },
        rebar: defaultRebar('beam_bot'),
      },
    }));

    // Reconstruir columnas
    S.columns = {};
    S.nodes.forEach(node => {
      S.columns[node.id] = {
        section: { b: p.col_b || 0.20, h: p.col_h || 0.20 },
        rebar: defaultRebar('column'),
      };
    });

    // Actualizar inputs del sidebar con los nuevos valores
    this._syncSidebarInputs();
  },

  // ── Pórtico de hormigón ───────────────────────────────────────

  _buildPortico(comp) {
    const p = comp.solverParams;

    S.story.H = p.H;
    S.geometry.H = p.H;
    S.geometry.L = p.L;

    S.nodes = [{ id: 'n0', x: 0 }, { id: 'n1', x: p.L }];
    S.spans = [{
      id: 'sp0',
      fromNode: 'n0',
      toNode:   'n1',
      type: 'portico',
      tw: 0,
      beamTop: {
        section: { b: p.beam_b || 0.20, h: p.beam_h || 0.30 },
        rebar: defaultRebar('beam_top'),
      },
      beamBot: {
        section: { b: p.beam_b || 0.20, h: p.beam_h || 0.30 },
        rebar: defaultRebar('beam_bot'),
      },
    }];

    S.columns = {
      n0: { section: { b: p.col_b || 0.25, h: p.col_h || 0.25 }, rebar: defaultRebar('column') },
      n1: { section: { b: p.col_b || 0.25, h: p.col_h || 0.25 }, rebar: defaultRebar('column') },
    };

    this._syncSidebarInputs();
  },

  // ── Sincronizar sidebar con nuevos valores ────────────────────

  _syncSidebarInputs() {
    // Altura
    const hEl = document.getElementById('g-H');
    if (hEl) { hEl.value = S.story.H.toFixed(2); hEl.dispatchEvent(new Event('input')); }

    // Longitud primer vano (legacy input)
    const lEl = document.getElementById('g-L');
    if (lEl) { lEl.value = S.geometry.L.toFixed(2); lEl.dispatchEvent(new Event('input')); }

    // Espesor muro
    const twEl = document.getElementById('g-tw');
    if (twEl) { twEl.value = (S.geometry.tw * 100).toFixed(0); twEl.dispatchEvent(new Event('input')); }
  },
};
