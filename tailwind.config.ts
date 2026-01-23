import type { Config } from "tailwindcss";

export default {
  darkMode: ["class"],
  content: ["./client/index.html", "./client/src/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        sans: ["var(--font-sans)", "Inter", "system-ui", "sans-serif"],
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      colors: {
        // New Gigster Garage Brand Colors
        slateInk: '#1A241A',
        lightCard: '#F7F9FA', 
        brand: {
          teal: '#008272',
          tealTint: '#66E0C7',
          blueTint: '#66C7FF',
          amber: '#FFB200',
          amberTint: '#FFD87A'
        },
        // Module Colors - Visual Differentiation
        moduleTasks: {
          50: '#FFFBEB',   // soft tint bg
          200: '#FDE68A',  // border tint
          500: '#F59E0B',  // base
          600: '#D97706',  // deep (hover)
        },
        moduleProjects: {
          50: '#EEF2FF',   // soft tint bg
          200: '#C7D2FE',  // border tint
          500: '#6366F1',  // base
          600: '#4F46E5',  // deep (hover)
        },
        moduleCalendar: {
          50: '#ECFDF5',   // soft tint bg
          200: '#A7F3D0',  // border tint
          500: '#10B981',  // base
          600: '#059669',  // deep (hover)
        },
        moduleMessages: {
          50: '#F0F9FF',   // soft tint bg
          200: '#BAE6FD',  // border tint
          500: '#0EA5E9',  // base
          600: '#0284C7',  // deep (hover)
        },
        background: "var(--background)",
        foreground: "var(--foreground)",
        card: {
          DEFAULT: "var(--card)",
          foreground: "var(--card-foreground)",
        },
        popover: {
          DEFAULT: "var(--popover)",
          foreground: "var(--popover-foreground)",
        },
        primary: {
          DEFAULT: "var(--primary)",
          foreground: "var(--primary-foreground)",
        },
        secondary: {
          DEFAULT: "var(--secondary)",
          foreground: "var(--secondary-foreground)",
        },
        muted: {
          DEFAULT: "var(--muted)",
          foreground: "var(--muted-foreground)",
        },
        accent: {
          DEFAULT: "var(--accent)",
          foreground: "var(--accent-foreground)",
        },
        destructive: {
          DEFAULT: "var(--destructive)",
          foreground: "var(--destructive-foreground)",
        },
        border: "var(--border)",
        input: "var(--input)",
        ring: "var(--ring)",
        chart: {
          "1": "var(--chart-1)",
          "2": "var(--chart-2)",
          "3": "var(--chart-3)",
          "4": "var(--chart-4)",
          "5": "var(--chart-5)",
        },
        neutral: {
          50: "var(--neutral-50)",
          100: "var(--neutral-100)",
          200: "var(--neutral-200)",
          300: "var(--neutral-300)",
          400: "var(--neutral-400)",
          500: "var(--neutral-500)",
          600: "var(--neutral-600)",
          700: "var(--neutral-700)",
          800: "var(--neutral-800)",
          900: "var(--neutral-900)",
        },
      },
      boxShadow: {
        card: '0 6px 22px rgba(0,0,0,0.06)',
        'gigster-glow': '0 8px 26px rgba(0,130,114,.22), inset 0 0 0 1px rgba(255,178,0,.45)'
      },
      keyframes: {
        "accordion-down": {
          from: {
            height: "0",
          },
          to: {
            height: "var(--radix-accordion-content-height)",
          },
        },
        "accordion-up": {
          from: {
            height: "var(--radix-accordion-content-height)",
          },
          to: {
            height: "0",
          },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
      },
    },
  },
  plugins: [require("tailwindcss-animate"), require("@tailwindcss/typography")],
} satisfies Config;
