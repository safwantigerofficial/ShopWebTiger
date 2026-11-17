import type { Config } from 'tailwindcss';
export default {
  content: ['./src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        brand: { DEFAULT: '#f59e0b', dark: '#b45309', light: '#fbbf24' },
        night: { 950: '#0a0e17', 900: '#0f1420', 800: '#161c2c', 700: '#1f2739', 600: '#2a3449' },
      },
    },
  },
  plugins: [],
} satisfies Config;
