/**
 * VIEW3D.JS — Visualización 3D + panel de propiedades
 * Three.js r128 (legacy, sin ES modules)
 */
const View3D = (() => {

  // ── Estado interno ────────────────────────────────────
  let scene, camera, renderer, controls;
  let container  = null;
  let animId     = null;
  let dimsSvg    = null;
  let dimState   = null;
  let dimsFlag   = false;
  let panelEl    = null;
  let activeSec  = 'muro';
  let activeFilt = 'ladrillos';

  // ── Definición de secciones y propiedades del panel ───
  const SECS = () => ({
    muro: {
      label: 'Muro',
      filters: [
        {
          key: 'ladrillos', label: 'Ladrillos',
          props: [
            { lbl: 'Altura muro H',   unit: 'm', step: 0.1,  min: 0.5,
              get: ()  => S.story.H,
              set: v   => { S.story.H = v; syncInput('g-H', v); } },
            { lbl: 'Espesor muro tw', unit: 'm', step: 0.01, min: 0.05,
              get: ()  => S.spans[0]?.tw || 0.14,
              set: v   => S.spans.forEach(sp => { sp.tw = v; }) }
          ]
        },
        {
          key: 'columnas', label: 'Columnas',
          props: [
            { lbl: 'Largo b',   unit: 'm', step: 0.01, min: 0.10,
              get: ()  => S.columns[S.nodes[0]?.id]?.section?.b ?? 0.20,
              set: v   => S.nodes.forEach(n => {
                if (S.columns[n.id]?.section) S.columns[n.id].section.b = v;
              }) },
            { lbl: 'Espesor h', unit: 'm', step: 0.01, min: 0.10,
              get: ()  => S.columns[S.nodes[0]?.id]?.section?.h ?? 0.15,
              set: v   => S.nodes.forEach(n => {
                if (S.columns[n.id]?.section) S.columns[n.id].section.h = v;
              }) }
          ]
        },
        {
          key: 'cadena', label: 'Cadena Sup.',
          props: [
            { lbl: 'Alto h',   unit: 'm', step: 0.01, min: 0.08,
              get: ()  => S.spans[0]?.beamTop?.section?.h ?? 0.15,
              set: v   => S.spans.forEach(sp => {
                if (sp.beamTop?.section) sp.beamTop.section.h = v;
              }) },
            { lbl: 'Ancho b',  unit: 'm', step: 0.01, min: 0.10,
              get: ()  => S.spans[0]?.beamTop?.section?.b ?? 0.20,
              set: v   => S.spans.forEach(sp => {
                if (sp.beamTop?.section) sp.beamTop.section.b = v;
              }) }
          ]
        }
      ]
    },
    fundacion: {
      label: 'Fundación',
      filters: [
        {
          key: 'sobrecimiento', label: 'Sobrecimiento',
          props: [
            { lbl: 'Altura Hsc', unit: 'm', step: 0.05, min: 0.20,
              get: ()  => S.spans[0]?.beamBot?.section?.h ?? 0.60,
              set: v   => S.spans.forEach(sp => {
                if (sp.beamBot?.section) sp.beamBot.section.h = v;
              }) },
            { lbl: 'Ancho b',   unit: 'm', step: 0.01, min: 0.10,
              get: ()  => S.spans[0]?.beamBot?.section?.b ?? 0.15,
              set: v   => S.spans.forEach(sp => {
                if (sp.beamBot?.section) sp.beamBot.section.b = v;
              }) }
          ]
        },
        {
          key: 'zapata', label: 'Zapata Corrida',
          props: [
            { lbl: 'Vuelo B',       unit: 'm', step: 0.05, min: 0.20,
              get: ()  => S.story.foundation.B,
              set: v   => { S.story.foundation.B = v; syncInput('f-B', v); } },
            { lbl: 'Altura Hf',     unit: 'm', step: 0.05, min: 0.15,
              get: ()  => S.story.foundation.Hf,
              set: v   => { S.story.foundation.Hf = v; syncInput('f-Hf', v); } },
            { lbl: 'Profundidad Df',unit: 'm', step: 0.05, min: 0.30,
              get: ()  => S.story.foundation.Df,
              set: v   => { S.story.foundation.Df = v; syncInput('f-Df', v); } },
            { lbl: 'Tipo de zapata', unit: '', type: 'select',
              options: [['L','L — Derecha'],['L-inv','L — Izquierda'],['T','T — Central']],
              get: ()  => S.story.foundation.type,
              set: v   => { S.story.foundation.type = v; } }
          ]
        }
      ]
    }
  });

  // ── CSS del panel (inyectado una sola vez) ─────────────
  function injectPanelCSS() {
    if (document.getElementById('p3d-css')) return;
    const s = document.createElement('style');
    s.id = 'p3d-css';
    s.textContent = `
      #panel-3d {
        width: 242px; min-width: 242px; flex-shrink: 0;
        background: #161b22;
        border-right: 1px solid #30363d;
        display: flex; flex-direction: column;
        overflow-y: auto; overflow-x: hidden;
        font-size: 0.82rem;
      }
      #p3d-head {
        padding: 12px 14px 10px;
        border-bottom: 1px solid #30363d;
        flex-shrink: 0;
      }
      #p3d-eyebrow {
        color: #484f58; font-size: 0.66rem;
        text-transform: uppercase; letter-spacing: .10em;
        margin-bottom: 8px;
      }
      #p3d-secbar { display: flex; gap: 4px; }
      .p3d-sec {
        flex: 1; padding: 5px 0; border-radius: 5px;
        border: 1px solid #30363d; background: #21262d;
        color: #8b949e; font-size: 0.76rem; cursor: pointer;
        transition: all .15s; text-align: center;
      }
      .p3d-sec.active {
        background: #1f6feb; border-color: #1f6feb; color: #fff;
      }
      .p3d-sec:hover:not(.active) { color: #c9d1d9; border-color: #484f58; }

      #p3d-filterbar {
        padding: 10px 14px; border-bottom: 1px solid #21262d;
        display: flex; flex-wrap: wrap; gap: 5px; flex-shrink: 0;
      }
      .p3d-filt {
        padding: 3px 10px; border-radius: 20px;
        border: 1px solid #30363d; background: transparent;
        color: #8b949e; font-size: 0.72rem; cursor: pointer;
        white-space: nowrap; transition: all .15s;
      }
      .p3d-filt.active {
        background: rgba(31,111,235,.18);
        border-color: #388bfd; color: #79c0ff;
      }
      .p3d-filt:hover:not(.active) { color: #c9d1d9; border-color: #484f58; }

      #p3d-proplist {
        padding: 14px 14px 20px;
        display: flex; flex-direction: column; gap: 14px;
      }
      .p3d-group-hdr {
        color: #388bfd; font-size: 0.66rem;
        text-transform: uppercase; letter-spacing: .10em;
        padding-bottom: 6px; border-bottom: 1px solid #21262d;
      }
      .p3d-prop { display: flex; flex-direction: column; gap: 4px; }
      .p3d-prop-lbl {
        color: #8b949e; font-size: 0.70rem;
      }
      .p3d-prop-row {
        display: flex; align-items: center;
        background: #0d1117; border: 1px solid #21262d;
        border-radius: 5px; padding: 5px 9px;
        transition: border-color .15s; gap: 6px;
      }
      .p3d-prop-row:focus-within { border-color: #388bfd; }
      .p3d-prop-inp {
        flex: 1; min-width: 0; background: transparent;
        border: none; outline: none;
        color: #e6edf3; font-size: 0.84rem; font-family: monospace;
      }
      .p3d-prop-unit { color: #484f58; font-size: 0.70rem; flex-shrink: 0; }
      .p3d-prop-sel {
        flex: 1; background: transparent; border: none; outline: none;
        color: #e6edf3; font-size: 0.80rem; cursor: pointer;
        font-family: system-ui, sans-serif;
      }
      .p3d-prop-sel option { background: #1c2128; }
      .p3d-divider { height: 1px; background: #21262d; }
    `;
    document.head.appendChild(s);
  }

  // ── Crear panel ───────────────────────────────────────
  function initPanel() {
    injectPanelCSS();
    panelEl = document.createElement('div');
    panelEl.id = 'panel-3d';
    panelEl.innerHTML = `
      <div id="p3d-head">
        <div id="p3d-eyebrow">Propiedades</div>
        <div id="p3d-secbar"></div>
      </div>
      <div id="p3d-filterbar"></div>
      <div id="p3d-proplist"></div>
    `;
    container.parentElement.insertBefore(panelEl, container);
    renderPanel();
  }

  // ── Renderizar panel (sección + filtro activos) ────────
  function renderPanel() {
    if (!panelEl) return;
    const secs = SECS();

    // ── Section tabs ──
    const secBar = panelEl.querySelector('#p3d-secbar');
    secBar.innerHTML = '';
    Object.entries(secs).forEach(([key, sec]) => {
      const btn = document.createElement('button');
      btn.className = 'p3d-sec' + (key === activeSec ? ' active' : '');
      btn.textContent = sec.label;
      btn.addEventListener('click', () => {
        activeSec  = key;
        activeFilt = secs[key].filters[0].key;
        renderPanel();
      });
      secBar.appendChild(btn);
    });

    const sec = secs[activeSec];

    // ── Filter chips ──
    const filtBar = panelEl.querySelector('#p3d-filterbar');
    filtBar.innerHTML = '';
    sec.filters.forEach(f => {
      const btn = document.createElement('button');
      btn.className = 'p3d-filt' + (f.key === activeFilt ? ' active' : '');
      btn.textContent = f.label;
      btn.addEventListener('click', () => {
        activeFilt = f.key;
        renderPanel();
      });
      filtBar.appendChild(btn);
    });

    // ── Properties ──
    const list = panelEl.querySelector('#p3d-proplist');
    list.innerHTML = '';

    const filt = sec.filters.find(f => f.key === activeFilt);
    if (!filt) return;

    // Group header
    const hdr = document.createElement('div');
    hdr.className = 'p3d-group-hdr';
    hdr.textContent = filt.label;
    list.appendChild(hdr);

    filt.props.forEach(prop => {
      const wrap = document.createElement('div');
      wrap.className = 'p3d-prop';

      const lbl = document.createElement('div');
      lbl.className = 'p3d-prop-lbl';
      lbl.textContent = prop.lbl;

      const row = document.createElement('div');
      row.className = 'p3d-prop-row';

      if (prop.type === 'select') {
        const sel = document.createElement('select');
        sel.className = 'p3d-prop-sel';
        prop.options.forEach(([val, txt]) => {
          const opt = document.createElement('option');
          opt.value = val;
          opt.textContent = txt;
          if (val === prop.get()) opt.selected = true;
          sel.appendChild(opt);
        });
        sel.addEventListener('change', () => {
          prop.set(sel.value);
          rebuildGeom();
        });
        row.appendChild(sel);
      } else {
        const inp = document.createElement('input');
        inp.type      = 'number';
        inp.className = 'p3d-prop-inp';
        inp.value     = prop.get().toFixed(3);
        inp.step      = prop.step  ?? 0.01;
        inp.min       = prop.min   ?? 0.01;

        let debounce;
        inp.addEventListener('input', () => {
          clearTimeout(debounce);
          debounce = setTimeout(() => {
            const v = parseFloat(inp.value);
            if (!isNaN(v) && v >= (prop.min ?? 0.01)) {
              prop.set(v);
              rebuildGeom();
            }
          }, 350);
        });
        inp.addEventListener('change', () => {
          clearTimeout(debounce);
          const v = parseFloat(inp.value);
          if (!isNaN(v) && v >= (prop.min ?? 0.01)) {
            prop.set(v);
            rebuildGeom();
            inp.value = prop.get().toFixed(3);
          }
        });

        const unit = document.createElement('span');
        unit.className = 'p3d-prop-unit';
        unit.textContent = prop.unit;
        row.appendChild(inp);
        if (prop.unit) row.appendChild(unit);
      }

      wrap.appendChild(lbl);
      wrap.appendChild(row);
      list.appendChild(wrap);
    });
  }

  // ── Sincronizar input principal (solo valor visual) ────
  function syncInput(id, v) {
    const el = document.getElementById(id);
    if (el) el.value = v;
  }

  // ── Reconstruir geometría conservando cámara ──────────
  function rebuildGeom() {
    const camPos = camera.position.clone();
    const camTgt = controls.target.clone();
    build(false);
    camera.position.copy(camPos);
    controls.target.copy(camTgt);
    controls.update();
    dimsFlag = true;
    if (typeof Solver   !== 'undefined') Solver.run();
    if (typeof Renderer !== 'undefined') Renderer.draw();
  }

  // ── Materiales ────────────────────────────────────────
  const mats = {};
  function mkMats() {
    mats.concrete = new THREE.MeshPhongMaterial({ color: 0xD2CFC9, shininess: 35, specular: 0x888888 });
    mats.masonry  = new THREE.MeshPhongMaterial({ color: 0xC4804A, shininess: 8  });
    mats.found    = new THREE.MeshPhongMaterial({ color: 0xA8A4A0, shininess: 12 });
    mats.earth    = new THREE.MeshLambertMaterial({ color: 0x3A2410 });
    mats.grass    = new THREE.MeshLambertMaterial({ color: 0x2D4A1E });
    mats.edges    = new THREE.LineBasicMaterial({ color: 0x000000, transparent: true, opacity: 0.18 });
    mats.edgesC   = new THREE.LineBasicMaterial({ color: 0x1a1a1a, transparent: true, opacity: 0.22 });
  }

  // ── Helpers 3D ────────────────────────────────────────
  function addBox(w, h, d, x, y, z, mat, edgeMat) {
    const geo  = new THREE.BoxGeometry(w, h, d);
    const mesh = new THREE.Mesh(geo, mat);
    mesh.position.set(x, y, z);
    mesh.castShadow = mesh.receiveShadow = true;
    mesh.userData.s3d = true;
    scene.add(mesh);
    const eg   = new THREE.EdgesGeometry(geo);
    const line = new THREE.LineSegments(eg, edgeMat || mats.edges);
    line.position.set(x, y, z);
    line.userData.s3d = true;
    scene.add(line);
    return mesh;
  }

  function clearScene() {
    const rm = [];
    scene.traverse(o => { if (o.userData.s3d) rm.push(o); });
    rm.forEach(o => { scene.remove(o); o.geometry?.dispose(); });
  }

  // ── Proyección 3D → pantalla ──────────────────────────
  function proj(x, y, z) {
    camera.updateMatrixWorld(false);
    const v = new THREE.Vector3(x, y, z).project(camera);
    const W = container.clientWidth;
    const H = container.clientHeight;
    return { x: (v.x + 1) / 2 * W, y: (-v.y + 1) / 2 * H, w: v.z };
  }

  // ── SVG helper ────────────────────────────────────────
  function svgEl(tag, attrs) {
    const el = document.createElementNS('http://www.w3.org/2000/svg', tag);
    for (const [k, v] of Object.entries(attrs)) el.setAttribute(k, v);
    return el;
  }

  // ── Overlay SVG de cotas ──────────────────────────────
  function initDimsSvg() {
    if (dimsSvg) return;
    container.style.position = 'relative';
    dimsSvg = svgEl('svg', {
      style: 'position:absolute;inset:0;pointer-events:none;overflow:visible;width:100%;height:100%;'
    });
    container.appendChild(dimsSvg);
  }

  function updateDims() {
    if (!dimsSvg || !dimState) return;
    while (dimsSvg.firstChild) dimsSvg.removeChild(dimsSvg.firstChild);

    const defs = svgEl('defs', {});
    const mkArr = (id, flip) => {
      const m = svgEl('marker', { id, markerWidth:'5', markerHeight:'5',
        refX: flip?'5':'0', refY:'2.5', orient:'auto' });
      m.appendChild(svgEl('polygon', { points: flip ? '5,0 5,5 0,2.5' : '0,0 0,5 5,2.5',
        fill:'#388bfd', opacity:'0.85' }));
      return m;
    };
    defs.appendChild(mkArr('a-s', false));
    defs.appendChild(mkArr('a-e', true));
    dimsSvg.appendChild(defs);

    const { B, Hf, Df, wallH, BT_H, SB_H, ySBTop, ySBBot, yFoundC, yFoundBot, f, totalL } = dimState;

    function drawDim(p1, p2, fmt, key) {
      const s1 = proj(...p1), s2 = proj(...p2);
      if (s1.w > 1 || s2.w > 1) return;
      const dx = s2.x - s1.x, dy = s2.y - s1.y;
      const len = Math.sqrt(dx*dx + dy*dy);
      if (len < 18) return;
      const mx = (s1.x + s2.x) / 2, my = (s1.y + s2.y) / 2;
      const nx = -dy / len * 7, ny = dx / len * 7;
      const g = svgEl('g', {});

      for (const s of [s1, s2]) {
        g.appendChild(svgEl('line', {
          x1: s.x-nx, y1: s.y-ny, x2: s.x+nx, y2: s.y+ny,
          stroke:'#388bfd','stroke-width':'1', opacity:'0.5'
        }));
      }
      g.appendChild(svgEl('line', {
        x1:s1.x, y1:s1.y, x2:s2.x, y2:s2.y,
        stroke:'#388bfd','stroke-width':'1',
        'marker-start':'url(#a-s)','marker-end':'url(#a-e)', opacity:'0.7'
      }));

      const bw = fmt.length * 6.5 + 10, bh = 16;
      const bg = svgEl('rect', { x:mx-bw/2, y:my-bh/2-1, width:bw, height:bh,
        fill:'#0d1117', rx:'3', opacity:'0.92' });
      g.appendChild(bg);

      const txt = svgEl('text', {
        x:mx, y:my+4.5, 'text-anchor':'middle',
        fill:'#58a6ff', 'font-size':'11', 'font-family':'monospace',
        'pointer-events': key ? 'all' : 'none',
        cursor: key ? 'pointer' : 'default', 'user-select':'none'
      });
      txt.textContent = fmt;
      if (key) {
        txt.addEventListener('mouseenter', () => { txt.setAttribute('fill','#79c0ff'); bg.setAttribute('fill','#161b22'); });
        txt.addEventListener('mouseleave', () => { txt.setAttribute('fill','#58a6ff'); bg.setAttribute('fill','#0d1117'); });
        txt.addEventListener('click', e => { e.stopPropagation(); showDimInput(mx, my, key); });
      }
      g.appendChild(txt);
      dimsSvg.appendChild(g);
    }

    const Z   = 0;
    const xL  = f.type === 'L-inv' ? -B : 0;
    const xR  = f.type === 'L'     ? totalL + B : totalL;
    const oL  = xL - 0.40, oL2 = xL - 0.75;
    const oR  = xR + 0.40, oR2 = xR + 0.75;

    if (f.type === 'L')
      drawDim([totalL, yFoundC, Z], [totalL+B, yFoundC, Z], `B=${B.toFixed(2)}m`, 'B');
    else if (f.type === 'L-inv')
      drawDim([-B, yFoundC, Z], [0, yFoundC, Z], `B=${B.toFixed(2)}m`, 'B');
    else
      drawDim([totalL, yFoundC, Z], [totalL+B/2, yFoundC, Z], `B=${B.toFixed(2)}m`, 'B');

    drawDim([oR,  yFoundBot+Hf, Z], [oR,  yFoundBot, Z],   `Hf=${Hf.toFixed(2)}m`,  'Hf');
    drawDim([oR2, 0,            Z], [oR2, yFoundBot, Z],   `Df=${Df.toFixed(2)}m`,   'Df');
    drawDim([oL,  ySBTop,       Z], [oL,  ySBBot, Z],      `Hsc=${SB_H.toFixed(2)}m`,'SB_H');
    drawDim([oL2, ySBTop,       Z], [oL2, ySBTop+wallH, Z],`H=${wallH.toFixed(2)}m`, 'H');
    if (BT_H >= 0.10)
      drawDim([oR, ySBTop+wallH, Z], [oR, ySBTop+wallH+BT_H, Z], `Hc=${BT_H.toFixed(2)}m`, null);
  }

  // ── Input inline de cotas ─────────────────────────────
  function showDimInput(cx, cy, key) {
    document.getElementById('dim3d-inp')?.remove();
    const valMap = {
      B: ()    => S.story.foundation.B,
      Hf: ()   => S.story.foundation.Hf,
      Df: ()   => S.story.foundation.Df,
      H: ()    => S.story.H,
      SB_H: () => S.spans[0]?.beamBot?.section?.h ?? 0.60
    };
    const names = { B:'Vuelo zapata B', Hf:'Altura zapata Hf', Df:'Profundidad Df',
                    H:'Altura muro H', SB_H:'Alt. sobrecimiento' };
    const current = valMap[key]?.();
    if (current === undefined) return;

    const wrap = document.createElement('div');
    wrap.id = 'dim3d-inp';
    wrap.style.cssText = [
      'position:absolute', `left:${cx}px`, `top:${cy - 28}px`,
      'transform:translate(-50%,-100%)',
      'background:#1c2128', 'border:1.5px solid #388bfd',
      'border-radius:6px', 'padding:6px 10px 8px',
      'z-index:200', 'display:flex', 'flex-direction:column',
      'align-items:center', 'gap:4px',
      'box-shadow:0 4px 16px rgba(0,0,0,.6)'
    ].join(';');

    const lbl = document.createElement('span');
    lbl.textContent = names[key] || key;
    lbl.style.cssText = 'color:#8b949e;font-size:10px;font-family:monospace;white-space:nowrap;';

    const inp = document.createElement('input');
    inp.type  = 'number';
    inp.value = current.toFixed(3);
    inp.step  = 0.01; inp.min = 0.05;
    inp.style.cssText = [
      'width:80px', 'background:#0d1117',
      'color:#e6edf3', 'border:1px solid #30363d',
      'border-radius:4px', 'padding:3px 6px',
      'font-size:13px', 'font-family:monospace',
      'text-align:center', 'outline:none'
    ].join(';');

    wrap.appendChild(lbl);
    wrap.appendChild(inp);
    container.appendChild(wrap);
    inp.focus(); inp.select();

    const commit = () => {
      const v = parseFloat(inp.value);
      wrap.remove();
      if (!isNaN(v) && v >= 0.05) applyDimEdit(key, v);
    };
    inp.addEventListener('keydown', e => {
      if (e.key === 'Enter')  { e.preventDefault(); commit(); }
      if (e.key === 'Escape') { wrap.remove(); }
    });
    inp.addEventListener('blur', commit);
  }

  function applyDimEdit(key, value) {
    switch (key) {
      case 'B':    S.story.foundation.B   = value; syncInput('f-B',  value); break;
      case 'Hf':   S.story.foundation.Hf  = value; syncInput('f-Hf', value); break;
      case 'Df':   S.story.foundation.Df  = value; syncInput('f-Df', value); break;
      case 'H':    S.story.H              = value; syncInput('g-H',  value); break;
      case 'SB_H':
        S.spans.forEach(sp => { if (sp.beamBot?.section) sp.beamBot.section.h = value; });
        break;
    }
    rebuildGeom();
    renderPanel(); // refresh input values in panel
  }

  // ── Construcción del modelo 3D ────────────────────────
  function build(resetCamera = true) {
    clearScene();
    mkMats();

    const wallH  = S.story.H;
    const f      = S.story.foundation;
    const totalL = getTotalL();

    const TW    = S.spans[0]?.tw || 0.14;
    const COL_B = S.columns[S.nodes[0]?.id]?.section?.b ?? 0.20;
    const COL_H = S.columns[S.nodes[0]?.id]?.section?.h ?? 0.15;
    const BT_H  = S.spans[0]?.beamTop?.section?.h ?? 0.15;
    const BT_B  = S.spans[0]?.beamTop?.section?.b ?? 0.20;
    const BT_Z  = Math.max(BT_B, COL_H);
    const SB_H  = S.spans[0]?.beamBot?.section?.h ?? 0.60;
    const SB_Z  = Math.max(S.spans[0]?.beamBot?.section?.b ?? 0.15, 0.15);
    const Hf    = f.Hf || 0.60;
    const Df    = f.Df || 0.85;
    const B     = f.B  || 0.80;
    const foundZ = Math.max(SB_Z, 0.65);

    const foundCX = f.type === 'L'     ? totalL / 2 + B / 2
                  : f.type === 'L-inv' ? totalL / 2 - B / 2
                  :                      totalL / 2;
    const foundW  = totalL + B;

    // Offset Z — sección transversal en forma de L (no T simétrica)
    const zFnd = f.type === 'L'     ? (SB_Z - foundZ) / 2
               : f.type === 'L-inv' ? (foundZ - SB_Z) / 2
               :                      0;

    const SOB_ABOVE = 0.20;
    const yGround   = 0;
    const ySBTop    = yGround + SOB_ABOVE;
    const ySBBot    = ySBTop - SB_H;
    const yFoundT   = ySBBot;
    const yFoundC   = yFoundT - Hf / 2;
    const yFoundBot = yFoundT - Hf;

    // Tierra de fondo
    const earthH = Df + 1.2;
    addBox(foundW + 4, earthH, foundZ + 4,
           foundCX, yFoundBot - earthH / 2, 0, mats.earth, mats.edges);

    // Césped
    const grass = new THREE.Mesh(new THREE.PlaneGeometry(foundW + 10, 8), mats.grass);
    grass.rotation.x = -Math.PI / 2;
    grass.position.set(foundCX, yGround + 0.01, 0);
    grass.receiveShadow = true;
    grass.userData.s3d  = true;
    scene.add(grass);

    // Zapata (con offset Z según tipo L)
    addBox(foundW, Hf, foundZ, foundCX, yFoundC, zFnd, mats.found, mats.edgesC);

    // Spans
    S.spans.forEach(span => {
      const fromX = S.nodes.find(n => n.id === span.fromNode).x;
      const toX   = S.nodes.find(n => n.id === span.toNode).x;
      const L = toX - fromX, cx = fromX + L / 2;
      const sBZ = Math.max(span.beamBot?.section?.b ?? 0.15, 0.15);
      const bTH = span.beamTop?.section?.h ?? BT_H;
      const bTZ = Math.max(span.beamTop?.section?.b ?? BT_B, COL_H);
      const sbH = span.beamBot?.section?.h ?? SB_H;
      const tw  = span.tw || TW;
      addBox(L, sbH, sBZ, cx, ySBBot + sbH / 2,   0, mats.concrete, mats.edgesC);
      addBox(L, wallH, tw, cx, ySBTop + wallH / 2, 0, mats.masonry,  mats.edges);
      addBox(L, bTH, bTZ,  cx, ySBTop + wallH + bTH / 2, 0, mats.concrete, mats.edgesC);
    });

    // Columnas
    const colH  = wallH + BT_H;
    const colYC = ySBTop + colH / 2;
    S.nodes.forEach(node => {
      addBox(COL_B, colH, COL_H, node.x, colYC, 0, mats.concrete, mats.edgesC);
    });

    if (resetCamera) {
      const cx   = totalL / 2;
      const cy   = ySBTop + wallH / 2;
      const dist = Math.max(totalL * 0.85, 8);
      camera.position.set(cx + dist * 0.3, cy + dist * 0.5, dist);
      camera.lookAt(cx, cy, 0);
      controls.target.set(cx, cy, 0);
      controls.update();
    }

    dimState = { B, Hf, Df, wallH, BT_H, SB_H, ySBTop, ySBBot, yFoundC, yFoundBot, f, totalL, zFnd };
    dimsFlag = true;
  }

  // ── Loop ─────────────────────────────────────────────
  function animate() {
    animId = requestAnimationFrame(animate);
    controls.update();
    renderer.render(scene, camera);
    if (dimsFlag) { updateDims(); dimsFlag = false; }
  }

  function onResize() {
    if (!container) return;
    const W = container.clientWidth, H = container.clientHeight;
    if (!W || !H) return;
    camera.aspect = W / H;
    camera.updateProjectionMatrix();
    renderer.setSize(W, H);
    dimsFlag = true;
  }

  // ── API Pública ───────────────────────────────────────
  return {
    init(cont) {
      container = cont;
      const W = cont.clientWidth  || 800;
      const H = cont.clientHeight || 500;

      scene = new THREE.Scene();
      scene.background = new THREE.Color(0x0d1117);
      scene.fog = new THREE.FogExp2(0x0d1117, 0.015);

      camera = new THREE.PerspectiveCamera(42, W / H, 0.05, 300);

      renderer = new THREE.WebGLRenderer({ antialias: true });
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
      renderer.setSize(W, H);
      renderer.shadowMap.enabled = true;
      renderer.shadowMap.type    = THREE.PCFSoftShadowMap;
      cont.appendChild(renderer.domElement);

      scene.add(new THREE.AmbientLight(0xffffff, 0.55));
      scene.add(new THREE.HemisphereLight(0xddeeff, 0x3a2410, 0.5));

      const sun = new THREE.DirectionalLight(0xfff8e0, 1.1);
      sun.position.set(20, 30, 15);
      sun.castShadow = true;
      sun.shadow.mapSize.set(2048, 2048);
      sun.shadow.camera.near = 0.5; sun.shadow.camera.far = 150;
      sun.shadow.camera.left = -30; sun.shadow.camera.right = 30;
      sun.shadow.camera.top  =  20; sun.shadow.camera.bottom = -20;
      scene.add(sun);

      const fill = new THREE.DirectionalLight(0xaaccff, 0.3);
      fill.position.set(-10, 5, -5);
      scene.add(fill);

      const grid = new THREE.GridHelper(80, 80, 0x161b22, 0x161b22);
      grid.position.y = 0.001;
      scene.add(grid);

      controls = new THREE.OrbitControls(camera, renderer.domElement);
      controls.enableDamping  = true;
      controls.dampingFactor  = 0.07;
      controls.minDistance    = 1;
      controls.maxDistance    = 100;
      controls.maxPolarAngle  = Math.PI * 0.88;
      controls.addEventListener('change', () => { dimsFlag = true; });

      initPanel();
      initDimsSvg();
      build();
      animate();
      window.addEventListener('resize', onResize);
    },

    refresh() {
      if (!scene) return;
      build();
      renderPanel();
    },

    destroy() {
      if (animId) cancelAnimationFrame(animId);
      window.removeEventListener('resize', onResize);
      if (renderer) { renderer.dispose(); renderer = null; }
      if (dimsSvg)  { dimsSvg.remove(); dimsSvg = null; }
      if (panelEl)  { panelEl.remove(); panelEl = null; }
      scene = camera = controls = container = null;
      animId = dimState = null;
    }
  };
})();
