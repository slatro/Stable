import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "#0a0c14",
        card: "rgba(16, 20, 32, 0.7)",
        accent: {
          blue: "#3b82f6",
          glow: "rgba(59, 130, 246, 0.2)",
          silver: "#e5e7eb",
        },
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
      },
    },
  },
  plugins: [],
}

export default config
