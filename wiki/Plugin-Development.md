# 🧩 Plugin Development Guide

Lavalink v4 uses an isolated, modular plugin architecture: all sources and features ship as plugins instead of being baked into the core. This server runs them through `application.yml` and wires their credentials through environment variables. This guide covers how the plugin system works here, how to add plugins from the ecosystem, and how to write your own.

---

## 🧠 How Plugins Work in This Server

1. **Declarations** live under `lavalink.plugins` in `application.yml` (maven coordinates + repository).
2. **Runtime configuration** lives under `plugins.*` in the same file and is often templated from env vars (e.g. `${SPOTIFY_CLIENT_ID:}`, `${GENIUS_ACCESS_TOKEN:}`).
3. On startup the **supervisor** (`src/supervisor.ts`) spawns the Java process with `-Dspring.profiles.active=prod`; Lavalink resolves and loads the plugins listed in `application.yml`.
4. The dashboard and `/dashboard/api/status` reflect the node's status, not the plugin list — plugins report through Lavalink's `/v4/info` (exposed via `/server` and `/v4/*` proxies).

> The Java process is the only place plugins can run. The Node gateway never re-implements plugin behavior; it only proxies traffic.

---

## ➕ Adding a Community Plugin

1. Find the plugin's maven coordinates and repository (usually the plugin's GitHub README).
2. Add it to `lavalink.plugins` in `application.yml`:
   ```yaml
   lavalink:
     plugins:
       - dependency: "dev.lavalink.youtube:youtube-plugin:1.18.2"
         repository: "https://maven.lavalink.dev/releases"
       - dependency: "com.github.topi314.lavasrc:lavasrc-plugin:4.8.3"
         repository: "https://maven.topi.wtf/releases"
         snapshot: false
   ```
   `snapshot: false` pins release builds (snapshots are volatile) except where the plugin requires them.
3. Add its config block under `plugins:` (top level of `application.yml`), templating secrets through env vars rather than hardcoding them:
   ```yaml
   plugins:
     myplugin:
       apiKey: "${MY_PLUGIN_API_KEY:}"
   ```
4. Add the new env key to `.env`, `.env.example`, and `src/config.ts` only if the Node side needs it. If only the Java side uses it, leave it out of `src/config.ts` (see `../../.agents/skills/config-management`).
5. Restart the server and confirm the plugin appears in `/server/v4/info`.

> **Version compatibility:** match plugin versions to the Lavalink version you run. A plugin compiled against a different Lavalink minor will fail to load (see Troubleshooting below). Full plugin list and current pins are documented in `../../wiki/Plugins`.

---

## 🖥️ Writing a Custom Plugin

Plugins are Java libraries built against the `lavalink-plugin-api`. High-level checklist:

1. Create a Maven/Gradle project depending on `lavalink-plugin-api` (version matching your Lavalink).
2. Implement a `Plugin` subclass (lifecycle hooks like `onLoad` / `onShutdown`).
3. Register your audio source / filters / managers with the `AudioPlayerManager` in `onLoad`.
4. Declare the plugin in `META-INF` service loader files so Lavalink discovers it.
5. Publish to a maven repo (Maven Central or a personal repo like `maven.topi.wtf`).
6. Add the dependency + config to `application.yml` as described above.

See the official [Lavalink plugin documentation](https://github.com/lavalink-devs/Lavalink/tree/master/LavalinkServer#plugins) and real implementations (e.g. `topi314/lavasrc`) for reference.

### Plugin Config Best Practices

- Expose every secret via env templates: `"${VAR:}"` (empty default) — never hardcode tokens in `application.yml`.
- Keep source/plugin config scoped: `plugins.<name>` blocks are namespaced, so collisions across plugins are impossible.
- Validate optional blocks with a `enabled: true` toggle so operators can disable features per-environment.

---

## 🐛 Troubleshooting Plugins

| Symptom | Cause | Fix |
| :--- | :--- | :--- |
| `Plugin ... failed to load` | Version incompatible with the running Lavalink | Align plugin + Lavalink versions; check the plugin's README for the supported range |
| Plugin missing from `/v4/info` | Dependency coordinate or repository typo | Verify the maven coordinate/repo; `snapshot: false` won't fetch snapshot builds |
| 400/404 on a new source | Source not registered or plugin got disabled by config | Confirm `plugins.<name>.enabled: true` and the source name in `lavalink.pluginAi`-style server config |
| Credentials rejected (Spotify/Genius/YouTube) | Env var not rendered into `application.yml` | The supervisor passes env through `process.env`; verify the var exists in `.env` and the `{VAR:}` template is spelled identically |
| Node crashes in a loop after adding a plugin | Bad plugin crashed the JVM | Remove the plugin block, restart, then add it back alone to isolate |

---

## 📐 Best Practices

- Pin exact versions (`1.18.2`, not `1.x`) so builds are reproducible and updates are deliberate.
- Test a new/snapshot plugin on a staging node before touching production `application.yml`.
- When upgrading Lavalink, upgrade plugins in the same commit and verify `/server/v4/info` afterwards.
- Keep credentials env-templated; never commit `application.yml` with real secrets.

---

## 🐞 Reporting Plugin Issues

- **Bugs/features for the plugin itself** → the plugin's own repository (e.g. `topi314/lavasrc`).
- **Integration problems with this server** (config placement, env wiring, load order) → [GitHub Issues](https://github.com/HELIX-Origin/Lavalink-Server/issues) with your `application.yml` plugin block and `/server/v4/info` output.

---

## ❓ Plugin FAQ

**Q: Where are plugins declared?**
Only in `application.yml` under `lavalink.plugins`. The Node side never declares plugins.

**Q: Can I disable a plugin without deleting it?**
Yes — either remove its `lavalink.plugins` entry, or honor an `enabled` toggle in its `plugins.*` config block if the plugin supports it.

**Q: Do plugin credentials need to be in `src/config.ts`?**
No. Only keys the Node side reads belong there. Java-only keys live in `application.yml` + `.env` + `.env.example`.

**Q: Why does `/v4/info` not list my plugin after adding it?**
Either the version is incompatible (check stderr: `supervisor` surfaces JVM logs as `[ERR]`) or the dependency failed to download the exact coordinate/repo.