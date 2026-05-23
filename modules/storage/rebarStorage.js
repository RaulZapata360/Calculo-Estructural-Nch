/**
 * REBARSTORAGE.JS — Persistencia de Datos de Armadura
 * Guarda/carga armadura en localStorage para persistencia entre sesiones
 */

const RebarStorage = {
  /**
   * Persiste datos de armadura de un elemento
   * @param {string} elementId - ID del elemento
   * @param {object} rebarData - Datos de armadura
   * @returns {boolean} true si se guardó exitosamente
   */
  save(elementId, rebarData) {
    try {
      // Validar antes de guardar
      const validation = RebarValidator.check(elementId, rebarData);
      if (!validation.ok) {
        console.warn(`⚠ Armadura insuficiente para ${elementId}: ${validation.ratioUtilización}`);
        // Permitir guardar de todas formas pero marcar como no cumplido
        rebarData.cumple = false;
      } else {
        rebarData.cumple = true;
      }

      // Timestamp
      rebarData.timestamp = Date.now();
      rebarData.validationStatus = validation.status;

      // Guardar en S.elements (legacy) y en el vano/nodo activo
      if (S.elements) S.elements[elementId].rebar = rebarData;
      const selSpan = S.spans?.find(sp => sp.id === S.ui.selectedSpan) || S.spans?.[0];
      if (selSpan && elementId === 'beam_top') selSpan.beamTop.rebar = rebarData;
      if (selSpan && elementId === 'beam_bot') selSpan.beamBot.rebar = rebarData;
      if (elementId === 'column' && S.ui.selectedNode) {
        const col = S.columns?.[S.ui.selectedNode];
        if (col) col.rebar = rebarData;
      }
      S.ui.projectDirty = true;

      // Guardar en localStorage (clave incluye spanId para multi-vano)
      const spanSuffix = (elementId !== 'column') ? `_${S.ui.selectedSpan || 'sp0'}` : `_${S.ui.selectedNode || 'n0'}`;
      const key = `ec_rebar_${elementId}${spanSuffix}`;
      localStorage.setItem(key, JSON.stringify(rebarData));

      console.log(`✓ Armadura guardada para ${elementId}`);
      return true;
    } catch (err) {
      console.error(`✗ Error guardando armadura para ${elementId}:`, err);
      return false;
    }
  },

  /**
   * Carga datos de armadura de un elemento desde localStorage
   * @param {string} elementId - ID del elemento
   * @returns {object|null} Datos de armadura o null si no existen
   */
  load(elementId) {
    try {
      const spanSuffix = (elementId !== 'column') ? `_${S.ui?.selectedSpan || 'sp0'}` : `_${S.ui?.selectedNode || 'n0'}`;
      // Try span-specific key first, fall back to legacy key
      const key = `ec_rebar_${elementId}${spanSuffix}`;
      const legacyKey = `ec_rebar_${elementId}`;
      const stored = localStorage.getItem(key) || localStorage.getItem(legacyKey);
      if (!stored) return null;

      const rebarData = JSON.parse(stored);
      console.log(`✓ Armadura cargada para ${elementId}`);
      return rebarData;
    } catch (err) {
      console.error(`✗ Error cargando armadura para ${elementId}:`, err);
      return null;
    }
  },

  /**
   * Carga todas las armaduras guardadas desde localStorage
   */
  loadAll() {
    const results = {};
    const elementIds = ['beam_top', 'beam_bot', 'column'];

    elementIds.forEach(id => {
      const data = this.load(id);
      if (data) {
        S.elements[id].rebar = data;
        results[id] = data;
      }
    });

    return results;
  },

  /**
   * Elimina datos de armadura de un elemento
   * @param {string} elementId - ID del elemento
   */
  delete(elementId) {
    try {
      const key = `ec_rebar_${elementId}`;
      localStorage.removeItem(key);
      S.elements[elementId].rebar = {
        faces: {
          superior: { nombre: 'Superior', barras: [], AsTotal: 0, cumple: null },
          inferior: { nombre: 'Inferior', barras: [], AsTotal: 0, cumple: null }
        },
        estribos: { diámetro: 8, espaciamiento: 0.15, cumple: null }
      };
      console.log(`✓ Armadura eliminada para ${elementId}`);
      return true;
    } catch (err) {
      console.error(`✗ Error eliminando armadura:`, err);
      return false;
    }
  },

  /**
   * Limpia TODO el almacenamiento de armadura
   */
  deleteAll() {
    const elementIds = ['beam_top', 'beam_bot', 'column'];
    elementIds.forEach(id => this.delete(id));
    console.log(`✓ Almacenamiento de armadura limpiado`);
  }
};
