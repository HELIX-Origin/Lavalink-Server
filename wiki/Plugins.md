# 🔌 Plugins Guide

Lavalink v4 uses an isolated, modular plugin architecture. This server template comes pre-configured with six essential plugins: **YouTube Source Plugin**, **LavaSrc (Spotify & Extended Sources)**, **SponsorBlock**, **LavaSearch**, **LavaLyrics**, and **Skybot**.

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
      url: "https://cipher.kikkia.dev/"
      password: ""
```

- **Default Endpoint:** `https://cipher.kikkia.dev/`
- You can host your own private cipher instance using [kikkia/cipher](https://github.com/kikkia-dev/cipher).

### YouTube OAuth2 Setup (Bypassing Bot IP Bans)
To prevent YouTube `429 Too Many Requests` or "Sign in to confirm you're not a bot" errors on datacenter IP ranges:

1. Set a valid **`YOUTUBE_CLIENT_ID`** (a YouTube OAuth Client ID of app type "TVs and Limited Input devices"). It is **required** — the server refuses to start without it.
2. Set **`YOUTUBE_CLIENT_SECRET`** to the Client Secret for that Client ID. It is needed for the token exchange (falls back to YouTube's built-in client secret when empty).
3. On boot, the server prints the authorization URL + code to the console (and shows it on the dashboard). **The server waits for authorization before starting Lavalink.**
4. Open the URL, sign in with an authorized streaming Google account, and enter the code.
5. The server exchanges the code for a **refresh token**, prints `YOUTUBE_REFRESH_TOKEN=...` to the console, and persists it to the SQLite database automatically (also applied to the running Lavalink node instantly).
6. You can pre-set the token for future starts:
   ```env
   YOUTUBE_REFRESH_TOKEN=your_refresh_token_here
   ```

> **Note:** Your OAuth app must have your Google account added as a test user in Google Cloud Console (OAuth consent screen → Test users), or be published/verified.

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
      - "ytmsearch:\"%ISRC%\""
      - "ytsearch:\"%ISRC%\""
      - "ytmsearch:%QUERY%"
      - "ytsearch:%QUERY%"
      - "scsearch:%QUERY%"
```

---

## 🟣 3. SponsorBlock Plugin (`com.github.topi314.sponsorblock`)

SponsorBlock automatically skips sponsorships, intros, outros, and other non-music segments in YouTube videos using the community-driven [SponsorBlock API](https://sponsor.ajay.app/).

### Dependency Declaration
```yaml
lavalink:
  plugins:
    - dependency: "com.github.topi314.sponsorblock:sponsorblock-plugin:1.0.0"
      repository: "https://maven.topi.wtf/releases"
      snapshot: false
```

### Configuration
The plugin works automatically with the YouTube plugin. No additional configuration is required. It will:
- Skip sponsor segments automatically during playback
- Use the public SponsorBlock API by default
- Respect user privacy (no tracking)

---

## 🔍 4. LavaSearch Plugin (`com.github.topi314.lavasearch`)

LavaSearch provides enhanced search capabilities across multiple sources with a unified interface.

### Dependency Declaration
```yaml
lavalink:
  plugins:
    - dependency: "com.github.topi314.lavasearch:lavasearch-plugin:1.0.0"
      repository: "https://maven.topi.wtf/releases"
      snapshot: false
```

### Features
- Unified search across YouTube, YouTube Music, SoundCloud, and more
- Improved search result relevance
- Additional search providers beyond the standard Lavalink sources

---

## 🎵 5. LavaLyrics Plugin (`com.github.topi314.lavalyrics`)

LavaLyrics fetches synchronized lyrics for tracks from Genius.com.

### Dependency Declaration
```yaml
lavalink:
  plugins:
    - dependency: "com.github.topi314.lavalyrics:lavalyrics-plugin:1.0.0"
      repository: "https://maven.topi.wtf/releases"
      snapshot: false
```

### Configuration
```yaml
plugins:
  lavalyrics:
    enabled: true
    geniusToken: "${GENIUS_ACCESS_TOKEN:}"
```

### Genius API Setup
1. Go to [Genius API Clients](https://genius.com/api-clients).
2. Create a new API client.
3. Copy the **Access Token** (not the Client ID/Secret).
4. Set it in your server environment:
   ```env
   GENIUS_ACCESS_TOKEN=your_genius_access_token
   ```

---

## ☁️ 6. Skybot Plugin (`com.github.DuncteBot.skybot`)

Skybot adds support for additional audio sources including OCRemix and Mixcloud.

### Dependency Declaration
```yaml
lavalink:
  plugins:
    - dependency: "com.github.DuncteBot.skybot:skybot-lavalink-plugin:1.7.1"
      repository: "https://jitpack.io"
```

### Configuration
```yaml
plugins:
  skybot:
    sources:
      getyarn: false
      tts: false
      pornhub: false
      reddit: false
      ocremix: true
      tiktok: false
      mixcloud: true
      soundgasm: false
      pixeldrain: false
      tumblr: false
```

### Enabled Sources
- **OCRemix** — Video game music remixes from OverClocked ReMix
- **Mixcloud** — DJ mixes, podcasts, and radio shows

### Available Sources (disabled by default)
- GetYarn, TTS, Pornhub, Reddit, TikTok, Soundgasm, Pixeldrain, Tumblr

---

## ➕ Adding Additional Plugins

To add another plugin (e.g. Apple Music, Deezer, Yandex), add its maven coordinates under `lavalink.plugins` in `application.yml`:

```yaml
lavalink:
  plugins:
    - dependency: "dev.lavalink.youtube:youtube-plugin:1.18.2"
      repository: "https://maven.lavalink.dev/releases"
    - dependency: "com.github.topi314.lavasrc:lavasrc-plugin:4.8.3"
      repository: "https://maven.topi.wtf/releases"
      snapshot: false
    - dependency: "com.github.topi314.sponsorblock:sponsorblock-plugin:1.0.0"
      repository: "https://maven.topi.wtf/releases"
      snapshot: false
    - dependency: "com.github.topi314.lavasearch:lavasearch-plugin:1.0.0"
      repository: "https://maven.topi.wtf/releases"
      snapshot: false
    - dependency: "com.github.topi314.lavalyrics:lavalyrics-plugin:1.0.0"
      repository: "https://maven.topi.wtf/releases"
      snapshot: false
    - dependency: "com.github.DuncteBot.skybot:skybot-lavalink-plugin:1.7.1"
      repository: "https://jitpack.io"
    # Example: Apple Music Plugin
    # - dependency: "com.github.topi314.lavaapple:lavaapple-plugin:1.0.0"
    #   repository: "https://maven.topi.wtf/releases"
```