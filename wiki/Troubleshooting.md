# 🛠️ Troubleshooting & FAQ

This page documents common issues encountered when deploying and connecting to the Lavalink v4 server.

---

## 1. Authentication & Connection Errors

### `401 Unauthorized`
- **Cause:** The client sent an `Authorization` header that does not match `LAVA_PASS`.
- **Fix:**
  - Verify that `LAVA_PASS` in your bot's `.env` exactly matches the password configured on your Lavalink server (default: `youshallnotpass`).
  - Make sure there are no trailing whitespace or hidden characters in your environment variables.

### `WebSocket connection failed: Error 1006 / Connection Refused`
- **Cause:** Port mismatch or SSL/TLS protocol mismatch.
- **Fix:**
  - On cloud platforms (Render, Railway, Heroku), incoming connections route through port **`443`** (HTTPS/WSS).
  - In your bot, set `LAVA_PORT=443` and `LAVA_SECURE=true`.
  - Do not use `2333` on public cloud URLs unless you are connecting directly via raw IP without an SSL proxy.

---

## 2. YouTube Playback Errors

### `429 Too Many Requests / "Sign in to confirm you're not a bot"`
- **Cause:** Cloud datacenter IP addresses (Render, Railway, DigitalOcean, AWS) are frequently rate-limited by YouTube's anti-scraping systems.
- **Fix:**
  1. Ensure `YOUTUBE_CIPHER_URL` is set to an active remote cipher server (default: `https://cipher.kikkia.dev/`).
  2. Generate and configure a `YOUTUBE_REFRESH_TOKEN`:
     - In Master-Bot, run `/youtube-auth` and authorize a Google streaming account.
     - Add the resulting token as `YOUTUBE_REFRESH_TOKEN` on your Lavalink server.
     - Restart the server.

### `This video is unavailable in your country`
- **Cause:** Content is geo-blocked in the cloud server's region (e.g. Frankfurt vs Oregon).
- **Fix:** Deploy the server in a US-based cloud region (`us-east` or `us-west`).

---

## 3. VPS & Network Environment Notes

### Cloud PaaS Account Suspensions (Render, Railway, Heroku)
- **Problem:** Accounts getting banned or suspended when deploying Lavalink on free or shared cloud platforms.
- **Cause:** Cloud platforms actively flag and ban accounts proxying continuous WebRTC/audio streams and running YouTube scraping processes.
- **Fix:** Do not host Lavalink on shared cloud PaaS platforms. Deploy on a dedicated VPS (Hetzner, DigitalOcean, Linode, OVH, Oracle Cloud VM) or self-host via Docker on your own machine.

### Out of Memory (OOM) Crashes
- **Cause:** Java process exceeded container RAM limit (512 MB).
- **Fix:**
  - Our default configuration allocates `-Xmx512M`.
  - If running more than 20 concurrent voice players, allocate at least 1 GB of RAM to the container in `docker-compose.yml`.

---

## 4. FAQ

### Q: Why does the server repository not use `LAVA_EXTERNAL`?
**A:** `LAVA_EXTERNAL` is a client-side setting for Discord bots (like Master-Bot). It tells the bot client whether to look for a local Java process or connect outwards to an external cloud node. The Lavalink server itself is the node, so it has no concept of being "external" to itself.

### Q: Can I run multiple Discord bots on one Lavalink server?
**A:** Yes! A single Lavalink v4 server can easily handle multiple Discord bots simultaneously. Simply configure each bot to connect to the same host, port, and password.
