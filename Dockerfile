# NextTrust SDK - Dockerfile
FROM node:18-alpine

# Metadados
LABEL maintainer="NextTrust Team"
LABEL description="NextTrust SDK - Identity Verification and Trust Analysis"
LABEL version="1.0.0"

# Instala dependências do sistema
RUN apk add --no-cache \
    dumb-init \
    && addgroup -g 1001 -S nodejs \
    && adduser -S nextrust -u 1001

# Define diretório de trabalho
WORKDIR /app

# Copia arquivos de dependências
COPY package*.json ./

# Instala dependências
RUN npm ci --only=production && npm cache clean --force

# Copia código fonte
COPY src/ ./src/
COPY config/ ./config/

# Cria diretório para logs
RUN mkdir -p /app/logs && chown -R nextrust:nodejs /app

# Muda para usuário não-root
USER nextrust

# Expõe porta
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3000/health', (res) => { process.exit(res.statusCode === 200 ? 0 : 1) })"

# Comando de inicialização
ENTRYPOINT ["dumb-init", "--"]
CMD ["node", "src/backend/server.js"]
