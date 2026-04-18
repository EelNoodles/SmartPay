/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './views/**/*.ejs',
    './public/js/**/*.js'
  ],
  safelist: [
    'bg-emerald-500', 'bg-brand-600', 'bg-indigo-500', 'bg-amber-500',
    'from-emerald-500', 'from-brand-600', 'from-indigo-500', 'from-amber-500',
    'to-slate-900',
    'animation-delay-0', 'animation-delay-75', 'animation-delay-150',
    'animation-delay-200', 'animation-delay-300', 'animation-delay-500'
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
        glass: '0 8px 32px rgba(17, 29, 92, 0.12)',
        glow:  '0 10px 40px -10px rgba(59, 99, 245, 0.55)'
      },
      borderRadius: {
        '2xl': '1.25rem',
        '3xl': '1.75rem'
      },
      backdropBlur: {
        xs: '2px'
      },
      backgroundImage: {
        'grid-soft':
          "linear-gradient(rgba(17,29,92,.04) 1px, transparent 1px), linear-gradient(90deg, rgba(17,29,92,.04) 1px, transparent 1px)"
      },
      backgroundSize: {
        'grid-sm': '24px 24px'
      },
      animation: {
        'fade-up':   'fadeUp .55s cubic-bezier(.22,1,.36,1) both',
        'fade-in':   'fadeIn .5s ease-out both',
        'pop':       'pop .4s cubic-bezier(.22,1,.36,1) both',
        'blob':      'blob 16s ease-in-out infinite',
        'shine':     'shine 2.8s ease-in-out infinite',
        'pulse-soft':'pulseSoft 2.4s ease-in-out infinite',
        'spin-slow': 'spin 6s linear infinite'
      },
      keyframes: {
        fadeUp: {
          '0%':   { opacity: '0', transform: 'translateY(14px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' }
        },
        fadeIn: {
          '0%':   { opacity: '0' },
          '100%': { opacity: '1' }
        },
        pop: {
          '0%':   { opacity: '0', transform: 'scale(.92)' },
          '100%': { opacity: '1', transform: 'scale(1)' }
        },
        blob: {
          '0%,100%': { transform: 'translate(0,0) scale(1)' },
          '33%':     { transform: 'translate(26px,-18px) scale(1.08)' },
          '66%':     { transform: 'translate(-22px,14px) scale(.94)' }
        },
        shine: {
          '0%':   { transform: 'translateX(-140%) skewX(-12deg)' },
          '55%':  { transform: 'translateX(160%)  skewX(-12deg)' },
          '100%': { transform: 'translateX(160%)  skewX(-12deg)' }
        },
        pulseSoft: {
          '0%,100%': { opacity: '1' },
          '50%':     { opacity: '.55' }
        }
      }
    }
  },
  plugins: [
    function ({ addUtilities }) {
      addUtilities({
        '.animation-delay-0':   { 'animation-delay': '0ms'   },
        '.animation-delay-75':  { 'animation-delay': '75ms'  },
        '.animation-delay-150': { 'animation-delay': '150ms' },
        '.animation-delay-200': { 'animation-delay': '200ms' },
        '.animation-delay-300': { 'animation-delay': '300ms' },
        '.animation-delay-500': { 'animation-delay': '500ms' },
        '.text-balance':  { 'text-wrap': 'balance' },
        '.text-gradient-brand': {
          'background': 'linear-gradient(135deg,#5f84ff 0%,#1f38a8 100%)',
          '-webkit-background-clip': 'text',
          'background-clip': 'text',
          'color': 'transparent'
        }
      });
    }
  ]
};
