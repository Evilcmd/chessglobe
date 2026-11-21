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
        atlas: {
          bg: '#131722',
          surface: '#181d2a',
          card: '#1e2433',
          cardHover: '#252c3e',
          border: '#2b3347',
          borderLight: '#39425a',
          gold: '#e5a93c',
          goldHover: '#f59e0b',
          teal: '#10b981',
          tealDark: '#059669',
          danger: '#ef4444',
          muted: '#8e9bb0',
          text: '#f1f5f9'
        }
      }
    },
  },
  plugins: [],
}
