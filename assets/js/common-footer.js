/* Shared footer for all InvestCalc pages.
   Add <div id="site-footer"></div> and load /assets/js/common-footer.js.
   If the mount is absent, the footer is appended to the page automatically. */
(() => {
  'use strict';
  const calculators = [
    ['ROI Calculator', '/'],
    ['SIP Calculator', '/sip-calculator/'],
    ['Lump Sum Calculator', '/lump-sum-calculator/'],
    ['Compound Interest Calculator', '/compound-interest-calculator/'],
    ['CAGR Calculator', '/cagr-calculator/'],
    ['Simple Interest Calculator', '/simple-interest-calculator/'],
    ['FD Calculator', '/fd-calculator/'],
    ['RD Calculator', '/rd-calculator/'],
    ['PPF Calculator', '/ppf-calculator/'],
    ['SWP Calculator', '/swp-calculator/'],
    ['Step-Up SIP Calculator', '/step-up-sip-calculator/'],
    ['Inflation Calculator', '/inflation-calculator/'],
    ['Retirement Calculator', '/retirement-calculator/'],
    ['Goal-Based Investment Calculator', '/goal-based-investment-calculator/'],
    ['Mutual Fund Returns Calculator', '/mutual-fund-returns-calculator/'],
    ['Stock Average Calculator', '/stock-average-calculator/'],
    ['Dividend Yield Calculator', '/dividend-yield-calculator/'],
    ['NPV Calculator', '/npv-calculator/'],
    ['IRR Calculator', '/irr-calculator/'],
    ['Payback Period Calculator', '/payback-period-calculator/'],
    ['Break-Even Calculator', '/break-even-calculator/']
  ];
  const style = document.createElement('style');
  style.id = 'investcalc-common-footer-style';
  style.textContent = `
    #investcalc-footer{background:#13243b;color:#d5dfed;margin-top:38px;font-family:Inter,system-ui,-apple-system,"Segoe UI",sans-serif}
    #investcalc-footer *{box-sizing:border-box}
    #investcalc-footer .icf-wrap{width:min(1080px,calc(100% - 40px));margin:auto;padding:38px 0 18px}
    #investcalc-footer .icf-grid{display:grid;grid-template-columns:1.15fr 1fr 1fr;gap:34px}
    #investcalc-footer .icf-brand{display:inline-flex;align-items:center;gap:10px;color:#fff;font-size:20px;font-weight:850;letter-spacing:-.5px;text-decoration:none}
    #investcalc-footer .icf-mark{width:38px;height:38px;border-radius:11px;background:#1769e0;display:grid;place-items:center;color:#fff;font-size:21px}
    #investcalc-footer p{max-width:330px;color:#b8c6d9;font-size:13px;line-height:1.7;margin:13px 0 0}
    #investcalc-footer h2{font-size:14px;color:#fff;margin:4px 0 13px;font-weight:800}
    #investcalc-footer .icf-links{display:grid;grid-template-columns:1fr 1fr;gap:8px 13px}
    #investcalc-footer .icf-links a,#investcalc-footer .icf-bottom a{font-size:12px;color:#c4d1e2;text-decoration:none;line-height:1.5}
    #investcalc-footer a:hover{color:#fff;text-decoration:underline}
    #investcalc-footer .icf-bottom{display:flex;justify-content:space-between;align-items:center;gap:14px;flex-wrap:wrap;border-top:1px solid #34465e;margin-top:28px;padding-top:16px;color:#aebdd1;font-size:11px}
    #investcalc-footer .icf-bottom-links{display:flex;gap:17px;flex-wrap:wrap}
    @media(max-width:760px){#investcalc-footer .icf-grid{grid-template-columns:1fr 1fr;gap:24px}#investcalc-footer .icf-about{grid-column:1/-1}}
    @media(max-width:480px){#investcalc-footer .icf-wrap{width:calc(100% - 28px);padding-top:30px}#investcalc-footer .icf-grid{grid-template-columns:1fr;gap:22px}#investcalc-footer .icf-about{grid-column:auto}}
  `;
  document.head.appendChild(style);
  const link = (item) => '<a href="' + item[1] + '">' + item[0] + '</a>';
  const calculatorLinks = calculators.map(link).join('');
  const mount = document.getElementById('site-footer');
  const footer = document.createElement('footer');
  footer.id = 'investcalc-footer';
  footer.innerHTML =
    '<div class="icf-wrap"><div class="icf-grid">' +
      '<section class="icf-about"><a class="icf-brand" href="/" aria-label="InvestCalc home"><span class="icf-mark">%</span><span>InvestCalc</span></a>' +
      '<p>Free and easy-to-use calculators to help you understand investments, returns and everyday financial decisions.</p></section>' +
      '<section><h2>Popular calculators</h2><div class="icf-links">' + calculators.slice(0, 10).map(link).join('') + '</div></section>' +
      '<section><h2>All calculators</h2><div class="icf-links">' + calculators.slice(10).map(link).join('') + '</div></section>' +
    '</div><div class="icf-bottom"><span>© <span id="investcalc-footer-year"></span> InvestCalc. All rights reserved.</span>' +
    '<div class="icf-bottom-links"><a href="/">Home</a><a href="/about/">About</a><a href="/contact/">Contact</a><a href="/privacy-policy/">Privacy Policy</a><a href="/terms/">Terms</a></div></div></div>';
  if (mount) mount.replaceWith(footer);
  else document.body.appendChild(footer);
  const year = document.getElementById('investcalc-footer-year');
  if (year) year.textContent = new Date().getFullYear();
})();
