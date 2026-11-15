/* InvestCalc 401(k) employer match and vesting calculator.
 * Source year limits: IRS 2026 and Notice 2026-66 for 2027.
 * Annualized employer-match and vesting estimate; not payroll, tax or plan administration.
 */
(() => {
 'use strict';
 const LIMITS=Object.freeze({
  2026:Object.freeze({base:24500,catchup:8000,special:11250,annual:72000,comp:360000}),
  2027:Object.freeze({base:25500,catchup:8500,special:11750,annual:75000,comp:375000})
 });
 const DEFAULTS=Object.freeze({
  year:'2027',salary:'80000',age:'35',employeeRate:'4',firstBand:'3',firstMatch:'100',secondBand:'2',secondMatch:'50',matchCap:'0',
  service:'3',vesting:'graded6',existingEmployer:'18000',existingEmployee:'24000',salaryGrowth:'3',returnRate:'6',projectionYears:'20'
 });
 const RANGES=Object.freeze({salary:[1,100000000],age:[18,90],employeeRate:[0,100],firstBand:[0,100],firstMatch:[0,500],
  secondBand:[0,100],secondMatch:[0,500],matchCap:[0,10000000],service:[0,50],
  existingEmployer:[0,100000000],existingEmployee:[0,100000000],
  salaryGrowth:[-50,50],returnRate:[-95,50],projectionYears:[1,40]});
 const INT=new Set(['age','service','projectionYears']);
 const $=id=>document.getElementById(id);
 const usd=n=>new Intl.NumberFormat('en-US',{style:'currency',currency:'USD',maximumFractionDigits:0}).format(n);
 const exact=n=>new Intl.NumberFormat('en-US',{style:'currency',currency:'USD',minimumFractionDigits:2,maximumFractionDigits:2}).format(n);
 const number=(n,d=1)=>new Intl.NumberFormat('en-US',{maximumFractionDigits:d,minimumFractionDigits:d}).format(n);
 const pct=n=>number(n,1)+'%';
 function read(){
  const v={};
  for(const id of Object.keys(DEFAULTS)){
   const el=$(id),raw=el.value.trim();
   if(id==='year'){if(!Object.hasOwn(LIMITS,raw))throw Error('Choose tax year 2026 or 2027.');v.year=Number(raw);continue;}
   if(id==='vesting'){if(!['immediate','cliff3','graded6'].includes(raw))throw Error('Choose an available vesting schedule.');v.vesting=raw;continue;}
   if(raw==='')throw Error('Enter '+(el.dataset.label||id)+'.');
   const n=Number(raw),range=RANGES[id];
   if(!Number.isFinite(n)||n<range[0]||n>range[1])throw Error((el.dataset.label||id)+' must be between '+range[0]+' and '+range[1]+'.');
   if(INT.has(id)&&!Number.isInteger(n))throw Error((el.dataset.label||id)+' must be a whole number.');
   v[id]=n;
  }
  if(v.firstBand+v.secondBand>100)throw Error('The two contribution bands cannot total more than 100% of eligible pay.');
  return v;
 }
 function vestingPercent(years,schedule){
  if(schedule==='immediate')return 100;
  const y=Math.floor(Math.max(0,years));
  if(schedule==='cliff3')return y>=3?100:0;
  if(schedule==='graded6')return y<2?0:y>=6?100:(y-1)*20;
  throw Error('Unsupported vesting schedule.');
 }
 function deferralLimit(year,age){
  const limits=LIMITS[year];
  if(!limits||age<18||age>100)throw Error('Invalid year or age.');
  const extra=age>=60&&age<=63?limits.special:age>=50?limits.catchup:0;
  return {base:limits.base,catchup:extra,max:limits.base+extra,annual:limits.annual,comp:limits.comp};
 }
 function annualMatch(deferral,eligiblePay,v){
  const tier1=eligiblePay*v.firstBand/100,tier2=eligiblePay*v.secondBand/100;
  const first=Math.min(deferral,tier1)*v.firstMatch/100;
  const second=Math.min(Math.max(0,deferral-tier1),tier2)*v.secondMatch/100;
  const uncapped=first+second;
  return Math.max(0,Math.min(uncapped,v.matchCap>0?v.matchCap:Infinity));
 }
 // Find exact maximum match subject to 402(g) elective limit and 415 annual additions.
 // Rate bands are piecewise linear. The optimum can occur at a breakpoint or at an
 // intersection of raw employer matching, 415 allowance and plan match cap.
 function optimize(v,limits,eligiblePay){
  const maxDeferral=Math.min(v.salary,limits.max);
  const availableForEmployer=def=>Math.max(0,Math.min(limits.annual,v.salary)-Math.min(def,limits.base));
  const raw=def=>{
   const t1=eligiblePay*v.firstBand/100,t2=eligiblePay*v.secondBand/100;
   return Math.min(def,t1)*v.firstMatch/100+Math.min(Math.max(0,def-t1),t2)*v.secondMatch/100;
  };
  const employerCap=v.matchCap>0?v.matchCap:Infinity;
  const match=def=>Math.max(0,Math.min(raw(def),employerCap,availableForEmployer(def)));
  const cut=[0,maxDeferral,
   eligiblePay*v.firstBand/100,eligiblePay*(v.firstBand+v.secondBand)/100,limits.base]
   .filter(x=>x>=0&&x<=maxDeferral).sort((a,b)=>a-b);
  const unique=[...new Set(cut)];
  const points=[...unique];
  for(let i=1;i<unique.length;i++){
   const a=unique[i-1],b=unique[i];
   if(b-a<1e-9)continue;
   const funcs=[raw,availableForEmployer,...Number.isFinite(employerCap)?[()=>employerCap]:[]];
   for(let f=0;f<funcs.length;f++)for(let g=f+1;g<funcs.length;g++){
    const d0=funcs[f](a)-funcs[g](a),d1=funcs[f](b)-funcs[g](b);
    if(d0*d1<0){
     const point=a+(b-a)*(-d0)/(d1-d0);
     if(point>=a&&point<=b)points.push(point);
    }
   }
  }
  const sorted=points.sort((a,b)=>a-b);
  const maxMatch=Math.max(0,...sorted.map(match));
  const earliest=sorted.find(x=>match(x)>=maxMatch-0.00000001)??0;
  return {maxMatch,minDeferralToMax:earliest,currentMatch:match(Math.min(v.salary*v.employeeRate/100,maxDeferral)),matchFor:match,maxDeferral};
 }
 function calc(v){
  const lim=deferralLimit(v.year,v.age),eligiblePay=Math.min(v.salary,lim.comp);
  const employee=Math.min(v.salary*v.employeeRate/100,lim.max,v.salary);
  const opt=optimize(v,lim,eligiblePay);
  const employer=opt.currentMatch;
  const potential=opt.maxMatch;
  const missed=Math.max(0,potential-employer);
  const requiredRate=opt.minDeferralToMax/v.salary*100;
  const extraToMax=Math.max(0,opt.minDeferralToMax-employee);
  const vest=pctNumber(vestingPercent(v.service,v.vesting));
  const totalEmployer=v.existingEmployer+employer;
  const totalEmployee=v.existingEmployee+employee;
  const ownedEmployer=totalEmployer*vest/100;
  const forfeitable=totalEmployer-ownedEmployer;
  const owned=totalEmployee+ownedEmployer;
  const all=totalEmployer+totalEmployee;
  const additionLimit=lim.annual;
  const nonCatchup=Math.min(employee,lim.base);
  const contributionHeadroom=Math.max(0,Math.min(additionLimit,v.salary)-nonCatchup-employer);
  const capReached=employee>=lim.max-.01;
  const projected=[];
  let empBalance=v.existingEmployee,matchBalance=v.existingEmployer;
  for(let i=0;i<=v.projectionYears;i++){
   if(i>0){
    // IRS limits held constant across years: forward projections are illustrative, not a tax-limit forecast.
    const annualSalary=v.salary*Math.pow(1+v.salaryGrowth/100,i-1);
    const scenario={...v,salary:annualSalary,age:v.age+i-1};
    const yearLimits=deferralLimit(v.year,Math.min(100,scenario.age));
    const pay=Math.min(annualSalary,yearLimits.comp);
    const optY=optimize(scenario,yearLimits,pay);
    const employeeY=Math.min(annualSalary*v.employeeRate/100,yearLimits.max);
    const monthlyRate=Math.pow(1+v.returnRate/100,1/12)-1;
    for(let month=0;month<12;month++){
      empBalance=(empBalance+employeeY/12)*(1+monthlyRate);
      matchBalance=(matchBalance+optY.currentMatch/12)*(1+monthlyRate);
    }
   }
   projected.push({years:i,employee:empBalance,employer:matchBalance,total:empBalance+matchBalance});
  }
  return {lim,eligiblePay,employee,employer,potential,missed,requiredRate,extraToMax,vest,ownedEmployer,forfeitable,totalEmployer,
    totalEmployee,owned,all,capReached,contributionHeadroom,projected,annualEmployeeRate:employee/v.salary*100};
 }
 function pctNumber(n){return n;}
 window.MatchVestingMath={LIMITS,deferralLimit,vestingPercent,annualMatch,optimize,calc};
 const NS='http://www.w3.org/2000/svg';
 function svg(tag,attrs={},textValue){
  const e=document.createElementNS(NS,tag);for(const [k,val] of Object.entries(attrs))e.setAttribute(k,String(val));
  if(textValue!==undefined)e.textContent=textValue;return e;
 }
 function set(id,value){$(id).textContent=value;}
 function matchChart(v,r){
  const root=$('match-chart');root.replaceChildren();
  root.append(svg('title',{id:'match-chart-title'},'Annual employer match by employee contribution percentage'));
  root.append(svg('desc',{id:'match-chart-desc'},'As the contribution percentage increases, annual employer match rises to the available maximum under selected plan tiers and IRS limits.'));
  const xMax=Math.min(100,Math.max(10,Math.ceil(Math.max(v.employeeRate,r.requiredRate)+3)));
  const eligible=r.eligiblePay,lim=r.lim,opt=optimize(v,lim,eligible);
  const maxY=Math.max(1,r.potential*1.16);
  const left=69,right=609,top=18,bottom=185;
  const x=p=>left+p/xMax*(right-left),y=m=>bottom-m/maxY*(bottom-top);
  for(let i=0;i<=4;i++){
   const val=r.potential*i/4, yy=y(val);
   root.append(svg('line',{x1:left,x2:right,y1:yy,y2:yy,stroke:'#e4eaf4','stroke-width':1}));
   root.append(svg('text',{x:left-9,y:yy+4,fill:'#71829c','font-size':11,'text-anchor':'end'},
    new Intl.NumberFormat('en-US',{notation:'compact',maximumFractionDigits:1}).format(val)));
  }
  const curve=[];for(let i=0;i<=100;i++){
    const rate=xMax*i/100,annual=Math.min(v.salary*rate/100,opt.maxDeferral);
    curve.push({rate,match:opt.matchFor(annual)});
  }
  root.append(svg('path',{d:curve.map((p,i)=>(i?'L':'M')+x(p.rate).toFixed(2)+','+y(p.match).toFixed(2)).join(' '),
    stroke:'#1769e0','stroke-width':3.2,fill:'none','stroke-linecap':'round'}));
  const curX=x(v.employeeRate),curY=y(r.employer);
  root.append(svg('circle',{cx:curX,cy:curY,r:6,fill:'#0aa790',stroke:'#fff','stroke-width':2}));
  if(r.potential>0&&r.requiredRate<=xMax){
   const mx=x(r.requiredRate),my=y(r.potential);
   root.append(svg('circle',{cx:mx,cy:my,r:5,fill:'#845fda',stroke:'#fff','stroke-width':2}));
  }
  for(let i=0;i<=5;i++){
   const p=xMax*i/5;root.append(svg('text',{x:x(p),y:205,fill:'#76859a','font-size':11,'text-anchor':'middle'},number(p,0)+'%'));
  }
  root.append(svg('text',{x:338,y:225,fill:'#6d7f98','font-size':11,'text-anchor':'middle'},'Employee contribution (% of salary)'));
 }
 function vestChart(v,r){
  const root=$('vest-chart');root.replaceChildren();
  root.append(svg('title',{id:'vest-chart-title'},'Employer money retained and subject to forfeiture by completed service years'));
  root.append(svg('desc',{id:'vest-chart-desc'},'Shows ownership of the same employer balance after this plan year at different credited service years. Not a forecast of investment returns.'));
  const years=[0,1,2,3,4,5,6];
  const left=110,barW=470,height=15,step=27;
  for(let i=0;i<years.length;i++){
   const yr=years[i],p=vestingPercent(yr,v.vesting),y=16+i*step;
   const vested=barW*p/100;
   root.append(svg('text',{x:left-13,y:y+12,'text-anchor':'end','font-size':11,fill:yr===v.service?'#27599d':'#647792','font-weight':700},yr+' yr'));
   root.append(svg('rect',{x:left,y,width:barW,height,rx:4,fill:'#f1c8d3'}));
   if(vested>0)root.append(svg('rect',{x:left,y,width:vested,height,rx:4,fill:'#0b9e84'}));
   root.append(svg('text',{x:left+barW+7,y:y+12,'font-size':11,fill:'#526782'},p+'%'));
  }
 }
 function projectionChart(v,r){
  const root=$('growth-chart');root.replaceChildren();
  root.append(svg('title',{id:'growth-title'},'Illustrative employee and employer account value over future years'));
  root.append(svg('desc',{id:'growth-desc'},'Two projected account balances with fixed annual tax limits, salary growth and assumed investment return; not guaranteed future retirement value.'));
  const vals=r.projected;
  const top=15,bottom=189,left=76,right=607,scale=Math.max(1,...vals.map(p=>p.total))*1.1;
  const x=i=>left+i/v.projectionYears*(right-left),y=n=>bottom-n/scale*(bottom-top);
  for(let i=0;i<=4;i++){
   const val=scale*i/4,Y=y(val);
   root.append(svg('line',{x1:left,x2:right,y1:Y,y2:Y,stroke:'#e7edf6'}));
   root.append(svg('text',{x:left-9,y:Y+4,fill:'#70839b','text-anchor':'end','font-size':10},
      new Intl.NumberFormat('en-US',{notation:'compact',maximumFractionDigits:1}).format(val)));
  }
  for(const [key,color] of [['employee','#1769e0'],['total','#8061d8']]){
   root.append(svg('path',{d:vals.map((p,i)=>(i?'L':'M')+x(p.years).toFixed(2)+','+y(p[key]).toFixed(2)).join(' '),
       fill:'none',stroke:color,'stroke-width':3.0,'stroke-linecap':'round'}));
  }
  for(let i=0;i<=4;i++){
   const t=v.projectionYears*i/4;
   root.append(svg('text',{x:x(t),y:210,fill:'#74859b','font-size':11,'text-anchor':'middle'},number(t,0)+'y'));
  }
 }
 let last=null;
 function clear(){
  ['annualMatch','missingMatch','employeePaid','requiredRate','increaseRequired','vestingNow',
   'ownedEmployer','forfeitable','ownedTotal','baseLimit','annualLimit','compLimit','currentEmployer','ownedEmployee',
   'matchMax','matchCapNote','retirementProjection'].forEach(k=>set(k,'—'));
  ['match-chart','vest-chart','growth-chart'].forEach(id=>$(id).replaceChildren());
  $('status').className='status';set('statusTitle','Correct inputs to calculate.');set('statusMessage','Matching and vesting estimates will appear here.');
  set('planNotes','');set('limitsNotes','');
 }
 function render(){
  try{
   const v=read(),r=calc(v);if(!Number.isFinite(r.owned)||!Number.isFinite(r.projected.at(-1).total))throw Error('Calculation overflow. Reduce large amounts.');
   last={v,r};set('error','');
   set('annualMatch',exact(r.employer));
   set('missingMatch',exact(r.missed));
   set('employeePaid',exact(r.employee));
   set('requiredRate',pct(r.requiredRate));
   set('increaseRequired',r.extraToMax<.01?'Already at full modeled match':exact(r.extraToMax)+' extra / year');
   set('vestingNow',pct(r.vest));
   set('ownedEmployer',usd(r.ownedEmployer));
   set('forfeitable',usd(r.forfeitable));
   set('ownedTotal',usd(r.owned));
   set('baseLimit',usd(r.lim.base)+' + '+usd(r.lim.catchup)+' catch-up');
   set('annualLimit',usd(r.lim.annual));
   set('compLimit',usd(r.lim.comp));
   set('currentEmployer',usd(r.totalEmployer));
   set('ownedEmployee',usd(r.totalEmployee));
   set('matchMax',usd(r.potential));
   set('matchCapNote',v.matchCap>0?'Your plan match cap: '+usd(v.matchCap):'No separate plan match-dollar cap entered');
   set('retirementProjection',usd(r.projected.at(-1).total));
   $('status').className='status '+(r.missed>.01?'warning':'good');
   set('statusTitle',r.missed>.01?'EMPLOYER MATCH LEFT ON THE TABLE':'FULL MODELED EMPLOYER MATCH CAPTURED');
   set('statusMessage',r.missed>.01?'At this annualized contribution, an additional '+usd(r.extraToMax)+' of employee deferrals could capture roughly '+usd(r.missed)+' more employer match this year, if your plan allows year-end true-up.':'Your contribution level captures the maximum employer match under the stated tiers and annual limits.');
   set('limitsNotes','IRS '+v.year+': employee regular limit '+usd(r.lim.base)+', catch-up '+usd(r.lim.catchup)+', annual additions '+usd(r.lim.annual)+', eligible compensation cap '+usd(r.lim.comp)+'. These limits and the sample employer formula assume a standard (non-SIMPLE) 401(k).');
   set('planNotes','At '+v.service+' completed credited service years, the selected '+(v.vesting==='graded6'?'six-year graded':v.vesting==='cliff3'?'three-year cliff':'immediate')+' schedule gives '+pct(r.vest)+' ownership of employer money. Employee deferrals remain 100% vested. This illustrative exit calculation adds one full year of employee and matching contributions to existing balances and assumes no market gain or loss.');
   matchChart(v,r);vestChart(v,r);projectionChart(v,r);
  }catch(e){last=null;set('error',e.message);clear();}
 }
 function rows(){
  const {v,r}=last;
  return [['Metric','Value'],['Tax year',v.year],['Salary',v.salary],['Age at tax year end',v.age],['Employee elected contribution %',v.employeeRate],
   ['Tier 1 employee pay band %',v.firstBand],['Tier 1 match percentage',v.firstMatch],['Tier 2 additional pay band %',v.secondBand],
   ['Tier 2 match percentage',v.secondMatch],['Plan employer match dollar cap',v.matchCap],['IRS regular deferral limit',r.lim.base],
   ['IRS catch-up allowance',r.lim.catchup],['IRS annual additions limit',r.lim.annual],['IRS compensation ceiling',r.lim.comp],
   ['Actual employee deferral after limit',r.employee],['Annual employer match after limits',r.employer],
   ['Maximum possible match',r.potential],['Missing employer match',r.missed],
   ['Required employee contribution % to max match',r.requiredRate],['Additional employee deferral to max match',r.extraToMax],
   ['Vesting schedule',v.vesting],['Completed years service',v.service],['Vested employer percentage',r.vest],
   ['Existing employer account',v.existingEmployer],['Existing employee account',v.existingEmployee],
   ['Employer account after match, no growth',r.totalEmployer],['Employee account after deferral, no growth',r.totalEmployee],
   ['Employer vested balance',r.ownedEmployer],['Potentially forfeitable employer balance',r.forfeitable],['Total immediately owned balance estimate',r.owned],
   ['Projection horizon years',v.projectionYears],['Annual salary change %',v.salaryGrowth],['Assumed annual return %',v.returnRate],
   ['Hypothetical combined value at horizon',r.projected.at(-1).total],
   ['Limitations','Constant year limits in projection; employer matches annualized with year-end true-up; actual plan provisions control']];
 }
 function download(){
  if(!last)return;
  const csv=rows().map(r=>r.map(x=>'"'+String(x).replace(/"/g,'""')+'"').join(',')).join('\r\n');
  const blob=new Blob(['\ufeff'+csv],{type:'text/csv;charset=utf-8'});
  const url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download='401k-match-vesting-calculator.csv';
  document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),1000);
 }
 function copy(){
  if(!last)return;const {v,r}=last;
  const s=['401(k) Employer Match & Vesting Estimate', 'https://returnoninvestmentcalculator.in/401k-employer-match-vesting-calculator/',
    'Tax year: '+v.year,'Annual employee deferral: '+exact(r.employee),'Employer match: '+exact(r.employer),
    'Missed employer match: '+exact(r.missed),'Contribution to get full match: '+pct(r.requiredRate),
    'Employer vesting: '+pct(r.vest),'Employer funds owned: '+exact(r.ownedEmployer),
    'Potentially forfeitable employer funds: '+exact(r.forfeitable),
    'Illustrative annualized model, not a plan statement, tax filing or guaranteed return.'].join('\n');
  if(navigator.clipboard?.writeText)navigator.clipboard.writeText(s).then(()=>set('error','Summary copied.')).catch(()=>set('error','Clipboard permission denied.'));
  else set('error','Clipboard unavailable.');
 }
 $('match-form').addEventListener('input',render);$('match-form').addEventListener('change',render);
 $('match-form').addEventListener('submit',e=>{e.preventDefault();render();});
 $('reset').addEventListener('click',()=>{Object.keys(DEFAULTS).forEach(k=>$(k).value=DEFAULTS[k]);render();});
 $('download').addEventListener('click',download);
 $('copy').addEventListener('click',copy);
 $('print').addEventListener('click',()=>window.print());
 render();
})();