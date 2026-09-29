<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://ai.google.dev/static/site-assets/images/share-ais-513315318.png" />
</div>

# KITS ProjectHub

Official college project repository and showcase for **Kamala Institute of Technology and Science (KITS)**.  
Discover, submit, and manage student engineering capstone projects with direct email-and-password authentication, server-side session management, and SQLite database persistence.

---

## Architecture & Tech Stack

- **Frontend**: React 18, Vite, TypeScript, Tailwind CSS, Lucide Icons
- **Backend**: Node.js, Express, TypeScript, SQLite (`better-sqlite3`), Argon2id password hashing
- **Authentication**: Native Email & Password, HttpOnly Cookie Sessions (`kits_session`), Rate-Limiting, Session Rotation
- **Database**: Local SQLite relational database (`backend/data/kits_projecthub.db`) in Write-Ahead Logging (WAL) mode

---

## Project Structure

```
kits-projecthub/
├── frontend/               # React + Vite client application
│   ├── src/
│   │   ├── components/     # Reusable UI components (Navbar, Footer, ProjectCard…)
│   │   ├── pages/          # Page views (Home, Explore, Submit, SignIn, ProjectDetails, MyGroupProject…)
│   │   ├── context/        # React context (AppContext — auth, projects, state)
│   │   ├── services/       # REST API client (apiClient.ts)
│   │   ├── config/         # College configuration & departments
│   │   ├── utils/          # Client utilities & GitHub URL validation
│   │   ├── types/          # TypeScript type definitions
│   │   └── assets/         # College logo & static assets
│   ├── public/             # Public assets
│   ├── index.html          # HTML entry point
│   ├── vite.config.ts      # Vite dev server + proxy config
│   ├── tsconfig.json       # Frontend TypeScript config
│   └── package.json        # Frontend dependencies
│
├── backend/                # Express API server
│   ├── src/
│   │   ├── server.ts       # Express entry point & middleware setup
│   │   ├── db/             # SQLite schema, migrations & seed data
│   │   ├── middleware/     # Session authentication & rate limiting
│   │   ├── routes/         # API routes (auth, projects, groups, users)
│   │   └── services/       # Business logic (userService, projectSqlService, groupService, githubValidator)
│   ├── tests/              # Auth & security test suites
│   ├── uploads/            # Uploaded documentation PDFs & reports
│   ├── tsconfig.json       # Backend TypeScript config
│   └── package.json        # Backend dependencies
│
├── package.json            # Root workspace scripts
└── README.md
```

---

## Prerequisites

- **Node.js** ≥ 18
- **npm** ≥ 9

---

## Quick Start

### 1. Install all dependencies

```bash
npm run install:all
```

### 2. Configure Environment Variables

```bash
# Frontend
cp frontend/.env.example frontend/.env.local

# Backend
cp backend/.env.example backend/.env
```

#### Backend Configuration (`backend/.env`)

| Variable | Description | Default |
|----------|-------------|---------|
| `PORT` | Backend server port | `3001` |
| `FRONTEND_URL` | Allowed CORS origin | `http://localhost:3000` |
| `APP_URL` | Base application URL | `http://localhost:3001` |
| `SESSION_SECRET` | Secret key for signing session cookies (min 32 chars) | `kits-projecthub-secret-session-key-2026-v2` |

#### Frontend Configuration (`frontend/.env.local`)

| Variable | Description | Default |
|----------|-------------|---------|
| `VITE_API_URL` | Backend API URL | `http://localhost:3001/api` |

### 3. Run Development Servers

```bash
npm run dev
```

- **Frontend**: `http://localhost:3000`
- **Backend API**: `http://localhost:3001`

---

## Authentication & Security Model

### 1. Email & Password Flow
- **Registration ("Create Your Account")**:
  - Fields in strict sequence: (1) Email, (2) Full Name, (3) Branch dropdown, (4) Roll Number, (5) Password (with show/hide control).
  - Validation: Email and Roll Number uniqueness enforced in database transactions.
  - Normalization: Emails trimmed and lowercased; roll numbers trimmed and uppercased without altering meaningful characters.
  - Student registration only: Role assigned as `student`.
- **Login ("Login to Your Account")**:
  - Fields: Email, Password (with show/hide control).
  - Rate limiting: Protects against brute-force attacks on `/api/auth/login` and `/api/auth/register`.
  - Generic error messages: Prevents account enumeration ("Invalid email or password").
- **Password Hashing**:
  - Uses **Argon2id** (`argon2.hash` with memoryCost `65536` KB, timeCost `3`, parallelism `1`).
  - Plaintext passwords are never stored, logged, or returned in responses.
- **Session Management**:
  - Persistent server-side Express sessions stored securely.
  - Cookies configured with `HttpOnly`, `SameSite: 'lax'`, and `Secure` in production.
  - Session rotation upon login to prevent session fixation.
  - `POST /api/auth/logout` invalidates session and destroys cookie.
- **Existing Account Password Setup**:
  - For pre-seeded accounts without a password, `POST /api/auth/setup-password` provides a secure, verified setup mechanism.

---

## Backend REST API Reference

### Authentication Endpoints

