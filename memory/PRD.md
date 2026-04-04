# Lefteria FC Website - PRD

## Original Problem Statement
Create a website for Lefteria FC (ΛΕΥΤΕΡΙΑ) football club with an academy section, styled like a WordPress theme with SportsPress plugin functionality. Full CMS admin panel for managing all club content.

## User Personas
1. **Fans** - Browse team info, fixtures, news, standings
2. **Parents** - Research academy programs for children
3. **Club Administrators** - Manage all content via admin panel

## Core Requirements
- Club branding: Orange/gold (#F5A623), Black, White
- WordPress/SportsPress-style design
- Entire website in Greek
- Hidden admin panel at /admin/login (JWT protected)
- MongoDB database for data storage
- Real data from Lefteria FC (Cyprus, PAAOK league)

## Architecture
```
/app/
├── backend/
│   ├── server.py          # FastAPI - 1240 lines, full CMS endpoints
│   ├── .env               # MONGO_URL, DB_NAME, JWT_SECRET, ADMIN creds
│   └── tests/             # pytest tests (34 tests, 100% pass)
├── frontend/
│   └── src/
│       ├── App.js          # Public pages + auth + routing
│       ├── pages/
│       │   └── AdminPanel.jsx  # Full CMS admin (11 tabs)
│       ├── index.css       # SportsPress-style CSS
│       └── App.css
└── memory/
    ├── PRD.md
    └── test_credentials.md
```

## What's Been Implemented (Feb 2026)

### Backend (FastAPI + MongoDB)
- JWT Authentication (PyJWT + bcrypt)
- Full CRUD for: Players, Academy Groups, Staff, Fixtures, Standings, News, Venues, Seasons
- Club Profile management
- Contact Messages (public submit + admin view/delete)
- Dashboard stats endpoint
- Calendar events endpoint
- Transfers endpoint
- Data seeding with real Lefteria FC data
- 34 passing API tests

### Frontend - Public Pages
- Home: Hero, stats bar, fixtures, standings table, news, academy CTA
- About: Club history, values, stadium info
- Team: Player cards with position filters (20 players)
- Academy: Age group cards (U12-U18) with coach info
- Fixtures: Match cards with status filters
- News: Featured article + grid layout
- Contact: Form with subject selection

### Frontend - Admin CMS (11 tabs)
- Dashboard: Stats overview (players, fixtures, news, messages)
- Club Profile: Edit name, logo, description, social media, colors
- Players: Full CRUD with team type (First Team/Academy), position, image URL
- Academy Groups: Create/Edit/Delete groups with coach, schedule, age range
- Staff: CRUD with roles (Coach, Physio, Manager, etc.)
- Fixtures: CRUD with scores, status, venue, competition
- Standings: CRUD with full stats (played, won, drawn, lost, GF, GA, points)
- News: CRUD with categories, featured flag, images
- Venues: CRUD with address, capacity, surface, home ground flag
- Seasons: CRUD with competitions, achievements, current flag
- Messages: View and delete contact messages

## Testing Results (Feb 2026)
- Backend: 100% pass (34/34 tests)
- Frontend: 100% pass
- Overall: 100%

## Prioritized Backlog

### P1 (High Priority)
- Individual Player Profile pages (public view with stats)
- Player picture upload in Admin
- Automated League Standings with Club Logos
- Academy hierarchy: assign players to specific groups

### P2 (Medium Priority)
- Events Calendar view
- Statistics & League Table Columns Configuration
- Venue Information with Maps integration
- Season Archives logic

### P3 (Future)
- Staff Profiles management & public display
- Player Transfer history (Previous/Current clubs)
- Ticket sales integration
- Merchandise shop
- Live match updates
