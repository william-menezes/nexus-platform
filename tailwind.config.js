/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './apps/web/src/**/*.{html,ts}',
    './libs/**/*.{html,ts}',
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        // ── Design system tokens ──────────────────────────
        primary: {
          DEFAULT: 'var(--primary)',
          hover:   'var(--primary-hover)',
          50:      'var(--primary-50)',
          100:     'var(--primary-100)',
          200:     'var(--primary-200)',
          600:     'var(--primary-600)',
          700:     'var(--primary-700)',
        },
        ink:    { DEFAULT: 'var(--ink)',   2: 'var(--ink-2)' },
        muted:  { DEFAULT: 'var(--muted)', 2: 'var(--muted-2)' },
        line:   { DEFAULT: 'var(--line)',  2: 'var(--line-2)' },
        ok:     'var(--ok)',
        warn:   'var(--warn)',
        bad:    'var(--bad)',
        info:   'var(--info)',
        violet: 'var(--violet)',

        // ── Semantic surface aliases ───────────────────────
        // Used by app shell and table container Tailwind classes
        surface: {
          DEFAULT:  'var(--bg-elev)',     // bg-surface → card bg
          elevated: 'var(--bg-elev)',     // bg-surface-elevated
          page:     'var(--bg)',          // bg-surface-page
          border:   'var(--line)',        // border-surface-border
          hover:    'var(--primary-50)',  // bg-surface-hover
        },

        // ── Backward-compat aliases ───────────────────────
        // Old Tailwind color names mapped to new semantic tokens
        // so existing templates compile without changes.
        secondary: {
          DEFAULT: 'var(--violet)',
          50:      'var(--violet-bg)',
          500:     'var(--violet)',
          600:     'var(--violet)',
          700:     'var(--violet)',
        },
        success: {
          DEFAULT: 'var(--ok)',
          50:      'var(--ok-bg)',
          500:     'var(--ok)',
          600:     'var(--ok)',
          700:     'var(--ok)',
        },
        warning: {
          DEFAULT: 'var(--warn)',
          50:      'var(--warn-bg)',
          500:     'var(--warn)',
          600:     'var(--warn)',
          700:     'var(--warn)',
        },
        danger: {
          DEFAULT: 'var(--bad)',
          50:      'var(--bad-bg)',
          500:     'var(--bad)',
          600:     'var(--bad)',
          700:     'var(--bad)',
        },
      },

      fontFamily: {
        sans:    ['Inter', 'system-ui', 'sans-serif'],
        display: ['Inter', 'system-ui', 'sans-serif'],
        mono:    ['"IBM Plex Mono"', 'ui-monospace', 'Menlo', 'monospace'],
      },

      borderRadius: {
        xs:  'var(--r-xs)',
        sm:  'var(--r-sm)',
        DEFAULT: 'var(--r-sm)',
        md:  'var(--r-md)',
        lg:  'var(--r-lg)',
        xl:  'var(--r-xl)',
        '2xl': '20px',
      },

      boxShadow: {
        sm:   'var(--sh-sm)',
        md:   'var(--sh-md)',
        lg:   'var(--sh-lg)',
        hero: 'var(--sh-hero)',
      },
    },
  },
  plugins: [],
};
