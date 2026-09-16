# 📦 Importing as a Library / Submodule

The server can be embedded inside other projects as a **Git submodule** or local dependency — there is **no NPM package** publishing required. This allows host projects to control the server's configuration, behavior, and resource usage while reusing the Lavalink supervision + proxying logic.

---

## 1. Why Submodule Instead of NPM?

- No NPM developer account / publishing permission needed.
- The host project pins an exact commit (works with lockfiles and CI).
- Simple updates: `git submodule update --remote` pulls the latest revision.
- The server is always built from source into `dist/`, matching the host's Node/TS setup.

---

## 2. Adding as a Git Submodule

```bash
git submodule add https://github.com/HELIX-Origin/Lavalink-Server.git lavalink-server
git submodule update --init --recursive
cd lavalink-server && pnpm install && pnpm build && cd ..
```

> ⚠️ **You must provide your own `Lavalink.jar`.** The supervisor launches `Lavalink.jar` from the host project's working directory. Download the Lavalink v4 JAR from the [official Lavalink releases](https://github.com/lavalink-devs/Lavalink/releases) and place it in your project root. If it is missing, `startServer()` throws a descriptive `LavalinkConfigError`.

---

## 3. Programmatic API

All public entry points are exported from `src/app.ts` (compiled to `dist/app.js`):

```ts
import { startServer, configure, buildConfig, config } from './lavalink-server/dist/app.js';
```

### `startServer(options): Promise<ServerHandle>`
| Option | Type | Default | Description |
| :--- | :--- | :--- | :--- |
| `env` | `NodeJS.ProcessEnv` | `process.env` | Alternate environment source (useful for tests / per-environment config). |
| `overrides` | `Partial<ServerConfig>` | `{}` | Direct config overrides applied on top of the resolved environment (highest priority). |
| `features` | `ServerFeatures` | `{}` | Feature toggles for embedding. |
| `onRestart` | `() => Promise<void>` | supervisor restart | Custom restart wiring for the "server down" restart event. |

`ServerHandle` returned:
```ts
interface ServerHandle {
  server: http.Server;        // gateway — call server.listen() yourself
  wss: WebSocketServer;       // attached websocket server
  supervisor: LavalinkSupervisor; // Java process supervisor
  config: ServerConfig;       // resolved live config
  stop: () => Promise<void>;  // graceful shutdown (closes server + supervisor)
}
```

### Feature toggles (`ServerFeatures`)
| Feature | Default when embedded | Description |
| :--- | :--- | :--- |
| `dashboard` | `false` | Serves the built-in dashboard + static pages. **Disabled by default** so the host project owns the UI. The status APIs and SSE stream can still be consumed from `/dashboard/api/...`. |
| `supervisor` | `true` | Supervises the Lavalink Java process (spawn / restart backoff / stats polling). Set `false` if you manage the node yourself. |
| `youtubeOAuth` | `true` | Enables the YouTube OAuth device flow + OAuth endpoints. Set `false` to skip (requires `YOUTUBE_CLIENT_ID` otherwise). |

### Config overrides
Use `configure(overrides, envSource?)` to mutate the shared `config` in place (propagates to all importers):

```ts
import { configure } from './lavalink-server/dist/app.js';

configure({
  internalUrl: '127.0.0.1:2333',
  pass: 'my-secret',
  dbPath: './data/database.db',
});
```

Or pass `overrides` directly to `startServer`:

```ts
const handle = await startServer({
  overrides: {
    internalUrl: '127.0.0.1:2333',
    publicUrl: 'https://lavalink.mybot.dev',
    dbPath: './my-data/database.db',
    dashboardTheme: 'cyberpunk',
    dashboardColorScheme: 'cyan',
  },
  features: {
    dashboard: false,   // host has its own dashboard
    supervisor: true,
    youtubeOAuth: true,
  },
});

handle.server.listen(handle.config.gatewayPort, handle.config.gatewayHost);
console.log(`Gateway ready at http://${handle.config.gatewayHost}:${handle.config.gatewayPort}`);
```

---

## 4. Error Handling & Recovery

- **`LavalinkConfigError`** — thrown for invalid or missing configuration (e.g. missing `YOUTUBE_CLIENT_ID`, missing `Lavalink.jar`). Catch it and surface a clear message:
  ```ts
  try {
    await startServer(...);
  } catch (err) {
    if (err instanceof LavalinkConfigError) {
      console.error('[Embedded Lavalink] Config error:', err.message);
      process.exitCode = 1;
    } else {
      throw err;
    }
  }
  ```
- **Missing `YOUTUBE_CLIENT_ID`**: thrown only when the `youtubeOAuth` feature is enabled. Provide the client id, or disable the feature.
- **Missing `Lavalink.jar`**: thrown when `supervisor` is enabled. Place the JAR in the working directory, or disable the feature.
- **Restart handling**: the default `onRestart` restarts the supervisor; the built-in gateway routes `GET /health` with a `503` while the node is restarting so load balancers can recover gracefully.

---

## 5. Disabling the Built-in Dashboard

When embedded, the dashboard is **off by default**:

```ts
const handle = await startServer({ features: { dashboard: false } });
```

The host project can still:
- Consume `GET /dashboard/api/status` for live connection info (`internal` / `public` / `gateway`), stats, and OAuth state.
- Consume `GET /dashboard/api/events` (SSE) for real-time updates.
- Aggregate `/dashboard/api/metrics` into its own graphs.

To expose these to the host dashboard, map the routes in the host's own HTTP framework or reverse proxy.

---

## 6. Best Practices

- Keep the submodule on a **pinned tagged commit** for reproducible deployments.
- Pass credentials through `overrides` or inherited environment variables — never hardcode secrets.
- Persist the SQLite database (`dbPath`) in a volume so metrics + OAuth tokens survive restarts.
- Provide your own `Lavalink.jar` in CI/CD or the deployment image (like the standalone `Dockerfile` does at build time).
- Pre-seed `YOUTUBE_REFRESH_TOKEN` to avoid interrupting startup with the interactive device flow.