FROM eclipse-temurin:21-jre-alpine

# Install nodejs, npm, curl
RUN apk add --no-cache nodejs npm curl

WORKDIR /opt/Lavalink

# Download Lavalink JAR from official releases at build time
ARG LAVALINK_VERSION=latest
RUN curl -L -o Lavalink.jar "https://github.com/lavalink-devs/Lavalink/releases/${LAVALINK_VERSION}/download/Lavalink.jar"

# Install dependencies and build ESM TypeScript dashboard & supervisor
COPY package.json ./
RUN npm install

COPY tsconfig.json ./
COPY src/ ./src/
RUN npm run build && npm prune --production

# Copy configuration
COPY application.yml ./application.yml

# Expose default gateway port (Lavalink) and dashboard port
EXPOSE 2333 2334

# Start the ESM TypeScript dashboard and supervisor directly with Node.js
CMD ["node", "dist/index.js"]