import type { Config } from 'tailwindcss'
import typography from '@tailwindcss/typography'

const config: Config = {
  darkMode: 'class',
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        // =============================================
        // Catppuccin semantic tokens (CSS-var-based)
        // Switch automatically between Latte and Mocha
        // =============================================
        ctp: {
          rosewater: 'var(--ctp-rosewater)',
          flamingo:  'var(--ctp-flamingo)',
          pink:      'var(--ctp-pink)',
          mauve:     'var(--ctp-mauve)',
          red:       'var(--ctp-red)',
          maroon:    'var(--ctp-maroon)',
          peach:     'var(--ctp-peach)',
          yellow:    'var(--ctp-yellow)',
          green:     'var(--ctp-green)',
          teal:      'var(--ctp-teal)',
          sky:       'var(--ctp-sky)',
          sapphire:  'var(--ctp-sapphire)',
          blue:      'var(--ctp-blue)',
          lavender:  'var(--ctp-lavender)',
          text:      'var(--ctp-text)',
          subtext1:  'var(--ctp-subtext1)',
          subtext0:  'var(--ctp-subtext0)',
          overlay2:  'var(--ctp-overlay2)',
          overlay1:  'var(--ctp-overlay1)',
          overlay0:  'var(--ctp-overlay0)',
          surface2:  'var(--ctp-surface2)',
          surface1:  'var(--ctp-surface1)',
          surface0:  'var(--ctp-surface0)',
          base:      'var(--ctp-base)',
          mantle:    'var(--ctp-mantle)',
          crust:     'var(--ctp-crust)',
        },

        // =============================================
        // Surface scale — mapped to Catppuccin Latte
        // Dark equivalents via hardcoded dark: classes
        // (progressive migration to ctp-* planned)
        // =============================================
        sand: {
          50:  '#eff1f5', // Latte Base
          100: '#e6e9ef', // Latte Mantle
          200: '#dce0e8', // Latte Crust
          300: '#acb0be', // Latte Surface2
          400: '#8c8fa1', // Latte Overlay1
          500: '#7c7f93', // Latte Overlay2
          600: '#5c5f77', // Latte Subtext1
        },

        // =============================================
        // Säule Bewegung — Catppuccin Green
        // Latte: #40a02b  |  Mocha: #a6e3a1
        // =============================================
        movement: {
          100: '#e0f5d4',
          200: '#b8e8a0',
          400: '#62bc44',
          500: '#40a02b',
          600: '#2e7520',
          700: '#1f5217',
          800: '#12360e',
          900: '#071d05',
        },

        // =============================================
        // Säule Ernährung — Catppuccin Peach
        // Latte: #fe640b  |  Mocha: #fab387
        // =============================================
        nutrition: {
          100: '#fde8d4',
          200: '#fbc3a0',
          400: '#fd8b50',
          500: '#fe640b',
          600: '#d44c08',
          700: '#ab3806',
          800: '#852804',
          900: '#5e1c02',
        },

        // =============================================
        // Säule Rauchstopp — Catppuccin Blue
        // Latte: #1e66f5  |  Mocha: #89b4fa
        // =============================================
        smoking: {
          100: '#dce8fd',
          200: '#afc9fb',
          400: '#5b91f7',
          500: '#1e66f5',
          600: '#1250c2',
          700: '#0c3c92',
          800: '#072a65',
          900: '#031b40',
        },
      },

      fontFamily: {
        display: ['var(--font-display)', 'Georgia', 'serif'],
        body:    ['var(--font-body)',    'Georgia', 'serif'],
      },

      typography: {
        DEFAULT: {
          css: {
            '--tw-prose-body':          'var(--ctp-text)',
            '--tw-prose-headings':      'var(--ctp-text)',
            '--tw-prose-links':         'var(--ctp-peach)',
            '--tw-prose-bold':          'var(--ctp-text)',
            '--tw-prose-hr':            'var(--ctp-surface0)',
            '--tw-prose-quotes':        'var(--ctp-subtext0)',
            '--tw-prose-quote-borders': 'var(--ctp-surface1)',
            '--tw-prose-captions':      'var(--ctp-overlay1)',
            '--tw-prose-code':          'var(--ctp-text)',
            '--tw-prose-invert-body':          'var(--ctp-text)',
            '--tw-prose-invert-headings':      'var(--ctp-text)',
            '--tw-prose-invert-links':         'var(--ctp-peach)',
            '--tw-prose-invert-bold':          'var(--ctp-text)',
            '--tw-prose-invert-hr':            'var(--ctp-surface0)',
            '--tw-prose-invert-quotes':        'var(--ctp-subtext0)',
            '--tw-prose-invert-quote-borders': 'var(--ctp-surface1)',
            '--tw-prose-invert-captions':      'var(--ctp-overlay1)',
            '--tw-prose-invert-code':          'var(--ctp-text)',
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
