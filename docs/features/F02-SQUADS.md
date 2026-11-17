# F02 — Squads and membership implementation

**Status:** Implementation candidate for review. **Issue:** #7.
**Base:** feature/f01-auth-implementation. **Authentication:** unchanged.

## Included APIs

- `GET /api/squads`: list active memberships and public squad summary for the current verified user.
- `POST /api/squads`: create squad, automatically make creator OWNER; maxMembers 3–10 (initial squad may have one member).
- `GET/PATCH /api/squads/{id}`: private detail; owner/admin may rename/update description.
- `GET /api/squads/{id}/members`: active member directory, restricted to active members.
- `PATCH/DELETE /api/squads/{id}/members/{userId}`: change role/remove; admin may manage only members, owner may manage members/admins but may not directly remove or demote the owner.
- `POST /api/squads/{id}/leave`: member/admin leaves; OWNER must transfer first.
- `POST /api/squads/{id}/transfer-ownership`: current OWNER transfers to an active member; prior owner becomes ADMIN in the same transaction.
- `GET/POST /api/squads/{id}/invitations`: privileged list/create; new invitation returns raw code once, while only its SHA-256 is persisted.
- `GET /api/invitations/{code}`: public minimal preview (name, memberCount, full, available); possession of the unguessable code is required.
- `POST /api/invitations/{code}/accept`: verified user joins; idempotent for existing ACTIVE members; serializes joins using row locks and enforces capacity/usage.
- `DELETE /api/invitations/{id}`: close invitation by record ID; requires OWNER/ADMIN.

API responses use private no-store caching, uniform `{ error: { code, message } }` errors, and strict Zod request validation. The public invitation preview requires separate IP-based throttling before internet-facing deployment.

## Database models

- `Squad` (owner, name, description, maxMembers, status)
- `SquadMember` (role OWNER/ADMIN/MEMBER, status ACTIVE/LEFT/REMOVED, unique squadId/userId)
- `SquadInvitation` (codeHash, expiry, optional invited email, maxUses, uses, status)

All models reference canonical Better Auth `User.id`. No F01 files have been modified in this feature and no migration has been generated/applied.

## Safety invariants

- Every private read/write confirms active membership.
- Shared data does not become visible merely because the caller is authenticated.
- A squad always has one current owner; ownership transfer locks the squad record and updates both roles transactionally.
- Invitations use cryptographically secure unguessable codes; only a digest persists.
- Concurrent joins serialize on the squad row and then the invitation row, preventing over-capacity and overuse.
- A previously active membership replay is an idempotent success; a suspended/removed member can only rejoin using an eligible invitation under the current proposal.
- No UI or F01 code changes.

## Critical premerge verification

- [ ] Review F02 schema against the pinned Better Auth User model and produce a migration on an isolated Neon development database.
- [ ] Exercise all routes with two users in different squads; confirm cross-squad GET/PATCH/DELETE returns 404.
- [ ] Test parallel accepts on the last free slot (only one succeeds).
- [ ] Test parallel reuse of a one-use invitation (only one new member succeeds).
- [ ] Prove role restrictions, ownership transfer, last-owner leave block, removed-member access revocation.
- [ ] Add write-side idempotency keys and audit-log events in the next hardening PR.
- [ ] Configure abuse protection on public invitation preview (IP rate limit) and write endpoints.
- [ ] Verify runtime auth configuration and live Neon database separately; do not claim these paths work without integration tests.

This PR is stacked on feature/f01-auth-implementation for type compatibility. It must be rebased/retargeted onto backend only after F01 is resolved. It does not authorize a production migration.
