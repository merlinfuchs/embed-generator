/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{js,jsx,ts,tsx}", "./docusaurus.config.ts"],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        // Brand palette derived from the logo (navy + azure), not Discord blurple.
        // Neutral grays close to Discord's own dark theme, accent stays azure.
        ink: {
          950: "#111214",
          900: "#1E1F22",
          800: "#2B2D31",
          700: "#313338",
          600: "#404249",
          500: "#4E5058",
        },
        // Accent between the logo azure and Discord blurple.
        azure: {
          300: "#A9BDFF",
          400: "#7E9BFF",
          500: "#5B7CF7",
          600: "#4A6AE3",
          700: "#3B55BF",
        },
        amber: {
          300: "#FFD27A",
          400: "#F5B544",
          500: "#E09B1F",
        },
        mist: {
          100: "#F2F3F5",
          300: "#DBDEE1",
          400: "#B5BAC1",
          500: "#949BA4",
        },
        // Discord semantic colors, used inside the message mockup only.
        discord: {
          bg: "#313338",
          embed: "#2B2D31",
          text: "#DBDEE1",
          muted: "#949BA4",
          link: "#00A8FC",
          button: "#5865F2",
          success: "#248046",
        },
      },
      fontFamily: {
        sans: [
          "Inter Variable",
          "Inter",
          "ui-sans-serif",
          "system-ui",
          "-apple-system",
          "Segoe UI",
          "Roboto",
          "sans-serif",
        ],
      },
      boxShadow: {
        card: "0 1px 0 0 rgba(255,255,255,0.04) inset, 0 20px 40px -24px rgba(0,0,0,0.6)",
      },
    },
  },
  plugins: [],
  corePlugins: {
    preflight: false,
  },
};
