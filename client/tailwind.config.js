/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        'bg-deep':      '#07090F',
        'bg-card':      '#111827',
        'bg-surface':   '#1F2937',
        'accent-gold':  '#F59E0B',
        'accent-blue':  '#3B82F6',
        'accent-green': '#10B981',
        'accent-red':   '#EF4444',
      },
      fontFamily: {
        sans: ['-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
      },
      animation: {
        'score-bump': 'score-bump 0.4s cubic-bezier(0.34, 1.56, 0.64, 1)',
        'buzz-flash': 'buzz-flash 0.15s ease-in-out 3',
      },
    },
  },
  plugins: [],
};