| Endpoint | Method | Auth | Description |
|----------|--------|------|-------------|
| `/api/auth/register` | `POST` | Public | Create new student account (Email, Name, Branch, Roll Number, Password) |
| `/api/auth/login` | `POST` | Public | Authenticate student/user and create session |
| `/api/auth/me` | `GET` | Session | Retrieve current authenticated user profile |
| `/api/auth/logout` | `POST` | Session | Terminate session and clear cookie |
| `/api/auth/setup-password` | `POST` | Public | Set password for existing verified accounts |

### Project & Repository Endpoints

| Endpoint | Method | Auth | Description |
|----------|--------|------|-------------|
| `/api/projects` | `GET` | Public | List completed projects with filtering (search, dept, batch, tech, pagination) |
| `/api/projects/:id` | `GET` | Public | Get full project details with confirmed team contributions |
| `/api/projects` | `POST` | Leader/Owner | Publish shared group project (4–6 confirmed students) or individual project with strict GitHub URL validation and optional PowerPoint presentation link/upload |
| `/api/projects/:id` | `PUT` | Leader/Owner | Edit existing project while preserving persistent ID, validating GitHub repo link and presentation URL |
| `/api/projects/:id` | `DELETE`| Leader/Owner/Admin | Cascading delete of project, ratings, and comments |
| `/api/projects/upload-doc`| `POST` | Auth | Upload project documentation (PDF/DOCX) |
| `/api/projects/departments`| `GET` | Public | List configured college branches/departments |
| `/api/projects/technologies`| `GET` | Public | List all technologies used across projects |
| `/api/projects/batches` | `GET` | Public | List available academic batches |
| `/api/projects/by-group/:groupId` | `GET` | Public | Get project associated with an official group |

### Group & Invitation Endpoints

| Endpoint | Method | Auth | Description |
|----------|--------|------|-------------|
| `/api/groups/my-group` | `GET` | Auth | Fetch official group for current student |
| `/api/groups` | `POST` | Auth | Form new official group |
| `/api/groups/:id` | `GET` | Public | View group details and confirmed roster |
| `/api/groups/:id/invite` | `POST` | Leader | Invite registered student by roll number (`pending` status) |
| `/api/groups/:id/accept` | `POST` | Student | Accept pending invitation (`accepted` status) |
| `/api/groups/:id/decline` | `POST` | Student | Decline pending invitation (`rejected` status) |
| `/api/groups/pending-invites` | `GET` | Auth | List all pending invitations for signed-in student |

### Ratings & Comments Endpoints

| Endpoint | Method | Auth | Description |
|----------|--------|------|-------------|
| `/api/projects/:id/ratings` | `GET` | Public | Get project rating aggregate (average, total count) and user's vote |
| `/api/projects/:id/ratings` | `POST` | Auth (Peer) | Submit or update 1–5 star rating (self-rating prohibited) |
| `/api/projects/:id/ratings` | `DELETE`| Auth | Remove user's rating vote |
| `/api/projects/:id/comments` | `GET` | Public | Paginated list of comments (newest first) |
| `/api/projects/:id/comments` | `POST` | Auth | Post a comment (max 1000 characters) |
| `/api/projects/:id/comments/:commentId` | `PUT` | Author Only | Edit author's own comment |
| `/api/projects/:id/comments/:commentId` | `DELETE` | Author Only | Delete author's own comment |

---

## Business Rules & Constraints

1. **Group Size**: Official project groups must contain 4–6 confirmed students before a group project can be submitted.
2. **Single Group**: Each student belongs to at most one official group (`UNIQUE(user_id)`).
3. **Single Project**: Each group has one shared project record that appears across all confirmed members' dashboards.
4. **Leader Permissions**: Only the designated group leader can upload or edit the group project (403 Forbidden for non-leaders).
5. **Universal Browsing**: Anyone can browse, search, and view published projects without login.
6. **Peer Ratings & Comments**: Authenticated students can rate projects (1–5 stars) and participate in discussion; self-rating by project owners or team members is strictly blocked.
7. **Privacy**: Comment threads display student display names only; emails and roll numbers remain private.
8. **Plain Card Customization**: Projects can be presented using custom uploads, image URLs, or clean CSS/SVG Plain Card banners with department accents.
9. **Strict GitHub Repository Validation**: Submissions strictly require a valid repository on `github.com` in `:owner/:repo` format; generic links (e.g. `/explore`, `/pricing`), bare domains, and profile-only URLs are rejected.
10. **PowerPoint Presentation Deliverables**: Group capstone projects can attach PowerPoint presentations via cloud URL (Google Slides, MS PowerPoint, Canva) or direct file upload (.pptx/.ppt/.pdf up to 50MB), surfaced on cards and details pages.

---

## Available Commands

| Command | Description |
|---------|-------------|
| `npm run dev` | Start both frontend & backend development servers |
| `npm run dev:frontend` | Start frontend only (`http://localhost:3000`) |
| `npm run dev:backend` | Start backend only (`http://localhost:3001`) |
| `npm run build` | Build frontend and compile backend TypeScript |
| `npm run lint` | Type-check frontend and backend code |
| `npm test` | Run backend authentication and security test suite |
