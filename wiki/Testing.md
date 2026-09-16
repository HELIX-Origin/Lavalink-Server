# 🧪 Testing & Debugging

Guidance for writing, running, and troubleshooting the server's code. There is currently **no automated test suite** — verification is type-check-driven plus manual smoke tests.

---

## 1. Available Gates

| Command | What it checks |
| :--- | :--- |
| `pnpm typecheck` | Strict TS compile (`tsc --noEmit`) — catches type/import/ESM errors |
| `pnpm build` | Emits `dist/` — catches path/export resolution issues |
| `pnpm dev` | Runs the server with `tsx` for manual testing |

Run both gates after every change:
```bash
pnpm typecheck && pnpm build
```

---

## 2. Manual Smoke Tests

### Standalone server
1. Configure `.env` (needs `YOUTUBE_CLIENT_ID` + `Lavalink.jar`).
2. `pnpm dev` (or `pnpm start` after `pnpm build`).
3. Expect the console banner, then the OAuth device-flow prompt (unless a refresh token is saved), then `Lavalink is ready …`.
4. Open the dashboard: `http://localhost:2334/dashboard`.
5. Check:
   - Status badge flips `starting → online`; stat cards populate.
   - **INTERNAL** card shows the bind host/port/URL/WS URI from `LAVA_INTERNAL_URL`.
   - **PUBLIC** card shows the public URL/WS URI, the `Port masked — Cloudflare` hint, and masked password toggle.
   - Cards update without refresh (SSE) — open two tabs / stop and restart the container to see the change push.
6. REST proxy: `curl http://localhost:2334/v4/info` with `Authorization` header → Lavalink info JSON.
7. WebSocket: connect a client to `ws://localhost:2334/v4/websocket` → hello payload, session recorded in SQLite.

### Embedded (library) mode
1. `git submodule add` the repo into a scratch project + `pnpm build`.
2. Call `startServer({ features: { dashboard: false } })`.
3. Confirm: no `/dashboard` HTML route (either 404 JSON or only status APIs), config overrides applied, `stop()` shuts the gateway + Java process down.
4. Omitting `YOUTUBE_CLIENT_ID` or `Lavalink.jar` must throw `LavalinkConfigError` (not `process.exit`).

---

## 3. Debugging Common Failure Modes

| Symptom | Likely cause | How to check |
| :--- | :--- | :--- |
| `java: command not found` | Java 21 not installed / not on PATH | `java -version` |
| `Lavalink.jar` ENOENT / `Unable to access jarfile` | JAR missing from CWD | `dir Lavalink.jar` |
| Node never becomes `online` | Wrong `SERVER_PORT`/bind, plugin failure | Watch supervisor stdout; `GET /v4/info` |
| `401 Unauthorized` on `/v4/*` | Wrong `Authorization` header | Compare with `config.pass` |
| OAuth never completes | Google test-user not authorized, bad secret | Check OAuth logs + dashboard status |
| Supervisors restarts in backoff | Node crashed at boot | `journalctl -u lavalink-server` / `docker compose logs` |
| `/dashboard` 404 | `dashboardEnabled` false (embedded) | Add `features: { dashboard: true }` |
| SSE not updating | Browser fallback polling active (SSE blocked) | Open network tab; `/dashboard/api/events` should be a streaming request |

---

## 4. Instrumentation & State

- **Redis (in-memory):** keys `lavalink:status`, `lavalink:info`, `lavalink:stats`, recent logs. Inspect via `getCachedStatus()` / `getCachedStats()`.
- **SQLite:** `metrics_history` (60s snapshots), `client_sessions` (WS sessions), `system_events`, `system_settings` (OAuth tokens). Query with:
  ```bash
  sqlite3 database.db "SELECT * FROM system_events ORDER BY id DESC LIMIT 20;"
  ```
- **Logs:** process stdout is streamed to the console (`pnpm dev`) and the Java node logs are tagged; system events are persisted.

---

## 5. When to Update Tests/Docs

- Add a new route or feature → update `wiki/API.md` + this page's smoke checklist.
- Change env parsing → update `wiki/Configuration.md`, `.env.example`, `.agents/rules.md`.
- Fix a bug → consider whether the smoke checklist should assert the regression explicitly.