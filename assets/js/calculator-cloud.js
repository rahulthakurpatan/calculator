/* Shared calculator-link galaxy: category-related links left, all tools right.
   Tiny, colorful, text-only, responsive, accessible, no third-party libraries. */
(() => {
  'use strict';
  if (window.__calculatorCloudStarted) return;
  window.__calculatorCloudStarted = true;

  const wide = matchMedia('(min-width:1440px) and (min-height:580px)');
  const reduced = matchMedia('(prefers-reduced-motion:reduce)');
  const toolPattern = /(?:calculator|planner|estimator|tracker|comparison)\/$/i;
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
    if(aliases[slug]) return aliases[slug];
    return slug.replace(/-(?:calculator|planner|estimator|tracker|comparison)$/,'')
      .split('-').map(w=>acronyms.has(w)?w.toUpperCase():w.charAt(0).toUpperCase()+w.slice(1)).join(' ');
  }
  function includeURL(raw, entries) {
    if(!raw) return;
    try {
      const url=new URL(raw,location.origin);
      if(url.origin!==location.origin || !toolPattern.test(url.pathname)) return;
      if(!entries.has(url.pathname)) entries.set(url.pathname,{href:url.pathname,name:displayName(url.pathname)});
    } catch (_) { /* malformed URL */ }
  }
  function getCategories() {
    const groups=window.__calculatorCloudCategories;
    if(!Array.isArray(groups)) return [];
    return groups.filter(group=>group && Array.isArray(group.tools) && group.label!=='About & Support')
      .map(group=>({label:group.label, tools:group.tools.filter(t=>Array.isArray(t)&&typeof t[1]==='string')
        .map(t=>({name:String(t[0]),href:t[1]}))}));
  }
  async function discover() {
    const entries=new Map();
    try {
      const response=await fetch('/sitemap.xml',{credentials:'same-origin',cache:'no-cache'});
      if(!response.ok) throw new Error('Sitemap unavailable');
      const xml=new DOMParser().parseFromString(await response.text(),'application/xml');
      if(xml.getElementsByTagName('parsererror').length) throw new Error('Invalid sitemap');
      Array.from(xml.getElementsByTagName('loc')).forEach(loc=>includeURL(loc.textContent.trim(),entries));
    } catch (_) { /* keep shared-navigation / page-link fallback */ }
    getCategories().forEach(group=>group.tools.forEach(item=>includeURL(item.href,entries)));
    document.querySelectorAll('a[href]').forEach(link=>includeURL(link.getAttribute('href'),entries));
    return Array.from(entries.values());
  }
  function shuffle(items) {
    const copy=items.slice();
    for(let i=copy.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[copy[i],copy[j]]=[copy[j],copy[i]];}
    return copy;
  }
  function semanticTokens(value) {
    const stop=new Set(['calculator','investment','the','and','of','for','to','vs','pay','future','how','will','i','become','a','estimate','planner','tracker','comparison','estimator','all','in','one','based','cost']);
    return value.toLowerCase().replace(/[^a-z0-9]+/g,' ').split(' ').filter(t=>t.length>1&&!stop.has(t));
  }
  function selectRelated(all, currentPath) {
    const categories=getCategories(), available=new Map(all.map(item=>[item.href,item]));
    const found=categories.find(group=>group.tools.some(item=>item.href===currentPath));
    const group=found||categories.find(g=>g.tools.some(t=>t.href==='/'))||null;
    const currentTerms=semanticTokens(currentPath);
    const groupPaths=new Set(group?group.tools.map(t=>t.href):[]);
    const scored=all.filter(item=>item.href!==currentPath).map(item=>{
      const itemTerms=semanticTokens(item.href+' '+item.name);
      const overlaps=currentTerms.filter(t=>itemTerms.includes(t)).length;
      const categoryBonus=groupPaths.has(item.href)?8:0;
      const roiBonus=currentPath==='/'&&groupPaths.has(item.href)?3:0;
      return {item,score:categoryBonus+overlaps*4+roiBonus};
    });
    scored.sort((a,b)=>b.score-a.score || a.item.name.localeCompare(b.item.name));
    const result=scored.slice(0,14).map(x=>x.item);
    // The current tool should never be linked as its own related recommendation.
    return result.filter(x=>available.has(x.href));
  }
  const styles=document.createElement('style');
  styles.id='calculator-cloud-shared-style';
  styles.textContent=[
    '#calculator-link-cloud,#calculator-related-cloud{position:fixed;top:clamp(98px,12vh,145px);width:clamp(125px,calc(50vw - 580px),248px);height:min(660px,calc(100vh - 174px));z-index:8;pointer-events:none;isolation:isolate}',
    '#calculator-link-cloud{left:calc(50% + 552px)}',
    '#calculator-related-cloud{right:calc(50% + 552px)}',
    '#calculator-link-cloud a,#calculator-related-cloud a{position:absolute;box-sizing:border-box;display:block;left:0;width:calc(100% - 10px);padding:3px 0;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;text-decoration:none;font:690 12.5px/1.45 Inter,system-ui,-apple-system,"Segoe UI",sans-serif;letter-spacing:.006em;color:#216bb2;opacity:.94;pointer-events:auto;background-image:linear-gradient(110deg,#1364ab 0%,#9a45c9 26%,#0b9b8e 53%,#5a59ce 77%,#078d9b 100%);background-size:320% 100%;-webkit-background-clip:text;background-clip:text;-webkit-text-fill-color:transparent;animation:calcCloudColor 13s ease-in-out infinite alternate;transition:opacity .27s ease,filter .22s ease;will-change:transform}',
    '#calculator-link-cloud a:nth-child(3n+2),#calculator-related-cloud a:nth-child(3n+2){background-image:linear-gradient(105deg,#0d9d86,#6b54c9,#167bc2,#aa4bc0,#0d9d86)}',
    '#calculator-link-cloud a:nth-child(3n),#calculator-related-cloud a:nth-child(3n){background-image:linear-gradient(105deg,#9b49bb,#0a81ac,#0d9c87,#5960d8,#9b49bb)}',
    '#calculator-link-cloud a:hover,#calculator-link-cloud a:focus-visible,#calculator-related-cloud a:hover,#calculator-related-cloud a:focus-visible{opacity:1;filter:saturate(1.65) brightness(.84);text-decoration:underline;text-decoration-color:#0e987e;text-underline-offset:4px;font-weight:780}',
    '#calculator-link-cloud a:focus-visible,#calculator-related-cloud a:focus-visible{outline:2px solid #2876b8;outline-offset:3px;border-radius:2px}',
    '#calculator-link-cloud a.clc-change{opacity:0}',
    '@keyframes calcCloudColor{from{background-position:0% 50%}to{background-position:100% 50%}}',
    '@media(max-width:1439px),(max-height:579px){#calculator-link-cloud,#calculator-related-cloud{display:none!important}}',
    '@media(prefers-reduced-motion:reduce){#calculator-link-cloud a,#calculator-related-cloud a{animation:none!important;transition:none!important;will-change:auto}}'
  ].join('\n');

  let animations=[],pointer=null,raf=0,active=false,startAt=0;
  const panels=[];
  function buildPanel(id,label,items,side) {
    const nav=document.createElement('nav');
    nav.id=id;nav.setAttribute('aria-label',label);
    nav.dataset.side=side;
    const rows=[];
    const count=items.length;
    items.forEach((item,i)=>{
      const a=document.createElement('a');
      a.href=item.href;a.title=item.name;a.textContent=item.name;
      a.style.top=(((i+.45)/count)*100).toFixed(3)+'%';
      const base=[3,17,7,25,4,19,9,24,4,17,7,23,5,20,11][i%15];
      a.style.left=base+'px';
      a.style.animationDelay=(-i*1.75)+'s';
      let frozen=false;
      a.addEventListener('pointerenter',()=>{frozen=true;});
      a.addEventListener('pointerleave',()=>{frozen=false;});
      a.addEventListener('focus',()=>{frozen=true;});
      a.addEventListener('blur',()=>{frozen=false;});
      nav.appendChild(a);
      rows.push({a,i,base,phase:i*1.6+(side==='left'?.9:0),frozen:()=>frozen});
    });
    document.body.appendChild(nav);
    panels.push({nav,rows,side,hover:false});
    return panels[panels.length-1];
  }
  function animate(now) {
    raf=0;
    if(!active) return;
    const t=(now-startAt)/1000;
    for(const panel of panels){
      const rect=panel.nav.getBoundingClientRect(),step=rect.height/panel.rows.length;
      for(const item of panel.rows){
        if(item.frozen()) continue;
        let dx=Math.sin(t*.36+item.phase)*5.5,dy=Math.cos(t*.31+item.phase*.8)*2.7;
        if(pointer){
          const px=pointer.x-rect.left,py=pointer.y-rect.top;
          const vx=item.base+64-px,vy=(item.i+.45)*step+12-py;
          const dist=Math.hypot(vx,vy);
          if(dist>1&&dist<115){const f=Math.pow((115-dist)/115,2)*12;dx+=(vx/dist)*f;dy+=(vy/dist)*f;}
        }
        item.a.style.transform='translate3d('+dx.toFixed(2)+'px,'+dy.toFixed(2)+'px,0)';
      }
    }
    raf=requestAnimationFrame(animate);
  }
  function refresh() {
    active=wide.matches&&!reduced.matches&&document.visibilityState!=='hidden';
    if(active&&!raf){startAt=performance.now();raf=requestAnimationFrame(animate);}
    if(!active){
      if(raf){cancelAnimationFrame(raf);raf=0;}
      for(const panel of panels)for(const item of panel.rows)item.a.style.transform='';
    }
  }
  function createRotation(panel,all) {
    let queue=shuffle(all),position=0,nextIndex=0;
    const pick=visible=>{
      for(let i=0;i<=all.length;i++){
        if(position>=queue.length){queue=shuffle(all);position=0;}
        const candidate=queue[position++];
        if(!visible.has(candidate.href)) return candidate;
      }
      return null;
    };
    window.setInterval(()=>{
      if(!wide.matches||document.visibilityState==='hidden'||reduced.matches||panel.hover||
         panel.nav.contains(document.activeElement)||all.length<=panel.rows.length) return;
      const slot=panel.rows[nextIndex++%panel.rows.length];
      if(slot.frozen()) return;
      const visible=new Set(panel.rows.map(item=>item.a.getAttribute('href')));
      const replacement=pick(visible);
      if(!replacement) return;
      slot.a.classList.add('clc-change');
      window.setTimeout(()=>{
        if(!slot.a.isConnected) return;
        slot.a.href=replacement.href;slot.a.title=replacement.name;
        slot.a.textContent=replacement.name;slot.a.classList.remove('clc-change');
      },250);
    },3200);
  }
  async function init() {
    const all=await discover();
    if(all.length<3) return;
    // Both clouds use the same original link registry and keep all content unobstructed.
    const current=location.pathname==='/index.html'?'/':location.pathname;
    const related=selectRelated(all,current).slice(0,12);
    const rightItems=shuffle(all.filter(item=>item.href!==current)).slice(0,Math.min(15,all.length-1));
    if(!rightItems.length) return;
    document.head.appendChild(styles);
    const right=buildPanel('calculator-link-cloud','Explore calculators',rightItems,'right');
    if(related.length)buildPanel('calculator-related-cloud','Related calculators',related,'left');
    right.nav.addEventListener('pointerenter',()=>{right.hover=true;});
    right.nav.addEventListener('pointerleave',()=>{right.hover=false;});
    document.addEventListener('pointermove',e=>{pointer={x:e.clientX,y:e.clientY};},{passive:true});
    document.addEventListener('pointerout',e=>{if(!e.relatedTarget)pointer=null;},{passive:true});
    document.addEventListener('visibilitychange',refresh);
    wide.addEventListener('change',refresh);
    reduced.addEventListener('change',refresh);
    createRotation(right,all.filter(item=>item.href!==current));
    refresh();
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});
  else init();
})();