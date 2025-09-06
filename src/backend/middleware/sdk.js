/**
 * Middleware do NextTrust SDK para Express
 * Validação de API key e processamento de headers
 */

import { ERROR_CODES } from '../../shared/constants/index.js';

/**
 * Middleware de validação de API key
 * @param {Object} config - Configuração do servidor
 * @returns {Function} Middleware function
 */
function sdkMiddleware(config) {
  return (req, res, next) => {
    try {
      // Valida API key
      const apiKey = req.headers['x-api-key'] || req.headers['authorization']?.replace('Bearer ', '');
      
      if (!apiKey) {
        return res.status(401).json({
          error: 'API key is required',
          code: ERROR_CODES.API_ERROR,
          details: 'Missing X-API-Key header or Authorization Bearer token'
        });
      }

      if (apiKey !== config.apiKey) {
        return res.status(401).json({
          error: 'Invalid API key',
          code: ERROR_CODES.API_ERROR,
          details: 'The provided API key is not valid'
        });
      }

      // Adiciona informações do SDK ao request
      req.sdk = {
        apiKey: apiKey,
        sessionId: req.headers['x-session-id'],
        userAgent: req.headers['user-agent'],
        timestamp: new Date().toISOString(),
        ip: req.ip || req.connection.remoteAddress,
        forwardedFor: req.headers['x-forwarded-for']
      };

      // Log da requisição (em desenvolvimento)
      if (process.env.NODE_ENV === 'development') {
        console.log(`NextTrust API Request: ${req.method} ${req.path}`, {
          sessionId: req.sdk.sessionId,
          ip: req.sdk.ip,
          userAgent: req.sdk.userAgent
        });
      }

      next();

    } catch (error) {
      console.error('SDK Middleware Error:', error);
      res.status(500).json({
        error: 'Internal server error',
        code: ERROR_CODES.API_ERROR,
        details: 'An error occurred while processing the request'
      });
    }
  };
}

/**
 * Middleware de validação de dados de entrada
 * @param {Object} schema - Schema de validação
 * @returns {Function} Middleware function
 */
function validateRequest(schema) {
  return (req, res, next) => {
    try {
      const { error, value } = schema.validate(req.body);
      
      if (error) {
        return res.status(400).json({
          error: 'Invalid request data',
          code: ERROR_CODES.API_ERROR,
          details: error.details.map(d => d.message).join(', ')
        });
      }

      req.validatedData = value;
      next();

    } catch (error) {
      console.error('Validation Middleware Error:', error);
      res.status(500).json({
        error: 'Internal server error',
        code: ERROR_CODES.API_ERROR,
        details: 'An error occurred while validating the request'
      });
    }
  };
}

/**
 * Middleware de rate limiting por sessão
 * @param {Object} options - Opções do rate limiting
 * @returns {Function} Middleware function
 */
function sessionRateLimit(options = {}) {
  const sessions = new Map();
  const windowMs = options.windowMs || 60000; // 1 minuto
  const maxRequests = options.maxRequests || 10;

  return (req, res, next) => {
    const sessionId = req.sdk?.sessionId;
    
    if (!sessionId) {
      return next();
    }

    const now = Date.now();
    const sessionData = sessions.get(sessionId) || { count: 0, resetTime: now + windowMs };

    // Reset se a janela expirou
    if (now > sessionData.resetTime) {
      sessionData.count = 0;
      sessionData.resetTime = now + windowMs;
    }

    // Incrementa contador
    sessionData.count++;

    // Verifica limite
    if (sessionData.count > maxRequests) {
      return res.status(429).json({
        error: 'Too many requests for this session',
        code: 'SESSION_RATE_LIMIT_EXCEEDED',
        details: `Maximum ${maxRequests} requests per ${windowMs/1000} seconds`,
        retryAfter: Math.ceil((sessionData.resetTime - now) / 1000)
      });
    }

    sessions.set(sessionId, sessionData);

    // Cleanup de sessões antigas
    if (sessions.size > 1000) {
      const cutoff = now - windowMs;
      for (const [id, data] of sessions.entries()) {
        if (data.resetTime < cutoff) {
          sessions.delete(id);
        }
      }
    }

    next();
  };
}

/**
 * Middleware de logging de requisições
 * @returns {Function} Middleware function
 */
function requestLogger() {
  return (req, res, next) => {
    const start = Date.now();
    
    res.on('finish', () => {
      const duration = Date.now() - start;
      const logData = {
        method: req.method,
        url: req.originalUrl,
        status: res.statusCode,
        duration: `${duration}ms`,
        sessionId: req.sdk?.sessionId,
        ip: req.sdk?.ip,
        userAgent: req.sdk?.userAgent
      };

      if (res.statusCode >= 400) {
        console.error('NextTrust API Error:', logData);
      } else if (process.env.NODE_ENV === 'development') {
        console.log('NextTrust API Request:', logData);
      }
    });

    next();
  };
}

/**
 * Middleware de CORS personalizado
 * @param {Object} options - Opções do CORS
 * @returns {Function} Middleware function
 */
function customCors(options = {}) {
  const allowedOrigins = options.origins || ['*'];
  const allowedMethods = options.methods || ['GET', 'POST', 'PUT', 'DELETE'];
  const allowedHeaders = options.headers || ['Content-Type', 'Authorization', 'X-API-Key', 'X-Session-ID'];

  return (req, res, next) => {
    const origin = req.headers.origin;
    
    if (allowedOrigins.includes('*') || allowedOrigins.includes(origin)) {
      res.header('Access-Control-Allow-Origin', origin || '*');
    }
    
    res.header('Access-Control-Allow-Methods', allowedMethods.join(', '));
    res.header('Access-Control-Allow-Headers', allowedHeaders.join(', '));
    res.header('Access-Control-Allow-Credentials', 'true');
    res.header('Access-Control-Max-Age', '86400'); // 24 horas

    if (req.method === 'OPTIONS') {
      res.status(200).end();
      return;
    }

    next();
  };
}

export {
  sdkMiddleware,
  validateRequest,
  sessionRateLimit,
  requestLogger,
  customCors
};
