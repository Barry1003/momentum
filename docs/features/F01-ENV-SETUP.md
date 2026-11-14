# Momentum F01 — Environment setup and credential checklist

**Never upload credentials into chat or commit them to GitHub.** The committed file `.env.example` contains placeholders only.

## Local setup

1. Clone the repository; create your own ignored `.env.local` by copying `.env.example`.
2. Create a Neon **development** Postgres database, separate from production and automated test resources.
3. In Neon > Connection Details, copy the pooled connection string to `DATABASE_URL` and the direct/unpooled string to `DATABASE_URL_UNPOOLED`. Confirm TLS is enabled. Do not print full connection strings in logs.
4. Generate a strong secret locally with `openssl rand -base64 32` and set `BETTER_AUTH_SECRET` in your own local env. Use a different secret for production.
5. Set `BETTER_AUTH_URL=http://localhost:3000`. In Vercel set it to the deployed origin.
6. Create a Google OAuth *Web application* in Google Cloud Console. Add an authorized redirect URI `http://localhost:3000/api/auth/callback/google`, and later the production `https://YOUR-DOMAIN/api/auth/callback/google`. Set `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET` in the secret settings.
7. Create a Resend account, verify your sending domain, create an API key, and set `RESEND_API_KEY` and `AUTH_EMAIL_FROM` (a verified sender). Development email delivery will not work until the sender and API key are configured.
8. For Prisma CLI only, put `DATABASE_URL_UNPOOLED` in an ignored root `.env` (or load it safely in the CLI environment). Next.js reads `.env.local`; Prisma's `dotenv/config` currently reads `.env` by default.
9. Install dependencies with `pnpm install --frozen-lockfile`, then run `pnpm db:generate`, `pnpm db:validate`, and `pnpm dev`.
10. A migration is **not committed yet**. On a fresh dedicated development database, generate and review the Better Auth schema and Prisma migration with the pinned dependency versions, then run `pnpm db:migrate -- --name f01_auth_initial` only against that development database. Commit the reviewed migration in a separate change. Do not run production migrations without review.

## Vercel environment variables

Configure the same names in Project Settings > Environment Variables for Development, Preview, and Production as relevant, using independently scoped database credentials and secrets. Do not use a development database for production. Set `BETTER_AUTH_URL` to the exact origin for that environment and configure separate Google redirect URIs appropriately.

## Credentials and who provides them

| Variable | Provider | Required |
| --- | --- | --- |
| DATABASE_URL | Neon, pooled connection URL | Yes for runtime |
| DATABASE_URL_UNPOOLED | Neon, direct connection URL | Yes for migrations |
| BETTER_AUTH_SECRET | Generate yourself (`openssl rand -base64 32`) | Yes |
| BETTER_AUTH_URL | Your deployed app's origin | Yes |
| GOOGLE_CLIENT_ID | Google Cloud OAuth client | For Google login |
| GOOGLE_CLIENT_SECRET | Google Cloud OAuth client | For Google login |
| RESEND_API_KEY | Resend API key | For verification/password reset emails |
| AUTH_EMAIL_FROM | Your Resend-verified sending domain | For email |
| NEXT_PUBLIC_APP_URL | Public app origin | Optional |

No service can securely give ChatGPT your private credentials automatically from this GitHub repository. Never commit `.env.local` and never paste its values in a PR, issue, or chat.

## Verification checklist (requires isolated dev environment)

- [ ] Run reviewed migration on empty Neon *development* database only.
- [ ] Register email/password account and receive verification email.
- [ ] Verify email and then sign in.
- [ ] Sign in using Google with authorized callback.
- [ ] Sign out and confirm session revocation.
- [ ] Request a password reset (including unknown account) and test expiry/reuse behavior.
- [ ] Confirm `GET /api/me` denies unsigned/invalid sessions.
- [ ] Confirm `PATCH /api/me` refuses unknown fields and cannot modify another user.
- [ ] Prove rate limiting, anti-enumeration and concurrent requests.
- [ ] Never expose session tokens or secret values in logs.

## Limitations

This backend work is API-first. Frontend sign-in, registration and profile screens are deliberately reserved for approved Figma integration. The live end-to-end tests remain pending until Neon, Google and the email sender are configured.
