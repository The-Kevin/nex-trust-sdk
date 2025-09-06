/**
 * Rule Engine configurável para NextTrust SDK
 * Avalia regras baseadas em dados de fingerprint e comportamento
 */

import { promises as fs } from 'fs';
import path from 'path';

/**
 * Classe do Rule Engine
 */
class RuleEngine {
  constructor(rulesPath) {
    this.rulesPath = rulesPath;
    this.rules = [];
    this.thresholds = {
      allow: 80,
      review: 50,
      deny: 0
    };
    this.lastLoaded = null;
  }

  /**
   * Carrega regras do arquivo JSON
   */
  async loadRules() {
    try {
      const rulesData = await fs.readFile(this.rulesPath, 'utf8');
      const config = JSON.parse(rulesData);
      
      this.rules = config.rules || [];
      this.thresholds = config.thresholds || this.thresholds;
      this.lastLoaded = new Date().toISOString();
      
      console.log(`Rule Engine: Loaded ${this.rules.length} rules from ${this.rulesPath}`);
      
      // Valida regras carregadas
      this._validateRules();
      
    } catch (error) {
      console.warn(`Rule Engine: Failed to load rules from ${this.rulesPath}, using defaults`);
      this._loadDefaultRules();
    }
  }

  /**
   * Carrega regras padrão
   * @private
   */
  _loadDefaultRules() {
    this.rules = [
      {
        id: 'fingerprint_completeness',
        name: 'Fingerprint Completeness',
        condition: 'fingerprint.userAgent && fingerprint.canvasFingerprint && fingerprint.webglFingerprint',
        weight: 20,
        action: 'allow',
        enabled: true,
        description: 'Verifica se o fingerprint está completo'
      },
      {
        id: 'behavioral_activity',
        name: 'Behavioral Activity',
        condition: 'behavioral && behavioral.totalEvents > 5',
        weight: 15,
        action: 'allow',
        enabled: true,
        description: 'Verifica se há atividade comportamental suficiente'
      },
      {
        id: 'session_duration',
        name: 'Session Duration',
        condition: 'behavioral && behavioral.duration > 30000',
        weight: 10,
        action: 'allow',
        enabled: true,
        description: 'Verifica se a sessão tem duração mínima'
      },
      {
        id: 'suspicious_user_agent',
        name: 'Suspicious User Agent',
        condition: 'fingerprint.userAgent.includes("bot") || fingerprint.userAgent.includes("crawler")',
        weight: -30,
        action: 'deny',
        enabled: true,
        description: 'Detecta user agents suspeitos'
      },
      {
        id: 'missing_fingerprint',
        name: 'Missing Fingerprint',
        condition: '!fingerprint || !fingerprint.userAgent',
        weight: -50,
        action: 'deny',
        enabled: true,
        description: 'Detecta ausência de fingerprint'
      },
      {
        id: 'facial_verification',
        name: 'Facial Verification',
        condition: 'facial && facial.imageData && !facial.error',
        weight: 25,
        action: 'allow',
        enabled: true,
        description: 'Bonus por verificação facial bem-sucedida'
      },
      {
        id: 'high_behavioral_frequency',
        name: 'High Behavioral Frequency',
        condition: 'behavioral && behavioral.metrics.clickFrequency > 0.5',
        weight: -10,
        action: 'review',
        enabled: true,
        description: 'Detecta atividade comportamental anormalmente alta'
      },
      {
        id: 'canvas_fingerprint_consistency',
        name: 'Canvas Fingerprint Consistency',
        condition: 'fingerprint.canvasFingerprint && fingerprint.canvasFingerprint.length > 100',
        weight: 10,
        action: 'allow',
        enabled: true,
        description: 'Verifica consistência do canvas fingerprint'
      }
    ];
    
    this.thresholds = {
      allow: 80,
      review: 50,
      deny: 0
    };
    
    console.log('Rule Engine: Using default rules');
  }

  /**
   * Valida regras carregadas
   * @private
   */
  _validateRules() {
    for (const rule of this.rules) {
      if (!rule.id || !rule.name || !rule.condition || !rule.weight || !rule.action) {
        throw new Error(`Invalid rule: ${JSON.stringify(rule)}`);
      }
      
      if (!['allow', 'review', 'deny'].includes(rule.action)) {
        throw new Error(`Invalid rule action: ${rule.action}`);
      }
      
      if (typeof rule.weight !== 'number') {
        throw new Error(`Invalid rule weight: ${rule.weight}`);
      }
    }
  }

  /**
   * Avalia todas as regras contra os dados fornecidos
   * @param {Object} data - Dados de verificação
   * @returns {Array} Resultados das regras
   */
  async evaluateRules(data) {
    const results = [];
    
    for (const rule of this.rules) {
      if (!rule.enabled) {
        continue;
      }
      
      try {
        const result = await this._evaluateRule(rule, data);
        results.push(result);
      } catch (error) {
        console.error(`Rule Engine: Error evaluating rule ${rule.id}:`, error);
        results.push({
          id: rule.id,
          name: rule.name,
          passed: false,
          weight: 0,
          score: 0,
          error: error.message
        });
      }
    }
    
    return results;
  }

