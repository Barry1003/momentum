export const typography = {
  display: { font: "var(--font-nunito)", weight: 800, size: "36px", lineHeight: "44px" },
  title: { font: "var(--font-nunito)", weight: 800, size: "28px", lineHeight: "36px" },
  heading: { font: "var(--font-dm-sans)", weight: 700, size: "20px", lineHeight: "28px" },
  body: { font: "var(--font-dm-sans)", weight: 400, size: "15px", lineHeight: "22px" },
  label: { font: "var(--font-dm-sans)", weight: 700, size: "14px", lineHeight: "20px" },
  meta: { font: "var(--font-dm-sans)", weight: 500, size: "12px", lineHeight: "18px" },
} as const;

export type TypographyToken = keyof typeof typography;
