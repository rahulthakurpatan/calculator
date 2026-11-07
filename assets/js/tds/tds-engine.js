/* TDS calculation engine. Transparent estimates; no network calls. */
(function(){
'use strict';
const money=n=>Number.isFinite(n)?Math.max(0,n):0;
function applicable(item,v){
 const amount=money(v.amount), aggregate=money(v.aggregate), monthly=money(v.monthly), senior=v.senior==='yes';
 let threshold=item.threshold||0, applies=false, base=amount, explanation='';
 switch(item.thresholdType){
  case 'single-or-annual': applies=amount>item.threshold||aggregate>item.aggregateThreshold; explanation='Single-payment threshold ₹'+item.threshold.toLocaleString('en-IN')+' OR annual aggregate threshold ₹'+item.aggregateThreshold.toLocaleString('en-IN')+'.'; break;
  case 'monthly': applies=monthly>item.threshold; explanation='Monthly rent is compared with the ₹'+item.threshold.toLocaleString('en-IN')+' threshold.'; break;
  case 'property': applies=money(v.consideration)>=item.threshold||money(v.stampValue)>=item.threshold; base=Math.max(amount,money(v.stampValue)); explanation='Compare consideration and stamp-duty value with ₹50 lakh; TDS is generally based on the higher value.'; break;
  case 'goods': applies=aggregate>item.threshold; base=Math.max(0,amount); explanation='Buyer turnover condition and annual purchase threshold of ₹50 lakh must both be satisfied.'; break;
  case 'vda': threshold=v.specified==='yes'?50000:10000; applies=aggregate>threshold; explanation='Threshold is ₹'+threshold.toLocaleString('en-IN')+' based on specified-person status.'; break;
  case 'interest':
    threshold=v.bank==='yes'?(senior?100000:50000):10000;
    applies=aggregate>threshold; explanation='Selected interest threshold: ₹'+threshold.toLocaleString('en-IN')+'. Confirm payer type and senior-citizen eligibility.'; break;
  case 'single': applies=amount>=item.threshold; explanation='Single-transaction threshold ₹'+item.threshold.toLocaleString('en-IN')+'.'; break;
  case 'none': applies=true; explanation='No general monetary threshold in the selected table entry; check statutory no-deduction exceptions.'; break;
  case 'annual': applies=aggregate>item.threshold; explanation='Annual aggregate threshold ₹'+item.threshold.toLocaleString('en-IN')+'.'; break;
  default: applies=aggregate>threshold; explanation='Annual threshold ₹'+threshold.toLocaleString('en-IN')+'.';
 }
 return {applies,base,threshold,explanation};
}
function calculate(v,rules){
 const item=rules.items.find(x=>x.id===v.type);
 if(!item) throw new Error('Choose a valid payment type.');
 const amount=money(Number(v.amount)), aggregate=money(Number(v.aggregate)||amount);
 if(!amount) throw new Error('Enter a payment amount greater than zero.');
 const date=v.eventDate||'2026-11-07', old=date<='2026-03-31';
 const period=old?rules.periods.old:rules.periods.current;
 const result=applicable(item,{...v,amount,aggregate});
 let rate=item.rateType==='contractor'?(v.contractor==='individual'?1:2):item.rate;
 let warnings=[];
 if(item.id==='rent-building'&&v.payer==='individual') rate=item.individualRate;
 if(item.id==='contractor'&&v.payer==='individual') warnings.push('This contractor route is for a designated person. An individual/HUF payer not otherwise required to deduct may need the separate ₹50 lakh route (old Section 194M / new Section 393(1), Table 6(ii)).');
 if(['professional','technical','commission'].includes(item.id)&&v.payer==='individual') warnings.push('An individual/HUF payer may fall under the special Table 6(ii) route (old Section 194M) if not otherwise required to deduct. Confirm eligibility before using this standard payer route.');
 if(item.id==='rent-building'&&v.payer!=='individual') rate=item.rate;
 if(item.id==='professional'&&v.payer==='individual') warnings.push('For an individual/HUF not otherwise liable to deduct, the special ₹50 lakh route may apply; select the dedicated option where eligible.');
 if(item.id==='goods'&&v.turnover!=='yes'){result.applies=false;warnings.push('The buyer turnover condition (preceding-year turnover above ₹10 crore) is not selected, so this estimate does not trigger TDS under the goods-purchase rule.');}
 if(v.residency==='nonresident'){
   warnings.push('Non-resident payments generally require separate Section 393(2)/Section 195 analysis, nature-of-income classification, rates in force and possible DTAA relief. This resident-rate estimate must not be used as a final NRI deduction rate.');
   if(!(Number(v.customRate)>0)) throw new Error('For a non-resident payment, enter the indicative rate confirmed by your tax adviser. The calculator cannot independently determine Section 393(2), treaty relief or rates in force.');
 }
 if(v.pan==='no'&&item.panHigher){warnings.push('PAN not furnished: higher-rate provisions may override the standard rate. The 20% statutory higher-rate rule and its exceptions need transaction-specific verification; shown amount uses the standard rate only.');}
 if(v.certificate==='yes') warnings.push('A valid lower/nil deduction certificate may override the normal rate. Enter the certificate rate below if you want an indicative calculation.');
 if(v.residency==='nonresident'&&Number(v.customRate)>0) rate=Number(v.customRate);
 if(v.certificate==='yes'&&Number(v.certificateRate)>0) rate=Number(v.certificateRate);
 const taxableBase=result.applies?result.base:0;
 const tds=taxableBase*rate/100;
 if(item.id==='goods'&&result.applies){result.base=Math.min(amount,Math.max(0,aggregate-item.threshold));warnings.push('The ₹50 lakh threshold is aggregate-based. This output estimates the current payment portion above the threshold; reconcile prior purchases and TDS.');}
 if(item.id==='contractor'&&result.applies) warnings.push('The calculator tests the entered single payment and annual aggregate. If the annual threshold is crossed, review prior payments and deduct on the legally relevant amount.');
 const oldSection=v.residency==='nonresident'?'195 (non-resident payments)':item.oldSection;
 const newSection=v.residency==='nonresident'?(item.id==='property'?'Section 393(2), Table 17':'Section 393(2), relevant non-resident table'):item.newSection;
 return {item,period,old,oldSection,newSection,rate,amount,aggregate,applies:result.applies,threshold:result.threshold,thresholdExplanation:result.explanation,taxableBase,tds,net:amount-tds,warnings};
}
window.TDSEngine={calculate};
})();