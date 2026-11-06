/* Shared Google Analytics / Tag Manager loader for InvestCalc.
 * Loads the site's configured GTM container once per page.
 * Keep the container ID in sync with the Google Analytics setup.
 */
(() => {
  'use strict';

  const containerId = 'GTM-5JP6QNKJ';
  const scriptUrl = 'https://www.googletagmanager.com/gtm.js?id=' + containerId;

  if (window.__investCalcGtmLoaded) return;
  window.__investCalcGtmLoaded = true;

  window.dataLayer = window.dataLayer || [];
  window.gtag = window.gtag || function () {
    window.dataLayer.push(arguments);
  };
  window.gtag('js', new Date());

  if (document.querySelector('script[src="' + scriptUrl + '"]')) return;

  const tag = document.createElement('script');
  tag.async = true;
  tag.src = scriptUrl;
  const firstScript = document.getElementsByTagName('script')[0];
  if (firstScript && firstScript.parentNode) {
    firstScript.parentNode.insertBefore(tag, firstScript);
  } else {
    document.head.appendChild(tag);
  }
})();
