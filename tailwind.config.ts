import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        surface: {
          bg: "#0D0D0F",
          card: "#1A1A1E",
          border: "#333338",
        },
        coral: {
          DEFAULT: "#E85D5D",
          light: "#F28B8B",
          dark: "#C44444",
        },
        brand: {
          50: "#eef2ff",
          100: "#e0e7ff",
          200: "#c7d2fe",
          300: "#a5b4fc",
          400: "#818cf8",
          500: "#6366f1",
          600: "#4f46e5",
          700: "#4338ca",
          800: "#3730a3",
          900: "#312e81",
          950: "#1e1b4b",
        },
        sidebar: {
          bg: "#0D0D0F",
          hover: "#1A1A1E",
          active: "#1A1A1E",
          text: "#9999A1",
          "text-active": "#FFFFFF",
        },
      },
    },
  },
  plugins: [],
};

export default config;
