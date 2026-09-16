# 🌐 API Reference

This page documents the gateway's HTTP, SSE, and WebSocket endpoints, including request/response formats and authentication requirements.

> 💡 **Routing model.** The gateway listens on `internalPort + 1`. The dashboard + status APIs live under `/dashboard`, the Lavalink REST proxy under `/server` (and at root `/v4/*`), and the WebSocket proxy at `/v4/websocket`.

---

## 1. Pages & Static Content

| Method | Path | Description |
| :--- | :--- | :--- |
| `GET` | `/` | 302 → `/dashboard` (404 JSON when the dashboard is disabled) |
| `GET` | `/dashboard` | Interactive dashboard HTML |
| `GET` | `/dashboard/docs` | Documentation page |
| `GET` | `/dashboard/privacy` | Privacy policy page |
| `GET` | `/dashboard/tos` | Terms of Service page |

---

## 2. Dashboard API

### `GET /dashboard/api/status`
Live node + connection status. Response:

```json
{
  "status": "online",
  "stats": { "players": 3, "playingPlayers": 1, "uptime": 421337, "memory": { "used": 214748364, "free": 300647710, "allocated": 515396075, "reservable": 2147483648 }, "cpu": { "cores": 4, "systemLoad": 0.42, "lavalinkLoad": 0.18 }, "frameStats": null },
  "info": { "version": "4.7.0", "buildTime": 1710000000000, "git": { "commit": "abc123", "branch": "master" }, "jvm": "21.0.2", "lavaplayer": "2.2.0" },
  "connection": {
    "internal": { "host": "0.0.0.0", "port": 2333, "url": "http://0.0.0.0:2333", "websocketUri": "ws://0.0.0.0:2333/v4/websocket" },
    "public": { "host": "lavalink.example.com", "url": "https://lavalink.example.com", "websocketUri": "ws://lavalink.example.com/v4/websocket", "secure": true, "portMasked": true, "password": "youshallnotpass" },
    "gateway": { "host": "0.0.0.0", "port": 2334 }
  },
  "youtubeOAuth": { "state": "authorized", "clientId": "914332996091-...", "verificationUrl": null, "userCode": null }
}
```

- `connection.internal` — bind-level details parsed from `LAVA_INTERNAL_URL` / `LAVA_INTERNAL_WS_URI`.
- `connection.public` — client-facing details from `LAVA_PUBLIC_URL` / `LAVA_PUBLIC_WS_URI`. `portMasked` is always `true` (public port is masked behind Cloudflare/tunnel). `password` is the `LAVA_PASS` for client configuration.
- `connection.gateway` — the gateway/dashboard bind (`internalPort + 1`).
- `youtubeOAuth` — only present when the `youtubeOAuth` feature is enabled.

### `GET /dashboard/api/metrics`
Historical performance metrics (last 30 snapshots, newest first), stored by the supervisor every 60s. Each entry mirrors the `stats` payload shape.

### `GET /dashboard/api/events` (SSE)
Server-Sent Events stream for real-time updates. The browser re-renders the connection cards on each event, with 5s polling as fallback.

```
retry: 5000

event: connection
data: {"internal":{...},"public":{...},"gateway":{...}}
```

Broadcast every 5 seconds until the request is closed. `text/event-stream`/`text/plain` content type; no cache.

---

## 3. YouTube OAuth

| Method | Path | Description |
| :--- | :--- | :--- |
| `GET` | `/dashboard/api/oauth/youtube/status` | Current OAuth state (`idle`/`pending`/`authorized`/`failed`) |
| `POST` | `/dashboard/api/oauth/youtube/start` | Start the Google device flow (requires `YOUTUBE_CLIENT_ID`). Returns the verification URL + user code; 500 on error |
| `POST` | `/dashboard/api/oauth/youtube/manual` | Body: `{ "token": "..." }`. Applies a manually obtained refresh token; 400 when the token is missing |

All OAuth endpoints are unauthenticated (public flow) and only exist when `youtubeOAuthEnabled` is true.

---

## 4. Health Check

### `GET /health`
```json
{
  "status": "online",
  "nodeStatus": "online",
  "connection": {
    "internal": { "url": "http://0.0.0.0:2333" },
    "public": { "url": "https://lavalink.example.com", "secure": true }
  },
  "timestamp": 1710000000000
}
```
- HTTP `200` when the node is `online` or `starting`.
- HTTP `503` when `offline` — use this with load balancers/tunnel health probes.

---

## 5. Lavalink REST Proxy

The gateway proxies Lavalink v4 REST requests, rewriting the `Host` header to the internal node:

| Method | Path | Target |
| :--- | :--- | :--- |
| `GET` | `/server` | `/v4/info` (default when no sub-path) |
| `GET` | `/server/<path>` | `/<path>` |
| `GET` | `/v4/*` | `/v4/*` |
| `GET` | `/version` | `/version` |
| `GET` | `/youtube*` | `/youtube*` |

Errors: HTTP `502` JSON `{ "error": "Lavalink node unreachable" }` when the internal node is down. Query strings and fragments pass through unchanged.

### Standard Lavalink v4 endpoints (proxied)
`/v4/info`, `/v4/loadtracks?identifier=...`, `/v4/decodetrack`, `/v4/decodetracks`, `/v4/routeplanner/*`, `/v4/players`, `/v4/sessions`, `/version`. Authentication uses the `Authorization: <LAVA_PASS>` header.

---

## 6. WebSocket

| Path | Description |
| :--- | :--- |
| `/v4/websocket` | Lavalink v4 client WebSocket proxy |
| `/server/v4/websocket` | Same, via the `/server` prefix |

The gateway upgrades the connection, connects to `LAVA_INTERNAL_WS_URI` as the upstream target, and pipes traffic bidirectionally:
- Headers from the client are forwarded to the node (minus `Host`).
- A keepalive ping is sent every 30s in each direction.
- Client sessions are recorded to SQLite (`client_sessions`) with a session id, client name (from `client-name` or `User-Agent` header), and remote IP (first `X-Forwarded-For`, else socket address).
- Node errors close the client socket with code `1011`; node close closes the client socket.

---

## 7. JSON Error Format

All 4xx/5xx responses from the gateway itself use:

```json
{ "error": "Lavalink node unreachable" }
```

Unknown routes return `404`:

```json
{ "error": "Not found", "path": "/unknown" }
```