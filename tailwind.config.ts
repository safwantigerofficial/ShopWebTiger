import type { Config } from 'tailwindcss';
export default {
  content: ['./src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        brand: { DEFAULT: '#3ecf8e', dark: '#18a86b', light: '#54dba1' },
        tiger: '#f2a65a',
        night: { 950: '#111111', 900: '#161616', 800: '#1c1c1c', 700: '#232323', 600: '#2e2e2e', 500: '#3a3a3a' },
      },
      fontFamily: {
        serif: ['Newsreader', 'Iowan Old Style', 'Georgia', 'serif'],
        sans: ['Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
} satisfies Config;
