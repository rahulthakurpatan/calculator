/*
 * InvestCalc shared header with an always-visible calculator directory.
 * Add <div id="site-header"></div> and load this file on each page.
 */
(() => {
  'use strict';
  if (document.getElementById('calculator-site-header')) return;

  const calculators = [
    {label:'ROI Calculator',href:'/',group:'Investment returns'},
    {label:'SIP Calculator',href:'/sip-calculator/',group:'Investment returns'},
    {label:'Lump Sum Calculator',href:'/lump-sum-calculator/',group:'Investment returns'},
    {label:'Compound Interest Calculator',href:'/compound-interest-calculator/',group:'Investment returns'},
    {label:'CAGR Calculator',href:'/cagr-calculator/',group:'Investment returns'},
    {label:'Mutual Fund Returns Calculator',href:'/mutual-fund-returns-calculator/',group:'Investment returns'},
    {label:'Step-Up SIP Calculator',href:'/step-up-sip-calculator/',group:'Investment returns'},
    {label:'Stock Average Calculator',href:'/stock-average-calculator/',group:'Investment returns'},
    {label:'Dividend Yield Calculator',href:'/dividend-yield-calculator/',group:'Investment returns'},
    {label:'FD Calculator',href:'/fd-calculator/',group:'Savings & deposits'},
    {label:'RD Calculator',href:'/rd-calculator/',group:'Savings & deposits'},
    {label:'PPF Calculator',href:'/ppf-calculator/',group:'Savings & deposits'},
    {label:'SWP Calculator',href:'/swp-calculator/',group:'Savings & deposits'},
    {label:'Simple Interest Calculator',href:'/simple-interest-calculator/',group:'Savings & deposits'},
    {label:'Inflation Calculator',href:'/inflation-calculator/',group:'Planning'},
    {label:'Retirement Calculator',href:'/retirement-calculator/',group:'Planning'},
    {label:'Goal-Based Investment Calculator',href:'/goal-based-investment-calculator/',group:'Planning'},
    {label:'NPV Calculator',href:'/npv-calculator/',group:'Business finance'},
    {label:'IRR Calculator',href:'/irr-calculator/',group:'Business finance'},
    {label:'Payback Period Calculator',href:'/payback-period-calculator/',group:'Business finance'},
    {label:'Break-Even Calculator',href:'/break-even-calculator/',group:'Business finance'}
  ];

  const style = document.createElement('style');
  style.id = 'investcalc-header-styles';
  style.textContent = `
    #calculator-site-header{position:relative;z-index:50;background:#fff;border-bottom:1px solid #e4eaf2;color:#152238;font-family:Inter,system-ui,-apple-system,"Segoe UI",sans-serif}
    #calculator-site-header *{box-sizing:border-box}
    #calculator-site-header .ich-wrap{width:min(1120px,calc(100% - 36px));margin:0 auto}
    #calculator-site-header .ich-top{min-height:70px;display:flex;align-items:center;justify-content:space-between;gap:18px}
    #calculator-site-header .ich-brand{display:inline-flex;align-items:center;gap:10px;text-decoration:none;color:#152238;font-size:21px;font-weight:850;letter-spacing:-.5px;white-space:nowrap}
    #calculator-site-header .ich-mark{width:39px;height:39px;display:grid;place-items:center;border-radius:11px;background:#1769e0;color:#fff;font-size:21px}
    #calculator-site-header .ich-home{color:#52627a;text-decoration:none;font-size:14px;font-weight:700}
    #calculator-site-header .ich-home:hover{color:#1769e0}
    #calculator-site-header .ich-directory{border-top:1px solid #edf1f6;padding:12px 0 16px}
    #calculator-site-header .ich-directory-title{margin:0 0 10px;color:#52627a;font-size:11px;font-weight:850;letter-spacing:.07em;text-transform:uppercase}
    #calculator-site-header .ich-groups{display:grid;grid-template-columns:repeat(5,minmax(0,1fr));gap:18px}
    #calculator-site-header .ich-group h2{margin:0 0 6px;color:#1769e0;font-size:12px;font-weight:850;line-height:1.4}
    #calculator-site-header .ich-group a{display:block;padding:4px 6px;margin:1px 0;border-radius:6px;color:#334155;text-decoration:none;font-size:12px;line-height:1.4;overflow-wrap:anywhere}
    #calculator-site-header .ich-group a:hover,#calculator-site-header .ich-group a[aria-current="page"]{background:#edf4ff;color:#135fc9}
    #calculator-site-header .ich-group a[aria-current="page"]{font-weight:800}
    @media(max-width:900px){#calculator-site-header .ich-groups{grid-template-columns:repeat(3,minmax(0,1fr));gap:14px}}
    @media(max-width:600px){
      #calculator-site-header .ich-wrap{width:calc(100% - 28px)}
      #calculator-site-header .ich-top{min-height:62px}
      #calculator-site-header .ich-brand{font-size:19px}
      #calculator-site-header .ich-mark{width:35px;height:35px}
      #calculator-site-header .ich-directory{padding:10px 0 14px}
      #calculator-site-header .ich-groups{grid-template-columns:repeat(2,minmax(0,1fr));gap:12px}
      #calculator-site-header .ich-group a{font-size:12px;padding:5px 4px}
    }
    @media(max-width:360px){#calculator-site-header .ich-groups{grid-template-columns:1fr}}
  `;
  document.head.appendChild(style);

  const groups = [...new Set(calculators.map(item => item.group))];
  const pathname = window.location.pathname.replace(/index\.html$/, '').replace(/\/$/, '') || '/';
  const isCurrent = href => href === '/' ? pathname === '/' : pathname === href.replace(/\/$/, '');
  const groupMarkup = group => {
    const links = calculators.filter(item => item.group === group).map(item =>
      '<a href="' + item.href + '"' + (isCurrent(item.href) ? ' aria-current="page"' : '') + '>' + item.label + '</a>'
    ).join('');
    return '<section class="ich-group"><h2>' + group + '</h2>' + links + '</section>';
  };

  const header = document.createElement('header');
  header.id = 'calculator-site-header';
  header.innerHTML =
    '<div class="ich-wrap">' +
      '<div class="ich-top"><a class="ich-brand" href="/" aria-label="InvestCalc home"><span class="ich-mark">%</span><span>InvestCalc</span></a><a class="ich-home" href="/">Home</a></div>' +
      '<nav class="ich-directory" aria-label="All calculators"><p class="ich-directory-title">All calculators</p><div class="ich-groups">' + groups.map(groupMarkup).join('') + '</div></nav>' +
    '</div>';

  const mount = document.getElementById('site-header');
  if (mount) mount.replaceWith(header);
  else document.body.insertBefore(header, document.body.firstChild);
})();