/**
 * Middleware de tratamento de erros para NextTrust SDK
 */

import { ERROR_CODES } from '../../shared/constants/index.js';

/**
 * Middleware principal de tratamento de erros
 * @param {Error} err - Erro capturado
 * @param {Object} req - Request object
 * @param {Object} res - Response object
 * @param {Function} next - Next function
 */
function errorHandler(err, req, res, next) {
  // Log do erro
  console.error('NextTrust Error:', {
    message: err.message,
    stack: err.stack,
    url: req.originalUrl,
    method: req.method,
    sessionId: req.sdk?.sessionId,
    ip: req.sdk?.ip,
    timestamp: new Date().toISOString()
  });

  // Erro de validação
  if (err.name === 'ValidationError') {
    return res.status(400).json({
      error: 'Validation Error',
      code: ERROR_CODES.API_ERROR,
      details: err.message,
      timestamp: new Date().toISOString()
    });
  }

  // Erro de sintaxe JSON
  if (err instanceof SyntaxError && err.status === 400 && 'body' in err) {
    return res.status(400).json({
      error: 'Invalid JSON',
      code: ERROR_CODES.API_ERROR,
      details: 'Request body contains invalid JSON',
      timestamp: new Date().toISOString()
    });
  }

  // Erro de limite de payload
  if (err.type === 'entity.too.large') {
    return res.status(413).json({
      error: 'Payload Too Large',
      code: ERROR_CODES.API_ERROR,
      details: 'Request body exceeds size limit',
      timestamp: new Date().toISOString()
    });
  }

  // Erro de timeout
  if (err.code === 'ETIMEDOUT' || err.code === 'ESOCKETTIMEDOUT') {
    return res.status(408).json({
      error: 'Request Timeout',
      code: ERROR_CODES.NETWORK_ERROR,
      details: 'Request timed out',
      timestamp: new Date().toISOString()
    });
  }

  // Erro de conexão
  if (err.code === 'ECONNREFUSED' || err.code === 'ENOTFOUND') {
    return res.status(503).json({
      error: 'Service Unavailable',
      code: ERROR_CODES.NETWORK_ERROR,
      details: 'Unable to connect to external service',
      timestamp: new Date().toISOString()
    });
  }

  // Erro de regra do rule engine
  if (err.code === 'RULE_ENGINE_ERROR') {
    return res.status(500).json({
      error: 'Rule Engine Error',
      code: ERROR_CODES.RULE_ENGINE_ERROR,
      details: err.message,
      timestamp: new Date().toISOString()
    });
  }

  // Erro de scoring
  if (err.code === 'SCORING_ERROR') {
    return res.status(500).json({
      error: 'Scoring Error',
      code: ERROR_CODES.RULE_ENGINE_ERROR,
      details: err.message,
      timestamp: new Date().toISOString()
    });
  }

  // Erro de fingerprint
  if (err.code === 'FINGERPRINT_ERROR') {
    return res.status(400).json({
      error: 'Fingerprint Error',
      code: ERROR_CODES.FINGERPRINT_ERROR,
      details: err.message,
      timestamp: new Date().toISOString()
    });
  }

  // Erro de captura facial
  if (err.code === 'FACIAL_CAPTURE_ERROR') {
    return res.status(400).json({
      error: 'Facial Capture Error',
      code: ERROR_CODES.FACIAL_CAPTURE_ERROR,
      details: err.message,
      timestamp: new Date().toISOString()
    });
  }

  // Erro de sessão expirada
  if (err.code === 'SESSION_EXPIRED') {
    return res.status(401).json({
      error: 'Session Expired',
      code: ERROR_CODES.SESSION_EXPIRED,
      details: err.message,
      timestamp: new Date().toISOString()
    });
  }

  // Erro interno do servidor (padrão)
  const statusCode = err.statusCode || err.status || 500;
  const errorMessage = process.env.NODE_ENV === 'production' 
    ? 'Internal Server Error' 
    : err.message;

  res.status(statusCode).json({
    error: errorMessage,
    code: ERROR_CODES.API_ERROR,
    details: process.env.NODE_ENV === 'production' 
      ? 'An unexpected error occurred' 
      : err.stack,
    timestamp: new Date().toISOString()
  });
}

/**
 * Middleware para capturar erros assíncronos
 * @param {Function} fn - Função assíncrona
 * @returns {Function} Função wrapper
 */
function asyncHandler(fn) {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}

/**
 * Middleware para capturar erros de rotas não encontradas
 * @param {Object} req - Request object
 * @param {Object} res - Response object
 * @param {Function} next - Next function
 */
function notFoundHandler(req, res, next) {
  const error = new Error(`Route not found: ${req.method} ${req.originalUrl}`);
  error.statusCode = 404;
  next(error);
}

/**
 * Middleware para capturar erros de métodos não permitidos
 * @param {Object} req - Request object
 * @param {Object} res - Response object
 * @param {Function} next - Next function
 */
function methodNotAllowedHandler(req, res, next) {
  const error = new Error(`Method not allowed: ${req.method} ${req.originalUrl}`);
  error.statusCode = 405;
  next(error);
}

/**
 * Classe de erro personalizada para NextTrust
 */
class NextTrustError extends Error {
  constructor(message, code, statusCode = 500, details = null) {
    super(message);
    this.name = 'NextTrustError';
    this.code = code;
    this.statusCode = statusCode;
    this.details = details;
    this.timestamp = new Date().toISOString();
  }
}

/**
 * Função para criar erros personalizados
 * @param {string} message - Mensagem do erro
 * @param {string} code - Código do erro
 * @param {number} statusCode - Status HTTP
 * @param {string} details - Detalhes adicionais
 * @returns {NextTrustError} Erro personalizado
 */
function createError(message, code, statusCode = 500, details = null) {
  return new NextTrustError(message, code, statusCode, details);
}

export {
  errorHandler,
  asyncHandler,
  notFoundHandler,
  methodNotAllowedHandler,
  NextTrustError,
  createError
};
