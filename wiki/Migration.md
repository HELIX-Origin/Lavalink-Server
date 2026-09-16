# 🔄 Migration Guide

Instructions for upgrading from previous versions and handling breaking changes.

---

## 1. Migrating to the URL-Based Connection Scheme (v2-style)

The old configuration used separate fields (`LAVA_DOMAIN`, `LAVA_HOST`, `LAVA_PORT`, `LAVA_SECURE`, `DASHBOARD_PUBLIC_URL`, `DASHBOARD_INTERNAL_URL`). These are **removed — the server will not start correctly with them** and they are ignored by `src/config.ts`.

### Old → New mapping

| Old variable | Replaced by | Example |
| :--- | :--- | :--- |
| `LAVA_HOST` + `LAVA_PORT` | `LAVA_INTERNAL_URL` (host:port together) | `0.0.0.0:2333` |
| `LAVA_DOMAIN` + `LAVA_SECURE` | `LAVA_PUBLIC_URL` (full scheme URL, port masked) | `https://lavalink.yourdomain.com` |
| *(derived)* | `LAVA_INTERNAL_WS_URI` (upstream WS target) | `ws://0.0.0.0:2333/v4/websocket` |
| *(derived)* | `LAVA_PUBLIC_WS_URI` (public WS shown to bots) | `ws://lavalink.yourdomain.com/v4/websocket` |
| `DASHBOARD_INTERNAL_URL` (`http://host:2334`) | auto-derived gateway port = internal port + 1 | `0.0.0.0:2334` |
| `DASHBOARD_PUBLIC_URL` | removed — dashboard served at `/dashboard` on the same gateway | `https://lavalink.yourdomain.com/dashboard` |

### Step-by-step
1. Open `.env` and remove the six old keys.
2. Add the four new keys using your existing values:
   ```env
   LAVA_INTERNAL_URL="0.0.0.0:2333"                    # was LAVA_HOST:LAVA_PORT
   LAVA_PUBLIC_URL="https://lavalink.yourdomain.com"   # was LAVA_DOMAIN (http/https → secure)
   LAVA_INTERNAL_WS_URI="ws://0.0.0.0:2333/v4/websocket"
   LAVA_PUBLIC_WS_URI="ws://lavalink.yourdomain.com/v4/websocket"
   ```
3. Update Docker/`docker-compose.yml` port mapping if you overrode ports (default `${LAVA_INTERNAL_PORT:-2333}:2333` and `${LAVA_GATEWAY_PORT:-2334}:2334`).
4. Bots: point at the **public URL** with no port (or `443`/`80` at the tunnel edge) — see [Client Integration](Client-Integration). Previously the node port was visible publicly; now it is masked.
5. Dashboard moved from gateway root `/` to `/dashboard`. Any shortcuts/bookmarks for `/` 302-redirect automatically.

---

## 2. Format / Environment Changes

- **`application.yml`**: `server.port` placeholder is now `${SERVER_PORT:2333}` — the supervisor sets `SERVER_PORT` from `LAVA_INTERNAL_URL`. If you customized the Java port directly, move that into `LAVA_INTERNAL_URL` instead.
- **Package entry**: published entrypoint is `dist/app.js` (library) and `dist/index.js` (standalone). If you imported the server directly from `dist/index.js`, switch to `dist/app.js` and use `startServer()`.
- **Dashboard routing**: static pages moved `/docs`, `/privacy`, `/tos` → `/dashboard/docs`, `/dashboard/privacy`, `/dashboard/tos`.

---

## 3. Removed Features

- Keep-alive service (unnecessary on a VPS)
- Admin/Owner console + owner authentication
- `CLIENT_SECRET.ts`
- Lavalink.jar committed to the repo (downloaded at build time; **auto-provided in releases**)
- OAuth env keys `YOUTUBE_API_KEY` / `YOUTUBE_API_SECRET` — OAuth credentials only (`YOUTUBE_CLIENT_ID` / `YOUTUBE_CLIENT_SECRET`)

---

## 4. Rolling Back

Releases are git tags (see [Versioning](Versioning)). To roll back:
```bash
git checkout <previous-tag>
pnpm build
# restore your previous .env from version control / backup
```
Database compatibility: schema changes are additive; an older binary + a newer DB is generally safe, but always back up `database.db` before upgrading.

---

## 5. Backup & Restore

```bash
# Backup
sqlite3 database.db ".backup 'database.backup.db'"

# Restore
sqlite3 database.db ".restore 'database.backup.db'"
```
Back up before every major upgrade; `YOUTUBE_REFRESH_TOKEN` lives in `system_settings` — losing the DB means re-running the OAuth device flow.