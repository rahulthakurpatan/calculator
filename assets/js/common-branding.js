/* Shared InvestCalc favicon, touch icon and web app branding.
   Load this file on every public page to keep browser branding consistent. */
(() => {
  'use strict';

  if (window.__investcalcBrandingLoaded) return;
  window.__investcalcBrandingLoaded = true;

  const links = [
    { rel: 'icon', type: 'image/svg+xml', href: '/favicon.svg' },
    { rel: 'icon', type: 'image/x-icon', href: '/favicon.ico' },
    { rel: 'icon', type: 'image/png', sizes: '180x180', href: '/favicon-180.png' },
    { rel: 'apple-touch-icon', sizes: '180x180', href: '/favicon-180.png' },
    { rel: 'manifest', href: '/site.webmanifest' }
  ];

  links.forEach((item) => {
    const selector = item.rel === 'icon'
      ? `link[rel="icon"][type="${item.type}"]`
      : `link[rel="${item.rel}"]`;

    let link = document.head.querySelector(selector);
    if (!link) {
      link = document.createElement('link');
      link.rel = item.rel;
      document.head.appendChild(link);
    }

    Object.entries(item).forEach(([key, value]) => {
      if (key !== 'rel') link.setAttribute(key, value);
    });
  });

  let themeColor = document.head.querySelector('meta[name="theme-color"]');
  if (!themeColor) {
    themeColor = document.createElement('meta');
    themeColor.name = 'theme-color';
    document.head.appendChild(themeColor);
  }
  themeColor.content = '#1769e0';
})();
