/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        // Brand palette (CLAUDE.md / spec Section 10)
        primary: '#1E3A5F',   // deep slate blue
        accent: '#2E7D7B',    // muted teal — positive states
        warning: '#B45309',   // restrained amber
        lowscore: '#991B1B',  // red — low scores
      },
      fontFamily: {
        sans: ['Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
