# Neon Managed Better Auth — Momentum integration (draft)

Status: **implementation candidate, not approved for deployment**. Base commit: `75ccc3dff24fa0c9d0530ac6d5081b03e3c643b7`.

## Architectural contract
- Authentication authority: Neon Managed Better Auth, not the old `betterAuth()` Prisma adapter.
- Next.js same-origin proxy: `/api/auth/[...all]` (Neon SDK server handler).
- Browser: `createAuthClient()` from `@neon/auth/next`.
- Server: `auth.getSession()` from `@neon/auth/next/server`.
- Google: Neon Console OAuth provider / Shared keys for development only; no Google credentials in Momentum.
- App data: Prisma continues writing to public tables in Neon PostgreSQL. No destructive Prisma migrations.
- Identity: trusted Neon user IDs are inserted as the IDs in `public.user`. Never silently link by email; a legacy email collision fails closed pending an explicit data migration.

## Production and preview environment
- `NEON_AUTH_BASE_URL`: full endpoint from Neon Console (including `/neondb/auth`).
- `NEON_AUTH_COOKIE_SECRET`: generated 32+ character server-only secret, e.g. `openssl rand -base64 32`. Do not commit/share.
- `NEXT_PUBLIC_APP_URL`: `https://momentum-two-beryl.vercel.app` for this Production deployment.
- `DATABASE_URL`, `DATABASE_URL_UNPOOLED`: existing Neon PostgreSQL connection strings.
- Remove old `BETTER_AUTH_URL`, `BETTER_AUTH_SECRET`, `GOOGLE_CLIENT_ID`, and `GOOGLE_CLIENT_SECRET` from the application deployment **only after migration is tested and approved**.
- In Neon Console allow the production application domain. Keep production and preview auth/database environments separated.
- In Neon Console configure Verify at Sign-up -> Verification code and email OTP before testing the existing six-digit verification screens.
- Google Shared keys are suitable for development/testing, not a final production OAuth configuration. For production configure your own credentials in Neon Console when required.
- The old app-specific SMTP/OTP delivery integration is no longer the authority for signup OTP; Neon handles managed verification.

## Important compatibility constraints
- Local `public.user` was previously the self-managed auth table. Existing user IDs, emails and relationships need an explicit preservation/mapping plan before a production switch.
- The identity bridge refuses a previously registered email with a different ID. It does NOT transfer goals, squads or other private data on email alone.
- Local email change modifies `public.user` only; the managed Neon identity must be changed first. Disable the old email-change workflow until the managed API integration is reviewed.
- The auth SDK expects cookies routed through the same-origin proxy. Existing self-hosted sessions will not carry over automatically.
- Account deletion must reconcile managed authentication identity with application data. Existing scheduling flow does not delete the managed account.
- Check all app routes with verified and unverified sessions and ensure unverified users cannot access private data.
- Do not merge until dependency lockfile, TypeScript, lint, test and build pass.

## Verification gates
1. Run `pnpm install` on this branch to regenerate `pnpm-lock.yaml` with `@neon/auth@0.8.2`; commit the updated lockfile. It cannot be manually assumed compatible.
2. Run `pnpm typecheck && pnpm lint && pnpm test && pnpm build`.
3. Check `pnpm auth:check` with the actual environment privately configured.
4. Use an isolated test Neon branch. Verify email signup -> 6-digit verification -> onboarding; Google sign-in; sign-out and reload; password reset; protected API 401/403; no account data crossover.
5. Validate legacy-user collision and migration preservation before production rollout.
6. Review the Neon Console auth domain, verification setting, shared Google keys and Vercel environment separately.
7. Redeploy only after review; do not claim end-to-end readiness from source review alone.

Official SDK guidance: `neondatabase/neon-pkgs/packages/auth/NEXT-JS.md` (Next.js 16+).
