export const glassmorphismTheme = `
  html.glassmorphism {
    --bg: #0a0d18;
    --card-bg: rgba(18, 24, 43, 0.55);
    --card-inner: rgba(255, 255, 255, 0.04);
    --border: rgba(255, 255, 255, 0.12);
    --border-hover: rgba(168, 85, 247, 0.5);
    --text: #ffffff;
    --text-muted: #cbd5e1;
    --text-dim: #94a3b8;
    --primary: #a855f7;
    --primary-hover: #9333ea;
    --primary-bg: rgba(168, 85, 247, 0.2);
    --primary-border: rgba(168, 85, 247, 0.45);
    --amber: #f59e0b;
    --emerald: #10b981;
    --red: #ef4444;
    --shadow: 0 8px 32px 0 rgba(0, 0, 0, 0.37);
  }
  html.glassmorphism body {
    background: radial-gradient(circle at 15% 15%, rgba(168, 85, 247, 0.18), transparent 35%),
                radial-gradient(circle at 85% 20%, rgba(6, 182, 212, 0.18), transparent 35%),
                radial-gradient(circle at 50% 85%, rgba(236, 72, 153, 0.15), transparent 45%),
                #0a0d18;
    background-attachment: fixed;
  }
  html.glassmorphism .card,
  html.glassmorphism header {
    backdrop-filter: blur(20px) saturate(180%) !important;
    -webkit-backdrop-filter: blur(20px) saturate(180%) !important;
    border: 1px solid rgba(255, 255, 255, 0.12) !important;
    box-shadow: 0 8px 32px 0 rgba(0, 0, 0, 0.37) !important;
  }
  html.glassmorphism .stat,
  html.glassmorphism .code-block {
    background: rgba(255, 255, 255, 0.04) !important;
    backdrop-filter: blur(12px) !important;
    border: 1px solid rgba(255, 255, 255, 0.08) !important;
  }
  html.glassmorphism nav a:hover { background: rgba(255, 255, 255, 0.08); }
`;