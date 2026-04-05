# Lefteria FC / ΛΕΥΤΕΡΙΑ FC - Product Requirements

## Original Problem Statement
Build a complete football club CMS and public-facing website for "Lefteria FC" (ΛΕΥΤΕΡΙΑ FC). Features include a centralized Team Hub, Player Profiles, Gallery, Web Push Notifications, Match Reports, Player Transfer History, Shop/Tickets page, POTM voting, and seeded data. All frontend UI text must be in Greek.

## Architecture
- **Frontend**: React + Tailwind CSS + lucide-react, Shadcn/UI components
- **Backend**: FastAPI + MongoDB (Motor) + PyJWT
- **Auth**: Dual auth - Admin CMS (`useAdminAuth`) and Customer (`CustomerAuth.jsx`)
- **Push**: Native VAPID Web Push Notifications

## Completed Features
- [x] Public-facing club website (Team Hub, Fixtures, Standings, News, Gallery, Contact)
- [x] Admin CMS with login
- [x] Player Profiles with transfer history
- [x] Match Reports & Live Score control
- [x] Configurable Standings
- [x] Web Push Notifications
- [x] Customer Authentication (Login/Register/Profile)
- [x] POTM Voting (restricted to authenticated users, with social sharing)
- [x] E-Commerce: Products, Cart, Checkout, Orders
- [x] Tickets integrated with Shop
- [x] Admin management for Orders, Products, Tickets
- [x] Full Mobile Responsiveness audit
- [x] Auto Scroll-to-Top on page navigation
- [x] Match-day reminder push notification (backend endpoint + background task)
- [x] Social media sharing for POTM votes (Facebook, Twitter, Copy Link)
- [x] **Admin Panel Restructuring** (Feb 2026):
  - Sidebar reorganized into collapsible groups: ΣΥΛΛΟΓΟΣ, ΑΚΑΔΗΜΙΑ, ΚΑΤΑΣΤΗΜΑ, ΡΥΘΜΙΣΕΙΣ
  - Teams management with CRUD (create/edit/delete teams)
  - Team drill-down: Ρόστερ (Roster), Πρόγραμμα (Schedule), Staff sub-tabs
  - Academy enhanced with drill-down into players per group
  - Club Profile moved to Settings > Πληροφορίες
  - Seasons moved to Settings > Σεζόν
  - Venues moved to Settings > Γήπεδα
  - Shop items (Products, Tickets, Orders) grouped under ΚΑΤΑΣΤΗΜΑ
  - Current season auto-detection endpoint
  - Dashboard stats updated with Teams count

## Key API Endpoints
- `POST /api/auth/login` & `POST /api/auth/register` (Customer)
- `POST /api/admin/login` (Admin CMS)
- `GET /api/teams` & `POST/PUT/DELETE /api/admin/teams/{id}` (Teams CRUD)
- `GET /api/current-season` (Auto season detection)
- `GET /api/players`, `GET /api/fixtures`, `GET /api/standings`
- `GET /api/products`, `GET /api/tickets`
- `POST /api/cart/add`, `GET /api/cart`
- `POST /api/admin/push/match-reminder`

## DB Collections
- admins, users (customers), players, teams (NEW), fixtures, standings
- academy_groups, staff, news, gallery, venues, seasons
- products, tickets, orders, potm_votes, push_subscriptions, club, contact_messages

## Backlog
- P3: Video uploads in gallery
- P3: AI-generated match report narratives
- P3: Multi-language support (English toggle)
- Refactor: server.py (2800+ lines) into FastAPI routers
- Refactor: App.js (1600+ lines) - extract Homepage components
- Refactor: AdminPanel.jsx (2200+ lines) - extract tab components to separate files
