/*
 * InvestCalc shared navigation
 * Add <div id="site-header"></div> near the start of <body>, then load:
 * <script src="/assets/js/common-header.js" defer></script>
 * The header also mounts automatically at the start of <body> if no mount exists.
 */
(() => {
  'use strict';

  const calculators = [
    { label: 'ROI Calculator', href: '/', group: 'Investment returns' },
    { label: 'SIP Calculator', href: '/sip-calculator/', group: 'Investment returns' },
    { label: 'Lump Sum Calculator', href: '/lump-sum-calculator/', group: 'Investment returns' },
    { label: 'Compound Interest Calculator', href: '/compound-interest-calculator/', group: 'Investment returns' },
    { label: 'CAGR Calculator', href: '/cagr-calculator/', group: 'Investment returns' },
    { label: 'Mutual Fund Returns Calculator', href: '/mutual-fund-returns-calculator/', group: 'Investment returns' },
    { label: 'Step-Up SIP Calculator', href: '/step-up-sip-calculator/', group: 'Investment returns' },
    { label: 'Stock Average Calculator', href: '/stock-average-calculator/', group: 'Investment returns' },
    { label: 'Dividend Yield Calculator', href: '/dividend-yield-calculator/', group: 'Investment returns' },
    { label: 'FD Calculator', href: '/fd-calculator/', group: 'Savings & deposits' },
    { label: 'RD Calculator', href: '/rd-calculator/', group: 'Savings & deposits' },
    { label: 'PPF Calculator', href: '/ppf-calculator/', group: 'Savings & deposits' },
    { label: 'SWP Calculator', href: '/swp-calculator/', group: 'Savings & deposits' },
    { label: 'Simple Interest Calculator', href: '/simple-interest-calculator/', group: 'Savings & deposits' },
    { label: 'Inflation Calculator', href: '/inflation-calculator/', group: 'Planning' },
    { label: 'Retirement Calculator', href: '/retirement-calculator/', group: 'Planning' },
    { label: 'Goal-Based Investment Calculator', href: '/goal-based-investment-calculator/', group: 'Planning' },
    { label: 'NPV Calculator', href: '/npv-calculator/', group: 'Business finance' },
    { label: 'IRR Calculator', href: '/irr-calculator/', group: 'Business finance' },
    { label: 'Payback Period Calculator', href: '/payback-period-calculator/', group: 'Business finance' },
    { label: 'Break-Even Calculator', href: '/break-even-calculator/', group: 'Business finance' }
  ];

  const style = document.createElement('style');
  style.id = 'investcalc-header-styles';
  style.textContent = `
    #calculator-site-header{position:relative;z-index:1000;background:#fff;border-bottom:1px solid #e4eaf2;color:#152238;font-family:Inter,system-ui,-apple-system,"Segoe UI",sans-serif}
    #calculator-site-header *{box-sizing:border-box}
    #calculator-site-header .ich-wrap{width:min(1120px,calc(100% - 36px));margin:0 auto;min-height:72px;display:flex;align-items:center;justify-content:space-between;gap:22px}
    #calculator-site-header .ich-brand{display:inline-flex;align-items:center;gap:10px;text-decoration:none;color:#152238;font-size:20px;font-weight:850;letter-spacing:-.5px;white-space:nowrap}
    #calculator-site-header .ich-mark{width:39px;height:39px;display:grid;place-items:center;border-radius:11px;background:#1769e0;color:#fff;font-size:21px}
    #calculator-site-header .ich-nav{display:flex;align-items:center;gap:8px}
    #calculator-site-header .ich-link,#calculator-site-header .ich-menu summary{display:inline-flex;align-items:center;gap:7px;padding:10px 12px;border:0;border-radius:9px;background:transparent;color:#52627a;text-decoration:none;font:650 14px/1.2 inherit;cursor:pointer;list-style:none}
    #calculator-site-header .ich-link:hover,#calculator-site-header .ich-menu summary:hover,#calculator-site-header .ich-menu[open] summary{background:#edf4ff;color:#1769e0}
    #calculator-site-header .ich-menu{position:relative}
    #calculator-site-header .ich-menu summary::-webkit-details-marker{display:none}
    #calculator-site-header .ich-menu summary:after{content:"⌄";font-size:16px;margin-left:2px}
    #calculator-site-header .ich-dropdown{position:absolute;top:calc(100% + 12px);right:0;width:min(680px,calc(100vw - 36px));padding:20px;background:#fff;border:1px solid #e4eaf2;border-radius:14px;box-shadow:0 18px 45px rgba(21,34,56,.15);display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:18px}
    #calculator-site-header .ich-group h3{margin:0 0 8px;color:#1769e0;font-size:12px;letter-spacing:.04em;text-transform:uppercase}
    #calculator-site-header .ich-group a{display:block;padding:7px 8px;border-radius:7px;color:#334155;text-decoration:none;font-size:13px;line-height:1.35}
    #calculator-site-header .ich-group a:hover,#calculator-site-header .ich-group a[aria-current="page"]{background:#edf4ff;color:#135fc9}
    #calculator-site-header .ich-action{display:inline-flex;align-items:center;justify-content:center;padding:11px 15px;border-radius:9px;background:#1769e0;color:#fff;text-decoration:none;font-size:13px;font-weight:800;white-space:nowrap}
    #calculator-site-header .ich-action:hover{background:#1054bd}
    #calculator-site-header .ich-toggle{display:none;border:1px solid #dce4ef;border-radius:9px;background:#fff;color:#152238;padding:9px 12px;font:700 14px inherit;cursor:pointer}
    #calculator-site-header .ich-mobile{display:none}
    @media(max-width:760px){
      #calculator-site-header .ich-wrap{min-height:64px;flex-wrap:wrap;gap:10px;padding:10px 0}
      #calculator-site-header .ich-nav,#calculator-site-header .ich-action{display:none}
      #calculator-site-header .ich-toggle{display:inline-flex}
      #calculator-site-header .ich-mobile{width:100%;display:none;padding:8px 0 4px;border-top:1px solid #edf1f6}
      #calculator-site-header .ich-mobile.is-open{display:block}
      #calculator-site-header .ich-mobile .ich-mobile-home{display:block;padding:10px 8px;color:#1769e0;text-decoration:none;font-size:14px;font-weight:750}
      #calculator-site-header .ich-mobile details{border-top:1px solid #edf1f6}
      #calculator-site-header .ich-mobile summary{padding:12px 8px;color:#334155;font-size:14px;font-weight:750;cursor:pointer;list-style:none}
      #calculator-site-header .ich-mobile summary::-webkit-details-marker{display:none}
      #calculator-site-header .ich-mobile .ich-mobile-links{display:grid;grid-template-columns:1fr 1fr;gap:2px 8px;padding:0 4px 12px}
      #calculator-site-header .ich-mobile a{padding:8px;color:#52627a;text-decoration:none;font-size:13px;border-radius:7px}
      #calculator-site-header .ich-mobile a:hover,#calculator-site-header .ich-mobile a[aria-current="page"]{background:#edf4ff;color:#135fc9}
    }
    @media(max-width:420px){#calculator-site-header .ich-mobile .ich-mobile-links{grid-template-columns:1fr}}
  `;
  document.head.appendChild(style);

  const groups = [...new Set(calculators.map(item => item.group))];
  const pathname = window.location.pathname.replace(/index\.html$/, '').replace(/\/$/, '') || '/';
  const isCurrent = href => (href === '/' ? pathname === '/' : pathname === href.replace(/\/$/, ''));

  const groupMarkup = group => {
    const links = calculators.filter(item => item.group === group).map(item =>
      `<a href="${item.href}"${isCurrent(item.href) ? ' aria-current="page"' : ''}>${item.label}</a>`
    ).join('');
    return `<section class="ich-group"><h3>${group}</h3>${links}</section>`;
  };

  const desktopMenu = `<details class="ich-menu"><summary>All calculators</summary><div class="ich-dropdown">${groups.map(groupMarkup).join('')}</div></details>`;
  const mobileMenu = groups.map(group => {
    const links = calculators.filter(item => item.group === group).map(item =>
      `<a href="${item.href}"${isCurrent(item.href) ? ' aria-current="page"' : ''}>${item.label}</a>`
    ).join('');
    return `<details><summary>${group}</summary><div class="ich-mobile-links">${links}</div></details>`;
  }).join('');

  const markup = `
    <div class="ich-wrap">
      <a class="ich-brand" href="/" aria-label="InvestCalc home"><span class="ich-mark">%</span><span>InvestCalc</span></a>
      <nav class="ich-nav" aria-label="Main navigation">
        <a class="ich-link" href="/">Home</a>${desktopMenu}
      </nav>
      <a class="ich-action" href="/#calculator">Use ROI Calculator <span aria-hidden="true">→</span></a>
      <button class="ich-toggle" type="button" aria-expanded="false" aria-controls="ich-mobile-menu">☰ Menu</button>
      <div class="ich-mobile" id="ich-mobile-menu">
        <a class="ich-mobile-home" href="/">Home / ROI Calculator</a>${mobileMenu}
      </div>
    </div>`;

  const mount = document.getElementById('site-header');
  const header = document.createElement('header');
  header.id = 'calculator-site-header';
  header.innerHTML = markup;
  if (mount) mount.replaceWith(header);
  else document.body.insertBefore(header, document.body.firstChild);

  const toggle = header.querySelector('.ich-toggle');
  const mobile = header.querySelector('.ich-mobile');
  toggle.addEventListener('click', () => {
    const open = mobile.classList.toggle('is-open');
    toggle.setAttribute('aria-expanded', String(open));
    toggle.textContent = open ? '✕ Close' : '☰ Menu';
  });

  header.querySelectorAll('.ich-dropdown a,.ich-mobile a').forEach(link => {
    link.addEventListener('click', () => {
      header.querySelectorAll('details[open]').forEach(details => details.removeAttribute('open'));
      mobile.classList.remove('is-open');
      toggle.setAttribute('aria-expanded', 'false');
      toggle.textContent = '☰ Menu';
    });
  });

  document.addEventListener('click', event => {
    if (!header.contains(event.target)) {
      header.querySelectorAll('.ich-menu[open]').forEach(menu => menu.removeAttribute('open'));
    }
  });
})();
