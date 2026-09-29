# Architecture Document
## KITS ProjectHub

**Version**: 1.0  
**Last Updated**: September 2026

---

## 1. System Overview

KITS ProjectHub follows a **monorepo, full-stack architecture** with a clear separation between the React frontend client and the Express REST API backend. Both communicate over HTTP/JSON through a Vite dev proxy in development, and direct CORS-enabled requests in production.

```
┌─────────────────────────────────────────────────────────┐
│                     Browser Client                       │
│          React 18 + Vite + TypeScript + Tailwind         │
│                  http://localhost:3000                   │
└───────────────────────┬─────────────────────────────────┘
                        │ HTTP/JSON (REST API)
                        │ Vite proxy → /api/*
                        ▼
┌─────────────────────────────────────────────────────────┐
│                   Express REST API                       │
│           Node.js + TypeScript + better-sqlite3          │
│                  http://localhost:3001                   │
└───────────────────────┬─────────────────────────────────┘
                        │ SQL (WAL mode)
                        ▼
┌─────────────────────────────────────────────────────────┐
│               SQLite Database (local file)               │
│           backend/data/kits_projecthub.db                │
└─────────────────────────────────────────────────────────┘
```

---

## 2. Frontend Architecture

### Stack
| Layer | Technology |
|-------|------------|
| Framework | React 18 |
| Build Tool | Vite 5 |
| Language | TypeScript |
| Styling | Tailwind CSS v4 |
| Icons | Lucide React |
| HTTP Client | Native `fetch` via `apiClient.ts` |

### Directory Structure
```
frontend/src/
├── App.tsx               # Root shell: routing state, page rendering, toast
├── main.tsx              # React entry point
├── index.css             # Global design tokens & utilities
├── pages/
│   ├── Home.tsx          # Hero section, metrics, department links
│   ├── ExploreProjects.tsx  # Catalogue with filters, pagination
│   ├── ProjectDetails.tsx   # Full project detail view
│   ├── SubmitProject.tsx    # Multi-section project submission form
│   ├── MyGroupProject.tsx   # Student's own projects dashboard
│   └── SignIn.tsx           # Login + Registration tabs
├── components/
│   ├── Navbar.tsx        # Top navigation + role switcher
│   ├── Footer.tsx        # Institutional footer
│   ├── ProjectCard.tsx   # Catalogue card component
│   ├── KitsLogo.tsx      # SVG logo component
│   ├── GuidelinesModal.tsx
│   ├── HelpModal.tsx
│   └── BackendReportModal.tsx
├── context/
│   └── AppContext.tsx    # Global state: auth, projects, CRUD operations
├── services/
│   └── apiClient.ts      # Typed REST API client (fetch wrapper)
├── config/
│   └── collegeConfig.ts  # Departments, technologies, years, types
├── utils/
│   └── githubValidator.ts # GitHub repository link validator & normalizer
└── types/
    └── index.ts          # Project, User, Group TypeScript types
```

### State Management
- **Single React Context** (`AppContext`) holds all global state
- No Redux or Zustand — context is sufficient for this scope
- `useApp()` hook exposes projects, CRUD, and auth state
- `useAuth()` hook exposes `currentUser`, `isAuthenticated`, `signIn`, `signOut`

### Routing
- **Hash-based SPA routing** via `activePage` state in `App.tsx`
- Navigation triggered by `onNavigate(page, filterParam?)` callbacks
- No React Router — simple `if activePage === 'x'` conditional rendering

---

## 3. Backend Architecture

### Stack
| Layer | Technology |
|-------|------------|
| Runtime | Node.js ≥ 18 |
| Framework | Express 5 |
| Language | TypeScript |
| Database | SQLite via `better-sqlite3` |
| Password Hashing | Argon2id (`argon2` package) |
| Sessions | `express-session` (server-side, HttpOnly cookies) |
| Rate Limiting | `express-rate-limit` |

