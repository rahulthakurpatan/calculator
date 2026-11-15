/* Margin vs markup calculator: gross margin is not net margin. No external API. */
(()=>{'use strict';
const $=id=>document.getElementById(id);
const defaults={currency:'USD',cost:'60',shipping:'5',fees:'3',price:'100',discount:'10',quantity:'100',target:'40',tax:'0'};
const C=['USD','EUR','GBP','INR','CAD','AUD','SGD','AED'];
function compute(v){
 const {cost,shipping,fees,price,discount,quantity,target,tax}=v;
 for(const k of ['cost','shipping','fees','price','discount','quantity','target','tax'])if(!Number.isFinite(v[k]))throw Error('Enter valid finite numbers.');
 if([cost,shipping,fees,price,quantity].some(x=>x<0)||cost+shipping+fees<=0||price<=0||quantity<=0||quantity>1e8)throw Error('Use positive selling price, quantity and total unit cost.');
 if(discount<0||discount>=100||target<0||target>=100||tax<0||tax>100)throw Error('Discount and target margin must be below 100%; tax must be between 0 and 100%.');
 const baseCost=cost+shipping+fees;
 const realizedPrice=price*(1-discount/100);
 const profit=realizedPrice-baseCost;
 const margin=profit/realizedPrice*100,markup=profit/baseCost*100;
 const grossRevenue=realizedPrice*quantity, totalCost=baseCost*quantity, totalProfit=profit*quantity;
 const targetNet=baseCost/(1-target/100);
 const targetList=targetNet/(1-discount/100);
 const targetMarkup=target/(100-target)*100;
 const breakEvenList=baseCost/(1-discount/100);
 const taxPerUnit=realizedPrice*tax/100,customerTotal=realizedPrice+taxPerUnit;
 const steps=[0,10,20,30,40,50].map(d=>{const p=price*(1-d/100);return{discount:d,price:p,profit:p-baseCost,margin:p>0?(p-baseCost)/p*100:null};});
 return{baseCost,realizedPrice,profit,margin,markup,grossRevenue,totalCost,totalProfit,targetNet,targetList,targetMarkup,breakEvenList,taxPerUnit,customerTotal,steps};
}
window.MarginMarkupMath={compute};
const money=(n,c)=>new Intl.NumberFormat('en-US',{style:'currency',currency:c,maximumFractionDigits:2}).format(n);
const num=n=>new Intl.NumberFormat('en-US',{maximumFractionDigits:2}).format(n);
function read(){const v={currency:$('currency').value};if(!C.includes(v.currency))throw Error('Unsupported currency');for(const k of Object.keys(defaults)){if(k==='currency')continue;const raw=$(k).value;if(raw.trim()==='')throw Error('Enter '+k+'.');v[k]=Number(raw);}return v;}
const NS='http://www.w3.org/2000/svg';
function svg(tag,attrs={},text){const e=document.createElementNS(NS,tag);Object.entries(attrs).forEach(([k,v])=>e.setAttribute(k,String(v)));if(text!==undefined)e.textContent=String(text);return e;}
function chart(v,r){
 const s=$('chart');s.replaceChildren();
 s.append(svg('title',{id:'chartTitle'},'Gross profit per unit by discount level'));
 s.append(svg('desc',{id:'chartDesc'},'Six discount scenarios with profit per unit, negative bars showing losses.'));
 const data=r.steps,min=Math.min(0,...data.map(p=>p.profit)),max=Math.max(0,...data.map(p=>p.profit)),lo=min-Math.max(1,(max-min)*.15),hi=max+Math.max(1,(max-min)*.15);
 const y=n=>24+(hi-n)/(hi-lo)*190,zero=y(0);
 s.append(svg('line',{x1:48,x2:625,y1:zero,y2:zero,stroke:'#93a7c3','stroke-width':2}));
 data.forEach((p,i)=>{const x=64+i*94,yp=y(p.profit);s.append(svg('rect',{x,y:Math.min(yp,zero),width:53,height:Math.max(1,Math.abs(yp-zero)),rx:4,fill:p.profit>=0?'#1769e0':'#df5873'}));
 s.append(svg('text',{x:x+26,y:239,'text-anchor':'middle','font-size':12,fill:'#667a95'},p.discount+'%'));
 s.append(svg('text',{x:x+26,y:Math.max(14,Math.min(217,p.profit>=0?yp-7:yp+15)),'text-anchor':'middle','font-size':11,fill:'#314b70'},num(p.profit)));});
}
let last=null;
function render(){try{const v=read(),r=compute(v);last={v,r};$('error').textContent='';
 const map={unitCost:money(r.baseCost,v.currency),realized:money(r.realizedPrice,v.currency),unitProfit:money(r.profit,v.currency),margin:num(r.margin)+'%',markup:num(r.markup)+'%',revenue:money(r.grossRevenue,v.currency),totalCost:money(r.totalCost,v.currency),totalProfit:money(r.totalProfit,v.currency),targetPrice:money(r.targetList,v.currency),targetNet:money(r.targetNet,v.currency),targetMarkup:num(r.targetMarkup)+'%',breakEven:money(r.breakEvenList,v.currency),taxAmount:money(r.taxPerUnit,v.currency),customerTotal:money(r.customerTotal,v.currency)};
 Object.entries(map).forEach(([k,val])=>$(k).textContent=val);
 $('interpretation').textContent=r.profit<0?'This price produces a gross loss before overhead.':r.profit===0?'This price covers direct unit costs, but not overhead.':'This price generates positive gross contribution before overhead and income tax.';
 chart(v,r);
 }catch(e){last=null;$('error').textContent=e.message;for(const k of ['unitCost','realized','unitProfit','margin','markup','revenue','totalCost','totalProfit','targetPrice','targetNet','targetMarkup','breakEven','taxAmount','customerTotal'])$(k).textContent='—';$('chart').replaceChildren();$('interpretation').textContent='Correct the inputs to calculate.';}}
$('calculator').addEventListener('input',render);$('calculator').addEventListener('change',render);
$('reset').addEventListener('click',()=>{Object.entries(defaults).forEach(([k,v])=>$(k).value=v);render();});
$('copy').addEventListener('click',()=>{if(!last)return;const {v,r}=last;const s=['Margin vs Markup Pricing','https://returnoninvestmentcalculator.in/margin-vs-markup-calculator/','Unit cost '+money(r.baseCost,v.currency),'Net price '+money(r.realizedPrice,v.currency),'Gross profit/unit '+money(r.profit,v.currency),'Gross margin '+num(r.margin)+'%','Markup '+num(r.markup)+'%','Target list price '+money(r.targetList,v.currency)].join('\n');if(navigator.clipboard?.writeText)navigator.clipboard.writeText(s).then(()=>$('message').textContent='Copied.').catch(()=>$('message').textContent='Clipboard unavailable.');else $('message').textContent='Clipboard unavailable.';});
$('csv').addEventListener('click',()=>{if(!last)return;const {v,r}=last;const lines=[['Metric','Value'],['Currency',v.currency],['Unit direct cost',r.baseCost],['Net selling price',r.realizedPrice],['Gross profit per unit',r.profit],['Gross margin percent',r.margin],['Markup percent',r.markup],['Quantity',v.quantity],['Total gross profit',r.totalProfit],['Target list price',r.targetList],['Break-even list price',r.breakEvenList],['Tax per unit',r.taxPerUnit]].map(a=>a.map(x=>'"'+String(x).replace(/"/g,'""')+'"').join(',')).join('\r\n');const url=URL.createObjectURL(new Blob(['\ufeff'+lines],{type:'text/csv;charset=utf-8'}));const a=document.createElement('a');a.href=url;a.download='margin-vs-markup.csv';document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),1000);});
$('print').addEventListener('click',()=>window.print());
render();
})();