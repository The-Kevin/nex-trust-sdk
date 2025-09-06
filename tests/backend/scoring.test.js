/**
 * Testes para o Serviço de Scoring
 */

import { ScoringService } from '../../src/backend/services/scoring.js';
import { RuleEngine } from '../../src/backend/services/rule-engine.js';
import { DECISION_TYPES } from '../../src/shared/constants/index.js';

describe('ScoringService', () => {
  let scoringService;
  let mockRuleEngine;

  beforeEach(() => {
    mockRuleEngine = {
      getActiveRules: jest.fn(() => []),
      getConfig: jest.fn(() => ({ rules: [], thresholds: {} }))
    };
    scoringService = new ScoringService(mockRuleEngine);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('constructor', () => {
    test('deve inicializar com rule engine', () => {
      expect(scoringService.ruleEngine).toBe(mockRuleEngine);
      expect(scoringService.thresholds).toEqual({
        allow: 80,
        review: 50,
        deny: 0
      });
    });
  });

  describe('calculateScore', () => {
    test('deve calcular score completo com todos os dados', async () => {
      const testData = {
        fingerprint: {
          userAgent: 'Mozilla/5.0 (Test Browser)',
          canvasFingerprint: 'test_canvas_data',
          webglFingerprint: 'test_webgl_data',
          audioFingerprint: 'test_audio_data',
          fonts: ['Arial', 'Times New Roman'],
          timestamp: Date.now()
        },
        behavioral: {
          totalEvents: 20,
          duration: 120000,
          metrics: {
            clickFrequency: 0.2,
            scrollFrequency: 0.1,
            keystrokeFrequency: 0.5,
            mouseMovementDistance: 500
          }
        },
        facial: {
          imageData: 'test_image_data',
          timestamp: Date.now()
        },
        sessionId: 'test_session',
        timestamp: Date.now()
      };

      const ruleResults = [
        { id: 'rule1', passed: true, weight: 10, score: 10 },
        { id: 'rule2', passed: false, weight: 5, score: 0 }
      ];

      const result = await scoringService.calculateScore(testData, ruleResults);

      expect(result).toHaveProperty('score');
      expect(result).toHaveProperty('reasons');
      expect(result).toHaveProperty('breakdown');
      
      expect(typeof result.score).toBe('number');
      expect(result.score).toBeGreaterThanOrEqual(0);
      expect(result.score).toBeLessThanOrEqual(100);
      
      expect(Array.isArray(result.reasons)).toBe(true);
      expect(result.reasons.length).toBeGreaterThan(0);
      
      expect(result.breakdown).toHaveProperty('rule');
      expect(result.breakdown).toHaveProperty('behavioral');
      expect(result.breakdown).toHaveProperty('fingerprint');
      expect(result.breakdown).toHaveProperty('facial');
      expect(result.breakdown).toHaveProperty('dataQuality');
    });

    test('deve calcular score com dados mínimos', async () => {
      const testData = {
        fingerprint: {
          userAgent: 'test',
          timestamp: Date.now()
        },
        sessionId: 'test_session',
        timestamp: Date.now()
      };

      const ruleResults = [];

      const result = await scoringService.calculateScore(testData, ruleResults);

      expect(result.score).toBeDefined();
      expect(result.reasons).toBeDefined();
      expect(result.breakdown).toBeDefined();
    });

    test('deve limitar score entre 0 e 100', async () => {
      const testData = {
        fingerprint: { userAgent: 'test', timestamp: Date.now() },
        sessionId: 'test_session',
        timestamp: Date.now()
      };

      const ruleResults = [
        { id: 'rule1', passed: true, weight: 1000, score: 1000 } // Score muito alto
      ];

      const result = await scoringService.calculateScore(testData, ruleResults);

      expect(result.score).toBeLessThanOrEqual(100);
    });
  });

  describe('_calculateRuleScore', () => {
    test('deve calcular score baseado nas regras', () => {
      const ruleResults = [
        { id: 'rule1', passed: true, weight: 20, score: 20 },
        { id: 'rule2', passed: false, weight: 10, score: 0 },
        { id: 'rule3', passed: true, weight: 15, score: 15 }
      ];

      const score = scoringService._calculateRuleScore(ruleResults);

      expect(typeof score).toBe('number');
      expect(score).toBeGreaterThanOrEqual(0);
      expect(score).toBeLessThanOrEqual(100);
    });

    test('deve retornar score neutro se não há regras', () => {
      const score = scoringService._calculateRuleScore([]);

      expect(score).toBe(50);
    });

    test('deve ignorar regras com erro', () => {
      const ruleResults = [
        { id: 'rule1', passed: true, weight: 20, score: 20 },
        { id: 'rule2', error: 'Rule error', weight: 10, score: 0 }
      ];

      const score = scoringService._calculateRuleScore(ruleResults);

      expect(score).toBeDefined();
      expect(typeof score).toBe('number');
    });
  });

  describe('_calculateBehavioralScore', () => {
    test('deve calcular score comportamental com dados válidos', () => {
      const behavioral = {
        duration: 120000, // 2 minutos
        totalEvents: 25,
        metrics: {
          clickFrequency: 0.2,
          scrollFrequency: 0.1,
          keystrokeFrequency: 0.5,
          mouseMovementDistance: 500,
          formInteractionCount: 1,
          focusBlurCount: 3
        }
      };

      const score = scoringService._calculateBehavioralScore(behavioral);

      expect(typeof score).toBe('number');
      expect(score).toBeGreaterThanOrEqual(0);
      expect(score).toBeLessThanOrEqual(100);
    });

    test('deve retornar score baixo se não há dados comportamentais', () => {
      const score = scoringService._calculateBehavioralScore(null);

      expect(score).toBe(30);
    });

    test('deve penalizar sessões muito curtas', () => {
      const behavioral = {
        duration: 5000, // 5 segundos
        totalEvents: 2,
        metrics: {}
      };

      const score = scoringService._calculateBehavioralScore(behavioral);

      expect(score).toBeLessThan(50);
    });

    test('deve penalizar frequência anormal de keystrokes', () => {
      const behavioral = {
        duration: 60000,
        totalEvents: 100,
        metrics: {
          keystrokeFrequency: 15 // Muito alto
        }
      };

      const score = scoringService._calculateBehavioralScore(behavioral);

      expect(score).toBeLessThan(50);
    });
  });

  describe('_calculateFingerprintScore', () => {
    test('deve calcular score de fingerprint completo', () => {
      const fingerprint = {
        userAgent: 'Mozilla/5.0 (Test Browser)',
        canvasFingerprint: 'test_canvas_data_very_long_string',
        webglFingerprint: 'test_webgl_data',
        audioFingerprint: 'test_audio_data',
        fonts: ['Arial', 'Times New Roman', 'Helvetica', 'Verdana', 'Georgia', 'Courier New']
      };

      const score = scoringService._calculateFingerprintScore(fingerprint);

      expect(typeof score).toBe('number');
      expect(score).toBeGreaterThanOrEqual(0);
      expect(score).toBeLessThanOrEqual(100);
    });

    test('deve retornar score zero se não há fingerprint', () => {
      const score = scoringService._calculateFingerprintScore(null);

      expect(score).toBe(0);
    });

    test('deve penalizar user agents suspeitos', () => {
      const fingerprint = {
        userAgent: 'Mozilla/5.0 (compatible; Googlebot/2.1)',
        canvasFingerprint: 'test',
        webglFingerprint: 'test',
        audioFingerprint: 'test'
      };

      const score = scoringService._calculateFingerprintScore(fingerprint);

      expect(score).toBeLessThan(50);
    });
  });

  describe('_calculateFacialScore', () => {
    test('deve retornar score alto para captura facial bem-sucedida', () => {
      const facial = {
        imageData: 'test_image_data'
      };

      const score = scoringService._calculateFacialScore(facial);

      expect(score).toBe(80);
    });

    test('deve retornar score neutro se não há dados faciais', () => {
      const score = scoringService._calculateFacialScore(null);

      expect(score).toBe(50);
    });

    test('deve retornar score baixo se há erro na captura facial', () => {
      const facial = {
        error: 'Camera not available'
      };

      const score = scoringService._calculateFacialScore(facial);

      expect(score).toBe(40);
    });
  });

  describe('_calculateDataQualityScore', () => {
    test('deve calcular score de qualidade dos dados', () => {
      const data = {
        timestamp: Date.now() - 30000, // 30 segundos atrás
        fingerprint: { userAgent: 'test' },
        behavioral: { totalEvents: 10 },
        facial: { imageData: 'test' }
      };

      const score = scoringService._calculateDataQualityScore(data);

      expect(typeof score).toBe('number');
      expect(score).toBeGreaterThanOrEqual(0);
      expect(score).toBeLessThanOrEqual(100);
    });

    test('deve penalizar dados muito antigos', () => {
      const data = {
        timestamp: Date.now() - 600000, // 10 minutos atrás
        fingerprint: { userAgent: 'test' }
      };

      const score = scoringService._calculateDataQualityScore(data);

      expect(score).toBeLessThan(50);
    });
  });

  describe('getDecision', () => {
    test('deve retornar ALLOW para score alto', () => {
      const decision = scoringService.getDecision(85);

      expect(decision).toBe(DECISION_TYPES.ALLOW);
    });

    test('deve retornar REVIEW para score médio', () => {
      const decision = scoringService.getDecision(60);

      expect(decision).toBe(DECISION_TYPES.REVIEW);
    });

    test('deve retornar DENY para score baixo', () => {
      const decision = scoringService.getDecision(30);

      expect(decision).toBe(DECISION_TYPES.DENY);
    });
  });

  describe('updateThresholds', () => {
    test('deve atualizar thresholds', () => {
      const newThresholds = {
        allow: 90,
        review: 60,
        deny: 10
      };

      scoringService.updateThresholds(newThresholds);

      expect(scoringService.thresholds).toEqual(newThresholds);
    });

    test('deve atualizar apenas thresholds fornecidos', () => {
      const originalThresholds = { ...scoringService.thresholds };
      const newThresholds = { allow: 90 };

      scoringService.updateThresholds(newThresholds);

      expect(scoringService.thresholds.allow).toBe(90);
      expect(scoringService.thresholds.review).toBe(originalThresholds.review);
      expect(scoringService.thresholds.deny).toBe(originalThresholds.deny);
    });
  });

  describe('getStats', () => {
    test('deve retornar estatísticas do serviço', () => {
      const stats = scoringService.getStats();

      expect(stats).toHaveProperty('thresholds');
      expect(stats).toHaveProperty('ruleEngine');
      expect(stats.thresholds).toEqual(scoringService.thresholds);
      expect(stats.ruleEngine).toBe('connected');
    });
  });
});
