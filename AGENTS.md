# Momentum repository guidance

- This is the **Momentum** accountability application. Never conflate it with Poverty Die or Studomia.
- Current stack decision: Next.js App Router, TypeScript, Tailwind, Prisma 7, Neon PostgreSQL, pnpm.
- Implement backend features first; do not invent or replace unapproved Figma UI.
- `main` is the integration branch. `frontend`, `backend`, and `error-fixes` are the agreed long-lived workstreams.
- Scope changes narrowly and use PRs back into `main` after tests and review.
- Security-first: validate all external inputs; authorize every squad-scoped read/write; never trust the client for XP.
- Use Prisma Migrate for schema changes, and only after the database connection is configured.
- Do not create authentication schemas or choose an auth provider without an explicit decision.
- No secrets or real environment variables in source control.
- Keep permanent physical avatar growth stages separate from temporary emotional animation states and independent of art style.
- No direct pushes to `main` for feature implementations; use PRs.
