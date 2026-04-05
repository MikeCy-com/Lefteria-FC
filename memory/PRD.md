# Lefteria FC / ΛΕΥΤΕΡΙΑ 2024 — PRD

## Original Problem Statement
Create a website for ΛΕΥΤΕΡΙΑ 2024 football club (Limassol, Cyprus, ΠΑΑΟΚ league) with academy section, SportsPress-style design, full CMS admin panel with live match management. Official ΠΑΑΟΚ Α' Όμιλος 2025-2026 data seeded.

## Core Requirements
- Club branding: Orange/gold (#F5A623), Black, White
- WordPress/SportsPress-style design, entire website in Greek
- Hidden admin panel at /admin/login (JWT protected)
- MongoDB database, real official ΠΑΑΟΚ data (105 fixtures, 11 teams)

## Architecture
```
/app/
├── backend/
│   ├── server.py              # FastAPI monolith (~2050 lines)
│   ├── seed_official_data.py  # Official ΠΑΑΟΚ 2025-2026 data seeder
│   ├── uploads/               # Player images, gallery photos
│   └── .env                   # MONGO_URL, VAPID keys, JWT config
├── frontend/src/
│   ├── App.js                 # Public pages, auth, routing, live widget, POTM, birthdays
│   ├── pages/
│   │   ├── AdminPanel.jsx     # Standalone CMS (13 tabs + Match Control Center)
│   │   ├── TeamHubPage.jsx    # SportsPress-style tabbed Team page (6 tabs)
│   │   ├── PlayerProfilePage.jsx  # Hero banner + stat bars + tabbed profile
│   │   ├── MatchReportPage.jsx    # Full match detail with event timeline
│   │   └── ShopPage.jsx      # Tickets & Merchandise info page
│   ├── components/ImageUpload.jsx
│   ├── utils/
│   │   ├── sounds.js          # Web Audio API sound effects
│   │   └── pushNotifications.js # Web Push subscription logic
│   └── components/ui/         # Shadcn components
```

## What's Been Implemented
- Full Admin CMS with 13+ tabs (Players, Fixtures, Standings, Gallery, Transfers, Staff, Academy, Settings, etc.)
- Centralized Team Hub page with 6 tabs (Overview, Roster, Results, Schedule, Gallery, Standings)
- Player Profile page with hero banner and tabbed layout
- Match Report page with event timeline
- League Table with configurable column toggles
- Gallery/Media uploads (Admin + public views)
- Web Push Notifications (PyWebPush + Service Worker)
- Player Transfer History tracking
- Shop/Tickets showcase page
- Official ΠΑΑΟΚ Α' Όμιλος 2025-2026 data seeded (105 fixtures, 11 standings)
- Live Match widget with real-time scoring
- **Player of the Month voting** — fans vote for favourite player, one vote/month per visitor, results leaderboard
- **Birthday celebrations** — homepage section showing players with birthdays this month (first team + academy)

## Bug Fixes
- 2026-04: Fixed missing first-team players (10 of 20 were accidentally marked is_active=False; reactivated via DB update)

## Key API Endpoints (new)
- `GET /api/players/birthdays` — Returns players with birthdays in the current month
- `POST /api/votes/potm` — Cast a Player of the Month vote
- `GET /api/votes/potm/results` — Current month voting leaderboard
- `GET /api/votes/potm/check` — Check if current visitor already voted
- `GET /api/admin/votes/potm` — Admin: view voting stats
- `DELETE /api/admin/votes/potm/reset` — Admin: reset current month votes

## DB Collections (new)
- `potm_votes`: {id, player_id, player_name, voter_fingerprint, month_key, created_at}

## Backlog (P3)
- Video uploads in gallery
- AI-generated match report narratives
- Multi-language support (English toggle for the UI)

## Key Technical Notes
- Frontend team name constant: `OUR_TEAM = "ΛΕΥΤΕΡΙΑ 2024"` (used in TeamHubPage.jsx and App.js for highlighting)
- Backend serves uploaded files via `/api/uploads/{path}` endpoint
- Push notifications use VAPID keys stored in backend/.env and frontend/.env
- server.py is ~2050 lines — consider splitting into FastAPI routers if more backend work is needed
- Birthday endpoint MUST be registered before `/players/{player_id}` route to avoid conflicts
- POTM voting uses SHA-256 hash of IP + User-Agent as voter fingerprint
