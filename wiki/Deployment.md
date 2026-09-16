# 🚀 Deployment Guide

This guide covers how to run your dedicated Lavalink v4 audio server on hardware you control: **Docker Compose**, a **Dedicated Linux VPS**, or your **local network**. Cloud PaaS deployment (Heroku/Render/Railway) is not supported — shared datacenter IP ranges are aggressively blocked by YouTube's anti-scraping systems.

---

> [!NOTE]
> **Hosted / Self-Hosted Only.** Run everything yourself: a Dedicated VPS (Hetzner, DigitalOcean, Linode, OVH), a local server, or a private network. Do not deploy to free shared cloud platforms.

---

## 1. 🐳 Quick Start: Docker Compose (Recommended for VPS)

Docker Compose is the fastest and most reliable way to run Lavalink on your own server or VPS.

### Step 1: Clone the Repository
```bash
git clone https://github.com/HELIX-Origin/Lavalink-Server.git
cd Lavalink-Server
```

### Step 2: Configure Environment Variables
Copy the example environment file:
```bash
cp .env.example .env
```
Edit `.env` using your preferred text editor:
```bash
nano .env
```
Key settings to customize:
- `LAVA_PASS`: Choose a strong, secret authentication password (e.g. `MySuperSecretLavaPass123!`).
- `LAVA_INTERNAL_URL`: Internal bind host + port (default `0.0.0.0:2333`). The gateway/dashboard port is auto-derived as internal port + 1.
- `LAVA_PUBLIC_URL`: Your public domain for the server (e.g. `https://lavalink.yourdomain.com`). The port is **masked** — bots use this URL as-is and append endpoints.
- `LAVA_INTERNAL_WS_URI` / `LAVA_PUBLIC_WS_URI`: Internal and public WebSocket URIs (default port masked in the public one).
- `YOUTUBE_CLIENT_ID`: **Required** — YouTube OAuth Client ID (app type: "TVs and Limited Input devices").
- `YOUTUBE_CLIENT_SECRET`: YouTube OAuth Client Secret for the Client ID above.
- `YOUTUBE_REFRESH_TOKEN`: *(Optional)* Pre-authorized refresh token (auto-saved after device flow).
- `SPOTIFY_CLIENT_ID` & `SPOTIFY_CLIENT_SECRET`: *(Optional)* For Spotify link resolution.

### Step 3: Start the Server
```bash
docker compose up -d
```

### Step 4: Verify Status and Dashboard
Check that the container is running:
```bash
docker compose ps
docker compose logs -f
```

You can view the real-time web dashboard at:
```
http://<your-server-ip>:2334/dashboard
```
*(Note: The gateway runs on the auto-derived port `internal port + 1` (= 2334 by default) and serves everything under one port: the dashboard at `/dashboard`, the Lavalink proxy at `/server`, and `/v4/*`. For public access, point your Cloudflare tunnel / reverse proxy at this gateway — the public port stays masked.)*

---

## 2. 🐧 Linux VPS Setup (Ubuntu / Debian)

### 🌐 Recommended Low-Cost Compatible VPS Providers

For high-throughput WebRTC audio transcoding and unblocked YouTube streaming, we recommend dedicated KVM VPS providers over shared cloud PaaS:

