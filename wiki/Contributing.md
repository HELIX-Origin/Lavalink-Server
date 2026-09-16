# 🤝 Contributing

Guidelines for reporting bugs, requesting features, and submitting pull requests.

---

## 1. Finding Things

- **Code structure & standards**: read [Development](Development) and `.agents/rules.md` before touching anything.
- **Conventions**: env-driven config, ESM + strict TS, no dead code/removed references.
- **Outstanding work**: the repo's `TODO.md` is the roadmap — pick unclaimed items or propose new ones.

---

## 2. Reporting Bugs

Open an [issue](https://github.com/HELIX-Origin/Lavalink-Server/issues) with:

1. **Title** — short, specific (`500 on /v4/loadtracks when source is YouTube`).
2. **Environment** — OS, Java version, Node version, Docker/systemd, Lavalink JAR version, `.env` scheme in use (never paste secrets).
3. **Steps to reproduce** — exact commands / config.
4. **Expected vs actual** behavior.
5. **Logs** — supervisor stdout, `journalctl`/`docker compose logs`, relevant `/dashboard/api/status` payload.
6. **Impact** — how it affects your deployment.

Labels: `bug`, `performance`, `security`, `documentation`, `question`.

---

## 3. Requesting Features

- Open an issue using the **feature request** flow, or flesh it out on the wiki/roadmap first.
- Describe: the problem, the proposed behavior, impact on the current env scheme, and whether it belongs in the server (gateway/supervisor), a plugin, or a module.
- Small, well-scoped feature requests are more likely to be accepted than sweeping redesigns. Keep the **masked-port public model** and deprecations in mind — new config should extend, not re-break, the URL scheme.

---

## 4. Making Changes

1. Create a branch: `feat/<slug>`, `fix/<slug>`, `docs/<slug>`, `chore/<slug>`.
2. Follow the [Development standards](Development):
   - `pnpm typecheck && pnpm build` pass.
   - Env vars reflected in `.env.example`, `wiki/Configuration.md`, `.agents/rules.md`, `AGENTS.md`.
   - Routes reflected in `wiki/API.md`.
3. Update documentation for anything user-facing (themes, env, endpoints, deployment).
4. Commit with the repo's emoji style — see [Code Review](Code-Review) and `.agents/rules.md`:
   ```
   ✨ Add /business-logout endpoint
   🐛 Fix restart backoff cap at 300s
   📝 Document public port masking
   ```
5. Open a Pull Request targeting `main`, describing what changed and how you verified it.

---

## 5. What We Look For in a PR

- Complete change: code + config + docs + agent rules in sync (the repo treats documentation as CI-critical).
- No unrelated reformatting or renames.
- Backwards-compatible or *documented-breaking* (update [Migration](Migration)).
- New env vars/endpoints are additive with sane defaults (e.g. missing `LAVA_PUBLIC_URL` defaults to internal).
- Tests/manual smoke steps included when behavior changes.

---

## 6. Style Pointers

- Imperative commit subjects ≤ ~70 chars, emoji-prefixed.
- Keep functions small, typed, and side-effect-light; thread state through `config`.
- Respect the two-network model — never reintroduce separate host/port/dashboard-URL variables.