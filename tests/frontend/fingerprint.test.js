/**
 * Testes para o módulo de fingerprint
 */

import { DeviceFingerprintCollector } from '../../src/frontend/core/fingerprint.js';

describe('DeviceFingerprintCollector', () => {
  let collector;

  beforeEach(() => {
    collector = new DeviceFingerprintCollector();
  });

  afterEach(() => {
    collector = null;
  });

  describe('collectFingerprint', () => {
    test('deve coletar fingerprint completo', async () => {
      const fingerprint = await collector.collectFingerprint();

      expect(fingerprint).toBeDefined();
      expect(fingerprint.userAgent).toBe('Mozilla/5.0 (Test Browser)');
      expect(fingerprint.language).toBe('en-US');
      expect(fingerprint.platform).toBe('Test Platform');
      expect(fingerprint.screenResolution).toBe('1920x1080');
      expect(fingerprint.timezone).toBe('UTC');
      expect(fingerprint.canvasFingerprint).toBeDefined();
      expect(fingerprint.webglFingerprint).toBeDefined();
      expect(fingerprint.audioFingerprint).toBeDefined();
      expect(fingerprint.fonts).toBeInstanceOf(Array);
      expect(fingerprint.plugins).toBeInstanceOf(Array);
      expect(fingerprint.hardwareConcurrency).toBe('4');
      expect(fingerprint.deviceMemory).toBe('8');
      expect(fingerprint.timestamp).toBeDefined();
      expect(fingerprint.sdkVersion).toBeDefined();
      expect(fingerprint.sdkName).toBeDefined();
    });

    test('deve atualizar lastUpdate após coleta', async () => {
      expect(collector.lastUpdate).toBeNull();
      
      await collector.collectFingerprint();
      
      expect(collector.lastUpdate).toBeDefined();
      expect(typeof collector.lastUpdate).toBe('number');
    });

    test('deve armazenar fingerprint no cache', async () => {
      const fingerprint = await collector.collectFingerprint();
      
      expect(collector.fingerprint).toEqual(fingerprint);
    });
  });

  describe('getCurrentFingerprint', () => {
    test('deve retornar null se não há fingerprint coletado', () => {
      expect(collector.getCurrentFingerprint()).toBeNull();
    });

    test('deve retornar fingerprint atual após coleta', async () => {
      await collector.collectFingerprint();
      
      const current = collector.getCurrentFingerprint();
      expect(current).toBeDefined();
      expect(current.userAgent).toBe('Mozilla/5.0 (Test Browser)');
    });
  });

  describe('needsUpdate', () => {
    test('deve retornar true se não há fingerprint coletado', () => {
      expect(collector.needsUpdate()).toBe(true);
    });

    test('deve retornar false se fingerprint é recente', async () => {
      await collector.collectFingerprint();
      
      expect(collector.needsUpdate(60000)).toBe(false);
    });

    test('deve retornar true se fingerprint é antigo', async () => {
      await collector.collectFingerprint();
      
      // Simula fingerprint antigo
      collector.lastUpdate = Date.now() - 300000; // 5 minutos atrás
      
      expect(collector.needsUpdate(60000)).toBe(true);
    });
  });

  describe('_getCanvasFingerprint', () => {
    test('deve gerar fingerprint do canvas', async () => {
      const canvasFingerprint = await collector._getCanvasFingerprint();
      
      expect(canvasFingerprint).toBeDefined();
      expect(typeof canvasFingerprint).toBe('string');
    });
  });

  describe('_getWebGLFingerprint', () => {
    test('deve gerar fingerprint do WebGL', async () => {
      const webglFingerprint = await collector._getWebGLFingerprint();
      
      expect(webglFingerprint).toBeDefined();
      expect(typeof webglFingerprint).toBe('string');
    });
  });

  describe('_getAudioFingerprint', () => {
    test('deve gerar fingerprint do áudio', async () => {
      const audioFingerprint = await collector._getAudioFingerprint();
      
      expect(audioFingerprint).toBeDefined();
      expect(typeof audioFingerprint).toBe('string');
    });
  });

  describe('_getAvailableFonts', () => {
    test('deve detectar fontes disponíveis', async () => {
      const fonts = await collector._getAvailableFonts();
      
      expect(fonts).toBeInstanceOf(Array);
      expect(fonts.length).toBeGreaterThan(0);
    });
  });

  describe('_getBrowserPlugins', () => {
    test('deve obter plugins do navegador', () => {
      const plugins = collector._getBrowserPlugins();
      
      expect(plugins).toBeInstanceOf(Array);
      expect(plugins.length).toBeGreaterThan(0);
      expect(plugins[0]).toHaveProperty('name');
      expect(plugins[0]).toHaveProperty('description');
      expect(plugins[0]).toHaveProperty('filename');
    });
  });

  describe('_getConnectionInfo', () => {
    test('deve obter informações de conexão', () => {
      const connection = collector._getConnectionInfo();
      
      expect(connection).toBeDefined();
    });
  });

  describe('_getBatteryInfo', () => {
    test('deve obter informações da bateria', async () => {
      const battery = await collector._getBatteryInfo();
      
      expect(battery).toBeDefined();
    });
  });
});
