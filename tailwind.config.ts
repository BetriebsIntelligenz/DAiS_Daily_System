import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: ["class"],
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        sans: [
          "Space Grotesk",
          "Inter",
          "SF Pro Display",
          "system-ui",
          "sans-serif"
        ],
        future: ["Space Grotesk", "Inter", "sans-serif"],
        arcade: ["'Press Start 2P'", "Space Grotesk", "sans-serif"]
      },
      colors: {
        daisy: {
          50: "#fff5ff",
          100: "#ffe5fb",
          200: "#ffc7f3",
          300: "#ff9edc",
          400: "#ff75bd",
          500: "#ff4f92",
          600: "#e73a7e",
          700: "#c12864",
          800: "#8f1d4c",
          900: "#691437"
        },
        lagoon: {
          50: "#eefcff",
          100: "#c9f5ff",
          200: "#9ce5ff",
          300: "#6cd1ff",
          400: "#3ab2ff",
          500: "#1b8ddf",
          600: "#146eb0",
          700: "#0e4f80",
          800: "#093454",
          900: "#041f34"
        },
        meadow: {
          50: "#eafdf3",
          100: "#c1f5da",
          200: "#8decbc",
          300: "#57dd99",
          400: "#29c27d",
          500: "#17a26b",
          600: "#0f8054",
          700: "#0a5c3c",
          800: "#053c27",
          900: "#022318"
        }
      },
      backgroundImage: {
        "dais-gradient":
          "linear-gradient(135deg, #ff9edc 0%, #ffc764 45%, #6cd1ff 100%)",
        "pixel-landscape": "url('/retro-landscape.svg')"
      },
      boxShadow: {
        soft: "0 28px 60px rgba(255, 154, 211, 0.35)",
        card: "0 14px 35px rgba(56, 92, 157, 0.25)",
        arcade: "0 25px 50px rgba(18, 27, 64, 0.55)",
        "arcade-inset": "inset 0 -4px 0 rgba(255,255,255,0.25), inset 0 4px 0 rgba(0,0,0,0.1)"
      }
    }
  },
  plugins: [require("tailwindcss-animate")]
};

export default config;
