# Lefteria FC / ΛΕΥΤΕΡΙΑ 2024 — PRD

## Original Problem Statement
Create a website for ΛΕΥΤΕΡΙΑ 2024 football club (Limassol, Cyprus, ΠΑΑΟΚ league) with academy section, SportsPress-style design, full CMS admin panel with live match management. Official ΠΑΑΟΚ Α' Όμιλος 2025-2026 data seeded.

## Core Requirements
- Club branding: Orange/gold (#F5A623), Black, White
- WordPress/SportsPress-style design, entire website in Greek
- Hidden admin panel at /admin/login (JWT protected)
- MongoDB database, real official ΠΑΑΟΚ data (105 fixtures, 11 teams)
- Fully responsive on all screen sizes

## Architecture
```
/app/
├── backend/
│   ├── server.py              # FastAPI monolith (~2500 lines)
│   ├── seed_official_data.py  # Official ΠΑΑΟΚ 2025-2026 data seeder
│   ├── uploads/               # Player images, gallery photos
│   └── .env                   # MONGO_URL, VAPID keys, JWT config
├── frontend/src/
│   ├── App.js                 # Routes, Navigation (cart+profile icons), HomePage, layouts
│   ├── context/CustomerAuth.jsx  # Customer auth context (login, register, cart)
│   ├── pages/
│   │   ├── AdminPanel.jsx     # Standalone CMS (13 tabs + Match Control Center)
│   │   ├── TeamHubPage.jsx    # SportsPress-style tabbed Team page (6 tabs)
│   │   ├── PlayerProfilePage.jsx  # Hero banner + stat bars + tabbed profile
│   │   ├── MatchReportPage.jsx    # Full match detail with event timeline
│   │   ├── NewShopPage.jsx    # Real products from lefteriafc.cy with cart
│   │   ├── VotePage.jsx       # Login-required POTM voting with leaderboard
│   │   ├── LoginPage.jsx      # Customer login page
│   │   ├── RegisterPage.jsx   # Customer registration page
│   │   ├── ProfilePage.jsx    # Profile with tabs (info, orders, password)
│   │   ├── CartPage.jsx       # Shopping cart with qty controls
│   │   └── CheckoutPage.jsx   # Checkout with shipping form + order placement
```

## What's Been Implemented
- Full Admin CMS with 13+ tabs
- Centralized Team Hub page with 6 tabs
- Player Profile, Match Report, Gallery, Web Push Notifications
- League Table, Player Transfers, Live Match widget
- Official ΠΑΑΟΚ Α' Όμιλος 2025-2026 data seeded
- Customer Auth System (registration, login, profile, change password)
- Real Product Shop (6 products from lefteriafc.cy, size selection, cart)
- Shopping Cart (quantity controls, item removal, totals)
- Order Placement (checkout with shipping form, order history)
- Login-Based POTM Voting (withdraw/revote, public leaderboard)
- Header Navigation with cart icon (badge) + profile/login icon
- Birthday ticker, ScrollToTop, Greek font optimization
- **Full mobile responsiveness** — All pages optimized for 375px+ screens

## Mobile Responsive Fixes Applied (Apr 2026)
- Reduced hero/section padding: py-20→py-10 md:py-20, px-6→px-4 md:px-6
- Fixtures: team names truncate with ellipsis, smaller score boxes
- Standings table: min-width + horizontal scroll, smaller cells on mobile
- Team Hub/Player Profile tabs: hidden "Η Ομάδα" subtitle, smaller padding
- Contact page: reduced gap between hero and content
- Roster table: hidden "Minutes" column on mobile, smaller avatars
- Footer: responsive padding
- Stats bar: tighter grid gap on mobile

## Backlog (P3)
- Video uploads in gallery
- AI-generated match report narratives
- Multi-language support (English toggle)
- Refactor server.py into FastAPI routers (~2500 lines)
- Admin orders management tab
