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
        // One accent. Red does all the lifting (CCC design system).
        coral: {
          DEFAULT: "#d4473f", // primary accent
          light: "#e0635b",
          dark: "#a33530", // hover / pressed accent
        },
        // Legacy indigo `brand-*` palette re-pointed to the single red accent
        // so any remaining usages adopt the CCC look.
        brand: {
          50: "#fbeae9",
          100: "#f5cecb",
          200: "#eda9a4",
          300: "#e4837c",
          400: "#da5d54",
          500: "#d4473f",
          600: "#bd3f38",
          700: "#a33530",
          800: "#822a26",
          900: "#5f1f1c",
          950: "#3a1311",
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
      fontFamily: {
        display: ['"Poster Gothic ATF"', "Oswald", "Impact", "sans-serif"],
        label: [
          '"Acumin Pro Extra Condensed"',
          '"Saira Extra Condensed"',
          '"Barlow Condensed"',
          "sans-serif",
        ],
        sans: ['"Barlow"', '"Helvetica Neue"', "Arial", "sans-serif"],
      },
      letterSpacing: {
        display: "0.02em",
        label: "0.20em",
      },
      // Brand rule: never round above 8px. Cap the large radii so existing
      // rounded-xl / rounded-2xl usages snap to the crisp editorial corner.
      borderRadius: {
        sm: "4px",
        DEFAULT: "4px",
        md: "6px",
        lg: "8px",
        xl: "8px",
        "2xl": "8px",
        "3xl": "8px",
      },
      boxShadow: {
        sm: "0 2px 8px rgba(0,0,0,0.35)",
        DEFAULT: "0 6px 20px rgba(0,0,0,0.45)",
        md: "0 6px 20px rgba(0,0,0,0.45)",
        lg: "0 14px 40px rgba(0,0,0,0.55)",
        glow: "0 0 24px rgba(212,71,63,0.35)",
      },
      transitionTimingFunction: {
        ui: "cubic-bezier(0.22, 1, 0.36, 1)",
      },
    },
  },
  plugins: [],
};

export default config;
