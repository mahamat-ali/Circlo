/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{js,jsx,ts,tsx}"],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        border: "#e2e8f0",
        input: "#f1f5f9",
        background: "#ffffff",
        foreground: "#0f172a",
        primary: {
          DEFAULT: "#6C5CE7",
          foreground: "#ffffff",
        },
        secondary: {
          DEFAULT: "#f1f5f9",
          foreground: "#0f172a",
        },
        destructive: {
          DEFAULT: "#ef4444",
          foreground: "#ffffff",
        },
        muted: {
          DEFAULT: "#f8fafc",
          foreground: "#64748b",
        },
      },
      borderRadius: {
        DEFAULT: '0.5rem',
        full: '9999px',
      },
    },
  },
  plugins: [],
};
