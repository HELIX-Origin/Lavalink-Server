# 🔒 Security Considerations

Best practices for securing the server and protecting sensitive data.

---

## 1. Secrets & Credentials

- **Never commit `.env`.** Keep real credentials out of the repository. `.env.example` contains placeholders only.
- `LAVA_PASS` protects every Lavalink REST/WebSocket request (`Authorization` header). Use a strong unique value (recommend ≥ 24 random chars).
- `YOUTUBE_CLIENT_SECRET`, `SPOTIFY_CLIENT_SECRET`, and `GENIUS_ACCESS_TOKEN` are OAuth/API secrets — rotate them if leaked.
- `YOUTUBE_REFRESH_TOKEN` is a bearer credential for your Google account — treat it like a password. It is persisted in SQLite (`system_settings`); protect the DB file (`chmod 600 database.db`).
- When embedding as a library, inject secrets via environment or `overrides` — never hardcode.

### Password on the dashboard
`/dashboard/api/status` intentionally includes `connection.public.password` so operators can copy the bot config. The dashboard renders it masked with a Show/Hide toggle. Lock down `/dashboard` if you do not want bystanders to read it (see Network Isolation).

---

## 2. Network Isolation

| Exposure | Secure setup |
| :--- | :--- |
| Internal node port (`2333`) | Bind to localhost (`127.0.0.1:2333`) or firewall it; bots never need it. Only the local gateway proxies it |
| Gateway port (`2334`) | Firewall it too if the public side is handled by Cloudflare/Tunnel. Bots and dashboards reach it only via the tunnel domain |
| Public URL | Use HTTPS (`https://`/`wss://`) at the edge; let Cloudflare/Tunnel terminate TLS. `secure` is derived from the `LAVA_PUBLIC_URL` scheme |
| SSH | Key-based auth only, `ufw allow OpenSSH` |

**Recommended `ufw` baseline:**
```bash
sudo ufw default deny incoming
sudo ufw allow OpenSSH
# only if exposing directly:
sudo ufw allow 2333/tcp
sudo ufw allow 2334/tcp
# HTTP(S) only when terminating TLS yourself:
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
```

---

## 3. TLS Everywhere

- **Cloudflare Tunnel** is the simplest path: no inbound ports, automatic TLS, DDoS protection, and the port stays masked.
- **Nginx + Let's Encrypt**: see the [Deployment guide](Deployment). Enforce `TLSv1.2/TLSv1.3`, forward the `Upgrade`/`Connection` headers for WebSockets, and pass `X-Forwarded-For` (used for client-IP session tracking).
- The supervisor already enforces modern TLS for the JVM: `-Djdk.tls.client.protocols=TLSv1.2,TLSv1.3`.

---

## 4. OAuth Flow Security

- The device flow requires the **secret** (`YOUTUBE_CLIENT_SECRET`) to exchange codes — it never leaves the server.
- The flow is public/unauthenticated at `/dashboard/api/oauth/youtube/start`. If you don't want arbitrary users starting it, disable the feature (`features.youtubeOAuth: false`) or front `/dashboard` with auth.
- After authorization, the refresh token is pushed to Lavalink over the **internal** connection and persisted; it is never exposed to clients.

---

## 5. Hardening Checklist

- [ ] `.env` is gitignored, mode `600`
- [ ] `LAVA_PASS` is strong and unique
- [ ] Internal/gateway ports firewalled; only tunnel/proxy exposes the public URL
- [ ] Public URL uses `https://` (sets `secure` correctly for bots)
- [ ] SQLite DB + `data/` are writable only by the service user (systemd unit uses `PrivateTmp`, `ProtectSystem=strict`, `ReadWritePaths` on `data`/`logs`)
- [ ] `Lavalink.jar` downloaded from the official releases over HTTPS, not a taint
- [ ] Plugin repos pinned to the official Maven repositories (see `application.yml`)
- [ ] No admin console / owner auth surface exposed (removed features)
- [ ] Docker: don't run as root inside the container without need; keep the image OS patched