<p align="center">
  <img src="https://api.dicebear.com/9.x/icons/svg?icon=briefcase&backgroundColor=0369a1&radius=20" width="80" alt="TeamUnited Logo" />
</p>

<h1 align="center">United Alliances Sales CRM</h1>

<p align="center">
  <strong>A full-stack, real-time CRM for insurance sales operations — lead tracking, pipeline management, call logging, and team analytics.</strong>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/Next.js-16-black?logo=next.js" alt="Next.js" />
  <img src="https://img.shields.io/badge/React-19-61DAFB?logo=react" alt="React" />
  <img src="https://img.shields.io/badge/Express-5-000000?logo=express" alt="Express" />
  <img src="https://img.shields.io/badge/MongoDB-8-47A248?logo=mongodb" alt="MongoDB" />
  <img src="https://img.shields.io/badge/Socket.IO-4-010101?logo=socket.io" alt="Socket.IO" />
  <img src="https://img.shields.io/badge/TypeScript-5.8-3178C6?logo=typescript" alt="TypeScript" />
  <img src="https://img.shields.io/badge/Docker-Ready-2496ED?logo=docker" alt="Docker" />
  <img src="https://img.shields.io/badge/Deploy-Railway-0B0D0E?logo=railway" alt="Railway" />
</p>

---

## Table of Contents

