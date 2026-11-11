/* InvestCalc Smart Financial Search
 * Data-driven catalogue for future verified financial instruments.
 * Only existing calculator destinations are currently searchable.
 */
(() => {
  'use strict';
  if (window.__investcalcSearchLoaded) return;
  window.__investcalcSearchLoaded = true;

  const items = [
    { title:'ROI Calculator', subtitle:'Calculate investment profit, loss and returns', category:'Invest & Mutual Funds', href:'/', keywords:'return on investment roi profit loss cagr' },
    { title:'Gratuity Calculator India', subtitle:'Estimate gratuity payable, service eligibility, wage adjustment and tax exemption', category:'Tax & Salary', href:'/gratuity-calculator/', keywords:'gratuity calculator gratuity calculator india gratuity after 5 years new labour code gratuity fixed term employee gratuity formula 15 26 gratuity tax exemption gratuity wage definition' },
    { title:'HRA Calculator India', subtitle:'Calculate house rent allowance exemption under old and new tax regimes', category:'Tax & Salary', href:'/hra-calculator/', keywords:'hra calculator hra exemption calculator house rent allowance calculator india hra old regime new regime rent paid salary 10 percent metro non metro 40 50 percent taxable hra' },
    { title:'Company / Corporate Tax Calculator', subtitle:'Estimate domestic and foreign company tax, surcharge, cess and MAT', category:'Tax & Salary', href:'/company-corporate-tax-calculator/', keywords:'company tax calculator corporate tax calculator india corporate income tax domestic company foreign company tax year 2026-27 FY 2026-27 AY 2027-28 section 199 section 200 section 201 MAT minimum alternate tax surcharge cess book profit manufacturing company company income tax' },
    { title:'GST Calculator – Add or Remove GST', subtitle:'Add or remove GST, split CGST, SGST, UTGST or IGST and calculate multi-item invoices', category:'Tax & Salary', href:'/gst-calculator/', keywords:'gst calculator india add gst remove gst reverse gst gst inclusive gst exclusive cgst sgst utgst igst gst invoice calculator gst 5 percent 18 percent 40 percent gst rate calculator discount cess invoice round off' },
    { title:'All-in-One TDS Calculator', subtitle:'Calculate TDS on salary, rent, contractors, professionals, property, interest and more', category:'Tax & Salary', href:'/tds-calculator/', keywords:'tds calculator tds calculator fy 2026-27 tax year 2026-27 tds rate finder 194c 194j 194h 194i 194ia 194q 194s 194a 194t section 393 section 392 salary tds rent tds contractor professional fees property purchase interest dividend pan form 141' },
    { title:'Income Tax Calculator – Old vs New Regime', subtitle:'Compare Indian income tax with salary, HRA, deductions, rebate and cess', category:'Tax & Salary', href:'/income-tax-calculator/', keywords:'income tax calculator tax calculator old regime new regime income tax slabs FY 2026-27 tax year 2026-27 salary tax HRA 80C 80D rebate section 87A surcharge cess standard deduction' },
    { title:'Goal-Based Investment Planner', subtitle:'Plan financial goals with inflation-adjusted targets and SIP estimates', category:'Invest & Mutual Funds', href:'/goal-based-investment-planner/', keywords:'goal based investment planner financial goal planning goal sip calculator future goal inflation adjusted savings education house retirement wedding' },
    { title:'SWP Calculator', subtitle:'Plan systematic mutual fund withdrawals and retirement income', category:'Invest & Mutual Funds', href:'/swp-calculator/', keywords:'systematic withdrawal plan monthly income retirement corpus redemption withdrawal calculator' },
    { title:'SIP Calculator', subtitle:'Estimate mutual fund SIP returns', category:'Invest & Mutual Funds', href:'/sip-calculator/', keywords:'systematic investment plan mutual fund monthly sip' },
    { title:'Lumpsum Return Calculator', subtitle:'Estimate one-time investment growth', category:'Invest & Mutual Funds', href:'/lump-sum-calculator/', keywords:'lump sum lumpsum one time investment' },
    { title:'Mutual Fund vs FD Calculator', subtitle:'Compare estimated mutual fund and fixed deposit returns after tax', category:'Invest & Mutual Funds', href:'/mutual-fund-vs-fd-comparison/', keywords:'mutual fund versus fd fixed deposit comparison tax return interest' },
    { title:'Step-Up SIP Calculator', subtitle:'Calculate SIP with annual increases', category:'Invest & Mutual Funds', href:'/step-up-sip-calculator/', keywords:'step up sip top up monthly investment' },
    { title:'Sukanya Samriddhi Yojana Calculator', subtitle:'Estimate SSY maturity, deposits, interest and education withdrawal for new or existing accounts', category:'Savings & Loans', href:'/sukanya-samriddhi-yojana-calculator/', keywords:'sukanya samriddhi yojana calculator ssy calculator sukanya samriddhi maturity calculator ssy interest calculator sukanya yojana monthly deposit calculator ssy 150000 calculator existing account education withdrawal ssy interest rate 2026 21 years girl child savings scheme' },
    { title:'Fixed Deposit Calculator', subtitle:'Estimate FD interest and maturity value', category:'Savings & Loans', href:'/fd-calculator/', keywords:'fd fixed deposit bank deposit interest maturity' },
    { title:'Loan Prepayment vs Investment Calculator', subtitle:'Compare extra loan repayments with investing the same cash; estimate interest saved, payoff time and break-even return', category:'Savings & Loans', href:'/loan-prepayment-vs-investment-calculator/', keywords:'loan prepayment vs investment calculator mortgage payoff vs investing calculator pay off mortgage or invest mortgage overpayment vs investing home loan prepayment calculator early loan repayment invest extra money debt repayment vs investing extra mortgage payment loan payoff break even investment return personal loan auto loan student loan mortgage calculator' },
    { title:'Mortgage Refinance & Balance Transfer Calculator', subtitle:'Compare mortgage refinance costs, monthly payments, interest and break-even time', category:'Savings & Loans', href:'/mortgage-refinance-calculator/', keywords:'mortgage refinance calculator refinance calculator mortgage refinance break even calculator refinance savings calculator refinance closing cost calculator mortgage refinance comparison calculator home loan refinance calculator mortgage switching calculator remortgage calculator Canada mortgage break penalty calculator early repayment charge refinance fees balance transfer mortgage' },
    { title:'Emergency Fund & Financial Runway Calculator', subtitle:'Set an emergency savings goal and estimate how long accessible cash may last after income loss', category:'Savings & Loans', href:'/emergency-fund-calculator/', keywords:'emergency fund calculator emergency savings calculator emergency fund goal calculator emergency savings goal how much emergency fund do i need 3 month emergency fund 6 month emergency fund 12 month emergency fund savings runway calculator financial runway calculator job loss savings calculator income loss calculator how long will my savings last emergency fund shortfall monthly savings target emergency cash reserve' },
    { title:'Business Profit & Loss Tracker', subtitle:'Track business revenue, expenses and profit', category:'Business & Creator', href:'/business-profit-loss-tracker/', keywords:'business income expense profit loss tracker' },
    { title:'Crypto Profit & Tax Calculator India', subtitle:'Calculate Bitcoin and crypto profit, ROI, VDA tax and 1% TDS', category:'Tax & Salary', href:'/crypto-profit-tax-calculator/', keywords:'crypto profit calculator bitcoin profit calculator crypto tax calculator india bitcoin tax calculator bitcoin roi cryptocurrency gains VDA tax 30 percent crypto tax 1 percent tds ethereum solana altcoin crypto trading profit loss tax year 2026-27' },
    { title:'YouTube AdSense Revenue Calculator', subtitle:'Estimate long-form ad revenue, Shorts earnings, RPM, CPM and monthly creator income', category:'Business & Creator', href:'/youtube-adsense-revenue-calculator/', keywords:'youtube money calculator youtube earnings calculator youtube revenue calculator youtube adsense calculator youtube calculator india youtube rpm calculator youtube shorts revenue calculator shorts engaged views monetized playback rpm cpm creator earnings 1000 views 100k views 1 million views youtube income india' },
    { title:'Instagram Earning Calculator', subtitle:'Estimate monthly income from sponsored Reels, posts, Stories, affiliate sales, Gifts, subscriptions and products', category:'Business & Creator', href:'/instagram-earning-calculator/', keywords:'instagram earning calculator instagram earnings calculator instagram income calculator instagram money calculator instagram influencer calculator instagram sponsored post calculator instagram sponsored reel price instagram reel rate calculator instagram monetization calculator instagram brand deal calculator instagram creator income affiliate marketing gifts subscriptions influencer income india brand collaboration rate card engagement rate' },
    { title:'Freelance Hourly Rate Calculator', subtitle:'Calculate sustainable hourly, daily and project rates from income goals, billable hours, expenses and fees', category:'Business & Creator', href:'/freelance-hourly-rate-calculator/', keywords:'freelance hourly rate calculator freelance rate calculator freelancer rate calculator freelance pricing calculator freelance hourly rate calculator india freelance daily rate calculator freelance day rate calculator freelance project rate calculator hourly billing rate freelancer income goal billable hours non billable hours platform commission upwork fees payment processing fee freelance expenses tax reserve project quote consultant hourly rate' },
    { title:'Kundali Money & Dhan Yog Calculator', subtitle:'Explore a traditional astrology-based reading', category:'Family & Goals', href:'/kundali-money-dhan-yog-calculator/', keywords:'kundali dhan yog astrology money' },
    { title:'Daughter Marriage Saving Planner', subtitle:'Estimate Indian wedding costs and plan future savings with SIP, inflation and budget breakdown', category:'Family & Goals', href:'/daughter-marriage-saving-planner/', keywords:'daughter marriage saving planner wedding cost calculator india marriage budget planner indian wedding expenses wedding savings sip calculator future marriage fund wedding inflation jewellery gold venue catering guests haldi mehendi sangeet reception' },
    { title:'Solar Rooftop ROI Calculator', subtitle:'Estimate solar system size, PM Surya Ghar subsidy, electricity savings and 25-year payback', category:'Property & Tools', href:'/solar-rooftop-roi-calculator/', keywords:'solar rooftop roi calculator india solar panel cost calculator rooftop solar subsidy pm surya ghar subsidy calculator solar system size calculator solar payback period electricity bill savings net metering on grid hybrid off grid solar panel generation solar installation cost solar battery backup solar loan rooftop solar calculator' },
    { title:'House Construction Cost Estimator', subtitle:'Estimate house cost with automatic packages, material quantities and 30-year inflation projection', category:'Property & Tools', href:'/house-construction-cost-estimator/', keywords:'house construction cost calculator estimator india city wise automatic material quantity cement steel bricks interiors kitchen wardrobes exterior construction budget 2026 2056 inflation future cost per square foot' },
    { title:'Future Home Construction Budget Planner', subtitle:'Plan future salary, savings, construction budget, affordable loan and EMI', category:'Property & Tools', href:'/future-home-construction-budget-planner/', keywords:'future home construction budget planner house building financial planner salary income growth savings goal plot land purchase construction inflation home loan emi affordability future house cost monthly saving how much salary to build a house' },
    { title:'Future Car Budget Planner', subtitle:'Plan a future car purchase with salary growth, savings, down payment and affordable loan EMI', category:'Savings & Loans', href:'/future-car-budget-planner/', keywords:'future car budget planner car affordability calculator how much car can i afford future car savings calculator car purchase savings plan car down payment calculator auto loan affordability car loan emi calculator vehicle budget planner monthly car savings buy a car in 1 2 3 5 years future salary projection car ownership costs cash purchase' }
  ];

  const mount = document.getElementById('investcalc-search-mount');
  if (!mount) return;

  const css = [
    '#calculator-site-header .ich-search-mount{position:relative;flex:1 1 280px;max-width:440px;min-width:180px;margin:0 12px}',
    '#calculator-site-header .ich-search-box{height:43px;display:flex;align-items:center;gap:10px;padding:0 13px;border:1px solid #40516a;border-radius:11px;background:#1a273a;color:#dce5f0}',
    '#calculator-site-header .ich-search-box:focus-within{border-color:#d6b36a;box-shadow:0 0 0 3px rgba(214,179,106,.13)}',
    '#calculator-site-header .ich-search-icon{width:17px;height:17px;flex:none;color:#d6b36a}',
    '#calculator-site-header .ich-search-input{width:100%;min-width:0;border:0;outline:0;background:transparent;color:#fff;font:500 13px Inter,system-ui,sans-serif}',
    '#calculator-site-header .ich-search-input::placeholder{color:#9eacc0}',
    '#calculator-site-header .ich-search-shortcut{padding:3px 6px;border:1px solid #43536a;border-radius:5px;color:#aebbd0;font:600 10px Inter,system-ui,sans-serif;white-space:nowrap}',
    '#calculator-site-header .ich-search-results{display:none;position:absolute;z-index:150;top:calc(100% + 9px);left:0;right:0;max-height:min(440px,70vh);overflow:auto;padding:7px;border:1px solid #3b4d65;border-radius:12px;background:#172438;box-shadow:0 18px 42px rgba(0,0,0,.35)}',
    '#calculator-site-header .ich-search-results.is-open{display:block}',
    '#calculator-site-header .ich-search-label{padding:7px 9px 5px;color:#d6b36a;font-size:9px;font-weight:850;letter-spacing:.14em;text-transform:uppercase}',
    '#calculator-site-header .ich-search-result{display:block;width:100%;padding:10px 11px;border:1px solid transparent;border-radius:8px;background:transparent;color:#f4f6fa;text-align:left;text-decoration:none;cursor:pointer}',
    '#calculator-site-header .ich-search-result:hover,#calculator-site-header .ich-search-result[aria-selected=true]{background:#24364e;border-color:#40536d}',
    '#calculator-site-header .ich-search-result strong{display:block;font-size:12px;font-weight:750}',
    '#calculator-site-header .ich-search-result small{display:block;margin-top:3px;color:#aebbd0;font-size:10px;line-height:1.4}',
    '#calculator-site-header .ich-search-empty{padding:15px 11px;color:#c1ccda;font-size:12px}',
    '#calculator-site-header .ich-search-hint{padding:8px 10px 5px;border-top:1px solid #34465d;color:#8fa0b6;font-size:9px}',
    '@media(max-width:760px){#calculator-site-header .ich-top{flex-wrap:wrap;justify-content:space-between;padding:11px 0 12px;row-gap:10px}#calculator-site-header .ich-search-mount{order:3;flex:1 0 100%;max-width:none;min-width:0;margin:0}#calculator-site-header .ich-search-box{height:42px}#calculator-site-header .ich-search-shortcut{display:none}#calculator-site-header .ich-search-results{max-height:55vh}}'
  ].join('');
  const style = document.createElement('style');
  style.id = 'investcalc-search-styles';
  style.textContent = css;
  document.head.appendChild(style);

  mount.innerHTML = '<div class="ich-search-box" role="search">' +
    '<svg class="ich-search-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><circle cx="11" cy="11" r="7"></circle><path d="m20 20-4-4"></path></svg>' +
    '<input class="ich-search-input" type="search" autocomplete="off" spellcheck="false" aria-label="Search calculators and financial instruments" aria-controls="ich-search-results" aria-expanded="false" placeholder="Search calculators and financial tools...">' +
    '<span class="ich-search-shortcut" aria-hidden="true">Ctrl K</span></div>' +
    '<div class="ich-search-results" id="ich-search-results" role="listbox" aria-label="Search suggestions"></div>';

  const input = mount.querySelector('.ich-search-input');
  const results = mount.querySelector('.ich-search-results');
  let activeIndex = -1;
  let currentResults = [];
  const normalize = value => String(value).toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim();
  const escapeHtml = value => String(value).replace(/[&<>"']/g, char => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));

  function closeResults() {
    results.classList.remove('is-open');
    input.setAttribute('aria-expanded', 'false');
    input.removeAttribute('aria-activedescendant');
    activeIndex = -1;
  }
  function render(query) {
    const q = normalize(query);
    if (!q) currentResults = items.slice(0, 5);
    else currentResults = items.map(item => {
      const title=normalize(item.title), category=normalize(item.category), keywords=normalize(item.keywords), subtitle=normalize(item.subtitle);
      let score=0;
      if(title===q) score=100;
      else if(title.startsWith(q)) score=80;
      else if(title.split(/\s+/).some(word=>word.startsWith(q))) score=65;
      else if(keywords.includes(q)) score=55;
      else if(subtitle.includes(q)||category.includes(q)||title.includes(q)) score=40;
      return {item,score};
    }).filter(x=>x.score>0).sort((a,b)=>b.score-a.score||a.item.title.localeCompare(b.item.title)).slice(0,7).map(x=>x.item);
    activeIndex=-1;
    results.innerHTML='<div class="ich-search-label">'+(q?'SEARCH RESULTS':'POPULAR CALCULATORS')+'</div>' +
      (currentResults.length ? currentResults.map((item,index)=>'<a class="ich-search-result" id="ich-search-option-'+index+'" role="option" aria-selected="false" href="'+item.href+'"><strong>'+escapeHtml(item.title)+'</strong><small>'+escapeHtml(item.subtitle)+' · '+escapeHtml(item.category)+'</small></a>').join('') :
      '<div class="ich-search-empty">No matching calculator found. Try “SIP”, “FD” or “ROI”.</div>') +
      '<div class="ich-search-hint">↑ ↓ to navigate · Enter to open · Esc to close</div>';
    results.classList.add('is-open');
    input.setAttribute('aria-expanded','true');
  }
  function setActive(index) {
    const links=[...results.querySelectorAll('.ich-search-result')];
    if(!links.length)return;
    activeIndex=(index+links.length)%links.length;
    links.forEach((link,i)=>{link.setAttribute('aria-selected',String(i===activeIndex));if(i===activeIndex){input.setAttribute('aria-activedescendant',link.id);link.scrollIntoView({block:'nearest'});}});
  }
  input.addEventListener('focus',()=>render(input.value));
  input.addEventListener('input',()=>render(input.value));
  input.addEventListener('keydown',event=>{
    if(event.key==='ArrowDown'&&results.classList.contains('is-open')){event.preventDefault();setActive(activeIndex+1);}
    else if(event.key==='ArrowUp'&&results.classList.contains('is-open')){event.preventDefault();setActive(activeIndex<=0?currentResults.length-1:activeIndex-1);}
    else if(event.key==='Enter'&&results.classList.contains('is-open')&&activeIndex>=0&&currentResults[activeIndex]){event.preventDefault();window.location.href=currentResults[activeIndex].href;}
    else if(event.key==='Escape')closeResults();
  });
  document.addEventListener('click',event=>{if(!mount.contains(event.target))closeResults();});
  document.addEventListener('keydown',event=>{
    if((event.ctrlKey||event.metaKey)&&event.key.toLowerCase()==='k'){event.preventDefault();input.focus();input.select();}
  });
})();
