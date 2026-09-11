# 🔊 Lavalink v4 Standalone Cloud Server

[![Lavalink](https://img.shields.io/badge/Lavalink-v4.x-purple.svg)](https://github.com/lavalink-devs/Lavalink)
[![Java](https://img.shields.io/badge/Java-21%20LTS-orange.svg)](https://adoptium.net/)
[![Docker](https://img.shields.io/badge/Docker-Alpine-blue.svg)](https://hub.docker.com/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

A production-ready, standalone **Lavalink v4** audio server container with **ESM TypeScript Management Dashboard** and supervisor. Maintained by [**HELIX Origin**](https://github.com/HELIX-Origin) for hosting dedicated audio nodes for Discord music bots (including [Master-Bot](https://github.com/galnir/Master-Bot)).

📖 **Comprehensive Documentation:** Check out our [**Wiki**](wiki/Home.md) for architecture, VPS setup walk-throughs, configuration references, plugin setup, and troubleshooting.

---

> [!WARNING]
> ### ⚠️ Cloud Hosting Ban Advisory (Render, Railway, Heroku)
> **Do NOT deploy Lavalink to free shared cloud platforms (such as Render, Heroku, or Railway).**
> Most serverless and free-tier cloud PaaS providers strictly prohibit audio streaming proxies, Lavalink instances, and scraping YouTube streams. Hosting Lavalink on these platforms will result in an immediate **account ban** or service suspension.
>
> **Recommended Hosting:** Deploy on a **Dedicated VPS** (e.g. Hetzner, DigitalOcean, Linode, Oracle Cloud Free Tier Compute, OVHcloud) or **Self-Host locally via Docker**.

---

## 🐳 Quick Start (Self-Hosted / VPS Docker)

Deploy your external Lavalink v4 server on your own server or VPS in seconds:

```bash
# 1. Clone the repository
git clone https://github.com/HELIX-Origin/Lavalink-Server.git
cd Lavalink-Server

# 2. Configure environment (optional custom password)
cp .env.example .env

# 3. Start with Docker Compose
docker compose up -d
```

## ⚡ Features & Pre-Configured Plugins

- 📊 **ESM TypeScript Management Dashboard:** Real-time web dashboard at `/` tracking node health, JVM memory, CPU utilization, active players, and uptime.
- ⚡ **Pure Node.js Supervisor (No Shell Scripts):** Robust ESM TypeScript supervisor managing Java process lifecycle, port/domain binding, and graceful signal handling without shell scripts.
- 💾 **SQLite Persistence & ioredis-mock:** Embedded SQLite database for historical metrics and client audit sessions, paired with in-memory `ioredis-mock` for instant pub/sub and state caching.
- 🚀 **Always Up-To-Date:** The Docker build pulls the latest official Lavalink v4 release JAR directly from [lavalink-devs/Lavalink](https://github.com/lavalink-devs/Lavalink/releases).
- 📺 **YouTube Plugin (`youtube-plugin`):** Multi-client support (TV, MUSIC, ANDROID_VR, IOS, WEB) with remote cipher decoding and OAuth2 refresh token compatibility.
- 🟢 **Spotify Metadata (`lavasrc-plugin`):** Seamless Spotify track, album, and playlist resolution through YouTube search providers.
- ☁️ **Host Port & Domain Resolution:** Dynamically resolves the host's public domain (`$DOMAIN`, `$HOST`, etc.) and port (`$PORT`) directly at runtime.
- 🪶 **Resource Efficient:** Tuned with low memory footprint and JVM garbage collection optimization for smooth playback on 1GB VPS nodes.

---

## 🔐 Server Environment Variables

The Lavalink server resolves **Port** (`$PORT`, defaulting to `2333`) and **Domain** (`$DOMAIN`, `$HOST`, or `localhost`) directly from the system environment.

The following server configuration variables are exposed and supported:

| Variable | Default | Description |
| :--- | :--- | :--- |
| `LAVA_PASS` | `youshallnotpass` | Authentication password clients must provide in the `Authorization` header. |
| `YOUTUBE_REFRESH_TOKEN` | *(empty)* | YouTube OAuth 2.0 refresh token for authenticated streams. |
| `YOUTUBE_API_KEY` | *(empty)* | Optional YouTube Data API v3 key. |
| `YOUTUBE_CIPHER_URL` | `https://cipher.kikkia.dev/` | Remote cipher endpoint for YouTube signature deciphering. |
| `YOUTUBE_CIPHER_PASSWORD` | *(empty)* | Optional password for self-hosted yt-cipher (leave empty for default public endpoint). |
| `SPOTIFY_CLIENT_ID` | *(empty)* | Spotify Developer Application Client ID. |
| `SPOTIFY_CLIENT_SECRET` | *(empty)* | Spotify Developer Application Client Secret. |
| `KEEP_ALIVE_ENABLED` | `true` | Periodic background pinger to `/health` (every 10m) to keep memory active. |

> ℹ️ **Notice:** Variables like `LAVA_EXTERNAL` or `LAVA_ENABLED` are **client-side bot settings** used by Discord bots (e.g. Master-Bot) to determine connection modes. They are not server variables and are never set on this Lavalink instance.

---

## 🤖 Connecting to Your Discord Bot (e.g. Master-Bot)

Once your Lavalink server is running, configure your Discord bot's `.env` configuration:

```env
# Master-Bot client configuration:
LAVA_ENABLED=true
LAVA_EXTERNAL=true
LAVA_HOST=your-vps-ip-or-domain.com
LAVA_PORT=2333
LAVA_PASS=youshallnotpass
LAVA_SECURE=false
```

> 💡 **Note on Ports and SSL:**
> - If connecting directly to your VPS or Docker host, use port **`2333`** with `LAVA_SECURE=false`.
> - If you configure an Nginx or Caddy reverse proxy with an SSL certificate (e.g. `lavalink.yourdomain.com`), set `LAVA_PORT=443` and `LAVA_SECURE=true`.

See the [Client Integration Wiki](wiki/Client-Integration.md) for code snippets with Lavalink-Client, Shoukaku, Kazagumo, and Poru.

---

## 💻 Local Docker Usage

To run this server locally via Docker:

```bash
docker compose up -d
```

Or build and run manually:

```bash
docker build -t lavalink-server .
docker run -p 2333:2333 -e LAVA_PASS=youshallnotpass lavalink-server
```

---

## 📚 Documentation & Wiki

Explore our detailed documentation pages:
- [**Home & Architecture**](wiki/Home.md): High-level overview and plugin topologies.
- [**Deployment Guide**](wiki/Deployment.md): Step-by-step guides for Render, Railway, Heroku, Fly.io, and VPS.
- [**Configuration Reference**](wiki/Configuration.md): In-depth breakdown of `application.yml` parameters.
- [**Plugins Guide**](wiki/Plugins.md): Configuring YouTube Remote Cipher, OAuth, and Spotify metadata.
- [**Client Integration**](wiki/Client-Integration.md): Connecting Master-Bot and popular Discord.js Lavalink wrappers.
- [**Troubleshooting**](wiki/Troubleshooting.md): Diagnosing 401s, YouTube rate-limiting, and WebSocket disconnects.

---

## 📄 License

This template is licensed under the [MIT License](LICENSE). Lavalink is created and maintained by [lavalink-devs](https://github.com/lavalink-devs).
