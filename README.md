# United Alliances Sales CRM

A full-stack internal CRM for sales operations. It includes role-based dashboards, lead and pipeline tracking, call/activity logging, meeting and task management, and notifications.

## Project Overview

- **Frontend:** Next.js (App Router), React, TypeScript, Tailwind CSS, shadcn/ui
- **Backend:** Express + TypeScript
- **Database:** MongoDB (Mongoose)
- **Realtime:** Socket-based notifications/events

### Core Modules

- Authentication and role-based access (Admin, SDR, LeadGen, HR)
- Lead management and pipeline stages
- Calls, meetings, notes, outreach, and follow-ups
- Task and notification workflows
- Admin/HR performance visibility

## Quick Start

### Prerequisites

- Node.js 18+
- MongoDB (local or hosted)

### Installation

```bash
npm install
```

### Environment

Create `.env` in the project root:

```env
PORT=3000
INTERNAL_PORT=3001
NODE_ENV=development
APP_URL=http://localhost:3000

MONGODB_URI=mongodb://127.0.0.1:27017/insurelead

JWT_SECRET=your_jwt_secret
JWT_REFRESH_SECRET=your_refresh_secret

RESEND_API_KEY=your_resend_api_key
SMTP_FROM=noreply@ualliances.com
```

### Run

```bash
npm run dev
```

Optional seed data:

```bash
npm run seed
```

## Useful Scripts

- `npm run dev` — Start frontend and backend in development
- `npm run build` — Build production assets
- `npm run start` — Start production app
- `npm run seed` — Seed database with sample data
- `npm run lint` — Run lint checks

## High-Level Structure

- `src/` — Next.js app, UI components, feature modules, hooks
- `server/` — Express server, routes, models, middleware, services
- `public/` — Static assets and app manifest
