# Momentum branch strategy — four permanent branches

| Branch | Purpose | Merge policy |
|---|---|---|
| `main` | Stable and reviewed integration; eventual deployment source | PRs only, green CI, reviewer approval |
| `backend` | API, domain logic, data, server security, Prisma work | PR from backend to main after feature verified |
| `frontend` | Approved Figma screens, UI components, animation integration | PR from frontend to main after UI checks |
| `error-fixes` | Isolated bug reproduction and regression fixes | PR to main after verified fix |

## Rules

1. All four branches are created from the same baseline commit.
2. Keep shared changes small; merge reviewed PRs promptly to avoid drift.
3. Each substantial feature may use a **temporary** `feature/<slug>` branch based on the relevant workstream. The four branches above remain the permanent ones.
4. Never merge `frontend` or `backend` blindly into `main` with known failing CI.
5. Hotfixes start from the current `main`; after merge, update the workstream branches to avoid regressions.
6. `main` can be configured for branch protection/rulesets in the GitHub web UI; this cannot be enforced by local Git alone.
7. Do not automatically deploy the non-main branches to production. Configure Vercel preview vs production explicitly later.
