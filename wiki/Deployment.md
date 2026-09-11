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
- `DOMAIN`: Your public domain/host for the server (e.g. `lavalink.yourdomain.com`).
- `YOUTUBE_REFRESH_TOKEN`: *(Optional)* If you already generated a YouTube OAuth refresh token.
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
http://<your-server-ip>:2333
```

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
Ensure port `2333` (or `443` if using Nginx) and SSH are allowed:
```bash
sudo ufw allow OpenSSH
# If connecting directly to Lavalink:
sudo ufw allow 2333/tcp
# If using Nginx reverse proxy with SSL:
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp

sudo ufw enable
```

### Step 3: Run with Docker Compose
Follow the steps in [Quick Start: Docker Compose](#1--quick-start-docker-compose-recommended-for-vps) above.

---

## 3. 🔒 Production Reverse Proxy with Nginx & Let's Encrypt (SSL/WSS)

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
        proxy_pass http://127.0.0.1:2333;
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

Once your server is running, update your Discord bot's configuration (e.g. Master-Bot `.env`):

### Option A: Direct VPS Connection (Raw IP / Port 2333)
```env
LAVA_ENABLED=true
LAVA_EXTERNAL=true
LAVA_HOST=your-vps-ip
LAVA_PORT=2333
LAVA_PASS=your-chosen-password
LAVA_SECURE=false
```

### Option B: VPS with Domain & SSL Reverse Proxy (Port 443)
```env
LAVA_ENABLED=true
LAVA_EXTERNAL=true
LAVA_HOST=lavalink.yourdomain.com
LAVA_PORT=443
LAVA_PASS=your-chosen-password
LAVA_SECURE=true
```

For more details on connecting with popular client libraries, see the [Client Integration Guide](Client-Integration.md).