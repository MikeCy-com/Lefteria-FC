# Lefteria FC / ΛΕΥΤΕΡΙΑ FC - Product Requirements

## Original Problem Statement
Build a complete football club CMS and public-facing website for "Lefteria FC" (ΛΕΥΤΕΡΙΑ FC). Features include a centralized Team Hub, Player Profiles, Gallery, Web Push Notifications, Match Reports, Player Transfer History, Shop/Tickets page, POTM voting, and seeded data. All frontend UI text must be in Greek.

## Architecture
- **Frontend**: React + Tailwind CSS + lucide-react, Shadcn/UI components
- **Backend**: FastAPI + MongoDB (Motor) + PyJWT
- **Auth**: Dual auth - Admin CMS (`useAdminAuth`) and Customer (`CustomerAuth.jsx`)
- **Push**: Native VAPID Web Push Notifications

## Admin Panel Structure (Current)
```
Πίνακας (Dashboard)
Live Score
─── ΣΥΛΛΟΓΟΣ ───
    Ομάδες → drill-down: Ρόστερ, Πρόγραμμα, Staff, Βαθμολογία, Γκαλερί
─── ΑΚΑΔΗΜΙΑ ───
    Ομάδες → drill-down: Παίκτες, Γκαλερί
─── Standalone ───
    Νέα
    Μηνύματα
─── ΚΑΤΑΣΤΗΜΑ ───
    Προϊόντα, Εισιτήρια, Παραγγελίες
─── ΡΥΘΜΙΣΕΙΣ ───
    Πληροφορίες, Σεζόν, Γήπεδα
```

## Completed Features
- [x] Public-facing club website (Team Hub, Fixtures, Standings, News, Gallery, Contact)
- [x] Admin CMS with login
- [x] Player Profiles with transfer history
- [x] Match Reports & Live Score control
- [x] Configurable Standings
- [x] Web Push Notifications
- [x] Customer Authentication (Login/Register/Profile)
- [x] POTM Voting (with social sharing)
- [x] E-Commerce: Products, Cart, Checkout, Orders
- [x] Tickets integrated with Shop
- [x] Admin management for Orders, Products, Tickets
- [x] Full Mobile Responsiveness
- [x] Auto Scroll-to-Top on navigation
- [x] Match-day push notification reminder
- [x] Admin Panel Restructuring (Feb 2026): grouped sidebar, Teams CRUD with drill-down
- [x] **Admin Design Overhaul** (Feb 2026): Bigger fonts, white text, better contrast, professional look
- [x] **Βαθμολογία inside Team** (Feb 2026): Standings moved to team drill-down sub-tab
- [x] **Per-team/academy Γκαλερί** (Feb 2026): Gallery moved inside team + academy drill-down with team_id/academy_group_id filtering

## Key DB Collections
admins, users, players, teams, fixtures, standings, academy_groups, staff, news, gallery (with team_id, academy_group_id), venues, seasons, products, tickets, orders, potm_votes, push_subscriptions, club, contact_messages

## Backlog
- P3: Video uploads in gallery
- P3: AI-generated match report narratives
- P3: Multi-language support (English toggle)
- Refactor: server.py (2900+ lines) into FastAPI routers
- Refactor: App.js (1600+ lines) - extract Homepage components
- Refactor: AdminPanel.jsx (2300+ lines) - extract tab components to separate files
