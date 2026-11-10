/*
 * InvestCalc shared premium header.
 * Seven-category navigation with responsive mega menu and mobile accordion.
 * Add <div id="site-header"></div> and load this file on each page.
 */
(() => {
  'use strict';
  if (document.getElementById('calculator-site-header')) return;

  const categories = [
    {
      label: 'Invest & Mutual Funds',
      tools: [
        ['ROI Calculator', '/', 'Calculate investment profit, loss and ROI'],
        ['SIP Calculator', '/sip-calculator/', 'Estimate monthly SIP returns, goals and step-up growth'],
        ['Compound Interest Calculator', '/compound-interest-calculator/', 'Estimate the future corpus of a one-time investment'],
        ['Step-Up SIP Calculator', '/step-up-sip-calculator/', 'Increase your SIP contribution every year'],
        ['Lump Sum Calculator', '/lump-sum-calculator/', 'Estimate returns from a one-time investment'],
        ['Mutual Fund vs FD Comparison', '/mutual-fund-vs-fd-comparison/', 'Compare estimated mutual fund and FD returns'],
        ['SWP Calculator', '/swp-calculator/', 'Estimate regular withdrawals from your corpus'],
        ['Goal-Based Investment Planner', '/goal-based-investment-planner/', 'Plan investments to reach a financial goal']
      ]
    },
    {
      label: 'Tax & Salary',
      tools: [
        ['Income Tax Calculator', '/income-tax-calculator/', 'Compare old and new income tax regimes'],
        ['All-in-One TDS Calculator', '/tds-calculator/', 'Estimate tax deducted at source'],
        ['GST Calculator', '/gst-calculator/', 'Calculate GST-inclusive and exclusive amounts'],
        ['Company / Corporate Tax Calculator', '/company-corporate-tax-calculator/', 'Estimate company income tax, surcharge and MAT'],
        ['Gratuity Calculator', '/gratuity-calculator/', 'Estimate gratuity under current labour-code rules'],
        ['HRA Calculator', '/hra-calculator/', 'Calculate HRA exemption under old and new tax regimes'],

      ]
    },
    {
      label: 'Business & Creator',
      tools: [
        ['Business Profit & Loss Tracker', '/business-profit-loss-tracker/', 'Track revenue, expenses and net profit'],
        ['YouTube AdSense Revenue Calculator', '/youtube-adsense-revenue-calculator/', 'Estimate YouTube ad revenue from views'],
        ['Instagram Earning Calculator', '/instagram-earning-calculator/', 'Estimate creator income from brand deals and other sources'],
        ['Freelance Hourly Rate Calculator', '/freelance-hourly-rate-calculator/', 'Set an hourly rate from income goals'],
        ['Blog Traffic to Income Calculator', '/blog-traffic-to-income-calculator/', 'Estimate blog earnings from traffic'],
        ['Crypto Portfolio Growth Calculator', '/crypto-profit-tax-calculator/', 'Project the future value of manually entered crypto holdings'],
      ]
    },
    {
      label: 'Family & Goals',
      tools: [
        ['Daughter Marriage Saving Planner', '/daughter-marriage-saving-planner/', 'Estimate savings for a future wedding goal'],
        ['Sukanya Samriddhi Yojana Calculator', '/sukanya-samriddhi-yojana-calculator/', 'Estimate SSY contributions and maturity'],
        ['Kundali Money & Dhan Yog Calculator', '/kundali-money-dhan-yog-calculator/', 'Explore a traditional astrology-based reading'],
      ]
    },
    {
      label: 'Savings & Loans',
      tools: [
        ['Fixed Deposit Calculator', '/fd-calculator/', 'Estimate FD interest and maturity value'],
        ['Loan Prepayment vs Investment Calculator', '/loan-prepayment-vs-investment-calculator/', 'Compare paying down debt with investing extra cash'],
        ['Mortgage Refinance & Balance Transfer Calculator', '/mortgage-refinance-calculator/', 'Compare refinance fees, monthly savings and break-even time'],
        ['Emergency Fund & Financial Runway Calculator', '/emergency-fund-calculator/', 'Set an emergency savings target and estimate cash runway after income loss']
      ]
    },
    {
      label: 'Property & Tools',
      tools: [
        ['Solar Rooftop ROI Calculator', '/solar-rooftop-roi-calculator/', 'Estimate solar savings and payback period'],
        ['House Construction Cost Estimator', '/house-construction-cost-estimator/', 'Estimate a home construction budget'],
        ['CPCT Typing Practice', '/cpct-typing-practice/', 'Practise English and Hindi Unicode typing for CPCT']
      ]
    },
    {
      label: 'About & Support',
      tools: [
        ['About', '/about/', 'Learn about this calculator website'],
        ['Contact', '/contact/', 'Get in touch with us'],
        ['Privacy Policy', '/privacy-policy/', 'Read how website data and privacy are handled'],
        ['Terms', '/terms/', 'Review the website terms and conditions']
      ]
    }
  ];

  const style = document.createElement('style');
  style.id = 'investcalc-header-styles';
  style.textContent = `
    #calculator-site-header{position:relative;z-index:100;background:#101827;color:#f4f6fa;border-bottom:1px solid #29384d;font-family:Inter,system-ui,-apple-system,"Segoe UI",sans-serif;box-shadow:0 8px 24px rgba(5,12,24,.12)}
    #calculator-site-header *{box-sizing:border-box}
    #calculator-site-header .ich-wrap{width:min(1180px,calc(100% - 40px));margin:0 auto}
    #calculator-site-header .ich-top{min-height:76px;display:flex;align-items:center;justify-content:space-between;gap:20px}
    #calculator-site-header .ich-brand{display:inline-flex;align-items:baseline;gap:0;text-decoration:none;white-space:nowrap;line-height:1;letter-spacing:-.8px}
    #calculator-site-header .ich-return{font-family:Inter,system-ui,sans-serif;font-size:clamp(19px,2vw,25px);font-weight:450;color:#f4f6fa}
    #calculator-site-header .ich-on{font-family:Georgia,"Times New Roman",serif;font-size:clamp(20px,2.1vw,27px);font-style:italic;font-weight:700;color:#d6b36a;margin:0 3px}
    #calculator-site-header .ich-investment{font-family:Inter,system-ui,sans-serif;font-size:clamp(19px,2vw,25px);font-weight:850;color:#fff}
    #calculator-site-header .ich-brand-sub{display:block;margin-top:7px;text-align:center;color:#b9c5d5;font-size:9px;font-weight:750;letter-spacing:.29em}
    #calculator-site-header .ich-brand-sub:before,#calculator-site-header .ich-brand-sub:after{content:"";display:inline-block;width:17px;height:1px;background:#d6b36a;vertical-align:middle;margin:0 7px}
    #calculator-site-header .ich-top-right{display:flex;align-items:center;gap:15px}
    #calculator-site-header .ich-home{color:#c3cedc;text-decoration:none;font-size:13px;font-weight:700}
    #calculator-site-header .ich-home:hover{color:#e8c987}
    #calculator-site-header .ich-nav{border-top:1px solid #29384d}
    #calculator-site-header .ich-nav-list{display:grid;grid-template-columns:repeat(7,minmax(0,1fr));gap:5px;align-items:stretch}
    #calculator-site-header .ich-nav-button{position:relative;display:flex;align-items:center;justify-content:center;min-width:0;min-height:51px;padding:10px 5px;border:0;border-bottom:2px solid transparent;border-radius:0;background:transparent;color:#d5dde8;font:700 clamp(10px,.95vw,13px)/1.25 Inter,system-ui,sans-serif;text-align:center;white-space:nowrap;cursor:pointer;transition:color .18s ease,background .18s ease,border-color .18s ease}
    #calculator-site-header .ich-nav-button:hover,#calculator-site-header .ich-nav-button[aria-expanded="true"]{color:#e8c987;background:#172438;border-bottom-color:#d6b36a}
    #calculator-site-header .ich-nav-button:focus-visible,#calculator-site-header a:focus-visible,#calculator-site-header .ich-mobile-toggle:focus-visible{outline:2px solid #e8c987;outline-offset:2px}
    #calculator-site-header .ich-chevron{width:10px;height:10px;margin-left:6px;border-right:1.5px solid currentColor;border-bottom:1.5px solid currentColor;transform:rotate(45deg) translateY(-2px);flex:none;transition:transform .18s ease}
    #calculator-site-header .ich-nav-button[aria-expanded="true"] .ich-chevron{transform:rotate(225deg) translate(-1px,-1px)}
    #calculator-site-header .ich-mega{display:none;position:absolute;left:0;right:0;top:100%;padding:0 20px;z-index:110}
    #calculator-site-header .ich-mega.is-open{display:block}
    #calculator-site-header .ich-mega-inner{width:min(1180px,100%);margin:0 auto;padding:22px 25px 20px;background:#172438;border:1px solid #34465d;border-top:2px solid #d6b36a;border-radius:0 0 14px 14px;box-shadow:0 18px 38px rgba(0,0,0,.3)}
    #calculator-site-header .ich-mega-head{display:flex;justify-content:space-between;align-items:center;gap:15px;margin-bottom:15px}
    #calculator-site-header .ich-kicker{margin:0 0 4px;color:#d6b36a;font-size:10px;font-weight:850;letter-spacing:.16em;text-transform:uppercase}
    #calculator-site-header .ich-mega-title{margin:0;color:#fff;font-size:19px;font-weight:800;letter-spacing:-.3px}
    #calculator-site-header .ich-count{padding:5px 9px;border:1px solid #496047;border-radius:30px;background:#1d352f;color:#b9e4cd;font-size:10px;font-weight:800;white-space:nowrap}
    #calculator-site-header .ich-tool-grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:8px 14px}
    #calculator-site-header .ich-tool{display:block;min-width:0;padding:10px 11px;border:1px solid transparent;border-radius:8px;color:#f4f6fa;text-decoration:none;transition:background .18s ease,border-color .18s ease}
    #calculator-site-header .ich-tool:hover,#calculator-site-header .ich-tool[aria-current="page"]{background:#22344b;border-color:#40536d}
    #calculator-site-header .ich-tool-name{display:block;font-size:13px;font-weight:750;line-height:1.35}
    #calculator-site-header .ich-tool-desc{display:block;margin-top:4px;color:#aebbd0;font-size:11px;line-height:1.4}
    #calculator-site-header .ich-tool[aria-current="page"] .ich-tool-name{color:#e8c987}
    #calculator-site-header .ich-mega-foot{display:flex;justify-content:flex-end;margin-top:13px;padding-top:12px;border-top:1px solid #34465d;color:#d6b36a;font-size:10px;font-weight:850;letter-spacing:.08em;text-transform:uppercase}
    #calculator-site-header .ich-mobile-toggle{display:none;align-items:center;justify-content:center;width:40px;height:40px;border:1px solid #435168;border-radius:9px;background:#172438;color:#f4f6fa;cursor:pointer}
    #calculator-site-header .ich-mobile-nav{display:none}
    #calculator-site-header .ich-mobile-nav.is-open{display:block;padding:5px 0 14px;border-top:1px solid #29384d}
    #calculator-site-header .ich-mobile-category{border-bottom:1px solid #29384d}
    #calculator-site-header .ich-mobile-category>button{display:flex;align-items:center;justify-content:space-between;width:100%;padding:13px 3px;border:0;background:transparent;color:#e1e7ef;font:750 13px Inter,system-ui,sans-serif;text-align:left;cursor:pointer}
    #calculator-site-header .ich-mobile-category>button[aria-expanded="true"]{color:#e8c987}
    #calculator-site-header .ich-mobile-tools{display:none;padding:0 0 10px 9px}
    #calculator-site-header .ich-mobile-tools.is-open{display:block}
    #calculator-site-header .ich-mobile-tools a{display:block;padding:8px 10px;border-radius:7px;color:#c6d1df;text-decoration:none;font-size:12px}
    #calculator-site-header .ich-mobile-tools a:hover,#calculator-site-header .ich-mobile-tools a[aria-current="page"]{background:#22344b;color:#e8c987}
    @media(max-width:760px){
      #calculator-site-header .ich-wrap{width:calc(100% - 30px)}
      #calculator-site-header .ich-top{min-height:67px}
      #calculator-site-header .ich-home{display:none}
      #calculator-site-header .ich-mobile-toggle{display:flex}
      #calculator-site-header .ich-nav{display:none}
      #calculator-site-header .ich-mega{display:none!important}
    }
    @media(max-width:380px){
      #calculator-site-header .ich-return,#calculator-site-header .ich-investment{font-size:17px}
      #calculator-site-header .ich-on{font-size:19px}
      #calculator-site-header .ich-brand-sub{font-size:8px;letter-spacing:.24em}
    }
    @media(prefers-reduced-motion:reduce){#calculator-site-header *{transition:none!important}}
  `;
  document.head.appendChild(style);

  const pathname = window.location.pathname.replace(/index\.html$/, '').replace(/\/$/, '') || '/';
  const isCurrent = href => href === '/' ? pathname === '/' : pathname === href.replace(/\/$/, '');
  const escapeHtml = value => String(value).replace(/[&<>"']/g, char => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
  const toolLink = ([label, href, description]) =>
    '<a class="ich-tool" href="' + href + '"' + (isCurrent(href) ? ' aria-current="page"' : '') + '><span class="ich-tool-name">' + escapeHtml(label) + '</span><span class="ich-tool-desc">' + escapeHtml(description) + '</span></a>';

  const header = document.createElement('header');
  header.id = 'calculator-site-header';
  header.innerHTML =
    '<div class="ich-wrap">' +
      '<div class="ich-top">' +
        '<a class="ich-brand" href="/" aria-label="Return on Investment Calculator home"><span><span class="ich-return">Return</span><span class="ich-on">on</span><span class="ich-investment">Investment</span><span class="ich-brand-sub">CALCULATOR</span></span></a>' +
        '<div class="ich-search-mount" id="investcalc-search-mount"></div>' +
        '<div class="ich-top-right"><a class="ich-home" href="/">Home</a><button class="ich-mobile-toggle" type="button" aria-label="Open calculator categories" aria-expanded="false"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M4 6h16M4 12h16M4 18h16"/></svg></button></div>' +
      '</div>' +
      '<nav class="ich-nav" aria-label="Calculator categories"><div class="ich-nav-list">' +
        categories.map((category, index) => '<button class="ich-nav-button" type="button" data-category="' + index + '" aria-expanded="false" aria-controls="ich-mega-menu">' + escapeHtml(category.label) + '<span class="ich-chevron" aria-hidden="true"></span></button>').join('') +
      '</div></nav>' +
      '<div class="ich-mega" id="ich-mega-menu" role="region" aria-label="Category calculators"><div class="ich-mega-inner"></div></div>' +
      '<div class="ich-mobile-nav" aria-label="Mobile calculator categories">' +
        categories.map((category, index) => '<section class="ich-mobile-category"><button type="button" data-mobile-category="' + index + '" aria-expanded="false">' + escapeHtml(category.label) + '<span class="ich-chevron" aria-hidden="true"></span></button><div class="ich-mobile-tools">' + category.tools.map(([label, href]) => '<a href="' + href + '"' + (isCurrent(href) ? ' aria-current="page"' : '') + '>' + escapeHtml(label) + '</a>').join('') + '</div></section>').join('') +
      '</div>' +
    '</div>';

  const mount = document.getElementById('site-header');
  if (mount) mount.replaceWith(header);
  else document.body.insertBefore(header, document.body.firstChild);

  if (!document.querySelector('script[data-investcalc-search]')) {
    const searchScript = document.createElement('script');
    searchScript.src = '/assets/js/common-search.js';
    searchScript.defer = true;
    searchScript.dataset.investcalcSearch = 'true';
    document.head.appendChild(searchScript);
  }

  const mega = header.querySelector('#ich-mega-menu');
  const megaInner = mega.querySelector('.ich-mega-inner');
  const desktopButtons = [...header.querySelectorAll('.ich-nav-button')];
  const closeMega = () => {
    mega.classList.remove('is-open');
    desktopButtons.forEach(button => button.setAttribute('aria-expanded', 'false'));
  };
  const openMega = index => {
    const category = categories[index];
    if (!category) return;
    megaInner.innerHTML =
      '<div class="ich-mega-head"><div><p class="ich-kicker">Explore calculators</p><h2 class="ich-mega-title">' + escapeHtml(category.label) + '</h2></div><span class="ich-count">' + category.tools.length + (category.tools.length === 1 ? ' TOOL' : ' TOOLS') + '</span></div>' +
      '<div class="ich-tool-grid">' + category.tools.map(toolLink).join('') + '</div>' +
      '<div class="ich-mega-foot">Choose a calculator to get started <span aria-hidden="true">&nbsp;→</span></div>';
    mega.classList.add('is-open');
    desktopButtons.forEach((button, buttonIndex) => button.setAttribute('aria-expanded', buttonIndex === index ? 'true' : 'false'));
  };

  desktopButtons.forEach((button, index) => {
    button.addEventListener('click', event => {
      event.stopPropagation();
      if (button.getAttribute('aria-expanded') === 'true') closeMega();
      else openMega(index);
    });
    button.addEventListener('mouseenter', () => {
      if (window.matchMedia('(min-width: 761px)').matches) openMega(index);
    });
    button.addEventListener('focus', () => openMega(index));
  });
  mega.addEventListener('mouseenter', () => {});
  header.querySelector('.ich-nav').addEventListener('mouseleave', event => {
    if (!mega.contains(event.relatedTarget)) closeMega();
  });
  mega.addEventListener('mouseleave', closeMega);
  document.addEventListener('click', event => {
    if (!header.contains(event.target)) closeMega();
  });
  document.addEventListener('keydown', event => {
    if (event.key === 'Escape') closeMega();
  });

  const mobileToggle = header.querySelector('.ich-mobile-toggle');
  const mobileNav = header.querySelector('.ich-mobile-nav');
  mobileToggle.addEventListener('click', () => {
    const open = mobileToggle.getAttribute('aria-expanded') !== 'true';
    mobileToggle.setAttribute('aria-expanded', String(open));
    mobileToggle.setAttribute('aria-label', open ? 'Close calculator categories' : 'Open calculator categories');
    mobileNav.classList.toggle('is-open', open);
  });
  header.querySelectorAll('[data-mobile-category]').forEach(button => {
    button.addEventListener('click', () => {
      const panel = button.nextElementSibling;
      const open = button.getAttribute('aria-expanded') !== 'true';
      header.querySelectorAll('[data-mobile-category]').forEach(other => {
        other.setAttribute('aria-expanded', 'false');
        other.nextElementSibling.classList.remove('is-open');
      });
      button.setAttribute('aria-expanded', String(open));
      panel.classList.toggle('is-open', open);
    });
  });

})();
