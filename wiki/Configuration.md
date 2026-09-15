# ⚙️ Configuration Reference

This page documents the complete configuration schema used in `application.yml` and its corresponding environment variables.

---

## 🔐 Environment Variables vs Client Settings

It is critical to distinguish between **Lavalink Server Variables** and **Discord Bot Client Variables**:

| Variable Type | Examples | Where It Is Configured | Purpose |
| :--- | :--- | :--- | :--- |
| **Server Variable** | `LAVA_PASS`, `YOUTUBE_CLIENT_ID`, `SPOTIFY_CLIENT_ID`, `LAVA_INTERNAL_URL`, `DASHBOARD_INTERNAL_URL` | Lavalink Server (`application.yml`, `.env`, `docker-compose.yml`) | Tells Lavalink what port to bind to, what password to demand, and which external APIs to query. |
| **Bot Client Variable** | `LAVA_ENABLED`, `LAVA_EXTERNAL`, `LAVA_HOST`, `LAVA_SECURE` | Discord Bot (`Master-Bot` `.env`) | Tells your Discord bot how to reach this external Lavalink server. **Never configured on the Lavalink server.** |

---

## 📋 Comprehensive Server Variables

The Lavalink server resolves all configuration from internal/public URLs and environment variables.

### Core Lavalink Variables

| Variable | Default Value | Description |
| :--- | :--- | :--- |
| `LAVA_INTERNAL_URL` | `http://localhost:2333` | Internal Lavalink URL (host:port) |
| `DASHBOARD_INTERNAL_URL` | `http://localhost:2334` | Dashboard internal URL (host:port) |
| `LAVA_PUBLIC_URL` | *(empty)* | Public Lavalink URL (e.g. `https://lavalink.yourdomain.com`) |
| `DASHBOARD_PUBLIC_URL` | *(empty)* | Public Dashboard URL (e.g. `https://lavalink.yourdomain.com`) |
| `LAVA_PASS` | `youshallnotpass` | Authentication password for WebSocket/REST API |
| `LAVA_SECURE` | `false` | Use HTTPS for Lavalink (true/false) |
| `LAVA_CIPHER_URL` | `https://cipher.kikkia.dev/` | Remote cipher endpoint for YouTube signature deciphering |
| `LAVA_CIPHER_PASSWORD` | *(empty)* | Optional password for self-hosted cipher |

### YouTube OAuth

| Variable | Default Value | Description |
| :--- | :--- | :--- |
| `YOUTUBE_CLIENT_ID` | **(required)** | YouTube OAuth Client ID (app type: "TVs and Limited Input devices") |
| `YOUTUBE_CLIENT_SECRET` | *(empty)* | YouTube OAuth Client Secret for token exchange |
| `YOUTUBE_REFRESH_TOKEN` | *(empty)* | Pre-authorized refresh token (auto-saved after device flow) |

### Spotify

| Variable | Default Value | Description |
| :--- | :--- | :--- |
| `SPOTIFY_CLIENT_ID` | *(empty)* | Spotify Developer App Client ID |
| `SPOTIFY_CLIENT_SECRET` | *(empty)* | Spotify Developer App Client Secret |

### Genius (LavaLyrics)

| Variable | Default Value | Description |
| :--- | :--- | :--- |
| `GENIUS_ACCESS_TOKEN` | *(empty)* | Genius API Access Token for lyrics |

### Database

| Variable | Default Value | Description |
| :--- | :--- | :--- |
| `DB_PATH` | `./database.db` | SQLite database file path |
| `DB_URI` | `sqlite://./database.db` | SQLite database URI |

### Environment

| Variable | Default Value | Description |
| :--- | :--- | :--- |
| `NODE_ENV` | `production` | Set to "production" for production mode |
| `ADMIN_KEY` | *(empty)* | Optional host owner dashboard password (defaults to LAVA_PASS) |

---

## 📄 `application.yml` Core Sections

The `application.yml` file is the **single source of truth** for Lavalink Java server configuration. The TypeScript supervisor reads this file at startup to determine ports and addresses.

### 1. Server & Networking
```yaml
server:
  port: ${LAVA_PORT:2333}
  address: ${LAVA_HOST:0.0.0.0}
  undertow:
    buffer-size: 1024
    direct-buffers: true
    threads:
      io: 4
      worker: 32
```
- **`port`**: Lavalink Java server port (from `LAVA_PORT` or `LAVA_INTERNAL_URL`)
- **`address`**: Lavalink bind address (from `LAVA_HOST` or `LAVA_INTERNAL_URL`)
- **`undertow`**: High-performance non-blocking HTTP/WebSocket Undertow engine

