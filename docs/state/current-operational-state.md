# Current Operational State — release

## Foundation

- Project Name: release
- Folder: /var/www/release
- Repo: dariohudon/Release
- Branch: milestone-01-sprint-02-monitored-shows-and-poster-cards
- Domain: release.brightening.ca
- Port: 3033
- PM2 Process: release
- Tmux Session: release
- Tmux Launcher: tmux-release

## Current Status

Milestone 01 Sprint 02 complete. Episode cards show TheTVDB poster artwork. All 11 monitored Sonarr shows listed in a dedicated section.

## Stack

- Framework: Next.js 15.5.19 (App Router, TypeScript)
- Node: 20.x
- Port: 3033
- Data: Sonarr API v3 (calendar + series endpoints)

## Key Routes

- `/` — Release Radar — Episode cards with posters (Recent/Upcoming) + Monitored Shows section
- `/api/health` — Health check with Sonarr status

## Integrations

- Sonarr: configured, reachable, v4.0.17.2952 — 11 monitored shows

## Checks

- Build: passing
- Type check: passing
- Lint: passing

## Next Steps

1. Sprint 03 — TBD
