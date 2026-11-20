// Checks names and URL shape without echoing environment secrets.
const base = process.env.NEON_AUTH_BASE_URL;
const secret = process.env.NEON_AUTH_COOKIE_SECRET;
const app = process.env.NEXT_PUBLIC_APP_URL;
const problems = [];
if (!base) problems.push("NEON_AUTH_BASE_URL is missing");
else {
  try {
    const url = new URL(base);
    if (url.protocol !== "https:" && !["localhost", "127.0.0.1"].includes(url.hostname)) {
      problems.push("NEON_AUTH_BASE_URL must use HTTPS");
    }
    if (!url.pathname.endsWith("/auth")) problems.push("NEON_AUTH_BASE_URL must be the Neon-managed /auth endpoint");
  } catch { problems.push("NEON_AUTH_BASE_URL is not a valid URL"); }
}
if (!secret || secret.length < 32) problems.push("NEON_AUTH_COOKIE_SECRET must be at least 32 characters");
if (!app) problems.push("NEXT_PUBLIC_APP_URL is missing");
else {
  try {
    const url = new URL(app);
    if (url.pathname !== "/" || url.search || url.hash) problems.push("NEXT_PUBLIC_APP_URL must be the application origin only");
  } catch { problems.push("NEXT_PUBLIC_APP_URL is not a valid URL"); }
}
if (problems.length) {
  for (const problem of problems) console.error("- " + problem);
  process.exitCode = 1;
} else console.log("Neon Auth environment shape OK; no live login was attempted.");
