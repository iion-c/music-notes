/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  darkMode: ['class', '[data-theme="dark"]'],
  theme: {
    extend: {
      colors: {
        desk: 'var(--desk)',
        panel: 'var(--panel)',
        raised: 'var(--raised)',
        line: 'var(--border)',
        'line-strong': 'var(--border-strong)',
        ink: 'var(--text)',
        muted: 'var(--muted)',
        accent: 'var(--accent)',
        'accent-ink': 'var(--accent-ink)',
        'accent-soft': 'var(--accent-soft)',
        danger: 'var(--danger)',
        'danger-soft': 'var(--danger-soft)',
        ok: 'var(--ok)',
      },
      fontFamily: {
        ui: ['Inter', 'system-ui', 'sans-serif', 'Noto Music'],
        hand: ['Caveat', 'cursive', 'Noto Music'],
        print: ['"Patrick Hand"', 'cursive', 'Noto Music'],
        serif: ['Literata', 'Georgia', 'serif', 'Noto Music'],
        music: ['"Noto Music"', 'serif'],
      },
      boxShadow: {
        paper: '0 1px 2px rgba(40,30,10,.08), 0 8px 24px -8px rgba(40,30,10,.18)',
        pop: '0 12px 32px -8px rgba(20,15,5,.28), 0 2px 6px rgba(20,15,5,.08)',
      },
    },
  },
  plugins: [],
};
