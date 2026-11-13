/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  darkMode: 'class', // toggled by adding/removing the "dark" class on <html> (see ThemeContext)
  theme: {
    extend: {
      fontFamily: { sans: ['Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'] },
      colors: {
        brand: { 50: '#eef2ff', 100: '#e0e7ff', 500: '#6366f1', 600: '#4f46e5', 700: '#4338ca' },
      },
      keyframes: {
        'fade-up': { '0%': { opacity: 0, transform: 'translateY(8px)' }, '100%': { opacity: 1, transform: 'translateY(0)' } },
        'toast-in': { '0%': { opacity: 0, transform: 'translateY(12px) scale(.97)' }, '100%': { opacity: 1, transform: 'translateY(0) scale(1)' } },
        'sheet-up': { '0%': { transform: 'translateY(100%)' }, '100%': { transform: 'translateY(0)' } },
        'slide-in': { '0%': { transform: 'translateX(100%)' }, '100%': { transform: 'translateX(0)' } },
      },
      animation: {
        'fade-up': 'fade-up .25s ease-out both',
        'toast-in': 'toast-in .22s ease-out both',
        'sheet-up': 'sheet-up .25s ease-out both',
        'slide-in': 'slide-in .25s ease-out both',
      },
    },
  },
  plugins: [],
};
