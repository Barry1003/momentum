import { apiError, requiredUser, result } from "@/modules/squads/http";
import { SquadError } from "@/modules/squads/policy";
import { quoteFocus } from "@/modules/focus/service";
import { quoteSchema } from "@/modules/focus/validation";
export const runtime = "nodejs";

export async function GET(request: Request) {
  try {
    await requiredUser();
    const parsed = quoteSchema.safeParse(Object.fromEntries(new URL(request.url).searchParams));
    if (!parsed.success) throw new SquadError("INVALID_INPUT", 400, "Invalid focus length");
    return result(quoteFocus(parsed.data.seconds));
  } catch (error) { return apiError(error); }
}
