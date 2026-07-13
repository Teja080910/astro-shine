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
        background: 'var(--background)',
        surface: 'var(--surface)',
        'surface-light': 'var(--surface-light)',
        'card-bg': 'var(--card-bg)',
        'card-border': 'var(--card-border)',
        'text-primary': 'var(--text-primary)',
        'text-secondary': 'var(--text-secondary)',
        'text-muted': 'var(--text-muted)',
        divider: 'var(--divider)',
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
