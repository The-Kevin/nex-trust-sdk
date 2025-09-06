import React, { useState, useEffect } from 'react';
import NextTrustComponent from './components/NextTrustComponent';
import './App.css';

function App() {
  const [sdkReady, setSdkReady] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    // Simula carregamento do SDK
    const timer = setTimeout(() => {
      setSdkReady(true);
    }, 1000);

    return () => clearTimeout(timer);
  }, []);

  if (error) {
    return (
      <div className="container">
        <div className="card">
          <div className="status error">
            <h2>Erro de Inicialização</h2>
            <p>{error}</p>
            <button 
              className="button" 
              onClick={() => window.location.reload()}
            >
              Recarregar Página
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!sdkReady) {
    return (
      <div className="container">
        <div className="card text-center">
          <div className="loading"></div>
          <p>Carregando NextTrust SDK...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container">
      <div className="card">
        <h1>NextTrust SDK - Exemplo React</h1>
        <p>
          Este exemplo demonstra a integração do NextTrust SDK com React.
          O SDK coleta dados de fingerprint do dispositivo e eventos comportamentais
          para análise de confiança e verificação de identidade.
        </p>
      </div>

      <NextTrustComponent />
    </div>
  );
}

export default App;
