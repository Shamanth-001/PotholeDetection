/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        gov: {
          50: '#E8F5E9', 100: '#C8E6C9', 200: '#A5D6A7', 300: '#81C784',
          400: '#66BB6A', 500: '#4CAF50', 600: '#43A047', 700: '#388E3C',
          800: '#2E7D32', 900: '#1B5E20', 950: '#0D3B0F',
        },
        urgency: { low: '#4CAF50', medium: '#FF9800', high: '#F44336', critical: '#B71C1C' },
      },
      animation: {
        'slide-up': 'slideUp 0.5s ease-out',
        'fade-in': 'fadeIn 0.6s ease-out',
      },
      keyframes: {
        slideUp: { '0%': { opacity: '0', transform: 'translateY(20px)' }, '100%': { opacity: '1', transform: 'translateY(0)' } },
        fadeIn: { '0%': { opacity: '0' }, '100%': { opacity: '1' } },
      },
    },
  },
  plugins: [],
}
