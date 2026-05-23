/**
 * REBAREDITOR.JS — Modal de Edición de Armadura
 * Permite agregar/editar barras longitudinales y estribos por elemento
 */

const REBAR_DIAMETERS = [8, 10, 12, 16, 18, 22, 25, 28, 32];

const RebarEditor = {
  currentElementId: null,
  currentRebarData: null,

  /**
   * Abre el modal de edición para un elemento
   */
  open(elementId) {
    this.currentElementId = elementId;
    const elem = S.elements[elementId];
    if (!elem) {
      alert('Elemento no encontrado');
      return;
    }

    // Cargar datos existentes o inicializar
    const stored = RebarStorage.load(elementId);
    if (stored) {
      this.currentRebarData = JSON.parse(JSON.stringify(stored));
    } else {
      this.currentRebarData = JSON.parse(JSON.stringify(elem.rebar));
    }

    // Crear y mostrar modal
    this.showModal();
  },

  /**
   * Crea y muestra el modal
   */
  showModal() {
    const modal = document.getElementById('modal-rebar-editor');
    if (!modal) {
      console.error('Modal no encontrado en DOM');
      return;
    }

    const elem = S.elements[this.currentElementId];
    const design = elem.design;

    // Título
    document.getElementById('modal-title').textContent = `Editar Armadura: ${elem.name}`;

    // Información de diseño
    const designInfo = document.getElementById('modal-design-info');
    designInfo.innerHTML = `
      <div class="design-row">
        <span>As Requerida:</span>
        <strong>${design.AsReq} cm²</strong>
      </div>
      <div class="design-row">
        <span>As Mínima:</span>
        <strong>${design.AsMinCm2} cm²</strong>
      </div>
    `;

    // Renderizar caras
    const facesContainer = document.getElementById('modal-faces');
    facesContainer.innerHTML = '';

    Object.keys(this.currentRebarData.faces).forEach(faceName => {
      const faceData = this.currentRebarData.faces[faceName];
      const faceHTML = this.renderFace(faceName, faceData, design.AsReq);
      facesContainer.innerHTML += faceHTML;
    });

    // Renderizar estribos
    const stirrupContainer = document.getElementById('modal-stirrups');
    stirrupContainer.innerHTML = this.renderStirrup();

    // Mostrar modal
    modal.classList.remove('hidden');
    this.bindModalEvents();
  },

  /**
   * Renderiza una cara de armadura (superior o inferior)
   */
  renderFace(faceName, faceData, AsReq) {
    const AsTotal = faceData.AsTotal || 0;
    const validation = RebarValidator.check(this.currentElementId, this.currentRebarData);
    const color = validation.color;

    let html = `
      <div class="face-section">
        <h4>${faceData.nombre}</h4>
        <div class="barras-list" data-face="${faceName}">
    `;

    // Listar barras existentes
    faceData.barras.forEach((barra, idx) => {
      const A = Math.PI * (barra.diámetro / 10) ** 2 / 4;
      const A_total = A * barra.cantidad;
      html += `
        <div class="barra-row" data-face="${faceName}" data-idx="${idx}">
          <div class="barra-inputs">
            <input type="number" class="input-cantidad" value="${barra.cantidad}" min="1" max="20">
            <select class="input-diametro">
              ${REBAR_DIAMETERS.map(d =>
                `<option value="${d}" ${d === barra.diámetro ? 'selected' : ''}>φ${d}</option>`
              ).join('')}
            </select>
          </div>
          <div class="barra-info">
            <span class="as-value">${A_total.toFixed(2)} cm²</span>
            <button class="btn-remove-barra" data-face="${faceName}" data-idx="${idx}">✕</button>
          </div>
        </div>
      `;
    });

    // Botón agregar barra
    html += `
      <button class="btn-add-barra" data-face="${faceName}">+ Agregar barra</button>

      <div class="face-validation" style="border-top:1px solid rgba(255,255,255,0.1);padding-top:8px;margin-top:8px;">
        <div style="display:flex;justify-content:space-between;align-items:center;">
          <span>As Total:</span>
          <span style="color:${color};font-weight:600;">${AsTotal.toFixed(2)} cm²</span>
        </div>
        <div style="font-size:0.75rem;color:var(--text-muted);">
          ${AsTotal >= AsReq * 0.95 ? '✓ Cumple' : '✗ Insuficiente'}
        </div>
      </div>
    </div>
    `;

    return html;
  },

  /**
   * Renderiza sección de estribos
   */
  renderStirrup() {
    const estribos = this.currentRebarData.estribos;
    return `
      <div class="stirrup-section">
        <h4>Estribos (Cortante)</h4>
        <div class="stirrup-inputs">
          <div class="field-row">
            <label>Diámetro:</label>
            <select id="input-stirrup-dia" class="input-stirrup-dia">
              ${REBAR_DIAMETERS.map(d =>
                `<option value="${d}" ${d === estribos.diámetro ? 'selected' : ''}>φ${d}</option>`
              ).join('')}
            </select>
          </div>
          <div class="field-row">
            <label>Espaciamiento (cm):</label>
            <input type="number" id="input-stirrup-spacing" class="input-stirrup-spacing"
              value="${(estribos.espaciamiento * 100).toFixed(0)}" min="5" max="50" step="5">
          </div>
        </div>
      </div>
    `;
  },

  /**
   * Bindea eventos del modal
   */
  bindModalEvents() {
    // Agregar barras
    document.querySelectorAll('.btn-add-barra').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const faceName = btn.dataset.face;
        this.addBar(faceName);
      });
    });

    // Remover barras
    document.querySelectorAll('.btn-remove-barra').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const faceName = btn.dataset.face;
        const idx = parseInt(btn.dataset.idx);
        this.removeBar(faceName, idx);
      });
    });

    // Cambiar cantidad/diámetro
    document.querySelectorAll('.barra-row').forEach(row => {
      const faceName = row.dataset.face;
      const idx = parseInt(row.dataset.idx);

      row.querySelector('.input-cantidad').addEventListener('change', (e) => {
        const newQty = parseInt(e.target.value) || 1;
        this.currentRebarData.faces[faceName].barras[idx].cantidad = newQty;
        this.updateValidation();
      });

      row.querySelector('.input-diametro').addEventListener('change', (e) => {
        const newDia = parseInt(e.target.value);
        this.currentRebarData.faces[faceName].barras[idx].diámetro = newDia;
        this.updateValidation();
      });
    });

    // Botones de control (onclick evita acumulación de listeners al re-renderizar)
    document.getElementById('btn-modal-save').onclick = () => this.save();
    document.getElementById('btn-modal-cancel').onclick = () => this.close();
    document.getElementById('btn-modal-close').onclick = () => this.close();
  },

  /**
   * Agrega una nueva barra a una cara
   */
  addBar(faceName) {
    const newBar = { diámetro: 12, cantidad: 1, A: +(Math.PI * 1.2 ** 2 / 4).toFixed(4) };
    this.currentRebarData.faces[faceName].barras.push(newBar);
    this.updateValidation();
    this.showModal(); // Redibujar modal
  },

  /**
   * Remueve una barra de una cara
   */
  removeBar(faceName, idx) {
    this.currentRebarData.faces[faceName].barras.splice(idx, 1);
    this.updateValidation();
    this.showModal(); // Redibujar modal
  },

  /**
   * Actualiza validación en tiempo real
   */
  updateValidation() {
    // Recalcular As total por cara
    Object.keys(this.currentRebarData.faces).forEach(faceName => {
      let total = 0;
      this.currentRebarData.faces[faceName].barras.forEach(barra => {
        const A = Math.PI * (barra.diámetro / 10) ** 2 / 4;
        total += A * barra.cantidad;
      });
      this.currentRebarData.faces[faceName].AsTotal = total;
    });

    // Redibujar modal
    this.showModal();
  },

  /**
   * Guarda cambios — lee siempre desde el DOM antes de guardar
   */
  save() {
    // Leer valores actuales de barras desde el DOM
    document.querySelectorAll('.barra-row').forEach(row => {
      const faceName = row.dataset.face;
      const idx = parseInt(row.dataset.idx);
      const cantidad = parseInt(row.querySelector('.input-cantidad')?.value) || 1;
      const diámetro = parseInt(row.querySelector('.input-diametro')?.value) || 12;
      const barra = this.currentRebarData.faces[faceName]?.barras[idx];
      if (barra) {
        barra.cantidad = cantidad;
        barra.diámetro = diámetro;
        barra.A = +(Math.PI * (diámetro / 10) ** 2 / 4).toFixed(4);
      }
    });

    // Recalcular AsTotal por cara
    Object.keys(this.currentRebarData.faces || {}).forEach(faceName => {
      let total = 0;
      (this.currentRebarData.faces[faceName]?.barras || []).forEach(b => {
        total += Math.PI * (b.diámetro / 10) ** 2 / 4 * b.cantidad;
      });
      this.currentRebarData.faces[faceName].AsTotal = total;
    });

    // Actualizar estribos desde inputs
    const stirrupDia = parseInt(document.getElementById('input-stirrup-dia')?.value) || 8;
    const stirrupSpacing = parseInt(document.getElementById('input-stirrup-spacing')?.value) || 15;
    this.currentRebarData.estribos.diámetro = stirrupDia;
    this.currentRebarData.estribos.espaciamiento = stirrupSpacing / 100;

    // Validar
    const validation = RebarValidator.check(this.currentElementId, this.currentRebarData);

    if (!validation.ok) {
      const confirmed = window.confirm(
        `⚠ Armadura insuficiente (${validation.ratioUtilización} de ${validation.AsReq} cm²)\n\n` +
        `¿Deseas guardar de todas formas?`
      );
      if (!confirmed) return;
    }

    // Guardar en localStorage y estado
    const success = RebarStorage.save(this.currentElementId, this.currentRebarData);
    if (success) {
      Renderer.draw();
      if (S.ui.selectedEl === this.currentElementId) {
        renderRebar(this.currentElementId);
        const csContainer = document.getElementById('cross-section-content');
        if (csContainer) CrossSection.draw(this.currentElementId, csContainer);
      }
      this.close();
    } else {
      alert('✗ Error guardando armadura');
    }
  },

  /**
   * Cierra el modal
   */
  close() {
    const modal = document.getElementById('modal-rebar-editor');
    if (modal) modal.classList.add('hidden');
    this.currentElementId = null;
    this.currentRebarData = null;
  }
};
