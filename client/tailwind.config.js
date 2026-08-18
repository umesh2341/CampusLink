/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Campus Terminal / Wayfinding Kiosk Design Tokens
        paper: '#F4EFE6',
        canvas: '#F4EFE6',       // backward compat alias
        ink: '#1C1A17',
        'text-primary': '#1C1A17', // backward compat alias
        signal: '#FF7A33',
        'accent-gold': '#FF7A33',  // backward compat alias
        confirm: '#3FA66B',
        card: '#FFFFFF',
        muted: '#6B665C',
        'text-muted': '#6B665C',

        // Landmark (kept for any remaining references)
        'landmark-teal': '#2D7D6F',
        'text-inverse': '#FFFFFF',

        // Building category colors (fill and border) — UNTOUCHED
        category: {
          academic:       { fill: '#5B7C99', border: '#3F5A72' },
          'boys-hostel':  { fill: '#C97B5C', border: '#A85D42' },
          'girls-hostel': { fill: '#C98A9E', border: '#A8677D' },
          'admin-research':{ fill: '#8B8478', border: '#6B6559' },
          'cafeteria-food':{ fill: '#D9A441', border: '#B8842A' },
          sports:         { fill: '#7A9B76', border: '#5C7D58' },
          gardens:        { fill: '#A3BC8F', border: '#7E9A6B' },
          'other-misc':   { fill: '#A78BA8', border: '#87698A' },
        },
      },
      boxShadow: {
        hard:    '2px 2px 0px #1C1A17',
        'hard-lg':'3px 3px 0px #1C1A17',
        'hard-xl':'4px 4px 0px #1C1A17',
      },
      borderRadius: {
        xs: '2px',
        sm: '4px',
        // Override default rounded-lg / rounded-xl to stay in 2-4px range
        DEFAULT: '2px',
        lg: '4px',
        xl: '4px',
        '2xl': '4px',
        full: '9999px', // keep for explicit pill usage
      },
      fontFamily: {
        display: ['VT323', 'ui-monospace', 'SF Mono', 'Cascadia Code', 'monospace'],
        body:    ['ui-monospace', 'SF Mono', 'Cascadia Code', 'monospace'],
        mono:    ['ui-monospace', 'SF Mono', 'Cascadia Code', 'monospace'],
      },
    },
  },
  plugins: [],
}
