/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'class',
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
    './src/lib/**/*.{js,ts,jsx,tsx,mdx}',
    './src/hooks/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      screens: {
        xs: '420px',
        '3xl': '1780px',
      },
      fontFamily: {
        sans: [
          'Inter',
          'ui-sans-serif',
          'system-ui',
          '-apple-system',
          'Segoe UI',
          'Roboto',
          'Helvetica Neue',
          'Arial',
          'sans-serif',
        ],
        mono: [
          'JetBrains Mono',
          'ui-monospace',
          'SFMono-Regular',
          'Menlo',
          'Consolas',
          'Liberation Mono',
          'monospace',
        ],
      },
      colors: {
        industrial: {
          980: '#04060A',
          950: '#070A0F',
          925: '#090D14',
          900: '#0B0F17',
          875: '#0D131D',
          850: '#101622',
          800: '#151D2C',
          750: '#1C263A',
          700: '#24324D',
          600: '#334568',
          500: '#4B618E',
          400: '#7087B5',
          300: '#9FB3DC',
          200: '#CBD8F0',
          100: '#E5EDFB',
        },
        safety: {
          emergency: '#EF4444',
          'emergency-dark': '#991B1B',
          warning: '#F97316',
          'warning-dark': '#9A3412',
          caution: '#FBBF24',
          'caution-dark': '#92400E',
          safe: '#10B981',
          'safe-dark': '#065F46',
          live: '#06B6D4',
          'live-dark': '#0E7490',
        },
      },
      boxShadow: {
        panel: '0 1px 0 0 rgba(255,255,255,0.04) inset, 0 18px 40px -22px rgba(0,0,0,0.9)',
        'panel-lg': '0 1px 0 0 rgba(255,255,255,0.05) inset, 0 30px 60px -28px rgba(0,0,0,0.95)',
        rail: '0 0 0 1px rgba(51,69,104,0.35)',
      },
      backgroundImage: {
        'grid-fine':
          'linear-gradient(rgba(112,135,181,0.055) 1px, transparent 1px), linear-gradient(90deg, rgba(112,135,181,0.055) 1px, transparent 1px)',
      },
      backgroundSize: {
        'grid-fine': '38px 38px',
      },
      animation: {
        'pulse-fast': 'pulse 1s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'emergency-flash': 'emergencyFlash 1.2s ease-in-out infinite',
        'radar-sweep': 'radarSweep 3s linear infinite',
        'ping-slow': 'ping 2.4s cubic-bezier(0, 0, 0.2, 1) infinite',
        shimmer: 'shimmer 2.6s linear infinite',
        'fade-in': 'fadeIn 0.32s ease-out both',
        'rise-in': 'riseIn 0.42s cubic-bezier(0.22, 1, 0.36, 1) both',
        'scale-in': 'scaleIn 0.24s cubic-bezier(0.22, 1, 0.36, 1) both',
        breathe: 'breathe 2.8s ease-in-out infinite',
        'scan-line': 'scanLine 4.5s linear infinite',
        'siren-sweep': 'sirenSweep 2.2s linear infinite',
        'ticker-blink': 'tickerBlink 1.6s steps(1, end) infinite',
      },
      keyframes: {
        emergencyFlash: {
          '0%, 100%': {
            backgroundColor: 'rgba(239, 68, 68, 0.18)',
            borderColor: 'rgba(239, 68, 68, 0.9)',
            boxShadow: '0 0 25px rgba(239, 68, 68, 0.45)',
          },
          '50%': {
            backgroundColor: 'rgba(239, 68, 68, 0.05)',
            borderColor: 'rgba(239, 68, 68, 0.3)',
            boxShadow: '0 0 5px rgba(239, 68, 68, 0.1)',
          },
        },
        radarSweep: {
          '0%': { transform: 'rotate(0deg)' },
          '100%': { transform: 'rotate(360deg)' },
        },
        shimmer: {
          '0%': { transform: 'translateX(-120%)' },
          '100%': { transform: 'translateX(220%)' },
        },
        fadeIn: {
          from: { opacity: '0' },
          to: { opacity: '1' },
        },
        riseIn: {
          from: { opacity: '0', transform: 'translateY(12px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
        scaleIn: {
          from: { opacity: '0', transform: 'scale(0.96)' },
          to: { opacity: '1', transform: 'scale(1)' },
        },
        breathe: {
          '0%, 100%': { opacity: '0.55', transform: 'scale(0.97)' },
          '50%': { opacity: '1', transform: 'scale(1.03)' },
        },
        scanLine: {
          '0%': { transform: 'translateY(-100%)' },
          '100%': { transform: 'translateY(1200%)' },
        },
        sirenSweep: {
          '0%': { transform: 'translateX(-100%)' },
          '100%': { transform: 'translateX(100%)' },
        },
        tickerBlink: {
          '0%, 49%': { opacity: '1' },
          '50%, 100%': { opacity: '0.25' },
        },
      },
    },
  },
  plugins: [],
};
