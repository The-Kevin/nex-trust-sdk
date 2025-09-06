/**
 * NextTrust SDK - Frontend Principal
 * SDK leve para verificação de identidade e análise de confiança
 */

import { DeviceFingerprintCollector } from './fingerprint.js';
import { BehavioralTracker } from './behavioral-tracker.js';
import { FacialCaptureModule } from '../modules/facial-capture.js';
import { DEFAULT_CONFIG, ERROR_CODES, SDK_VERSION, SDK_NAME } from '../../shared/constants/index.js';

/**
 * Classe principal do NextTrust SDK
 */
export class NextTrustSDK {
  constructor(config = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
    this.isInitialized = false;
    this.sessionId = null;
    this.fingerprintCollector = null;
    this.behavioralTracker = null;
    this.facialCapture = null;
    
    // Valida configuração
    this._validateConfig();
  }

  /**
   * Inicializa o SDK
   * @param {Object} config - Configuração do SDK
   * @returns {Promise<boolean>} True se inicializado com sucesso
   */
  async init(config = {}) {
    try {
      // Atualiza configuração
      this.config = { ...this.config, ...config };
      this._validateConfig();

      // Gera ID da sessão
      this.sessionId = this._generateSessionId();

      // Inicializa módulos
      this.fingerprintCollector = new DeviceFingerprintCollector();
      this.behavioralTracker = new BehavioralTracker({
        enabled: this.config.enableBehavioralTracking,
        maxEvents: this.config.maxBehavioralEvents
      });

      if (this.config.enableFacialCapture) {
        this.facialCapture = new FacialCaptureModule({
          enabled: this.config.enableFacialCapture
        });
      }

      // Coleta fingerprint inicial
      await this.fingerprintCollector.collectFingerprint();

      // Inicia rastreamento comportamental
      this.behavioralTracker.startTracking();

      this.isInitialized = true;
      
      console.log(`${SDK_NAME} v${SDK_VERSION} initialized successfully`);
      return true;

    } catch (error) {
      console.error('NextTrust: Initialization failed:', error);
      throw new Error(`SDK initialization failed: ${error.message}`);
    }
  }

  /**
   * Verifica identidade do usuário
   * @param {Object} options - Opções de verificação
   * @returns {Promise<Object>} Resultado da verificação
   */
  async verifyIdentity(options = {}) {
    if (!this.isInitialized) {
      throw new Error('SDK not initialized. Call init() first.');
    }

    try {
      // Coleta dados atuais
      const verificationData = await this._collectVerificationData(options);

      // Envia para o backend
      const result = await this._sendVerificationRequest(verificationData);

      console.log('NextTrust: Identity verification completed', result);
      return result;

    } catch (error) {
      console.error('NextTrust: Identity verification failed:', error);
      throw new Error(`Identity verification failed: ${error.message}`);
    }
  }

  /**
   * Coleta dados para verificação
   * @private
   */
  async _collectVerificationData(options = {}) {
    const data = {
      sessionId: this.sessionId,
      timestamp: Date.now(),
      fingerprint: null,
      behavioral: null,
      facial: null
    };

    // Coleta fingerprint (sempre)
    if (this.fingerprintCollector.needsUpdate(this.config.fingerprintInterval)) {
      data.fingerprint = await this.fingerprintCollector.collectFingerprint();
    } else {
      data.fingerprint = this.fingerprintCollector.getCurrentFingerprint();
    }

    // Coleta dados comportamentais
    if (this.config.enableBehavioralTracking && this.behavioralTracker) {
      data.behavioral = this.behavioralTracker.getSummaryData();
    }

    // Coleta facial (se solicitado e habilitado)
    if (options.includeFacial && this.facialCapture && this.facialCapture.isAvailable()) {
      try {
        if (!this.facialCapture.getStatus().isCapturing) {
          await this.facialCapture.startCapture();
        }
        data.facial = await this.facialCapture.capturePhoto();
      } catch (error) {
        console.warn('NextTrust: Facial capture failed:', error.message);
        data.facial = { error: error.message };
      }
    }

    return data;
  }

