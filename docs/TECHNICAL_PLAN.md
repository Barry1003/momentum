# Momentum technical plan (draft v0.1)

## Decisions confirmed

- App: small-group accountability and goal-progress PWA for squads of approximately 3–10.
- Full-stack: Next.js App Router and TypeScript in **one** repository.
- Styling: Tailwind CSS; use Figma-approved components later.
- Database: Neon PostgreSQL (proposed; connection not set up yet).
- ORM: Prisma 7 (confirmed).
- Source: GitHub repository with four permanent branches as described in `BRANCHING.md`. **Current visibility: public**, pending owner's decision about making it private.
- Delivery: backend features first, Figma design independently, frontend later.
- Avatar: full-body Soft 3D **and** Japanese anime directions; male/female, physical growth Child → Preteen → Teenager → Young Adult → Adult. Age/growth stage is earned and permanent; expressions are temporary.

## Decisions deliberately pending

- Authentication platform/provider approval: **self-hosted Better Auth + Prisma + Neon proposed** in [ADR-001](architecture/ADR-001-authentication.md); no implementation or identity migration until reviewed. See [F01 contract](features/F01-authentication-contract.md).
- Neon project, pooled/direct credentials and environment separation.
- Final avatar asset format, rigging pipeline and mobile rendering budget.
- Messaging: whether to build in-app chat or link WhatsApp in MVP.
- XP weights, abuse resistance and policies for rest days.
- Deployment setup and release policy in Vercel.

## Modular monolith layout

- `src/app/`: route handlers, server-rendered pages, layout and eventually feature UI.
- `src/modules/`: feature-owned domain types, validation, services, data access and tests.
- `prisma/`: schema and migration history; `prisma.config.ts` uses an unpooled CLI connection.
- `src/generated/prisma/`: generated client (git-ignored).
- `docs/`: feature specification, security decisions and ADRs.

Keep API handlers thin; all authorization must be performed server-side. Do not export the Prisma client into client components.

## Backend feature milestones

### F00 — Foundation
- Local Next.js boots with a temporary placeholder page.
- `/api/health` returns JSON `{service: 'momentum', status: 'ok'}`.
- TypeScript, ESLint, Vitest, Tailwind, CI and Prisma placeholders exist.
- Confirm git strategy and add a repository setup guide.
- No production database or authentication configured.

### F01 — Identity and accounts
- Decide authentication solution first, then implement registration/sign-in/sign-out/session refresh.
- Member profile fields, avatar preferences and account deletion/export policy.
- Session protection, rate limiting, secure cookies and authorization tests.

### F02 — Squads and invitations
- Create squads, send/accept expiring invitations, list members.
- Roles, membership lifecycle, default shared task visibility and safe leave/remove flows.
- Prove cross-squad access cannot read or modify other squads' data.

### F03 — Goals and tasks
- CRUD personal/shared goals; tasks with ownership, due dates and completion state.
- Recurring tasks and time estimates as scoped sub-features.
- Audit history for edits and deduplicate task completion side effects.

### F04 — Daily check-ins and time tracking
- One user check-in per applicable day, mood/effort reflections, blockers and summaries.
- Time sessions can be explicitly started/stopped; handle abandoned sessions and timezone boundaries.
- A transparent policy for rest days and unavailable reporting.

### F05 — Progress, streaks and metrics
- Derived metrics from validated task/check-in events, not manually editable totals.
- Streak rules include timezones, paused days and approved breaks.
- Avoid harmful punishment and loss of permanent earned achievements.

### F06 — Avatar XP and growth
- Append-only XP ledger with unique award source keys (idempotent).
- Deterministic total-to-stage function; five physical stages preserved permanently.
- Avatar identity/appearance stable across art styles, stages and emotional overlays.
- Temporary emotions never change permanent growth level.

### F07 — Squad activity and celebrations
- Visible group feed, encouragement and achievement notices respecting permissions.
- Notification preferences and anti-spam controls.

### F08 — Frontend integration
- Build approved Figma layouts after design sign-off.
- Typed UI-to-API contracts, accessible navigation, responsive layout and skeleton/error states.
- Separate avatar rendering engines where appropriate; fallback art for low-end devices.

### F09 — PWA and release hardening
- Installability/offline policy; do not promise offline mutation until conflict handling exists.
- Playwright end-to-end checks, performance budgets, audit logs and release checks.

## Feature delivery standard

For each issue: brief → acceptance criteria → authorization matrix → API/data design → code → tests → PR → review → merge. Include threat cases and rollback notes for migrations.

## Test strategy

- **Unit:** pure rules (XP thresholds, streaks, date rules, validations).
- **Integration:** Prisma data access and feature handlers using isolated test databases.
- **End-to-end:** authenticated user journeys, multiple squads, mobile/responsive.
- **Security:** cross-tenant read/write, duplicate submission, session tampering and rate limits.
- **CI:** lint, TypeScript checks, unit tests and production build on every PR.

## Privacy and asset principles

- Only show friends the information that product settings explicitly permit.
- Never publicize private check-in reflections without consent.
- Avoid making avatar stages depend on physical attractiveness or strength.
- Final 3D modeling/rigged animation assets should be independently licensed or original.

## Next approval points

1. Existing GitHub repository and four branches verified; decide whether repository visibility should be private.
2. F00 lockfile and CI changes are in [PR #3](https://github.com/Barry1003/momentum/pull/3); review and merge after checks.
3. Review/approve [ADR-001](architecture/ADR-001-authentication.md) and the [F01 identity contract](features/F01-authentication-contract.md).
4. Configure independent Neon development/test/production environments safely; never share password-containing URLs in chat.
5. Only then implement F01 on a separate reviewed PR based on current `backend`, with reviewed migrations and isolated integration tests.
