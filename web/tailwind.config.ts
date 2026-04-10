import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        /* ── Notion Design System ── */
        notion: {
          black: 'rgba(0,0,0,0.95)',
          blue: '#0075de',
          'blue-hover': '#005bab',
          'blue-light': '#62aef0',
          'blue-focus': '#097fe8',
          'warm-white': '#f6f5f4',
          'warm-dark': '#31302e',
          'warm-gray-500': '#615d59',
          'warm-gray-300': '#a39e98',
          'badge-bg': '#f2f9ff',
          'badge-text': '#097fe8',
          teal: '#2a9d99',
          green: '#1aae39',
          orange: '#dd5b00',
          pink: '#ff64c8',
          purple: '#391c57',
          brown: '#523410',
          navy: '#213183',
        },
        /* ── Primary = Notion Blue ── */
        primary: {
          50: '#f2f9ff',
          100: '#e0f2fe',
          200: '#bae6fd',
          300: '#7dd3fc',
          400: '#38bdf8',
          500: '#0ea5e9',
          600: '#0075de',
          700: '#005bab',
          800: '#075985',
          900: '#0c4a6e',
        },
        /* ── Secondary = Warm Neutral ── */
        secondary: {
          50: '#f6f5f4',
          100: '#eceae7',
          200: '#dbd8d4',
          300: '#a39e98',
          400: '#837d77',
          500: '#615d59',
          600: '#4b4743',
          700: '#3b3835',
          800: '#31302e',
          900: '#1e1c1b',
        },
      },
      fontFamily: {
        sans: [
          'Inter',
          'system-ui',
          '-apple-system',
          'BlinkMacSystemFont',
          'Segoe UI',
          'Roboto',
          'sans-serif',
        ],
        serif: [
          '"Noto Serif SC"',
          '"Songti SC"',
          'Georgia',
          'serif',
        ],
        mono: [
          '"SFMono-Regular"',
          'Menlo',
          'Monaco',
          'Consolas',
          '"Liberation Mono"',
          '"Courier New"',
          'monospace',
        ],
      },
      borderRadius: {
        notion: '8px',
        'notion-lg': '12px',
        'notion-xl': '16px',
      },
      boxShadow: {
        'notion-card':
          'rgba(0,0,0,0.04) 0px 4px 18px, rgba(0,0,0,0.027) 0px 2px 7.85px, rgba(0,0,0,0.02) 0px 0.8px 2.93px, rgba(0,0,0,0.01) 0px 0.175px 1.04px',
        'notion-deep':
          'rgba(0,0,0,0.01) 0px 1px 3px, rgba(0,0,0,0.02) 0px 3px 7px, rgba(0,0,0,0.02) 0px 7px 15px, rgba(0,0,0,0.04) 0px 14px 28px, rgba(0,0,0,0.05) 0px 23px 52px',
        'notion-hover':
          'rgba(0,0,0,0.06) 0px 6px 24px, rgba(0,0,0,0.04) 0px 3px 10px, rgba(0,0,0,0.03) 0px 1px 4px',
      },
      typography: (theme: any) => ({
        DEFAULT: {
          css: {
            color: '#37352f',
            fontFamily: theme('fontFamily.sans'),
            lineHeight: '1.7',
            a: {
              color: '#0075de',
              textDecoration: 'none',
              '&:hover': {
                textDecoration: 'underline',
              },
            },
            h1: {
              fontFamily: theme('fontFamily.serif'),
              color: 'rgba(0,0,0,0.95)',
              fontWeight: '700',
              letterSpacing: '-0.025em',
            },
            h2: {
              fontFamily: theme('fontFamily.serif'),
              color: 'rgba(0,0,0,0.95)',
              fontWeight: '700',
              letterSpacing: '-0.02em',
            },
            h3: {
              fontFamily: theme('fontFamily.serif'),
              color: 'rgba(0,0,0,0.95)',
              fontWeight: '700',
            },
            h4: {
              fontFamily: theme('fontFamily.serif'),
              color: 'rgba(0,0,0,0.95)',
              fontWeight: '700',
            },
            code: {
              fontFamily: theme('fontFamily.mono'),
              backgroundColor: '#f6f5f4',
              borderRadius: '4px',
              padding: '2px 5px',
              fontSize: '0.875em',
            },
            blockquote: {
              borderLeftColor: '#0075de',
              color: '#615d59',
              fontStyle: 'normal',
            },
            strong: {
              color: 'rgba(0,0,0,0.95)',
            },
          },
        },
        dark: {
          css: {
            color: '#c8c5c1',
            a: {
              color: '#62aef0',
              '&:hover': {
                color: '#7fc0f5',
              },
            },
            h1: { color: 'rgba(255,255,255,0.95)' },
            h2: { color: 'rgba(255,255,255,0.95)' },
            h3: { color: 'rgba(255,255,255,0.95)' },
            h4: { color: 'rgba(255,255,255,0.95)' },
            strong: { color: 'rgba(255,255,255,0.95)' },
            code: { color: 'rgba(255,255,255,0.85)', backgroundColor: '#2f2f2d' },
            blockquote: { color: '#a39e98', borderLeftColor: '#62aef0' },
          },
        },
      }),
    },
  },
  plugins: [require('@tailwindcss/typography')],
}

export default config
