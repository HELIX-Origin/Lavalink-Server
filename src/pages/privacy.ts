import { renderPage } from './layout.js';

export function renderPrivacyHtml(): string {
  return renderPage('Privacy Policy', `
    <div class="card">
      <h2 class="section-title">Privacy Policy</h2>
      <p>This Lavalink server does not collect, store, or share any personal information from users.</p>
      <p>No analytics, tracking cookies, or user data collection occurs on this server.</p>
      <p>All audio streaming is handled directly between Discord and the Lavalink node.</p>
    </div>
  `);
}