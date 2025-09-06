/**
 * Módulo de captura facial opcional
 * Requer consentimento explícito do usuário
 */

/**
 * Classe responsável pela captura facial
 */
export class FacialCaptureModule {
  constructor(config = {}) {
    this.config = {
      enabled: config.enabled || false,
      quality: config.quality || 0.8,
      maxWidth: config.maxWidth || 640,
      maxHeight: config.maxHeight || 480,
      format: config.format || 'image/jpeg',
      ...config
    };
    
    this.stream = null;
    this.video = null;
    this.canvas = null;
    this.ctx = null;
    this.isCapturing = false;
    this.consentGiven = false;
  }

  /**
   * Solicita consentimento do usuário para captura facial
   * @returns {Promise<boolean>} True se consentimento foi dado
   */
  async requestConsent() {
    return new Promise((resolve) => {
      const modal = this._createConsentModal();
      document.body.appendChild(modal);

      const acceptBtn = modal.querySelector('.accept-btn');
      const declineBtn = modal.querySelector('.decline-btn');

      acceptBtn.addEventListener('click', () => {
        this.consentGiven = true;
        document.body.removeChild(modal);
        resolve(true);
      });

      declineBtn.addEventListener('click', () => {
        this.consentGiven = false;
        document.body.removeChild(modal);
        resolve(false);
      });

      // Auto-close após 30 segundos se não houver resposta
      setTimeout(() => {
        if (document.body.contains(modal)) {
          this.consentGiven = false;
          document.body.removeChild(modal);
          resolve(false);
        }
      }, 30000);
    });
  }

  /**
   * Cria modal de consentimento
   * @private
   */
  _createConsentModal() {
    const modal = document.createElement('div');
    modal.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: rgba(0, 0, 0, 0.8);
      display: flex;
      justify-content: center;
      align-items: center;
      z-index: 10000;
      font-family: Arial, sans-serif;
    `;

    const content = document.createElement('div');
    content.style.cssText = `
      background: white;
      padding: 30px;
      border-radius: 10px;
      max-width: 500px;
      text-align: center;
      box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
    `;

    content.innerHTML = `
      <h2 style="margin-top: 0; color: #333;">Verificação de Identidade</h2>
      <p style="color: #666; line-height: 1.5; margin: 20px 0;">
        Para sua segurança, gostaríamos de capturar uma foto para verificação de identidade.
        Esta foto será usada apenas para fins de autenticação e não será armazenada permanentemente.
      </p>
      <div style="margin: 20px 0;">
        <button class="accept-btn" style="
          background: #4CAF50;
          color: white;
          border: none;
          padding: 12px 24px;
          margin: 0 10px;
          border-radius: 5px;
          cursor: pointer;
          font-size: 16px;
        ">Aceitar</button>
        <button class="decline-btn" style="
          background: #f44336;
          color: white;
          border: none;
          padding: 12px 24px;
          margin: 0 10px;
          border-radius: 5px;
          cursor: pointer;
          font-size: 16px;
        ">Recusar</button>
      </div>
      <p style="font-size: 12px; color: #999; margin-top: 20px;">
        Você pode recusar esta verificação, mas isso pode afetar o processo de autenticação.
      </p>
    `;

    modal.appendChild(content);
    return modal;
  }

  /**
   * Inicia a captura facial
   * @returns {Promise<boolean>} True se captura foi iniciada com sucesso
   */
  async startCapture() {
    if (!this.config.enabled) {
      throw new Error('Facial capture is disabled');
    }

    if (!this.consentGiven) {
      const consent = await this.requestConsent();
      if (!consent) {
        throw new Error('User declined facial capture consent');
      }
    }

    try {
      // Solicita acesso à câmera
      this.stream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: this.config.maxWidth },
          height: { ideal: this.config.maxHeight },
          facingMode: 'user' // Câmera frontal
        }
      });

      // Cria elementos de vídeo e canvas
      this._createVideoElement();
      this._createCanvasElement();

      // Inicia o vídeo
      this.video.srcObject = this.stream;
      await this.video.play();

      this.isCapturing = true;
      console.log('NextTrust: Facial capture started');
      
      return true;
    } catch (error) {
      console.error('NextTrust: Error starting facial capture:', error);
      throw new Error(`Failed to start facial capture: ${error.message}`);
    }
  }

  /**
   * Para a captura facial
   */
  stopCapture() {
    if (this.stream) {
      this.stream.getTracks().forEach(track => track.stop());
      this.stream = null;
    }

    if (this.video) {
      this.video.pause();
      this.video.srcObject = null;
    }

    this.isCapturing = false;
    console.log('NextTrust: Facial capture stopped');
  }

  /**
   * Captura uma foto do usuário
   * @returns {Promise<Object>} Dados da foto capturada
   */
  async capturePhoto() {
    if (!this.isCapturing) {
      throw new Error('Facial capture is not active');
    }

    try {
      // Aguarda um frame para garantir que o vídeo está pronto
      await new Promise(resolve => {
        this.video.addEventListener('loadeddata', resolve, { once: true });
      });

      // Desenha o frame atual no canvas
      this.ctx.drawImage(
        this.video,
        0, 0,
        this.canvas.width,
        this.canvas.height
      );

      // Converte para base64
      const imageData = this.canvas.toDataURL(this.config.format, this.config.quality);

      // Cria dados da captura
      const captureData = {
        imageData: imageData,
        timestamp: Date.now(),
        metadata: {
          width: this.canvas.width,
          height: this.canvas.height,
          format: this.config.format,
          quality: this.config.quality,
          userAgent: navigator.userAgent,
          consentGiven: this.consentGiven
        }
      };

      console.log('NextTrust: Photo captured successfully');
      return captureData;

    } catch (error) {
      console.error('NextTrust: Error capturing photo:', error);
      throw new Error(`Failed to capture photo: ${error.message}`);
    }
  }

  /**
   * Cria elemento de vídeo
   * @private
   */
  _createVideoElement() {
    this.video = document.createElement('video');
    this.video.style.cssText = `
      position: fixed;
      top: -9999px;
      left: -9999px;
      width: ${this.config.maxWidth}px;
      height: ${this.config.maxHeight}px;
    `;
    this.video.autoplay = true;
    this.video.muted = true;
    this.video.playsInline = true;
    document.body.appendChild(this.video);
  }

  /**
   * Cria elemento de canvas
   * @private
   */
  _createCanvasElement() {
    this.canvas = document.createElement('canvas');
    this.canvas.width = this.config.maxWidth;
    this.canvas.height = this.config.maxHeight;
    this.ctx = this.canvas.getContext('2d');
  }

  /**
   * Verifica se a captura facial está disponível
   * @returns {boolean} True se disponível
   */
  isAvailable() {
    return !!(
      navigator.mediaDevices &&
      navigator.mediaDevices.getUserMedia &&
      document.createElement('canvas').getContext
    );
  }

  /**
   * Obtém status da captura
   * @returns {Object} Status atual
   */
  getStatus() {
    return {
      enabled: this.config.enabled,
      available: this.isAvailable(),
      isCapturing: this.isCapturing,
      consentGiven: this.consentGiven,
      hasStream: !!this.stream
    };
  }

  /**
   * Limpa recursos
   */
  cleanup() {
    this.stopCapture();
    
    if (this.video && document.body.contains(this.video)) {
      document.body.removeChild(this.video);
    }
    
    this.video = null;
    this.canvas = null;
    this.ctx = null;
    this.consentGiven = false;
  }
}
