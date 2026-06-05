# Current Operational State — release

## Foundation

- Project Name: release
- Folder: /var/www/release
- Repo: dariohudon/Release
- Branch: main
- Domain: release.brightening.ca
- Port: 3033
- PM2 Process: release
- Tmux Session: release
- Tmux Launcher: tmux-release

## Current Status

App foundation complete. Next.js 15.5.19 TypeScript app initialized and building cleanly.

## Stack

- Framework: Next.js 15.5.19 (App Router, TypeScript)
- Node: 20.x
- Port: 3033

## Key Routes

- `/` — Dashboard / landing page
- `/api/health` — Health check endpoint (JSON)

## Checks

- Build: passing
- Type check: passing
- Lint: passing

## Next Steps

1. Configure PM2 and start the process.
2. Implement core features.
3. Configure Nginx/Cloudflare when ready.
