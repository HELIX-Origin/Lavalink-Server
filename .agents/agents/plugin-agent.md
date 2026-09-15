# Plugin Agent

```mermaid
flowchart TD
    A[Receive Task] --> B{Plugin Action?}
    B -->|Add| C[Edit application.yml]
    B -->|Update| C
    B -->|Remove| C
    C --> D[Update .env.example]
    D --> E[Update wiki/Plugins.md]
    E --> F[Update wiki/Configuration.md]
    F --> G[pnpm build]
    G --> H{Pass?}
    H -->|No| I[Fix]
    I --> G
    H -->|Yes| J[Done]
```

## Purpose
Manages Lavalink plugins in `application.yml` and wiki documentation.

## Responsibilities
- Add/update/remove plugins in `application.yml`
- Manage plugin configuration under `plugins:` section
- Sync `.env.example` with new plugin env vars
- Document plugins in `wiki/Plugins.md`

## Files Managed
- `application.yml` - Plugin dependencies + config
- `.env.example` - New plugin env vars
- `wiki/Plugins.md` - Plugin documentation
- `wiki/Configuration.md` - Env var reference

## Skills Required
- `.agents/skills/plugin-management.md`

## Current Plugins (application.yml)

```mermaid
graph TD
    subgraph Plugins["Lavalink Plugins"]
        P1[YouTube Plugin<br/>youtube-plugin:1.18.2]
        P2[LavaSrc<br/>lavasrc-plugin:4.8.3<br/>Spotify]
        P3[SponsorBlock<br/>sponsorblock-plugin:3.0.1]
        P4[LavaSearch<br/>lavasearch-plugin:1.0.0]
        P5[LavaLyrics<br/>lavalyrics-plugin:1.0.0<br/>needs GENIUS_ACCESS_TOKEN]
        P6[Skybot<br/>skybot-plugin:1.7.1<br/>OCRemix + Mixcloud]
    end
```

## Plugin Configuration Structure
```yaml
lavalink:
  plugins:
    - dependency: "group:artifact:version"
      repository: "https://repo.url"
      snapshot: false

plugins:
  pluginname:
    enabled: true
    setting: "${ENV_VAR:default}"
```

## Workflow
1. Edit `application.yml` - add/update plugin
2. Add config under `plugins:` if needed
3. Add new env vars to `.env.example`
4. Update `wiki/Plugins.md` documentation
5. Update `wiki/Configuration.md` for new env vars
6. Run `pnpm build` to verify
7. Commit & Push

## Validation Checklist
- [ ] Plugin added to `lavalink.plugins` with correct coordinates
- [ ] Repository URL is correct
- [ ] Config uses `${VAR:default}` for env vars
- [ ] New env vars added to `.env.example`
- [ ] `wiki/Plugins.md` updated
- [ ] `wiki/Configuration.md` updated if new env vars
- [ ] `pnpm build` passes