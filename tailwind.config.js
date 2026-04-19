/** @type {import('tailwindcss').Config} */
// Paleta inspirada en CRISTASUR: plásticos brillantes, colores vivos pero cálidos
module.exports = {
  content: [
    './src/app/**/*.{js,jsx}',
    './src/components/**/*.{js,jsx}',
  ],
  theme: {
    extend: {
      colors: {
        // Azul marca - fresco, limpio
        brand: {
          50:  '#eff8ff',
          100: '#dbeefe',
          200: '#bfe1fe',
          300: '#93ccfd',
          400: '#60aefa',
          500: '#3b8ef6',
          600: '#2570eb',
          700: '#1d5bd6',
          800: '#1e4bad',
          900: '#1e4089',
        },
        // Naranja acento - energía, promociones
        accent: {
          50:  '#fff7ed',
          100: '#ffedd5',
          200: '#fed7aa',
          300: '#fdba74',
          400: '#fb923c',
          500: '#f97316',
          600: '#ea580c',
          700: '#c2410c',
          800: '#9a3412',
          900: '#7c2d12',
        },
      },
      fontFamily: {
        sans: ['ui-sans-serif', 'system-ui', '-apple-system', 'Segoe UI', 'Roboto', 'sans-serif'],
      },
      boxShadow: {
        card: '0 4px 20px -6px rgba(30,64,137,0.15)',
        'card-hover': '0 10px 40px -10px rgba(30,64,137,0.25)',
      },
      animation: {
        'fade-in-up': 'fadeInUp 0.5s ease-out',
      },
      keyframes: {
        fadeInUp: {
          '0%': { opacity: '0', transform: 'translateY(10px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
      },
    },
  },
  plugins: [],
}
