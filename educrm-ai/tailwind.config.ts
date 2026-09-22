import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        paper: "#F4F5F1",
        card: "#FFFFFF",
        ink: { DEFAULT: "#1D2733", soft: "#5B6673", faint: "#8A939E" },
        line: "#DDE0D8",
        brand: { DEFAULT: "#0F5E63", dark: "#0A4548", tint: "#E3EFEE" },
        amber: { DEFAULT: "#D9992B", tint: "#FBF1DC" },
        danger: { DEFAULT: "#B4432F", tint: "#F8E7E3" },
      },
      fontFamily: { sans: ["var(--font-onest)", "system-ui", "sans-serif"] },
    },
  },
  plugins: [],
};
export default config;
