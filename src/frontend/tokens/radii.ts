export const radii = {
  card: "24px",
  note: "20px",
  input: "20px",
  button: "26px",
  chip: "18px",
  tag: "12px",
} as const;

export type RadiusToken = keyof typeof radii;
