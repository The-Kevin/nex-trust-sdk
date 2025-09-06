/**
 * Modelos de dados para o NextTrust SDK Backend
 * Definições de estruturas de dados e validações
 */

/**
 * Modelo de dados de verificação de identidade
 */
export class IdentityVerificationData {
  constructor(data) {
    this.sessionId = data.sessionId;
    this.timestamp = data.timestamp;
    this.fingerprint = data.fingerprint;
    this.behavioral = data.behavioral;
    this.facial = data.facial;
    this.requestInfo = data.requestInfo;
    
    this.validate();
  }
  
  validate() {
    if (!this.sessionId) {
      throw new Error('Session ID is required');
    }
    
    if (!this.timestamp) {
      throw new Error('Timestamp is required');
    }
    
    if (!this.fingerprint) {
      throw new Error('Fingerprint data is required');
    }
    
    // Valida idade do timestamp (máximo 5 minutos)
    const age = Date.now() - this.timestamp;
    if (age > 5 * 60 * 1000) {
      throw new Error('Request data is too old');
    }
  }
  
  toJSON() {
    return {
      sessionId: this.sessionId,
      timestamp: this.timestamp,
      fingerprint: this.fingerprint,
      behavioral: this.behavioral,
      facial: this.facial,
      requestInfo: this.requestInfo
    };
  }
}

/**
 * Modelo de resultado de verificação
 */
export class VerificationResult {
  constructor(data) {
    this.score = data.score;
    this.decision = data.decision;
    this.reasons = data.reasons || [];
    this.sessionId = data.sessionId;
    this.timestamp = data.timestamp || new Date().toISOString();
    this.processingTime = data.processingTime;
    this.ruleResults = data.ruleResults || [];
    this.metadata = data.metadata || {};
    
    this.validate();
  }
  
  validate() {
    if (typeof this.score !== 'number' || this.score < 0 || this.score > 100) {
      throw new Error('Score must be a number between 0 and 100');
    }
    
    if (!['allow', 'review', 'deny'].includes(this.decision)) {
      throw new Error('Decision must be allow, review, or deny');
    }
    
    if (!Array.isArray(this.reasons)) {
      throw new Error('Reasons must be an array');
    }
  }
  
  toJSON() {
    return {
      score: this.score,
      decision: this.decision,
      reasons: this.reasons,
      sessionId: this.sessionId,
      timestamp: this.timestamp,
      processingTime: this.processingTime,
      ruleResults: this.ruleResults,
      metadata: this.metadata
    };
  }
}

/**
 * Modelo de regra do rule engine
 */
export class Rule {
  constructor(data) {
    this.id = data.id;
    this.name = data.name;
    this.condition = data.condition;
    this.weight = data.weight;
    this.action = data.action;
    this.enabled = data.enabled !== false;
    this.description = data.description;
    this.temporary = data.temporary || false;
    this.createdAt = data.createdAt || new Date().toISOString();
    this.updatedAt = data.updatedAt || new Date().toISOString();
    
    this.validate();
  }
  
  validate() {
    if (!this.id) {
      throw new Error('Rule ID is required');
    }
    
    if (!this.name) {
      throw new Error('Rule name is required');
    }
    
    if (!this.condition) {
      throw new Error('Rule condition is required');
    }
    
    if (typeof this.weight !== 'number') {
      throw new Error('Rule weight must be a number');
    }
    
    if (!['allow', 'review', 'deny'].includes(this.action)) {
      throw new Error('Rule action must be allow, review, or deny');
    }
  }
  
  toJSON() {
    return {
      id: this.id,
      name: this.name,
      condition: this.condition,
      weight: this.weight,
      action: this.action,
      enabled: this.enabled,
      description: this.description,
      temporary: this.temporary,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt
    };
  }
}

/**
 * Modelo de resultado de regra
 */
export class RuleResult {
  constructor(data) {
    this.id = data.id;
    this.name = data.name;
    this.passed = data.passed;
    this.weight = data.weight;
    this.score = data.score;
    this.action = data.action;
    this.condition = data.condition;
    this.description = data.description;
    this.error = data.error;
    this.executionTime = data.executionTime;
    
    this.validate();
  }
  
  validate() {
    if (!this.id) {
      throw new Error('Rule result ID is required');
    }
    
    if (typeof this.passed !== 'boolean' && !this.error) {
      throw new Error('Rule result must have passed boolean or error');
    }
    
    if (typeof this.weight !== 'number') {
      throw new Error('Rule result weight must be a number');
    }
  }
  
