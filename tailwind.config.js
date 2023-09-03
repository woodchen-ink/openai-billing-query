module.exports = {

  theme: {
    screens: {
      "sm": "640px",
      "md": "768px",
      "lg": "1024px",
      "xl": "1280px",
      "2xl": "1600px",
      'sm': '576px',
      "2xl": { 'max': '1600px' },
      // => @media (min-width: 576px) { ... }

      'md': '960px',
      // => @media (min-width: 960px) { ... }

      'lg': '1560px',
      // => @media (min-width: 1440px) { ... }
    }
  },

  plugins: [require("daisyui")],
  variants: {
    extend: {
      borderColor: ['responsive', 'hover', 'focus']
    }
  }
}
