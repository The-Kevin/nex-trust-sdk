/**
 * Rotas de verificação de identidade
 */

import express from 'express';
import Joi from 'joi';
import { asyncHandler, createError } from '../middleware/error.js';
import { validateRequest } from '../middleware/sdk.js';
import { ERROR_CODES } from '../../shared/constants/index.js';

/**
 * Schema de validação para verificação de identidade
 */
const verifyIdentitySchema = Joi.object({
  sessionId: Joi.string().required(),
  timestamp: Joi.number().required(),
  fingerprint: Joi.object({
    userAgent: Joi.string().required(),
    language: Joi.string().required(),
    platform: Joi.string().required(),
    screenResolution: Joi.string().required(),
    timezone: Joi.string().required(),
    canvasFingerprint: Joi.string().required(),
    webglFingerprint: Joi.string().required(),
    audioFingerprint: Joi.string().required(),
    fonts: Joi.array().items(Joi.string()).required(),
    plugins: Joi.array().required(),
    hardwareConcurrency: Joi.string().required(),
    deviceMemory: Joi.string().required(),
    timestamp: Joi.number().required(),
    sdkVersion: Joi.string().required(),
    sdkName: Joi.string().required()
  }).required(),
  behavioral: Joi.object({
    sessionId: Joi.string().required(),
    startTime: Joi.number().required(),
    duration: Joi.number().required(),
    totalEvents: Joi.number().required(),
    eventCounts: Joi.object().required(),
    metrics: Joi.object().required(),
    sampleEvents: Joi.array().required()
  }).optional(),
  facial: Joi.object({
    imageData: Joi.string().optional(),
    timestamp: Joi.number().optional(),
    metadata: Joi.object().optional(),
    error: Joi.string().optional()
  }).optional()
});

/**
 * Cria rotas de verificação de identidade
 * @param {Object} ruleEngine - Instância do rule engine
 * @param {Object} scoringService - Instância do scoring service
 * @returns {Router} Router do Express
 */
