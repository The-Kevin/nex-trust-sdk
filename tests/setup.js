/**
 * Setup global para testes do NextTrust SDK
 */

// Configura variáveis de ambiente para testes
process.env.NODE_ENV = 'test';
process.env.NEXT_TRUST_API_KEY = 'test-api-key';
process.env.PORT = '3001';
process.env.RULES_PATH = './config/rules.json';

// Mock do console para reduzir output durante testes
const originalConsole = global.console;
global.console = {
  ...originalConsole,
  log: jest.fn(),
  debug: jest.fn(),
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn()
};

// Mock do fetch para testes
global.fetch = jest.fn();

// Mock do import.meta para testes
global.import = {
  meta: {
    url: 'file:///test'
  }
};

// Mock do navigator para testes de frontend
Object.defineProperty(global, 'navigator', {
  value: {
    userAgent: 'Mozilla/5.0 (Test Browser)',
    language: 'en-US',
    languages: ['en-US', 'en'],
    platform: 'Test Platform',
    hardwareConcurrency: 4,
    deviceMemory: 8,
    plugins: [
      { name: 'Test Plugin', description: 'Test Plugin Description', filename: 'test.plugin' }
    ]
  },
  writable: true
});

// Mock do screen para testes de frontend
Object.defineProperty(global, 'screen', {
  value: {
    width: 1920,
    height: 1080,
    colorDepth: 24,
    pixelDepth: 24
  },
  writable: true
});

// Mock do window para testes de frontend
Object.defineProperty(global, 'window', {
  value: {
    innerWidth: 1920,
    innerHeight: 1080,
    scrollX: 0,
    scrollY: 0,
    addEventListener: jest.fn(),
    removeEventListener: jest.fn()
  },
  writable: true
});

// Mock do document para testes de frontend
Object.defineProperty(global, 'document', {
  value: {
    createElement: jest.fn(() => ({
      style: {},
      getContext: jest.fn(() => ({
        fillRect: jest.fn(),
        fillText: jest.fn(),
        beginPath: jest.fn(),
        arc: jest.fn(),
        closePath: jest.fn(),
        fill: jest.fn(),
        drawImage: jest.fn(),
        toDataURL: jest.fn(() => 'data:image/png;base64,test')
      })),
      toDataURL: jest.fn(() => 'data:image/png;base64,test'),
      addEventListener: jest.fn(),
      removeEventListener: jest.fn(),
      appendChild: jest.fn(),
      removeChild: jest.fn(),
      contains: jest.fn(() => false)
    })),
    getElementsByTagName: jest.fn(() => []),
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    body: {
      appendChild: jest.fn(),
      removeChild: jest.fn(),
      contains: jest.fn(() => false)
    }
  },
  writable: true
});

// Mock do mediaDevices para testes de captura facial
Object.defineProperty(global.navigator, 'mediaDevices', {
  value: {
    getUserMedia: jest.fn(() => Promise.resolve({
      getTracks: jest.fn(() => [{
        stop: jest.fn()
      }])
    }))
  },
  writable: true
});

// Mock do AudioContext para testes de fingerprint de áudio
global.AudioContext = jest.fn(() => ({
  createOscillator: jest.fn(() => ({
    type: '',
    frequency: { setValueAtTime: jest.fn() },
    connect: jest.fn(),
    start: jest.fn(),
    stop: jest.fn()
  })),
  createAnalyser: jest.fn(() => ({
    connect: jest.fn()
  })),
  createGain: jest.fn(() => ({
    gain: { setValueAtTime: jest.fn() },
    connect: jest.fn()
  })),
  createScriptProcessor: jest.fn(() => ({
    connect: jest.fn(),
    onaudioprocess: null
  })),
  currentTime: 0,
  close: jest.fn()
}));

// Mock do Intl para testes de timezone
global.Intl = {
  DateTimeFormat: jest.fn(() => ({
    resolvedOptions: jest.fn(() => ({
      timeZone: 'UTC'
    }))
  }))
};

// Cleanup após cada teste
afterEach(() => {
  jest.clearAllMocks();
  fetch.mockClear();
});

// Cleanup global após todos os testes
afterAll(() => {
  global.console = originalConsole;
});
