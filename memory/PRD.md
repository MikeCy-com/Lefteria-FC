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
│   ├── server.py          # FastAPI - CMS endpoints + auto-standings + live score
│   ├── .env               # MONGO_URL, DB_NAME, JWT_SECRET, ADMIN creds
│   └── tests/             # 42 passing tests
├── frontend/
│   └── src/
│       ├── App.js          # Public pages + auth + routing (PublicLayout wraps nav/footer)
│       ├── pages/
│       │   └── AdminPanel.jsx  # Standalone CMS (12 tabs, own header/sidebar)
│       ├── index.css       # SportsPress + admin CMS styles
│       └── App.css
└── memory/
    ├── PRD.md
    └── test_credentials.md
```

## What's Been Implemented

### Phase 1 (Initial Build)
- SportsPress-style public website with 7 pages
- JWT-protected admin panel at /admin/login
- Real data scraping from lefteriafc.cy
- Full Greek translation
- MongoDB data seeding

### Phase 2 (CMS Expansion)
- Expanded backend with full CRUD for all entities
- Re-seeded database with new schema (team_type, is_active, etc.)
- Comprehensive Admin CMS with 11 tabs (Dashboard, Club Profile, Players, Academy Groups, Staff, Fixtures, Standings, News, Venues, Seasons, Messages)
- Frontend-backend API sync

### Phase 3 (Admin Redesign + Live Score) - Latest
- **Standalone Admin Layout**: Removed public nav/footer from admin panel, custom CMS header with "LEFTERIA FC CMS" branding
- **Redesigned Admin UI**: Professional dark theme, new CSS classes (.admin-card, .admin-table, .admin-badge, etc.)
- **Live Score Tab**: Inline score editing, "Έναρξη Live"/"Τέλος Αγώνα" buttons
- **Auto-update Standings**: When fixture transitions to Completed, standings auto-recalculate (points, W/D/L, GF/GA/GD)
- **Score Correction**: Updating scores on completed fixtures reverses old result then applies new
- **Recalculate All**: POST /admin/standings/recalculate drops and rebuilds from all completed fixtures
- **PUT /admin/fixtures/{id}/live-score**: Quick score update endpoint for match day
- Dashboard stat cards are clickable (navigate to corresponding tab)

## Testing Results
- Backend: 100% pass (42/42 tests)
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
- Live match updates with real-time push
