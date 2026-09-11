# 🤖 Discord Bot Client Integration Guide

This guide explains how to connect various Discord bot frameworks and libraries to this external Lavalink v4 server.

---

## 1. Master-Bot (Sapphire Framework)

In Master-Bot, simply update your root `.env` file (or cloud dashboard environment variables):

```env
# Enable audio commands
LAVA_ENABLED=true

# MUST be set to true for external cloud hosting
LAVA_EXTERNAL=true

# Public hostname of your Lavalink server (without http:// or /)
LAVA_HOST="your-lavalink-server.onrender.com"

# Standard HTTPS/WSS proxy port on cloud platforms
LAVA_PORT=443

# Authentication password matching LAVA_PASS on your server
LAVA_PASS="youshallnotpass"

# Set to true for WSS/HTTPS cloud connections
LAVA_SECURE=true
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
      host: "your-lavalink-server.onrender.com",
      port: 443,
      secure: true, // true for cloud (wss://), false for local (ws://)
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
    name: "cloud-node",
    url: "your-lavalink-server.onrender.com:443",
    auth: "youshallnotpass",
    secure: true,
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
      url: "your-lavalink-server.onrender.com:443",
      auth: "youshallnotpass",
      secure: true,
    },
  ]
);
```
