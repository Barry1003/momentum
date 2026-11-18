# ADR-001 — Authentication architecture for Momentum

- **Status:** Proposed for review (not yet approved)
- **Date:** 2026-11-14
- **Issue:** #2
- **Scope:** F01 identity, credentials, sessions, account recovery, and database boundaries
- **Supersedes:** None

## Context

Momentum is a Next.js App Router + TypeScript modular monolith using Prisma 7 and Neon PostgreSQL. Authentication must support email/password and Google sign-in, secure sessions, recovery, and later squad-level authorization. F00 is awaiting merge via PR #3. The existing `prisma/schema.prisma` is a placeholder without identity models or migrations. No production database is connected.

## Decision proposed

Use **self-hosted Better Auth**, the official **Prisma adapter**, and Neon PostgreSQL as the **single identity authority**. Route Better Auth requests through the Next.js App Router on the server. Configure email/password plus Google OAuth. Keep credentials, password hashes, OAuth tokens and sessions under Better Auth-managed data models. All Momentum feature records reference the canonical auth user ID.

Do not implement a parallel homegrown password or session system. Do not treat a username as an alternate credential by default; unique handles are public-facing profile identifiers, not proof of identity.

## Alternatives considered

| Option | Strengths | Trade-offs | Assessment |
| --- | --- | --- | --- |
| Better Auth + Prisma on Neon | Auth within our Next.js app; consistent Prisma models; built-in email/password, OAuth and sessions; own deployment boundaries | Own secret management, email delivery, operational maintenance and account security | **Preferred** for control and integration |
| Neon Auth | Auth managed alongside Neon, built on Better Auth; less app-owned auth infrastructure | Hosted lifecycle, provider/feature configuration and service dependency to validate | Viable fallback; reconsider if maintenance becomes a constraint |
| Auth.js with Prisma | Established Next.js integration and OAuth support | Email/password credential/recovery workflow would need more product-specific security implementation | Not preferred for this MVP |
| Clerk or similar hosted identity | Managed sessions and UI, fast onboarding | External identity and pricing/vendor dependency, additional sync considerations | Viable if operational simplicity outweighs control |

This is a selection *proposal*, not permission to create migrations or live credentials. Confirm provider and version compatibility before F01 implementation.

## Identity lifecycle and invariants

1. An email/password account must use a verified email before accessing squads or protected features. Verification emails have bounded expiry and resend throttling.
2. Google login uses OAuth authorization-code flow with correct redirect URI and secure state/PKCE according to provider/library configuration. A verified Google identity may satisfy email verification subject to provider guarantees.
3. Account linking must never occur solely because an untrusted email string matches. Require current authenticated possession or Better Auth's explicitly documented trusted verified-provider controls; record any provider-specific policy.
4. All users have one canonical auth `User.id`. `Account`, `Session`, and verification records are owned by the chosen auth implementation; application profiles reference that user.
5. Session cookies use Secure in production, HttpOnly, appropriate SameSite, environment-specific domains, explicit expiration, rotation/revocation where supported, and no secrets in browser-visible env variables.
6. For logout, revoke the relevant persisted session and expire the browser cookie. Password resets revoke older sessions if available; explicitly test the actual Better Auth version behavior.
7. A disabled/deleted account must lose access. Deletion/export policy and retention of squad history require product/legal approval before implementing deletion.
8. Never permit an unverified/uninvited user to read another squad's personal content. Every squad-scoped query checks membership server-side.
9. Do not store Google access/refresh tokens in Momentum feature tables, expose them to the frontend, or write them to logs.

## Proposed Next.js boundaries

- `src/modules/auth/config.ts`: Better Auth server configuration and adapter wiring (server-only).
- `src/app/api/auth/[...all]/route.ts`: Better Auth route handler.
- `src/modules/auth/session.ts`: server-only `requireUser` helper.
- `src/modules/users/`: profile business rules and authorization.
- `src/db/client.ts`: Prisma 7 client and Neon adapter (server-only).
- `src/modules/squads/permissions.ts` (F02): membership-scoped read/write checks.

Use `auth.api.getSession` with request headers (subject to installed Better Auth version). Never authorize access based only on client-provided user/squad IDs.

## Neon connectivity and environment separation

Use **distinct development, test and production databases or isolated Neon branches with independently scoped credentials**. Never run test migrations against production.

- `DATABASE_URL`: Neon runtime connection (pooled where compatible with selected Prisma 7 driver adapter).
- `DATABASE_URL_UNPOOLED`: direct Neon connection for migration operations via `prisma.config.ts`.
- `BETTER_AUTH_SECRET`: strong server-only random secret, distinct per environment.
- `BETTER_AUTH_URL`: validated canonical deployment origin.
- `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET`: server-side Google OAuth credentials.
- Email verification/reset delivery: provider API key or SMTP creds; approve provider and failure handling before activation.

Use .env.example placeholders, ignored local env files, and Vercel environment-scoped secrets. Review the current Prisma 7 + Neon adapter documentation and final installed versions before implementing client initialization.

## Security design

- Rate-limit registration, login failures, password reset requests, verification resends and callback endpoints; avoid distinct error messages that reveal whether an email exists.
- Validate profile updates with Zod and enforce length limits. Define username case-folding and uniqueness before adding handle registration.
- Anti-CSRF / trusted origins and redirect validation follow Better Auth controls; never accept arbitrary callback URLs or open redirects.
- Cookies, API logs and responses must not contain passwords, session tokens, OAuth tokens or connection strings.
- Apply least privilege: a member can read/update own profile, a squad member can read only authorized squad data, and owners/admins may manage membership through explicit role checks. Authentication alone does not confer squad access.
- Centralize session checking in server-side functions and test cross-squad access with a real isolated test database.
- Audit admin/member-impacting actions without recording sensitive credentials.

## Acceptance gate before schema implementation

- [ ] Auth provider decision reviewed and accepted.
- [ ] Current Better Auth + Prisma 7 adapter/version compatibility independently verified.
- [ ] Provider configuration for Google and email verified using test credentials.
- [ ] Data model/constraints reviewed, including deletion and account-linking behavior.
- [ ] Dev/test/prod Neon separation confirmed; secrets provided only through secure settings.
- [ ] Authorization matrix and abuse/test cases approved.
- [ ] Separate implementation PR on backend created, migrations reviewed and validated first in isolated development DB.

## References

- Better Auth: https://www.better-auth.com/docs
- Better Auth Prisma integration: https://www.better-auth.com/docs/adapters/prisma
- Better Auth email/password: https://www.better-auth.com/docs/authentication/email-password
- Better Auth Google: https://www.better-auth.com/docs/authentication/google
- Neon Prisma guide: https://neon.com/docs/guides/prisma
- Repository issue: https://github.com/Barry1003/momentum/issues/2

> Important: This ADR proposes architecture only. No auth code, databases, migrations, or secrets were created by this document.
