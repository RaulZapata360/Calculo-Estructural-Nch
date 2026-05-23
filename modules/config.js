/**
 * CONFIG.JS — Gestión de Configuración (Lectura/Escritura .env)
 *
 * Este módulo:
 * 1. Lee variables de entorno desde .env
 * 2. Permite actualizar .env desde la aplicación
 * 3. Valida configuraciones antes de guardar
 * 4. Proporciona valores por defecto seguros
 */

const fs = require('fs');
const path = require('path');

// Ruta del archivo .env
const ENV_FILE = path.join(__dirname, '..', '.env');
const ENV_EXAMPLE = path.join(__dirname, '..', '.env.example');

/**
 * VALORES POR DEFECTO
 * Se usan si no hay .env o si falta una variable
 */
const DEFAULTS = {
  // API
  CLAUDE_API_KEY: '',  // Vacío hasta que el usuario ingrese
  CLAUDE_API_URL: 'https://api.anthropic.com/v1',
  CLAUDE_MODEL: 'claude-opus-4-7',

  // Server
  PORT: 3001,
  NODE_ENV: 'development',
  HOST: 'localhost',

  // Features
  ENABLE_CALCULATIONS: true,
  ENABLE_PDF_EXPORT: true,
  ENABLE_3D_VIEW: true,
  ENABLE_API_INTEGRATION: true,

  // Debug
  DEBUG: false,
  LOG_LEVEL: 'info'
};

/**
 * Lee el archivo .env y retorna un objeto con las variables
 */
function parseEnvFile() {
  if (!fs.existsSync(ENV_FILE)) {
    // Si no existe .env, retornar defaults
    console.log('[Config] No .env found, using defaults');
    return DEFAULTS;
  }

  const content = fs.readFileSync(ENV_FILE, 'utf8');
  const config = { ...DEFAULTS };

  // Parsear líneas
  const lines = content.split('\n');
  lines.forEach(line => {
    // Ignorar comentarios y líneas vacías
    if (!line.trim() || line.trim().startsWith('#')) return;

    // Parsear KEY=VALUE
    const [key, ...rest] = line.split('=');
    const value = rest.join('=').trim();

    if (key.trim()) {
      config[key.trim()] = value;
    }
  });

  return config;
}

/**
 * Escribe configuración al archivo .env
 * @param {Object} newConfig - Configuración a guardar
 */
function writeEnvFile(newConfig) {
  // Leer configuración actual
  const currentConfig = parseEnvFile();

  // Mergear con valores nuevos
  const updatedConfig = { ...currentConfig, ...newConfig };

  // Construir contenido del archivo
  let content = `# ═══════════════════════════════════════════════════════════════════════════
# CONFIGURACIÓN DE ESTRUCTURACALC v2.1
# GENERADO: ${new Date().toISOString()}
# ═══════════════════════════════════════════════════════════════════════════

# API CONFIGURATION
CLAUDE_API_KEY=${updatedConfig.CLAUDE_API_KEY}
CLAUDE_API_URL=${updatedConfig.CLAUDE_API_URL}
CLAUDE_MODEL=${updatedConfig.CLAUDE_MODEL}

# SERVER CONFIGURATION
PORT=${updatedConfig.PORT}
NODE_ENV=${updatedConfig.NODE_ENV}
HOST=${updatedConfig.HOST}

# FEATURES
ENABLE_CALCULATIONS=${updatedConfig.ENABLE_CALCULATIONS}
ENABLE_PDF_EXPORT=${updatedConfig.ENABLE_PDF_EXPORT}
ENABLE_3D_VIEW=${updatedConfig.ENABLE_3D_VIEW}
ENABLE_API_INTEGRATION=${updatedConfig.ENABLE_API_INTEGRATION}

# DEBUG
DEBUG=${updatedConfig.DEBUG}
LOG_LEVEL=${updatedConfig.LOG_LEVEL}
`;

  try {
    fs.writeFileSync(ENV_FILE, content, 'utf8');
    console.log(`[Config] ✓ Saved to ${ENV_FILE}`);
    return true;
  } catch (error) {
    console.error(`[Config] ✗ Error writing .env: ${error.message}`);
    return false;
  }
}

/**
 * Validar configuración
 * @param {Object} config - Configuración a validar
 */
