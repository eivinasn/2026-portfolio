import { defineConfig } from 'astro/config';
import tailwind from '@astrojs/tailwind';
import sitemap from '@astrojs/sitemap';

export default defineConfig({
  site: 'https://eivinasn.com',
  // The live server already 301s /work/dexcom -> /work/dexcom/. Canonical URLs,
  // internal links and (from increment 4) the sitemap all match that form.
  trailingSlash: 'always',
  integrations: [
    tailwind({
      applyBaseStyles: false
    }),
    sitemap({
      // 404 is noindex; listing it would contradict that.
      filter: (page) => !page.endsWith('/404/') && !page.endsWith('/404.html')
    })
  ]
});
