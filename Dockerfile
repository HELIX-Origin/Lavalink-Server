FROM eclipse-temurin:21-jre-alpine

# Install curl
RUN apk add --no-cache curl

WORKDIR /opt/Lavalink

# Download official latest Lavalink v4 JAR from https://github.com/lavalink-devs/Lavalink
RUN curl -fSL "https://github.com/lavalink-devs/Lavalink/releases/latest/download/Lavalink.jar" -o Lavalink.jar

# Copy configuration and entrypoint
COPY application.yml /opt/Lavalink/application.yml
COPY entrypoint.sh /opt/Lavalink/entrypoint.sh

# Ensure entrypoint is executable
RUN chmod +x /opt/Lavalink/entrypoint.sh

# Expose default Lavalink port
EXPOSE 2333

# Start Lavalink via entrypoint script resolving host port, domain, and prod profile
ENTRYPOINT ["/opt/Lavalink/entrypoint.sh"]
