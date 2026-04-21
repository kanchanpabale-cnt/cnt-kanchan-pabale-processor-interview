import type { Config } from 'tailwindcss';

export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          50:  '#EEF3FB',
          100: '#D8E3F3',
          200: '#AEC4E4',
          400: '#4E7FC2',
          500: '#0E4C90', // SignaPay primary blue (matches logo)
          600: '#0E4C90', // links, hover — unified with brand-500
          700: '#0A3A70',
          900: '#0A2540', // deep navy — primary
        },
        accent: {
          400: '#F28C6A', // warm secondary
          500: '#E2574C', // SignaPay-red accent
          600: '#B83A30',
        },
        surface: '#FFFFFF',
        canvas:  '#F6F8FB',
        ink: {
          DEFAULT: '#0F172A',
          muted:   '#64748B',
        },
        success: '#16A34A',
        danger:  '#DC2626',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        display: ['"Inter Tight"', 'Inter', 'system-ui', 'sans-serif'],
      },
      borderRadius: {
        DEFAULT: '10px',
      },
      boxShadow: {
        card: '0 1px 2px rgba(10, 37, 64, 0.04), 0 4px 12px rgba(10, 37, 64, 0.06)',
        pop: '0 8px 24px rgba(10, 37, 64, 0.12)',
      },
    },
  },
  plugins: [],
} satisfies Config;
