/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx,ts,tsx}'],
  theme: {
    extend: {
      colors: {
        brand: '#6157F5',
        ink: '#1E1B4B',
        mist: '#F6F4FF',
        line: '#E7E3FA',
      },
      fontFamily: {
        display: ['"Space Grotesk"', 'sans-serif'],
        sans: ['Inter', 'sans-serif'],
      },
      boxShadow: {
        card: '0 4px 20px rgba(97,87,245,.08)',
        cta: '0 8px 20px rgba(97,87,245,.35)',
      },
    },
  },
  plugins: [],
};
