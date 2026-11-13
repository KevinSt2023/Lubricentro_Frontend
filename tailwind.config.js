/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/**/*.{html,ts}'],
  darkMode: ['class', '[data-theme="dark"]'],
  theme: {
    extend: {
      colors: {
        // Paleta de marca LubriTech, tomada del logo. Cada token es una
        // variable CSS para que el modo claro/oscuro la redefina sin tocar
        // el markup.
        grafito: {
          DEFAULT: 'var(--lt-grafito)',
          900: 'var(--lt-grafito-900)',
          800: 'var(--lt-grafito-800)',
          700: 'var(--lt-grafito-700)',
        },
        acero: {
          DEFAULT: 'var(--lt-acero)',
          600: 'var(--lt-acero-600)',
          500: 'var(--lt-acero-500)',
          400: 'var(--lt-acero-400)',
        },
        plata: {
          DEFAULT: 'var(--lt-plata)',
          300: 'var(--lt-plata-300)',
          200: 'var(--lt-plata-200)',
          100: 'var(--lt-plata-100)',
        },
        marca: {
          DEFAULT: 'var(--lt-rojo)',
          hover: 'var(--lt-rojo-700)',
          soft: 'var(--lt-rojo-soft)',
        },
        // Superficies semanticas (se redefinen en claro/oscuro).
        fondo: 'var(--lt-fondo)',
        superficie: 'var(--lt-superficie)',
        'superficie-2': 'var(--lt-superficie-2)',
        borde: 'var(--lt-borde)',
        texto: 'var(--lt-texto)',
        'texto-tenue': 'var(--lt-texto-tenue)',
      },
      fontFamily: {
        sans: ['Inter', 'Roboto', 'system-ui', 'sans-serif'],
      },
      borderRadius: {
        xl: '0.875rem',
      },
      boxShadow: {
        marca: '0 6px 20px -6px rgba(224, 30, 38, 0.45)',
      },
    },
  },
  plugins: [],
};
