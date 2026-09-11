# 🔊 Lavalink v4 Standalone Server

[![Lavalink](https://img.shields.io/badge/Lavalink-v4.x-purple.svg)](https://github.com/lavalink-devs/Lavalink)
[![Java](https://img.shields.io/badge/Java-21%20LTS-orange.svg)](https://adoptium.net/)
[![Docker](https://img.shields.io/badge/Docker-Alpine-blue.svg)](https://hub.docker.com/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

A production-ready, standalone **Lavalink v4** audio server container with **ESM TypeScript Management Dashboard** and supervisor. Maintained by [**HELIX Origin**](https://github.com/HELIX-Origin) for hosting dedicated audio nodes for Discord music bots (including [Master-Bot](https://github.com/galnir/Master-Bot)).

📖 **Comprehensive Documentation:** Check out our [**Wiki**](wiki/Home.md) for architecture, VPS setup walk-throughs, configuration references, plugin setup, and troubleshooting.

---

> [!WARNING]
> ### ⚠️ Cloud Hosting Ban Advisory (Render, Railway, Fly.io)
> **Do NOT deploy Lavalink to free shared cloud platforms like Render or Railway.**
> Platforms like Render and Railway aggressively flag and ban user accounts for running continuous audio streaming proxies and YouTube scraping containers.
> 
> **Supported Hosting Options:**
> - **Heroku:** Supported via manual CLI deployment (`heroku.yml` & `Dockerfile`) with dedicated dyno allocation.
> - **Dedicated VPS:** Recommended for production bots (Hetzner, DigitalOcean, Linode, OVHcloud, Oracle Cloud VM).
> - **Self-Hosted:** Run on your local network or server with Docker Compose.

---

## ☁️ Cloud Deployment (Heroku CLI)

Heroku is our **only supported cloud hosting platform**, and it is deployed manually via the **Heroku CLI** so your `.env` configuration and the repo's `application.yml` are used as-is.

### Deploy with Heroku CLI

```bash
# 1. Install the Heroku CLI, log in, and clone this repository
heroku login
git clone https://github.com/HELIX-Origin/Lavalink-Server.git
cd Lavalink-Server

# 2. Create a Heroku app (container stack is detected from heroku.yml)
heroku create your-app-name

# 3. Copy your configuration and apply it as Heroku config vars
cp .env.example .env
heroku config:set LAVA_PASS=MySuperSecretLavaPass123! \
  YOUTUBE_REFRESH_TOKEN=... \
  SPOTIFY_CLIENT_ID=... \
  SPOTIFY_CLIENT_SECRET=...

# 4. Deploy - Heroku builds the Dockerfile and boots the TypeScript supervisor
git push heroku main
```

Heroku runs the server containerized via `heroku.yml` and the `Dockerfile`, reading the committed `application.yml` (placeholders are resolved at runtime from the config vars you set), and automatically routing traffic through its HTTPS/WSS proxy on port **`443`**. Shared cloud PaaS providers (such as Render or Railway) are strictly unsupported due to audio streaming restrictions and account suspension risks. One-click deployment has been removed in favor of the CLI so environment configuration is never lost.

---

## 🐳 Quick Start (Self-Hosted / VPS Docker)

Deploy on your own server or VPS in seconds:

```bash
# 1. Clone the repository
git clone https://github.com/HELIX-Origin/Lavalink-Server.git
cd Lavalink-Server

# 2. Configure environment (optional custom password)
cp .env.example .env

# 3. Start with Docker Compose
docker compose up -d
```

---

## ⚡ Features & Pre-Configured Plugins

- 📊 **ESM TypeScript Management Dashboard:** Real-time web dashboard at `/` tracking node health, JVM memory, CPU utilization, active players, and uptime.
- ⚡ **Pure Node.js Supervisor (No Shell Scripts):** Robust ESM TypeScript supervisor managing Java process lifecycle, port/domain binding, and graceful signal handling without shell scripts.
- 💾 **SQLite Persistence & ioredis-mock:** Embedded SQLite database for historical metrics and client audit sessions, paired with in-memory `ioredis-mock` for instant pub/sub and state caching.
- 🚀 **Pinned Lavalink JAR:** The official Lavalink v4 release JAR (currently **4.2.2**) is committed directly to the repository and copied into the image, so builds are reproducible and never depend on GitHub availability.
- 📺 **YouTube Plugin (`youtube-plugin`):** Multi-client support (TV, MUSIC, ANDROID_VR, IOS, WEB) with remote cipher decoding and OAuth2 refresh token compatibility.
- 🟢 **Spotify Metadata (`lavasrc-plugin`):** Seamless Spotify track, album, and playlist resolution through YouTube search providers.
- ☁️ **Host Port & Domain Resolution:** Dynamically resolves Heroku domains (`$HEROKU_APP_DEFAULT_DOMAIN_NAME`, `$HEROKU_APP_NAME`), custom domains (`$DOMAIN`), and ports (`$PORT`) directly at runtime.
- 🪶 **Resource Efficient:** Tuned with low memory footprint and JVM garbage collection optimization for smooth playback on 1GB VPS nodes or Heroku Dynos.

---

## 🔐 Server Environment Variables

The Lavalink server resolves **Port** (`$PORT`, defaulting to `2333`) and **Domain** (`$HEROKU_APP_DEFAULT_DOMAIN_NAME`, `$DOMAIN`, or `localhost`) directly from the environment.

The following server configuration variables are exposed and supported:

| Variable | Default | Description |
| :--- | :--- | :--- |
| `LAVA_PASS` | `youshallnotpass` | Authentication password clients must provide in the `Authorization` header. |
| `YOUTUBE_REFRESH_TOKEN` | *(empty)* | YouTube OAuth 2.0 refresh token for authenticated streams (auto-captured and persisted after the device flow completes). |
| `YOUTUBE_API_KEY` | **(required)** | YouTube OAuth client identifier used to issue the authorization URL. The server refuses to start without it. |
| `YOUTUBE_CIPHER_URL` | `https://cipher.kikkia.dev/` | Remote cipher endpoint for YouTube signature deciphering. |
| `YOUTUBE_CIPHER_PASSWORD` | *(empty)* | Optional password for self-hosted yt-cipher (leave empty for default public endpoint). |
| `SPOTIFY_CLIENT_ID` | *(empty)* | Spotify Developer Application Client ID. |
| `SPOTIFY_CLIENT_SECRET` | *(empty)* | Spotify Developer Application Client Secret. |
| `KEEP_ALIVE_ENABLED` | `true` | Periodic background pinger to `/health` (every 10m) to keep memory active. |

> ℹ️ **Notice:** Variables like `LAVA_EXTERNAL` or `LAVA_ENABLED` are **client-side bot settings** used by Discord bots (e.g. Master-Bot) to determine connection modes. They are not server variables and are never set on this Lavalink instance.

---

## 🤖 Connecting to Your Discord Bot (e.g. Master-Bot)

Once your Lavalink server is running, configure your Discord bot's `.env` configuration:

### For Heroku Deployment:
```env
LAVA_ENABLED=true
LAVA_EXTERNAL=true
LAVA_HOST=your-app-name.herokuapp.com
LAVA_PORT=443
LAVA_PASS=youshallnotpass
LAVA_SECURE=true
```

### For Dedicated VPS or Local Docker:
```env
LAVA_ENABLED=true
LAVA_EXTERNAL=true
LAVA_HOST=your-vps-ip
LAVA_PORT=2333
LAVA_PASS=youshallnotpass
LAVA_SECURE=false
```

> 💡 **Note on Ports and SSL:**
> - If connecting directly to your VPS or Docker host, use port **`2333`** with `LAVA_SECURE=false`.
> - If deployed to Heroku or fronted by an Nginx/SSL proxy, connect via port **`443`** with `LAVA_SECURE=true`.

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
- [**Home & Architecture**](wiki/Home.md): High-level overview and supervisor architecture.
- [**Deployment Guide**](wiki/Deployment.md): Detailed guides for Heroku, VPS, and Docker Compose.
- [**Configuration Reference**](wiki/Configuration.md): In-depth breakdown of `application.yml` and environment parameters.
- [**Plugins Guide**](wiki/Plugins.md): Configuring YouTube Remote Cipher, OAuth, and Spotify metadata.
- [**Client Integration**](wiki/Client-Integration.md): Connecting Master-Bot and popular Discord.js Lavalink wrappers.
- [**Troubleshooting**](wiki/Troubleshooting.md): Diagnosing 401s, YouTube rate-limiting, and WebSocket disconnects.

---

## 📄 License

This template is licensed under the [MIT License](LICENSE). Lavalink is created and maintained by [lavalink-devs](https://github.com/lavalink-devs).
