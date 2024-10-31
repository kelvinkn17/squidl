import { nextui } from "@nextui-org/react";

/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
    "./node_modules/@nextui-org/theme/dist/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        athletics: ["Athletics", "sans-serif"],
      },
      colors: {
        primary: {
          DEFAULT: "#0d08e3",
          '50': '#e9f0ff',
          '100': '#d7e4ff',
          '200': '#b6ccff',
          '300': '#8ba9ff',
          '400': '#5d77ff',
          '500': '#3847ff',
          '600': '#1816ff',
          '700': '#0d08e3',
          '800': '#0e0dc6',
          '900': '#15179a',
          '950': '#0d0c5a',
        },
        purply: {
          DEFAULT: "#7b61ff",
          50: "#f3f2ff",
          100: "#e9e8ff",
          200: "#d5d4ff",
          300: "#b7b1ff",
          400: "#9385ff",
          500: "#7b61ff",
          600: "#5d30f7",
          700: "#4f1ee3",
          800: "#4218bf",
          900: "#37169c",
          950: "#200b6a",
        },
        "oasis-blue": "#2127FF",
        "light": "#E9ECFC",
        "light-white": "#F9F9FA"
      },
      borderRadius: {
        "4xl": "32px",
      },
    },
  },
  plugins: [nextui()],
  darkMode: "class",
};
