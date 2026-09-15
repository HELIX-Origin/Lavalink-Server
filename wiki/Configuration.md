# ⚙️ Configuration Reference

This page documents the complete configuration schema used in `application.yml` and its corresponding environment variables.

---

## 🔐 Environment Variables vs Client Settings

It is critical to distinguish between **Lavalink Server Variables** and **Discord Bot Client Variables**:

| Variable Type | Examples | Where It Is Configured | Purpose |
| :--- | :--- | :--- | :--- |
| **Server Variable** | `LAVA_PASS`, `YOUTUBE_CLIENT_ID`, `SPOTIFY_CLIENT_ID`, `LAVA_DOMAIN`, `LAVA_PORT` | Lavalink Server (`application.yml`, `.env`, `docker-compose.yml`) | Tells Lavalink what port to bind to, what password to demand, and which external APIs to query. |
| **Bot Client Variable** | `LAVA_ENABLED`, `LAVA_EXTERNAL`, `LAVA_HOST`, `LAVA_SECURE` | Discord Bot (`Master-Bot` `.env`) | Tells your Discord bot how to reach this external Lavalink server. **Never configured on the Lavalink server.** |

---

## 📋 Comprehensive Server Variables

The Lavalink server resolves all configuration from environment variables. Derived URLs (`internalUrl`, `publicUrl`) are computed in `src/config.ts`.

### Core Lavalink Variables

| Variable | Default Value | Description |
| :--- | :--- | :--- |
| `LAVA_DOMAIN` | *(empty)* | Public domain/host for the Lavalink server (e.g. `https://lavalink.yourdomain.com`). Scheme stripped automatically |
| `LAVA_HOST` | `127.0.0.1` | Internal bind address (host) |
| `LAVA_PORT` | `2333` | Lavalink server port |
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

### Dashboard Theme

| Variable | Default Value | Description |
| :--- | :--- | :--- |
| `DASHBOARD_THEME` | `dark` | Theme: `glassmorphism` \| `dark` \| `light` \| `cyberpunk` \| `dracula` \| `nord` \| `emerald` |
| `DASHBOARD_COLOR_SCHEME` | `default` | Accent color: `default` \| `cyan` \| `purple` \| `blue` \| `emerald` \| `rose` \| `amber` \| `indigo` \| `crimson` \| `teal` \| `sunset` |

### Dashboard

| Variable | Default Value | Description |
| :--- | :--- | :--- |
| `DASHBOARD_PUBLIC_URL` | *(empty)* | Public URL for the dashboard (e.g. `https://dashboard.yourdomain.com`). Leave empty to default to `http://<dashboardHost>:<dashboardPort>` |
| `DASHBOARD_INTERNAL_URL` | *(empty)* | Gateway bind URL (e.g. `http://127.0.0.1:2334`). Leave empty to default to `LAVA_HOST:LAVA_PORT+1` |

### Environment

| Variable | Default Value | Description |
| :--- | :--- | :--- |
| `NODE_ENV` | `production` | Set to "production" for production mode |

---

## 📄 `application.yml` Core Sections

The `application.yml` file is the **single source of truth** for Lavalink Java server configuration. The TypeScript gateway derives ports/addresses from environment variables and passes them to the Java process at spawn time.

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
- **`port`**: Lavalink Java server port (from `LAVA_PORT`)
- **`address`**: Lavalink bind address (from `LAVA_HOST`)
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
    - dependency: "com.github.topi314.sponsorblock:sponsorblock-plugin:3.0.1"
      repository: "https://maven.topi.wtf/releases"
      snapshot: false
    - dependency: "com.github.topi314.lavasearch:lavasearch-plugin:1.0.0"
      repository: "https://maven.topi.wtf/releases"
      snapshot: false
    - dependency: "com.github.topi314.lavalyrics:lavalyrics-plugin:1.1.0"
      repository: "https://maven.topi.wtf/releases"
      snapshot: false
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

1. **`application.yml`** - Base configuration (plugins, Lavalink settings)
2. **`.env`** - Overrides for secrets (passwords, tokens, API keys)
3. **System environment** - Highest priority, overrides `.env`

The TypeScript config (`src/config.ts`) reads environment variables directly via `env()`/`envInt()`/`envBool()` helpers — it does NOT parse `application.yml`.

---

## 🌐 URL Structure

The Lavalink server binds `LAVA_PORT` and the dashboard/gateway binds its own port — from `DASHBOARD_INTERNAL_URL` (default `LAVA_PORT + 1`). Derived URLs are built in `src/config.ts`:

| Type | Source | Example |
| :--- | :--- | :--- |
| Lavalink Internal | `internalUrl` (`protocol://host:port`) | `http://localhost:2333` |
| Lavalink Public | `publicUrl` (`https://domain`) | `https://lavalink.yourdomain.com:2333` |
| Dashboard Internal | `dashboardInternalUrl` (gateway bind, from `DASHBOARD_INTERNAL_URL`) | `http://localhost:2334` |
| Dashboard Public | `dashboardUrl` (from `DASHBOARD_PUBLIC_URL`) | `https://dashboard.yourdomain.com` |

- **Lavalink** keeps its port visible publicly (e.g., `https://domain.com:2333`).
- **Dashboard** runs on its own port (default `LAVA_PORT + 1`, e.g., `http://localhost:2334`) and is served at the gateway root `/`. Map it to its own public URL (e.g. `https://dashboard.yourdomain.com`) via reverse proxy/Cloudflare tunnel.
- When neither dashboard URL is set, `dashboardUrl` falls back to `http://<dashboardHost>:<dashboardPort>`.
- `LAVA_DOMAIN` may include a scheme (`https://...`) — it is stripped automatically.