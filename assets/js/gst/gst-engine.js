/* Client-side GST calculation engine */
(() => {
'use strict';
const n=v=>{const x=Number(v);return Number.isFinite(x)&&x>=0?x:0;};
const round2=v=>Math.round((v+Number.EPSILON)*100)/100;
function calcLine(item,opts){
 const qty=n(item.qty),price=n(item.price),discount=Math.min(100,n(item.discount));
 const gross=qty*price,discountAmount=gross*discount/100,afterDiscount=gross-discountAmount;
 const rate=n(item.rate),cessRate=n(item.cessRate);
 const taxable=opts.inclusive?afterDiscount/(1+(rate+cessRate)/100):afterDiscount;
 const gst=taxable*rate/100,cess=taxable*cessRate/100;
 const total=opts.inclusive?afterDiscount:taxable+gst+cess;
 const roundedGst=round2(gst);
 const central=opts.supply==='intra'?round2(roundedGst/2):0;
 const state=opts.supply==='intra'?round2(roundedGst-central):0;
 const integrated=opts.supply==='inter'?gst:0;
 return {description:String(item.description||'Item'),qty,price,rate,cessRate,gross:round2(gross),discount:round2(discountAmount),taxable:round2(taxable),gst:round2(gst),cgst:round2(central),sgst:round2(state),utgst:opts.utgst?round2(state):0,igst:round2(integrated),cess:round2(cess),total:round2(total),discountPercent:discount};
}
function summarize(lines,opts){
 const totals=lines.reduce((a,x)=>{['gross','discount','taxable','gst','cgst','sgst','igst','cess','total'].forEach(k=>a[k]+=x[k]);return a;},{gross:0,discount:0,taxable:0,gst:0,cgst:0,sgst:0,igst:0,cess:0,total:0});
 Object.keys(totals).forEach(k=>totals[k]=round2(totals[k]));
 const rawTotal=totals.total;
 const finalTotal=opts.roundOff?Math.round(rawTotal):round2(rawTotal);
 return {...totals,rawTotal:round2(rawTotal),roundOff:round2(finalTotal-rawTotal),finalTotal:round2(finalTotal),lineCount:lines.length};
}
function quick(v){
 const amount=n(v.amount),rate=n(v.rate),cessRate=n(v.cessRate),inclusive=v.mode==='remove';
 const taxable=inclusive?amount/(1+(rate+cessRate)/100):amount;
 const gst=taxable*rate/100,cess=taxable*cessRate/100,total=inclusive?amount:taxable+gst+cess;
 const roundedGst=round2(gst),cgst=v.supply==='intra'?round2(roundedGst/2):0,sgst=v.supply==='intra'?round2(roundedGst-cgst):0,igst=v.supply==='inter'?roundedGst:0;
 const raw=total,final=v.roundOff?Math.round(raw):round2(raw);
 return {amount:round2(amount),taxable:round2(taxable),gst:round2(gst),cgst:round2(cgst),sgst:round2(sgst),utgst:v.utgst?round2(sgst):0,igst:round2(igst),cess:round2(cess),total:round2(total),rawTotal:round2(raw),roundOff:round2(final-raw),finalTotal:round2(final),rate,cessRate,mode:v.mode,supply:v.supply};
}
window.GST_ENGINE={quick,calcLine,summarize,round2};
})();