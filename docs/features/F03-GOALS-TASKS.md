# F03 — Core goals and tasks API implementation

**Status:** Draft for review. **Issue:** #9. **Base:** `feature/f02-squads`.
This PR does not change authentication or any live database.

## Implemented scope

- Personal and shared goals: create, list, read, update, archive, complete.
- Shared-goal creator is an EDITOR by default; private goal belongs only to its owner.
- Shared goals require both current active squad membership and explicit GoalMember membership for reads; VIEWER cannot edit.
- Personal and squad-visible tasks: create, list, read, update, archive.
- Task assignment to current active squad members, with assignee-only completion.
- `POST /api/tasks/{id}/complete` idempotently upserts one completion per `(taskId, occurrenceDate)`.
- `DELETE /api/tasks/{id}/complete?occurrenceDate=YYYY-MM-DD` reopens that occurrence.
- Strict Zod validation and service-layer access rules; user identity always comes from the server session.
- Request body and responses use F02 error/safety handling.

## Supported endpoints

| Method | Path | Purpose |
| --- | --- | --- |
| GET, POST | /api/goals | List accessible goals or create |
| GET, PATCH, DELETE | /api/goals/{id} | View, edit, archive |
| POST | /api/goals/{id}/complete | Mark complete |
| GET, POST | /api/tasks | List accessible tasks or create |
| GET, PATCH, DELETE | /api/tasks/{id} | View, edit, archive |
| POST, DELETE | /api/tasks/{id}/complete | Complete or reopen one date occurrence |

The create APIs reject caller-supplied `ownerId` and restricted fields. Task update does not permit changing owner, assignee, squad or visibility. This avoids silent privilege escalation via PATCH.

## Deferred F03 work

- Task recurrence and future-only schedule edits.
- Milestones, goal activity and shared-goal member management.
- Bulk/comprehensive Planner query filtering and cursor pagination.
- Transactional XP awards and growth stage transitions (F06; currently returns xpAwarded: 0, no stage changes).
- Idempotency-Key persistence for creation requests and audit events.
- Isolated Neon integration tests and migration; no migration is committed or executed.

## Security and verification gates

- [ ] Validate F03 Prisma schema and TypeScript against the pinned F01 Better Auth version.
- [ ] Exercise multiple users/squads with a real disposable Neon database; enforce cross-squad isolation.
- [ ] Concurrent completion writes produce one record, with no duplicate side effects.
- [ ] Removed member cannot read task or goal in former squad.
- [ ] Shared-goal VIEWER cannot edit or complete unrelated tasks.
- [ ] Only assignee can mark an assigned task complete.
- [ ] Review all mutating paths for request-side idempotency before mobile offline sync.

This PR is stacked on F02, which is stacked on F01, and must not be merged to main until those dependencies and migrations are reviewed.
