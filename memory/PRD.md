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
│   ├── App.js                 # Public pages + auth + routing + live widget + player profiles
│   ├── pages/AdminPanel.jsx   # Standalone CMS (12 tabs + Match Control Center)
│   ├── components/ImageUpload.jsx  # Drag-drop + URL image upload component
│   ├── utils/sounds.js        # Web Audio API sound effects
│   └── index.css              # SportsPress + admin CMS styles
└── memory/
```

## Implemented Features

### Public Website (7+ pages)
- Home (hero, live match widget, fixtures, standings with logos, news)
- About, Team (clickable player cards → profile), Academy (grouped by age group)
- Fixtures, News, Contact form
- **Player Profile** (/player/:id) — stats, bio, photo, previous clubs

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

## Testing: 100% across 5 iterations (77+ backend tests, all frontend verified)

## Prioritized Backlog

### P2 (Medium Priority)
- Events Calendar view
- Venue Information with Maps integration
- Season Archives logic
- Statistics & League Table Columns Configuration

### P3 (Future)
- Staff Profiles public display
- Player Transfer history
- Ticket sales / Merchandise shop
