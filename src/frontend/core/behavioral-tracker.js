/**
 * Módulo de rastreamento comportamental
 * Coleta eventos de interação do usuário de forma passiva
 */

import { BEHAVIORAL_EVENTS } from '../../shared/constants/index.js';

/**
 * Classe responsável pelo rastreamento comportamental
 */
export class BehavioralTracker {
  constructor(config = {}) {
    this.config = {
      maxEvents: config.maxEvents || 1000,
      enabled: config.enabled !== false,
      events: config.events || Object.values(BEHAVIORAL_EVENTS),
      ...config
    };
    
    this.events = [];
    this.sessionId = this._generateSessionId();
    this.startTime = Date.now();
    this.isTracking = false;
    
    // Bind methods para manter o contexto
    this._handleEvent = this._handleEvent.bind(this);
  }

  /**
   * Inicia o rastreamento comportamental
   */
  startTracking() {
    if (this.isTracking || !this.config.enabled) {
      return;
    }

    this.isTracking = true;
    this._attachEventListeners();
    
    console.log('NextTrust: Behavioral tracking started');
  }

  /**
   * Para o rastreamento comportamental
   */
  stopTracking() {
    if (!this.isTracking) {
      return;
    }

    this.isTracking = false;
    this._removeEventListeners();
    
    console.log('NextTrust: Behavioral tracking stopped');
  }

  /**
   * Anexa listeners de eventos
   * @private
   */
  _attachEventListeners() {
    // Eventos de mouse
    if (this.config.events.includes(BEHAVIORAL_EVENTS.CLICK)) {
      document.addEventListener('click', this._handleEvent, true);
    }
    
    if (this.config.events.includes(BEHAVIORAL_EVENTS.MOUSE_MOVE)) {
      document.addEventListener('mousemove', this._handleEvent, true);
    }

    // Eventos de teclado
    if (this.config.events.includes(BEHAVIORAL_EVENTS.KEYSTROKE)) {
      document.addEventListener('keydown', this._handleEvent, true);
      document.addEventListener('keyup', this._handleEvent, true);
    }

    // Eventos de scroll
    if (this.config.events.includes(BEHAVIORAL_EVENTS.SCROLL)) {
      window.addEventListener('scroll', this._handleEvent, true);
    }

    // Eventos de foco
    if (this.config.events.includes(BEHAVIORAL_EVENTS.FOCUS)) {
      document.addEventListener('focus', this._handleEvent, true);
    }
    
    if (this.config.events.includes(BEHAVIORAL_EVENTS.BLUR)) {
      document.addEventListener('blur', this._handleEvent, true);
    }

    // Eventos de redimensionamento
    if (this.config.events.includes(BEHAVIORAL_EVENTS.RESIZE)) {
      window.addEventListener('resize', this._handleEvent, true);
    }

    // Eventos de formulário
    if (this.config.events.includes(BEHAVIORAL_EVENTS.FORM_SUBMIT)) {
      document.addEventListener('submit', this._handleEvent, true);
    }

    // Eventos de página
    if (this.config.events.includes(BEHAVIORAL_EVENTS.PAGE_LOAD)) {
      window.addEventListener('load', this._handleEvent, true);
    }
    
    if (this.config.events.includes(BEHAVIORAL_EVENTS.PAGE_UNLOAD)) {
      window.addEventListener('beforeunload', this._handleEvent, true);
    }
  }

  /**
   * Remove listeners de eventos
   * @private
   */
  _removeEventListeners() {
    document.removeEventListener('click', this._handleEvent, true);
    document.removeEventListener('mousemove', this._handleEvent, true);
    document.removeEventListener('keydown', this._handleEvent, true);
    document.removeEventListener('keyup', this._handleEvent, true);
    window.removeEventListener('scroll', this._handleEvent, true);
    document.removeEventListener('focus', this._handleEvent, true);
    document.removeEventListener('blur', this._handleEvent, true);
    window.removeEventListener('resize', this._handleEvent, true);
    document.removeEventListener('submit', this._handleEvent, true);
    window.removeEventListener('load', this._handleEvent, true);
    window.removeEventListener('beforeunload', this._handleEvent, true);
  }

  /**
   * Manipula eventos capturados
   * @private
   */
  _handleEvent(event) {
    if (!this.isTracking) {
      return;
    }

    try {
      const eventData = this._extractEventData(event);
      
      // Adiciona o evento à lista
      this.events.push(eventData);
      
      // Limita o número de eventos armazenados
      if (this.events.length > this.config.maxEvents) {
        this.events = this.events.slice(-this.config.maxEvents);
      }
      
    } catch (error) {
      console.error('NextTrust: Error handling behavioral event:', error);
    }
  }

  /**
   * Extrai dados relevantes do evento
   * @private
   */
  _extractEventData(event) {
    const baseData = {
      type: event.type,
      timestamp: Date.now(),
      sessionId: this.sessionId,
      target: this._getTargetInfo(event.target),
      position: this._getPositionInfo(event),
      viewport: this._getViewportInfo()
    };

    // Dados específicos por tipo de evento
    switch (event.type) {
      case 'click':
        return {
          ...baseData,
          data: {
            button: event.button,
            ctrlKey: event.ctrlKey,
            shiftKey: event.shiftKey,
            altKey: event.altKey,
            metaKey: event.metaKey
          }
        };

      case 'keydown':
      case 'keyup':
        return {
          ...baseData,
          data: {
            key: event.key,
            code: event.code,
            ctrlKey: event.ctrlKey,
            shiftKey: event.shiftKey,
            altKey: event.altKey,
            metaKey: event.metaKey,
            repeat: event.repeat
          }
        };

      case 'scroll':
        return {
          ...baseData,
          data: {
            scrollX: window.scrollX,
            scrollY: window.scrollY
          }
        };

      case 'mousemove':
        return {
          ...baseData,
          data: {
            movementX: event.movementX,
            movementY: event.movementY
          }
        };

      case 'resize':
        return {
          ...baseData,
          data: {
            innerWidth: window.innerWidth,
            innerHeight: window.innerHeight
          }
        };

      case 'submit':
        return {
          ...baseData,
          data: {
            formId: event.target.id,
            formClass: event.target.className,
            formAction: event.target.action
          }
        };

      default:
        return baseData;
    }
  }

