import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Spectrum color system
        spectrum: {
          // Blue (Primary)
          blue: {
            100: '#e1ecff',
            200: '#c7d9ff',
            300: '#99c0ff',
            400: '#6aa6fd',
            500: '#378ef0',
            600: '#1473e6',
            700: '#0c5aa6',
            800: '#034584',
            900: '#013366',
          },
          // Gray scale
          gray: {
            25: '#fcfcfc',
            50: '#f9f9f9',
            75: '#f5f5f5',
            100: '#f0f0f0',
            200: '#e1e1e1',
            300: '#c8c8c8',
            400: '#b3b3b3',
            500: '#909090',
            600: '#6e6e6e',
            700: '#4b4b4b',
            800: '#323232',
            900: '#1e1e1e',
          },
          // Semantic colors
          red: {
            100: '#ffe0e0',
            400: '#ff6b6b',
            600: '#d33030',
            700: '#b91c1c',
          },
          green: {
            100: '#e5f5e5',
            400: '#44a047',
            600: '#268e6c',
            700: '#12805c',
          },
          orange: {
            100: '#fff0db',
            400: '#e68619',
            600: '#d06014',
            700: '#bd4b00',
          },
          yellow: {
            100: '#fff3cd',
            400: '#dfbf00',
            600: '#d2b200',
            700: '#c4a200',
          },
        },
        // Alias colors for easier use
        primary: {
          50: '#e1ecff',
          100: '#c7d9ff',
          200: '#99c0ff',
          300: '#6aa6fd',
          400: '#378ef0',
          500: '#1473e6',
          600: '#0c5aa6',
          700: '#034584',
          800: '#013366',
          900: '#002244',
        },
        neutral: {
          25: '#fcfcfc',
          50: '#f9f9f9',
          75: '#f5f5f5',
          100: '#f0f0f0',
          200: '#e1e1e1',
          300: '#c8c8c8',
          400: '#b3b3b3',
          500: '#909090',
          600: '#6e6e6e',
          700: '#4b4b4b',
          800: '#323232',
          900: '#1e1e1e',
        },
        positive: {
          100: '#e5f5e5',
          400: '#44a047',
          600: '#268e6c',
          700: '#12805c',
        },
        negative: {
          100: '#ffe0e0',
          400: '#ff6b6b',
          600: '#d33030',
          700: '#b91c1c',
        },
        notice: {
          100: '#fff0db',
          400: '#e68619',
          600: '#d06014',
          700: '#bd4b00',
        },
        info: {
          100: '#e1ecff',
          400: '#378ef0',
          600: '#1473e6',
          700: '#0c5aa6',
        },
      },
      fontFamily: {
        // Spectrum typography
        sans: ['Adobe Clean', 'Source Sans Pro', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
        mono: ['Source Code Pro', 'Monaco', 'Menlo', 'Consolas', 'monospace']
      },
      fontSize: {
        // Spectrum type scale
        'xs': ['11px', { lineHeight: '16px' }],
        'sm': ['12px', { lineHeight: '18px' }],
        'base': ['14px', { lineHeight: '20px' }],
        'lg': ['16px', { lineHeight: '24px' }],
        'xl': ['18px', { lineHeight: '28px' }],
        '2xl': ['20px', { lineHeight: '30px' }],
        '3xl': ['24px', { lineHeight: '32px' }],
        '4xl': ['28px', { lineHeight: '36px' }],
        '5xl': ['32px', { lineHeight: '40px' }],
        '6xl': ['36px', { lineHeight: '44px' }],
      },
      spacing: {
        // Spectrum spacing scale (4px base unit)
        '1': '4px',
        '2': '8px',
        '3': '12px',
        '4': '16px',
        '5': '20px',
        '6': '24px',
        '7': '28px',
        '8': '32px',
        '9': '36px',
        '10': '40px',
        '12': '48px',
        '14': '56px',
        '16': '64px',
        '20': '80px',
        '24': '96px',
        '32': '128px',
      },
      borderRadius: {
        // Spectrum border radius
        'none': '0',
        'sm': '2px',
        'base': '4px',
        'md': '6px',
        'lg': '8px',
        'xl': '12px',
        '2xl': '16px',
        'full': '9999px',
      },
      boxShadow: {
        // Spectrum elevation system
        'sm': '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
        'base': '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)',
        'md': '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
        'lg': '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
        'xl': '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
        '2xl': '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
      },
      animation: {
        'spin-slow': 'spin 2s linear infinite',
        'pulse-soft': 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'fade-in': 'fadeIn 0.2s ease-out',
        'slide-up': 'slideUp 0.3s ease-out',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { transform: 'translateY(10px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
      },
    },
  },
  plugins: [
    require('@tailwindcss/typography'),
  ],
  darkMode: 'media',
}

export default config
