# Lefteria FC Website - PRD

## Original Problem Statement
Create a website for Lefteria FC football club with an academy section, styled like a WordPress SportsPress theme. Full CMS admin panel with live match management.

## Core Requirements
- Club branding: Orange/gold (#F5A623), Black, White
- WordPress/SportsPress-style design, entire website in Greek
- Hidden admin panel at /admin/login (JWT protected)
- MongoDB database, real data from Lefteria FC (Cyprus, PAAOK league)

## Architecture
```
/app/
├── backend/
│   ├── server.py              # FastAPI - Full CMS + match events + live stats + file uploads
│   ├── uploads/players/       # Player image files
│   └── .env
├── frontend/src/
│   ├── App.js                 # Public pages + auth + routing + live widget
│   ├── pages/
│   │   ├── AdminPanel.jsx     # Standalone CMS (12 tabs + Match Control Center)
│   │   ├── TeamHubPage.jsx    # SportsPress-style tabbed Team page (5 tabs)
│   │   ├── PlayerProfilePage.jsx  # Hero banner + stat bars + tabbed player profile
│   │   └── PublicPages.jsx    # Legacy (not used in routing anymore)
│   ├── components/ImageUpload.jsx  # Drag-drop + URL image upload component
│   ├── utils/sounds.js        # Web Audio API sound effects
│   └── index.css              # SportsPress + admin CMS styles
└── memory/
```

## Implemented Features

### Public Website
- Home (hero, live match widget, fixtures, standings with logos, news)
- About, Academy (grouped by age group), Fixtures, News, Contact form
- **Team Hub** (/team) — SportsPress-style tabbed page with:
  - Overview: Game Scoreboard, Games History (W/D/L chart), Roster preview, Latest Results, Team Statistics, Staff
  - Roster: Full player table with position filter, Goals/Assists/Minutes columns
  - Latest Results: Fixture results with status filter
  - Schedule: Calendar grid with month navigation
  - Venues: Venue cards with Google Maps iframes
- **Player Profile** (/player/:id) — Hero banner with stadium background, player photo, number/name split, info grid, Goals/Assists circular indicators, stat progress bars, tabbed content (Overview, Statistics, Biography)
- **Match Report** (/match/:fixtureId) — Dedicated match page with header (teams, score, date, venue, competition), event timeline (goals, cards, subs, VAR with minute markers, positioned home/away), match statistics bars (possession, shots, corners, etc.), and summary card. Accessible by clicking any fixture from Results tab or Overview.
- Simplified navigation (6 items): Αρχική, Σχετικά, Ομάδα, Ακαδημία, Νέα, Επικοινωνία
- Legacy redirects: /fixtures → /team?tab=results, /calendar → /team?tab=schedule, /venues → /team?tab=venues, /seasons → /team?tab=overview, /staff → /team?tab=overview

### Admin CMS (12 tabs, standalone layout — no public nav/footer)
- Dashboard, Club Profile, Players (with file upload), Academy Groups
- Staff, Fixtures, Standings (with Recalculate All), News, Venues, Seasons, Messages
- **Live Score** tab → Match Control Center

### Professional Live Match System
- **Match Events**: 9 types (goal, penalty, own_goal, yellow/red/2nd yellow, sub, VAR)
- **Match Stats**: possession%, shots, on-target, corners, fouls, offsides, saves
- **Auto Score**: Adding goal events auto-increments scores; deleting reverses
- **Auto Standings**: Completing match auto-recalculates both teams' standings
- **Sound Effects**: Web Audio API sounds (goal horn, whistle, card beep, sub chime)
- **Homepage Widget**: Auto-refresh 30s, LIVE indicator, goal scorers, browser notifications

### Player Image Upload
- Drag & drop or click-to-browse file upload (JPEG/PNG/WebP, max 5MB)
- URL input alternative, stored at /api/uploads/players/

## Testing: 100% across 7 iterations

## Prioritized Backlog

### P2 (Medium Priority)
- Statistics & League Table Columns Configuration

### P3 (Future)
- Player Transfer history
- Full Web Push Notification Infrastructure
- Ticket sales / Merchandise shop
- Gallery tab (photos) for Team Hub and Player Profile
