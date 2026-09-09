# Development & Contributor Guide

## Architecture Philosophy
- Zero build-step ES module frontend for instant browser rendering and maximum resilience in low-bandwidth military/tactical environments.
- Shared reactive event store (`frontend/shared/js/store.js`) ensuring seamless synchronization across Control Room, Field Recon, and Driver modules.
- Strict WCAG AA high-contrast tactical HUD styling with zero reliance on generic SaaS visual slop.

## Local Development
- Run static web server: `node server.js`
- Port: `3000` (Reverse-proxied)
- Lint check: `npm run lint`
- Build check: `npm run build`
