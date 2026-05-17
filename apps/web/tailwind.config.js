/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'cin-blue': '#003366', // Exemplo de cor institucional
        'cin-red': '#cc0000',
      },
    },
  },
  plugins: [],
}
