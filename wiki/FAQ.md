# ❓ Frequently Asked Questions

Quick answers to common user concerns.

---

## Connection & Configuration

### What are `LAVA_INTERNAL_URL` and `LAVA_PUBLIC_URL`?
The server is split into two networks:
- **Internal** (`0.0.0.0:2333`) — what the Java node binds to and what the gateway proxies to. Never shared with bots.
- **Public** (`https://lavalink.yourdomain.com`) — what bots connect to. The port is **masked**; bots append the endpoint (`/v4/websocket`, `/v4/info`).

If `LAVA_PUBLIC_URL` is empty, it defaults to the internal URL (and the public WebSocket mirrors the internal WebSocket).

### Do bots connect to port 2333?
No — bots connect to your **public URL**. Behind Cloudflare/Tunnel the TLS edge terminates on `443`; the real node port stays hidden. If you expose the raw node directly (no tunnel), bots can use that IP + port directly with `LAVA_SECURE=false`.

### Where is the dashboard?
`https://your-domain/dashboard` (or `http://<host>:2334/dashboard` locally). The gateway port is always `internal port + 1` — there is no separate dashboard URL variable anymore.

### What replaced the old variables?
`LAVA_DOMAIN`, `LAVA_HOST`, `LAVA_PORT`, `LAVA_SECURE`, `DASHBOARD_PUBLIC_URL`, `DASHBOARD_INTERNAL_URL` are gone. See the [Migration guide](Migration) for a mapping table.

### Why is my bot getting 401?
`LAVA_PASS` on the bot must exactly match the server's `LAVA_PASS` (the `Authorization` header). No trailing spaces. See [Troubleshooting](Troubleshooting).

---

## YouTube & Playback

### Why does playback 429 / show "Sign in to confirm you're not a bot"?
Datacenter IPs are blocked/rate-limited by YouTube. Enable the OAuth device flow + remote cipher (`LAVA_CIPHER_URL`), used with the web client set. Details in [Troubleshooting](Troubleshooting).

### Do I need a YouTube API key?
No. This server uses **OAuth** credentials: `YOUTUBE_CLIENT_ID` + `YOUTUBE_CLIENT_SECRET` (TV & Limited Input app type). API keys are a separate, unsupported mechanism.

### Why does the server wait on first start?
When no `YOUTUBE_REFRESH_TOKEN` is present, the server runs the OAuth device flow (prints a code, waits for authorization) before starting the Java node. Pre-seed the refresh token to skip it.

---

## Importing / Embedding

### Can I use this as an NPM package?
There is no NPM package (the account can't publish). Add the repo as a **Git submodule** and import from `lavalink-server/dist/app.js`. See [Importing](Importing).

### Do I need my own `Lavalink.jar`?
Yes. When embedded (or standalone), the supervisor runs `Lavalink.jar` from the working directory. Download it from the [official releases](https://github.com/lavalink-devs/Lavalink/releases). Missing it throws a clear error.

### Is the dashboard hidden when imported?
By default, yes — `dashboard` defaults to `false` when using `startServer()`. The status/SSE/metrics APIs still work if you route them from your own UI.

---

## Themes & Plugins

### How do I change the dashboard look?
`DASHBOARD_THEME` (dark, light, cyberpunk, glassmorphism, dracula, nord, emerald) + `DASHBOARD_COLOR_SCHEME` (10 accent colors). See [Themes](Themes).

### How do I add Spotify / lyrics / SponsorBlock?
Already preconfigured in `application.yml` — just set `SPOTIFY_CLIENT_ID`, `SPOTIFY_CLIENT_SECRET`, and `GENIUS_ACCESS_TOKEN`. See [Plugins](Plugins).

### Can I write my own plugin/theme?
Yes. See [Themes](Themes) and [Plugin Development](Plugin-Development) for step-by-step guides and FAQ sections.

---

## Operations

### How do I update?
```bash
git pull
pnpm install && pnpm build
docker compose build --pull && docker compose up -d   # Docker path
sudo systemctl restart lavalink-server               # systemd path
```
Back up `database.db` first (it holds your OAuth refresh token + metrics).

### How do I restart just the Java node?
Kill the Java process — the supervisor restarts it with backoff (up to 10 attempts). Or restart the whole service.

### Where is health chechecked?
`GET /health` returns 200 when online/starting and 503 when offline/restarting — point your tunnel/load balancer probe there.

Still stuck? See [Troubleshooting](Troubleshooting) or open an [issue](https://github.com/HELIX-Origin/Lavalink-Server/issues).