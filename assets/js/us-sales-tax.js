/* US Sales Tax Forward & Reverse Calculator. Browser-only; rate inputs are user supplied. */
(()=>{'use strict';
const $=id=>document.getElementById(id);
const defaults={mode:'add',amount:'100',quantity:'1',discount:'0',stateRate:'6',localRate:'2.25',shipping:'0',shippingTaxable:'no',rounding:'line',variance:'3'};
const ids=Object.keys(defaults), fmt=x=>new Intl.NumberFormat('en-US',{style:'currency',currency:'USD'}).format(x);
const num=(id,min,max)=>{const raw=$(id).value.trim(),v=Number(raw);if(!raw||!Number.isFinite(v)||v<min||v>max)throw Error(id+' must be between '+min+' and '+max+'.');return v;};
const round=x=>Math.round((x+Number.EPSILON)*100)/100;
function calculate(v){
 const {mode,amount,quantity,discount,stateRate,localRate,shipping,shippingTaxable,rounding}=v;
 if(!['add','reverse'].includes(mode)||!['yes','no'].includes(shippingTaxable)||!['line','unit'].includes(rounding))throw Error('Invalid mode or rounding option');
 if(!(amount>=0&&amount<=1e9&&quantity>=1&&quantity<=1e6&&Number.isInteger(quantity)&&discount>=0&&discount<=100&&stateRate>=0&&stateRate<=30&&localRate>=0&&localRate<=30&&shipping>=0&&shipping<=1e9))throw Error('Invalid input range');
 const rate=(stateRate+localRate)/100, discountFactor=1-discount/100,shipTax=shippingTaxable==='yes';
 // Reverse mode: amount is a tax-inclusive per-unit price; recover pre-tax per-unit amount.
 // Discount is applied to recovered pre-tax unit price in both modes.
 const rawBase=mode==='reverse'?amount/(1+rate):amount;
 const discountedUnit=rawBase*discountFactor;
 const taxable=discountedUnit*quantity+(shipTax?shipping:0);
 const tax=rounding==='unit'?round(discountedUnit*rate)*quantity+(shipTax?round(shipping*rate):0):round(taxable*rate);
 const subtotal=round(discountedUnit*quantity),net=round(subtotal+shipping),gross=round(net+tax);
 const stateTax=rate===0?0:round(tax*stateRate/(stateRate+localRate));
 const localTax=round(tax-stateTax);
 const effective=net>0?tax/net*100:0;
 const saved=round(rawBase*quantity*discount/100);
 const scenarios=[0,1,2,3,4,5,6].map(i=>{const rr=Math.max(0,stateRate+localRate+(i-3)*v.variance),taxableAmount=discountedUnit*quantity+(shipTax?shipping:0);return {rate:rr,tax:round(taxableAmount*rr/100),total:round(net+round(taxableAmount*rr/100))};});
 return {rawBase,discountedUnit,subtotal,net,tax,gross,stateTax,localTax,effective,saved,rate:rate*100,scenarios,taxable};
}
window.USSalesTaxMath={calculate};
const el=(tag,attrs={},value)=>{const e=document.createElementNS('http://www.w3.org/2000/svg',tag);Object.entries(attrs).forEach(([k,v])=>e.setAttribute(k,String(v)));if(value!==undefined)e.textContent=value;return e;};
let last=null;
function render(){
 try{
 const v={mode:$('mode').value,amount:num('amount',0,1e9),quantity:num('quantity',1,1e6),discount:num('discount',0,100),stateRate:num('stateRate',0,30),localRate:num('localRate',0,30),shipping:num('shipping',0,1e9),shippingTaxable:$('shippingTaxable').value,rounding:$('rounding').value,variance:num('variance',0.1,10)};
 if(!Number.isInteger(v.quantity))throw Error('Quantity must be a whole number.');
 const r=calculate(v);last={v,r};$('error').textContent='';
 const fields={net:fmt(r.net),tax:fmt(r.tax),gross:fmt(r.gross),stateTax:fmt(r.stateTax),localTax:fmt(r.localTax),subtotal:fmt(r.subtotal),discountSaved:fmt(r.saved),effective:r.effective.toFixed(2)+'%',rate:r.rate.toFixed(3)+'%',unitBefore:fmt(r.rawBase),unitAfter:fmt(r.discountedUnit),taxable:fmt(r.taxable)};
 Object.entries(fields).forEach(([id,text])=>$(id).textContent=text);
 $('modeHelp').textContent=v.mode==='reverse'?'Input is a tax-inclusive unit price. The tool divides by (1 + combined rate) to recover its pre-tax base, then applies any discount.':'Input is a pre-tax unit price. Discount is applied before sales tax.';
 $('roundHelp').textContent=v.rounding==='unit'?'Tax is rounded for each discounted unit, then multiplied by quantity; taxable shipping is rounded separately.':'Tax is calculated on the aggregated taxable line amount and rounded once to cents.';
 const s=$('chart');s.replaceChildren();
 s.append(el('title',{id:'sales-chart-title'},'Sales tax and final total at alternative rates'));
 s.append(el('desc',{id:'sales-chart-desc'},'Bar chart of estimated tax at seven combined rates, with a reference to the current rate.'));
 const max=Math.max(1,...r.scenarios.map(p=>p.tax)),w=480;
 r.scenarios.forEach((p,i)=>{
 const y=22+i*38,bw=p.tax/max*w;
 s.append(el('text',{x:10,y:y+17,'font-size':12,fill:'#526984'},p.rate.toFixed(2)+'%'));
 s.append(el('rect',{x:92,y:y,width:bw,height:23,rx:4,fill:i===3?'#1769e0':'#93baf1'}));
 s.append(el('text',{x:Math.min(590,98+bw),y:y+17,'font-size':12,fill:'#273b57'},fmt(p.tax)));
 });
 }catch(e){last=null;$('error').textContent=e.message;['net','tax','gross','stateTax','localTax','subtotal','discountSaved','effective','rate','unitBefore','unitAfter','taxable'].forEach(id=>$(id).textContent='—');$('chart').replaceChildren();}
}
function csv(){if(!last)return;const {v,r}=last;const data=[['Metric','Value'],...Object.entries(v),...Object.entries(r).filter(([k])=>k!=='scenarios')].map(a=>a.map(x=>'"'+String(x).replace(/"/g,'""')+'"').join(',')).join('\r\n');const url=URL.createObjectURL(new Blob(['\ufeff'+data],{type:'text/csv'}));const a=document.createElement('a');a.href=url;a.download='us-sales-tax-calculation.csv';document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),1500);}
function copy(){if(!last)return;const {r}=last;const t='US Sales Tax Calculator\nNet '+fmt(r.net)+'\nTax '+fmt(r.tax)+'\nGross '+fmt(r.gross)+'\nCombined rate '+r.rate.toFixed(3)+'%\nhttps://returnoninvestmentcalculator.in/us-sales-tax-calculator/';if(navigator.clipboard?.writeText)navigator.clipboard.writeText(t).then(()=>$('error').textContent='Copied summary.').catch(()=>$('error').textContent='Clipboard unavailable.');else $('error').textContent='Clipboard unavailable.';}
$('tax-form').addEventListener('input',render);$('tax-form').addEventListener('change',render);
$('tax-form').addEventListener('submit',e=>{e.preventDefault();render();});
$('reset').addEventListener('click',()=>{Object.entries(defaults).forEach(([k,v])=>$(k).value=v);render();});
$('copy').addEventListener('click',copy);$('csv').addEventListener('click',csv);$('print').addEventListener('click',()=>window.print());
render();
})();