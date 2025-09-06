/**
 * Serviço de Scoring para NextTrust SDK
 * Calcula score de confiança baseado em regras e dados comportamentais
 */

import { DECISION_TYPES, DEFAULT_THRESHOLDS } from '../../shared/constants/index.js';

/**
 * Classe do Serviço de Scoring
 */
class ScoringService {
  constructor(ruleEngine) {
    this.ruleEngine = ruleEngine;
    this.thresholds = DEFAULT_THRESHOLDS;
  }

  /**
   * Calcula score de confiança baseado em dados e resultados de regras
   * @param {Object} data - Dados de verificação
   * @param {Array} ruleResults - Resultados das regras
   * @returns {Object} Resultado do scoring
   */
  async calculateScore(data, ruleResults) {
    try {
      // Score base das regras
      const ruleScore = this._calculateRuleScore(ruleResults);
      
      // Score comportamental
      const behavioralScore = this._calculateBehavioralScore(data.behavioral);
      
      // Score de fingerprint
      const fingerprintScore = this._calculateFingerprintScore(data.fingerprint);
      
      // Score facial (se disponível)
      const facialScore = this._calculateFacialScore(data.facial);
      
      // Score de qualidade dos dados
      const dataQualityScore = this._calculateDataQualityScore(data);
      
      // Combina scores com pesos
      const finalScore = this._combineScores({
        rule: ruleScore,
        behavioral: behavioralScore,
        fingerprint: fingerprintScore,
        facial: facialScore,
        dataQuality: dataQualityScore
      });
      
      // Gera razões para o score
      const reasons = this._generateReasons({
        ruleScore,
        behavioralScore,
        fingerprintScore,
        facialScore,
        dataQualityScore,
        finalScore
      });
      
      return {
        score: Math.max(0, Math.min(100, finalScore)), // Limita entre 0 e 100
        reasons: reasons,
        breakdown: {
          rule: ruleScore,
          behavioral: behavioralScore,
          fingerprint: fingerprintScore,
          facial: facialScore,
          dataQuality: dataQualityScore
        }
      };
      
    } catch (error) {
      console.error('Scoring Service: Error calculating score:', error);
      throw new Error(`Scoring calculation failed: ${error.message}`);
    }
  }

  /**
   * Calcula score baseado nas regras
   * @private
   */
  _calculateRuleScore(ruleResults) {
    if (!ruleResults || ruleResults.length === 0) {
      return 50; // Score neutro se não há regras
    }
    
    let totalScore = 0;
    let totalWeight = 0;
    
    for (const result of ruleResults) {
      if (result.error) {
        continue; // Ignora regras com erro
      }
      
      totalScore += result.score;
      totalWeight += Math.abs(result.weight);
    }
    
    if (totalWeight === 0) {
      return 50; // Score neutro se não há peso
    }
    
    // Normaliza para 0-100
    const normalizedScore = ((totalScore / totalWeight) + 1) * 50;
    return Math.max(0, Math.min(100, normalizedScore));
  }

  /**
   * Calcula score comportamental
   * @private
   */
  _calculateBehavioralScore(behavioral) {
    if (!behavioral) {
      return 30; // Score baixo se não há dados comportamentais
    }
    
    let score = 50; // Score base
    
    // Avalia duração da sessão
    const duration = behavioral.duration || 0;
    if (duration > 60000) { // Mais de 1 minuto
      score += 10;
    } else if (duration < 10000) { // Menos de 10 segundos
      score -= 20;
    }
    
    // Avalia número de eventos
    const eventCount = behavioral.totalEvents || 0;
    if (eventCount > 20) {
      score += 10;
    } else if (eventCount < 5) {
      score -= 15;
    }
    
    // Avalia métricas comportamentais
    const metrics = behavioral.metrics || {};
    
    // Frequência de cliques
    const clickFreq = metrics.clickFrequency || 0;
    if (clickFreq > 0.1 && clickFreq < 2.0) {
      score += 5; // Frequência normal
    } else if (clickFreq > 5.0) {
      score -= 10; // Frequência anormalmente alta
    }
    
    // Frequência de scroll
    const scrollFreq = metrics.scrollFrequency || 0;
    if (scrollFreq > 0.05 && scrollFreq < 1.0) {
      score += 5;
    } else if (scrollFreq > 3.0) {
      score -= 10;
    }
    
    // Frequência de keystrokes
    const keystrokeFreq = metrics.keystrokeFrequency || 0;
    if (keystrokeFreq > 0.1 && keystrokeFreq < 3.0) {
      score += 5;
    } else if (keystrokeFreq > 10.0) {
      score -= 15; // Possível bot
    }
    
    // Distância de movimento do mouse
    const mouseDistance = metrics.mouseMovementDistance || 0;
    if (mouseDistance > 100) {
      score += 5; // Movimento natural
    } else if (mouseDistance < 10) {
      score -= 10; // Pouco movimento
    }
    
    return Math.max(0, Math.min(100, score));
  }

