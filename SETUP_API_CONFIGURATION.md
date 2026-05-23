# 🔐 GUÍA: Configuración y Persistencia de API

## Cómo Guardar tu API Key para que Persista

---

## PASO 1: Crear el Archivo .env

### Opción A: Copiar desde .env.example (Recomendado)

```bash
# En la carpeta raíz del proyecto:
cp .env.example .env

# O manualmente:
# 1. Abre .env.example
# 2. Guarda como .env (sin el .example)
```

### Opción B: Crear Manualmente

```bash
# Crear archivo vacío:
touch .env

# O en Windows PowerShell:
New-Item -Path .env -ItemType File
```

---

## PASO 2: Ingresar tu API Key

Edita el archivo `.env` que acabas de crear:

```env
# .env
CLAUDE_API_KEY=sk-ant-v1-TU_API_KEY_AQUI
CLAUDE_API_URL=https://api.anthropic.com/v1
CLAUDE_MODEL=claude-opus-4-7
PORT=3001
NODE_ENV=development
```

**⚠️ IMPORTANTE:**
- Tu API Key es **PRIVADA** — nunca la compartas
- El archivo `.env` está en `.gitignore` — NO se comiteará a git
- Obtén tu API Key en: https://console.anthropic.com/

---

## PASO 3: Usar en el Código

### En Node.js (Backend)

```javascript
// app.js o server.js
const Config = require('./modules/config');

// Inicializar si no existe .env
Config.initializeIfNeeded();

// Obtener configuración actual
const config = Config.get();
console.log(config.CLAUDE_API_KEY);  // ← API Key cargada

// Ver estado de API (seguro para frontend)
const status = Config.getApiKeyStatus();
console.log(status.configured);  // true/false
console.log(status.preview);     // sk-ant-v1-... [redactado]
```

### Actualizar API Key Desde la Aplicación

```javascript
// Cuando el usuario ingresa la API Key en el formulario:
const Config = require('./modules/config');

const result = Config.setApiKey('sk-ant-v1-NUEVA_API_KEY');

if (result.success) {
  console.log('✓ API Key guardada en .env');
  // Se guarda automáticamente en el archivo
} else {
  console.error('✗ Error:', result.errors);
}
```

---

## PASO 4: Interface en HTML (Panel de Configuración)

Agrega un formulario en tu `index.html`:

```html
<!-- Sección de Configuración -->
<div id="config-panel" class="config-panel" style="display:none;">
  <div class="config-header">
    <h3>⚙️ Configuración de API</h3>
    <button id="close-config">✕</button>
  </div>

  <div class="config-body">
    <div class="config-field">
      <label for="api-key-input">Claude API Key:</label>
      <input 
        type="password" 
        id="api-key-input" 
        placeholder="sk-ant-v1-..."
        style="width:100%; padding:8px; margin:10px 0;"
      />
      <small style="color:#666;">
        No será visible después de guardar (seguridad)
      </small>
    </div>

    <div class="config-status" id="api-status">
      <span id="api-status-text">Cargando estado...</span>
    </div>

    <div class="config-actions">
      <button id="save-api-key" class="btn-primary">💾 Guardar API Key</button>
      <button id="test-api-key" class="btn-secondary">🧪 Probar Conexión</button>
    </div>
  </div>
</div>

<style>
  .config-panel {
    position: fixed;
    bottom: 20px;
    right: 20px;
    width: 400px;
    background: white;
    border: 1px solid #ccc;
    border-radius: 8px;
    box-shadow: 0 4px 12px rgba(0,0,0,0.15);
    z-index: 1000;
  }
  .config-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 15px;
    border-bottom: 1px solid #eee;
  }
  .config-body {
    padding: 15px;
  }
  .config-field {
    margin-bottom: 15px;
  }
  .config-status {
    padding: 10px;
    background: #f5f5f5;
    border-radius: 4px;
    margin: 10px 0;
    font-size: 12px;
  }
  .config-actions {
    display: flex;
    gap: 10px;
    margin-top: 15px;
  }
  .btn-primary, .btn-secondary {
    flex: 1;
    padding: 8px;
    border: none;
    border-radius: 4px;
    cursor: pointer;
    font-weight: bold;
  }
  .btn-primary {
    background: #28a745;
    color: white;
  }
  .btn-secondary {
    background: #6c757d;
    color: white;
  }
</style>
```

