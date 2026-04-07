# Lefteria FC / ΛΕΥΤΕΡΙΑ FC - Product Requirements

## Original Problem Statement
Build a complete football club CMS and public-facing website for "Lefteria FC" (ΛΕΥΤΕΡΙΑ FC). Features include a centralized Team Hub, Player Profiles, Gallery, Web Push Notifications, Match Reports, POTM voting, and seeded data. All frontend UI text must be in Greek. Additionally, build a mobile PWA app with 4 roles (Parent, Coach, Player, Management) and advanced scheduling features.

## Architecture
- **Frontend**: React + Tailwind CSS + lucide-react, Shadcn/UI components
- **Backend**: FastAPI + MongoDB (Motor) + PyJWT
- **Backend Routes**: Modular routers in `/app/backend/routes/` (financial.py, videos.py, resources.py, mobile_auth.py, opponents.py) + monolith `server.py`
- **Auth**: Triple auth — Admin CMS, Customer, Mobile OTP (simulated Twilio)
- **PWA**: manifest.json + service worker for mobile installability

## Sidebar Structure (Admin CMS)
```
Πίνακας (Dashboard)
Live Score
─────────────
ΣΥΛΛΟΓΟΣ (→ Club Dashboard with Calendar)
  ├── Ομάδες
  ├── Αντίπαλοι (team_type: First Team)
  └── Γήπεδα (team_type: First Team)
ΑΚΑΔΗΜΙΑ (→ Academy Dashboard with Calendar)
  ├── Ομάδες
  ├── Εγγραφές
  ├── Αντίπαλοι (team_type: Academy, shared across all groups)
  └── Γήπεδα (team_type: Academy, shared across all groups)
─────────────
Νέα | Ανακοινώσεις | Μηνύματα
─────────────
ΔΙΑΧΕΙΡΙΣΗ: Οικονομικά, Εγκαταστάσεις
ΚΑΤΑΣΤΗΜΑ: Προϊόντα, Εισιτήρια, Παραγγελίες
ΡΥΘΜΙΣΕΙΣ: Πληροφορίες, Σεζόν, Γήπεδα
```

## Completed Features
- [x] Public-facing club website (Greek)
- [x] Admin CMS with login + professional dark design
- [x] Player Profiles with transfer history, DOB-based age, profile pictures
- [x] Match Reports & Live Score control
- [x] Web Push Notifications + match-day reminders
- [x] Customer Authentication + POTM Voting
- [x] E-Commerce: Products, Cart, Checkout, Orders
- [x] Full-Width Admin UI with drill-down panels
- [x] Academy Registration (5-step wizard)
- [x] Academy Management (multi-group, player stats)
- [x] Club Calendar, Wall Posts
- [x] Training Sessions (single + bulk season creation), Player Development, Player Evaluations
- [x] Financial Dashboard, Video Analytics, Resource/Field Management
- [x] Mobile PWA App with Phone+OTP auth, 4 role-based dashboards
- [x] Opponents CRUD with logo upload (scoped by team_type)
- [x] Venues/Facilities with Google Maps link (scoped by team_type)
- [x] Advanced Fixture Forms: venue dropdown auto-fills Google Maps, opponent select
- [x] Team & Academy Group Banners
- [x] **Sidebar Restructure** (Feb 2026): Αντίπαλοι/Γήπεδα under ΣΥΛΛΟΓΟΣ and ΑΚΑΔΗΜΙΑ
- [x] **Section Dashboards** (Feb 2026): Club & Academy dashboards with scoped calendar, stats, upcoming events
- [x] **Removed standalone Ημερολόγιο & Παρουσίες** from sidebar (Feb 2026)

## Key Files
- `/app/frontend/src/pages/admin/SectionDashboard.jsx` - Club/Academy dashboard with calendar
- `/app/frontend/src/pages/admin/ScopedManagement.jsx` - Opponents & Venues standalone tabs
- `/app/frontend/src/pages/admin/TrainingSessionsPanel.jsx` - Training with venue/location
- `/app/frontend/src/pages/AdminPanel.jsx` - Main admin CMS
- `/app/frontend/src/mobile/` - Mobile PWA app

## Phase 2 (In Progress — Attendance inside events)
- [ ] Attendance inside each training session and match (not standalone)
- [ ] Attendance stats inside player profiles
- [ ] Mobile parent "Going"/"Not Going" for events with toggle
- [ ] Sync availability to admin attendance view

## Backlog
- P1: Add Twilio SMS keys for real OTP
- P1: Verify Match-day Push Notifications & POTM Social Share
- P1: Refactor server.py (3600+ lines) and AdminPanel.jsx (3500+ lines)
- P2: Team chat/messaging in mobile app
- P3: Video uploads in gallery
- P3: AI-generated match report narratives
- P3: Multi-language support (English toggle)
