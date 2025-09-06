module.exports = {
  // Ambiente de teste
  testEnvironment: 'node',
  
  // Diretórios de teste
  testMatch: [
    '**/tests/**/*.test.js',
    '**/tests/**/*.spec.js'
  ],
  
  // Arquivos a serem ignorados
  testPathIgnorePatterns: [
    '/node_modules/',
    '/dist/',
    '/coverage/'
  ],
  
  // Cobertura de código
  collectCoverageFrom: [
    'src/**/*.js',
    '!src/**/*.test.js',
    '!src/**/*.spec.js',
    '!src/examples/**',
    '!src/docs/**'
  ],
  
  coverageDirectory: 'coverage',
  coverageReporters: [
    'text',
    'lcov',
    'html',
    'json'
  ],
  
  // Limites de cobertura
  coverageThreshold: {
    global: {
      branches: 70,
      functions: 70,
      lines: 70,
      statements: 70
    }
  },
  
  // Setup de testes
  setupFilesAfterEnv: ['<rootDir>/tests/setup.js'],
  
  // Timeout para testes
  testTimeout: 10000,
  
  // Verbose output
  verbose: true,
  
  // Clear mocks entre testes
  clearMocks: true,
  
  // Restore mocks entre testes
  restoreMocks: true,
  
  // Transformação de arquivos
  transform: {
    '^.+\\.js$': 'babel-jest'
  },
  
  // Módulos para mock automático
  automock: false,
  
  // Extensões de arquivo
  moduleFileExtensions: ['js', 'json'],
  
  // Mapeamento de módulos
  moduleNameMapping: {
    '^@/(.*)$': '<rootDir>/src/$1',
    '^@tests/(.*)$': '<rootDir>/tests/$1'
  },
  
  // Globals
  globals: {
    'process.env.NODE_ENV': 'test'
  }
};
