/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        page: 'var(--nwi-page)',
        ink: 'var(--nwi-ink)',
        mute: 'var(--nwi-mute)',
        hair: 'var(--nwi-hair)',
        raised: 'var(--nwi-raised)',
        hover: 'var(--nwi-hover)',
        critical: '#D62839',
        high: '#E8720C',
        moderate: '#C79000',
        low: '#2563EB',
        other: '#7C3AED',
      },
      fontFamily: {
        sans: ['Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'IBM Plex Mono', 'ui-monospace', 'SFMono-Regular', 'monospace'],
      },
      borderRadius: {
        sharp: '2px',
      },
    },
  },
  plugins: [],
};
