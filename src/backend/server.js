/**
 * NextTrust SDK - Backend Server
 * Servidor Express para processamento de verificação de identidade
 */

import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import compression from 'compression';
import morgan from 'morgan';

import { verifyIdentityRoute } from './routes/identity.js';
import { sdkMiddleware } from './middleware/sdk.js';
import { errorHandler } from './middleware/error.js';
import { RuleEngine } from './services/rule-engine.js';
import { ScoringService } from './services/scoring.js';

class NextTrustServer {
  constructor(config = {}) {
    this.config = {
      port: process.env.PORT || 3000,
      apiKey: process.env.NEXT_TRUST_API_KEY || 'default-api-key',
      rulesPath: process.env.RULES_PATH || './config/rules.json',
      enableCors: process.env.ENABLE_CORS !== 'false',
      enableRateLimit: process.env.ENABLE_RATE_LIMIT !== 'false',
      rateLimitWindow: parseInt(process.env.RATE_LIMIT_WINDOW) || 15, // minutos
      rateLimitMax: parseInt(process.env.RATE_LIMIT_MAX) || 100, // requests por window
      ...config
    };

    this.app = express();
    this.ruleEngine = null;
    this.scoringService = null;
    this.isInitialized = false;
  }

  /**
   * Inicializa o servidor
   */
  async initialize() {
    try {
      // Inicializa serviços
      await this._initializeServices();

      // Configura middleware
      this._setupMiddleware();

      // Configura rotas
      this._setupRoutes();

      // Configura tratamento de erros
      this._setupErrorHandling();

      this.isInitialized = true;
      console.log('NextTrust Server initialized successfully');

    } catch (error) {
      console.error('Failed to initialize NextTrust Server:', error);
      throw error;
    }
  }

  /**
   * Inicializa serviços internos
   * @private
   */
  async _initializeServices() {
    // Inicializa Rule Engine
    this.ruleEngine = new RuleEngine(this.config.rulesPath);
    await this.ruleEngine.loadRules();

    // Inicializa Scoring Service
    this.scoringService = new ScoringService(this.ruleEngine);

    console.log('Services initialized');
  }

  /**
   * Configura middleware do Express
   * @private
   */
  _setupMiddleware() {
    // Segurança
    this.app.use(helmet({
      contentSecurityPolicy: false, // Desabilita CSP para APIs
      crossOriginEmbedderPolicy: false
    }));

    // CORS
    if (this.config.enableCors) {
      this.app.use(cors({
        origin: process.env.CORS_ORIGIN || '*',
        methods: ['GET', 'POST', 'PUT', 'DELETE'],
        allowedHeaders: ['Content-Type', 'Authorization', 'X-API-Key', 'X-Session-ID']
      }));
    }

    // Compressão
    this.app.use(compression());

    // Logging
    if (process.env.NODE_ENV !== 'test') {
      this.app.use(morgan('combined'));
    }

    // Rate limiting
    if (this.config.enableRateLimit) {
      const limiter = rateLimit({
        windowMs: this.config.rateLimitWindow * 60 * 1000,
        max: this.config.rateLimitMax,
        message: {
          error: 'Too many requests',
          code: 'RATE_LIMIT_EXCEEDED'
        },
        standardHeaders: true,
        legacyHeaders: false
      });
      this.app.use('/api', limiter);
    }

    // Parsing de JSON
    this.app.use(express.json({ limit: '10mb' }));
    this.app.use(express.urlencoded({ extended: true, limit: '10mb' }));

    // Middleware do SDK
    this.app.use('/api', sdkMiddleware(this.config));
  }

  /**
   * Configura rotas da API
   * @private
   */
  _setupRoutes() {
    // Health check
    this.app.get('/health', (req, res) => {
      res.json({
        status: 'healthy',
        timestamp: new Date().toISOString(),
        version: process.env.SDK_VERSION || '1.0.0',
        services: {
          ruleEngine: this.ruleEngine ? 'ready' : 'not_ready',
          scoringService: this.scoringService ? 'ready' : 'not_ready'
        }
      });
    });

    // Rotas da API
    this.app.use('/api/identity', verifyIdentityRoute(this.ruleEngine, this.scoringService));

    // Rota raiz
    this.app.get('/', (req, res) => {
      res.json({
        name: 'NextTrust SDK API',
        version: process.env.SDK_VERSION || '1.0.0',
        description: 'API para verificação de identidade e análise de confiança',
        endpoints: {
          health: '/health',
          verify: '/api/identity/verify'
        }
      });
    });

    // 404 handler
    this.app.use('*', (req, res) => {
      res.status(404).json({
        error: 'Endpoint not found',
        code: 'NOT_FOUND',
        path: req.originalUrl
      });
    });
  }

  /**
   * Configura tratamento de erros
   * @private
   */
  _setupErrorHandling() {
    this.app.use(errorHandler);
  }

  /**
   * Inicia o servidor
   */
  async start() {
    if (!this.isInitialized) {
      await this.initialize();
    }

    return new Promise((resolve, reject) => {
      this.server = this.app.listen(this.config.port, (error) => {
        if (error) {
          reject(error);
        } else {
          console.log(`NextTrust Server running on port ${this.config.port}`);
          console.log(`Health check: http://localhost:${this.config.port}/health`);
          console.log(`API docs: http://localhost:${this.config.port}/`);
          resolve();
        }
      });
    });
  }

  /**
   * Para o servidor
   */
  async stop() {
    return new Promise((resolve) => {
      if (this.server) {
        this.server.close(() => {
          console.log('NextTrust Server stopped');
          resolve();
        });
      } else {
        resolve();
      }
    });
  }

  /**
   * Obtém instância do Express app
   * @returns {Express} Instância do Express
   */
  getApp() {
    return this.app;
  }

  /**
   * Obtém configuração atual
   * @returns {Object} Configuração do servidor
   */
  getConfig() {
    return { ...this.config };
  }

  /**
   * Atualiza configuração
   * @param {Object} newConfig - Nova configuração
   */
  updateConfig(newConfig) {
    this.config = { ...this.config, ...newConfig };
  }
}

// Inicialização se executado diretamente
if (import.meta.url === `file://${process.argv[1]}`) {
  const server = new NextTrustServer();
  
  server.start().catch((error) => {
    console.error('Failed to start server:', error);
    process.exit(1);
  });

  // Graceful shutdown
  process.on('SIGTERM', async () => {
    console.log('SIGTERM received, shutting down gracefully');
    await server.stop();
    process.exit(0);
  });

  process.on('SIGINT', async () => {
    console.log('SIGINT received, shutting down gracefully');
    await server.stop();
    process.exit(0);
  });
}

export { NextTrustServer };
