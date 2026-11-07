(() => {
'use strict';
const $ = id => document.getElementById(id);
const ids = ['currency','income','hours-day','days-week','weeks-off','billable','buffer','expenses','tax','platform-fee','payment-fee','project-hours','revision','gst','current-rate'];
const num = id => Number($(id).value);
const currencyInfo = {
 INR:{locale:'en-IN',code:'INR'},USD:{locale:'en-US',code:'USD'},GBP:{locale:'en-GB',code:'GBP'},EUR:{locale:'de-DE',code:'EUR'},AED:{locale:'en-AE',code:'AED'}
};
let latest = null;
const money = value => {
 const info=currencyInfo[$('currency').value]||currencyInfo.INR;
 return new Intl.NumberFormat(info.locale,{style:'currency',currency:info.code,maximumFractionDigits:0}).format(Number.isFinite(value)?value:0);
};
const compact = value => {
 const info=currencyInfo[$('currency').value]||currencyInfo.INR;
 return new Intl.NumberFormat(info.locale,{maximumFractionDigits:1}).format(value);
};
const setText=(id,value)=>{$(id).textContent=value;};
function calculate(event){
 if(event) event.preventDefault();
 const error=$('calc-error');error.classList.remove('show');error.textContent='';
 const values=ids.reduce((o,id)=>(o[id]=num(id),o),{});
 const checks=[
  [values.income>0,'Enter a monthly take-home income greater than zero.'],
  [values['hours-day']>0&&values['hours-day']<=24,'Working hours per day must be between 0 and 24.'],
  [values['days-week']>0&&values['days-week']<=7,'Working days per week must be between 0 and 7.'],
  [values['weeks-off']>=0&&values['weeks-off']<52,'Weeks off must be at least 0 and less than 52.'],
  [values.billable>0&&values.billable<=100,'Billable share must be between 1% and 100%.'],
  [values.tax>=0&&values.tax<100,'Tax reserve must be between 0% and 99.9%.'],
  [values['platform-fee']>=0&&values['payment-fee']>=0&&values['platform-fee']+values['payment-fee']<100,'Combined platform and payment fees must be below 100%.'],
  [values.buffer>=0&&values.buffer<=100,'Safety buffer must be between 0% and 100%.'],
  [values.expenses>=0&&values['project-hours']>=0&&values.revision>=0,'Expenses, project hours and revision allowance cannot be negative.']
 ];
 const failed=checks.find(x=>!x[0]);
 if(failed){error.textContent=failed[1];error.classList.add('show');$('results').classList.remove('show');return;}
 const annualWorkHours=values['hours-day']*values['days-week']*(52-values['weeks-off']);
 const annualBillableHours=annualWorkHours*values.billable/100;
 if(annualBillableHours<=0){error.textContent='Your settings produce zero annual billable hours. Review your working schedule.';error.classList.add('show');return;}
 const annualTakehome=values.income*12;
 const taxReserve=values.tax/100;
 const fees=(values['platform-fee']+values['payment-fee'])/100;
 const annualExpenses=values.expenses*12;
 const preBuffer=(annualTakehome/(1-taxReserve))+annualExpenses;
 const bufferAmount=preBuffer*values.buffer/100;
 const requiredNet=preBuffer+bufferAmount;
 const grossBillings=requiredNet/(1-fees);
 const feeAmount=grossBillings*fees;
 const hourly=grossBillings/annualBillableHours;
 const weeklyBillable=values['hours-day']*values['days-week']*values.billable/100;
 const monthlyBillable=annualBillableHours/12;
 const taxAmount=(annualTakehome/(1-taxReserve))-annualTakehome;
 const daily=hourly*values['hours-day'];
 const weekly=hourly*weeklyBillable;
 const monthly=hourly*monthlyBillable;
 const projectHours=values['project-hours']*(1+values.revision/100);
 const project=hourly*projectHours;
 const gstAmount=project*values.gst/100;
 const invoice=project+gstAmount;
 const takehomeEstimate=((grossBillings-feeAmount)-annualExpenses-bufferAmount)* (1-taxReserve)/12;
 const minimum=hourly/(1+values.buffer/100);
 const premium=hourly*1.2;
 latest={currency:$('currency').value,hourly,daily,weekly,monthly,annualBillings:grossBillings,annualBillableHours,project,projectHours,gstAmount,invoice,takehomeEstimate,minimum,premium,annualTakehome,taxAmount,annualExpenses,bufferAmount,feeAmount,fees};
 setText('hourly-rate',money(hourly));
 setText('rate-note',compact(annualBillableHours)+' billable hours per year · '+compact(weeklyBillable)+' billable hours in a normal week');
 setText('daily-rate',money(daily));
 setText('weekly-rate',money(weekly));
 setText('monthly-rate',money(monthly));
 setText('annual-billings',money(grossBillings));
 setText('annual-hours',compact(annualBillableHours)+' hours');
 setText('takehome',money(takehomeEstimate));
 setText('minimum-rate',money(minimum)+'/hr');
 setText('recommended-rate',money(hourly)+'/hr');
 setText('premium-rate',money(premium)+'/hr');
 setText('project-price',money(project));
 setText('gst-amount',money(gstAmount));
 setText('invoice-total',money(invoice));
 setText('out-takehome',money(annualTakehome));
 setText('out-tax',money(taxAmount));
 setText('out-expenses',money(annualExpenses));
 setText('out-buffer',money(bufferAmount));
 setText('out-fees',money(feeAmount));
 setText('out-gross',money(grossBillings));
 const current=values['current-rate'];
 const comparison=$('comparison-note');
 if(current>0){
  const diff=(current/hourly-1)*100;
  comparison.textContent=diff>=0
   ? 'Your current rate ('+money(current)+'/hr) is '+compact(diff)+'% above the calculated sustainable baseline. Check whether your workload and client demand support it.'
   : 'Your current rate ('+money(current)+'/hr) is '+compact(Math.abs(diff))+'% below the calculated sustainable baseline. At this rate, your income goal may be difficult to reach with the billable hours entered.';
 }else comparison.textContent='Enter your current hourly rate to compare it with the calculated sustainable baseline.';
 $('results').classList.add('show');
}
$('freelance-form').addEventListener('submit',calculate);
$('reset-form').addEventListener('click',()=>{ $('freelance-form').reset();$('results').classList.remove('show');$('calc-error').classList.remove('show');latest=null; });
$('copy-result').addEventListener('click',async()=>{
 if(!latest)return;
 const textSummary=[
 'Freelance rate estimate',
 'Recommended hourly rate: '+money(latest.hourly),
 'Daily rate: '+money(latest.daily),
 'Weekly billable value: '+money(latest.weekly),
 'Monthly billable value: '+money(latest.monthly),
 'Annual client billings target: '+money(latest.annualBillings),
 'Annual billable hours: '+compact(latest.annualBillableHours),
 'Project price before GST: '+money(latest.project),
 'GST amount: '+money(latest.gstAmount),
 'Invoice total: '+money(latest.invoice),
 'Planning estimate only; not tax or income advice.'
 ].join('\n');
 const button=$('copy-result');
 try{await navigator.clipboard.writeText(textSummary);button.textContent='Copied!';}
 catch(e){button.textContent='Copy unavailable';}
 setTimeout(()=>{button.textContent='Copy rate summary';},1800);
});
$('print-result').addEventListener('click',()=>window.print());
$('currency').addEventListener('change',()=>{if(latest)calculate();});
})();
