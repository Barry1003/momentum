# Momentum

Momentum is a small-group accountability and personal growth PWA for friends. This repository is the **Phase 00 engineering scaffold**, not a finished application.

## Stack

- **Next.js 16** App Router, TypeScript, React 19, Tailwind CSS 4
- **Prisma 7** (ORM) + **Neon PostgreSQL** (database to be connected later)
- Zod for feature validation, Vitest for unit tests
- GitHub Actions for CI

## Run locally

Requirements: Node 22.12+ and pnpm 10.

```bash
pnpm install
pnpm dev
```

Open `http://localhost:3000` or `http://localhost:3000/api/health`.

After first install, commit `pnpm-lock.yaml`. The initial scaffold was generated offline with no dependency install available.

## What exists

- A functional source-code template for an App Router landing page and a `/api/health` route.
- ESLint, TypeScript, Vitest and GitHub Actions configurations.
- A Prisma 7 schema/config skeleton — no connection, no models, no migrations yet.
- Repository standards and phased technical plan in `docs/`.
- Four agreed branches: `main`, `frontend`, `backend`, `error-fixes` (pre-created in the downloadable Git archive).

## What does not yet exist

Auth, users, squads, actual tasks, database schema, personalized avatars and final Figma UI. Do not present this scaffold as a finished product or production-tested build.

## Branch and PR workflow

`main` is the stable integration branch. Implement backend work on `backend`, future approved design work on `frontend`, and isolated regressions on `error-fixes`. Use reviewed PRs and CI before merging. See [branching rules](docs/BRANCHING.md).

## Documentation

- [Technical roadmap](docs/TECHNICAL_PLAN.md)
- [Setup and GitHub push instructions](docs/SETUP.md)
- [Branch strategy](docs/BRANCHING.md)
- [Contributor/agent guidelines](AGENTS.md)

**Secrets:** Never commit `.env`, `.env.local`, database passwords or OAuth credentials. The checked-in `.env.example` contains placeholders only.
