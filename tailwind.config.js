/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: {
          DEFAULT: "#0D0F1A", // Deep Space Navy
          secondary: "#1A1F2E", // Steel Grey
        },
        foreground: {
          DEFAULT: "#E0E0E0", // Light Gray
          muted: "#808080", // Soft Gray
        },
        primary: {
          DEFAULT: "#00FFD0", // Neon Aqua (kept from original)
          foreground: "#0D0F1A", // Deep Space Navy
        },
        secondary: {
          DEFAULT: "#D4AF37", // Metallic Gold (replacing Steel Grey)
          foreground: "#2C3E50", // Hunter Green
        },
        destructive: {
          DEFAULT: "#FF7F50", // Coral
          foreground: "#FFFFFF",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "#2C3E50", // Hunter Green
          foreground: "#D4AF37", // Metallic Gold
        },
        popover: {
          DEFAULT: "#0D0F1A",
          foreground: "#FFFFFF",
        },
        card: {
          DEFAULT: "#0D0F1A",
          foreground: "#FFFFFF",
        },
      },
      fontFamily: {
        sans: ['Space Grotesk', 'Inter', 'sans-serif'],
        mono: ['Roboto Mono', 'Fira Code', 'monospace'],
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
        xl: "1rem", // Additional large rounded corners
      },
      boxShadow: {
        'os-window': '0 15px 30px rgba(0, 0, 0, 0.4), 0 10px 20px rgba(212, 175, 55, 0.1)',
        'sidebar-glow': '0 0 15px rgba(212, 175, 55, 0.3)', // Metallic gold glow
      },
      keyframes: {
        "accordion-down": {
          from: { height: "0" },
          to: { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: "0" },
        },
        glow: {
          '0%, 100%': { opacity: 1 },
          '50%': { opacity: 0.5 }
        },
        // New OS-specific animations
        'os-pulse': {
          '0%, 100%': { transform: 'scale(1)' },
          '50%': { transform: 'scale(1.05)' },
        },
        'sidebar-hover': {
          '0%': { backgroundColor: '#2C3E50' },
          '100%': { backgroundColor: '#D4AF37' },
        }
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
        'glow': 'glow 2s ease-in-out infinite',
        'os-pulse': 'os-pulse 2s ease-in-out infinite',
        'sidebar-hover': 'sidebar-hover 0.5s ease-in-out',
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
};