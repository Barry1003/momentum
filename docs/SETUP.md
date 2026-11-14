# Getting started

## Prerequisites

- Node.js >= 22.12.0
- pnpm 10.x (`corepack enable` then `corepack prepare pnpm@10 --activate`, or install pnpm normally)
- Git and a GitHub account

## From the provided bootstrap archive

```bash
unzip momentum-app-bootstrap.zip
cd momentum-app
# This archive already has four local git branches.
git branch -a
pnpm install
pnpm dev
```

Browse to `http://localhost:3000` and test `http://localhost:3000/api/health`.

The archive intentionally excludes `node_modules`, any lockfile, and database credentials because package installation could not be run in the preparation environment. **After the first successful `pnpm install`, commit the generated `pnpm-lock.yaml`** and update CI to use `--frozen-lockfile`.

## Create the remote empty private GitHub repository

Use https://github.com/new and create `momentum-app` under your desired account as **Private**, without initializing a README or .gitignore (they are already in this archive).

Then from inside `momentum-app`:

```bash
git remote add origin https://github.com/Barry1003/momentum-app.git
git push -u origin main
git push origin frontend backend error-fixes
```

If Git rejects because the remote is not empty, do **not** force push. Inspect the history and reconcile first.

## Verify all four branches on GitHub

- `main`: reviewed stable integration.
- `frontend`: Figma-approved UI integrations.
- `backend`: API, Prisma and business logic.
- `error-fixes`: bug fixes and regressions.

For branch protections/rulesets, use GitHub Settings after the repository is created. Branches exist locally now; no remote exists until pushed.

## Database setup (later, after auth choice)

1. Create a new Neon project for Momentum.
2. Set pooled `DATABASE_URL` for app runtime and direct `DATABASE_URL_UNPOOLED` for CLI migrations in **local ignored env files**, never in Git.
3. Agree the identity/auth schema before adding the first Prisma models.
4. Only then use `pnpm db:validate`, `pnpm db:generate`, and `pnpm db:migrate`.
5. Never run migrations against production without review.

## Useful commands

```bash
pnpm lint
pnpm typecheck
pnpm test
pnpm build
```

## What is NOT done

No actual GitHub remote was created. Dependencies have not been installed or tested here; this source is a documentation-based Next.js scaffold prepared offline, not a validated running production application. No Neon connection, migrations, auth screens, accounts or avatar assets exist yet.
