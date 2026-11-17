# F03b — Personal habits and daily logs

**Status:** Draft; **Issue:** #11. **Base:** feature/f03-goals-tasks.
Authentication code and live databases are untouched.

## API endpoints

| Method | Path | Operation |
| --- | --- | --- |
| GET/POST | `/api/habits` | List own habits; create habit |
| GET/PATCH/DELETE | `/api/habits/{id}` | View/update/archive owned habit |
| POST | `/api/habits/{id}/pause` | Pause without deleting history |
| POST | `/api/habits/{id}/resume` | Resume habit |
| PUT/DELETE | `/api/habits/{id}/logs/{YYYY-MM-DD}` | Set/clear daily progress |
| GET | `/api/habits/history?habitId=` | Owner's latest 50 logs |

## Models

- Habit: owner, optional goal/squad association, targetType CHECK/COUNT/DURATION, targetValue, reminders, paused/archived state.
- HabitLog: unique `(habitId,date)`; stores value and completion snapshot to avoid recomputing past logs after target edits.

## Security and consistency

- Only the owner can read, change or log a habit. Shared squad association does not grant squad members access to private habit logs.
- User ID is derived from the verified session, never client payload.
- Logging requires ACTIVE status; a PAUSED habit cannot log new progress. Paused days must not break future streak calculations.
- Calendar dates are validated, and future dates are rejected relative to the user's stored IANA timezone (UTC fallback).
- Daily PUT uses upsert for idempotent retry behavior; target completion is evaluated server-side.
- No XP is awarded yet; do not let a client set or report XP as authoritative.

## Deferred gates

- [ ] Recurrence/schedule modeling and reminders (next slice).
- [ ] Habit streak history and paused-day grace logic (F05).
- [ ] Shared habit status exposure only after privacy policy review.
- [ ] Real Neon transaction/migration review and two-user isolation tests.
- [ ] Rate limiting on write endpoints and explicit Idempotency-Key retention.
- [ ] XP ledger/event integration (F06), with first-completion source keys.
- [ ] Cursor pagination and wider date filters for large histories.

This is a stacked draft PR, not a production-ready release.
