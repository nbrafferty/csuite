import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        csuite: {
          bg: "#0D0D0F",
          surface: "#1A1A1E",
          card: "#22222A",
          "card-border": "#333338",
          coral: "#E85D5D",
          green: "#34C759",
          yellow: "#FFD60A",
          blue: "#5B8DEF",
          purple: "#A78BFA",
          "text-primary": "#FFFFFF",
          "text-secondary": "#999999",
          "text-muted": "#666666",
          "internal-note": "#2A2420",
          "internal-note-border": "#5C4A2E",
        },
      },
    },
  },
  plugins: [],
};

export default config;