  /**
   * Avalia uma regra específica
   * @private
   */
  async _evaluateRule(rule, data) {
    try {
      // Cria contexto seguro para avaliação
      const context = this._createSafeContext(data);
      
      // Avalia condição da regra
      const passed = this._evaluateCondition(rule.condition, context);
      
      // Calcula score baseado no peso
      const score = passed ? rule.weight : 0;
      
      return {
        id: rule.id,
        name: rule.name,
        passed: passed,
        weight: rule.weight,
        score: score,
        action: rule.action,
        condition: rule.condition,
        description: rule.description
      };
      
    } catch (error) {
      throw new Error(`Failed to evaluate rule ${rule.id}: ${error.message}`);
    }
  }

  /**
   * Cria contexto seguro para avaliação de regras
   * @private
   */
  _createSafeContext(data) {
    return {
      fingerprint: data.fingerprint || {},
      behavioral: data.behavioral || {},
      facial: data.facial || {},
      sessionId: data.sessionId,
      timestamp: data.timestamp
    };
  }

  /**
   * Avalia condição de uma regra de forma segura
   * @private
   */
  _evaluateCondition(condition, context) {
    try {
      // Substitui variáveis no contexto
      let safeCondition = condition;
      
      // Adiciona verificações de existência
      safeCondition = safeCondition.replace(/(\w+\.\w+)/g, (match) => {
        const parts = match.split('.');
        let check = parts[0];
        for (let i = 1; i < parts.length; i++) {
          check += ` && ${check}.${parts[i]}`;
        }
        return `(${check} ? ${match} : null)`;
      });
      
      // Cria função de avaliação segura
      const func = new Function('context', `
        const { fingerprint, behavioral, facial, sessionId, timestamp } = context;
        return ${safeCondition};
      `);
      
      const result = func(context);
      return Boolean(result);
      
    } catch (error) {
      console.error('Rule Engine: Error evaluating condition:', condition, error);
      return false;
    }
  }

  /**
   * Obtém regras ativas
   * @returns {Array} Lista de regras ativas
   */
  getActiveRules() {
    return this.rules.filter(rule => rule.enabled);
  }

  /**
   * Obtém regras por ação
   * @param {string} action - Ação da regra
   * @returns {Array} Lista de regras com a ação especificada
   */
  getRulesByAction(action) {
    return this.rules.filter(rule => rule.action === action && rule.enabled);
  }

  /**
   * Obtém configuração atual
   * @returns {Object} Configuração do rule engine
   */
  getConfig() {
    return {
      rules: this.rules,
      thresholds: this.thresholds,
      lastLoaded: this.lastLoaded,
      rulesPath: this.rulesPath
    };
  }

  /**
   * Recarrega regras do arquivo
   */
  async reloadRules() {
    await this.loadRules();
    console.log('Rule Engine: Rules reloaded');
  }

  /**
   * Adiciona regra temporária (não persiste no arquivo)
   * @param {Object} rule - Nova regra
   */
  addTemporaryRule(rule) {
    // Valida regra
    if (!rule.id || !rule.name || !rule.condition || !rule.weight || !rule.action) {
      throw new Error('Invalid rule structure');
    }
    
    // Verifica se ID já existe
    if (this.rules.find(r => r.id === rule.id)) {
      throw new Error(`Rule with ID ${rule.id} already exists`);
    }
    
    this.rules.push({
      ...rule,
      enabled: rule.enabled !== false,
      temporary: true
    });
    
    console.log(`Rule Engine: Added temporary rule ${rule.id}`);
  }

  /**
   * Remove regra temporária
   * @param {string} ruleId - ID da regra
   */
  removeTemporaryRule(ruleId) {
    const index = this.rules.findIndex(r => r.id === ruleId && r.temporary);
    if (index !== -1) {
      this.rules.splice(index, 1);
      console.log(`Rule Engine: Removed temporary rule ${ruleId}`);
    }
  }

  /**
   * Obtém estatísticas das regras
   * @returns {Object} Estatísticas
   */
  getStats() {
    const activeRules = this.getActiveRules();
    const stats = {
      total: this.rules.length,
      active: activeRules.length,
      byAction: {
        allow: this.getRulesByAction('allow').length,
        review: this.getRulesByAction('review').length,
        deny: this.getRulesByAction('deny').length
      },
      byWeight: {
        positive: activeRules.filter(r => r.weight > 0).length,
        negative: activeRules.filter(r => r.weight < 0).length,
        neutral: activeRules.filter(r => r.weight === 0).length
      },
      lastLoaded: this.lastLoaded
    };
    
    return stats;
  }
}

export { RuleEngine };
