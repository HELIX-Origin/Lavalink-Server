# 💻 Development Guide

Guidelines for understanding, building, and contributing to the server's codebase.

---

## 1. Repository Structure

```
src/
  app.ts            Library entry point (startServer, types, feature toggles)
  index.ts          Standalone entry point (dotenv + listen + signal handling)
  config.ts         Env parsing, ServerConfig, configure()/buildConfig()
  server.ts         HTTP/SSE/WS gateway + Lavalink proxy (createProxyServer)
  supervisor.ts     LavalinkSupervisor — Java process lifecycle + stats poller
  youtube-oauth.ts  Google device-flow OAuth + token persistence/push
  db.ts             SQLite (node:sqlite) init + helpers
  redis.ts          ioredis-mock state cache
  pages/
    index.ts        Barrel re-exports
    layout.ts       renderPage() HTML shell
    dashboard.ts    Dashboard page (status cards, metrics chart, SSE)
    docs.ts / privacy.ts / tos.ts
    theme.ts        Theme + color-scheme registry
    themes/*.ts     Theme CSS variables + shared base styles
application.yml     Lavalink Java config (Spring ${VAR:default} placeholders)
Dockerfile          Builds image, downloads Lavalink.jar at build time
docker-compose.yml  Ports + environment mapping
scripts/install-service.sh  systemd unit generator
wiki/               Documentation (see sidebar)
.agents/            Agent rules + skills (read rules.md first!)
```

---

## 2. Dev Environment Setup

Prerequisites:
- **Node.js 20+** (LTS), **pnpm** (`corepack enable` or `npm i -g pnpm`)
- **Java 21** (JRE is enough for running; JRE for the node)
- **Git**

Setup:
```bash
git clone https://github.com/HELIX-Origin/Lavalink-Server.git
cd Lavalink-Server
pnpm install
cp .env.example .env          # add your real credentials
pnpm dev                      # tsx watch — hot reload
```

The supervisor needs `Lavalink.jar` in the project root for `http` execution:
```bash
curl -L -o Lavalink.jar https://github.com/lavalink-devs/Lavalink/releases/latest/download/Lavalink.jar
```

Scripts:
| Command | Purpose |
| :--- | :--- |
| `pnpm dev` | Run with `tsx` (watch mode, from `src/index.ts`) |
| `pnpm build` | `tsc` → `dist/` |
| `pnpm typecheck` | `tsc --noEmit` (strict) |
| `pnpm start` | Run compiled `dist/index.js` |

---

## 3. Coding Standards

- **TypeScript strict mode** and **ESM `NodeNext`** resolution — imports use `.js` extensions.
- No dead code: every removed feature must also be removed from config, env files, and docs.
- No hardcoded values: hosts, ports, passwords, and endpoints come from `ServerConfig` / `application.yml` placeholders.
- No abandoned keys: removed env vars must be purged from `config.ts`, `.env.example`, `application.yml`, and documentation.
- Comments explain *why*, not *what*; no commented-out code.
- `node:` prefix for built-in imports (`node:http`, `node:path`…).

### Adding a new env var
1. `src/config.ts` — parse it, add to `ServerConfig`
2. `.env.example` — document it
3. `application.yml` — only if the Java process needs it (Spring placeholder)
4. `README.md` + `wiki/Configuration.md` + `.agents/rules.md` + `AGENTS.md`
5. `pnpm typecheck && pnpm build`

### Adding a new API route
1. `src/server.ts` — add the route under the correct prefix (`/dashboard/api/*`, `/health`, or proxy)
2. `src/pages/dashboard.ts` — consume it on the client
3. `wiki/API.md` — document method/path/response

---

## 4. Configuration Precedence

1. `application.yml` (base Java settings)
2. `.env` (secrets/overrides)
3. System environment (highest)
4. `configure(overrides, source)` / `startServer({ overrides })` (library only, applied last)

---

## 5. Verifying Changes

```bash
pnpm typecheck   # strict type check — always run it
pnpm build       # compile to dist
```
There is currently no automated test suite; manual verification:
- Standalone: run `pnpm dev`, open `http://localhost:2334/dashboard`, verify internal/public cards + stats update.
- Embedded: write a small script against `startServer()` and confirm the dashboard is disabled unless enabled.
- Java: watch supervisor logs for `Lavalink is ready`; check `/health` transitions; kill the Java process and confirm restart backoff + `503`.

All agent work must pass `pnpm build` before committing (see `.agents/rules.md`).