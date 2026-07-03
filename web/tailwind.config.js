/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        primary: '#6D28D9',
        'primary-light': '#9333EA',
        'primary-dark': '#5B21B6',
        secondary: '#7C3AED',
        'accent-gold': '#F59E0B',
        success: '#22C55E',
        warning: '#F97316',
        danger: '#EF4444',
        background: '#09090B',
        surface: '#111827',
        'surface-light': '#1F2937',
        'card-bg': 'rgba(255,255,255,0.08)',
        'card-border': 'rgba(255,255,255,0.12)',
        'text-primary': '#FFFFFF',
        'text-secondary': '#B6B6C2',
        'text-muted': '#71717A',
        divider: 'rgba(255,255,255,0.08)',
      },
      borderRadius: {
        button: '18px',
        card: '24px',
        modal: '20px',
        input: '16px',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
