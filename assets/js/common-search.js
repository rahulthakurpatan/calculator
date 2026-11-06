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
    { title:'SIP Calculator', subtitle:'Estimate mutual fund SIP returns', category:'Invest & Mutual Funds', href:'/sip-calculator/', keywords:'systematic investment plan mutual fund monthly sip' },
    { title:'Lumpsum Return Calculator', subtitle:'Estimate one-time investment growth', category:'Invest & Mutual Funds', href:'/lump-sum-calculator/', keywords:'lump sum lumpsum one time investment' },
    { title:'Step-Up SIP Calculator', subtitle:'Calculate SIP with annual increases', category:'Invest & Mutual Funds', href:'/step-up-sip-calculator/', keywords:'step up sip top up monthly investment' },
    { title:'Fixed Deposit Calculator', subtitle:'Estimate FD interest and maturity value', category:'Savings & Loans', href:'/fd-calculator/', keywords:'fd fixed deposit bank deposit interest maturity' },
    { title:'Business Profit & Loss Tracker', subtitle:'Track business revenue, expenses and profit', category:'Business & Creator', href:'/business-profit-loss-tracker/', keywords:'business income expense profit loss tracker' },
    { title:'Kundali Money & Dhan Yog Calculator', subtitle:'Explore a traditional astrology-based reading', category:'Family & Goals', href:'/kundali-money-dhan-yog-calculator/', keywords:'kundali dhan yog astrology money' }
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
