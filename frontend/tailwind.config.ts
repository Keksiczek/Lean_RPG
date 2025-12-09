import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './app/**/*.{js,ts,jsx,tsx}',
    './components/**/*.{js,ts,jsx,tsx}',
    './lib/**/*.{js,ts,jsx,tsx}'
  ],
  theme: {
    extend: {
      colors: {
        primary: '#2563eb',
        secondary: '#0f172a'
      },
      boxShadow: {
        card: '0 10px 40px rgba(0, 0, 0, 0.08)'
      }
    }
  },
  plugins: []
};

export default config;
