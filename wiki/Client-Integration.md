# 🤖 Discord Bot Client Integration Guide

This guide explains how to connect various Discord bot frameworks and libraries to this external Lavalink v4 server.

---

## 1. Master-Bot (Sapphire Framework)

In Master-Bot, simply update your root `.env` file (or cloud dashboard environment variables):

### Example A: Heroku Deployment (Port 443, SSL/WSS)
```env
LAVA_ENABLED=true
LAVA_EXTERNAL=true
LAVA_HOST="your-app-name.herokuapp.com"
LAVA_PORT=443
LAVA_PASS="youshallnotpass"
LAVA_SECURE=true
```

### Example B: Dedicated VPS or Local Docker (Port 2333)
```env
LAVA_ENABLED=true
LAVA_EXTERNAL=true
LAVA_HOST="your-vps-ip"
LAVA_PORT=2333
LAVA_PASS="youshallnotpass"
LAVA_SECURE=false
```

> [!IMPORTANT]
> Notice that `LAVA_EXTERNAL=true` is only set here in Master-Bot's `.env`. The Lavalink server itself does not use or need this variable.

---

## 2. Lavalink-Client (TypeScript / JavaScript)

[lavalink-client](https://github.com/tomato6966/lavalink-client) is the modern TypeScript client for Lavalink v4:

```typescript
import { LavalinkManager } from "lavalink-client";

const client = new LavalinkManager({
  nodes: [
    {
      authorization: process.env.LAVA_PASS || "youshallnotpass",
      host: "your-vps-ip-or-domain.com",
      port: 2333, // or 443 if using Nginx reverse proxy
      secure: false, // true if using an SSL domain (wss://), false for direct IP (ws://)
      id: "main-node",
    },
  ],
  sendToShard: (guildId, payload) => {
    bot.guilds.cache.get(guildId)?.shard.send(payload);
  },
  client: {
    id: process.env.DISCORD_CLIENT_ID!,
    username: "Master-Bot",
  },
});
```

---

## 3. Shoukaku (discord.js)

[Shoukaku](https://github.com/Deivu/Shoukaku) is a lightweight Lavalink wrapper:

```typescript
import { Shoukaku, Connectors } from "shoukaku";

const Nodes = [
  {
    name: "main-node",
    url: "your-vps-ip-or-domain.com:2333", // or :443 if using SSL reverse proxy
    auth: "youshallnotpass",
    secure: false, // true if SSL is enabled
  },
];

const shoukaku = new Shoukaku(new Connectors.DiscordJS(client), Nodes);

shoukaku.on("error", (name, error) => console.error(`Node ${name} error:`, error));
shoukaku.on("ready", (name) => console.log(`Node ${name} connected!`));
```

---

## 4. Poru / Kazagumo

```typescript
import { Kazagumo } from "kazagumo";
import { Connectors } from "shoukaku";

const kazagumo = new Kazagumo(
  {
    defaultSearchEngine: "youtube",
    send: (guildId, payload) => {
      const guild = client.guilds.cache.get(guildId);
      if (guild) guild.shard.send(payload);
    },
  },
  new Connectors.DiscordJS(client),
  [
    {
      name: "lavalink",
      url: "your-vps-ip-or-domain.com:2333", // or :443 if using SSL reverse proxy
      auth: "youshallnotpass",
      secure: false,
    },
  ]
);
```
