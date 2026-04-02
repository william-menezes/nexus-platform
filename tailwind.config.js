/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './apps/web/src/**/*.{html,ts}',
    './libs/**/*.{html,ts}',
  ],
  theme: {
    extend: {
      fontFamily: {
        sans:    ['Manrope', 'system-ui', 'sans-serif'],
        display: ['Manrope', 'system-ui', 'sans-serif'],
        mono:    ['Inconsolata', 'monospace'],
      },
      colors: {
        primary: {
          DEFAULT: '#a63b00',
          50:  '#FFF5EE',
          100: '#FFDCC5',
          200: '#FFB990',
          500: '#a63b00',
          600: '#8B3100',
          700: '#6E2700',
        },
        secondary: {
          DEFAULT: '#8B5CF6',
          50:  '#F5F3FF',
          500: '#8B5CF6',
          600: '#7C3AED',
          700: '#6D28D9',
        },
        success: {
          DEFAULT: '#16A34A',
          50:  '#F0FDF4',
          500: '#16A34A',
          600: '#15803D',
          700: '#166534',
        },
        warning: {
          DEFAULT: '#D97706',
          50:  '#FFFBEB',
          500: '#D97706',
          600: '#B45309',
          700: '#92400E',
        },
        danger: {
          DEFAULT: '#DC2626',
          50:  '#FEF2F2',
          500: '#DC2626',
          600: '#B91C1C',
          700: '#991B1B',
        },
        surface: {
          DEFAULT: '#FFFFFF',
          muted:   '#F9FAFB',
          border:  '#E5E7EB',
        },
        text: {
          DEFAULT:   '#111827',
          secondary: '#6B7280',
          muted:     '#9CA3AF',
        },
      },
    },
  },
  plugins: [],
};
