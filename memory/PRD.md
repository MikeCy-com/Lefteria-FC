# Lefteria FC — Product Requirements & Status

## Original Problem Statement
Complete football club CMS + public website for **Lefteria FC**, including:
- Centralized Team Hub, Player Profiles, Match Reports, Academy Management
- Season statistics and archives
- Comprehensive club management tools (Admin CMS)
- Mobile PWA app with role-based OTP login
- Frontend UI strictly in **Greek** (no accents on uppercase Greek)
- Production deployment on Hostinger VPS via Docker + Traefik

## Tech Stack
- **Frontend**: React + Tailwind CSS, PWA setup
- **Backend**: FastAPI, MongoDB (Motor), PyJWT
- **Integrations**: `reportlab` (PDF receipts), `twilio` (SMS — configurable via Admin UI), Web Push (native VAPID)
- **Deployment**: Docker, Docker Compose, Traefik reverse proxy, Nginx

## Code Architecture
```
/app/
├── backend/
│   ├── server.py
│   ├── models.py
│   ├── routes/
│   │   ├── mobile_auth.py
│   │   └── charges.py
│   └── tests/
├── frontend/
│   ├── src/
│   │   ├── App.js
│   │   ├── pages/
│   │   │   ├── NewsArticlePage.jsx
│   │   │   └── PastSeasonsPage.jsx
│   │   ├── admin/
│   │   │   └── ChargesTab.jsx
│   │   ├── mobile/
│   │   └── components/
│   │       └── SponsorSpotlight.jsx
└── deploy/
    ├── docker-compose.yml         # Traefik v3 — 4-router pattern (apex+www × https+http)
    ├── frontend/nginx.conf        # serves SPA on :80, proxies /api → backend:8001
    ├── academy_data_seed.json
    └── seed_academy_data.py
```

## Completed Features
- Public website (Greek) with Home, Team, Academy, Fixtures, Standings, News, Past Seasons, Sponsors, Contact
- Admin CMS: Players, Staff, Teams, Fixtures, Match Reports, Standings, News, Sponsors, Charges, Settings
- Mobile PWA with OTP login (Twilio configurable; mock toggle in Admin Settings)
- Push notifications (VAPID) — match reminders, POTM
- Player Charges/Fees system with PDF receipts (reportlab)
- Bulk CSV fixture import
- Season Archive workflow (snapshot + Past Seasons public page)
- Sponsor Spotlight homepage widget
- Markdown news articles with images
- Configurable social media (club + sponsors) shown in footer/pages
- Player slugs (academy last-names masked)
- Automated standings recalc from match results
- Greek-accent uppercase guards across public UI

## Deployment Status — ✅ LIVE
- **Domain**: https://lefteriafc.cy and https://www.lefteriafc.cy
- **Traefik routing**: 4 separate routers (apex/www × https/http-redirect) using Traefik v3-safe single-host rules. No `||` in router rules.
- **Cert resolver**: `letsencrypt` — confirmed issuing real certs.
- **Last verified**: Feb 2026 by user ("i have and https").

## Pending Items
### P2 — Regression checks (testing pending)
- Match-day push notifications (`/api/admin/push/match-reminder`)
- POTM social share (`VoteShareSection` in `VotePage.jsx`)

### P3 — Future / Backlog
- Video uploads in gallery
- AI-generated match report narratives
- Multi-language toggle (EN/GR)

## Key API Endpoints
- `POST /api/admin/seasons/{id}/archive`
- `GET  /api/admin/charges`
- `GET  /api/charges/{id}/receipt`
- `POST /api/admin/push/match-reminder`

## Critical Notes
- **Language**: UI text strictly Greek. NEVER use accents on uppercase Greek.
- **Traefik rules**: Always one `Host()` per router (Traefik v3 rejects multi-arg `Host()`).
- **OTP**: Respect Admin Settings mock toggle.
- **Mongo**: Exclude `_id` from all API responses.

## Test Credentials
See `/app/memory/test_credentials.md`.
