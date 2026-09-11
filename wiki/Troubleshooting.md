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
  - When deployed on Heroku or behind an Nginx reverse proxy, incoming connections route through port **`443`** (HTTPS/WSS).
  - In your bot, set `LAVA_PORT=443` and `LAVA_SECURE=true`.
  - Do not use `2333` on public Heroku URLs (`*.herokuapp.com`) because Heroku's router fronts all public traffic on port `443`.

---

## 2. YouTube Playback Errors

### `429 Too Many Requests / "Sign in to confirm you're not a bot"`
- **Cause:** Cloud datacenter IP addresses are frequently rate-limited by YouTube's anti-scraping systems.
- **Fix:**
  1. Ensure `YOUTUBE_CIPHER_URL` is set to an active remote cipher server (default: `https://cipher.kikkia.dev/`).
  2. Ensure `YOUTUBE_API_KEY` is set — it is required to issue the YouTube authorization URL; the server refuses to start without it.
  3. Complete the built-in OAuth device flow (it auto-starts on boot): open the printed authorization URL, enter the displayed code, and the server captures the refresh token, prints it to the console, and persists it to the database.
  4. (Optional) Or supply a pre-existing `YOUTUBE_REFRESH_TOKEN` (e.g. from Master-Bot's `/youtube-auth`) in your server environment and restart.

### `This video is unavailable in your country`
- **Cause:** Content is geo-blocked in the cloud server's region (e.g. Frankfurt vs Oregon).
- **Fix:** Deploy the server in a US-based cloud region (`us-east` or `us-west`).

---

## 3. VPS & Cloud Environment Notes

### Account Suspensions on Free Cloud Providers (Render, Railway)
- **Problem:** Accounts getting banned or suspended when deploying Lavalink on free or shared cloud platforms like Render or Railway.
- **Cause:** Platforms like Render strictly prohibit high-bandwidth WebRTC audio proxying and YouTube scraping in their free tiers, leading to immediate account termination.
- **Fix:** Do not deploy Lavalink to Render or Railway. Use **Heroku** (supported via container dynos) or deploy to a **Dedicated VPS** (Hetzner, DigitalOcean, Linode, OVH).

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
