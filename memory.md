# Memory / Project Context
## KITS ProjectHub

> Quick reference for AI assistants and developers resuming work on this project.

**Last Updated**: September 2026

---

## Project Identity

| Field | Value |
|-------|-------|
| **Project Name** | KITS ProjectHub |
| **Institution** | Kamala Institute of Technology and Science (KITS), Kodad, Telangana |
| **Purpose** | Official engineering capstone project repository and showcase |
| **Frontend URL** | `http://localhost:3000` (dev) / `http://localhost:3002` (alt) |
| **Backend URL** | `http://localhost:3001` |
| **DB File** | `backend/data/kits_projecthub.db` |

---

## Brand Colors

| Name | Hex |
|------|-----|
| Dark/Primary BG | `#19232B` |
| Crimson/Brand | `#CA0765` |
| Blue/Action | `#0070C2` |
| Cyan/Accent | `#03A9F5` |
| Muted Text | `#757F95` |
| Light Label | `#9FA6B3` |
| Border | `#D5D5D5` / `#E2E6ED` |

---

## Tech Stack Summary

```
Frontend:  React 18 + Vite + TypeScript + Tailwind CSS v4 + Lucide Icons
Backend:   Node.js + Express + TypeScript + better-sqlite3 + Argon2id + express-session
Database:  SQLite (WAL mode) at backend/data/kits_projecthub.db
Auth:      Email + Password → Argon2id hash → HttpOnly session cookie (kits_session)
```

---

## Key Files

| File | Purpose |
|------|---------|
| `frontend/src/App.tsx` | Root shell, page routing via `activePage` state |
| `frontend/src/context/AppContext.tsx` | ALL global state: auth, projects, CRUD |
| `frontend/src/services/apiClient.ts` | Fetch wrapper for all API calls |
| `frontend/src/config/collegeConfig.ts` | Departments, technologies, years, project types |
| `frontend/src/types/index.ts` | TypeScript types: Project, User, Group |
| `frontend/src/pages/Home.tsx` | Hero with search bar, dynamic metrics, clean dept browser |
| `frontend/src/pages/ExploreProjects.tsx` | Catalogue: filters, search, pagination, ratings |
| `frontend/src/pages/SubmitProject.tsx` | Multi-section submission form, plain card mode, live preview |
| `frontend/src/pages/ProjectDetails.tsx` | Full project detail view with ratings & comments section |
| `frontend/src/pages/MyGroupProject.tsx` | Student's own & shared group projects dashboard |
| `backend/src/server.ts` | Express entry point, middleware mount |
| `backend/src/db/schema.sql` | Relational SQLite table definitions |
| `backend/src/db/database.ts` | Database connection, migrations, seed & ratings/comments DDL |
| `backend/src/routes/auth.ts` | Auth API routes (login, register, me, logout, setup-password) |
| `backend/src/routes/projects.ts` | Project CRUD, deletion, doc upload, filters |
| `backend/src/routes/groups.ts` | Official groups, invitations (invite, accept, decline), roster |
| `backend/src/routes/ratings.ts` | 1–5 star ratings, self-rating check, aggregates |
| `backend/src/routes/comments.ts` | Project comments CRUD, pagination, privacy-safe display |
| `backend/src/services/projectSqlService.ts` | Project DB queries, search, filtering, member enrichment |
| `backend/src/services/groupSqlService.ts` | Group creation, roll-number invitation flow, membership queries |
| `backend/src/services/userService.ts` | User DB + Argon2id password operations |
| `backend/src/services/githubValidator.ts` | Backend GitHub repo link validation, canonicalization & reserved-word filtering |
| `frontend/src/utils/githubValidator.ts` | Frontend GitHub repo URL validation, live badge feedback & formatting helper |

---

## Routing (Frontend)

The app uses **state-based hash routing** (no React Router):

```
activePage value → Page Rendered
─────────────────────────────────
'home'         → <Home />
'explore'      → <ExploreProjects />
'details'      → <ProjectDetails />
'submit'       → <SubmitProject />
'my-projects'  → <MyGroupProject />
'signin'       → <SignInPage />
```