  /**
   * Envia requisição de verificação para o backend
   * @private
   */
  async _sendVerificationRequest(data) {
    const url = `${this.config.apiUrl}/identity/verify`;
    
    const headers = {
      'Content-Type': 'application/json',
      'X-API-Key': this.config.apiKey,
      'X-Session-ID': this.sessionId,
      'User-Agent': `${SDK_NAME}/${SDK_VERSION}`
    };

    const response = await fetch(url, {
      method: 'POST',
      headers: headers,
      body: JSON.stringify(data)
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    return await response.json();
  }

  /**
   * Middleware para integração com frameworks
   * @param {Object} req - Request object
   * @param {Object} res - Response object
   * @param {Function} next - Next function
   */
  middleware(req, res, next) {
    if (!this.isInitialized) {
      return next(new Error('SDK not initialized'));
    }

    // Adiciona dados do SDK ao request
    req.nextTrust = {
      sessionId: this.sessionId,
      fingerprint: this.fingerprintCollector?.getCurrentFingerprint(),
      behavioral: this.behavioralTracker?.getSessionStats()
    };

    next();
  }

  /**
   * Obtém dados da sessão atual
   * @returns {Object} Dados da sessão
   */
  getSessionData() {
    if (!this.isInitialized) {
      return null;
    }

    return {
      sessionId: this.sessionId,
      fingerprint: this.fingerprintCollector?.getCurrentFingerprint(),
      behavioral: this.behavioralTracker?.getSessionStats(),
      facial: this.facialCapture?.getStatus()
    };
  }

  /**
   * Atualiza configuração do SDK
   * @param {Object} newConfig - Nova configuração
   */
  updateConfig(newConfig) {
    this.config = { ...this.config, ...newConfig };
    this._validateConfig();

    // Atualiza configurações dos módulos
    if (this.behavioralTracker) {
      this.behavioralTracker.config = { ...this.behavioralTracker.config, ...newConfig };
    }

    if (this.facialCapture && newConfig.enableFacialCapture !== undefined) {
      this.facialCapture.config.enabled = newConfig.enableFacialCapture;
    }
  }

  /**
   * Para o SDK e limpa recursos
   */
  destroy() {
    if (this.behavioralTracker) {
      this.behavioralTracker.stopTracking();
    }

    if (this.facialCapture) {
      this.facialCapture.cleanup();
    }

    this.isInitialized = false;
    this.sessionId = null;
    this.fingerprintCollector = null;
    this.behavioralTracker = null;
    this.facialCapture = null;

    console.log('NextTrust: SDK destroyed');
  }

  /**
   * Valida configuração do SDK
   * @private
   */
  _validateConfig() {
    if (!this.config.apiUrl) {
      throw new Error('API URL is required');
    }

    if (!this.config.apiKey) {
      throw new Error('API Key is required');
    }

    if (this.config.sessionTimeout < 60000) {
      throw new Error('Session timeout must be at least 60 seconds');
    }
  }

  /**
   * Gera ID único para a sessão
   * @private
   */
  _generateSessionId() {
    return `${SDK_NAME.toLowerCase()}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Obtém versão do SDK
   * @returns {string} Versão do SDK
   */
  getVersion() {
    return SDK_VERSION;
  }

  /**
   * Obtém nome do SDK
   * @returns {string} Nome do SDK
   */
  getName() {
    return SDK_NAME;
  }

  /**
   * Verifica se o SDK está inicializado
   * @returns {boolean} True se inicializado
   */
  isReady() {
    return this.isInitialized;
  }
}

/**
 * Função de inicialização global
 * @param {Object} config - Configuração do SDK
 * @returns {Promise<NextTrustSDK>} Instância do SDK
 */
export async function initSDK(config = {}) {
  const sdk = new NextTrustSDK(config);
  await sdk.init();
  return sdk;
}

// Exporta a classe principal
export default NextTrustSDK;
