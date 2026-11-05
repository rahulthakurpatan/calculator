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
  
  // Temporary full-page Diwali confetti. Automatically expires after 10 November 2026.
  const festiveExpiry = new Date('2026-11-11T00:00:00');
  if (new Date() < festiveExpiry && !window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    const canvas = document.createElement('canvas');
    canvas.id = 'investcalc-diwali-confetti';
    canvas.setAttribute('aria-hidden', 'true');
    canvas.style.cssText = 'position:fixed;inset:0;width:100%;height:100%;z-index:99998;pointer-events:none;';
    document.body.appendChild(canvas);
    const ctx = canvas.getContext('2d');
    let width = 0, height = 0, lastSpawn = 0, particles = [];
    const colors = ['#f5b700','#ff7a00','#ff4d8d','#9b6cff','#35bde5','#35b879','#fff1a8'];
    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 1.5);
      width = window.innerWidth; height = window.innerHeight;
      canvas.width = Math.floor(width * dpr);
      canvas.height = Math.floor(height * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    const addParticle = () => {
      const type = Math.random();
      particles.push({
        x: Math.random() * width, y: -18 - Math.random() * 35,
        vx: (Math.random() - .5) * 1.1, vy: 1.0 + Math.random() * 1.7,
        rotation: Math.random() * Math.PI, spin: (Math.random() - .5) * .12,
        size: 4 + Math.random() * 7, width: 3 + Math.random() * 7,
        height: 7 + Math.random() * 12, color: colors[Math.floor(Math.random() * colors.length)],
        type: type < .48 ? 'paper' : type < .88 ? 'gel' : 'star',
        alpha: .62 + Math.random() * .34, phase: Math.random() * 6.28
      });
      if (particles.length > 95) particles.splice(0, particles.length - 95);
    };
    const draw = (time) => {
      ctx.clearRect(0, 0, width, height);
      if (time - lastSpawn > 95) { addParticle(); if (Math.random() > .48) addParticle(); lastSpawn = time; }
      for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];
        p.x += p.vx + Math.sin(time / 650 + p.phase) * .45;
        p.y += p.vy;
        p.rotation += p.spin;
        if (p.y > height + 30 || p.x < -35 || p.x > width + 35) { particles.splice(i, 1); continue; }
        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate(p.rotation);
        ctx.globalAlpha = p.alpha;
        if (p.type === 'paper') {
          ctx.fillStyle = p.color;
          ctx.fillRect(-p.width / 2, -p.height / 2, p.width, p.height);
        } else if (p.type === 'gel') {
          ctx.fillStyle = p.color;
          ctx.globalAlpha = p.alpha * .48;
          ctx.shadowColor = p.color;
          ctx.shadowBlur = 7;
          ctx.beginPath();
          ctx.ellipse(0, 0, p.size * .72, p.size * .42, 0, 0, Math.PI * 2);
          ctx.fill();
          ctx.globalAlpha = p.alpha * .8;
          ctx.strokeStyle = '#ffffff';
          ctx.lineWidth = .8;
          ctx.stroke();
        } else {
          ctx.fillStyle = p.color;
          ctx.shadowColor = p.color;
          ctx.shadowBlur = 8;
          ctx.font = (p.size + 5) + 'px system-ui';
          ctx.fillText('✦', -p.size / 2, p.size / 2);
        }
        ctx.restore();
      }
      window.requestAnimationFrame(draw);
    };
    resize();
    window.addEventListener('resize', resize, {passive:true});
    window.requestAnimationFrame(draw);
  }

})();