Navigation: `onNavigate(page, filterParam?)` in `App.tsx`  
Filter params: `search:query`, `dept-id`, `year-YYYY`, `featured`

---

## Design Decisions Made

1. **No React Router** — simple activePage state is sufficient for SPA with <10 routes
2. **No Redux/Zustand** — single AppContext handles all state at this scale
3. **SQLite over Postgres** — local dev, no external DB dependency
4. **Argon2id** — stronger than bcrypt, memory-hard, resistant to GPU attacks
5. **Immediate publication** — no faculty review workflow in v1 (simplicity)
6. **Hash routing** — works without server-side routing config
7. **Tailwind v4** — CSS-native config, `@theme` and `@layer` in `index.css`
8. **`!p-X` override** — `!important` Tailwind prefix used in filter sidebar to override `.kits-card` base padding
9. **Shared Group-Project Model** — 1 shared project record per group; projects appear automatically in all confirmed group members' profiles via `invite_status = 'accepted'` JOIN.
10. **Group Size & Invitations** — 4–6 confirmed students required before group project submission; members invited by roll number must accept before being confirmed; 1-group-per-student enforced by UNIQUE constraint on `user_id`.
11. **Leader-Only Permissions** — Only the group leader can upload or edit the project; non-leaders receive 403 Forbidden.
12. **Star Ratings & Comments** — Ratings (1–5 stars) attached to shared project ID with duplicate vote replacement; project owners and team members cannot rate their own project. Comments have 1000-char limit, author-only edit/delete, privacy-safe display (author name only, no email/roll number).
13. **Plain Card Mode & Live Preview** — SubmitProject includes "Plain Card" presentation mode in addition to photo upload and image URL, alongside a toggleable Full Card vs Banner Only live preview.
14. **Cascading Project Deletion** — `DELETE /api/projects/:id` removes project record and cascades to associated ratings and comments.
15. **PowerPoint Presentation Support** — `presentation_url` stored in database and exposed in project links. SubmitProject supports both cloud presentation URLs (Google Slides, Microsoft PowerPoint 365, Canva) and direct file upload (.pptx/.ppt/.pdf up to 50MB). Shown as download/view button on ProjectDetails, quick `PPT` indicator on ProjectCards, and status row in MyGroupProject.
16. **Strict GitHub Repository URL Validation** — Both client and server strictly enforce valid GitHub repository links (`https://github.com/:owner/:repo`). Rejects generic/system paths (e.g. `/explore`, `/pricing`), profile URLs without repo name, and non-GitHub hosts. Automatically canonicalizes and prepends `https://` on blur, giving live green badge visual feedback.

---

## Removed Features (Intentional)

| Feature | Reason Removed |
|---------|---------------|
| Project ID display in UI | User request — internal IDs should not be visible |
| "Quick fill" HOD dropdown | User request — confusing UX |
| "Distinction Only" filter | User request — unclear meaning, not useful |
| External fire video in hero | Replaced with static KITS campus background image |
| Department description sentences on Home | User request — removed for cleaner, more modern department cards |
| Default password hint text on SignIn | User request — moved to inline input placeholder |

---

## Running the Project

```bash
# Install dependencies
npm run install:all

# Start both servers
npm run dev

# Frontend only
npm run dev:frontend

# Backend only
npm run dev:backend

# TypeScript check (no emit)
cd frontend && npx tsc --noEmit
cd backend && npx tsc --noEmit

# Run backend tests
npm test
```

---

## Environment Variables

**`backend/.env`**
```
PORT=3001
FRONTEND_URL=http://localhost:3000
SESSION_SECRET=<min-32-char-secret>
```

**`frontend/.env.local`**
```
VITE_API_URL=http://localhost:3001/api
```

---

## Department IDs (from collegeConfig.ts)

| ID | Code | Department |
|----|------|------------|
| `cse` | CSE | Computer Science & Engineering |
| `ece` | ECE | Electronics & Communication |
| `eee` | EEE | Electrical & Electronics |
| `mech` | MECH | Mechanical Engineering |
| `civil` | CIVIL | Civil Engineering |
| `it` | IT | Information Technology |
| `ds` | DS | Data Science |
