# Config Management Skill

```mermaid
flowchart TD
    A[Read .env FIRST] --> B[Update src/config.ts]
    B --> C[Update .env.example]
    C --> D[pnpm build]
    D --> E{Build OK?}
    E -->|No| F[Fix errors]
    F --> D
    E -->|Yes| G[Update docs]
    G --> H[Commit & Push]
```

## Purpose
Manage `src/config.ts` and `.env.example`. Configuration is read directly from environment variables — there is NO `application.yml` parsing in TypeScript anymore. `application.yml` is only consumed by the Lavalink Java process itself (Spring `${VAR:default}` placeholders resolved with env vars passed via Docker/supervisor).

## Current Config Architecture

```mermaid
flowchart LR
    subgraph Env[".env File"]
        E1[LAVA_DOMAIN]
        E2[LAVA_HOST]
        E3[LAVA_PORT]
        E4[LAVA_PASS]
        E5[LAVA_SECURE]
        E6[LAVA_CIPHER_URL]
        E6[LAVA_CIPHER_PASSWORD]
        E7[YOUTUBE_CLIENT_ID]
        E8[YOUTUBE_CLIENT_SECRET]
        E8[YOUTUBE_REFRESH_TOKEN]
        E9[SPOTIFY_CLIENT_ID]
        E9[SPOTIFY_CLIENT_SECRET]
        E9[GENIUS_ACCESS_TOKEN]
        E10[NODE_ENV]
        E10[DB_URI]
        E10[DB_PATH]
        E11[DASHBOARD_THEME]
        E11[DASHBOARD_COLOR_SCHEME]
        E12[DASHBOARD_PUBLIC_URL]
        E12[DASHBOARD_INTERNAL_URL]
    end

    subgraph Config["src/config.ts"]
        C1[env / envInt / envBool helpers]
        C2[Derived URL builders]
    end

    subgraph ServerConfig["ServerConfig Interface"]
        SC1[port: number]
        SC2[host: string]
        SC3[domain: string]
        SC4[pass: string]
        SC5[secure: boolean]
        SC6[cipherUrl: string]
        SC7[cipherPassword: string]
        SC8[youtubeClientId: string]
        SC9[youtubeClientSecret: string]
        SC10[spotifyClientId: string]
        SC11[spotifyClientSecret: string]
        SC12[geniusToken: string]
        SC13[dbPath: string]
        SC14[isProduction: boolean]
        SC15[dashboardTheme: string]
        SC16[dashboardColorScheme: string]
        SC17[internalUrl: string]
        SC18[publicUrl: string]
        SC19[dashboardPort: number]
        SC20[dashboardHost: string]
        SC21[dashboardInternalUrl: string]
        SC22[dashboardUrl: string]
    end

    Env --> Config
    Config --> ServerConfig
```

### ServerConfig Interface (src/config.ts)
```typescript
interface ServerConfig {
  port: number;              // LAVA_PORT (Lavalink server)
  dashboardPort: number;     // Dashboard port (from DASHBOARD_INTERNAL_URL or LAVA_PORT + 1)
  host: string;              // LAVA_HOST (bind address)
  domain: string;            // LAVA_DOMAIN (public Lavalink domain, scheme stripped)
  pass: string;              // LAVA_PASS
  secure: boolean;           // LAVA_SECURE (true/false)
  cipherUrl: string;         // LAVA_CIPHER_URL (default https://cipher.kikkia.dev/)
  cipherPassword: string;    // LAVA_CIPHER_PASSWORD
  youtubeClientId: string;   // YOUTUBE_CLIENT_ID
  youtubeClientSecret: string; // YOUTUBE_CLIENT_SECRET
  spotifyClientId: string;   // SPOTIFY_CLIENT_ID
  spotifyClientSecret: string; // SPOTIFY_CLIENT_SECRET
  geniusToken: string;       // GENIUS_ACCESS_TOKEN
  dbPath: string;            // DB_PATH (path.resolve)
  isProduction: boolean;     // NODE_ENV === 'production'
  dashboardTheme: string;    // DASHBOARD_THEME (default 'dark')
  dashboardColorScheme: string; // DASHBOARD_COLOR_SCHEME (default 'default')
  internalUrl: string;       // http(s)://host:port
  publicUrl: string;         // https://domain (or http(s)://host:port if localhost)
  dashboardHost: string;     // Gateway bind host (from DASHBOARD_INTERNAL_URL or LAVA_HOST)
  dashboardInternalUrl: string; // http://<dashboardHost>:<dashboardPort>
  dashboardUrl: string;      // DASHBOARD_PUBLIC_URL or http://<dashboardHost>:<dashboardPort>
}
```

