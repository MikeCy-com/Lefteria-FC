# Lefteria FC / ΛΕΥΤΕΡΙΑ FC - Product Requirements

## Original Problem Statement
Build a complete football club CMS and public-facing website for "Lefteria FC" (ΛΕΥΤΕΡΙΑ FC). Features include a centralized Team Hub, Player Profiles, Gallery, Web Push Notifications, Match Reports, Player Transfer History, Shop/Tickets page, POTM voting, and seeded data. All frontend UI text must be in Greek. Additionally, build a mobile PWA app inspired by PlayerdDex Academy with 4 roles (Parent, Coach, Player, Management).

## Architecture
- **Frontend**: React + Tailwind CSS + lucide-react, Shadcn/UI components
- **Backend**: FastAPI + MongoDB (Motor) + PyJWT
- **Backend Routes**: Modular routers in `/app/backend/routes/` (financial.py, videos.py, resources.py, mobile_auth.py, opponents.py) + monolith `server.py`
- **Auth**: Triple auth — Admin CMS (`useAdminAuth`), Customer (`CustomerAuth.jsx`), Mobile OTP (`MobileAuthContext.jsx`)
- **Push**: Native VAPID Web Push Notifications
- **PWA**: manifest.json + service worker for mobile installability

## Mobile App Structure (`/app` route)
```
/app/login       → Phone + OTP Login (simulated SMS, Twilio-ready)
/app             → Role-based Dashboard with Bottom Navigation
  Parent:   Home (children, attendance, payments) | Πρόγραμμα | Νέα | Προφίλ
  Coach:    Home (teams, training) | Ομάδα | Πρόγραμμα | Νέα | Προφίλ
  Player:   Home (stats, development) | Στατιστικά | Πρόγραμμα | Νέα | Προφίλ
  Management: Home (KPIs, financial) | Ομάδες | Οικονομικά | Νέα | Προφίλ
```

## Role Detection (OTP)
- Parents: Matched by parent_phone in players collection
- Coaches: Matched by phone in staff collection
- Players: Matched by phone in players collection
- Management: Matched by phone in admin_users collection

## Completed Features
- [x] Public-facing club website (Greek)
- [x] Admin CMS with login + professional dark design
- [x] Player Profiles with transfer history, DOB-based age
- [x] Match Reports & Live Score control
- [x] Web Push Notifications + match-day reminders
- [x] Customer Authentication + POTM Voting
- [x] E-Commerce: Products, Cart, Checkout, Orders
- [x] Full-Width Admin UI with drill-down panels
- [x] Academy Registration (5-step wizard)
- [x] Academy Management (multi-group, player stats)
- [x] Club Calendar, Attendance, Wall Posts
- [x] Training Sessions, Player Development, Player Evaluations
- [x] **Financial Dashboard** (Feb 2026): KPI cards, revenue chart, bulk dues, records table
- [x] **Video Analytics** (Feb 2026): Video management, YouTube embed, markers, player tags
- [x] **Resource/Field Management** (Feb 2026): Facility CRUD, booking calendar, availability checker
- [x] **Mobile PWA App** (Feb 2026): Phone+OTP auth, 4 role-based dashboards, bottom navigation, PWA manifest, service worker
- [x] **Opponents CRUD** (Feb 2026): Opponent management with logo upload, venue, location, Google Maps link
- [x] **Advanced Fixture Forms** (Feb 2026): Location/Google Maps, arrival time, venue dropdown, opponent select
- [x] **Bulk Training Sessions** (Feb 2026): Season-wide recurring training creation with day-of-week selection
- [x] **Training Session Venue/Location** (Feb 2026): Venue dropdown, location, Google Maps, arrival time for single and bulk training
- [x] **Team & Academy Group Banners** (Feb 2026): Banner upload/URL for teams and academy groups (shown on cards and detail views)
- [x] **Player Profile Cleanup** (Feb 2026): Removed redundant "Πληροφορίες Ομάδας" from player profile detail view
- [x] **Player Profile Pictures** (Feb 2026): Image upload with drag-and-drop and URL input for all players (ImageUpload component fixed for admin auth)

## Key Mobile API Endpoints
- POST `/api/mobile/auth/request-otp` (send OTP, detect role)
- POST `/api/mobile/auth/verify-otp` (verify OTP, return JWT)
- GET `/api/mobile/auth/me` (current user)
- GET `/api/mobile/parent/dashboard` (children, events, payments, attendance)
- GET `/api/mobile/coach/dashboard` (teams, players, training, schedule)
- GET `/api/mobile/player/dashboard` (stats, development, evaluations)
- GET `/api/mobile/management/dashboard` (KPIs, financial, registrations)
- POST `/api/mobile/availability` (submit event availability)

## Key DB Collections
admins, users, players, teams, fixtures, standings, academy_groups, staff, news, gallery, venues, seasons, products, tickets, orders, potm_votes, push_subscriptions, club, contact_messages, registrations, events, attendances, wall_posts, training_sessions, player_development, player_evaluations, financial_records, videos, facilities, bookings, mobile_users, mobile_otps, availability, opponents

## Key Frontend Files
- `/app/frontend/src/mobile/MobileApp.jsx` - Mobile app shell
- `/app/frontend/src/mobile/MobileAuthContext.jsx` - OTP auth context
- `/app/frontend/src/mobile/pages/MobileLoginPage.jsx` - Phone+OTP login
- `/app/frontend/src/mobile/pages/ParentDashboard.jsx` - Parent view
- `/app/frontend/src/mobile/pages/CoachDashboard.jsx` - Coach view
- `/app/frontend/src/mobile/pages/PlayerDashboard.jsx` - Player view
- `/app/frontend/src/mobile/pages/ManagementDashboard.jsx` - Management view
- `/app/frontend/src/pages/AdminPanel.jsx` - Main admin CMS
- `/app/frontend/src/pages/admin/TrainingSessionsPanel.jsx` - Training with venue/location
- `/app/frontend/src/components/ImageUpload.jsx` - Image upload (admin + customer auth)

## Backlog
- P1: Add Twilio SMS keys for real OTP (currently simulated)
- P1: Verify Match-day Push Notifications & POTM Social Share
- P1: Refactor server.py (3600+ lines) → break into more routers
- P1: Refactor AdminPanel.jsx (3500+ lines) → extract remaining inline tabs
- P2: Team chat / messaging in mobile app
- P2: Availability submission (going/not going) in mobile app
- P3: Video uploads in gallery
- P3: AI-generated match report narratives
- P3: Multi-language support (English toggle)