  /**
   * Calcula score de fingerprint
   * @private
   */
  _calculateFingerprintScore(fingerprint) {
    if (!fingerprint) {
      return 0; // Score zero se não há fingerprint
    }
    
    let score = 50; // Score base
    
    // Verifica completude do fingerprint
    const requiredFields = [
      'userAgent', 'language', 'platform', 'screenResolution',
      'timezone', 'canvasFingerprint', 'webglFingerprint', 'audioFingerprint'
    ];
    
    let completeness = 0;
    for (const field of requiredFields) {
      if (fingerprint[field] && fingerprint[field] !== 'unknown') {
        completeness++;
      }
    }
    
    score += (completeness / requiredFields.length) * 30;
    
    // Verifica qualidade dos fingerprints
    if (fingerprint.canvasFingerprint && fingerprint.canvasFingerprint.length > 100) {
      score += 5;
    }
    
    if (fingerprint.webglFingerprint && fingerprint.webglFingerprint !== 'webgl_not_supported') {
      score += 5;
    }
    
    if (fingerprint.audioFingerprint && fingerprint.audioFingerprint !== 'audio_error') {
      score += 5;
    }
    
    // Verifica fontes disponíveis
    if (fingerprint.fonts && fingerprint.fonts.length > 5) {
      score += 5;
    }
    
    // Penaliza user agents suspeitos
    if (fingerprint.userAgent) {
      const suspiciousPatterns = ['bot', 'crawler', 'spider', 'scraper'];
      for (const pattern of suspiciousPatterns) {
        if (fingerprint.userAgent.toLowerCase().includes(pattern)) {
          score -= 30;
          break;
        }
      }
    }
    
    return Math.max(0, Math.min(100, score));
  }

  /**
   * Calcula score facial
   * @private
   */
  _calculateFacialScore(facial) {
    if (!facial) {
      return 50; // Score neutro se não há dados faciais
    }
    
    if (facial.error) {
      return 40; // Score ligeiramente baixo se há erro
    }
    
    if (facial.imageData) {
      return 80; // Score alto se há captura facial bem-sucedida
    }
    
    return 50; // Score neutro
  }

  /**
   * Calcula score de qualidade dos dados
   * @private
   */
  _calculateDataQualityScore(data) {
    let score = 50;
    
    // Verifica idade dos dados
    const now = Date.now();
    const dataAge = now - data.timestamp;
    
    if (dataAge < 60000) { // Menos de 1 minuto
      score += 10;
    } else if (dataAge > 300000) { // Mais de 5 minutos
      score -= 20;
    }
    
    // Verifica presença de dados essenciais
    if (data.fingerprint) score += 10;
    if (data.behavioral) score += 10;
    if (data.facial && !data.facial.error) score += 10;
    
    // Verifica consistência dos dados
    if (data.fingerprint && data.behavioral) {
      if (data.fingerprint.timestamp && data.behavioral.startTime) {
        const timeDiff = Math.abs(data.fingerprint.timestamp - data.behavioral.startTime);
        if (timeDiff < 300000) { // Diferença menor que 5 minutos
          score += 5;
        }
      }
    }
    
    return Math.max(0, Math.min(100, score));
  }

  /**
   * Combina scores com pesos
   * @private
   */
  _combineScores(scores) {
    const weights = {
      rule: 0.4,        // 40% - Regras são mais importantes
      behavioral: 0.25, // 25% - Comportamento é importante
      fingerprint: 0.2, // 20% - Fingerprint é importante
      facial: 0.1,      // 10% - Facial é bonus
      dataQuality: 0.05 // 5% - Qualidade dos dados
    };
    
    let weightedScore = 0;
    let totalWeight = 0;
    
    for (const [type, score] of Object.entries(scores)) {
      if (score !== null && score !== undefined) {
        weightedScore += score * weights[type];
        totalWeight += weights[type];
      }
    }
    
    return totalWeight > 0 ? weightedScore / totalWeight : 50;
  }

  /**
   * Gera razões para o score
   * @private
   */
  _generateReasons(scores) {
    const reasons = [];
    
    // Razões baseadas no score final
    if (scores.finalScore >= 80) {
      reasons.push('High confidence score based on comprehensive data analysis');
    } else if (scores.finalScore >= 60) {
      reasons.push('Moderate confidence score with some risk factors');
    } else if (scores.finalScore >= 40) {
      reasons.push('Low confidence score with multiple risk factors');
    } else {
      reasons.push('Very low confidence score with significant risk factors');
    }
    
    // Razões específicas por componente
    if (scores.ruleScore < 40) {
      reasons.push('Multiple security rules failed');
    }
    
    if (scores.behavioralScore < 40) {
      reasons.push('Insufficient or suspicious behavioral data');
    }
    
    if (scores.fingerprintScore < 40) {
      reasons.push('Incomplete or suspicious device fingerprint');
    }
    
    if (scores.facialScore >= 80) {
      reasons.push('Facial verification completed successfully');
    }
    
    if (scores.dataQualityScore < 40) {
      reasons.push('Poor data quality or stale information');
    }
    
    return reasons;
  }

  /**
   * Determina decisão baseada no score
   * @param {number} score - Score de confiança
   * @returns {string} Decisão: allow, review, deny
   */
  getDecision(score) {
    if (score >= this.thresholds.allow) {
      return DECISION_TYPES.ALLOW;
    } else if (score >= this.thresholds.review) {
      return DECISION_TYPES.REVIEW;
    } else {
      return DECISION_TYPES.DENY;
    }
  }

  /**
   * Atualiza thresholds
   * @param {Object} newThresholds - Novos thresholds
   */
  updateThresholds(newThresholds) {
    this.thresholds = { ...this.thresholds, ...newThresholds };
  }

  /**
   * Obtém thresholds atuais
   * @returns {Object} Thresholds atuais
   */
  getThresholds() {
    return { ...this.thresholds };
  }

  /**
   * Obtém estatísticas de scoring
   * @returns {Object} Estatísticas
   */
  getStats() {
    return {
      thresholds: this.thresholds,
      ruleEngine: this.ruleEngine ? 'connected' : 'disconnected'
    };
  }
}

export { ScoringService };
