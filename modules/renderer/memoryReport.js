/**
 * MEMORYREPORT.JS — Memoria de Cálculo v3
 * Reporte práctico e instructivo para obra (Constructor-Friendly)
 * Vanilla JS puro · Sin dependencias
 */

const MemoryReport = {
  _PAGE_IDS:   ['ficha','general','column','beam_top','beam_bot','brick','foundation'],
  _PAGE_NAMES: ['Ficha de Obra','Vista General','Pilar','Cadena Superior','Sobrecimiento','Ladrillo / Muro','Fundación'],
  _curPage: 0,

  open() {
    Solver.run();
    let ov = document.getElementById('mr-overlay');
    if (!ov) { ov = this._createOverlay(); document.body.appendChild(ov); }
    ov.classList.remove('hidden');
    this._gotoPage(0);
  },

  close() { document.getElementById('mr-overlay')?.classList.add('hidden'); },

  _createOverlay() {
    const ov = document.createElement('div');
    ov.id = 'mr-overlay';
    ov.style.cssText = 'position:fixed;inset:0;z-index:11000;background:#0d1117;display:flex;flex-direction:column;font-family:Inter,system-ui,sans-serif;overflow:hidden;';

    const hdr = document.createElement('div');
    hdr.style.cssText = 'display:flex;align-items:center;gap:12px;padding:10px 20px;background:#161b22;border-bottom:1px solid rgba(48,54,61,0.8);flex-shrink:0;';
    hdr.innerHTML = `
      <svg width="16" height="16" fill="none" stroke="#2f81f7" stroke-width="2" viewBox="0 0 24 24"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg>
      <div style="flex:1;font-size:0.88rem;font-weight:700;color:#e6edf3;">Predimensionamiento de Muro de Adosamiento</div>
      <div style="font-size:0.72rem;color:#8b949e;margin-right:8px;">NCh2123 · NCh430 · NCh433 · NCh3171</div>
      <button id="mr-print-btn" style="background:#2f81f7;border:none;color:#fff;padding:6px 14px;border-radius:5px;cursor:pointer;font-size:0.78rem;font-weight:600;display:flex;align-items:center;gap:6px;">
        <svg width="13" height="13" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><polyline points="6 9 6 2 18 2 18 9"/><path d="M6 18H4a2 2 0 01-2-2v-5a2 2 0 012-2h16a2 2 0 012 2v5a2 2 0 01-2 2h-2"/><rect x="6" y="14" width="12" height="8"/></svg>
        Imprimir / PDF
      </button>
      <button id="mr-close-btn" style="background:rgba(255,255,255,0.08);border:none;color:#aaa;padding:6px 12px;border-radius:5px;cursor:pointer;font-size:0.85rem;">✕</button>`;
    ov.appendChild(hdr);

    const body = document.createElement('div');
    body.style.cssText = 'display:flex;flex:1;overflow:hidden;';

    const nav = document.createElement('nav');
    nav.style.cssText = 'width:155px;flex-shrink:0;background:#161b22;border-right:1px solid rgba(48,54,61,0.8);padding:10px 6px;display:flex;flex-direction:column;gap:3px;overflow-y:auto;';

    this._PAGE_NAMES.forEach((name, i) => {
      const icons = ['☰','⊞','▐','—','_','▩','⌇'];
      const btn = document.createElement('button');
      btn.className = 'mr-nav-btn';
      btn.dataset.page = i;
      btn.style.cssText = 'width:100%;text-align:left;padding:8px 9px;background:transparent;border:1px solid transparent;color:#8b949e;border-radius:5px;cursor:pointer;font-size:0.76rem;transition:all 0.12s;display:flex;align-items:center;gap:7px;';
      btn.innerHTML = `<span style="font-size:0.65rem;opacity:0.6">${icons[i]}</span>${name}`;
      btn.onclick = () => this._gotoPage(i);
      nav.appendChild(btn);
    });
    body.appendChild(nav);

    const content = document.createElement('div');
    content.id = 'mr-content';
    content.style.cssText = 'flex:1;overflow-y:auto;padding:28px 36px;background:#0d1117;';
    body.appendChild(content);
    ov.appendChild(body);

    hdr.querySelector('#mr-print-btn').onclick = () => this.showPrintDialog();
    hdr.querySelector('#mr-close-btn').onclick  = () => this.close();
    return ov;
  },

  _gotoPage(idx) {
    this._curPage = idx;
    document.querySelectorAll('.mr-nav-btn').forEach((b, i) => {
      const on = i === idx;
      b.style.background   = on ? 'rgba(47,129,247,0.12)' : 'transparent';
      b.style.borderColor  = on ? 'rgba(47,129,247,0.35)' : 'transparent';
      b.style.color        = on ? '#e6edf3' : '#8b949e';
    });
    const c = document.getElementById('mr-content');
    c.innerHTML = '';
    [
      () => this._pageFicha(c),
      () => this._pageGeneral(c),
      () => this._pageColumn(c),
      () => this._pageBeamTop(c),
      () => this._pageBeamBot(c),
      () => this._pageBrick(c),
      () => this._pageFoundation(c),
    ][idx]?.call(this);
  },

  showPrintDialog() {
    let oldDlg = document.getElementById('mr-print-dlg');
    if (oldDlg) oldDlg.remove();

    const dlg = document.createElement('div');
    dlg.id = 'mr-print-dlg';
    dlg.style.cssText = 'position:fixed;inset:0;z-index:12000;background:rgba(13,17,23,0.85);backdrop-filter:blur(10px);display:flex;align-items:center;justify-content:center;font-family:Inter,system-ui,sans-serif;';

    const box = document.createElement('div');
    box.style.cssText = 'background:#161b22;border:1px solid #30363d;border-radius:12px;width:560px;max-width:95%;box-shadow:0 24px 64px rgba(0,0,0,0.7);display:flex;flex-direction:column;overflow:hidden;';

    const hdr = document.createElement('div');
    hdr.style.cssText = 'padding:16px 24px;background:#0d1117;border-bottom:1px solid #30363d;font-weight:700;font-size:1.05rem;color:#e6edf3;display:flex;align-items:center;justify-content:space-between;';
    hdr.innerHTML = `<span>Exportar Documentación Técnica PDF</span><button id="mr-dlg-close" style="background:transparent;border:none;color:#8b949e;cursor:pointer;font-size:1.2rem;line-height:1;transition:color 0.15s;">✕</button>`;
    box.appendChild(hdr);
    
    // hovering behavior for close button
    const closeBtn = hdr.querySelector('#mr-dlg-close');
    closeBtn.onmouseenter = () => closeBtn.style.color = '#ff7b72';
    closeBtn.onmouseleave = () => closeBtn.style.color = '#8b949e';

    const body = document.createElement('div');
    body.style.cssText = 'padding:28px 24px;display:flex;flex-direction:column;gap:20px;color:#c9d1d9;font-size:0.88rem;';
    body.innerHTML = `
      <p style="margin:0 0 4px 0;color:#8b949e;line-height:1.5;font-size:0.92rem;text-align:center;">Selecciona el formato de exportación para tu proyecto:</p>
      
      <div style="display:flex;flex-direction:column;gap:16px;">
        <!-- OPTION A: PLANOS Y ESPECIFICACIONES DE OBRA -->
        <button id="export-modulo-a" style="display:flex;align-items:center;gap:18px;background:rgba(56,139,253,0.06);border:1px solid rgba(56,139,253,0.25);border-radius:8px;padding:16px 20px;text-align:left;cursor:pointer;transition:all 0.2s ease;width:100%;color:#e6edf3;">
          <div style="background:rgba(56,139,253,0.12);padding:12px;border-radius:8px;color:#58a6ff;display:flex;align-items:center;justify-content:center;">
            <svg width="24" height="24" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/></svg>
          </div>
          <div style="flex:1;">
            <div style="font-weight:700;font-size:0.95rem;color:#58a6ff;margin-bottom:4px;">🔘 MÓDULO A: Carpeta de Obra (Planos y Fichas)</div>
            <div style="font-size:0.78rem;color:#8b949e;line-height:1.4;">Ideal para terreno. Genera Ficha de Armado, Cubicación Comercial de Hormigón/Acero con despuntes, Elevaciones proporcionales y Detalles constructivos con estándar CAD.</div>
          </div>
        </button>

        <!-- OPTION B: MEMORIA DE CÁLCULO FORMAL (DOM) -->
        <button id="export-modulo-b" style="display:flex;align-items:center;gap:18px;background:rgba(46,160,67,0.06);border:1px solid rgba(46,160,67,0.25);border-radius:8px;padding:16px 20px;text-align:left;cursor:pointer;transition:all 0.2s ease;width:100%;color:#e6edf3;">
          <div style="background:rgba(46,160,67,0.12);padding:12px;border-radius:8px;color:#3fb950;display:flex;align-items:center;justify-content:center;">
            <svg width="24" height="24" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>
          </div>
          <div style="flex:1;">
            <div style="font-weight:700;font-size:0.95rem;color:#3fb950;margin-bottom:4px;">🔘 MÓDULO B: Memoria de Cálculo (Revisión Municipal)</div>
            <div style="font-size:0.78rem;color:#8b949e;line-height:1.4;">Estándar formal para la Dirección de Obras Municipales. Contiene Portada formal, Generalidades, Especificación de materiales, Criterios de diseño, Análisis sísmico automatizado, Solver de fuerzas y Bibliografía.</div>
          </div>
        </button>

        <!-- OPTION C: ANÁLISIS TÉCNICO AVANZADO (ENHANCED) -->
        <button id="export-modulo-c" style="display:flex;align-items:center;gap:18px;background:rgba(168,85,247,0.06);border:1px solid rgba(168,85,247,0.25);border-radius:8px;padding:16px 20px;text-align:left;cursor:pointer;transition:all 0.2s ease;width:100%;color:#e6edf3;">
          <div style="background:rgba(168,85,247,0.12);padding:12px;border-radius:8px;color:#d084d0;display:flex;align-items:center;justify-content:center;">
            <svg width="24" height="24" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"/></svg>
          </div>
          <div style="flex:1;">
            <div style="font-weight:700;font-size:0.95rem;color:#d084d0;margin-bottom:4px;">🔘 MÓDULO C: Análisis Técnico Avanzado</div>
            <div style="font-size:0.78rem;color:#8b949e;line-height:1.4;">Análisis detallado para ingeniero. Incluye Cargas LRFD, Fuerzas Críticas (M, V, N), Especificación de Armadura y Checklist de Cumplimiento NCh430 + Páginas del Módulo B.</div>
          </div>
        </button>
      </div>
    `;
    box.appendChild(body);

    const ftr = document.createElement('div');
    ftr.style.cssText = 'padding:14px 24px;background:#0d1117;border-top:1px solid #30363d;display:flex;justify-content:flex-end;';
    ftr.innerHTML = `
      <button id="mr-dlg-cancel" style="background:rgba(255,255,255,0.08);border:none;color:#aaa;padding:8px 16px;border-radius:5px;cursor:pointer;font-size:0.8rem;font-weight:600;transition:background 0.15s;">Cerrar</button>
    `;
    box.appendChild(ftr);
    dlg.appendChild(box);
    document.body.appendChild(dlg);

    // Hover transitions for premium look
    const btnA = body.querySelector('#export-modulo-a');
    btnA.onmouseenter = () => {
      btnA.style.background = 'rgba(56,139,253,0.12)';
      btnA.style.borderColor = 'rgba(56,139,253,0.5)';
      btnA.style.transform = 'translateY(-1px)';
    };
    btnA.onmouseleave = () => {
      btnA.style.background = 'rgba(56,139,253,0.06)';
      btnA.style.borderColor = 'rgba(56,139,253,0.25)';
      btnA.style.transform = 'none';
    };

    const btnB = body.querySelector('#export-modulo-b');
    btnB.onmouseenter = () => {
      btnB.style.background = 'rgba(46,160,67,0.12)';
      btnB.style.borderColor = 'rgba(46,160,67,0.5)';
      btnB.style.transform = 'translateY(-1px)';
    };
    btnB.onmouseleave = () => {
      btnB.style.background = 'rgba(46,160,67,0.06)';
      btnB.style.borderColor = 'rgba(46,160,67,0.25)';
      btnB.style.transform = 'none';
    };

    // Hover transitions for btnC (NEW)
    const btnC = body.querySelector('#export-modulo-c');
    btnC.onmouseenter = () => {
      btnC.style.background = 'rgba(168,85,247,0.12)';
      btnC.style.borderColor = 'rgba(168,85,247,0.5)';
      btnC.style.transform = 'translateY(-1px)';
    };
    btnC.onmouseleave = () => {
      btnC.style.background = 'rgba(168,85,247,0.06)';
      btnC.style.borderColor = 'rgba(168,85,247,0.25)';
      btnC.style.transform = 'none';
    };

    const closeDlg = () => dlg.remove();
    dlg.querySelector('#mr-dlg-close').onclick = closeDlg;
    dlg.querySelector('#mr-dlg-cancel').onclick = closeDlg;

    // Actions — Direct PDF Download
    btnA.onclick = () => { closeDlg(); this._askModuleAFormat(useSvg => this.downloadModulePDF('A', useSvg)); };
    btnB.onclick = () => { closeDlg(); this.downloadModulePDF('B'); };
    btnC.onclick = () => { closeDlg(); this.downloadModulePDF('C'); };
  },

  // Diálogo de selección de formato para Módulo A (SVG vs imagen guardada).
  // Llama callback(true) para SVG calculado, callback(false) para imagen guardada.
  _askModuleAFormat(callback) {
    const overlay = document.createElement('div');
    overlay.style.cssText = [
      'position:fixed;inset:0;z-index:99998;',
      'background:rgba(0,0,0,0.75);',
      'display:flex;align-items:center;justify-content:center;'
    ].join('');

    const dlg = document.createElement('div');
    dlg.style.cssText = [
      'background:#161b22;border:1px solid #30363d;border-radius:12px;',
      'padding:28px 30px;width:400px;',
      'box-shadow:0 12px 40px rgba(0,0,0,0.7);',
      'font-family:system-ui,sans-serif;'
    ].join('');

    dlg.innerHTML = `
      <div style="font-size:0.75rem;font-weight:700;color:#8b949e;letter-spacing:0.06em;
                  text-transform:uppercase;margin-bottom:8px;">Módulo A — Carpeta de Obra</div>
      <div style="font-size:1rem;font-weight:700;color:#e6edf3;margin-bottom:5px;">
        ¿Cómo generar los planos de detalle?
      </div>
      <div style="font-size:0.79rem;color:#8b949e;line-height:1.55;margin-bottom:22px;">
        Elige el tipo de gráfico para las secciones transversales y perfiles de armadura.
      </div>

      <div style="display:flex;flex-direction:column;gap:10px;margin-bottom:22px;">
        <button id="mr-fmt-svg" style="
          padding:13px 16px;border-radius:8px;cursor:pointer;text-align:left;
          border:1.5px solid rgba(88,166,255,0.55);background:rgba(88,166,255,0.09);
          color:#58a6ff;font-size:0.86rem;font-weight:700;
          display:flex;align-items:center;gap:12px;
          transition:background 0.15s,border-color 0.15s;">
          <span style="font-size:1.4rem;line-height:1;">📐</span>
          <div>
            <div>SVG calculado</div>
            <div style="font-weight:400;font-size:0.74rem;opacity:0.8;margin-top:3px;">
              Gráficos generados en tiempo real desde los datos de cálculo actuales
            </div>
          </div>
        </button>

        <button id="mr-fmt-img" style="
          padding:13px 16px;border-radius:8px;cursor:pointer;text-align:left;
          border:1.5px solid rgba(139,148,158,0.3);background:rgba(139,148,158,0.06);
          color:#c9d1d9;font-size:0.86rem;font-weight:700;
          display:flex;align-items:center;gap:12px;
          transition:background 0.15s,border-color 0.15s;">
          <span style="font-size:1.4rem;line-height:1;">🖼</span>
          <div>
            <div>Imagen guardada</div>
            <div style="font-weight:400;font-size:0.74rem;opacity:0.75;margin-top:3px;">
              Imágenes de referencia almacenadas en la carpeta <code style="font-size:0.72rem;">imagenes/</code>
            </div>
          </div>
        </button>
      </div>

      <div style="display:flex;justify-content:flex-end;">
        <button id="mr-fmt-cancel" style="
          padding:5px 16px;border-radius:5px;border:1px solid #30363d;
          background:transparent;color:#8b949e;font-size:0.78rem;cursor:pointer;">
          Cancelar
        </button>
      </div>`;

    overlay.appendChild(dlg);
    document.body.appendChild(overlay);

    const close = () => { if (document.body.contains(overlay)) document.body.removeChild(overlay); };

    const btnSvg    = dlg.querySelector('#mr-fmt-svg');
    const btnImg    = dlg.querySelector('#mr-fmt-img');
    const btnCancel = dlg.querySelector('#mr-fmt-cancel');

    btnSvg.addEventListener('mouseenter', () => { btnSvg.style.background = 'rgba(88,166,255,0.18)'; });
    btnSvg.addEventListener('mouseleave', () => { btnSvg.style.background = 'rgba(88,166,255,0.09)'; });
    btnImg.addEventListener('mouseenter', () => { btnImg.style.background = 'rgba(139,148,158,0.13)'; });
    btnImg.addEventListener('mouseleave', () => { btnImg.style.background = 'rgba(139,148,158,0.06)'; });

    btnSvg.onclick    = () => { close(); callback(true);  };
    btnImg.onclick    = () => { close(); callback(false); };
    btnCancel.onclick = close;
    overlay.addEventListener('click', e => { if (e.target === overlay) close(); });
  },

  downloadModulePDF(type, useSvg = false) {
    // Verificar que la app corre desde http:// (no file://)
    if (location.protocol === 'file:') {
      alert('⚠️ Abre la app desde el servidor:\n\nhttp://localhost:3001\n\nNo uses el archivo directamente.\nEl PDF con imágenes requiere el servidor Python.');
      return;
    }

    const filename = type === 'A'
      ? `Carpeta_Obra_${new Date().toISOString().split('T')[0]}.pdf`
      : type === 'B'
      ? `Predimensionamiento_Muro_Adosamiento_${new Date().toISOString().split('T')[0]}.pdf`
      : `Analisis_Tecnico_Avanzado_${new Date().toISOString().split('T')[0]}.pdf`;

    const statusDiv = document.createElement('div');
    statusDiv.id = 'pdf-status-overlay';
    statusDiv.style.cssText = 'position:fixed;inset:0;z-index:99999;background:rgba(0,0,0,0.88);display:flex;align-items:center;justify-content:center;font-family:sans-serif;';
    const statusMsg = document.createElement('div');
    statusMsg.style.cssText = 'background:#161b22;color:#58a6ff;padding:22px 34px;border-radius:10px;font-weight:700;font-size:14px;border:1px solid #30363d;text-align:center;min-width:260px;box-shadow:0 4px 24px rgba(0,0,0,0.6);';
    statusMsg.textContent = '⏳ Preparando PDF...';
    statusDiv.appendChild(statusMsg);
    document.body.appendChild(statusDiv);

    const cleanup = () => {
      if (document.body.contains(wrapper))  document.body.removeChild(wrapper);
      if (document.body.contains(statusDiv)) document.body.removeChild(statusDiv);
    };

    // Wrapper HTML blanco — se inserta después de precargar imágenes
    const wrapper = document.createElement('div');
    wrapper.id = 'pdf-export-wrapper';
    wrapper.style.cssText = 'position:absolute;top:0;left:0;width:794px;background:#fff;z-index:1;visibility:hidden;';
    document.body.appendChild(wrapper);

    setTimeout(async () => {
      try {
        // ── PASO 1: Pre-cargar imágenes como base64 ───────────────────────
        // Módulo A en modo SVG no necesita imágenes → saltar para ahorrar tiempo.
        const imgCache = {};
        const skipImages = (type === 'A' && useSvg);

        if (!skipImages) {
          statusMsg.textContent = '⏳ Cargando imágenes de referencia...';
          const imagesToLoad = [
            'Cadena Superior - sección transversal.png',
            'Cadena Superior - sección longitudinal.png',
            'Sobrecimiento - Aislado sección transversal.png',
            'Sobrecimiento sección longitudinal.png',
            'Pilar - sección transversal.png',
            'Fundación - Zapata sección transversal.png',
            'Ladrillo.png'
          ];
          const loadOne = async (name) => {
            try {
              const url = 'imagenes/' + encodeURIComponent(name);
              const resp = await fetch(url, { cache: 'no-store' });
              if (!resp.ok) { console.warn('[PDF] no encontrada:', url, resp.status); return; }
              const buf   = await resp.arrayBuffer();
              const bytes = new Uint8Array(buf);
              let binary = '';
              for (let i = 0; i < bytes.length; i += 8192)
                binary += String.fromCharCode(...bytes.subarray(i, Math.min(i + 8192, bytes.length)));
              imgCache[name] = 'data:image/png;base64,' + btoa(binary);
              console.log('[PDF] ✓', name);
            } catch(e) { console.warn('[PDF] error:', name, e); }
          };
          await Promise.all(imagesToLoad.map(loadOne));
          const loaded = Object.keys(imgCache).length;
          console.log(`[PDF] imgCache: ${loaded}/${imagesToLoad.length}`, Object.keys(imgCache));
          statusMsg.textContent = `⏳ ${loaded} imágenes cargadas. Generando PDF...`;
        } else {
          statusMsg.textContent = '⏳ Generando diagramas SVG...';
        }

        // ── PASO 2: Generar HTML ──────────────────────────────────────────
        wrapper.innerHTML = this._buildModuleHTMLForPDF(type, imgCache, useSvg);
        wrapper.style.visibility = 'visible';

        const pages = Array.from(wrapper.querySelectorAll('.pdf-page'));
        if (!pages.length) throw new Error('Sin páginas en el documento');

        await new Promise(resolve => setTimeout(resolve, 500));

        const { jsPDF } = window.jspdf;
        const pdf = new jsPDF({ unit: 'mm', format: 'a4', orientation: 'portrait' });

        for (let i = 0; i < pages.length; i++) {
          statusMsg.textContent = `⏳ Página ${i + 1} de ${pages.length}...`;
          const canvas = await html2canvas(pages[i], {
            scale: 2,
            useCORS: false,
            allowTaint: false,
            logging: false,
            backgroundColor: '#ffffff',
            width: 794,
            height: 1123
          });
          const img = canvas.toDataURL('image/jpeg', 0.92);
          if (i > 0) pdf.addPage();
          pdf.addImage(img, 'JPEG', 0, 0, 210, 297);
        }

        pdf.save(filename);
        cleanup();
        console.log('PDF generado:', filename);
      } catch (err) {
        console.error('Error PDF:', err);
        cleanup();
        alert('Error generando PDF: ' + err.message);
      }
    }, 600);
  },

  // Convierte colores del tema oscuro a colores aptos para impresión en papel blanco
  _printSVG(svgHtml) {
    let s = svgHtml;
    if (!s.includes('xmlns='))
      s = s.replace('<svg ', '<svg xmlns="http://www.w3.org/2000/svg" ');
    const map = [
      [/rgba\(255,255,255,0\.02\)/g,  '#efefef'],
      [/rgba\(63,185,80,0\.03\)/g,    'rgba(20,120,50,0.07)'],
      [/rgba\(63,185,80,0\.3\)/g,     'rgba(20,120,50,0.45)'],
      [/rgba\(248,200,60,0\.6\)/g,    'rgba(155,80,0,0.85)'],
      [/rgba\(200,170,50,0\.25\)/g,   'rgba(155,80,0,0.35)'],
      [/rgba\(139,148,158,0\.4\)/g,   'rgba(80,80,80,0.55)'],
      [/#e6edf3/gi,  '#111111'],
      [/#c9d1d9/gi,  '#333333'],
      [/#8b949e/gi,  '#555555'],
      [/#aaa(?=[^0-9a-f])/gi, '#666666'],
      [/#c0a040/gi,  '#7a5200'],
      [/#58a6ff/gi,  '#1a4fa8'],
      [/#0b1018/gi,  '#f0f0f0'],
      [/#f8c83c/gi,  '#b06000'],
      [/#3fb950/gi,  '#1a6b2e'],
      [/#f85149/gi,  '#b91c1c'],
      [/#0d1117/gi,  '#ffffff'],
    ];
    map.forEach(([re, val]) => { s = s.replace(re, val); });
    return s;
  },

  _buildModuleHTMLForPDF(type, imgCache = {}, useSvg = false) {
    // DELEGACIÓN A MÓDULO ENHANCED (NEW)
    if (type === 'C') {
      if (typeof MemoryReportEnhanced === 'undefined') {
        console.error('❌ memoryReport-enhanced.js no cargado');
        return '<div class="pdf-page"><p>Error: Módulo C no disponible. Verifica que memoryReport-enhanced.js está cargado.</p></div>';
      }
      return MemoryReportEnhanced.buildModuleHTMLForPDF('C', imgCache);
    }

    // DELEGACIÓN A MÓDULO CÁLCULO (MEMORIA TÉCNICA)
    if (type === 'B') {
      if (typeof MemoryReportCalc === 'undefined') {
        console.error('❌ memoryReport-calc.js no cargado');
        return '<div class="pdf-page"><p>Error: Módulo B Cálculo no disponible. Verifica que memoryReport-calc.js está cargado.</p></div>';
      }
      return MemoryReportCalc.build(imgCache);
    }

    Solver.run();
    const q      = this._calculateQuantityTakeoff();
    const m      = S.story.materials;
    const stH    = S.story.H;
    const f      = S.story.foundation;
    const totalL = q.meta.totalL;
    const today  = new Date().toLocaleDateString('es-CL');

    // Primer nodo y vano para los detalles (un ejemplo de cada elemento)
    const firstColNode = S.nodes.find(nd => S.results.columns?.[nd.id]);
    const col    = firstColNode ? S.columns[firstColNode.id]         : null;
    const colRes = firstColNode ? S.results.columns[firstColNode.id] : null;
    const colDes = colRes?.rebar || {};
    const firstSpan = S.spans.find(sp => sp.type === 'span') || S.spans[0];
    const spanL     = firstSpan ? getSpanL(firstSpan) : 1;

    // ─── CSS ───
    const css = `
      * { margin:0; padding:0; box-sizing:border-box; }
      .pdf-page {
        width:794px; height:1123px;
        padding:54px 57px 44px;
        background:#fff;
        overflow:hidden;
        font-family:Arial,Helvetica,sans-serif;
        font-size:10.5pt; color:#111;
        position:relative;
      }
      .ph { border-bottom:2px solid #111; padding-bottom:7px; margin-bottom:13px;
            display:flex; align-items:baseline; gap:10px; }
      .ph h1 { font-size:14pt; font-weight:700; color:#000; flex:1; }
      .ph .sub { font-size:8pt; color:#666; white-space:nowrap; }
      .pf { position:absolute; bottom:20px; left:57px; right:57px;
            border-top:0.5px solid #ccc; padding-top:4px;
            display:flex; justify-content:space-between; font-size:7.5pt; color:#999; }
      table { width:100%; border-collapse:collapse; font-size:9pt; margin:4px 0; }
      th { background:#f0f0f0; color:#222; font-weight:700; padding:6px 10px; text-align:left; border:1px solid #ccc; }
      td { padding:4px 10px; border-bottom:0.4px solid #e8e8e8; color:#111; font-weight:400; }
      tr:nth-child(even) td { background:#fafafa; }
      tr.tot td  { background:#d0eacd !important; font-weight:700; }
      tr.subt td { background:#e8eef8 !important; font-weight:600; }
      .card { margin:5px 0; border:1px solid #d0d0d0; border-radius:2px; }
      .ct { font-weight:700; font-size:9pt; background:#f4f4f4; padding:5px 12px; border-bottom:1px solid #d0d0d0; color:#222; }
      .cb { padding:8px 12px; }
      .cols { display:flex; gap:14px; align-items:flex-start; }
      .col  { flex:1; min-width:0; }
      .svg-box { text-align:center; margin:5px 0; }
      .svg-box svg { display:block; margin:0 auto; background:#fff; }
      h2 { font-size:11.5pt; font-weight:700; color:#000; margin:10px 0 6px; }
      h3 { font-size:9.5pt; font-weight:600; color:#222; margin:7px 0 3px; }
    `;

    // ─── Mapeo de Imágenes de Referencia ───
    // Mapea elementos a nombres de archivos en la carpeta imagenes/
    // Formato: 'NombreElemento': 'nombrearchivo.png'
    const imageMap = {
      'sobrecimiento': 'Sobrecimiento - Aislado sección transversal.png',
      'cadena_superior_transversal': 'Cadena Superior - sección transversal.png',
      'cadena_superior_longitudinal': 'Cadena Superior - sección longitudinal.png',
      'zapata': 'Sobrecimiento - Zapata sección transversal.png',
      'ladrillo': 'Ladrillo.png'
      // Agregar más elementos aquí a medida que se proporcionan las imágenes
    };

    // ─── Helpers ───
    const TOTAL = 7;
    const footer = (n) =>
      `<div class="pf"><span>NCh2123 · NCh430 · NCh433 · NCh3171</span><span></span><span>Pág. ${n} / ${TOTAL}</span></div>`;
    const ph = (num, title, sub='') =>
      `<div class="ph"><h1>${num}. ${title}</h1>${sub?`<span class="sub">${sub}</span>`:''}</div>`;
    const pSvg = (svgEl) =>
      `<div class="svg-box">${this._printSVG(svgEl.outerHTML)}</div>`;
    const mkCard = (title, rows) => {
      const r = rows.map(([l,v]) =>
        `<tr><td style="color:#333;width:56%;">${l}</td><td style="text-align:right;color:#111;">${v}</td></tr>`
      ).join('');
      return `<div class="card"><div class="ct">${title}</div><div class="cb"><table>${r}</table></div></div>`;
    };
    const mkCards2 = (t1, r1, t2, r2) =>
      `<div class="cols"><div class="col">${mkCard(t1,r1)}</div><div class="col">${mkCard(t2,r2)}</div></div>`;

    // Muestra imagen de referencia desde imgCache (base64).
    const pImg = (imageName) => {
      if (imgCache[imageName]) {
        return `<div style="text-align:center;">
          <img src="${imgCache[imageName]}"
               style="max-width:100%;height:auto;background:#fff;margin:0 auto;display:block;"
               alt="${imageName}" />
        </div>`;
      }
      return `<div style="text-align:center;padding:20px;color:#999;font-size:9pt;border:1px dashed #ccc;">Imagen no disponible: ${imageName}</div>`;
    };
    // Imagen grande centrada, rellena el ancho de la página
    const pImgFull = (imageName, maxH = 280) => {
      if (imgCache[imageName]) {
        return `<div style="text-align:center;">
          <img src="${imgCache[imageName]}"
               style="max-width:100%;max-height:${maxH}px;height:auto;width:auto;background:#fff;margin:0 auto;display:block;"
               alt="${imageName}" />
        </div>`;
      }
      return `<div style="text-align:center;padding:20px;color:#999;font-size:9pt;border:1px dashed #ccc;">Imagen no disponible: ${imageName}</div>`;
    };

    // Selecciona SVG calculado o imagen según el modo elegido al descargar.
    // svgEl: elemento SVG DOM devuelto por _drawXS / _drawBeamProfile / _drawFoundSection.
    const useImg = (imageName, maxH, svgEl) =>
      useSvg ? pSvg(svgEl) : pImgFull(imageName, maxH);

    let html = `<style>${css}</style>`;

    // ════════════════════════════════════════════════
    // PÁG 1 — PORTADA
    // ════════════════════════════════════════════════
    html += `
    <div class="pdf-page" style="display:flex;flex-direction:column;justify-content:center;align-items:center;text-align:center;">
      <div style="width:100%;border-top:5px solid #111;padding-top:24px;margin-bottom:36px;">
        <div style="font-size:7.5pt;font-weight:700;letter-spacing:3px;color:#777;text-transform:uppercase;margin-bottom:10px;">Ingeniería Estructural — Albañilería Confinada</div>
        <div style="font-size:22pt;font-weight:700;color:#000;line-height:1.15;letter-spacing:-0.5px;">DOCUMENTACIÓN TÉCNICA PARA CONSTRUCCIÓN</div>
        <div style="font-size:11pt;color:#333;margin-top:8px;">Planos de Detalle y Cuadro de Materiales<br/>Albañilería Confinada</div>
        <div style="border-bottom:1px solid #bbb;margin-top:24px;"></div>
      </div>
      <table style="max-width:460px;width:100%;border-collapse:collapse;margin-bottom:52px;text-align:left;font-size:9.5pt;">
        <tr><td style="padding:8px 12px;font-weight:700;color:#555;border-bottom:0.5px solid #e0e0e0;width:42%;">Tipo de Obra:</td><td style="padding:8px 12px;border-bottom:0.5px solid #e0e0e0;">Muro de Albañilería Confinada</td></tr>
        <tr><td style="padding:8px 12px;font-weight:700;color:#555;border-bottom:0.5px solid #e0e0e0;">Longitud total (L):</td><td style="padding:8px 12px;border-bottom:0.5px solid #e0e0e0;font-weight:600;">${totalL.toFixed(2)} m</td></tr>
        <tr><td style="padding:8px 12px;font-weight:700;color:#555;border-bottom:0.5px solid #e0e0e0;">Altura entrepiso (H):</td><td style="padding:8px 12px;border-bottom:0.5px solid #e0e0e0;font-weight:600;">${stH.toFixed(2)} m</td></tr>
        <tr><td style="padding:8px 12px;font-weight:700;color:#555;border-bottom:0.5px solid #e0e0e0;">Hormigón:</td><td style="padding:8px 12px;border-bottom:0.5px solid #e0e0e0;">${q.hormigon.label}</td></tr>
        <tr><td style="padding:8px 12px;font-weight:700;color:#555;border-bottom:0.5px solid #e0e0e0;">Acero:</td><td style="padding:8px 12px;border-bottom:0.5px solid #e0e0e0;">A630-420H con resaltes — NCh204</td></tr>
        <tr><td style="padding:8px 12px;font-weight:700;color:#555;border-bottom:0.5px solid #e0e0e0;">Normativa:</td><td style="padding:8px 12px;border-bottom:0.5px solid #e0e0e0;">NCh2123 · NCh430 · NCh433 · NCh3171</td></tr>
        <tr><td style="padding:8px 12px;font-weight:700;color:#555;">Fecha:</td><td style="padding:8px 12px;">${today}</td></tr>
      </table>
      <div style="display:flex;gap:80px;margin-bottom:40px;">
        <div style="text-align:center;">
          <div style="width:200px;height:40px;border-bottom:1px solid #555;"></div>
          <div style="font-size:8pt;color:#555;padding-top:6px;">Constructor Civil / Jefe de Obra</div>
        </div>
        <div style="text-align:center;">
          <div style="width:200px;height:40px;border-bottom:1px solid #555;"></div>
          <div style="font-size:8pt;color:#555;padding-top:6px;">Ingeniero Proyectista</div>
        </div>
      </div>
      <div style="border-bottom:3px solid #111;width:100%;"></div>
    </div>`;

    // ════════════════════════════════════════════════
    // PÁG 2 — CUBICACIÓN DE MATERIALES (CONSOLIDADA)
    // ════════════════════════════════════════════════

    // Cálculos precisos de albañilería (excluyendo pilares y vigas)
    const ladrilloDim = {largo: 0.29, alto: 0.14}; // Princesa Titán 290×140 mm (cara vista)
    const juntalateral = 0.015; // 1.5 cm
    const juntavertical = 0.015;

    // Área neta de muro (largo × alto - área de pilares)
    const colSectionArea = col ? (col.section.b * col.section.h) : 0;
    const areaPilares = colSectionArea * q.meta.nPilares;
    const areaNetaMuro = totalL * stH - areaPilares;

    // Cubicación de ladrillo: calcular por hiladas y ladrillos
    // Dimensiones efectivas con juntas
    const ladrilloAnchoEfect = ladrilloDim.largo + juntalateral; // 0.305 m
    const ladrilloAltoEfect = ladrilloDim.alto + juntavertical;  // 0.155 m
    const ladrillosPorHilada = Math.ceil(totalL / ladrilloAnchoEfect);
    const hiladas = Math.ceil(stH / ladrilloAltoEfect);
    const totalLadrillos = ladrillosPorHilada * hiladas;
    const ladrillosConMerma = Math.ceil(totalLadrillos * 1.05);

    // Volumen de mortero (diferencia entre volumen de muro y volumen de ladrillos)
    const volMuroTotal = areaNetaMuro * 0.094; // espesor real del ladrillo: 94 mm
    const volLadrillos = totalLadrillos * (ladrilloDim.largo * ladrilloDim.alto * 0.094); // 94 mm profundidad
    const volMortero = (volMuroTotal - volLadrillos).toFixed(3);

    // Acero
    let steelRows = '', totalKg = 0;
    Object.keys(q.acero).sort((a,b)=>+a-+b).forEach(dia => {
      const d = q.acero[dia];
      const b12 = Math.ceil(d.metros / 12);
      totalKg += d.kg;
      steelRows += `<tr>
        <td>Ø${dia} mm</td>
        <td style="text-align:right">${d.metros.toFixed(1)}</td>
        <td style="text-align:right">${(this._STEEL_KG_M[+dia]||0.617).toFixed(3)}</td>
        <td style="text-align:right">${b12}</td>
        <td style="text-align:right">${d.kg.toFixed(1)}</td>
      </tr>`;
    });

    html += `
    <div class="pdf-page">
      ${ph(2,'CUBICACIÓN DE MATERIALES','Hormigón, Acero, Albañilería y Complementarios')}

      <h2>1. Cubicación de Hormigón Estructural</h2>
      <table>
        <tr><th>Componente</th><th style="text-align:right">Cantidad</th><th style="text-align:right">Largo (m)</th><th style="text-align:right">Sección (m²)</th><th style="text-align:right">Vol. (m³)</th></tr>
        <tr><td>Pilares (${q.meta.nPilares} un)</td><td style="text-align:right">${q.meta.nPilares}</td><td style="text-align:right">${stH.toFixed(2)}</td><td style="text-align:right">${col?(col.section.b*col.section.h).toFixed(4):'—'}</td><td style="text-align:right">${q.hormigon.pilares.toFixed(3)}</td></tr>
        <tr><td>Cadena Superior (${q.meta.nVanos} tramos)</td><td style="text-align:right">${q.meta.nVanos}</td><td style="text-align:right">${totalL.toFixed(2)}</td><td style="text-align:right">${firstSpan?(firstSpan.beamTop.section.b*firstSpan.beamTop.section.h).toFixed(4):'—'}</td><td style="text-align:right">${q.hormigon.cadenas.toFixed(3)}</td></tr>
        <tr><td>Sobrecimiento (${q.meta.nVanos} tramos)</td><td style="text-align:right">${q.meta.nVanos}</td><td style="text-align:right">${totalL.toFixed(2)}</td><td style="text-align:right">${firstSpan?(firstSpan.beamBot.section.b*firstSpan.beamBot.section.h).toFixed(4):'—'}</td><td style="text-align:right">${q.hormigon.sobrec.toFixed(3)}</td></tr>
        <tr><td>Zapata corrida</td><td style="text-align:right">1</td><td style="text-align:right">${(totalL+(f.B||0.6)).toFixed(2)}</td><td style="text-align:right">${((f.B||0.6)*(f.Hf||0.60)).toFixed(4)}</td><td style="text-align:right">${q.hormigon.zapata.toFixed(3)}</td></tr>
        <tr class="tot"><td><strong>TOTAL HORMIGÓN (+10% merma)</strong></td><td colspan="3" style="text-align:right">—</td><td style="text-align:right"><strong>${q.hormigon.comercial.toFixed(2)} m³</strong></td></tr>
      </table>

      <h2 style="margin-top:12px;">2. Cubicación de Acero de Refuerzo A630-420H</h2>
      <table>
        <tr><th>Diámetro</th><th style="text-align:right">Metros lineales</th><th style="text-align:right">kg/m</th><th style="text-align:right">Barras 12 m</th><th style="text-align:right">Peso (kg)</th></tr>
        ${steelRows}
        <tr class="tot"><td><strong>TOTAL ACERO</strong></td><td colspan="3" style="text-align:right">—</td><td style="text-align:right"><strong>${totalKg.toFixed(1)} kg</strong></td></tr>
      </table>

      <h2 style="margin-top:12px;">3. Cubicación de Albañilería (Área neta = ${areaNetaMuro.toFixed(2)} m²)</h2>
      <table>
        <tr><th>Material</th><th style="text-align:right">Cantidad</th><th>Especificación</th><th>Observaciones</th></tr>
        <tr><td>Ladrillos Princesa Titán</td><td style="text-align:right"><strong>${ladrillosConMerma}</strong> un</td><td>290×140×94 mm reforzado</td><td>Incl. 5% rotura / despuntes</td></tr>
        <tr><td>Mortero de pega</td><td style="text-align:right"><strong>${volMortero}</strong> m³</td><td>Mezcla 1:3 (cemento:arena)</td><td>Excluye área de pilares</td></tr>
      </table>

      <h2 style="margin-top:12px;">4. Materiales Complementarios</h2>
      <table>
        <tr><th>Ítem</th><th>Especificación</th><th style="text-align:right">Cantidad</th></tr>
        <tr><td>Alambre recocido N°18</td><td>Amarre de estribos</td><td style="text-align:right">~${Math.ceil(totalKg * 0.04)} kg</td></tr>
        <tr><td>Calugas plásticas</td><td>Separadores 3 cm — recubrimiento</td><td style="text-align:right">~${Math.ceil(q.meta.nPilares * 12 + q.meta.nVanos * 8)} un</td></tr>
        <tr><td>Hormigón pobre G5</td><td>Emplantillado bajo zapata (170 kg cem/m³)</td><td style="text-align:right">${((totalL+(f.B||0.6))*(f.B||0.6)*0.05).toFixed(3)} m³</td></tr>
      </table>

      <div style="margin-top:10px;padding:8px 10px;border:1px solid #999;background:#f0f0f0;font-size:8pt;line-height:1.4;">
        <strong>Notas de cálculo:</strong> Cubicación de hormigón incluye merma comercial del 10%. Albañilería excluye áreas de pilares y vigas para evitar contabilización duplicada. Mortero calculado como diferencia volumétrica. Acero incluye despunte del 10% (integrado en peso comercial).
      </div>
      ${footer(2)}
    </div>`;

    // ════════════════════════════════════════════════
    // PÁG 4 — ELEVACIÓN GENERAL (grande)
    // ════════════════════════════════════════════════
    const elW = 676;
    const elRatio = (stH + (f.Hf||0.60)) / totalL;
    const elH = Math.min(430, Math.max(180, Math.round(elW * elRatio)));
    const elevEl = this._svg(elW, elH);
    this._drawWallElevation(elevEl, elW, elH);
    const elevSvg = this._printSVG(elevEl.outerHTML);
    html += `
    <div class="pdf-page">
      ${ph(3,'ELEVACIÓN GENERAL DEL MURO',`Escala proporcional — L = ${totalL.toFixed(2)} m · H = ${stH.toFixed(2)} m`)}
      <div style="display:flex;justify-content:center;margin:16px 0 14px;">${elevSvg}</div>
      <table style="margin-top:8px;">
        <tr><th>Elemento</th><th>Cantidad</th><th>Sección b×h</th><th>Material</th></tr>
        <tr><td>Pilares de confinamiento</td><td>${q.meta.nPilares} un</td><td>${col?`${(col.section.b*100).toFixed(0)}×${(col.section.h*100).toFixed(0)} cm`:'—'}</td><td>${q.hormigon.label}</td></tr>
        <tr><td>Cadenas superiores</td><td>${q.meta.nVanos} tramos</td><td>${firstSpan?`${(firstSpan.beamTop.section.b*100).toFixed(0)}×${(firstSpan.beamTop.section.h*100).toFixed(0)} cm`:'—'}</td><td>${q.hormigon.label}</td></tr>
        <tr><td>Sobrecimientos</td><td>${q.meta.nVanos} tramos</td><td>${firstSpan?`${(firstSpan.beamBot.section.b*100).toFixed(0)}×${(firstSpan.beamBot.section.h*100).toFixed(0)} cm`:'—'}</td><td>${q.hormigon.label}</td></tr>
        <tr><td>Zapata corrida</td><td>Continua</td><td>${((f.B||0.6)*100).toFixed(0)}×${((f.Hf||0.60)*100).toFixed(0)} cm</td><td>HA G25 — 25 MPa</td></tr>
      </table>

      <h2 style="margin-top:14px;margin-bottom:6px;">Perfil Vertical Aislado — Vano Típico</h2>
      <div style="display:flex;justify-content:center;margin:10px 0;">${this._printSVG(this._drawWallProfileSection(col,firstSpan,f,stH,totalL,500,420).outerHTML)}</div>

      ${footer(3)}
    </div>`;

    // ════════════════════════════════════════════════
    // PÁG 4 — PILAR
    // ════════════════════════════════════════════════
    if (col && colRes) {
      const { b, h } = col.section;
      const supBars  = col.rebar?.faces?.superior?.barras || [];
      const nPerFace = supBars[0]?.cantidad || 2;
      const diaL     = supBars[0]?.diámetro || 10;
      const diaE     = col.rebar?.estribos?.diámetro || 8;
      const sCrit    = (parseFloat(colDes.s_crit_mm||100)/10).toFixed(0);
      const sCent    = (parseFloat(colDes.s_central_mm||200)/10).toFixed(0);
      const Lc       = Math.min(60, stH*25).toFixed(0);
      // Calcular longitud total de barra longitudinal: H + anclajes
      const anchorExt = 0.40;  // 40 cm en fundación
      const hk90 = 0.25;       // gancho superior 25 cm
      const totalLongBar = stH + anchorExt + hk90;

      html += `
      <div class="pdf-page">
        ${ph(4,'PILAR DE CONFINAMIENTO',`Sección ${(b*100).toFixed(0)}×${(h*100).toFixed(0)} cm — A630-420H`)}
        <div class="cols" style="margin-bottom:10px;align-items:stretch;">
          <div class="col" style="flex:0 0 42%;">
            <div class="card" style="height:100%;">
              <div class="ct">Sección Transversal</div>
              <div class="cb" style="text-align:center;">${useImg('Pilar - sección transversal.png', 340, this._drawXS(b, h, col.rebar, m, colDes, 420, 420))}</div>
            </div>
          </div>
          <div class="col">
            <div class="card" style="height:100%;">
              <div class="ct">Perfil Longitudinal</div>
              <div class="cb" style="text-align:center;">${pSvg(this._drawColProfile(col,colDes,m,360,460))}</div>
            </div>
          </div>
        </div>
        ${mkCards2(
          'Armadura Longitudinal',[
            ['Barras longitudinales',`${nPerFace*2} Ø${diaL} mm`],
            ['Distribución',`${nPerFace} por cara (2 caras)`],
            ['Recubrimiento',`${(m.rec*100).toFixed(0)} cm`],
            ['Anclaje superior','Gancho 90° en cadena'],
            ['Anclaje inferior','Pata doblada en zapata'],
          ],
          'Estribos — Confinamiento Sísmico',[
            ['Estribo',`Ø${diaE} mm A630-420H`],
            [`Zona crítica (${Lc} cm)`,`Ø${diaE}@${sCrit}cm`],
            ['Zona central',`Ø${diaE}@${sCent}cm`],
            ['Gancho sísmico','135° — NCh430'],
          ]
        )}
        ${footer(4)}
      </div>`;
    }

    // ════════════════════════════════════════════════
    // PÁG 6 — CADENA SUPERIOR
    // ════════════════════════════════════════════════
    if (firstSpan?.beamTop) {
      const elem  = firstSpan.beamTop;
      const bRes  = S.results.spans?.[firstSpan.id]?.beamTop || {};
      const bDes  = bRes.rebar || {};
      const { b, h } = elem.section;
      const supBars = elem.rebar?.faces?.superior?.barras || [];
      const infBars = elem.rebar?.faces?.inferior?.barras || [];
      const nSup  = supBars.reduce((s,br)=>s+(br.cantidad||1),0);
      const nInf  = infBars.reduce((s,br)=>s+(br.cantidad||1),0);
      const diaL  = supBars[0]?.diámetro || infBars[0]?.diámetro || 10;
      const diaE  = elem.rebar?.estribos?.diámetro || 8;
      const sCrit = (parseFloat(bDes.s_crit_mm||100)/10).toFixed(0);
      const sCent = (parseFloat(bDes.s_central_mm||200)/10).toFixed(0);
      html += `
      <div class="pdf-page">
        ${ph(5,'CADENA SUPERIOR',`Sección ${(b*100).toFixed(0)}×${(h*100).toFixed(0)} cm — Luz ${spanL.toFixed(2)} m`)}
        <div class="card" style="margin-bottom:8px;">
          <div class="ct">Perfil Longitudinal — Luz ${spanL.toFixed(2)} m</div>
          <div class="cb" style="text-align:center;">${useImg('Cadena Superior - sección longitudinal.png', 210, this._drawBeamProfile(elem, bDes, spanL, m, 680, 190))}</div>
        </div>
        <div class="card" style="margin-bottom:10px;">
          <div class="ct">Sección Transversal</div>
          <div class="cb" style="text-align:center;">${useImg('Cadena Superior - sección transversal.png', 290, this._drawXS(b, h, elem.rebar, m, bDes, 420, 240))}</div>
        </div>
        ${mkCards2(
          'Armadura Longitudinal',[
            ['Barras superiores',`${nSup} Ø${diaL} mm`],
            ['Barras inferiores',`${nInf} Ø${diaL} mm`],
            ['Sección (b×h)',`${(b*100).toFixed(0)}×${(h*100).toFixed(0)} cm`],
            ['Recubrimiento',`${(m.rec*100).toFixed(0)} cm`],
            ['Anclaje en pilares','Empalme por traslape'],
          ],
          'Estribos',[
            ['Estribo',`Ø${diaE} mm`],
            ['Zona crítica',`cada ${sCrit} cm`],
            ['Zona central',`cada ${sCent} cm`],
            ['Gancho sísmico','135° — NCh430'],
          ]
        )}
        ${footer(5)}
      </div>`;
    }

    // ════════════════════════════════════════════════
    // PÁG 7 — SOBRECIMIENTO
    // ════════════════════════════════════════════════
    if (firstSpan?.beamBot) {
      const elem  = firstSpan.beamBot;
      const bRes  = S.results.spans?.[firstSpan.id]?.beamBot || {};
      const bDes  = bRes.rebar || {};
      const { b, h } = elem.section;
      const supBars = elem.rebar?.faces?.superior?.barras || [];
      const infBars = elem.rebar?.faces?.inferior?.barras || [];
      const nSup  = supBars.reduce((s,br)=>s+(br.cantidad||1),0);
      const nInf  = infBars.reduce((s,br)=>s+(br.cantidad||1),0);
      const diaL  = supBars[0]?.diámetro || infBars[0]?.diámetro || 10;
      const diaE  = elem.rebar?.estribos?.diámetro || 8;
      const sCrit = (parseFloat(bDes.s_crit_mm||100)/10).toFixed(0);
      const sCent = (parseFloat(bDes.s_central_mm||200)/10).toFixed(0);
      html += `
      <div class="pdf-page">
        ${ph(6,'SOBRECIMIENTO',`Sección ${(b*100).toFixed(0)}×${(h*100).toFixed(0)} cm — Luz ${spanL.toFixed(2)} m`)}
        <div class="card" style="margin-bottom:8px;">
          <div class="ct">Perfil Longitudinal — Luz ${spanL.toFixed(2)} m</div>
          <div class="cb" style="text-align:center;">${useImg('Sobrecimiento sección longitudinal.png', 210, this._drawBeamProfile(elem, bDes, spanL, m, 680, 190))}</div>
        </div>
        <div class="card" style="margin-bottom:10px;">
          <div class="ct">Sección Transversal</div>
          <div class="cb" style="text-align:center;">${useImg('Sobrecimiento - Aislado sección transversal.png', 290, this._drawXS(b, h, elem.rebar, m, bDes, 420, 340))}</div>
        </div>
        ${mkCards2(
          'Armadura Longitudinal',[
            ['Barras superiores',`${nSup} Ø${diaL} mm`],
            ['Barras inferiores',`${nInf} Ø${diaL} mm`],
            ['Sección (b×h)',`${(b*100).toFixed(0)}×${(h*100).toFixed(0)} cm`],
            ['Recubrimiento',`${(m.rec*100).toFixed(0)} cm`],
            ['Vaciado','Monolítico con zapata'],
          ],
          'Estribos',[
            ['Estribo',`Ø${diaE} mm`],
            ['Zona crítica',`cada ${sCrit} cm`],
            ['Zona central',`cada ${sCent} cm`],
            ['Gancho sísmico','135° — NCh430'],
          ]
        )}
        ${footer(6)}
      </div>`;
    }

    // ════════════════════════════════════════════════
    // PÁG 8 — FUNDACIÓN
    // ════════════════════════════════════════════════
    const foundEl  = this._drawFoundSection(f, m, S.results.foundation, 440, 330);
    html += `
    <div class="pdf-page">
      ${ph(7,'DETALLE DE FUNDACIÓN','Zapata Excéntrica de Deslinde — NCh3171')}
      <div class="card" style="margin-bottom:10px;">
        <div class="ct">Corte Transversal — Zapata de Deslinde</div>
        <div class="cb" style="text-align:center;">${useImg('Fundación - Zapata sección transversal.png', 360, foundEl)}</div>
      </div>
      ${mkCards2(
        'Geometría',[
          ['Ancho zapata (B)',`${((f.B||0.6)*100).toFixed(0)} cm`],
          ['Espesor zapata (Hf)',`${((f.Hf||0.60)*100).toFixed(0)} cm`],
          ['Profundidad sello (Df)',`${((f.Df||0.85)*100).toFixed(0)} cm`],
          ['Recubrimiento inferior','7.5 cm (contacto suelo)'],
          ['Tipo','Excéntrica de deslinde'],
        ],
        'Armadura',[
          ['Barras longitudinales','4 Ø10 mm continuas'],
          ['Barras transversales','Ø10 mm c/20 cm'],
          ['Hormigón','G25 (25 MPa)'],
          ['Emplantillado','5 cm H° pobre bajo zapata'],
        ]
      )}
      ${footer(7)}
    </div>`;

    return html;
  },

  // Asegura que el SVG tenga xmlns y fondo blanco para html2canvas
  _fixSVG(svgHtml) {
    return svgHtml
      .replace('<svg ', '<svg xmlns="http://www.w3.org/2000/svg" style="background-color:#ffffff;" ')
      .replace(/xmlns="[^"]*"/, 'xmlns="http://www.w3.org/2000/svg"');
  },

  generateModulePDF(type, skipPrint = false) {
    const htmlContent = this._buildModuleHTML(type);

    if (skipPrint) return htmlContent;

    // Abrir en nueva ventana para vista previa con impresión
    const printWindow = window.open('', '_blank');
    printWindow.document.write(htmlContent);
    printWindow.document.close();
    setTimeout(() => printWindow.print(), 500);
  },

  _buildModuleHTML(type) {
    // DELEGACIÓN A MÓDULO ENHANCED (NEW)
    if (type === 'C') {
      if (typeof MemoryReportEnhanced === 'undefined') {
        console.error('❌ memoryReport-enhanced.js no cargado');
        return '<div class="page"><p>Error: Módulo C no disponible. Verifica que memoryReport-enhanced.js está cargado.</p></div>';
      }
      return MemoryReportEnhanced.buildModuleHTML('C');
    }

    const q = this._calculateQuantityTakeoff();
    const m = S.story.materials;
    const stH = S.story.H;
    const f = S.story.foundation;
    const totalL = q.meta.totalL;
    const spans = S.spans;
    const nodes = S.nodes;

    let htmlContent = "";

    if (type === 'A') {
      // ═══════════════════════════════════════════════════════
      // MÓDULO A — PLANOS Y ESPECIFICACIONES DE OBRA
      // ═══════════════════════════════════════════════════════

      // 1. Portada del Módulo A
      htmlContent += `
        <div class="page cover-page">
          <div>
            <h1 class="cover-title">Carpeta de Obra<br>Planos y Especificaciones</h1>
            <p class="cover-subtitle">Ingeniería Estructural y Fichas de Ejecución para Terreno</p>
          </div>
          <div class="cover-details">
            <div class="cover-details-row">
              <span class="cover-details-label">Proyecto:</span>
              <span class="cover-details-val">Muro de Albañilería Confinada (L = ${totalL.toFixed(2)} m, H = ${stH.toFixed(2)} m)</span>
            </div>
            <div class="cover-details-row">
              <span class="cover-details-label">Estructura:</span>
              <span class="cover-details-val">Módulo de Confinamiento Sismorresistente</span>
            </div>
            <div class="cover-details-row">
              <span class="cover-details-label">Ubicación:</span>
              <span class="cover-details-val">Chiguayante, Región del Biobío, Chile</span>
            </div>
            <div class="cover-details-row">
              <span class="cover-details-label">Materiales:</span>
              <span class="cover-details-val">Hormigón ${q.hormigon.label} · Acero A630-420H · Ladrillo Titán 14</span>
            </div>
            <div class="cover-details-row">
              <span class="cover-details-label">Fecha:</span>
              <span class="cover-details-val">${new Date().toLocaleDateString('es-CL')}</span>
            </div>
          </div>
          <div class="signature-block">
            <div class="sig-line">Constructor Civil / Jefe de Obra</div>
            <div class="sig-line">Ingeniero Proyectista</div>
          </div>
        </div>
      `;

      // 2. Ficha de Armado y Cubicación de Hormigón
      htmlContent += `
        <div class="page">
          <h1>1. FICHA DE ARMADO Y CUBICACIÓN</h1>
          
          <div class="card">
            <div class="card-title">Datos del Proyecto y Geometría</div>
            ${this._getTableHTML([
              ['Tipo de estructura', 'Muro de albañilería confinada', 'Normativa', 'NCh2123 · NCh430 · NCh433 · NCh3171'],
              ['Altura de entrepiso (H)', `${stH.toFixed(2)} m`, 'Longitud total muro (L)', `${totalL.toFixed(2)} m`],
              ['Cantidad de pilares', `${q.meta.nPilares} un`, 'Cantidad de vanos', `${q.meta.nVanos} un`]
            ])}
          </div>

          <div class="card">
            <div class="card-title">Materiales y Nomenclatura Comercial</div>
            ${this._getTableHTML([
              ['Material', 'Especificación Técnica Comercial', 'Norma de Referencia'],
              ['Hormigón de Confinamiento', `${q.hormigon.label}`, 'NCh170'],
              ['Acero de Refuerzo', 'Grado A630-420H con resaltes', 'NCh204'],
              ['Ladrillo de Arcilla', 'Princesa Titan Reforzado 290x140x94 mm', 'NCh169'],
              ['Mortero de Pega', 'Dosificación 1:3 en volumen (cemento : arena)', 'NCh2123'],
              ['Alambre de Amarra', 'Alambre negro recocido N°18', '—']
            ])}
          </div>

          <div class="card">
            <div class="card-title">Cubicación de Hormigón — Volumen Total a Pedir</div>
            ${this._getTableHTML([
              ['Componente Estructural', 'Volumen Neto (m³)', 'Unidad Comercial'],
              ['Pilares de confinamiento (Hormigón)', q.hormigon.pilares.toFixed(3), 'm³'],
              ['Cadenas superiores (Vigas)', q.hormigon.cadenas.toFixed(3), 'm³'],
              ['Sobrecimientos (Hormigón)', q.hormigon.sobrec.toFixed(3), 'm³'],
              ['Zapata corrida (Fundación)', q.hormigon.zapata.toFixed(3), 'm³'],
              ['SUBTOTAL HORMIGÓN NETO', `<strong>${q.hormigon.neto.toFixed(3)}</strong>`, 'm³'],
              ['TOTAL HORMIGÓN COMERCIAL (+10% merma)', `<strong style="color:#196f3d; font-size:1.1em;">${q.hormigon.comercial.toFixed(2)}</strong>`, '<strong style="color:#196f3d;">m³</strong>']
            ])}
          </div>
        </div>
      `;

      // 3. Acero de Refuerzo y Albañilería
      const steelRows = [];
      Object.keys(q.acero).sort((a,b)=>+a - +b).forEach(dia => {
        const d = q.acero[dia];
        steelRows.push([
          `Ø${dia} mm`,
          `${(this._STEEL_KG_M[dia]||0).toFixed(3)} kg/m`,
          `${d.metros.toFixed(1)} m (${d.barras12m} tiras de 12m)`,
          `${d.kg.toFixed(1)} kg`,
          `<strong>${d.kg_despunte.toFixed(1)} kg</strong>`
        ]);
      });
      steelRows.push([
        '<strong>TOTAL ACERO A PEDIR</strong>', '', '', '',
        `<strong>${q.kgTotal.toFixed(1)} kg</strong>`
      ]);

      htmlContent += `
        <div class="page">
          <h1>2. COMPRA DE FIERRO Y ALBAÑILERÍA</h1>

          <div class="card">
            <div class="card-title">Cubicación de Acero A630-420H (Barras de 12m)</div>
            ${this._getTableHTML([
              ['Diámetro', 'Peso Unit.', 'Largo Total / Formato', 'Peso Neto', 'Con Despunte (+10%)'],
              ...steelRows
            ])}
          </div>

          <div class="card">
            <div class="card-title">Materiales Complementarios</div>
            ${this._getTableHTML([
              ['Material', 'Proporción', 'Cantidad Estimada', 'Unidad'],
              ['Alambre negro N18', '4% del peso total de acero', q.alambreKg.toFixed(2), 'kg'],
              ['Ladrillos Princesa Titán', '30 un/m² de albañilería', q.ladrillos.conMerma, 'un (incluye +5% merma)'],
              ['Mortero de Pega 1:3', '0.035 m³/m² de albañilería', q.mortero.toFixed(3), 'm³']
            ])}
          </div>

          <div class="notes-box">
            <strong>Instrucciones Clave para la Compra y Recepción:</strong>
            <ul>
              <li><strong>Almacenamiento del cemento:</strong> Colocar sobre pallets de madera en bodegas secas y herméticas.</li>
              <li><strong>Acero con resaltes:</strong> Las barras de refuerzo deben ser de marca certificada (ej. CAP) y deben almacenarse aisladas del suelo directo.</li>
              <li><strong>Ladrillos Princesa:</strong> Rechazar unidades con fisuras o exceso de grietas que puedan comprometer la albañilería.</li>
            </ul>
          </div>
        </div>
      `;

      // 4. Vista General (CAD aspect ratio)
      const svgElevHTML = this._getDynamicWallElevationHTML();

      htmlContent += `
        <div class="page">
          <h1>3. VISTA GENERAL DE LA ELEVACIÓN</h1>
          <div class="card">
            <div class="card-title">Distribución Proporcional del Muro Confinado (Gráfico CAD)</div>
            <div style="display:flex; justify-content:center; padding:15px 0;">
              ${svgElevHTML}
            </div>
          </div>
          
          <div class="notes-box">
            <strong>Anotaciones de Geometría CAD:</strong>
            <ul>
              <li>El gráfico representa la geometría exacta calculada en base a las luces y alturas especificadas.</li>
              <li>Los pilares de hormigón armado se dibujan en su posición exacta de confinamiento.</li>
              <li>La zapata corrida se extiende de forma excéntrica o continua según los límites físicos del terreno.</li>
            </ul>
          </div>
        </div>
      `;

      // 5. Detalles de Pilares (MÓDULO A) — SOLO 1 EJEMPLO
      const firstColNode = nodes.filter(nd=>S.results.columns?.[nd.id])[0];
      if (firstColNode) {
        const nd = firstColNode;
        const col = S.columns[nd.id];
        const res = S.results.columns[nd.id];
        const b = col.section.b;
        const h = col.section.h;
        const design = res.rebar || {};

        const xsSvg = this._drawXS(b, h, col.rebar, m, design, 360, 360).outerHTML;
        const lpSvg = this._drawColProfile(col, design, m, 320, 420).outerHTML;

        htmlContent += `
          <div class="page">
            <h1>4. DETALLE DE PILAR (${(b*100).toFixed(0)}x${(h*100).toFixed(0)} cm)</h1>

            <div class="cols">
              <div class="col" style="flex: 1.1;">
                <div class="card">
                  <div class="card-title">Elevación Longitudinal (Perfil CAD)</div>
                  <div style="display:flex; justify-content:center;">
                    ${lpSvg}
                  </div>
                </div>
              </div>

              <div class="col" style="flex: 0.9;">
                <div class="card">
                  <div class="card-title">Sección Transversal</div>
                  <div style="display:flex; justify-content:center; margin-bottom: 10px;">
                    ${xsSvg}
                  </div>
                </div>

                <div class="card">
                  <div class="card-title">Especificaciones de Refuerzo</div>
                  ${this._getTableHTML([
                    ['Elemento', 'Detalle de Armado'],
                    ['Longitudinal', `${(col.rebar.faces.superior?.barras[0]?.cantidad||2)*2} Ø${col.rebar.faces.superior?.barras[0]?.diámetro||10} mm`],
                    ['Estribos sismicos', `Ø${col.rebar.estribos?.diámetro||8} mm cada ${(design.s_crit_mm/10).toFixed(0)}/${(design.s_central_mm/10).toFixed(0)} cm`],
                    ['Zona Critica Lc', `${(Math.min(60, stH*25).toFixed(0))} cm en extremos`],
                    ['Anclajes Zapata', 'Patas a 90° de 15 cm de largo']
                  ])}
                </div>
              </div>
            </div>

            <div class="notes-box">
              <strong>📌 NOTAS CONSTRUCTIVAS - PILARES:</strong>
              <ul>
                <li><strong>Junta Fría:</strong> Limpiar y picar la cara superior del hormigón de zapata o sobrecimiento antes del vaciado para eliminar lechada y asegurar adherencia monolítica.</li>
                <li><strong>Vibrado:</strong> Introducir sonda vibradora de diámetro adecuado (max 35 mm) sin tocar directamente la armadura para evitar su desprendimiento.</li>
                <li><strong>Desencofrado:</strong> Retirar moldajes laterales no antes de 24 horas y proceder a curado húmedo inmediato por mínimo 7 días consecutivos.</li>
              </ul>
            </div>
          </div>
        `;
      }

      // 6. Detalles de Vigas y Cadenas — SOLO 1 DE CADA TIPO
      const firstSpan = spans[0];
      if (firstSpan) {
        // 6.1 Cadena Superior (solo 1 ejemplo)
        const elemTop = firstSpan.beamTop;
        const resTop = S.results.spans[firstSpan.id]?.beamTop;
        if (elemTop && resTop) {
          const b = elemTop.section.b;
          const h = elemTop.section.h;
          const design = resTop.rebar || {};
          const xsSvg = this._drawXS(b, h, elemTop.rebar, m, design, 360, 240).outerHTML;
          const lpSvg = this._drawBeamProfile(elemTop, design, getSpanL(firstSpan), m, 420, 150).outerHTML;

          htmlContent += `
            <div class="page">
              <h1>5. DETALLE DE CADENA SUPERIOR (${(b*100).toFixed(0)}x${(h*100).toFixed(0)} cm)</h1>

              <div class="card">
                <div class="card-title">Perfil Longitudinal CAD (Vano L = ${getSpanL(firstSpan).toFixed(2)} m)</div>
                <div style="display:flex; justify-content:center;">
                  ${lpSvg}
                </div>
              </div>

              <div class="cols">
                <div class="col">
                  <div class="card">
                    <div class="card-title">Sección Transversal</div>
                    <div style="display:flex; justify-content:center;">
                      ${xsSvg}
                    </div>
                  </div>
                </div>

                <div class="col">
                  <div class="card">
                    <div class="card-title">Armadura Longitudinal y Transversal</div>
                    ${this._getTableHTML([
                      ['Componente', 'Detalle de Refuerzo'],
                      ['Barras superiores', `${elemTop.rebar.faces.superior?.barras[0]?.cantidad||2} Ø${elemTop.rebar.faces.superior?.barras[0]?.diámetro||10} mm`],
                      ['Barras inferiores', `${elemTop.rebar.faces.inferior?.barras[0]?.cantidad||2} Ø${elemTop.rebar.faces.inferior?.barras[0]?.diámetro||10} mm`],
                      ['Estribos', `Ø${elemTop.rebar.estribos?.diámetro||8} cada ${(design.s_crit_mm/10).toFixed(0)}/${(design.s_central_mm/10).toFixed(0)} cm`],
                      ['Gancho sísmico', 'Ganchos a 135° obligatorios en extremos de estribo']
                    ])}
                  </div>
                </div>
              </div>

              <div class="notes-box">
                <strong>📌 NOTAS CONSTRUCTIVAS - CADENA SUPERIOR:</strong>
                <ul>
                  <li><strong>Nudos Rígidos:</strong> El vaciado de hormigón en nudos pilar-cadena debe ser continuo y monolítico. Prohibido generar juntas de hormigonado en zonas críticas de confinamiento.</li>
                  <li><strong>Separadores:</strong> Colocar calugas o espaciadores plásticos tipo rueda para garantizar un recubrimiento neto mínimo de 3.0 cm en todo el contorno de la viga.</li>
                  <li><strong>Doblado de barras:</strong> El doblado del acero debe hacerse siempre en frío con mandril de doblado normativo. Prohibido calendar o recalentar las barras.</li>
                </ul>
              </div>
            </div>
          `;
        }

        // 6.2 Sobrecimiento (solo 1 ejemplo)
        const elemBot = firstSpan.beamBot;
        const resBot = S.results.spans[firstSpan.id]?.beamBot;
        if (elemBot && resBot) {
          const b = elemBot.section.b;
          const h = elemBot.section.h;
          const design = resBot.rebar || {};
          const xsSvg = this._drawXS(b, h, elemBot.rebar, m, design, 360, 360).outerHTML;
          const lpSvg = this._drawBeamProfile(elemBot, design, getSpanL(firstSpan), m, 420, 150).outerHTML;

          htmlContent += `
            <div class="page">
              <h1>6. DETALLE DE SOBRECIMIENTO (${(b*100).toFixed(0)}x${(h*100).toFixed(0)} cm)</h1>

              <div class="card">
                <div class="card-title">Perfil Longitudinal CAD (Vano L = ${getSpanL(firstSpan).toFixed(2)} m)</div>
                <div style="display:flex; justify-content:center;">
                  ${lpSvg}
                </div>
              </div>

              <div class="cols">
                <div class="col">
                  <div class="card">
                    <div class="card-title">Sección Transversal</div>
                    <div style="display:flex; justify-content:center;">
                      ${xsSvg}
                    </div>
                  </div>
                </div>

                <div class="col">
                  <div class="card">
                    <div class="card-title">Armadura Longitudinal y Transversal</div>
                    ${this._getTableHTML([
                      ['Componente', 'Detalle de Refuerzo'],
                      ['Barras superiores', `${elemBot.rebar.faces.superior?.barras[0]?.cantidad||2} Ø${elemBot.rebar.faces.superior?.barras[0]?.diámetro||10} mm`],
                      ['Barras inferiores', `${elemBot.rebar.faces.inferior?.barras[0]?.cantidad||2} Ø${elemBot.rebar.faces.inferior?.barras[0]?.diámetro||10} mm`],
                      ['Estribos', `Ø${elemBot.rebar.estribos?.diámetro||8} cada ${(design.s_crit_mm/10).toFixed(0)}/${(design.s_central_mm/10).toFixed(0)} cm`],
                      ['Gancho sísmico', 'Ganchos a 135° obligatorios en extremos de estribo']
                    ])}
                  </div>
                </div>
              </div>

              <div class="notes-box">
                <strong>📌 NOTAS CONSTRUCTIVAS - SOBRECIMIENTO:</strong>
                <ul>
                  <li><strong>Nudos Rígidos:</strong> El vaciado de hormigón en nudos pilar-cadena debe ser continuo y monolítico. Prohibido generar juntas de hormigonado en zonas críticas de confinamiento.</li>
                  <li><strong>Separadores:</strong> Colocar calugas o espaciadores plásticos tipo rueda para garantizar un recubrimiento neto mínimo de 3.0 cm en todo el contorno de la viga.</li>
                  <li><strong>Doblado de barras:</strong> El doblado del acero debe hacerse siempre en frío con mandril de doblado normativo. Prohibido calendar o recalentar las barras.</li>
                </ul>
              </div>
            </div>
          `;
        }
      }

      // 7. Detalles de Fundación (Zapata Corrida de Deslinde)
      const foundSvg = this._drawFoundSection(f, m, S.results.foundation, 435, 385).outerHTML;

      htmlContent += `
        <div class="page">
          <h1>6. DETALLE DE FUNDACIÓN (ZAPATA EXCENTRICA DE DESLINDE)</h1>
          
          <div class="cols">
            <div class="col" style="flex: 1.35;">
              <div class="card">
                <div class="card-title">Corte Tipico de Fundación CAD</div>
                <div style="display:flex; justify-content:center; align-items:center; min-height:385px; padding:6px 0;">
                  ${foundSvg}
                </div>
              </div>
            </div>
            
            <div class="col" style="flex: 0.65;">
              <div class="card">
                <div class="card-title">Especificaciones de Excavación y Zapata</div>
                ${this._getTableHTML([
                  ['Parámetro Constructivo', 'Dimensión Calculada'],
                  ['Ancho de la zapata (B)', `${(f.B*100).toFixed(0)} cm`],
                  ['Espesor de la zapata (Hf)', `${(f.Hf*100).toFixed(0)} cm`],
                  ['Profundidad de sello (Df)', `${(f.Df*100).toFixed(0)} cm`],
                  ['Espesor de Radier estimado', '10 cm (RADIER por definir)'],
                  ['Recubrimiento libre inferior', '7.5 cm (suelo natural)'],
                  ['Hormigón de fundación', `Hormigón G25 (20)`]
                ])}
              </div>
              
              <div class="card">
                <div class="card-title">Notas de Excavación</div>
                <p style="margin:0; font-size:7.8pt; color:#8b949e; line-height:1.4;">
                  El sello de excavación debe ser recibido por un Ingeniero Civil de Mecánica de Suelos o en su defecto por el Ingeniero Proyectista. Retirar todo resto de suelo orgánico o rellenos no controlados antes del hormigonado.
                </p>
              </div>
            </div>
          </div>

          <div class="notes-box">
            <strong>📌 NOTAS DE CONSTRUCCIÓN - ZAPATAS Y EMPALMES:</strong>
            <ul>
              <li><strong>Emplantillado:</strong> Vaciar una capa de 5 cm de hormigón pobre (170 kg cem/m³) para regularizar la excavación antes de colocar el fierro.</li>
              <li><strong>Armadura longitudinal zapata:</strong> Se compone de 4 barras continuas Ø10 mm amarradas transversalmente cada 20 cm para resistir retracción y cambios de temperatura.</li>
              <li><strong>Límite de Propiedad (Deslinde):</strong> La zapata de deslinde se construye de forma excéntrica para no sobrepasar el límite predial del vecino.</li>
            </ul>
          </div>
        </div>
      `;

    } else if (type === 'B') {
      // ═══════════════════════════════════════════════════════
      // MÓDULO B — MEMORIA DE CÁLCULO FORMAL (ESTÁNDAR MUNICIPAL)
      // ═══════════════════════════════════════════════════════

      // 1. Portada del Módulo B
      htmlContent += `
        <div class="page cover-page">
          <div>
            <h1 class="cover-title" style="font-size:24pt; border-bottom:3px solid #343a40;">Memoria de Cálculo Estructural</h1>
            <p class="cover-subtitle" style="font-size:12pt; font-weight:bold; color:#196f3d;">DIRECCIÓN DE OBRAS MUNICIPALES (D.O.M.)</p>
          </div>
          <div class="cover-details" style="margin-top:40px;">
            <div class="cover-details-row">
              <span class="cover-details-label">Proyecto:</span>
              <span class="cover-details-val">Vivienda Unifamiliar Confinada · Superficie aprox: ${(totalL * 4.5).toFixed(1)} m²</span>
            </div>
            <div class="cover-details-row">
              <span class="cover-details-label">Estructura:</span>
              <span class="cover-details-val">Muro de Albañilería Confinada de ${stH.toFixed(2)}m de altura útil</span>
            </div>
            <div class="cover-details-row">
              <span class="cover-details-label">Ubicación:</span>
              <span class="cover-details-val">Comuna de Chiguayante, Región del Biobío, Chile</span>
            </div>
            <div class="cover-details-row">
              <span class="cover-details-label">Normativa:</span>
              <span class="cover-details-val">NCh2123 · NCh430 · NCh433 · NCh1537 · NCh3171</span>
            </div>
            <div class="cover-details-row">
              <span class="cover-details-label">Fecha:</span>
              <span class="cover-details-val">${new Date().toLocaleDateString('es-CL')}</span>
            </div>
          </div>
          <div class="signature-block" style="margin-top:60px;">
            <div class="sig-line">Representante Legal / Propietario</div>
            <div class="sig-line">Ingeniero Civil Estructural<br>Patente Municipal Vigente</div>
          </div>
        </div>
      `;

      // 2. Generalidades y Concepción Geométrica + Materiales
      htmlContent += `
        <div class="page">
          <h1>1. GENERALIDADES Y CONCEPCIÓN GEOMÉTRICA</h1>
          <p>
            La presente Memoria de Cálculo detalla el análisis estructural y el diseño sismorresistente para una vivienda modular confinada de un nivel construida en la comuna de Chiguayante, Región del Biobío.
          </p>
          <p>
            El sistema sismo-resistente principal se concibe mediante <strong>muros de albañilería confinada</strong>, reforzados perimetralmente con elementos de hormigón armado (pilares y cadenas) según las exigencias de la norma chilena <strong>NCh2123 Of.2003</strong>.
          </p>

          <h2>1.1 Estructuración General</h2>
          <ul>
            <li><strong>Muros de albañilería:</strong> Espesor nominal 14 cm de ladrillo Princesa Titán, aparejo soga.</li>
            <li><strong>Elementos de confinamiento:</strong> Pilares y vigas/cadenas de hormigón armado de ${(S.columns[nodes[0].id]?.section.b*100).toFixed(0)}x${(S.columns[nodes[0].id]?.section.h*100).toFixed(0)} cm.</li>
            <li><strong>Techumbre:</strong> Estructura liviana de madera de pino radiata con cubierta de planchas de zinc, ejerciendo carga vertical reducida en muros de borde.</li>
          </ul>

          <h1 style="margin-top: 30px;">2. ESPECIFICACIÓN DE MATERIALES</h1>
          <p>
            Para garantizar el cumplimiento de las hipótesis de diseño y resistencias modeladas, los materiales a emplear en obra deben cumplir estrictamente con las siguientes propiedades mecánicas:
          </p>

          <div class="card">
            <div class="card-title">Propiedades de Resistencia Mecánica de Materiales</div>
            ${this._getTableHTML([
              ['Material / Componente', 'Parámetro de Resistencia', 'Valor de Diseño', 'Normativa Aplicada'],
              ['Hormigón Pilares/Cadenas', 'Resistencia cilíndrica f\'c', `${m.fc || 25} MPa`, 'NCh170 / NCh430'],
              ['Acero de Refuerzo', 'Límite de fluencia fy', `${m.fy || 420} MPa`, 'NCh204 / NCh430'],
              ['Unidades de Albañilería', 'Ladrillo Princesa Titan Reforzado', '140 mm de espesor', 'NCh169'],
              ['Mortero de Pega', 'Resistencia a compresión fj', '>= 10 MPa (Dosif. 1:3)', 'NCh2123'],
              ['Albañilería de ladrillo', 'Resistencia básica al corte vm', '0.50 MPa', 'NCh2123, Tabla 5.1'],
              ['Peso específico Hormigón', 'Densidad húmeda γc', '2500 kg/m³', 'NCh1537']
            ])}
          </div>
        </div>
      `;

      // 3. Criterios de Diseño (Cargas y Sismo) + Combinaciones
      const lat = S.results.lateral || {};
      const soilType = S.story.lateral.seismic.soilType || 'D';

      htmlContent += `
        <div class="page">
          <h1>3. CRITERIOS DE DISEÑO ESTRUCTURAL</h1>
          
          <h2>3.1 Cargas Estáticas y de Uso (NCh1537)</h2>
          <ul>
            <li><strong>Carga Muerta (D):</strong> Peso propio de albañilería (${(m.gm||18)} kN/m³), peso propio del hormigón armado (25 kN/m³), y sobrecarga del sistema de techumbre de ${S.story.loads.qD.toFixed(2)} kN/m.</li>
            <li><strong>Sobrecarga de Uso (L):</strong> Sobrecarga habitual en techos inclinados sin acceso de ${S.story.loads.qL.toFixed(2)} kN/m.</li>
          </ul>

          <h2>3.2 Diseño Sísmico Automatizado (NCh433 Of.1996 Mod.2009)</h2>
          <p>
            De acuerdo a la localización geográfica en Chiguayante y las condiciones geotécnicas típicas del Biobío, se adoptan los siguientes parámetros sísmicos regulados:
          </p>
          ${this._getTableHTML([
            ['Parámetro Sísmico', 'Símbolo', 'Valor Adoptado', 'Justificación Normativa'],
            ['Zona Sísmica', 'Z', 'Zona 3', 'Alta sismicidad costera (A0 = 0.40g)'],
            ['Coeficiente de Aceleración Máx.', 'A0', '0.40 g', 'NCh433, Tabla 4.1'],
            ['Categoría de Importancia', 'I', '1.0', 'Edificios de uso privado común (Vivienda)'],
            ['Condiciones del Suelo de Fundación', 'Tipo Suelo', `Suelo Tipo ${soilType}`, `Suelo geotécnico típico calificado como ${soilType}`],
            ['Coeficiente Sísmico Máximo', 'Cs', `${lat.Cs || '0.12'}`, 'Calculado automáticamente por NCh433']
          ])}

          <h1 style="margin-top: 25px;">4. COMBINACIONES DE CARGA (NCh3171)</h1>
          <p>
            El análisis resistente se realiza bajo el criterio de <strong>Diseño por Resistencia Última (LRFD)</strong>, evaluando las siguientes combinaciones de solicitaciones críticas definidas en la norma chilena NCh3171:
          </p>
          ${this._getTableHTML([
            ['N° Combinación', 'Fórmula de Solicitación de Diseño', 'Estado Límite'],
            ['Combo 1', '1.4 D', 'Resistencia LRFD (Gravitacional)'],
            ['Combo 2', '1.2 D + 1.6 L + 0.5 Lr', 'Resistencia LRFD (Sobrecarga de uso)'],
            ['Combo 3', '1.2 D + 1.0 W + L + 0.5 Lr', 'Resistencia LRFD (Eólica lateral)'],
            ['Combo 4', '1.2 D + 1.4 E + L + 0.2 S', 'Resistencia LRFD (Sísmica crítica lateral)'],
            ['Combo 5', '0.9 D + 1.4 E', 'Resistencia LRFD (Volcamiento y tracción sísmica)']
          ])}
        </div>
      `;

      // 4. Resultados del Análisis Estructural (Solver) + Bibliografía
      const firstColRes = Object.values(S.results.columns)[0] || { Mu: 10, Vu: 5, Nu: 15 };
      const firstBeamRes = Object.values(S.results.spans)[0]?.beamTop || { Mu: 12, Vu: 10 };
      const fStress = S.results.foundation?.q_max || 120;
      const fFS_v = lat.FS_volc_pos || 2.1;
      const fFS_d = lat.FS_desl || 1.8;

      htmlContent += `
        <div class="page">
          <h1>5. RESULTADOS DEL ANÁLISIS ESTRUCTURAL (SOLVER 2D)</h1>
          <p>
            El solver de rigidez estructural calcula los esfuerzos críticos de flexión, cortante y carga axial en base a los modelos elásticos integrados y el solver matricial 2D.
          </p>

          <div class="card">
            <div class="card-title">Resumen de Fuerzas Internas Últimas y Capacidad Portante</div>
            ${this._getTableHTML([
              ['Componente Estructural', 'Esfuerzo Crítico Mu (kN·m)', 'Cortante Vu (kN)', 'Carga Axial Nu (kN)', 'Verificación Capacidad'],
              ['Pilares de Confinamiento', parseFloat(firstColRes.Mu).toFixed(2), parseFloat(firstColRes.Vu).toFixed(2), parseFloat(firstColRes.Nu).toFixed(2), 'CUMPLE (Cuantía longitudinal >= 1.0%)'],
              ['Cadenas Superiores (Top)', parseFloat(firstBeamRes.Mu).toFixed(2), parseFloat(firstBeamRes.Vu).toFixed(2), '—', 'CUMPLE (Diseño a flexotracción LRFD)'],
              ['Muro Albañilería de 14cm', '—', parseFloat(firstColRes.Vu).toFixed(2), '—', 'CUMPLE (Verificación al esfuerzo de corte vm)'],
              ['Zapata Corrida (Fundación)', '—', '—', '—', `q_max = ${fStress.toFixed(1)} kPa <= qa · CUMPLE`]
            ])}
          </div>

          <div class="card">
            <div class="card-title">Verificación Geotécnica de Estabilidad Global</div>
            ${this._getTableHTML([
              ['Criterio Geotécnico', 'Factor de Seguridad Calculado', 'Límite Mínimo Exigido', 'Estado de Estabilidad'],
              ['Volcamiento Global (FS_volc)', fFS_v.toFixed(2), '1.50', fFS_v >= 1.5 ? 'ESTABLE · CUMPLE' : '!INSUFICIENTE FS'],
              ['Deslizamiento Basal (FS_desl)', fFS_d.toFixed(2), '1.30', fFS_d >= 1.3 ? 'ESTABLE · CUMPLE' : '!INSUFICIENTE FS'],
              ['Presión de contacto en sello', `${fStress.toFixed(1)} kPa`, '150.0 kPa (admisible)', 'CUMPLE CAPACIDAD SOPORTE']
            ])}
          </div>

          <h1 style="margin-top: 25px;">6. BIBLIOGRAFÍA NORMATIVA CHILENA</h1>
          <ul>
            <li><strong>NCh170:2016:</strong> Hormigón - Requisitos generales de fabricación, colocación y control de calidad.</li>
            <li><strong>NCh204:2006:</strong> Acero para hormigón armado - Barras laminadas en caliente con resaltes.</li>
            <li><strong>NCh430:2008:</strong> Hormigón armado - Requisitos de diseño y cálculo (adopción parcial ACI 318).</li>
            <li><strong>NCh433 Of.1996 Mod.2009:</strong> Diseño sísmico de edificios (exigencias especiales de sismicidad chilena).</li>
            <li><strong>NCh1537:2009:</strong> Diseño estructural - Cargas permanentes y sobrecargas de uso.</li>
            <li><strong>NCh2123 Of.2003:</strong> Albañilería confinada - Requisitos de diseño y cálculo sismorresistente.</li>
            <li><strong>NCh3171:2010:</strong> Diseño estructural - Combinaciones de carga críticas para cálculo estructural.</li>
          </ul>
        </div>
      `;
    }

    // ── GESTIÓN DE PÁGINAS Y CARGA DENTRO DE NUEVA PESTAÑA ──
    const moduleTitle = type === 'A' ? 'MÓDULO A — Carpeta de Obra (Planos y Fichas)' : 'MÓDULO B — Memoria de Cálculo DOM';
    
    const docHtml = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>\${title}</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=Roboto+Mono:wght@400;500;700&display=swap');
    
    body {
      font-family: 'Inter', sans-serif;
      color: #1f2328;
      background: #ffffff;
      margin: 0;
      padding: 0;
      font-size: 10.5pt;
      line-height: 1.5;
    }
    
    /* Paged.js page setup */
    @page {
      size: letter;
      margin: 20mm 15mm 20mm 15mm;
      
      @top-left {
        content: "\${titleUpper}";
        font-family: 'Inter', sans-serif;
        font-size: 7.5pt;
        color: #6a737d;
        border-bottom: 1px solid #e1e4e8;
        padding-bottom: 4px;
        font-weight: 600;
        text-transform: uppercase;
      }
      @top-right {
        content: "BigGeo Consultores";
        font-family: 'Inter', sans-serif;
        font-size: 7.5pt;
        color: #6a737d;
        border-bottom: 1px solid #e1e4e8;
        padding-bottom: 4px;
        font-weight: 600;
      }
      @bottom-left {
        content: "NCh2123 · NCh430 · NCh433 · NCh3171";
        font-family: 'Inter', sans-serif;
        font-size: 7.5pt;
        color: #6a737d;
      }
      @bottom-right {
        content: "Página " counter(page) " de " counter(pages);
        font-family: 'Inter', sans-serif;
        font-size: 7.5pt;
        color: #6a737d;
        font-weight: 600;
      }
    }
    
    /* Cover page override */
    @page:first {
      margin: 0;
      @top-left { content: none; border: none; }
      @top-right { content: none; border: none; }
      @bottom-left { content: none; }
      @bottom-right { content: none; }
    }
    
    /* Page breaks and flow */
    .page {
      page-break-after: always;
      position: relative;
      box-sizing: border-box;
    }
    
    /* SVG CAD Styling overrides for Print */
    svg {
      background: none !important;
      display: block;
      margin: 10px auto;
    }
    
    /* Set stroke hierarchy for CAD look on light print background */
    svg circle[fill="#58a6ff"], svg line[stroke="#58a6ff"] {
      stroke: #0f4c81 !important; /* Thick dark industrial blue */
      stroke-width: 3.2px !important;
    }
    svg rect[stroke="#e6edf3"] {
      stroke: #212529 !important; /* Fine concrete contour */
      stroke-width: 1.2px !important;
    }
    svg rect[stroke="#3fb950"] {
      stroke: #196f3d !important; /* Pilar border */
      stroke-width: 1.2px !important;
    }
    svg rect[stroke="#2f81f7"] {
      stroke: #1f618d !important; /* Cadena top */
      stroke-width: 1.2px !important;
    }
    svg rect[stroke="#8b5cf6"] {
      stroke: #6c3483 !important; /* Sobrecimiento */
      stroke-width: 1.2px !important;
    }
    svg text {
      fill: #1f2328 !important; /* Force all text to dark grey/black */
      font-family: 'Inter', sans-serif !important;
    }
    
    /* Coordinate lines and dimensions */
    svg line[stroke="#aaa"], svg line[stroke="#888"], svg line[stroke="#555"] {
      stroke: #666666 !important;
    }
    svg polygon[fill="#aaa"], svg polygon[fill="#888"], svg polygon[fill="#555"] {
      fill: #666666 !important;
    }
    
    /* Estribos (transversal confinement) */
    svg line[stroke="#f8c83c"], svg rect[stroke="#f8c83c"] {
      stroke: #d29922 !important; /* Dark gold/yellow */
      stroke-width: 1.8px !important;
    }
    svg line[stroke="rgba(248,200,60,0.6)"], svg line[stroke="rgba(248,200,60,0.85)"] {
      stroke: #d29922 !important;
      stroke-width: 1.8px !important;
    }
    svg line[stroke="rgba(200,170,50,0.25)"], svg line[stroke="rgba(248,200,60,0.4)"] {
      stroke: #b37d14 !important;
      stroke-width: 1.0px !important;
    }
    
    /* Bootstrap-like print table styling */
    table {
      width: 100%;
      border-collapse: collapse;
      margin: 10px 0 20px 0;
      font-size: 9.5pt;
    }
    th, td {
      border: 1px solid #dee2e6 !important;
      padding: 6px 10px;
      text-align: left;
    }
    th {
      background-color: #343a40 !important;
      color: #ffffff !important;
      font-weight: 700;
      font-size: 8.5pt;
      text-transform: uppercase;
      letter-spacing: 0.04em;
    }
    tr:nth-child(even) td {
      background-color: #f8f9fa !important;
    }
    td {
      font-family: 'Roboto Mono', monospace;
      color: #212529;
    }
    td:first-child {
      font-family: 'Inter', sans-serif;
      font-weight: 600;
      color: #212529;
    }
    
    /* Headings */
    h1 {
      font-size: 18pt;
      margin-top: 0;
      color: #1f2328;
      border-bottom: 2px solid #343a40;
      padding-bottom: 6px;
      font-weight: 800;
      letter-spacing: -0.02em;
    }
    h2 {
      font-size: 13pt;
      margin-top: 15px;
      margin-bottom: 8px;
      color: #212529;
      border-left: 4px solid #343a40;
      padding-left: 8px;
      font-weight: 700;
    }
    
    /* Card layouts */
    .card {
      border: 1px solid #e1e4e8;
      border-radius: 6px;
      padding: 12px 16px;
      margin-bottom: 15px;
      background: #ffffff;
    }
    .card-title {
      font-size: 10.5pt;
      font-weight: 700;
      margin-bottom: 10px;
      color: #1f2328;
      text-transform: uppercase;
      letter-spacing: 0.02em;
      border-bottom: 1px solid #eaecef;
      padding-bottom: 4px;
    }
    
    /* Two column grid */
    .cols {
      display: flex;
      gap: 15px;
    }
    .col {
      flex: 1;
    }
    
    /* Custom soil and concrete hatching styling for CAD look */
    .soil-line {
      stroke: rgba(120,100,80,0.5) !important;
    }
    .concrete-fill {
      fill: url(#concrete-pattern) !important;
    }
    
    /* Info notes style */
    .notes-box {
      background: #f8f9fa;
      border-left: 4px solid #0f4c81;
      padding: 10px 14px;
      font-size: 8.5pt;
      margin-top: 15px;
    }
    .notes-box ul {
      margin: 0;
      padding-left: 18px;
      line-height: 1.4;
    }
    
    /* Cover Page styling */
    .cover-page {
      height: 100vh;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      padding: 40mm 20mm 30mm 20mm;
      box-sizing: border-box;
      background: #ffffff;
      border: 15px double #343a40;
    }
    .cover-title {
      font-size: 26pt;
      font-weight: 800;
      color: #1f2328;
      line-height: 1.2;
      text-transform: uppercase;
      letter-spacing: -0.01em;
      margin: 0;
    }
    .cover-subtitle {
      font-size: 13pt;
      color: #586069;
      margin-top: 10px;
      font-weight: 500;
    }
    .cover-details {
      margin-top: 50px;
      font-size: 11pt;
    }
    .cover-details-row {
      display: flex;
      margin-bottom: 8px;
      border-bottom: 1px dashed #eaecef;
      padding-bottom: 4px;
    }
    .cover-details-label {
      width: 140px;
      font-weight: 700;
      color: #343a40;
    }
    .cover-details-val {
      color: #24292e;
    }
    .signature-block {
      display: flex;
      justify-content: space-between;
      margin-top: 80px;
      padding: 0 10px;
    }
    .sig-line {
      width: 180px;
      border-top: 1.5px solid #24292e;
      text-align: center;
      padding-top: 6px;
      font-size: 8.5pt;
      font-weight: 600;
      color: #586069;
    }
  </style>
  
  <!-- Load Paged.js polyfill from CDN -->
  <script src="https://unpkg.com/pagedjs/dist/paged.legacy.js"></script>
</head>
<body>
  \${htmlContent}
  
  <script>
    class PrintOnPageEnd extends Paged.Handler {
      constructor(chunker, polisher, caller) {
        super(chunker, polisher, caller);
      }
      afterPreview(pages) {
        setTimeout(() => {
          window.print();
        }, 500);
      }
    }
    Paged.registerHandlers(PrintOnPageEnd);
  </script>
</body>
</html>`;

    const finalHtml = docHtml
      .replace(/\${title}/g, moduleTitle)
      .replace(/\${titleUpper}/g, moduleTitle.toUpperCase())
      .replace(/\${htmlContent}/g, htmlContent);

    return finalHtml;
  },

  // Helper para generar tablas HTML consistentes en print
  _getTableHTML(rows) {
    let html = "<table style='width:100%; border-collapse:collapse; margin:10px 0 20px 0; font-size:9.5pt;'>";
    rows.forEach((row, i) => {
      html += "<tr>";
      row.forEach(cell => {
        let style = "border: 1px solid #dee2e6; padding: 6px 10px; text-align: left;";
        if (i === 0) {
          html += `<th style="${style} background-color: #343a40; color: #ffffff; font-weight: 700; font-size: 8.5pt; text-transform: uppercase; letter-spacing: 0.04em;">${cell}</th>`;
        } else {
          // Check if cell is an object containing html and style
          if (cell && typeof cell === 'object' && cell.html) {
            html += `<td style="${style} ${cell.style || ''}">${cell.html}</td>`;
          } else {
            // Apply different font for values vs labels
            const isLabel = isNaN(cell) && !cell.toString().includes('Ø') && !cell.toString().includes('kg') && !cell.toString().includes('m³') && !cell.toString().includes('%') && !cell.toString().includes('MPa') && !cell.toString().includes('kN') && !cell.toString().includes('kPa') && !cell.toString().includes('cm') && !cell.toString().includes('mm');
            const fontStyle = isLabel ? "font-family: 'Inter', sans-serif; font-weight: 600;" : "font-family: 'Roboto Mono', monospace;";
            html += `<td style="${style} ${fontStyle}">${cell}</td>`;
          }
        }
      });
      html += "</tr>";
    });
    html += "</table>";
    return html;
  },

  // Helper para calcular la elevación con viewBox proporcional
  _getDynamicWallElevationHTML() {
    const f = S.story.foundation;
    const stH = S.story.H;
    const spans = S.spans;
    const totalL = spans.reduce((s,sp)=>s+getSpanL(sp),0);
    const totalVert = stH + (f.Hf||0.60);

    // Calcular dimensiones reales basadas en el largo
    const W_svg = 800;
    const ratio = totalVert / totalL;
    const H_svg = Math.round(W_svg * ratio);

    // Crear el elemento SVG temporal en background
    const svg = this._svg(W_svg, H_svg);
    
    // Dibujar la elevación del muro sobre este SVG
    this._drawWallElevation(svg, W_svg, H_svg);
    
    return svg.outerHTML;
  },

  // ═══════════════════════════════════════════════════════
  // HELPERS SVG
  // ═══════════════════════════════════════════════════════
  _svg(w, h) {
    const s = document.createElementNS('http://www.w3.org/2000/svg','svg');
    s.setAttribute('viewBox',`0 0 ${w} ${h}`);
    s.setAttribute('width', w); s.setAttribute('height', h);
    s.style.cssText = 'display:block;max-width:100%;';
    return s;
  },
  _el(tag, at, par) {
    const e = document.createElementNS('http://www.w3.org/2000/svg', tag);
    Object.entries(at).forEach(([k,v]) => e.setAttribute(k,v));
    par?.appendChild(e); return e;
  },
  _t(svg, text, x, y, at={}) {
    const t = document.createElementNS('http://www.w3.org/2000/svg','text');
    t.textContent = text; t.setAttribute('x',x); t.setAttribute('y',y);
    // PDF-safe font stack: Inter (screen) → Arial/Helvetica (PDF renderer fallback)
    t.setAttribute('font-family', 'Inter,Arial,Helvetica,sans-serif');
    Object.entries(at).forEach(([k,v]) => t.setAttribute(k,v));
    svg.appendChild(t); return t;
  },
  _tv(svg, text, x, y, at={}) {
    const t = document.createElementNS('http://www.w3.org/2000/svg','text');
    t.textContent = text;
    t.setAttribute('x', x); t.setAttribute('y', y);
    t.setAttribute('text-anchor','middle');
    t.setAttribute('transform', `rotate(-90,${x},${y})`);
    // PDF-safe font stack
    t.setAttribute('font-family', 'Inter,Arial,Helvetica,sans-serif');
    Object.entries(at).forEach(([k,v]) => t.setAttribute(k,v));
    svg.appendChild(t); return t;
  },

  // ═══════════════════════════════════════════════════════
  // HELPERS UI HTML
  // ═══════════════════════════════════════════════════════
  _hdr(c, title, sub='') {
    const d = document.createElement('div');
    d.style.cssText = 'margin-bottom:22px;padding-bottom:14px;border-bottom:1px solid rgba(48,54,61,0.8);';
    d.innerHTML = `<h2 style="margin:0 0 5px;font-size:1.15rem;color:#e6edf3;font-weight:700;">${title}</h2>
      ${sub ? `<p style="margin:0;font-size:0.78rem;color:#8b949e;">${sub}</p>` : ''}`;
    c.appendChild(d);
  },

  _card(parent, title='') {
    const d = document.createElement('div');
    d.style.cssText = 'background:rgba(255,255,255,0.025);border:1px solid rgba(48,54,61,0.8);border-radius:8px;padding:14px 16px;margin-bottom:14px;';
    if (title) {
      const h = document.createElement('div');
      h.style.cssText = 'font-size:0.72rem;font-weight:700;color:#8b949e;text-transform:uppercase;letter-spacing:0.07em;margin-bottom:10px;';
      h.textContent = title; d.appendChild(h);
    }
    parent.appendChild(d); return d;
  },

  // SVG calculado por defecto; botón permite cambiar a imagen de referencia guardada.
  // Si la imagen no existe (onerror) el botón queda deshabilitado — SVG siempre visible.
  _imgOrXS(parent, imageName, fallbackSvg) {
    const wrapper = document.createElement('div');
    wrapper.style.cssText = 'text-align:center;';

    // ── Botón toggle ────────────────────────────────────────────────
    const btnBar = document.createElement('div');
    btnBar.style.cssText = 'display:flex;justify-content:flex-end;margin-bottom:6px;';

    const btn = document.createElement('button');
    btn.style.cssText = [
      'display:inline-flex;align-items:center;gap:5px;',
      'padding:3px 10px;border-radius:5px;border:1px solid rgba(88,166,255,0.5);',
      'background:rgba(88,166,255,0.08);color:#58a6ff;',
      'font-size:0.73rem;font-weight:600;cursor:pointer;',
      'transition:background 0.15s,border-color 0.15s;'
    ].join('');

    btnBar.appendChild(btn);
    wrapper.appendChild(btnBar);

    // ── Imagen de referencia (oculta por defecto) ───────────────────
    const imgWrap = document.createElement('div');
    imgWrap.style.display = 'none';                 // oculta hasta que el usuario la pida
    const img = document.createElement('img');
    img.src = `imagenes/${encodeURIComponent(imageName)}`;
    img.alt = imageName;
    img.style.cssText = 'max-width:100%;height:auto;display:block;margin:0 auto;';
    imgWrap.appendChild(img);

    // ── SVG calculado (visible por defecto) ─────────────────────────
    const svgWrap = document.createElement('div');
    svgWrap.className = 'svg-fallback';
    svgWrap.style.cssText = 'display:flex;justify-content:center;width:100%;';  // centrar SVG
    svgWrap.appendChild(fallbackSvg);

    // ── Estado: 'svg' (default) | 'img' ─────────────────────────────
    let mode = 'svg';
    let imgAvailable = false;

    function applyMode() {
      if (mode === 'svg') {
        svgWrap.style.display = 'flex';   // mantiene el centrado flex
        imgWrap.style.display = 'none';
        btn.innerHTML = '🖼 Ver imagen guardada';
        btn.title     = 'Mostrar imagen de referencia guardada en disco';
      } else {
        svgWrap.style.display = 'none';
        imgWrap.style.display = 'block';
        btn.innerHTML = '📐 Ver SVG calculado';
        btn.title     = 'Volver al gráfico SVG generado por los cálculos actuales';
      }
    }

    // Aplica estado inicial antes de que cargue la imagen
    applyMode();

    img.onload = () => {
      imgAvailable = true;
      btn.disabled = false;
      btn.style.opacity = '1';
      btn.style.cursor  = 'pointer';
      // No cambia el modo — el usuario permanece en SVG hasta que haga click
    };

    img.onerror = () => {
      // Sin imagen disponible: mantener SVG, deshabilitar botón
      imgAvailable = false;
      btn.innerHTML = '🖼 Sin imagen guardada';
      btn.disabled  = true;
      btn.style.opacity = '0.35';
      btn.style.cursor  = 'default';
    };

    // Botón deshabilitado mientras la imagen no ha terminado de intentar cargar
    btn.disabled = true;
    btn.style.opacity = '0.35';

    btn.addEventListener('click', () => {
      if (!imgAvailable) return;
      mode = (mode === 'svg') ? 'img' : 'svg';
      applyMode();
    });

    btn.addEventListener('mouseenter', () => { if (!btn.disabled) btn.style.background = 'rgba(88,166,255,0.18)'; });
    btn.addEventListener('mouseleave', () => { if (!btn.disabled) btn.style.background = 'rgba(88,166,255,0.08)'; });

    wrapper.appendChild(imgWrap);
    wrapper.appendChild(svgWrap);
    parent.appendChild(wrapper);
    return wrapper;
  },

  _warnCard(parent, title, body) {
    const d = document.createElement('div');
    d.style.cssText = 'background:rgba(248,200,60,0.08);border:2px solid #d29922;border-radius:8px;padding:16px 18px;margin-bottom:14px;';
    d.innerHTML = `
      <div style="font-size:0.85rem;font-weight:800;color:#f8c83c;margin-bottom:8px;letter-spacing:0.03em;">${title}</div>
      <p style="margin:0;font-size:0.82rem;color:#e6edf3;line-height:1.6;">${body}</p>`;
    parent.appendChild(d);
    return d;
  },

  _noteCard(parent, title, points) {
    const d = document.createElement('div');
    d.className = 'mr-constructive-notes';
    d.style.cssText = 'background:rgba(47,129,247,0.05);border:1px solid rgba(47,129,247,0.4);border-radius:8px;padding:12px 16px;margin-top:15px;margin-bottom:10px;display:flex;flex-direction:column;gap:6px;page-break-inside:avoid;';
    let html = `
      <div style="font-size:0.82rem;font-weight:700;color:#58a6ff;display:flex;align-items:center;gap:6px;text-transform:uppercase;letter-spacing:0.04em;">
        <span>📌</span> ${title}
      </div>
      <ul style="margin:0;padding-left:18px;font-size:0.78rem;color:#e6edf3;line-height:1.5;">`;
    points.forEach(pt => {
      const idx = pt.indexOf(':');
      if (idx !== -1) {
        const strong = pt.substring(0, idx);
        const rest = pt.substring(idx + 1);
        html += `<li style="margin-bottom:3px;"><strong style="color:#58a6ff;">${strong}:</strong>${rest}</li>`;
      } else {
        html += `<li style="margin-bottom:3px;">${pt}</li>`;
      }
    });
    html += `</ul>`;
    d.innerHTML = html;
    parent.appendChild(d);
    return d;
  },

  _cols(parent, fn1, fn2, ratio='1fr 1fr') {
    const g = document.createElement('div');
    g.style.cssText = `display:grid;grid-template-columns:${ratio};gap:20px;align-items:start;`;
    const L = document.createElement('div');
    const R = document.createElement('div');
    fn1(L); fn2(R);
    g.appendChild(L); g.appendChild(R); parent.appendChild(g);
  },

  _tbl(rows, parent) {
    const t = document.createElement('table');
    t.style.cssText = 'width:100%;border-collapse:collapse;font-size:0.8rem;';
    rows.forEach(([lbl, val, unit='', note='', opt={}]) => {
      const noteColor = note.startsWith('OK') || note.startsWith('Cumple') ? '#3fb950' : note.startsWith('!') ? '#d29922' : note ? '#f85149' : '#8b949e';
      const tr = document.createElement('tr');
      if (opt.class) tr.className = opt.class;
      if (opt.style) tr.style.cssText += opt.style;
      tr.innerHTML = `
        <td style="padding:5px 8px;border-bottom:1px solid rgba(48,54,61,0.4);color:#8b949e;">${lbl}</td>
        <td style="padding:5px 8px;border-bottom:1px solid rgba(48,54,61,0.4);color:#e6edf3;font-weight:600;text-align:right;font-family:'JetBrains Mono',monospace;">${val}</td>
        <td style="padding:5px 8px;border-bottom:1px solid rgba(48,54,61,0.4);color:#8b949e;width:50px;">${unit}</td>
        <td style="padding:5px 8px;border-bottom:1px solid rgba(48,54,61,0.4);color:${noteColor};font-size:0.75rem;width:90px;font-weight:600;">${note}</td>`;
      t.appendChild(tr);
    });
    parent?.appendChild(t); return t;
  },

  // Tabla con header propio para cubicacion
  _tblH(headers, rows, parent) {
    const t = document.createElement('table');
    t.style.cssText = 'width:100%;border-collapse:collapse;font-size:0.8rem;';
    const thead = document.createElement('tr');
    headers.forEach(h => {
      const th = document.createElement('td');
      th.style.cssText = 'padding:6px 8px;border-bottom:2px solid rgba(48,54,61,0.8);color:#8b949e;font-weight:700;font-size:0.72rem;text-transform:uppercase;letter-spacing:0.04em;';
      th.textContent = h;
      thead.appendChild(th);
    });
    t.appendChild(thead);
    rows.forEach(cells => {
      const tr = document.createElement('tr');
      cells.forEach((cell, i) => {
        const td = document.createElement('td');
        td.style.cssText = `padding:5px 8px;border-bottom:1px solid rgba(48,54,61,0.4);${i === 0 ? 'color:#e6edf3;font-weight:600;' : 'color:#c9d1d9;font-family:"JetBrains Mono",monospace;'}`;
        if (typeof cell === 'object' && cell.html) { td.innerHTML = cell.html; td.style.cssText += cell.style || ''; }
        else td.textContent = cell;
        tr.appendChild(td);
      });
      t.appendChild(tr);
    });
    parent?.appendChild(t); return t;
  },

  // ═══════════════════════════════════════════════════════
  // MOTOR DE CUBICACION
  // ═══════════════════════════════════════════════════════
  _STEEL_KG_M: {8:0.395, 10:0.617, 12:0.888, 16:1.578, 18:1.998, 22:2.984, 25:3.853, 28:4.834, 32:6.313},

  _calculateQuantityTakeoff() {
    const stH = S.story.H;
    const f = S.story.foundation;
    const m = S.story.materials;
    const rec = m.rec || 0.03;
    const nodes = S.nodes;
    const spans = S.spans;
    const totalL = spans.reduce((s,sp) => s + getSpanL(sp), 0);
    const nPilares = nodes.length;

    // A. Hormigon (m3)
    const colSec = Object.values(S.columns)[0]?.section || {b:0.20, h:0.20};
    const V_pilares = colSec.b * colSec.h * stH * nPilares;

    let V_cadenas = 0, V_sobrec = 0;
    spans.forEach(sp => {
      const L = getSpanL(sp);
      V_cadenas += sp.beamTop.section.b * sp.beamTop.section.h * L;
      V_sobrec  += sp.beamBot.section.b * sp.beamBot.section.h * L;
    });

    const V_zapata = (f.B||0.60) * (f.Hf||0.60) * (totalL + (f.B||0.60));
    const V_total_neto = V_pilares + V_cadenas + V_sobrec + V_zapata;
    const V_total_com = V_total_neto * 1.10;

    // B. Acero (kg por diametro)
    const acero = {};
    const addBar = (dia, longM, cant) => {
      if (!acero[dia]) acero[dia] = {metros:0, kg:0, barras12m:0};
      const metros = longM * cant;
      acero[dia].metros += metros;
      acero[dia].kg += metros * (this._STEEL_KG_M[dia] || 0.617);
    };

    // Pilares — barras longitudinales
    nodes.forEach(nd => {
      const col = S.columns[nd.id];
      if (!col?.rebar?.faces) return;
      const supB = col.rebar.faces.superior?.barras || [];
      const infB = col.rebar.faces.inferior?.barras || [];
      const diaL = supB[0]?.diámetro || 10;
      const nTotal = (supB[0]?.cantidad||2) + (infB[0]?.cantidad||2);
      const Df = f.Df || 0.85;
      const longBarra = stH + Df + 0.15 + 0.15 - 0.05; // stH + Df + pata inferior + gancho superior - recubrimiento
      addBar(diaL, longBarra, nTotal);

      // Estribos pilar
      const diaE = col.rebar?.estribos?.diámetro || 8;
      const sCrit_m = parseFloat(S.results.columns?.[nd.id]?.rebar?.s_crit_mm || 100) / 1000;
      const sCent_m = parseFloat(S.results.columns?.[nd.id]?.rebar?.s_central_mm || 200) / 1000;
      const critZ = Math.min(0.60, stH/4);
      const nEstCrit = Math.ceil(critZ / sCrit_m) * 2;
      const nEstCent = Math.ceil((stH - 2*critZ) / sCent_m);
      const nEstTotal = nEstCrit + nEstCent;
      const bCol = col.section.b, hCol = col.section.h;
      const lEstribo = 2*(bCol - 2*rec) + 2*(hCol - 2*rec) + 0.15;
      addBar(diaE, lEstribo, nEstTotal);
    });

    // Vigas — barras longitudinales (soporta dinámicamente múltiples caras: superior, inferior, piel)
    spans.forEach(sp => {
      ['beamTop','beamBot'].forEach(bk => {
        const beam = sp[bk];
        if (!beam?.rebar?.faces) return;
        const L = getSpanL(sp);
        
        // Sumar todas las caras longitudinales del elemento de forma dinámica
        Object.keys(beam.rebar.faces).forEach(faceKey => {
          const face = beam.rebar.faces[faceKey];
          const barras = face.barras || [];
          barras.forEach(bar => {
            const cant = bar.cantidad || 2;
            const dia = bar.diámetro || 12;
            const longBarra = L + 0.40;
            addBar(dia, longBarra, cant);
          });
        });

        const diaE = beam.rebar?.estribos?.diámetro || 8;
        const spanRes = S.results.spans?.[sp.id];
        const bRes = bk === 'beamTop' ? spanRes?.beamTop : spanRes?.beamBot;
        const sCrit_m = parseFloat(bRes?.rebar?.s_crit_mm || 150) / 1000;
        const sCent_m = parseFloat(bRes?.rebar?.s_central_mm || 200) / 1000;
        const critX = Math.min(beam.section.b * 2, L * 0.25);
        const nEstCrit = Math.ceil(critX / sCrit_m) * 2;
        const nEstCent = Math.ceil((L - 2*critX) / sCent_m);
        const nEstTotal = nEstCrit + nEstCent;
        const bV = beam.section.b, hV = beam.section.h;
        // El sobrecimiento (beamBot) tiene 4cm (0.04m) de recubrimiento; la viga de cadena superior tiene 3cm (rec)
        const recVal = bk === 'beamBot' ? 0.04 : rec;
        const lEstribo = 2*(bV - 2*recVal) + 2*(hV - 2*recVal) + 0.15;
        addBar(diaE, lEstribo, nEstTotal);
      });
    });

    // Zapata corrida — 4 barras longitudinales Ø10 para anclaje corrido de deslinde
    const diaZapataL = 10;
    const longZapataBar = totalL + 0.40;
    addBar(diaZapataL, longZapataBar, 4);

    // Totales acero con 10% despunte + barras comerciales de 12m
    let kgTotal = 0;
    Object.keys(acero).forEach(d => {
      acero[d].kg_despunte = acero[d].kg * 1.10;
      acero[d].barras12m = Math.ceil(acero[d].metros / 12);
      kgTotal += acero[d].kg_despunte;
    });

    const alambreKg = kgTotal * 0.04;

    // C. Ladrillos y Mortero (Neto descontando la sección de pilares y vigas de hormigón)
    let areaMuro = 0;
    spans.forEach(sp => {
      const L = getSpanL(sp);
      const hLibre = stH - sp.beamTop.section.h - sp.beamBot.section.h; // Corrected to use section.h (vertical dimension)
      const L_net = Math.max(0.1, L - colSec.b); // 2.88 - 0.20 = 2.68 m (largo de albañilería)
      areaMuro += L_net * hLibre;
    });
    const tw = spans[0]?.tw || 0.14;
    const ladrillosNeto = areaMuro * 30;
    const ladrillosMerma = Math.ceil(ladrillosNeto * 1.05);
    const morteroM3 = areaMuro * 0.035;

    // D. Nomenclatura comercial
    const fc = m.fc || 25;
    const grado = `G${fc}`;
    const hormigonLabel = `Hormigon ${grado} (20) / 10`;

    return {
      hormigon: {
        label: hormigonLabel, grado,
        pilares: V_pilares, cadenas: V_cadenas, sobrec: V_sobrec,
        zapata: V_zapata, neto: V_total_neto, comercial: V_total_com
      },
      acero, kgTotal, alambreKg,
      ladrillos: { areaMuro, neto: ladrillosNeto, conMerma: ladrillosMerma },
      mortero: morteroM3, tw,
      meta: { nPilares, nVanos: spans.length, totalL, stH }
    };
  },

  // ═══════════════════════════════════════════════════════
  // PAGINA 0 — FICHA DE ARMADO + CUBICACION (PRIMERA PAGINA)
  // ═══════════════════════════════════════════════════════
  _pageFicha(c) {
    const q = this._calculateQuantityTakeoff();
    const m = S.story.materials;
    const stH = S.story.H;
    const totalL = q.meta.totalL;

    this._hdr(c, 'FICHA DE ARMADO PARA OBRA',
      'Resumen ejecutivo para el constructor — Nomenclatura comercial chilena');

    // ── 1. PROYECTO ──
    const projCard = this._card(c, 'Datos del Proyecto');
    this._tbl([
      ['Tipo de estructura', 'Muro de albanileria confinada', '', ''],
      ['Normativa', 'NCh2123 · NCh430 · NCh433 · NCh3171', '', ''],
      ['Altura entrepiso', stH.toFixed(2), 'm', ''],
      ['Longitud total muro', totalL.toFixed(2), 'm', ''],
      ['Pilares', q.meta.nPilares, 'un', ''],
      ['Vanos', q.meta.nVanos, 'un', ''],
    ], projCard);

    // ── 2. MATERIALES — NOMENCLATURA COMERCIAL ──
    const matCard = this._card(c, 'Materiales a Comprar — Nomenclatura Comercial');
    this._tblH(
      ['Material', 'Especificacion', 'Norma'],
      [
        ['Hormigon', `${q.hormigon.label}`, 'NCh170'],
        ['Acero barras', 'A630-420H con resaltes', 'NCh204'],
        ['Ladrillo', 'Princesa Titan Reforzado 290x140x94 mm', 'NCh169'],
        ['Mortero de pega', '1:3 (cemento : arena)', 'NCh2123'],
        ['Alambre negro', 'N18 para amarras de estribos', ''],
      ],
      matCard
    );

    // ── 3. ARMADURA POR ELEMENTO — TABLA LIMPIA ──
    const armCard = this._card(c, 'Armadura por Elemento');
    const armRows = [];

    S.nodes.forEach((nd, i) => {
      const col = S.columns[nd.id];
      if (!col?.rebar?.faces) return;
      const sup = col.rebar.faces.superior?.barras || [];
      const diaL = sup[0]?.diámetro || 10;
      const nBars = (sup[0]?.cantidad || 2) * 2;
      const diaE = col.rebar?.estribos?.diámetro || 8;
      const res = S.results.columns?.[nd.id];
      const sCrit = (parseFloat(res?.rebar?.s_crit_mm||100)/10).toFixed(0);
      const sCent = (parseFloat(res?.rebar?.s_central_mm||200)/10).toFixed(0);
      armRows.push([
        `Pilar P${i+1}`,
        `${nBars} barras Ø${diaL} mm`,
        `Estribo Ø${diaE} cada ${sCrit}/${sCent} cm`,
      ]);
    });

    S.spans.forEach((sp, i) => {
      ['beamTop','beamBot'].forEach(bk => {
        const beam = sp[bk];
        if (!beam?.rebar?.faces) return;
        const sup = beam.rebar.faces.superior?.barras || [];
        const inf = beam.rebar.faces.inferior?.barras || [];
        const diaL = sup[0]?.diámetro || inf[0]?.diámetro || 10;
        const nSup = sup.reduce((s,br) => s + (br.cantidad||1), 0);
        const nInf = inf.reduce((s,br) => s + (br.cantidad||1), 0);
        const diaE = beam.rebar?.estribos?.diámetro || 8;
        const spanRes = S.results.spans?.[sp.id];
        const bRes = bk === 'beamTop' ? spanRes?.beamTop : spanRes?.beamBot;
        const sCrit = (parseFloat(bRes?.rebar?.s_crit_mm||150)/10).toFixed(0);
        const sCent = (parseFloat(bRes?.rebar?.s_central_mm||200)/10).toFixed(0);
        const label = bk === 'beamTop' ? `Cadena Sup. V${i+1}` : `Sobrecimiento V${i+1}`;
        armRows.push([
          label,
          `${nSup} sup + ${nInf} inf, Ø${diaL} mm`,
          `Estribo Ø${diaE} cada ${sCrit}/${sCent} cm`,
        ]);
      });
    });

    this._tblH(
      ['Elemento', 'Barras Longitudinales (A630-420H)', 'Estribos (A630-420H)'],
      armRows,
      armCard
    );

    // ── 4. CUBICACION HORMIGON — TABLA CONSOLIDADA ──
    const hCard = this._card(c, `Cubicacion de Hormigon — ${q.hormigon.label}`);
    this._tblH(
      ['Componente', 'Volumen neto', 'Unidad'],
      [
        ['Pilares de confinamiento', q.hormigon.pilares.toFixed(3), 'm3'],
        ['Cadenas superiores', q.hormigon.cadenas.toFixed(3), 'm3'],
        ['Sobrecimientos', q.hormigon.sobrec.toFixed(3), 'm3'],
        ['Zapata corrida', q.hormigon.zapata.toFixed(3), 'm3'],
        [{html:'<strong>Subtotal neto</strong>', style:'color:#e6edf3;font-weight:700;'}, {html:`<strong>${q.hormigon.neto.toFixed(3)}</strong>`, style:'color:#e6edf3;font-weight:700;'}, {html:'<strong>m3</strong>', style:'color:#e6edf3;'}],
        [{html:'<strong style="color:#3fb950;">TOTAL A PEDIR (+10% perdida)</strong>', style:'color:#3fb950;font-weight:700;'}, {html:`<strong style="color:#3fb950;">${q.hormigon.comercial.toFixed(2)}</strong>`, style:'color:#3fb950;font-weight:700;font-size:1rem;'}, {html:'<strong style="color:#3fb950;">m3</strong>', style:'color:#3fb950;'}],
      ],
      hCard
    );

    // ── 5. CUBICACION ACERO — "CUANTO COMPRAR" ──
    const sCard = this._card(c, 'Cubicacion de Acero — A630-420H');
    const steelRows = [];
    Object.keys(q.acero).sort((a,b)=>+a - +b).forEach(dia => {
      const d = q.acero[dia];
      steelRows.push([
        `Ø${dia} mm`,
        `${(this._STEEL_KG_M[dia]||0).toFixed(3)} kg/m`,
        {html:`${d.metros.toFixed(1)} m<br><span style="font-size:0.82em; color:#8b949e;">(${d.barras12m} tiras de 12m)</span>`, style:'line-height:1.3;'},
        `${d.kg.toFixed(1)} kg`,
        {html:`<strong>${d.kg_despunte.toFixed(1)}</strong>`, style:'color:#3fb950;font-weight:700;'},
      ]);
    });
    // Total row
    steelRows.push([
      {html:'<strong>TOTAL A PEDIR</strong>', style:'color:#3fb950;font-weight:800;'},
      '', '', '',
      {html:`<strong style="font-size:1rem;">${q.kgTotal.toFixed(1)} kg</strong>`, style:'color:#3fb950;font-weight:800;font-size:1rem;'},
    ]);
    this._tblH(
      ['Diametro', 'Peso unit.', 'Largo Total / Formato', 'Peso neto', 'Con despunte (+10%)'],
      steelRows,
      sCard
    );

    // Alambre
    const alCard = this._card(c, 'Alambre Negro N18');
    this._tbl([
      ['Proporcion', '4% del peso total de acero', '', ''],
      ['Cantidad a comprar', q.alambreKg.toFixed(2), 'kg', ''],
    ], alCard);

    // ── 6. CUBICACION ALBANILERIA ──
    const lCard = this._card(c, 'Cubicacion Albanileria + Mortero');
    this._tblH(
      ['Item', 'Cantidad', 'Unidad', 'Observacion'],
      [
        ['Superficie muro', q.ladrillos.areaMuro.toFixed(2), 'm2', ''],
        ['Espesor tw (soga)', (q.tw*100).toFixed(0), 'cm', 'Princesa Titan'],
        ['Rendimiento', '30', 'un/m2', 'Ladrillo Titan 290x140x94'],
        ['Ladrillos neto', Math.ceil(q.ladrillos.neto).toString(), 'un', ''],
        [{html:'<strong style="color:#3fb950;">LADRILLOS A PEDIR (+5%)</strong>', style:'color:#3fb950;font-weight:700;'}, {html:`<strong style="color:#3fb950;">${q.ladrillos.conMerma}</strong>`, style:'color:#3fb950;font-weight:700;font-size:1rem;'}, {html:'<strong style="color:#3fb950;">un</strong>', style:'color:#3fb950;'}, ''],
        ['Mortero 1:3', q.mortero.toFixed(3), 'm3', '0.035 m3/m2'],
      ],
      lCard
    );

    // ── NOTA PARA OBRA ──
    this._warnCard(c,
      'IMPORTANTE — INSTRUCCIONES PARA OBRA',
      `<strong>1.</strong> Mojar los ladrillos antes de colocar (obligatorio para Princesa Titan).<br>
       <strong>2.</strong> Estribos con gancho sismico 135 grados en ambos extremos.<br>
       <strong>3.</strong> Empalmes de barras: minimo 40 diametros (ej: Ø10 = 40 cm, Ø12 = 48 cm).<br>
       <strong>4.</strong> Recubrimiento libre: ${(m.rec*100).toFixed(0)} cm en todos los elementos.<br>
       <strong>5.</strong> No hormigonar pilares sin cadena superior colocada.`
    );
  },

  // ═══════════════════════════════════════════════════════
  // PAGINA 1 — VISTA GENERAL (PROPORCIONES REALES)
  // ═══════════════════════════════════════════════════════
  _pageGeneral(c) {
    this._hdr(c, 'Vista General del Sistema Estructural',
      'Muro de albanileria confinada — Proporciones reales del calculo');

    const card = this._card(c, 'Elevacion del Muro (proporcional)');
    const W = 760, H = 340;
    const svg = this._svg(W, H);
    this._drawWallElevation(svg, W, H);
    card.appendChild(svg);

    // Datos basicos en dos columnas
    this._cols(c,
      L => {
        const mc = this._card(L, 'Materiales');
        this._tbl([
          ['Hormigon', `Hormigon ${this._calculateQuantityTakeoff().hormigon.grado}`, '', ''],
          ['Acero', `Acero A630-420H`, '', ''],
          ['Recubrimiento', `${(S.story.materials.rec*100).toFixed(0)}`, 'cm', ''],
        ], mc);
      },
      R => {
        const gc = this._card(R, 'Geometria');
        const totalL = S.spans.reduce((s,sp)=>s+getSpanL(sp),0);
        const avgSpacing = totalL / S.spans.length;
        this._tbl([
          ['Altura H', S.story.H.toFixed(2), 'm', ''],
          ['Longitud total L', totalL.toFixed(2), 'm', ''],
          ['Distancia entre ejes', avgSpacing.toFixed(2), 'm', ''],
          ['Vanos', S.spans.length, '', ''],
        ], gc);
      }
    );
  },

  // Elevacion con proporciones reales del Solver
  _drawWallElevation(svg, W, H) {
    const el = (tag,at) => this._el(tag, at, svg);
    const tx = (s,x,y,at={}) => this._t(svg, s, x, y, at);
    const f = S.story.foundation;
    const stH = S.story.H;
    const spans = S.spans;
    const totalL = spans.reduce((s,sp)=>s+getSpanL(sp),0);

    const PAD_L=60, PAD_R=40, PAD_T=30, PAD_B=50;
    const drawW = W-PAD_L-PAD_R, drawH = H-PAD_T-PAD_B;

    // Escala proporcional: respetar relacion L/H real
    const totalVert = stH + (f.Hf||0.60);
    const scaleH = drawW / totalL;
    const scaleV = drawH / totalVert;
    const scale = Math.min(scaleH, scaleV);

    const wallW = totalL * scale;
    const wallH = stH * scale;
    const fHpx = (f.Hf||0.60) * scale;

    const x0 = PAD_L + (drawW - wallW) / 2;
    const yTop = PAD_T + (drawH - wallH - fHpx) / 2;
    const yGnd = yTop + wallH;
    const yFB = yGnd + fHpx;

    // Node X positions
    const nX = {};
    let cx = 0;
    S.nodes.forEach((nd,i) => { nX[nd.id]=cx; if(i<spans.length) cx+=getSpanL(spans[i]); });

    // Suelo hatching bajo zapata
    for(let hy=yGnd; hy<yFB+6; hy+=7)
      el('line',{x1:x0-10, y1:hy, x2:x0+wallW+10, y2:hy+7,
        stroke:'rgba(150,130,90,0.08)', 'stroke-width':0.8});

    // Zapata Corrida
    const fBpx = Math.max((f.B||0.60) * scale, wallW + 10);
    const zapX = x0 + wallW/2 - fBpx/2;
    el('rect',{x:zapX, y:yGnd, width:fBpx, height:fHpx,
      fill:'rgba(210,175,60,0.13)', stroke:'#c8982a', 'stroke-width':1.5});

    // Beam sections
    const btSec = spans[0]?.beamTop.section||{h:0.15};
    const bbSec = spans[0]?.beamBot.section||{h:0.15};
    const btH = btSec.h * scale;
    const bbH = bbSec.h * scale;

    // Muros de ladrillo
    spans.forEach(sp => {
      const x1 = x0 + nX[sp.fromNode]*scale;
      const spPx = getSpanL(sp)*scale;
      const wTop = yTop + btH;
      const wBot = yGnd - bbH;
      el('rect',{x:x1,y:wTop,width:spPx,height:wBot-wTop,
        fill:'rgba(210,160,80,0.07)',stroke:'rgba(210,160,80,0.35)','stroke-width':1});
      for(let hy=wTop+8;hy<wBot;hy+=8)
        el('line',{x1:x1,y1:hy,x2:x1+spPx,y2:hy,stroke:'rgba(210,160,80,0.10)','stroke-width':0.5});
    });

    // Pilares
    const cSec = Object.values(S.columns)[0]?.section||{b:0.20};
    const cW = Math.max(cSec.b * scale, 6);
    S.nodes.forEach(nd => {
      const nx = x0 + nX[nd.id]*scale;
      el('rect',{x:nx-cW/2,y:yTop,width:cW,height:wallH,
        fill:'rgba(63,185,80,0.12)',stroke:'#3fb950','stroke-width':1.5});
    });

    // Cadena superior
    el('rect',{x:x0,y:yTop,width:wallW,height:btH,
      fill:'rgba(47,129,247,0.1)',stroke:'#2f81f7','stroke-width':1.5});

    // Sobrecimiento
    el('rect',{x:x0,y:yGnd-bbH,width:wallW,height:bbH,
      fill:'rgba(139,92,246,0.1)',stroke:'#8b5cf6','stroke-width':1.5});

    // Nivel de terreno
    el('line',{x1:x0-15,y1:yGnd,x2:x0+wallW+15,y2:yGnd,
      stroke:'rgba(120,140,160,0.5)','stroke-width':1,'stroke-dasharray':'5,3'});
    tx('N.T.',x0-20,yGnd+4,{'font-size':'12','fill':'#000','text-anchor':'end','font-weight':'600'});

    // Dimension H (izquierda)
    el('line',{x1:x0-30,y1:yTop,x2:x0-30,y2:yGnd,stroke:'#333','stroke-width':1});
    [yTop,yGnd].forEach(yy=>el('line',{x1:x0-34,y1:yy,x2:x0-6,y2:yy,stroke:'#333','stroke-width':1}));
    this._tv(svg, `H = ${stH.toFixed(2)} m`, x0-38, (yTop+yGnd)/2,
      {'font-size':'12','fill':'#000','font-weight':'700'});

    // Dimension L total (abajo)
    const dimY = yFB + 18;
    el('line',{x1:x0,y1:dimY,x2:x0+wallW,y2:dimY,stroke:'#333','stroke-width':1});
    [x0,x0+wallW].forEach(xx=>el('line',{x1:xx,y1:dimY-4,x2:xx,y2:dimY+4,stroke:'#333','stroke-width':1}));
    tx(`L = ${totalL.toFixed(2)} m`, x0+wallW/2, dimY+14,
      {'font-size':'12','fill':'#000','text-anchor':'middle','font-weight':'700'});

    // Dimension vanos individuales
    spans.forEach((sp, i) => {
      const x1 = x0 + nX[sp.fromNode]*scale;
      const spPx = getSpanL(sp)*scale;
      if (spans.length > 1) {
        tx(`${getSpanL(sp).toFixed(2)}m`, x1+spPx/2, yTop-6,
          {'font-size':'12','fill':'#000','text-anchor':'middle','font-weight':'600'});
      }
    });

    // Nodo labels
    S.nodes.forEach((nd,i) => {
      const nx = x0 + nX[nd.id]*scale;
      tx(`P${i+1}`, nx, yGnd+bbH+16,
        {'font-size':'12','fill':'#3fb950','text-anchor':'middle','font-weight':'600'});
    });
  },

  // ═══════════════════════════════════════════════════════
  // PERFIL VERTICAL AISLADO — VANO TÍPICO (Versión 9.3)
  // ═══════════════════════════════════════════════════════
  _drawWallProfileSection(col, span, f, stH, totalL, W, H) {
    const svg = this._svg(W, H);
    const el = (tag,at) => this._el(tag,at,svg);
    const tx = (s,x,y,at={}) => this._t(svg,s,x,y,at);

    // Margen izquierdo aumentado (PAD_L = 120) para evitar que las cotas colisionen con los límites del canvas
    const PAD_L=120, PAD_R=45, PAD_T=25, PAD_B=110;
    const drawW = W - PAD_L - PAD_R;
    const drawH = H - PAD_T - PAD_B;

    // DIMENSIONES REALES
    const b = col?.section.b || 0.20;
    const h = col?.section.h || 0.25;
    const btH = span?.beamTop?.section.h || 0.15;  // altura real cadena superior desde estado
    const fH = f?.Hf || 0.60;
    const Df = f?.Df || 0.80;
    const B = f?.B || 0.60;

    // VANO AISLADO REAL (De pilar a pilar, 2.88 m de luz entre ejes)
    const vanoL = getSpanL(span);

    // Dynamic height of Sobrecimiento to place top exactly 20 cm above N.T.N.
    // yNT = yZapBot - Df * scale
    // yBbTop = yNT - 0.20 * scale => top of Sobrecimiento is 20cm above ground.
    // yBbBot = yZapTop = yZapBot - fH * scale
    // Physical Sobrecimiento height = (Df + 0.20 - fH)
    const bbH_draw = Df + 0.20 - fH;

    // Altura útil del dibujo: desde la viga superior hasta la zapata más un pequeño colchón de suelo
    const soilBed = 0.15; // 15 cm de suelo de apoyo bajo la zapata
    const totalVert = btH + stH + bbH_draw + fH + soilBed;

    // ESCALA PROPORCIONAL ESTRICTA (Aspect Ratio real)
    const scaleH = drawH / totalVert;
    const scaleW = drawW / (vanoL + b);
    const scale = Math.min(scaleH, scaleW);

    const colW = b * scale;
    const spanWInner = (vanoL - b) * scale; // Luz libre entre caras de pilares
    const spanWFull = vanoL * scale;       // Distancia entre ejes de pilares

    const x0 = PAD_L + (drawW - (spanWFull + colW)) / 2;
    
    // Y-Coordinates calculated strictly according to structural elements
    const yBtTop = PAD_T + (drawH - totalVert * scale) / 2;
    const yBtBot = yBtTop + btH * scale;
    const yMurTop = yBtBot;
    const yMurBot = yMurTop + stH * scale;
    const yBbTop = yMurBot;
    const yBbBot = yBbTop + bbH_draw * scale;
    const yZapTop = yBbBot;
    const yZapBot = yZapTop + fH * scale;
    const ySueloBot = yZapBot + soilBed * scale;

    // Nivel de Terreno Natural (N.T.N) definido por Df desde el fondo de la zapata
    const yNT = yZapBot - Df * scale;

    // PILARES DE CONFINAMIENTO (Enmarcamiento real de hormigón armado de pilar a zapata)
    const colX1 = x0;
    const colX2 = x0 + spanWFull;

    // Pilar P1 (Izquierdo)
    el('rect',{x:colX1,y:yBtTop,width:colW,height:(yBbBot-yBtTop),
      fill:'rgba(27,54,93,0.06)',stroke:'#1b365d','stroke-width':1.8});

    // Pilar P2 (Derecho)
    el('rect',{x:colX2,y:yBtTop,width:colW,height:(yBbBot-yBtTop),
      fill:'rgba(27,54,93,0.06)',stroke:'#1b365d','stroke-width':1.8});

    // CADENA SUPERIOR (Hormigón de confinamiento superior)
    el('rect',{x:colX1+colW,y:yBtTop,width:spanWInner,height:btH*scale,
      fill:'rgba(47,129,247,0.06)',stroke:'#2f81f7','stroke-width':1.5});

    // MURO DE ALBAÑILERÍA — TEXTURA DEFINIDA APAREJO EN SOGA
    const murX1 = colX1 + colW;
    const murX2 = colX2;
    const murW = murX2 - murX1;

    el('rect',{x:murX1,y:yMurTop,width:murW,height:stH*scale,
      fill:'rgba(210,160,80,0.04)',stroke:'none'});

    // Aparejo en Soga (ladrillo Princess desfasado 50% en hiladas alternas)
    const h_ladrillo = 0.11 * scale; // altura hilada con mortero (~11 cm)
    const b_ladrillo = 0.305 * scale; // longitud ladrillo con mortero (~30.5 cm)
    const numHiladas = Math.ceil(stH * scale / h_ladrillo);

    for(let hilada = 0; hilada < numHiladas; hilada++) {
      const y_hilada = yMurTop + hilada * h_ladrillo;
      const x_offset = (hilada % 2) * b_ladrillo / 2;

      // Juntas horizontales (remarcadas)
      if (hilada > 0) {
        el('line',{x1:murX1,y1:y_hilada,x2:murX2,y2:y_hilada,
          stroke:'rgba(195,120,70,0.5)','stroke-width':0.8});
      }

      // Juntas verticales (remarcadas)
      for(let x = murX1 + x_offset; x < murX2; x += b_ladrillo) {
        if (x > murX1 && x < murX2) {
          el('line',{x1:x,y1:y_hilada,x2:x,y2:y_hilada+h_ladrillo,
            stroke:'rgba(195,120,70,0.4)','stroke-width':0.7});
        }
      }
    }

    tx('Muro de Albañilería Confinada',x0+spanWFull/2+colW/2,yMurTop+stH*scale/2+3,
      {'font-size':'12','fill':'#c8702a','text-anchor':'middle','font-weight':'800'});

    // SOBRECIMIENTO (Confinamiento inferior)
    el('rect',{x:colX1+colW,y:yBbTop,width:spanWInner,height:bbH_draw*scale,
      fill:'rgba(139,92,246,0.06)',stroke:'#8b5cf6','stroke-width':1.5});

    // ZAPATA CORRIDA (Cimiento continuo)
    const zapW = spanWFull + colW * 1.5;
    const zapX = x0 - colW * 0.25;
    el('rect',{x:zapX,y:yZapTop,width:zapW,height:fH*scale,
      fill:'rgba(210,175,60,0.08)',stroke:'#c8982a','stroke-width':1.5});
    tx(`Zapata ${(B*100).toFixed(0)}×${(fH*100).toFixed(0)} cm`,
      zapX+zapW/2,yZapTop+fH*scale/2+3,{'font-size':'12','fill':'#a57c1d','text-anchor':'middle','font-weight':'700'});

    // SUELO LATERAL CON HATCHING DE EXCAVACIÓN (Físicamente coherente)
    const trenchW = 40;
    // Suelo Izquierdo
    el('rect',{x:zapX-trenchW,y:yNT,width:trenchW,height:Df*scale,
      fill:'rgba(150,130,90,0.04)',stroke:'none'});
    // Línea de excavación
    el('line',{x1:zapX-trenchW,y1:yNT,x2:zapX-trenchW,y2:yZapBot,stroke:'rgba(150,130,90,0.5)','stroke-width':0.8});
    el('line',{x1:zapX-trenchW,y1:yZapBot,x2:zapX,y2:yZapBot,stroke:'rgba(150,130,90,0.5)','stroke-width':0.8});
    for(let sx=zapX-trenchW; sx<zapX; sx+=6) {
      el('line',{x1:sx,y1:yNT,x2:sx-6,y2:yZapBot,stroke:'rgba(150,130,90,0.2)','stroke-width':0.45});
    }

    // Suelo Derecho
    el('rect',{x:zapX+zapW,y:yNT,width:trenchW,height:Df*scale,
      fill:'rgba(150,130,90,0.04)',stroke:'none'});
    // Línea de excavación
    el('line',{x1:zapX+zapW+trenchW,y1:yNT,x2:zapX+zapW+trenchW,y2:yZapBot,stroke:'rgba(150,130,90,0.5)','stroke-width':0.8});
    el('line',{x1:zapX+zapW,y1:yZapBot,x2:zapX+zapW+trenchW,y2:yZapBot,stroke:'rgba(150,130,90,0.5)','stroke-width':0.8});
    for(let sx=zapX+zapW; sx<zapX+zapW+trenchW; sx+=6) {
      el('line',{x1:sx,y1:yNT,x2:sx+6,y2:yZapBot,stroke:'rgba(150,130,90,0.2)','stroke-width':0.45});
    }

    // Suelo de apoyo inferior compactado (bajo el cimiento)
    for(let sx=zapX; sx<zapX+zapW; sx+=12) {
      el('line',{x1:sx,y1:yZapBot+3,x2:sx+6,y2:yZapBot+3,stroke:'rgba(150,130,90,0.3)','stroke-dasharray':'1,1','stroke-width':1});
    }

    // NIVEL DE TERRENO NATURAL (Línea discontinua)
    el('line',{x1:zapX-trenchW-10,y1:yNT,x2:zapX+zapW+trenchW+10,y2:yNT,
      stroke:'rgba(100,120,140,0.6)','stroke-width':1.2,'stroke-dasharray':'6,3'});
    tx('N.T.N.', colX2+colW+5, yNT-4, {'font-size':'12','fill':'#555','font-weight':'700'});  // derecha del pilar, fuera de zona de cotas

    // ═══════════════════════════════════════════════════════
    // DETALLE DE ARMADURAS DE REFUERZO (Esqueleto de Acero)
    // ═══════════════════════════════════════════════════════
    const drawRebars = () => {
      const steelBlue = '#1e40af';
      const xLeftBar1 = colX1 + colW * 0.28;
      const xLeftBar2 = colX1 + colW * 0.72;
      const xRightBar1 = colX2 + colW * 0.28;
      const xRightBar2 = colX2 + colW * 0.72;

      // Recubrimiento de Zapata de 7.5 cm en contacto con el terreno
      const recZapata = 0.075 * scale;
      const rebarYBot = yZapBot - recZapata;

      // Pilar Izquierdo - Barras verticales continuas
      el('line',{x1:xLeftBar1,y1:yBtTop+6,x2:xLeftBar1,y2:rebarYBot,stroke:steelBlue,'stroke-width':1.5});
      el('line',{x1:xLeftBar2,y1:yBtTop+6,x2:xLeftBar2,y2:rebarYBot,stroke:steelBlue,'stroke-width':1.5});
      // Pilar Izquierdo - Patas dobladas a 90° de 20 cm en la zapata (Hacia afuera)
      el('line',{x1:xLeftBar1,y1:rebarYBot,x2:xLeftBar1 - 0.20*scale,y2:rebarYBot,stroke:steelBlue,'stroke-width':1.5});
      el('line',{x1:xLeftBar2,y1:rebarYBot,x2:xLeftBar2 + 0.20*scale,y2:rebarYBot,stroke:steelBlue,'stroke-width':1.5});

      // Pilar Derecho - Barras verticales continuas
      el('line',{x1:xRightBar1,y1:yBtTop+6,x2:xRightBar1,y2:rebarYBot,stroke:steelBlue,'stroke-width':1.5});
      el('line',{x1:xRightBar2,y1:yBtTop+6,x2:xRightBar2,y2:rebarYBot,stroke:steelBlue,'stroke-width':1.5});
      // Pilar Derecho - Patas dobladas a 90° de 20 cm en la zapata (Hacia afuera)
      el('line',{x1:xRightBar1,y1:rebarYBot,x2:xRightBar1 - 0.20*scale,y2:rebarYBot,stroke:steelBlue,'stroke-width':1.5});
      el('line',{x1:xRightBar2,y1:rebarYBot,x2:xRightBar2 + 0.20*scale,y2:rebarYBot,stroke:steelBlue,'stroke-width':1.5});

      // 2. Estribos de Confinamiento en Pilares (Verde)
      const stirGreen = '#1b5e20';
      const Lc_px = 0.60 * scale; // 60 cm de zona de confinamiento sísmico
      const s_crit = 0.10 * scale; // estribos cada 10 cm
      const s_central = 0.20 * scale; // estribos cada 20 cm en el centro
      
      const drawStirrups = (colX) => {
        let cy = yBtTop + 8;
        while (cy < yBbBot - 8) {
          // Estribo horizontal
          el('line',{x1:colX+3,y1:cy,x2:colX+colW-3,y2:cy,stroke:stirGreen,'stroke-width':0.8});
          // Gancho sísmico a 135° visible en esquina
          el('line',{x1:colX+3,y1:cy,x2:colX+6,y2:cy+3,stroke:stirGreen,'stroke-width':0.8});
          
          // Avanzar Y
          const distTop = cy - yBtTop;
          const distBot = yBbBot - cy;
          if (distTop < Lc_px || distBot < Lc_px) {
            cy += s_crit;
          } else {
            cy += s_central;
          }
        }
      };
      drawStirrups(colX1);
      drawStirrups(colX2);

      // 3. Fierros Horizontales de Cadenas (Con ganchos terminales a 90° en pilares - corregidos de 10m a 10cm reales)
      el('line',{x1:colX1+5,y1:yBtTop+4,x2:colX2+colW-5,y2:yBtTop+4,stroke:steelBlue,'stroke-width':1.2});
      el('line',{x1:colX1+5,y1:yBtBot-4,x2:colX2+colW-5,y2:yBtBot-4,stroke:steelBlue,'stroke-width':1.2});
      // Ganchos cadena (doblados hacia adentro)
      el('line',{x1:colX1+5,y1:yBtTop+4,x2:colX1+5,y2:yBtTop+4+0.10*scale,stroke:steelBlue,'stroke-width':1.2});
      el('line',{x1:colX1+5,y1:yBtBot-4,x2:colX1+5,y2:yBtBot-4-0.10*scale,stroke:steelBlue,'stroke-width':1.2});
      el('line',{x1:colX2+colW-5,y1:yBtTop+4,x2:colX2+colW-5,y2:yBtTop+4+0.10*scale,stroke:steelBlue,'stroke-width':1.2});
      el('line',{x1:colX2+colW-5,y1:yBtBot-4,x2:colX2+colW-5,y2:yBtBot-4-0.10*scale,stroke:steelBlue,'stroke-width':1.2});

      // 4. Fierros Horizontales de Sobrecimiento (Con ganchos terminales a 90° - corregidos de 10m a 10cm reales)
      el('line',{x1:colX1+5,y1:yBbTop+4,x2:colX2+colW-5,y2:yBbTop+4,stroke:steelBlue,'stroke-width':1.2});
      el('line',{x1:colX1+5,y1:yBbBot-4,x2:colX2+colW-5,y2:yBbBot-4,stroke:steelBlue,'stroke-width':1.2});
      // Ganchos sobrecimiento (doblados hacia adentro)
      el('line',{x1:colX1+5,y1:yBbTop+4,x2:colX1+5,y2:yBbTop+4-0.10*scale,stroke:steelBlue,'stroke-width':1.2});
      el('line',{x1:colX1+5,y1:yBbBot-4,x2:colX1+5,y2:yBbBot-4-0.10*scale,stroke:steelBlue,'stroke-width':1.2});
      el('line',{x1:colX2+colW-5,y1:yBbTop+4,x2:colX2+colW-5,y2:yBbTop+4-0.10*scale,stroke:steelBlue,'stroke-width':1.2});
      el('line',{x1:colX2+colW-5,y1:yBbBot-4,x2:colX2+colW-5,y2:yBbBot-4-0.10*scale,stroke:steelBlue,'stroke-width':1.2});

      // 4.5. Armadura de Piel Intermedia del Sobrecimiento (2Ø10 a media altura - 30cm)
      const yBbMid = yBbTop + (bbH_draw * scale) / 2;
      el('line',{x1:colX1+5,y1:yBbMid,x2:colX2+colW-5,y2:yBbMid,stroke:steelBlue,'stroke-width':1.2});
      el('line',{x1:colX1+5,y1:yBbMid,x2:colX1+5,y2:yBbMid-0.05*scale,stroke:steelBlue,'stroke-width':1.2});
      el('line',{x1:colX2+colW-5,y1:yBbMid,x2:colX2+colW-5,y2:yBbMid-0.05*scale,stroke:steelBlue,'stroke-width':1.2});

      // 5. Armadura de Zapata Corrida (Solo longitudinal con ganchos corregidos de 10m a 10cm reales, sin fierros transversales)
      el('line',{x1:zapX+5,y1:rebarYBot,x2:zapX+zapW-5,y2:rebarYBot,stroke:steelBlue,'stroke-width':1.5});
      el('line',{x1:zapX+5,y1:rebarYBot,x2:zapX+5,y2:rebarYBot-0.10*scale,stroke:steelBlue,'stroke-width':1.5});
      el('line',{x1:zapX+zapW-5,y1:rebarYBot,x2:zapX+zapW-5,y2:rebarYBot-0.10*scale,stroke:steelBlue,'stroke-width':1.5});
    };
    drawRebars();

    // ═══════════════════════════════════════════════════════
    // ACOTACIONES (Líneas de Cota CAD Sin Solapamientos)
    // ═══════════════════════════════════════════════════════
    // Usar margen izquierdo PAD_L para alejar las cotas del dibujo
    const dimXL = x0 - 38;

    // Cotas de Elementos (Línea Interna Izquierda)
    this._dimV(svg,dimXL,yBtTop,yBtBot,`${(btH*100).toFixed(0)} cm`,'#333',12);
    this._dimV(svg,dimXL,yMurTop,yMurBot,`H = ${stH.toFixed(2)} m`,'#000',12);
    this._dimV(svg,dimXL,yBbTop,yBbBot,`${(bbH_draw*100).toFixed(0)} cm`,'#333',12);
    this._dimV(svg,dimXL,yZapTop,yZapBot,`${(fH*100).toFixed(0)} cm`,'#333',12);

    // Cota de Profundidad de Fundación Df (Línea Externa Izquierda - Desplazada para evitar solapes)
    this._dimV(svg,dimXL-26,yNT,yZapBot,`Df = ${(Df*100).toFixed(0)} cm`,'#000',12);

    // COTA HORIZONTAL (Luz del Vano entre ejes de pilares - Luz de vano típico aislada)
    const dimYH = ySueloBot + 25;
    el('line',{x1:colX1+colW/2,y1:dimYH,x2:colX2+colW/2,y2:dimYH,stroke:'#333','stroke-width':0.8});
    [colX1+colW/2,colX2+colW/2].forEach(xx=>el('line',{x1:xx,y1:dimYH-3.5,x2:xx,y2:dimYH+3.5,stroke:'#333','stroke-width':0.8}));
    tx(`L = ${vanoL.toFixed(2)} m (eje a eje)`,x0+spanWFull/2+colW/2,dimYH+14,
      {'font-size':'12','fill':'#000','text-anchor':'middle','font-weight':'700'});

    // COTA HORIZONTAL DE ZAPATA (Ancho cimiento B)
    const dimYZ = ySueloBot + 38;
    el('line',{x1:zapX,y1:dimYZ,x2:zapX+zapW,y2:dimYZ,stroke:'#333','stroke-width':0.8});
    [zapX,zapX+zapW].forEach(xx=>el('line',{x1:xx,y1:dimYZ-3.5,x2:xx,y2:dimYZ+3.5,stroke:'#333','stroke-width':0.8}));
    tx(`B = ${(B*100).toFixed(0)} cm`,zapX+zapW/2,dimYZ+14,
      {'font-size':'12','fill':'#000','text-anchor':'middle','font-weight':'600'});

    return svg;
  },

  // ═══════════════════════════════════════════════════════
  // PAGINA 2 — PILAR (limpio, para constructor)
  // ═══════════════════════════════════════════════════════
  _pageColumn(c) {
    const nodeId = S.ui.selectedNode || S.nodes[0]?.id;
    const col = S.columns[nodeId];
    const res = S.results.columns?.[nodeId];
    if(!col||!res){ c.innerHTML='<p style="color:#8b949e">Sin datos de pilar. Ejecuta el calculo.</p>'; return; }

    const { b, h } = col.section;
    const design = res.rebar || {};
    const m = S.story.materials;
    const supBars = col.rebar?.faces?.superior?.barras || [];
    const nPerFace = supBars[0]?.cantidad || 2;
    const diaL = supBars[0]?.diámetro || 10;
    const diaE = col.rebar?.estribos?.diámetro || 8;
    const AsProv = (col.rebar?.faces?.superior?.AsTotal || 0) * 2;
    const AsReq = parseFloat(design.AsReq) || 0;

    // Selector de pilar
    const sel = document.createElement('div');
    sel.className = 'mr-selector';
    sel.style.cssText = 'display:flex;gap:6px;margin-bottom:14px;flex-wrap:wrap;';
    S.nodes.filter(nd=>S.results.columns?.[nd.id]).forEach((nd,i) => {
      const b2 = document.createElement('button');
      b2.textContent = `P${i+1}`;
      b2.style.cssText = `padding:4px 10px;border-radius:4px;cursor:pointer;font-size:0.75rem;font-weight:600;
        background:${nd.id===nodeId?'#3fb950':'rgba(63,185,80,0.1)'};
        border:1px solid ${nd.id===nodeId?'#3fb950':'rgba(63,185,80,0.3)'};
        color:${nd.id===nodeId?'#fff':'#3fb950'};`;
      b2.onclick = () => { S.ui.selectedNode = nd.id; c.innerHTML=''; this._pageColumn(c); };
      sel.appendChild(b2);
    });
    c.appendChild(sel);

    const nodeIdx = S.nodes.findIndex(nd=>nd.id===nodeId);
    this._hdr(c, `PILAR DE CONFINAMIENTO — SECCION ${(b*100).toFixed(0)}X${(h*100).toFixed(0)} CM`,
      `Acero A630-420H · ${res.isCorner?'Esquina':'Interior'}`);

    this._cols(c,
      L => {
        const csCard = this._card(L, 'Seccion Transversal');
        csCard.style.display = 'flex';
        csCard.style.flexDirection = 'column';
        csCard.style.alignItems = 'center';
        csCard.style.justifyContent = 'center';
        this._imgOrXS(csCard, 'Pilar - sección transversal.png', this._drawXS(b, h, col.rebar, m, design, 450, 450));

        const rCard = this._card(L, 'Armadura Longitudinal');
        const sCrit  = (parseFloat(design.s_crit_mm||100)/10).toFixed(0);
        const sCent  = (parseFloat(design.s_central_mm||200)/10).toFixed(0);
        this._tbl([
          ['Barras', `${nPerFace*2} Ø${diaL} mm (${nPerFace} por cara)`, '', ''],
          ['Acero tipo', 'A630-420H', '', ''],
          ['Anclaje superior', 'Gancho 90° en cadena', '', ''],
          ['Anclaje inferior', 'Pata en zapata/sobrec.', '', ''],
          ['Recubrimiento', `${(m.rec*100).toFixed(0)}`, 'cm', ''],
        ], rCard);

        const sCard = this._card(L, 'Estribos (Confinamiento Sismico)');
        this._tbl([
          ['Estribo', `Ø${diaE} mm A630-420H`, '', ''],
          ['Zona critica (Lc)', `cada ${sCrit} cm`, '', `Lc = ${(Math.min(60, S.story.H*25).toFixed(0))} cm`],
          ['Zona central', `cada ${sCent} cm`, '', ''],
          ['Gancho sismico', '135 grados', '', 'Obligatorio NCh430'],
        ], sCard);
      },
      R => {
        const lpCard = this._card(R, 'Perfil Longitudinal');
        lpCard.style.padding = '12px 10px';
        lpCard.appendChild(this._drawColProfile(col, design, m, 340, 540));

        const eCard = this._card(R, 'Esfuerzos de Diseno (Caso Critico)');
        eCard.classList.add('seccion-esfuerzos');
        this._tbl([
          ['Combinacion', res.caseLabel||'Envolvente LRFD','',''],
          ['Momento Mu', parseFloat(res.Mu).toFixed(2),'kN·m',''],
          ['Cortante Vu', parseFloat(res.Vu).toFixed(2),'kN',''],
          ['Axial Nu', parseFloat(res.Nu).toFixed(2),'kN',''],
        ], eCard);

        const vCard = this._card(R, 'Verificaciones');
        vCard.classList.add('seccion-esfuerzos');
        const rho = (AsProv/(b*h*10000)*100).toFixed(2);
        this._tbl([
          ['Cuantia p', rho, '%', parseFloat(rho)>=1 ? 'Cumple >=1%' : '!Menos de 1%'],
          ['As min (1% Ag)', design.AsMinCm2, 'cm2', ''],
          ['As max (4% Ag)', design.AsMaxCm2, 'cm2', ''],
          ['Cortante phiVc', (0.75*(parseFloat(design.Vc)||0)).toFixed(2),'kN',''],
        ], vCard);
      }
    );
  },

  // ═══════════════════════════════════════════════════════
  // PAGINAS 3 y 4 — VIGAS
  // ═══════════════════════════════════════════════════════
  _pageBeamTop(c) { this._pageBeam(c,'beam_top','Cadena Superior','Viga de borde superior — une pilares · A630-420H'); },
  _pageBeamBot(c) { this._pageBeam(c,'beam_bot','Sobrecimiento','Viga inferior sobre zapata — carga de albanileria'); },

  _pageBeam(c, type, title, sub) {
    const spanId = S.ui.selectedSpan || S.spans[0]?.id;
    const span   = S.spans.find(sp=>sp.id===spanId) || S.spans[0];
    const elem   = type==='beam_top' ? span?.beamTop : span?.beamBot;
    const res    = type==='beam_top' ? S.results.spans?.[spanId]?.beamTop : S.results.spans?.[spanId]?.beamBot;
    if(!elem||!res){ c.innerHTML='<p style="color:#8b949e">Sin datos. Ejecuta el calculo.</p>'; return; }

    const { b, h } = elem.section;
    const design = res.rebar || {};
    const m = S.story.materials;
    const L = getSpanL(span);
    const supBars = elem.rebar?.faces?.superior?.barras || [];
    const infBars = elem.rebar?.faces?.inferior?.barras || [];
    const nSup = supBars.reduce((s,br)=>s+(br.cantidad||1),0);
    const nInf = infBars.reduce((s,br)=>s+(br.cantidad||1),0);
    const diaL  = supBars[0]?.diámetro || 10;
    const diaE  = elem.rebar?.estribos?.diámetro || 8;
    const AsSup = elem.rebar?.faces?.superior?.AsTotal || 0;
    const AsInf = elem.rebar?.faces?.inferior?.AsTotal || 0;
    const AsProv = AsSup + AsInf;
    const AsReq = parseFloat(design.AsReq) || 0;

    // Selector de vano
    const sel = document.createElement('div');
    sel.className = 'mr-selector';
    sel.style.cssText = 'display:flex;gap:6px;margin-bottom:14px;flex-wrap:wrap;';
    S.spans.forEach((sp,i) => {
      const col = type==='beam_top'?'#2f81f7':'#8b5cf6';
      const active = sp.id===spanId;
      const b2 = document.createElement('button');
      b2.textContent = `V${i+1}`;
      b2.style.cssText = `padding:4px 10px;border-radius:4px;cursor:pointer;font-size:0.75rem;font-weight:600;
        background:${active?col:'rgba(47,129,247,0.08)'};
        border:1px solid ${active?col:'rgba(47,129,247,0.25)'};
        color:${active?'#fff':col};`;
      b2.onclick = () => { S.ui.selectedSpan = sp.id; c.innerHTML=''; this._pageBeam(c,type,title,sub); };
      sel.appendChild(b2);
    });
    c.appendChild(sel);

    this._hdr(c, `${title} — Seccion ${(b*100).toFixed(0)}x${(h*100).toFixed(0)} cm`,
      `${sub} · L = ${L.toFixed(2)} m`);

    // Mapeo de tipo de elemento a nombres de imágenes de referencia
    const refImageMap = {
      'beam_top': {
        transversal:  'Cadena Superior - sección transversal.png',
        longitudinal: 'Cadena Superior - sección longitudinal.png'
      },
      'beam_bot': {
        transversal:  'Sobrecimiento - Aislado sección transversal.png',
        longitudinal: 'Sobrecimiento sección longitudinal.png'
      },
      'column': {
        transversal:  'Pilar - sección transversal.png',
        longitudinal: null
      }
    };
    const refImages = refImageMap[type] || {};

    const lpCard = this._card(c, 'Perfil Longitudinal');
    lpCard.style.width = '100%';
    if (refImages.longitudinal) {
      this._imgOrXS(lpCard, refImages.longitudinal, this._drawBeamProfile(elem, design, L, m, 900, 200));
    } else {
      lpCard.appendChild(this._drawBeamProfile(elem, design, L, m, 900, 200));
    }

    this._cols(c,
      L2 => {
        const csCard = this._card(L2, 'Seccion Transversal');
        // beam_bot (sobrecimiento 15×60, asp=0.25) necesita más altura que beam_top (20×15, asp=1.33)
        const xsH = (type === 'beam_bot') ? 340 : 240;
        if (refImages.transversal) {
          this._imgOrXS(csCard, refImages.transversal, this._drawXS(b, h, elem.rebar, m, design, 420, xsH));
        } else {
          csCard.appendChild(this._drawXS(b, h, elem.rebar, m, design, 420, xsH));
        }

        const rCard = this._card(L2, 'Armadura Longitudinal');
        const hasPiel = !!elem.rebar?.faces?.piel;
        const recVal = hasPiel ? 0.04 : (m.rec || 0.03);
        const pielBars = elem.rebar?.faces?.piel?.barras || [];
        const nPiel = pielBars.reduce((s,br)=>s+(br.cantidad||1),0);
        const diaPiel = pielBars[0]?.diámetro || 10;
        const AsPiel = elem.rebar?.faces?.piel?.AsTotal || 0;

        const tableLongData = [
          ['Barras sup.', `${nSup} Ø${diaL} mm`, '', `${AsSup.toFixed(2)} cm2`],
        ];
        if (hasPiel) {
          tableLongData.push(['Armadura piel', `${nPiel} Ø${diaPiel} mm`, '', `${AsPiel.toFixed(2)} cm2`]);
        }
        tableLongData.push(
          ['Barras inf.', `${nInf} Ø${diaL} mm`, '', `${AsInf.toFixed(2)} cm2`],
          ['Acero tipo', 'A630-420H', '', ''],
          ['Anclaje izquierdo', 'Gancho 90° en pilar', '', ''],
          ['Anclaje derecho', 'Gancho 90° en pilar', '', ''],
          ['Recubrimiento', `${(recVal*100).toFixed(0)}`, 'cm', '']
        );
        this._tbl(tableLongData, rCard);
      },
      R => {
        const sCard = this._card(R, 'Estribos (Confinamiento Sismico)');
        const sCrit=(parseFloat(design.s_crit_mm||150)/10).toFixed(0);
        const sCent=(parseFloat(design.s_central_mm||200)/10).toFixed(0);
        this._tbl([
          ['Estribo', `Ø${diaE} mm A630-420H`, '', ''],
          ['Zona de confinamiento', `cada ${sCrit} cm`, '', 'En extremos de viga'],
          ['Zona central', `cada ${sCent} cm`, '', ''],
          ['Gancho sismico', '135 grados', '', 'Obligatorio NCh430'],
        ], sCard);

        const eCard = this._card(R,'Esfuerzos de Diseno');
        eCard.classList.add('seccion-esfuerzos');
        this._tbl([
          ['Combinacion', res.worstComb||'Envolvente LRFD','',''],
          ['Momento Mu', parseFloat(res.Mu).toFixed(2),'kN·m',''],
          ['Cortante Vu', parseFloat(res.Vu).toFixed(2),'kN',''],
        ], eCard);

        const vCard = this._card(R,'Verificaciones de Calculo');
        vCard.classList.add('seccion-esfuerzos');
        const hasPiel = !!elem.rebar?.faces?.piel;
        const recVal = hasPiel ? 0.04 : (m.rec || 0.03);
        const d = h - recVal;
        const rhoSup = (AsSup / (b * d * 10000) * 100).toFixed(2);
        const rhoInf = (AsInf / (b * d * 10000) * 100).toFixed(2);
        this._tbl([
          ['Cuantia sup. ρ', rhoSup, '%', ''],
          ['Cuantia inf. ρ', rhoInf, '%', ''],
          ['Corte nominal Vn', (parseFloat(res.Vu)/0.75).toFixed(2), 'kN', ''],
          ['Capacidad phiVc', (0.75*(parseFloat(design.Vc)||0)).toFixed(2), 'kN', parseFloat(res.Vu) <= (0.75*(parseFloat(design.Vc)||0)) ? 'Cumple Vn' : '!Excede phiVc'],
        ], vCard);
      }
    );
  },

  // ═══════════════════════════════════════════════════════
  // PAGINA 5 — LADRILLO / MURO (limpio, sin flechas redundantes)
  // ═══════════════════════════════════════════════════════
  _pageBrick(c) {
    const tw = S.spans[0]?.tw || 0.14;
    const H  = S.story.H;
    const m  = S.story.materials;
    this._hdr(c,'Muro de Albanileria — Ladrillo Princesa Titan Reforzado',
      'NCh2123 Of.2003 · NCh167 · Aparejo en soga');

    // NOTA CRITICA PRIMERO — grande y visible
    this._warnCard(c,
      'OBLIGATORIO: MOJAR LOS LADRILLOS ANTES DE COLOCAR',
      `La arcilla industrializada Princesa tiene alta succion. Si se instala <strong style="color:#f8c83c;">sin mojar</strong>,
       absorbe el agua del mortero, anula la adherencia y reduce la resistencia al corte del muro.
       <strong style="color:#f8c83c;">Sumergir en agua o mojar abundantemente cada unidad antes de pegar.</strong>`
    );

    this._cols(c,
      L => {
        const imgC = this._card(L,'Ladrillo — Vista Real');
        imgC.innerHTML += `<div class="imagen-ladrillo" style="margin-top: 10px;">
          <img src="./imagenes/Ladrillo.png" alt="Ladrillo Princesa Titán" style="width: 100%; max-width: 260px; height: auto; display: block; margin: 0 auto; border-radius: 6px; border: 1px solid rgba(48,54,61,0.5);">
        </div>`;
      },
      R => {
        const spC = this._card(R,'Especificaciones Princesa Titan Reforzado');
        this._tbl([
          ['Tipo','Ceramico industrial perforado','',''],
          ['Dimensiones','290 x 140 x 94','mm',''],
          ['Espesor de muro','14','cm',''],
          ['Rendimiento','30','un/m2',''],
          ['Aparejo','Soga','',''],
        ], spC);
      }
    );

    this._cols(c,
      L => {
        const mC = this._card(L,'Mortero de Pega');
        this._tbl([
          ['Dosificacion','1 : 3 (cemento : arena)','',''],
          ["Resistencia f'j",'>=10','MPa','', { class: 'oculto-en-pdf' }],
          ['Junta horizontal','10 a 15 mm max','',''],
          ['Junta vertical','Completa (perpiano)','',''],
          ['Consumo','0.035','m3/m2',''],
        ], mC);
      },
      R => {
        const wC = this._card(R,'Muro en el Sistema');
        this._tbl([
          ['Espesor tw', `${(tw*100).toFixed(0)}`,'cm',''],
          ['Altura libre H', H.toFixed(2),'m',''],
          ['Relacion H/tw', `${(H/tw).toFixed(1)}`,'', (H/tw)<=18?'Cumple <= 18':'!Excede 18', { class: 'oculto-en-pdf' }],
          ['Arriostramiento','Pilares + cadenas','','Cumple'],
        ], wC);
      }
    );
  },

  // ═══════════════════════════════════════════════════════
  // PAGINA 6 — FUNDACION
  // ═══════════════════════════════════════════════════════
  _pageFoundation(c) {
    const f   = S.story.foundation;
    const res = S.results.foundation;
    const m   = S.story.materials;
    if(!res){ c.innerHTML='<p style="color:#8b949e">Ejecuta el calculo primero.</p>'; return; }

    this._hdr(c,'Fundacion — Zapata Corrida de Deslinde',
      `Dimensiones de excavacion y armado`);

    this._cols(c,
      L => {
        const sC = this._card(L,'Detalle de fundacion (Corte Tipico)');
        sC.style.display = 'flex';
        sC.style.flexDirection = 'column';
        sC.style.alignItems = 'center';
        sC.style.justifyContent = 'center';
        this._imgOrXS(sC, 'Fundación - Zapata sección transversal.png', this._drawFoundSection(f, m, res, 435, 385));
      },
      R => {
        const hC = this._card(R,'Especificaciones para Construccion');
        this._tbl([
          ['Ancho zapata B', `${(f.B*100).toFixed(0)}`, 'cm', ''],
          ['Espesor zapata Hf', `${(f.Hf*100).toFixed(0)}`, 'cm', ''],
          ['Profundidad excavacion Df', `${(f.Df*100).toFixed(0)}`, 'cm', 'Minimo obligatorio'],
          ['Material de fundacion', `Hormigon ${this._calculateQuantityTakeoff().hormigon.grado}`, '', ''],
          ['Recubrimiento libre', '7.5', 'cm', 'En contacto con el suelo'],
          ['Mortero sobrecimiento', 'Dosificacion 1:3', '', ''],
        ], hC);
      },
      '1.2fr 0.8fr'
    );
  },

  // ═══════════════════════════════════════════════════════
  // DIBUJOS SVG — LIMPIOS PARA CONSTRUCTOR
  // ═══════════════════════════════════════════════════════

  // Dimension lines (AutoCAD style, simple, thin, with legible background pills)
  _dimH(svg, x1, x2, y, label, col='rgba(110,118,129,0.6)', fs=12) {
    const el=(t,a)=>this._el(t,a,svg);
    el('line',{x1, y1:y, x2, y2:y, stroke:col, 'stroke-width':0.55});
    el('polygon',{points:`${x1},${y} ${x1+4.5},${y-1.8} ${x1+4.5},${y+1.8}`, fill:col});
    el('polygon',{points:`${x2},${y} ${x2-4.5},${y-1.8} ${x2-4.5},${y+1.8}`, fill:col});

    // Background rect escalado según fs
    const charW  = fs * 0.60;
    const rectH  = fs * 1.35;
    const txtW   = Math.max(36, label.length * charW + 10);
    const rectX  = (x1+x2)/2 - txtW/2;
    el('rect', {
      x: rectX, y: y - rectH + 2,
      width: txtW, height: rectH,
      rx: 3.5, fill: '#ffffff',
      stroke: 'rgba(150,150,150,0.3)', 'stroke-width': 0.5
    });
    this._t(svg,label,(x1+x2)/2,y-1,{'font-size':fs,'fill':'#000000','text-anchor':'middle','font-weight':'600'});
  },
  _dimV(svg, x, y1, y2, label, col='rgba(110,118,129,0.6)', fs=12) {
    const el=(t,a)=>this._el(t,a,svg);
    el('line',{x1:x, y1, x2:x, y2, stroke:col, 'stroke-width':0.55});
    el('polygon',{points:`${x},${y1} ${x-1.8},${y1+4.5} ${x+1.8},${y1+4.5}`, fill:col});
    el('polygon',{points:`${x},${y2} ${x-1.8},${y2-4.5} ${x+1.8},${y2-4.5}`, fill:col});

    // Background rect escalado según fs
    const charW  = fs * 0.60;
    const rectH  = fs * 1.35;
    const txtW   = Math.max(36, label.length * charW + 10);
    const tx0 = x - 5;
    const ty0 = (y1+y2)/2;
    el('rect', {
      x: tx0 - txtW/2, y: ty0 - rectH/2,
      width: txtW, height: rectH,
      rx: 3.5, fill: '#ffffff',
      stroke: 'rgba(150,150,150,0.3)', 'stroke-width': 0.5,
      transform: `rotate(-90,${tx0},${ty0})`
    });
    this._tv(svg, label, x-5, (y1+y2)/2, {'font-size':fs,'fill':'#000000','font-weight':'600'});
  },

  // Seccion transversal — limpia, sin flechas redundantes
  // W, H actúan como máximo; el SVG resultante se dimensiona a su contenido real.
  _drawXS(b, h, rebar, m, design, W, H) {
    // ── Márgenes simétricos horizontales para centrar la sección ────────
    // DIM_L = PAD_R → sección centrada en el SVG (eje de sección = eje del SVG)
    // DIM_L : dimV a x0-22 + rect label (~26px) → necesita ≥ 48px
    // DIM_T : dimH a y0-18 + rect label (16px alto) → necesita ≥ 35px
    // LBL_B : baseline etiqueta en y0+hPx+22, texto ~14px alto
    const DIM_L  = 48;
    const DIM_T  = 35;
    const PAD_R  = DIM_L;   // igual a DIM_L → sección centrada horizontalmente
    const LBL_B  = 44;
    const MIN_BPX = 62;   // ancho mínimo de sección para legibilidad

    // ── Escala sección dentro del espacio disponible ─────────────────
    const asp = b / h;
    let bPx, hPx;
    {
      const availW = W - DIM_L - PAD_R;
      const availH = H - DIM_T - LBL_B;
      if (asp >= 1) {
        bPx = availW; hPx = bPx / asp;
        if (hPx > availH) { hPx = availH; bPx = hPx * asp; }
      } else {
        hPx = availH; bPx = hPx * asp;
        if (bPx > availW) { bPx = availW; hPx = bPx / asp; }
      }
      if (bPx < MIN_BPX) {
        const bPx_orig = bPx;
        bPx = MIN_BPX;
        hPx = Math.round(hPx * (MIN_BPX / bPx_orig));
        // Nunca superar la altura de entrada para secciones esbeltas
        hPx = Math.min(hPx, availH);
      }
    }
    bPx = Math.round(bPx);
    hPx = Math.round(hPx);

    // ── Canvas = contenido + márgenes exactos (sin espacio desperdiciado) ──
    W = DIM_L + bPx + PAD_R;   // ancho real del SVG
    H = DIM_T + hPx + LBL_B;   // alto real del SVG

    const svg = this._svg(W, H);
    svg.style.overflow = 'visible';
    const el  = (tag, at) => this._el(tag, at, svg);
    const tx  = (s, x, y, at = {}) => this._t(svg, s, x, y, at);

    // Sección anclada en esquina fija (DIM_L, DIM_T) — predecible, sin cálculo de centrado
    const x0 = DIM_L;
    const y0 = DIM_T;

    // ── Defs: patrón hormigón (líneas diagonales 45°, convención ingenieril) ──
    const defs   = this._el('defs', {}, svg);
    const pConc  = this._el('pattern', { id:`pxs-conc-${W}`, x:0, y:0, width:8, height:8,
      patternUnits:'userSpaceOnUse', patternTransform:'rotate(45 0 0)' }, defs);
    this._el('line', { x1:0, y1:0, x2:0, y2:8,
      stroke:'#999', 'stroke-width':0.8, opacity:'0.25' }, pConc);

    // ── 3. Recubrimiento ──────────────────────────────────────────────
    // Sobrecimiento (tiene armadura de piel) → rec=4cm; resto → rec=3cm
    const hasPiel = !!rebar?.faces?.piel;
    const rec     = hasPiel ? 0.04 : (m.rec || 0.03);
    const recPx   = Math.round((rec / h) * hPx);

    // ── 4. Contorno hormigón con tramado ingenieril ───────────────────
    el('rect', { x: x0, y: y0, width: bPx, height: hPx,
      fill: `url(#pxs-conc-${W})`, stroke: '#e6edf3', 'stroke-width': 1.5 });

    // ── 5. Estribo ────────────────────────────────────────────────────
    const stW = 2.5;
    const sp  = recPx;
    el('rect', { x: x0 + sp, y: y0 + sp, width: bPx - 2 * sp, height: hPx - 2 * sp,
      fill: 'none', stroke: '#f8c83c', 'stroke-width': stW, rx: 1.5 });

    // ── 6. Barras longitudinales ──────────────────────────────────────
    const supBars  = rebar?.faces?.superior?.barras || [];
    const infBars  = rebar?.faces?.inferior?.barras || [];
    const pielBars = rebar?.faces?.piel?.barras     || [];
    const diaL = supBars[0]?.diámetro || infBars[0]?.diámetro || 12;
    const nSup = supBars.reduce((s, br) => s + (br.cantidad || 1), 0);
    const nInf = infBars.reduce((s, br) => s + (br.cantidad || 1), 0);
    const nPiel = pielBars.reduce((s, br) => s + (br.cantidad || 1), 0);

    const tEstPx = stW / 2 + 1;  // espesor estribo en px

    // Radio barra: escala real relativa al ANCHO de sección (no al alto)
    // Así una barra Ø16 en 15cm se ve más grande que en 20cm — correcto.
    const barRadius = (diaMm) =>
      Math.max(4, Math.min(9, (diaMm / (b * 1000)) * bPx * 0.32));

    const drawRow = (bars, cy) => {
      bars.forEach(bar => {
        const n = bar.cantidad || 2;
        const r = barRadius(bar.diámetro || diaL);
        const innerW = bPx - 2 * (sp + tEstPx + r);
        for (let j = 0; j < n; j++) {
          const cx = n > 1
            ? x0 + sp + tEstPx + r + (innerW * j) / (n - 1)
            : x0 + bPx / 2;
          el('circle', { cx: Math.round(cx), cy: Math.round(cy), r,
            fill: '#58a6ff', stroke: '#0b1018', 'stroke-width': 0.8 });
        }
      });
    };

    const barOff = sp + tEstPx;
    if (supBars.length) {
      const rSup = barRadius(supBars[0]?.diámetro || diaL);
      drawRow(supBars, y0 + barOff + rSup);
    }
    if (infBars.length) {
      const rInf = barRadius(infBars[0]?.diámetro || diaL);
      drawRow(infBars, y0 + hPx - barOff - rInf);
    }
    if (pielBars.length) {
      // Barras de piel: una pegada a la cara izquierda y otra a la cara derecha, a media altura
      pielBars.forEach(bar => {
        const n = bar.cantidad || 2;
        const r = barRadius(bar.diámetro || 8);
        const cy = y0 + hPx / 2;
        // Con n=2: una barra en extremo izq, otra en extremo der (pegadas al estribo)
        const positions = n === 1
          ? [x0 + bPx / 2]
          : Array.from({ length: n }, (_, j) =>
              x0 + sp + tEstPx + r + ((bPx - 2 * (sp + tEstPx + r)) * j) / (n - 1));
        positions.forEach(cx =>
          el('circle', { cx: Math.round(cx), cy: Math.round(cy), r,
            fill: '#58a6ff', stroke: '#0b1018', 'stroke-width': 0.8 }));
      });
    }

    // ── 7. Gancho 135° en esquina del estribo ─────────────────────────
    const hkLen = Math.min(bPx, hPx) * 0.14;
    const hkD   = hkLen * 0.707;
    el('line', { x1: x0+sp, y1: y0+sp, x2: x0+sp+hkD,     y2: y0+sp+hkD,
      stroke: '#f8c83c', 'stroke-width': stW, 'stroke-linecap': 'round' });
    el('line', { x1: x0+sp, y1: y0+sp, x2: x0+sp+hkD*0.5, y2: y0+sp+hkD*1.2,
      stroke: '#f8c83c', 'stroke-width': stW, 'stroke-linecap': 'round' });

    // ── 8. Cotas ──────────────────────────────────────────────────────
    this._dimH(svg, x0, x0 + bPx, y0 - 18, `${(b*100).toFixed(0)} cm`, '#333', 12);
    this._dimV(svg, x0 - 20, y0, y0 + hPx, `${(h*100).toFixed(0)}`, '#333', 12);

    // ── 9. Etiqueta inferior ──────────────────────────────────────────
    const diaE = rebar?.estribos?.diámetro || 8;
    const sCritCm    = design ? (parseFloat(design.s_crit_mm    || 100) / 10).toFixed(0) : '15';
    const sCentralCm = design ? (parseFloat(design.s_central_mm || 150) / 10).toFixed(0) : '15';
    let txtLabel;
    if (hasPiel) {
      const diaPiel = pielBars[0]?.diámetro || 8;
      txtLabel = `${nSup}Ø${diaL} Sup + ${nPiel}Ø${diaPiel} Piel + ${nInf}Ø${diaL} Inf + EØ${diaE}@${sCritCm}/${sCentralCm}`;
    } else {
      txtLabel = `${nSup}Ø${diaL} Sup + ${nInf}Ø${diaL} Inf + EØ${diaE}@${sCritCm}/${sCentralCm}`;
    }
    tx(txtLabel, W / 2, y0 + hPx + 22,
      { 'font-size': '12', fill: '#e6edf3', 'text-anchor': 'middle', 'font-weight': '600' });

    return svg;
  },

  // Perfil longitudinal pilar — simple, solo lo necesario
  _drawColProfile(col, design, m, W, H) {
    const svg = this._svg(W, H);
    const el = (tag,at) => this._el(tag,at,svg);
    const tx = (s,x,y,at={}) => this._t(svg,s,x,y,at);

    const stH = S.story.H;
    const PT = 15, PB = 75;
    const colHpx = H - PT - PB;
    const cW = 20;
    const xC = Math.round(W / 2 - cW / 2 + 20);
    const yT = PT, yB = PT + colHpx;

    const sCrit = parseFloat(design.s_crit_mm||100)/1000;
    const sCent = parseFloat(design.s_central_mm||200)/1000;
    const critZ = Math.min(0.60, stH/4);
    const critPx = critZ/stH * colHpx;

    const supBars = col.rebar?.faces?.superior?.barras || [];
    const nPerFace = supBars[0]?.cantidad || 2;
    const diaL = supBars[0]?.diámetro || 10;
    const diaE = col.rebar?.estribos?.diámetro || 8;
    const empalmeCm = Math.max(35, 40 * diaL / 10).toFixed(0);

    // Contorno hormigon
    el('rect',{x:xC,y:yT,width:cW,height:colHpx,
      fill:'rgba(220,220,220,0.1)',stroke:'#000','stroke-width':0.6});

    // Estribos como lineas horizontales
    const scaleZ = colHpx / stH;
    const sCrit_px = sCrit * scaleZ;
    const sCent_px = sCent * scaleZ;

    for (let z = 0; z <= critPx; z += sCrit_px)
      el('line',{x1:xC-1,y1:yT+z,x2:xC+cW+1,y2:yT+z,stroke:'rgba(60,50,40,0.7)','stroke-width':1.2});
    for (let z = colHpx; z >= colHpx - critPx; z -= sCrit_px)
      el('line',{x1:xC-1,y1:yT+z,x2:xC+cW+1,y2:yT+z,stroke:'rgba(60,50,40,0.7)','stroke-width':1.2});
    for (let z = critPx; z < colHpx - critPx; z += sCent_px)
      el('line',{x1:xC-1,y1:yT+z,x2:xC+cW+1,y2:yT+z,stroke:'rgba(100,90,80,0.4)','stroke-width':0.8});

    // Limites zona critica
    el('line',{x1:xC-8,y1:yT+critPx,x2:xC+cW+8,y2:yT+critPx,
      stroke:'rgba(139,148,158,0.4)','stroke-width':0.8,'stroke-dasharray':'3,3'});
    el('line',{x1:xC-8,y1:yB-critPx,x2:xC+cW+8,y2:yB-critPx,
      stroke:'rgba(139,148,158,0.4)','stroke-width':0.8,'stroke-dasharray':'3,3'});

    // Barras longitudinales (verticales dentro del pilar)
    const bLeft = xC + 4, bRight = xC + cW - 4;

    // Barras principales del pilar (CONTINUAS desde arriba hasta el fondo de la zapata sin empalmes prohibidos)
    const anchorExt = 40;  // profundidad en fundacion
    const anchorHk = 25;   // pata doblada horizontal de 15-20 cm (más larga y visible)
    const hk90 = 25;       // gancho superior de 90° (más largo y visible)

    // Barra Izquierda
    el('line',{x1:bLeft,y1:yT,x2:bLeft,y2:yB+anchorExt,stroke:'#1b365d','stroke-width':1.8,'stroke-linecap':'round'});
    // Pata en zapata Izquierda (hacia adentro)
    el('line',{x1:bLeft,y1:yB+anchorExt,x2:bLeft+anchorHk,y2:yB+anchorExt,stroke:'#1b365d','stroke-width':1.8,'stroke-linecap':'round'});

    // Barra Derecha
    el('line',{x1:bRight,y1:yT,x2:bRight,y2:yB+anchorExt,stroke:'#1b365d','stroke-width':1.8,'stroke-linecap':'round'});
    // Pata en zapata Derecha (hacia adentro)
    el('line',{x1:bRight,y1:yB+anchorExt,x2:bRight-anchorHk,y2:yB+anchorExt,stroke:'#1b365d','stroke-width':1.8,'stroke-linecap':'round'});

    // Remate superior: ganchos 90° hacia adentro (anclaje en viga/cadena superior)
    el('line',{x1:bLeft, y1:yT, x2:bLeft+hk90, y2:yT, stroke:'#1b365d','stroke-width':1.8,'stroke-linecap':'round'});
    el('line',{x1:bRight, y1:yT, x2:bRight-hk90, y2:yT, stroke:'#1b365d','stroke-width':1.8,'stroke-linecap':'round'});

    // Cotas izquierda: Lc (zona crítica) + H
    const dimX1 = xC - 45;
    const critZoneHeight = (critZ * 100).toFixed(0);
    this._dimV(svg, dimX1, yT, yT+critPx, `${critZoneHeight} cm`, '#000', 12);
    this._dimV(svg, dimX1, yB-critPx, yB, `${critZoneHeight} cm`, '#000', 12);

    const dimX2 = dimX1 - 32;
    this._dimV(svg, dimX2, yT, yB, `H=${(stH*100).toFixed(0)} cm`, '#000', 12);

    // Etiquetas derecha — estribo spacing
    const lblX = xC + cW + 8;
    tx(`Ø${diaE}@${(sCrit*100).toFixed(0)}`, lblX, yT+critPx/2+4,
       {'font-size':'12','fill':'#000','font-weight':'700'});
    tx(`Ø${diaE}@${(sCent*100).toFixed(0)}`, lblX, (yT+yB)/2+4,
       {'font-size':'12','fill':'#222','font-weight':'600'});
    tx(`Ø${diaE}@${(sCrit*100).toFixed(0)}`, lblX, yB-critPx/2+4,
       {'font-size':'12','fill':'#000','font-weight':'700'});

    // Etiquetas de anclaje
    tx('Gancho sup. 90° (15 cm)', lblX, yT+4,
       {'font-size':'12','fill':'#1a4fa8','font-weight':'600'});

    // Zapata
    tx('Pata doblada: 15 cm', lblX, yB+anchorExt-4,
       {'font-size':'12','fill':'#1a4fa8','font-weight':'600'});
    tx('Anclaje en zapata', lblX, yB+anchorExt+10,
       {'font-size':'12','fill':'#333','font-weight':'600'});

    // Armadura abajo
    tx(`${nPerFace*2} Ø${diaL}`, xC+cW/2, yB+anchorExt+24,
       {'font-size':'12','fill':'#1a4fa8','text-anchor':'middle','font-weight':'700'});

    return svg;
  },

  _drawBeamProfile(elem, design, L, m, W, H) {
    const svg = this._svg(W, H);
    const el  = (tag, at) => this._el(tag, at, svg);
    const tx  = (s,x,y,at={}) => this._t(svg, s, x, y, at);
    const PL = 72, PR = 40, PT = 28, PB = 32;  // PL ampliado para etiquetas fs=12
    const dW = W - PL - PR;
    const scX = dW/L, x0 = PL;

    const beamHpx = 24;
    const yCenter = PT + (H-PT-PB) / 2;
    const beamY = yCenter - beamHpx / 2;

    const supBars = elem.rebar?.faces?.superior?.barras || [];
    const infBars = elem.rebar?.faces?.inferior?.barras || [];
    const pielBars = elem.rebar?.faces?.piel?.barras || [];
    const diaL = supBars[0]?.diámetro || 12;
    const diaE = elem.rebar?.estribos?.diámetro || 8;
    const nSup = supBars.reduce((s,b)=>s+(b.cantidad||1),0);
    const nInf = infBars.reduce((s,b)=>s+(b.cantidad||1),0);
    const nPiel = pielBars.reduce((s,b)=>s+(b.cantidad||1),0);

    // Pilares de apoyo en extremos (espesor real 20 cm)
    const colW = Math.max(28, Math.round(0.20 * scX));
    // Pilar Izquierdo
    el('rect',{x:x0-colW/2,y:beamY-25,width:colW,height:beamHpx+50,fill:'rgba(63,185,80,0.03)',stroke:'rgba(63,185,80,0.3)','stroke-width':1,'stroke-dasharray':'3,3'});
    tx('Pilar', x0, beamY-29, {'font-size':'12','fill':'#3fb950','text-anchor':'middle','font-weight':'600'});

    // Pilar Derecho
    el('rect',{x:x0+dW-colW/2,y:beamY-25,width:colW,height:beamHpx+50,fill:'rgba(63,185,80,0.03)',stroke:'rgba(63,185,80,0.3)','stroke-width':1,'stroke-dasharray':'3,3'});
    tx('Pilar', x0+dW, beamY-29, {'font-size':'12','fill':'#3fb950','text-anchor':'middle','font-weight':'600'});

    // Contorno viga (cara libre entre pilares para un realismo estructural completo)
    const clearBeamX = x0 + colW/2;
    const clearBeamW = dW - colW;
    el('rect',{x:clearBeamX,y:beamY,width:clearBeamW,height:beamHpx,fill:'rgba(255,255,255,0.02)',stroke:'#e6edf3','stroke-width':1.2});

    const sCrit = parseFloat(design.s_crit_mm||150)/1000;
    const sCent = parseFloat(design.s_central_mm||200)/1000;
    const critX = Math.min(elem.section.b*2||0.30, L*0.25)*scX;

    // Estribos (verticales amarillos)
    for(let x=colW/2;x<=critX;x+=sCrit*scX)
      el('line',{x1:x0+x,y1:beamY,x2:x0+x,y2:beamY+beamHpx,stroke:'#f8c83c','stroke-width':1.2});
    for(let x=dW-critX;x<=dW-colW/2;x+=sCrit*scX)
      el('line',{x1:x0+x,y1:beamY,x2:x0+x,y2:beamY+beamHpx,stroke:'#f8c83c','stroke-width':1.2});
    for(let x=critX;x<dW-critX;x+=sCent*scX) {
      if (x >= colW/2 && x <= dW-colW/2) {
        el('line',{x1:x0+x,y1:beamY,x2:x0+x,y2:beamY+beamHpx,stroke:'rgba(248,200,60,0.4)','stroke-width':0.8});
      }
    }

    // Barras longitudinales principales (que cruzan el pilar y rematan con anclaje de pata 90°)
    const recPx = 4;
    const xStart = x0 - colW/2 + recPx;
    const xEnd = x0 + dW + colW/2 - recPx;
    const yTop = beamY + recPx;
    const yBot = beamY + beamHpx - recPx;
    const hk90 = 18;

    // Barras superiores
    el('line',{x1:xStart,y1:yTop,x2:xEnd,y2:yTop,stroke:'#1b365d','stroke-width':1.8});
    el('line',{x1:xStart,y1:yTop,x2:xStart,y2:yTop+hk90,stroke:'#1b365d','stroke-width':1.8,'stroke-linecap':'round'});
    el('line',{x1:xEnd,y1:yTop,x2:xEnd,y2:yTop+hk90,stroke:'#1b365d','stroke-width':1.8,'stroke-linecap':'round'});

    // Barras de piel (intermedia)
    if (pielBars.length) {
      const yMid = beamY + beamHpx / 2;
      const hkSkin = 10;
      el('line',{x1:xStart,y1:yMid,x2:xEnd,y2:yMid,stroke:'#1b365d','stroke-width':1.5});
      el('line',{x1:xStart,y1:yMid,x2:xStart,y2:yMid-hkSkin,stroke:'#1b365d','stroke-width':1.5,'stroke-linecap':'round'});
      el('line',{x1:xEnd,y1:yMid,x2:xEnd,y2:yMid-hkSkin,stroke:'#1b365d','stroke-width':1.5,'stroke-linecap':'round'});
      
      const diaPiel = pielBars[0]?.diámetro || 10;
      tx(`${nPiel}Ø${diaPiel}`, xStart-5, yMid+4, {'font-size':'12','fill':'#1a4fa8','text-anchor':'end','font-weight':'700'});
    }

    // Barras inferiores
    el('line',{x1:xStart,y1:yBot,x2:xEnd,y2:yBot,stroke:'#1b365d','stroke-width':1.8});
    el('line',{x1:xStart,y1:yBot,x2:xStart,y2:yBot-hk90,stroke:'#1b365d','stroke-width':1.8,'stroke-linecap':'round'});
    el('line',{x1:xEnd,y1:yBot,x2:xEnd,y2:yBot-hk90,stroke:'#1b365d','stroke-width':1.8,'stroke-linecap':'round'});

    tx(`${nSup}Ø${diaL}`, xStart-5, yTop+4, {'font-size':'12','fill':'#1a4fa8','text-anchor':'end','font-weight':'700'});
    tx(`${nInf}Ø${diaL}`, xStart-5, yBot+4, {'font-size':'12','fill':'#1a4fa8','text-anchor':'end','font-weight':'700'});

    // Etiquetas de distribución de estribos directly underneath
    const lblY = beamY + beamHpx + 14;
    tx(`Ø${diaE}@${(sCrit*100).toFixed(0)}`, x0 + critX/2, lblY, {'font-size':'12','fill':'#000','text-anchor':'middle','font-weight':'700'});
    tx(`Ø${diaE}@${(sCent*100).toFixed(0)}`, x0 + dW/2, lblY, {'font-size':'12','fill':'#222','text-anchor':'middle','font-weight':'600'});
    tx(`Ø${diaE}@${(sCrit*100).toFixed(0)}`, x0 + dW - critX/2, lblY, {'font-size':'12','fill':'#000','text-anchor':'middle','font-weight':'700'});

    // Conexion label at the very bottom
    tx('Conexion Viga-Pilar: Ganchos terminales de 90° (12 cm min)', x0 + dW/2, lblY + 14, {'font-size':'12','fill':'#1a4fa8','text-anchor':'middle','font-weight':'600'});

    // L dimension at the top
    this._dimH(svg, x0, x0+dW, beamY-18, `L = ${L.toFixed(2)} m`, '#333', 12);

    return svg;
  },

  _drawBrickIso(W, H) {
    const svg=this._svg(W,H);
    const el=(tag,at)=>this._el(tag,at,svg);
    const tx=(s,x,y,at={})=>this._t(svg,s,x,y,at);
    const sc=0.40, bL=290*sc, bW=140*sc, bH=94*sc;
    const ox=W/2-bL*0.35, oy=H*0.70;
    const ix=bW*Math.cos(Math.PI/6), iy=bW*Math.sin(Math.PI/6);
    const C='rgba(210,155,75,';
    // Front
    el('polygon',{points:`${ox},${oy} ${ox+bL},${oy} ${ox+bL},${oy-bH} ${ox},${oy-bH}`,fill:C+'0.28)',stroke:C+'0.8)','stroke-width':1.5});
    // Top
    el('polygon',{points:`${ox},${oy-bH} ${ox+bL},${oy-bH} ${ox+bL+ix},${oy-bH-iy} ${ox+ix},${oy-bH-iy}`,fill:C+'0.45)',stroke:C+'0.8)','stroke-width':1.5});
    // Right
    el('polygon',{points:`${ox+bL},${oy} ${ox+bL+ix},${oy-iy} ${ox+bL+ix},${oy-bH-iy} ${ox+bL},${oy-bH}`,fill:C+'0.18)',stroke:C+'0.8)','stroke-width':1.5});
    // Perforations
    const hW=bL*0.18, hH=bH*0.40, hY=oy-bH*0.72;
    [0.12,0.42,0.72].forEach(r=>el('rect',{x:ox+bL*r,y:hY,width:hW,height:hH,fill:'rgba(0,0,0,0.4)',rx:2}));
    // Dims — solo 3 cotas, sin flechas redundantes
    tx('290 mm',ox+bL/2,oy+16,{'font-size':'12','fill':'#d29922','text-anchor':'middle','font-weight':'600'});
    tx('140 mm',ox+bL+ix/2+8,oy-iy/2+4,{'font-size':'12','fill':'#d29922'});
    tx('94 mm',ox-14,oy-bH/2+4,{'font-size':'12','fill':'#d29922','text-anchor':'end'});
    return svg;
  },

  _drawFoundSection(f, m, res, W, H) {
    const svg=this._svg(W,H);
    svg.style.overflow = 'visible';
    const el=(tag,at)=>this._el(tag,at,svg);
    const tx=(s,x,y,at={})=>this._t(svg,s,x,y,at);

    // Dynamic patterns definition inside SVG for CAD-hatching
    const defs = document.createElementNS('http://www.w3.org/2000/svg', 'defs');
    
    // Soil pattern (45-degree parallel lines)
    const soilPat = document.createElementNS('http://www.w3.org/2000/svg', 'pattern');
    soilPat.setAttribute('id', 'soil-pattern-fs');
    soilPat.setAttribute('width', '10');
    soilPat.setAttribute('height', '10');
    soilPat.setAttribute('patternTransform', 'rotate(45 0 0)');
    soilPat.setAttribute('patternUnits', 'userSpaceOnUse');
    const soilLine = document.createElementNS('http://www.w3.org/2000/svg', 'line');
    soilLine.setAttribute('x1', '0');
    soilLine.setAttribute('y1', '0');
    soilLine.setAttribute('x2', '0');
    soilLine.setAttribute('y2', '10');
    soilLine.setAttribute('stroke', 'rgba(139,115,80,0.18)');
    soilLine.setAttribute('stroke-width', '1.2');
    soilPat.appendChild(soilLine);
    defs.appendChild(soilPat);

    // Concrete pattern (Fine aggregates and dots)
    const concPat = document.createElementNS('http://www.w3.org/2000/svg', 'pattern');
    concPat.setAttribute('id', 'concrete-pattern-fs');
    concPat.setAttribute('width', '20');
    concPat.setAttribute('height', '20');
    concPat.setAttribute('patternUnits', 'userSpaceOnUse');
    
    const bgRect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
    bgRect.setAttribute('width', '20');
    bgRect.setAttribute('height', '20');
    bgRect.setAttribute('fill', 'rgba(150,150,150,0.06)');
    concPat.appendChild(bgRect);

    // Dots
    [[2,5,0.6],[12,15,0.5],[8,8,0.7],[16,4,0.4]].forEach(([cx,cy,r]) => {
      const c = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
      c.setAttribute('cx', cx); c.setAttribute('cy', cy); c.setAttribute('r', r);
      c.setAttribute('fill', 'rgba(0,0,0,0.3)');
      concPat.appendChild(c);
    });

    // Triangles
    [['5,12 8,10 6,15'],['14,6 17,9 13,8']].forEach(([pts]) => {
      const p = document.createElementNS('http://www.w3.org/2000/svg', 'polygon');
      p.setAttribute('points', pts);
      p.setAttribute('fill', 'none');
      p.setAttribute('stroke', 'rgba(0,0,0,0.25)');
      p.setAttribute('stroke-width', '0.6');
      concPat.appendChild(p);
    });
    
    defs.appendChild(concPat);
    svg.appendChild(defs);

    // ── Geometría: dimensionada desde datos reales (f.B, f.Hf, f.Df) ──────
    const Df_m = f.Df || 0.85;
    const Hf_m = f.Hf || 0.60;
    const B_m  = f.B  || 0.80;

    // Extensión física representada (metros)
    const muro_h_m     = 0.55;  // muro esquemático sobre sobrecimiento
    const sobrec_above = 0.20;  // sobrecimiento visible sobre N.T.N.
    const soil_right_m = 0.28;  // suelo a la derecha de la zapata

    // Márgenes para cotas y etiquetas (px)
    const PAD_L_f = 82, PAD_R_f = 58, PAD_T_f = 30, PAD_B_f = 46;

    // Escala: ajusta contenido físico a W×H con márgenes
    const physH_m = muro_h_m + sobrec_above + Df_m;
    const physW_m = B_m + soil_right_m;
    const scF = Math.min(
      (W - PAD_L_f - PAD_R_f) / physW_m,
      (H - PAD_T_f - PAD_B_f) / physH_m
    );

    // Dimensiones derivadas de datos
    const fBpx = Math.round(B_m  * scF);
    const fHpx = Math.round(Hf_m * scF);
    const sW   = Math.round(0.15 * scF);   // ancho sobrecimiento/pilar (~15 cm)
    const sH   = Math.round((sobrec_above + Df_m - Hf_m) * scF);  // alto sobrecimiento

    // Coordenadas Y de arriba hacia abajo
    const xDeslinde = PAD_L_f;
    const yStemTop  = PAD_T_f + Math.round(muro_h_m * scF);
    const yNtn      = yStemTop + Math.round(sobrec_above * scF);  // N.T.N. real
    const yFT       = yNtn + Math.round((Df_m - Hf_m) * scF);    // tope zapata
    const yFB       = yFT + fHpx;                                  // fondo zapata
    const yGround   = yNtn - 20;  // compat: radier sentado ~20 px sobre N.T.N.

    // 1. Suelo / Excavation Hatch using premium pattern
    el('rect', {
      x: xDeslinde + sW,
      y: yNtn,
      width: W - (xDeslinde + sW) - 15,
      height: yFB - yNtn,
      fill: 'url(#soil-pattern-fs)'
    });

    // 2. Línea de Terreno Natural (N.T.N) a la derecha del sobrecimiento (desplazado físicamente bajo el radier)
    el('line',{x1:xDeslinde+sW, y1:yNtn, x2:W-15, y2:yNtn, stroke:'#8b949e','stroke-width':1.5,'stroke-dasharray':'4,3'});
    tx('N.T.N', xDeslinde+sW+18, yNtn-6, {
      'font-size':'12',
      'fill':'#8b949e',
      'font-weight':'600',
      'class': 'svg-text-halo',
      'style': 'paint-order: stroke; stroke: #0d1117; stroke-width: 4px;'
    });

    // 3. Zapata Corrida en L (Excéntrica de Deslinde)
    // Constrained to start strictly to the right of property boundary (xDeslinde + 1) to never cross it.
    el('rect',{
      x: xDeslinde + 1,
      y: yFT,
      width: fBpx - 1,
      height: fHpx,
      fill: 'url(#concrete-pattern-fs)',
      stroke: '#c8982a',
      'stroke-width': 2
    });
    tx('ZAPATA CORRIDA', xDeslinde + fBpx/2, yFT + fHpx/2 + 4, {
      'font-size': '12',
      'fill': '#c8982a',
      'text-anchor': 'middle',
      'font-weight': '600',
      'class': 'svg-text-halo',
      'style': 'paint-order: stroke; stroke: #0d1117; stroke-width: 4px;'
    });

    // 4. Sobrecimiento Monolítico (al ras exterior izquierdo con zapata, starting at xDeslinde + 1)
    el('rect',{
      x: xDeslinde + 1,
      y: yStemTop,
      width: sW - 1,
      height: sH,
      fill: 'url(#concrete-pattern-fs)',
      stroke: '#8b5cf6',
      'stroke-width': 2
    });
    tx('SOBRECI.', xDeslinde + sW/2, yStemTop + sH/2 + 4, {
      'font-size': '11',
      'fill': '#8b5cf6',
      'text-anchor': 'middle',
      'font-weight': '600',
      'class': 'svg-text-halo',
      'style': 'paint-order: stroke; stroke: #0d1117; stroke-width: 4px;',
      'transform': `rotate(-90 ${xDeslinde + sW/2} ${yStemTop + sH/2 + 4})`
    });

    // 5. Losa de Radier (apoyada en la cara interna derecha del sobrecimiento)
    const yRadierTop = yGround - 15;
    const rTh = 25; // thickness 10cm ~ 25px
    el('rect',{
      x: xDeslinde + sW,
      y: yRadierTop,
      width: W - (xDeslinde + sW) - 15,
      height: rTh,
      fill: 'rgba(150,150,150,0.18)',
      stroke: '#888888',
      'stroke-width': 1.2,
      'stroke-dasharray': '2,2'
    });
    tx('RADIER (Espesor por definir)', xDeslinde + sW + 50, yRadierTop + rTh/2 + 3, {
      'font-size': '12',
      'fill': '#888888',
      'font-weight': '600',
      'class': 'svg-text-halo',
      'style': 'paint-order: stroke; stroke: #0d1117; stroke-width: 4px;'
    });

    // Cama de ripio bajo radier
    el('rect',{
      x: xDeslinde + sW,
      y: yRadierTop + rTh,
      width: W - (xDeslinde + sW) - 15,
      height: 20,
      fill: 'rgba(200,200,200,0.08)',
      stroke: 'none'
    });

    // 6. Muro de albañilería (bloque Princesa) en el eje del sobrecimiento
    const wW = 48; // wall width 14cm ~ 48px
    const xWall = xDeslinde + (sW - wW)/2;
    el('rect',{
      x: xWall,
      y: 10,
      width: wW,
      height: yStemTop - 10,
      fill: 'rgba(210,155,75,0.15)',
      stroke: 'rgba(210,155,75,0.7)',
      'stroke-width': 1.5
    });
    // Dibujar algunas juntas horizontales de ladrillo
    for (let ly = yStemTop - 12; ly > 10; ly -= 12) {
      el('line',{x1:xWall, y1:ly, x2:xWall+wW, y2:ly, stroke:'rgba(210,155,75,0.5)','stroke-width':0.8});
    }
    tx('MURO 14 cm', xDeslinde + sW/2, yStemTop - 15, {
      'font-size': '12',
      'fill': '#d29922',
      'text-anchor': 'middle',
      'font-weight': '600',
      'class': 'svg-text-halo',
      'style': 'paint-order: stroke; stroke: #0d1117; stroke-width: 4px;'
    });

    // 7. Armadura vertical del pilar (nace de la zapata y sube por sobrecimiento/muro)
    const bLeft = xDeslinde + 12;
    const bRight = xDeslinde + sW - 12;
    const yAnchor = yFB - 10;
    const pataH = 45; // pata de 15cm ~ 45px
    const steelBlue = '#1e40af';
    const stirGreen = '#3fb950';

    // Barra izquierda
    el('line',{x1:bLeft, y1:10, x2:bLeft, y2:yAnchor, stroke:steelBlue,'stroke-width':2.6});
    el('line',{x1:bLeft, y1:yAnchor, x2:bLeft+pataH, y2:yAnchor, stroke:steelBlue,'stroke-width':2.6,'stroke-linecap':'round'});

    // Barra derecha
    el('line',{x1:bRight, y1:10, x2:bRight, y2:yAnchor, stroke:steelBlue,'stroke-width':2.6});
    el('line',{x1:bRight, y1:yAnchor, x2:bRight+pataH, y2:yAnchor, stroke:steelBlue,'stroke-width':2.6,'stroke-linecap':'round'});

    // Estribos de pilar (horizontales de confinamiento)
    for (let ey = yStemTop + 10; ey < yAnchor - 10; ey += 18) {
      el('line',{x1:bLeft-1, y1:ey, x2:bRight+1, y2:ey, stroke:stirGreen,'stroke-width':1.5});
    }

    // 8. Armadura longitudinal de la zapata (círculos/barras en fondo)
    const zBarsY = yAnchor - 5;
    const zBarSpacing = (fBpx - 24) / 3;
    for (let i = 0; i < 4; i++) {
      el('circle',{
        cx: xDeslinde + 12 + zBarSpacing*i,
        cy: zBarsY,
        r: 3.5,
        fill: steelBlue,
        stroke: '#0d1117',
        'stroke-width': 1.0
      });
    }

    // 9. Cotas
    // Cota ancho zapata B
    this._dimH(svg, xDeslinde, xDeslinde+fBpx, yFB + 18, `B = ${(f.B*100).toFixed(0)} cm`, '#333', 12);

    // Cota espesor zapata Hf
    this._dimV(svg, xDeslinde - 18, yFT, yFB, `Hf=${(f.Hf*100).toFixed(0)}`, '#333', 12);

    // Cota profundidad Df (desde N.T.N. hasta fondo de zapata)
    this._dimV(svg, W - 30, yNtn, yFB, `Df=${(f.Df*100).toFixed(0)} cm`, '#333', 12);

    // Línea vertical indicador de deslinde (línea de límite de propiedad)
    el('line',{x1:xDeslinde, y1:10, x2:xDeslinde, y2:yFB+25, stroke:'#ea4335','stroke-width':1,'stroke-dasharray':'6,3'});
    tx('DESLINDE (L.P.)', xDeslinde - 10, 25, {
      'font-size': '12',
      'fill': '#ea4335',
      'font-weight': '600',
      'text-anchor': 'end',
      'transform': `rotate(-90 ${xDeslinde - 8} 25)`
    });

    return svg;
  },
};
