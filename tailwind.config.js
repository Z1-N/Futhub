/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        customYellow: '#FFD700',
      },
      boxShadow: {
        custom: '0 4px 6px rgba(0, 0, 0, 0.1)',
      },
      fontFamily: {
          roboto :['Roboto', 'sans-serif'],
          anton : ['Anton', 'sans-serif']
      },
    },
  },
  plugins: [],
}