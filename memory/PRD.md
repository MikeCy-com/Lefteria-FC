# Lefteria FC / ΛΕΥΤΕΡΙΑ 2024 — PRD

## Original Problem Statement
Create a website for ΛΕΥΤΕΡΙΑ 2024 football club (Limassol, Cyprus, ΠΑΑΟΚ league) with academy section, SportsPress-style design, full CMS admin panel with live match management. Official ΠΑΑΟΚ Α' Όμιλος 2025-2026 data seeded.

## Core Requirements
- Club branding: Orange/gold (#F5A623), Black, White
- WordPress/SportsPress-style design, entire website in Greek
- Hidden admin panel at /admin/login (JWT protected)
- MongoDB database, real official ΠΑΑΟΚ data (105 fixtures, 11 teams)

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
- **Customer Auth System** — Registration, login, profile, change password, JWT tokens
- **Real Product Shop** — 6 products from lefteriafc.cy, size selection, add to cart
- **Shopping Cart** — Full cart with quantity controls, item removal, totals
- **Order Placement** — Checkout with shipping form, order history in profile
- **Login-Based Voting** — POTM voting requires login, withdraw/revote, public leaderboard
- **Header Navigation** — Cart icon with badge + Profile/Login icon
- Birthday ticker, ScrollToTop, Greek font optimization

## Key API Endpoints
### Customer Auth
- `POST /api/customer/register` — Register (name, email, password, phone)
- `POST /api/customer/login` — Login (returns JWT)
- `POST /api/customer/logout` — Logout (clears cookie)
- `GET /api/customer/me` — Get profile (requires auth)
- `PUT /api/customer/profile` — Update profile
- `POST /api/customer/change-password` — Change password

### Products & Shop
- `GET /api/products` — List all products
- `GET /api/products/{id}` — Product detail

### Cart
- `GET /api/cart` — Get cart (auth required)
- `POST /api/cart/add` — Add item (product_id, quantity, size)
- `PUT /api/cart/item/{id}` — Update quantity
- `DELETE /api/cart/item/{id}` — Remove item
- `GET /api/cart/count` — Cart item count

### Orders
- `POST /api/orders` — Place order (shipping details)
- `GET /api/orders` — User's order history
- `GET /api/orders/{id}` — Order detail

### Voting
- `POST /api/votes/potm` — Cast vote (auth required)
- `POST /api/votes/potm/withdraw` — Withdraw vote (auth required)
- `GET /api/votes/potm/results` — Public leaderboard
- `GET /api/votes/potm/check` — Check user's vote status
- `GET /api/votes/potm/player/{id}` — Player voting detail

## Routes
- `/` — Homepage
- `/login` — Customer login
- `/register` — Customer registration
- `/profile` — Customer profile (tabs: info, orders, password)
- `/shop` — Product shop (6 real items)
- `/cart` — Shopping cart
- `/checkout` — Order placement
- `/vote` — Player of the Month voting
- `/team` — Team Hub (6 tabs)
- `/player/:id` — Player profile
- `/match/:id` — Match report
- `/about`, `/academy`, `/news`, `/contact`
- `/admin/login` — Admin CMS

## DB Collections
- `admin_users` — Admin accounts (JWT role="admin")
- `users` — Customer accounts (JWT role="customer")
- `products` — Shop products (seeded from lefteriafc.cy)
- `carts` — Shopping carts (per user)
- `orders` — Placed orders with shipping details
- `potm_votes` — POTM votes (linked to user_id)
- `players`, `fixtures`, `standings`, `news`, `gallery`, etc.

## Backlog (P3)
- Video uploads in gallery
- AI-generated match report narratives
- Multi-language support (English toggle)
- Refactor server.py into FastAPI routers (~2500 lines)
- Admin orders management tab

## Key Technical Notes
- Customer auth uses JWT with role="customer", admin uses role="admin"
- Token stored in localStorage (customer_token) + httpOnly cookie
- Products seeded on startup if collection empty (6 items from lefteriafc.cy)
- Orders use "pay on delivery" model (no online payment)
- Voting uses voter_id (user.id) + month_key unique index
- Admin and customer auth systems are completely separate
