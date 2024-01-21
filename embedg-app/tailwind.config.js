/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx,ts,tsx}"],
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
      height: {
        128: "32rem",
        160: "40rem",
        192: "48rem",
        256: "64rem",
      },
      width: {
        18: "4.5rem",
        128: "32rem",
        160: "40rem",
        192: "48rem",
        256: "64rem",
      },
      scale: {
        101: "1.01",
      },
    },
  },
  plugins: [],
};
