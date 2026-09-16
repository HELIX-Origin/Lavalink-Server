# 🧱 Modules Guide

This server is built from small, single-purpose TypeScript modules under `src/`. Each module owns one concern — configuration, process supervision, gateway routing, persistence, caching, OAuth, or UI. This page explains what each module does, how to configure it, and how to keep it healthy.

---

## 📦 Module Map

| Module | Path | Purpose |
| :--- | :--- | :--- |
| Configuration | `src/config.ts` | Parses env vars into a `ServerConfig` object; exports `config`, `buildConfig()`, `configure()`. Also the single point where the four URL/WS vars become derived fields (`internalHost`, `internalPort`, `gatewayPort`, `publicPort`, `secure`, etc.) |
| Library Entry | `src/app.ts` | The public API for embedding the server (`startServer`, `configure`, `ServerHandle`, `ServerFeatures`, `LavalinkConfigError`). Re-exports everything a host project needs |
| Standalone Entry | `src/index.ts` | Boots the server directly: banner, lifecycle wiring, SIGINT/SIGTERM shutdown. Only runs when executed, not when imported |
| Gateway / Proxy | `src/server.ts` | The HTTP + WebSocket gateway: dashboard routes, `/dashboard/api/*`, `/server` Lavalink REST proxy, `/v4/*` client proxy, `/v4/websocket` + `/server/v4/websocket` WS proxy, `/health` |
| Supervisor | `src/supervisor.ts` | Spawns/restarts the Lavalink Java process (with backoff), tails its logs, intercepts the YouTube OAuth refresh-token line, polls `/v4/stats`, snapshots metrics |
| YouTube OAuth | `src/youtube-oauth.ts` | Device-flow authorization, token persistence (env → Redis → SQLite), push of the refresh token to the running node |
| Database | `src/db.ts` | SQLite (node:sqlite) persistence: `metrics_history`, `client_sessions`, `system_events`, `system_settings` |
| Cache | `src/redis.ts` | In-memory cache (ioredis-mock) for status/info/stats/client/log subscriptions and YouTube token state |
| Pages | `src/pages/*` | Server-rendered dashboard UI: layout shell, dashboard, docs, privacy, tos, theme engine (`theme.ts`) and per-theme CSS |

---

## ⚙️ Common Module Configurations

| Module | Relevant env keys | Notes |
| :--- | :--- | :--- |
| Configuration | `LAVA_INTERNAL_URL`, `LAVA_PUBLIC_URL`, `LAVA_INTERNAL_WS_URI`, `LAVA_PUBLIC_WS_URI`, `REVERSE_PROXY_ENABLED`, `REVERSE_PROXY_TYPE`, `LAVA_PASS` | Everything flows through here — see `../../wiki/Configuration` for the full table |
| Supervisor | `NODE_ENV` | Controls production behavior; spawns Java with `-Xmx512M` and the internal host/port via `SERVER_PORT`/`-Dserver.address` |
| YouTube OAuth | `YOUTUBE_CLIENT_ID`, `YOUTUBE_CLIENT_SECRET`, `YOUTUBE_REFRESH_TOKEN` | Disable Node-side handling with the `youtubeOAuth` feature flag when embedding |
| Dashboard | `DASHBOARD_THEME`, `DASHBOARD_COLOR_SCHEME`, `DB_URI`/`DB_PATH` | Theme + metrics history. Dashboard auto-disabled when imported as a library unless `features.dashboard: true` |
| Database / Cache | `DB_URI`, `DB_PATH` | SQLite on disk; cache is in-memory (lost on restart) |

---

## 🔧 Troubleshooting by Module

| Module | Symptom | Fix |
| :--- | :--- | :--- |
| Configuration | Derived ports are wrong | Check the URL vars carry both host+port (`0.0.0.0:2333`); gateway is always `internalPort + 1`; `publicPort` is 443 (https) / 80 (http) unless the public URL carries an explicit port |
| Gateway | Bots get 502 on `/server` | Lavalink is down — check the supervisor logs; proxy targets `internalWsHost:internalWsPort` |
| Supervisor | Crash-loop with restart backoff | Read `[ERR]` stderr lines; the backoff caps at 30s/10 restarts. Ensure `Lavalink.jar` exists at the project root |
| YouTube OAuth | Token not persisted | Check SQLite `system_settings` (`youtube_refresh_token` key) and the env fallback `YOUTUBE_REFRESH_TOKEN` |
| Database | Metrics chart is empty | `metrics_history` fills on the 60s snapshot cycle — give it a couple of minutes after start |
| Cache | Status shows `starting` forever | The stats poller (5s) updates `/v4/stats`; if the node never reports, the supervisor likely failed |

---

## 📐 Best Practices for Maintaining Modules

- Keep imports one-directional: `pages → config`, `server → pages`, `app → everything`. Don't let UI code reach into the supervisor internals.
- Add a new env var by touching `config.ts` first, then `.env.example`, then docs — never skip the docs step (checklist in `.agents/skills/config-management`).
- When adding a route, add it to `src/server.ts`'s single router and to the API docs (`../../wiki/API`) in the same change.
- Never store module state in global variables across modules; use the DB/cache modules for anything that must survive a module restart.

---

## 🐞 Reporting Module Issues

- File issues at [GitHub Issues](https://github.com/HELIX-Origin/Lavalink-Server/issues) with the module name in the title (e.g. `supervisor: ...`).
- Include the Node version, `.env` (redacted), and the last dashboard/console output so the maintainer can reproduce.

---

## ❓ Module FAQ

**Q: Can I run only part of the server?**
Yes — when embedding, `ServerFeatures` lets you disable `dashboard`, `supervisor`, and `youtubeOAuth` independently. See `../../wiki/Importing-as-a-Library`.

**Q: Do modules share state?**
Only through the DB and cache modules. That's deliberate: modules stay independent and restarts stay cheap.

**Q: Where does the dashboard get its data?**
From the gateway's `/dashboard/api/status` and `/dashboard/api/metrics` endpoints, which read the Redis cache and SQLite snapshots — never directly from the Java process.

**Q: Which module binds the network ports?**
`src/server.ts` (gateway) binds the dashboard/gateway port (`internalPort + 1`); the supervisor's Java process binds the node port (`internalPort`). The standalone entry only calls `listen()` after startup wiring has completed.