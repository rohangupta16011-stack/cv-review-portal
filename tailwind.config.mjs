/** @type {import('tailwindcss').Config} */
export default {
  content: ["./src/**/*.{astro,html,js,jsx,ts,tsx}"],
  theme: {
    extend: {
      colors: {
        teal: {
          DEFAULT: "#0D9488",
          50: "#F0FDFA",
          100: "#CCFBF1",
          500: "#14B8A6",
          600: "#0D9488",
          700: "#0F766E",
          800: "#115E59",
        },
        coral: {
          DEFAULT: "#FB7185",
          50: "#FFF1F2",
          400: "#FB7185",
          500: "#F43F5E",
        },
        cream: {
          DEFAULT: "#FFFBF5",
          50: "#FFFEFB",
          100: "#FFFBF5",
          200: "#FAF5EC",
        },
        ink: {
          DEFAULT: "#1F2937",
          500: "#6B7280",
          700: "#374151",
          900: "#111827",
        },
      },
      fontFamily: {
        sans: ["Inter", "system-ui", "sans-serif"],
        display: ["Fraunces", "Georgia", "serif"],
      },
      boxShadow: {
        soft: "0 1px 3px rgba(31,41,55,0.06), 0 8px 24px rgba(31,41,55,0.06)",
      },
    },
  },
  plugins: [],
};
