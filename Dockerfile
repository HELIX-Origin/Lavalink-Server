FROM eclipse-temurin:21-jre-alpine

# Install curl, nodejs, npm
RUN apk add --no-cache curl nodejs npm

WORKDIR /opt/Lavalink

# Download official latest Lavalink v4 JAR from https://github.com/lavalink-devs/Lavalink
RUN curl -fSL "https://github.com/lavalink-devs/Lavalink/releases/latest/download/Lavalink.jar" -o Lavalink.jar

# Install dependencies and build ESM TypeScript dashboard & supervisor
COPY package.json ./
RUN npm install

COPY tsconfig.json ./
COPY src/ ./src/
RUN npm run build && npm prune --production

# Copy configuration
COPY application.yml ./application.yml

# Expose default gateway port
EXPOSE 2333

# Start the ESM TypeScript dashboard and supervisor directly with Node.js
CMD ["node", "dist/index.js"]
