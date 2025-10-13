import type { Config } from 'tailwindcss'

const config: Config = {
  darkMode: 'class', // 👈 enables dark mode by toggling `class="dark"` on <html>
  content: [
    './app/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
    './lib/**/*.{ts,tsx}', // include lib folder in scanning
  ],
  theme: {
    extend: {
      colors: {
        glass: 'rgba(255,255,255,0.08)',
      },
      boxShadow: {
        glass: '0 8px 30px rgba(0,0,0,0.2)',
      },
      backdropBlur: {
        xs: '2px',
      },
    },
  },
  plugins: [],
}

export default config
