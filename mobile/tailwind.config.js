/** @type {import('tailwindcss').Config} */
module.exports = {
  // ⚠️ CRITICAL: This must point to your files. 
  // If your file is in 'app/details.tsx', this works.
  content: ["./src/**/*.{js,jsx,ts,tsx}"],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        // We define these custom colors to match your design exactly
        dark: '#050505',
        card: '#121212',
        border: '#27272a',
        primary: '#8b5cf6',
      }
    },
  },
  plugins: [],
}
