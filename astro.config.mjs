import { defineConfig } from 'astro/config';
import tailwind from '@astrojs/tailwind';

export default defineConfig({
  site: 'https://eivinasn.com',
  // The live server already 301s /work/dexcom -> /work/dexcom/. Canonical URLs,
  // internal links and (from increment 4) the sitemap all match that form.
  trailingSlash: 'always',
  integrations: [
    tailwind({
      applyBaseStyles: false
    })
  ]
});

