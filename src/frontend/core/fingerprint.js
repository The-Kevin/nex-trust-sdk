/**
 * Módulo de coleta de fingerprint do dispositivo
 * Coleta informações passivas sobre o dispositivo e navegador
 */

import { SDK_NAME, SDK_VERSION } from '../../shared/constants/index.js';

/**
 * Classe responsável pela coleta de fingerprint do dispositivo
 */
export class DeviceFingerprintCollector {
  constructor() {
    this.fingerprint = null;
    this.lastUpdate = null;
  }

  /**
   * Coleta o fingerprint completo do dispositivo
   * @returns {Promise<Object>} Dados do fingerprint
   */
  async collectFingerprint() {
    try {
      const fingerprint = {
        // Informações básicas do navegador
        userAgent: navigator.userAgent,
        language: navigator.language,
        languages: navigator.languages,
        platform: navigator.platform,
        
        // Informações da tela
        screenResolution: `${screen.width}x${screen.height}`,
        screenColorDepth: screen.colorDepth,
        screenPixelDepth: screen.pixelDepth,
        
        // Informações de timezone
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        timezoneOffset: new Date().getTimezoneOffset(),
        
        // Informações de hardware
        hardwareConcurrency: navigator.hardwareConcurrency || 'unknown',
        deviceMemory: navigator.deviceMemory || 'unknown',
        
        // Fingerprints avançados
        canvasFingerprint: await this._getCanvasFingerprint(),
        webglFingerprint: await this._getWebGLFingerprint(),
        audioFingerprint: await this._getAudioFingerprint(),
        
        // Fontes disponíveis
        fonts: await this._getAvailableFonts(),
        
        // Plugins do navegador
        plugins: this._getBrowserPlugins(),
        
        // Informações de conectividade
        connection: this._getConnectionInfo(),
        
        // Informações de bateria (se disponível)
        battery: await this._getBatteryInfo(),
        
        // Timestamp da coleta
        timestamp: Date.now(),
        
        // Versão do SDK
        sdkVersion: SDK_VERSION,
        sdkName: SDK_NAME
      };

      this.fingerprint = fingerprint;
      this.lastUpdate = Date.now();
      
      return fingerprint;
    } catch (error) {
      console.error('Erro ao coletar fingerprint:', error);
      throw new Error(`Fingerprint collection failed: ${error.message}`);
    }
  }

  /**
   * Gera fingerprint do canvas
   * @private
   */
  async _getCanvasFingerprint() {
    try {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      
      // Desenha texto com diferentes fontes e estilos
      ctx.textBaseline = 'top';
      ctx.font = '14px Arial';
      ctx.fillStyle = '#f60';
      ctx.fillRect(125, 1, 62, 20);
      ctx.fillStyle = '#069';
      ctx.fillText('NextTrust SDK', 2, 15);
      ctx.fillStyle = 'rgba(102, 204, 0, 0.7)';
      ctx.fillText('NextTrust SDK', 4, 17);
      
      // Adiciona algumas formas geométricas
      ctx.globalCompositeOperation = 'multiply';
      ctx.fillStyle = 'rgb(255,0,255)';
      ctx.beginPath();
      ctx.arc(50, 50, 50, 0, Math.PI * 2, true);
      ctx.closePath();
      ctx.fill();
      
      return canvas.toDataURL();
    } catch (error) {
      return 'canvas_error';
    }
  }

  /**
   * Gera fingerprint do WebGL
   * @private
   */
  async _getWebGLFingerprint() {
    try {
      const canvas = document.createElement('canvas');
      const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
      
      if (!gl) {
        return 'webgl_not_supported';
      }

      const fingerprint = {
        vendor: gl.getParameter(gl.VENDOR),
        renderer: gl.getParameter(gl.RENDERER),
        version: gl.getParameter(gl.VERSION),
        shadingLanguageVersion: gl.getParameter(gl.SHADING_LANGUAGE_VERSION),
        extensions: gl.getSupportedExtensions()
      };

      return JSON.stringify(fingerprint);
    } catch (error) {
      return 'webgl_error';
    }
  }

