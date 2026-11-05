/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Core MedHandover Brand Design System
        primary: {
          DEFAULT: '#1F4E5B', // Dark Blue/Teal (Trust/Primary Actions)
          hover: '#173c46',
          light: '#2a6474',
          subtle: '#eaf1f3',
        },
        secondary: {
          DEFAULT: '#2BC4C6', // Teal (Info/Interactive)
          hover: '#24abad',
          light: '#e6f9fa',
          dark: '#1ea1a3',
        },
        background: {
          DEFAULT: '#F8F9FA', // Off-White
        },
        surface: {
          DEFAULT: '#FFFFFF', // Pure White
        },
        warning: {
          DEFAULT: '#FF5A5F', // Coral (Needs Review / Patient Flagged)
          hover: '#e54d52',
          light: '#fff1f2',
          subtle: '#ffe4e6',
          border: '#fca5a5',
        },
        critical: {
          DEFAULT: '#922B2B', // Dark Red/Burgundy (Severe errors / conflicts)
          hover: '#7a2323',
          light: '#fdf2f2',
          border: '#f87171',
        },
        success: {
          DEFAULT: '#2E7D32', // Medical Green (Verified / Approved)
          hover: '#256629',
          light: '#e8f5e9',
          border: '#a5d6a7',
        },
        // Neutral Slate Tones for text & subtle borders
        neutral: {
          50: '#F8F9FA',
          100: '#F1F3F5',
          200: '#E9ECEF',
          300: '#DEE2E6',
          400: '#CED4DA',
          500: '#ADB5BD',
          600: '#6C757D',
          700: '#495057',
          800: '#343A40',
          900: '#212529',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
      },
      boxShadow: {
        card: '0 1px 3px 0 rgba(0, 0, 0, 0.06), 0 1px 2px 0 rgba(0, 0, 0, 0.04)',
        'card-hover': '0 4px 6px -1px rgba(0, 0, 0, 0.08), 0 2px 4px -1px rgba(0, 0, 0, 0.04)',
        modal: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
      },
    },
  },
  plugins: [],
};
