/**
 * AI-CHAT.JS — Chat con Gemini API (vanilla JS, sin dependencias)
 * Google AI Studio: https://aistudio.google.com/app/apikey
 */

const AIChat = {
  messages: [],
  apiKey: '',
  model: 'gemini-flash-latest',
  GEMINI_BASE: 'https://generativelanguage.googleapis.com/v1beta/models/',

  get GEMINI_ENDPOINT() {
    return `${this.GEMINI_BASE}${this.model}:generateContent`;
  },

  SYSTEM_PROMPT: `Eres un ingeniero estructural experto en albañilería confinada según normas chilenas.
Tu contexto es una aplicación de diseño estructural (EstructuraCalc) que calcula muros de adosamiento.
Normas que manejas: NCh430 (albañilería), NCh433 (sismo), NCh432 (viento), NCh3171 (combinaciones LRFD/ASD), ACI 318.

Cuando el usuario te comparte datos del proyecto, analízalos y responde de forma técnica pero comprensible.
Puedes debatir decisiones de diseño, sugerir alternativas, explicar por qué ciertos factores de seguridad son necesarios.
Responde en español. Sé conciso pero riguroso. Usa viñetas cuando sea apropiado.`,

  init() {
    this.apiKey = localStorage.getItem('gemini_api_key') || '';
    // Migrar nombres de modelo obsoletos
    const MODEL_MAP = {
      'gemini-1.5-flash':         'gemini-flash-latest',
      'gemini-1.5-flash-latest':  'gemini-flash-latest',
      'gemini-1.5-flash-8b':      'gemini-flash-latest',
      'gemini-1.5-flash-8b-latest':'gemini-flash-latest',
      'gemini-1.5-pro':           'gemini-pro-latest',
      'gemini-1.5-pro-latest':    'gemini-pro-latest',
      'gemini-2.0-flash':         'gemini-flash-latest',
    };
    const savedModel = localStorage.getItem('gemini_model') || '';
    this.model = MODEL_MAP[savedModel] || savedModel || 'gemini-flash-latest';
    localStorage.setItem('gemini_model', this.model);

    this.els = {
      widget:       document.getElementById('ai-chat-widget'),
      header:       document.getElementById('ai-chat-header'),
      messages:     document.getElementById('ai-chat-messages'),
      input:        document.getElementById('ai-chat-input'),
      sendBtn:      document.getElementById('ai-chat-send-btn'),
      toggleBtn:    document.getElementById('ai-chat-toggle-btn'),
      closeBtn:     document.getElementById('ai-chat-close-btn'),
      clearBtn:     document.getElementById('ai-chat-clear-btn'),
      configBtn:    document.getElementById('ai-chat-config-btn'),
      configPanel:  document.getElementById('ai-chat-config-panel'),
      apiKeyInput:  document.getElementById('ai-api-key-input'),
      apiKeySave:   document.getElementById('ai-api-key-save'),
      modelSelect:  document.getElementById('ai-model-select'),
      statusDot:    document.getElementById('ai-chat-status-dot'),
      footer:       document.getElementById('ai-chat-footer'),
    };

    if (!this.els.widget) return;

    // Ocultar por defecto para que no moleste en pantalla principal
    this.els.widget.style.display = 'none';

    // Rellenar key y modelo guardados
    if (this.apiKey) {
      this.els.apiKeyInput.value = this.apiKey;
      this.setStatus(true);
    }
    if (this.els.modelSelect) {
      this.els.modelSelect.value = this.model;
      this.els.modelSelect.addEventListener('change', e => {
        this.model = e.target.value;
        localStorage.setItem('gemini_model', this.model);
      });
    }

    // Eventos
    this.els.sendBtn.addEventListener('click', () => this.send());
    this.els.input.addEventListener('keydown', e => {
      if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); this.send(); }
    });
    this.els.toggleBtn.addEventListener('click', () => this.toggle());
    
    // Inject pill label (shown only when collapsed)
    const pill = document.createElement('div');
    pill.className = 'ai-pill-label';
    pill.style.cssText = 'display:none; width:100%; height:100%; align-items:center; justify-content:center; font-size:0.78rem; font-weight:600; color:#58a6ff; letter-spacing:0.02em; cursor:pointer; user-select:none;';
    pill.textContent = '✨ Asesor IA';
    pill.addEventListener('click', () => this.toggle());
    this.els.widget.prepend(pill);

    // Nuevo: Eventos de Abrir / Cerrar por completo
    this.els.closeBtn?.addEventListener('click', () => {
      this.els.widget.style.display = 'none';
    });
    document.getElementById('btn-open-ai-chat')?.addEventListener('click', () => {
      this.els.widget.style.display = 'flex';
      this.els.widget.classList.remove('collapsed');
      const pl = this.els.widget.querySelector('.ai-pill-label');
      if (pl) pl.style.display = 'none';
      if (this.els.header) this.els.header.style.display = 'flex';
      if (this.els.messages) this.els.messages.style.display = 'flex';
      if (this.els.footer) this.els.footer.style.display = 'flex';
      this.els.toggleBtn.textContent = '−';
    });

    this.els.clearBtn.addEventListener('click', () => this.clear());
    this.els.configBtn.addEventListener('click', () => {
      const hidden = this.els.configPanel.style.display === 'none';
      this.els.configPanel.style.display = hidden ? 'block' : 'none';
    });
    this.els.apiKeySave.addEventListener('click', () => {
      const key = this.els.apiKeyInput.value.trim();
      if (key) {
        this.apiKey = key;
        localStorage.setItem('gemini_api_key', key);
        this.setStatus(true);
        this.els.configPanel.style.display = 'none';
        this.addMessage('assistant', '✅ API Key guardada. Ahora puedes preguntarme sobre el diseño estructural del proyecto.');
      }
    });

    // Mensaje de bienvenida
    if (this.apiKey) {
      this.addMessage('assistant', '✅ Contexto del proyecto cargado. Soy tu Asesor Estructural IA — conozco la geometría, cargas, suelo y resultados actuales del muro.\n\n¿Qué quieres analizar o debatir?');
    } else {
      this.addMessage('assistant', '¡Hola! Soy tu Asesor Estructural IA. Configura tu API Key con el botón **⚙ API** para comenzar.\n\nCuando la configures, tendré acceso automático a todos los datos del proyecto abierto.');
    }
  },

  setStatus(active) {
    const dot = this.els.statusDot;
    if (!dot) return;
    dot.style.background = active ? '#2dc26b' : '#ff6b6b';
    dot.title = active ? 'Conectado a Gemini' : 'Sin API Key';
  },

  toggle() {
    const collapsed = this.els.widget.classList.toggle('collapsed');
    this.els.toggleBtn.textContent = collapsed ? '+' : '−';
    // Pill mode: show condensed label, hide inner content visually
    const pillLabel = this.els.widget.querySelector('.ai-pill-label');
    if (pillLabel) pillLabel.style.display = collapsed ? 'flex' : 'none';
    if (this.els.header) this.els.header.style.display = collapsed ? 'none' : 'flex';
    if (this.els.messages) this.els.messages.style.display = collapsed ? 'none' : 'flex';
    if (this.els.footer) this.els.footer.style.display = collapsed ? 'none' : 'flex';
  },

  clear() {
    this.messages = [];
    this.els.messages.innerHTML = '';
    this.addMessage('assistant', 'Conversación reiniciada. ¿En qué te puedo ayudar?');
  },

  addMessage(role, text) {
    this.messages.push({ role, content: text });

    const el = document.createElement('div');
    el.className = `ai-msg ai-msg-${role}`;

    // Formateo básico: saltos de línea y negritas con **
    const formatted = text
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\n/g, '<br>');
    el.innerHTML = formatted;

    this.els.messages.appendChild(el);
    this.els.messages.scrollTop = this.els.messages.scrollHeight;
    return el;
  },

  addLoading() {
    const el = document.createElement('div');
    el.className = 'ai-msg ai-msg-loading';
    el.innerHTML = '<span class="ai-dots"><span>.</span><span>.</span><span>.</span></span>';
    this.els.messages.appendChild(el);
    this.els.messages.scrollTop = this.els.messages.scrollHeight;
    return el;
  },

  getProjectContext() {
    try {
      const ld  = S.story.loads;
      const mat = S.story.materials;
      const f   = S.story.foundation;
      const lat = S.results.lateral || {};
      const seismic = S.story.lateral?.seismic || {};
      const spans = S.spans || [];
      const nSpans = spans.length;
      const totalL = getTotalL().toFixed(2);
      const tw = parseFloat((spans[0]?.tw * 100 || 14).toFixed(1));
      const col = S.columns[S.nodes[0]?.id] || {};

      // Estratigrafía
      const strataLines = (f.strata || []).map((st, i) =>
        `  Estrato ${i+1}: ${st.name} | h=${st.h}m | γ=${st.gamma}kN/m³ | φ=${st.phi}° | c=${st.c}kPa | USCS=${st.uscs||'—'}`
      ).join('\n');

      // Resultados sísmicos
      const n = v => v !== undefined && v !== null ? parseFloat(v) : null;
      const fmt = (v, dec=2) => v !== null && !isNaN(v) ? v.toFixed(dec) : '—';
      const Cs    = lat.Cs     ? `${lat.Cs} W`              : 'no calculado';
      const Fsis  = fmt(n(lat.F_seismic)) !== '—' ? `${fmt(n(lat.F_seismic))} kN/m`  : 'no calculado';
      const Fvien = fmt(n(lat.F_wind))    !== '—' ? `${fmt(n(lat.F_wind))} kN/m`     : 'no calculado';
      const Fgob  = fmt(n(lat.F_h))       !== '—' ? `${fmt(n(lat.F_h))} kN/m (gobierna: ${lat.governs||'—'})` : 'no calculado';
      const fsVP  = fmt(n(lat.FS_volc_pos));
      const fsVN  = fmt(n(lat.FS_volc_neg));
      const fsD   = fmt(n(lat.FS_desl));
      const quRes = S.results.foundation;

      return `=== CONTEXTO DEL PROYECTO EN ESTRUCTURACALC ===

PROYECTO: Muro de adosamiento — 3 viviendas modulares (~25m² c/u), Concepción, Chile

GEOMETRÍA:
- Número de vanos: ${nSpans} (${nSpans} muros de albañilería confinada)
- Largo total del muro: ${totalL}m
- Altura del muro (H): ${S.story.H}m
- Espesor de albañilería (tw): ${tw}cm
- Sección columnas/pilares: ${(col.section?.b*100||20).toFixed(0)}×${(col.section?.h*100||15).toFixed(0)} cm

CARGAS APLICADAS:
- Carga muerta D: ${ld.qD} kN/m
- Carga viva L: ${ld.qL} kN/m
- Carga de techo (coronación): ${ld.qRoof} kN/m
- Factor LRFD D: ${ld.fd} | Factor LRFD L: ${ld.fl}
- Carga última mayorada qu: ${S.results.qu || '—'} kN/m

MATERIALES:
- Hormigón f'c: ${mat.fc} MPa (G${mat.fc})
- Acero fy: ${mat.fy} MPa
- Peso específico hormigón γc: ${mat.gc} kN/m³
- Peso específico albañilería γm: ${mat.gm} kN/m³
- Recubrimiento: ${mat.rec*100} cm

ANÁLISIS SÍSMICO Y VIENTO (NCh433 / NCh432):
- Zona sísmica: ${seismic.zone || 3} | Tipo suelo: ${seismic.soilType || 'D'} | Importancia I: ${seismic.I || 1.0}
- Factor reducción R: ${seismic.R || 4} (albañilería confinada)
- Coeficiente sísmico Cs: ${Cs}
- Fuerza sísmica: ${Fsis}
- Presión de viento: ${Fvien}
- Fuerza horizontal gobernante: ${Fgob}

FUNDACIÓN (Zapata corrida tipo ${f.type}):
- Ancho B: ${f.B}m | Espesor Hf: ${f.Hf}m | Profundidad Df: ${f.Df}m
- Nivel freático NF: ${f.NF}m | Factor de seguridad FS: ${f.FS}
- Tipo zapata: ${f.type === 'L' ? 'L-asimétrica (voladizo hacia casas)' : f.type === 'L-inv' ? 'L-inv (voladizo hacia vecino)' : 'T-simétrica'}

ESTRATIGRAFÍA:
${strataLines || '  Sin datos de estratos'}

RESULTADOS GEOTÉCNICOS:
- qult (Hansen): ${quRes?.qult ? fmt(n(quRes.qult),1)+' kPa' : '—'}
- qadm (÷FS): ${quRes?.qadm ? fmt(n(quRes.qadm),1)+' kPa' : '—'}
- σ contacto: ${quRes?.sigma_contact ? fmt(n(quRes.sigma_contact),1)+' kPa' : '—'}

FACTORES DE SEGURIDAD:
- FS volcamiento → (hacia casas): ${fsVP} ${parseFloat(fsVP) < 1.5 ? '⚠ INSUFICIENTE (<1.5)' : fsVP !== '—' ? '✓' : ''}
- FS volcamiento ← (hacia vecino): ${fsVN} ${parseFloat(fsVN) < 1.5 ? '⚠ INSUFICIENTE (<1.5)' : fsVN !== '—' ? '✓' : ''}
- FS deslizamiento: ${fsD} ${parseFloat(fsD) < 1.3 ? '⚠ INSUFICIENTE (<1.3)' : fsD !== '—' ? '✓' : ''}

=== FIN CONTEXTO ===`;
    } catch (e) {
      return `Contexto del proyecto no disponible (error: ${e.message}). El usuario puede describirte el proyecto manualmente.`;
    }
  },

  async send() {
    const text = this.els.input.value.trim();
    if (!text) return;
    if (!this.apiKey) {
      this.els.configPanel.style.display = 'block';
      this.addMessage('assistant', '⚠️ Primero configura tu API Key con el botón ⚙ API.');
      return;
    }

    this.addMessage('user', text);
    this.els.input.value = '';
    this.els.sendBtn.disabled = true;

    const loadingEl = this.addLoading();

    // Historial de conversación real (excluye el mensaje actual ya agregado)
    const recentMessages = this.messages.slice(-11, -1);
    const history = recentMessages.map(m => ({
      role: m.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: m.content }]
    }));

    // Pregunta actual (sin contexto adjunto — el contexto va al inicio)
    const currentQuestion = { role: 'user', parts: [{ text }] };

    try {
      // Estructura correcta del historial para Gemini:
      // 1. system prompt  →  "Entendido"
      // 2. contexto del proyecto  →  "Recibido"
      // 3. historial de conversación
      // 4. pregunta actual
      const fullContents = [
        { role: 'user',  parts: [{ text: this.SYSTEM_PROMPT }] },
        { role: 'model', parts: [{ text: 'Entendido. Soy tu asesor estructural para este proyecto.' }] },
        { role: 'user',  parts: [{ text: this.getProjectContext() }] },
        { role: 'model', parts: [{ text: 'Recibido. Tengo todos los datos actuales del proyecto cargados. Puedes preguntarme cualquier cosa sobre este diseño.' }] },
        ...history,
        currentQuestion
      ];

      const response = await fetch(`${this.GEMINI_ENDPOINT}?key=${this.apiKey}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: fullContents,
          generationConfig: {
            temperature: 0.7,
            maxOutputTokens: 1024,
          }
        })
      });

      loadingEl.remove();

      if (!response.ok) {
        const err = await response.json();
        const msg = err?.error?.message || 'Error desconocido';
        this.addMessage('assistant', `❌ Error API: ${msg}`);
        return;
      }

      const data = await response.json();
      const reply = data?.candidates?.[0]?.content?.parts?.[0]?.text || 'Sin respuesta.';
      this.addMessage('assistant', reply);

    } catch (e) {
      loadingEl.remove();
      this.addMessage('assistant', `❌ Error de conexión: ${e.message}`);
    } finally {
      this.els.sendBtn.disabled = false;
      this.els.input.focus();
    }
  }
};

document.addEventListener('DOMContentLoaded', () => AIChat.init());
