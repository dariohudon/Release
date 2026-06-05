# Current Operational State — release

## Foundation

- Project Name: release
- Folder: /var/www/release
- Repo: dariohudon/Release
- Branch: milestone-01-sprint-03-plex-confirmation-and-mvp-lock
- Domain: release.brightening.ca
- Port: 3033
- PM2 Process: release
- Tmux Session: release
- Tmux Launcher: tmux-release

## Current Status

**Milestone 01 MVP Complete — 3 sprints done.**

Release Radar is fully operational. Sonarr provides episode schedules and poster artwork; Plex confirms watchability. The app degrades gracefully if either service is unavailable.

## Stack

- Framework: Next.js 15.5.19 (App Router, TypeScript, server components)
- Node: 20.x
- Port: 3033

## Key Routes

- `/` — Release Radar — Episode cards with Plex-aware status + Monitored Shows section
- `/api/health` — Health check with Sonarr and Plex status

## Integrations

| Service | Status |
|---|---|
| Sonarr | Configured, reachable, v4.0.17.2952 — 11 monitored shows |
| Plex | Configured, reachable, v1.42.2 — TV Shows library found |

## Episode Status Model

| Status | Meaning |
|---|---|
| Upcoming | Air date in the future |
| Downloaded in Plex | Sonarr hasFile + Plex confirms availability |
| Waiting for Plex | Sonarr hasFile, not yet visible in Plex |
| Downloaded | Sonarr hasFile, Plex not configured |
| Missing | Aired, no Sonarr file |

## Checks

- Build: passing
- Type check: passing
- Lint: passing

## MVP Limitations

- No auth, database, notifications, qBittorrent, Prowlarr, or show detail pages
- Calendar window: 7 days past to 7 days ahead
- Episode matching uses normalized title + season + episode (no tvdbId fallback)

## Next Steps

Sprint 04 — TBD
