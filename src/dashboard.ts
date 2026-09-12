import { config } from './config.js';

export function renderDashboardHtml(): string {
  const isSsl = config.domain !== 'localhost';
  const botPort = isSsl ? 443 : config.port;
  const botSecure = isSsl ? 'true' : 'false';
  const wsProto = isSsl ? 'wss' : 'ws';
  const wsUrl = `${wsProto}://${config.domain}${isSsl ? '' : `:${config.port}`}/v4/websocket`;

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Lavalink v4 Audio Node — Public Gateway & Dashboard</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=JetBrains+Mono:wght@400;500;600&display=swap" rel="stylesheet">
  <style>
    :root {
      --bg: #090d16;
      --card-bg: rgba(17, 24, 39, 0.78);
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
        radial-gradient(at 0% 0%, rgba(139, 92, 246, 0.14) 0px, transparent 50%),
        radial-gradient(at 100% 0%, rgba(6, 182, 212, 0.14) 0px, transparent 50%),
        radial-gradient(at 50% 100%, rgba(16, 185, 129, 0.1) 0px, transparent 50%);
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

    .header-actions {
      display: flex;
      align-items: center;
      gap: 1rem;
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

    .btn-auth {
      background: rgba(255, 255, 255, 0.08);
      border: 1px solid var(--card-border);
      color: #fff;
      padding: 0.5rem 1rem;
      border-radius: 9999px;
      font-size: 0.8125rem;
      font-weight: 600;
      cursor: pointer;
      display: flex;
      align-items: center;
      gap: 0.5rem;
      transition: all 0.2s ease;
      backdrop-filter: blur(12px);
    }

    .btn-auth:hover {
      background: rgba(255, 255, 255, 0.16);
      border-color: rgba(255, 255, 255, 0.25);
    }

    .btn-auth.active {
      background: rgba(139, 92, 246, 0.2);
      border-color: var(--accent);
      color: #c4b5fd;
    }

    .grid-stats {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
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
      font-size: 1.75rem;
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
      grid-template-columns: 1.25fr 1fr;
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

    .badge-public {
      background: rgba(16, 185, 129, 0.15);
      border: 1px solid var(--success);
      color: #6ee7b7;
      font-size: 0.7rem;
      font-weight: 700;
      padding: 0.15rem 0.5rem;
      border-radius: 9999px;
      text-transform: uppercase;
      letter-spacing: 0.05em;
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

    /* Admin Secure Section */
    .owner-section {
      margin-top: 2rem;
    }

    .owner-locked-banner {
      background: rgba(17, 24, 39, 0.6);
      border: 1px dashed rgba(255, 255, 255, 0.15);
      border-radius: 16px;
      padding: 2.5rem 1.5rem;
      text-align: center;
    }

    .owner-locked-banner h3 {
      font-size: 1.125rem;
      margin-bottom: 0.5rem;
      color: #f3f4f6;
    }

    .owner-locked-banner p {
      font-size: 0.875rem;
      color: var(--text-muted);
      max-width: 500px;
      margin: 0 auto 1.25rem;
    }

    .owner-toolbar {
      display: flex;
      flex-wrap: wrap;
      gap: 0.75rem;
      margin-bottom: 1rem;
      align-items: center;
      justify-content: space-between;
    }

    .action-btn {
      background: rgba(255, 255, 255, 0.08);
      border: 1px solid var(--card-border);
      color: #fff;
      padding: 0.5rem 1rem;
      border-radius: 8px;
      font-size: 0.8125rem;
      font-weight: 600;
      cursor: pointer;
      display: inline-flex;
      align-items: center;
      gap: 0.5rem;
      transition: all 0.2s ease;
    }

    .action-btn:hover {
      background: var(--primary);
      color: #000;
    }

    .action-btn.danger:hover {
      background: var(--danger);
      color: #fff;
    }

    .log-viewport {
      background: var(--code-bg);
      border: 1px solid var(--card-border);
      border-radius: 12px;
      height: 280px;
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

    /* YouTube OAuth Panel */
    .oauth-panel {
      background: rgba(0, 0, 0, 0.25);
      border: 1px solid var(--card-border);
      border-radius: 12px;
      padding: 1.25rem;
      margin-bottom: 1.25rem;
    }

    .oauth-header {
      display: flex;
      flex-wrap: wrap;
      justify-content: space-between;
      align-items: center;
      gap: 0.75rem;
      margin-bottom: 0.5rem;
    }

    .oauth-title {
      font-size: 0.9375rem;
      font-weight: 700;
      display: flex;
      align-items: center;
      gap: 0.5rem;
    }

    .badge-oauth {
      font-size: 0.7rem;
      font-weight: 700;
      padding: 0.2rem 0.6rem;
      border-radius: 9999px;
      text-transform: uppercase;
      letter-spacing: 0.04em;
    }

    .badge-oauth.authorized {
      background: rgba(16, 185, 129, 0.15);
      border: 1px solid var(--success);
      color: #6ee7b7;
    }

    .badge-oauth.pending {
      background: rgba(6, 182, 212, 0.15);
      border: 1px solid var(--primary);
      color: #38bdf8;
      animation: pulse 1.5s infinite;
    }

    .badge-oauth.idle {
      background: rgba(245, 158, 11, 0.15);
      border: 1px solid var(--warning);
      color: #fcd34d;
    }

    .oauth-pending-box {
      background: var(--code-bg);
      border: 1px solid rgba(6, 182, 212, 0.35);
      border-radius: 10px;
      padding: 1.25rem;
      margin-top: 0.75rem;
      text-align: center;
    }

    .oauth-code-large {
      font-family: 'JetBrains Mono', monospace;
      font-size: 1.85rem;
      font-weight: 800;
      color: #38bdf8;
      letter-spacing: 0.12em;
      margin: 0.5rem 0 0.85rem;
      text-shadow: 0 0 16px rgba(6, 182, 212, 0.35);
    }

    .oauth-btn-group {
      display: flex;
      flex-wrap: wrap;
      justify-content: center;
      gap: 0.75rem;
      margin-top: 0.5rem;
    }

    .btn-oauth-primary {
      background: linear-gradient(135deg, var(--primary), var(--accent));
      color: #000;
      font-weight: 700;
      padding: 0.55rem 1.15rem;
      border-radius: 8px;
      border: none;
      cursor: pointer;
      display: inline-flex;
      align-items: center;
      gap: 0.5rem;
      text-decoration: none;
      font-size: 0.8125rem;
      transition: opacity 0.2s ease;
    }

    .btn-oauth-primary:hover {
      opacity: 0.9;
    }

    /* Modal */
    .modal-overlay {
      display: none;
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: rgba(0, 0, 0, 0.75);
      backdrop-filter: blur(6px);
      z-index: 1000;
      align-items: center;
      justify-content: center;
      padding: 1rem;
    }

    .modal-overlay.open {
      display: flex;
    }

    .modal-card {
      background: #111827;
      border: 1px solid var(--card-border);
      border-radius: 16px;
      padding: 2rem;
      width: 100%;
      max-width: 420px;
      box-shadow: 0 20px 50px rgba(0, 0, 0, 0.5);
    }

    .modal-card h2 {
      font-size: 1.25rem;
      font-weight: 700;
      margin-bottom: 0.5rem;
      display: flex;
      align-items: center;
      gap: 0.5rem;
    }

    .modal-card p {
      font-size: 0.875rem;
      color: var(--text-muted);
      margin-bottom: 1.5rem;
    }

    .form-group {
      margin-bottom: 1.25rem;
    }

    .form-label {
      display: block;
      font-size: 0.8125rem;
      font-weight: 600;
      color: var(--text-muted);
      margin-bottom: 0.5rem;
    }

    .form-input {
      width: 100%;
      background: var(--code-bg);
      border: 1px solid var(--card-border);
      border-radius: 8px;
      padding: 0.75rem 1rem;
      color: #fff;
      font-family: 'JetBrains Mono', monospace;
      font-size: 0.875rem;
      outline: none;
      transition: border-color 0.2s ease;
    }

    .form-input:focus {
      border-color: var(--primary);
    }

    .modal-actions {
      display: flex;
      justify-content: flex-end;
      gap: 0.75rem;
    }

    .btn-cancel {
      background: transparent;
      border: 1px solid var(--card-border);
      color: var(--text-muted);
      padding: 0.6rem 1.2rem;
      border-radius: 8px;
      font-weight: 600;
      cursor: pointer;
    }

    .btn-submit {
      background: var(--primary);
      border: none;
      color: #000;
      padding: 0.6rem 1.2rem;
      border-radius: 8px;
      font-weight: 700;
      cursor: pointer;
    }

    .auth-error {
      color: var(--danger);
      font-size: 0.8125rem;
      margin-top: 0.5rem;
      display: none;
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
          <h1>Lavalink v4 Public Node</h1>
          <p>Public Audio Gateway &bull; High-Performance Audio Streaming</p>
        </div>
      </div>
      <div class="header-actions">
        <button class="btn-auth" id="btn-header-oauth" onclick="handleHeaderOAuthClick()">
          <span>📺</span>
          <span id="header-oauth-text">YouTube OAuth</span>
        </button>
        <button class="btn-auth" id="btn-auth-toggle" onclick="handleAuthClick()">
          <span id="auth-icon">🔑</span>
          <span id="auth-text">Host Login</span>
        </button>
        <div class="status-badge">
          <span class="status-dot" id="status-dot"></span>
          <span id="status-text">INITIALIZING</span>
        </div>
      </div>
    </header>

    <!-- Public Notice: Active YouTube Device Authorization Flow -->
    <div id="public-oauth-banner" class="oauth-panel" style="display: none; border-color: rgba(6, 182, 212, 0.4); margin-bottom: 1.5rem; background: rgba(6, 182, 212, 0.08);">
      <div class="oauth-header">
        <div class="oauth-title">
          <span>📺 YouTube Device Authorization In Progress</span>
          <span class="badge-oauth pending" id="public-oauth-badge">PENDING GOOGLE AUTH</span>
        </div>
        <div>
          <button class="action-btn" onclick="handleHeaderOAuthClick()">🔑 Host Console</button>
        </div>
      </div>
      <div id="public-oauth-pending-content" style="margin-top: 0.5rem; text-align: center;">
        <p style="font-size: 0.875rem; color: var(--text-muted);">
          To authorize YouTube audio streaming for this Lavalink node, visit Google and enter this code:
        </p>
        <div class="oauth-code-large" id="public-oauth-user-code">---- ----</div>
        <div class="oauth-btn-group">
          <button class="action-btn" id="btn-public-copy-code" onclick="copyPublicOAuthCode()">📋 Copy Code</button>
          <a href="#" id="public-oauth-direct-link" target="_blank" rel="noopener noreferrer" class="btn-oauth-primary">
            🌐 Open Google Device Auth ↗
          </a>
        </div>
        <div style="margin-top: 0.75rem; font-size: 0.8125rem; color: #38bdf8;">
          ⏳ Polling for authorization... (Once authorized in Google, node activates instantly!)
        </div>
      </div>
    </div>

    <!-- Top Stats Row -->
    <div class="grid-stats">
      <div class="card">
        <div class="card-label">Active Players</div>
        <div class="card-value" id="val-players">0</div>
        <div class="card-subtext"><span id="val-playing">0</span> currently playing</div>
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

      <div class="card">
        <div class="card-label">Keep-Alive Service</div>
        <div class="card-value" style="font-size: 1.4rem;" id="val-keepalive-status">Active</div>
        <div class="card-subtext" id="val-keepalive-sub">Anti-throttling active (5m)</div>
      </div>
    </div>

    <!-- Main Public Configuration & Network Information -->
    <div class="main-grid">
      <div class="card">
        <div class="section-title">
          <span>🤖 Connect Your Discord Bot (Public)</span>
          <span class="badge-public">Open Connection</span>
        </div>
        <p style="font-size: 0.875rem; color: var(--text-muted); margin-bottom: 1rem;">
          This node is public. Add these exact environment variables to your Discord bot's <code>.env</code> (Master-Bot, Shoukaku, Lavalink.js, etc.):
        </p>
        <div class="config-box">
          <button class="copy-btn" onclick="copyConfig()">Copy</button>
          <div class="config-code" id="config-env-code"><span class="comment"># Public Lavalink Server Configuration</span>
<span class="key">LAVA_ENABLED</span>=<span class="val">true</span>
<span class="key">LAVA_EXTERNAL</span>=<span class="val">true</span>
<span class="key">LAVA_HOST</span>=<span class="val">"${config.domain}"</span>
<span class="key">LAVA_PORT</span>=<span class="val">${botPort}</span>
<span class="key">LAVA_PASS</span>=<span class="val">"${config.lavalinkPass}"</span>
<span class="key">LAVA_SECURE</span>=<span class="val">${botSecure}</span>
<span class="key">LAVA_WS_URL</span>=<span class="val">"${wsUrl}"</span></div>
        </div>
      </div>

      <div class="card">
        <div class="section-title">
          <span>🌐 Public Network Topology</span>
        </div>
        <div class="info-list">
          <div class="info-item">
            <span class="info-key">Public Host Domain</span>
            <span class="info-val">${config.domain}</span>
          </div>
          <div class="info-item">
            <span class="info-key">Gateway Port</span>
            <span class="info-val">${botPort} (SSL: ${botSecure})</span>
          </div>
          <div class="info-item">
            <span class="info-key">WebSocket Endpoint</span>
            <span class="info-val">/v4/websocket</span>
          </div>
          <div class="info-item">
            <span class="info-key">Lavalink Password</span>
            <span class="info-val" style="color: #34d399;">${config.lavalinkPass}</span>
          </div>
          <div class="info-item">
            <span class="info-key">Inactivity Keep-Alive</span>
            <span class="info-val" style="color: var(--primary);">Self-Ping Every 5m</span>
          </div>
        </div>
      </div>
    </div>

    <!-- Owner Only Diagnostic Section -->
    <div class="owner-section">
      <div id="owner-locked-container" class="owner-locked-banner">
        <h3>🔒 Host Account Owner Console</h3>
        <p>Live stdout/stderr stream, SQLite audit history, and node power controls are restricted to the host owner.</p>
        <button class="action-btn" onclick="openLoginModal()">🔑 Unlock Owner Console</button>
      </div>

      <div id="owner-unlocked-container" class="card" style="display: none;">
        <div class="owner-toolbar">
          <div class="section-title" style="margin-bottom: 0;">
            <span>👑 Host Owner Diagnostics &amp; Live Logs</span>
          </div>
          <div style="display: flex; gap: 0.5rem; flex-wrap: wrap;">
            <button class="action-btn" onclick="startYouTubeOAuth()">🔑 YouTube OAuth</button>
            <button class="action-btn" onclick="triggerPingNow()">⚡ Ping Keep-Alive</button>
            <button class="action-btn danger" onclick="restartNode()">🔄 Restart Node</button>
            <button class="action-btn" onclick="logoutOwner()">🔒 Lock</button>
          </div>
        </div>

        <!-- YouTube OAuth & Anti-Throttling Module -->
        <div class="oauth-panel">
          <div class="oauth-header">
            <div class="oauth-title">
              <span>📺 YouTube OAuth 2.0 (Bot IP Bypass)</span>
              <span class="badge-oauth idle" id="oauth-badge">CHECKING...</span>
            </div>
            <div style="display: flex; gap: 0.5rem; flex-wrap: wrap;">
              <button class="action-btn" id="btn-oauth-start" onclick="startYouTubeOAuth()">
                <span>🔑</span> <span id="btn-oauth-start-text">Authorize YouTube</span>
              </button>
              <button class="action-btn" onclick="openManualTokenModal()">
                <span>✏️</span> Manual Token
              </button>
            </div>
          </div>

          <p style="font-size: 0.8125rem; color: var(--text-muted);" id="oauth-desc">
            Bypasses YouTube 429 ratelimits &amp; bot IP checks by authorizing a Google streaming account. Token auto-persists to SQLite database &amp; Redis live memory.
          </p>

          <div id="oauth-status-box" style="font-size: 0.8125rem; color: #d1d5db; margin-top: 0.5rem;">
            <span id="oauth-status-detail">Loading OAuth state...</span>
          </div>

          <!-- Pending Device Flow Box -->
          <div id="oauth-pending-card" class="oauth-pending-box" style="display: none;">
            <p style="font-size: 0.875rem; color: var(--text-muted);">
              Google Device Authorization initiated! Head to Google in your browser:
            </p>
            <div class="oauth-code-large" id="oauth-user-code">---- ----</div>
            <div class="oauth-btn-group">
              <button class="action-btn" id="btn-copy-code" onclick="copyOAuthCode()">📋 Copy Code</button>
              <a href="#" id="oauth-direct-link" target="_blank" rel="noopener noreferrer" class="btn-oauth-primary">
                🌐 Open Google Device Auth ↗
              </a>
            </div>
            <div style="margin-top: 0.85rem; font-size: 0.8125rem; color: #38bdf8;" id="oauth-poll-status">
              ⏳ Waiting for user authorization in Google... (Once complete, token auto-saves to database &amp; live memory)
            </div>
          </div>
        </div>

        <div style="margin-bottom: 0.75rem; font-size: 0.8125rem; color: var(--text-muted);">
          Live stdout &amp; supervisor log buffer (real-time):
        </div>

        <div class="log-viewport" id="log-viewport">
          <div class="log-line">Connecting to event stream...</div>
        </div>
      </div>
    </div>

    <footer>
      Lavalink v4 Public Audio Server &bull; Maintained by <a href="https://github.com/HELIX-Origin" target="_blank">HELIX Origin</a> &bull; Powered by ESM TypeScript &amp; Anti-Throttling Keep-Alive
    </footer>
  </div>

  <!-- Login Modal -->
  <div class="modal-overlay" id="login-modal">
    <div class="modal-card">
      <h2>🔑 Host Owner Login</h2>
      <p>Enter your <code>ADMIN_KEY</code> or <code>LAVA_PASS</code> to access the live log stream and node controls.</p>
      <form onsubmit="handleLoginSubmit(event)">
        <div class="form-group">
          <label class="form-label" for="owner-pass">Master Password / Admin Key</label>
          <input type="password" id="owner-pass" class="form-input" placeholder="Enter password" required autofocus autocomplete="current-password">
          <div class="auth-error" id="auth-error">Invalid password. Please verify your environment settings.</div>
        </div>
        <div class="modal-actions">
          <button type="button" class="btn-cancel" onclick="closeLoginModal()">Cancel</button>
          <button type="submit" class="btn-submit" id="btn-login-submit">Unlock Console</button>
        </div>
      </form>
    </div>
  </div>

  <!-- Manual Token Modal -->
  <div class="modal-overlay" id="manual-token-modal">
    <div class="modal-card">
      <h2>✏️ Manual YouTube Refresh Token</h2>
      <p>Paste an existing YouTube OAuth 2.0 refresh token. It will be saved to the database (SQLite) and live memory (Redis) and applied to Lavalink immediately.</p>
      <form onsubmit="handleManualTokenSubmit(event)">
        <div class="form-group">
          <label class="form-label" for="manual-token-input">Refresh Token (starts with 1//)</label>
          <input type="password" id="manual-token-input" class="form-input" placeholder="1//04..." required autocomplete="off">
          <div class="auth-error" id="manual-token-error">Invalid refresh token.</div>
        </div>
        <div class="modal-actions">
          <button type="button" class="btn-cancel" onclick="closeManualTokenModal()">Cancel</button>
          <button type="submit" class="btn-submit" id="btn-manual-token-submit">Save &amp; Apply</button>
        </div>
      </form>
    </div>
  </div>

  <script>
    let authToken = localStorage.getItem('lavalink_admin_token') || null;
    let isOwnerLoggedIn = false;

    function handleAuthClick() {
      if (isOwnerLoggedIn) {
        logoutOwner();
      } else {
        openLoginModal();
      }
    }

    function openLoginModal() {
      document.getElementById('auth-error').style.display = 'none';
      document.getElementById('owner-pass').value = '';
      document.getElementById('login-modal').classList.add('open');
      setTimeout(() => document.getElementById('owner-pass').focus(), 100);
    }

    function closeLoginModal() {
      document.getElementById('login-modal').classList.remove('open');
    }

    async function handleLoginSubmit(e) {
      e.preventDefault();
      const password = document.getElementById('owner-pass').value.trim();
      const errEl = document.getElementById('auth-error');
      const submitBtn = document.getElementById('btn-login-submit');

      submitBtn.innerText = 'Verifying...';
      errEl.style.display = 'none';

      try {
        const res = await fetch('/api/auth/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ password })
        });
        const data = await res.json();

        if (res.ok && data.success) {
          authToken = data.token;
          localStorage.setItem('lavalink_admin_token', authToken);
          isOwnerLoggedIn = true;
          closeLoginModal();
          updateOwnerUi();
          pollStatus();
        } else {
          errEl.innerText = data.error || 'Authentication failed.';
          errEl.style.display = 'block';
        }
      } catch (err) {
        errEl.innerText = 'Network error connecting to auth server.';
        errEl.style.display = 'block';
      } finally {
        submitBtn.innerText = 'Unlock Console';
      }
    }

    function logoutOwner() {
      authToken = null;
      localStorage.removeItem('lavalink_admin_token');
      isOwnerLoggedIn = false;
      document.cookie = 'admin_token=; Path=/; Expires=Thu, 01 Jan 1970 00:00:01 GMT;';
      updateOwnerUi();
      pollStatus();
    }

    function updateOwnerUi() {
      const lockedBanner = document.getElementById('owner-locked-container');
      const unlockedBanner = document.getElementById('owner-unlocked-container');
      const authBtn = document.getElementById('btn-auth-toggle');
      const authIcon = document.getElementById('auth-icon');
      const authText = document.getElementById('auth-text');

      if (isOwnerLoggedIn) {
        lockedBanner.style.display = 'none';
        unlockedBanner.style.display = 'block';
        authBtn.classList.add('active');
        authIcon.innerText = '👑';
        authText.innerText = 'Sign Out (Owner)';
      } else {
        lockedBanner.style.display = 'block';
        unlockedBanner.style.display = 'none';
        authBtn.classList.remove('active');
        authIcon.innerText = '🔑';
        authText.innerText = 'Host Login';
      }
    }

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

    async function triggerPingNow() {
      if (!authToken) return;
      try {
        const res = await fetch('/api/admin/action', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': \`Bearer \${authToken}\`
          },
          body: JSON.stringify({ action: 'ping' })
        });
        const data = await res.json();
        if (data.success) {
          alert('⚡ Keep-Alive ping successfully sent to public /health endpoint!');
          pollStatus();
        } else {
          alert('Ping failed: ' + (data.error || 'Unknown error'));
        }
      } catch (err) {
        alert('Network error triggering keep-alive ping');
      }
    }

    async function restartNode() {
      if (!authToken) return;
      if (!confirm('Are you sure you want to restart the Lavalink process? Active connections will temporarily reconnect.')) return;

      try {
        const res = await fetch('/api/admin/action', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': \`Bearer \${authToken}\`
          },
          body: JSON.stringify({ action: 'restart' })
        });
        const data = await res.json();
        if (data.success) {
          alert('Node restart initiated. Supervisor is reloading Lavalink.jar.');
          pollStatus();
        }
      } catch (err) {
        alert('Failed to request restart');
      }
    }

    let currentOAuthState = null;

    function handleHeaderOAuthClick() {
      if (isOwnerLoggedIn) {
        startYouTubeOAuth();
      } else {
        openLoginModal();
      }
    }

    function copyPublicOAuthCode() {
      const codeEl = document.getElementById('public-oauth-user-code');
      const btn = document.getElementById('btn-public-copy-code');
      navigator.clipboard.writeText(codeEl.innerText.trim()).then(() => {
        btn.innerText = 'Copied!';
        setTimeout(() => btn.innerText = '📋 Copy Code', 2000);
      });
    }

    async function startYouTubeOAuth() {
      if (!authToken) {
        openLoginModal();
        return;
      }
      const startBtn = document.getElementById('btn-oauth-start-text');
      startBtn.innerText = 'Requesting Code...';

      try {
        const res = await fetch('/api/admin/oauth/youtube/start', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': \`Bearer \${authToken}\`
          }
        });
        const data = await res.json();
        if (data.success && data.oauth) {
          updateOAuthUi(data.oauth);
          pollStatus();
        } else {
          alert('Failed to initiate OAuth flow: ' + (data.error || 'Unknown error'));
        }
      } catch (err) {
        alert('Network error initiating YouTube OAuth device flow');
      } finally {
        startBtn.innerText = 'Authorize YouTube';
      }
    }

    function copyOAuthCode() {
      const codeEl = document.getElementById('oauth-user-code');
      const btn = document.getElementById('btn-copy-code');
      navigator.clipboard.writeText(codeEl.innerText.trim()).then(() => {
        btn.innerText = 'Copied!';
        setTimeout(() => btn.innerText = '📋 Copy Code', 2000);
      });
    }

    function openManualTokenModal() {
      document.getElementById('manual-token-error').style.display = 'none';
      document.getElementById('manual-token-input').value = '';
      document.getElementById('manual-token-modal').classList.add('open');
      setTimeout(() => document.getElementById('manual-token-input').focus(), 100);
    }

    function closeManualTokenModal() {
      document.getElementById('manual-token-modal').classList.remove('open');
    }

    async function handleManualTokenSubmit(e) {
      e.preventDefault();
      const token = document.getElementById('manual-token-input').value.trim();
      const errEl = document.getElementById('manual-token-error');
      const submitBtn = document.getElementById('btn-manual-token-submit');

      submitBtn.innerText = 'Saving...';
      errEl.style.display = 'none';

      try {
        const res = await fetch('/api/admin/oauth/youtube/manual', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': \`Bearer \${authToken}\`
          },
          body: JSON.stringify({ token })
        });
        const data = await res.json();
        if (data.success && data.oauth) {
          closeManualTokenModal();
          updateOAuthUi(data.oauth);
          pollStatus();
        } else {
          errEl.innerText = data.error || 'Failed to save refresh token.';
          errEl.style.display = 'block';
        }
      } catch {
        errEl.innerText = 'Network error saving token.';
        errEl.style.display = 'block';
      } finally {
        submitBtn.innerText = 'Save & Apply';
      }
    }

    function updateOAuthUi(oauth) {
      if (!oauth) return;
      currentOAuthState = oauth;

      const badge = document.getElementById('oauth-badge');
      const statusDetail = document.getElementById('oauth-status-detail');
      const pendingCard = document.getElementById('oauth-pending-card');
      const startBtnText = document.getElementById('btn-oauth-start-text');

      const pubBanner = document.getElementById('public-oauth-banner');
      const pubCode = document.getElementById('public-oauth-user-code');
      const pubLink = document.getElementById('public-oauth-direct-link');
      const headerText = document.getElementById('header-oauth-text');

      if (oauth.status === 'authorized') {
        if (badge) {
          badge.className = 'badge-oauth authorized';
          badge.innerText = 'AUTHORIZED';
        }
        if (statusDetail) {
          statusDetail.innerHTML = '✅ Active Refresh Token: <code style="color: #6ee7b7;">' + (oauth.tokenPreview || 'Saved') + '</code> &bull; Saved to Database &amp; Live Memory';
        }
        if (pendingCard) pendingCard.style.display = 'none';
        if (startBtnText) startBtnText.innerText = 'Re-authorize Account';
        if (pubBanner) pubBanner.style.display = 'none';
        if (headerText) headerText.innerText = 'YouTube: Linked ✅';
      } else if (oauth.status === 'pending') {
        if (badge) {
          badge.className = 'badge-oauth pending';
          badge.innerText = 'WAITING FOR GOOGLE AUTH';
        }
        if (statusDetail) {
          statusDetail.innerText = 'Follow the prompts below to link your Google account:';
        }
        if (pendingCard) pendingCard.style.display = 'block';

        const codeVal = oauth.userCode || '---- ----';
        const urlVal = oauth.directUrl || oauth.verificationUrl || 'https://www.google.com/device';

        const ownerUserCode = document.getElementById('oauth-user-code');
        if (ownerUserCode) ownerUserCode.innerText = codeVal;
        const directLink = document.getElementById('oauth-direct-link');
        if (directLink) directLink.href = urlVal;
        if (startBtnText) startBtnText.innerText = 'Restart Flow';

        if (pubBanner) pubBanner.style.display = 'block';
        if (pubCode) pubCode.innerText = codeVal;
        if (pubLink) pubLink.href = urlVal;
        if (headerText) headerText.innerText = 'YouTube: Code Active ⚠️';
      } else {
        if (badge) {
          badge.className = 'badge-oauth idle';
          badge.innerText = 'NOT CONFIGURED';
        }
        if (statusDetail) {
          statusDetail.innerText = 'No refresh token active. Click "Authorize YouTube" to link a streaming account.';
        }
        if (pendingCard) pendingCard.style.display = 'none';
        if (startBtnText) startBtnText.innerText = 'Authorize YouTube';
        if (pubBanner) pubBanner.style.display = 'none';
        if (headerText) headerText.innerText = 'YouTube OAuth';
      }
    }

    async function pollStatus() {
      try {
        const headers = {};
        if (authToken) {
          headers['Authorization'] = \`Bearer \${authToken}\`;
        }

        const res = await fetch('/api/status', { headers });
        if (!res.ok) return;
        const data = await res.json();

        // Check if owner status changed
        if (data.isOwner !== isOwnerLoggedIn) {
          isOwnerLoggedIn = !!data.isOwner;
          updateOwnerUi();
        }

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

        // Keep-Alive Widget
        const ka = data.keepAlive || {};
        const kaStatusEl = document.getElementById('val-keepalive-status');
        const kaSubEl = document.getElementById('val-keepalive-sub');
        if (ka.enabled) {
          kaStatusEl.innerText = 'Active (24/7)';
          kaStatusEl.style.color = '#34d399';
          if (ka.lastPingTimestamp) {
            const agoSec = Math.round((Date.now() - ka.lastPingTimestamp) / 1000);
            const statusTxt = ka.lastPingStatus ? \`HTTP \${ka.lastPingStatus}\` : 'Active';
            kaSubEl.innerText = \`Last ping \${agoSec}s ago (\${statusTxt}, \${ka.lastPingLatencyMs || 0}ms)\`;
          } else {
            kaSubEl.innerText = 'Starting first ping loop...';
          }
        } else {
          kaStatusEl.innerText = 'Disabled';
          kaStatusEl.style.color = 'var(--text-muted)';
          kaSubEl.innerText = 'Set KEEP_ALIVE_ENABLED=true';
        }

        // YouTube OAuth Status
        if (data.youtubeOAuth) {
          updateOAuthUi(data.youtubeOAuth);
        }

        // Logs (Owner Only)
        if (isOwnerLoggedIn && Array.isArray(data.logs) && data.logs.length > 0) {
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

    // Initialize UI and start polling
    updateOwnerUi();
    setInterval(pollStatus, 3500);
    pollStatus();
  </script>
</body>
</html>`;
}
