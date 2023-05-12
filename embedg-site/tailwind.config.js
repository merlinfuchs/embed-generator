/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{js,jsx,ts,tsx}", "./docusaurus.config.js"],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        blurple: "#5865F2",
        "blurple-dark": "#4650c7",
        green: "#57F287",
        yellow: "#FEE75C",
        fuchsia: "#EB459E",
        red: "#ED4245",
        "dark-1": "#18191c",
        "dark-2": "#1f2225",
        "dark-3": "#2e3136",
        "dark-4": "#36393e",
        "dark-5": "#3e4247",
        "dark-6": "#45494f",
        "dark-7": "#71757d",
      },
    },
  },
  plugins: [],
  corePlugins: {
    preflight: false,
  },
};
