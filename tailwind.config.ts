import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{js,ts,jsx,tsx,mdx}", "./components/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      fontFamily: {
        mono: ["ui-monospace", "SFMono-Regular", "Menlo", "monospace"],
      },
      colors: {
        ink: "#0e1116",
        paper: "#fafaf7",
        muted: "#5a6470",
        line: "#e3e3dc",
        accent: "#0a3431",
      },
    },
  },
  plugins: [],
};
export default config;
