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
          bg: "rgb(var(--surface-bg) / <alpha-value>)",
          card: "rgb(var(--surface-card) / <alpha-value>)",
          secondary: "rgb(var(--surface-secondary) / <alpha-value>)",
          border: "rgb(var(--surface-border) / <alpha-value>)",
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
          bg: "rgb(var(--sidebar-bg) / <alpha-value>)",
          hover: "rgb(var(--sidebar-hover) / <alpha-value>)",
          active: "rgb(var(--sidebar-active) / <alpha-value>)",
          text: "rgb(var(--sidebar-text) / <alpha-value>)",
          "text-active": "rgb(var(--sidebar-text-active) / <alpha-value>)",
        },
        foreground: {
          DEFAULT: "rgb(var(--foreground) / <alpha-value>)",
          secondary: "rgb(var(--foreground-secondary) / <alpha-value>)",
          muted: "rgb(var(--foreground-muted) / <alpha-value>)",
        },
      },
    },
  },
  plugins: [],
};

export default config;
