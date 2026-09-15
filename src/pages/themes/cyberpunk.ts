export const cyberpunkTheme = `
  html.cyberpunk {
    --bg: #05050a;
    --card-bg: rgba(14, 14, 24, 0.92);
    --card-inner: #0a0a12;
    --border: rgba(0, 240, 255, 0.25);
    --border-hover: #00f0ff;
    --text: #fcee0a;
    --text-muted: #e2e8f0;
    --text-dim: #8b9bb4;
    --primary: #00f0ff;
    --primary-hover: #00c8d6;
    --primary-bg: rgba(0, 240, 255, 0.16);
    --primary-border: rgba(0, 240, 255, 0.5);
    --amber: #fcee0a;
    --red: #ff0055;
    --emerald: #00ff9f;
    --shadow: 0 0 20px rgba(0, 240, 255, 0.15);
  }
  html.cyberpunk body {
    background: linear-gradient(rgba(0, 240, 255, 0.03) 1px, transparent 1px),
                linear-gradient(90deg, rgba(0, 240, 255, 0.03) 1px, transparent 1px),
                #05050a;
    background-size: 32px 32px;
    background-attachment: fixed;
  }
`;