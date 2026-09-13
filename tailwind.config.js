/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './app/**/*.{js,jsx,ts,tsx}',
    './src/**/*.{js,jsx,ts,tsx}',
    './components/**/*.{js,jsx,ts,tsx}',
  ],
  presets: [require('nativewind/preset')],
  theme: {
    extend: {
      colors: {
        hive: {
          bg: 'rgb(var(--hive-bg) / <alpha-value>)',
          primary: 'rgb(var(--hive-primary) / <alpha-value>)',
          accent: 'rgb(var(--hive-accent) / <alpha-value>)',
          foreground: 'rgb(var(--hive-foreground) / <alpha-value>)',
          muted: 'rgb(var(--hive-muted) / <alpha-value>)',
          dim: 'rgb(var(--hive-dim) / <alpha-value>)',
          surface: 'rgb(var(--hive-surface) / <alpha-value>)',
          surface2: 'rgb(var(--hive-surface2) / <alpha-value>)',
          'input-bg': 'rgb(var(--hive-input-bg) / <alpha-value>)',
          signal: 'rgb(var(--hive-signal) / <alpha-value>)',
          danger: 'rgb(var(--hive-danger) / <alpha-value>)',
          'on-accent': 'rgb(var(--hive-on-accent) / <alpha-value>)',
          stroke: 'var(--hive-stroke)',
        },
      },
      borderRadius: {
        hive: '28px',
        'hive-md': '18px',
      },
      fontFamily: {
        inter: ['Inter', 'sans-serif'],
        display: ['SpaceGrotesk-Bold', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
