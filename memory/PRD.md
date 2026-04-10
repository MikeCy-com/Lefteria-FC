# Lefteria FC - Football Club CMS & Public Website

## Original Problem Statement
Complete football club CMS and public website for "Lefteria FC". Fully functioning CMS + Public facing club hub, entirely in Greek. Mobile PWA with Role-based OTP login, advanced scheduling, scoped venues/opponents, and interactive mobile attendance tracking.

## Architecture
- **Frontend**: React, Tailwind CSS, PWA
- **Backend**: FastAPI, MongoDB (Motor), PyJWT
- **Auth**: JWT Admin/Customer + Role-based OTP Mobile (Twilio mocked)

## Key Constraints
- All UI text in **Greek**, ALL CAPS text without accent marks
- Academy age groups: **U6 to U12** only
- Currency: **€** (Euro)
- OTP via Twilio is **mocked**

## What's Been Implemented

### Core CMS (Admin Panel)
- Full admin UI with sidebar (Club/Academy/Management/Shop sections)
- Teams, Academy Groups, Players (CRUD + image uploads)
- Fixtures with inline attendance (expandable cards)
- Training sessions with bulk creation + inline attendance
- News, announcements, wall posts, financial dashboard (€)
- Resources, shop, seasons, settings

### Public Website
- Homepage, Team hub, Academy pages, Match reports
- News, Contact, Customer auth, Shop, POTM voting

### Mobile PWA — PlayerDex-Inspired Redesign
- **Home View**: Team cards with banners + kid avatar stack, children quick-access, quick stats (€), upcoming events
- **Team View**: Tabs (Schedule/Roster/Feed). Schedule shows events with date badges, type tags (Αγώνας/Προπόνηση), time, location
- **Event Detail**: Full detail page with Going/Not Going prompt, date/time/location rows, external maps link, attendance player list
- **Player Profile**: Large avatar, training attendance %, match attendance %, ranking. Full stats (goals/assists/minutes) for own kids, restricted for others. Parent info card.
- **Profile Page**: Avatar upload (camera button), editable name/email, locked phone
- **Schedule, News, Push notifications** (existing)

### Key Changes (Feb 2026)
- Greek accent stripping (stripGreekAccents utility)
- U6-U12 academy ages
- DollarSign → Euro globally
- PlayerDex-inspired mobile dashboard with 4 views (home/team/event/player)
- Profile avatar upload + edit endpoints
- Expandable fixture attendance in admin panel

## Prioritized Backlog
### P1
- Refactor server.py + AdminPanel.jsx into modular files
- Team chat/messaging in mobile app
### P2
- Push notifications & POTM share verification
- Video uploads in gallery
### P3
- AI match report narratives
- Multi-language support

## Key Files
- `/app/frontend/src/mobile/pages/ParentDashboard.jsx` — PlayerDex-inspired mobile dashboard
- `/app/frontend/src/mobile/pages/ProfilePage.jsx` — Profile with avatar
- `/app/frontend/src/pages/AdminPanel.jsx` — Main admin CMS
- `/app/frontend/src/utils/greekText.js` — Greek accent utility
- `/app/backend/routes/mobile_auth.py` — Mobile auth + profile APIs
- `/app/backend/server.py` — All backend endpoints
