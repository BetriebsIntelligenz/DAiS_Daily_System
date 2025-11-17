import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: ["class"],
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        sans: [
          "Manrope",
          "Inter",
          "SF Pro Display",
          "system-ui",
          "sans-serif"
        ],
        future: ["Orbitron", "Manrope", "Inter", "sans-serif"]
      },
      colors: {
        daisy: {
          50: "#fffdea",
          100: "#fff7c2",
          200: "#ffe989",
          300: "#ffd149",
          400: "#ffb526",
          500: "#ff9a0a",
          600: "#db7404",
          700: "#b65507",
          800: "#8f3b0d",
          900: "#73300f"
        }
      },
      backgroundImage: {
        "dais-gradient":
          "linear-gradient(135deg, #fff7c2 0%, #ffd149 45%, #ff9a0a 100%)"
      },
      boxShadow: {
        soft: "0 30px 60px rgba(255, 186, 51, 0.25)",
        card: "0 20px 45px rgba(234, 196, 94, 0.35)"
      }
    }
  },
  plugins: [require("tailwindcss-animate")]
};

export default config;
