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
    Ομάδες → drill-down: Παίκτες, Γκαλερί
    Εγγραφές → list with filter, detail, approve/reject
─── Standalone ───
    Νέα, Μηνύματα
─── ΚΑΤΑΣΤΗΜΑ ───
    Προϊόντα, Εισιτήρια, Παραγγελίες
─── ΡΥΘΜΙΣΕΙΣ ───
    Πληροφορίες, Σεζόν, Γήπεδα
```

## Completed Features
- [x] Public-facing club website (Team Hub, Fixtures, Standings, News, Gallery, Contact)
- [x] Admin CMS with login + design overhaul (high contrast, bigger fonts, professional look)
- [x] Player Profiles with transfer history
- [x] Match Reports & Live Score control
- [x] Configurable Standings (inside team drill-down)
- [x] Web Push Notifications + match-day reminders
- [x] Customer Authentication (Login/Register/Profile)
- [x] POTM Voting (with social sharing)
- [x] E-Commerce: Products, Cart, Checkout, Orders
- [x] Tickets integrated with Shop
- [x] Admin: Orders, Products, Tickets management
- [x] Full Mobile Responsiveness
- [x] Auto Scroll-to-Top on navigation
- [x] Admin Panel Restructuring: grouped sidebar, Teams CRUD with drill-down
- [x] Per-team/academy Gallery with team_id/academy_group_id filtering
- [x] **Academy Registration** (Feb 2026):
  - Multi-step form (5 steps): Player, Parent, Medical, Terms/Consents, Payment/Signature
  - Digital signature pad (canvas-based, draw with mouse/touch)
  - Full validation per step
  - Homepage "Δήλωσε Ενδιαφέρον" button links to /academy/registration
  - Admin "Εγγραφές" tab under ΑΚΑΔΗΜΙΑ with status filter, detail view, approve/reject
  - Approved registrations auto-create academy player with parent contact info
  - Sidebar badge shows pending registration count

## Key DB Collections
admins, users, players, teams, fixtures, standings, academy_groups, staff, news, gallery, venues, seasons, products, tickets, orders, potm_votes, push_subscriptions, club, contact_messages, **registrations**

## Backlog
- P3: Video uploads in gallery
- P3: AI-generated match report narratives
- P3: Multi-language support (English toggle)
- Refactor: server.py (3000+ lines) into FastAPI routers
- Refactor: App.js (1700+ lines) - extract Homepage components
- Refactor: AdminPanel.jsx (2600+ lines) - extract tab components
