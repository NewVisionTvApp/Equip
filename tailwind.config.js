/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          // Vibrant Lime / Leaf Green from Logo Wings
          lime: {
            50: '#f7fee7',
            100: '#ecfccb',
            200: '#d9f99d',
            300: '#bef264',
            400: '#a3e635',
            500: '#84cc16', // Primary Accent
            600: '#65a30d',
            700: '#4d7c0f',
            800: '#3f6212',
            900: '#365314',
          },
          // Deep Forest / Emerald Green from Lower Wings
          emerald: {
            700: '#047857',
            800: '#065f46', // Deep Emerald
            900: '#064e3b',
            950: '#022c22',
          },
          // Dark Foundation from Logo Backdrop
          dark: {
            800: '#111827',
            900: '#0f172a',
            950: '#0b0f17', // Rich Charcoal Base
          },
        },
      },
      fontFamily: {
        sans: ['Inter', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
