# F08 frontend foundation — preview only

This workstream is an interactive prototype to validate responsive navigation, hierarchy, and reusable frontend patterns, **not** sign-off on the final Figma composition. Do not treat it as a completed backend-integrated feature or production authentication flow.

## Included
- A responsive workspace shell with desktop sidebar and mobile bottom navigation.
- Accessible Home, Planner, Habits, and Squad navigation views.
- Typed presentational primitives: Button, Panel, ProgressMeter.
- In-memory sample task and habit interactions for rapid UI review.
- Clear preview/sample-data notice.

## Explicitly excluded
- Figma P09 Goal Details (still unapproved).
- Real account details, squad membership, check-ins, avatar models, XP/streak calculation, and API writes.
- Auth screens and account flows; F01 backend implementation PR is separate and unmerged.
- Local storage or simulated persistence. Refreshing resets preview changes.
- Production PWA offline behavior and notifications.

## Integration contract
- Replace in-component `initialTasks` and `initialHabits` with authenticated, scoped API reads after F03/F04 contracts are approved.
- Replace local checkbox handlers with optimistic mutations only when server authorization and idempotency are ready.
- Replace placeholder squad view with F02-authorized data.
- Keep navigation display logic separate from future route guards.
- Never calculate authoritative progress, XP, or streaks in a client component.

## Verification before merge
- Run `pnpm install --frozen-lockfile` when lockfile is available.
- Run `pnpm lint`, `pnpm typecheck`, `pnpm test`, `pnpm build`.
- Manually inspect 320, 390, 768, 1024, 1440, and 1920px widths.
- Test keyboard tab order, form submission, checkbox labels, skip link, and reduced-motion preference.
- Verify no write to database and no credentials in preview code.
- Compare spacing, typography, navigation, and component geometry with **approved** Figma screens before merging.