### Directory Structure
```
backend/src/
├── server.ts             # Express setup, middleware, route mounting
├── db/
│   ├── schema.sql        # Relational table DDL (SQLite)
│   ├── database.ts       # better-sqlite3 instance, migrations, ratings/comments tables
│   └── seed.ts           # Department and college reference data
├── middleware/
│   ├── authenticate.ts   # Session authentication guard
│   ├── requireAuth.ts    # Role/session check helper
│   └── authorize.ts      # Role-based authorization
├── routes/
│   ├── auth.ts           # /api/auth/* endpoints (register, login, me, logout, setup-password)
│   ├── projects.ts       # /api/projects/* endpoints (CRUD, delete, upload-doc, filters)
│   ├── groups.ts         # /api/groups/* endpoints (formation, invite, accept, decline, pending)
│   ├── ratings.ts        # /api/projects/:projectId/ratings (1-5 star ratings, self-rating check)
│   ├── comments.ts       # /api/projects/:projectId/comments (comments CRUD, pagination)
│   └── general.ts        # Health check, static info
└── services/
    ├── userService.ts        # User CRUD, Argon2id verification
    ├── projectSqlService.ts  # Project DB operations, filters, multi-member profile joins
    ├── groupSqlService.ts    # Group formation, roll-number lookup, invitation state machine
    └── githubValidator.ts    # GitHub repository validation & canonicalization rules
```

### Database Schema (Key Relational Tables)
```sql
-- Academic Departments
departments (id PK, code UNIQUE, name, short_name, description, hod_name, hod_email, labs_count)

-- User Accounts (Argon2id password hashes, college roll numbers)
users (id PK, email UNIQUE, password_hash, full_name, role, department_id FK,
       student_roll_number UNIQUE, is_verified, photo_url, created_at, updated_at)

-- Official Student Groups (1 group per student, 4-6 members)
official_groups (id PK, name, leader_id FK, department_id FK, academic_year, status, created_at, updated_at)

-- Group Memberships (Invitation states: 'pending', 'accepted', 'rejected')
official_group_members (id PK, group_id FK, user_id UNIQUE FK, student_roll_number,
                        invite_status CHECK(invite_status IN ('pending', 'accepted', 'rejected')), joined_at, created_at)

-- Projects (Shared capstone records attached to group or individual owner)
projects (id PK, submission_type CHECK('individual', 'group'), owner_user_id FK,
          official_group_id FK, title, summary, problem_statement, subject, project_type,
          difficulty, duration, live_demo_url, repo_url, presentation_url, documentation_url, video_url,
          screenshots, faculty_mentor_name, faculty_mentor_role, hardware_evidence,
          outcomes, prerequisites, tools, original_authors, department_id FK, academic_year,
          licence, content_owner, status, version, views_count, likes_count, created_at, updated_at)

-- Star Ratings (1-5 stars, single active rating per user per project)
project_ratings (id PK, project_id FK, user_id FK, score CHECK(score >= 1 AND score <= 5),
                 created_at, updated_at, UNIQUE(project_id, user_id))

-- Discussion Comments (1000 char max, author edit/delete tracking)
project_comments (id PK, project_id FK, user_id FK, text, is_edited, created_at, updated_at)
```

---

## 4. Authentication Flow

```
Client                    Server
  │                          │
  │── POST /api/auth/login ──▶│
  │   { email, password }    │  1. Lookup user by email
  │                          │  2. argon2.verify(hash, password)
  │                          │  3. session.regenerate()  ← rotation
  │                          │  4. session.userId = user.id
  │◀── 200 { user } ─────────│  5. Set-Cookie: kits_session (HttpOnly)
  │
  │── GET /api/auth/me ──────▶│
  │   Cookie: kits_session    │  1. req.session.userId lookup
  │◀── 200 { user } ─────────│
  │
  │── POST /api/auth/logout ─▶│
  │                           │  1. session.destroy()
  │◀── 200 OK ───────────────│  2. Clear cookie
```

