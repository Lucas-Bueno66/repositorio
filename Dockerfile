# Use uma imagem base do Node.js
FROM node:18-slim

# Instalar dependências do sistema necessárias para o Puppeteer
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
    --no-install-recommends && apt-get clean

# Limpar cache do npm para evitar problemas
RUN npm cache clean --force

# Configura o diretório de trabalho
WORKDIR /app

# Copia o package.json e package-lock.json para o diretório do container
COPY package.json package-lock.json ./

# Instala as dependências do projeto (incluindo o Puppeteer)
RUN npm install

# Copia o restante dos arquivos do projeto
COPY . .

# Expõe a porta 3000
EXPOSE 3000

# Comando para rodar o servidor
CMD ["node", "server.js"]
