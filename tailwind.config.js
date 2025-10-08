/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: "class",
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        // Brand Green Palette
        brand: {
          primary: "#2d4a2b",
          "primary-alt": "#4a6b47",
          secondary: "#5a8a4f",
          dark: "#1a2419",
          white: "#ffffff",
        },
        accent: {
          mint: "#7fb069",
          emerald: "#5a8a4f",
        },
        // Neutrals
        neutral: {
          white: "#ffffff",
          "off-white": "#f8f8f8",
          black: "#0f0f0f",
        },
        // Gray Scale
        gray: {
          charcoal: "#2c2c2c",
          slate: "#404040",
          ash: "#5a5a5a",
          mist: "#7a7a7a",
          fog: "#9a9a9a",
        },
      },
    },
  },
  plugins: [],
};
