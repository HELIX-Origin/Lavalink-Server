import { config } from '../config.js';
import { getThemeAndScheme, getThemeCss, getBaseStyles } from './theme.js';

export function renderPage(title: string, content: string): string {
  const { theme, colorScheme } = getThemeAndScheme();
  const wsProto = config.secure ? 'wss' : 'ws';
  const wsUrl = `${wsProto}://${config.domain}${config.secure ? '' : `:${config.port}`}/v4/websocket`;

  return `<!DOCTYPE html>
<html lang="en" class="${theme.id} scheme-${colorScheme.id}">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title} — Lavalink v4 Audio Node</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=JetBrains+Mono:wght@400;500;600&display=swap" rel="stylesheet">
  <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.6.0/css/all.min.css">
  <style>
    ${getThemeCss()}
    ${getBaseStyles()}

    body {
      padding: 2rem 1.5rem;
      line-height: 1.5;
    }

    .container {
      max-width: 900px;
      margin: 0 auto;
      width: 100%;
      flex: 1;
    }

    header {
      display: flex;
      flex-wrap: wrap;
      justify-content: space-between;
      align-items: center;
      gap: 1.5rem;
      margin-bottom: 2rem;
      padding-bottom: 1.5rem;
      border-bottom: 1px solid var(--border);
    }

    .brand {
      display: flex;
      align-items: center;
      gap: 1rem;
    }

    .brand-icon {
      width: 48px;
      height: 48px;
      border-radius: 12px;
      background: linear-gradient(135deg, var(--primary), var(--primary-hover));
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 1.5rem;
      box-shadow: 0 4px 20px var(--primary-bg);
    }

    .brand h1 {
      font-size: 1.5rem;
      font-weight: 800;
      letter-spacing: -0.02em;
      color: var(--text);
    }

    .brand p {
      font-size: 0.875rem;
      color: var(--text-muted);
    }

    nav {
      display: flex;
      gap: 0.5rem;
    }

    nav a {
      color: var(--text-muted);
      text-decoration: none;
      font-size: 0.875rem;
      font-weight: 500;
      padding: 0.375rem 0.75rem;
      border-radius: 8px;
      transition: color 0.15s ease, background-color 0.15s ease;
    }

    nav a:hover {
      color: var(--text);
      background-color: var(--card-inner);
    }

    main { flex: 1; }

    .card { margin-bottom: 2rem; }

    footer {
      text-align: center;
      margin-top: 3rem;
      font-size: 0.8125rem;
      color: var(--text-muted);
      border-top: 1px solid var(--border);
      padding-top: 1.5rem;
    }

    footer a {
      color: var(--primary);
      text-decoration: none;
    }

    footer a:hover {
      text-decoration: underline;
    }

    code {
      font-family: 'JetBrains Mono', monospace;
      background: var(--card-inner);
      padding: 0.125rem 0.375rem;
      border-radius: 6px;
      font-size: 0.875em;
      color: var(--text);
      border: 1px solid var(--border);
    }
  </style>
</head>
<body>
  <div class="container">
    <header>
      <div class="brand">
        <div class="brand-icon">🔊</div>
        <div>
          <h1>Lavalink v4 Audio Node</h1>
          <p>Public Audio Gateway &bull; High-Performance Audio Streaming</p>
        </div>
      </div>
      <nav>
        <a href="/">Dashboard</a>
        <a href="/docs">Docs</a>
        <a href="/privacy">Privacy</a>
        <a href="/tos">Terms</a>
      </nav>
    </header>

    <main>
      ${content}
    </main>

    <footer>
      Lavalink v4 Public Audio Server &bull; Maintained by <a href="https://github.com/HELIX-Origin" target="_blank">HELIX Origin</a> &bull; WebSocket: <code>${wsUrl}</code>
    </footer>
  </div>
</body>
</html>`;
}