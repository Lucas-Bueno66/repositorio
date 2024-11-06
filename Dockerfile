# Use uma imagem base do Node.js
FROM node:18-slim

# Instala dependências do sistema necessárias para o Chromium
RUN apt-get update && apt-get install -y \
    libnss3 \
    libgdk-pixbuf2.0-0 \
    libatk1.0-0 \
    libatk-bridge2.0-0 \
    libxss1 \
    libx11-xcb1 \
    libxtst6 \
    libasound2 \
    ca-certificates \
    fonts-liberation \
    libappindicator3-1 \
    libx11-xcb-dev \
    chromium \
    libdrm2 \
    libgbm1 \
    --no-install-recommends && apt-get clean

# Instala o Puppeteer
RUN npm install puppeteer

# Configura o diretório de trabalho
WORKDIR /app

# Copia os arquivos para o container
COPY package.json package-lock.json ./
RUN npm install
COPY . ./

EXPOSE 3000

# Comando para rodar o servidor
CMD ["node", "server.js"]
