# 🎨 Themes Guide

The dashboard ships with a theming system controlled by two environment variables: `DASHBOARD_THEME` (base look) and `DASHBOARD_COLOR_SCHEME` (accent color). Themes are pure CSS — every instance can restyle the dashboard without touching any markup.

---

## 🧩 Available Themes

| Theme | Env Value | Aliases | Default | Notes |
| :--- | :--- | :--- | :--- | :--- |
| Dark | `dark` | — | ✅ (default) | Dark, low-glare look with a moon icon |
| Light | `light` | — | | Bright, high-contrast look with a sun icon |
| Glassmorphism | `glassmorphism` | `glass` | | Frosted-glass translucent cards |
| Cyberpunk | `cyberpunk` | — | | Neon, high-energy palette |
| Dracula | `dracula` | — | | Dark purple-based palette with a skull icon |
| Nord | `nord` | — | | Arctic, muted palette with a snowflake icon |
| Emerald | `emerald` | — | | Rich green palette with a tree icon |

## 🎯 Color Schemes (Accents)

`DASHBOARD_COLOR_SCHEME` recolors the primary accent (buttons, links, charts) on top of the base theme.

| Scheme | Env Value | Aliases |
| :--- | :--- | :--- |
| Theme Default | `default` | — |
| Electric Cyan | `cyan` | `electric` |
| Amethyst Purple | `purple` | `amethyst` |
| Ocean Blue | `blue` | `ocean` |
| Emerald Green | `emerald` | `jade`, `green` |
| Rose Pink | `rose` | `pink`, `fuchsia` |
| Amber Gold | `amber` | `gold`, `yellow` |
| Indigo Violet | `indigo` | `violet` |
| Crimson Ruby | `crimson` | `ruby`, `red` |
| Teal Aqua | `teal` | `aqua` |
| Sunset Coral | `sunset` | `coral`, `orange` |

---

## ⚙️ Enabling and Configuring

1. Set the theme in `.env` (or your process environment):
   ```env
   DASHBOARD_THEME=cyberpunk
   DASHBOARD_COLOR_SCHEME=amber
   ```
2. Restart the server (dashboard theme is resolved on each page render, but restart keeps it consistent with the gateway server).
3. Unknown or misspelled values fall back to `dark` (theme) and `default` (scheme), so configuration errors never break the dashboard.

The theme engine lives in `src/pages/theme.ts`, with per-theme CSS in `src/pages/themes/*.js` and shared design tokens in `src/pages/themes/shared.js`.

---

## 🛠️ Creating a Custom Theme

1. Create a new file `src/pages/themes/mytheme.js` exporting a `CSS` string (follow the pattern of `dark.js` / `cyberpunk.js`).
2. Reuse the shared CSS variables defined in `src/pages/themes/shared.js` (`--primary`, `--bg`, `--card`, `--border`, `--text`, etc.) so color schemes keep working.
3. Register it in `src/pages/theme.ts` `getThemeInfo()` with an id, display name, and Font Awesome icon class.
4. Set `DASHBOARD_THEME=mytheme` in `.env`.

> **Note:** Keep custom themes scoped to the variables the dashboard actually uses (`status-card`, `stat-*`, `conn-card`, `code-block`, `masked-flag`, `btn`, `badge`, `section-title`). That way new dashboard components automatically pick up your theme.

---

## ✅ Common Configurations

- **Cyberpunk + Electric Cyan** — neon gaming aesthetic in a single step:
  ```env
  DASHBOARD_THEME=cyberpunk
  DASHBOARD_COLOR_SCHEME=cyan
  ```
- **Dark + Rose Pink** — subtle colored accent for a music-focused brand:
  ```env
  DASHBOARD_THEME=dark
  DASHBOARD_COLOR_SCHEME=rose
  ```
- **Light + Ocean Blue** — clean corporate dashboard:
  ```env
  DASHBOARD_THEME=light
  DASHBOARD_COLOR_SCHEME=blue
  ```

---

## 🐛 Troubleshooting

| Symptom | Fix |
| :--- | :--- |
| Theme doesn't change after editing `.env` | Restart the process; verify the value has no quotes/spaces and is lowercase |
| Unexpected fallback look | Misspelled theme — check against the tables above (falls back to `dark`/`default`) |
| Colors look wrong with a custom scheme | Custom themes must use the shared CSS variables from `themes/shared.js`; hardcoded colors bypass the scheme |
| Stale CSS in the browser | Hard-refresh (Ctrl/Cmd+Shift+R) to bust the cached stylesheet |

---

## 📐 Best Practices

- Always set both `DASHBOARD_THEME` and `DASHBOARD_COLOR_SCHEME` in `.env`, never rely on defaults in production.
- When updating the dashboard markup (new cards, badges), update all themes in the same change so none falls out of sync.
- Keep `shared.js` as the single source of truth for design tokens; drop new component classes as CSS-variable-agnostic styles first.

---

## 🐞 Reporting Theme Issues

- Report theme bugs and visual glitches at [GitHub Issues](https://github.com/HELIX-Origin/Lavalink-Server/issues) with: browser + OS, theme and scheme values, and a screenshot.
- Feature requests for new themes are welcome — describe the palette and the vibe you want.

---

## ❓ Theme FAQ

**Q: Can I apply a color scheme without changing the theme?**
Yes. Set only `DASHBOARD_COLOR_SCHEME` and keep `DASHBOARD_THEME` at your current value.

**Q: Are themes cached?**
The inline stylesheet is regenerated per render; only fonts and Font Awesome are fetched from CDNs.

**Q: Will themes work for every visitor?**
Yes — the theme is applied server-side and rendered into the HTML, so each visitor sees whatever is configured on the server.