function validateConfig(config) {
  const errors = [];

  // API Key no debe estar vacía si API está habilitada
  if (config.ENABLE_API_INTEGRATION && !config.CLAUDE_API_KEY) {
    errors.push('CLAUDE_API_KEY es requerida si ENABLE_API_INTEGRATION=true');
  }

  // API URL debe ser válida
  if (config.CLAUDE_API_URL && !config.CLAUDE_API_URL.startsWith('http')) {
    errors.push('CLAUDE_API_URL debe ser una URL válida');
  }

  // Puerto debe ser número
  if (config.PORT && isNaN(parseInt(config.PORT))) {
    errors.push('PORT debe ser un número válido');
  }

  // NODE_ENV debe ser uno de estos valores
  if (config.NODE_ENV && !['development', 'production', 'test'].includes(config.NODE_ENV)) {
    errors.push('NODE_ENV debe ser: development, production, o test');
  }

  return {
    valid: errors.length === 0,
    errors
  };
}

/**
 * MÓDULO EXPORTADO
 */
const Config = {
  /**
   * Obtener la configuración actual
   */
  get() {
    // Cargar desde .env o defaults
    require('dotenv').config({ path: ENV_FILE });

    const config = parseEnvFile();

    // Convertir valores booleanos
    config.ENABLE_CALCULATIONS = config.ENABLE_CALCULATIONS === 'true';
    config.ENABLE_PDF_EXPORT = config.ENABLE_PDF_EXPORT === 'true';
    config.ENABLE_3D_VIEW = config.ENABLE_3D_VIEW === 'true';
    config.ENABLE_API_INTEGRATION = config.ENABLE_API_INTEGRATION === 'true';
    config.DEBUG = config.DEBUG === 'true';

    // Convertir puerto a número
    config.PORT = parseInt(config.PORT) || 3001;

    return config;
  },

  /**
   * Guardar configuración
   * @param {Object} newConfig - Nueva configuración a guardar
   */
  save(newConfig) {
    // Validar
    const validation = validateConfig(newConfig);

    if (!validation.valid) {
      console.error('[Config] Validation errors:');
      validation.errors.forEach(err => console.error(`  - ${err}`));
      return { success: false, errors: validation.errors };
    }

    // Guardar
    const success = writeEnvFile(newConfig);

    if (success) {
      // Recargar en memoria
      require('dotenv').config({ path: ENV_FILE, override: true });
    }

    return { success, errors: [] };
  },

  /**
   * Actualizar solo API Key (caso común)
   * @param {string} apiKey - Nueva API key
   */
  setApiKey(apiKey) {
    if (!apiKey || typeof apiKey !== 'string') {
      return { success: false, error: 'API Key debe ser un string válido' };
    }

    if (!apiKey.startsWith('sk-ant-')) {
      return { success: false, error: 'API Key debe comenzar con sk-ant-' };
    }

    return this.save({ CLAUDE_API_KEY: apiKey });
  },

  /**
   * Obtener solo la API Key (seguro para frontend)
   * Nota: NUNCA exponer la API Key completa en frontend
   */
  getApiKeyStatus() {
    const config = this.get();
    return {
      configured: !!config.CLAUDE_API_KEY,
      keyLength: config.CLAUDE_API_KEY ? config.CLAUDE_API_KEY.length : 0,
      preview: config.CLAUDE_API_KEY ? config.CLAUDE_API_KEY.substring(0, 10) + '...' : 'NO CONFIGURADA'
    };
  },

  /**
   * Crear .env desde .env.example si no existe
   */
  initializeIfNeeded() {
    if (fs.existsSync(ENV_FILE)) {
      console.log('[Config] .env already exists');
      return false;
    }

    if (!fs.existsSync(ENV_EXAMPLE)) {
      console.error('[Config] .env.example not found');
      return false;
    }

    try {
      fs.copyFileSync(ENV_EXAMPLE, ENV_FILE);
      console.log(`[Config] ✓ Created .env from .env.example`);
      return true;
    } catch (error) {
      console.error(`[Config] ✗ Error copying .env.example: ${error.message}`);
      return false;
    }
  },

  /**
   * Obtener toda la configuración (para debugging)
   */
  debugDump() {
    const config = this.get();
    const safe = { ...config };

    // Ocultar API Key en debug
    if (safe.CLAUDE_API_KEY) {
      safe.CLAUDE_API_KEY = safe.CLAUDE_API_KEY.substring(0, 10) + '...[REDACTED]';
    }

    return safe;
  }
};

module.exports = Config;
