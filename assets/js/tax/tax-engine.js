/* Transparent individual income-tax calculation engine. No network calls. */
(function(){
  "use strict";
  const round10 = n => Math.round(Math.max(0,n)/10)*10;
  const slabTax = (income, slabs) => {
    let tax=0, lower=0;
    for (const [upper,rate] of slabs) {
      if (income>lower) tax += (Math.min(income,upper)-lower)*rate;
      if (income<=upper) break;
      lower=upper;
    }
    return tax;
  };
  const surchargeRate = (income, bands) => {
    for (const [limit,rate] of bands) if (income<=limit) return rate;
    return 0;
  };
  function computeTax(income, regime, rules, resident) {
    income=round10(income);
    const taxBeforeRebate = slabTax(income,regime.slabs);
    let rebate=0, marginalRelief87A=0;
    if (resident && income<=regime.rebateLimit) rebate=Math.min(regime.rebateMax,taxBeforeRebate);
    else if (resident && regime.rebateMax===60000 && income>regime.rebateLimit) {
      const excess=income-regime.rebateLimit;
      marginalRelief87A=Math.max(0,taxBeforeRebate-regime.rebateMax-excess);
      rebate=Math.min(regime.rebateMax,Math.max(0,taxBeforeRebate-marginalRelief87A));
    }
    const taxAfterRebate=Math.max(0,taxBeforeRebate-rebate);
    const sRate=Math.min(regime.surchargeCap,surchargeRate(income,rules.surcharge));
    let surcharge=taxAfterRebate*sRate, surchargeRelief=0;
    if (sRate>0) {
      const thresholds=[5000000,10000000,20000000,50000000].filter(x=>income>x);
      const threshold=thresholds[thresholds.length-1];
      if (threshold) {
        const prevRate=Math.min(regime.surchargeCap,surchargeRate(threshold,rules.surcharge));
        const prevBase=slabTax(threshold,regime.slabs);
        let prevRebate=resident&&threshold<=regime.rebateLimit?Math.min(regime.rebateMax,prevBase):0;
        const prevTax=Math.max(0,prevBase-prevRebate);
        const ceiling=prevTax*(1+prevRate)+(income-threshold);
        const actual=taxAfterRebate+surcharge;
        if(actual>ceiling){surchargeRelief=actual-ceiling;surcharge=Math.max(0,surcharge-surchargeRelief);}
      }
    }
    const cess=(taxAfterRebate+surcharge)*rules.cess;
    const total=round10(taxAfterRebate+surcharge+cess);
    return {taxableIncome:income,taxBeforeRebate,rebate,marginalRelief87A,surchargeRate:sRate,surcharge,surchargeRelief,cess,total};
  }
  function calculate(input, rules) {
    const age=Number(input.age)||30, resident=input.resident==="resident";
    const grossSalary=Math.max(0,Number(input.salary)||0);
    const basic=Math.max(0,Number(input.basic)||0), da=Math.max(0,Number(input.da)||0);
    const salaryForHra=basic+da;
    const hraReceived=Math.max(0,Number(input.hra)||0);
    const rent=Math.max(0,Number(input.rent)||0);
    const metro=input.metro==="yes";
    const hraExemption=Math.min(hraReceived,Math.max(0,rent-salaryForHra*.10),salaryForHra*(metro?.50:.40));
    const otherIncome=Number(input.otherIncome)||0;
    const houseIncome=Number(input.houseIncome)||0;
    const standardOld=Math.min(grossSalary,rules.oldRegime.standardDeduction);
    const standardNew=Math.min(grossSalary,rules.newRegime.standardDeduction);
    const c80c=Math.min(Math.max(0,Number(input.c80c)||0),150000);
    const c80d=Math.max(0,Number(input.c80d)||0);
    const npsSelf=Math.min(Math.max(0,Number(input.npsSelf)||0),50000);
    const homeInterest=Math.min(Math.max(0,Number(input.homeInterest)||0),200000);
    const otherDeductions=Math.max(0,Number(input.otherDeductions)||0);
    const employerNps=Math.max(0,Number(input.employerNps)||0);
    const oldDeductions=c80c+c80d+npsSelf+homeInterest+otherDeductions+employerNps;
    const newDeductions=employerNps;
    const oldHra=hraExemption;
    const oldTaxable=round10(Math.max(0,grossSalary-oldHra-standardOld+otherIncome+houseIncome-oldDeductions));
    const newTaxable=round10(Math.max(0,grossSalary-standardNew+otherIncome+houseIncome-newDeductions));
    const oldSlabs=age>=80?rules.oldRegime.slabs.superSenior:age>=60?rules.oldRegime.slabs.senior:rules.oldRegime.slabs.below60;
    const old=computeTax(oldTaxable,{...rules.oldRegime,slabs:oldSlabs},rules,resident);
    const newer=computeTax(newTaxable,rules.newRegime,rules,resident);
    return {
      old:{...old,standardDeduction:standardOld,hraExemption:oldHra,deductions:oldDeductions,slabTax:old.taxBeforeRebate},
      newer:{...newer,standardDeduction:standardNew,hraExemption:0,deductions:newDeductions,slabTax:newer.taxBeforeRebate},
      inputs:{grossSalary,otherIncome,houseIncome,age,resident}, recommended:old.total<=newer.total?"old":"new",
      savings:Math.abs(old.total-newer.total)
    };
  }
  window.IncomeTaxEngine={calculate,slabTax,round10};
})();