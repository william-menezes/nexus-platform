/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './apps/web/src/**/*.{html,ts}',
    './libs/**/*.{html,ts}',
  ],
  theme: {
    extend: {
      fontFamily: {
        sans:    ['Inter', 'system-ui', 'sans-serif'],
        display: ['Inter', 'system-ui', 'sans-serif'],
        mono:    ['Inconsolata', 'monospace'],
      },
      colors: {
        primary: {
          DEFAULT: '#2563eb',
          50:  '#eff6ff',
          100: '#dbeafe',
          200: '#bfdbfe',
          300: '#93c5fd',
          400: '#60a5fa',
          500: '#3b82f6',
          600: '#2563eb',
          700: '#1d4ed8',
          800: '#1e40af',
          900: '#1e3a8a',
          950: '#172554',
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
          DEFAULT: 'var(--bg-card)',
          light:   'var(--bg-light)',
          muted:   '#F9FAFB',
          border:  'var(--border-color)',
        },
        text: {
          DEFAULT:   'var(--text-primary)',
          secondary: 'var(--text-secondary)',
          muted:     '#9CA3AF',
          inverse:   'var(--text-inverse)',
        },
      },
    },
  },
  plugins: [],
};
