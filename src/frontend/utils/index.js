/**
 * Utilitários para o NextTrust SDK Frontend
 */

/**
 * Gera um UUID v4
 * @returns {string} UUID v4
 */
export function generateUUID() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

/**
 * Debounce function para limitar execução de funções
 * @param {Function} func - Função a ser executada
 * @param {number} wait - Tempo de espera em ms
 * @returns {Function} Função debounced
 */
export function debounce(func, wait) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

/**
 * Throttle function para limitar execução de funções
 * @param {Function} func - Função a ser executada
 * @param {number} limit - Limite de tempo em ms
 * @returns {Function} Função throttled
 */
export function throttle(func, limit) {
  let inThrottle;
  return function(...args) {
    if (!inThrottle) {
      func.apply(this, args);
      inThrottle = true;
      setTimeout(() => inThrottle = false, limit);
    }
  };
}

/**
 * Verifica se uma string é um JSON válido
 * @param {string} str - String para verificar
 * @returns {boolean} True se é JSON válido
 */
export function isValidJSON(str) {
  try {
    JSON.parse(str);
    return true;
  } catch (e) {
    return false;
  }
}

/**
 * Sanitiza uma string removendo caracteres perigosos
 * @param {string} str - String para sanitizar
 * @returns {string} String sanitizada
 */
export function sanitizeString(str) {
  if (typeof str !== 'string') return '';
  return str
    .replace(/[<>]/g, '') // Remove < e >
    .replace(/javascript:/gi, '') // Remove javascript:
    .replace(/on\w+=/gi, '') // Remove event handlers
    .trim();
}

/**
 * Converte bytes para formato legível
 * @param {number} bytes - Número de bytes
 * @param {number} decimals - Número de casas decimais
 * @returns {string} Formato legível (ex: 1.5 MB)
 */
export function formatBytes(bytes, decimals = 2) {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];
  
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
}

/**
 * Formata tempo em milissegundos para formato legível
 * @param {number} ms - Tempo em milissegundos
 * @returns {string} Formato legível (ex: 2m 30s)
 */
export function formatDuration(ms) {
  if (ms < 1000) return `${ms}ms`;
  
  const seconds = Math.floor(ms / 1000) % 60;
  const minutes = Math.floor(ms / (1000 * 60)) % 60;
  const hours = Math.floor(ms / (1000 * 60 * 60));
  
  if (hours > 0) {
    return `${hours}h ${minutes}m ${seconds}s`;
  } else if (minutes > 0) {
    return `${minutes}m ${seconds}s`;
  } else {
    return `${seconds}s`;
  }
}

/**
 * Verifica se o navegador suporta uma API específica
 * @param {string} api - Nome da API para verificar
 * @returns {boolean} True se suporta
 */
export function supportsAPI(api) {
  const apis = {
    'getUserMedia': () => !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia),
    'webgl': () => {
      try {
        const canvas = document.createElement('canvas');
        return !!(canvas.getContext('webgl') || canvas.getContext('experimental-webgl'));
      } catch (e) {
        return false;
      }
    },
    'canvas': () => {
      try {
        const canvas = document.createElement('canvas');
        return !!(canvas.getContext && canvas.getContext('2d'));
      } catch (e) {
        return false;
      }
    },
    'audioContext': () => !!(window.AudioContext || window.webkitAudioContext),
    'localStorage': () => {
      try {
        const test = '__test__';
        localStorage.setItem(test, test);
        localStorage.removeItem(test);
        return true;
      } catch (e) {
        return false;
      }
    },
    'sessionStorage': () => {
      try {
        const test = '__test__';
        sessionStorage.setItem(test, test);
        sessionStorage.removeItem(test);
        return true;
      } catch (e) {
        return false;
      }
    },
    'indexedDB': () => !!(window.indexedDB),
    'serviceWorker': () => 'serviceWorker' in navigator,
    'webWorker': () => typeof Worker !== 'undefined',
    'geolocation': () => 'geolocation' in navigator,
    'battery': () => 'getBattery' in navigator,
    'connection': () => 'connection' in navigator
  };
  
  return apis[api] ? apis[api]() : false;
}

/**
 * Detecta informações sobre o dispositivo
 * @returns {Object} Informações do dispositivo
 */
export function getDeviceInfo() {
  const ua = navigator.userAgent;
  
  return {
    isMobile: /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(ua),
    isTablet: /iPad|Android(?!.*Mobile)/i.test(ua),
    isDesktop: !/Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(ua),
    isIOS: /iPad|iPhone|iPod/.test(ua),
    isAndroid: /Android/.test(ua),
    isWindows: /Windows/.test(ua),
    isMac: /Mac/.test(ua),
    isLinux: /Linux/.test(ua),
    browser: getBrowserInfo(),
    touchSupport: 'ontouchstart' in window || navigator.maxTouchPoints > 0
  };
}

/**
 * Detecta informações sobre o navegador
 * @returns {Object} Informações do navegador
 */
function getBrowserInfo() {
  const ua = navigator.userAgent;
  let browser = { name: 'Unknown', version: 'Unknown' };
  
  if (ua.indexOf('Firefox') > -1) {
    browser.name = 'Firefox';
    browser.version = ua.match(/Firefox\/(\d+)/)?.[1] || 'Unknown';
  } else if (ua.indexOf('Chrome') > -1) {
    browser.name = 'Chrome';
    browser.version = ua.match(/Chrome\/(\d+)/)?.[1] || 'Unknown';
  } else if (ua.indexOf('Safari') > -1) {
    browser.name = 'Safari';
    browser.version = ua.match(/Version\/(\d+)/)?.[1] || 'Unknown';
  } else if (ua.indexOf('Edge') > -1) {
    browser.name = 'Edge';
    browser.version = ua.match(/Edge\/(\d+)/)?.[1] || 'Unknown';
  } else if (ua.indexOf('Opera') > -1) {
    browser.name = 'Opera';
    browser.version = ua.match(/Opera\/(\d+)/)?.[1] || 'Unknown';
  }
  
  return browser;
}

/**
 * Cria um hash simples de uma string
 * @param {string} str - String para fazer hash
 * @returns {string} Hash da string
 */
export function simpleHash(str) {
  let hash = 0;
  if (str.length === 0) return hash.toString();
  
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  
  return Math.abs(hash).toString(36);
}

/**
 * Verifica se uma URL é válida
 * @param {string} url - URL para verificar
 * @returns {boolean} True se é URL válida
 */
export function isValidURL(url) {
  try {
    new URL(url);
    return true;
  } catch (e) {
    return false;
  }
}

/**
 * Converte objeto para query string
 * @param {Object} obj - Objeto para converter
 * @returns {string} Query string
 */
export function objectToQueryString(obj) {
  return Object.keys(obj)
    .filter(key => obj[key] !== undefined && obj[key] !== null)
    .map(key => `${encodeURIComponent(key)}=${encodeURIComponent(obj[key])}`)
    .join('&');
}

/**
 * Converte query string para objeto
 * @param {string} queryString - Query string para converter
 * @returns {Object} Objeto resultante
 */
export function queryStringToObject(queryString) {
  const params = new URLSearchParams(queryString);
  const result = {};
  
  for (const [key, value] of params.entries()) {
    result[key] = value;
  }
  
  return result;
}
