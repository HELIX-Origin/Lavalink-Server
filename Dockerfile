FROM eclipse-temurin:21-jre-alpine

# Install curl
RUN apk add --no-cache curl

WORKDIR /opt/Lavalink

# Download official latest Lavalink v4 JAR from https://github.com/lavalink-devs/Lavalink
RUN curl -fSL "https://github.com/lavalink-devs/Lavalink/releases/latest/download/Lavalink.jar" -o Lavalink.jar

# Copy configuration
COPY application.yml /opt/Lavalink/application.yml

# Expose default Lavalink port
EXPOSE 2333

# Start Lavalink with dynamic cloud port binding ($PORT / $LAVA_PORT) and modern TLS protocols
ENTRYPOINT ["sh", "-c", "exec java -Xmx512M -Djdk.tls.client.protocols=TLSv1.2,TLSv1.3 -Dserver.port=${PORT:-${LAVA_PORT:-2333}} -Dserver.address=0.0.0.0 -jar Lavalink.jar"]