- [Overview](#overview)
- [Tech Stack](#tech-stack)
- [Features](#features)
  - [Lead Management](#lead-management)
  - [Pipeline & Kanban Board](#pipeline--kanban-board)
  - [Call Logging & Recording](#call-logging--recording)
  - [Meeting Management](#meeting-management)
  - [Task & Follow-Up Tracking](#task--follow-up-tracking)
  - [CSV Import with Smart Mapping](#csv-import-with-smart-mapping)
  - [Real-Time Notifications](#real-time-notifications)
  - [Email Outreach & LinkedIn Tracking](#email-outreach--linkedin-tracking)
  - [Team & Agent Management](#team--agent-management)
  - [HR Performance Analytics](#hr-performance-analytics)
  - [Admin Impersonation](#admin-impersonation)
  - [Audit Logging](#audit-logging)
  - [Dark / Light Theme](#dark--light-theme)
- [Role-Based Access Control (RBAC)](#role-based-access-control-rbac)
- [Architecture](#architecture)
- [Project Structure](#project-structure)
- [Getting Started](#getting-started)
  - [Prerequisites](#prerequisites)
  - [Installation](#installation)
  - [Environment Variables](#environment-variables)
  - [Seed the Database](#seed-the-database)
  - [Run in Development](#run-in-development)
  - [Build for Production](#build-for-production)
- [Docker & Railway Deployment](#docker--railway-deployment)
- [API Reference](#api-reference)
  - [Authentication](#authentication)
  - [Leads](#leads)
  - [Pipeline](#pipeline)
  - [Calls](#calls)
  - [Meetings](#meetings)
  - [Tasks](#tasks)
  - [Activities](#activities)
  - [Agents / Users](#agents--users)
  - [HR](#hr)
  - [Notifications](#notifications)
  - [Outreach](#outreach)
  - [Health](#health)
- [Database Models](#database-models)
- [Real-Time Events (Socket.IO)](#real-time-events-socketio)
- [Security](#security)
- [Scripts](#scripts)
- [Testing](#testing)
- [License](#license)

---

## Overview

**TeamUnited Sales CRM** is an internal platform built for United Alliances Services to manage end-to-end insurance sales workflows. It provides role-specific dashboards for Admins, SDRs, Lead Gen specialists, and HR — each with tailored views, permissions, and analytics.

The application runs as a **unified server** where Express handles the API and Socket.IO events while Next.js handles SSR and the frontend, all inside a single process deployed via Docker on Railway.

---

## Tech Stack

| Layer | Technologies |
|-------|-------------|
| **Frontend** | Next.js 16 (App Router), React 19, TanStack React Query, Tailwind CSS, shadcn/ui (Radix UI), Recharts, Framer Motion, dnd-kit |
| **Backend** | Express 5, Mongoose 9, Socket.IO 4, Zod validation |
| **Auth** | JWT (httpOnly cookies), refresh token rotation, bcrypt, RBAC |
| **Database** | MongoDB (Railway or Atlas) |
| **Email** | Resend API |
| **Deployment** | Docker multi-stage build, Railway |
| **Testing** | Vitest, Testing Library, jsdom |
| **Linting** | ESLint 9, TypeScript-ESLint |

---

## Features

### Lead Management
- Create, view, edit, and soft-delete leads with full lifecycle tracking
- Assign leads to SDRs/Closers — individually, in bulk, or via **round-robin** across teams
- Filter and sort by status, pipeline stage, source, priority, agent, date range, and more
- Track deal value, expected close date, priority (A/B/C), segment, and custom fields
- Support for employee sub-records with multiple phone numbers per lead
- **KPI dashboard** — total leads, new this period, active, won, lost, follow-ups due

### Pipeline & Kanban Board
- Visual **drag-and-drop Kanban board** powered by dnd-kit
- 7 default stages: **New → Contacted → Qualified → Proposal → Negotiation → Won → Lost**
- Each column displays lead count and total deal value
- **Stage move validation** — "Won" requires a deal value; "Lost" requires a reason
- Auto-syncs lead status with pipeline stage transitions
- Admin-configurable stages: create, reorder, edit, and deactivate
- **Funnel analytics** — conversion rates, total revenue, average days in "New," per-agent breakdowns

### Call Logging & Recording
- Log calls with duration, outcome (connected / voicemail / no answer / busy / wrong number / callback scheduled), and notes
- **Auto-flag for recording review** — calls ≥ 5 minutes or on positive-status leads
- Toggle recording status and flag/unflag calls
- SDRs see only their own calls; admins see all

### Meeting Management
- Create, update, and cancel meetings with full details (agenda, attendees, duration, drive link)
- Track meeting outcomes and next steps
- Calendar view integration for scheduling

### Task & Follow-Up Tracking
- Full task CRUD with priority levels (low / medium / high / urgent) and categories (follow-up / call / meeting / email / research / admin)
- Status workflow: **todo → in-progress → completed → cancelled**
- **Follow-up scheduling** on individual leads with due-date tracking
- Overdue follow-up notifications
- SDRs see assigned tasks; admins see all

### CSV Import with Smart Mapping
- Upload CSV files up to **5 MB / 1,000 rows**
- **Preview mode** — returns headers, first 5 rows, and auto-mapped column suggestions
- **Smart column mapper** with 100+ synonym dictionary and 4 matching strategies:
  1. Exact synonym matching
  2. Partial / substring matching
  3. Levenshtein edit-distance fuzzy matching
  4. First-name + Last-name auto-merge detection
- In-file deduplication by email + deduplication against existing database records
- CSV injection prevention (sanitizes cells starting with `=`, `+`, `-`, `@`)
- Each imported lead automatically gets an "uploaded via CSV" activity log

### Real-Time Notifications
- **Socket.IO-powered** WebSocket notifications with JWT authentication
- Notification types: assignment, stage change, mention, reminder, system
- Auto-triggered on: lead status changes, new leads, follow-up due/overdue, CSV imports
- Frontend dropdown with read/unread management and mark-all-as-read
- Role-scoped visibility — admins/managers/HR see all; SDRs/closers see their own

### Email Outreach & LinkedIn Tracking
- Track daily email outreach counts per agent
- Dedicated **LinkedIn outreach** tracking pages for SDRs and Lead Gen
- Outreach analytics and trends

### Team & Agent Management
- Create teams with assigned managers and members
- Agent roster with performance metrics: calls made, leads assigned, leads won, revenue, conversion rate
- Admin can create/edit/deactivate agents (sends welcome email with temporary password)

### HR Performance Analytics
- Dedicated HR dashboard with time-range filtering
- Per-agent performance breakdowns (calls, leads, conversions, revenue)
- Closed-lead analysis (won vs. lost) with call agent attribution
- Lead-level call history tracking

### Admin Impersonation
- Admin can **impersonate any user** for troubleshooting (access-only token, 15-min TTL)
- Safe exit — backup cookie restores admin session
- Every impersonation is **audit logged** with IP address

### Audit Logging
- Automatic middleware captures old/new values for all mutations
- Covers: leads, calls, meetings, outreach, agents, auth events
- Tracks: action, user, admin, entity type/ID, target user, IP address, timestamp

### Dark / Light Theme
- System preference detection with manual toggle
- Powered by `next-themes`

---

## Role-Based Access Control (RBAC)

| Role | Dashboard | Key Permissions |
|------|-----------|----------------|
| **Admin** | `/admin` | Full access — manage users, leads, pipeline stages, teams; impersonate users; view all analytics |
| **Manager** | `/admin` | Edit/assign leads, view all analytics, manage teams |
| **Lead Gen** | `/leadgen` | Upload/import CSVs, assign leads, create activities, email & LinkedIn outreach |
| **SDR** | `/sdr` | View/edit assigned leads, move pipeline stages, log calls, manage own tasks, outreach tracking |
| **Closer** | `/sdr` | Same as SDR — works on assigned leads through close |
| **HR** | `/hr` | View all analytics, agent performance dashboards, manage users |

Permissions are granular with `resource.action` keys (e.g., `leads.upload`, `leads.assign`, `pipeline.manageStages`, `analytics.view_all`, `users.manage`).

---

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                      Client (Browser)                       │
│   Next.js App Router  ·  React 19  ·  TanStack Query        │
│   shadcn/ui  ·  Recharts  ·  dnd-kit  ·  Socket.IO Client  │
└──────────────┬──────────────────────────────┬───────────────┘
               │  HTTP (REST API)             │  WebSocket
               ▼                              ▼
┌─────────────────────────────────────────────────────────────┐
│                   Unified Node.js Server                     │
│  ┌──────────────────┐    ┌──────────────────────────────┐   │
│  │   Express 5 API  │    │  Next.js SSR / Static Assets │   │
│  │  Routes · RBAC   │    │  App Router · Middleware      │   │
│  │  Zod Validation  │    └──────────────────────────────┘   │
│  │  Audit Logging   │                                       │
│  └────────┬─────────┘    ┌──────────────────────────────┐   │
│           │              │       Socket.IO Server        │   │
│           │              │  JWT Auth · Role-based Rooms  │   │
│           │              └──────────────────────────────┘   │
│           ▼                                                  │
│  ┌──────────────────────────────────────────────────────┐   │
│  │           Mongoose 9 ODM  ·  MongoDB Driver          │   │
│  └──────────────────────┬───────────────────────────────┘   │
└─────────────────────────┼───────────────────────────────────┘
                          ▼
               ┌──────────────────┐
               │     MongoDB      │
               │  (Railway/Atlas) │
               └──────────────────┘
```

---

## Project Structure

```
sales-crm/
├── server/                        # Express backend
│   ├── index.ts                   # Unified server entry (Express + Next.js + Socket.IO)
│   ├── socket.ts                  # Socket.IO setup, JWT auth, room management
│   ├── seed.ts                    # Database seeder
│   ├── config/
│   │   ├── env.ts                 # Zod-validated environment variables
│   │   └── permissions.ts         # RBAC permission definitions
│   ├── constants/
│   │   └── pipeline.ts            # Default pipeline stage definitions
│   ├── middleware/
│   │   ├── auth.ts                # JWT verification, role checking, rate limiting
│   │   ├── auditLog.ts            # Automatic mutation audit logging
│   │   └── validate.ts            # Zod schema validation middleware
│   ├── models/                    # Mongoose schemas (12 models)
│   │   ├── User.ts                # Users with refresh tokens & lockout
│   │   ├── Lead.ts                # Leads with soft-delete & concurrency
│   │   ├── Activity.ts            # Activity feed entries
│   │   ├── PipelineStage.ts       # Configurable pipeline stages
│   │   ├── Call.ts                # Call logs with recording flags
│   │   ├── Meeting.ts             # Meetings with attendees & outcomes
│   │   ├── Task.ts                # Tasks with priority & categories
│   │   ├── Note.ts                # Personal notes per user
│   │   ├── Notification.ts        # Push notifications
│   │   ├── Outreach.ts            # Daily email outreach counts
│   │   ├── Team.ts                # Teams with managers & members
│   │   └── AuditLog.ts            # Immutable audit trail
│   ├── routes/                    # Express route handlers (12 files)
│   │   ├── auth.ts                # Login, logout, register, password reset, impersonation
│   │   ├── leads.ts               # CRUD, assign, bulk ops, CSV import, KPIs, funnel
│   │   ├── pipeline.ts            # Kanban board, stage CRUD, reorder
│   │   ├── calls.ts               # Call logging and recording management
│   │   ├── meetings.ts            # Meeting CRUD
│   │   ├── tasks.ts               # Task CRUD
│   │   ├── activities.ts          # Activity feed and history
│   │   ├── agents.ts              # Agent/user management with performance stats
│   │   ├── hr.ts                  # HR analytics dashboards
│   │   ├── notifications.ts       # Notification management
│   │   ├── outreach.ts            # Email outreach tracking
│   │   └── notes.ts               # Personal notes
│   ├── seeds/
│   │   ├── defaultAdmin.ts        # Seed default admin + team users
│   │   └── pipelineStages.ts      # Seed 7 default pipeline stages
│   ├── services/
│   │   └── email.ts               # Resend API email service
│   ├── utils/
│   │   ├── csvColumnMapper.ts     # Smart CSV column auto-mapping (100+ synonyms)
│   │   └── notificationHelper.ts  # Notification creation helpers
│   └── validators/
│       └── lead.ts                # Zod schemas for lead validation
│
├── src/                           # Next.js frontend
│   ├── app/
│   │   ├── layout.tsx             # Root layout with providers
│   │   ├── page.tsx               # Landing / redirect page
│   │   ├── providers.tsx          # React Query, Theme, Socket providers
│   │   ├── login/                 # Login page
│   │   ├── forgot-password/       # Forgot password page
│   │   ├── reset-password/        # Reset password page
│   │   └── (dashboard)/           # Protected dashboard layouts
│   │       ├── admin/             # Admin pages (14+ pages)
│   │       ├── sdr/               # SDR pages (12+ pages)
│   │       ├── leadgen/           # Lead Gen pages (8+ pages)
│   │       └── hr/                # HR pages (5+ pages)
│   ├── components/
│   │   ├── common/                # Shared components (KPICard, LeadTable, DateFilter, etc.)
│   │   └── ui/                    # shadcn/ui primitives (60+ components)
│   ├── features/                  # Feature modules (16 domains)
│   ├── hooks/                     # Custom hooks (useApi, useDebounce, useRole, useSocket, etc.)
│   ├── services/api/              # Axios-based API service layer
│   ├── config/env.ts              # Frontend environment config
│   └── lib/utils.ts               # Tailwind merge utilities
│   └── middleware.ts              # Server-side JWT route protection (jose)
│
├── public/                        # Static assets
├── Dockerfile                     # Multi-stage Docker build
├── railway.toml                   # Railway deployment config
├── tailwind.config.ts             # Tailwind configuration
├── tsconfig.json                  # TypeScript config
├── eslint.config.js               # ESLint 9 flat config
├── SECURITY.md                    # Security audit documentation
└── package.json                   # Dependencies and scripts
```

---

## Getting Started

### Prerequisites

| Requirement | Version |
|-------------|---------|
| Node.js | 20+ |
| npm | 9+ |
| MongoDB | 6+ (local, Atlas, or Railway) |

### Installation

```bash
git clone https://github.com/your-org/sales-crm.git
cd sales-crm
npm install
```

### Environment Variables

Create a `.env` file in the project root:

```env
# MongoDB connection
MONGODB_URI=mongodb://localhost:27017/insurelead

# JWT (use a strong secret — minimum 32 characters)
JWT_SECRET=your-strong-jwt-secret-minimum-32-chars

# Server
PORT=3001
NODE_ENV=development
APP_URL=http://localhost:8080

# Email (Resend — optional for local dev)
RESEND_API_KEY=re_your_resend_api_key
SMTP_FROM=noreply@yourdomain.com

# Seed passwords (used by npm run seed)
SEED_ADMIN_PASSWORD=YourAdminPassword1
SEED_TEAM_PASSWORD=YourTeamPassword1

# Production only
# ALLOWED_ORIGINS=https://yourdomain.com,https://app.yourdomain.com
```

> **Railway MongoDB:** Use the public proxy URI for local dev and the internal URI (`mongodb.railway.internal`) in production for lower latency.

### Seed the Database

```bash
# Seed pipeline stages (7 default stages)
npm run seed:stages

# Seed default admin + team users
npm run seed:admin

# Or seed everything at once
npm run seed:all
```

**Default seed accounts:**

| Role | Email | Password |
|------|-------|----------|
| Admin | `chiren@ualliances.com` | Value of `SEED_ADMIN_PASSWORD` |
| SDR | `rajesh@ualliances.com` | Value of `SEED_TEAM_PASSWORD` |
| SDR | `priya@ualliances.com` | Value of `SEED_TEAM_PASSWORD` |
| Lead Gen | `amit@ualliances.com` | Value of `SEED_TEAM_PASSWORD` |
| Lead Gen | `deepa@ualliances.com` | Value of `SEED_TEAM_PASSWORD` |
| SDR | `karan@ualliances.com` | Value of `SEED_TEAM_PASSWORD` |

### Run in Development

```bash
npm run dev
```

This starts the unified server with hot-reload via `tsx watch`. The app is available at **http://localhost:8080** (Next.js) with the API at **http://localhost:3001/api**.

> In development, Next.js rewrites `/api/*` requests to the Express server automatically.

### Build for Production

```bash
# Build Next.js frontend
npm run build

# Bundle server to a single ESM file
npm run build:server

# Start production server
npm run start
```

---

## Docker & Railway Deployment

### Docker

The project includes a **multi-stage Dockerfile** optimized for production:

```bash
# Build the image
docker build -t sales-crm .

# Run the container
docker run -p 3001:3001 \
  -e MONGODB_URI=your_mongodb_uri \
  -e JWT_SECRET=your_jwt_secret \
  -e NODE_ENV=production \
  sales-crm
```

**Build stages:**

| Stage | Purpose |
|-------|---------|
| `deps` | Install all dependencies (`npm ci`) |
| `builder` | Build Next.js + bundle server via esbuild |
| `prod-deps` | Production-only `npm ci --omit=dev` |
| `runner` | Minimal Alpine image with non-root user (`nextjs`) |

### Railway

Deployment is pre-configured via `railway.toml`:

```toml
[build]
builder = "DOCKERFILE"

[deploy]
startCommand = "node dist/server.mjs"
healthcheckPath = "/api/health"
healthcheckTimeout = 300
restartPolicyType = "ON_FAILURE"
restartPolicyMaxRetries = 10
```

**Required Railway environment variables:**

| Variable | Description |
|----------|-------------|
| `MONGODB_URI` | Internal Railway MongoDB URL |
| `JWT_SECRET` | Strong secret (min 32 chars) |
| `NODE_ENV` | `production` |
| `ALLOWED_ORIGINS` | Comma-separated allowed frontend domains |
| `RESEND_API_KEY` | Resend API key (optional) |

---

## API Reference

All endpoints are prefixed with `/api`. Authentication uses **httpOnly JWT cookies** (set on login).

### Authentication

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| `POST` | `/auth/login` | Login with email & password | Public |
| `POST` | `/auth/logout` | Logout (revoke refresh token) | Required |
| `POST` | `/auth/logout-all` | Revoke all sessions across devices | Required |
| `POST` | `/auth/refresh` | Silent token refresh with rotation | Cookie |
| `GET` | `/auth/me` | Current user profile | Required |
| `POST` | `/auth/register` | Create new user (sends welcome email) | Admin |
| `POST` | `/auth/impersonate` | Impersonate another user | Admin |
| `POST` | `/auth/exit-impersonation` | Restore admin session | Admin |
| `POST` | `/auth/forgot-password` | Request password reset email | Public |
| `POST` | `/auth/reset-password` | Reset password with token | Public |
| `POST` | `/auth/change-password` | Change current password | Required |

### Leads

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| `GET` | `/leads` | List leads (paginated, filtered, role-scoped) | Required |
| `GET` | `/leads/unassigned` | Unassigned leads for assignment workflow | Required |
| `GET` | `/leads/kpis` | Dashboard KPIs (total, new, active, won, lost) | Required |
| `GET` | `/leads/funnel` | Funnel analytics with per-agent breakdown | Required |
| `GET` | `/leads/:id` | Lead detail with last 10 activities | Required |
| `POST` | `/leads` | Create a lead | Required |
| `PATCH` | `/leads/:id` | Update lead (optimistic concurrency via `__v`) | Required |
| `DELETE` | `/leads/:id` | Soft-delete lead | Admin |
| `POST` | `/leads/bulk-upload` | Upload CSV (max 1,000 rows / 5 MB) | Lead Gen+ |
| `POST` | `/leads/import/preview` | CSV preview + auto-column mapping | Lead Gen+ |
| `POST` | `/leads/import` | Import CSV with custom field mappings | Lead Gen+ |
| `POST` | `/leads/:id/assign` | Assign lead to SDR/Closer | Required |
| `POST` | `/leads/bulk-assign` | Bulk assign (single agent or round-robin) | Required |
| `POST` | `/leads/:id/unassign` | Remove lead assignment | Required |
| `POST` | `/leads/:id/schedule-followup` | Schedule a follow-up | Required |
| `POST` | `/leads/:id/complete-followup` | Mark follow-up complete | Required |
| `POST` | `/leads/bulk-delete` | Bulk soft-delete | Admin |

### Pipeline

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| `GET` | `/pipeline/stages` | All active pipeline stages | Required |
| `GET` | `/pipeline/board` | Kanban board (leads grouped by stage) | Required |
| `PATCH` | `/pipeline/leads/:id/stage` | Move lead to a different stage | Required |
| `POST` | `/pipeline/stages` | Create a new stage | Admin |
| `PATCH` | `/pipeline/stages/reorder` | Reorder stages | Admin |
| `PATCH` | `/pipeline/stages/:id` | Update stage properties | Admin |

### Calls

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| `GET` | `/calls` | List calls (role-scoped) | Required |
| `GET` | `/calls/recordings` | Calls flagged for recording review | Required |
| `GET` | `/calls/:id` | Call detail | Required |
| `POST` | `/calls` | Log a call | Required |
| `PUT` | `/calls/:id` | Update call | Required |
| `PUT` | `/calls/:id/recording` | Toggle recording flag | Required |

### Meetings

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| `GET` | `/meetings` | List meetings (role-scoped) | Required |
| `POST` | `/meetings` | Create a meeting | Required |
| `PUT` | `/meetings/:id` | Update meeting | Creator/Admin |
| `DELETE` | `/meetings/:id` | Delete meeting | Creator/Admin |

### Tasks

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| `GET` | `/tasks` | List tasks (filterable, role-scoped) | Required |
| `GET` | `/tasks/:id` | Task detail | Required |
| `POST` | `/tasks` | Create task | Required |
| `PUT` | `/tasks/:id` | Update task (auto-sets `completedAt`) | Required |
| `DELETE` | `/tasks/:id` | Delete task | Required |

### Activities

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| `POST` | `/activities` | Log an activity | Required |
| `GET` | `/activities/feed` | Latest 50 activities (role-scoped) | Required |
| `GET` | `/activities/my` | Current user's activities (paginated) | Required |
| `GET` | `/activities/my/tasks` | Pending tasks & follow-ups | Required |
| `GET` | `/activities/lead/:leadId` | Activities for a specific lead | Required |
| `PATCH` | `/activities/:id/complete` | Mark activity complete | Owner |

### Agents / Users

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| `GET` | `/agents` | Team roster with performance stats | Required |
| `GET` | `/agents/:id` | Agent detail + performance metrics | Required |
| `POST` | `/agents` | Create agent (sends welcome email) | Admin |
| `PUT` | `/agents/:id` | Update agent | Admin |
| `DELETE` | `/agents/:id` | Deactivate agent (soft) | Admin |

### HR

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| `GET` | `/hr/dashboard` | HR analytics (per-agent performance, time range filter) | HR/Admin |
| `GET` | `/hr/leads` | All leads with call tracking | HR/Admin |
| `GET` | `/hr/closed-leads` | Won/lost leads with agent attribution | HR/Admin |

### Notifications

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| `GET` | `/notifications` | Get notifications (role-scoped) | Required |
| `PUT` | `/notifications/read-all` | Mark all as read | Required |
| `PUT` | `/notifications/:id/read` | Mark one as read | Owner |

### Outreach

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| `GET` | `/outreach` | Email outreach stats (total & today) | Required |
| `POST` | `/outreach` | Log emails sent today | Required |

### Health

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| `GET` | `/health` | Health check with DB connection status | Public |

---

## Database Models

| Model | Description | Key Fields |
|-------|-------------|------------|
| **User** | System users with auth | name, email, password (bcrypt), role, team, refreshTokens[], failedLoginAttempts, lockUntil, tokenVersion |
| **Lead** | Sales leads | firstName, lastName, email, phone, company, source, assignedTo, pipelineStage, status, dealValue, priority (A/B/C), employees[], tags[], customFields, isDeleted |
| **Activity** | Activity feed | leadId, userId, type (call/email/note/meeting/task/stage_change/assignment/follow_up/upload), callDuration, callOutcome, scheduledAt, isCompleted |
| **PipelineStage** | Kanban stages | name, order, color, probability (0–100), isDefault, isActive |
| **Call** | Call logs | leadId, leadName, agentName, duration, status, notes, hasRecording, recordingFlagged |
| **Meeting** | Meetings | title, date, duration, leadId, attendees[], status, agenda, outcome, nextStep, driveLink |
| **Task** | Tasks | title, dueDate, priority, status, assignedTo, category, completedAt |
| **Note** | Personal notes | userId, content |
| **Notification** | Notifications | userId, title, message, type, isRead, relatedLead, relatedActivity |
| **Outreach** | Email tracking | agentName, date, emailsSent |
| **Team** | Team groups | name, manager, members[], description |
| **AuditLog** | Audit trail | action, userId, adminId, entityType, entityId, ip, oldValue, newValue, timestamp |

---

## Real-Time Events (Socket.IO)

WebSocket connections are **JWT-authenticated** via httpOnly cookies or handshake auth tokens.

**Rooms:**

| Room | Who Joins |
|------|-----------|
| `role:admin` | All admins |
| `role:leadgen` | All lead gen users |
| `role:hr` | All HR users |
| `user:{userId}` | Individual user (for personal notifications) |

**Events:**

| Event | Triggered By | Effect |
|-------|-------------|--------|
| `lead:changed` | Lead CRUD, assignment, stage change, bulk operations, meeting changes | Auto-invalidates React Query caches for leads, KPIs, pipeline, notifications, meetings, HR dashboards, and tasks |

All connected clients stay in sync automatically — no manual refresh needed.

---

## Security

This application has undergone a comprehensive security audit. Key protections include:

| Category | Implementation |
|----------|---------------|
| **Authentication** | JWT access tokens (15 min) + refresh tokens (7 days) in httpOnly cookies |
| **Token Rotation** | Refresh token rotation with **reuse detection** (reuse revokes all tokens) |
| **Password Policy** | Min 8 chars, uppercase + lowercase + number; bcrypt cost factor 12 |
| **Account Lockout** | 10 failed attempts → 15-minute lockout |
| **Rate Limiting** | General: 300 req/15 min; Auth: 10 req/15 min (production) |
| **RBAC** | Granular `resource.action` permission keys per role |
| **IDOR Protection** | SDRs/closers restricted to own leads and tasks |
| **Mass Assignment** | Whitelisted fields on all update endpoints |
| **NoSQL Injection** | `express-mongo-sanitize` on all inputs |
| **XSS Prevention** | Deep recursive `sanitize-html` + strict CSP (Helmet) |
| **CSV Injection** | Sanitizes cells starting with `=`, `+`, `-`, `@` |
| **ReDoS Prevention** | User-supplied regex escaped via `escapeRegex()` |
| **Concurrency** | Mongoose `__v` optimistic locking prevents lost updates |
| **Query Safety** | 5,000 ms timeout + hard limit pagination (500 records max) |
| **Audit Trail** | Middleware logs all mutations with old/new values and IP |
| **Security Headers** | CSP, HSTS, X-Frame-Options: DENY, X-Content-Type-Options, Referrer-Policy, Permissions-Policy |
| **Env Validation** | Zod schema validates all env vars at startup — fails fast on misconfiguration |
| **Soft Deletes** | Leads are never hard-deleted; pre-query hooks auto-filter |

> See [SECURITY.md](SECURITY.md) for the full audit documentation and accepted risk matrix.

---

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start unified dev server with hot-reload (`tsx watch`) |
| `npm run build` | Build Next.js production assets |
| `npm run build:server` | Bundle server to `dist/server.mjs` via esbuild |
| `npm run start` | Start production server |
| `npm run start:dev` | Start server without watch mode |
| `npm run seed` | Seed database with sample data |
| `npm run seed:stages` | Seed default pipeline stages |
| `npm run seed:admin` | Seed default admin + team users |
| `npm run seed:all` | Seed stages + admin users |
| `npm run lint` | Run ESLint checks |
| `npm run test` | Run tests once (Vitest) |
| `npm run test:watch` | Run tests in watch mode |

---

## Testing

```bash
# Run all tests
npm run test

# Watch mode
npm run test:watch
```

Tests use **Vitest** with **Testing Library** and **jsdom** for component testing.

---

## License

This project is licensed under the terms specified in the [LICENSE](LICENSE) file.

---

<p align="center">
  Built with care by <strong>United Alliances Services</strong>
</p>
