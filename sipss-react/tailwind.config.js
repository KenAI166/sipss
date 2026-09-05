/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        green: {
          500: '#22c55e',
          600: '#16a34a',
        },
        black: '#000000',
      },
    },
  },
  plugins: [],
}
