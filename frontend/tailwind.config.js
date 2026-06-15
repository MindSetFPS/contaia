/** @type {import('tailwindcss').Config} */
export default {
  darkMode: ["class"],
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: "#2563EB",
          foreground: "#FFFFFF",
        },
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
};
