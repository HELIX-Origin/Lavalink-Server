# 🔊 Lavalink v4 Standalone Cloud Server

[![Lavalink](https://img.shields.io/badge/Lavalink-v4.x-purple.svg)](https://github.com/lavalink-devs/Lavalink)
[![Java](https://img.shields.io/badge/Java-21%20LTS-orange.svg)](https://adoptium.net/)
[![Docker](https://img.shields.io/badge/Docker-Alpine-blue.svg)](https://hub.docker.com/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

A production-ready, standalone **Lavalink v4** audio server container with **one-click cloud deployment** for **Render**, **Railway**, **Heroku**, and **Fly.io**. Built specifically for hosting an external audio node for Discord music bots such as [Master-Bot](https://github.com/galnir/Master-Bot).

---

## 🚀 One-Click Cloud Deployment (100% Free Tiers)

Deploy your external Lavalink v4 server instantly with zero server management:

| Platform | Free Tier | Deploy Button |
| :--- | :---: | :--- |
| **Render** | ✅ 100% Free | [![Deploy to Render](https://render.com/images/deploy-to-render-button.svg)](https://render.com/deploy?repo=https://github.com/HELIX-Origin/Lavalink-Server) |
| **Railway** | ✅ Free Starter | [![Deploy on Railway](https://railway.com/button.svg)](https://railway.com/new/template?template=https%3A%2F%2Fgithub.com%2FHELIX-Origin%2FLavalink-Server) |
| **Heroku** | ✅ Eco Dyno | [![Deploy to Heroku](https://www.herokucdn.com/deploy/button.svg)](https://heroku.com/deploy?template=https://github.com/HELIX-Origin/Lavalink-Server) |
| **Fly.io** | ✅ Free MicroVM | [![Deploy to Fly.io](https://img.shields.io/badge/Deploy%20to-Fly.io-24185b?style=for-the-badge&logo=flydotio&logoColor=white)](#flyio-deployment) |

---

## ⚡ Features & Pre-Configured Plugins

- 🚀 **Always Up-To-Date:** The Docker build pulls the latest official Lavalink v4 release JAR directly from [lavalink-devs/Lavalink](https://github.com/lavalink-devs/Lavalink/releases).
- 📺 **YouTube Plugin (`youtube-plugin`):** Multi-client support (TV, MUSIC, ANDROID_VR, IOS, WEB) with remote cipher decoding and OAuth2 refresh token compatibility.
- 🟢 **Spotify Metadata (`lavasrc-plugin`):** Seamless Spotify track, album, and playlist resolution through YouTube search providers.
- ☁️ **Dynamic Port Binding:** Automatically binds to cloud provider-injected `PORT` (Render, Heroku, Railway) or falls back to standard `LAVA_PORT` (`2333`).
- 🪶 **Ultra Lightweight:** Runs on `eclipse-temurin:21-jre-alpine` with a 512 MB memory ceiling tuned for free-tier cloud containers.

---

## 🔐 Environment Variables & Configuration

All keys from `application.yml` are wired directly to environment variables:

| Variable | Default | Description |
| :--- | :--- | :--- |
| `PORT` / `LAVA_PORT` | `2333` | Web and WebSocket port (automatically assigned on Render/Heroku). |
| `LAVA_PASS` | `youshallnotpass` | Authentication password for your Discord bot. |
| `YOUTUBE_CIPHER_URL` | `https://cipher.kikkia.dev/` | Remote cipher decoding endpoint for YouTube streams. |
| `YOUTUBE_CIPHER_PASSWORD` | *(empty)* | Optional password for the remote cipher server. |
| `YOUTUBE_REFRESH_TOKEN` | *(empty)* | Optional YouTube OAuth2 refresh token to bypass rate limits. |
| `YOUTUBE_SKIP_INIT` | `false` | Skip OAuth initialization on startup. |
| `SPOTIFY_CLIENT_ID` | *(empty)* | Spotify Developer Application Client ID. |
| `SPOTIFY_CLIENT_SECRET` | *(empty)* | Spotify Developer Application Client Secret. |

---

## 🤖 Connecting to Master-Bot

Once your Lavalink server is deployed, copy its public domain and configure your bot's environment variables:

```env
LAVA_ENABLED=true
LAVA_EXTERNAL=true
LAVA_HOST=your-lavalink-server.onrender.com
LAVA_PORT=443
LAVA_PASS=youshallnotpass
LAVA_SECURE=true
```

> 💡 **Note on Ports and SSL:**
> When deployed to cloud platforms (Render, Railway, Heroku), your server is automatically fronted by an HTTPS/WSS proxy on port **`443`**. Therefore, set `LAVA_PORT=443` and `LAVA_SECURE=true` in your Discord bot.

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

## ✈️ Fly.io Deployment

```bash
fly launch --no-deploy
fly deploy
```

---

## 📄 License

This template is licensed under the [MIT License](LICENSE). Lavalink is created and maintained by [lavalink-devs](https://github.com/lavalink-devs).
