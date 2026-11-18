# Neon-managed authentication cutover for Momentum

**Status:** Integration candidate; do NOT deploy or merge without data and account verification.
**Source base:** `integration/frontend-backend-core`.
**Primary goal:** eliminate app-managed Google OAuth credentials and custom Better Auth server without losing existing UI or database relationships.

## Ownership boundaries

- **Neon-managed Better Auth** is the only authentication authority for account creation, Google OAuth, password authentication, email verification, recovery, cookies and sessions.
- **Momentum's Prisma DB** owns only application data: profile, avatar, squads, goals, tasks, habits, and a *local public identity mirror* (`User`) to maintain existing FK relationships.
- The mirror is populated strictly from a validated Neon Auth server session. Caller-provided emails, IDs, localStorage and client parameters are NEVER authentication sources.
- If a legacy local user already owns the verified email with a different identity ID, requests fail closed with an account migration error. **Do not link based only on email.**
- The legacy local `session`, `account`, `verification` tables remain in the Prisma schema solely for non-destructive migration/rollback. No runtime code reads or writes these legacy credential tables after this change. Removal is a separate reviewed data migration.
- Existing self-hosted Better Auth sessions **do not transfer automatically** to Neon-managed Auth; users must sign in again unless an approved verified account migration is performed.

## Required environment

Copy `.env.example` to an ignored local `.env.local`:

- `NEON_AUTH_BASE_URL`: Neon Console > Auth > Auth URL for the matching development branch.
- `NEON_AUTH_COOKIE_SECRET`: random 32+ character signing secret, generated using `openssl rand -base64 32`.
- `DATABASE_URL`: application Neon database connection URL for Prisma, with SSL.
- `DATABASE_URL_UNPOOLED`: direct application database URL for Prisma migrations.
- `NEXT_PUBLIC_APP_URL`: current application origin, normally localhost:3000 in development.

**Do not** set `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `BETTER_AUTH_SECRET`, `BETTER_AUTH_URL`, `RESEND_API_KEY` or `AUTH_EMAIL_FROM` in the app for this managed flow.
Neon itself still needs to have the Google provider enabled in the Neon Console; custom OAuth client credentials (if required) belong in Neon's provider configuration, not the Next.js env.

## Neon Console setup required

1. Enable Neon Auth / Managed Better Auth on an **isolated development branch**.
2. Under Settings > Better Auth, enable Email/password sign-up and sign-in.
3. Enable **Verify at Sign-up** and choose **Verification code**. The existing six-digit onboarding design relies on Neon Auth's managed Email OTP plugin.
4. Enable Google as a social provider in Neon Auth and configure permitted origins/callbacks. Verify whether your Neon project offers a built-in provider or requires custom provider credentials in Neon.
5. Allow the local app origin for development; add only approved production domains for production.
6. Use Neon's managed email delivery for local testing. For production, configure approved custom SMTP according to the Neon production checklist.
7. Verify account-linking and password reset behavior in the Neon Auth project before accepting real accounts.

## Existing app integration

- `src/modules/auth/config.ts` creates the server integration via `createNeonAuth`.
- `src/app/api/auth/[...all]/route.ts` proxies requests through Neon's handler.
- `src/frontend/auth/client.ts` uses the managed Next.js SDK and preserves the existing Figma auth screens.
- `src/modules/auth/session.ts` validates the session through Neon, then upserts a safe application-only `User` identity mirror before any other Prisma service receives the user ID.
- The existing server-side `requiredUser()` and workspace guards still enforce verified-email identity.
- Google sign-in no longer requires app-owned Google Client ID / Secret. Neon Auth is the OAuth authority.
- Existing onboarding, profile, squad, goals, tasks, habit and workspace APIs continue using the canonical user ID, never an email match.

## Critical gates before merge or deployment

- [ ] Confirm pinned Neon Auth SDK's sign-up, OTP verification, resend, social login and password reset signatures match current UI. Build success is NOT runtime verification.
- [ ] Review legacy user table for existing accounts and document migration or fresh-development-only strategy. **No automatic migration or deletion of credentials.**
- [ ] Configure isolated Neon Auth and matching app database in private secret settings.
- [ ] Register with email/password; receive six-digit verification; verify and start a session; retry invalid/expired code.
- [ ] Google sign-in and callback; verify verified email and session persistence across reload.
- [ ] Password reset request, token use and replay rejection; logout and session revocation.
- [ ] Verify local identity upsert, profile save, companion, squad create/invite, task/habit access, cross-account and cross-squad rejection.
- [ ] Validate unverified sessions are blocked; test auth provider outage returns errors rather than a fabricated signed-out state.
- [ ] Verify production callback origin and secure cookies in Vercel preview and production separately.
- [ ] Security-review row-level access and database migration plan before any production rollout.

There is **no database migration in this PR**. Historic credential tables intentionally remain untouched to prevent accidental data loss.
