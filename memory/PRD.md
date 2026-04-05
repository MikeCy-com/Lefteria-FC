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
│   ├── server.py              # FastAPI monolith (~1900 lines)
│   ├── seed_official_data.py  # Official ΠΑΑΟΚ 2025-2026 data seeder
│   ├── uploads/               # Player images, gallery photos
│   └── .env                   # MONGO_URL, VAPID keys, JWT config
├── frontend/src/
│   ├── App.js                 # Public pages, auth, routing, live widget
│   ├── pages/
│   │   ├── AdminPanel.jsx     # Standalone CMS (13 tabs + Match Control Center)
│   │   ├── TeamHubPage.jsx    # SportsPress-style tabbed Team page (6 tabs)
│   │   ├── PlayerProfilePage.jsx  # Hero banner + stat bars + tabbed profile
│   │   ├── MatchReportPage.jsx    # Full match detail with event timeline
│   │   └── ShopPage.jsx      # Tickets & Merchandise info page
│   ├── components/ImageUpload.jsx
│   ├── utils/
│   │   ├── sounds.js          # Web Audio API sound effects
│   │   └── pushNotifications.js # Service worker + push subscription
│   └── index.css
└── memory/
```

## Implemented Features (All Complete)

### Public Website (7 nav items)
- Home (hero, live widget, dynamic stats bar, fixtures, standings with GF/GA/GD, news)
- About, Academy (grouped by age), News, Contact form
- **Team Hub** (/team) — 6 tabs:
  - Overview: Game Scoreboard, Games History (W/D/L chart), Roster preview, Latest Results, Team Stats, Staff
  - Roster: Full player table with position filter, Goals/Assists/Minutes columns
  - Results: All 105 league fixtures with status filter, clickable → Match Report
  - Schedule: Calendar grid with month navigation (Sep 2025 - Mar 2026)
  - Gallery: Photo grid with 6 category filters, fullscreen lightbox with navigation
  - Venues: Venue cards with Google Maps iframes
- **Player Profile** (/player/:id) — Hero banner, stat bars, 3 tabs (Overview, Statistics, Biography), transfer history, linked gallery
- **Match Report** (/match/:id) — Score header, event timeline, match statistics bars, summary
- **Tickets & Merchandise** (/shop) — Ticket prices (€5/€3/Free), merchandise grid, Season Pass (€40), contact info

### Admin CMS (13 tabs)
- Dashboard, Club Profile, Players (with file upload + transfer), Academy Groups
- Staff, Fixtures, Standings (with Recalculate All + Column Config), News, Venues, Seasons, Gallery, Messages
- Live Score tab → Match Control Center
- Standings Column Config: Toggle GF/GA/GD/Form columns
- Gallery Management: Upload photos with category, player/match linking

### Live Match System
- 9 event types, match stats, auto-score, auto-standings
- Sound effects (Web Audio API)
- Homepage widget with auto-refresh, LIVE indicator

### Web Push Notifications
- VAPID-based infrastructure with Service Worker
- Bell icon in navigation (subscribe/unsubscribe)
- Auto-push: match goes Live, goal scored, match completed

### Player Transfer History
- Transfer records with type (In/Out/Loan), from/to team, date, fee
- Admin modal per player, public display on Biography tab

### Official Data
- 105 fixtures from ΠΑΑΟΚ Α' Όμιλος 2025-2026 (all Completed)
- 11 teams in standings with real points, GF, GA
- ΛΕΥΤΕΡΙΑ 2024: 3rd place, 42 points, 61 GF, 24 GA

## Testing: 100% across 12 iterations

## Backlog
- Video uploads in gallery
- AI-generated match report narratives
- Multi-language support (English)
