# Lefteria FC - Football Club CMS & Public Website

## Original Problem Statement
Complete football club CMS and public website for "Lefteria FC". Fully functioning CMS + Public facing club hub, entirely in Greek. Mobile PWA with Role-based OTP login, advanced scheduling, scoped venues/opponents, and interactive mobile attendance tracking. Recently redesigned Mobile PWA with PlayerDex-inspired expandable drill-down UI and public/private chat system.

## Architecture
- **Frontend**: React, Tailwind CSS, PWA
- **Backend**: FastAPI, MongoDB (Motor), PyJWT
- **Auth**: JWT Admin/Customer + Role-based OTP Mobile (Twilio mocked)

## Key Constraints
- All UI text in **Greek**, ALL CAPS text without accent marks
- Academy age groups: **U6 to U12** only
- Currency: **Euro** symbol
- OTP via Twilio is **mocked**
- Mobile PWA uses ONLY bottom navigation (no top tabs)

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

### Mobile PWA - PlayerDex-Inspired Redesign (COMPLETED)
- **Bottom Navigation**: 4 tabs only (Home, Schedule, Chat, Profile)
- **Home View**: Team cards with banners + kid avatar stack, children quick-access, quick stats, upcoming events
- **Team Drill-Down**: Expandable sections - Upcoming Events, Roster, Staff/Coach, Announcements
- **Event Detail**: Full detail page with Going/Not Going prompt, date/time/location, attendance list
- **Player Profile**: Large avatar, attendance %, stats (goals/assists/minutes) for own kids, restricted for others
- **Chat System**: Team chats per academy group, private messaging between parents/coaches, message polling
- **Profile Page**: Avatar upload, editable name/email, locked phone, logout
- **Schedule Page**: Calendar with events

### Key Changes (April 2026)
- Fixed critical React hooks violation in ChatPage.jsx
- Chat system fully implemented (team + private messaging)
- Expandable drill-down UI replaces old tabbed navigation
- Role-aware chat groups loading (parent/coach/player/management)

### Previous Changes (Feb 2026)
- Greek accent stripping (stripGreekAccents utility)
- U6-U12 academy ages
- DollarSign to Euro globally
- Profile avatar upload + edit endpoints
- Expandable fixture attendance in admin panel

## Prioritized Backlog
### P1
- Refactor server.py (~3600 lines) + AdminPanel.jsx (~3700 lines) into modular files

### P2
- Push notifications & POTM share verification

### P3
- Video uploads in gallery
- AI match report narratives
- Multi-language support (English toggle)

## Key Files
- `/app/frontend/src/mobile/pages/ParentDashboard.jsx` - Expandable mobile dashboard
- `/app/frontend/src/mobile/pages/ChatPage.jsx` - Chat system
- `/app/frontend/src/mobile/pages/ProfilePage.jsx` - Profile with avatar
- `/app/frontend/src/mobile/components/BottomNav.jsx` - 4-tab bottom nav
- `/app/frontend/src/mobile/MobileApp.jsx` - Mobile routing
- `/app/frontend/src/pages/AdminPanel.jsx` - Main admin CMS
- `/app/frontend/src/utils/greekText.js` - Greek accent utility
- `/app/backend/routes/mobile_auth.py` - Mobile auth + chat + profile APIs
- `/app/backend/server.py` - All backend endpoints
