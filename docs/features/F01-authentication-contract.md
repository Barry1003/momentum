# F01 — Identity, schema and authorization contract

**Status:** Draft for review. **Issue:** #2. **Architecture:** [ADR-001](../architecture/ADR-001-authentication.md).

## MVP user journeys

1. **Register with email:** validate input; create pending identity; send email verification; accept valid one-time link; create/profile-link only once; establish authenticated session; continue to squad onboarding.
2. **Google sign-in:** start from trusted origin, perform OAuth callback with provider checks, create or select canonical verified identity under documented linking policy, then continue to onboarding.
3. **Sign in with password:** validate with generic failures, enforce throttling, establish secure session; refuse squad access until email is verified.
4. **Recover password:** request a reset link with a generic response, validate token expiration and single-use, update credential, revoke/rotate sessions per verified Better Auth behavior, notify account owner.
5. **Sign out:** revoke current session; clear cookies; ensure subsequent protected request is unauthorized.
6. **Member onboarding:** authenticated user can create/update their profile, then create or join a squad (F02); existing member returns to their squad home.

## Identity and Prisma contract

Use the **exact schema produced by the selected, installed Better Auth release and its Prisma adapter**, reviewed before committing any migration. The following is a logical contract, not hand-authored Prisma models:

| Logical entity | Ownership | Required integrity |
| --- | --- | --- |
| User | Better Auth | Stable opaque primary ID, email uniqueness according to provider normalization, verified-email status, timestamps |
| Account | Better Auth | Foreign key to User, unique provider/account ID pair, password/OAuth credential details controlled by Better Auth |
| Session | Better Auth | Foreign key to User, unique hashed/opaque token or session identifier as supported, expiry index, revocation semantics |
| Verification | Better Auth | Expiring single-use verification/reset identifiers under library control |
| UserProfile (later) | Momentum | Unique `userId` foreign key to User; display name, optional unique case-normalized handle, timezone, preferences, avatar style |
| Squad / SquadMember (F02) | Momentum | Member user ID references canonical User, unique `(squadId,userId)`, explicit role and status |

Do not duplicate the auth user or store a password in UserProfile. Prefer database constraints for critical uniqueness and FK integrity. Define cascade/restrict/set-null operations explicitly after retention review. Avoid binding future avatar growth or XP to authentication Account or Session IDs.

### Profile fields (proposal)

- `userId` (canonical user FK, unique)
- `displayName` (required, 2–80 characters after normalization)
- `handleNormalized` (optional, globally unique if enabled; not accepted as a login identifier until separately designed)
- `timezone` (IANA name, e.g. `Africa/Lagos`; validated)
- `avatarArtStyle` (enum `SOFT_3D` or `ANIME`, independent of XP)
- `createdAt` and `updatedAt`

Avoid persisting sensitive mood/reflection or personal notes in the identity profile. Introduce an optional avatar record only when F06 needs it.

## Authorization matrix

| Resource/action | Visitor | Authenticated unverified | Verified member | Squad admin/owner |
| --- | --- | --- | --- | --- |
| Public landing and health | Allow | Allow | Allow | Allow |
| Register, verify, recover password | Allow with rate limits | Allow own verification | Limited account recovery | Limited account recovery |
| Read/update own profile | Deny | Restricted verification-only view | Allow own | Allow own |
| Read another user's private profile | Deny | Deny | Deny unless explicitly shared | Deny unless explicitly shared |
| Create squad | Deny | Deny | Allow | Allow |
| Read squad activity | Deny | Deny | Allow only for active membership in that squad | Allow only for active membership in that squad |
| Update own tasks/check-ins | Deny | Deny | Allow with squad and ownership checks | Allow with same ownership checks unless explicit elevated policy |
| Invite or remove squad member | Deny | Deny | Deny unless granted policy | Allow for authorized squad |
| Read another squad's records | Deny | Deny | Deny | Deny |

Never infer squad privileges from a user's global identity. Access to *shared* task/progress records is separate from access to *private* reflections. All business-layer APIs take the authenticated user ID from the server session, not caller-submitted user ID.

## Planned HTTP / server contracts (not implemented)

- Better Auth manages `/api/auth/*` under its configured Next.js route.
- `GET /api/me`: return own minimal user/profile data, no credential fields.
- `PATCH /api/me`: Zod-validated own profile update only.
- `DELETE /api/me`: postpone until account retention/deletion policy is approved.
- `GET /api/health`: remains non-authenticated and does not reveal database secrets.
- All auth errors are sanitized. Return 401 for missing/expired identity, 403 for valid identity without required permissions, 404 for inaccessible private resources if appropriate to avoid record enumeration, and 429 for rate limit.

## Threat cases and test matrix

| Test | Expected behavior |
| --- | --- |
| Unknown email in password reset | Same public response as known email; delivery side effects protected |
| Repeated invalid passwords | Throttled without leaking account existence |
| Unverified email attempting protected route | Denied access |
| Tampered, expired, signed-out or revoked session | 401, no data returned |
| OAuth callback with unexpected state, origin, redirect | Rejected |
| Link two accounts using matching unverified email | Never auto-linked |
| Duplicate concurrent profile creation | One profile per user, idempotent result |
| Invalid timezone/handle or excessive input size | 400 and no mutation |
| Member requesting foreign squad ID | Denied even when authenticated |
| Non-admin member changing squad membership | Denied |
| Password reset token reuse or expiry | Rejected |
| Account deletion or disconnection | No orphaned sensitive credentials; retention policy honored |

Test pure validation and role policies in Vitest; auth route integration using an isolated database and test email/OAuth mocks; browser-level Playwright flows after frontend screens are available.

## Neon database lifecycle

1. Use independent local/development, CI/test, and production resources or independently scoped Neon database branches.
2. Provision pooled runtime credentials and direct migration credentials separately. Never interpolate secrets into logs or code.
3. Generate the official Better Auth schema at the pinned version; inspect diff and indexes; create reviewed Prisma migration with `prisma migrate dev` on dev database only.
4. Run integration tests against a disposable branch/database; verify concurrency, cleanup, account recovery, and isolation.
5. Run `prisma migrate deploy` against production **only after** backup/recovery steps, migration review, and release approval.
6. Verify Prisma client generation and Next.js server-side adapter in CI without requiring production DB for static checks.

## Explicit pending product / operational decisions

- Whether new registrations are open to everyone or invite-only. **Proposed:** open accounts; only invited or creator members can enter squads.
- Email delivery service and sender domain; must support verification and reset before launch.
- Account linking policy for existing email/password and Google accounts.
- Data export, deletion, audit retention, and deletion effect on other members' history.
- Whether username sign-in is needed. **Proposed MVP:** email/password + Google, not username login.
- Session maximum age, reauthentication requirements for sensitive changes, email-change verification and MFA roadmap.
- Repository currently public; owner must choose public versus private visibility.

**Exit criterion:** Approve this contract and ADR, then create a separate F01 implementation PR. No migration is authorized by this draft alone.
