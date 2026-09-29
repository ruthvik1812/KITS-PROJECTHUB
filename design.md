# Design Document
## KITS ProjectHub

**Version**: 1.0  
**Last Updated**: September 2026

---

## 1. Design Philosophy

KITS ProjectHub uses a **premium institutional design language** — clean, professional, and authoritative — reflecting the academic prestige of Kamala Institute of Technology and Science. The UI prioritizes clarity, information density without clutter, and subtle visual interest through color accents and micro-interactions.

---

## 2. Color Palette

| Token | Hex | Usage |
|-------|-----|-------|
| `brand-dark` | `#19232B` | Primary background, navbar, footers, hero sections |
| `brand-crimson` | `#CA0765` | Primary action color, highlights, active states |
| `brand-blue` | `#0070C2` | Secondary action, links, info accents |
| `brand-cyan` | `#03A9F5` | Decorative corner accents, supplementary highlights |
| `text-body` | `#19232B` | Body text |
| `text-muted` | `#757F95` | Secondary text, labels, placeholders |
| `text-light` | `#9FA6B3` | Filter labels, captions |
| `border` | `#D5D5D5` | Card borders, dividers |
| `border-light` | `#E2E6ED` | Filter input borders |
| `bg-surface` | `#FAFBFC` | Page background |
| `bg-card` | `#FFFFFF` | Card/panel background |
| `bg-muted` | `#F6F6F7` | Subtle fills, disabled states |

---

## 3. Typography

| Element | Class | Size | Weight |
|---------|-------|------|--------|
| Banner Title | `text-banner-title` | ~45px | 700 |
| Page Heading | `font-heading font-bold text-2xl–4xl` | 24–36px | 700 |
| Card Title | `font-heading font-bold text-base` | 16px | 700 |
| Section Label | `text-[10px] uppercase tracking-widest` | 10px | 600 |
| Body Text | `text-sm` | 14px | 400 |
| Small / Caption | `text-xs` | 12px | 400–600 |
| Micro | `text-[11px]` | 11px | 400–600 |

---

## 4. Spacing & Layout

- **Container**: `.kits-container` — `max-width: 1200px`, centered, horizontal padding
- **Grid**: 12-column CSS grid for explore page (`lg:grid-cols-12`)
  - Filter sidebar: `col-span-3`
  - Main catalogue: `col-span-9`
- **Card grid**: `grid-cols-1 md:grid-cols-2 lg:grid-cols-3`, `gap-6`
- **Section spacing**: `space-y-16` between major home page sections
- **Card padding**: default card = `p-5` (via `.kits-card`)
- **Filter sidebar padding**: `!p-5`

---

## 5. Component Patterns

### Card (`.kits-card`)
```
white background
border: 1px solid #D5D5D5
border-radius: 4px
box-shadow: subtle
position: relative
overflow: hidden
```
- **Corner accents**: Cyan `3px` L-shaped lines at top-left and bottom-right corners (`.kits-cyan-corner-tl`, `.kits-cyan-corner-br`)
- **Rating indicator**: Embedded in card footer; displays gold star with score and review count (e.g. `★ 4.8 (6)`), or "No ratings yet" when unrated.
- **Deliverable quick links**: Compact footer buttons for Live Demo, GitHub repository, and an amber `PPT` badge linking directly to the PowerPoint presentation or slides.
- **Card Presentation Modes**:
  - *Upload Photo*: Custom user-uploaded graphic file.
  - *Image URL*: External hosted image URL.
  - *Plain Card*: Elegant text-and-gradient banner featuring department badge, subject icon, and high-contrast typography without requiring image assets.

### Buttons

| Variant | Style |
|---------|-------|
| Primary (crimson) | `bg-[#CA0765] hover:bg-[#A10550] text-white` |
| Secondary (blue) | `bg-[#0070C2] hover:bg-[#005696] text-white` |
| Ghost (white) | `bg-white border-2 border-white text-dark` |
| Disabled | `bg-slate-200 text-slate-400 cursor-not-allowed` |

All buttons: `rounded-[4px]`, `text-xs font-bold uppercase tracking-wider`, `px-5 py-2.5`

### Filter Inputs & Selects
- Border: `1px solid #E2E6ED`, `rounded-lg`
- Padding: `px-3 py-2`
- Font: `text-xs text-[#19232B]`
- Focus ring: `focus:border-[#CA0765] focus:ring-1 focus:ring-[#CA0765]/20`

