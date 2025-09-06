/**
 * Testes para o módulo de rastreamento comportamental
 */

import { BehavioralTracker } from '../../src/frontend/core/behavioral-tracker.js';
import { BEHAVIORAL_EVENTS } from '../../src/shared/constants/index.js';

describe('BehavioralTracker', () => {
  let tracker;

  beforeEach(() => {
    tracker = new BehavioralTracker({
      enabled: true,
      maxEvents: 100
    });
  });

  afterEach(() => {
    if (tracker) {
      tracker.stopTracking();
    }
  });

  describe('constructor', () => {
    test('deve inicializar com configuração padrão', () => {
      const defaultTracker = new BehavioralTracker();
      
      expect(defaultTracker.config.enabled).toBe(true);
      expect(defaultTracker.config.maxEvents).toBe(1000);
      expect(defaultTracker.events).toEqual([]);
      expect(defaultTracker.sessionId).toBeDefined();
      expect(defaultTracker.isTracking).toBe(false);
    });

    test('deve inicializar com configuração customizada', () => {
      const customTracker = new BehavioralTracker({
        enabled: false,
        maxEvents: 50,
        events: [BEHAVIORAL_EVENTS.CLICK]
      });
      
      expect(customTracker.config.enabled).toBe(false);
      expect(customTracker.config.maxEvents).toBe(50);
      expect(customTracker.config.events).toContain(BEHAVIORAL_EVENTS.CLICK);
    });
  });

  describe('startTracking', () => {
    test('deve iniciar rastreamento quando habilitado', () => {
      tracker.startTracking();
      
      expect(tracker.isTracking).toBe(true);
    });

    test('não deve iniciar rastreamento quando desabilitado', () => {
      tracker.config.enabled = false;
      tracker.startTracking();
      
      expect(tracker.isTracking).toBe(false);
    });

    test('não deve iniciar rastreamento se já está ativo', () => {
      tracker.startTracking();
      const initialTime = tracker.startTime;
      
      tracker.startTracking();
      
      expect(tracker.startTime).toBe(initialTime);
    });
  });

  describe('stopTracking', () => {
    test('deve parar rastreamento', () => {
      tracker.startTracking();
      expect(tracker.isTracking).toBe(true);
      
      tracker.stopTracking();
      expect(tracker.isTracking).toBe(false);
    });

    test('não deve fazer nada se não está rastreando', () => {
      expect(tracker.isTracking).toBe(false);
      
      tracker.stopTracking();
      expect(tracker.isTracking).toBe(false);
    });
  });

  describe('getEvents', () => {
    test('deve retornar lista vazia inicialmente', () => {
      const events = tracker.getEvents();
      expect(events).toEqual([]);
    });

    test('deve retornar cópia dos eventos', () => {
      tracker.events = [{ type: 'test', timestamp: Date.now() }];
      
      const events = tracker.getEvents();
      expect(events).toEqual(tracker.events);
      expect(events).not.toBe(tracker.events); // Deve ser uma cópia
    });
  });

  describe('getEventsByType', () => {
    test('deve retornar eventos de tipo específico', () => {
      tracker.events = [
        { type: 'click', timestamp: Date.now() },
        { type: 'scroll', timestamp: Date.now() },
        { type: 'click', timestamp: Date.now() }
      ];
      
      const clickEvents = tracker.getEventsByType('click');
      expect(clickEvents).toHaveLength(2);
      expect(clickEvents.every(event => event.type === 'click')).toBe(true);
    });

    test('deve retornar array vazio se não há eventos do tipo', () => {
      tracker.events = [{ type: 'click', timestamp: Date.now() }];
      
      const scrollEvents = tracker.getEventsByType('scroll');
      expect(scrollEvents).toEqual([]);
    });
  });

  describe('clearEvents', () => {
    test('deve limpar todos os eventos', () => {
      tracker.events = [
        { type: 'click', timestamp: Date.now() },
        { type: 'scroll', timestamp: Date.now() }
      ];
      
      tracker.clearEvents();
      expect(tracker.events).toEqual([]);
    });
  });

  describe('getSessionStats', () => {
    test('deve retornar estatísticas da sessão', () => {
      tracker.events = [
        { type: 'click', timestamp: Date.now() },
        { type: 'scroll', timestamp: Date.now() },
        { type: 'click', timestamp: Date.now() }
      ];
      
      const stats = tracker.getSessionStats();
      
      expect(stats).toHaveProperty('sessionId');
      expect(stats).toHaveProperty('startTime');
      expect(stats).toHaveProperty('duration');
      expect(stats).toHaveProperty('totalEvents');
      expect(stats).toHaveProperty('eventCounts');
      expect(stats).toHaveProperty('isTracking');
      
      expect(stats.totalEvents).toBe(3);
      expect(stats.eventCounts.click).toBe(2);
      expect(stats.eventCounts.scroll).toBe(1);
    });
  });

  describe('getSummaryData', () => {
    test('deve retornar dados resumidos', () => {
      tracker.events = [
        { type: 'click', timestamp: Date.now() },
        { type: 'scroll', timestamp: Date.now() }
      ];
      
      const summary = tracker.getSummaryData();
      
      expect(summary).toHaveProperty('sessionId');
      expect(summary).toHaveProperty('startTime');
      expect(summary).toHaveProperty('duration');
      expect(summary).toHaveProperty('totalEvents');
      expect(summary).toHaveProperty('eventCounts');
      expect(summary).toHaveProperty('metrics');
      expect(summary).toHaveProperty('sampleEvents');
      
      expect(summary.totalEvents).toBe(2);
      expect(summary.metrics).toBeDefined();
    });
  });

  describe('_generateSessionId', () => {
    test('deve gerar ID único para sessão', () => {
      const id1 = tracker._generateSessionId();
      const id2 = tracker._generateSessionId();
      
      expect(id1).toBeDefined();
      expect(id2).toBeDefined();
      expect(id1).not.toBe(id2);
      expect(id1).toMatch(/^session_\d+_[a-z0-9]+$/);
    });
  });

  describe('_calculateBehavioralMetrics', () => {
    test('deve calcular métricas comportamentais', () => {
      tracker.events = [
        { type: 'click', timestamp: Date.now() - 1000, data: { movementX: 10, movementY: 20 } },
        { type: 'click', timestamp: Date.now() - 500, data: { movementX: 15, movementY: 25 } },
        { type: 'scroll', timestamp: Date.now() - 200, data: { scrollX: 0, scrollY: 100 } }
      ];
      
      const metrics = tracker._calculateBehavioralMetrics();
      
      expect(metrics).toHaveProperty('clickFrequency');
      expect(metrics).toHaveProperty('scrollFrequency');
      expect(metrics).toHaveProperty('keystrokeFrequency');
      expect(metrics).toHaveProperty('averageClickInterval');
      expect(metrics).toHaveProperty('averageScrollInterval');
      expect(metrics).toHaveProperty('mouseMovementDistance');
      expect(metrics).toHaveProperty('formInteractionCount');
      expect(metrics).toHaveProperty('focusBlurCount');
    });

    test('deve retornar métricas zeradas se não há eventos', () => {
      tracker.events = [];
      
      const metrics = tracker._calculateBehavioralMetrics();
      
      expect(metrics.clickFrequency).toBe(0);
      expect(metrics.scrollFrequency).toBe(0);
      expect(metrics.keystrokeFrequency).toBe(0);
      expect(metrics.mouseMovementDistance).toBe(0);
    });
  });

  describe('_extractEventData', () => {
    test('deve extrair dados de evento de clique', () => {
      const mockEvent = {
        type: 'click',
        target: { tagName: 'BUTTON', id: 'test-btn' },
        clientX: 100,
        clientY: 200,
        button: 0,
        ctrlKey: false,
        shiftKey: false,
        altKey: false,
        metaKey: false
      };
      
      const eventData = tracker._extractEventData(mockEvent);
      
      expect(eventData.type).toBe('click');
      expect(eventData.target.tagName).toBe('BUTTON');
      expect(eventData.target.id).toBe('test-btn');
      expect(eventData.data.button).toBe(0);
      expect(eventData.data.ctrlKey).toBe(false);
    });

    test('deve extrair dados de evento de teclado', () => {
      const mockEvent = {
        type: 'keydown',
        target: { tagName: 'INPUT', type: 'text' },
        key: 'a',
        code: 'KeyA',
        ctrlKey: true,
        shiftKey: false,
        altKey: false,
        metaKey: false,
        repeat: false
      };
      
      const eventData = tracker._extractEventData(mockEvent);
      
      expect(eventData.type).toBe('keydown');
      expect(eventData.data.key).toBe('a');
      expect(eventData.data.code).toBe('KeyA');
      expect(eventData.data.ctrlKey).toBe(true);
      expect(eventData.data.repeat).toBe(false);
    });
  });
});
