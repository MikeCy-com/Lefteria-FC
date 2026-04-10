# Lefteria FC - Football Club CMS & Public Website

## Original Problem Statement
Complete football club CMS and public website for "Lefteria FC". Fully functioning CMS + Public facing club hub, entirely in Greek. Mobile PWA with Role-based OTP login, advanced scheduling, scoped venues/opponents, and interactive mobile attendance tracking. Mobile PWA redesigned with PlayerDex-inspired expandable drill-down UI and public/private chat system.

## Architecture
- **Frontend**: React, Tailwind CSS, PWA
- **Backend**: FastAPI, MongoDB (Motor), PyJWT
- **Auth**: JWT Admin/Customer + Role-based OTP Mobile (Twilio mocked)

## Key Constraints
- All UI text in **Greek**, ALL CAPS text without accent marks
- Academy age groups: **U6 to U12** only
- Currency: **Euro** symbol
- OTP via Twilio is **mocked**
- Mobile PWA uses ONLY bottom navigation (no top tabs)

## What's Been Implemented

### Core CMS (Admin Panel)
- Full admin UI with sidebar (Club/Academy/Management/Shop sections)
- Teams, Academy Groups, Players (CRUD + image uploads)
- Fixtures with inline attendance (expandable cards)
- Training sessions with bulk creation + inline attendance
- News, announcements, wall posts, financial dashboard
- Resources, shop, seasons, settings

### Public Website
- Homepage, Team hub, Academy pages, Match reports
- News, Contact, Customer auth, Shop, POTM voting

### Mobile PWA - PlayerDex-Inspired Redesign (COMPLETED)
- **Bottom Navigation**: 4 tabs only (Home, Schedule, Chat, Profile)
- **Home View**: Team cards, children quick-access, quick stats, upcoming events
- **Team Drill-Down**: Expandable sections - Events, Roster, Staff, Announcements
- **Chat System**: Team chats + private messaging, message polling
- **Profile Page**: Avatar upload, editable name/email, logout

### Codebase Refactoring (COMPLETED - Feb 2026)
**Backend server.py: 3638 → 2782 lines (-24%)**
- Extracted `models.py` (785 lines) - All Pydantic models + Enums
- Extracted `auth.py` (106 lines) - JWT auth helpers + dependencies
- Extracted `database.py` (7 lines) - MongoDB connection module

**Frontend AdminPanel.jsx: 3669 → 2223 lines (-39%)**
- Extracted `admin/TeamsTab.jsx` (429 lines) - Teams CRUD with drill-down
- Extracted `admin/EnhancedAcademyTab.jsx` (526 lines) - Academy CRUD with drill-down
- Extracted `admin/RegistrationsTab.jsx` (201 lines) - Academy registrations management
- Extracted `admin/ShopTabs.jsx` (287 lines) - Products, Tickets, Orders
- Extracted `admin/shared.jsx` (70 lines) - FormModal, Field, AdminInput, etc.

## Prioritized Backlog
### P2
- Push notifications & POTM share verification

### P3
- Video uploads in gallery
- AI match report narratives
- Multi-language support (English toggle)

## Key Files
### Backend (refactored)
- `/app/backend/server.py` - Main server routes (2782 lines)
- `/app/backend/models.py` - All Pydantic models + Enums (785 lines)
- `/app/backend/auth.py` - Auth helpers (106 lines)
- `/app/backend/database.py` - MongoDB connection (7 lines)
- `/app/backend/routes/mobile_auth.py` - Mobile auth + chat + profile APIs

### Frontend (refactored)
- `/app/frontend/src/pages/AdminPanel.jsx` - Admin orchestrator (2223 lines)
- `/app/frontend/src/pages/admin/TeamsTab.jsx` - Teams tab
- `/app/frontend/src/pages/admin/EnhancedAcademyTab.jsx` - Academy tab
- `/app/frontend/src/pages/admin/RegistrationsTab.jsx` - Registrations tab
- `/app/frontend/src/pages/admin/ShopTabs.jsx` - Products/Tickets/Orders
- `/app/frontend/src/pages/admin/shared.jsx` - Shared components
- `/app/frontend/src/mobile/` - Mobile PWA components