### 2. Lavalink Core & Plugins
```yaml
lavalink:
  plugins:
    - dependency: "dev.lavalink.youtube:youtube-plugin:1.18.2"
      repository: "https://maven.lavalink.dev/releases"
    - dependency: "com.github.topi314.lavasrc:lavasrc-plugin:4.8.3"
      repository: "https://maven.topi.wtf/releases"
      snapshot: false
    - dependency: "com.github.topi314.sponsorblock:sponsorblock-plugin:1.0.0"
      repository: "https://maven.topi.wtf/releases"
      snapshot: false
    - dependency: "com.github.topi314.lavasearch:lavasearch-plugin:1.0.0"
      repository: "https://maven.topi.wtf/releases"
      snapshot: false
    - dependency: "com.github.topi314.lavalyrics:lavalyrics-plugin:1.0.0"
      repository: "https://maven.topi.wtf/releases"
      snapshot: false
    - dependency: "com.github.DuncteBot.skybot:skybot-lavalink-plugin:1.7.1"
      repository: "https://jitpack.io"
  server:
    password: "${LAVA_PASS:youshallnotpass}"
    sources:
      youtube: false
      soundcloud:
        searchEnabled: true
        filterOutPreviewTracks: true
      bandcamp: true
      vimeo: true
      nico: true
      http: false
      local: false
    # ... filters, buffer settings, etc.

plugins:
  youtube:
    enabled: true
    oauth:
      enabled: true
      refreshToken: "${YOUTUBE_REFRESH_TOKEN:}"
      skipInitialization: "true"
    remoteCipher:
      url: "https://cipher.kikkia.dev/"
      password: ""
    clients:
      - TV
      - MUSIC
      - ANDROID_VR
      - IOS
      - WEB
      - WEBEMBEDDED
  lavasrc:
    providers:
      - "ytmsearch:\"%ISRC%\""
      - "ytsearch:\"%ISRC%\""
      - "ytmsearch:%QUERY%"
      - "ytsearch:%QUERY%"
      - "scsearch:%QUERY%"
    sources:
      spotify: true
      soundcloud: false
    spotify:
      clientId: "${SPOTIFY_CLIENT_ID:}"
      clientSecret: "${SPOTIFY_CLIENT_SECRET:}"
      countryCode: "US"
      playlistLoadLimit: 6
      albumLoadLimit: 6
      resolveArtistsInSearch: true
  lavalyrics:
    enabled: true
    geniusToken: "${GENIUS_ACCESS_TOKEN:}"
  skybot:
    sources:
      getyarn: false
      tts: false
      pornhub: false
      reddit: false
      ocremix: true
      tiktok: false
      mixcloud: true
      soundgasm: false
      pixeldrain: false
      tumblr: false
```

### 3. JVM Flags & Tuning
The supervisor starts Lavalink with:
```bash
java -Xmx512M -Djdk.tls.client.protocols=TLSv1.2,TLSv1.3 -Dspring.profiles.active=prod -Dserver.port=2333 -Dserver.address=0.0.0.0 -jar Lavalink.jar
```
- **`-Xmx512M`**: Restricts the maximum Java heap allocation to 512 MB.
- **`-Djdk.tls.client.protocols=TLSv1.2,TLSv1.3`**: Enforces modern, secure TLS negotiation.

---

## 🔄 Configuration Loading Order

1. **`application.yml`** - Base configuration (ports, plugins, Lavalink settings)
2. **`.env`** - Overrides for secrets (passwords, tokens, API keys)
3. **System environment** - Highest priority, overrides `.env`

The TypeScript supervisor parses `application.yml` at startup and resolves `${VAR:default}` placeholders with environment variables.

---

## 🌐 URL Structure

The server uses **internal URLs** (with ports) for local communication and **public URLs** (without ports) for external access via reverse proxies/Cloudflare tunnels:

| Type | Variable | Example |
| :--- | :--- | :--- |
| Lavalink Internal | `LAVA_INTERNAL_URL` | `http://localhost:2333` |
| Dashboard Internal | `DASHBOARD_INTERNAL_URL` | `http://localhost:2334` |
| Lavalink Public | `LAVA_PUBLIC_URL` | `https://lavalink.yourdomain.com` |
| Dashboard Public | `DASHBOARD_PUBLIC_URL` | `https://lavalink.yourdomain.com` |

**Internal URLs** include ports for direct service-to-service communication.
**Public URLs** omit ports since reverse proxies/Cloudflare tunnels handle port mapping.