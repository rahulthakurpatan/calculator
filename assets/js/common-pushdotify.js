/* Shared NameDotify / PushDotify integration for all InvestCalc pages.
   The site-level service worker is maintained separately at /sw.js. */
(() => {
  'use strict';

  if (window.__investcalcPushDotifyLoaded) return;
  window.__investcalcPushDotifyLoaded = true;

  window.PushDotifyConfig = {
    title: "Get Instant Updates",
    desc: "Subscribe to get notified about our latest posts and offers!",
    color: "#4f46e5",
    delay: 2000
  };

  const script = document.createElement('script');
  script.src = 'https://namedotify.com/api/script/pushdotify.js?key=336b7b7b-65e3-451d-91eb-dce6c299819d';
  script.async = true;
  script.onerror = () => {
    console.error('NameDotify: PushDotify script could not be loaded.');
  };
  (document.head || document.documentElement).appendChild(script);
})();
