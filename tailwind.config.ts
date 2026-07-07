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
          DEFAULT: "#da5245",
          light: "#e4706a",
          dark: "#b5382e",
        },
        brand: {
          50: "#fdecea",
          100: "#f9cfc9",
          200: "#f0a9a0",
          300: "#e78377",
          400: "#da5245",
          500: "#da5245",
          600: "#c44a3d",
          700: "#b5382e",
          800: "#8c2b23",
          900: "#631e18",
          950: "#3b1210",
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
        glow: "0 0 24px rgba(218,82,69,0.35)",
      },
      transitionTimingFunction: {
        ui: "cubic-bezier(0.22, 1, 0.36, 1)",
      },
    },
  },
  plugins: [],
};

export default config;
