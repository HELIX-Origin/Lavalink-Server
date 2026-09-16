# 🚀 Performance Optimization

How to monitor, analyze, and tune the server in different environments.

---

## 1. KPIs to Watch

| Metric | Source | Healthy target |
| :--- | :--- | :--- |
| Player count | `/v4/stats` (`stats.players`) | Depends on plan; each active player ≈ 150–300 players-max on a 2 vCPU node |
| Playing players | `/v4/stats` (`stats.playingPlayers`) | — |
| CPU (Lavalink) | `stats.cpu.lavalinkLoad` | < 0.7 sustained |
| Memory | `stats.memory` (used/allocated/reservable) | JVM heap `-Xmx512M`; watch used < allocated |
| Uptime / restarts | dashboard stat card + `system_events` | Few restarts; supervisor max 10 (300s capped backoff) |
| Frame stats | `stats.frameStats` (null = disabled/not send) | Low deficit rate |

The dashboard renders these in real time; historical snapshots are in `metrics_history` (every 60s).

---

## 2. Tuning

### JVM memory
The supervisor launches the node with `-Xmx512M`. Adjust in `src/supervisor.ts`:
```ts
const javaArgs = [ '-Xmx512M', ... ];
```
For heavy use (hundreds of players), raise to `-Xmx1G` and give the container ≥ 2 GB. Do **not** set `-Xmx` near the machine's total RAM — leave headroom for the OS + Node gateway.

### Undertow (HTTP/WS buffer)
In `application.yml`:
```yaml
server:
  undertow:
    buffer-size: 1024
    direct-buffers: true
    threads:
      io: 4      # raise with more cores (rule of thumb: 1–2 per core)
      worker: 32
```

### Lavalink buffers
```yaml
lavalink:
  server:
    bufferDurationMs: 400       # higher smooths jitter, costs latency
    frameBufferDurationMs: 10000
    opusEncodingQuality: 10     # 0–10; lower = less CPU
    resamplingQuality: HIGH     # MEDIUM/LOW to save CPU
```

### Node/OS
- Use a **KVM VPS** (not shared/over-subscribed host); see provider table in [Deployment](Deployment).
- Raise `LimitNOFILE` when using the systemd service (unit already sets `65536`).
- Place the server near your bot's region for lower WS latency.

---

## 3. Monitoring

- **Dashboard**: real-time stats + 30s metrics history chart (`/dashboard/api/metrics`).
- **Proxy only**: `GET /dashboard/api/status` for current stats; `/dashboard/api/events` for live pushes.
- **SQLite**: `SELECT * FROM metrics_history ORDER BY id DESC LIMIT 120;` for longer trends.
- **System**: standard `top`/`htop`, `docker stats`, `journalctl`. Watch the **JVM** (RSS) not just the heap.

---

## 4. Diagnosing Bottlenecks

| Symptom | Likely cause | Fix |
| :--- | :--- | :--- |
| High `lavalinkLoad`, audio skips | CPU starvation / hot datacenter IP | Bigger vCPU, MEDIUM resampling, lower `opusEncodingQuality` |
| OOM / JVM killed | Heap capped too low for player count | Raise `-Xmx`, raise container memory |
| WebSocket disconnects | Idle timeouts / NAT | Keepalive ping every 30s (built-in); proxy `read_timeout 86400s` (Nginx) |
| Slow `/v4/loadtracks` | Source throttling (YouTube 429) | OAuth + web client set; see [Troubleshooting](Troubleshooting) |
| High gateway CPU | Too many SSE clients / polling | Reduce SSE fan-out, rely on the 5s poll only if needed |

---

## 5. Multi-Node Scaling

Each instance of this server runs one dedicated Lavalink node. To scale horizontally:
1. Deploy several instances (own `LAVA_INTERNAL_URL` port, own `DB_PATH`, own credentials or shared `LAVA_PASS`).
2. Point bot clients at multiple nodes via the public URLs — all Lavalink v4 clients (lavalink-client, Shoukaku, Kazagumo) distribute players across nodes.
3. Route per-guild to nodes with load-aware client logic (the client decides; this server is stateless at the gateway level apart from session tracking).

---

## 6. Resource Budget by Plan (rough guide)

| VPS | Players (active) | JVM | Notes |
| :--- | :--- | :--- | :--- |
| 1 vCPU, 1 GB | ~20–40 | `-Xmx384M` | OAuth + single client set; low buffers |
| 2 vCPU, 2 GB | ~50–100 | `-Xmx512M` | Recommended minimum for production |
| 4 vCPU, 4 GB | ~150–250 | `-Xmx1G` | Web client set, HIGH resampling inside budget |