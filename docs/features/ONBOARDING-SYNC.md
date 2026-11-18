# Onboarding frontend/backend integration (review candidate)

**Issue:** #21 · **Base:** frontend · **Scope:** today's approved onboarding and F01/F02 backend adapters.

## Screen to API mapping

| Screen | Action | Server boundary |
| --- | --- | --- |
| Splash `/` | Server identity and resume destination | GET /api/onboarding |
| Create account | Email/password registration; Google OAuth | Better Auth `/api/auth/*` |
| Verify email | Six-digit OTP, resend | Better Auth emailOTP plugin |
| Sign in | Email/password and Google | Better Auth session cookie |
| Can't get in | Password reset email/link | Better Auth request-password-reset |
| Reset password | New password with token | Better Auth resetPassword |
| Name | Save private display name | PATCH /api/onboarding {step:"name"} |
| Companion | Save style, look and name, stage CHILD/XP0 server-owned | PATCH /api/onboarding {step:"companion"} |
| Privacy | Informational step; do not infer consent or squad membership | No API side effect |
| Path | Persist solo/squad home preference | PATCH /api/onboarding {step:"path"} |
| Join/create | Secure invite preview/accept, create squad | F02 /api/squads, /api/invitations |
| Ready | Server validates name + companion + path + squad membership if selected | POST /api/onboarding/complete |
| Home | Verified session + completed onboarding required | Server layout guard |

## Persistence and safety

- User identity comes from the Better Auth server session only.
- Profile completion is server-owned; local/sessionStorage only retains harmless form drafts, not authentication or authorization.
- XP/stage are initialized by the server and are not accepted in onboarding input.
- Squad room access requires an actual active membership. Invite codes are cryptographically random 32-byte tokens; only digests are stored.
- The UX's previous `NORTH-4821` example was intentionally rejected: a 4-digit suffix is brute-forceable. Use token/link sharing.
- On auth/network failures, show errors; do not silently treat a failed backend as successful onboarding.
- `main` and `frontend` must not be overwritten directly.
- The existing Home/Planner/Habits contents remain **demo/mock data**. This integration does **not** connect F03/F03b/XP/notifications to live data; do not claim the full app is synchronized.
- Apple sign-in is not configured; its button is explicitly non-operational, not a fake provider success.
- Profile records and avatar art choices can be edited; stage progression and totalXP are server-owned and will be handled by F06.

## Important environment keys

Set `DATABASE_URL` (Neon pooled), `DATABASE_URL_UNPOOLED` (migration direct URL), `BETTER_AUTH_SECRET`, `BETTER_AUTH_URL`, `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `RESEND_API_KEY`, and `AUTH_EMAIL_FROM` in private environment settings. Use different test and production databases/keys; **never paste real URLs or keys into GitHub or chat**.

## Required integration and release gates

- [x] Generate an initial Prisma SQL migration draft offline (`prisma/migrations/20261118_onboarding_foundation/migration.sql`); no database connection was made.\n- [ ] Review generated identity models with Better Auth 1.7.24, SQL constraints, account linking, and permission semantics, then apply the migration in an isolated development Neon database. **No live migrations are performed by this PR.**
- [ ] Real registration, six-digit email verification, resend, session cookie, Google callback and password reset tests. Validate OTP auto sign-in behavior.
- [ ] Test reload-resume after NAME, COMPANION, PATH, SQUAD and COMPLETE, including private browsing and invalidated sessions.
- [ ] Test two users: solo onboarding, squad creation, invitation preview/accept, server capacity and role checks, and former-member revocation.
- [ ] Introduce request-id-based creation idempotency for squad creation; rate-limit public invitation previews.
- [ ] Confirm authentication errors/cookies, OAuth redirects, CSRF, email rate limits and session revocation in a real environment.
- [ ] Connect Home/Planner/Habits/XP to F03/F03b/F05/F06 in separate API adapter PRs; remove mock award events before release.
- [ ] Keep approved mobile/desktop design unchanged except for truthful error/availability states; run visual QA.

## Notes

This is a **draft integration**, not a claim that backend identity, Neon, or providers are operational. The branch imports F01 + F02 server files so the onboarding UI can compile with the same typed API and data models. Their original PRs remain independently reviewable.
