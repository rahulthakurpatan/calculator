(() => {
"use strict";
const $=id=>document.getElementById(id);
const settings={
 US:{currency:"USD",locale:"en-US",shortRate:24,longRate:15},
 CA:{currency:"CAD",locale:"en-CA",shortRate:35,longRate:35},
 UK:{currency:"GBP",locale:"en-GB",shortRate:24,longRate:24},
 AU:{currency:"AUD",locale:"en-AU",shortRate:35,longRate:35},
 IN:{currency:"INR",locale:"en-IN",shortRate:30,longRate:30}
};
const samples=[
 {symbol:"BTC",quantity:0.2,basis:60000,price:50000,acquired:"2024-03-01",selected:true},
 {symbol:"ETH",quantity:2,basis:3500,price:2400,acquired:"2026-02-01",selected:true},
 {symbol:"SOL",quantity:20,basis:150,price:120,acquired:"2026-06-01",selected:true}
];
const defaults={
 country:"US",filing:"other",shortGain:12000,longGain:4000,carryShort:0,carryLong:0,
 shortRate:24,longRate:15,ordinaryAvailable:50000,allowance:3000,inclusion:50,discount:50,
 saleDate:"2026-11-16",sellFee:0.2,buyFee:0.2,slippage:0.1,fixedFee:2,reacquire:"no",
 securityLike:false,washAU:false
};
const financial=["shortGain","longGain","carryShort","carryLong","shortRate","longRate","ordinaryAvailable","allowance","inclusion","discount","sellFee","buyFee","slippage","fixedFee"];
let rows=samples.map(x=>({...x})),last=null;
function money(v){const c=settings[$("country").value];return new Intl.NumberFormat(c.locale,{style:"currency",currency:c.currency,minimumFractionDigits:2,maximumFractionDigits:2}).format(v)}
function esc(s){return String(s).replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]))}
function dateUTC(s){if(!/^\d{4}-\d{2}-\d{2}$/.test(s))return NaN;const x=Date.parse(s+"T00:00:00Z");return Number.isFinite(x)&&new Date(x).toISOString().slice(0,10)===s?x:NaN}
function lotLong(acquired,sale){const a=new Date(dateUTC(acquired));a.setUTCFullYear(a.getUTCFullYear()+1);return dateUTC(sale)>a.getTime()}
function lotMarkup(r,i){
 return '<section class="lot" data-index="'+i+'"><div class="lot-head"><label class="check"><input class="lot-selected" type="checkbox"'+(r.selected?' checked':'')+'> Harvest this lot</label><button type="button" class="remove" data-remove="'+i+'">Remove</button></div>'+
 '<div class="lot-grid"><label>Token name<input class="lot-symbol" maxlength="24" value="'+esc(r.symbol)+'"></label>'+
 '<label>Quantity<input class="lot-quantity" type="number" min="0.00000001" step="any" value="'+r.quantity+'"></label>'+
 '<label>Adjusted cost / token<input class="lot-basis" type="number" min="0" step="any" value="'+r.basis+'"></label>'+
 '<label>Sale price / token<input class="lot-price" type="number" min="0" step="any" value="'+r.price+'"></label>'+
 '<label>Acquired on<input class="lot-acquired" type="date" value="'+esc(r.acquired)+'"></label></div><small id="lot-result-'+i+'" class="lot-result"></small></section>'
}
function buildRows(){ $("lots").innerHTML=rows.map(lotMarkup).join("") }
function readRows(){return [...$("lots").querySelectorAll(".lot")].map(e=>{
 const find=k=>e.querySelector(".lot-"+k);
 const moneyfield=k=>({value:find(k).value,num:Number(find(k).value)});
 return {symbol:find("symbol").value.trim(),quantity:moneyfield("quantity").num,basis:moneyfield("basis").num,price:moneyfield("price").num,acquired:find("acquired").value,selected:find("selected").checked,
 invalid:["quantity","basis","price"].some(k=>moneyfield(k).value.trim()===""||!Number.isFinite(moneyfield(k).num))}
 })}