  toJSON() {
    return {
      id: this.id,
      name: this.name,
      passed: this.passed,
      weight: this.weight,
      score: this.score,
      action: this.action,
      condition: this.condition,
      description: this.description,
      error: this.error,
      executionTime: this.executionTime
    };
  }
}

/**
 * Modelo de sessão
 */
export class Session {
  constructor(data) {
    this.id = data.id;
    this.createdAt = data.createdAt || new Date().toISOString();
    this.lastActivity = data.lastActivity || new Date().toISOString();
    this.fingerprint = data.fingerprint;
    this.behavioral = data.behavioral;
    this.verifications = data.verifications || [];
    this.metadata = data.metadata || {};
    
    this.validate();
  }
  
  validate() {
    if (!this.id) {
      throw new Error('Session ID is required');
    }
  }
  
  addVerification(result) {
    if (!(result instanceof VerificationResult)) {
      throw new Error('Verification must be a VerificationResult instance');
    }
    
    this.verifications.push(result);
    this.lastActivity = new Date().toISOString();
  }
  
  isExpired(timeoutMs = 30 * 60 * 1000) {
    const lastActivity = new Date(this.lastActivity);
    const now = new Date();
    return (now - lastActivity) > timeoutMs;
  }
  
  toJSON() {
    return {
      id: this.id,
      createdAt: this.createdAt,
      lastActivity: this.lastActivity,
      fingerprint: this.fingerprint,
      behavioral: this.behavioral,
      verifications: this.verifications,
      metadata: this.metadata
    };
  }
}

/**
 * Modelo de configuração do sistema
 */
export class SystemConfig {
  constructor(data) {
    this.thresholds = data.thresholds || {
      allow: 80,
      review: 50,
      deny: 0
    };
    this.rateLimit = data.rateLimit || {
      enabled: true,
      windowMs: 15 * 60 * 1000,
      maxRequests: 100
    };
    this.security = data.security || {
      enableCors: true,
      corsOrigin: '*',
      apiKeyRequired: true
    };
    this.features = data.features || {
      enableBehavioralTracking: true,
      enableFacialCapture: false,
      enableRuleEngine: true,
      enableScoring: true
    };
    this.updatedAt = data.updatedAt || new Date().toISOString();
    
    this.validate();
  }
  
  validate() {
    // Valida thresholds
    if (this.thresholds.allow < this.thresholds.review || 
        this.thresholds.review < this.thresholds.deny) {
      throw new Error('Invalid threshold configuration');
    }
    
    // Valida rate limit
    if (this.rateLimit.enabled && 
        (this.rateLimit.windowMs <= 0 || this.rateLimit.maxRequests <= 0)) {
      throw new Error('Invalid rate limit configuration');
    }
  }
  
  updateThresholds(newThresholds) {
    this.thresholds = { ...this.thresholds, ...newThresholds };
    this.updatedAt = new Date().toISOString();
    this.validate();
  }
  
  updateRateLimit(newRateLimit) {
    this.rateLimit = { ...this.rateLimit, ...newRateLimit };
    this.updatedAt = new Date().toISOString();
    this.validate();
  }
  
  toJSON() {
    return {
      thresholds: this.thresholds,
      rateLimit: this.rateLimit,
      security: this.security,
      features: this.features,
      updatedAt: this.updatedAt
    };
  }
}

/**
 * Utilitários para validação de dados
 */
export class DataValidator {
  static isValidSessionId(sessionId) {
    return typeof sessionId === 'string' && sessionId.length > 0;
  }
  
  static isValidTimestamp(timestamp) {
    return typeof timestamp === 'number' && timestamp > 0;
  }
  
  static isValidScore(score) {
    return typeof score === 'number' && score >= 0 && score <= 100;
  }
  
  static isValidDecision(decision) {
    return ['allow', 'review', 'deny'].includes(decision);
  }
  
  static isValidFingerprint(fingerprint) {
    if (!fingerprint || typeof fingerprint !== 'object') {
      return false;
    }
    
    const requiredFields = ['userAgent', 'language', 'platform', 'screenResolution'];
    return requiredFields.every(field => fingerprint[field]);
  }
  
  static isValidBehavioralData(behavioral) {
    if (!behavioral || typeof behavioral !== 'object') {
      return true; // Behavioral data is optional
    }
    
    return typeof behavioral.totalEvents === 'number' && 
           typeof behavioral.duration === 'number';
  }
  
  static isValidFacialData(facial) {
    if (!facial || typeof facial !== 'object') {
      return true; // Facial data is optional
    }
    
    return facial.imageData || facial.error;
  }
}

export default {
  IdentityVerificationData,
  VerificationResult,
  Rule,
  RuleResult,
  Session,
  SystemConfig,
  DataValidator
};
