export const baseStyles = `
  * { box-sizing: border-box; margin: 0; padding: 0; font-family: 'Inter', -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; }
  body { background-color: var(--bg); color: var(--text); min-height: 100vh; display: flex; flex-direction: column; transition: background-color 0.2s, color 0.2s; }
  .card { background: var(--card-bg); backdrop-filter: blur(12px); border: 1px solid var(--border); border-radius: 1.25rem; padding: 1.5rem 2rem; box-shadow: var(--shadow); }
  .card-header { display: flex; justify-content: space-between; align-items: center; gap: 0.75rem; flex-wrap: wrap; }
  .card-title { font-size: 1rem; font-weight: 700; color: var(--text); display: flex; align-items: center; gap: 0.5rem; }
  .card-desc { font-size: 0.8125rem; color: var(--text-muted); }
  .section-title { font-size: 1.25rem; font-weight: 800; margin-bottom: 0.25rem; }
  .section-desc { font-size: 0.875rem; color: var(--text-muted); margin-bottom: 0.75rem; }
  .btn { display: inline-flex; align-items: center; justify-content: center; gap: 0.5rem; padding: 0.625rem 1.25rem; border-radius: 0.75rem; font-size: 0.875rem; font-weight: 600; cursor: pointer; border: 1px solid transparent; text-decoration: none; transition: all 0.15s; min-height: 44px; }
  .btn-primary { background: var(--primary); color: #fff; box-shadow: 0 4px 12px rgba(6,182,212,0.25); }
  .btn-primary:hover { background: var(--primary-hover); }
  .btn-ghost { background: var(--card-inner); color: var(--text-muted); border-color: var(--border); }
  .btn-ghost:hover { background: rgba(255,255,255,0.08); color: var(--text); }
  .btn-danger { background: rgba(239,68,68,0.15); color: #f87171; border-color: rgba(239,68,68,0.3); }
  .btn-danger:hover { background: rgba(239,68,68,0.3); color: #fff; }
  .btn-sm { padding: 0.375rem 0.75rem; font-size: 0.75rem; border-radius: 0.5rem; min-height: 36px; }
  .badge { display: inline-flex; align-items: center; gap: 0.25rem; padding: 0.15rem 0.45rem; border-radius: 0.375rem; font-size: 0.6875rem; font-weight: 600; text-transform: uppercase; }
  .badge-green { background: rgba(16,185,129,0.15); color: #34d399; border: 1px solid rgba(16,185,129,0.3); }
  .badge-red { background: rgba(239,68,68,0.15); color: #f87171; border: 1px solid rgba(239,68,68,0.3); }
  .badge-gray { background: rgba(156,163,175,0.12); color: #9ca3af; border: 1px solid var(--border); }
  .badge-amber { background: rgba(245,158,11,0.15); color: #fbbf24; border: 1px solid rgba(245,158,11,0.3); }
  .hidden { display: none !important; }
  .empty-state { padding: 2rem 1rem; text-align: center; color: var(--text-muted); font-size: 0.875rem; }
`;

export const colorSchemeOverrides = `
  html.scheme-purple, html[class*="scheme-purple"] {
    --primary: #a855f7 !important;
    --primary-hover: #9333ea !important;
    --primary-bg: rgba(168, 85, 247, 0.15) !important;
    --primary-border: rgba(168, 85, 247, 0.4) !important;
  }
  html.scheme-blue, html[class*="scheme-blue"] {
    --primary: #3b82f6 !important;
    --primary-hover: #2563eb !important;
    --primary-bg: rgba(59, 130, 246, 0.15) !important;
    --primary-border: rgba(59, 130, 246, 0.4) !important;
  }
  html.scheme-emerald, html[class*="scheme-emerald"] {
    --primary: #10b981 !important;
    --primary-hover: #059669 !important;
    --primary-bg: rgba(16, 185, 129, 0.15) !important;
    --primary-border: rgba(16, 185, 129, 0.4) !important;
  }
  html.scheme-rose, html[class*="scheme-rose"] {
    --primary: #f43f5e !important;
    --primary-hover: #e11d48 !important;
    --primary-bg: rgba(244, 63, 94, 0.15) !important;
    --primary-border: rgba(244, 63, 94, 0.4) !important;
  }
  html.scheme-amber, html[class*="scheme-amber"] {
    --primary: #f59e0b !important;
    --primary-hover: #d97706 !important;
    --primary-bg: rgba(245, 158, 11, 0.15) !important;
    --primary-border: rgba(245, 158, 11, 0.4) !important;
  }
  html.scheme-indigo, html[class*="scheme-indigo"] {
    --primary: #6366f1 !important;
    --primary-hover: #4f46e5 !important;
    --primary-bg: rgba(99, 102, 241, 0.15) !important;
    --primary-border: rgba(99, 102, 241, 0.4) !important;
  }
  html.scheme-crimson, html[class*="scheme-crimson"] {
    --primary: #ef4444 !important;
    --primary-hover: #dc2626 !important;
    --primary-bg: rgba(239, 68, 68, 0.15) !important;
    --primary-border: rgba(239, 68, 68, 0.4) !important;
  }
  html.scheme-teal, html[class*="scheme-teal"] {
    --primary: #14b8a6 !important;
    --primary-hover: #0d9488 !important;
    --primary-bg: rgba(20, 184, 166, 0.15) !important;
    --primary-border: rgba(20, 184, 166, 0.4) !important;
  }
  html.scheme-sunset, html[class*="scheme-sunset"] {
    --primary: #ff6b6b !important;
    --primary-hover: #fa5252 !important;
    --primary-bg: rgba(255, 107, 107, 0.15) !important;
    --primary-border: rgba(255, 107, 107, 0.4) !important;
  }
  html.scheme-cyan, html[class*="scheme-cyan"] {
    --primary: #06b6d4 !important;
    --primary-hover: #0891b2 !important;
    --primary-bg: rgba(6, 182, 212, 0.15) !important;
    --primary-border: rgba(6, 182, 212, 0.4) !important;
  }
`;

export const colorSchemeMode = `
  html.light { color-scheme: light; }
  html.dark, html.glassmorphism, html.cyberpunk, html.dracula, html.nord, html.emerald { color-scheme: dark; }
`;