### URL Parsing Logic

```mermaid
flowchart TD
    LAVA_PORT[LAVA_PORT] --> Port[port]
    LAVA_HOST[LAVA_HOST] --> Host[host]
    LAVA_DOMAIN[LAVA_DOMAIN] --> Domain[domain scheme stripped]
    LAVA_DOMAIN --> PublicURL[publicUrl]
    LAVA_HOST & LAVA_PORT --> Internal[internalUrl]
    LAVA_SECURE[LAVA_SECURE] --> Proto[protocol http/https]
    Proto --> Internal
    DASHBOARD_INTERNAL_URL[DASHBOARD_INTERNAL_URL] --> DashHost[dashboardHost + dashboardPort]
    LAVA_HOST & LAVA_PORT --> DashHost
    DASHBOARD_PUBLIC_URL[DASHBOARD_PUBLIC_URL] --> DashPublic[dashboardUrl]
    DashHost --> DashPublic
```

### Environment Variables (src/config.ts)

Key helpers (no YAML parsing):
- `env(name, fallback)` - Reads `process.env[name]` with fallback
- `envInt(name, fallback)` - Parses integer env var
- `envBool(name, fallback)` - Parses boolean env var
- `stripProtocol(url)` - Strips `http://`/`https://` prefix from LAVA_DOMAIN
- `parseBaseUrl(raw)` - Parses a URL string into `{hostname, port}` (used for DASHBOARD_INTERNAL_URL)
- Derived: `internalUrl = ${protocol}://${host}:${port}`, `publicUrl` from LAVA_DOMAIN's scheme (falls back to `http://host:port` when domain is localhost), `dashboardPort` from DASHBOARD_INTERNAL_URL or `port + 1`, `dashboardUrl` from DASHBOARD_PUBLIC_URL (falls back to `dashboardInternalUrl`)

## .env.example Format
All current valid keys must be documented. See rules.md for complete list. Theme + dashboard section at the bottom:
- `DASHBOARD_THEME="dark"` — glassmorphism | dark | light | cyberpunk | dracula | nord | emerald
- `DASHBOARD_COLOR_SCHEME="default"` — default | cyan | purple | blue | emerald | rose | amber | indigo | crimson | teal | sunset
- `DASHBOARD_PUBLIC_URL=""` — public dashboard URL (e.g. `https://dashboard.example.com`)
- `DASHBOARD_INTERNAL_URL=""` — gateway bind URL (e.g. `http://127.0.0.1:2334`), defaults to `LAVA_HOST:LAVA_PORT+1`

## application.yml Integration

```mermaid
flowchart LR
    AppYML[application.yml] -->|Spring ${VAR:default}| Lavalink[Lavalink Java Process]
    Env[".env as child env vars"] --> Prov[Supervisor spawns java]
    Prov --> Lavalink
```

- Lavalink JAR reads `application.yml` with Spring-style `${VAR:default}` placeholders
- TypeScript supervisor spawns `java -jar Lavalink.jar` with `-Dserver.port=${config.port}` and `-Dserver.address=${config.host}` and passes relevant env vars to the child process
- TypeScript config does NOT parse application.yml

## Workflow for Changes
1. Read current `.env` file FIRST
2. Update `src/config.ts` interface and parsing logic
3. Update `.env.example` with all current keys
4. Run `pnpm build` to verify
5. Update documentation (wiki/Configuration.md, wiki/Deployment.md)

## Common Tasks
| Task | Steps |
|------|-------|
| **Add new env var** | Add to config.ts parsing → .env.example → application.yml (if Lavalink needs it) |
| **Remove env var** | Remove from ALL files (config.ts, .env.example, application.yml, docs, rules.md) |
| **Change URL structure** | Update derived `internalUrl`/`publicUrl` logic in config.ts |
| **New plugin config** | Add to application.yml only (Java side) |

## Validation Checklist
- [ ] Only uses current .env keys (see rules.md)
- [ ] No references to removed features
- [ ] No hardcoded values
- [ ] No dead code
- [ ] Config matches current .env exactly
- [ ] `pnpm build` passes