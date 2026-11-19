import { getAuth } from "@/modules/auth/config";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// The existing Next route is named [...all], while the Neon adapter
// expects the catch-all parameter to be named "path".
type Context = { params: Promise<{ all: string[] }> };
async function neonContext(context: Context) {
  const { all } = await context.params;
  return { params: Promise.resolve({ path: all }) };
}

export async function GET(request: Request, context: Context) {
  return getAuth().handler().GET(request, await neonContext(context));
}
export async function POST(request: Request, context: Context) {
  return getAuth().handler().POST(request, await neonContext(context));
}
