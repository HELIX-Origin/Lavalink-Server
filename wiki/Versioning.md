# 🏷️ Versioning & Release Management

How versions are planned, developed, and released.

---

## 1. Versioning Scheme

Releases follow **Semantic Versioning** (`MAJOR.MINOR.PATCH`), in sync with the project's own tags (independent of Lavalink's upstream versioning).

- **MAJOR** — breaking changes (env scheme changes, removed features, incompatible config/db).
- **MINOR** — new features in a backwards-compatible way (new env vars with defaults, additive routes).
- **PATCH** — bug fixes, docs, and internal improvements.

Current scheme baseline: the **URL-based connection model** (`0.0.0.0:2333`-style `LAVA_INTERNAL_URL` + masked `LAVA_PUBLIC_URL`) is the anchor for the next `MAJOR` release. Everything before it is the legacy scheme (see [Migration](Migration)).

---

## 2. Release Checklist

1. Merge completed work to `main` (see [Code Review](Code-Review)).
2. Bump the version in `package.json`.
3. Update release notes / changelog entries per change since the last tag.
4. Run final gates: `pnpm typecheck && pnpm build`.
5. Tag the commit: `git tag vX.Y.Z` + `git push --tags`.
6. Publish a GitHub **Release** from the tag describing:
   - Summary of changes
   - Breaking changes + [Migration](Migration) links
   - Upgrade steps (`git pull`, `pnpm build`, `.env` updates, `docker compose pull`)

---

## 3. Changelog Entry Format

```
## v2.0.0 - Breaking
- 🔧 Replace LAVA_HOST/LAVA_PORT/DASHBOARD_* with LAVA_INTERNAL_URL/LAVA_PUBLIC_URL (+ WS URIs)
- 🌐 Public port now masked behind Cloudflare/Tunnel
- 🖥️ Dashboard moved to /dashboard on the gateway port (internal + 1)
- 📦 Server importable as a Git submodule (src/app.ts API)

## v1.x.x - Previous
...
```

---

## 4. Branching & Tagging Conventions

- `main` — stable, always releasable.
- `feat/*`, `fix/*`, `docs/*`, `chore/*` — short-lived PR branches.
- Tags: `vMAJOR.MINOR.PATCH`, annotated (`git tag -a`).
- Pre-releases optional: `v2.0.0-rc.1` style for the connection-model rewrite.

---

## 5. Backporting / Hotfixes

- Patch releases may be cut from `main` directly when small.
- For a breaking-deprecation rollout, keep a `v1.x` branch and backport PATCH fixes; apply the equivalent change to `main` where feasible.
- Never rewrite published tags; hotfix = new PATCH tag.

---

## 6. Embedding Consumers

- Host projects using the Git submodule should pin a tag: `git -C lavalink-server checkout v2.0.0`.
- Bundle the server's built `dist/` in CI so runtime needs Node 20+ and the `Lavalink.jar` of your choice (see [Importing](Importing)).