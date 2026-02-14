/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./app/**/*.{js,jsx,ts,tsx}", "./components/**/*.{js,jsx,ts,tsx}"],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        void: '#0a0a0a',
        'void-light': '#141414',
        'void-lighter': '#1a1a1a',
        'void-border': '#2a2a2a',
        elite: '#f5f5f5',
        'elite-muted': '#a3a3a3',
        'elite-dim': '#737373',
        accent: '#c9a962',
        'accent-light': '#d4b978',
        danger: '#dc2626',
        'danger-light': '#ef4444',
        success: '#16a34a',
        warning: '#ca8a04',
      },
      fontFamily: {
        serif: ['Georgia', 'Times New Roman', 'serif'],
        sans: ['System', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
