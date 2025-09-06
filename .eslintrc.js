module.exports = {
  env: {
    browser: true,
    es2021: true,
    node: true,
    jest: true
  },
  extends: [
    'eslint:recommended'
  ],
  parserOptions: {
    ecmaVersion: 'latest',
    sourceType: 'module'
  },
  rules: {
    // Regras de estilo
    'indent': ['error', 2],
    'linebreak-style': ['error', 'unix'],
    'quotes': ['error', 'single'],
    'semi': ['error', 'always'],
    
    // Regras de qualidade
    'no-unused-vars': ['error', { 'argsIgnorePattern': '^_' }],
    'no-console': ['warn', { 'allow': ['warn', 'error'] }],
    'no-debugger': 'error',
    'no-alert': 'error',
    
    // Regras de segurança
    'no-eval': 'error',
    'no-implied-eval': 'error',
    'no-new-func': 'error',
    
    // Regras de performance
    'no-loop-func': 'error',
    'no-inner-declarations': 'error',
    
    // Regras de consistência
    'camelcase': ['error', { 'properties': 'never' }],
    'consistent-return': 'error',
    'default-case': 'error',
    'eqeqeq': ['error', 'always'],
    'no-else-return': 'error',
    'no-return-assign': 'error',
    'no-sequences': 'error',
    'no-throw-literal': 'error',
    'no-unmodified-loop-condition': 'error',
    'no-unused-expressions': 'error',
    'no-useless-concat': 'error',
    'no-useless-return': 'error',
    'prefer-const': 'error',
    'prefer-template': 'error',
    
    // Regras de documentação
    'valid-jsdoc': ['error', {
      'requireReturn': false,
      'requireReturnDescription': false,
      'requireParamDescription': false
    }]
  },
  overrides: [
    {
      // Configuração específica para testes
      files: ['**/*.test.js', '**/*.spec.js', 'tests/**/*.js'],
      env: {
        jest: true
      },
      rules: {
        'no-console': 'off',
        'no-unused-expressions': 'off'
      }
    },
    {
      // Configuração específica para frontend
      files: ['src/frontend/**/*.js'],
      env: {
        browser: true
      },
      rules: {
        'no-console': ['warn', { 'allow': ['log', 'warn', 'error'] }]
      }
    },
    {
      // Configuração específica para backend
      files: ['src/backend/**/*.js'],
      env: {
        node: true
      },
      rules: {
        'no-console': ['warn', { 'allow': ['log', 'warn', 'error'] }]
      }
    }
  ],
  globals: {
    // Globals específicos do NextTrust SDK
    'NextTrustSDK': 'readonly',
    'initSDK': 'readonly'
  }
};
