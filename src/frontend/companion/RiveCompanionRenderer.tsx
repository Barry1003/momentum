import type { CompanionRendererProps } from "./CompanionRenderer";

/**
 * Future renderer: a Rive (or Live2D) file whose state machine takes
 * `stage`, `reaction` and `outfit` inputs. Not implemented yet — once the
 * .riv asset exists, point companion/index.ts's ActiveCompanionRenderer
 * export here instead of PngCompanionRenderer. No screen needs to change.
 */
export function RiveCompanionRenderer(props: CompanionRendererProps) {
  void props;
  throw new Error("RiveCompanionRenderer is not implemented yet — use PngCompanionRenderer.");
}
