/* Mortgage Refinance & Balance Transfer Calculator
 * Transparent monthly amortisation model. No lender API; fees and penalties are user inputs.
 * Canada supports the common nominal annual rate / semi-annual compounding convention.
 */
(() => {
  'use strict';
  const num = v => v === '' || v === null || v === undefined ? 0 : Number(v);
  const finite = v => Number.isFinite(v);
  function monthlyRate(annualPercent, convention) {
    const annual = annualPercent / 100;
    if (convention === 'canada-semi') return Math.pow(1 + annual / 2, 1 / 6) - 1;
    return annual / 12;
  }
  function payment(principal, rate, months) {
    if (months <= 0 || principal <= 0) return 0;
    if (rate === 0) return principal / months;
    const pow = Math.pow(1 + rate, months);
    return principal * rate * pow / (pow - 1);
  }
  function simulate(principal, rate, monthlyPayment, months) {
    let balance = principal, interest = 0, paid = 0;
    const rows = [{month:0,balance,interest:0,paid:0}];
    for (let month = 1; month <= months && balance > 0.005; month++) {
      const charge = balance * rate;
      interest += charge;
      let due = balance + charge;
      let pmt = Math.min(monthlyPayment, due);
      if (pmt <= 0) break;
      balance = Math.max(0, due - pmt);
      paid += pmt;
      rows.push({month,balance,interest,paid});
    }
    return {balance,interest,paid,rows,payoffMonth:balance <= 0.005 ? rows[rows.length-1].month : null};
  }
  function interpolateBalance(schedule, month) {
    if (month <= 0) return schedule.rows[0].balance;
    const row = schedule.rows.find(x => x.month === month);
    return row ? row.balance : schedule.balance;
  }
  function calculate(input) {
    const errors = [];
    const balance = num(input.balance), currentRate = num(input.currentRate), currentMonths = Math.round(num(input.currentMonths));
    const currentPaymentInput = num(input.currentPayment), newRate = num(input.newRate), newMonths = Math.round(num(input.newMonths));
    const horizon = Math.round(num(input.horizonMonths));
    const costs = ['exitFee','penalty','applicationFee','legalFee','valuationFee','otherFee','points'].reduce((s,k)=>s+num(input[k]),0);
    const credits = num(input.lenderCredit);
    const netCosts = Math.max(0,costs-credits);
    const feeInputs = ['exitFee','penalty','applicationFee','legalFee','valuationFee','otherFee','points','lenderCredit'];
    if (feeInputs.some(k => num(input[k]) < 0)) errors.push('Fees, penalties and lender credits cannot be negative.');
    const financed = input.feeTreatment === 'finance';
    const cashCosts = financed ? 0 : netCosts;
    const newPrincipal = balance + (financed ? netCosts : 0);
    const convention = input.country === 'CA' ? 'canada-semi' : 'monthly';
    if (!(balance > 0)) errors.push('Enter an outstanding mortgage balance greater than zero.');
    if (!(currentRate >= 0 && currentRate <= 100)) errors.push('Enter a valid current annual interest rate from 0% to 100%.');
    if (!(newRate >= 0 && newRate <= 100)) errors.push('Enter a valid new annual interest rate from 0% to 100%.');
    if (!(currentMonths >= 1 && currentMonths <= 600)) errors.push('Enter a remaining current loan term from 1 to 600 months.');
    if (!(newMonths >= 1 && newMonths <= 600)) errors.push('Enter a new loan term from 1 to 600 months.');
    if (!(horizon >= 1 && horizon <= 600)) errors.push('Enter a comparison period from 1 to 600 months.');
    if (Object.keys(input).some(k => ['balance','currentRate','currentMonths','currentPayment','newRate','newMonths','horizonMonths','exitFee','penalty','applicationFee','legalFee','valuationFee','otherFee','points','lenderCredit'].includes(k) && !finite(num(input[k])))) errors.push('Check the amounts and rates. Use numbers only.');
    if (errors.length) return {errors};
    const oldRate = monthlyRate(currentRate, convention), newPeriodicRate = monthlyRate(newRate, convention);
    const oldCalculatedPayment = payment(balance, oldRate, currentMonths);
    const oldPayment = currentPaymentInput > 0 ? currentPaymentInput : oldCalculatedPayment;
    if (oldPayment <= balance * oldRate) errors.push('The current payment must be higher than the monthly interest charge so the loan can amortise.');
    if (errors.length) return {errors};
    const newPayment = payment(newPrincipal, newPeriodicRate, newMonths);
    const old = simulate(balance, oldRate, oldPayment, Math.max(horizon, currentMonths));
    const fresh = simulate(newPrincipal, newPeriodicRate, newPayment, Math.max(horizon, newMonths));
    const oldAtHorizon = simulate(balance, oldRate, oldPayment, horizon);
    const newAtHorizon = simulate(newPrincipal, newPeriodicRate, newPayment, horizon);
    const oldBalance = oldAtHorizon.balance, newBalance = newAtHorizon.balance;
    const monthlySaving = oldPayment - newPayment;
    const simpleBreakEven = !financed && monthlySaving > 0 ? Math.ceil(netCosts / monthlySaving) : null;
    let economicBreakEven = netCosts === 0 ? 0 : null;
    const comparisonRows = [];
    let cumulativeOld = 0, cumulativeNew = cashCosts;
    const maxMonths = Math.min(600, Math.max(horizon, currentMonths, newMonths));
    const oldSched = simulate(balance, oldRate, oldPayment, maxMonths);
    const newSched = simulate(newPrincipal, newPeriodicRate, newPayment, maxMonths);
    let prevOldBal = balance, prevNewBal = newPrincipal;
    for (let m=0;m<=maxMonths;m++) {
      const o = oldSched.rows[m] || oldSched.rows[oldSched.rows.length-1];
      const n = newSched.rows[m] || newSched.rows[newSched.rows.length-1];
      if (m>0) {
        cumulativeOld += (o.paid - (oldSched.rows[m-1]?.paid ?? oldSched.paid));
        cumulativeNew += (n.paid - (newSched.rows[m-1]?.paid ?? newSched.paid));
      }
      const oldCost = cumulativeOld + o.balance;
      const newCost = cumulativeNew + n.balance;
      const benefit = oldCost - newCost;
      if (economicBreakEven === null && m>0 && benefit >= -0.005) economicBreakEven = m;
      if (m===0 || m%12===0 || m===horizon) comparisonRows.push({month:m,oldBalance:o.balance,newBalance:n.balance,oldPaid:cumulativeOld,newPaid:cumulativeNew,netBenefit:benefit});
    }
    const horizonOld = oldSched.rows[Math.min(horizon,oldSched.rows.length-1)] || oldSched.rows[oldSched.rows.length-1];
    const horizonNew = newSched.rows[Math.min(horizon,newSched.rows.length-1)] || newSched.rows[newSched.rows.length-1];
    const totalOldCost = horizonOld.paid + horizonOld.balance;
    const totalNewCost = cashCosts + horizonNew.paid + horizonNew.balance;
    const netBenefit = totalOldCost - totalNewCost;
    const chartRows = [];
    for(let m=0;m<=horizon;m++){
      const o=oldSched.rows[Math.min(m,oldSched.rows.length-1)] || oldSched.rows[oldSched.rows.length-1];
      const n=newSched.rows[Math.min(m,newSched.rows.length-1)] || newSched.rows[newSched.rows.length-1];
      chartRows.push({month:m,oldBalance:o.balance,newBalance:n.balance,oldTotalCost:o.paid+o.balance,newTotalCost:cashCosts+n.paid+n.balance,netBenefit:(o.paid+o.balance)-(cashCosts+n.paid+n.balance)});
    }
    return {errors:[], assumptions:{balance,currentRate,newRate,currentMonths,newMonths,horizonMonths:horizon,currentPayment:oldPayment,newPayment,monthlySaving,fees:costs,credits,netCosts,cashCosts,financed,convention,country:input.country}, results:{oldInterest:oldAtHorizon.interest,newInterest:newAtHorizon.interest,oldBalance,newBalance,monthlySaving,simpleBreakEven,economicBreakEven,netBenefit,totalOldCost,totalNewCost,oldPayoffMonth:old.payoffMonth,newPayoffMonth:fresh.payoffMonth}, rows:comparisonRows, chartRows};
  }
  window.MortgageRefinanceCalculator = {calculate, payment, monthlyRate, simulate};
})();