function modelInputs(){
 const v={};for(const k of financial){const s=$(k).value.trim(),num=Number(s);if(!s||!Number.isFinite(num)||num<-1e12||num>1e12)return{error:"Enter a valid numeric value for "+k+"."};v[k]=num}
 const percentages=["shortRate","longRate","inclusion","discount","sellFee","buyFee","slippage"];
 if(percentages.some(k=>v[k]<0||v[k]>100)||["carryShort","carryLong","ordinaryAvailable","allowance","fixedFee"].some(k=>v[k]<0))return{error:"Rates must be between 0 and 100%; losses carried forward and fees cannot be negative."};
 const date=$("saleDate").value,sale=dateUTC(date);if(!Number.isFinite(sale))return{error:"Enter a valid proposed sale date."};
 const lots=readRows();if(!lots.length)return{error:"Add at least one crypto position."};
 for(const row of lots){
  const acq=dateUTC(row.acquired);
  if(row.invalid||!row.symbol||row.quantity<=0||row.quantity>1e10||row.basis<0||row.price<0||row.basis>1e12||row.price>1e12||!Number.isFinite(acq)||acq>sale)return{error:"Each position needs a token name, positive quantity, nonnegative cost/price and a valid acquisition date on or before the sale."};
 }
 return{v:{...v,country:$("country").value,filing:$("filing").value,saleDate:date,reacquire:$("reacquire").value,securityLike:$("securityLike").checked,washAU:$("washAU").checked},lots};
}
function usTax(st,lt,v){
 if(st>0&&lt<0){const offset=Math.min(st,-lt);st-=offset;lt+=offset}
 else if(lt>0&&st<0){const offset=Math.min(lt,-st);lt-=offset;st+=offset}
 const capitalTax=Math.max(0,st)*v.shortRate/100+Math.max(0,lt)*v.longRate/100;
 const loss=Math.max(0,-st-lt),limit=v.filing==="mfs"?1500:3000,deduct=Math.min(loss,limit,v.ordinaryAvailable);
 return{tax:capitalTax-deduct*v.shortRate/100,carry:Math.max(0,loss-deduct),deduct,taxable:Math.max(0,st)+Math.max(0,lt)};
}
function otherTax(st,lt,v){
 const carried=v.carryShort+v.carryLong,net=st+lt-carried;
 if(v.country==="CA"){return{tax:Math.max(0,net)*v.inclusion/100*v.shortRate/100,carry:Math.max(0,-net),taxable:Math.max(0,net),deduct:0}}
 if(v.country==="UK"){return{tax:Math.max(0,net-v.allowance)*v.longRate/100,carry:Math.max(0,-net),taxable:Math.max(0,net-v.allowance),deduct:0}}
 if(v.country==="AU"){
   let shortPositive=Math.max(0,st),longPositive=Math.max(0,lt),loss=Math.max(0,-st)+Math.max(0,-lt)+carried;
   const usedShort=Math.min(loss,shortPositive);shortPositive-=usedShort;loss-=usedShort;
   const usedLong=Math.min(loss,longPositive);longPositive-=usedLong;loss-=usedLong;
   const taxable=shortPositive+longPositive*(1-v.discount/100);
   return{tax:taxable*v.shortRate/100,carry:loss,taxable,deduct:0};
 }
 return{tax:Math.max(0,st+lt)*0.30,carry:0,taxable:Math.max(0,st+lt),deduct:0};
}
function calculate(){
 const data=modelInputs();if(data.error)return data;
 const {v,lots}=data;
 let harvestShort=0,harvestLong=0,totalLoss=0,transactionCosts=0,ignored=0;
 const details=lots.map(row=>{
  const gross=row.quantity*row.price,slip=gross*v.slippage/100,saleFee=(gross-slip)*v.sellFee/100+v.fixedFee;
  const netSale=gross-slip-saleFee,cost=row.quantity*row.basis,loss=Math.max(0,cost-netSale),long=lotLong(row.acquired,v.saleDate),eligible=row.selected&&loss>0;
  if(row.selected&&!eligible)ignored++;
  if(eligible){totalLoss+=loss;transactionCosts+=slip+saleFee+gross*v.buyFee/100;if(long)harvestLong+=loss;else harvestShort+=loss;}
  return{...row,gross,netSale,cost,loss,long,eligible}
 });
 const baseShort=v.shortGain-(v.country==="US"?v.carryShort:0);
 const baseLong=v.longGain-(v.country==="US"?v.carryLong:0);
 const tax=(st,lt)=>v.country==="US"?usTax(st,lt,v):otherTax(st,lt,v);
 const before=tax(baseShort,baseLong);
 let review="";
 if(v.country==="IN")review="India: standard VDA transfer losses cannot offset gains or be carried forward.";
 else if(v.country==="US"&&v.securityLike)review="US security/tokenized-stock treatment may invoke wash-sale restrictions; consult a tax expert.";
 else if(v.country==="CA"&&v.reacquire!=="no")review="Canada: the superficial-loss acquisition and holding tests need transaction-level verification.";
 else if(v.country==="UK"&&v.reacquire!=="no")review="UK: same-day / 30-day matching requires a correct pooled and matched tax basis.";
 else if(v.country==="AU"&&v.washAU)review="Australia: potential wash-sale arrangement requires professional tax review.";
 const blocked=v.country!=="IN"&&Boolean(review);
 const modeledLoss=v.country==="IN"||blocked?0:totalLoss;
 const after=v.country==="IN"?before:v.country==="US"?tax(baseShort-harvestShort,baseLong-harvestLong):tax(baseShort-modeledLoss,baseLong);
 const savings=v.country==="IN"?0:blocked?null:Math.max(0,before.tax-after.tax);
 return{v,details,before,after,harvestShort,harvestLong,totalLoss,transactionCosts,ignored,review,modeledLoss,savings,blocked,net:savings===null?null:savings-transactionCosts};
}
function chart(values,labels,colors,aria){
 const max=Math.max(1,...values.map(n=>Math.abs(n))),height=values.length*48+12;
 let out='<svg viewBox="0 0 610 '+height+'" role="img" aria-label="'+esc(aria)+'" xmlns="http://www.w3.org/2000/svg">';
 values.forEach((n,i)=>{const y=8+i*48,w=360*Math.abs(n)/max;
 out+='<text x="4" y="'+(y+16)+'" font-size="12" fill="#506078">'+esc(labels[i].slice(0,14))+'</text><rect x="126" y="'+y+'" width="360" height="23" rx="5" fill="#eef3fa"/><rect x="126" y="'+y+'" width="'+w.toFixed(2)+'" height="23" rx="5" fill="'+colors[i%colors.length]+'"/><text x="605" y="'+(y+16)+'" font-size="11.5" text-anchor="end" fill="#253b58">'+esc(money(n))+'</text>'});
 return out+"</svg>";
}
function tableRow(k,v){return "<tr><td>"+esc(k)+"</td><td>"+esc(v)+"</td></tr>"}
function fail(msg){
 last=null;$("error").textContent=msg;$("error").classList.add("show");
 ["saving","loss","net","before","after","fees","carry"].forEach(id=>$(id).textContent="—");
 ["taxChart","lotChart","breakdown"].forEach(id=>$(id).innerHTML="");
 $("alert").textContent="Fix the input problem to restore the estimate.";
}
function render(){
 const m=calculate();if(m.error){fail(m.error);return}last=m;$("error").classList.remove("show");
 $("hero").classList.toggle("attention",m.blocked||m.v.country==="IN"||m.net<0);
 $("saving").textContent=m.blocked?"Review required":money(m.savings);
 $("heroText").textContent=m.blocked?"No reliable tax-saving figure until matching or eligibility is reviewed.":m.v.country==="IN"?"VDA loss offset restriction: no modeled harvesting tax reduction.":"An estimate of this year's tax effect, not guaranteed permanent savings.";
 $("loss").textContent=money(m.totalLoss);$("net").textContent=m.blocked?"Not estimated":money(m.net);
 $("before").textContent=money(m.before.tax);$("after").textContent=m.blocked?"Not verified":money(m.after.tax);
 $("fees").textContent=money(m.transactionCosts);$("carry").textContent=m.blocked?"Not verified":m.v.country==="IN"?"Not permitted":money(m.after.carry);
 const notes=[];if(m.review)notes.push(m.review);if(m.ignored)notes.push(m.ignored+" selected positions had no loss and were excluded.");
 if(m.v.country==="US")notes.push("US: simplified federal short/long-term netting and ordinary loss deduction. State taxes and full Schedule D carryover worksheet are not modeled.");
 if(m.v.country==="CA")notes.push("Canada: taxable inclusion and tax rate are editable; superficial-loss analysis requires full transaction records.");
 if(m.v.country==="UK")notes.push("UK: use verified pooled/matched cost basis; this model cannot reconstruct same-day or 30-day purchases.");
 if(m.v.country==="AU")notes.push("Australia: losses apply to undiscounted gains first; discount eligibility must be checked.");
 notes.push("Future cost basis, sale/repurchase fees and taxes may change the eventual economic outcome.");
 $("alert").textContent=notes.join(" ");
 $("taxChart").innerHTML=m.blocked?'<p class="fine">Matching or eligibility review required before tax comparison.</p>':chart([m.before.tax,m.after.tax],["Before","After"],["#3568a4","#079572"],"Estimated tax impact before and after loss harvesting");
 const losing=m.details.filter(x=>x.eligible);$("lotChart").innerHTML=losing.length?chart(losing.map(x=>x.loss),losing.map(x=>x.symbol),["#087b65","#4f82c1","#ad79bb","#d79d64"],"Estimated tax losses by selected crypto position"):'<p class="fine">No loss-making positions selected.</p>';
 $("breakdown").innerHTML=tableRow("Existing short-term net gain/loss",money(m.v.shortGain))+tableRow("Existing long-term net gain/loss",money(m.v.longGain))+tableRow("Harvest short-term losses",money(m.harvestShort))+tableRow("Harvest long-term losses",money(m.harvestLong))+tableRow("Loss usable in modeled offset",m.blocked?"Review required":money(m.modeledLoss))+tableRow("Tax before",money(m.before.tax))+tableRow("Tax after",m.blocked?"Not estimated":money(m.after.tax))+tableRow("Tax reduction",m.blocked?"Not estimated":money(m.savings))+tableRow("Trade cost",money(m.transactionCosts))+tableRow("Net immediate estimate",m.blocked?"Not estimated":money(m.net));
 m.details.forEach((r,i)=>{const e=$("lot-result-"+i);if(e){e.textContent=(r.eligible?"Potential realized loss: ":"Lot P/L (not selected for harvesting): ")+money(r.cost-r.netSale)+(r.eligible?(r.long?" · Long-term":" · Short-term"):"");e.className="lot-result "+(r.eligible?"positive":"")}});
}
function reset(){
 for(const [k,v] of Object.entries(defaults)){const e=$(k);if(typeof v==="boolean")e.checked=v;else e.value=v}
 rows=samples.map(r=>({...r}));buildRows();$("message").textContent="";render();
}
function pullRows(){rows=readRows().map(({invalid,...r})=>r)}
function report(m){return [
 "Crypto Tax-Loss Harvesting Calculator","Jurisdiction: "+m.v.country,"Selected potential capital loss: "+money(m.totalLoss),
 "Tax impact before: "+money(m.before.tax),"Tax impact after: "+(m.blocked?"Needs review":money(m.after.tax)),
 "Current-year tax reduction: "+(m.blocked?"Needs review":money(m.savings)),"Transaction costs: "+money(m.transactionCosts),
 "Net immediate economic benefit estimate: "+(m.blocked?"Needs review":money(m.net)),
 "Unused modeled loss: "+(m.blocked?"Needs review":money(m.after.carry)),
 "Review: "+(m.review||"Verify eligibility and tax returns"),"Educational estimate only, not tax advice"
].join("\n")}
$("lots").addEventListener("input",render);$("lots").addEventListener("change",render);
$("lots").addEventListener("click",e=>{const b=e.target.closest("button[data-remove]");if(!b)return;pullRows();rows.splice(Number(b.dataset.remove),1);buildRows();render()});
$("addLot").addEventListener("click",()=>{pullRows();rows.push({symbol:"NEW",quantity:1,basis:1000,price:800,acquired:"2026-03-01",selected:true});buildRows();render()});
document.querySelectorAll("#calc-inputs input,#calc-inputs select").forEach(e=>{e.addEventListener("input",render);e.addEventListener("change",render)});
$("country").addEventListener("change",()=>{const s=settings[$("country").value];$("shortRate").value=s.shortRate;$("longRate").value=s.longRate;render()});
$("reset").addEventListener("click",reset);
$("sample").addEventListener("click",()=>{reset();$("country").value="CA";$("shortRate").value=35;$("longRate").value=35;$("shortGain").value=15000;render();$("message").textContent="Canadian sample loaded. Confirm capital-account eligibility and loss matching."});
$("copy").addEventListener("click",async()=>{if(!last)return;try{await navigator.clipboard.writeText(report(last));$("message").textContent="Analysis copied."}catch(e){$("message").textContent="Clipboard unavailable; use print report."}});
$("download").addEventListener("click",()=>{const m=last;if(!m)return;const lines=[["Token","Quantity","Cost per unit","Sale price","Adjusted basis","Net sale proceeds","Potential loss","Harvest","Holding period"]];
 m.details.forEach(r=>lines.push([r.symbol,r.quantity,r.basis,r.price,r.cost,r.netSale,r.loss,r.eligible?"Yes":"No",r.long?"Long":"Short"]));
 lines.push(["Tax reduction",m.blocked?"Review required":m.savings],["Net estimate",m.blocked?"Review required":m.net]);
 const csv=lines.map(line=>line.map(v=>'"'+String(v).replace(/"/g,'""')+'"').join(",")).join("\r\n");
 const blob=new Blob(["\ufeff"+csv],{type:"text/csv;charset=utf-8"}),url=URL.createObjectURL(blob),a=document.createElement("a");a.href=url;a.download="crypto-tax-loss-harvesting.csv";document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),500);$("message").textContent="CSV report exported."});
$("print").addEventListener("click",()=>window.print());
reset();
window.__cryptoHarvestMath={usTax,otherTax,calculate,dateUTC,lotLong}; // Pure computation helpers for validation.
})();