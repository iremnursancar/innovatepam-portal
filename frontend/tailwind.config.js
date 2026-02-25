/** @type {import('tailwindcss').Config} */
export default {
  darkMode: ['class'],
  content: [
    './index.html',
    './src/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        // Primary: Cyan
        primary: {
          DEFAULT: '#06b6d4',
          50:  '#ecfeff',
          100: '#cffafe',
          200: '#a5f3fc',
          300: '#67e8f9',
          400: '#22d3ee',
          500: '#06b6d4',
          600: '#0891b2',
          700: '#0e7490',
          800: '#155e75',
          900: '#164e63',
          950: '#083344',
        },
        // Accent: Emerald
        accent: {
          DEFAULT: '#10b981',
          50:  '#ecfdf5',
          100: '#d1fae5',
          200: '#a7f3d0',
          300: '#6ee7b7',
          400: '#34d399',
          500: '#10b981',
          600: '#059669',
          700: '#047857',
          800: '#065f46',
          900: '#064e3b',
          950: '#022c22',
        },
        // Dark Navy palette
        navy: {
          950: '#0a1929',
          900: '#0d2137',
          800: '#132f4c',
          700: '#1a3a57',
          600: '#1e4976',
          card: '#1a2332',
          border: '#2d3748',
        },
      },
      borderRadius: {
        lg: '0.5rem',
        md: '0.375rem',
        sm: '0.25rem',
      },
      boxShadow: {
        'glow-cyan':    '0 0 20px rgba(6,182,212,0.25)',
        'glow-emerald': '0 0 20px rgba(16,185,129,0.25)',
        'glow-blue':    '0 0 16px rgba(59,130,246,0.3)',
        'glow-amber':   '0 0 16px rgba(245,158,11,0.3)',
        'card-dark':    '0 4px 24px rgba(0,0,0,0.4)',
        'card-hover':   '0 8px 32px rgba(0,0,0,0.5)',
      },
      backgroundImage: {
        'navy-gradient': 'linear-gradient(135deg, #0a1929 0%, #132f4c 100%)',
      },
    },
  },
  plugins: [],
}
