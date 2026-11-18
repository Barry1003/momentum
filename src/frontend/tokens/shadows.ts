export const shadows = {
  raised:
    "0 12px 28px rgba(37,27,54,.10), 0 1px 2px rgba(37,27,54,.05), inset 0 1px 0 rgba(255,255,255,.9)",
  floating:
    "0 20px 40px rgba(37,27,54,.20), 0 2px 4px rgba(37,27,54,.06), inset 0 1px 0 rgba(255,255,255,.9)",
  pressable:
    "0 10px 20px rgba(76,49,155,.38), inset 0 1.5px 0 rgba(255,255,255,.35), inset 0 -3px 0 rgba(37,27,54,.25)",
  pressableActive:
    "0 6px 12px rgba(76,49,155,.30), inset 0 1.5px 0 rgba(255,255,255,.35), inset 0 -3px 0 rgba(37,27,54,.25)",
  inset: "inset 0 2px 4px rgba(37,27,54,.10)",
} as const;

export type ShadowToken = keyof typeof shadows;
