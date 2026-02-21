/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        background: '#050608',
        primary: '#FFD700',
        secondary: '#FF4B4B',
        surface: '#121212',
        text: '#F5F7FA',
      },
      fontFamily: {
        header: ['Oswald', 'Montserrat', 'sans-serif'],
        body: ['Inter', 'Roboto', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
