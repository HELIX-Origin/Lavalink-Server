# 🔊 Lavalink v4 Standalone Server

[![Lavalink](https://img.shields.io/badge/Lavalink-v4.x-purple.svg)](https://github.com/lavalink-devs/Lavalink)
[![Java](https://img.shields.io/badge/Java-21%20LTS-orange.svg)](https://adoptium.net/)
[![Docker](https://img.shields.io/badge/Docker-Alpine-blue.svg)](https://hub.docker.com/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

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

- 📊 **ESM TypeScript Management Dashboard:** Real-time web dashboard at `/` tracking node health, JVM memory, CPU utilization, active players, and uptime.
- ⚡ **Pure Node.js Supervisor (No Shell Scripts):** Robust ESM TypeScript supervisor managing Java process lifecycle, port/domain binding, and graceful signal handling without shell scripts.
- 💾 **SQLite Persistence & ioredis-mock:** Embedded SQLite database for historical metrics and client audit sessions, paired with in-memory `ioredis-mock` for instant pub/sub and state caching.
- 📺 **YouTube Plugin (`youtube-plugin`):** Multi-client support (TV, MUSIC, ANDROID_VR, IOS, WEB, WEBEMBEDDED) with remote cipher decoding and OAuth2 refresh token compatibility.
- 🟢 **Spotify Metadata (`lavasrc-plugin`):** Seamless Spotify track, album, and playlist resolution through YouTube search providers.
- 🟣 **SponsorBlock (`sponsorblock-plugin`):** Automatically skips sponsorships, intros, outros using the community SponsorBlock API.
- 🔍 **LavaSearch (`lavasearch-plugin`):** Enhanced search capabilities across multiple sources.
- 🎵 **LavaLyrics (`lavalyrics-plugin`):** Fetches synchronized lyrics from Genius.com (requires `GENIUS_ACCESS_TOKEN`).
- 🌐 **Internal/Public URL Separation:** Internal URLs (with ports) for service-to-service communication; Public URLs (without ports) for Cloudflare tunnels/reverse proxies.
- 🪶 **Resource Efficient:** Tuned with low memory footprint and JVM GC optimization for smooth playback on 1GB+ VPS nodes.

---

## 🔐 Server Environment Variables

The Lavalink server resolves configuration from internal/public URLs and environment variables.

### Core Lavalink Variables

| Variable | Default | Description |
| :--- | :--- | :--- |
| `LAVA_DOMAIN` | *(empty)* | Public domain/host for both Lavalink and dashboard (e.g. `https://lavalink.yourdomain.com`) |
| `LAVA_HOST` | `127.0.0.1` | Bind address for both Lavalink and dashboard |
| `LAVA_PORT` | `2333` | Lavalink server port; dashboard auto-increments to `LAVA_PORT + 1` (served at `/dashboard`) |
| `LAVA_PASS` | `youshallnotpass` | Authentication password for WebSocket/REST API |
| `LAVA_SECURE` | `false` | Use HTTPS for Lavalink (true/false) |
| `LAVA_CIPHER_URL` | `https://cipher.kikkia.dev/` | Remote cipher endpoint for YouTube signature deciphering |
| `LAVA_CIPHER_PASSWORD` | *(empty)* | Optional password for self-hosted cipher |

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

> ℹ️ **Notice:** Variables like `LAVA_EXTERNAL` or `LAVA_ENABLED` are **client-side bot settings** used by Discord bots (e.g. Master-Bot) to determine connection modes. They are not server variables and are never set on this Lavalink instance.

---

## 🤖 Connecting to Your Discord Bot (e.g. Master-Bot)

Once your Lavalink server is running, configure your Discord bot's `.env` configuration:

### For Dedicated VPS or Local Docker:
```env
LAVA_ENABLED=true
LAVA_EXTERNAL=true
LAVA_HOST=your-vps-ip
LAVA_PORT=2333
LAVA_PASS=youshallnotpass
LAVA_SECURE=false
```

### For VPS with Domain & SSL Reverse Proxy:
```env
LAVA_ENABLED=true
LAVA_EXTERNAL=true
LAVA_HOST=lavalink.yourdomain.com
LAVA_PORT=443
LAVA_PASS=youshallnotpass
LAVA_SECURE=true
```

> 💡 **Note on Ports and SSL:**
> - If connecting directly to your VPS or Docker host, use port **`2333`** with `LAVA_SECURE=false`.
> - If fronted by an Nginx/SSL reverse proxy, connect via port **`443`** with `LAVA_SECURE=true`.

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
docker run -p 2333:2333 \
  -e LAVA_PASS=youshallnotpass \
  -e YOUTUBE_CLIENT_ID=your_client_id \
  -e YOUTUBE_CLIENT_SECRET=your_client_secret \
  lavalink-server
```

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