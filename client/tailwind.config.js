/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // App background / canvas
        canvas: '#F1F0EC',
        
        // Highlight/interactive accent
        'accent-gold': '#F2B84B',
        
        // Landmark marker color
        'landmark-teal': '#2D7D6F',
        
        // Text colors
        'text-primary': '#2A2621',
        'text-inverse': '#FFFFFF',
        
        // Building category colors (fill and border)
        category: {
          academic: {
            fill: '#5B7C99',
            border: '#3F5A72',
          },
          'boys-hostel': {
            fill: '#C97B5C',
            border: '#A85D42',
          },
          'girls-hostel': {
            fill: '#C98A9E',
            border: '#A8677D',
          },
          'admin-research': {
            fill: '#8B8478',
            border: '#6B6559',
          },
          'cafeteria-food': {
            fill: '#D9A441',
            border: '#B8842A',
          },
          sports: {
            fill: '#7A9B76',
            border: '#5C7D58',
          },
          gardens: {
            fill: '#A3BC8F',
            border: '#7E9A6B',
          },
          'other-misc': {
            fill: '#A78BA8',
            border: '#87698A',
          },
        },
      },
      fontFamily: {
        // VT323 is primary display/heading font.
        // We will define standard monospace backup fonts here.
        display: ['VT323', 'ui-monospace', 'SF Mono', 'Cascadia Code', 'monospace'],
        body: ['ui-monospace', 'SF Mono', 'Cascadia Code', 'monospace'],
      },
      spacing: {
        // Space for placeholder custom spacing design tokens in future steps
      },
    },
  },
  plugins: [],
}
