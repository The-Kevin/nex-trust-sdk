/**
 * Constantes compartilhadas entre frontend e backend
 */

// Eventos comportamentais suportados
export const BEHAVIORAL_EVENTS = {
  CLICK: 'click',
  SCROLL: 'scroll',
  KEYSTROKE: 'keystroke',
  MOUSE_MOVE: 'mouse_move',
  FOCUS: 'focus',
  BLUR: 'blur',
  RESIZE: 'resize',
  PAGE_LOAD: 'page_load',
  PAGE_UNLOAD: 'page_unload',
  FORM_SUBMIT: 'form_submit'
};

// Tipos de decisão
export const DECISION_TYPES = {
  ALLOW: 'allow',
  REVIEW: 'review',
  DENY: 'deny'
};

// Limites padrão para scoring
export const DEFAULT_THRESHOLDS = {
  ALLOW: 80,
  REVIEW: 50,
  DENY: 0
};

// Configurações padrão do SDK
export const DEFAULT_CONFIG = {
  apiUrl: process.env.NEXT_TRUST_API_URL || 'https://api.nextrust.com',
  enableFacialCapture: false,
  enableBehavioralTracking: true,
  sessionTimeout: 30 * 60 * 1000, // 30 minutos
  maxBehavioralEvents: 1000,
  fingerprintInterval: 5 * 60 * 1000, // 5 minutos
  rules: {
    thresholds: DEFAULT_THRESHOLDS,
    rules: []
  }
};

// Códigos de erro
export const ERROR_CODES = {
  INVALID_CONFIG: 'INVALID_CONFIG',
  NETWORK_ERROR: 'NETWORK_ERROR',
  API_ERROR: 'API_ERROR',
  FINGERPRINT_ERROR: 'FINGERPRINT_ERROR',
  FACIAL_CAPTURE_ERROR: 'FACIAL_CAPTURE_ERROR',
  RULE_ENGINE_ERROR: 'RULE_ENGINE_ERROR',
  SESSION_EXPIRED: 'SESSION_EXPIRED'
};

// Headers HTTP
export const HTTP_HEADERS = {
  CONTENT_TYPE: 'Content-Type',
  AUTHORIZATION: 'Authorization',
  USER_AGENT: 'User-Agent',
  X_API_KEY: 'X-API-Key',
  X_SESSION_ID: 'X-Session-ID'
};

// Content types
export const CONTENT_TYPES = {
  JSON: 'application/json',
  FORM_DATA: 'multipart/form-data',
  URL_ENCODED: 'application/x-www-form-urlencoded'
};

// Versão do SDK
export const SDK_VERSION = '1.0.0';

// Nome do SDK
export const SDK_NAME = 'NextTrustSDK';
