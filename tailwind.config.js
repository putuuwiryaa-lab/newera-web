/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        cyber: {
          bg: '#070A13',
          card: '#0F172A',
          border: '#1E293B',
          accent: '#10B981', // Emerald
          cyan: '#06B6D4',
          purple: '#8B5CF6',
          amber: '#F59E0B',
          rose: '#F43F5E'
        }
      },
      fontFamily: {
        sans: ['"Plus Jakarta Sans"', 'Inter', 'system-ui', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'Fira Code', 'monospace']
      }
    },
  },
  plugins: [],
}
