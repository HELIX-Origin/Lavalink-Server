# Lavalink-Server Agents Ecosystem

This directory contains the agent rules, skills, and configurations for the Lavalink-Server project.

## Structure

```
.agents/
├── rules.md           # Core rules and constraints (ENTRY POINT)
├── skills/
│   ├── config-management.md    # Configuration management skill
│   ├── docker-deployment.md    # Docker deployment skill
│   ├── plugin-management.md    # Lavalink plugin management skill
│   ├── youtube-oauth.md        # YouTube OAuth flow skill
│   └── dashboard-development.md # Dashboard development skill
└── agents/
    ├── config-agent.md         # Configuration management agent
    ├── docker-agent.md         # Docker deployment agent
    ├── plugin-agent.md         # Plugin management agent
    └── dashboard-agent.md      # Dashboard development agent
```

## Quick Start

1. **Read `rules.md` first** - Contains all critical constraints and current state
2. **Check relevant skill** - Before making changes, read the relevant skill file
3. **Follow agent workflow** - Use the appropriate agent for the task

## Current Project State (Summary)

- **Tech Stack**: Node.js + TypeScript (ESM), Java 21 (Lavalink), Docker
- **Architecture**: Lavalink JAR + TypeScript supervisor/proxy/dashboard
- **Plugins**: YouTube, LavaSrc, SponsorBlock, LavaSearch, LavaLyrics, Skybot
- **Auth**: YouTube OAuth device flow (public, no admin console)
- **Config**: Environment-based (LAVA_DOMAIN, LAVA_HOST, LAVA_PORT, etc.) — no YAML parsing in TypeScript
- **Deployment**: Docker Compose (primary), Systemd (manual)

## Critical Reminders

1. **ONLY USE CURRENT .ENV KEYS** - See rules.md for complete list
2. **NO DEAD CODE** - Remove ALL references when removing features
3. **NO HARDCODED VALUES** - Everything from config/env
4. **CHECK .ENV FIRST** - Before any config changes