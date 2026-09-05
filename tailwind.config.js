/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'class',
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        industrial: {
          950: '#070A0F',
          900: '#0B0F17',
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
          warning: '#F59E0B',
          'warning-dark': '#92400E',
          safe: '#10B981',
          'safe-dark': '#065F46',
          live: '#06B6D4',
          'live-dark': '#0E7490',
        },
      },
      animation: {
        'pulse-fast': 'pulse 1s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'emergency-flash': 'emergencyFlash 1.2s ease-in-out infinite',
        'radar-sweep': 'radarSweep 3s linear infinite',
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
      },
    },
  },
  plugins: [],
};