function verifyIdentityRoute(ruleEngine, scoringService) {
  const router = express.Router();

  /**
   * POST /api/identity/verify
   * Verifica identidade do usuário
   */
  router.post('/verify', 
    validateRequest(verifyIdentitySchema),
    asyncHandler(async (req, res) => {
      try {
        const { sessionId, timestamp, fingerprint, behavioral, facial } = req.validatedData;

        // Valida timestamp (não pode ser muito antigo)
        const now = Date.now();
        const maxAge = 5 * 60 * 1000; // 5 minutos
        if (now - timestamp > maxAge) {
          throw createError(
            'Request timestamp is too old',
            ERROR_CODES.API_ERROR,
            400,
            'Request must be sent within 5 minutes of generation'
          );
        }

        // Processa dados de entrada
        const verificationData = {
          sessionId,
          timestamp,
          fingerprint,
          behavioral,
          facial,
          requestInfo: {
            ip: req.sdk.ip,
            userAgent: req.sdk.userAgent,
            forwardedFor: req.sdk.forwardedFor,
            receivedAt: new Date().toISOString()
          }
        };

        // Aplica regras do rule engine
        const ruleResults = await ruleEngine.evaluateRules(verificationData);

        // Calcula score de confiança
        const scoreResult = await scoringService.calculateScore(verificationData, ruleResults);

        // Determina decisão baseada no score
        const decision = scoringService.getDecision(scoreResult.score);

        // Prepara resposta
        const response = {
          score: scoreResult.score,
          decision: decision,
          reasons: scoreResult.reasons,
          sessionId: sessionId,
          timestamp: new Date().toISOString(),
          processingTime: Date.now() - now,
          ruleResults: ruleResults.map(rule => ({
            id: rule.id,
            name: rule.name,
            passed: rule.passed,
            weight: rule.weight,
            score: rule.score
          })),
          metadata: {
            fingerprint: {
              collected: !!fingerprint,
              age: now - fingerprint.timestamp
            },
            behavioral: {
              collected: !!behavioral,
              eventCount: behavioral?.totalEvents || 0,
              duration: behavioral?.duration || 0
            },
            facial: {
              collected: !!facial && !facial.error,
              error: facial?.error || null
            }
          }
        };

        // Log da verificação (em desenvolvimento)
        if (process.env.NODE_ENV === 'development') {
          console.log('Identity Verification Result:', {
            sessionId,
            score: scoreResult.score,
            decision,
            processingTime: response.processingTime
          });
        }

        res.json(response);

      } catch (error) {
        console.error('Identity verification error:', error);
        
        if (error instanceof Error && error.code) {
          throw error;
        }
        
        throw createError(
          'Identity verification failed',
          ERROR_CODES.API_ERROR,
          500,
          error.message
        );
      }
    })
  );

  /**
   * GET /api/identity/status
   * Obtém status do serviço de verificação
   */
  router.get('/status', asyncHandler(async (req, res) => {
    const status = {
      service: 'NextTrust Identity Verification',
      status: 'operational',
      timestamp: new Date().toISOString(),
      version: process.env.SDK_VERSION || '1.0.0',
      components: {
        ruleEngine: ruleEngine ? 'ready' : 'not_ready',
        scoringService: scoringService ? 'ready' : 'not_ready'
      },
      limits: {
        maxRequestAge: '5 minutes',
        maxFingerprintAge: '5 minutes',
        maxBehavioralEvents: 1000
      }
    };

    res.json(status);
  }));

  /**
   * GET /api/identity/rules
   * Obtém regras ativas (apenas em desenvolvimento)
   */
  router.get('/rules', asyncHandler(async (req, res) => {
    if (process.env.NODE_ENV === 'production') {
      throw createError(
        'Rules endpoint not available in production',
        ERROR_CODES.API_ERROR,
        403,
        'This endpoint is only available in development mode'
      );
    }

    const rules = ruleEngine ? ruleEngine.getActiveRules() : [];
    
    res.json({
      rules: rules,
      count: rules.length,
      timestamp: new Date().toISOString()
    });
  }));

  /**
   * POST /api/identity/test
   * Endpoint de teste (apenas em desenvolvimento)
   */
  router.post('/test', asyncHandler(async (req, res) => {
    if (process.env.NODE_ENV === 'production') {
      throw createError(
        'Test endpoint not available in production',
        ERROR_CODES.API_ERROR,
        403,
        'This endpoint is only available in development mode'
      );
    }

    const testData = {
      sessionId: 'test_' + Date.now(),
      timestamp: Date.now(),
      fingerprint: {
        userAgent: 'Test User Agent',
        language: 'en-US',
        platform: 'Test Platform',
        screenResolution: '1920x1080',
        timezone: 'UTC',
        canvasFingerprint: 'test_canvas',
        webglFingerprint: 'test_webgl',
        audioFingerprint: 'test_audio',
        fonts: ['Arial', 'Times New Roman'],
        plugins: [],
        hardwareConcurrency: '4',
        deviceMemory: '8',
        timestamp: Date.now(),
        sdkVersion: '1.0.0',
        sdkName: 'NextTrustSDK'
      },
      behavioral: {
        sessionId: 'test_' + Date.now(),
        startTime: Date.now() - 60000,
        duration: 60000,
        totalEvents: 10,
        eventCounts: { click: 5, scroll: 3, keystroke: 2 },
        metrics: {
          clickFrequency: 0.1,
          scrollFrequency: 0.05,
          keystrokeFrequency: 0.03
        },
        sampleEvents: []
      }
    };

    // Processa dados de teste
    const ruleResults = await ruleEngine.evaluateRules(testData);
    const scoreResult = await scoringService.calculateScore(testData, ruleResults);
    const decision = scoringService.getDecision(scoreResult.score);

    res.json({
      message: 'Test verification completed',
      result: {
        score: scoreResult.score,
        decision: decision,
        reasons: scoreResult.reasons,
        ruleResults: ruleResults
      },
      timestamp: new Date().toISOString()
    });
  }));

  return router;
}

export {
  verifyIdentityRoute
};
