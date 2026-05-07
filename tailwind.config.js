/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./index.html", "./src/renderer/**/*.{ts,tsx,js,jsx}"],
  theme: {
    extend: {
      colors: {
        dark: {
          800: "#121826",
          900: "#0b0f1a",
        },
        "panel-bg": "rgba(11, 15, 26, 0.7)",
      },
    }
  },
  plugins: []
};
