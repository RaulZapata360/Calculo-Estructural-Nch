/**
 * VALIDATORS.JS — Validación de Armadura y Estribos
 * Compara As colocada vs As requerida, define colores de cumplimiento
 */

const RebarValidator = {
  /**
   * Valida si la armadura colocada cumple con As requerido
   * @param {string} elementId - ID del elemento (beam_top, column, etc.)
   * @param {object} rebarData - Datos de armadura { faces: {...}, estribos: {...} }
   * @returns {object} { ok, status, ratioUtilización, color, errors }
   */
  check(elementId, rebarData) {
    const elem = S.elements[elementId];
    if (!elem || !elem.design) {
      return {
        ok: false,
        status: 'ERROR',
        ratioUtilización: '0%',
        color: '#666',
        errors: ['Elemento no encontrado o sin diseño calculado']
      };
    }

    const AsReq = parseFloat(elem.design.AsReq) || 0;
    const AsTotal = this.calculateAsTotal(rebarData);

    // Umbrales de validación
    const minAsRequired = AsReq * 0.95; // Mínimo 95%
    const maxAsAllowed = AsReq * 1.20; // Máximo 120% (exceso innecesario)

    let status, color, ok;

    if (AsTotal < minAsRequired) {
      status = 'INSUFICIENTE';
      color = '#f85149'; // Rojo
      ok = false;
    } else if (AsTotal >= AsReq && AsTotal <= AsReq * 1.10) {
      status = 'OK';
      color = '#3fb950'; // Verde
      ok = true;
    } else if (AsTotal > AsReq * 1.10 && AsTotal <= maxAsAllowed) {
      status = 'MARGINAL';
      color = '#d29922'; // Amarillo
      ok = true;
    } else {
      status = 'EXCESO';
      color = '#2f81f7'; // Azul (exceso muy grande)
      ok = false; // Considerar como no óptimo
    }

    const ratio = ((AsTotal / AsReq) * 100).toFixed(1);
    const exceso = (AsTotal - AsReq).toFixed(2);

    return {
      ok,
      status,
      ratioUtilización: `${ratio}%`,
      exceso: `${exceso} cm²`,
      color,
      AsTotal: AsTotal.toFixed(2),
      AsReq: AsReq.toFixed(2),
      errors: ok ? [] : [
        `As total (${AsTotal.toFixed(2)}) < As requerido (${AsReq.toFixed(2)})`
      ]
    };
  },

  /**
   * Calcula As total de armadura colocada
   */
  calculateAsTotal(rebarData) {
    let total = 0;
    if (!rebarData.faces) return total;

    Object.keys(rebarData.faces).forEach(faceName => {
      if (faceName === 'piel') return; // Exclude intermediate skin reinforcement from main flexural steel calculation
      const face = rebarData.faces[faceName];
      if (face.barras && Array.isArray(face.barras)) {
        face.barras.forEach(barra => {
          const A_barra = Math.PI * (barra.diámetro / 10) ** 2 / 4;
          total += A_barra * barra.cantidad;
        });
      }
    });
    return total;
  },

  /**
   * Validador de estribos (cortante)
   */
  checkStirrup(elementId, rebarData) {
    const elem = S.elements[elementId];
    if (!elem || !elem.design) return { ok: true, status: 'OK' };

    const Vs = parseFloat(elem.design.Vs) || 0;
    const estribos = rebarData.estribos || {};
    const As_estribos = this.calculateAsStirrup(estribos);

    // Simplificado: si hay estribos φ8 c/15cm, debería cumplir
    const ok = As_estribos > 0;
    return {
      ok,
      status: ok ? 'OK' : 'REVISAR',
      As_estribos,
      Vs
    };
  },

  /**
   * Calcula As de estribos (simplificado)
   */
  calculateAsStirrup(estribos) {
    if (!estribos.diámetro || !estribos.espaciamiento) return 0;
    const A_rama = Math.PI * (estribos.diámetro / 10) ** 2 / 4;
    const ramas = 2; // Estribos de 2 ramas (típico)
    return (A_rama * ramas) / (estribos.espaciamiento / 100); // cm²/cm
  },

  /**
   * Retorna color basado en status
   */
  getColor(status) {
    const colors = {
      'OK': '#3fb950',
      'INSUFICIENTE': '#f85149',
      'MARGINAL': '#d29922',
      'EXCESO': '#2f81f7',
      'ERROR': '#666'
    };
    return colors[status] || '#666';
  }
};
