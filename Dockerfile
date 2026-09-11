FROM eclipse-temurin:21-jre-alpine

# Install nodejs, npm
RUN apk add --no-cache nodejs npm

WORKDIR /opt/Lavalink

# Copy pinned official Lavalink v4 release JAR (see https://github.com/lavalink-devs/Lavalink)
COPY Lavalink.jar ./Lavalink.jar

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
