# Lefteria FC / ΛΕΥΤΕΡΙΑ FC - Product Requirements

## Original Problem Statement
Build a complete football club CMS and public-facing website for "Lefteria FC" (ΛΕΥΤΕΡΙΑ FC). Features include a centralized Team Hub, Player Profiles, Gallery, Web Push Notifications, Match Reports, Player Transfer History, Shop/Tickets page, POTM voting, and seeded data. All frontend UI text must be in Greek.

## Architecture
- **Frontend**: React + Tailwind CSS + lucide-react, Shadcn/UI components
- **Backend**: FastAPI + MongoDB (Motor) + PyJWT
- **Backend Routes**: Modular routers in `/app/backend/routes/` (financial.py, videos.py, resources.py) + monolith `server.py`
- **Auth**: Dual auth - Admin CMS (`useAdminAuth`) and Customer (`CustomerAuth.jsx`)
- **Push**: Native VAPID Web Push Notifications

## Admin Panel Structure
```
Πίνακας (Dashboard)
Live Score
─── ΣΥΛΛΟΓΟΣ ───
    Ομάδες → drill-down: Ρόστερ, Πρόγραμμα, Προπονήσεις, Βίντεο, Staff, Βαθμολογία, Γκαλερί
─── ΑΚΑΔΗΜΙΑ ───
    Ομάδες → drill-down: Ρόστερ, Αγώνες, Προπονήσεις, Βίντεο, Γκαλερί
    Εγγραφές → list with filter, detail, approve/reject
─── Standalone ───
    Νέα, Ανακοινώσεις, Μηνύματα
─── Calendar/Attendance ───
    Ημερολόγιο, Παρουσίες
─── ΔΙΑΧΕΙΡΙΣΗ ───
    Οικονομικά, Εγκαταστάσεις
─── ΚΑΤΑΣΤΗΜΑ ───
    Προϊόντα, Εισιτήρια, Παραγγελίες
─── ΡΥΘΜΙΣΕΙΣ ───
    Πληροφορίες, Σεζόν, Γήπεδα
```

## Completed Features
- [x] Public-facing club website
- [x] Admin CMS with login + professional dark design
- [x] Player Profiles with transfer history
- [x] Match Reports & Live Score control
- [x] Configurable Standings (inside team drill-down)
- [x] Web Push Notifications + match-day reminders
- [x] Customer Authentication (Login/Register/Profile)
- [x] POTM Voting (with social sharing)
- [x] E-Commerce: Products, Cart, Checkout, Orders
- [x] Admin: Orders, Products, Tickets management
- [x] Full Mobile Responsiveness
- [x] Admin Panel Restructuring: grouped sidebar, Teams CRUD with drill-down
- [x] Per-team/academy Gallery
- [x] Academy Registration (5-step wizard with digital signature)
- [x] Full Academy Player Management: CRUD, DOB, parent info, multi-group, transfers
- [x] Full-Width Admin UI
- [x] Admin Player Profile View with Development & Evaluation panels
- [x] Public Academy Group Pages with Season Statistics
- [x] Match Player Stats Input (MatchStatsModal)
- [x] Grassroots Academy (no points), DOB-based age, Stadium image
- [x] Club Calendar (events + fixtures merged)
- [x] Attendance Tracking (per-player rates)
- [x] Wall Posts / Announcements (social feed)
- [x] Training Session Planning (in team & academy drill-downs)
- [x] Player Development Plans (in player profile)
- [x] Player Evaluation System (in player profile)
- [x] **Financial Dashboard** (Feb 2026): Payment tracking, KPI cards (revenue/pending/overdue/expected), monthly revenue chart, records table with filters, mark-as-paid, bulk dues generation for teams/academy groups
- [x] **Video Analytics** (Feb 2026): Video management inside team & academy drill-downs, YouTube embed support, timestamped markers/annotations, player tagging, video upload support
- [x] **Resource/Field Management** (Feb 2026): Facility CRUD (type, surface, capacity, lighting, changing rooms), calendar-based booking system, availability time slot viewer (07:00-22:00), conflict detection preventing double-booking, recurring weekly bookings

## Key API Endpoints (P2 New - Feb 2026)
- CRUD `/api/admin/financial/records` (Financial records)
- PUT `/api/admin/financial/records/{id}/pay` (Mark as paid)
- GET `/api/admin/financial/stats` (Dashboard KPIs + monthly revenue)
- POST `/api/admin/financial/generate-dues` (Bulk dues for team/group)
- CRUD `/api/admin/videos` (Video management)
- POST `/api/admin/videos/upload` (File upload)
- POST/DELETE `/api/admin/videos/{id}/markers` (Timeline markers)
- GET `/api/videos` (Public video list)
- CRUD `/api/admin/facilities` (Facility management)
- CRUD `/api/admin/bookings` (Booking management with conflict detection)
- GET `/api/admin/facilities/{id}/availability` (Time slot availability)

## Key DB Collections
admins, users, players, teams, fixtures, standings, academy_groups, staff, news, gallery, venues, seasons, products, tickets, orders, potm_votes, push_subscriptions, club, contact_messages, registrations, events, attendances, wall_posts, training_sessions, player_development, player_evaluations, financial_records, videos, facilities, bookings

## Key Frontend Files
- `/app/frontend/src/pages/AdminPanel.jsx` - Admin CMS (~3370 lines)
- `/app/frontend/src/pages/admin/FinancialDashboard.jsx` - Financial Dashboard
- `/app/frontend/src/pages/admin/VideoAnalyticsPanel.jsx` - Video Analytics
- `/app/frontend/src/pages/admin/ResourceManagement.jsx` - Resource/Field Management
- `/app/frontend/src/pages/admin/CalendarTab.jsx` - Calendar
- `/app/frontend/src/pages/admin/AttendanceTab.jsx` - Attendance
- `/app/frontend/src/pages/admin/WallTab.jsx` - Wall Posts
- `/app/frontend/src/pages/admin/TrainingSessionsPanel.jsx` - Training Sessions
- `/app/frontend/src/pages/admin/PlayerDevelopmentPanel.jsx` - Player Development
- `/app/frontend/src/pages/admin/PlayerEvaluationPanel.jsx` - Player Evaluations

## Backlog
- P2: Verify Match-day Push Notifications & POTM Social Share (testing pending)
- P3: Video uploads in gallery
- P3: AI-generated match report narratives
- P3: Multi-language support (English toggle)
- Refactor: server.py (3500+ lines) into FastAPI routers (partially started with /routes/)
- Refactor: App.js (1700+ lines) - extract Homepage components
- Refactor: AdminPanel.jsx (3370+ lines) - extract remaining tab components
