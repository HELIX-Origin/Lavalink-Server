import { renderPage } from './layout.js';

export function renderDocsHtml(): string {
  return renderPage('Documentation', `
    <div class="card">
      <h2 class="section-title">Documentation</h2>
      <p class="section-desc">Welcome to the Lavalink v4 Audio Server documentation. This page provides comprehensive guides for deploying and configuring your Lavalink server.</p>
      <ul style="list-style: none; padding: 0;">
        <li style="padding: 0.5rem 0; border-bottom: 1px solid var(--border);"><a href="https://github.com/HELIX-Origin/Lavalink-Server/wiki/Deployment" target="_blank">Deployment Guide</a></li>
        <li style="padding: 0.5rem 0; border-bottom: 1px solid var(--border);"><a href="https://github.com/HELIX-Origin/Lavalink-Server/wiki/Configuration" target="_blank">Configuration Reference</a></li>
        <li style="padding: 0.5rem 0; border-bottom: 1px solid var(--border);"><a href="https://github.com/HELIX-Origin/Lavalink-Server/wiki/Plugins" target="_blank">Plugins Guide</a></li>
        <li style="padding: 0.5rem 0; border-bottom: 1px solid var(--border);"><a href="https://github.com/HELIX-Origin/Lavalink-Server/wiki/Client-Integration" target="_blank">Client Integration</a></li>
        <li style="padding: 0.5rem 0;"><a href="https://github.com/HELIX-Origin/Lavalink-Server/wiki/Troubleshooting" target="_blank">Troubleshooting</a></li>
      </ul>
    </div>
  `);
}