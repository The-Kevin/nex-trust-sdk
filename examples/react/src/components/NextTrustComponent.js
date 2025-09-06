import React, { useState, useEffect, useRef } from 'react';

// Simulação do SDK NextTrust (em produção, seria importado do pacote)
const mockSDK = {
  init: async (config) => {
    console.log('NextTrust SDK initialized with config:', config);
    return true;
  },
  verifyIdentity: async (options) => {
    // Simula delay da API
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Simula resultado baseado nas opções
    const score = Math.random() * 100;
    let decision = 'review';
    
    if (score >= 80) decision = 'allow';
    else if (score < 50) decision = 'deny';
    
    return {
      score: Math.round(score),
      decision,
      reasons: [
        'Análise de fingerprint concluída',
        'Dados comportamentais coletados',
        options.includeFacial ? 'Verificação facial realizada' : 'Verificação facial não solicitada'
      ],
      sessionId: 'session_' + Date.now(),
      timestamp: new Date().toISOString(),
      processingTime: 1500 + Math.random() * 1000
    };
  },
  getSessionData: () => ({
    sessionId: 'session_' + Date.now(),
    fingerprint: {
      userAgent: navigator.userAgent,
      language: navigator.language,
      platform: navigator.platform
    },
    behavioral: {
      totalEvents: Math.floor(Math.random() * 100),
      duration: Math.floor(Math.random() * 300000)
    }
  }),
  destroy: () => {
    console.log('NextTrust SDK destroyed');
  }
};

