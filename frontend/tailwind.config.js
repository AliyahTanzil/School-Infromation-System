/** @type {import('tailwindcss').Config} */
export default {
  // content: paths Tailwind scans to build a minimal CSS output — only classes
  // actually used in these files are included in the final bundle.
  content: ['./index.html', './src/**/*.{js,jsx,ts,tsx}'],
  theme: {
    extend: {
      colors: {
        // Brand palette — extend here rather than modifying Tailwind's defaults.
        brand: {
          50: '#eff6ff',
          500: '#3b82f6',
          900: '#1e3a8a',
        },
      },
      fontFamily: {
        sans: ['Inter', 'ui-sans-serif', 'system-ui'],
      },
    },
  },
  plugins: [],
};
