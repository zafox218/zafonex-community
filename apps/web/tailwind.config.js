/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        void:    '#05060a',
        panel:   '#0c0f18',
        edge:    '#171c2b',
        neon:    { DEFAULT: '#00e5ff', soft: '#4df3ff', deep: '#0090a8' },
        plasma:  { DEFAULT: '#b026ff', soft: '#d17bff' },
        ember:   '#ff2e88',
        mint:    '#00ffa3',
      },
      fontFamily: {
        display: ['"Space Grotesk"', 'system-ui', 'sans-serif'],
        body: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'ui-monospace', 'monospace'],
      },
      boxShadow: {
        neon: '0 0 0 1px rgba(0,229,255,.25), 0 0 24px -6px rgba(0,229,255,.45)',
        plasma: '0 0 0 1px rgba(176,38,255,.25), 0 0 28px -6px rgba(176,38,255,.5)',
        lift: '0 18px 40px -22px rgba(0,0,0,.9)',
      },
      backgroundImage: {
        grid: 'linear-gradient(rgba(23,28,43,.7) 1px, transparent 1px), linear-gradient(90deg, rgba(23,28,43,.7) 1px, transparent 1px)',
        aurora: 'radial-gradient(60% 50% at 20% 0%, rgba(176,38,255,.18), transparent 60%), radial-gradient(50% 45% at 85% 10%, rgba(0,229,255,.16), transparent 60%)',
      },
      backgroundSize: { gridcell: '48px 48px' },
      keyframes: {
        float: { '0%,100%': { transform: 'translateY(0)' }, '50%': { transform: 'translateY(-6px)' } },
        pulseline: { '0%,100%': { opacity: '.4' }, '50%': { opacity: '1' } },
      },
      animation: {
        float: 'float 6s ease-in-out infinite',
        pulseline: 'pulseline 2.4s ease-in-out infinite',
      },
    },
  },
  plugins: [],
};
