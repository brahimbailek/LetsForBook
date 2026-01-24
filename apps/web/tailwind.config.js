/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        // Palette Beige/Crème Premium
        sand: {
          50: '#fdfcfb',
          100: '#faf8f5',
          200: '#f5f1e8',
          300: '#ede6d8',
          400: '#e3d8c3',
          500: '#d4c4a8',
          600: '#c2ab86',
          700: '#a98e68',
          800: '#8a7354',
          900: '#6d5c45',
        },
        cream: {
          50: '#fefdfb',
          100: '#fefbf6',
          200: '#fcf6ed',
          300: '#f9efe0',
          400: '#f5e6cf',
          500: '#efd8b8',
          600: '#e7c79a',
          700: '#d9ad76',
          800: '#c4905a',
          900: '#a67447',
        },
        // Accent vert doux premium
        sage: {
          50: '#f6f8f6',
          100: '#e8f0e8',
          200: '#d2e2d3',
          300: '#acc8af',
          400: '#7da882',
          500: '#5a8d60',
          600: '#45734b',
          700: '#385c3c',
          800: '#2f4a32',
          900: '#283d2a',
        },
        // Texte
        coffee: {
          50: '#f7f6f5',
          100: '#e8e5e1',
          200: '#d4cdc5',
          300: '#b8aba0',
          400: '#9c8a7a',
          500: '#7d6b5a',
          600: '#67564a',
          700: '#54463d',
          800: '#473c35',
          900: '#3d342f',
        },
      },
      fontFamily: {
        sans: ['var(--font-inter)', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        'soft': '0 2px 15px -3px rgba(0, 0, 0, 0.07), 0 10px 20px -2px rgba(0, 0, 0, 0.04)',
        'soft-lg': '0 10px 40px -10px rgba(0, 0, 0, 0.1)',
      },
      borderRadius: {
        'xl': '1rem',
        '2xl': '1.5rem',
      },
    },
  },
  plugins: [],
};
