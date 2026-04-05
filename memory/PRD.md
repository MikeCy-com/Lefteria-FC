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
│   ├── App.js                 # Public pages, auth, routing, POTM top3, birthday ticker, ScrollToTop
│   ├── pages/
│   │   ├── AdminPanel.jsx     # Standalone CMS (13 tabs + Match Control Center)
│   │   ├── TeamHubPage.jsx    # SportsPress-style tabbed Team page (6 tabs)
│   │   ├── PlayerProfilePage.jsx  # Hero banner + stat bars + tabbed profile
│   │   ├── MatchReportPage.jsx    # Full match detail with event timeline
│   │   ├── ShopPage.jsx      # Tickets & Merchandise info page
│   │   └── VotePage.jsx      # Trustworthy POTM voting: identity form, leaderboard, detail modal, withdraw
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
- **Trustworthy POTM Voting System** — Name+Email identity, vote counts always visible, player detail modal with voter list, withdraw/revote, 1 vote per email per month
- **Birthday celebrations** — Compact rotating ticker on homepage
- **Greek font size optimization** — Reduced Bebas Neue titles globally
- **Fixtures cleanup** — Removed competition badge, streamlined match rows
- **Ανδρέας Πραστίτης profile image** — Fetched from lefteriafc.cy and stored locally
- **Auto scroll-to-top on navigation** — ScrollToTop component in BrowserRouter

## Bug Fixes
- 2026-04: Fixed missing first-team players (10 of 20 marked is_active=False; reactivated)
- 2026-04: Added ScrollToTop to fix SPA scroll persistence between route changes

## Key API Endpoints
- `POST /api/votes/potm` — Cast vote (requires voter_name, voter_email, player_id)
- `POST /api/votes/potm/withdraw` — Withdraw vote (requires voter_email)
- `GET /api/votes/potm/results` — Public leaderboard with voter names per player
- `GET /api/votes/potm/check?email=xxx` — Check if email has voted this month
- `GET /api/votes/potm/player/{player_id}` — Player detail with voter list
- `GET /api/admin/votes/potm` — Admin: view voting stats with emails
- `DELETE /api/admin/votes/potm/reset` — Admin: reset current month votes
- `GET /api/players/birthdays` — Players with birthdays in current month

## Routes
- `/` — Homepage (hero, fixtures, birthdays, POTM top 3, standings, news, academy CTA)
- `/vote` — Trustworthy POTM voting page (identity, leaderboard, player detail modal, withdraw)
- `/team` — Team Hub (6 tabs)
- `/player/:id` — Player profile
- `/match/:id` — Match report
- `/about`, `/academy`, `/news`, `/contact`, `/shop`
- `/admin/login` — Admin CMS

## Backlog (P3)
- Video uploads in gallery
- AI-generated match report narratives
- Multi-language support (English toggle for the UI)
- Refactor server.py into FastAPI routers

## Key Technical Notes
- Frontend team name constant: `OUR_TEAM = "ΛΕΥΤΕΡΙΑ 2024"`
- Backend serves uploaded files via `/api/uploads/{path}`
- Push notifications use VAPID keys in .env
- server.py is ~2050 lines — consider splitting into FastAPI routers
- Birthday endpoint registered before `/players/{player_id}` to avoid route conflict
- POTM voting uses email-based uniqueness (unique index on voter_email + month_key)
- Voter identity stored in localStorage (potm_voter_name, potm_voter_email)
- Birthday ticker uses CSS @keyframes ticker-scroll animation
