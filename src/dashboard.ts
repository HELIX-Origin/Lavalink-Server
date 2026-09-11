import { config } from './config.js';

export function renderDashboardHtml(): string {
  const isSsl = config.domain !== 'localhost';
  const botPort = isSsl ? 443 : config.port;
  const botSecure = isSsl ? 'true' : 'false';

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Lavalink v4 Cloud Audio Node — Dashboard</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=JetBrains+Mono:wght@400;500;600&display=swap" rel="stylesheet">
  <style>
    :root {
      --bg: #090d16;
      --card-bg: rgba(17, 24, 39, 0.75);
      --card-border: rgba(255, 255, 255, 0.08);
      --primary: #06b6d4;
      --primary-glow: rgba(6, 182, 212, 0.25);
      --accent: #8b5cf6;
      --accent-glow: rgba(139, 92, 246, 0.25);
      --success: #10b981;
      --success-glow: rgba(16, 185, 129, 0.25);
      --warning: #f59e0b;
      --danger: #ef4444;
      --text-main: #f3f4f6;
      --text-muted: #9ca3af;
      --code-bg: #030712;
    }

    * {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
    }

    body {
      font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
      background-color: var(--bg);
      background-image: 
        radial-gradient(at 0% 0%, rgba(139, 92, 246, 0.12) 0px, transparent 50%),
        radial-gradient(at 100% 0%, rgba(6, 182, 212, 0.12) 0px, transparent 50%),
        radial-gradient(at 50% 100%, rgba(16, 185, 129, 0.08) 0px, transparent 50%);
      background-attachment: fixed;
      color: var(--text-main);
      min-height: 100vh;
      padding: 2rem 1.5rem;
      line-height: 1.5;
    }

    .container {
      max-width: 1200px;
      margin: 0 auto;
    }

    header {
      display: flex;
      flex-wrap: wrap;
      justify-content: space-between;
      align-items: center;
      gap: 1.5rem;
      margin-bottom: 2rem;
      padding-bottom: 1.5rem;
      border-bottom: 1px solid var(--card-border);
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
      background: linear-gradient(135deg, var(--primary), var(--accent));
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 1.5rem;
      box-shadow: 0 0 20px var(--primary-glow);
    }

    .brand h1 {
      font-size: 1.5rem;
      font-weight: 800;
      letter-spacing: -0.02em;
      background: linear-gradient(135deg, #fff 40%, var(--primary));
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
    }

    .brand p {
      font-size: 0.875rem;
      color: var(--text-muted);
    }

    .status-badge {
      display: inline-flex;
      align-items: center;
      gap: 0.5rem;
      padding: 0.5rem 1rem;
      border-radius: 9999px;
      font-size: 0.875rem;
      font-weight: 600;
      background: var(--card-bg);
      border: 1px solid var(--card-border);
      backdrop-filter: blur(12px);
    }

    .status-dot {
      width: 10px;
      height: 10px;
      border-radius: 50%;
      background: var(--warning);
      box-shadow: 0 0 10px var(--warning);
      transition: all 0.3s ease;
    }

    .status-dot.online {
      background: var(--success);
      box-shadow: 0 0 12px var(--success);
      animation: pulse 2s infinite;
    }

    .status-dot.offline {
      background: var(--danger);
      box-shadow: 0 0 10px var(--danger);
    }

    @keyframes pulse {
      0% { transform: scale(0.95); opacity: 0.8; }
      50% { transform: scale(1.15); opacity: 1; }
      100% { transform: scale(0.95); opacity: 0.8; }
    }

    .grid-stats {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
      gap: 1.25rem;
      margin-bottom: 2rem;
    }

    .card {
      background: var(--card-bg);
      border: 1px solid var(--card-border);
      border-radius: 16px;
      padding: 1.25rem 1.5rem;
      backdrop-filter: blur(12px);
      box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
      position: relative;
      overflow: hidden;
      transition: transform 0.2s ease, border-color 0.2s ease;
    }

    .card:hover {
      transform: translateY(-2px);
      border-color: rgba(255, 255, 255, 0.15);
    }

    .card-label {
      font-size: 0.8125rem;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      color: var(--text-muted);
      margin-bottom: 0.5rem;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    .card-value {
      font-size: 1.875rem;
      font-weight: 800;
      letter-spacing: -0.03em;
      color: #fff;
    }

    .card-subtext {
      font-size: 0.8125rem;
      color: var(--text-muted);
      margin-top: 0.375rem;
    }

    .progress-bar {
      height: 6px;
      background: rgba(255, 255, 255, 0.08);
      border-radius: 9999px;
      margin-top: 0.75rem;
      overflow: hidden;
    }

    .progress-fill {
      height: 100%;
      background: linear-gradient(90deg, var(--primary), var(--accent));
      width: 0%;
      border-radius: 9999px;
      transition: width 0.4s ease;
    }

    .main-grid {
      display: grid;
      grid-template-columns: 1.2fr 1fr;
      gap: 1.5rem;
      margin-bottom: 2rem;
    }

    @media (max-width: 900px) {
      .main-grid {
        grid-template-columns: 1fr;
      }
    }

    .section-title {
      font-size: 1.125rem;
      font-weight: 700;
      margin-bottom: 1rem;
      display: flex;
      align-items: center;
      gap: 0.5rem;
    }

    .config-box {
      background: var(--code-bg);
      border: 1px solid var(--card-border);
      border-radius: 12px;
      padding: 1.25rem;
      position: relative;
    }

    .config-code {
      font-family: 'JetBrains Mono', monospace;
      font-size: 0.8125rem;
      color: #e5e7eb;
      white-space: pre-wrap;
      word-break: break-all;
      line-height: 1.7;
    }

    .config-code .key { color: var(--primary); }
    .config-code .val { color: #34d399; }
    .config-code .comment { color: #6b7280; font-style: italic; }

    .copy-btn {
      position: absolute;
      top: 0.75rem;
      right: 0.75rem;
      background: rgba(255, 255, 255, 0.1);
      border: 1px solid var(--card-border);
      color: #fff;
      padding: 0.375rem 0.75rem;
      border-radius: 8px;
      font-size: 0.75rem;
      font-weight: 600;
      cursor: pointer;
      display: flex;
      align-items: center;
      gap: 0.375rem;
      transition: all 0.2s ease;
    }

    .copy-btn:hover {
      background: var(--primary);
      color: #000;
    }

    .info-list {
      display: flex;
      flex-direction: column;
      gap: 0.75rem;
    }

    .info-item {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 0.75rem 1rem;
      background: rgba(0, 0, 0, 0.2);
      border-radius: 8px;
      border: 1px solid var(--card-border);
      font-size: 0.875rem;
    }

    .info-key {
      color: var(--text-muted);
      font-weight: 500;
    }

    .info-val {
      font-family: 'JetBrains Mono', monospace;
      font-weight: 600;
      color: #fff;
    }

    .logs-card {
      margin-top: 1.5rem;
    }

    .log-viewport {
      background: var(--code-bg);
      border: 1px solid var(--card-border);
      border-radius: 12px;
      height: 220px;
      overflow-y: auto;
      padding: 1rem;
      font-family: 'JetBrains Mono', monospace;
      font-size: 0.75rem;
      color: #94a3b8;
      display: flex;
      flex-direction: column-reverse;
    }

    .log-line {
      line-height: 1.6;
      white-space: pre-wrap;
      word-break: break-all;
    }

    footer {
      text-align: center;
      margin-top: 3rem;
      font-size: 0.8125rem;
      color: var(--text-muted);
      border-top: 1px solid var(--card-border);
      padding-top: 1.5rem;
    }

    footer a {
      color: var(--primary);
      text-decoration: none;
    }

    footer a:hover {
      text-decoration: underline;
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
          <p>Managed Node &bull; HELIX Origin Cloud Architecture</p>
        </div>
      </div>
      <div class="status-badge">
        <span class="status-dot" id="status-dot"></span>
        <span id="status-text">INITIALIZING</span>
      </div>
    </header>

    <div class="grid-stats">
      <div class="card">
        <div class="card-label">Active Players</div>
        <div class="card-value" id="val-players">0</div>
        <div class="card-subtext"><span id="val-playing">0</span> playing audio</div>
      </div>

      <div class="card">
        <div class="card-label">JVM Heap Memory</div>
        <div class="card-value" id="val-ram">0 MB</div>
        <div class="card-subtext">of <span id="val-ram-total">512 MB</span> allocated</div>
        <div class="progress-bar">
          <div class="progress-fill" id="bar-ram"></div>
        </div>
      </div>

      <div class="card">
        <div class="card-label">System CPU Load</div>
        <div class="card-value" id="val-cpu">0.0%</div>
        <div class="card-subtext">Lavalink: <span id="val-cpu-lava">0.0%</span></div>
        <div class="progress-bar">
          <div class="progress-fill" id="bar-cpu"></div>
        </div>
      </div>

      <div class="card">
        <div class="card-label">Node Uptime</div>
        <div class="card-value" id="val-uptime">0m</div>
        <div class="card-subtext">Supervisor running</div>
      </div>
    </div>

    <div class="main-grid">
      <div class="card">
        <div class="section-title">🤖 Connect Your Discord Bot (e.g. Master-Bot)</div>
        <p style="font-size: 0.875rem; color: var(--text-muted); margin-bottom: 1rem;">
          Add these exact variables to your bot's <code>.env</code> file (or cloud dashboard):
        </p>
        <div class="config-box">
          <button class="copy-btn" onclick="copyConfig()">Copy</button>
          <div class="config-code" id="config-env-code"><span class="comment"># Master-Bot Lavalink Node Config</span>
<span class="key">LAVA_ENABLED</span>=<span class="val">true</span>
<span class="key">LAVA_EXTERNAL</span>=<span class="val">true</span>
<span class="key">LAVA_HOST</span>=<span class="val">"${config.domain}"</span>
<span class="key">LAVA_PORT</span>=<span class="val">${botPort}</span>
<span class="key">LAVA_PASS</span>=<span class="val">"${config.lavalinkPass}"</span>
<span class="key">LAVA_SECURE</span>=<span class="val">${botSecure}</span></div>
        </div>
      </div>

      <div class="card">
        <div class="section-title">🌐 Host & Network Topology</div>
        <div class="info-list">
          <div class="info-item">
            <span class="info-key">Resolved Host Domain</span>
            <span class="info-val">${config.domain}</span>
          </div>
          <div class="info-item">
            <span class="info-key">Public Gateway Port</span>
            <span class="info-val">${config.port}</span>
          </div>
          <div class="info-item">
            <span class="info-key">Internal Node Port</span>
            <span class="info-val">127.0.0.1:${config.lavalinkPort}</span>
          </div>
          <div class="info-item">
            <span class="info-key">WebSocket Endpoint</span>
            <span class="info-val">/v4/websocket</span>
          </div>
          <div class="info-item">
            <span class="info-key">Persistence Engine</span>
            <span class="info-val">SQLite WAL + ioredis-mock</span>
          </div>
        </div>
      </div>
    </div>

    <div class="card logs-card">
      <div class="section-title">📜 Node Event Stream</div>
      <div class="log-viewport" id="log-viewport">
        <div class="log-line">Waiting for events...</div>
      </div>
    </div>

    <footer>
      Lavalink v4 Cloud Audio Server &bull; Maintained by <a href="https://github.com/HELIX-Origin" target="_blank">HELIX Origin</a> &bull; Powered by ESM TypeScript
    </footer>
  </div>

  <script>
    function copyConfig() {
      const code = document.getElementById('config-env-code').innerText;
      navigator.clipboard.writeText(code).then(() => {
        const btn = document.querySelector('.copy-btn');
        btn.innerText = 'Copied!';
        setTimeout(() => btn.innerText = 'Copy', 2000);
      });
    }

    function formatUptime(seconds) {
      if (!seconds || seconds <= 0) return '0m';
      const d = Math.floor(seconds / (3600 * 24));
      const h = Math.floor((seconds % (3600 * 24)) / 3600);
      const m = Math.floor((seconds % 3600) / 60);
      const s = Math.floor(seconds % 60);
      if (d > 0) return \`\${d}d \${h}h\`;
      if (h > 0) return \`\${h}h \${m}m\`;
      return \`\${m}m \${s}s\`;
    }

    async function pollStatus() {
      try {
        const res = await fetch('/api/status');
        if (!res.ok) return;
        const data = await res.json();

        // Status badge
        const dot = document.getElementById('status-dot');
        const text = document.getElementById('status-text');
        dot.className = 'status-dot ' + (data.status === 'online' ? 'online' : (data.status === 'offline' ? 'offline' : ''));
        text.innerText = (data.status || 'starting').toUpperCase();

        // Metrics
        const stats = data.stats || {};
        const mem = stats.memory || {};
        const cpu = stats.cpu || {};

        document.getElementById('val-players').innerText = stats.players || 0;
        document.getElementById('val-playing').innerText = stats.playingPlayers || 0;
        document.getElementById('val-uptime').innerText = formatUptime(Math.floor((stats.uptime || 0) / 1000));

        // Memory
        const usedMb = Math.round((mem.used || 0) / (1024 * 1024));
        const allocMb = Math.round((mem.allocated || 0) / (1024 * 1024)) || 512;
        document.getElementById('val-ram').innerText = usedMb + ' MB';
        document.getElementById('val-ram-total').innerText = allocMb + ' MB';
        const ramPct = Math.min(Math.round((usedMb / allocMb) * 100), 100);
        document.getElementById('bar-ram').style.width = ramPct + '%';

        // CPU
        const sysCpu = Math.round((cpu.systemLoad || 0) * 1000) / 10;
        const lavaCpu = Math.round((cpu.lavalinkLoad || 0) * 1000) / 10;
        document.getElementById('val-cpu').innerText = sysCpu + '%';
        document.getElementById('val-cpu-lava').innerText = lavaCpu + '%';
        document.getElementById('bar-cpu').style.width = Math.min(sysCpu, 100) + '%';

        // Logs
        if (Array.isArray(data.logs) && data.logs.length > 0) {
          const logBox = document.getElementById('log-viewport');
          logBox.innerHTML = data.logs.map(line => \`<div class="log-line">\${escapeHtml(line)}</div>\`).join('');
        }
      } catch (err) {
        console.error('Failed to poll status', err);
      }
    }

    function escapeHtml(str) {
      return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
    }

    setInterval(pollStatus, 3000);
    pollStatus();
  </script>
</body>
</html>`;
}