function NextTrustComponent() {
  const [sdk, setSdk] = useState(null);
  const [config, setConfig] = useState({
    apiUrl: 'http://localhost:3000',
    apiKey: 'test-api-key',
    enableFacialCapture: false,
    enableBehavioralTracking: true
  });
  const [isVerifying, setIsVerifying] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [sessionData, setSessionData] = useState(null);
  const [includeFacial, setIncludeFacial] = useState(false);

  const sdkRef = useRef(null);

  useEffect(() => {
    initializeSDK();
    return () => {
      if (sdkRef.current) {
        sdkRef.current.destroy();
      }
    };
  }, []);

  const initializeSDK = async () => {
    try {
      setError(null);
      
      // Em produção, seria: import { initSDK } from 'nex-trust-sdk';
      const sdkInstance = mockSDK;
      await sdkInstance.init(config);
      
      setSdk(sdkInstance);
      sdkRef.current = sdkInstance;
      
      // Atualiza dados da sessão
      updateSessionData();
      
    } catch (err) {
      setError(`Erro ao inicializar SDK: ${err.message}`);
    }
  };

  const updateSessionData = () => {
    if (sdk) {
      const data = sdk.getSessionData();
      setSessionData(data);
    }
  };

  const handleVerifyIdentity = async () => {
    if (!sdk) {
      setError('SDK não inicializado');
      return;
    }

    try {
      setIsVerifying(true);
      setError(null);
      setResult(null);

      const options = {
        includeFacial: includeFacial
      };

      const verificationResult = await sdk.verifyIdentity(options);
      setResult(verificationResult);
      
      // Atualiza dados da sessão após verificação
      updateSessionData();
      
    } catch (err) {
      setError(`Erro na verificação: ${err.message}`);
    } finally {
      setIsVerifying(false);
    }
  };

  const handleConfigChange = (field, value) => {
    setConfig(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleReinitialize = () => {
    if (sdkRef.current) {
      sdkRef.current.destroy();
    }
    setSdk(null);
    setResult(null);
    setError(null);
    initializeSDK();
  };

  const getDecisionColor = (decision) => {
    switch (decision) {
      case 'allow': return 'success';
      case 'deny': return 'danger';
      case 'review': return 'warning';
      default: return 'info';
    }
  };

  const getDecisionText = (decision) => {
    switch (decision) {
      case 'allow': return 'Permitir';
      case 'deny': return 'Negar';
      case 'review': return 'Revisar';
      default: return 'Desconhecido';
    }
  };

  return (
    <div className="grid">
      {/* Configuração */}
      <div className="card">
        <h2>Configuração do SDK</h2>
        
        <div className="form-group">
          <label>URL da API:</label>
          <input
            type="text"
            value={config.apiUrl}
            onChange={(e) => handleConfigChange('apiUrl', e.target.value)}
            disabled={!!sdk}
          />
        </div>

        <div className="form-group">
          <label>Chave da API:</label>
          <input
            type="text"
            value={config.apiKey}
            onChange={(e) => handleConfigChange('apiKey', e.target.value)}
            disabled={!!sdk}
          />
        </div>

        <div className="checkbox-group">
          <input
            type="checkbox"
            id="enableBehavioralTracking"
            checked={config.enableBehavioralTracking}
            onChange={(e) => handleConfigChange('enableBehavioralTracking', e.target.checked)}
            disabled={!!sdk}
          />
          <label htmlFor="enableBehavioralTracking">
            Habilitar rastreamento comportamental
          </label>
        </div>

        <div className="checkbox-group">
          <input
            type="checkbox"
            id="enableFacialCapture"
            checked={config.enableFacialCapture}
            onChange={(e) => handleConfigChange('enableFacialCapture', e.target.checked)}
            disabled={!!sdk}
          />
          <label htmlFor="enableFacialCapture">
            Habilitar captura facial
          </label>
        </div>

        <button
          className="button"
          onClick={handleReinitialize}
          disabled={isVerifying}
        >
          Reinicializar SDK
        </button>
      </div>

      {/* Status e Controles */}
      <div className="card">
        <h2>Status e Controles</h2>
        
        <div className={`status ${sdk ? 'success' : 'error'}`}>
          <strong>SDK:</strong> {sdk ? 'Inicializado' : 'Não inicializado'}
        </div>

        {sessionData && (
          <div className="status info">
            <strong>Sessão:</strong> {sessionData.sessionId}
          </div>
        )}

        <div className="checkbox-group">
          <input
            type="checkbox"
            id="includeFacial"
            checked={includeFacial}
            onChange={(e) => setIncludeFacial(e.target.checked)}
            disabled={!sdk || isVerifying}
          />
          <label htmlFor="includeFacial">
            Incluir verificação facial
          </label>
        </div>

        <button
          className="button"
          onClick={handleVerifyIdentity}
          disabled={!sdk || isVerifying}
        >
          {isVerifying ? (
            <>
              <div className="loading"></div>
              Verificando...
            </>
          ) : (
            'Verificar Identidade'
          )}
        </button>

        {error && (
          <div className="status error mt-20">
            <strong>Erro:</strong> {error}
          </div>
        )}
      </div>

      {/* Resultado */}
      {result && (
        <div className="card">
          <h2>Resultado da Verificação</h2>
          
          <div className={`status ${getDecisionColor(result.decision)}`}>
            <strong>Decisão:</strong> {getDecisionText(result.decision)}
          </div>

          <div className="status info">
            <strong>Score:</strong> {result.score}/100
          </div>

          <div className="status info">
            <strong>Sessão:</strong> {result.sessionId}
          </div>

          <div className="status info">
            <strong>Tempo de processamento:</strong> {result.processingTime}ms
          </div>

          <h3>Razões:</h3>
          <ul>
            {result.reasons.map((reason, index) => (
              <li key={index}>{reason}</li>
            ))}
          </ul>

          <h3>Dados Completos:</h3>
          <div className="result">
            {JSON.stringify(result, null, 2)}
          </div>
        </div>
      )}

      {/* Dados da Sessão */}
      {sessionData && (
        <div className="card">
          <h2>Dados da Sessão</h2>
          
          <h3>Fingerprint:</h3>
          <div className="result">
            {JSON.stringify(sessionData.fingerprint, null, 2)}
          </div>

          <h3>Comportamental:</h3>
          <div className="result">
            {JSON.stringify(sessionData.behavioral, null, 2)}
          </div>
        </div>
      )}
    </div>
  );
}

export default NextTrustComponent;