### Section Labels (Filter Sidebar)
- `text-[10px] font-semibold text-[#9FA6B3] uppercase tracking-widest`

---

## 6. Page Layouts

### Home Page
1. **Hero Section** — full-width dark banner with campus background image, gradient overlay, headline, tagline, search bar (auto-disabled when query is empty), CTA buttons
2. **Metric Cards** — 4 dynamic stat cards (approved projects, confirmed students, departments, live demos) computed live from database
3. **Department Browser** — streamlined cards with department code, full name, and icon (clean card aesthetic without long text descriptions)
4. **Recent Projects** — 3-column card grid of latest approved projects with live star ratings

### Explore Projects Page
1. **Banner** — dark header with page title and Submit CTA
2. **Layout** — 3/12 filter sidebar + 9/12 catalogue
3. **Toolbar** — result count + sort selector
4. **Card Grid** — 3 columns (desktop), 2 (tablet), 1 (mobile) with star rating summaries
5. **Pagination** — prev/next + numbered page buttons

### Project Details Page
1. **Hero** — full-bleed dark banner with project thumbnail, title, batch badge
2. **Body** — two-column: main content (summary, team, tech stack) + sidebar (links, metadata)
   - Deliverables & Links: Direct action buttons for Live Demo, GitHub Repository, Documentation Report, and PowerPoint Presentation (web slides or direct .pptx/.pdf download).
3. **Ratings & Comments Section** — positioned below project information and team details:
   - Responsive Bootstrap-styled cards with navy headings (`#19232B`).
   - Interactive 1–5 star rating widget: shows average rating, total raters, user's current vote, and Submit / Update / Remove actions.
   - Self-rating prevention banner for project owners and confirmed team members.
   - Discussion Comments feed: 1000-character input with character counter, author-only Edit/Delete controls, and paginated comment stream.

### Submit Project Page
1. **Banner** — dark header
2. **Form sections**: Type selector → Basic Info → Card Presentation (Upload Photo / Image URL / Plain Card) → Technologies → Links & Deliverables → Team Members (4–6 confirmed students) → Faculty Mentor
   - **GitHub Repo Validation**: Real-time validation badge (`✓ Valid Repo`), auto-prepends `https://` on blur, and displays inline guidance for format errors or generic links.
   - **PowerPoint Presentation Deliverable**: Dedicated panel with Web Presentation URL (Google Slides, MS PowerPoint, Canva) and Direct File Upload (.pptx/.ppt/.pdf up to 50MB) options, badged with `★ Group Project`.
3. **Live Card Preview** — interactive real-time preview of the card as it will appear in the catalogue, with toggleable "Full Card" and "Banner Only" views
4. **Actions** — Cancel + Publish buttons (leader-only authorization)

### My Projects Page
1. **Header** — status summary and active group membership details
2. **Group Project Card** — displays official shared project for all confirmed members, with status badges, submission date, uploader, leader, View Project action, and leader-only Edit action
3. **Individual Projects** — student's own individual submissions with edit and delete capabilities

---

## 7. Responsive Breakpoints

| Breakpoint | Width | Changes |
|------------|-------|---------|
| `sm` | 640px | Two-column hero actions, wider text |
| `md` | 768px | 2-column project grid |
| `lg` | 1024px | 3-column grid, filter sidebar visible, navbar full links |

Mobile (< lg): Filter sidebar hidden → replaced by slide-out drawer triggered by "Filters" button.

---

## 8. Micro-interactions & Animations

- **Hero image**: `transform scale-[1.02]` with `transition-transform duration-1000` subtle zoom
- **Button hover**: background color transition `transition-colors`
- **Filter inputs**: border color + ring on focus
- **Cards**: `hover:shadow-md` lift effect
- **Toast notification**: `animate-in fade-in slide-in-from-bottom-5`
- **Pulse skeletons**: `animate-pulse` loading placeholders

---

## 9. Accessibility

- All inputs have `aria-label` attributes
- Buttons have descriptive text or `aria-label`
- Mobile filter drawer uses `role="dialog"` and `aria-modal="true"`
- Toast uses `role="status"` and `aria-live="polite"`
- Interactive elements have `focus-visible:ring-2` outlines
