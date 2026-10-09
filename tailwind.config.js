/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        deccan: {
          dark: "#0B0F12",
          card: "#12181F",
          cardLight: "#18212C",
          border: "#1E293B",
          cyan: "#00C2CB",
          cyanGlow: "rgba(0, 194, 203, 0.2)",
          accent: "#00B4D8",
          muted: "#94A3B8",
          paper: "#F8FAFC",
        },
      },
      fontFamily: {
        sans: ["var(--font-inter)", "sans-serif"],
        display: ["var(--font-outfit)", "sans-serif"],
      },
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
      }
    },
  },
  plugins: [],
};
