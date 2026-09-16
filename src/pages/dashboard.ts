import { renderPage } from './layout.js';
import { getThemeAndScheme } from './theme.js';

export function renderDashboardHtml(): string {
  const { theme } = getThemeAndScheme();

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

    <div class="conn-grid">
      <div class="card conn-card">
        <h2 class="section-title title-internal"><i class="fas fa-server"></i> Internal Network</h2>
        <p class="section-desc">Direct connection to the Lavalink node. Use this when your bot runs on the same private network as the server.</p>
        <pre class="code-block">Host: <b id="int-host">—</b>
Port: <b id="int-port">—</b>
URL: <b id="int-url">—</b>
WebSocket: <b id="int-ws">—</b>
</pre>
      </div>

      <div class="card conn-card">
        <h2 class="section-title title-public"><i class="fas fa-globe"></i> Public Network</h2>
        <p class="section-desc">Public connection for external bots. When hosting behind a reverse proxy or Cloudflare tunnel the port is masked.</p>
        <div class="masked-flag" id="pub-masked"><i class="fas fa-cloud"></i><span>Port masked — Reverse proxy</span></div>
        <pre class="code-block">Host: <b id="pub-host">—</b>
Port: <b id="pub-port">—</b>
URL: <b id="pub-url">—</b>
WebSocket: <b id="pub-ws">—</b>
Secure: <b id="pub-secure">—</b>
Password: <b><span id="oa-pass">••••••••</span></b> <button id="toggle-pass" class="btn btn-sm btn-ghost">Show</button>
</pre>
      </div>
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

      .conn-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(340px, 1fr));
        gap: 1rem;
        margin-bottom: 2rem;
      }

      .title-internal { color: var(--primary); }
      .title-public { color: var(--primary-hover); }

      .masked-flag {
        display: inline-flex;
        align-items: center;
        gap: 0.5rem;
        font-size: 0.75rem;
        font-weight: 600;
        padding: 0.25rem 0.625rem;
        border-radius: 999px;
        color: var(--text);
        background: var(--card-inner);
        border: 1px solid var(--border);
        margin-top: 0.25rem;
      }
      .masked-flag i { color: var(--primary); }

      .code-block {
        background: var(--card-inner);
        border: 1px solid var(--border);
        border-radius: 12px;
        padding: 1.25rem;
        overflow-x: auto;
        font-family: 'JetBrains Mono', monospace;
        font-size: 0.875rem;
        color: var(--text);
        margin-top: 1rem;
      }
      .code-block b { color: var(--primary); }

      canvas { max-width: 100%; }
    </style>

    <script>
      const state = {
        status: 'checking',
        stats: null,
        connection: null
      };
      let sseAvailable = true;

      async function fetchJSON(url) {
        const res = await fetch(url);
        if (!res.ok) throw new Error('HTTP ' + res.status);
        return res.json();
      }

      function formatUptime(ms) {
        if (!ms && ms !== 0) return '—';
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

      function renderConnection(conn) {
        if (!conn) return;
        const int = conn.internal || {};
        const pub = conn.public || {};

        document.getElementById('int-host').textContent = int.host || '—';
        document.getElementById('int-port').textContent = int.port ?? '—';
        document.getElementById('int-url').textContent = int.url || '—';
        document.getElementById('int-ws').textContent = int.websocketUri || '—';

        document.getElementById('pub-host').textContent = pub.host || '—';
        document.getElementById('pub-port').textContent = pub.port ?? '—';
        document.getElementById('pub-url').textContent = pub.url || '—';
        document.getElementById('pub-ws').textContent = pub.websocketUri || '—';
        document.getElementById('pub-secure').textContent = pub.secure ? 'true' : 'false';

        const flag = document.getElementById('pub-masked');
        const flagText = flag?.querySelector('span');
        if (flagText) {
          const type = String(pub.proxyType || '').trim();
          flagText.textContent = type
            ? 'Port masked — ' + type.charAt(0).toUpperCase() + type.slice(1)
            : 'Port masked — Reverse proxy';
        }
        if (flag && pub.portMasked) flag.style.display = 'inline-flex';
        if (flag && !pub.portMasked) flag.style.display = 'none';

        if (document.getElementById('oa-pass').dataset.loaded !== '1' && pub.password) {
          document.getElementById('oa-pass').dataset.password = pub.password;
          document.getElementById('oa-pass').dataset.loaded = '1';
        }
      }

      async function refreshStatus() {
        try {
          const data = await fetchJSON('/dashboard/api/status');
          state.status = data.status || 'unknown';
          state.stats = data.stats || {};
          state.connection = data.connection || null;
          setBadge(state.status);

          const st = state.stats;
          document.getElementById('stat-players').textContent = st.players ?? 0;
          document.getElementById('stat-playing').textContent = st.playingPlayers ?? 0;
          document.getElementById('stat-uptime').textContent = formatUptime(st.uptime);
          document.getElementById('stat-memory').textContent = st.memory ? (formatBytes(st.memory.used) + ' / ' + formatBytes(st.memory.allocated)) : '—';
          document.getElementById('stat-cpu').textContent = st.cpu ? ((st.cpu.lavalinkLoad * 100).toFixed(1) + '%') : '—';
          document.getElementById('stat-frames').textContent = st.frames?.sent ?? '—';
          document.getElementById('last-updated').textContent = new Date().toLocaleTimeString();

          renderConnection(state.connection);
        } catch (err) {
          setBadge('red');
          document.getElementById('last-updated').textContent = 'error';
        }
      }

      async function refreshMetrics() {
        try {
          const data = await fetchJSON('/dashboard/api/metrics');
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
          el.textContent = el.dataset.password || '—';
          btn.textContent = 'Hide';
        } else {
          el.textContent = '••••••••';
          btn.textContent = 'Show';
        }
      });

      // Real-time connection updates via SSE, falling back to polling
      function connectEvents() {
        try {
          const es = new EventSource('/dashboard/api/events');
          es.addEventListener('connection', (e) => {
            try {
              renderConnection(JSON.parse(e.data));
            } catch { /* ignore malformed */ }
          });
          es.onerror = () => {
            es.close();
            sseAvailable = false;
          };
        } catch {
          sseAvailable = false;
        }
      }

      if (typeof EventSource !== 'undefined') connectEvents();

      refreshStatus();
      refreshMetrics();
      setInterval(refreshStatus, 5000);
      setInterval(refreshMetrics, 30000);
      setInterval(() => { if (!sseAvailable) refreshStatus(); }, 5000);
    </script>
  `);
}