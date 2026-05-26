/**
 * COMPOSER/RECOGNIZER.JS — Motor de Reconocimiento de Patrones
 *
 * Analiza CS.elements + CS.nodes y detecta qué tipo de estructura
 * se está formando. Popula CS.recognitions[].
 *
 * Patrones v1:
 *  1. Muro albañilería confinada (NCh2123): 2 col + cadena_top + cadena_bot + wall-panel
 *  2. Pórtico H.A. (NCh430): 2 col + 1 beam, sin wall-panel
 *  3. Muro multi-vano: N unidades confinadas en serie compartiendo columnas
 */

const ComposerRecognizer = {

  analyze() {
    CS.recognitions = [];
    if (CS.elements.length < 2) return;

    const cols   = CS.elements.filter(e => e.type === 'column');
    const beams  = CS.elements.filter(e => e.type === 'beam');
    const walls  = CS.elements.filter(e => e.type === 'wall-panel');

    // ── 1. Buscar marcos rectangulares cerrados ───────────────────
    const frames = this._findRectFrames(cols, beams);

    frames.forEach(frame => {
      const { col1, col2, beamTop, beamBot } = frame;

      // ¿Hay un wall-panel que llene el interior del marco?
      const wallFill = this._findWallFill(frame, walls);

      const bounds = this._frameBounds(frame);

      if (wallFill) {
        // Muro de albañilería confinada
        const solverParams = this._wallParams(frame, wallFill);
        CS.recognitions.push({
          id: _csCompId(),
          type: 'muro-albanileria-confinada',
          elementIds: [col1.id, col2.id, beamTop.id, beamBot?.id, wallFill.id].filter(Boolean),
          bounds,
          solverParams,
          validationWarnings: this._validateNCh2123(solverParams),
        });
      } else if (!beamBot) {
        // Pórtico: 2 col + 1 cadena (sin cadena inferior ni muro)
        CS.recognitions.push({
          id: _csCompId(),
          type: 'portico-ha',
          elementIds: [col1.id, col2.id, beamTop.id],
          bounds,
          solverParams: this._porticoParams(frame),
          validationWarnings: [],
        });
      } else {
        // Marco cerrado sin muro → pórtico de hormigón
        CS.recognitions.push({
          id: _csCompId(),
          type: 'portico-ha',
          elementIds: [col1.id, col2.id, beamTop.id, beamBot.id],
          bounds,
          solverParams: this._porticoParams(frame),
          validationWarnings: [],
        });
      }
    });

    // ── 2. Detectar multi-vano (N reconocimientos alineados) ──────
    if (CS.recognitions.length > 1) {
      const confined = CS.recognitions.filter(r => r.type === 'muro-albanileria-confinada');
      if (confined.length > 1 && this._areAligned(confined)) {
        // Colapsar en uno multi-vano
        const allIds = confined.flatMap(r => r.elementIds);
        const allBounds = confined.map(r => r.bounds);
        const merged = {
          x: Math.min(...allBounds.map(b => b.x)),
          y: Math.min(...allBounds.map(b => b.y)),
          w: allBounds.reduce((acc, b) => acc + b.w, 0),
          h: Math.max(...allBounds.map(b => b.h)),
        };
        const totalL = confined.reduce((acc, r) => acc + r.solverParams.L, 0);
        CS.recognitions = CS.recognitions.filter(r => r.type !== 'muro-albanileria-confinada');
        CS.recognitions.push({
          id: _csCompId(),
          type: 'muro-albanileria-confinada', // tratado como multi-span por el bridge
          elementIds: [...new Set(allIds)],
          bounds: merged,
          nVanos: confined.length,
          vanos:  confined.map(r => r.solverParams),
          solverParams: { ...confined[0].solverParams, L: totalL, nVanos: confined.length },
          validationWarnings: confined.flatMap(r => r.validationWarnings),
        });
      }
    }

    // Actualizar UI badge
    this._updateBadge();
  },

  // ── Buscar marcos rectangulares ───────────────────────────────

  /**
   * Un marco rectangular requiere:
   *   - 2 columnas verticales (misma altura, separadas horizontalmente)
   *   - 1 viga superior que une sus topes
   *   - [opcional] 1 viga inferior que une sus bases
   */
  _findRectFrames(cols, beams) {
    const frames = [];
    const EPS = 0.12; // m tolerancia de alineación

    for (let i = 0; i < cols.length - 1; i++) {
      for (let j = i + 1; j < cols.length; j++) {
        const col1 = cols[i];
        const col2 = cols[j];

        // Las columnas deben tener aproximadamente la misma altura
        const h1 = col1.y2 - col1.y1;
        const h2 = col2.y2 - col2.y1;
        if (Math.abs(h1 - h2) > EPS) continue;

        // Las columnas deben tener la misma cota de base y tope
        if (Math.abs(col1.y1 - col2.y1) > EPS) continue;
        if (Math.abs(col1.y2 - col2.y2) > EPS) continue;

        const xL = Math.min(col1.x1, col2.x1);
        const xR = Math.max(col1.x1, col2.x1);
        const yBase = (col1.y1 + col2.y1) / 2;
        const yTop  = (col1.y2 + col2.y2) / 2;

        // Buscar viga superior: viga horizontal a yTop que conecta xL con xR
        const beamTop = beams.find(b =>
          Math.abs(b.y1 - yTop) < EPS &&
          Math.abs(b.x1 - xL)   < EPS &&
          Math.abs(b.x2 - xR)   < EPS
        );
        if (!beamTop) continue;

        // Buscar viga inferior (opcional)
        const beamBot = beams.find(b =>
          Math.abs(b.y1 - yBase) < EPS &&
          Math.abs(b.x1 - xL)    < EPS &&
          Math.abs(b.x2 - xR)    < EPS
        );

        frames.push({ col1, col2, beamTop, beamBot, xL, xR, yBase, yTop });
      }
    }
    return frames;
  },

  /** Busca un wall-panel que ocupe el interior del marco */
  _findWallFill(frame, walls) {
    const EPS = 0.15;
    return walls.find(w =>
      Math.abs(w.x1 - frame.xL)    < EPS &&
      Math.abs(w.x2 - frame.xR)    < EPS &&
      Math.abs(w.y1 - frame.yBase) < EPS &&
      Math.abs(w.y2 - frame.yTop)  < EPS
    ) || null;
  },

  /** Bounding box del marco */
  _frameBounds(frame) {
    return {
      x: frame.xL,
      y: frame.yBase,
      w: frame.xR - frame.xL,
      h: frame.yTop - frame.yBase,
    };
  },

  // ── Parámetros para el solver ─────────────────────────────────

  _wallParams(frame, wallFill) {
    return {
      H: frame.yTop - frame.yBase,           // m altura pantalla
      L: frame.xR - frame.xL,                // m longitud vano
      tw: wallFill?.section?.tw || 0.14,      // m espesor muro
      col_b:    frame.col1.section?.b || 0.20,
      col_h:    frame.col1.section?.h || 0.20,
      cadSup_b: frame.beamTop.section?.b || 0.20,
      cadSup_h: frame.beamTop.section?.h || 0.15,
      cadInf_b: frame.beamBot?.section?.b || 0.20,
      cadInf_h: frame.beamBot?.section?.h || 0.20,
      nVanos: 1,
    };
  },

  _porticoParams(frame) {
    return {
      H: frame.yTop - frame.yBase,
      L: frame.xR - frame.xL,
      col_b:  frame.col1.section?.b || 0.25,
      col_h:  frame.col1.section?.h || 0.25,
      beam_b: frame.beamTop.section?.b || 0.20,
      beam_h: frame.beamTop.section?.h || 0.30,
    };
  },

  // ── Validaciones NCh2123 ──────────────────────────────────────

  _validateNCh2123(p) {
    const warnings = [];
    // Pilares: min b=tw, min h=20cm
    if ((p.col_b) < (p.tw - 0.01))
      warnings.push(`Pilar: ancho ${(p.col_b*100).toFixed(0)}cm < espesor muro ${(p.tw*100).toFixed(0)}cm (NCh2123 §7.7.4)`);
    if ((p.col_h) < 0.195)
      warnings.push(`Pilar: peralte ${(p.col_h*100).toFixed(0)}cm < 20cm mínimo (NCh2123 §7.7.4)`);
    // Cadenas: min b=tw, min h=20cm
    if ((p.cadSup_h) < 0.145)
      warnings.push(`Cadena sup: altura ${(p.cadSup_h*100).toFixed(0)}cm < 15cm (NCh2123 §7.7.8)`);
    // Longitud máxima de vano
    if (p.L > 6.01)
      warnings.push(`Vano L=${p.L.toFixed(2)}m > 6m máximo por NCh2123 §7.5`);
    return warnings;
  },

  // ── Multi-vano alineado ───────────────────────────────────────

  _areAligned(recognitions) {
    if (recognitions.length < 2) return false;
    const EPS = 0.12;
    // Todos deben tener la misma altura y estar en la misma cota Y
    const refH = recognitions[0].bounds.h;
    const refY = recognitions[0].bounds.y;
    return recognitions.every(r =>
      Math.abs(r.bounds.h - refH) < EPS &&
      Math.abs(r.bounds.y - refY) < EPS
    );
  },

  // ── Actualizar badge de la paleta ─────────────────────────────

  _updateBadge() {
    const badge = document.getElementById('composer-recognition-badge');
    if (!badge) return;

    if (CS.recognitions.length === 0) {
      badge.innerHTML = '<span style="color:rgba(255,255,255,0.35);font-size:0.72rem;">Sin estructura reconocida aún</span>';
      document.getElementById('composer-calc-btn')?.setAttribute('disabled', 'true');
      return;
    }

    const comp = CS.recognitions[0];
    const NAMES = {
      'muro-albanileria-confinada': 'Muro Confinado',
      'portico-ha':                 'Pórtico H.A.',
    };
    const name  = NAMES[comp.type] || comp.type;
    const nv    = comp.nVanos || 1;
    const L     = comp.solverParams?.L?.toFixed(2) || '—';
    const H     = comp.solverParams?.H?.toFixed(2) || '—';
    const warns = comp.validationWarnings || [];

    const warnHtml = warns.length > 0
      ? `<div style="margin-top:5px;padding:4px 6px;background:rgba(255,150,50,0.12);border-left:2px solid #e3b341;border-radius:2px;font-size:0.68rem;color:#e3b341;">`
        + warns.map(w => `⚠ ${w}`).join('<br>')
        + `</div>`
      : '';

    badge.innerHTML = `
      <div style="display:flex;align-items:center;gap:6px;flex-wrap:wrap;">
        <span style="background:rgba(63,185,80,0.18);color:#56d364;border:1px solid rgba(63,185,80,0.35);border-radius:3px;padding:2px 7px;font-size:0.72rem;font-weight:700;">✓ ${name}</span>
        ${nv > 1 ? `<span style="color:#8b949e;font-size:0.7rem;">${nv} vanos</span>` : ''}
        <span style="color:#8b949e;font-size:0.7rem;">L=${L}m · H=${H}m</span>
      </div>
      ${warnHtml}
    `;
    document.getElementById('composer-calc-btn')?.removeAttribute('disabled');
  },
};
