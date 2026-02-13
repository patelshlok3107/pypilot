import type { Config } from "tailwindcss";
import typography from "@tailwindcss/typography";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./lib/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  darkMode: "class",
  theme: {
    extend: {
      fontFamily: {
        display: ["var(--font-space-grotesk)", "sans-serif"],
        mono: ["var(--font-jetbrains-mono)", "monospace"],
      },
      colors: {
        brand: {
          50: "#edfdf9",
          100: "#d5f9ef",
          200: "#acf3de",
          300: "#72e9c8",
          400: "#2ed6a9",
          500: "#13bc90",
          600: "#089474",
          700: "#0b755e",
          800: "#0f5d4c",
          900: "#0f4d40"
        },
        accent: {
          500: "#f97316",
          600: "#ea580c",
          700: "#c2410c"
        },
        python: {
          blue: "#3776ab",
          blueLight: "#4b8bbe",
          blueDark: "#1f3f5b",
          yellow: "#ffd43b",
          yellowDark: "#d9b522",
        },
        glass: {
          100: "rgba(255, 255, 255, 0.1)",
          200: "rgba(255, 255, 255, 0.2)",
          300: "rgba(255, 255, 255, 0.3)",
          dark100: "rgba(0, 0, 0, 0.1)",
          dark200: "rgba(0, 0, 0, 0.2)",
          dark300: "rgba(0, 0, 0, 0.4)",
        },
        neon: {
          blue: "#00f3ff",
          purple: "#bc13fe",
          green: "#0aff60",
          pink: "#ff0099",
        },
        notebook: {
          paper: "#fdfbf7",
          line: "#e5e5e5",
          margin: "#fca5a5",
        }
      },
      boxShadow: {
        glow: "0 0 0 1px rgba(19, 188, 144, 0.25), 0 15px 35px rgba(8, 148, 116, 0.2)",
        "neon-blue": "0 0 10px rgba(0, 243, 255, 0.5), 0 0 20px rgba(0, 243, 255, 0.3)",
        "neon-purple": "0 0 10px rgba(188, 19, 254, 0.5), 0 0 20px rgba(188, 19, 254, 0.3)",
      },
      backgroundImage: {
        "grid-pattern": "linear-gradient(to right, #1f2937 1px, transparent 1px), linear-gradient(to bottom, #1f2937 1px, transparent 1px)",
        "notebook-lines": "repeating-linear-gradient(transparent, transparent 31px, #e5e5e5 31px, #e5e5e5 32px)",
      },
      keyframes: {
        floatUp: {
          "0%": { opacity: "0", transform: "translateY(16px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        pulseRing: {
          "0%, 100%": { transform: "scale(1)", opacity: "0.7" },
          "50%": { transform: "scale(1.05)", opacity: "1" },
        },
        drift: {
          "0%": { transform: "translateY(0px)", opacity: "0.2" },
          "50%": { transform: "translateY(-8px)", opacity: "0.5" },
          "100%": { transform: "translateY(0px)", opacity: "0.2" },
        },
        pageFlip: {
          "0%": { transform: "rotateY(0deg)", transformOrigin: "left" },
          "100%": { transform: "rotateY(-180deg)", transformOrigin: "left" },
        },
      },
      animation: {
        floatUp: "floatUp 500ms ease-out forwards",
        pulseRing: "pulseRing 2.4s ease-in-out infinite",
        drift: "drift 4s ease-in-out infinite",
        pageFlip: "pageFlip 0.6s ease-in-out forwards",
      },
    },
  },
  plugins: [typography],
};

export default config;
