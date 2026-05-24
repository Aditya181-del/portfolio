/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      fontFamily: {
        display: ['Space Grotesk', 'Inter', 'system-ui', 'sans-serif'],
        body: ['Inter', 'system-ui', 'sans-serif'],
      },
      colors: {
        carbon: '#050607',
        panel: '#0b1015',
        signal: '#5eead4',
        steel: '#8aa4b8',
        ion: '#a7f3d0',
        pulse: '#93c5fd',
        warning: '#f8d68a',
      },
      boxShadow: {
        panel: '0 24px 80px rgba(0, 0, 0, 0.42)',
        glow: '0 18px 55px rgba(94, 234, 212, 0.12)',
        green: '0 0 35px rgba(94, 234, 212, 0.12)',
      },
      backgroundImage: {
        grid:
          'linear-gradient(rgba(255,255,255,0.055) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.055) 1px, transparent 1px)',
      },
    },
  },
  plugins: [],
};
