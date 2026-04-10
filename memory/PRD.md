# Lefteria FC - Football Club CMS & Public Website

## Original Problem Statement
Complete football club CMS and public website for "Lefteria FC", including a centralized Team Hub, Player Profiles, Match Reports, Academy Management, Season Statistics, and comprehensive club management tools. Fully functioning CMS + Public facing club hub, entirely in Greek for the frontend. Includes Mobile PWA with Role-based OTP login (Parent, Coach, Player, Management), advanced Fixture/Training scheduling, scoped venues/opponents, and interactive mobile attendance tracking.

## Architecture
- **Frontend**: React, Tailwind CSS, PWA (service worker)
- **Backend**: FastAPI, MongoDB (Motor), PyJWT
- **Auth**: JWT Admin/Customer + Role-based OTP for Mobile PWA (Twilio mocked)

## Key Constraints
- All frontend UI text in **Greek**
- **Greek ALL CAPS text must NOT have accent marks** (applied via `stripGreekAccents` utility)
- Academy age groups: **U6 to U12** only
- OTP via Twilio is **mocked** (returns OTP in API response)
- Currency: **€** (Euro) everywhere

## What's Been Implemented

### Core CMS (Admin Panel)
- Full-width admin UI with sidebar navigation
- Club & Academy section dashboards
- Team management (CRUD, roster, staff, standings, gallery)
- Academy group management (CRUD, roster, transfers, fixtures, gallery)
- Player profiles with image uploads
- Fixture/Match management with inline attendance (expandable cards)
- Training session management with bulk creation + inline attendance
- News, announcements, wall posts
- Financial dashboard (€ currency)
- Resource/facility management with booking
- Shop: products, tickets, orders
- Season management
- Settings: club info, venues

### Public Website
- Homepage with hero, standings, latest fixtures, POTM voting
- Team hub with tabs (roster, results, schedule, venues, stats, gallery)
- Academy group pages
- Match report pages with live events
- News, Contact form, Customer auth, Shop

### Mobile PWA
- OTP role-based login (Parent, Coach, Player, Management)
- **Parent Dashboard (Team-First Navigation)**:
  - Home: Team cards (groups kids are in), children cards, quick stats, upcoming events with Going/Not Going
  - Team View: Click team → roster (with parent's kids highlighted), fixtures with Going/Not Going, training sessions
  - Child View: Click kid → personal stats (appearances, goals, assists, minutes), attendance rate, upcoming events, financial obligations
- **Parent Profile**: Avatar upload, editable name/email, locked phone number
- Schedule page with attendance (Going/Not Going)
- News feed, Push notifications

### Recent Changes (Feb 2026)
- **P0**: Stripped Greek accents from ALL CAPS text across 30+ files. Created `stripGreekAccents()` utility at `/utils/greekText.js`.
- **P0**: Changed academy ages U8-U18 → U6-U12. Updated backend seed data.
- **P1**: Added inline attendance to Match/Fixture cards (FixturesTab, TeamsTab, AcademyTab).
- **Mobile Header**: Bigger logo (w-10), smaller text (text-xs).
- **Currency**: DollarSign → Euro icon globally.
- **Parent Dashboard Redesign**: Team-first navigation with home/team/child views, Going/Not Going on all events.
- **Parent Profile Enhancement**: Avatar upload (camera button), edit mode (name/email), locked phone.
- **Backend**: Added `PUT /api/mobile/profile`, `POST /api/mobile/profile/avatar`, expanded parent dashboard with `group_players` and `training_sessions`.

## Prioritized Backlog

### P1
- Refactor `server.py` (>3600 lines) into modular route files
- Refactor `AdminPanel.jsx` (>3700 lines) into modular tab components
- Team chat/messaging in mobile app

### P2
- Verify Match-day Push Notifications & POTM Social Share
- Video uploads in gallery

### P3
- AI-generated match report narratives
- Multi-language support (English toggle)

## Key Files
- `/app/frontend/src/pages/AdminPanel.jsx` — Main admin CMS
- `/app/frontend/src/pages/admin/InlineAttendance.jsx` — Reusable attendance
- `/app/frontend/src/mobile/pages/ParentDashboard.jsx` — Parent mobile dashboard
- `/app/frontend/src/mobile/pages/ProfilePage.jsx` — Parent profile with avatar
- `/app/frontend/src/mobile/components/MobileHeader.jsx` — Mobile header
- `/app/frontend/src/utils/greekText.js` — Greek accent stripping utility
- `/app/backend/routes/mobile_auth.py` — Mobile auth + profile + dashboard APIs
- `/app/backend/server.py` — All backend endpoints
