/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './views/**/*.ejs',
    './public/js/**/*.js'
  ],
  safelist: [
    'bg-emerald-500', 'bg-brand-600', 'bg-indigo-500', 'bg-amber-500',
    'from-emerald-500', 'from-brand-600', 'from-indigo-500', 'from-amber-500',
    'to-slate-900'
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: [
          '"Inter"',
          '"Noto Sans TC"',
          '-apple-system',
          'BlinkMacSystemFont',
          '"Segoe UI"',
          'Roboto',
          'sans-serif'
        ],
        display: ['"Inter"', '"Noto Sans TC"', 'sans-serif']
      },
      colors: {
        brand: {
          50:  '#f2f6ff',
          100: '#dde8ff',
          200: '#b8ccff',
          300: '#8ca9ff',
          400: '#5f84ff',
          500: '#3b63f5',
          600: '#2949d6',
          700: '#1f38a8',
          800: '#1a2d82',
          900: '#111d5c'
        },
        surface: {
          DEFAULT: '#f7f8fb',
          soft: '#eef0f6',
          dark: '#0b0d12'
        }
      },
      boxShadow: {
        card: '0 8px 24px rgba(17, 29, 92, 0.08)',
        glass: '0 8px 32px rgba(17, 29, 92, 0.12)'
      },
      borderRadius: {
        '2xl': '1.25rem',
        '3xl': '1.75rem'
      },
      backdropBlur: {
        xs: '2px'
      }
    }
  },
  plugins: []
};
