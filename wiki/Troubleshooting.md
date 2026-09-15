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
  - When fronted by an Nginx/SSL reverse proxy, incoming connections route through port **`443`** (HTTPS/WSS).
  - In your bot, set `LAVA_PORT=443` and `LAVA_SECURE=true`.
  - When connecting directly to your VPS or Docker host, use port **`2333`** with `LAVA_SECURE=false`.

---

## 2. YouTube Playback Errors

### `429 Too Many Requests / "Sign in to confirm you're not a bot"`
- **Cause:** Datacenter IP addresses are frequently rate-limited by YouTube's anti-scraping systems.
- **Fix:**
  1. Ensure `YOUTUBE_CIPHER_URL` is set to an active remote cipher server (default: `https://cipher.kikkia.dev/`).
  2. Ensure `YOUTUBE_CLIENT_ID` is set — it is required to issue the YouTube authorization URL; the server refuses to start without it.
  3. Complete the built-in OAuth device flow (it auto-starts on boot): open the printed authorization URL, enter the displayed code, and the server captures the refresh token, prints it to the console, and persists it to the database.
  4. (Optional) Or supply a pre-existing `YOUTUBE_REFRESH_TOKEN` (e.g. from Master-Bot's `/youtube-auth`) in your server environment and restart.

### `This video is unavailable in your country`
- **Cause:** Content is geo-blocked in the server's region.
- **Fix:** Deploy the server in a region where the content is available (e.g. `us-east` or `us-west`).

---

## 3. Hosting Environment Notes

### Datacenter IP Blocking
- **Problem:** YouTube refuses requests from shared or free cloud/datacenter IP ranges.
- **Cause:** YouTube aggressively blocks known shared-cloud and hosting IP ranges for streaming and scraping.
- **Fix:** Deploy to a **Dedicated VPS** (Hetzner, DigitalOcean, Linode, OVH) or hardware you control, and complete the OAuth device flow so requests use an authenticated refresh token.

### Out of Memory (OOM) Crashes
- **Cause:** Java process exceeded container RAM limit (512 MB).
- **Fix:**
  - Our default configuration allocates `-Xmx512M`.
  - If running more than 20 concurrent voice players, allocate at least 1 GB of RAM to the container in `docker-compose.yml`.

---

## 4. FAQ

### Q: Why does the server repository not use `LAVA_EXTERNAL`?
**A:** `LAVA_EXTERNAL` is a client-side setting for Discord bots (like Master-Bot). It tells the bot client whether to look for a local Java process or connect outwards to an external node. The Lavalink server itself is the node, so it has no concept of being "external" to itself.

### Q: Can I run multiple Discord bots on one Lavalink server?
**A:** Yes! A single Lavalink v4 server can easily handle multiple Discord bots simultaneously. Simply configure each bot to connect to the same host, port, and password.
