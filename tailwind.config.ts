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
        // Basis: Warme, erdige Töne
        sand: {
          50: '#faf9f7',
          100: '#f2efe9',
          200: '#e8e4dc',
          300: '#d4cec3',
          400: '#b5aca0',
          500: '#9a9088',
          600: '#7a706a',
        },
        // Säule Bewegung: Grün-Töne
        movement: {
          100: '#dcfce7',
          200: '#bbf7d0',
          400: '#4ade80',
          500: '#22c55e',
          600: '#16a34a',
          700: '#15803d',
          800: '#166534',
          900: '#14532d',
        },
        // Säule Ernährung: Orange/Amber-Töne
        nutrition: {
          100: '#fef3c7',
          200: '#fde68a',
          400: '#fbbf24',
          500: '#f59e0b',
          600: '#d97706',
          700: '#b45309',
          800: '#92400e',
          900: '#78350f',
        },
        // Säule Rauchstopp: Blau-Töne
        smoking: {
          100: '#dbeafe',
          200: '#bfdbfe',
          400: '#60a5fa',
          500: '#3b82f6',
          600: '#2563eb',
          700: '#1d4ed8',
          800: '#1e40af',
          900: '#1e3a8a',
        },
      },
      fontFamily: {
        display: ['var(--font-display)', 'Georgia', 'serif'],
        body: ['var(--font-body)', 'Georgia', 'serif'],
      },
      typography: {
        DEFAULT: {
          css: {
            '--tw-prose-body': '#2d2926',
            '--tw-prose-headings': '#1a1714',
            '--tw-prose-links': '#b45309',
            '--tw-prose-bold': '#1a1714',
            '--tw-prose-hr': '#e8e4dc',
            '--tw-prose-quotes': '#6b6560',
            '--tw-prose-quote-borders': '#d4cec3',
            '--tw-prose-captions': '#9a9088',
            '--tw-prose-code': '#1a1714',
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
