import type { Config } from 'tailwindcss';

const config: Config = {
  darkMode: 'class',
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    '../../packages/*/src/**/*.{js,ts,jsx,tsx}'
  ],
  theme: {
    extend: {
      colors: {
        darkBg: '#0B0E14',
        darkCard: '#131720',
        darkElevated: '#1B212D',
        alice: {
          light: '#FB7185',
          DEFAULT: '#F43F5E',
          dark: '#E11D48',
          border: 'rgba(244, 63, 94, 0.3)',
          glow: 'rgba(244, 63, 94, 0.15)'
        },
        bob: {
          light: '#38BDF8',
          DEFAULT: '#0284C7',
          dark: '#0369A1',
          border: 'rgba(56, 189, 248, 0.3)',
          glow: 'rgba(56, 189, 248, 0.15)'
        },
        measure: {
          light: '#34D399',
          DEFAULT: '#10B981',
          dark: '#059669',
          border: 'rgba(16, 185, 129, 0.3)',
          glow: 'rgba(16, 185, 129, 0.15)'
        },
        quantum: {
          primary: '#22D3EE',
          secondary: '#818CF8',
          accent: '#A855F7'
        }
      },
      fontFamily: {
        mono: ['JetBrains Mono', 'IBM Plex Mono', 'monospace'],
        sans: ['Inter', 'sans-serif']
      },
      animation: {
        'pulse-subtle': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'orbit-slow': 'spin 24s linear infinite',
      }
    },
  },
  plugins: [],
};

export default config;
