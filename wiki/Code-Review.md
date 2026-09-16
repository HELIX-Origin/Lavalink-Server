# ✅ Code Review & Approval

How contributions are evaluated and merged into the main codebase.

---

## 1. Review Process

1. **Submit** — a PR targets `main` and passes `pnpm typecheck && pnpm build`.
2. **CI-style gates** (manual, since no CI is configured yet):
   - Build + typecheck green.
   - `.env.example` matches `src/config.ts` exactly.
   - Docs updated (README, wiki pages touched by the change, `.agents/rules.md` if env/routes changed).
   - No deprecated/removed keys or features referenced.
3. **Human review** — maintainers review commits (not just the diff): logic, security (secrets, auth, masking), performance, and docs accuracy.
4. **Discussion / requested changes** — address inline comments, push fixes as new commits (no force-push, no amend) unless the maintainer asks otherwise.
5. **Approval + squash-merge** — one mergeable commit on `main` keeps history readable. Each merged change may get a changelog entry (see [Versioning](Versioning)).

---

## 2. What Reviewers Check

### Correctness
- Behavior matches the issue / proposed design.
- Edge cases: empty env values, invalid ports, `0.0.0.0` binding, missing `Lavalink.jar`, network-partitioned node.
- Concurrency: timers (SSE, polling, keepalive), restart backoff, graceful shutdown order.

### Security
- No secrets in code, docs, or logs.
- Public surface audited: `/dashboard`, `/health`, OAuth endpoints, WS upgrade paths.
- Correct use of `Authorization`, masking, and `X-Forwarded-For`.

### Consistency
- Env naming follows the new scheme (URL/WS pairs; no `LAVA_DOMAIN`-isms).
- Routes use documented prefixes (`/dashboard`, `/server`, `/v4`).
- Config flows through `ServerConfig`; no hardcoded hosts/ports.
- Errors are descriptive and use `LavalinkConfigError` where config-related.

### Docs
- Every env var/endpoint change mirrors into wiki pages + agent rules + README.
- Migration notes added for breaking changes.

---

## 3. Definition of Done

- [ ] `pnpm typecheck` passes
- [ ] `pnpm build` produces a clean `dist/`
- [ ] Manual smoke test performed (standalone or embedded, as applicable)
- [ ] Docs + agent rules in sync; removed keys purged everywhere
- [ ] Emoji-prefixed commit message, conventional-scoped subject
- [ ] No secrets committed; `.env` untouched
- [ ] Reviewer approval recorded

---

## 4. Merge & Afterward

- Merge to `main` as a squashed commit.
- Tag new versions per [Versioning](Versioning).
- Update the wiki `Home` TOC if the page list changed.
- Notify contributors of decisions via the PR thread. Keep the [FAQ](FAQ) updated for common ask/feedback loops.