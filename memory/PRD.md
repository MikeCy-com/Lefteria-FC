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

## What's Been Implemented

### Core CMS (Admin Panel)
- Full-width admin UI with sidebar navigation
- Club & Academy section dashboards
- Team management (CRUD, roster, staff, standings, gallery)
- Academy group management (CRUD, roster, transfers, fixtures, gallery)
- Player profiles with image uploads
- Fixture/Match management with opponent & venue scoping
- Training session management with bulk creation
- News, announcements, wall posts
- Financial dashboard
- Resource/facility management with booking
- Shop: products, tickets, orders
- Season management
- Settings: club info, venues

### Public Website
- Homepage with hero, standings, latest fixtures, POTM voting
- Team hub with tabs (roster, results, schedule, venues, stats, gallery)
- Academy group pages
- Match report pages with live events
- News pages
- Contact form
- Customer auth (login/register/profile)
- Shop with cart
- Vote for Player of the Match

### Mobile PWA
- OTP role-based login (Parent, Coach, Player, Management)
- Schedule page with attendance (Going/Not Going)
- Parent dashboard with child availability sync
- News feed
- Push notifications (web push)

### Recent Changes (Feb 2026)
- **P0 DONE**: Stripped Greek accents from ALL CAPS text (CSS uppercase, Bebas Neue font, btn-primary/btn-secondary). Created `stripGreekAccents` utility at `/app/frontend/src/utils/greekText.js`.
- **P0 DONE**: Changed academy age bounds from U8-U18 to U6-U12 across frontend and backend seed data.
- **P1 DONE**: Added inline attendance tracking to Match/Fixture cards (expandable card UI with InlineAttendance component) — works in: FixturesTab, TeamsTab schedule, AcademyTab fixtures.
- Sidebar restructure: Club vs Academy dashboards
- Scoped venues and opponents (Main teams vs Academy)
- Inline attendance for training sessions
- Profile picture uploads, banner uploads
- Bulk training session creation

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
- `/app/frontend/src/pages/admin/SectionDashboard.jsx` — Section dashboards
- `/app/frontend/src/pages/admin/ScopedManagement.jsx` — Venues/opponents
- `/app/frontend/src/pages/admin/TrainingSessionsPanel.jsx` — Training CRUD
- `/app/frontend/src/utils/greekText.js` — Greek accent stripping utility
- `/app/frontend/src/mobile/pages/SchedulePage.jsx` — Mobile attendance
- `/app/frontend/src/App.js` — Public pages & routing
- `/app/backend/server.py` — All backend endpoints

## DB Collections
teams, academy_groups, players, fixtures, training_sessions, opponents, facilities, event_attendance, news, announcements, wall_posts, registrations, gallery_items, products, tickets, orders, seasons, standings, match_events, vote_sessions, votes, messages, staff, settings, users
