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
          light: '#f3f4f6',
          primary: '#2563eb',
          dark: '#1e40af',
        }
      }
    },
  },
  plugins: [],
}