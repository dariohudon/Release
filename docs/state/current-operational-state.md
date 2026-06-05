# Current Operational State — release

## Foundation

- Project Name: release
- Folder: /var/www/release
- Repo: dariohudon/Release
- Branch: milestone-01-sprint-01-sonarr-episode-radar
- Domain: release.brightening.ca
- Port: 3033
- PM2 Process: release
- Tmux Session: release
- Tmux Launcher: tmux-release

## Current Status

Milestone 01 Sprint 01 complete. Release Radar is live and showing real Sonarr episode data.

## Stack

- Framework: Next.js 15.5.19 (App Router, TypeScript)
- Node: 20.x
- Port: 3033
- Data: Sonarr API v3 (calendar endpoint)

## Key Routes

- `/` — Release Radar — Episode cards (past 7 days / next 7 days)
- `/api/health` — Health check with Sonarr status

## Integrations

- Sonarr: configured, reachable, v4.0.17.2952

## Checks

- Build: passing
- Type check: passing
- Lint: passing

## Next Steps

1. Sprint 02 — TBD (Plex, notifications, or additional features)
