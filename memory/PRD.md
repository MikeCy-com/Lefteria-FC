# Lefteria FC - Football Club CMS & Public Website

## Original Problem Statement
Complete football club CMS and public website for "Lefteria FC". Fully functioning CMS + Public facing club hub, entirely in Greek. Mobile PWA with Role-based OTP login. Mobile PWA redesigned with premium dark-mode card-based UI inspired by 3 soccer app design references.

## Architecture
- **Frontend**: React, Tailwind CSS, PWA
- **Backend**: FastAPI, MongoDB (Motor), PyJWT
- **Auth**: JWT Admin/Customer + Role-based OTP Mobile (Twilio mocked)

## Key Constraints
- All UI text in **Greek**, ALL CAPS text without accent marks
- Academy age groups: **U6 to U12** only
- Currency: **Euro** symbol
- OTP via Twilio is **mocked**
- Mobile PWA uses ONLY bottom navigation (5 tabs, no top tabs)
- Global `pb-36` padding on mobile container prevents badge overlap

## What's Been Implemented

### Core CMS (Admin Panel)
- Full admin UI with sidebar (Club/Academy/Management/Shop sections)
- Teams, Academy Groups, Players (CRUD + image uploads)
- Fixtures with inline attendance (expandable cards)
- Training sessions with bulk creation + inline attendance
- News, announcements, wall posts, financial dashboard
- Resources, shop, seasons, settings

### Public Website
- Homepage, Team hub, Academy pages, Match reports
- News, Contact, Customer auth, Shop, POTM voting

### Mobile PWA - Premium Redesign (ALL ROLES COMPLETED Apr 2026)
**5-Tab Bottom Navigation:**
- Αρχικη (Home) → Role-specific Dashboard
- Ημερολογιο (Calendar) → Schedule
- Αγωνες (Matches) → Central elevated tab, upcoming/completed matches
- Μηνυματα (Chat) → Team + private messaging
- Προφιλ (Profile) → User profile with avatar

**Parent Dashboard (Card-based):**
- Welcome header with avatar + greeting ("Καλως ηρθες, [name]")
- 3 Quick Stat cards (Teams, Upcoming Matches, Attendance %)
- Next Match card with VS layout
- My Kids horizontal scrollable cards
- Teams list with age range badges and drill-down
- Recent Results with W/D/L indicators
- Team detail with expandable sections (Events, Roster, Staff, Announcements)
- Player profile view with stats

**Coach Dashboard (COMPLETED Apr 2026):**
- Blue-themed welcome header with avatar + "Γεια σου, Προπονητη"
- 3 Quick Stats (Players, Teams, Training Sessions)
- Next Match card with VS layout
- My Teams list with drill-down to team detail (expandable events + roster)
- Player profile view from roster with stats
- Training schedule cards with dates/times
- Recent Results with W/D/L indicators
- Announcements section

**Player Dashboard (COMPLETED Apr 2026):**
- Player hero card with photo, number badge, position, team name
- 4-column season stats grid (Goals, Assists, Appearances, Minutes)
- Next Match card with VS layout
- Development Plans with progress bars
- Evaluations with star ratings
- Schedule section (always visible, shows empty state)
- Announcements section (always visible, shows empty state)
- Recent Results with W/D/L indicators

**Management Dashboard (COMPLETED Apr 2026):**
- Amber-themed welcome header with avatar + "Διοικηση"
- 2x2 KPI grid (Players, Teams, Registrations, Revenue)
- Financial overview (Revenue/Pending/Overdue in €)
- Teams list with drill-down
- Recent Registrations list with status badges
- Full Registrations detail view
- Upcoming Events section
- Announcements section

**Matches Page:**
- Upcoming/Completed filter pills
- Match score cards with team shields, VS/score, competition badge
- Date/venue/map info
- Availability buttons (Παω/Δεν παω)

**Chat System:**
- Team chats per academy group
- Private messaging between parents/coaches

### Codebase Refactoring (COMPLETED)
- Backend: server.py 3638→2782 lines; extracted models.py, auth.py, database.py
- Frontend: AdminPanel.jsx 3669→2223 lines; extracted TeamsTab, AcademyTab, RegistrationsTab, ShopTabs

### Bug Fixes (Apr 2026)
- Fixed "Invalid Date" on match result cards — `parseDate()` helper handles both ISO datetime and plain date formats
- Fixed € symbol rendering in Management financial overview
- Fixed name overflow/truncation in Coach and Player hero cards
- Fixed empty Player dashboard — always shows schedule and announcements with empty states

### Attendance Tracker (COMPLETED Apr 2026)
- All roles (Coach, Player, Parent, Management) can mark attendance
- Present/Absent toggle buttons for each player
- Coach/Management see full roster; Player sees self; Parent sees children
- Summary stats (Present/Absent/Unmarked counts + percentage bar)
- Locked after event date passes (read-only badges + lock notice)
- Works for Training Sessions, Matches, and Events
- Accessible via clickable training session cards on all dashboards
- Backend: POST /api/mobile/attendance/mark, GET /api/mobile/attendance/{event_id}, GET /api/mobile/my-attendance

## Prioritized Backlog
### P2
- Push notifications & POTM share verification

### P3
- Video uploads in gallery
- AI match report narratives
- Multi-language support (English toggle)

## Key Files
### Mobile PWA
- `/app/frontend/src/mobile/MobileApp.jsx` - 5-tab routing with role-based dashboard selection
- `/app/frontend/src/mobile/components/BottomNav.jsx` - 5-tab nav with center elevated
- `/app/frontend/src/mobile/pages/ParentDashboard.jsx` - Parent dashboard with team drill-down
- `/app/frontend/src/mobile/pages/CoachDashboard.jsx` - Coach dashboard with team/player management
- `/app/frontend/src/mobile/pages/PlayerDashboard.jsx` - Player dashboard with stats and hero card
- `/app/frontend/src/mobile/pages/ManagementDashboard.jsx` - Management dashboard with KPIs/financials
- `/app/frontend/src/mobile/pages/MatchesPage.jsx` - Matches page
- `/app/frontend/src/mobile/pages/ChatPage.jsx` - Chat system
- `/app/frontend/src/mobile/pages/SchedulePage.jsx` - Calendar
- `/app/frontend/src/mobile/pages/ProfilePage.jsx` - Profile
- `/app/frontend/src/mobile/components/SharedComponents.jsx` - Shared UI components

### Backend
- `/app/backend/server.py` - Main routes (2782 lines)
- `/app/backend/models.py` - Pydantic models (785 lines)
- `/app/backend/auth.py` - Auth helpers (106 lines)
- `/app/backend/routes/mobile_auth.py` - Mobile auth + dashboard endpoints + chat + availability
