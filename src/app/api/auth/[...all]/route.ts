import { getAuth } from "@/modules/auth/config";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  return getAuth().handler().GET(request);
}
export async function POST(request: Request) {
  return getAuth().handler().POST(request);
}
