export default {
  plugins: {
    // Tailwind 4 via PostCSS rather than @tailwindcss/vite: the Vite plugin
    // calls createIdResolver, which the Rolldown-based Vite that Astro 7
    // bundles does not expose.
    '@tailwindcss/postcss': {}
  }
};
