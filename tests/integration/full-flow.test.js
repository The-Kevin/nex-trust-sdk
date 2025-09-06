/**
 * Testes de integração completos para o NextTrust SDK
 * Testa o fluxo completo do frontend ao backend
 */

import { NextTrustServer } from '../../src/backend/server.js';
import request from 'supertest';

describe('NextTrust SDK - Fluxo Completo', () => {
  let server;
  let app;
  
  const testConfig = {
    port: 3001, // Porta diferente para testes
    apiKey: 'test-api-key-integration',
    rulesPath: './config/rules.json',
    enableCors: true,
    enableRateLimit: false // Desabilita rate limiting nos testes
  };

  beforeAll(async () => {
    server = new NextTrustServer(testConfig);
    await server.initialize();
    app = server.getApp();
  });

  afterAll(async () => {
    if (server) {
      await server.stop();
    }
  });

  describe('Health Check', () => {
    test('deve retornar status healthy', async () => {
      const response = await request(app)
        .get('/health')
        .expect(200);

      expect(response.body).toHaveProperty('status', 'healthy');
      expect(response.body).toHaveProperty('timestamp');
      expect(response.body).toHaveProperty('version');
      expect(response.body).toHaveProperty('services');
      expect(response.body.services.ruleEngine).toBe('ready');
      expect(response.body.services.scoringService).toBe('ready');
    });
  });

  describe('API Root', () => {
    test('deve retornar informações da API', async () => {
      const response = await request(app)
        .get('/')
        .expect(200);

      expect(response.body).toHaveProperty('name', 'NextTrust SDK API');
      expect(response.body).toHaveProperty('version');
      expect(response.body).toHaveProperty('description');
      expect(response.body).toHaveProperty('endpoints');
    });
  });

  describe('Identity Verification - Fluxo Completo', () => {
    const validVerificationData = {
      sessionId: 'test_session_' + Date.now(),
      timestamp: Date.now(),
      fingerprint: {
        userAgent: 'Mozilla/5.0 (Test Browser)',
        language: 'en-US',
        platform: 'Test Platform',
        screenResolution: '1920x1080',
        timezone: 'UTC',
        canvasFingerprint: 'test_canvas_data_very_long_string_for_testing',
        webglFingerprint: 'test_webgl_data',
        audioFingerprint: 'test_audio_data',
        fonts: ['Arial', 'Times New Roman', 'Helvetica', 'Verdana'],
        plugins: [
          { name: 'Test Plugin', description: 'Test Description', filename: 'test.dll' }
        ],
        hardwareConcurrency: '4',
        deviceMemory: '8',
        connection: { effectiveType: '4g', downlink: 10, rtt: 50 },
        battery: { charging: true, level: 0.8 },
        timestamp: Date.now(),
        sdkVersion: '1.0.0',
        sdkName: 'NextTrustSDK'
      },
      behavioral: {
        sessionId: 'behavioral_session_' + Date.now(),
        startTime: Date.now() - 120000,
        duration: 120000,
        totalEvents: 25,
        eventCounts: {
          click: 10,
          scroll: 8,
          keystroke: 5,
          mousemove: 2
        },
        metrics: {
          clickFrequency: 0.08,
          scrollFrequency: 0.07,
          keystrokeFrequency: 0.04,
          averageClickInterval: 12000,
          averageScrollInterval: 15000,
          mouseMovementDistance: 1500,
          formInteractionCount: 2,
          focusBlurCount: 4
        },
        sampleEvents: [
          {
            type: 'click',
            timestamp: Date.now() - 60000,
            target: { tagName: 'BUTTON', id: 'test-btn' },
            position: { clientX: 100, clientY: 200 }
          }
        ]
      }
    };

    test('deve processar verificação completa com sucesso', async () => {
      const response = await request(app)
        .post('/api/identity/verify')
        .set('X-API-Key', testConfig.apiKey)
        .set('X-Session-ID', validVerificationData.sessionId)
        .send(validVerificationData)
        .expect(200);

      // Verifica estrutura da resposta
      expect(response.body).toHaveProperty('score');
      expect(response.body).toHaveProperty('decision');
      expect(response.body).toHaveProperty('reasons');
      expect(response.body).toHaveProperty('sessionId');
      expect(response.body).toHaveProperty('timestamp');
      expect(response.body).toHaveProperty('processingTime');
      expect(response.body).toHaveProperty('ruleResults');
      expect(response.body).toHaveProperty('metadata');

      // Verifica valores
      expect(typeof response.body.score).toBe('number');
      expect(response.body.score).toBeGreaterThanOrEqual(0);
      expect(response.body.score).toBeLessThanOrEqual(100);
      
      expect(['allow', 'review', 'deny']).toContain(response.body.decision);
      expect(Array.isArray(response.body.reasons)).toBe(true);
      expect(Array.isArray(response.body.ruleResults)).toBe(true);
      
      expect(response.body.sessionId).toBe(validVerificationData.sessionId);
      expect(typeof response.body.processingTime).toBe('number');

      // Verifica metadata
      expect(response.body.metadata).toHaveProperty('fingerprint');
      expect(response.body.metadata).toHaveProperty('behavioral');
      expect(response.body.metadata).toHaveProperty('facial');
      
      expect(response.body.metadata.fingerprint.collected).toBe(true);
      expect(response.body.metadata.behavioral.collected).toBe(true);
      expect(response.body.metadata.behavioral.eventCount).toBe(25);
      expect(response.body.metadata.behavioral.duration).toBe(120000);
    });

    test('deve processar verificação com dados faciais', async () => {
      const dataWithFacial = {
        ...validVerificationData,
        sessionId: 'test_session_facial_' + Date.now(),
        facial: {
          imageData: 'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQEAYABgAAD/2wBDAAEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQH/2wBDAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQH/wAARCAABAAEDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/8QAFQEBAQAAAAAAAAAAAAAAAAAAAAX/xAAUEQEAAAAAAAAAAAAAAAAAAAAA/9oADAMBAAIRAxEAPwA/8A==',
          timestamp: Date.now(),
          metadata: {
            width: 640,
            height: 480,
            format: 'image/jpeg',
            quality: 0.8,
            userAgent: 'Mozilla/5.0 (Test Browser)',
            consentGiven: true
          }
        }
      };

      const response = await request(app)
        .post('/api/identity/verify')
        .set('X-API-Key', testConfig.apiKey)
        .set('X-Session-ID', dataWithFacial.sessionId)
        .send(dataWithFacial)
        .expect(200);

      expect(response.body.metadata.facial.collected).toBe(true);
      expect(response.body.metadata.facial.error).toBeNull();
    });

    test('deve processar verificação com dados mínimos', async () => {
      const minimalData = {
        sessionId: 'test_session_minimal_' + Date.now(),
        timestamp: Date.now(),
        fingerprint: {
          userAgent: 'Mozilla/5.0 (Minimal Browser)',
          language: 'en-US',
          platform: 'Minimal Platform',
          screenResolution: '1024x768',
          timezone: 'UTC',
          canvasFingerprint: 'minimal_canvas',
          webglFingerprint: 'minimal_webgl',
          audioFingerprint: 'minimal_audio',
          fonts: ['Arial'],
          plugins: [],
          hardwareConcurrency: '2',
          deviceMemory: '4',
          timestamp: Date.now(),
          sdkVersion: '1.0.0',
          sdkName: 'NextTrustSDK'
        }
      };

      const response = await request(app)
        .post('/api/identity/verify')
        .set('X-API-Key', testConfig.apiKey)
        .set('X-Session-ID', minimalData.sessionId)
        .send(minimalData)
        .expect(200);

      expect(response.body).toHaveProperty('score');
      expect(response.body).toHaveProperty('decision');
      expect(response.body.metadata.fingerprint.collected).toBe(true);
      expect(response.body.metadata.behavioral.collected).toBe(false);
    });

    test('deve rejeitar verificação sem API key', async () => {
      const response = await request(app)
        .post('/api/identity/verify')
        .send(validVerificationData)
        .expect(401);

      expect(response.body).toHaveProperty('error');
      expect(response.body).toHaveProperty('code');
    });

    test('deve rejeitar verificação com API key inválida', async () => {
      const response = await request(app)
        .post('/api/identity/verify')
        .set('X-API-Key', 'invalid-api-key')
        .send(validVerificationData)
        .expect(401);

      expect(response.body).toHaveProperty('error');
      expect(response.body).toHaveProperty('code');
    });

    test('deve rejeitar verificação com dados inválidos', async () => {
      const invalidData = {
        sessionId: '', // ID vazio
        timestamp: Date.now(),
        fingerprint: null // Fingerprint nulo
      };

      const response = await request(app)
        .post('/api/identity/verify')
        .set('X-API-Key', testConfig.apiKey)
        .send(invalidData)
        .expect(400);

      expect(response.body).toHaveProperty('error');
      expect(response.body).toHaveProperty('code');
    });

    test('deve rejeitar verificação com timestamp muito antigo', async () => {
      const oldData = {
        ...validVerificationData,
        sessionId: 'test_session_old_' + Date.now(),
        timestamp: Date.now() - (10 * 60 * 1000) // 10 minutos atrás
      };

      const response = await request(app)
        .post('/api/identity/verify')
        .set('X-API-Key', testConfig.apiKey)
        .send(oldData)
        .expect(400);

      expect(response.body).toHaveProperty('error');
      expect(response.body.error).toContain('too old');
    });
  });

  describe('Identity Status', () => {
    test('deve retornar status do serviço', async () => {
      const response = await request(app)
        .get('/api/identity/status')
        .set('X-API-Key', testConfig.apiKey)
        .expect(200);

      expect(response.body).toHaveProperty('service', 'NextTrust Identity Verification');
      expect(response.body).toHaveProperty('status', 'operational');
      expect(response.body).toHaveProperty('timestamp');
      expect(response.body).toHaveProperty('version');
      expect(response.body).toHaveProperty('components');
      expect(response.body).toHaveProperty('limits');
    });
  });

  describe('Endpoints de Desenvolvimento', () => {
    test('deve retornar regras ativas em desenvolvimento', async () => {
      // Simula ambiente de desenvolvimento
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'development';

      const response = await request(app)
        .get('/api/identity/rules')
        .set('X-API-Key', testConfig.apiKey)
        .expect(200);

      expect(response.body).toHaveProperty('rules');
      expect(response.body).toHaveProperty('count');
      expect(response.body).toHaveProperty('timestamp');
      expect(Array.isArray(response.body.rules)).toBe(true);

      // Restaura ambiente original
      process.env.NODE_ENV = originalEnv;
    });

    test('deve processar teste de verificação em desenvolvimento', async () => {
      // Simula ambiente de desenvolvimento
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'development';

      const response = await request(app)
        .post('/api/identity/test')
        .set('X-API-Key', testConfig.apiKey)
        .expect(200);

      expect(response.body).toHaveProperty('message', 'Test verification completed');
      expect(response.body).toHaveProperty('result');
      expect(response.body).toHaveProperty('timestamp');
      expect(response.body.result).toHaveProperty('score');
      expect(response.body.result).toHaveProperty('decision');

      // Restaura ambiente original
      process.env.NODE_ENV = originalEnv;
    });
  });

  describe('Tratamento de Erros', () => {
    test('deve retornar 404 para rota inexistente', async () => {
      const response = await request(app)
        .get('/api/nonexistent')
        .set('X-API-Key', testConfig.apiKey)
        .expect(404);

      expect(response.body).toHaveProperty('error');
      expect(response.body).toHaveProperty('code');
      expect(response.body).toHaveProperty('path');
    });

    test('deve tratar JSON malformado', async () => {
      const response = await request(app)
        .post('/api/identity/verify')
        .set('X-API-Key', testConfig.apiKey)
        .set('Content-Type', 'application/json')
        .send('{ invalid json }')
        .expect(400);

      expect(response.body).toHaveProperty('error');
      expect(response.body.error).toContain('JSON');
    });
  });

  describe('Performance e Limites', () => {
    test('deve processar verificação em tempo aceitável', async () => {
      const startTime = Date.now();

      const response = await request(app)
        .post('/api/identity/verify')
        .set('X-API-Key', testConfig.apiKey)
        .send({
          ...validVerificationData,
          sessionId: 'test_session_perf_' + Date.now()
        })
        .expect(200);

      const endTime = Date.now();
      const processingTime = endTime - startTime;

      // Verifica se processou em menos de 5 segundos
      expect(processingTime).toBeLessThan(5000);
      
      // Verifica se o tempo reportado está próximo do real
      expect(Math.abs(response.body.processingTime - processingTime)).toBeLessThan(1000);
    });

    test('deve aceitar payload de tamanho razoável', async () => {
      const largeData = {
        ...validVerificationData,
        sessionId: 'test_session_large_' + Date.now(),
        behavioral: {
          ...validVerificationData.behavioral,
          sampleEvents: Array(100).fill().map((_, i) => ({
            type: 'click',
            timestamp: Date.now() - (i * 1000),
            target: { tagName: 'BUTTON', id: `btn-${i}` },
            position: { clientX: i * 10, clientY: i * 5 }
          }))
        }
      };

      const response = await request(app)
        .post('/api/identity/verify')
        .set('X-API-Key', testConfig.apiKey)
        .send(largeData)
        .expect(200);

      expect(response.body).toHaveProperty('score');
      expect(response.body.metadata.behavioral.eventCount).toBeGreaterThan(0);
    });
  });

  describe('Cenários de Scoring', () => {
    test('deve dar score alto para dados completos e confiáveis', async () => {
      const highQualityData = {
        ...validVerificationData,
        sessionId: 'test_session_high_' + Date.now(),
        behavioral: {
          ...validVerificationData.behavioral,
          duration: 300000, // 5 minutos
          totalEvents: 50,
          metrics: {
            clickFrequency: 0.15,
            scrollFrequency: 0.1,
            keystrokeFrequency: 1.0,
            mouseMovementDistance: 2000,
            formInteractionCount: 3,
            focusBlurCount: 8
          }
        }
      };

      const response = await request(app)
        .post('/api/identity/verify')
        .set('X-API-Key', testConfig.apiKey)
        .send(highQualityData)
        .expect(200);

      // Dados de alta qualidade devem resultar em score alto
      expect(response.body.score).toBeGreaterThan(60);
    });

    test('deve dar score baixo para dados suspeitos', async () => {
      const suspiciousData = {
        ...validVerificationData,
        sessionId: 'test_session_suspicious_' + Date.now(),
        fingerprint: {
          ...validVerificationData.fingerprint,
          userAgent: 'Mozilla/5.0 (compatible; Googlebot/2.1)' // User agent suspeito
        },
        behavioral: {
          ...validVerificationData.behavioral,
          duration: 5000, // Muito curto
          totalEvents: 2,
          metrics: {
            clickFrequency: 10.0, // Muito alto
            keystrokeFrequency: 20.0, // Muito alto
            mouseMovementDistance: 5 // Muito baixo
          }
        }
      };

      const response = await request(app)
        .post('/api/identity/verify')
        .set('X-API-Key', testConfig.apiKey)
        .send(suspiciousData)
        .expect(200);

      // Dados suspeitos devem resultar em score baixo
      expect(response.body.score).toBeLessThan(60);
      expect(response.body.decision).toBe('deny');
    });
  });
});
