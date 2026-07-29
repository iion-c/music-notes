/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Matthew Portfolio — Dark Editorial / Vox-style palette
        'bg-primary':   '#0f0f0f',
        'bg-card':      '#181818',
        'bg-card-alt':  '#1f1f1f',
        'text-primary': '#f5f5f5',
        'text-muted':   '#9a9a9a',
        'accent-red':   '#ff3b30',
        'accent-yellow':'#f5c518',
        'border-subtle':'#2a2a2a',
      },
      fontFamily: {
        display: ['Balto', 'Inter', 'sans-serif'],
        editorial: ['Lato', 'Georgia', 'serif'],
        ui: ['IBM Plex Sans', 'system-ui', 'sans-serif'],
        mono: ['IBM Plex Mono', 'monospace'],
      },
      animation: {
        'fade-in-up':  'fadeInUp 0.7s ease forwards',
        'pulse-slow':  'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'marquee':     'marquee 25s linear infinite',
        'shimmer':     'shimmer 4s infinite linear',
        'spin-slow':   'spin 8s linear infinite',
        'blink':       'blink 1.5s ease-in-out infinite',
      },
      keyframes: {
        fadeInUp: {
          from: { opacity: '0', transform: 'translateY(24px)' },
          to:   { opacity: '1', transform: 'translateY(0)' },
        },
        marquee: {
          '0%':   { transform: 'translateX(0%)' },
          '100%': { transform: 'translateX(-50%)' },
        },
        shimmer: {
          '0%':   { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
        blink: {
          '0%, 100%': { opacity: '1' },
          '50%':      { opacity: '0.3' },
        },
      },
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
      },
    },
  },
  plugins: [],
}
