/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        forest: {
          50: '#f4faf6',
          100: '#e7f5ed',
          200: '#c3e6d3',
          300: '#94cfb0',
          400: '#5eaf85',
          500: '#3c9367', // primary brand green
          600: '#2b7852',
          700: '#216041',
          800: '#1a4c35',
          900: '#133928',
          950: '#0a2016'
        },
        slate: {
          950: '#0b0f19' // premium midnight dark mode background
        }
      },
      fontFamily: {
        sans: ['Outfit', 'Inter', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        'glass': '0 8px 32px 0 rgba(31, 38, 135, 0.07)',
        'glass-hover': '0 8px 32px 0 rgba(31, 38, 135, 0.12)',
      }
    },
  },
  plugins: [],
}
