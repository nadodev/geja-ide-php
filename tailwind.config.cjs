/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./index.html", "./src/renderer/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        panel: "#282a36",
        panelAlt: "#303341",
        border: "#44475a",
        accent: "#bd93f9",
        text: "#f8f8f2",
        muted: "#a4a8c2",
        success: "#50fa7b",
        warn: "#ffb86c",
        danger: "#ff5555"
      }
    }
  },
  plugins: []
};
