import { auth } from "@/modules/auth/managed";

export const runtime = "nodejs";

const handlers = auth.handler();

// The Neon SDK names its catch-all parameter "path". Momentum's existing
// public route is [...all]; translate the parameter without changing the URL.
type RouteContext = { params: Promise<{ all: string[] }> };
type NeonHandler = typeof handlers.GET;

function adapt(handler: NeonHandler) {
  return (request: Request, context: RouteContext) =>
    handler(request, {
      params: context.params.then(({ all }) => ({ path: all })),
    });
}

export const GET = adapt(handlers.GET);
export const POST = adapt(handlers.POST);
export const PUT = adapt(handlers.PUT);
export const PATCH = adapt(handlers.PATCH);
export const DELETE = adapt(handlers.DELETE);
