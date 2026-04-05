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
│   ├── server.py              # FastAPI monolith (~2800 lines)
│   ├── uploads/               # Player images, gallery photos
│   └── .env
├── frontend/src/
│   ├── App.js                 # Routes, Nav (Κατάστημα + cart/profile icons), HomePage
│   ├── context/CustomerAuth.jsx  # Customer auth context
│   ├── pages/
│   │   ├── AdminPanel.jsx     # CMS (16 tabs: + Προϊόντα, Εισιτήρια, Παραγγελίες)
│   │   ├── NewShopPage.jsx    # Shop with tabs: Εισιτήρια + Ρουχισμός
│   │   ├── VotePage.jsx       # Login-required POTM voting
│   │   ├── LoginPage/RegisterPage/ProfilePage/CartPage/CheckoutPage
│   │   └── TeamHubPage, PlayerProfilePage, MatchReportPage
```

## What's Been Implemented
- Full Admin CMS (16 tabs including Products, Tickets, Orders management)
- Customer Auth (registration, login, profile, change password)
- **Shop with Tickets + Merchandise** — Two tabs: match/seasonal tickets (buy online) + merchandise products from lefteriafc.cy
- **Admin Product CRUD** — Add/edit/delete products, set prices, sizes, delivery options
- **Admin Ticket CRUD** — Match tickets (linked to fixtures) + seasonal tickets
- **Admin Orders** — View all orders, update status (pending→processing→shipped→completed→cancelled)
- Shopping cart (products + tickets), Checkout with shipping, Order history
- Login-based POTM Voting, Birthday ticker, Web Push Notifications
- Full mobile responsiveness
- Official ΠΑΑΟΚ data seeded (105 fixtures, 11 teams, 6 products, 1 seasonal ticket)

## Key API Endpoints
### Admin Management
- `GET/POST /api/admin/products` — List/Create products
- `PUT/DELETE /api/admin/products/{id}` — Update/Delete product
- `GET/POST /api/admin/tickets` — List/Create tickets
- `PUT/DELETE /api/admin/tickets/{id}` — Update/Delete ticket
- `GET /api/admin/orders` — List all orders
- `PUT /api/admin/orders/{id}/status` — Update order status

### Public
- `GET /api/products` — List products
- `GET /api/tickets` — List available tickets (enriched with fixture info)
- `POST /api/cart/add-ticket` — Add ticket to cart (auth required)

## Routes
- `/` — Homepage
- `/shop` — Shop (Εισιτήρια + Ρουχισμός tabs)
- `/login`, `/register`, `/profile`, `/cart`, `/checkout`
- `/vote` — POTM voting (requires login)
- `/team`, `/player/:id`, `/match/:id`
- `/about`, `/academy`, `/news`, `/contact`
- `/admin/login` — Admin CMS

## DB Collections
- `admin_users`, `users`, `products`, `tickets`, `carts`, `orders`
- `potm_votes`, `players`, `fixtures`, `standings`, `news`, `gallery`

## Backlog (P3)
- Video uploads in gallery
- AI-generated match report narratives
- Multi-language support (English toggle)
- Refactor server.py into FastAPI routers (~2800 lines)
