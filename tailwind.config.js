/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        // Dark navy/slate-ash ramp is the dominant surface. White is secondary.
        deep: '#1f2731',
        base: '#2b3340',
        surface: '#343d4b',
        'surface-2': '#3d4757',
        // Steel-periwinkle accent — used sparingly for emphasis + interactive.
        accent: {
          DEFAULT: '#7e9fda',
          deep: '#5573b8',
          soft: 'rgba(126, 159, 218, 0.5)',
        },
        steel: {
          DEFAULT: '#8aa6dd',
          deep: '#5573b8',
        },
        ink: '#eef1f7',
        muted: '#9aa3b4',
        hair: 'rgba(255, 255, 255, 0.09)',
        'hair-strong': 'rgba(255, 255, 255, 0.16)',
      },
      fontFamily: {
        display: ['"Space Grotesk"', 'system-ui', 'sans-serif'],
        sans: ['"Saira"', 'system-ui', 'sans-serif'],
      },
      letterSpacing: {
        tightest: '-0.04em',
      },
      maxWidth: {
        shell: '1200px',
      },
      boxShadow: {
        panel:
          'inset 0 1px 0 rgba(255,255,255,0.07), 0 1px 2px rgba(0,0,0,0.3), 0 16px 40px -18px rgba(0,0,0,0.6)',
        'panel-hover':
          'inset 0 1px 0 rgba(255,255,255,0.12), 0 2px 4px rgba(0,0,0,0.3), 0 28px 60px -22px rgba(0,0,0,0.75)',
        glow: '0 0 44px -10px rgba(126, 159, 218, 0.4)',
      },
      backgroundImage: {
        sheen: 'linear-gradient(135deg, #ffffff 0%, #cdd9f2 45%, #8aa6dd 100%)',
      },
      keyframes: {
        blink: {
          '0%, 49%': { opacity: '1' },
          '50%, 100%': { opacity: '0' },
        },
        drift: {
          '0%, 100%': { transform: 'translate3d(0,0,0) scale(1)' },
          '33%': { transform: 'translate3d(4%, -3%, 0) scale(1.08)' },
          '66%': { transform: 'translate3d(-3%, 4%, 0) scale(0.96)' },
        },
        'drift-slow': {
          '0%, 100%': { transform: 'translate3d(0,0,0) scale(1)' },
          '50%': { transform: 'translate3d(-5%, 5%, 0) scale(1.1)' },
        },
        marquee: {
          '0%': { transform: 'translateX(0)' },
          '100%': { transform: 'translateX(-50%)' },
        },
      },
      animation: {
        blink: 'blink 1.1s step-end infinite',
        drift: 'drift 26s ease-in-out infinite',
        'drift-slow': 'drift-slow 34s ease-in-out infinite',
        marquee: 'marquee 32s linear infinite',
      },
    },
  },
  plugins: [],
}