| Provider | Starting Price | Key Benefits | Recommended Plan |
| :--- | :--- | :--- | :--- |
| [**Hetzner Cloud**](https://www.hetzner.com/cloud) | ~€3.79 / mo | Top CPU performance for audio transcoding, EU/US locations | CX22 (2 vCPU, 4 GB RAM) |
| [**OVHcloud**](https://www.ovhcloud.com/en/vps/) | ~$4.20 / mo | Unmetered bandwidth, strong anti-DDoS protection | Starter / Value VPS (2-4 GB RAM) |
| [**DigitalOcean**](https://www.digitalocean.com/) | ~$4.00 - $6.00 / mo | 1-Click Docker droplets, low network jitter | Basic Droplet (1-2 GB RAM) |
| [**Linode (Akamai)**](https://www.linode.com/) | ~$5.00 / mo | Reliable network throughput, global datacenters | Nanode 1GB / Shared 2GB |
| [**Vultr**](https://www.vultr.com/) | ~$3.50 - $5.00 / mo | 30+ worldwide datacenters, high frequency compute | Cloud Compute (1-2 GB RAM) |

---

### Step 1: Install Docker & Docker Compose
```bash
sudo apt update && sudo apt upgrade -y
sudo apt install -y curl git ufw

# Install Docker Engine & Compose plugin
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh
sudo usermod -aG docker $USER
newgrp docker
```

### Step 2: Configure Firewall (`ufw`)
Allow the internal node port, the gateway port (internal + 1), and SSH:
```bash
sudo ufw allow OpenSSH
# Lavalink Java server port (from LAVA_INTERNAL_URL)
sudo ufw allow 2333/tcp
# Gateway port (internal port + 1) — dashboard + /server proxy
sudo ufw allow 2334/tcp
# If you expose via Nginx reverse proxy with SSL:
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp

sudo ufw enable
```
> 💡 If the public side is fronted by Cloudflare, bots never touch these ports directly — only the tunnel domain.

### Step 3: Run with Docker Compose
Follow the steps in [Quick Start: Docker Compose](#1--quick-start-docker-compose-recommended-for-vps) above.

---

### Step 4: Install as Systemd Service (Alternative to Docker)

For native VPS deployment without Docker:

1. **Install dependencies:**
   ```bash
   sudo apt update && sudo apt install -y nodejs npm openjdk-21-jre-headless git
   ```

2. **Clone and build:**
   ```bash
   git clone https://github.com/HELIX-Origin/Lavalink-Server.git
   cd Lavalink-Server
   pnpm install
   pnpm build
   ```

3. **Download Lavalink JAR (required):**
   ```bash
   # Download the latest Lavalink v4 JAR from the official repo
   curl -L -o Lavalink.jar https://github.com/lavalink-devs/Lavalink/releases/latest/download/Lavalink.jar
   ```
   
   > **Note:** The Lavalink JAR is no longer committed to the repository. You must download it from the [official Lavalink v4 releases](https://github.com/lavalink-devs/Lavalink/releases) before running the server.

4. **Configure environment:**
   ```bash
   cp .env.example .env
   nano .env  # Set your credentials
   ```

5. **Create systemd service:**
   ```bash
   sudo ./scripts/install-service.sh
   ```
   The script auto-detects the install directory, Node.js binary, and writes a hardened unit file. Options:
   - `--user <name>` — run as a dedicated system user instead of root
   - `--name <name>` — custom unit name (default: `lavalink-server`)
   - `--no-start` — create + enable the unit without starting it

   For reference, the generated unit looks like:
   ```bash
   sudo tee /etc/systemd/system/lavalink-server.service > /dev/null <<'EOF'
   [Unit]
   Description=Lavalink v4 Audio Server
   After=network.target
   Wants=network.target

   [Service]
   Type=simple
   User=<user>
   WorkingDirectory=<install-dir>
   ExecStart=/usr/bin/node <install-dir>/dist/index.js
   Restart=on-failure
   RestartSec=10
   StandardOutput=journal
   StandardError=journal
   SyslogIdentifier=lavalink-server
   Environment=NODE_ENV=production
   EnvironmentFile=-<install-dir>/.env

   # Security hardening
   NoNewPrivileges=true
   PrivateTmp=true
   ProtectSystem=strict
   ProtectHome=true
   ReadWritePaths=<install-dir>/data <install-dir>/logs

   # Resource limits
   LimitNOFILE=65536
   LimitNPROC=4096

   [Install]
   WantedBy=multi-user.target
   EOF
   ```
   Replace `<user>` and `<install-dir>` with the actual values from your setup.

6. **Enable and start the service:**
   ```bash
   sudo systemctl daemon-reload
   sudo systemctl enable lavalink-server
   sudo systemctl start lavalink-server
   ```

7. **Check status and logs:**
   ```bash
   sudo systemctl status lavalink-server
   sudo journalctl -u lavalink-server -f
   ```

The service runs as root, loads `.env`, restarts on failure, and includes security hardening.

---

## 5. 🔒 Production Reverse Proxy with Nginx & Let's Encrypt (SSL/WSS)

To securely connect your Discord bot over standard HTTPS/WSS on port `443` with a custom domain (e.g. `lavalink.yourdomain.com`):

### Step 1: Install Nginx & Certbot
```bash
sudo apt install -y nginx certbot python3-certbot-nginx
```

### Step 2: Obtain an SSL Certificate
Ensure your domain's DNS `A` record points to your VPS IP, then run:
```bash
sudo certbot certonly --nginx -d lavalink.yourdomain.com
```

### Step 3: Configure Nginx Reverse Proxy
Create a configuration file at `/etc/nginx/sites-available/lavalink`:
```nginx
server {
    listen 80;
    server_name lavalink.yourdomain.com;
    return 301 https://$host$request_uri;
}

server {
    listen 443 ssl http2;
    server_name lavalink.yourdomain.com;

    ssl_certificate /etc/letsencrypt/live/lavalink.yourdomain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/lavalink.yourdomain.com/privkey.pem;

    # Optimal SSL security settings
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_prefer_server_ciphers on;
    ssl_ciphers "ECDHE-ECDSA-AES128-GCM-SHA256:ECDHE-RSA-AES128-GCM-SHA256:ECDHE-ECDSA-AES256-GCM-SHA384:ECDHE-RSA-AES256-GCM-SHA384";

    location / {
        # Gateway on the auto-derived port (internal port + 1 = 2334);
        # it serves /dashboard, /server, /v4/* and /health
        proxy_pass http://127.0.0.1:2334;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_set_header Authorization $http_authorization;
        proxy_read_timeout 86400s;
        proxy_send_timeout 86400s;
    }
}
```

Enable the configuration and reload Nginx:
```bash
sudo ln -s /etc/nginx/sites-available/lavalink /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

---

## 4. 🤖 Connecting Your Discord Bot

Once your server is running, update your Discord bot's configuration (e.g. Master-Bot `.env`). The server exposes **two networks**: the internal bind URL (`LAVA_INTERNAL_URL`) used only server-side, and the public URL (`LAVA_PUBLIC_URL`) that bots connect to. The public port is **masked** — bots use the public URL as-is and append the endpoint.

### Option A: Public domain via Cloudflare/Tunnel (masked port)
```env
LAVA_ENABLED=true
LAVA_EXTERNAL=true
LAVA_HOST=lavalink.yourdomain.com
LAVA_PORT=443
LAVA_PASS=your-chosen-password
LAVA_SECURE=true
```

### Option B: Direct VPS connection (raw IP / exposed node port)
```env
LAVA_ENABLED=true
LAVA_EXTERNAL=true
LAVA_HOST=your-vps-ip
LAVA_PORT=2333
LAVA_PASS=your-chosen-password
LAVA_SECURE=false
```

For more details on connecting with popular client libraries, see the [Client Integration Guide](Client-Integration).

---

## 5. 🔐 First Run: YouTube OAuth Authorization

On first startup (without a pre-configured `YOUTUBE_REFRESH_TOKEN`), the server will:

1. **Print a device authorization code** to the console:
   ```
   👉 1. Open in browser:  https://www.google.com/device
   👉 2. Enter code:       ABC-DEF-GHI
   👉 3. Or direct link:   https://www.google.com/device?user_code=ABC-DEF-GHI
   ```

2. **Wait for you to authorize** at `https://www.google.com/device`

3. **Auto-save the refresh token** to SQLite and apply it to Lavalink

4. **Continue starting** Lavalink Java process only after authorization succeeds

> **Important:** Your OAuth app must have your Google account added as a test user in Google Cloud Console (OAuth consent screen → Test users), or be published/verified.