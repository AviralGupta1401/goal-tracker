# GoalTracker - In-House Goal Setting & Tracking Portal

Built for **ATOMQUEST HACKATHON 1.0**

## Live Demo

- **URL**: [Deploy URL]
- **Source Code**: [GitHub Repository URL]

## Login Credentials

| Role | Email | Password |
|------|-------|----------|
| Admin | admin@company.com | admin123 |
| Manager | manager@company.com | manager123 |
| Employee | alice@company.com | employee123 |
| Employee | bob@company.com | employee123 |
| Manager | john.lead@company.com | manager123 |

## Quick Start

```bash
# Install all dependencies
npm run install:all

# Seed demo users
npm run seed

# Start development servers
npm run dev
```

Frontend: http://localhost:5173
Backend: http://localhost:3001

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 19, Vite, TypeScript, Tailwind CSS v4, Recharts |
| Backend | Node.js, Express, TypeScript, JSON Web Tokens |
| Database | MongoDB, Mongoose |
| State | React Hooks, Axios |

## Features Implemented

### Phase 1 — Goal Creation & Approval
- Employee goal sheet creation with Thrust Area, Goal Title/Description
- Unit of Measurement (Numeric, %, Timeline, Zero-based) with direction
- Targets and Weightage per goal
- Validation: Total weightage = 100%, Min 10% per goal, Max 8 goals
- Manager (L1) approval workflow with inline editing
- Return for rework with comments
- Goals locked on approval
- Shared Goals: Admin/Manager can push departmental KPIs to multiple employees

### Phase 2 — Achievement Tracking & Quarterly Check-ins
- Quarterly update interface for Planned vs. Actual
- Status: Not Started / On Track / Completed
- Manager Check-in module with comments
- System-computed progress scores per UoM formula

### Reporting & Governance
- Exportable CSV achievement reports
- Completion dashboard with real-time stats
- Audit trail logging all changes (who, what, when)

### Admin Features
- User management (create employees, managers, admins)
- Goal unlock capability
- Organization-wide dashboard with analytics
- Goal distribution by Thrust Area, Status, UoM

## Architecture

See `architecture.pdf` for the detailed architecture diagram.

## Project Structure

```
goal-tracker/
├── server/
│   └── src/
│       ├── index.ts              # Express server entry
│       ├── seed.ts               # Demo data seeder
│       ├── lib/
│       │   ├── auth.ts           # JWT auth middleware
│       │   ├── audit.ts          # Audit logging
│       │   └── db.ts             # MongoDB connection
│       ├── models/
│       │   ├── User.ts           # User model with roles
│       │   ├── Goal.ts           # Goal sheet model
│       │   ├── CheckIn.ts        # Quarterly check-in model
│       │   ├── AuditLog.ts       # Audit trail model
│       │   └── GoalCycle.ts      # Cycle configuration
│       └── routes/
│           ├── auth.ts           # Login/register
│           ├── goals.ts          # Goal CRUD, approval, sharing
│           ├── checkins.ts       # Quarterly check-ins
│           └── admin.ts          # Admin operations, reports
├── client/
│   └── src/
│       ├── App.tsx               # Router with role-based access
│       ├── pages/
│       │   ├── Login.tsx         # Login with quick demo access
│       │   ├── EmployeeDashboard.tsx
│       │   ├── ManagerDashboard.tsx
│       │   └── AdminDashboard.tsx
│       ├── components/
│       │   ├── Layout.tsx
│       │   ├── LayoutSidebar.tsx
│       │   ├── GoalForm.tsx
│       │   ├── GoalCard.tsx
│       │   ├── CheckInForm.tsx
│       │   └── LogoutButton.tsx
│       ├── lib/
│       │   └── api.ts            # Axios API client
│       └── types/
│           └── index.ts          # TypeScript types
└── architecture.svg              # Architecture diagram
```

## API Endpoints

### Auth
- `POST /api/auth/register` — Create user
- `POST /api/auth/login` — Login
- `GET /api/auth/me` — Get current user

### Goals
- `POST /api/goals` — Create goals (with validation)
- `GET /api/goals/my` — Get my goals
- `GET /api/goals/team` — Get team goals (manager)
- `PUT /api/goals/:id` — Update goal
- `POST /api/goals/:id/submit` — Submit goal
- `POST /api/goals/submit-all` — Submit all goals
- `POST /api/goals/:id/approve` — Approve goal (manager)
- `POST /api/goals/:id/reject` — Reject goal (manager)
- `POST /api/goals/share` — Share goal to employees (admin/manager)

### Check-ins
- `POST /api/checkins` — Create/update check-in
- `GET /api/checkins/my` — Get my check-ins
- `GET /api/checkins/team` — Get team check-ins (manager)
- `PUT /api/checkins/:id` — Update check-in
- `GET /api/checkins/completion-status` — Completion tracking

### Admin
- `GET /api/admin/users` — List all users
- `POST /api/admin/users` — Create user
- `GET /api/admin/goals` — List all goals
- `PUT /api/admin/goals/:id/unlock` — Unlock approved goal
- `GET /api/admin/audit` — Audit trail
- `GET /api/admin/reports/achievements` — Achievement report
- `GET /api/admin/dashboard` — Dashboard analytics

## Progress Score Formulas

| UoM Type | Direction | Formula |
|----------|-----------|---------|
| Numeric / % | Min (higher better) | Achievement ÷ Target × 100 |
| Numeric / % | Max (lower better) | Target ÷ Achievement × 100 |
| Timeline | — | On/before deadline = 100%, else decreasing |
| Zero | — | If 0 → 100%, else 0% |

## Check-in Schedule

| Period | Window | Action |
|--------|--------|--------|
| Goal Setting | 1st May | Goal Creation, Submission & Approval |
| Q1 Check-in | July | Progress Update |
| Q2 Check-in | October | Progress Update |
| Q3 Check-in | January | Progress Update |
| Q4 / Annual | March / April | Final Achievement Capture |
