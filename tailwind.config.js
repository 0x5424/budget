/** @type {import('tailwindcss').Config} */
export default {
  content: ['./src/**/*.{svelte,ts}'],
  theme: {
    container: {
      center: true,
      padding: '1.5rem',
    },
    extend: {},
  },
  plugins: [
    require('@tailwindcss/forms')
  ]
}

