/**
 * Tipos e interfaces compartilhadas entre frontend e backend
 */

/**
 * Configuração do SDK
 * @typedef {Object} SDKConfig
 * @property {string} apiUrl - URL da API do backend
 * @property {string} apiKey - Chave da API
 * @property {boolean} enableFacialCapture - Habilitar captura facial
 * @property {boolean} enableBehavioralTracking - Habilitar rastreamento comportamental
 * @property {Object} rules - Configurações do rule engine
 * @property {number} sessionTimeout - Timeout da sessão em ms
 */

/**
 * Dados de fingerprint do dispositivo
 * @typedef {Object} DeviceFingerprint
 * @property {string} userAgent - User agent do navegador
 * @property {string} language - Idioma do navegador
 * @property {string} platform - Plataforma do sistema
 * @property {string} screenResolution - Resolução da tela
 * @property {string} timezone - Fuso horário
 * @property {string} canvasFingerprint - Fingerprint do canvas
 * @property {string} webglFingerprint - Fingerprint do WebGL
 * @property {string} audioFingerprint - Fingerprint do áudio
 * @property {Object} fonts - Lista de fontes disponíveis
 * @property {Object} plugins - Plugins do navegador
 * @property {string} hardwareConcurrency - Número de cores do processador
 * @property {string} deviceMemory - Memória do dispositivo
 */

/**
 * Eventos comportamentais coletados
 * @typedef {Object} BehavioralEvent
 * @property {string} type - Tipo do evento (click, scroll, keystroke, etc.)
 * @property {number} timestamp - Timestamp do evento
 * @property {Object} data - Dados específicos do evento
 * @property {string} sessionId - ID da sessão
 */

/**
 * Dados de captura facial
 * @typedef {Object} FacialData
 * @property {string} imageData - Dados da imagem em base64
 * @property {number} timestamp - Timestamp da captura
 * @property {Object} metadata - Metadados da captura
 */

/**
 * Resultado da verificação de identidade
 * @typedef {Object} VerificationResult
 * @property {number} score - Score de confiança (0-100)
 * @property {string} decision - Decisão: 'allow', 'review', 'deny'
 * @property {Object} reasons - Razões para a decisão
 * @property {string} sessionId - ID da sessão
 * @property {number} timestamp - Timestamp da verificação
 */

/**
 * Regra do rule engine
 * @typedef {Object} Rule
 * @property {string} id - ID único da regra
 * @property {string} name - Nome da regra
 * @property {string} condition - Condição da regra
 * @property {number} weight - Peso da regra no scoring
 * @property {string} action - Ação: 'allow', 'review', 'deny'
 * @property {boolean} enabled - Se a regra está habilitada
 */

/**
 * Configuração do rule engine
 * @typedef {Object} RuleEngineConfig
 * @property {Rule[]} rules - Lista de regras
 * @property {Object} thresholds - Limites para decisões
 * @property {number} thresholds.allow - Limite para allow
 * @property {number} thresholds.review - Limite para review
 * @property {number} thresholds.deny - Limite para deny
 */

// Este arquivo contém apenas definições de tipos JSDoc
// Os tipos são exportados automaticamente via JSDoc
