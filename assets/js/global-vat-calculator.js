/* Global VAT calculator. Rates are illustrative, not authoritative jurisdiction lookups. */
(()=>{'use strict';
const $=id=>document.getElementById(id),fields=['mode','country','currency','amount','rate','qty','discount','shipping','shipTax','inputVat','rounding'];
const presets={UK:['GBP',20],DE:['EUR',19],FR:['EUR',20],IE:['EUR',23],AU:['AUD',10],NZ:['NZD',15],ZA:['ZAR',15],AE:['AED',5],SA:['SAR',15],CUSTOM:['EUR',20]};
const curr=['GBP','EUR','AUD','NZD','ZAR','AED','SAR','USD','CAD','INR'];
const num=(x,name,min,max)=>{if(String(x).trim()==='')throw Error(name+' is required');const v=Number(x);if(!Number.isFinite(v)||v<min||v>max)throw Error(name+' must be between '+min+' and '+max);return v};
const round=(v,p)=>Math.round((v+Number.EPSILON)*10**p)/10**p;
function compute(o){
 const amount=num(o.amount,'Price',0,1e11),rate=num(o.rate,'VAT rate',0,100),qty=num(o.qty,'Quantity',1,1e6),discount=num(o.discount,'Discount',0,100),shipping=num(o.shipping,'Shipping',0,1e11),inputVat=num(o.inputVat,'Eligible input VAT',0,1e11);
 if(!Number.isInteger(qty))throw Error('Quantity must be a whole number');
 const mode=o.mode,rounding=o.rounding;
 if(!['add','remove'].includes(mode)||!['invoice','line'].includes(rounding))throw Error('Invalid calculation mode or rounding option');
 const factor=1+rate/100,disc=1-discount/100;
 const unit=amount*disc;
 const netUnit=mode==='add'?unit:unit/factor;
 const grossUnit=mode==='add'?unit*factor:unit;
 const taxUnit=grossUnit-netUnit;
 const shippingNet=o.shipTax?mode==='add'?shipping:shipping/factor:shipping;
 const shippingGross=o.shipTax?mode==='add'?shipping*factor:shipping:shipping;
 const shippingTax=shippingGross-shippingNet;
 let net,tax,gross;
 if(rounding==='line'){
   net=round(round(netUnit,2)*qty+round(shippingNet,2),2);
   tax=round(round(taxUnit,2)*qty+round(shippingTax,2),2);
   gross=round(net+tax,2);
 }else{
   net=round(netUnit*qty+shippingNet,2);
   gross=round(grossUnit*qty+shippingGross,2);
   tax=round(gross-net,2);
 }
 const payable=round(tax-inputVat,2);
 return {net,tax,gross,payable,inputVat,unitNet:round(netUnit,2),unitGross:round(grossUnit,2),unitTax:round(taxUnit,2),discountValue:round(amount*discount/100*qty,2),shippingNet:round(shippingNet,2),shippingTax:round(shippingTax,2),rate,qty,mode,rounding,vatFraction:rate/(100+rate),baseAmount:amount,shipping};
}
window.VATMath={compute};
const money=(cur,v)=>new Intl.NumberFormat('en-US',{style:'currency',currency:cur,maximumFractionDigits:2,minimumFractionDigits:2}).format(v);
const f=n=>new Intl.NumberFormat('en-US',{maximumFractionDigits:2}).format(n);
function inputs(){const o={};fields.forEach(k=>o[k]=$(k).value);o.shipTax=$('shipTax').checked;return o}
function set(id,value){$(id).textContent=value}
const svg=(tag,attrs={},txt)=>{const n=document.createElementNS('http://www.w3.org/2000/svg',tag);Object.entries(attrs).forEach(([k,v])=>n.setAttribute(k,v));if(txt!==undefined)n.textContent=txt;return n};
function chart(o,r){
 const s=$('chart');s.replaceChildren();
 s.append(svg('title',{id:'chart-title'},'Net price, VAT and gross amount comparison at alternative VAT rates'));
 s.append(svg('desc',{id:'chart-desc'},'Illustrative net, VAT and gross price at five rates. Rate variations are scenarios, not official tax rates.'));
 const rates=[Math.max(0,r.rate-10),Math.max(0,r.rate-5),r.rate,Math.min(100,r.rate+5),Math.min(100,r.rate+10)];
 const bars=rates.map(rate=>compute({...o,rate, inputVat:0}));
 const max=Math.max(1,...bars.map(x=>x.gross));
 bars.forEach((x,i)=>{
 const y=22+i*43,width=420*x.gross/max,netW=420*x.net/max,taxW=Math.max(0,width-netW);
 s.append(svg('text',{x:5,y:y+15,fill:'#60718b','font-size':'12'},f(rates[i])+'%'));
 s.append(svg('rect',{x:67,y,width:netW,height:23,rx:3,fill:'#3277dc'}));
 s.append(svg('rect',{x:67+netW,y,width:taxW,height:23,fill:'#e1a557'}));
 s.append(svg('text',{x:Math.min(565,72+width),y:y+15,fill:'#29415e','font-size':'11'},f(x.gross)));
 });
 s.append(svg('rect',{x:70,y:242,width:10,height:10,fill:'#3277dc'}),svg('text',{x:85,y:251,fill:'#60718b','font-size':'12'},'Net'));
 s.append(svg('rect',{x:160,y:242,width:10,height:10,fill:'#e1a557'}),svg('text',{x:175,y:251,fill:'#60718b','font-size':'12'},'VAT'));
}
let latest=null;
function render(){
 try{
 const o=inputs();if(!curr.includes(o.currency))throw Error('Unsupported display currency');
 const r=compute(o);latest={o,r};set('error','');
 for(const [k,val] of Object.entries({net:r.net,tax:r.tax,gross:r.gross,payable:r.payable,input:r.inputVat,unit:r.unitGross,shippingResult:r.shippingTax,discountResult:r.discountValue})){set(k,money(o.currency,val))}
 set('fraction',f(r.vatFraction*100)+'% of gross');set('calculationMode',o.mode==='add'?'Add VAT to net price':'Extract VAT from gross price');
 set('formula',o.mode==='add'?'Gross = Net × (1 + VAT rate / 100)':'Net = Gross ÷ (1 + VAT rate / 100)');
 set('warning',r.payable<0?'Illustrative excess input VAT: refund eligibility is not assessed.':'Output VAT minus user-entered eligible input VAT. This is not a VAT return.');
 chart(o,r);
 }catch(e){latest=null;set('error',e.message);['net','tax','gross','payable','input','unit','shippingResult','discountResult','fraction','calculationMode','formula'].forEach(k=>set(k,'—'));$('chart').replaceChildren()}
}
function preset(){const p=presets[$('country').value];if(p){$('currency').value=p[0];$('rate').value=p[1]}render()}
function reset(){const d={mode:'add',country:'UK',currency:'GBP',amount:'100',rate:'20',qty:'1',discount:'0',shipping:'0',inputVat:'0',rounding:'invoice'};Object.entries(d).forEach(([k,v])=>$(k).value=v);$('shipTax').checked=false;render()}
function csv(){
 if(!latest)return;const {o,r}=latest;
 const rows=[['VAT calculation','Value'],['Mode',o.mode],['Country reference',o.country],['Reporting currency',o.currency],['Entered price',o.amount],['Rate %',r.rate],['Quantity',r.qty],['Discount %',o.discount],['Net amount',r.net],['Output VAT',r.tax],['Gross total',r.gross],['Eligible input VAT',r.inputVat],['Illustrative net VAT payable',r.payable],['Rounding',r.rounding],['Note','User must verify rates, exemptions, recovery rights and invoice rounding with tax authority']];
 const data=rows.map(row=>row.map(x=>'"'+String(x).replace(/"/g,'""')+'"').join(',')).join('\r\n');
 const url=URL.createObjectURL(new Blob(['\ufeff'+data],{type:'text/csv;charset=utf-8'})),a=document.createElement('a');a.href=url;a.download='vat-add-remove-calculation.csv';document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),1000)
}
function copy(){if(!latest)return;const {o,r}=latest;const s=['VAT Calculator',o.mode==='add'?'Add VAT':'Reverse VAT','Net '+money(o.currency,r.net),'VAT '+money(o.currency,r.tax),'Gross '+money(o.currency,r.gross),'Illustrative VAT payable '+money(o.currency,r.payable),'https://returnoninvestmentcalculator.in/vat-inclusive-exclusive-calculator/'].join('\n');if(navigator.clipboard?.writeText)navigator.clipboard.writeText(s).then(()=>set('error','Summary copied')).catch(()=>set('error','Clipboard access denied'));else set('error','Clipboard unavailable')}
$('country').addEventListener('change',preset);$('calc-form').addEventListener('input',render);$('calc-form').addEventListener('change',render);$('calc-form').addEventListener('submit',e=>{e.preventDefault();render()});$('reset').addEventListener('click',reset);$('copy').addEventListener('click',copy);$('csv').addEventListener('click',csv);$('print').addEventListener('click',()=>window.print());render();
})();