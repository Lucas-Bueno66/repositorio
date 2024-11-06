# Use uma imagem base do Node.js
FROM node:18-slim

# Atualiza e instala as dependências necessárias para o Puppeteer e Chromium
RUN apt-get update && apt-get install -y \
    wget \
    ca-certificates \
    libnss3 \
    libx11-xcb1 \
    libxss1 \
    libgdk-pixbuf2.0-0 \
    libatk1.0-0 \
    libatk-bridge2.0-0 \
    libx11-xcb-dev \
    libasound2 \
    libdrm2 \
    fonts-liberation \
    libappindicator3-1 \
    libxtst6 \
    libxcomposite1 \
    libxrandr2 \
    libgbm1 \
    chromium \
    --no-install-recommends && apt-get clean

# Configura o diretório de trabalho
WORKDIR /app

# Copia o package.json e package-lock.json para o diretório do container
COPY package.json package-lock.json ./ 

# Limpa o cache do npm
RUN rm -rf /root/.npm

# Instala as dependências do projeto
RUN npm install

# Instala o Puppeteer
RUN npm install puppeteer

# Copia o restante dos arquivos do projeto
COPY . .

# Expõe a porta 10000
EXPOSE 10000

# Comando para rodar o servidor
CMD ["node", "server.js"]
