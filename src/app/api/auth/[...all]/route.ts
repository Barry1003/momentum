import { getManagedAuth } from "@/modules/auth/managed";

export const runtime = "nodejs";

type Method = "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
type RouteContext = { params: Promise<{ all: string[] }> };

/**
 * Neon SDK expects a catch-all "path"; Momentum's existing Next.js endpoint
 * uses "all". Resolve that difference without a URL or route rename.
 * Resolve the auth instance per request so CI builds need no runtime secrets.
 */
function adapt(method: Method) {
  return async (request: Request, context: RouteContext): Promise<Response> => {
    const handlers = getManagedAuth().handler();
    return handlers[method](request, {
      params: context.params.then(({ all }) => ({ path: all })),
    });
  };
}

export const GET = adapt("GET");
export const POST = adapt("POST");
export const PUT = adapt("PUT");
export const PATCH = adapt("PATCH");
export const DELETE = adapt("DELETE");
