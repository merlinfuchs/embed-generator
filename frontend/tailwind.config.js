module.exports = {
  content: ["./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        blurple: "#5865F2",
        green: "#57F287",
        yellow: "#FEE75C",
        fuchsia: "#EB459E",
        red: "#ED4245",

        "dark-1": "#18191c",
        "dark-2": "#1f2225",
        "dark-3": "#2e3136",
        "dark-4": "#36393e",
        "dark-7": "#71757d",
      },
      saturate: {
        75: ".75",
      },
      width: {
        128: "32rem",
        160: "40rem",
        192: "48rem",
        256: "64rem",
      },
    },
  },
  plugins: [],
};
