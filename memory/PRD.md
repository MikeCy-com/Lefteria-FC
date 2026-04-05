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
│   ├── App.js                 # Public pages, auth, routing, POTM top3, birthday ticker
│   ├── pages/
│   │   ├── AdminPanel.jsx     # Standalone CMS (13 tabs + Match Control Center)
│   │   ├── TeamHubPage.jsx    # SportsPress-style tabbed Team page (6 tabs)
│   │   ├── PlayerProfilePage.jsx  # Hero banner + stat bars + tabbed profile
│   │   ├── MatchReportPage.jsx    # Full match detail with event timeline
│   │   ├── ShopPage.jsx      # Tickets & Merchandise info page
│   │   └── VotePage.jsx      # Dedicated POTM voting page (all players)
│   ├── components/ImageUpload.jsx
│   ├── utils/
│   │   ├── sounds.js          # Web Audio API sound effects
│   │   └── pushNotifications.js # Web Push subscription logic
│   └── components/ui/         # Shadcn components
```

## What's Been Implemented
- Full Admin CMS with 13+ tabs
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
- **Player of the Month voting** — Top 3 on homepage, full voting at /vote page
- **Birthday celebrations** — Compact rotating ticker on homepage
- **Greek font size optimization** — Reduced Bebas Neue titles globally
- **Fixtures cleanup** — Removed competition badge, streamlined match rows

## Bug Fixes
- 2026-04: Fixed missing first-team players (10 of 20 marked is_active=False; reactivated)

## Key API Endpoints
- `GET /api/players/birthdays` — Players with birthdays in current month
- `POST /api/votes/potm` — Cast a Player of the Month vote
- `GET /api/votes/potm/results` — Current month voting leaderboard
- `GET /api/votes/potm/check` — Check if visitor already voted
- `GET /api/admin/votes/potm` — Admin: view voting stats
- `DELETE /api/admin/votes/potm/reset` — Admin: reset current month votes

## Routes
- `/` — Homepage (hero, fixtures, birthdays, POTM top 3, standings, news, academy CTA)
- `/vote` — Dedicated Player of the Month voting page
- `/team` — Team Hub (6 tabs)
- `/player/:id` — Player profile
- `/match/:id` — Match report
- `/about`, `/academy`, `/news`, `/contact`, `/shop`
- `/admin/login` — Admin CMS

## Backlog (P3)
- Video uploads in gallery
- AI-generated match report narratives
- Multi-language support (English toggle for the UI)

## Key Technical Notes
- Frontend team name constant: `OUR_TEAM = "ΛΕΥΤΕΡΙΑ 2024"`
- Backend serves uploaded files via `/api/uploads/{path}`
- Push notifications use VAPID keys in .env
- server.py is ~2050 lines — consider splitting into FastAPI routers
- Birthday endpoint registered before `/players/{player_id}` to avoid route conflict
- POTM voting uses SHA-256(IP + User-Agent) fingerprint
- Birthday ticker uses CSS @keyframes ticker-scroll animation
