# Momentum merge-conflict diagnosis — 18 Nov 2026

## Verified pull request state

| PR | Source → Target | GitHub mergeability | Recommended action |
| --- | --- | --- | --- |
| #25 | feature/fe-habits → frontend | merged | No additional merge required. |
| #12 | feature/f03b-habits → feature/f03-goals-tasks | clean, draft | Do not retarget or merge into frontend: this is a legacy standalone backend branch with a different base. |
| #28 | integration/frontend-backend-core → frontend | **clean** | Use this as the canonical goals/tasks/habits integration path; merges onto frontend without reported text conflicts. |
| #26 | frontend → main | **clean** | Merge only after the release/integration review, preserving approved frontend. |
| #27 | feature/fe-goals → frontend | **clean** | Needs separate functionality review and integration with real goals endpoint; GUI-only mock XP must not overwrite the backend contract. |
| #3 | backend → main | **dirty** | Actual stale-base conflict; do not force-merge or overwrite frontend / auth models. Reconcile separately. |

These statuses were read from GitHub's pull request API, rather than inferred from individual branch histories.

## Source of confusion

- The UI Habits PR #25 was merged on **18 Nov 2026, 17:07 UTC**.
- The old F03b backend PR #12 remains stacked on F03, which itself is stacked on F02 and F01. Its merge base is much older than the current frontend.
- PR #28 is already based on the updated frontend (source commit `727651f454925a9620294deea99086c4906deab8`), and adds live habit/planning APIs and the adapters while retaining the Habits design.
- Re-merging the old F03b branch is redundant and invites conflicts in `prisma/schema.prisma` and `src/modules/habits/*`.
- PR #27 currently includes goal UI and sample/mocked XP and may conflict *functionally* with the live goals API even if GitHub labels it clean.

## Safe merge order

1. Preserve PR #25 history (already merged to frontend); do not merge it again.
2. Review PR #28 and its checks, schema migration, and explicit no-XP contract. If approved, merge **PR #28 into frontend** through normal PR review.
3. Re-evaluate PR #27 after #28 merges; reconcile goals UI with the live goals service and avoid client-side XP.
4. Merge the resulting `frontend` into `main` using PR #26 after full release checks. Do **not** combine `backend` PR #3 independently without reviewing overlapping auth/Prisma changes first.
5. Leave PRs #8, #10, and #12 as historical/stacked implementation references until a maintainer decides whether to close them as superseded. Avoid simultaneously merging their overlapping files.

## Verification gates

- `pnpm install --frozen-lockfile`
- `pnpm db:generate`
- `pnpm lint && pnpm typecheck && pnpm test && pnpm db:validate && pnpm build`
- Review the additive migration `prisma/migrations/20261118_planning_habits/migration.sql`; only apply to an approved isolated Neon development database first.
- Exercise habit add/log/undo/pause/resume and task completion with real two-user sessions; check privacy and ownership.
- Confirm a user without an active squad cannot view squad-only tasks or habits.
- Verify visual fidelity of the new Habits and Planner screens; keep existing assets and responsive layout.
- Confirm no duplicated Prisma models, API routes, or fake XP mutations survive.

**Decision:** GitHub does not currently report a textual merge conflict between the latest frontend and habit integration PR. The actionable fix is to stop the duplicate old-backend merge and use PR #28 as the single integration PR; PR #3 is the separate real Git conflict.