  /**
   * Gera fingerprint do áudio
   * @private
   */
  async _getAudioFingerprint() {
    try {
      const audioContext = new (window.AudioContext || window.webkitAudioContext)();
      const oscillator = audioContext.createOscillator();
      const analyser = audioContext.createAnalyser();
      const gainNode = audioContext.createGain();
      const scriptProcessor = audioContext.createScriptProcessor(4096, 1, 1);

      oscillator.type = 'triangle';
      oscillator.frequency.setValueAtTime(10000, audioContext.currentTime);

      gainNode.gain.setValueAtTime(0, audioContext.currentTime);

      oscillator.connect(analyser);
      analyser.connect(scriptProcessor);
      scriptProcessor.connect(gainNode);
      gainNode.connect(audioContext.destination);

      oscillator.start(0);

      return new Promise((resolve) => {
        scriptProcessor.onaudioprocess = (event) => {
          const fingerprint = Array.from(event.inputBuffer.getChannelData(0))
            .slice(0, 30)
            .map(x => x.toFixed(6))
            .join(',');
          
          oscillator.stop();
          audioContext.close();
          resolve(fingerprint);
        };
      });
    } catch (error) {
      return 'audio_error';
    }
  }

  /**
   * Detecta fontes disponíveis no sistema
   * @private
   */
  async _getAvailableFonts() {
    const baseFonts = [
      'Arial', 'Arial Black', 'Arial Narrow', 'Arial Rounded MT Bold',
      'Calibri', 'Cambria', 'Candara', 'Century Gothic', 'Comic Sans MS',
      'Consolas', 'Constantia', 'Corbel', 'Courier New', 'Franklin Gothic Medium',
      'Gadget', 'Georgia', 'Helvetica', 'Impact', 'Lucida Console',
      'Lucida Sans Unicode', 'Microsoft Sans Serif', 'Palatino Linotype',
      'Segoe UI', 'Tahoma', 'Times New Roman', 'Trebuchet MS', 'Verdana'
    ];

    const availableFonts = [];
    const testString = 'mmmmmmmmmmlli';
    const testSize = '72px';
    const h = document.getElementsByTagName('body')[0];

    // Cria elemento de teste
    const s = document.createElement('span');
    s.style.fontSize = testSize;
    s.innerHTML = testString;
    const defaultWidth = {};
    const defaultHeight = {};

    // Mede a fonte padrão
    s.style.fontFamily = 'monospace';
    h.appendChild(s);
    defaultWidth.monospace = s.offsetWidth;
    defaultHeight.monospace = s.offsetHeight;
    h.removeChild(s);

    s.style.fontFamily = 'sans-serif';
    h.appendChild(s);
    defaultWidth.sansSerif = s.offsetWidth;
    defaultHeight.sansSerif = s.offsetHeight;
    h.removeChild(s);

    s.style.fontFamily = 'serif';
    h.appendChild(s);
    defaultWidth.serif = s.offsetWidth;
    defaultHeight.serif = s.offsetHeight;
    h.removeChild(s);

    // Testa cada fonte
    for (const font of baseFonts) {
      s.style.fontFamily = font + ',monospace';
      h.appendChild(s);
      const detected = s.offsetWidth !== defaultWidth.monospace || s.offsetHeight !== defaultHeight.monospace;
      h.removeChild(s);
      
      if (detected) {
        availableFonts.push(font);
      }
    }

    return availableFonts;
  }

  /**
   * Obtém plugins do navegador
   * @private
   */
  _getBrowserPlugins() {
    const plugins = [];
    for (let i = 0; i < navigator.plugins.length; i++) {
      plugins.push({
        name: navigator.plugins[i].name,
        description: navigator.plugins[i].description,
        filename: navigator.plugins[i].filename
      });
    }
    return plugins;
  }

  /**
   * Obtém informações de conexão
   * @private
   */
  _getConnectionInfo() {
    if ('connection' in navigator) {
      const conn = navigator.connection;
      return {
        effectiveType: conn.effectiveType,
        downlink: conn.downlink,
        rtt: conn.rtt,
        saveData: conn.saveData
      };
    }
    return 'connection_not_supported';
  }

  /**
   * Obtém informações da bateria
   * @private
   */
  async _getBatteryInfo() {
    try {
      if ('getBattery' in navigator) {
        const battery = await navigator.getBattery();
        return {
          charging: battery.charging,
          chargingTime: battery.chargingTime,
          dischargingTime: battery.dischargingTime,
          level: battery.level
        };
      }
      return 'battery_not_supported';
    } catch (error) {
      return 'battery_error';
    }
  }

  /**
   * Obtém o fingerprint atual (cached)
   * @returns {Object|null} Fingerprint atual ou null se não coletado
   */
  getCurrentFingerprint() {
    return this.fingerprint;
  }

  /**
   * Verifica se o fingerprint precisa ser atualizado
   * @param {number} interval - Intervalo em ms
   * @returns {boolean} True se precisa atualizar
   */
  needsUpdate(interval = 5 * 60 * 1000) {
    return !this.lastUpdate || (Date.now() - this.lastUpdate) > interval;
  }
}
