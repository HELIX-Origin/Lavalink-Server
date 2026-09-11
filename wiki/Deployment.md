# 🚀 Cloud Deployment Guide

This guide details how to deploy the Lavalink v4 server to free and low-cost cloud platforms, container managers, and dedicated virtual private servers (VPS).

---

## ☁️ 1-Click Cloud Deployment Matrix

| Platform | Free Tier | Deploy Button |
| :--- | :---: | :--- |
| **Render** | ✅ 100% Free Web Service | [![Deploy to Render](https://render.com/images/deploy-to-render-button.svg)](https://render.com/deploy?repo=https://github.com/HELIX-Origin/Lavalink-Server) |
| **Railway** | ✅ Free Starter Trial | [![Deploy on Railway](https://railway.com/button.svg)](https://railway.com/new/template?template=https%3A%2F%2Fgithub.com%2FHELIX-Origin%2FLavalink-Server) |
| **Heroku** | ✅ Eco Dyno Support | [![Deploy to Heroku](https://www.herokucdn.com/deploy/button.svg)](https://heroku.com/deploy?template=https://github.com/HELIX-Origin/Lavalink-Server) |
| **Fly.io** | ✅ Free MicroVM Tier | [![Deploy to Fly.io](https://img.shields.io/badge/Deploy%20to-Fly.io-24185b?style=for-the-badge&logo=flydotio&logoColor=white)](#flyio) |

---

## 1. 🟣 Render (`render.com`)

Render allows deploying Docker containers on its Free plan with zero credit card required.

### Blueprint Deployment
1. Click the **Deploy to Render** button above or navigate to [dashboard.render.com](https://dashboard.render.com) > **New +** > **Blueprint**.
2. Connect the repository: `https://github.com/HELIX-Origin/Lavalink-Server`.
3. Render will read `render.yaml` automatically:
   - **Runtime:** `Docker`
   - **Plan:** `Free`
   - **Port:** Render automatically sets `PORT=10000`.
4. Fill in any optional keys (e.g. `YOUTUBE_REFRESH_TOKEN`, `SPOTIFY_CLIENT_ID`) or leave them empty.
5. Click **Apply**.
6. Once deployed, note your service URL: `your-app-name.onrender.com`.

> [!TIP]
> **Zero Sleep Throttling via Keep-Alive Service**:
> Render's free tier would normally spin down containers after 15 minutes of inbound HTTP inactivity. This server includes a built-in **Keep-Alive Service** (`KEEP_ALIVE_ENABLED=true`) that automatically pings `/health` every 10 minutes, generating the necessary inbound HTTP traffic to maintain 24/7 active status without manual intervention.

---

## 2. 🚂 Railway (`railway.app`)

Railway deploys containerized applications with fast provisioning and automatic SSL certificate generation.

### Step-by-Step
1. Click the **Deploy on Railway** button above.
2. Railway clones and builds the `Dockerfile` using Dockerfile builder mode.
3. Under **Settings > Networking**, click **Generate Domain** (e.g. `lavalink-production.up.railway.app`).
4. Under **Variables**, you can customize:
   - `LAVA_PASS`: Set your custom authentication password.
   - Any YouTube or Spotify plugin credentials.
5. Connect your bot using:
   - `Host`: `lavalink-production.up.railway.app`
   - `Port`: `443`
   - `Secure`: `true`

---

## 3. 🟪 Heroku (`heroku.com`)

Heroku builds and runs the container using `heroku.yml` and `app.json`.

### Deploying via Button
1. Click the **Deploy to Heroku** button above.
2. Fill in your App Name.
3. Verify your configuration variables (`LAVA_PASS`, etc.).
4. Heroku will build the container using Docker stack.
5. Connect using your Heroku app domain (`your-app.herokuapp.com`) on port `443` with TLS enabled.

---

## 4. ✈️ Fly.io (`fly.io`)

Fly.io launches the container inside lightweight global microVMs.

### Deployment Steps
```bash
# Clone the repository
git clone https://github.com/HELIX-Origin/Lavalink-Server.git
cd Lavalink-Server

# Launch Fly app (do not deploy immediately)
fly launch --no-deploy

# Set your secrets
fly secrets set LAVA_PASS="youshallnotpass"

# Deploy
fly deploy
```

---

## 5. 🖥️ Dedicated VPS / Docker Compose

For high-volume production bots, hosting Lavalink on a small Linux VPS (Ubuntu/Debian) is recommended:

```bash
git clone https://github.com/HELIX-Origin/Lavalink-Server.git
cd Lavalink-Server

# Start in background
docker compose up -d
```

### Reverse Proxy with Nginx & SSL (Let's Encrypt)
To expose port `2333` securely over standard HTTPS/WSS on port `443`:

```nginx
server {
    listen 443 ssl http2;
    server_name lavalink.yourdomain.com;

    ssl_certificate /etc/letsencrypt/live/lavalink.yourdomain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/lavalink.yourdomain.com/privkey.pem;

    location / {
        proxy_pass http://127.0.0.1:2333;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Forwarded-For $remote_addr;
        proxy_set_header Authorization $http_authorization;
        proxy_read_timeout 86400;
    }
}
```
