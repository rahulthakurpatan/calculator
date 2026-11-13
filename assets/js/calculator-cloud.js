/* Homepage-only minimal calculator link cloud. No dependencies or tracking. */
(() => {
  'use strict';
  if (!['/', '/index.html'].includes(location.pathname) || document.getElementById('calculator-link-cloud')) return;

  const media = matchMedia('(min-width:1440px) and (min-height:580px)');
  const reduced = matchMedia('(prefers-reduced-motion:reduce)');
  const maxVisible = 15;
  const isTool = /(?:calculator|planner|estimator|tracker|comparison)\/$/i;
  const acronyms = new Set(['sip','swp','roi','gst','tds','hra','fd','fire','rsu','cac','ltv','apy','saas','drip','emi','ai']);
  const aliases = {
    'dividend-reinvestment-calculator':'Dividend DRIP',
    'when-will-i-become-a-millionaire-calculator':'Millionaire Calculator',
    'company-corporate-tax-calculator':'Corporate Tax',
    'crypto-profit-tax-calculator':'Crypto Portfolio',
    'crypto-capital-gains-tax-calculator':'Crypto Capital Gains',
    'investment-portfolio-planner':'Portfolio Planner',
    'future-home-construction-budget-planner':'Home Budget Planner',
    'mutual-fund-vs-fd-comparison':'Mutual Fund vs FD',
    'saas-ltv-cac-calculator':'SaaS LTV:CAC',
    'solar-panel-payback-calculator':'Solar Payback',
    'youtube-adsense-revenue-calculator':'YouTube Revenue',
    'digital-nomad-tax-calculator':'Digital Nomad Tax',
    'overtime-pay-calculator':'Overtime Pay',
    'net-worth-calculator':'Net Worth',
    'fire-retirement-calculator':'FIRE Retirement'
  };

  function displayName(path) {
    const slug=path.replace(/^\/|\/$/g,'');
    if (aliases[slug]) return aliases[slug];
    return slug.replace(/-(calculator|planner|estimator|tracker|comparison)$/,'')
      .split('-').map(s=>acronyms.has(s)?s.toUpperCase():s.charAt(0).toUpperCase()+s.slice(1)).join(' ');
  }

  function includeURL(url, entries) {
    try {
      const u=new URL(url,location.origin);
      if (u.origin!==location.origin || !isTool.test(u.pathname)) return;
      if (!entries.has(u.pathname)) entries.set(u.pathname,{href:u.pathname,name:displayName(u.pathname)});
    } catch (_) { /* Ignore invalid sitemap entries. */ }
  }

  async function discover() {
    const entries=new Map();
    try {
      const res=await fetch('/sitemap.xml',{credentials:'same-origin',cache:'no-cache'});
      if (!res.ok) throw new Error('Sitemap unavailable');
      const xml=new DOMParser().parseFromString(await res.text(),'application/xml');
      if (xml.getElementsByTagName('parsererror').length) throw new Error('Invalid sitemap');
      Array.from(xml.getElementsByTagName('loc')).forEach(n=>includeURL(n.textContent.trim(),entries));
    } catch (_) { /* Existing homepage links remain available as a fallback. */ }
    document.querySelectorAll('a[href]').forEach(n=>includeURL(n.getAttribute('href'),entries));
    return Array.from(entries.values());
  }

  const style=document.createElement('style');
  style.id='calculator-link-cloud-style';
  style.textContent=[
    '#calculator-link-cloud{position:fixed;left:calc(50% + 551px);top:clamp(96px,12vh,145px);width:clamp(125px,calc(50vw - 579px),248px);height:min(650px,calc(100vh - 175px));z-index:8;pointer-events:none;isolation:isolate}',
    '#calculator-link-cloud a{position:absolute;display:block;box-sizing:border-box;left:0;width:calc(100% - 16px);padding:3px 0;overflow:hidden;white-space:nowrap;text-overflow:ellipsis;text-decoration:none;font:690 12.5px/1.45 Inter,system-ui,-apple-system,"Segoe UI",sans-serif;letter-spacing:.006em;opacity:.94;pointer-events:auto;color:#256b84;background:linear-gradient(110deg,#1364ab 0%,#9a45c9 26%,#0b9b8e 53%,#5a59ce 77%,#078d9b 100%);background-size:320% 100%;-webkit-background-clip:text;background-clip:text;-webkit-text-fill-color:transparent;animation:calcCloudColor 13s ease-in-out infinite alternate;transition:opacity .27s ease,filter .22s ease;will-change:transform}',
    '#calculator-link-cloud a:nth-child(3n+2){background-image:linear-gradient(105deg,#0d9d86,#6b54c9,#167bc2,#aa4bc0,#0d9d86)}',
    '#calculator-link-cloud a:nth-child(3n){background-image:linear-gradient(105deg,#9b49bb,#0a81ac,#0d9c87,#5960d8,#9b49bb)}',
    '#calculator-link-cloud a:hover,#calculator-link-cloud a:focus-visible{opacity:1;filter:saturate(1.65) brightness(.86);text-decoration:underline;text-decoration-color:#0e987e;text-underline-offset:4px;font-weight:780}',
    '#calculator-link-cloud a:focus-visible{outline:2px solid #2575bd;outline-offset:3px;border-radius:2px}',
    '#calculator-link-cloud a.clc-change{opacity:0}',
    '@keyframes calcCloudColor{from{background-position:0% 50%}to{background-position:100% 50%}}',
    '@media(max-width:1439px),(max-height:579px){#calculator-link-cloud{display:none!important}}',
    '@media(prefers-reduced-motion:reduce){#calculator-link-cloud a{animation:none!important;transition:none!important;will-change:auto}}'
  ].join('\n');

  const nav=document.createElement('nav');
  nav.id='calculator-link-cloud';
  nav.setAttribute('aria-label','Explore calculator links');
  let tools=[],pool=[],cursor=0,slots=[],slotCursor=0,raf=0,active=false,origin=0,pointer=null,hovered=false;
  function randomize(items){
    const copy=items.slice();
    for(let i=copy.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[copy[i],copy[j]]=[copy[j],copy[i]];}
    return copy;
  }
  function nextTool(visible){
    for(let i=0;i<=tools.length;i++){
      if(cursor>=pool.length){pool=randomize(tools);cursor=0;}
      const item=pool[cursor++];
      if(!visible.has(item.href)) return item;
    }
    return null;
  }
  function addName(item,i,count){
    const a=document.createElement('a');
    a.href=item.href;
    a.title=item.name;
    a.textContent=item.name;
    a.style.top=(((i+.45)/count)*100).toFixed(3)+'%';
    const start=[3,17,7,25,4,19,9,24,4,17,7,23,5,20,11][i%15];
    a.style.left=start+'px';
    a.style.animationDelay=(-i*1.75)+'s';
    let frozen=false;
    a.addEventListener('pointerenter',()=>{frozen=true;hovered=true;});
    a.addEventListener('pointerleave',()=>{frozen=false;hovered=nav.matches(':hover');});
    a.addEventListener('focus',()=>{frozen=true;});
    a.addEventListener('blur',()=>{frozen=false;});
    nav.appendChild(a);
    return {a,i,x:start,phase:i*1.6,frozen:()=>frozen};
  }
  function motion(now){
    raf=0;
    if(!active) return;
    const t=(now-origin)/1000,rect=nav.getBoundingClientRect(),step=rect.height/slots.length;
    slots.forEach(s=>{
      if(s.frozen()) return;
      let dx=Math.sin(t*.36+s.phase)*5.5,dy=Math.cos(t*.31+s.phase*.8)*2.7;
      if(pointer){
        const px=pointer.x-rect.left,py=pointer.y-rect.top;
        const vx=s.x+64-px,vy=(s.i+.45)*step+12-py,dist=Math.hypot(vx,vy);
        if(dist>1&&dist<115){
          const force=Math.pow((115-dist)/115,2)*12;
          dx+=vx/dist*force;
          dy+=vy/dist*force;
        }
      }
      s.a.style.transform='translate3d('+dx.toFixed(2)+'px,'+dy.toFixed(2)+'px,0)';
    });
    raf=requestAnimationFrame(motion);
  }
  function refreshAnimation(){
    active=media.matches&&!reduced.matches&&document.visibilityState!=='hidden';
    if(active&&!raf){origin=performance.now();raf=requestAnimationFrame(motion);}
    if(!active){
      if(raf){cancelAnimationFrame(raf);raf=0;}
      slots.forEach(s=>{s.a.style.transform='';});
    }
  }
  function rotate(){
    if(!media.matches||document.visibilityState==='hidden'||hovered||reduced.matches||nav.contains(document.activeElement)||tools.length<=slots.length) return;
    const slot=slots[slotCursor++%slots.length];
    if(slot.frozen()) return;
    const next=nextTool(new Set(slots.map(s=>s.a.getAttribute('href'))));
    if(!next) return;
    slot.a.classList.add('clc-change');
    setTimeout(()=>{
      if(!slot.a.isConnected) return;
      slot.a.href=next.href;
      slot.a.title=next.name;
      slot.a.textContent=next.name;
      slot.a.classList.remove('clc-change');
    },reduced.matches?0:250);
  }
  async function start(){
    tools=await discover();
    if(tools.length<3) return;
    pool=randomize(tools);
    const count=Math.min(maxVisible,tools.length),visible=new Set();
    for(let i=0;i<count;i++){
      const item=nextTool(visible);
      if(!item) break;
      visible.add(item.href);
      slots.push(addName(item,i,count));
    }
    document.head.appendChild(style);
    document.body.appendChild(nav);
    document.addEventListener('pointermove',ev=>{pointer={x:ev.clientX,y:ev.clientY};},{passive:true});
    document.addEventListener('pointerout',ev=>{if(!ev.relatedTarget)pointer=null;},{passive:true});
    nav.addEventListener('pointerenter',()=>{hovered=true;});
    nav.addEventListener('pointerleave',()=>{hovered=false;});
    document.addEventListener('visibilitychange',refreshAnimation);
    media.addEventListener('change',refreshAnimation);
    reduced.addEventListener('change',refreshAnimation);
    window.setInterval(rotate,3200);
    refreshAnimation();
  }
  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',start,{once:true});
  else start();
})();
