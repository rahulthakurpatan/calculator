/* InvestCalc Loan Prepayment vs Investment — calculation engine
 * Currency is presentation-only. All monetary inputs must use one currency.
 * Monthly end-of-period cash-flow model; no external API or personal data.
 */
(() => {
  'use strict';
  const EPS = 1e-8;
  const finite = n => Number.isFinite(n) && !Number.isNaN(n);
  const clamp = (n, lo, hi) => Math.min(hi, Math.max(lo, n));

  function monthlyRate(annualPercent) {
    return Math.pow(1 + annualPercent / 100, 1 / 12) - 1;
  }
  function paymentFor(balance, annualPercent, months) {
    if (months <= 0 || balance <= 0) return 0;
    const r = monthlyRate(annualPercent);
    if (Math.abs(r) < EPS) return balance / months;
    const pow = Math.pow(1 + r, months);
    return balance * r * pow / (pow - 1);
  }
  function investmentNet(value, contributions, taxPercent) {
    const gain = Math.max(0, value - contributions);
    return value - gain * taxPercent / 100;
  }
  function simulate(input, annualInvestmentReturn) {
    const {
      balance, loanRate, termMonths, payment, lumpSum, extraMonthly,
      investmentFee, taxRate, horizonMonths
    } = input;
    const investRate = monthlyRate(annualInvestmentReturn);
    const feeMonthly = investmentFee / 100 / 12;
    const netMonthlyInvestmentRate = (1 + investRate) * (1 - feeMonthly) - 1;
    const standardPayment = payment;
    const months = horizonMonths;
    let prepayBalance = Math.max(0, balance - lumpSum);
    let investBalance = 0;
    let prepayInvest = 0;
    let investContributions = 0;
    let prepayContributions = 0;
    let prepayLoanPaidMonth = prepayBalance <= EPS ? 0 : null;
    let investLoanPaidMonth = null;
    let prepayInterest = 0;
    let investInterest = 0;
    let prepayPrincipal = Math.min(balance, lumpSum);
    let investLoanBalance = balance;
    let totalPrepayExtra = prepayPrincipal;
    let totalInvestExtra = 0;
    const rows = [];
    const grow = value => Math.max(0, value * (1 + netMonthlyInvestmentRate));
    const addContribution = (value, amount) => value + Math.max(0, amount);

    // If the initial lump sum exceeds the loan, the unused amount is invested.
    const excessLump = Math.max(0, lumpSum - balance);
    if (excessLump > 0) {
      prepayInvest = excessLump;
      prepayContributions += excessLump;
    }
    // In the invest strategy, the full lump sum is invested immediately.
    investBalance = lumpSum;
    investContributions = lumpSum;

    for (let month = 1; month <= months; month++) {
      // Prepayment path: regular payment, then extra principal. Once debt is
      // cleared, the same monthly cash budget is redirected to investments.
      if (prepayBalance > EPS) {
        const interest = prepayBalance * monthlyRate(loanRate);
        prepayInterest += interest;
        const due = Math.min(prepayBalance + interest, standardPayment);
        const principalPaid = Math.max(0, due - interest);
        prepayBalance = Math.max(0, prepayBalance - principalPaid);
        if (prepayBalance > EPS) {
          const extra = Math.min(prepayBalance, extraMonthly);
          prepayBalance -= extra;
          totalPrepayExtra += extra;
          prepayPrincipal += extra;
        } else {
          prepayLoanPaidMonth = month;
        }
        if (prepayBalance <= EPS) {
          prepayBalance = 0;
          if (prepayLoanPaidMonth === null) prepayLoanPaidMonth = month;
          // Unused regular payment + extra are invested from this month.
          const amount = Math.max(0, standardPayment - due) + extraMonthly;
          prepayInvest = grow(prepayInvest);
          prepayInvest = addContribution(prepayInvest, amount);
          prepayContributions += amount;
        } else {
          prepayInvest = grow(prepayInvest);
        }
      } else {
        prepayInvest = grow(prepayInvest);
        prepayInvest = addContribution(prepayInvest, standardPayment + extraMonthly);
        prepayContributions += standardPayment + extraMonthly;
      }

      // Invest path: scheduled loan payment continues; monthly surplus is
      // invested at month end.
      let investRedirectedPayment = 0;
      if (investLoanBalance > EPS) {
        const interest = investLoanBalance * monthlyRate(loanRate);
        investInterest += interest;
        const due = Math.min(investLoanBalance + interest, standardPayment);
        const principalPaid = Math.max(0, due - interest);
        investLoanBalance = Math.max(0, investLoanBalance - principalPaid);
        if (investLoanBalance <= EPS) {
          investLoanBalance = 0;
          investLoanPaidMonth = month;
          investRedirectedPayment = Math.max(0, standardPayment - due);
        }
      } else {
        investRedirectedPayment = standardPayment;
      }
      investBalance = grow(investBalance);
      const investContributionThisMonth = extraMonthly + investRedirectedPayment;
      investBalance = addContribution(investBalance, investContributionThisMonth);
      investContributions += investContributionThisMonth;

      if (month % 12 === 0 || month === months) {
        const prepayNet = investmentNet(prepayInvest, prepayContributions, taxRate) - prepayBalance;
        const investNet = investmentNet(investBalance, investContributions, taxRate) - investLoanBalance;
        rows.push({
          month,
          year: month / 12,
          prepayBalance,
          investLoanBalance,
          prepayInvest,
          investBalance,
          prepayNet,
          investNet,
          prepayInterest,
          investInterest
        });
      }
    }

    const prepayAfterTax = investmentNet(prepayInvest, prepayContributions, taxRate);
    const investAfterTax = investmentNet(investBalance, investContributions, taxRate);
    return {
      prepay: {
        loanBalance: prepayBalance,
        investmentValue: prepayAfterTax,
        grossInvestmentValue: prepayInvest,
        investmentContributions: prepayContributions,
        interestPaid: prepayInterest,
        principalPaid: prepayPrincipal,
        payoffMonth: prepayLoanPaidMonth,
        netWorth: prepayAfterTax - prepayBalance
      },
      invest: {
        loanBalance: investLoanBalance,
        investmentValue: investAfterTax,
        grossInvestmentValue: investBalance,
        investmentContributions: investContributions,
        interestPaid: investInterest,
        payoffMonth: investLoanPaidMonth,
        netWorth: investAfterTax - investLoanBalance
      },
      difference: (prepayAfterTax - prepayBalance) - (investAfterTax - investLoanBalance),
      rows
    };
  }

  function calculate(raw) {
    const balance = Number(raw.balance);
    const loanRate = Number(raw.loanRate);
    const years = Number(raw.years);
    const extraMonths = Number(raw.extraMonths || 0);
    const lumpSum = Number(raw.lumpSum || 0);
    const extraMonthly = Number(raw.extraMonthly || 0);
    const investmentReturn = Number(raw.investmentReturn);
    const investmentFee = Number(raw.investmentFee || 0);
    const taxRate = Number(raw.taxRate || 0);
    const horizonYears = Number(raw.horizonYears || years);
    const horizonMonths = Math.round(horizonYears * 12);
    const termMonths = Math.round(years * 12 + extraMonths);
    const paymentInput = raw.payment === '' || raw.payment == null ? null : Number(raw.payment);
    const errors = [];
    if (!finite(balance) || balance <= 0 || balance > 1e15) errors.push('Enter a loan balance greater than zero.');
    if (!finite(loanRate) || loanRate < 0 || loanRate > 100) errors.push('Enter a loan interest rate from 0% to 100%.');
    if (!finite(years) || years < 0 || years > 50 || termMonths <= 0) errors.push('Enter a loan term between 1 month and 50 years.');
    if (!finite(extraMonths) || extraMonths < 0 || extraMonths > 11) errors.push('Additional months must be between 0 and 11.');
    if (!finite(lumpSum) || lumpSum < 0 || lumpSum > 1e15) errors.push('Enter a valid lump-sum amount (zero or more).');
    if (!finite(extraMonthly) || extraMonthly < 0 || extraMonthly > 1e12) errors.push('Enter a valid extra monthly amount (zero or more).');
    if (!finite(investmentReturn) || investmentReturn < -99 || investmentReturn > 100) errors.push('Investment return must be between -99% and 100%.');
    if (!finite(investmentFee) || investmentFee < 0 || investmentFee > 20) errors.push('Investment fees must be between 0% and 20% per year.');
    if (!finite(taxRate) || taxRate < 0 || taxRate > 100) errors.push('Enter an effective investment-gain tax rate from 0% to 100%.');
    if (!finite(horizonYears) || horizonYears <= 0 || horizonYears > 50) errors.push('Comparison period must be greater than zero and no more than 50 years.');
    if (horizonMonths > 600) errors.push('Comparison period cannot exceed 600 months.');
    if (errors.length) return { errors };

    const payment = paymentInput === null ? paymentFor(balance, loanRate, termMonths) : paymentInput;
    if (!finite(payment) || payment <= 0 || payment > 1e15) return { errors: ['Enter a valid regular monthly loan payment.'] };
    const firstInterest = balance * monthlyRate(loanRate);
    if (payment <= firstInterest + EPS && balance > EPS) return { errors: ['The regular payment must be higher than the first month’s interest so the loan balance can reduce.'] };
    if (payment * termMonths < balance && loanRate === 0) return { errors: ['The entered payment is too low to repay this loan within the selected term.'] };

    const modelInput = { balance, loanRate, termMonths, payment, lumpSum, extraMonthly, investmentFee, taxRate, horizonMonths };
    const baseline = simulate(modelInput, investmentReturn);
    // Find the annual investment return at which both strategies have equal
    // after-tax net worth. If no sign change exists in the supported range,
    // report that a break-even rate is outside the model range.
    let low = -99, high = 100;
    let lowDiff = simulate(modelInput, low).difference;
    let highDiff = simulate(modelInput, high).difference;
    let breakEven = null;
    if (Math.abs(lowDiff) < 0.01) breakEven = low;
    else if (Math.abs(highDiff) < 0.01) breakEven = high;
    else if (lowDiff * highDiff < 0) {
      for (let i = 0; i < 55; i++) {
        const mid = (low + high) / 2;
        const diff = simulate(modelInput, mid).difference;
        if (Math.abs(diff) < 0.005) { low = high = mid; break; }
        if (diff * lowDiff > 0) { low = mid; lowDiff = diff; }
        else high = mid;
      }
      breakEven = (low + high) / 2;
    }
    return {
      errors: [],
      assumptions: { payment, termMonths, horizonMonths, investmentReturn, investmentFee, taxRate },
      result: baseline,
      breakEven
    };
  }

  window.InvestCalcLoanCompare = { calculate, paymentFor, simulate };
})();