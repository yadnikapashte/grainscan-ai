/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      fontFamily: {
        display: ['"Playfair Display"', 'serif'],
        body: ['"Inter"', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'monospace'],
      },
      colors: {
        background: {
          DEFAULT: '#FAFAF7',
          soft: '#F5F3EE',
        },
        primary: {
          DEFAULT: '#2D6A4F',
          dark: '#1B4D36',
          light: '#40916C',
        },
        secondary: {
          DEFAULT: '#E9840A',
          dark: '#B96908',
          light: '#F8A83E',
        },
        surface: {
          DEFAULT: '#FFFFFF',
          border: '#E8E4DC',
        },
        text: {
          header: '#1A1A18',
          body: '#5C5A54',
        },
        status: {
          normal: '#2D6A4F',
          broken: '#D4690A',
          chalky: '#B8860B',
          discolored: '#C0392B',
        },
      },
      boxShadow: {
        premium: '0 1px 3px rgba(0,0,0,0.06), 0 4px 16px rgba(0,0,0,0.04)',
        'premium-hover': '0 4px 6px rgba(0,0,0,0.08), 0 10px 20px rgba(0,0,0,0.06)',
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'spin-slow': 'spin 3s linear infinite',
        'fade-in': 'fadeIn 0.5s ease-in-out',
        'slide-up': 'slideUp 0.4s ease-out',
        'scan-line': 'scanLine 2s linear infinite',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: 0 },
          '100%': { opacity: 1 },
        },
        slideUp: {
          '0%': { opacity: 0, transform: 'translateY(20px)' },
          '100%': { opacity: 1, transform: 'translateY(0)' },
        },
        scanLine: {
          '0%': { top: '0%' },
          '100%': { top: '100%' },
        },
      },
    },
  },
  plugins: [],
}

