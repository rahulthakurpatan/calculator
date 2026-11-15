/* US HSA estimator. IRS Rev. Proc. 2025-19 (2026) and 2026-24 (2027).
   This model excludes last-month rule, testing period, spouses' shared family limits,
   mid-year coverage changes, and special statutory eligibility exceptions. */
(()=>{'use strict';
const $=id=>document.getElementById(id),fmt=n=>new Intl.NumberFormat('en-US',{style:'currency',currency:'USD',maximumFractionDigits:2}).format(n);
const limits={2026:{self:4400,family:8750,minSelf:1700,minFamily:3400,maxSelf:8500,maxFamily:17000},2027:{self:4500,family:9000,minSelf:1750,minFamily:3500,maxSelf:8700,maxFamily:17400}};
const defaults={year:'2026',coverage:'self',age:'40',eligibleMonths:'12',medicare:'no',employer:'500',existing:'0',planned:'2500',federal:'22',state:'5',payroll:'yes',deductible:'2000',oop:'6000'};
function compute(v){
 const l=limits[v.year];if(!l)throw Error('Choose a supported tax year.');
 const keys=['age','eligibleMonths','employer','existing','planned','federal','state','deductible','oop'];
 keys.forEach(k=>{if(!Number.isFinite(v[k])||v[k]<0)throw Error('Invalid '+k+'.')});
 if(v.age>120||v.eligibleMonths>12||v.federal>60||v.state>30)throw Error('Age, months or tax rate out of range.');
 if(!['self','family'].includes(v.coverage)||!['yes','no'].includes(v.medicare)||!['yes','no'].includes(v.payroll))throw Error('Invalid selection.');
 const base=l[v.coverage],catchup=v.age>=55?1000:0;
 const statutory=base+catchup;
 const annual=statutory*v.eligibleMonths/12;
 const eligible=v.medicare==='no'&&v.eligibleMonths>0;
 const allowed=eligible?annual:0;
 const used=v.employer+v.existing;
 const room=Math.max(0,allowed-used);
 const allowedPlanned=Math.min(v.planned,room);
 const excess=Math.max(0,used+v.planned-allowed);
 const federalSaving=allowedPlanned*v.federal/100;
 const stateSaving=allowedPlanned*v.state/100;
 const ficaSaving=v.payroll==='yes'?allowedPlanned*0.0765:0;
 const totalSaving=federalSaving+stateSaving+ficaSaving;
 const monthly=room/Math.max(1,v.eligibleMonths);
 const hdhpMinimum=l[v.coverage==='self'?'minSelf':'minFamily'];
 const hdhpMaximum=l[v.coverage==='self'?'maxSelf':'maxFamily'];
 const planCheck=v.deductible>=hdhpMinimum&&v.oop<=hdhpMaximum&&v.oop>=v.deductible;
 return {base,catchup,statutory,annual,allowed,used,room,allowedPlanned,excess,federalSaving,stateSaving,ficaSaving,totalSaving,monthly,hdhpMinimum,hdhpMaximum,planCheck,eligible};
}
window.HSAModel={compute,limits};
function input(){
 const v={};for(const [k,val] of Object.entries(defaults)){const el=$(k);if(!el)throw Error('Missing field '+k);v[k]=['year','coverage','medicare','payroll'].includes(k)?el.value:Number(el.value);if(el.value==='')throw Error('Enter '+k+'.');}return v;
}
const set=(id,value)=>{$(id).textContent=value};
const svg=(name,attrs,text)=>{const el=document.createElementNS('http://www.w3.org/2000/svg',name);Object.entries(attrs).forEach(([k,v])=>el.setAttribute(k,String(v)));if(text!==undefined)el.textContent=text;return el};
function chart(v,r){
 const s=$('chart');s.replaceChildren();
 s.append(svg('title',{},'Annual HSA contribution capacity, existing contributions, planned eligible contribution and remaining room'));
 const data=[['Annual limit',r.allowed,'#1769df'],['Already used',r.used,'#9c7ee0'],['Planned eligible',r.allowedPlanned,'#0e9e87'],['Room after plan',Math.max(0,r.room-r.allowedPlanned),'#e4a13b']];
 const max=Math.max(1,...data.map(x=>x[1]));data.forEach(([label,value,color],i)=>{const y=12+i*52;s.append(svg('text',{x:10,y:y+12,'font-size':12,fill:'#435876'},label));s.append(svg('rect',{x:10,y:y+19,width:480*value/max,height:17,rx:5,fill:color}));s.append(svg('text',{x:500,y:y+32,'text-anchor':'end','font-size':12,fill:'#233c5b'},fmt(value)));});
}
let last=null;
function render(){
 try{
  const v=input(),r=compute(v);last={v,r};
  const outputs={annual:fmt(r.allowed),room:fmt(r.room),saving:fmt(r.totalSaving),excess:fmt(r.excess),plannedEligible:fmt(r.allowedPlanned),federalSave:fmt(r.federalSaving),stateSave:fmt(r.stateSaving),ficaSave:fmt(r.ficaSaving),monthly:fmt(r.monthly),hdhpMin:fmt(r.hdhpMinimum),hdhpMax:fmt(r.hdhpMaximum),base:fmt(r.base),catchup:fmt(r.catchup),already:fmt(r.used)};
  Object.entries(outputs).forEach(([id,val])=>set(id,val));
  set('planStatus',r.planCheck?'Deductible and out-of-pocket figures meet the selected year’s standard numerical HDHP thresholds. Other eligibility requirements still apply.':'The entered deductible/out-of-pocket figures do not meet the selected year’s standard HDHP numerical thresholds. Check plan qualification before contributing.');
  set('eligibility',r.eligible?'Assumes all entered eligible months are HSA-qualified and Medicare-free.':'No new HSA contribution capacity modeled: Medicare selected or zero eligible months.');
  set('error','');chart(v,r);
 }catch(e){last=null;set('error',e.message);$('chart').replaceChildren();['annual','room','saving','excess','plannedEligible','federalSave','stateSave','ficaSave','monthly','hdhpMin','hdhpMax','base','catchup','already'].forEach(k=>set(k,'—'));set('planStatus','');set('eligibility','');}
}
function report(){if(!last)return '';const {v,r}=last;return [['Year',v.year],['Coverage',v.coverage],['Annual prorated limit',r.allowed],['Employer plus prior contributions',r.used],['Remaining contribution room',r.room],['Planned eligible contribution',r.allowedPlanned],['Potential excess contribution',r.excess],['Estimated federal tax reduction',r.federalSaving],['Estimated state tax reduction',r.stateSaving],['Estimated payroll FICA reduction',r.ficaSaving],['Total illustrative tax savings',r.totalSaving],['Assumptions','User-entered marginal tax rates; 7.65% FICA only for qualifying payroll salary-reduction HSA; no last-month rule, spouse sharing, Medicare partial-year or state exceptions']];}
$('hsa-form').addEventListener('input',render);$('hsa-form').addEventListener('change',render);
$('reset').addEventListener('click',()=>{Object.entries(defaults).forEach(([k,v])=>$(k).value=v);render()});
$('copy').addEventListener('click',()=>{if(!last)return;const value=report().map(a=>a.join(': ')).join('\n');if(navigator.clipboard?.writeText)navigator.clipboard.writeText(value).then(()=>set('error','Copied summary.')).catch(()=>set('error','Clipboard blocked.'));else set('error','Clipboard unavailable.')});
$('csv').addEventListener('click',()=>{if(!last)return;const data=report().map(a=>a.map(x=>'"'+String(x).replace(/"/g,'""')+'"').join(',')).join('\r\n');const url=URL.createObjectURL(new Blob(['\ufeff'+data],{type:'text/csv;charset=utf-8'}));const a=document.createElement('a');a.href=url;a.download='hsa-tax-savings-'+last.v.year+'.csv';document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),1000)});
$('print').addEventListener('click',()=>window.print());
render();
})();