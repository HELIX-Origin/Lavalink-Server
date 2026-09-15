# Lavalink-Server Agents

This project uses an agent-based development workflow. All agents, rules, and skills are defined in the `.agents/` directory.

## Quick Reference

| File | Purpose |
|------|---------|
| `.agents/rules.md` | **Core rules - READ FIRST** |
| `.agents/skills/*.md` | Specialized skills for tasks |
| `.agents/agents/*.md` | Agent definitions and workflows |

## Before Making Any Changes

1. **Read `.agents/rules.md`** - Contains all critical constraints
2. **Check current `.env`** - Only use keys that exist in user's actual .env
3. **Verify no dead code** - Don't reference removed features

## Agent Workflow

### Config Agent
- Manages `src/config.ts`, `.env.example`, `application.yml`
- Skill: `.agents/skills/config-management.md`

### Docker Agent
- Manages `Dockerfile`, `docker-compose.yml`
- Skill: `.agents/skills/docker-deployment.md`

### Plugin Agent
- Manages `application.yml` plugins, wiki/Plugins.md
- Skill: `.agents/skills/plugin-management.md`

### Dashboard Agent
- Manages `src/pages/*` (dashboard, docs, privacy, tos, layout, theme), `src/server.ts` routes
- Skill: `.agents/skills/dashboard-development.md`

### YouTube OAuth Agent
- Manages `src/youtubeOAuth.ts`, OAuth flow
- Skill: `.agents/skills/youtube-oauth.md`

## Current Valid Environment Variables

```
# Lavalink Auth & Security
LAVA_DOMAIN=""                                               # Public URL/domain for the Lavalink server (e.g. "https://lavalink.example.com"). Scheme is stripped automatically.
LAVA_HOST="127.0.0.1"                                        # Internal host the Lavalink server binds to.
LAVA_PORT="2333"                                             # Internal port the Lavalink server binds to.
LAVA_PASS="youshallnotpass"                                  # Lavalink authentication password.
LAVA_SECURE=false                                            # Use HTTPS for Lavalink (true/false).
LAVA_CIPHER_URL="https://cipher.kikkia.dev/"                 # Remote cipher endpoint for YouTube signature deciphering.
LAVA_CIPHER_PASSWORD=""                                      # Optional password for self-hosted cipher. Automatically provisioned by the cipher.kikkia.dev remote cipher server.

# YouTube OAuth
YOUTUBE_CLIENT_ID=""                                         # REQUIRED - YouTube OAuth Client ID (app type: "TVs and Limited Input devices").
YOUTUBE_CLIENT_SECRET=""                                     # REQUIRED - YouTube OAuth Client Secret for the Client ID above.
YOUTUBE_REFRESH_TOKEN=""                                     # Optional - Pre-authorized refresh token (auto-saved after device flow).

# Spotify
SPOTIFY_CLIENT_ID=""                                         # REQUIRED - Spotify Developer App Client ID for use with Spotify integration.
SPOTIFY_CLIENT_SECRET=""                                     # REQUIRED - Spotify Developer App Client Secret for use with Spotify integration.

# Genius (for LavaLyrics plugin)
GENIUS_ACCESS_TOKEN=""                                       # REQUIRED - Genius API Access Token for lyrics for use with LavaLyrics integration.

# Database
DB_PATH="./database.db"                                      # SQLite database file path
DB_URI="sqlite://./database.db"                              # SQLite database URI

# Environment
NODE_ENV="production"                                        # Set to "production" for production mode. Available options: "production", "development".

# Dashboard Theme
DASHBOARD_THEME="dark"                                       # Dashboard theme: glassmorphism | dark | light | cyberpunk | dracula | nord | emerald (default: dark).
DASHBOARD_COLOR_SCHEME="default"                             # Accent color scheme: default | cyan | purple | blue | emerald | rose | amber | indigo | crimson | teal | sunset.
DASHBOARD_PUBLIC_URL=""                                      # Public URL for the dashboard (e.g. "https://dashboard.example.com"). Leave empty to fall back to DASHBOARD_INTERNAL_URL.
DASHBOARD_INTERNAL_URL=""                                    # Internal bind URL for the dashboard (e.g. "http://127.0.0.1:2334"). Controls the gateway bind host/port. Leave empty to default to LAVA_HOST:LAVA_PORT+1.
```

## Removed (NEVER USE)

- `YOUTUBE_API_KEY`, `YOUTUBE_API_SECRET` (YouTube's API key/secret are a *different* credential mechanism; this server uses OAuth — use `YOUTUBE_CLIENT_ID`/`YOUTUBE_CLIENT_SECRET`)
- `DASHBOARD_PORT`, `LAVA_INTERNAL_URL`
- `LAVA_PUBLIC_URL`, `KEEP_ALIVE_ENABLED`
- `YOUTUBE_SKIP_INIT`, `YOUTUBE_CIPHER_URL`, `YOUTUBE_CIPHER_PASSWORD`
- `DOMAIN`, `HOST`, `PORT`, `SERVER_PORT`, `ADMIN_KEY`, `ADMIN_PASSWORD`

## Removed Features

- Keep-alive service
- Admin/Owner console and authentication
- Old (broken) install-service script - replaced by `scripts/install-service.sh`
- CLIENT_SECRET.ts
- Lavalink.jar in repo
- Old `DASHBOARD_PORT` env var - replaced by `DASHBOARD_INTERNAL_URL` (bind host/port) and `DASHBOARD_PUBLIC_URL` (public dashboard URL)

## Documentation

Wiki pages (no `.md` in links):
- `../../wiki/Home`
- `../../wiki/Deployment`
- `../../wiki/Configuration`
- `../../wiki/Plugins`
- `../../wiki/Client-Integration`
- `../../wiki/Troubleshooting`