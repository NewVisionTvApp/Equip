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
        sans: ['"Inter"', '-apple-system', 'BlinkMacSystemFont', '"Segoe UI"', 'Roboto', 'system-ui', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'ui-monospace', 'SFMono-Regular', 'Menlo', 'monospace'],
      },
      transitionTimingFunction: {
        'apple-spring': 'cubic-bezier(0.16, 1, 0.3, 1)',
        'apple-bounce': 'cubic-bezier(0.34, 1.56, 0.64, 1)',
      },
      boxShadow: {
        'apple-card': '0 2px 10px -2px rgba(0, 0, 0, 0.04), 0 1px 2px rgba(0, 0, 0, 0.02)',
        'apple-card-hover': '0 12px 28px -6px rgba(0, 0, 0, 0.07), 0 2px 6px -1px rgba(0, 0, 0, 0.03)',
        'apple-float': '0 20px 40px -12px rgba(15, 71, 42, 0.25)',
      },
    },
  },
  plugins: [],
}
