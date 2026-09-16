# 🔊 Lavalink v4 Standalone Server

[![Server Status](https://img.shields.io/website?url=https%3A%2F%2Flavalink.helix-origin.club%2Fhealth&label=Server&up_message=online&down_message=offline&up_color=brightgreen&down_color=red&style=plastic)](https://lavalink.helix-origin.club/health)
[![Lavalink](https://img.shields.io/badge/Lavalink-v4-purple?style=plastic)](https://github.com/lavalink-devs/Lavalink)
[![Java](https://img.shields.io/badge/Java-21%20LTS-orange?style=plastic)](https://adoptium.net/)
[![Node.js](https://img.shields.io/badge/Node.js-20%2B-green?logo=nodedotjs&logoColor=white&style=plastic)](https://nodejs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-blue?logo=typescript&logoColor=white&style=plastic)](https://www.typescriptlang.org/)
[![Docker](https://img.shields.io/badge/Docker-Alpine-blue?logo=docker&logoColor=white&style=plastic)](https://hub.docker.com/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow?style=plastic)](LICENSE)
[![GitHub Stars](https://img.shields.io/github/stars/HELIX-Origin/Lavalink-Server?style=plastic)](https://github.com/HELIX-Origin/Lavalink-Server)
[![GitHub Issues](https://img.shields.io/github/issues/HELIX-Origin/Lavalink-Server?style=plastic)](https://github.com/HELIX-Origin/Lavalink-Server/issues)

A production-ready, standalone **Lavalink v4** audio server with **ESM TypeScript Management Dashboard** and supervisor. Maintained by [**HELIX Origin**](https://github.com/HELIX-Origin) for hosting dedicated audio nodes for Discord music bots.

📖 **Comprehensive Documentation:** Check out our [**Wiki**](../../wiki/Home) for architecture, VPS setup walk-throughs, configuration references, plugin setup, and troubleshooting.

---

> [!NOTE]
> **Hosted / Self-Hosted Only.** This project is designed to run on hardware you control — a **Dedicated VPS** (Hetzner, DigitalOcean, Linode, OVH), a local server, or your own network — via Docker Compose or native systemd. Cloud PaaS deployment has been removed; shared datacenter IP ranges are aggressively blocked by YouTube's anti-scraping systems.

---

## 🐳 Quick Start (Self-Hosted / VPS Docker)

Deploy on your own server or VPS in seconds:

```bash
# 1. Clone the repository
git clone https://github.com/HELIX-Origin/Lavalink-Server.git
cd Lavalink-Server

# 2. Configure environment
cp .env.example .env
# Edit .env with your credentials (YOUTUBE_CLIENT_ID, etc.)

# 3. Start with Docker Compose
docker compose up -d
```

### 🌐 Recommended Low-Cost Compatible VPS Providers

For high-throughput WebRTC audio transcoding and unblocked YouTube streaming (avoiding datacenter IP bans), we recommend the following low-cost VPS hosts:

| Provider | Starting Price | Key Benefits | Recommended Plan |
| :--- | :--- | :--- | :--- |
| [**Hetzner Cloud**](https://www.hetzner.com/cloud) | ~€3.79 / mo | Exceptional CPU performance for audio transcoding, EU/US locations | CX22 (2 vCPU, 4 GB RAM) |
| [**OVHcloud**](https://www.ovhcloud.com/en/vps/) | ~$4.20 / mo | Unmetered bandwidth, strong anti-DDoS protection | Starter / Value VPS (2-4 GB RAM) |
| [**DigitalOcean**](https://www.digitalocean.com/) | ~$4.00 - $6.00 / mo | 1-Click Docker droplets, low network jitter | Basic Droplet (1-2 GB RAM) |
| [**Linode (Akamai)**](https://www.linode.com/) | ~$5.00 / mo | Reliable network throughput, global datacenters | Nanode 1GB / Shared 2GB |
| [**Vultr**](https://www.vultr.com/) | ~$3.50 - $5.00 / mo | 30+ worldwide datacenters, high frequency compute | Cloud Compute (1-2 GB RAM) |

---

## ⚡ Features & Pre-Configured Plugins

- 📊 **ESM TypeScript Management Dashboard:** Real-time web dashboard at `/dashboard` tracking node health, JVM memory, CPU utilization, active players, uptime, and separate internal/public connection details with live SSE updates.
- ⚡ **Pure Node.js Supervisor (No Shell Scripts):** Robust ESM TypeScript supervisor managing Java process lifecycle, port/domain binding, and graceful signal handling without shell scripts.
- 💾 **SQLite Persistence & ioredis-mock:** Embedded SQLite database for historical metrics and client audit sessions, paired with in-memory `ioredis-mock` for instant pub/sub and state caching.
- 📺 **YouTube Plugin (`youtube-plugin`):** Multi-client support (TV, MUSIC, ANDROID_VR, IOS, WEB, WEBEMBEDDED) with remote cipher decoding and OAuth2 refresh token compatibility.
- 🟢 **Spotify Metadata (`lavasrc-plugin`):** Seamless Spotify track, album, and playlist resolution through YouTube search providers.
- 🟣 **SponsorBlock (`sponsorblock-plugin`):** Automatically skips sponsorships, intros, outros using the community SponsorBlock API.
- 🔍 **LavaSearch (`lavasearch-plugin`):** Enhanced search capabilities across multiple sources.
- 🎵 **LavaLyrics (`lavalyrics-plugin`):** Fetches synchronized lyrics from Genius.com (requires `GENIUS_ACCESS_TOKEN`).
- 🌐 **Advanced Internal/Public Connection Handling:** `LAVA_INTERNAL_URL` + `LAVA_PUBLIC_URL` separate bind-level internals from Cloudflare/tunnel-facing publics. Public ports are **masked** — bots appraise the public URL as-is and simply append the required endpoint.
- 📦 **Importable as a Library/Submodule:** The server exposes a clean API (`startServer`, `configure`, feature toggles) so host projects can embed it via Git submodule with the dashboard automatically disabled.
- 🪶 **Resource Efficient:** Tuned with low memory footprint and JVM GC optimization for smooth playback on 1GB+ VPS nodes.

---

## 🔐 Server Environment Variables

The Lavalink server resolves configuration from internal/public URLs and environment variables.

### Core Lavalink Variables

| Variable | Default | Description |
| :--- | :--- | :--- |
| `LAVA_INTERNAL_URL` | `0.0.0.0:2333` | Internal network URL: host + port the Lavalink Java node binds to (e.g. `0.0.0.0:2333`). The gateway/dashboard port is auto-derived as internal port + 1 |
| `LAVA_PUBLIC_URL` | *(empty)* | Public network URL (e.g. `https://lavalink.yourdomain.com`). The port is **masked** in the URL (behind Cloudflare/tunnel/reverse proxy). Bots append endpoints to this base URL. Defaults to `LAVA_INTERNAL_URL` when empty |
| `LAVA_INTERNAL_WS_URI` | `ws://0.0.0.0:2333/v4/websocket` | Internal WebSocket URI. Host + port + path are parsed as the upstream proxy target |
| `LAVA_PUBLIC_WS_URI` | *(derived)* | Public WebSocket URI (e.g. `ws://lavalink.yourdomain.com/v4/websocket`). Port masked in URL. Defaults to the internal WebSocket URI when no public URL is configured |
| `LAVA_PASS` | `youshallnotpass` | Authentication password for WebSocket/REST API |
| `LAVA_CIPHER_URL` | `https://cipher.kikkia.dev/` | Remote cipher endpoint for YouTube signature deciphering |
| `LAVA_CIPHER_PASSWORD` | *(empty)* | Optional password for self-hosted cipher |
| `REVERSE_PROXY_ENABLED` | `false` | Set to `true` when the public URL is served via a Cloudflare tunnel or reverse proxy that masks the public port. When enabled the dashboard labels the public port as masked |
| `REVERSE_PROXY_TYPE` | `cloudflare` | Masking indicator label: `cloudflare` \| `nginx` \| `caddy` \| `custom` (used only when `REVERSE_PROXY_ENABLED=true`) |

### YouTube OAuth

| Variable | Default | Description |
| :--- | :--- | :--- |
| `YOUTUBE_CLIENT_ID` | **(required)** | YouTube OAuth Client ID (app type: "TVs and Limited Input devices") |
| `YOUTUBE_CLIENT_SECRET` | *(empty)* | YouTube OAuth Client Secret for token exchange |
| `YOUTUBE_REFRESH_TOKEN` | *(empty)* | Pre-authorized refresh token (auto-saved after device flow) |

### Spotify

| Variable | Default | Description |
| :--- | :--- | :--- |
| `SPOTIFY_CLIENT_ID` | *(empty)* | Spotify Developer App Client ID |
| `SPOTIFY_CLIENT_SECRET` | *(empty)* | Spotify Developer App Client Secret |

### Genius (LavaLyrics)

| Variable | Default | Description |
| :--- | :--- | :--- |
| `GENIUS_ACCESS_TOKEN` | *(empty)* | Genius API Access Token for lyrics |

### Database

| Variable | Default | Description |
| :--- | :--- | :--- |
| `DB_PATH` | `./database.db` | SQLite database file path |
| `DB_URI` | `sqlite://./database.db` | SQLite database URI |

### Environment

| Variable | Default | Description |
| :--- | :--- | :--- |
| `NODE_ENV` | `production` | Set to "production" for production mode |

### Dashboard Theme

| Variable | Default | Description |
| :--- | :--- | :--- |
| `DASHBOARD_THEME` | `dark` | Dashboard theme: `glassmorphism` \| `dark` \| `light` \| `cyberpunk` \| `dracula` \| `nord` \| `emerald` |
| `DASHBOARD_COLOR_SCHEME` | `default` | Dashboard accent color: `default` \| `cyan` \| `purple` \| `blue` \| `emerald` \| `rose` \| `amber` \| `indigo` \| `crimson` \| `teal` \| `sunset` |

> ℹ️ **Notice:** The dashboard is served at `/dashboard` on the gateway port (auto-derived as `internal port + 1`). There are no separate dashboard URL variables — the gateway port always follows `LAVA_INTERNAL_URL`.

> ℹ️ **Notice:** Variables like `LAVA_EXTERNAL` or `LAVA_ENABLED` are **client-side bot settings** used by Discord bots (e.g. Master-Bot) to determine connection modes. They are not server variables and are never set on this Lavalink instance.

---

## 🤖 Connecting to Your Discord Bot (e.g. Master-Bot)

Once your Lavalink server is running, configure your Discord bot to use the public URL **as-is** — the bot simply appends the endpoint it needs (e.g. `/v4/websocket`). No internal ports are exposed to your bot.

### Two-network model
- **Public:** `LAVA_PUBLIC_URL` — this is what bots connect to. It is typically fronted by **Cloudflare/Tunnel** or an SSL reverse proxy, so no port is visible.
- **Internal:** `LAVA_INTERNAL_URL` — the bind address + port the Lavalink node and gateway actually listen on. Only used for server-to-server communication, never shared with bots.

### For bots (public topology with masked port):
```env
LAVA_ENABLED=true
LAVA_EXTERNAL=true
LAVA_HOST=lavalink.yourdomain.com
LAVA_PORT=443
LAVA_PASS=youshallnotpass
LAVA_SECURE=true
```

> 💡 **Note on Ports and SSL:**
> - The server's public port is **masked** by design (Cloudflare/tunnel), so bot-side config uses standard `443` (`wss://`) or `80` (`ws://`).
> - The bot appends the endpoint to `LAVA_PUBLIC_URL`: e.g. `ws://lavalink.yourdomain.com/v4/websocket` or `http://lavalink.yourdomain.com/v4/info`.
> - If you expose the raw node port directly (no tunnel), connect via the internal port (e.g. `2333`) with `LAVA_SECURE=false`.

See the [Client Integration Wiki](../../wiki/Client-Integration) for code snippets with Lavalink-Client, Shoukaku, Kazagumo, Poru, and NodeLink.

---

## 💻 Local Docker Usage

To run this server locally via Docker:

```bash
docker compose up -d
```

Or build and run manually:

```bash
docker build -t lavalink-server .
docker run -p 2333:2333 -p 2334:2334 \
  -e LAVA_INTERNAL_URL="0.0.0.0:2333" \
  -e LAVA_PUBLIC_URL="https://lavalink.yourdomain.com" \
  -e LAVA_INTERNAL_WS_URI="ws://0.0.0.0:2333/v4/websocket" \
  -e LAVA_PUBLIC_WS_URI="ws://lavalink.yourdomain.com/v4/websocket" \
  -e LAVA_PASS=youshallnotpass \
  -e YOUTUBE_CLIENT_ID=your_client_id \
  -e YOUTUBE_CLIENT_SECRET=your_client_secret \
  lavalink-server
```

---

## 📦 Importing as a Library / Submodule

The server can be embedded in other projects via **Git submodule** (no NPM publishing required):

```bash
git submodule add https://github.com/HELIX-Origin/Lavalink-Server.git lavalink-server
```

```ts
import { startServer, configure } from 'lavalink-server';

const handle = await startServer({
  overrides: { dbPath: './my-data/database.db' },
  features: {
    dashboard: false,                 // dashboard disabled by default when imported
    supervisor: true,                 // supervise the Lavalink Java process
    youtubeOAuth: true,
  },
});

handle.server.listen(handle.config.gatewayPort, handle.config.gatewayHost);
```

> ⚠️ **You must provide your own `Lavalink.jar`.** The supervisor launches `Lavalink.jar` from the host project's working directory. Download it from the [official Lavalink releases](https://github.com/lavalink-devs/Lavalink/releases) and place it in your project root — starting with a missing JAR throws a descriptive `LavalinkConfigError`.

See the [Importing as a Library wiki page](../../wiki/Importing) for the full API reference.

---

## 📚 Documentation & Wiki

Explore our detailed documentation pages:

- [**Home & Architecture**](../../wiki/Home): High-level overview and supervisor architecture.
- [**Deployment Guide**](../../wiki/Deployment): Detailed guides for VPS, Docker Compose, and systemd.
- [**Configuration Reference**](../../wiki/Configuration): In-depth breakdown of `application.yml` and environment parameters.
- [**Plugins Guide**](../../wiki/Plugins): Configuring YouTube, SponsorBlock, LavaSrc, LavaSearch, LavaLyrics, Skybot.
- [**Client Integration**](../../wiki/Client-Integration): Connecting Master-Bot and popular Discord.js Lavalink wrappers.
- [**Troubleshooting**](../../wiki/Troubleshooting): Diagnosing 401s, YouTube rate-limiting, and WebSocket disconnects.

---

## 📄 License

This template is licensed under the [MIT License](LICENSE). Lavalink is created and maintained by [lavalink-devs](https://github.com/lavalink-devs).