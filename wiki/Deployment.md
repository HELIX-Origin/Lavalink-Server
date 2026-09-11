# 🚀 Deployment Guide

This guide details how to deploy your dedicated Lavalink v4 audio server using **Heroku** (manual CLI container deployment), **Docker Compose**, or a **Dedicated Linux VPS**.

---

> [!WARNING]
> ### ⚠️ Cloud Hosting Ban Advisory (Render, Railway, Fly.io)
> **Do NOT deploy Lavalink to free shared cloud platforms like Render or Railway.**
> Platforms like Render and Railway aggressively flag and ban user accounts for running continuous audio streaming proxies and YouTube scraping containers.
>
> **Supported Hosting Options:**
> - **Heroku:** Supported via manual CLI deployment (`heroku.yml` & `Dockerfile`) with dedicated dyno allocation.
> - **Dedicated VPS:** Highly recommended for production bots (Hetzner, DigitalOcean, Linode, OVHcloud, Oracle Cloud Free Tier VM).
> - **Self-Hosted:** Run locally or on a private server via Docker Compose.

---

## 1. 🟪 Heroku (`heroku.com`) - Manual CLI Deployment (Exclusive)

Heroku runs the containerized Lavalink server using the container stack defined by `heroku.yml` and the repo's `Dockerfile`. **Heroku is our only supported cloud hosting platform, and deployment is done manually with the Heroku CLI so your `.env` configuration and `application.yml` are always used.**

### Step-by-Step Instructions:
1. Install and authenticate the [Heroku CLI](https://devcenter.heroku.com/articles/heroku-cli):
   ```bash
   heroku login
   ```
2. Clone the repository and configure your `.env`:
   ```bash
   git clone https://github.com/HELIX-Origin/Lavalink-Server.git
   cd Lavalink-Server
   cp .env.example .env
   ```
3. Create a Heroku app (the container stack is detected from `heroku.yml`):
   ```bash
   heroku create my-lavalink-node
   ```
4. Apply your `.env` configuration as Heroku config vars:
   ```bash
   heroku config:set LAVA_PASS=MySuperSecretLavaPass123! \
     YOUTUBE_REFRESH_TOKEN=... \
     SPOTIFY_CLIENT_ID=... \
     SPOTIFY_CLIENT_SECRET=...
   ```
   Set only the variables you need — unset ones fall back to the defaults baked into `application.yml`.
5. Deploy (Heroku builds the Dockerfile and boots the TypeScript supervisor):
   ```bash
   git push heroku main
   ```
6. Once deployed, connect your Discord bot using:
   - **Host:** `your-app-name.herokuapp.com`
   - **Port:** `443`
   - **Secure:** `true`

---

## 2. 🐳 Quick Start: Docker Compose (Recommended for VPS)

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

## 3. 🐧 Linux VPS Setup (Ubuntu / Debian)

If you are setting up a fresh VPS (e.g. on Hetzner or DigitalOcean):

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
Follow the steps in [Quick Start: Docker Compose](#2--quick-start-docker-compose-recommended-for-vps) above.

---

## 4. 🔒 Production Reverse Proxy with Nginx & Let's Encrypt (SSL/WSS)

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

## 5. 🤖 Connecting Your Discord Bot

Once your server is running, update your Discord bot's configuration (e.g. Master-Bot `.env`):

### Option A: Heroku Deployment (Port 443, Secure)
```env
LAVA_ENABLED=true
LAVA_EXTERNAL=true
LAVA_HOST=your-app-name.herokuapp.com
LAVA_PORT=443
LAVA_PASS=your-chosen-password
LAVA_SECURE=true
```

### Option B: Direct VPS Connection (Raw IP / Port 2333)
```env
LAVA_ENABLED=true
LAVA_EXTERNAL=true
LAVA_HOST=your-vps-ip
LAVA_PORT=2333
LAVA_PASS=your-chosen-password
LAVA_SECURE=false
```

### Option C: VPS with Domain & SSL Reverse Proxy (Port 443)
```env
LAVA_ENABLED=true
LAVA_EXTERNAL=true
LAVA_HOST=lavalink.yourdomain.com
LAVA_PORT=443
LAVA_PASS=your-chosen-password
LAVA_SECURE=true
```

For more details on connecting with popular client libraries, see the [Client Integration Guide](Client-Integration.md).
