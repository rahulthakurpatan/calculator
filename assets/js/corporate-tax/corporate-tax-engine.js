/* Transparent corporate tax estimate. Complex special-rate income and statutory book-profit adjustments are outside scope. */
(function(){
 "use strict";
 const n=v=>Math.max(0,Number(v)||0),money=v=>Math.round((v+Number.EPSILON)*100)/100;
 function surchargeRate(income,bands){for(const [limit,rate] of bands)if(income<=limit)return rate;return bands[bands.length-1][1];}
 function taxWithSurcharge(income,baseTax,bands,fixedRate,cess){
  const rate=fixedRate==null?surchargeRate(income,bands):fixedRate;
  let surcharge=baseTax*rate/100,relief=0;
  if(fixedRate==null){
   const crossed=bands.filter(x=>Number.isFinite(x[0])&&income>x[0]);
   for(const [limit] of crossed){
    const prevRate=surchargeRate(limit,bands);
    const prevBase=income>0?baseTax*limit/income:0;
    const ceiling=prevBase*(1+prevRate/100)+(income-limit);
    const current=baseTax+surcharge;
    relief=Math.max(relief,current-ceiling);
   }
   surcharge=Math.max(0,surcharge-relief);
  }
  const cessAmount=(baseTax+surcharge)*cess/100;
  return {baseTax:money(baseTax),surchargeRate:rate,surcharge:money(surcharge),surchargeRelief:money(relief),cess:money(cessAmount),total:money(baseTax+surcharge+cessAmount)};
 }
 function calculate(input,rules){
  const type=input.companyType,regime=input.regime,book=n(input.bookProfit),turnover=n(input.turnover),credit=n(input.matCredit);
  let profit=n(input.taxableIncome),base=0,rateLabel="",fixed=null,bands=null,matRate=0,matApplicable=false,matCreditEligible=false,rateBreakdown=[];
  if(type==="foreign"){
   if(regime!=="standard")throw new Error("Special domestic-company regimes are not available to foreign companies.");
   if(!profit)throw new Error("Enter taxable income greater than zero.");
   base=profit*rules.foreign.rate/100;rateLabel=rules.foreign.rate+"%";bands=rules.foreign.surcharge;matRate=rules.foreign.mat;matApplicable=input.foreignPE!=="no";
  }else{
   const d=rules.domestic;
   if(regime==="standard"){
    if(!profit)throw new Error("Enter taxable income greater than zero.");
    const rate=turnover<=d.standard.turnoverLimit?d.standard.rateLow:d.standard.rateHigh;
    base=profit*rate/100;rateLabel=rate+"%";bands=d.standard.surcharge;matRate=d.standard.mat;matApplicable=true;
   }else if(regime==="s199"){
    if(!profit)throw new Error("Enter taxable income greater than zero.");
    base=profit*d.s199.rate/100;rateLabel="25%";bands=d.s199.surcharge;matRate=d.s199.mat;matApplicable=true;
   }else if(regime==="s200"){
    if(!profit)throw new Error("Enter taxable income greater than zero.");
    base=profit*d.s200.rate/100;rateLabel="22%";fixed=d.s200.surcharge;matCreditEligible=true;
   }else if(regime==="s201"){
    const m=n(input.manufacturingIncome),o=n(input.otherIncome201);
    profit=m+o;
    if(profit<=0)throw new Error("Enter eligible manufacturing income or other income for Section 201.");
    base=m*d.s201.manufacturingRate/100+o*d.s201.otherRate/100;
    rateLabel="15% manufacturing + 22% specified other income";fixed=d.s201.surcharge;matCreditEligible=true;
    rateBreakdown=[{label:"Eligible manufacturing income × 15%",value:m*d.s201.manufacturingRate/100},{label:"Specified other income × 22%",value:o*d.s201.otherRate/100}];
   }else throw new Error("Choose a valid tax regime.");
  }
  const normal=taxWithSurcharge(profit,base,bands,fixed,rules.cess);
  let mat=null,selected=normal,matDifference=0;
  if(matApplicable&&book>0){
   const matBase=book*matRate/100;
   mat=taxWithSurcharge(profit,matBase,bands,fixed,rules.cess);
   if(mat.total>normal.total){selected=mat;matDifference=money(mat.total-normal.total);}
  }
  let matCreditUsed=0;
  if(matCreditEligible&&type==="domestic"&&credit>0&&rules.matCreditLimit>0){
   matCreditUsed=money(Math.min(credit,selected.total*rules.matCreditLimit));
   selected={...selected,total:money(Math.max(0,selected.total-matCreditUsed))};
  }
  return {companyType:type,regime,rateLabel,normal,mat,matRate,matApplicable,matDifference,selected,matCreditUsed,matCreditEligible,rateBreakdown,taxableIncome:profit,bookProfit:book,turnover,cessRate:rules.cess,act:rules.act,period:rules.period};
 }
 window.CorporateTaxEngine={calculate,money};
})();