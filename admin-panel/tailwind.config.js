/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        // Creamingo brand colors - matching the homepage theme
        primary: {
          50: '#fef7f0',
          100: '#fdeee0',
          200: '#fbd9c0',
          300: '#f8c196',
          400: '#f4a06a',
          500: '#f08b3e',
          600: '#e16d1a',
          700: '#bb5514',
          800: '#954418',
          900: '#783816',
        },
        secondary: {
          50: '#f8f5f0',
          100: '#f0e9dd',
          200: '#e1d2bb',
          300: '#d0b894',
          400: '#c1a170',
          500: '#b8945f',
          600: '#a67d4f',
          700: '#8b6542',
          800: '#72523a',
          900: '#5d4330',
        },
        chocolate: {
          50: '#faf8f6',
          100: '#f3f0eb',
          200: '#e6ddd1',
          300: '#d4c4b0',
          400: '#c1a88a',
          500: '#b8946f',
          600: '#a67d5a',
          700: '#8b6548',
          800: '#72523c',
          900: '#5d4332',
        },
        cream: {
          50: '#fefdfb',
          100: '#fdf9f3',
          200: '#faf2e6',
          300: '#f6e8d4',
          400: '#f1dcc0',
          500: '#ebcfa8',
          600: '#e2c08f',
          700: '#d6ae73',
          800: '#c99c5a',
          900: '#b88942',
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        'soft': '0 2px 15px -3px rgba(0, 0, 0, 0.07), 0 10px 20px -2px rgba(0, 0, 0, 0.04)',
        'soft-lg': '0 10px 25px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
      },
      borderRadius: {
        '2xl': '1rem',
        '3xl': '1.5rem',
      }
    },
  },
  plugins: [],
}
