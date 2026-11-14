# Getting started

## Prerequisites

- Node.js >= 22.12.0
- pnpm 10.x (`corepack enable` then `corepack prepare pnpm@10 --activate`, or install pnpm normally)
- Git and a GitHub account

## Clone the GitHub repository

```bash
git clone https://github.com/Barry1003/momentum.git
cd momentum
git switch backend
corepack enable
corepack prepare pnpm@10.34.9 --activate
pnpm install --frozen-lockfile
pnpm dev
```

Browse to `http://localhost:3000` and test `http://localhost:3000/api/health`.

The repository's dependency lockfile must be committed on the development branch. For reproducible installs, use `pnpm install --frozen-lockfile`. Do not regenerate the lockfile unless dependencies are intentionally changed.

## GitHub remote and branch setup

The repository already exists at https://github.com/Barry1003/momentum and has four remote branches. No repository creation or initial push is required. It is currently public; if private visibility is intended, change it in GitHub repository settings.

## Verify all four branches on GitHub

- `main`: reviewed stable integration.
- `frontend`: Figma-approved UI integrations.
- `backend`: API, Prisma and business logic.
- `error-fixes`: bug fixes and regressions.

For branch protections/rulesets, use GitHub Settings after the repository is created. Remote branches already exist.

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

The GitHub repository is active. CI validation should be verified from the current pull request. No Neon connection, migrations, auth screens, accounts or avatar assets exist yet. No Neon connection, migrations, auth screens, accounts or avatar assets exist yet.
