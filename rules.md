# Rules & Conventions
## KITS ProjectHub

**Version**: 1.0  
**Last Updated**: September 2026

---

## 1. Business Rules

### Project Submission
- Every project must have a **title**, **summary**, **at least one technology**, and a valid **department**
- Every project must include a valid **GitHub repository URL** hosted on `github.com` with a complete `/:owner/:repo` path; bare `github.com`, profile-only URLs, and generic system paths (e.g. `/explore`, `/pricing`, `/login`) are rejected
- Group capstone submissions can include a **PowerPoint presentation link** (Google Slides, Microsoft PowerPoint 365, Canva) or direct presentation file upload (`.pptx`, `.ppt`, or presentation `.pdf` up to 50MB)
- Project titles must be **unique** across the entire repository
- A student may submit **multiple individual projects**
- A student may belong to **only one group**; a group may have **only one project**
- Group projects require **4 to 6 confirmed members**
- Only the **designated group leader** may submit or edit a group project
- Projects are published **immediately** upon passing all validation checks
- Projects may be deleted by the authoring owner, group leader, or administrator via `DELETE /api/projects/:id` (cascades deletion to ratings, comments, and uploaded files)

### Group Rules
- Group size: **4–6 students** (enforced at API and UI level)
- The student who creates the group is automatically the **leader**
- Each student can be in **only one group** (enforced via DB constraint)
- Groups are tied to a specific **department and academic year**

### Authentication Rules
- Only **students** can self-register; admin/faculty accounts are seeded manually
- Passwords must be at minimum **8 characters**
- Roll numbers must be **unique** per institution
- Emails are stored **lowercase and trimmed**
- Roll numbers are stored **uppercase and trimmed**
- Sessions expire after **24 hours** of inactivity

---

## 2. Code Conventions

### TypeScript
- Use **strict mode** (`"strict": true` in tsconfig)
- All function parameters and return types must be explicitly typed
- Avoid `any` — prefer `unknown` or proper interface types
- Use `interface` for object shapes, `type` for unions/aliases

### React Components
- Use **functional components** only (no class components)
- One component per file; filename matches the exported component name
- Props interfaces named `ComponentNameProps`
- Use `React.FC<Props>` annotation
- Side effects via `useEffect`; derived values via `useMemo`/`useCallback`

### Naming Conventions
| Type | Convention | Example |
|------|------------|---------|
| Files (component) | PascalCase | `ProjectCard.tsx` |
| Files (utility) | camelCase | `apiClient.ts` |
| Variables/functions | camelCase | `handleSearchSubmit` |
| Constants | UPPER_SNAKE_CASE | `ITEMS_PER_PAGE` |
| CSS classes | Tailwind utility classes | `text-xs font-bold` |
| API routes | kebab-case | `/api/projects/by-group/:id` |
| DB columns | snake_case | `owner_user_id`, `submitted_at` |

### File Organization
- Pages → `frontend/src/pages/`
- Reusable components → `frontend/src/components/`
- Global state → `frontend/src/context/AppContext.tsx`
- API calls → `frontend/src/services/apiClient.ts`
- Types → `frontend/src/types/index.ts`
- Backend routes → `backend/src/routes/`
- Business logic → `backend/src/services/`

---

## 3. API Conventions

- All API endpoints prefixed with `/api/`
- HTTP methods follow REST semantics: `GET` (read), `POST` (create), `PUT` (update)
- Responses always return `{ data }` on success or `{ error: string }` on failure
- HTTP status codes: `200` OK, `201` Created, `400` Bad Request, `401` Unauthorized, `403` Forbidden, `404` Not Found, `409` Conflict, `500` Server Error
- Rate-limited endpoints return `429 Too Many Requests`
- All error messages are **generic** on auth endpoints to prevent enumeration

---

## 4. Git Conventions

- Branch naming: `feature/`, `fix/`, `chore/`, `docs/`
- Commit messages: imperative present tense ("Add search filter", not "Added" or "Adding")
- No committing: `.env`, `*.db`, `node_modules/`, `dist/`, `uploads/`

---

## 5. Security Rules

- **Never** store or log plaintext passwords
- **Never** return `passwordHash` in any API response
- **Always** use parameterized queries — no string interpolation in SQL
- **Always** validate and sanitize user input server-side
- Session cookies must be `HttpOnly` and `SameSite: lax`
- Use `session.regenerate()` on every successful login
- Rate-limit all auth endpoints

---

## 6. Design & UI Rules

- Color palette: `#19232B` (dark), `#CA0765` (crimson/brand), `#0070C2` (blue), `#03A9F5` (cyan)
- Font: System font stack via Tailwind; headings use `font-heading`
- All interactive elements must have `focus-visible` outlines for accessibility
- No inline styles — use Tailwind utility classes only
- Mobile-first responsive design (filters collapse to drawer on mobile)
- Consistent border radius: `rounded-[4px]` for cards/inputs, `rounded-lg` for filter controls
