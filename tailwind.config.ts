import type { Config } from 'tailwindcss'

/**
 * Design tokens. Bamboo lit against a dark stage (PRD §8), built out into a system
 * that can carry a whole interface.
 *
 * The signal colours keep exactly one meaning each (invariant 12):
 *   sounding  — a tube that is ringing
 *   yourPart  — the angklung you personally hold
 *   cue       — the conductor's next number, and nothing else
 *   muted     — a tube held silent under tengkep
 *
 * `ink` is new, and it exists to protect those meanings. Body text used to be
 * bamboo, so the instrument's own colour was also the colour of every paragraph —
 * which both hurt legibility and diluted the one thing bamboo is meant to say.
 * Text is now neutral warm white; bamboo means bamboo.
 */
const config: Config = {
  content: ['./app/**/*.{ts,tsx}', './components/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        // Surfaces, darkest to lightest. Depth comes from these plus borders —
        // drop shadows do not read on a near-black ground.
        stage: {
          DEFAULT: '#1B140E',
          deep: '#120D08',
          raised: '#251C13',
          hover: '#31251A',
          line: '#3D2E20',
          strong: '#54402C',
        },
        // Text. Warm, because everything on this page is lit by lamplight.
        ink: {
          DEFAULT: '#F7F0E4',
          muted: '#CDBFA9',
          faint: '#9A8B76',
          inverse: '#1B140E',
        },
        bamboo: {
          DEFAULT: '#C9A55C',
          light: '#E2C68B',
          dark: '#9A7C3D',
        },
        rattan: {
          DEFAULT: '#6B4A2B',
          light: '#8A6238',
        },
        sounding: {
          DEFAULT: '#F2DFA8',
          glow: '#FFF3CE',
        },
        yourPart: {
          DEFAULT: '#5E9E86',
          light: '#7FBFA6',
        },
        cue: {
          DEFAULT: '#D97B3A',
          light: '#EE9A5E',
        },
        muted: {
          DEFAULT: '#4A3D2E',
        },
      },
      /*
       * Three families, which is one more than a page normally earns. Recursive
       * is the exception and it is load-bearing: angklung numbers are the
       * conductor's language (invariant 12, and the padaeng numbering is the
       * user-facing identity), cents are compared column-against-column in
       * /laras, and both need tabular figures that do not shift width as they
       * change. Display and sans are one superfamily. Do not add a fourth.
       */
      fontFamily: {
        display: ['var(--font-display)', 'Georgia', 'serif'],
        sans: ['var(--font-sans)', 'system-ui', 'sans-serif'],
        mono: ['var(--font-mono)', 'ui-monospace', 'monospace'],
      },
      // Fluid scale. Phones get a readable size without a media query, and the
      // display sizes stay in proportion rather than collapsing.
      fontSize: {
        // step--2 is the label size: eyebrows, badges, figure captions, status
        // dots. It existed as a literal `text-[0.68rem]` in twenty places before
        // it existed as a token, which is how a scale stops being a scale.
        'step--2': ['clamp(0.7rem, 0.68rem + 0.1vw, 0.75rem)', { lineHeight: '1.45' }],
        'step--1': ['clamp(0.78rem, 0.76rem + 0.1vw, 0.84rem)', { lineHeight: '1.5' }],
        // Body starts at 1rem on the narrowest phone. Below 16px the measure is
        // legible but tiring, and this is a page people read standing up.
        'step-0': ['clamp(1rem, 0.96rem + 0.2vw, 1.06rem)', { lineHeight: '1.65' }],
        'step-1': ['clamp(1.13rem, 1.05rem + 0.4vw, 1.3rem)', { lineHeight: '1.55' }],
        'step-2': ['clamp(1.35rem, 1.2rem + 0.7vw, 1.7rem)', { lineHeight: '1.35' }],
        'step-3': ['clamp(1.65rem, 1.4rem + 1.2vw, 2.3rem)', { lineHeight: '1.2' }],
        'step-4': ['clamp(2rem, 1.5rem + 2.2vw, 3.2rem)', { lineHeight: '1.1' }],
        'step-5': ['clamp(2.5rem, 1.6rem + 4vw, 4.6rem)', { lineHeight: '1.03' }],
      },
      maxWidth: {
        // A comfortable measure. Prose wider than this is hard to track back.
        prose: '62ch',
        readable: '72ch',
      },
      borderRadius: {
        card: '0.875rem',
      },
      boxShadow: {
        // Light from above, the way a lamp over a rack would fall.
        raised: '0 1px 0 0 rgb(255 255 255 / 0.04) inset, 0 10px 30px -12px rgb(0 0 0 / 0.7)',
        lifted: '0 1px 0 0 rgb(255 255 255 / 0.06) inset, 0 22px 48px -20px rgb(0 0 0 / 0.85)',
      },
      transitionTimingFunction: {
        physical: 'cubic-bezier(0.2, 0.8, 0.25, 1)',
      },
    },
  },
  plugins: [],
}

export default config