  /**
   * Obtém informações do elemento alvo
   * @private
   */
  _getTargetInfo(target) {
    if (!target) return null;

    return {
      tagName: target.tagName,
      id: target.id,
      className: target.className,
      type: target.type,
      name: target.name,
      value: target.value ? target.value.substring(0, 100) : null // Limita o valor
    };
  }

  /**
   * Obtém informações de posição do evento
   * @private
   */
  _getPositionInfo(event) {
    if (event.clientX !== undefined && event.clientY !== undefined) {
      return {
        clientX: event.clientX,
        clientY: event.clientY,
        pageX: event.pageX,
        pageY: event.pageY,
        screenX: event.screenX,
        screenY: event.screenY
      };
    }
    return null;
  }

  /**
   * Obtém informações da viewport
   * @private
   */
  _getViewportInfo() {
    return {
      width: window.innerWidth,
      height: window.innerHeight,
      scrollX: window.scrollX,
      scrollY: window.scrollY
    };
  }

  /**
   * Gera ID único para a sessão
   * @private
   */
  _generateSessionId() {
    return 'session_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
  }

  /**
   * Obtém todos os eventos coletados
   * @returns {Array} Lista de eventos
   */
  getEvents() {
    return [...this.events];
  }

  /**
   * Obtém eventos de um tipo específico
   * @param {string} eventType - Tipo do evento
   * @returns {Array} Lista de eventos do tipo especificado
   */
  getEventsByType(eventType) {
    return this.events.filter(event => event.type === eventType);
  }

  /**
   * Limpa todos os eventos coletados
   */
  clearEvents() {
    this.events = [];
  }

  /**
   * Obtém estatísticas da sessão
   * @returns {Object} Estatísticas da sessão
   */
  getSessionStats() {
    const now = Date.now();
    const duration = now - this.startTime;
    
    const eventCounts = {};
    this.events.forEach(event => {
      eventCounts[event.type] = (eventCounts[event.type] || 0) + 1;
    });

    return {
      sessionId: this.sessionId,
      startTime: this.startTime,
      duration: duration,
      totalEvents: this.events.length,
      eventCounts: eventCounts,
      isTracking: this.isTracking
    };
  }

  /**
   * Obtém dados resumidos para envio
   * @returns {Object} Dados resumidos da sessão
   */
  getSummaryData() {
    const stats = this.getSessionStats();
    
    // Calcula métricas comportamentais
    const metrics = this._calculateBehavioralMetrics();
    
    return {
      sessionId: this.sessionId,
      startTime: this.startTime,
      duration: stats.duration,
      totalEvents: stats.totalEvents,
      eventCounts: stats.eventCounts,
      metrics: metrics,
      sampleEvents: this.events.slice(-50) // Últimos 50 eventos como amostra
    };
  }

  /**
   * Calcula métricas comportamentais
   * @private
   */
  _calculateBehavioralMetrics() {
    const metrics = {
      clickFrequency: 0,
      scrollFrequency: 0,
      keystrokeFrequency: 0,
      averageClickInterval: 0,
      averageScrollInterval: 0,
      mouseMovementDistance: 0,
      formInteractionCount: 0,
      focusBlurCount: 0
    };

    if (this.events.length === 0) {
      return metrics;
    }

    const duration = (Date.now() - this.startTime) / 1000; // em segundos
    
    // Frequências
    metrics.clickFrequency = this.getEventsByType('click').length / duration;
    metrics.scrollFrequency = this.getEventsByType('scroll').length / duration;
    metrics.keystrokeFrequency = this.getEventsByType('keydown').length / duration;
    
    // Contadores
    metrics.formInteractionCount = this.getEventsByType('submit').length;
    metrics.focusBlurCount = this.getEventsByType('focus').length + this.getEventsByType('blur').length;
    
    // Intervalos médios
    const clickEvents = this.getEventsByType('click');
    if (clickEvents.length > 1) {
      const intervals = [];
      for (let i = 1; i < clickEvents.length; i++) {
        intervals.push(clickEvents[i].timestamp - clickEvents[i-1].timestamp);
      }
      metrics.averageClickInterval = intervals.reduce((a, b) => a + b, 0) / intervals.length;
    }

    const scrollEvents = this.getEventsByType('scroll');
    if (scrollEvents.length > 1) {
      const intervals = [];
      for (let i = 1; i < scrollEvents.length; i++) {
        intervals.push(scrollEvents[i].timestamp - scrollEvents[i-1].timestamp);
      }
      metrics.averageScrollInterval = intervals.reduce((a, b) => a + b, 0) / intervals.length;
    }

    // Distância de movimento do mouse
    const mouseEvents = this.getEventsByType('mousemove');
    let totalDistance = 0;
    for (let i = 1; i < mouseEvents.length; i++) {
      const prev = mouseEvents[i-1];
      const curr = mouseEvents[i];
      if (prev.data && curr.data && prev.data.movementX && curr.data.movementY) {
        const distance = Math.sqrt(
          Math.pow(curr.data.movementX - prev.data.movementX, 2) +
          Math.pow(curr.data.movementY - prev.data.movementY, 2)
        );
        totalDistance += distance;
      }
    }
    metrics.mouseMovementDistance = totalDistance;

    return metrics;
  }
}
