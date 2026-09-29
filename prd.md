# Product Requirements Document (PRD)
## KITS ProjectHub

**Version**: 1.0  
**Institution**: Kamala Institute of Technology and Science (KITS)  
**Last Updated**: September 2026

---

## 1. Product Overview

KITS ProjectHub is the **official engineering project repository and showcase portal** for Kamala Institute of Technology and Science. It enables students to submit, manage, and publicly showcase their capstone and research projects, while allowing anyone to browse the full catalogue.

---

## 2. Goals & Objectives

| Goal | Description |
|------|-------------|
| **Visibility** | Give every approved student project a permanent public web presence |
| **Discoverability** | Allow filtering by department, batch, technology, and keyword |
| **Submission** | Provide an authenticated, validated project submission workflow |
| **Integrity** | Prevent duplicate submissions and enforce institutional business rules |
| **Security** | Protect student credentials with industry-standard hashing and session management |

---

## 3. Users & Roles

| Role | Description | Capabilities |
|------|-------------|--------------|
| **Visitor** | Unauthenticated guest | Browse, search, view project details and ratings/comments |
| **Student** | Registered & signed-in student | All visitor rights + submit individual projects, accept group invites, rate/comment on peer projects |
| **Group Leader** | Student designated as group leader | All student rights + invite members, submit/edit shared group project |
| **Admin** | Administrator account | All rights + delete any project, manage users and roles |

---

## 4. Core Features

### 4.1 Public Catalogue (No Login Required)
- Browse all approved projects with card-based layout
- Filter by: Department, Graduation Year, Technology, Ownership type, Classification
- Keyword search across title, summary, technology, author names, and mentor
- Sort by: Newest, Oldest, Popular, Title A–Z
- Paginated results (6 cards per page) with average star rating display

### 4.2 Project Details Page
- Full project metadata: title, summary, team, mentor, technologies
- Links to: GitHub repository, live demo, documentation PDF, PowerPoint presentation, demo video
- Academic year, department, and submission type displayed
- Integrated Ratings and Comments discussion section

### 4.3 Authentication
- Email + Password registration (students only)
- Argon2id password hashing (no plaintext ever stored)
- HttpOnly cookie sessions with session rotation on login
- Rate-limited login and registration endpoints
- Generic error messages to prevent enumeration

### 4.4 Project Submission
- **Individual projects**: single student owner
- **Group projects**: 4–6 confirmed students with a designated leader (members invited by roll number must accept before submission is unlocked)
- Fields: title, summary, technologies, department, batch, links (GitHub, demo, video, docs, PowerPoint presentation), faculty mentor (group only)
- **Strict GitHub Repository Validation**: Enforces mandatory repository links on `github.com` with `:owner/:repo` format; rejects generic pages (e.g. `/explore`, `/pricing`), bare domains, and profile-only URLs; includes live UI validation badge and automatic URL canonicalization
- **PowerPoint Presentation Support**: Allows cloud slides URL (Google Slides, MS PowerPoint, Canva) or direct presentation file upload (.pptx/.ppt/.pdf up to 50MB) for group capstone project presentations
- **Card presentation modes**: Custom image upload, Image URL, or Plain Card
- **Real-time live card preview**: interactive switch between Full Card and Banner Only views
- Duplicate URL and title detection

### 4.5 My Projects Dashboard
- View all projects owned by or associated with the authenticated student
- Shared group projects appear automatically in all confirmed members' dashboards
- Edit permissions strictly restricted to group leaders (group projects) or individual owners
- Delete project action with cascading removal of comments and ratings

### 4.6 Explore Page Filters
- Keyword search
- Department dropdown (8 departments)
- Graduation year dropdown
- Technology stack dropdown
- Project ownership (Individual / Group)
- Classification type

### 4.7 Ratings & Comments
- 1 to 5 star rating widget with aggregate calculation (average rounded to 1 decimal place, total rating count)
- Single active rating per user (re-voting updates existing rating; remove vote supported)
- Self-rating guard prevents individual owners and group team members from rating their own project
- Peer discussion comments with 1000-character max, author-only edit and delete controls, and paginated feed
- Privacy protection: author full name displayed, sensitive emails and roll numbers never exposed

---

## 5. Out of Scope (v1.0)

- Faculty multi-tier grading/approval workflow
- Automated email verification flow via external SMTP
- File storage beyond local uploads directory / local SQLite persistence
- Mobile native app (iOS/Android)
- Payment/monetization features

---

## 6. Success Metrics

| Metric | Target |
|--------|--------|
| Projects in catalogue | ≥ 50 at launch |
| Departments represented | All 8 KITS departments |
| Page load time (home) | < 2 seconds |
| Authentication security | Argon2id, rate-limited, HttpOnly sessions |
| Filter accuracy | 100% correct results across all filter combinations |

---

## 7. Constraints

- Must run locally without external cloud dependencies
- Database must be SQLite (no Postgres/MySQL)
- Frontend must be React + Vite + TypeScript
- Backend must be Node.js + Express + TypeScript
- No third-party auth providers (Firebase, Auth0, etc.)
