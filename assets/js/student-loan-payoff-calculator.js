(() => {
'use strict';
const $ = id => document.getElementById(id);
const form=$('loan-form'), list=$('loan-list'), results=$('results');
const fmt = n => new Intl.NumberFormat(undefined,{style:'currency',currency:$('currency').value,maximumFractionDigits:0}).format(Number.isFinite(n)?n:0);
const num = (el, fallback=0) => {const v=Number(el.value);return Number.isFinite(v)?v:fallback;};
const payment=(p,apr,months)=>{const r=apr/1200;if(p<=0||months<=0)return 0;if(r===0)return p/months;const q=Math.pow(1+r,months);return p*r*q/(q-1);};
function addLoan(data={}) {
 const row=document.createElement('div');row.className='loan-row';row.dataset.loan='';
 row.innerHTML='<div class="field loan-name"><label>Loan name / type</label><input class="loan-label" maxlength="45"></div><div class="field"><label>Balance</label><input class="loan-balance" type="number" min="0.01" step="any" required></div><div class="field"><label>APR (%)</label><input class="loan-rate" type="number" min="0" max="100" step="any" required></div><div class="field"><label>Months left</label><input class="loan-term" type="number" min="1" max="600" step="1" required></div><div class="field"><label>Monthly payment</label><input class="loan-payment" type="number" min="0" step="any" placeholder="Auto"></div>';
 row.querySelector('.loan-label').value=data.label||'Student loan';
 row.querySelector('.loan-balance').value=data.balance??10000;
 row.querySelector('.loan-rate').value=data.rate??5;
 row.querySelector('.loan-term').value=data.term??120;
 row.querySelector('.loan-payment').value=data.payment??'';
 if(list.children.length>0){const b=document.createElement('button');b.type='button';b.className='btn ghost small remove-loan';b.textContent='Remove';b.setAttribute('aria-label','Remove this loan');b.addEventListener('click',()=>{if(list.children.length>1)row.remove();});row.appendChild(b);}
 list.appendChild(row);
}
$('add-loan').addEventListener('click',()=>{if(list.children.length>=10){showError('You can add up to 10 loans in this comparison.');return;}addLoan({label:'Student loan '+(list.children.length+1)});});
function showError(msg){const e=$('form-error');e.textContent=msg;e.classList.add('show');}
function hideError(){$('form-error').textContent='';$('form-error').classList.remove('show');}
function readLoans(){
 const rows=[...list.querySelectorAll('[data-loan]')];
 return rows.map((row,i)=>{
  const balance=Number(row.querySelector('.loan-balance').value),rate=Number(row.querySelector('.loan-rate').value),term=Number(row.querySelector('.loan-term').value),raw=row.querySelector('.loan-payment').value.trim();
  if(!Number.isFinite(balance)||balance<=0)throw Error('Enter a remaining balance greater than zero for loan '+(i+1)+'.');
  if(!Number.isFinite(rate)||rate<0||rate>100)throw Error('Enter a valid APR from 0% to 100% for loan '+(i+1)+'.');
  if(!Number.isInteger(term)||term<1||term>600)throw Error('Enter a remaining term from 1 to 600 whole months for loan '+(i+1)+'.');
  const minPay=payment(balance,rate,term),monthly=raw===''?minPay:Number(raw);
  if(!Number.isFinite(monthly)||monthly<=0)throw Error('Monthly payment for loan '+(i+1)+' must be greater than zero, or leave it blank for an estimate.');
  if(rate>0&&monthly<=balance*rate/1200)throw Error('Loan '+(i+1)+' payment does not cover its estimated monthly interest. Increase the payment or check the APR.');
  return {label:row.querySelector('.loan-label').value||('Loan '+(i+1)),balance,rate,term,monthly};
 });
}
function schedule(loans,extra=0,lump=0,lumpMonth=1){
 let balances=loans.map(x=>x.balance),interest=0,paid=0,rows=[],month=0, totalPayment=loans.reduce((s,x)=>s+x.monthly,0);
 const initial=balances.reduce((a,b)=>a+b,0);
 while(balances.some(b=>b>0.005)&&month<1200){
  month++;let monthInterest=0,monthPaid=0;
  balances=balances.map((b,i)=>{
   if(b<=0.005)return 0;
   const intr=b*loans[i].rate/1200;monthInterest+=intr;
   const due=Math.min(b+intr,loans[i].monthly);
   monthPaid+=due;return Math.max(0,b+intr-due);
  });
  let add=extra+(month===lumpMonth?lump:0);
  if(add>0){const total=balances.reduce((a,b)=>a+b,0);if(total>0){const applied=Math.min(add,total);balances=balances.map(b=>Math.max(0,b-applied*(b/total)));monthPaid+=applied;}}
  interest+=monthInterest;paid+=monthPaid;
  rows.push({month,balance:balances.reduce((a,b)=>a+b,0),interest:monthInterest,payment:monthPaid,cumulative:paid});
 }
 if(balances.some(b=>b>0.005))throw Error('The selected payment does not repay the loan within the 100-year calculation limit. Increase the monthly payment or review the inputs.');
 return {rows,months:month,interest,paid,initial,monthly:totalPayment};
}
function singleSchedule(principal,apr,term,extra=0,fees=0){
 const pmt=payment(principal,apr,term);let balance=principal,interest=0,paid=0,rows=[],month=0;
 while(balance>0.005&&month<1200){month++;const intr=balance*apr/1200;const base=Math.min(balance+intr,pmt);const over=Math.min(Math.max(0,balance+intr-base),extra);balance=Math.max(0,balance+intr-base-over);const mp=base+over;interest+=intr;paid+=mp;rows.push({month,balance,interest:intr,payment:mp,cumulative:paid});}
 if(balance>0.005)throw Error('Refinance payment could not repay the balance within the calculation limit.');
 return {rows,months:month,interest,paid,initial:principal,monthly:pmt,fees};
}
function breakEven(current,refi,fees){
 let cumulative=fees,limit=Math.max(current.rows.length,refi.rows.length);
 for(let i=0;i<limit;i++){cumulative+=(refi.rows[i]?.payment||0)-(current.rows[i]?.payment||0);if(cumulative<=0)return i+1;}
 return null;
}
function yearly(schedules){
 const max=Math.max(...schedules.map(s=>s.rows.length));let out='';
 for(let y=1;y<=Math.ceil(max/12);y++){const idx=Math.min(y*12,max)-1;const vals=schedules.map(s=>s.rows[idx]||{balance:0});const ints=schedules.map(s=>s.rows.slice((y-1)*12,y*12).reduce((a,r)=>a+r.interest,0));out+='<tr><td>'+y+'</td>'+vals.map(v=>'<td>'+fmt(v.balance)+'</td>').join('')+ints.map(v=>'<td>'+fmt(v)+'</td>').join('')+'</tr>';}
 return out;
}
function drawChart(schedules){
 const svg=$('balance-chart'),colors=['#2864e8','#078b78','#8b5cf6'],names=['Current','Extra payments','Refinance'],W=760,H=220,pad=35,max=Math.max(...schedules.map(s=>s.initial),1),months=Math.max(...schedules.map(s=>s.rows.length),1);
 let html='<line x1="'+pad+'" y1="'+(H-pad)+'" x2="'+(W-pad)+'" y2="'+(H-pad)+'" stroke="#dce4ef"/><line x1="'+pad+'" y1="15" x2="'+pad+'" y2="'+(H-pad)+'" stroke="#dce4ef"/>';
 schedules.forEach((s,i)=>{const pts=[];const steps=Math.min(80,Math.max(1,s.rows.length));for(let j=0;j<=steps;j++){const m=Math.round(j/steps*s.rows.length);const bal=m===0?s.initial:(s.rows[Math.max(0,m-1)]?.balance||0);const x=pad+(W-2*pad)*(m/months),y=H-pad-(H-2*pad)*(bal/max);pts.push(x.toFixed(1)+','+y.toFixed(1));}html+='<polyline fill="none" stroke="'+colors[i]+'" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" points="'+pts.join(' ')+'"/><text x="'+(pad+i*155)+'" y="14" fill="'+colors[i]+'" font-size="11" font-weight="700">'+names[i]+'</text>';});
 html+='<text x="'+pad+'" y="'+(H-8)+'" fill="#758096" font-size="10">Month 0</text><text x="'+(W-pad)+'" y="'+(H-8)+'" fill="#758096" font-size="10" text-anchor="end">'+months+' months</text>';
 svg.innerHTML=html;
}
function render(current,extra,refi,fees,loans){
 const cCost=current.paid,eCost=extra.paid,rCost=refi.paid+fees;
 const eSave=cCost-eCost,rSave=cCost-rCost,be=breakEven(current,refi,fees);
 $('saving-label').textContent=eSave>=rSave?'Estimated savings with extra payments':'Estimated net savings with refinancing';
 $('headline-saving').textContent=fmt(Math.max(eSave,rSave));
 $('headline-detail').textContent=eSave>=rSave?'Extra payments reduce estimated interest by '+fmt(current.interest-extra.interest)+' and finish '+Math.max(0,current.months-extra.months)+' months earlier.':'After fees, the refinance estimate costs '+fmt(Math.max(0,-rSave))+' more / saves '+fmt(rSave)+ ' versus the current schedule.';
 const time=m=>Math.floor(m/12)+' yr '+(m%12)+' mo';
 $('current-time').textContent=time(current.months);$('extra-time').textContent=time(extra.months);$('refi-time').textContent=time(refi.months);
 $('current-interest').textContent=fmt(current.interest);$('extra-interest').textContent=fmt(extra.interest);$('refi-interest').textContent=fmt(refi.interest);
 $('refi-savings').textContent=(rSave>=0?'+':'−')+fmt(Math.abs(rSave));$('refi-savings').className=rSave>=0?'positive':'negative';
 $('refi-payment').textContent=fmt(refi.monthly);$('break-even').textContent=be===null?'Not reached':time(be);
 const rows=[['Monthly scheduled payment',fmt(current.monthly),fmt(current.monthly+num($('extra-monthly'))),fmt(refi.monthly)],['Payoff time',time(current.months),time(extra.months),time(refi.months)],['Total interest',fmt(current.interest),fmt(extra.interest),fmt(refi.interest)],['Fees',fmt(0),fmt(0),fmt(fees)],['Total cost',fmt(cCost),fmt(eCost),fmt(rCost)],['Net savings vs current','—',(eSave>=0?'+':'−')+fmt(Math.abs(eSave)),(rSave>=0?'+':'−')+fmt(Math.abs(rSave))]];
 $('comparison-body').innerHTML=rows.map(r=>'<tr>'+r.map(x=>'<td>'+x+'</td>').join('')+'</tr>').join('');
 $('annual-body').innerHTML=yearly([current,extra,refi]);drawChart([current,extra,refi]);
 let warning='Refinance savings are estimated after the upfront fee. Compare the full cost and repayment term, not just the monthly payment.';
 const kind=$('loan-kind').value,country=$('country').value;
 if(kind==='federal'&&country==='US')warning+=' Federal-to-private refinancing can permanently remove federal income-driven repayment, forgiveness and other protections. Check Federal Student Aid before considering it.';
 if(kind==='canada-federal'&&country==='CA')warning+=' The federal portion of Canada Student Loans has a 0% interest rate under the federal interest elimination; confirm the rate and any provincial portion separately.';
 if(kind==='canada-provincial'&&country==='CA')warning+=' Provincial and territorial interest rules vary. Verify the rate and repayment-assistance options with your province or territory.';
 $('result-warning').textContent=warning;
 results.classList.add('show');
}
form.addEventListener('submit',ev=>{
 ev.preventDefault();hideError();
 try{
  const loans=readLoans(),extraMonthly=num($('extra-monthly')),lump=num($('lump-sum')),lumpMonth=num($('lump-month')),refiRate=num($('refi-rate')),refiTerm=num($('refi-term')),fees=num($('refi-fees')),refiExtra=num($('refi-extra'));
  for(const [el,label] of [['extra-monthly','Extra monthly payment'],['lump-sum','One-time extra payment'],['refi-fees','Refinance fees'],['refi-extra','Refinance extra payment']])if(num($(el))<0)throw Error(label+' cannot be negative.');
  if(!Number.isInteger(lumpMonth)||lumpMonth<1||lumpMonth>600)throw Error('Choose a one-time payment month from 1 to 600.');
  if(refiRate<0||refiRate>100||!Number.isFinite(refiRate))throw Error('Enter a refinance APR from 0% to 100%.');
  if(!Number.isInteger(refiTerm)||refiTerm<1||refiTerm>600)throw Error('Enter a refinance term from 1 to 600 whole months.');
  const current=schedule(loans),extra=schedule(loans,extraMonthly,lump,lumpMonth);
  const principal=loans.reduce((s,l)=>s+l.balance,0),refi=singleSchedule(principal,refiRate,refiTerm,refiExtra),totalFees=fees;
  render(current,extra,refi,totalFees,loans);
 }catch(e){showError(e.message||'Please check your loan details and try again.');}
});
$('country').addEventListener('change',()=>{if($('country').value==='CA'){$('currency').value='CAD';if($('loan-kind').value==='federal')$('loan-kind').value='canada-federal';}else{$('currency').value='USD';if($('loan-kind').value.startsWith('canada-'))$('loan-kind').value='private';}if(results.classList.contains('show'))form.requestSubmit();});
$('currency').addEventListener('change',()=>{if(results.classList.contains('show'))form.requestSubmit();});
$('reset-form').addEventListener('click',()=>{form.reset();list.innerHTML='';addLoan({label:'Student loan 1',balance:30000,rate:6.5,term:120});$('country').value='US';$('currency').value='USD';results.classList.remove('show');hideError();});
function csvCell(v){return '"'+String(v).replace(/"/g,'""')+'"';}
$('download-csv').addEventListener('click',()=>{
 if(!results.classList.contains('show'))return;
 try{
  const loans=readLoans(),c=schedule(loans),e=schedule(loans,num($('extra-monthly')),num($('lump-sum')),num($('lump-month'))),p=loans.reduce((s,l)=>s+l.balance,0),r=singleSchedule(p,num($('refi-rate')),num($('refi-term')),num($('refi-extra')));
  const lines=[['Month','Current balance','Current payment','Current interest','Extra-payment balance','Extra payment total','Extra-payment interest','Refinance balance','Refinance payment','Refinance interest']];
  const max=Math.max(c.rows.length,e.rows.length,r.rows.length);
  for(let i=0;i<max;i++){const a=c.rows[i]||{},b=e.rows[i]||{},d=r.rows[i]||{};lines.push([i+1,a.balance||0,a.payment||0,a.interest||0,b.balance||0,b.payment||0,b.interest||0,d.balance||0,d.payment||0,d.interest||0]);}
  const csv=lines.map(row=>row.map(csvCell).join(',')).join('\r\n'),blob=new Blob([csv],{type:'text/csv;charset=utf-8;'}),url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download='student-loan-amortization.csv';a.click();URL.revokeObjectURL(url);
 }catch(e){showError(e.message);}
});
$('print-report').addEventListener('click',()=>window.print());
})();
