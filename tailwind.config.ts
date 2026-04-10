import type { Config } from 'tailwindcss'
import typography from '@tailwindcss/typography'

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        // =============================================
        // Kinetic Lab — Dark-Only palette
        // =============================================
        background:                  '#0e0e0e',
        'surface-container-lowest':  '#000000',
        'surface-container-low':     '#131313',
        'surface-container':         '#1a1919',
        'surface-container-high':    '#201f1f',
        'surface-container-highest': '#262626',
        'surface-variant':           '#262626',
        'surface-bright':            '#2c2c2c',
        primary:                     '#ff8f70',
        'primary-container':         '#ff7852',
        'primary-dim':               '#ff734c',
        secondary:                   '#fc7c7c',
        tertiary:                    '#eaa5ff',
        error:                       '#ff716c',
        'on-surface':                '#ffffff',
        'on-surface-variant':        '#adaaaa',
        'on-primary':                '#5c1300',
        'on-primary-container':      '#480d00',
        outline:                     '#767575',
        'outline-variant':           '#484847',
        'inverse-surface':           '#fcf9f8',
        'inverse-on-surface':        '#565555',
        'inverse-primary':           '#b22e00',

        // =============================================
        // Säule Bewegung — Grün
        // =============================================
        movement: {
          50:  '#f0fdf0',
          100: '#e0f5d4',
          200: '#b8e8a0',
          300: '#84d160',
          400: '#62bc44',
          500: '#40a02b',
          600: '#2e7520',
          700: '#1f5217',
          800: '#12360e',
          900: '#071d05',
        },

        // =============================================
        // Säule Ernährung — Orange
        // =============================================
        nutrition: {
          50:  '#fff4f0',
          100: '#fde8d4',
          200: '#fbc3a0',
          300: '#faa37a',
          400: '#fd8b50',
          500: '#fe640b',
          600: '#d44c08',
          700: '#ab3806',
          800: '#852804',
          900: '#5e1c02',
        },

        // =============================================
        // Säule Rauchstopp — Blau
        // =============================================
        smoking: {
          50:  '#eef4ff',
          100: '#dce8fd',
          200: '#afc9fb',
          300: '#82aaf9',
          400: '#5b91f7',
          500: '#1e66f5',
          600: '#1250c2',
          700: '#0c3c92',
          800: '#072a65',
          900: '#031b40',
        },
      },

      borderRadius: {
        DEFAULT: '0.125rem',
        sm:      '0.125rem',
        md:      '0.125rem',
        lg:      '0.25rem',
        xl:      '0.5rem',
        '2xl':   '0.5rem',
        '3xl':   '0.75rem',
        full:    '0.75rem',
      },

      fontFamily: {
        display:  ['var(--font-display)', 'Georgia', 'serif'],
        body:     ['var(--font-body)',    'Georgia', 'serif'],
        headline: ['var(--font-display)', 'Georgia', 'serif'],
        label:    ['var(--font-body)',    'sans-serif'],
      },

      typography: {
        DEFAULT: {
          css: {
            '--tw-prose-body':          '#ffffff',
            '--tw-prose-headings':      '#ffffff',
            '--tw-prose-links':         '#ff8f70',
            '--tw-prose-bold':          '#ffffff',
            '--tw-prose-hr':            '#484847',
            '--tw-prose-quotes':        '#adaaaa',
            '--tw-prose-quote-borders': '#484847',
            '--tw-prose-captions':      '#adaaaa',
            '--tw-prose-code':          '#ffffff',
            '--tw-prose-invert-body':          '#ffffff',
            '--tw-prose-invert-headings':      '#ffffff',
            '--tw-prose-invert-links':         '#ff8f70',
            '--tw-prose-invert-bold':          '#ffffff',
            '--tw-prose-invert-hr':            '#484847',
            '--tw-prose-invert-quotes':        '#adaaaa',
            '--tw-prose-invert-quote-borders': '#484847',
            '--tw-prose-invert-captions':      '#adaaaa',
            '--tw-prose-invert-code':          '#ffffff',
            fontFamily: 'var(--font-body), Georgia, serif',
            lineHeight: '1.75',
            maxWidth: 'none',
            h2: { fontFamily: 'var(--font-display), Georgia, serif' },
            h3: { fontFamily: 'var(--font-display), Georgia, serif' },
          },
        },
      },
    },
  },
  plugins: [typography],
}

export default config
