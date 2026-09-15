import { renderPage } from './layout.js';
import { config } from '../config.js';
import { getThemeAndScheme } from './theme.js';

export function renderDashboardHtml(): string {
  const { theme } = getThemeAndScheme();
  const wsProto = config.secure ? 'wss' : 'ws';
  const wsUrl = `${wsProto}://${config.domain}${config.secure ? '' : `:${config.port}`}/v4/websocket`;
  const botPort = config.secure ? 443 : config.port;

  return renderPage('Dashboard', `
    <div class="card status-card">
      <div class="status-header">
        <div>
          <h2 class="section-title">Server Status</h2>
          <p class="section-desc">Node <span id="status-badge" class="badge badge-gray">checking…</span> <i class="${theme.icon}" style="color: var(--primary); margin-left: 0.25rem;"></i> ${theme.name}</p>
        </div>
        <div class="last-updated">Updated <span id="last-updated">—</span></div>
      </div>

      <div class="grid">
        <div class="stat">
          <span class="stat-icon">🎵</span>
          <span class="stat-label">Players</span>
          <span class="stat-value" id="stat-players">—</span>
        </div>
        <div class="stat">
          <span class="stat-icon">▶️</span>
          <span class="stat-label">Playing</span>
          <span class="stat-value" id="stat-playing">—</span>
        </div>
        <div class="stat">
          <span class="stat-icon">⏱️</span>
          <span class="stat-label">Uptime</span>
          <span class="stat-value" id="stat-uptime">—</span>
        </div>
        <div class="stat">
          <span class="stat-icon">🧠</span>
          <span class="stat-label">Memory</span>
          <span class="stat-value" id="stat-memory">—</span>
        </div>
        <div class="stat">
          <span class="stat-icon">⚙️</span>
          <span class="stat-label">CPU Load</span>
          <span class="stat-value" id="stat-cpu">—</span>
        </div>
        <div class="stat">
          <span class="stat-icon">🌐</span>
          <span class="stat-label">Frames Sent</span>
          <span class="stat-value" id="stat-frames">—</span>
        </div>
      </div>
    </div>

    <div class="card">
      <h2 class="section-title">Connection Details</h2>
      <p class="section-desc">Use these credentials to connect your Discord music bot.</p>
      <pre class="code-block">Host: <b>${config.domain}</b>
Port: <b>${botPort}</b>
Secure: <b>${config.secure}</b>
Password: <b><span id="oa-pass">••••••••</span></b> <button id="toggle-pass" class="btn btn-sm btn-ghost">Show</button>
WebSocket: ${wsUrl}</pre>
    </div>

    <div class="card">
      <h2 class="section-title">Recent Metrics</h2>
      <p class="section-desc">Player load over the last 30 snapshots.</p>
      <canvas id="metrics-chart" width="800" height="260"></canvas>
    </div>

    <style>
      .status-header {
        display: flex;
        flex-wrap: wrap;
        justify-content: space-between;
        align-items: flex-start;
        gap: 1rem;
        margin-bottom: 1.5rem;
      }

      .last-updated {
        font-size: 0.8125rem;
        color: var(--text-muted);
      }

      .grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
        gap: 1rem;
      }

      .stat {
        background: var(--card-inner);
        border: 1px solid var(--border);
        border-radius: 12px;
        padding: 1rem;
        display: flex;
        flex-direction: column;
        gap: 0.375rem;
      }

      .stat-icon { font-size: 1.25rem; }
      .stat-label {
        font-size: 0.75rem;
        text-transform: uppercase;
        letter-spacing: 0.05em;
        color: var(--text-muted);
      }
      .stat-value {
        font-family: 'JetBrains Mono', monospace;
        font-size: 1.5rem;
        font-weight: 600;
        color: var(--text);
      }

      .code-block {
        background: var(--card-inner);
        border: 1px solid var(--border);
        border-radius: 12px;
        padding: 1.25rem;
        overflow-x: auto;
        font-family: 'JetBrains Mono', monospace;
        font-size: 0.875rem;
        color: var(--text);
      }
      .code-block b { color: var(--primary); }

      canvas { max-width: 100%; }
    </style>

    <script>
      const state = {
        status: 'checking',
        stats: null,
        metrics: []
      };

      async function fetchJSON(url) {
        const res = await fetch(url);
        if (!res.ok) throw new Error('HTTP ' + res.status);
        return res.json();
      }

      function formatUptime(ms) {
        const s = Math.floor(ms / 1000);
        const d = Math.floor(s / 86400);
        const h = Math.floor((s % 86400) / 3600);
        const m = Math.floor((s % 3600) / 60);
        if (d > 0) return d + 'd ' + h + 'h';
        if (h > 0) return h + 'h ' + m + 'm';
        return m + 'm ' + (s % 60) + 's';
      }

      function formatBytes(bytes) {
        if (!bytes && bytes !== 0) return '—';
        const mb = bytes / (1024 * 1024);
        if (mb >= 1024) return (mb / 1024).toFixed(2) + ' GB';
        return mb.toFixed(1) + ' MB';
      }

      function setBadge(status) {
        const el = document.getElementById('status-badge');
        if (!el) return;
        el.className = 'badge badge-' + (status || 'gray');
        el.textContent = status || 'unknown';
      }

      async function refreshStatus() {
        try {
          const data = await fetchJSON('/api/status');
          state.status = data.status || 'unknown';
          state.stats = data.stats || {};
          setBadge(state.status);

          const st = state.stats;
          document.getElementById('stat-players').textContent = st.players ?? 0;
          document.getElementById('stat-playing').textContent = st.playingPlayers ?? 0;
          document.getElementById('stat-uptime').textContent = st.uptime ? formatUptime(st.uptime) : '—';
          document.getElementById('stat-memory').textContent = st.memory ? (formatBytes(st.memory.used) + ' / ' + formatBytes(st.memory.allocated)) : '—';
          document.getElementById('stat-cpu').textContent = st.cpu ? ((st.cpu.lavalinkLoad * 100).toFixed(1) + '%') : '—';
          document.getElementById('stat-frames').textContent = st.frames?.sent ?? '—';
          document.getElementById('last-updated').textContent = new Date().toLocaleTimeString();

        } catch (err) {
          setBadge('red');
          document.getElementById('last-updated').textContent = 'error';
        }
      }

      async function refreshMetrics() {
        try {
          const data = await fetchJSON('/api/metrics');
          state.metrics = Array.isArray(data) ? data : [];
          renderChart(state.metrics);
        } catch { /* ignore */ }
      }

      function renderChart(metrics) {
        const canvas = document.getElementById('metrics-chart');
        if (!canvas || !metrics || metrics.length < 2) return;
        const ctx = canvas.getContext('2d');
        const width = canvas.width, height = canvas.height;
        const primary = getComputedStyle(document.documentElement).getPropertyValue('--primary').trim() || '#06b6d4';

        ctx.clearRect(0, 0, width, height);
        ctx.font = '12px JetBrains Mono, monospace';
        ctx.strokeStyle = getComputedStyle(document.documentElement).getPropertyValue('--border').trim() || 'rgba(255,255,255,0.15)';

        // Grid lines
        for (let i = 0; i <= 4; i++) {
          const y = 20 + (height - 40) * (i / 4);
          ctx.beginPath();
          ctx.moveTo(60, y);
          ctx.lineTo(width - 20, y);
          ctx.stroke();
        }

        const players = metrics.map(m => m.players || 0);
        const maxPlayers = Math.max(10, ...players);
        const step = (width - 80) / Math.max(metrics.length - 1, 1);

        // Players line
        ctx.beginPath();
        ctx.strokeStyle = primary;
        ctx.lineWidth = 2;
        players.forEach((val, i) => {
          const x = 60 + i * step;
          const y = height - 20 - (val / maxPlayers) * (height - 60);
          if (i === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        });
        ctx.stroke();

        // Fill under line
        const gradient = ctx.createLinearGradient(0, 20, 0, height - 20);
        gradient.addColorStop(0, primary + '33');
        gradient.addColorStop(1, 'transparent');
        ctx.lineTo(60 + (metrics.length - 1) * step, height - 20);
        ctx.lineTo(60, height - 20);
        ctx.closePath();
        ctx.fillStyle = gradient;
        ctx.fill();
      }

      document.getElementById('toggle-pass').addEventListener('click', () => {
        const el = document.getElementById('oa-pass');
        const btn = document.getElementById('toggle-pass');
        if (btn.textContent === 'Show') {
          el.textContent = '${config.pass}';
          btn.textContent = 'Hide';
        } else {
          el.textContent = '••••••••';
          btn.textContent = 'Show';
        }
      });

      refreshStatus();
      refreshMetrics();
      setInterval(refreshStatus, 5000);
      setInterval(refreshMetrics, 30000);
    </script>
  `);
}