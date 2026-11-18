import { getAuth } from "@/modules/auth/config";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Context = { params: Promise<{ all: string[] }> };

export async function GET(request: Request, context: Context) {
  return getAuth().handler().GET(request, context);
}
export async function POST(request: Request, context: Context) {
  return getAuth().handler().POST(request, context);
}
