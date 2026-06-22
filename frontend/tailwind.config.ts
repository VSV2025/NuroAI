import type { Config } from "tailwindcss";

export default {
  darkMode: "class",
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        ink: {
          0: "#050505", // deep black
          1: "#0B0B0B", // secondary black
          2: "#111111", // dark gray
          3: "#181818",
        },
        silver: {
          DEFAULT: "#D9D9D9",
          dim: "#9A9A9A",
          bright: "#F2F2F2",
        },
        crimson: {
          bright: "#FF1E1E", // intelligence red
          DEFAULT: "#DC2626", // crimson
          deep: "#991B1B", // deep red
        },
      },
      fontFamily: {
        display: ['"Spectral"', "Georgia", "serif"],
        sans: ['"Inter"', "system-ui", "sans-serif"],
        mono: ['"JetBrains Mono"', "ui-monospace", "monospace"],
      },
      letterSpacing: {
        ultra: "0.28em",
      },
      boxShadow: {
        glow: "0 0 40px rgba(255,30,30,0.35)",
        "glow-sm": "0 0 18px rgba(255,30,30,0.28)",
        metal: "0 0 24px rgba(255,255,255,0.15)",
        bevel:
          "inset 0 1px 0 rgba(255,255,255,0.10), inset 0 -1px 0 rgba(0,0,0,0.6), 0 24px 60px -20px rgba(0,0,0,0.9)",
      },
      backgroundImage: {
        "metal-edge":
          "linear-gradient(135deg, rgba(255,255,255,0.22), rgba(255,255,255,0.02) 30%, rgba(0,0,0,0) 60%, rgba(255,255,255,0.06))",
        "crimson-sheen":
          "linear-gradient(135deg, #FF1E1E 0%, #DC2626 45%, #991B1B 100%)",
        "silver-sheen":
          "linear-gradient(135deg, #FFFFFF 0%, #D9D9D9 40%, #6f6f6f 70%, #D9D9D9 100%)",
      },
      keyframes: {
        "pulse-glow": {
          "0%, 100%": { opacity: "0.55", filter: "drop-shadow(0 0 6px rgba(255,30,30,0.4))" },
          "50%": { opacity: "1", filter: "drop-shadow(0 0 18px rgba(255,30,30,0.85))" },
        },
        scan: {
          "0%": { transform: "translateY(-110%)" },
          "100%": { transform: "translateY(110%)" },
        },
        shimmer: {
          "0%": { backgroundPosition: "-200% 0" },
          "100%": { backgroundPosition: "200% 0" },
        },
        float: {
          "0%, 100%": { transform: "translateY(0)" },
          "50%": { transform: "translateY(-8px)" },
        },
      },
      animation: {
        "pulse-glow": "pulse-glow 3.2s ease-in-out infinite",
        scan: "scan 3.5s linear infinite",
        shimmer: "shimmer 2.6s linear infinite",
        float: "float 6s ease-in-out infinite",
      },
    },
  },
  plugins: [],
} satisfies Config;
