# NextTrust SDK
# Feito por Kevin Almeida RM557422
#RM557422@fiap.com.br

SDK leve para verificação de identidade e análise de confiança, com coleta passiva de fingerprint do dispositivo e eventos comportamentais.

## 🚀 Características

- **SDK Leve**: Implementação minimalista com foco em performance
- **Fingerprinting Passivo**: Coleta de dados do dispositivo sem interferir na experiência do usuário
- **Análise Comportamental**: Rastreamento de eventos de interação para detecção de padrões
- **Captura Facial Opcional**: Verificação facial com consentimento explícito
- **Rule Engine Configurável**: Sistema de regras flexível via JSON
- **Scoring Inteligente**: Sistema de pontuação (0-100) com mapeamento para decisões
- **HTTPS Seguro**: Comunicação criptografada entre frontend e backend
- **Multi-framework**: Suporte para React, Vue, Angular e JavaScript vanilla

## 📦 Instalação

### NPM
```bash
npm install nex-trust-sdk
```

### CDN
```html
<script src="https://cdn.nextrust.com/sdk/nextrust-sdk.js"></script>
```

### Download Manual
Baixe os arquivos de build da [página de releases](https://github.com/nextrust/nex-trust-sdk/releases).

## 🚀 Início Rápido

### Frontend (JavaScript)

```javascript
import { initSDK } from 'nex-trust-sdk';

// Inicializar SDK
const sdk = await initSDK({
  apiUrl: 'https://api.nextrust.com',
  apiKey: 'sua-chave-api',
  enableFacialCapture: false,
  enableBehavioralTracking: true
});

// Verificar identidade
const result = await sdk.verifyIdentity({
  includeFacial: false
});

console.log('Score:', result.score);
console.log('Decisão:', result.decision); // 'allow', 'review', 'deny'
```

### Backend (Node.js)

```javascript
const { NextTrustServer } = require('nex-trust-sdk');

const server = new NextTrustServer({
  port: 3000,
  apiKey: 'sua-chave-api',
  rulesPath: './config/rules.json'
});

await server.start();
```

## 📚 Documentação

### Configuração

#### Frontend
```javascript
const config = {
  apiUrl: 'https://api.nextrust.com',        // URL da API
  apiKey: 'sua-chave-api',                   // Chave da API
  enableFacialCapture: false,                // Habilitar captura facial
  enableBehavioralTracking: true,            // Habilitar rastreamento comportamental
  sessionTimeout: 30 * 60 * 1000,           // Timeout da sessão (ms)
  maxBehavioralEvents: 1000,                 // Máximo de eventos comportamentais
  fingerprintInterval: 5 * 60 * 1000        // Intervalo de atualização do fingerprint (ms)
};
```

#### Backend
```javascript
const config = {
  port: 3000,                               // Porta do servidor
  apiKey: 'sua-chave-api',                  // Chave da API
  rulesPath: './config/rules.json',         // Caminho para arquivo de regras
  enableCors: true,                         // Habilitar CORS
  enableRateLimit: true,                    // Habilitar rate limiting
  rateLimitWindow: 15,                      // Janela de rate limit (minutos)
  rateLimitMax: 100                         // Máximo de requests por janela
};
```

### API Reference

#### Frontend

##### `initSDK(config)`
Inicializa o SDK com a configuração fornecida.

**Parâmetros:**
- `config` (Object): Configuração do SDK

**Retorna:** Promise<NextTrustSDK>

##### `sdk.verifyIdentity(options)`
Verifica a identidade do usuário.

**Parâmetros:**
- `options` (Object): Opções de verificação
  - `includeFacial` (boolean): Incluir verificação facial

**Retorna:** Promise<VerificationResult>

##### `sdk.getSessionData()`
Obtém dados da sessão atual.

**Retorna:** Object

##### `sdk.destroy()`
Destrói o SDK e limpa recursos.

#### Backend

##### `POST /api/identity/verify`
Endpoint principal para verificação de identidade.

**Headers:**
- `X-API-Key`: Chave da API
- `X-Session-ID`: ID da sessão (opcional)
- `Content-Type`: application/json

**Body:**
```json
{
  "sessionId": "string",
  "timestamp": "number",
  "fingerprint": {
    "userAgent": "string",
    "language": "string",
    "platform": "string",
    "screenResolution": "string",
    "timezone": "string",
    "canvasFingerprint": "string",
    "webglFingerprint": "string",
    "audioFingerprint": "string",
    "fonts": ["string"],
    "plugins": ["object"],
    "hardwareConcurrency": "string",
    "deviceMemory": "string"
  },
  "behavioral": {
    "sessionId": "string",
    "startTime": "number",
    "duration": "number",
    "totalEvents": "number",
    "eventCounts": "object",
    "metrics": "object",
    "sampleEvents": ["object"]
  },
  "facial": {
    "imageData": "string",
    "timestamp": "number",
    "metadata": "object"
  }
}
```

**Response:**
```json
{
  "score": 85,
  "decision": "allow",
  "reasons": ["string"],
  "sessionId": "string",
  "timestamp": "string",
  "processingTime": 1500,
  "ruleResults": [
    {
      "id": "string",
      "name": "string",
      "passed": "boolean",
      "weight": "number",
      "score": "number"
    }
  ],
  "metadata": {
    "fingerprint": {
      "collected": "boolean",
      "age": "number"
    },
    "behavioral": {
      "collected": "boolean",
      "eventCount": "number",
      "duration": "number"
    },
    "facial": {
      "collected": "boolean",
      "error": "string"
    }
  }
}
```

### Rule Engine

O sistema de regras permite configurar lógica de negócio personalizada para análise de confiança.

#### Estrutura de Regra
```json
{
  "id": "unique_rule_id",
  "name": "Nome da Regra",
  "condition": "fingerprint.userAgent && behavioral.totalEvents > 5",
  "weight": 20,
  "action": "allow",
  "enabled": true,
  "description": "Descrição da regra"
}
```

#### Tipos de Ação
- `allow`: Permite a operação
- `review`: Requer revisão manual
- `deny`: Nega a operação

#### Exemplos de Condições
```javascript
// Verificar completude do fingerprint
"fingerprint.userAgent && fingerprint.canvasFingerprint"

// Verificar atividade comportamental
"behavioral && behavioral.totalEvents > 10"

// Detectar user agents suspeitos
"fingerprint.userAgent.includes('bot')"

// Verificar captura facial
"facial && facial.imageData && !facial.error"

// Verificar duração da sessão
"behavioral && behavioral.duration > 60000"
```

### Sistema de Scoring

O sistema de scoring combina múltiplos fatores para gerar uma pontuação de 0 a 100:

- **Regras (40%)**: Resultado das regras configuradas
- **Comportamental (25%)**: Análise de eventos comportamentais
- **Fingerprint (20%)**: Qualidade e completude do fingerprint
- **Facial (10%)**: Verificação facial (se aplicável)
- **Qualidade dos Dados (5%)**: Consistência e idade dos dados

#### Thresholds Padrão
- **Allow**: ≥ 80 pontos
- **Review**: 50-79 pontos
- **Deny**: < 50 pontos

## 🛠️ Desenvolvimento

### Pré-requisitos
- Node.js 16+
- npm 8+

### Instalação
```bash
git clone https://github.com/nextrust/nex-trust-sdk.git
cd nex-trust-sdk
npm install
```

### Scripts Disponíveis

```bash
# Desenvolvimento
npm run dev                 # Inicia servidor de desenvolvimento
npm run dev:frontend        # Inicia servidor frontend
npm run dev:backend         # Inicia servidor backend

# Testes
npm test                    # Executa todos os testes
npm run test:frontend       # Testes do frontend
npm run test:backend        # Testes do backend
npm run test:integration    # Testes de integração
npm run test:coverage       # Cobertura de testes

# Build
npm run build               # Build completo
npm run build:frontend      # Build do frontend
npm run build:backend       # Build do backend

# Qualidade
npm run lint                # Linting
npm run lint:fix            # Corrigir problemas de lint

# Exemplos
npm run example:react       # Exemplo React
npm run example:vanilla     # Exemplo Vanilla JS

# Docker
npm run docker:build        # Build da imagem Docker
npm run docker:run          # Executar container
npm run docker:dev          # Desenvolvimento com Docker Compose
```

### Estrutura do Projeto
```
nex-trust-sdk/
├── src/
│   ├── frontend/           # SDK Frontend
│   │   ├── core/          # Módulos principais
│   │   ├── modules/       # Módulos opcionais
│   │   └── utils/         # Utilitários
│   ├── backend/           # Servidor Backend
│   │   ├── routes/        # Rotas da API
│   │   ├── middleware/    # Middlewares
│   │   ├── services/      # Serviços
│   │   └── models/        # Modelos de dados
│   └── shared/            # Código compartilhado
│       ├── types/         # Tipos e interfaces
│       └── constants/     # Constantes
├── tests/                 # Testes
├── examples/              # Exemplos de integração
├── config/                # Configurações
├── docs/                  # Documentação
└── dist/                  # Builds
```

## 🐳 Docker

### Build e Execução
```bash
# Build da imagem
docker build -t nex-trust-sdk .

# Executar container
docker run -p 3000:3000 \
  -e NEXT_TRUST_API_KEY=sua-chave \
  nex-trust-sdk
```

### Docker Compose
```bash
# Desenvolvimento
docker-compose up --build

# Produção
docker-compose -f docker-compose.prod.yml up -d
```

## 🔧 Configuração de Ambiente

Copie o arquivo `env.example` para `.env` e configure as variáveis:

```bash
cp env.example .env
```

### Variáveis Principais
```env
# Servidor
PORT=3000
NODE_ENV=development

# API
NEXT_TRUST_API_URL=http://localhost:3000
NEXT_TRUST_API_KEY=sua-chave-api

# CORS
ENABLE_CORS=true
CORS_ORIGIN=*

# Rate Limiting
ENABLE_RATE_LIMIT=true
RATE_LIMIT_WINDOW=15
RATE_LIMIT_MAX=100

# Rule Engine
RULES_PATH=./config/rules.json
```

## 📊 Monitoramento

### Health Check
```bash
curl http://localhost:3000/health
```

### Métricas
- Score médio por período
- Taxa de decisões (allow/review/deny)
- Tempo de processamento
- Erros por endpoint

### Logs
O SDK gera logs estruturados para monitoramento:
- Requisições da API
- Erros de processamento
- Atividade do Rule Engine
- Performance de scoring

## 🔒 Segurança

### Boas Práticas
- Use HTTPS em produção
- Configure rate limiting adequadamente
- Monitore logs de segurança
- Atualize regras regularmente
- Valide dados de entrada

### Privacidade
- Coleta apenas dados necessários
- Não armazena dados pessoais
- Respeita consentimento do usuário
- Criptografa comunicação

## 🤝 Contribuição

1. Fork o projeto
2. Crie uma branch para sua feature (`git checkout -b feature/AmazingFeature`)
3. Commit suas mudanças (`git commit -m 'Add some AmazingFeature'`)
4. Push para a branch (`git push origin feature/AmazingFeature`)
5. Abra um Pull Request

## 📄 Licença

Este projeto está licenciado sob a Licença MIT - veja o arquivo [LICENSE](LICENSE) para detalhes.

## 🆘 Suporte

- **Documentação**: [docs.nextrust.com](https://docs.nextrust.com)
- **Issues**: [GitHub Issues](https://github.com/nextrust/nex-trust-sdk/issues)
- **Email**: support@nextrust.com
- **Discord**: [NextTrust Community](https://discord.gg/nextrust)

## 🗺️ Roadmap

### v1.1.0
- [ ] Suporte a WebAssembly para performance
- [ ] Integração com bancos de dados
- [ ] Dashboard de administração
- [ ] SDK para Python

### v1.2.0
- [ ] Machine Learning para detecção de fraudes
- [ ] Integração com provedores de identidade
- [ ] Suporte a múltiplas regiões
- [ ] API GraphQL

---

**NextTrust SDK** - Verificação de identidade inteligente e confiável.
