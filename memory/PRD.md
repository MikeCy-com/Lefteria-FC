# Lefteria FC / ΛΕΥΤΕΡΙΑ FC - Product Requirements

## Original Problem Statement
Build a complete football club CMS and public-facing website for "Lefteria FC" (ΛΕΥΤΕΡΙΑ FC). Features include a centralized Team Hub, Player Profiles, Gallery, Web Push Notifications, Match Reports, Player Transfer History, Shop/Tickets page, POTM voting, and seeded data. All frontend UI text must be in Greek.

## Architecture
- **Frontend**: React + Tailwind CSS + lucide-react, Shadcn/UI components
- **Backend**: FastAPI + MongoDB (Motor) + PyJWT
- **Auth**: Dual auth - Admin CMS (`useAdminAuth`) and Customer (`CustomerAuth.jsx`)
- **Push**: Native VAPID Web Push Notifications

## Admin Panel Structure
```
Πίνακας (Dashboard)
Live Score
─── ΣΥΛΛΟΓΟΣ ───
    Ομάδες → drill-down: Ρόστερ (clickable player profiles), Πρόγραμμα, Staff, Βαθμολογία, Γκαλερί
─── ΑΚΑΔΗΜΙΑ ───
    Ομάδες → drill-down: Ρόστερ (clickable player profiles + transfer), Αγώνες (CRUD), Γκαλερί
    Εγγραφές → list with filter, detail, approve/reject
─── Standalone ───
    Νέα, Μηνύματα
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
- [x] Full Academy Player Management (Feb 2026): CRUD, DOB, parent info, multi-group, transfers
- [x] **Full-Width Admin UI** (Feb 2026): Main content area uses full width next to fixed sidebar
- [x] **Admin Player Profile View** (Feb 2026): Clicking player name in any roster opens full profile with view/edit modes, personal info, team info, parent info cards
- [x] **Public Academy Group Pages** (Feb 2026): /academy/:groupId route with hero, breadcrumb, Ρόστερ/Πρόγραμμα/Γκαλερί tabs, clickable player cards
- [x] **Academy Season Statistics** (Feb 2026): New Στατιστικά tab on academy group pages with W/D/L record, goals summary (for/against/diff), win rate bar chart, top scorers/assisters/appearances leaderboards
- [x] **Footer Greek Text** (Feb 2026): Replaced English footer text with Greek equivalent
- [x] **Match Player Stats Input** (Feb 2026): MatchStatsModal in admin academy schedule - replaces prompt() with proper modal for score + per-player stats (goals, assists, cards, minutes). Idempotent save/re-edit via POST /api/admin/fixtures/{id}/player-stats. Auto-populates public Στατιστικά tab.
- [x] **Grassroots Academy** (Feb 2026): Removed Βαθμοί (Points) from academy Στατιστικά tab since they play grassroots
- [x] **DOB for all players** (Feb 2026): All player forms (First Team, Academy, PlayersTab, AdminPlayerProfile) now use date-of-birth input with auto-calculated age
- [x] **Stadium image** (Feb 2026): Replaced Γήπεδο Αετού image with user-uploaded photo

## Key API Endpoints
- POST/GET/PUT/DELETE `/api/admin/players` (Player CRUD with auto-age from DOB)
- POST `/api/admin/players/{id}/transfer` (Multi-group assignment)
- GET `/api/academy-groups/{id}` (Single group)
- GET `/api/academy-groups/{id}/players` (Multi-group aware)
- POST/GET `/api/admin/academy-groups/{id}/fixtures` (Academy fixtures)
- GET `/api/gallery?academy_group_id={id}` (Per-group gallery)
- GET `/api/academy-groups/{id}/fixtures` (Public fixtures)

## Key DB Collections
admins, users, players, teams, fixtures, standings, academy_groups, staff, news, gallery, venues, seasons, products, tickets, orders, potm_votes, push_subscriptions, club, contact_messages, registrations

## Player Model Fields
name, number, position, nationality, age, date_of_birth, team_type, team_id, academy_group_id, academy_group_ids (multi-group), academy_group_name, image_url, bio, height, weight, preferred_foot, statistics, previous_clubs, parent_name, parent_phone, parent_email, is_active

## Key Frontend Files
- `/app/frontend/src/pages/AdminPanel.jsx` - Admin CMS with AdminPlayerProfile component
- `/app/frontend/src/pages/AcademyGroupPage.jsx` - Public academy group detail page
- `/app/frontend/src/App.js` - Routing, homepage, AcademyPage with clickable group cards
- `/app/frontend/src/pages/PlayerProfilePage.jsx` - Public player profile
- `/app/frontend/src/pages/RegistrationPage.jsx` - 5-step academy registration wizard

## Backlog
- P2: Verify Match-day Push Notifications & POTM Social Share (testing pending from previous fork)
- P3: Video uploads in gallery
- P3: AI-generated match report narratives
- P3: Multi-language support (English toggle)
- Refactor: server.py (3100+ lines) into FastAPI routers
- Refactor: App.js (1700+ lines) - extract Homepage components
- Refactor: AdminPanel.jsx (3100+ lines) - extract tab components
