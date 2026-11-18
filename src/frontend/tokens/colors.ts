export const colors = {
  text: "#251b36",
  textMuted: "#766e85",
  accent: "#6b46c9",
  accentStrong: "#4c319b",
  surface: "#ffffff",
  outline: "#e8e3f0",
  accentTint: "#efeafb",
  success: "#237f68",
  successTint: "#e8f7f1",
  warning: "#a96a27",
  warningTint: "#fff2e4",
  cream: "#f9f2e5",
} as const;

export const darkColors = {
  text: "#ffffff",
  textMuted: "#c8beeb",
  cardOnDark: "rgba(255, 255, 255, 0.08)",
} as const;

export const gradients = {
  appBackground: "linear-gradient(180deg, #f3effd 0%, #fcf8f3 100%)",
  primary: "linear-gradient(180deg, #9676e8 0%, #5c38ba 100%)",
} as const;

export type ColorToken = keyof typeof colors;
