import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        // Novro Primary Colors (من الشعار)
        primary: {
          50: '#F0F9FB',
          100: '#E1F3F7',
          200: '#B3E5FC',
          300: '#81D4FA',
          400: '#4FC3F7',
          500: '#29B6F6', // التركواز الفاتح
          600: '#03A9F4',
          700: '#0288D1',
          800: '#01579B', // الأزرق الداكن
          900: '#0D47A1',
        },
        // Novro Accent Colors
        accent: {
          50: '#F0F9FF',
          100: '#E0F7FF',
          200: '#B3E5FC',
          300: '#81D4FA',
          400: '#4FC3F7',
          500: '#1DD1A1', // التركواز النيون
          600: '#10B981',
          700: '#059669',
          800: '#047857',
          900: '#065F46',
        },
        // Neutral Colors
        neutral: {
          50: '#FAFAFA',
          100: '#F4F4F5',
          200: '#E4E4E7',
          300: '#D4D4D8',
          400: '#A1A1A5',
          500: '#71717A',
          600: '#52525B',
          700: '#3F3F46',
          800: '#27272A',
          900: '#18181B',
        },
        // Status Colors
        status: {
          waiting: '#3B82F6',    // أزرق (ينتظر)
          calling: '#F59E0B',    // برتقالي (استدعاء)
          active: '#8B5CF6',     // بنفسجي (نشط)
          done: '#10B981',       // أخضر (انتهى)
        },
      },
      backgroundImage: {
        'gradient-novro': 'linear-gradient(135deg, #01579B 0%, #29B6F6 50%, #1DD1A1 100%)',
        'gradient-light': 'linear-gradient(135deg, #F0F9FB 0%, #E1F3F7 100%)',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        display: ['Poppins', 'system-ui', 'sans-serif'],
      },
      fontSize: {
        xs: ['12px', { lineHeight: '16px' }],
        sm: ['14px', { lineHeight: '20px' }],
        base: ['16px', { lineHeight: '24px' }],
        lg: ['18px', { lineHeight: '28px' }],
        xl: ['20px', { lineHeight: '28px' }],
        '2xl': ['24px', { lineHeight: '32px' }],
        '3xl': ['30px', { lineHeight: '36px' }],
        '4xl': ['36px', { lineHeight: '40px' }],
      },
      borderRadius: {
        sm: '6px',
        md: '8px',
        lg: '12px',
        xl: '16px',
        '2xl': '20px',
      },
      boxShadow: {
        xs: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
        sm: '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)',
        md: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
        lg: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
        xl: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
        '2xl': '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
        'novro': '0 8px 16px -4px rgba(1, 87, 155, 0.2)',
        'novro-lg': '0 20px 40px -8px rgba(29, 209, 161, 0.15)',
      },
      animation: {
        'pulse-soft': 'pulse-soft 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'fade-in': 'fade-in 0.3s ease-in-out',
        'slide-up': 'slide-up 0.4s ease-out',
        'scale-in': 'scale-in 0.3s ease-out',
      },
      keyframes: {
        'pulse-soft': {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.8' },
        },
        'fade-in': {
          'from': { opacity: '0' },
          'to': { opacity: '1' },
        },
        'slide-up': {
          'from': { transform: 'translateY(10px)', opacity: '0' },
          'to': { transform: 'translateY(0)', opacity: '1' },
        },
        'scale-in': {
          'from': { transform: 'scale(0.95)', opacity: '0' },
          'to': { transform: 'scale(1)', opacity: '1' },
        },
      },
    },
  },
  plugins: [],
};

export default config;