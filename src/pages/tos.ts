import { renderPage } from './layout.js';

export function renderTosHtml(): string {
  return renderPage('Terms of Service', `
    <div class="card">
      <h2 class="section-title">Terms of Service</h2>
      <p>By using this Lavalink server, you agree to the following terms:</p>
      <ul style="list-style: none; padding: 0;">
        <li style="padding: 0.5rem 0; border-bottom: 1px solid var(--border);">This server is provided "as is" without warranty of any kind.</li>
        <li style="padding: 0.5rem 0; border-bottom: 1px solid var(--border);">You are responsible for complying with Discord's Terms of Service and Developer Policy.</li>
        <li style="padding: 0.5rem 0; border-bottom: 1px solid var(--border);">You are responsible for complying with YouTube's Terms of Service when streaming content.</li>
        <li style="padding: 0.5rem 0; border-bottom: 1px solid var(--border);">This server may be updated, modified, or discontinued at any time without notice.</li>
        <li style="padding: 0.5rem 0;">The server operator is not liable for any damages resulting from the use of this service.</li>
      </ul>
    </div>
  `);
}