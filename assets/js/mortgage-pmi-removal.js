/* InvestCalc | PMI Cancellation and Mortgage Savings
  This fixed-rate, conventional borrower-paid PMI model carefully distinguishes:
  HPA request at 80% of original value based on actual OR scheduled balance;
  78% automatic termination based on ORIGINAL payment schedule (not accelerated);
  midpoint final termination; eligibility conditions/servicer approval are external.
  All user inputs stay in-browser. No rate feed, account access, or chart library.
*/
(() => {
 'use strict';
 const $=id=>document.getElementById(id);
 const defaults=Object.freeze({
  purchase:'400000',appraisal:'410000',principal:'360000',rate:'6.5',term:'30',
  firstPayment:'2022-01',asOf:'2026-11',currentBalance:'',pmi:'165',
  extra:'250',lump:'5000',delay:'1',investor:'none',currentValue:'',appraisalCost:'450'
 });
 const limits={
  purchase:[1,1e10],appraisal:[1,1e10],principal:[1,1e10],
  rate:[0,30],term:[5,40],currentBalance:[0,1e10],pmi:[0,1e6],
  extra:[0,1e7],lump:[0,1e10],delay:[0,12],currentValue:[1,1e10],appraisalCost:[0,1e7]
 };
 const integers=new Set(['term','delay']);
 const fmt=(n,d=0)=>new Intl.NumberFormat('en-US',{minimumFractionDigits:d,maximumFractionDigits:d}).format(n);
 const cash=n=>new Intl.NumberFormat('en-US',{style:'currency',currency:'USD',maximumFractionDigits:0}).format(n);
 const exact=n=>new Intl.NumberFormat('en-US',{style:'currency',currency:'USD',minimumFractionDigits:2,maximumFractionDigits:2}).format(n);
 const pct=n=>fmt(n,1)+'%';
 function parseMonth(s){
  if(!/^\d{4}-(0[1-9]|1[0-2])$/.test(s))throw Error('Dates must use year and month (YYYY-MM).');
  let y=Number(s.slice(0,4)),m=Number(s.slice(5,7))-1;
  if(y<1900||y>2200)throw Error('Enter a date between 1900 and 2200.');
  return y*12+m;
 }
 function dateMonth(serial){
  const yr=Math.floor(serial/12),mo=serial%12;
  return new Intl.DateTimeFormat('en-US',{month:'short',year:'numeric',timeZone:'UTC'}).format(new Date(Date.UTC(yr,mo,1)));
 }
 function read(){
  const v={};
  for(const k of Object.keys(defaults)){
   const el=$(k),raw=el.value.trim();
   if(k==='firstPayment'||k==='asOf'){v[k]=raw;parseMonth(raw);continue;}
   if(k==='investor'){
    if(raw!=='none'&&raw!=='fannie1')throw Error('Choose a valid investor-policy option.');
    v[k]=raw;continue;
   }
   if((k==='currentBalance'||k==='currentValue')&&raw===''){v[k]=null;continue;}
   if(raw==='')throw Error('Enter '+(el.dataset.label||k)+'.');
   const n=Number(raw),range=limits[k];
   if(!Number.isFinite(n)||n<range[0]||n>range[1])throw Error((el.dataset.label||k)+' must be between '+fmt(range[0])+' and '+fmt(range[1])+'.');
   if(integers.has(k)&&!Number.isInteger(n))throw Error((el.dataset.label||k)+' must be a whole number.');
   v[k]=n;
  }
  if(v.principal>Math.max(v.purchase,v.appraisal)*1.5)throw Error('Original loan is unusually larger than the entered property value. Recheck those amounts.');
  if(v.currentBalance!==null&&v.currentBalance>v.principal*1.00001)throw Error('The current principal balance cannot exceed the original loan in this no-redraw, unmodified fixed-rate model.');
  if(parseMonth(v.asOf)<parseMonth(v.firstPayment))throw Error('As-of month must be on or after the first scheduled payment month.');
  if((parseMonth(v.asOf)-parseMonth(v.firstPayment))>v.term*12)throw Error('As-of month is beyond the original loan term. Recalculate for a new or modified loan.');
  return v;
 }
 function payment(principal,rate,months){
  const r=rate/1200;
  return r===0?principal/months:principal*r/(-Math.expm1(-months*Math.log1p(r)));
 }
 function originalSchedule(principal,rate,n){
  const pmt=payment(principal,rate,n),balances=[principal],rows=[];
  let bal=principal,interestTotal=0;
  for(let i=1;i<=n;i++){
   const interest=bal*rate/1200;
   const principalPaid=i===n?bal:Math.min(bal,Math.max(0,pmt-interest));
   bal=Math.max(0,bal-principalPaid);
   interestTotal+=interest;
   balances.push(bal);rows.push({month:i,interest,principalPaid,balance:bal});
  }
  return {payment:pmt,balances,rows,interest:interestTotal};
 }
 function indexBelow(arr,target){
  const idx=arr.findIndex(b=>b<=target+1e-7);
  return idx<0?Infinity:idx;
 }
 function simulate(start,rate,regular,extra,lump,maxMonths=600){
  let balance=Math.max(0,start-Math.min(start,lump)),interestTotal=0;
  const rows=[{month:0,balance,interest:0,principalPaid:Math.min(start,lump),cumulativeInterest:0}];
  if(balance===0)return {rows,months:0,interest:0,startAfterLump:0};
  for(let month=1;month<=maxMonths;month++){
   const interest=balance*rate/1200,contractPrincipal=Math.max(0,regular-interest);
   if(regular<=interest+1e-9)throw Error('The regular payment does not cover interest on the entered current balance. Check the balance or loan terms.');
   const principalPaid=Math.min(balance,contractPrincipal+extra);
   balance=Math.max(0,balance-principalPaid);interestTotal+=interest;
   rows.push({month,balance,interest,principalPaid,cumulativeInterest:interestTotal});
   if(balance<=1e-7) return {rows,months:month,interest:interestTotal,startAfterLump:rows[0].balance};
  }
  throw Error('The mortgage did not amortize within 600 modeled months.');
 }
 function milestone(v,orig,elapsed,track){
  const originalValue=Math.min(v.purchase,v.appraisal),t80=originalValue*.8,t78=originalValue*.78;
  const scheduled80=indexBelow(orig.balances,t80),scheduled78=indexBelow(orig.balances,t78);
  const actual80rel=indexBelow(track.rows.map(r=>r.balance),t80);
  const actual80=elapsed+actual80rel;
  const requestFirst=Math.min(scheduled80,actual80);
  const requestEffective=Math.max(elapsed,requestFirst)+v.delay;
  // Automatic termination is tied ONLY to original contractual schedule: never
  // use actual extra payment history to accelerate this statutory date.
  const autoEffective=Math.max(elapsed,scheduled78);
  const midpointEffective=Math.max(elapsed,Math.ceil(v.term*12/2));
  const payoffEffective=elapsed+track.months;
  const end=Math.min(requestEffective,autoEffective,midpointEffective,payoffEffective);
  let reason='Requested cancellation at 80% (approval assumed)';
  if(end===payoffEffective&&end<requestEffective)reason='Mortgage paid off';
  else if(end===autoEffective&&end<requestEffective)reason='Scheduled 78% automatic termination';
  else if(end===midpointEffective&&end<requestEffective&&end<autoEffective)reason='Loan-term midpoint backstop';
  return {end,reason,requestFirst,actual80,scheduled80,scheduled78,requestEffective,autoEffective,midpointEffective,payoffEffective,
   monthsPMI:Math.max(0,end-elapsed),pmiCost:Math.max(0,end-elapsed)*v.pmi,
   t80,t78};
 }
 function analyze(v){
  const n=v.term*12,orig=originalSchedule(v.principal,v.rate,n);
  const elapsed=parseMonth(v.asOf)-parseMonth(v.firstPayment);
  const balanceScheduled=orig.balances[elapsed];
  const current=v.currentBalance===null?balanceScheduled:v.currentBalance;
  const baseline=simulate(current,v.rate,orig.payment,0,0);
  const planned=simulate(current,v.rate,orig.payment,v.extra,v.lump);
  const baseM=milestone(v,orig,elapsed,baseline),planM=milestone(v,orig,elapsed,planned);
  const originalValue=Math.min(v.purchase,v.appraisal);
  const scheduled80=indexBelow(orig.balances,.8*originalValue),scheduled78=indexBelow(orig.balances,.78*originalValue);
  const midpoint=Math.ceil(n/2);
  const currentLTV=current/originalValue*100;
  const plannedLTV=planned.startAfterLump/originalValue*100;
  const savingsPMI=Math.max(0,baseM.pmiCost-planM.pmiCost);
  const savingsInterest=baseline.interest-planned.interest;
  const accelerated=Math.max(0,baseM.end-planM.end);
  const valueLTV=v.currentValue===null?null:current/v.currentValue*100;
  let valuePath={enabled:false,eligible:false,threshold:null,ltv:valueLTV,netSavings:null,seasoning:elapsed,status:'Not evaluated'};
  if(v.investor==='fannie1'){
   if(v.currentValue===null){
    valuePath={...valuePath,enabled:true,status:'Enter a current appraised property value to assess the optional Fannie Mae one-unit borrower-request pathway.'};
   }else{
    const threshold=elapsed<24?null:elapsed<=60?75:80;
    const eligible=threshold!==null&&valueLTV<=threshold+1e-9;
    const effectivePMI=Math.min(baseM.monthsPMI,v.delay)*v.pmi;
    valuePath={enabled:true,eligible,threshold,ltv:valueLTV,seasoning:elapsed,
     netSavings:eligible?baseM.pmiCost-effectivePMI-v.appraisalCost:null,
     status:threshold===null?'Under two years since first payment: standard seasoning not met (improvement exceptions not modeled).':
       eligible?'LTV meets the selected Fannie Mae current-value threshold, subject to servicer approval, valuation, payment history and investor conditions.':
       'Current-value LTV is above the selected Fannie Mae threshold. An appraisal alone may not remove PMI.'};
   }
  }
  return {orig,elapsed,current,originalValue,currentLTV,plannedLTV,scheduled80,scheduled78,midpoint,
    baseline,planned,baseM,planM,savingsPMI,savingsInterest,accelerated,valuePath,
    originalLTV:v.principal/originalValue*100,firstSerial:parseMonth(v.firstPayment)};
 }
 window.PMIRemovalMath={parseMonth,dateMonth,payment,originalSchedule,indexBelow,simulate,milestone,analyze};
 const ns='http://www.w3.org/2000/svg';
 function elem(tag,attrs={},content){const z=document.createElementNS(ns,tag);for(const [k,v] of Object.entries(attrs))z.setAttribute(k,String(v));if(content!==undefined)z.textContent=content;return z;}
 function put(id,value){$(id).textContent=value;}
 function lineGraph(v,r){
  const s=$('ltv-chart');s.replaceChildren();
  s.append(elem('title',{id:'ltv-chart-title'},'Original-value LTV projection with and without extra principal'));
  s.append(elem('desc',{id:'ltv-chart-desc'},'Line chart of outstanding principal as a percentage of original home value, comparing current payments with planned additional payments.'));
  const months=Math.min(240,Math.max(60,r.baseM.monthsPMI+12,r.planM.monthsPMI+12));
  const left=64,right=617,top=18,bottom=209,scale=Math.max(100,r.currentLTV*1.06);
  const x=m=>left+m/months*(right-left),y=val=>bottom-val/scale*(bottom-top);
  for(const target of [0,40,60,78,80,100].filter(q=>q<=scale)){
   const yy=y(target);
   s.append(elem('line',{x1:left,x2:right,y1:yy,y2:yy,stroke:(target===78||target===80)?'#d8b978':'#e9eef6',
    'stroke-width':1,'stroke-dasharray':(target===78||target===80)?'5 4':'none'}));
   s.append(elem('text',{x:left-7,y:yy+3,'text-anchor':'end','font-size':11,fill:'#74849b'},target+'%'));
  }
  function path(model,col){
   const pts=[];for(let i=0;i<=months;i++){
    const b=i<=model.months?model.rows[i].balance:0;
    pts.push((i?'L':'M')+x(i).toFixed(2)+','+y(b/r.originalValue*100).toFixed(2));
   }
   s.append(elem('path',{d:pts.join(' '),stroke:col,'stroke-width':3,fill:'none','stroke-linejoin':'round','stroke-linecap':'round'}));
  }
  path(r.baseline,'#1769e0');path(r.planned,'#855ed8');
  for(let i=0;i<=4;i++){const m=months*i/4;s.append(elem('text',{x:x(m),y:230,fill:'#74849b','font-size':11,'text-anchor':'middle'},fmt(m/12,1)+'y'));}
  s.append(elem('text',{x:(left+right)/2,y:252,fill:'#718298','text-anchor':'middle','font-size':11},'Years from selected as-of month'));
 }
 function pmiChart(v,r){
  const s=$('pmi-chart');s.replaceChildren();
  s.append(elem('title',{id:'pmi-chart-title'},'Cumulative future PMI payments with and without extra principal'));
  s.append(elem('desc',{id:'pmi-chart-desc'},'Projected PMI bills from the as-of month through assumed cancellation for both plans, with monthly PMI held constant.'));
  const maxMonths=Math.max(12,r.baseM.monthsPMI,r.planM.monthsPMI);
  const left=73,right=617,top=19,bottom=183;
  const scale=Math.max(1,r.baseM.pmiCost,r.planM.pmiCost)*1.16;
  const x=i=>left+i/maxMonths*(right-left),y=val=>bottom-val/scale*(bottom-top);
  for(let i=0;i<=4;i++){
   const v0=scale*i/4,yy=y(v0);
   s.append(elem('line',{x1:left,x2:right,y1:yy,y2:yy,stroke:'#e7edf7'}));
   s.append(elem('text',{x:left-8,y:yy+4,fill:'#72849b','text-anchor':'end','font-size':11},fmt(v0,0)));
  }
  for(const [name,n,color] of [['baseline',r.baseM.monthsPMI,'#1769e0'],['planned',r.planM.monthsPMI,'#855ed8']]){
   const points=[];
   for(let i=0;i<=maxMonths;i++){
    const val=Math.min(i,n)*v.pmi;
    points.push((i?'L':'M')+x(i).toFixed(2)+','+y(val).toFixed(2));
   }
   s.append(elem('path',{d:points.join(' '),fill:'none',stroke:color,'stroke-width':3,'stroke-linecap':'round'}));
  }
  for(let k=0;k<=4;k++){const m=maxMonths*k/4;s.append(elem('text',{x:x(m),y:203,fill:'#72839b','text-anchor':'middle','font-size':11},fmt(m/12,1)+'y'));}
 }
 let last=null;
 function clear(){
  ['requestDate','autoDate','midpointDate','regularPmi','extraPmi','pmiSaved',
   'monthsSaved','interestSaved','combinedSaved','scheduledPmt','origLtv',
   'valueOrig','currentBalanceOut','currentLtv','plannedLtv','baselineEnd','plannedEnd',
   'baselineReason','plannedReason','balanceNow','regular80','extra80',
   'valueLtv','valueThreshold','valueSavings','valueStatus'].forEach(k=>put(k,'—'));
  $('ltv-chart').replaceChildren();$('pmi-chart').replaceChildren();
  $('banner').className='banner';put('bannerHead','Check inputs to calculate.');put('bannerDesc','Estimates appear when values are valid.');
  put('notice','');
 }
 function show(){
  try{
   const v=read(),r=analyze(v);
   if(!Number.isFinite(r.savingsInterest)||!Number.isFinite(r.savingsPMI))throw Error('Numerical overflow; check values.');
   last={v,r};put('error','');
   put('requestDate',dateMonth(r.firstSerial+Math.max(r.elapsed,r.planM.requestFirst))+'*');
   put('autoDate',dateMonth(r.firstSerial+Math.max(r.elapsed,r.scheduled78)));
   put('midpointDate',dateMonth(r.firstSerial+r.midpoint));
   put('regularPmi',cash(r.baseM.pmiCost));put('extraPmi',cash(r.planM.pmiCost));
   put('pmiSaved',cash(r.savingsPMI));put('monthsSaved',fmt(r.accelerated)+' months');
   put('interestSaved',cash(r.savingsInterest));put('combinedSaved',cash(r.savingsPMI+r.savingsInterest));
   put('scheduledPmt',exact(r.orig.payment));
   put('origLtv',pct(r.originalLTV));put('valueOrig',cash(r.originalValue));
   put('currentBalanceOut',cash(r.current));put('balanceNow',cash(r.planned.startAfterLump));
   put('currentLtv',pct(r.currentLTV));put('plannedLtv',pct(r.plannedLTV));
   put('baselineEnd',dateMonth(r.firstSerial+r.baseM.end));put('plannedEnd',dateMonth(r.firstSerial+r.planM.end));
   put('baselineReason',r.baseM.reason);put('plannedReason',r.planM.reason);
   put('regular80',dateMonth(r.firstSerial+Math.max(r.elapsed,r.baseM.requestFirst)));
   put('extra80',dateMonth(r.firstSerial+Math.max(r.elapsed,r.planM.requestFirst)));
   put('valueLtv',r.valuePath.ltv===null?'Enter a value':pct(r.valuePath.ltv));
   put('valueThreshold',r.valuePath.threshold===null?'Not established':pct(r.valuePath.threshold));
   put('valueSavings',r.valuePath.netSavings===null?'Not calculated':cash(r.valuePath.netSavings));
   put('valueStatus',r.valuePath.status);
   const banner=$('banner');
   const notes=[];
   if(r.originalLTV<=80)notes.push('The loan began at or below 80% LTV, so standard borrower-paid PMI might not have been required originally.');
   if(r.scheduled78<=r.elapsed)notes.push('The original 78% automatic termination date is already on or before your selected as-of month; if PMI is still charged, contact the servicer.');
   if(r.planM.requestFirst<=r.elapsed)notes.push('Your plan appears to meet an 80% request threshold at the as-of month; written request, payment history, value and lien checks still apply.');
   if(v.currentBalance!==null && Math.abs(r.current-r.orig.balances[r.elapsed])>1)notes.push('The current balance differs from original schedule. Original 78% date is intentionally unchanged.');
   if(r.originalLTV>80 && v.investor==='fannie1')notes.push('Current-value investor path is discretionary/conditional and NOT included in automatic HPA savings.');
   put('notice',notes.join(' '));
   const improved=r.savingsPMI>0.01;
   banner.className='banner '+(improved?'improved':'baseline');
   put('bannerHead',improved?'EARLIER REQUESTED PMI REMOVAL POSSIBLE':'NO EARLIER PMI SAVINGS MODELED');
   put('bannerDesc',improved?'With prompt successful PMI-cancellation requests, the extra principal strategy could avoid '+cash(r.savingsPMI)+' of future PMI under the chosen fees and processing assumption.':'Extra principal can still save mortgage interest. The scheduled 78% automatic-termination milestone stays tied to the original amortization schedule.');
   lineGraph(v,r);pmiChart(v,r);
  }catch(e){last=null;put('error',e.message);clear();}
 }
 function records(){
  const {v,r}=last;return [
   ['Metric','Value'],['First payment YYYY-MM',v.firstPayment],['As-of YYYY-MM',v.asOf],
   ['Original purchase price',v.purchase],['Original appraisal',v.appraisal],['Original home value for HPA',r.originalValue],
   ['Original mortgage principal',v.principal],['Fixed interest %',v.rate],['Original term years',v.term],
   ['Original scheduled payment',r.orig.payment],['Scheduled 80% request milestone month',dateMonth(r.firstSerial+r.scheduled80)],
   ['Scheduled 78% automatic termination payment month',dateMonth(r.firstSerial+Math.max(0,r.scheduled78-1))],
   ['Midpoint final-termination month',dateMonth(r.firstSerial+r.midpoint)],
   ['Current balance used',r.current],['Current LTV %',r.currentLTV],['PMI monthly amount',v.pmi],
   ['Additional monthly principal',v.extra],['One-time principal today',v.lump],['Request processing buffer months',v.delay],
   ['Baseline potential 80% request milestone',dateMonth(r.firstSerial+Math.max(r.elapsed,r.baseM.requestFirst))],
   ['Accelerated potential 80% request milestone',dateMonth(r.firstSerial+Math.max(r.elapsed,r.planM.requestFirst))],
   ['Baseline estimated PMI end',dateMonth(r.firstSerial+r.baseM.end)],
   ['Accelerated estimated PMI end',dateMonth(r.firstSerial+r.planM.end)],
   ['Baseline PMI from as-of',r.baseM.pmiCost],['Accelerated PMI from as-of',r.planM.pmiCost],
   ['Projected PMI savings',r.savingsPMI],['Remaining lifetime interest savings',r.savingsInterest],
   ['Optional investor method',v.investor],['Current appraisal value',v.currentValue===null?'':v.currentValue],
   ['Appraisal fee',v.appraisalCost],['Current value investor eligibility assumption',r.valuePath.status],
   ['Estimated savings net of current-value appraisal fee',r.valuePath.netSavings===null?'':r.valuePath.netSavings],
   ['Caution','Conventional, fixed-rate, borrower-paid PMI, qualifying loan; borrower requests require servicer approval and payment history.']
  ];}
 function csv(){
  if(!last)return;const lines=records().map(row=>row.map(z=>'"'+String(z).replace(/"/g,'""')+'"').join(',')).join('\r\n');
  const url=URL.createObjectURL(new Blob(['\ufeff'+lines],{type:'text/csv;charset=utf-8'}));
  const a=document.createElement('a');a.href=url;a.download='mortgage-pmi-removal-estimate.csv';
  document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),1000);
 }
 function copy(){
  if(!last)return;const {v,r}=last;const text=[
   'Mortgage PMI Removal & Savings Estimate','https://returnoninvestmentcalculator.in/mortgage-pmi-removal-calculator/',
   'As-of month: '+v.asOf,'Original property value: '+cash(r.originalValue),
   'Original scheduled 78% automatic termination: '+dateMonth(r.firstSerial+Math.max(0,r.scheduled78-1)),
   'Baseline estimated PMI end: '+dateMonth(r.firstSerial+r.baseM.end),
   'Accelerated estimated PMI end: '+dateMonth(r.firstSerial+r.planM.end),
   'PMI savings if requests approved: '+cash(r.savingsPMI),
   'Mortgage interest savings: '+cash(r.savingsInterest),
   'Assumes fixed-rate conventional borrower-paid PMI and servicer approval; no guarantee.'].join('\n');
  if(navigator.clipboard?.writeText)navigator.clipboard.writeText(text).then(()=>put('error','Summary copied.')).catch(()=>put('error','Clipboard permission denied.'));
  else put('error','Clipboard unavailable.');
 }
 $('pmi-form').addEventListener('input',show);$('pmi-form').addEventListener('change',show);
 $('pmi-form').addEventListener('submit',e=>{e.preventDefault();show();});
 $('reset').addEventListener('click',()=>{for(const [k,v] of Object.entries(defaults))$(k).value=v;show();});
 $('download').addEventListener('click',csv);
 $('copy').addEventListener('click',copy);
 $('print').addEventListener('click',()=>window.print());
 show();
})();
