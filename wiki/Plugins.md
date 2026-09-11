# 🔌 Plugins Guide

Lavalink v4 uses an isolated, modular plugin architecture. This server template comes pre-configured with the two most essential plugins: **YouTube Source Plugin** and **LavaSrc (Spotify & Extended Sources)**.

---

## 📺 1. YouTube Plugin (`dev.lavalink.youtube`)

In Lavalink v4, native YouTube source handling has been migrated to an external plugin to counter continuous YouTube player changes and anti-bot measures.

### Dependency Declaration
```yaml
lavalink:
  plugins:
    - dependency: "dev.lavalink.youtube:youtube-plugin:1.18.2"
      repository: "https://maven.lavalink.dev/releases"
```

### Remote Cipher Decryption
YouTube regularly updates cipher scripts that obfuscate audio stream URLs. The remote cipher service resolves these algorithms in real time:

```yaml
plugins:
  youtube:
    remoteCipher:
      url: "${YOUTUBE_CIPHER_URL:https://cipher.kikkia.dev/}"
      password: "${YOUTUBE_CIPHER_PASSWORD:}"
```

- **Default Endpoint:** `https://cipher.kikkia.dev/`
- You can host your own private cipher instance using [kikkia/cipher](https://github.com/kikkia-dev/cipher).

### YouTube OAuth2 Setup (Bypassing Bot IP Bans)
To prevent YouTube `429 Too Many Requests` or "Sign in to confirm you're not a bot" errors on cloud IP ranges:

1. In Discord, run `/youtube-auth` with Master-Bot.
2. Follow the prompt to log into an authorized streaming Google account.
3. Obtain the `refresh_token`.
4. Add the token to your Lavalink server environment:
   ```env
   YOUTUBE_REFRESH_TOKEN=your_refresh_token_here
   ```

---

## 🟢 2. LavaSrc Plugin (`com.github.topi314.lavasrc`)

LavaSrc adds direct metadata resolution for Spotify tracks, albums, artists, and playlists.

### Dependency Declaration
```yaml
lavalink:
  plugins:
    - dependency: "com.github.topi314.lavasrc:lavasrc-plugin:4.8.3"
      repository: "https://maven.topi.wtf/releases"
      snapshot: false
```

### Spotify Developer Credentials Setup
Because Spotify does not allow direct audio stream scraping, LavaSrc fetches track metadata (artist, title, ISRC) and resolves the audio stream through YouTube Music or YouTube.

1. Go to the [Spotify Developer Dashboard](https://developer.spotify.com/dashboard).
2. Click **Create an App**.
3. Copy your **Client ID** and **Client Secret**.
4. Set them in your server environment:
   ```env
   SPOTIFY_CLIENT_ID=your_client_id
   SPOTIFY_CLIENT_SECRET=your_client_secret
   ```

### Search Providers Priority
```yaml
plugins:
  lavasrc:
    providers:
      - "ytmsearch:\"%ISRC%\""  # Search YouTube Music using exact ISRC code
      - "ytsearch:\"%ISRC%\""   # Search YouTube using exact ISRC code
      - "ytmsearch:%QUERY%"     # Search YouTube Music using Title + Artist
      - "ytsearch:%QUERY%"      # Search standard YouTube
      - "scsearch:%QUERY%"      # Fallback to SoundCloud
```

---

## ➕ Adding Additional Plugins

To add another plugin (e.g. Apple Music, Deezer, Yandex), add its maven coordinates under `lavalink.plugins` in `application.yml`:

```yaml
lavalink:
  plugins:
    - dependency: "com.github.topi314.lavasrc:lavasrc-plugin:4.8.3"
      repository: "https://maven.topi.wtf/releases"
    # Example: LavaSearch Plugin
    - dependency: "com.github.topi314.lavasearch:lavasearch-plugin:1.0.0"
      repository: "https://maven.topi.wtf/releases"
```
