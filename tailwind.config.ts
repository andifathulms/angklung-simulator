import type { Config } from 'tailwindcss'

/** Palette per PRD §8. Bamboo lit against a dark stage. Never raw hex in components. */
const config: Config = {
  content: ['./app/**/*.{ts,tsx}', './components/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        stage: '#221B14',
        bamboo: '#C9A55C',
        rattan: '#6B4A2B',
        sounding: '#F2DFA8',
        yourPart: '#5E9E86',
        cue: '#D97B3A',
        muted: '#4A3D2E',
      },
      fontFamily: {
        display: ['var(--font-display)', 'Georgia', 'serif'],
        sans: ['var(--font-sans)', 'system-ui', 'sans-serif'],
        mono: ['var(--font-mono)', 'ui-monospace', 'monospace'],
      },
    },
  },
  plugins: [],
}

export default config
