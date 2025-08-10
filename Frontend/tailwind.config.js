/** @type {import('tailwindcss').Config} */
export default {
  content: [
    './index.html',
    './src/**/*.{js,jsx,ts,tsx}',
  ],
  theme: {
    container: {
      center: true,
      screens: {
        '2xl': '1440px',
      },
      padding: {
        DEFAULT: '1rem',
        sm: '1rem',
        md: '2rem',
        lg: '2rem',
        xl: '2.5rem',
        '2xl': '3rem',
      },
    },
    extend: {
      colors: {
        'neutral-50': '#FAFAF9',
        'neutral-100': '#F5F5F4',
        'neutral-200': '#E7E5E4',
        'neutral-300': '#D6D3D1',
        'neutral-600': '#525252',
        'neutral-700': '#404040',
        'neutral-900': '#171717',
        'brand-primary': '#F5E6C8',
        'brand-accent': '#C8A96A',
        'brand-ink': '#222222',
        'brand-bg': '#FCFBF9',
      },
      fontFamily: {
        display: ['"Playfair Display"', 'serif'],
        sans: ['Inter', 'system-ui', 'Segoe UI', 'Roboto', 'Helvetica Neue', 'Arial', 'sans-serif'],
        grotesk: ['"Space Grotesk"', 'Inter', 'system-ui', 'sans-serif'],
      },
      fontSize: {
        xs: ['0.75rem', { lineHeight: '1.4' }],
        sm: ['0.875rem', { lineHeight: '1.5' }],
        base: ['1rem', { lineHeight: '1.6' }],
        lg: ['1.125rem', { lineHeight: '1.7' }],
        xl: ['1.25rem', { lineHeight: '1.7' }],
        '2xl': ['1.5rem', { lineHeight: '1.25', letterSpacing: '-0.01em' }],
        '3xl': ['1.875rem', { lineHeight: '1.2', letterSpacing: '-0.015em' }],
        '4xl': ['2.25rem', { lineHeight: '1.15', letterSpacing: '-0.02em' }],
        '5xl': ['3rem', { lineHeight: '1.1', letterSpacing: '-0.02em' }],
        '6xl': ['3.75rem', { lineHeight: '1.05', letterSpacing: '-0.025em' }],
        '7xl': ['4.5rem', { lineHeight: '1.03', letterSpacing: '-0.03em' }],
      },
      borderRadius: {
        xl: '0.75rem',
        '2xl': '1rem',
      },
      boxShadow: {
        card: '0 8px 24px rgba(0,0,0,0.06)',
        subtle: '0 2px 12px rgba(0,0,0,0.04)',
      },
      ringWidth: {
        DEFAULT: '2px',
      },
      ringColor: {
        DEFAULT: '#C8A96A',
      },
      spacing: {
        // 8pt base spacing system
        0: '0px',
        1: '0.25rem', // 4
        2: '0.5rem', // 8
        3: '0.75rem', // 12
        4: '1rem', // 16
        5: '1.25rem', // 20
        6: '1.5rem', // 24
        8: '2rem', // 32
        10: '2.5rem', // 40
        12: '3rem', // 48
        16: '4rem', // 64
        20: '5rem', // 80
        24: '6rem', // 96
        32: '8rem', // 128
      },
      transitionDuration: {
        160: '160ms',
        200: '200ms',
        240: '240ms',
      },
      transitionTimingFunction: {
        luxury: 'cubic-bezier(0.33, 1, 0.68, 1)',
      },
    },
  },
  plugins: [
    function ({ addUtilities, addComponents, theme }) {
      addUtilities({ '.font-tabular': { fontVariantNumeric: 'tabular-nums' } });

      addComponents({
        '.prose-fashion': {
          fontFamily: theme('fontFamily.grotesk').join(','),
          lineHeight: theme('lineHeight.relaxed', '1.7'),
          color: theme('colors.brand-ink'),
        },
        '.prose-fashion h1, .prose-fashion h2': {
          fontFamily: theme('fontFamily.display').join(','),
          letterSpacing: '-0.02em',
        },
        '.ar-4-5': { position: 'relative', paddingTop: '125%' },
        '.ar-16-9': { position: 'relative', paddingTop: '56.25%' },
        '.ar-1-1': { position: 'relative', paddingTop: '100%' },
        '.ar-contents': { position: 'absolute', inset: '0', width: '100%', height: '100%' },
      });
    },
  ],
}