---

## PASO 5: JavaScript para Manejar el Panel

```javascript
// En app.js o script.js
const Config = require('./modules/config');

// Mostrar/ocultar panel
document.getElementById('config-toggle')?.addEventListener('click', () => {
  const panel = document.getElementById('config-panel');
  panel.style.display = panel.style.display === 'none' ? 'block' : 'none';
});

// Cerrar panel
document.getElementById('close-config')?.addEventListener('click', () => {
  document.getElementById('config-panel').style.display = 'none';
});

// Mostrar estado de API al cargar
function updateApiStatus() {
  const status = Config.getApiKeyStatus();
  const statusText = document.getElementById('api-status-text');

  if (status.configured) {
    statusText.innerHTML = `
      ✅ <strong>API Configurada</strong><br/>
      Key: ${status.preview}<br/>
      <small>Guardada en .env (persistente)</small>
    `;
    statusText.style.color = '#28a745';
  } else {
    statusText.innerHTML = `
      ❌ <strong>API No Configurada</strong><br/>
      Ingresa tu API Key arriba para conectar.
    `;
    statusText.style.color = '#dc3545';
  }
}

// Guardar API Key
document.getElementById('save-api-key')?.addEventListener('click', () => {
  const apiKeyInput = document.getElementById('api-key-input');
  const apiKey = apiKeyInput.value.trim();

  if (!apiKey) {
    alert('❌ Ingresa una API Key válida');
    return;
  }

  // Guardar usando el módulo Config
  const result = Config.setApiKey(apiKey);

  if (result.success) {
    alert('✅ API Key guardada en .env (persistente)');
    apiKeyInput.value = '';  // Limpiar input
    updateApiStatus();       // Actualizar estado visual
  } else {
    alert('❌ Error: ' + result.errors.join(', '));
  }
});

// Probar conexión
document.getElementById('test-api-key')?.addEventListener('click', async () => {
  const config = Config.get();

  if (!config.CLAUDE_API_KEY) {
    alert('❌ Primero debes guardar una API Key');
    return;
  }

  try {
    // Intentar conexión simple
    const response = await fetch(config.CLAUDE_API_URL + '/models', {
      headers: {
        'x-api-key': config.CLAUDE_API_KEY
      }
    });

    if (response.ok) {
      alert('✅ Conexión exitosa con Anthropic API');
    } else {
      alert('❌ API Key inválida o expirada');
    }
  } catch (error) {
    alert('❌ Error de conexión: ' + error.message);
  }
});

// Cargar estado al iniciar
window.addEventListener('load', updateApiStatus);
```

---

## PASO 6: Protección en .gitignore

Asegúrate que tu `.gitignore` contiene:

```gitignore
# .gitignore

# Configuración local (NUNCA comitear)
.env
.env.local
.env.*.local

# Dependencias
node_modules/
package-lock.json

# Logs
*.log
logs/

# IDE
.vscode/
.idea/
*.swp
*.swo
```

---

## PASO 7: Estructura Final del Proyecto

```
proyecto/
├── .env                    ← TU API KEY (guardada aquí, ignorado por git)
├── .env.example            ← Plantilla pública
├── .gitignore              ← Incluye .env
├── app.js
├── index.html
├── modules/
│   ├── config.js           ← Módulo de configuración
│   ├── solver.js
│   └── ...
├── package.json
└── README.md
```

---

## PASO 8: Verificar que Persiste

### Prueba 1: Reinicia el Servidor

