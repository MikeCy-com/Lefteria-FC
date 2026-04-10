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

### Mobile PWA - Premium Redesign (COMPLETED Feb 2026)
**5-Tab Bottom Navigation:**
- Αρχικη (Home) → Dashboard
- Ημερολογιο (Calendar) → Schedule
- Αγωνες (Matches) → Central elevated tab, upcoming/completed matches
- Μηνυματα (Chat) → Team + private messaging
- Προφιλ (Profile) → User profile with avatar

**Home Dashboard (Card-based):**
- Welcome header with avatar + greeting ("Καλως ηρθες, [name]")
- 3 Quick Stat cards (Teams, Upcoming Matches, Attendance %)
- Next Match card with VS layout
- My Kids horizontal scrollable cards
- Teams list with age range badges
- Recent Results with W/D/L indicators

**Matches Page (NEW):**
- Upcoming/Completed filter pills
- Match score cards with team shields, VS/score, competition badge
- Date/venue/map info
- Availability buttons (Παω/Δεν παω)

**Team Drill-Down:**
- Expandable accordion sections: Events, Roster, Staff, Announcements
- Player profile view with stats (Goals, Assists, Minutes)
- Event detail with availability prompt

**Chat System:**
- Team chats per academy group
- Private messaging between parents/coaches

### Codebase Refactoring (COMPLETED)
- Backend: server.py 3638→2782 lines; extracted models.py, auth.py, database.py
- Frontend: AdminPanel.jsx 3669→2223 lines; extracted TeamsTab, AcademyTab, RegistrationsTab, ShopTabs

## Prioritized Backlog
### P2
- Push notifications & POTM share verification

### P3
- Video uploads in gallery
- AI match report narratives
- Multi-language support (English toggle)

## Key Files
### Mobile PWA
- `/app/frontend/src/mobile/MobileApp.jsx` - 5-tab routing
- `/app/frontend/src/mobile/components/BottomNav.jsx` - 5-tab nav with center elevated
- `/app/frontend/src/mobile/pages/ParentDashboard.jsx` - Dashboard-style home
- `/app/frontend/src/mobile/pages/MatchesPage.jsx` - Matches page
- `/app/frontend/src/mobile/pages/ChatPage.jsx` - Chat system
- `/app/frontend/src/mobile/pages/SchedulePage.jsx` - Calendar
- `/app/frontend/src/mobile/pages/ProfilePage.jsx` - Profile
- `/app/frontend/src/mobile/components/SharedComponents.jsx` - Shared UI components

### Backend
- `/app/backend/server.py` - Main routes (2782 lines)
- `/app/backend/models.py` - Pydantic models (785 lines)
- `/app/backend/auth.py` - Auth helpers (106 lines)
- `/app/backend/routes/mobile_auth.py` - Mobile auth + chat + availability
