/* EV vs gasoline ownership model. Values are user estimates; all expenses in one currency. */
(()=>{'use strict';
const $=id=>document.getElementById(id);
const defaults={currency:'USD',unit:'mi',years:'7',distance:'12000',evPrice:'38000',gasPrice:'31000',evRebate:'0',gasRebate:'0',evResale:'14000',gasResale:'11500',evEfficiency:'30',gasEfficiency:'30',homeRate:'0.18',publicRate:'0.45',publicShare:'20',fuelPrice:'3.50',evMaint:'0.061',gasMaint:'0.101',evInsurance:'1800',gasInsurance:'1600',evFees:'250',gasFees:'200',evUpfront:'1200',gasUpfront:'0',evFinance:'0',gasFinance:'0',evAnnualOther:'0',gasAnnualOther:'0',discount:'0'};
const limits={years:[1,20],distance:[0,200000],evPrice:[0,10000000],gasPrice:[0,10000000],evRebate:[0,10000000],gasRebate:[0,10000000],evResale:[0,10000000],gasResale:[0,10000000],evEfficiency:[0.01,1000],gasEfficiency:[0.01,1000],homeRate:[0,100],publicRate:[0,100],publicShare:[0,100],fuelPrice:[0,1000],evMaint:[0,100],gasMaint:[0,100],evInsurance:[0,1000000],gasInsurance:[0,1000000],evFees:[0,1000000],gasFees:[0,1000000],evUpfront:[0,10000000],gasUpfront:[0,10000000],evFinance:[0,1000000],gasFinance:[0,1000000],evAnnualOther:[0,1000000],gasAnnualOther:[0,1000000],discount:[0,30]};
const fmt=(v,d=0)=>new Intl.NumberFormat('en-US',{maximumFractionDigits:d,minimumFractionDigits:d}).format(v);
const money=(c,v)=>new Intl.NumberFormat('en-US',{style:'currency',currency:c,maximumFractionDigits:0}).format(v);
function read(){const v={};for(const [id,def] of Object.entries(defaults)){const el=$(id),raw=el.value.trim();if(id==='currency'){if(!['USD','GBP','EUR','INR','CAD','AUD'].includes(raw))throw Error('Select a supported currency.');v[id]=raw;continue;}if(id==='unit'){if(!['mi','km'].includes(raw))throw Error('Select miles or kilometers.');v[id]=raw;continue;}if(raw==='')throw Error('Enter '+(el.dataset.label||id)+'.');const n=Number(raw),range=limits[id];if(!Number.isFinite(n)||n<range[0]||n>range[1])throw Error((el.dataset.label||id)+' must be between '+range.join(' and ')+'.');v[id]=n;}if(!Number.isInteger(v.years))throw Error('Ownership years must be a whole number.');if(v.evRebate>v.evPrice||v.gasRebate>v.gasPrice)throw Error('Rebate cannot exceed the corresponding vehicle purchase price.');if(v.evResale>v.evPrice||v.gasResale>v.gasPrice)throw Error('Resale estimate cannot exceed the original purchase price in this conservative model.');return v;}
function calculate(v){
 const km=v.unit==='km',miles=v.distance*(km?1/1.609344:1),annualEVkWh=miles/100*v.evEfficiency;
 const chargeRate=v.homeRate*(1-v.publicShare/100)+v.publicRate*v.publicShare/100;
 const annualEVFuel=annualEVkWh*chargeRate;
 const annualGasFuel=km?v.distance/100*v.gasEfficiency*v.fuelPrice:miles/v.gasEfficiency*v.fuelPrice;
 const annualEVMaintenance=miles*v.evMaint,annualGasMaintenance=miles*v.gasMaint;
 const annualEV=annualEVFuel+annualEVMaintenance+v.evInsurance+v.evFees+v.evFinance+v.evAnnualOther;
 const annualGas=annualGasFuel+annualGasMaintenance+v.gasInsurance+v.gasFees+v.gasFinance+v.gasAnnualOther;
 const initialEV=v.evPrice-v.evRebate+v.evUpfront,initialGas=v.gasPrice-v.gasRebate+v.gasUpfront;
 const resaleEV=v.evResale,resaleGas=v.gasResale;
 const evTotal=initialEV+annualEV*v.years-resaleEV,gasTotal=initialGas+annualGas*v.years-resaleGas;
 const saving=gasTotal-evTotal,annualSaving=annualGas-annualEV;
 const cashDiff=initialEV-initialGas;
 const cashBreakEven=cashDiff<=0?0:annualSaving>0?cashDiff/annualSaving:null;
 const nominal=[],discounted=[];
 const d=v.discount/100;
 for(let y=0;y<=v.years;y++){
  const e=initialEV+annualEV*y-(y===v.years?resaleEV:0);
  const g=initialGas+annualGas*y-(y===v.years?resaleGas:0);
  nominal.push({year:y,ev:e,gas:g,diff:g-e});
  const pvFactor=d===0?y:(1-Math.pow(1+d,-y))/d;
  const de=initialEV+annualEV*pvFactor-(y===v.years?resaleEV/Math.pow(1+d,y):0);
  const dg=initialGas+annualGas*pvFactor-(y===v.years?resaleGas/Math.pow(1+d,y):0);
  discounted.push({year:y,ev:de,gas:dg,diff:dg-de});
 }
 const npv=discounted.at(-1),netMiles=miles*v.years;
 return {miles,annualEVkWh,chargeRate,annualEVFuel,annualGasFuel,annualEVMaintenance,annualGasMaintenance,annualEV,annualGas,initialEV,initialGas,evTotal,gasTotal,saving,annualSaving,cashDiff,cashBreakEven,nominal,discounted,discountedEV:npv.ev,discountedGas:npv.gas,discountedSaving:npv.diff,costPerMileEV:netMiles>0?evTotal/netMiles:null,costPerMileGas:netMiles>0?gasTotal/netMiles:null};
}
window.EVGasTCO={calculate};
const NS='http://www.w3.org/2000/svg';
function node(tag,attrs={},value){const e=document.createElementNS(NS,tag);for(const [k,v] of Object.entries(attrs))e.setAttribute(k,String(v));if(value!==undefined)e.textContent=value;return e;}
function put(id,value){$(id).textContent=value;}
function graph(r,v){
 const s=$('costChart');s.replaceChildren();s.append(node('title',{id:'chartTitle'},'Cumulative electric and gasoline vehicle ownership costs'));s.append(node('desc',{id:'chartDesc'},'Year by year total spending before resale except final year, with resale deducted in the last year.'));
 const pts=r.nominal,max=Math.max(1,...pts.flatMap(x=>[x.ev,x.gas]))*1.08,left=65,right=605,top=17,bottom=192;
 const x=y=>left+y/v.years*(right-left),y=z=>bottom-z/max*(bottom-top);
 for(let i=0;i<=4;i++){const value=max*i/4,Y=y(value);s.append(node('line',{x1:left,x2:right,y1:Y,y2:Y,stroke:'#e4edf6'}));s.append(node('text',{x:left-6,y:Y+4,'text-anchor':'end',fill:'#627a93','font-size':11},money(v.currency,value)));}
 for(const [field,color] of [['ev','#1769e0'],['gas','#e17a45']]){
 const d=pts.map((p,i)=>(i?'L':'M')+x(p.year).toFixed(1)+','+y(p[field]).toFixed(1)).join(' ');
 s.append(node('path',{d,fill:'none',stroke:color,'stroke-width':3.5,'stroke-linejoin':'round'}));
 }
 for(let yr=0;yr<=v.years;yr+=Math.max(1,Math.ceil(v.years/8)))s.append(node('text',{x:x(yr),y:212,'text-anchor':'middle',fill:'#627a93','font-size':11},'Y'+yr));
}
let last=null;
function render(){try{const v=read(),r=calculate(v);last={v,r};put('error','');put('winner',r.saving>0?'EV costs less':r.saving<0?'Gas car costs less':'Same total cost');put('difference',money(v.currency,Math.abs(r.saving)));put('evTotal',money(v.currency,r.evTotal));put('gasTotal',money(v.currency,r.gasTotal));put('evEnergy',money(v.currency,r.annualEVFuel));put('gasEnergy',money(v.currency,r.annualGasFuel));put('annualSaving',money(v.currency,r.annualSaving));put('evAnnual',money(v.currency,r.annualEV));put('gasAnnual',money(v.currency,r.annualGas));put('chargeRate',v.currency+' '+fmt(r.chargeRate,3)+'/kWh');put('kwh',fmt(r.annualEVkWh,0)+' kWh/yr');put('breakEven',r.cashBreakEven===null?'Not reached':r.cashBreakEven===0?'No initial EV premium':fmt(r.cashBreakEven,1)+' years');put('discountedEV',money(v.currency,r.discountedEV));put('discountedGas',money(v.currency,r.discountedGas));put('discountedSaving',money(v.currency,r.discountedSaving));put('perMileEV',r.costPerMileEV===null?'N/A':v.currency+' '+fmt(r.costPerMileEV,2)+'/mi');put('perMileGas',r.costPerMileGas===null?'N/A':v.currency+' '+fmt(r.costPerMileGas,2)+'/mi');put('miles',fmt(r.miles,0)+' miles/yr');put('initialEV',money(v.currency,r.initialEV));put('initialGas',money(v.currency,r.initialGas));put('resaleEV',money(v.currency,v.evResale));put('resaleGas',money(v.currency,v.gasResale));put('note','Cash break-even ignores resale, financing timing and discounting; compare the '+v.years+'-year total and discounted results for a fuller picture.');graph(r,v);}
 catch(e){last=null;put('error',e.message);for(const id of ['winner','difference','evTotal','gasTotal','evEnergy','gasEnergy','annualSaving','evAnnual','gasAnnual','chargeRate','kwh','breakEven','discountedEV','discountedGas','discountedSaving','perMileEV','perMileGas','miles','initialEV','initialGas','resaleEV','resaleGas'])put(id,'—');$('costChart').replaceChildren();}}
function csv(){if(!last)return;const {v,r}=last,rows=[['Metric','EV','Gas'],['Currency',v.currency,v.currency],['Ownership years',v.years,v.years],['Initial net outlay',r.initialEV,r.initialGas],['Annual energy',r.annualEVFuel,r.annualGasFuel],['Annual maintenance',r.annualEVMaintenance,r.annualGasMaintenance],['Annual operating cost',r.annualEV,r.annualGas],['Estimated resale',v.evResale,v.gasResale],['Nominal total cost',r.evTotal,r.gasTotal],['Discounted total cost',r.discountedEV,r.discountedGas],['Nominal EV saving',r.saving,''],['Discounted EV saving',r.discountedSaving,''],[],['Year','EV cumulative cost','Gas cumulative cost'],...r.nominal.map(p=>[p.year,p.ev,p.gas])];const csv=rows.map(row=>row.map(x=>'"'+String(x??'').replace(/"/g,'""')+'"').join(',')).join('\r\n');const u=URL.createObjectURL(new Blob(['\ufeff'+csv],{type:'text/csv;charset=utf-8'})),a=document.createElement('a');a.href=u;a.download='ev-vs-gas-total-cost.csv';document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(u),1000);}
function copy(){if(!last)return;const {v,r}=last,s=['EV vs Gas Total Cost of Ownership','https://returnoninvestmentcalculator.in/ev-vs-gas-cost-calculator/','Years: '+v.years,'EV cost: '+money(v.currency,r.evTotal),'Gas cost: '+money(v.currency,r.gasTotal),'EV savings: '+money(v.currency,r.saving),'Assumptions: user-provided, annual fixed prices, no automatic tax incentives'].join('\n');if(navigator.clipboard?.writeText)navigator.clipboard.writeText(s).then(()=>put('error','Summary copied.')).catch(()=>put('error','Clipboard permission denied.'));else put('error','Clipboard unavailable.');}
$('tcoForm').addEventListener('input',render);$('tcoForm').addEventListener('change',render);$('tcoForm').addEventListener('submit',e=>{e.preventDefault();render();});$('reset').addEventListener('click',()=>{for(const [id,val]of Object.entries(defaults))$(id).value=val;render();});$('download').addEventListener('click',csv);$('copy').addEventListener('click',copy);$('print').addEventListener('click',()=>window.print());render();
})();