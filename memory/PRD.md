# Lefteria FC Website - PRD

## Original Problem Statement
Create a website for Lefteria FC (ΛΕΥΤΕΡΙΑ) football club with an academy section, styled like a WordPress theme with SportsPress plugin functionality. Full CMS admin panel for managing all club content.

## User Personas
1. **Fans** - Browse team info, fixtures, news, standings, live match updates
2. **Parents** - Research academy programs for children
3. **Club Administrators** - Manage all content and run live match coverage via admin panel

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
│   ├── server.py          # FastAPI - Full CMS + match events + live stats
│   ├── .env               # MONGO_URL, DB_NAME, JWT_SECRET, ADMIN creds
│   └── tests/
│       ├── test_api.py             # 42 core API tests
│       └── test_live_match_stats.py # 35 live match tests
├── frontend/
│   └── src/
│       ├── App.js          # Public pages + auth + routing + live widget
│       ├── pages/
│       │   └── AdminPanel.jsx  # Standalone CMS (12 tabs + Match Control Center)
│       ├── index.css       # SportsPress + admin CMS styles
│       └── App.css
└── memory/
    ├── PRD.md
    └── test_credentials.md
```

## What's Been Implemented

### Phase 1 - Base Platform
- SportsPress-style public website (7 pages)
- JWT-protected admin panel, full Greek translation
- Real data scraping from lefteriafc.cy
- MongoDB data seeding

### Phase 2 - CMS Expansion
- Full CRUD for Players, Academy Groups, Staff, Fixtures, Standings, News, Venues, Seasons
- Re-seeded DB with expanded schema (team_type, is_active, etc.)
- Admin CMS with 11 management tabs

### Phase 3 - Admin Redesign + Auto-Standings
- Standalone admin layout (no public nav/footer)
- Professional dark CMS theme
- Auto-update standings from fixture results
- Recalculate All button
- Quick live-score endpoint

### Phase 4 - Professional Live Match System (Latest)
- **Match Events Model**: 9 event types (goal, penalty_scored, penalty_missed, own_goal, yellow_card, red_card, second_yellow, substitution, var_decision)
- **Match Stats Model**: possession%, shots, shots on target, corners, fouls, offsides, saves, match minute
- **Match Control Center (Admin)**: Full event logging with timeline, scorer summary, editable stats panel, quick action buttons, status transitions (Scheduled → Live → Half Time → Completed)
- **Auto Score Updates**: Adding goal events auto-increments score, own goals go to opposing team, deleting events reverses score
- **Homepage Live Widget**: Auto-refreshing (30s) match banner with teams, score, LIVE indicator, minute counter, goal scorers
- **Public API**: /api/live-match returns full match data for fans
- **Fixture Detail API**: /api/fixtures/{id}/detail returns events+stats

## Testing Results
- Backend: 100% (77+ tests - 42 core + 35 live match)
- Frontend: 100%
- Overall: 100% across all 4 iterations

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
