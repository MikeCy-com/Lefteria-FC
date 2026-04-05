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
    Ομάδες → drill-down: Ρόστερ, Πρόγραμμα, Staff, Βαθμολογία, Γκαλερί
─── ΑΚΑΔΗΜΙΑ ───
    Ομάδες → drill-down: Ρόστερ (full CRUD + transfer), Αγώνες (CRUD), Γκαλερί
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
- [x] **Full Academy Player Management** (Feb 2026):
  - Full CRUD: Add, edit, delete academy players within groups
  - Rich player profiles: DOB (auto-age), parent contact (name/phone/email), all profile fields
  - Multi-group support: Transfer/assign players to multiple academy groups
  - Academy fixtures per group: Create, complete (score entry), delete
  - Academy group drill-down: Ρόστερ, Αγώνες, Γκαλερί (no standings for grassroots)
  - Public academy player profiles with academy breadcrumb
  - Transfer modal with multi-group checkbox selection

## Key API Endpoints
- POST/GET/PUT/DELETE `/api/admin/players` (Player CRUD with auto-age from DOB)
- POST `/api/admin/players/{id}/transfer` (Multi-group assignment)
- GET `/api/academy-groups/{id}/players` (Multi-group aware)
- POST/GET `/api/admin/academy-groups/{id}/fixtures` (Academy fixtures)
- GET `/api/gallery?academy_group_id={id}` (Per-group gallery)

## Key DB Collections
admins, users, players, teams, fixtures, standings, academy_groups, staff, news, gallery, venues, seasons, products, tickets, orders, potm_votes, push_subscriptions, club, contact_messages, registrations

## Player Model Fields
name, number, position, nationality, age, date_of_birth, team_type, team_id, academy_group_id, academy_group_ids (multi-group), academy_group_name, image_url, bio, height, weight, preferred_foot, statistics, previous_clubs, parent_name, parent_phone, parent_email, is_active

## Backlog
- P3: Video uploads in gallery
- P3: AI-generated match report narratives
- P3: Multi-language support (English toggle)
- Refactor: server.py (3100+ lines) into FastAPI routers
- Refactor: App.js (1700+ lines) - extract Homepage components
- Refactor: AdminPanel.jsx (2700+ lines) - extract tab components