---

## 5. Data Flow & Subsystems

### 5.1 Project Submission & Permissions
```
SubmitProject.tsx
  │
  ├─ Card Presentation: File Upload / Image URL / Plain Card
  ├─ Presentation Deliverable: Google Slides / PowerPoint URL or .pptx/.pdf upload
  ├─ GitHub URL Validation: Client-side validateGitHubRepoUrl (format, owner/repo, auto-canonicalize)
  ├─ Verify Group Roster: 4–6 confirmed students required
  ├─ Check Role: Leader authorization verified
  ▼
apiClient.ts → POST /api/projects
  │
  ▼
projects.ts (Express Route)
  ├─ Backend GitHub URL Validation: Enforce github.com host & owner/repo path
  ├─ Canonicalize repo URL & reject reserved/generic paths
  ▼
projectSqlService.ts
  ├─ Verify no duplicate title or repository URL
  ├─ Store presentation_url (.pptx file path or cloud slides URL)
  ├─ Enforce leader-only permissions (non-leaders get 403 Forbidden)
  ├─ Insert into projects table (WAL mode)
  └─ Link official_group_id and owner_user_id
  │
  ▼
AppContext.tsx → refreshProjects()
  │
  ▼
ExploreProjects.tsx & MyGroupProject.tsx re-render with new project
```

### 5.2 Shared Group-Project Visibility Flow
```
Group Formation & Invitation:
  Leader POST /api/groups/invite { studentRollNumber }
    → official_group_members created with invite_status = 'pending'
  Invited Student POST /api/groups/:id/accept
    → invite_status transitions to 'accepted'
    → Member is now confirmed in the official group

Submission Gate:
  POST /api/projects requires count(accepted_members) between 4 and 6.

Shared Profile Visibility:
  GET /api/projects/my-projects joins official_group_members WHERE user_id = :currentUserId AND invite_status = 'accepted'
  → The single official project automatically appears in ALL confirmed members' dashboards.
```

### 5.3 Star Ratings & Discussion Architecture
```
Ratings:
  - Range: 1 to 5 integer stars.
  - Stored in project_ratings with UNIQUE(project_id, user_id).
  - Submit replaces previous rating (no double voting).
  - Self-rating prevention: Owner of individual project and all confirmed group members cannot rate their own project (403 Forbidden).
  - Aggregates (average rating rounded to 1 decimal place, total count) dynamically recalculated on GET /api/projects/:id/ratings.

Comments:
  - Stored in project_comments with project_id and user_id foreign keys.
  - Privacy: API returns user's full_name only; email and roll numbers are omitted.
  - Ownership: Authors can edit (sets is_edited = 1) and delete their own comments; non-authors get 403 Forbidden.
  - Paginated retrieval (10 per page, newest first).
```

### 5.4 Project Deletion Architecture
```
DELETE /api/projects/:id
  - Checks caller is the project owner (or group leader) or admin.
  - Cascades deletion to project_ratings and project_comments via ON DELETE CASCADE foreign keys.
  - Removes associated uploaded documentation files from disk.
```

---

## 6. Security Considerations

| Concern | Mitigation |
|---------|------------|
| Password storage | Argon2id (memory: 64MB, time: 3, parallelism: 1) |
| Brute force | Rate limiting on `/api/auth/login` and `/api/auth/register` |
| Session fixation | `session.regenerate()` on every login |
| XSS | HttpOnly cookie (JS cannot access session token) |
| CSRF | SameSite: lax cookie policy |
| Enumeration | Generic "Invalid email or password" messages |
| SQL injection | Parameterized queries via `better-sqlite3` |

---

## 7. Deployment Notes

- Development: `npm run dev` (concurrently runs both servers)
- Frontend builds to `frontend/dist/` via `npm run build`
- Backend compiles to `backend/dist/` via `tsc`
- SQLite DB persists at `backend/data/kits_projecthub.db`
- Uploaded files persist at `backend/uploads/`
