/* InvestCalc 2026 | SaaS Rule of 40 and Burn Multiple
   ARR growth = (Ending ARR - Beginning ARR)/Beginning ARR * 100.
   FCF = Operating cash flow - Capex. Rule of 40 = ARR growth % + FCF/recognized revenue %.
   Burn multiple = positive net FCF cash burn / net new ARR; same annual period required.
   Forward sensitivities are hypothetical, not operating forecasts. */
(() => {
'use strict';
const $=id=>document.getElementById(id);
const defs=Object.freeze({currency:'USD',arrMode:'snapshot',marginMode:'fcf',burnMode:'fcf',historyMode:'off',startARR:'1200000',endARR:'1800000',newARR:'850000',expansionARR:'200000',contractionARR:'150000',churnARR:'300000',revenue:'1450000',operating:'-150000',capex:'90000',ebitda:'-180000',directBurn:'240000',cash:'950000',growthTarget:'40',sensitivity:'20',previousGrowth:'30',previousMargin:'-12'});
const bounds={startARR:[1,1e11],endARR:[0,1e11],newARR:[0,1e11],expansionARR:[0,1e11],contractionARR:[0,1e11],churnARR:[0,1e11],revenue:[1,1e11],operating:[-1e11,1e11],capex:[0,1e11],ebitda:[-1e11,1e11],directBurn:[0,1e11],cash:[0,1e11],growthTarget:[0,100],sensitivity:[0,100],previousGrowth:[-100,500],previousMargin:[-300,300]};
const selectValues={arrMode:['snapshot','bridge'],marginMode:['fcf','ebitda'],burnMode:['fcf','direct'],historyMode:['off','on']};
const currencies=new Set(['USD','GBP','EUR','INR','CAD','AUD']);
const format=(v,n=1)=>new Intl.NumberFormat('en-US',{maximumFractionDigits:n,minimumFractionDigits:n}).format(v);
const money=(cur,x)=>new Intl.NumberFormat('en-US',{style:'currency',currency:cur,maximumFractionDigits:0}).format(x);
const percent=x=>format(x,1)+'%';
function read(){
 const v={};for(const [k,initial] of Object.entries(defs)){
  const el=$(k),raw=el.value.trim();
  if(k==='currency'){if(!currencies.has(raw))throw Error('Choose a supported display currency.');v[k]=raw;continue}
  if(selectValues[k]){if(!selectValues[k].includes(raw))throw Error('Select a supported '+k+' option.');v[k]=raw;continue}
  const hidden=(k==='endARR'&&v.arrMode==='bridge')||
   (['newARR','expansionARR','contractionARR','churnARR'].includes(k)&&v.arrMode==='snapshot')||
   (k==='ebitda'&&v.marginMode==='fcf')||(k==='directBurn'&&v.burnMode==='fcf')||
   (['previousGrowth','previousMargin'].includes(k)&&v.historyMode==='off');
  if(hidden){v[k]=Number(initial);continue}
  if(raw==='')throw Error('Enter '+(el.dataset.label||k)+'.');
  const n=Number(raw),range=bounds[k];
  if(!Number.isFinite(n)||n<range[0]||n>range[1])throw Error((el.dataset.label||k)+' must be between '+range[0]+' and '+range[1]+'.');
  v[k]=n;
 }
 return v;
}
function calculate(v){
 if(!Number.isFinite(v.startARR)||v.startARR<=0||!Number.isFinite(v.revenue)||v.revenue<=0)throw Error('Beginning ARR and annual recognized revenue must be positive.');
 const arrMode=v.arrMode||'snapshot',marginMode=v.marginMode||'fcf',burnMode=v.burnMode||'fcf',historyMode=v.historyMode||'off';
 if(!selectValues.arrMode.includes(arrMode)||!selectValues.marginMode.includes(marginMode)||!selectValues.burnMode.includes(burnMode)||!selectValues.historyMode.includes(historyMode))throw Error('Invalid calculation mode.');
 const effectiveEndARR=arrMode==='bridge'?v.startARR+v.newARR+v.expansionARR-v.contractionARR-v.churnARR:v.endARR;
 if(!Number.isFinite(effectiveEndARR)||effectiveEndARR<0||effectiveEndARR>1e11)throw Error('Computed ending ARR must be between zero and 100 billion. Check ARR bridge components.');
 const netNewARR=effectiveEndARR-v.startARR;
 const growth=netNewARR/v.startARR*100;
 const fcf=v.operating-v.capex;
 const fcfMargin=fcf/v.revenue*100;
 const selectedProfit=marginMode==='ebitda'?v.ebitda:fcf;
 const margin=selectedProfit/v.revenue*100;
 const rule=growth+margin;
 const burn=burnMode==='direct'?v.directBurn:Math.max(0,-fcf);
 const positiveCash=burn===0,monthlyBurn=burn/12;
 const multiple=burn>0&&netNewARR>0?burn/netNewARR:null;
 const runway=burn>0?v.cash/monthlyBurn:null;
 const targetFCF=(v.growthTarget-growth)/100*v.revenue;
 const fcfImprovement=Math.max(0,targetFCF-selectedProfit);
 const neededGrowth=Math.max(-100,v.growthTarget-margin);
 const neededEndARR=v.startARR*(1+neededGrowth/100);
 const noPositiveARR=netNewARR<=0;
 const burnStatus=noPositiveARR?'No net-new ARR':positiveCash?'No net cash burn':multiple<1?'Highly capital-efficient':multiple<=2?'Moderate burn':'Higher burn per ARR dollar';
 const priorScore=historyMode==='on'?v.previousGrowth+v.previousMargin:null;
 const scoreChange=priorScore===null?null:rule-priorScore;
 const projections=[-v.sensitivity,-v.sensitivity/2,0,v.sensitivity/2,v.sensitivity].map(delta=>{
  const nextGrowth=Math.max(-100,growth+delta);
  const arr=v.startARR*(1+nextGrowth/100);
  const nextNet=arr-v.startARR;
  return {delta,nextGrowth,arr,rule:nextGrowth+margin,burnMultiple:burn>0&&nextNet>0?burn/nextNet:null};
 });
 return {effectiveEndARR,netNewARR,growth,fcf,fcfMargin,selectedProfit,margin,rule,burn,positiveCash,multiple,monthlyBurn,runway,targetFCF,fcfImprovement,neededGrowth,neededEndARR,ruleTag:rule>=v.growthTarget?'Above target':'Below target',burnStatus,priorScore,scoreChange,projections,arrMode,marginMode,burnMode};
}

window.SaaSRule40Math={calculate};
const NS='http://www.w3.org/2000/svg';
const svg=(tag,attrs={},val)=>{const el=document.createElementNS(NS,tag);for(const [k,v] of Object.entries(attrs))el.setAttribute(k,String(v));if(val!==undefined)el.textContent=val;return el;};
function put(id,s){$(id).textContent=s;}
function ruleChart(v,r){
 const s=$('rule-chart');s.replaceChildren();
 s.append(svg('title',{id:'rule-title'},'Rule of 40 growth and selected profitability margin contribution'));
 s.append(svg('desc',{id:'rule-desc'},'Shows ARR growth, selected FCF or EBITDA margin, Rule of 40 score and selected target.'));
 const left=72,right=585,zero=155;
 const min=Math.min(-80,r.growth,r.margin,r.rule,v.growthTarget),max=Math.max(80,r.growth,r.margin,r.rule,v.growthTarget);
 const width=right-left,scale=x=>left+(x-min)/(max-min)*width;
 s.append(svg('line',{x1:scale(0),x2:scale(0),y1:24,y2:204,stroke:'#94a2bb','stroke-width':2}));
 const rows=[['ARR growth',r.growth,'#166de2'],[r.marginMode==='ebitda'?'EBITDA margin':'FCF margin',r.margin,'#da7a52'],['Rule of 40',r.rule,'#7b5bd2'],['Your target',v.growthTarget,'#0f9d85']];
 rows.forEach(([label,value,color],i)=>{
  const y=25+i*44,origin=scale(0),edge=scale(value),w=Math.abs(edge-origin);
  s.append(svg('text',{x:7,y:y+15,fill:'#566f89','font-size':11,'font-weight':700},label));
  s.append(svg('rect',{x:Math.min(origin,edge),y:y-1,width:w,height:23,rx:4,fill:color}));
  s.append(svg('text',{x:Math.max(79,Math.min(615,edge+(value>=0?6:-6))),y:y+15,'text-anchor':value>=0?'start':'end',fill:'#233c5b','font-size':11,'font-weight':750},percent(value)));
 });
}
function efficiencyChart(v,r){
 const s=$('efficiency-chart');s.replaceChildren();
 s.append(svg('title',{id:'eff-title'},'Rule of 40 sensitivity by annual ARR growth'));
 s.append(svg('desc',{id:'eff-desc'},'Hypothetical Rule of 40 scores with constant selected EBITDA or free cash flow margin.'));
 const points=r.projections,minG=Math.min(...points.map(a=>a.nextGrowth)),maxG=Math.max(...points.map(a=>a.nextGrowth));
 const minR=Math.min(...points.map(a=>a.rule),v.growthTarget,0)-10,maxR=Math.max(...points.map(a=>a.rule),v.growthTarget,40)+10;
 const left=82,right=591,top=18,bottom=185;
 const x=g=>left+(g-minG)/(maxG-minG||1)*(right-left),y=value=>bottom-(value-minR)/(maxR-minR)*(bottom-top);
 for(let i=0;i<=4;i++){
  const value=minR+i*(maxR-minR)/4,Y=y(value);
  s.append(svg('line',{x1:left,x2:right,y1:Y,y2:Y,stroke:'#e6edf6'}));
  s.append(svg('text',{x:left-9,y:Y+4,'font-size':11,fill:'#6b809a','text-anchor':'end'},percent(value)));
 }
 const goalY=y(v.growthTarget);
 s.append(svg('line',{x1:left,x2:right,y1:goalY,y2:goalY,stroke:'#19a28d','stroke-width':2,'stroke-dasharray':'5 4'}));
 const data=points.map((p,i)=>(i?'L':'M')+x(p.nextGrowth).toFixed(1)+','+y(p.rule).toFixed(1)).join(' ');
 s.append(svg('path',{d:data,stroke:'#1769e0','stroke-width':3.5,fill:'none'}));
 const cx=x(r.growth),cy=y(r.rule);s.append(svg('circle',{cx,cy,r:5.5,fill:'#1769e0',stroke:'white','stroke-width':2}));
 points.forEach((p)=>s.append(svg('text',{x:x(p.nextGrowth),y:206,'font-size':11,fill:'#73859c','text-anchor':'middle'},percent(p.nextGrowth))));
}
function clear(){
 ['rule','growth','margin','burn','multiple','runway','netnew','fcf','targetGap','arrToTarget','burnStatus','ruleStatus','ending','cashAvailable','fcfTarget','netBurn','target','operatingOut','arrMethod','marginMethod','burnMethod','ebitdaOut','priorScore','scoreChange'].forEach(id=>put(id,'—'));
 $('rule-chart').replaceChildren();$('efficiency-chart').replaceChildren();$('status').className='status';
 put('statusHead','Correct inputs to calculate.');put('statusNote','Metrics will update instantly.');
}
let last=null;
function updateModeVisibility(){
 $('endARRField').hidden=$('arrMode').value==='bridge';
 $('bridgeFields').hidden=$('arrMode').value!=='bridge';
 $('ebitdaField').hidden=$('marginMode').value!=='ebitda';
 $('directBurnField').hidden=$('burnMode').value!=='direct';
 $('historyFields').hidden=$('historyMode').value!=='on';
}
function render(){
 updateModeVisibility();
 try{
  const v=read(),r=calculate(v);
  if(!Number.isFinite(r.rule)||!Number.isFinite(r.fcfImprovement)||!Number.isFinite(r.neededEndARR))throw Error('Scenario values overflow numerical limits.');
  last={v,r};put('error','');
  put('rule',percent(r.rule));put('growth',percent(r.growth));put('margin',percent(r.margin));
  put('burn',money(v.currency,r.burn));put('netBurn',money(v.currency,r.burn));
  put('multiple',r.multiple===null?(r.burn<=0?'No burn':'N/A'):format(r.multiple,2)+'×');
  put('runway',r.runway===null?'No current burn':format(r.runway,1)+' months');
  put('netnew',money(v.currency,r.netNewARR));put('fcf',money(v.currency,r.fcf));
  put('targetGap',money(v.currency,r.fcfImprovement));put('arrToTarget',money(v.currency,r.neededEndARR));
  const profitability=r.marginMode==='ebitda'?'EBITDA':'FCF';
  put('marginLabel',profitability+' margin');
  put('targetProfitLabel',profitability+' needed to reach target (given growth)');
  put('targetGapLabel','Required improvement in annual '+profitability);
  put('arrMethod',r.arrMode==='bridge'?'ARR movement bridge':'Beginning / ending snapshots');
  put('marginMethod',profitability);
  put('ebitdaOut',r.marginMode==='ebitda'?money(v.currency,v.ebitda):'Not used');
  put('burnMethod',r.burnMode==='direct'?'Direct annual cash burn':'From negative FCF');
  put('priorScore',r.priorScore===null?'Not enabled':percent(r.priorScore));
  put('scoreChange',r.scoreChange===null?'—':(r.scoreChange>0?'+':'')+format(r.scoreChange,1)+' points');
  put('burnStatus',r.burnStatus);put('ruleStatus',r.ruleTag);put('ending',money(v.currency,r.effectiveEndARR));
  put('cashAvailable',money(v.currency,v.cash));put('fcfTarget',money(v.currency,r.targetFCF));
  put('target',percent(v.growthTarget));put('operatingOut',money(v.currency,v.operating));
  const status=$('status');status.className='status '+(r.rule>=v.growthTarget?'good':'warn');
  put('statusHead',r.rule>=v.growthTarget?'TARGET MET FOR THE SELECTED YEAR':'BELOW THE SELECTED RULE-OF-40 TARGET');
  put('statusNote',r.rule>=v.growthTarget?'Growth plus annual free-cash-flow margin meets the benchmark. Review each component independently before drawing conclusions.':
   'At this ARR growth and recognized revenue, improving annual '+profitability+' by '+money(v.currency,r.fcfImprovement)+' would reach the selected Rule-of-40 target, assuming revenue and ARR growth stay unchanged.');
  put('formulaNote',r.netNewARR<=0?'Burn multiple is undefined for zero or negative net new ARR; denominator must be positive.':
   r.burn<=0?'No positive net cash burn was entered or derived; a positive burn multiple is not applicable.': 'Net burn and net new ARR are compared over the same 12-month period. Burn mode: '+(r.burnMode==='direct'?'direct cash use':'FCF-based')+'.');
  ruleChart(v,r);efficiencyChart(v,r);
 }catch(e){last=null;put('error',e.message);clear();}
}
function rows(){
 const {v,r}=last;return [
 ['Metric','Value'],['Currency',v.currency],['ARR method',r.arrMode],
 ['Beginning ARR',v.startARR],['Ending ARR (effective)',r.effectiveEndARR],
 ['New ARR',r.arrMode==='bridge'?v.newARR:'Not selected'],['Expansion ARR',r.arrMode==='bridge'?v.expansionARR:'Not selected'],
 ['Contraction ARR',r.arrMode==='bridge'?v.contractionARR:'Not selected'],['Churned ARR',r.arrMode==='bridge'?v.churnARR:'Not selected'],
 ['Net new ARR',r.netNewARR],['ARR growth %',r.growth],
 ['Annual recognized revenue',v.revenue],['Operating cash flow',v.operating],['Capital expenditures',v.capex],
 ['FCF',r.fcf],['FCF margin %',r.fcfMargin],['Profit metric selected',r.marginMode],
 ['EBITDA',r.marginMode==='ebitda'?v.ebitda:'Not selected'],
 ['Selected profitability margin %',r.margin],['Rule of 40 score %',r.rule],['Selected target %',v.growthTarget],
 ['Burn mode',r.burnMode],['Annual net cash burn',r.burn],['Burn multiple',r.multiple===null?'N/A':r.multiple],
 ['Available cash',v.cash],['Simple runway months',r.runway===null?'N/A':r.runway],
 ['Target profit improvement',r.fcfImprovement],['Ending ARR needed at same margin',r.neededEndARR],
 ['Prior year Rule score',r.priorScore===null?'Not enabled':r.priorScore],
 ['Change vs previous year in percentage points',r.scoreChange===null?'N/A':r.scoreChange],
 ['Assumptions','Consistent twelve-month ARR and cash periods; selected margin may differ from benchmark definitions']
 ];}

function csv(){
 if(!last)return;const s=rows().map(row=>row.map(x=>'"'+String(x).replace(/"/g,'""')+'"').join(',')).join('\r\n');
 const u=URL.createObjectURL(new Blob(['\ufeff'+s],{type:'text/csv;charset=utf-8'})),a=document.createElement('a');
 a.href=u;a.download='saas-rule-of-40-burn-multiple.csv';document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(u),900);
}
function copy(){
 if(!last)return;const {v,r}=last;
 const summary=['SaaS Rule of 40 & Burn Multiple',
 'https://returnoninvestmentcalculator.in/saas-rule-of-40-calculator/',
 'ARR method: '+r.arrMode,'Ending ARR: '+money(v.currency,r.effectiveEndARR),
 'Annual ARR growth '+percent(r.growth),
 'Selected margin: '+(r.marginMode==='ebitda'?'EBITDA':'FCF')+' '+percent(r.margin),
 'FCF margin '+percent(r.fcfMargin),'Rule of 40 '+percent(r.rule),
 'Cash burn basis: '+r.burnMode,'Annual net cash burn '+money(v.currency,r.burn),
 'Burn multiple '+(r.multiple===null?'N/A':format(r.multiple,2)+'×'),
 'Runway '+(r.runway===null?'No current burn':format(r.runway,1)+' months'),
 'Prior-year Rule of 40 '+(r.priorScore===null?'Not enabled':percent(r.priorScore)),
 'Educational model; confirm the accounting and cash flow definitions.'].join('\n');
 if(navigator.clipboard?.writeText)navigator.clipboard.writeText(summary).then(()=>put('error','Summary copied.')).catch(()=>put('error','Clipboard access denied.'));
 else put('error','Clipboard not available.');
}

$('rule-form').addEventListener('input',render);
$('rule-form').addEventListener('change',render);
$('rule-form').addEventListener('submit',e=>{e.preventDefault();render();});
$('reset').addEventListener('click',()=>{Object.entries(defs).forEach(([k,v])=>$(k).value=v);render();});
$('download').addEventListener('click',csv);$('copy').addEventListener('click',copy);
$('print').addEventListener('click',()=>window.print());
render();
})();