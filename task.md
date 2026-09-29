# Task Tracker
## KITS ProjectHub

**Last Updated**: September 2026

---

## Status Legend
- ✅ Done
- 🔄 In Progress
- ⏳ Pending
- ❌ Blocked

---

## Phase 1 — Core Foundation

| # | Task | Status | Notes |
|---|------|--------|-------|
| 1.1 | Initialize monorepo with frontend (Vite + React + TS) and backend (Express + TS) | ✅ Done | |
| 1.2 | Set up SQLite database with WAL mode, schema, and migrations | ✅ Done | `backend/src/db/` |
| 1.3 | Implement Argon2id password hashing | ✅ Done | `userService.ts` |
| 1.4 | Build email + password authentication (register, login, logout, me) | ✅ Done | |
| 1.5 | Implement HttpOnly session cookies with session rotation | ✅ Done | |
| 1.6 | Add rate limiting on auth endpoints | ✅ Done | |
| 1.7 | Build `AppContext` for global frontend state | ✅ Done | |
| 1.8 | Build `apiClient.ts` fetch wrapper | ✅ Done | |

---

## Phase 2 — Project Features

| # | Task | Status | Notes |
|---|------|--------|-------|
| 2.1 | Home page with hero section, metrics, department browser | ✅ Done | |
| 2.2 | Explore Projects page with filter sidebar + card grid | ✅ Done | |
| 2.3 | Project Details page | ✅ Done | |
| 2.4 | Submit Project form (individual + group modes) | ✅ Done | |
| 2.5 | My Projects dashboard | ✅ Done | |
| 2.6 | Pagination (6 per page) on Explore page | ✅ Done | |
| 2.7 | Keyword search across title, summary, tech, authors, mentor | ✅ Done | |
| 2.8 | Filter by department, year, technology, ownership, classification | ✅ Done | |
| 2.9 | Sort by newest, oldest, popular, title | ✅ Done | |
| 2.10 | Image upload (file) + Image URL mode for project thumbnail | ✅ Done | |
| 2.11 | Group formation (4–6 students, leader designation) | ✅ Done | |

---

## Phase 3 — UI Polish

| # | Task | Status | Notes |
|---|------|--------|-------|
| 3.1 | Replace SVG logo with KITS emblem PNG | ✅ Done | `/public/kits-logo.png` |
| 3.2 | Add campus background hero image (no text overlay) | ✅ Done | `/public/kits-hero-bg.jpg` |
| 3.3 | Restyle filter sidebar to match reference design | ✅ Done | Light-gray labels, rounded-lg inputs |
| 3.4 | Reduce filter sidebar to compact size | ✅ Done | `!p-5`, `space-y-5` |
| 3.5 | Remove project ID display from all frontend pages | ✅ Done | ProjectDetails, MyGroupProject, SubmitProject |
| 3.6 | Remove "Quick fill" dropdown from faculty mentor section | ✅ Done | |
| 3.7 | Remove "Distinction Only" filter | ✅ Done | |
| 3.8 | Fix TypeScript errors across frontend | ✅ Done | 0 errors `npx tsc --noEmit` |
| 3.9 | Mobile filter drawer | ✅ Done | |

---

## Phase 4 — Pending / Future

| # | Task | Status | Notes |
|---|------|--------|-------|
| 4.1 | Fix hero search button navigation on home page | ✅ Done | Synced with hash routing & disabled when query empty |
| 4.2 | Add email verification on registration | ⏳ Pending | Requires SMTP config |
| 4.3 | Admin dashboard for project management | ⏳ Pending | |
| 4.4 | Project view/like counter persistence | ⏳ Pending | Currently in-memory |
| 4.5 | Production deployment setup (Nginx, process manager) | ⏳ Pending | |
| 4.6 | Backend test coverage expansion | ✅ Done | Auth, security & group flow tests |
| 4.7 | Image CDN / cloud storage for uploads | ⏳ Pending | Currently local `uploads/` |

---

## Phase 5 — Recent Enhancements (Completed)

| # | Task | Status | Notes |
|---|------|--------|-------|
| 5.1 | Star Ratings & Comments System | ✅ Done | 1–5 stars, self-rating guard, comment CRUD, pagination |
| 5.2 | Shared Group-Project Visibility & Account Linking | ✅ Done | 4–6 confirmed students, invitation workflow, leader-only upload/edit |
| 5.3 | Accurate Live Project Counters on Home | ✅ Done | Dynamic database calculation across approved projects, students, depts |
| 5.4 | Plain Card Presentation Mode & Live Preview | ✅ Done | Plain card styling option, real-time Full Card vs Banner Only preview |
| 5.5 | Project Deletion Endpoint (`DELETE /api/projects/:id`) | ✅ Done | Cascading deletion for ratings and comments |
| 5.6 | Streamline Department Cards on Home | ✅ Done | Removed description sentences for a cleaner, modern look |
| 5.7 | Clean Test/Placeholder Database Purge | ✅ Done | Zero test rows remaining; clean state for authentic college projects |

---

## Phase 6 — Deliverables & Submission Integrity (Completed)

| # | Task | Status | Notes |
|---|------|--------|-------|
| 6.1 | PowerPoint Presentation Support | ✅ Done | `presentation_url` in SQLite, SubmitProject Web URL + file upload (.pptx/.ppt/.pdf), ProjectDetails action, ProjectCard badge, MyGroupProject status row |
| 6.2 | Strict GitHub Repository URL Validation | ✅ Done | Client & server validation (`githubValidator.ts`), enforces github.com + owner/repo path, auto-formats `https://` on blur, rejects generic & profile URLs |

---

## Known Issues

| ID | Description | Severity | Status |
|----|-------------|----------|--------|
| BUG-01 | Hero search button — empty query should remain disabled, typing enables it | Medium | ✅ Resolved |
| BUG-02 | `[SQL API] GET /auth/me failed: Not authenticated` console warnings on load | Low | ✅ Resolved (suppressed in `apiClient.ts` for clean console) |

