# ⚙️ Configuration Reference

This page documents the complete configuration schema used in `application.yml` and its corresponding environment variables.

---

## 🔐 Environment Variables vs Client Settings

It is critical to distinguish between **Lavalink Server Variables** and **Discord Bot Client Variables**:

| Variable Type | Examples | Where It Is Configured | Purpose |
| :--- | :--- | :--- | :--- |
| **Server Variable** | `PORT`, `LAVA_PASS`, `YOUTUBE_CLIENT_ID`, `SPOTIFY_CLIENT_ID`, `DASHBOARD_PORT` | Lavalink Server (`application.yml`, `.env`, `docker-compose.yml`) | Tells Lavalink what port to bind to, what password to demand, and which external APIs to query. |
| **Bot Client Variable** | `LAVA_ENABLED`, `LAVA_EXTERNAL`, `LAVA_HOST`, `LAVA_SECURE` | Discord Bot (`Master-Bot` `.env`) | Tells your Discord bot how to reach this external Lavalink server. **Never configured on the Lavalink server.** |

---

## 📋 Comprehensive Server Variables

The Lavalink server resolves **Port** (`$PORT`, defaulting to `2333`) and **Domain** (`$PUBLIC_URL`, `$HOST`, or `localhost`) directly from the system environment.

The following server configuration variables are exposed and supported:

| Variable | Default Value | Description |
| :--- | :--- | :--- |
| `LAVA_PASS` | `youshallnotpass` | Authentication password for incoming WebSocket and REST API requests. |
| `YOUTUBE_REFRESH_TOKEN` | *(empty)* | YouTube OAuth 2.0 refresh token. Auto-saved after device flow completes. Can also be pre-set in `.env`. |
| `YOUTUBE_CLIENT_ID` | **(required)** | YouTube OAuth Client ID (app type: "TVs and Limited Input devices"). Used to issue the authorization URL. Server refuses to start without it. |
| `YOUTUBE_CLIENT_SECRET` | *(empty)* | YouTube OAuth Client Secret matching `YOUTUBE_CLIENT_ID`, used for the token exchange. Falls back to YouTube's built-in client secret when empty. |
| `PUBLIC_URL` | *(empty)* | Public domain/host for the server (e.g. `lavalink.yourdomain.com`). Used for dashboard URL and keep-alive. |
| `DASHBOARD_PORT` | `lavaLinkPort + 1` | Custom port for the dashboard/gateway. Defaults to Lavalink port + 1 (e.g., 2333 → 2334). |
| `SPOTIFY_CLIENT_ID` | *(empty)* | Client ID from the [Spotify Developer Dashboard](https://developer.spotify.com/dashboard). |
| `SPOTIFY_CLIENT_SECRET` | *(empty)* | Client Secret from the Spotify Developer Dashboard. |
| `KEEP_ALIVE_ENABLED` | `true` | *(Deprecated)* Keep-alive service has been removed. |

---

## 📄 `application.yml` Core Sections

The `application.yml` file is now the **single source of truth** for Lavalink Java server configuration. The TypeScript supervisor reads this file at startup to determine ports and addresses.

### 1. Server & Networking
```yaml
server:
  port: 2333
  address: 0.0.0.0
  undertow:
    buffer-size: 1024
    direct-buffers: true
    threads:
      io: 4
      worker: 32
```
- **`port`**: Lavalink Java server port (used by TypeScript supervisor to derive dashboard port +1).
- **`address`**: Binds to `0.0.0.0` (all IPv4 interfaces).
- **`undertow`**: Configures the high-performance non-blocking HTTP/WebSocket Undertow engine.

### 2. Lavalink Core & Audio Buffers
```yaml
lavalink:
  plugins:
    - dependency: "dev.lavalink.youtube:youtube-plugin:1.18.2"
      repository: "https://maven.lavalink.dev/releases"
    - dependency: "com.github.topi314.lavasrc:lavasrc-plugin:4.8.3"
      repository: "https://maven.topi.wtf/releases"
      snapshot: false
  server:
    password: "youshallnotpass"
    sources:
      youtube: false        # Handled by the modern YouTube Plugin
      soundcloud:
        searchEnabled: true
        filterOutPreviewTracks: true
      bandcamp: true
      vimeo: true
      nico: true
      http: false
      local: false
    filters:
      volume: true
      equalizer: true
      karaoke: true
      timescale: true
      tremolo: true
      vibrato: true
      distortion: true
      rotation: true
      channelMix: true
      lowPass: true
    bufferDurationMs: 400
    frameBufferDurationMs: 10000
    opusEncodingQuality: 10
    resamplingQuality: HIGH
    trackStuckThresholdMs: 30000
    playersTimeout: 0

plugins:
  youtube:
    enabled: true
    allowSearch: true
    allowDirectVideoIds: true
    allowDirectPlaylistIds: true
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
    oauth:
      enabled: true
      refreshToken: "${YOUTUBE_REFRESH_TOKEN:}"
      skipInitialization: "true"
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

The TypeScript supervisor parses `application.yml` at startup to determine:
- Lavalink Java server port & address
- Dashboard port (defaults to Lavalink port + 1, configurable via `DASHBOARD_PORT`)
- Lavalink host address (defaults to `127.0.0.1`)