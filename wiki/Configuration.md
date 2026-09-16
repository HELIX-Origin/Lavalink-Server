# ⚙️ Configuration Reference

This page documents the complete configuration schema used in `application.yml` and its corresponding environment variables.

---

## 🔐 Environment Variables vs Client Settings

It is critical to distinguish between **Lavalink Server Variables** and **Discord Bot Client Variables**:

| Variable Type | Examples | Where It Is Configured | Purpose |
| :--- | :--- | :--- | :--- |
| **Server Variable** | `LAVA_PASS`, `YOUTUBE_CLIENT_ID`, `SPOTIFY_CLIENT_ID`, `LAVA_INTERNAL_URL`, `LAVA_PUBLIC_URL` | Lavalink Server (`application.yml`, `.env`, `docker-compose.yml`) | Tells Lavalink what port to bind to, what password to demand, and which external APIs to query. |
| **Bot Client Variable** | `LAVA_ENABLED`, `LAVA_EXTERNAL`, `LAVA_HOST`, `LAVA_SECURE` | Discord Bot (`.env` on the bot host) | Tells your Discord bot how to reach this external Lavalink server. **Never configured on the Lavalink server.** |

---

## 📋 Comprehensive Server Variables

The Lavalink server resolves all configuration from environment variables. The internal/public URLs and WebSocket URIs are parsed and derived in `src/config.ts`.

### Core Connection Variables

| Variable | Default Value | Description |
| :--- | :--- | :--- |
| `LAVA_INTERNAL_URL` | `0.0.0.0:2333` | Internal network URL: host + port the Lavalink Java node binds to. The gateway/dashboard port is auto-derived as internal port + 1 |
| `LAVA_PUBLIC_URL` | *(empty)* | Public network URL (e.g. `https://lavalink.yourdomain.com`). Port is **masked** in the URL (behind Cloudflare/tunnel/reverse proxy). Bots append endpoints to this base URL. Defaults to `LAVA_INTERNAL_URL` when empty |
| `LAVA_INTERNAL_WS_URI` | `ws://0.0.0.0:2333/v4/websocket` | Internal WebSocket URI. Host + port + path are parsed as the upstream proxy target |
| `LAVA_PUBLIC_WS_URI` | *(derived)* | Public WebSocket URI (e.g. `ws://lavalink.yourdomain.com/v4/websocket`). Port masked in URL. Defaults to the internal WS URI when no public URL is configured; otherwise derived from the public URL host |
| `LAVA_PASS` | `youshallnotpass` | Authentication password for WebSocket/REST API |
| `LAVA_CIPHER_URL` | `https://cipher.kikkia.dev/` | Remote cipher endpoint for YouTube signature deciphering |
| `LAVA_CIPHER_PASSWORD` | *(empty)* | Optional password for self-hosted cipher |
| `REVERSE_PROXY_ENABLED` | `false` | Set to `true` when the public URL is served via a Cloudflare tunnel or reverse proxy that masks the public port. When enabled the dashboard labels the public port as masked |
| `REVERSE_PROXY_TYPE` | `cloudflare` | Masking indicator label: `cloudflare` \| `nginx` \| `caddy` \| `custom` (used only when `REVERSE_PROXY_ENABLED=true`) |

> ⚠️ **Removed variables:** `LAVA_DOMAIN`, `LAVA_HOST`, `LAVA_PORT`, `LAVA_SECURE`, `DASHBOARD_PUBLIC_URL`, `DASHBOARD_INTERNAL_URL` no longer exist. Host + port are carried together in `LAVA_INTERNAL_URL` / `LAVA_PUBLIC_URL`.

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

### Environment

| Variable | Default Value | Description |
| :--- | :--- | :--- |
| `NODE_ENV` | `production` | Set to "production" for production mode |

---

## 📄 `application.yml` Core Sections

The `application.yml` file is the **single source of truth** for Lavalink Java server configuration. The TypeScript gateway derives ports/addresses from `LAVA_INTERNAL_URL` and passes them to the Java process at spawn time.

### 1. Server & Networking
```yaml
server:
  port: ${SERVER_PORT:2333}
  address: 0.0.0.0
  undertow:
    buffer-size: 1024
    direct-buffers: true
    threads:
      io: 4
      worker: 32
```
- **`port`**: Lavalink Java server port — the supervisor spawns the JVM with `SERVER_PORT` set to the internal port parsed from `LAVA_INTERNAL_URL`
- **`address`**: Lavalink bind address (`0.0.0.0`; the supervisor passes `-Dserver.address`)
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
      http: true
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
    allowSearch: true
    allowDirectVideoIds: true
    allowDirectPlaylistIds: true
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

## 🌐 URL Structure & Routing

The server uses a **two-network model**:

| Network | Source Env Var | Example | Visibility |
| :--- | :--- | :--- | :--- |
| Lavalink Internal (bind) | `LAVA_INTERNAL_URL` | `0.0.0.0:2333` | Only reachable on the host/network |
| Lavalink Public | `LAVA_PUBLIC_URL` | `https://lavalink.yourdomain.com` | Exposed to bots via Cloudflare/tunnel. Port is **masked** |
| Gateway / Dashboard | *derived* `internalPort + 1` | `0.0.0.0:2334` | Serves `/dashboard` and the `/server` Lavalink proxy |

### How bots reach the server
- Bots use `LAVA_PUBLIC_URL` **as-is** and simply append the endpoint they need, e.g.:
  - WebSocket: `ws://lavalink.yourdomain.com/v4/websocket`
  - REST: `http://lavalink.yourdomain.com/v4/info`
- The public port is masked by design; clients never need to know the real bind port.

### Routing table
| Route | Purpose |
| :--- | :--- |
| `/` | 302 → `/dashboard` |
| `/dashboard` | Web dashboard |
| `/dashboard/docs`, `/dashboard/privacy`, `/dashboard/tos` | Static pages |
| `/dashboard/api/status` | Status + separated internal/public connection details |
| `/dashboard/api/metrics` | Historical metrics |
| `/dashboard/api/events` | Server-Sent Events (real-time connection updates) |
| `/dashboard/api/oauth/youtube/*` | YouTube OAuth device flow |
| `/health` | Health check (200 when online/starting, else 503) |
| `/server`, `/server/*` | Lavalink REST proxy (path after `/server` passed through) |
| `/v4/*`, `/version`, `/youtube*` | Direct Lavalink REST proxy |
| `/v4/websocket`, `/server/v4/websocket` | WebSocket proxy to Lavalink |

- When the server is imported as a library, the dashboard routes are disabled; the host project supplies its own UI and can call `/dashboard/api/status`, `/dashboard/api/events`, etc. directly, or disable them entirely via `features.dashboard`.