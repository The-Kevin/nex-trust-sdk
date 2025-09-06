/**
 * Testes para o Rule Engine
 */

import { RuleEngine } from '../../src/backend/services/rule-engine.js';
import { promises as fs } from 'fs';
import path from 'path';

// Mock do fs
jest.mock('fs', () => ({
  promises: {
    readFile: jest.fn()
  }
}));

describe('RuleEngine', () => {
  let ruleEngine;
  const mockRulesPath = './config/rules.json';

  beforeEach(() => {
    ruleEngine = new RuleEngine(mockRulesPath);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('constructor', () => {
    test('deve inicializar com configuração padrão', () => {
      expect(ruleEngine.rulesPath).toBe(mockRulesPath);
      expect(ruleEngine.rules).toEqual([]);
      expect(ruleEngine.thresholds).toEqual({
        allow: 80,
        review: 50,
        deny: 0
      });
      expect(ruleEngine.lastLoaded).toBeNull();
    });
  });

  describe('loadRules', () => {
    test('deve carregar regras do arquivo JSON', async () => {
      const mockRulesData = {
        rules: [
          {
            id: 'test_rule',
            name: 'Test Rule',
            condition: 'true',
            weight: 10,
            action: 'allow',
            enabled: true
          }
        ],
        thresholds: {
          allow: 80,
          review: 50,
          deny: 0
        }
      };

      fs.readFile.mockResolvedValue(JSON.stringify(mockRulesData));

      await ruleEngine.loadRules();

      expect(ruleEngine.rules).toHaveLength(1);
      expect(ruleEngine.rules[0].id).toBe('test_rule');
      expect(ruleEngine.thresholds).toEqual(mockRulesData.thresholds);
      expect(ruleEngine.lastLoaded).toBeDefined();
    });

    test('deve carregar regras padrão se arquivo não existe', async () => {
      fs.readFile.mockRejectedValue(new Error('File not found'));

      await ruleEngine.loadRules();

      expect(ruleEngine.rules.length).toBeGreaterThan(0);
      expect(ruleEngine.rules[0]).toHaveProperty('id');
      expect(ruleEngine.rules[0]).toHaveProperty('name');
      expect(ruleEngine.rules[0]).toHaveProperty('condition');
      expect(ruleEngine.rules[0]).toHaveProperty('weight');
      expect(ruleEngine.rules[0]).toHaveProperty('action');
    });

    test('deve validar regras carregadas', async () => {
      const invalidRulesData = {
        rules: [
          {
            id: 'invalid_rule',
            // Missing required fields
            weight: 10
          }
        ]
      };

      fs.readFile.mockResolvedValue(JSON.stringify(invalidRulesData));

      await expect(ruleEngine.loadRules()).rejects.toThrow('Invalid rule');
    });
  });

  describe('evaluateRules', () => {
    beforeEach(async () => {
      // Carrega regras padrão para testes
      fs.readFile.mockRejectedValue(new Error('File not found'));
      await ruleEngine.loadRules();
    });

    test('deve avaliar regras com dados válidos', async () => {
      const testData = {
        fingerprint: {
          userAgent: 'Mozilla/5.0 (Test Browser)',
          canvasFingerprint: 'test_canvas',
          webglFingerprint: 'test_webgl'
        },
        behavioral: {
          totalEvents: 10,
          duration: 60000
        },
        sessionId: 'test_session',
        timestamp: Date.now()
      };

      const results = await ruleEngine.evaluateRules(testData);

      expect(results).toBeInstanceOf(Array);
      expect(results.length).toBeGreaterThan(0);
      
      for (const result of results) {
        expect(result).toHaveProperty('id');
        expect(result).toHaveProperty('name');
        expect(result).toHaveProperty('passed');
        expect(result).toHaveProperty('weight');
        expect(result).toHaveProperty('score');
        expect(result).toHaveProperty('action');
      }
    });

    test('deve retornar erro para regras com problemas', async () => {
      // Adiciona regra com condição inválida
      ruleEngine.rules.push({
        id: 'error_rule',
        name: 'Error Rule',
        condition: 'invalid.syntax.here',
        weight: 10,
        action: 'allow',
        enabled: true
      });

      const testData = {
        fingerprint: { userAgent: 'test' },
        sessionId: 'test_session',
        timestamp: Date.now()
      };

      const results = await ruleEngine.evaluateRules(testData);
      
      const errorResult = results.find(r => r.id === 'error_rule');
      expect(errorResult).toBeDefined();
      expect(errorResult.passed).toBe(false);
      expect(errorResult.score).toBe(0);
    });

    test('deve ignorar regras desabilitadas', async () => {
      // Desabilita uma regra
      ruleEngine.rules[0].enabled = false;

      const testData = {
        fingerprint: { userAgent: 'test' },
        sessionId: 'test_session',
        timestamp: Date.now()
      };

      const results = await ruleEngine.evaluateRules(testData);
      
      const disabledRule = results.find(r => r.id === ruleEngine.rules[0].id);
      expect(disabledRule).toBeUndefined();
    });
  });

  describe('getActiveRules', () => {
    test('deve retornar apenas regras ativas', () => {
      ruleEngine.rules = [
        { id: 'rule1', enabled: true },
        { id: 'rule2', enabled: false },
        { id: 'rule3', enabled: true }
      ];

      const activeRules = ruleEngine.getActiveRules();

      expect(activeRules).toHaveLength(2);
      expect(activeRules.every(rule => rule.enabled)).toBe(true);
    });
  });

  describe('getRulesByAction', () => {
    test('deve retornar regras por ação', () => {
      ruleEngine.rules = [
        { id: 'rule1', action: 'allow', enabled: true },
        { id: 'rule2', action: 'deny', enabled: true },
        { id: 'rule3', action: 'allow', enabled: true },
        { id: 'rule4', action: 'review', enabled: false }
      ];

      const allowRules = ruleEngine.getRulesByAction('allow');
      const denyRules = ruleEngine.getRulesByAction('deny');

      expect(allowRules).toHaveLength(2);
      expect(denyRules).toHaveLength(1);
      expect(allowRules.every(rule => rule.action === 'allow')).toBe(true);
    });
  });

  describe('addTemporaryRule', () => {
    test('deve adicionar regra temporária', () => {
      const newRule = {
        id: 'temp_rule',
        name: 'Temporary Rule',
        condition: 'true',
        weight: 5,
        action: 'allow'
      };

      ruleEngine.addTemporaryRule(newRule);

      expect(ruleEngine.rules).toHaveLength(1);
      expect(ruleEngine.rules[0].id).toBe('temp_rule');
      expect(ruleEngine.rules[0].temporary).toBe(true);
    });

    test('deve validar estrutura da regra', () => {
      const invalidRule = {
        id: 'invalid_rule',
        // Missing required fields
        weight: 5
      };

      expect(() => ruleEngine.addTemporaryRule(invalidRule)).toThrow('Invalid rule structure');
    });

    test('deve rejeitar regra com ID duplicado', () => {
      ruleEngine.rules = [{ id: 'existing_rule', name: 'Existing', condition: 'true', weight: 5, action: 'allow' }];

      const duplicateRule = {
        id: 'existing_rule',
        name: 'Duplicate',
        condition: 'true',
        weight: 5,
        action: 'allow'
      };

      expect(() => ruleEngine.addTemporaryRule(duplicateRule)).toThrow('Rule with ID existing_rule already exists');
    });
  });

  describe('removeTemporaryRule', () => {
    test('deve remover regra temporária', () => {
      ruleEngine.rules = [
        { id: 'temp_rule', temporary: true },
        { id: 'permanent_rule', temporary: false }
      ];

      ruleEngine.removeTemporaryRule('temp_rule');

      expect(ruleEngine.rules).toHaveLength(1);
      expect(ruleEngine.rules[0].id).toBe('permanent_rule');
    });

    test('não deve fazer nada se regra não existe', () => {
      ruleEngine.rules = [{ id: 'existing_rule', temporary: true }];

      ruleEngine.removeTemporaryRule('non_existent_rule');

      expect(ruleEngine.rules).toHaveLength(1);
    });
  });

  describe('getStats', () => {
    test('deve retornar estatísticas das regras', () => {
      ruleEngine.rules = [
        { id: 'rule1', action: 'allow', weight: 10, enabled: true },
        { id: 'rule2', action: 'deny', weight: -5, enabled: true },
        { id: 'rule3', action: 'review', weight: 0, enabled: false }
      ];

      const stats = ruleEngine.getStats();

      expect(stats.total).toBe(3);
      expect(stats.active).toBe(2);
      expect(stats.byAction.allow).toBe(1);
      expect(stats.byAction.deny).toBe(1);
      expect(stats.byAction.review).toBe(0);
      expect(stats.byWeight.positive).toBe(1);
      expect(stats.byWeight.negative).toBe(1);
      expect(stats.byWeight.neutral).toBe(0);
    });
  });

  describe('_evaluateCondition', () => {
    test('deve avaliar condição simples', () => {
      const context = { fingerprint: { userAgent: 'test' } };
      const condition = 'fingerprint.userAgent';

      const result = ruleEngine._evaluateCondition(condition, context);

      expect(result).toBe(true);
    });

    test('deve avaliar condição com operador', () => {
      const context = { behavioral: { totalEvents: 10 } };
      const condition = 'behavioral.totalEvents > 5';

      const result = ruleEngine._evaluateCondition(condition, context);

      expect(result).toBe(true);
    });

    test('deve retornar false para condição inválida', () => {
      const context = { fingerprint: { userAgent: 'test' } };
      const condition = 'invalid.syntax.here';

      const result = ruleEngine._evaluateCondition(condition, context);

      expect(result).toBe(false);
    });
  });
});
