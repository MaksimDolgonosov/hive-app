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
          bg: '#FFF8ED',
          primary: '#F5A623',
          accent: '#FF8C00',
          foreground: '#2C1810',
          muted: '#8B7355',
          surface: '#FFFFFFE6',
          'input-bg': '#FFFFFFAA',
        },
      },
      borderRadius: {
        hive: '20px',
        'hive-md': '14px',
      },
      fontFamily: {
        inter: ['Inter', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
