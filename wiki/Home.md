# 🔊 Lavalink v4 Server Documentation

Welcome to the official documentation for the **HELIX-Origin Lavalink v4 Server**.

This project provides a pre-tuned, containerized **Lavalink v4** audio node with an ESM TypeScript dashboard and process supervisor, optimized for dedicated Linux VPS environments and self-hosted Docker installations.

---

> [!NOTE]
> **Hosted / Self-Hosted Only.** This project runs on hardware you control — a dedicated Linux VPS, a local server, or your own network. Cloud PaaS deployment has been removed; shared datacenter IP ranges are aggressively blocked by YouTube's anti-scraping systems.

---

## ⚡ Overview & Purpose

Discord music bots require significant CPU and networking resources to stream and transcode high-bitrate audio packets over WebRTC voice connections. Running an internal audio node inside the same process as your bot quickly leads to **Out-Of-Memory (OOM)** errors, Gateway lag, and audio skipping.

This standalone repository solves that problem by packaging Lavalink v4 in an isolated, lightweight container with an integrated TypeScript supervisor:
- **Official Lavalink JAR:** Download the latest Lavalink v4 JAR from the [official releases](https://github.com/lavalink-devs/Lavalink/releases) (not committed to repo).
- **Interactive Web Dashboard:** Modern glassmorphic status dashboard with real-time player telemetry, node statistics, system logs, and YouTube OAuth controls.
- **Pre-Configured Plugins:** Out-of-the-box support for the official **YouTube Plugin** (with remote deciphering and OAuth), **LavaSrc** (Spotify metadata resolution), **SponsorBlock** (auto-skip sponsorships), **LavaSearch** (enhanced search), **LavaLyrics** (Genius lyrics), and **Skybot** (OCRemix/Mixcloud).
- **Environment Variable Mapping:** All `application.yml` properties dynamically read from environment variables, eliminating the need to rebuild images to change settings.
- **In-Memory & Persistent Caching:** In-memory caching with Redis and persistence in SQLite for authentication tokens and system configurations across restarts.
- **YouTube OAuth Device Flow:** Server waits for OAuth authorization before starting Lavalink, ensuring YouTube playback works on first run.

---

## 🧭 Architecture

```mermaid
flowchart LR
    DiscordUser["Discord Voice Channel"] <-->|"Audio RTP Packets"| Lavalink["Lavalink Server<br/>(Lavalink v4 / Java 21)"]
    
    subgraph Supervisor ["TypeScript Supervisor & Proxy"]
        Proxy["Reverse Proxy & Admin API<br/>(Port 2333)"]
        Dash["Web Dashboard & UI"]
        OAuth["YouTube OAuth Flow"]
        DB[(SQLite + Redis)]
    end

    subgraph Plugins ["Pre-Configured Plugins"]
        YT["YouTube Plugin<br/>(OAuth + Remote Cipher)"]
        LavaSrc["LavaSrc Plugin<br/>(Spotify Resolution)"]
    end

    subgraph BotClient ["Discord Bot Client"]
        MasterBot["Master-Bot / Discord.js<br/>(LAVA_EXTERNAL=true)"]
    end

    Lavalink --- Plugins
    Proxy <-->|"Internal IPC / HTTP"| Lavalink
    Proxy --- Dash
    Proxy --- OAuth
    OAuth --- DB
    MasterBot <-->|"REST API + WebSocket (2333 / 443)"| Proxy
    YT -->|"Stream Audio"| Lavalink
    LavaSrc -->|"Metadata Lookup"| Lavalink
```

---

## 📖 Wiki Table of Contents

- [**Deployment Guide**](Deployment.md): Complete instructions for Dedicated VPS setups, Docker Compose, and Nginx SSL reverse proxying.
- [**Configuration Reference**](Configuration.md): Comprehensive breakdown of `application.yml`, JVM tuning, and environment variable keys.
- [**Plugins Guide**](Plugins.md): Setup instructions for YouTube Remote Cipher, YouTube OAuth2 authorization, and Spotify credentials.
- [**Client Integration**](Client-Integration.md): Code examples connecting Master-Bot, Lavalink-Client, Shoukaku, and Kazagumo.
- [**Troubleshooting & FAQ**](Troubleshooting.md): Solutions for 401 Unauthorized errors, YouTube stream 429 blocks, memory limits, and WebSocket disconnects.
