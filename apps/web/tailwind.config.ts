import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: ["class"],
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./modules/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        /* shadcn semantic tokens — mapped to Linear values in globals.css */
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        chart: {
          "1": "hsl(var(--chart-1))",
          "2": "hsl(var(--chart-2))",
          "3": "hsl(var(--chart-3))",
          "4": "hsl(var(--chart-4))",
          "5": "hsl(var(--chart-5))",
        },

        /* Linear named palette — usable directly: bg-graphite, text-porcelain */
        "pitch-black": "hsl(var(--pitch-black))",
        "graphite": "hsl(var(--graphite))",
        "deep-slate": "hsl(var(--deep-slate))",
        "charcoal-grey": "hsl(var(--charcoal-grey))",
        "muted-ash": "hsl(var(--muted-ash))",
        "gunmetal": "hsl(var(--gunmetal))",
        "porcelain": "hsl(var(--porcelain))",
        "light-steel": "hsl(var(--light-steel))",
        "storm-cloud": "hsl(var(--storm-cloud))",
        "fog-grey": "hsl(var(--fog-grey))",
        "alabaster": "hsl(var(--alabaster))",
        "neon-lime": "hsl(var(--neon-lime))",
        "aether-blue": "hsl(var(--aether-blue))",
        "forest-green": "hsl(var(--forest-green))",
        "cyan-spark": "hsl(var(--cyan-spark))",
        "emerald": "hsl(var(--emerald))",
        "warning-red": "hsl(var(--warning-red))",
        "deep-violet": "hsl(var(--deep-violet))",
        "amethyst": "hsl(var(--amethyst))",
      },

      fontFamily: {
        sans: ["var(--font-inter)", "ui-sans-serif", "system-ui", "sans-serif"],
        mono: ["var(--font-mono)", "ui-monospace", "SFMono-Regular", "Menlo", "monospace"],
      },

      fontSize: {
        /* Linear type scale */
        caption: ["10px", { lineHeight: "1.4", letterSpacing: "-0.1px" }],
        body: ["14px", { lineHeight: "1.4", letterSpacing: "-0.13px" }],
        heading: ["24px", { lineHeight: "1.33", letterSpacing: "-0.22px" }],
        "heading-lg": ["48px", { lineHeight: "1.2", letterSpacing: "-0.22px" }],
        display: ["72px", { lineHeight: "1", letterSpacing: "-0.22px" }],
      },

      borderRadius: {
        /* shadcn radii */
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",

        /* Linear named radii */
        tags: "2px",
        cards: "6px",
        badges: "4px",
        inputs: "6px",
        buttons: "6px",
        pill: "9999px",
      },

      boxShadow: {
        /* Linear elevation tokens */
        "linear-sm": "rgba(0, 0, 0, 0.4) 0px 2px 4px 0px",
        "linear-md": "rgba(0, 0, 0, 0.2) 0px 0px 12px 0px inset",
        "linear-subtle": "rgb(35, 37, 42) 0px 0px 0px 1px inset",
        "linear-subtle-2": "rgba(0, 0, 0, 0.2) 0px 0px 0px 1px",
        "linear-xl": "rgba(8, 9, 10, 0.6) 0px 4px 32px 0px",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
};
export default config;