```bash
# Terminal 1: Inicia el servidor
npm start

# Terminal 2: Verifica que el .env existe
cat .env

# Resultado esperado:
# CLAUDE_API_KEY=sk-ant-v1-...
# Significa que la API Key está GUARDADA y PERSISTIRÁ
```

### Prueba 2: Verifica en el Código

```javascript
// En app.js, al iniciar:
const Config = require('./modules/config');
const config = Config.get();

console.log('[Startup] API Status:', Config.getApiKeyStatus());
// Salida esperada:
// [Startup] API Status: {
//   configured: true,
//   keyLength: 142,
//   preview: 'sk-ant-v1...'
// }
```

---

## SEGURIDAD: Nunca Hacer Esto ❌

```javascript
// ❌ MALO: Guardar API Key en localStorage (visible en navegador)
localStorage.setItem('API_KEY', apiKey);

// ❌ MALO: Exponer API Key en variables globales
window.CLAUDE_API_KEY = apiKey;

// ❌ MALO: Commitear .env a git
git add .env

// ✅ CORRECTO: Usar .env + modules/config.js (servidor solo)
```

---

## Casos de Uso Comunes

### Caso 1: Primera Vez (Sin .env)

```
1. Usuario abre la aplicación
2. Ve panel de configuración: "❌ API No Configurada"
3. Ingresa su API Key
4. Presiona "💾 Guardar API Key"
5. Sistema escribe en .env
6. Usuario ve: "✅ API Configurada"
7. Al reiniciar, API Key ya está cargada (PERSISTE)
```

### Caso 2: Cambiar API Key

```
1. Usuario abre panel de configuración nuevamente
2. Ingresa nueva API Key
3. Presiona "💾 Guardar API Key"
4. .env se actualiza automáticamente
5. Nueva API Key toma efecto inmediatamente
```

### Caso 3: Compartir Proyecto (Sin API Key)

```
# Compartir proyecto sin exponer API Key:

git add .
git commit -m "Add feature"
# El .env NO se incluye (en .gitignore) ✓

# Cuando compañero descarga:
npm install
# Verá: "❌ API No Configurada"
# Ingresa SU propia API Key
# Cada desarrollador tiene su .env local ✓
```

---

## Resumen

| Acción | Dónde | Persiste |
|--------|-------|----------|
| Ingresar API Key | Panel HTML + formulario | ✅ Sí (guardado en .env) |
| Leer API Key | modules/config.js | ✅ Sí (desde .env) |
| Usar API Key | Backend (app.js) | ✅ Sí (en memoria durante sesión) |
| Reiniciar servidor | - | ✅ Sí (se recarga de .env) |
| Compartir en git | - | ❌ No (ignorado por .gitignore) |

---

## Comandos Útiles

```bash
# Ver contenido de .env (cuidado, expone API Key)
cat .env

# Ver solo si está configurado (seguro)
grep CLAUDE_API_KEY .env | head -c 20

# Limpiar y volver a crear desde template
rm .env
cp .env.example .env

# Verificar que está en .gitignore
cat .gitignore | grep .env
```

---

## Solución de Problemas

### "API Key no se guarda"

```javascript
// Verificar que Config.setApiKey() retorna success: true
const result = Config.setApiKey('sk-ant-...');
console.log(result);

// Si falla, revisar permisos del archivo
// Windows: clic derecho → Propiedades → Seguridad
```

### "API Key no persiste después de reiniciar"

```bash
# Verificar que .env existe
ls -la .env

# Verificar contenido
cat .env

# Si no existe, crear manualmente
cp .env.example .env
```

### ".env fue committeado accidentalmente"

```bash
# Eliminar del historio de git (URGENTE)
git rm --cached .env
git commit -m "Remove .env from tracking"

# Regenerar tu API Key en console.anthropic.com
```

---

**¡Listo!** Tu API Key ahora está:
- ✅ Guardada en `.env` (PERSISTENTE)
- ✅ Ignorada por git (SEGURA)
- ✅ Cargada automáticamente al iniciar (CONVENIENTE)
- ✅ Configurable desde la UI (AMIGABLE)
