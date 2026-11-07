(function(){
'use strict';
const $=id=>document.getElementById(id), fmt=n=>'₹'+Math.round(n).toLocaleString('en-IN'), pct=n=>Number(n).toFixed(2)+'%';
const rules=window.TDS_RULES, engine=window.TDSEngine;
const select=$('paymentType'), form=$('tds-form');
function fillSelect(){
 const groups={};rules.items.forEach(i=>(groups[i.group]??=[]).push(i));
 select.innerHTML=Object.entries(groups).map(([g,items])=>'<optgroup label="'+g+'">'+items.map(i=>'<option value="'+i.id+'">'+i.name+'</option>').join('')+'</optgroup>').join('');
}
function showResult(r){
 $('tds-result').classList.add('show');$('tds-error').classList.remove('show');
 $('tds-amount').textContent=fmt(r.tds);$('net-amount').textContent=fmt(r.net);$('rate-value').textContent=pct(r.rate);
 $('threshold-status').textContent=r.applies?'TDS applicable':'No TDS triggered on entered threshold details';
 $('threshold-status').className='status '+(r.applies?'yes':'no');
 $('result-meta').textContent=r.period.label+' · '+(r.old?r.oldSection:r.newSection);
 $('tax-base').textContent=fmt(r.taxableBase);$('gross-value').textContent=fmt(r.amount);
 $('threshold-note').textContent=r.thresholdExplanation;
 $('warning-list').innerHTML=r.warnings.map(w=>'<li>'+w+'</li>').join('');
 $('result-breakdown').innerHTML='<tr><td>Gross payment</td><td>'+fmt(r.amount)+'</td></tr><tr><td>Applicable TDS base</td><td>'+fmt(r.taxableBase)+'</td></tr><tr><td>Rate used</td><td>'+pct(r.rate)+'</td></tr><tr><td>Estimated TDS</td><td>'+fmt(r.tds)+'</td></tr><tr><td>Net payment</td><td>'+fmt(r.net)+'</td></tr>';
}
function run(e){if(e)e.preventDefault();try{
 const v={};['paymentType','amount','aggregate','monthly','eventDate','residency','payer','pan','contractor','senior','bank','specified','turnover','consideration','stampValue','certificate','certificateRate','customRate'].forEach(id=>v[id]=$(id)?.value||'');
 const r=engine.calculate(v,rules);showResult(r);
 }catch(err){$('tds-error').textContent=err.message;$('tds-error').classList.add('show');$('tds-result').classList.remove('show');}}
fillSelect();form.addEventListener('submit',run);
$('paymentType').addEventListener('change',()=>{const id=select.value;const isRent=id.startsWith('rent-');$('monthly-wrap').hidden=!isRent;$('property-wrap').hidden=id!=='property';$('property-stamp-wrap').hidden=id!=='property';$('interest-wrap').hidden=id!=='interest';$('contractor-wrap').hidden=id!=='contractor';$('goods-wrap').hidden=id!=='goods';$('vda-wrap').hidden=id!=='vda';});
$('certificate').addEventListener('change',e=>$('certificate-rate-wrap').hidden=e.target.value!=='yes');
$('residency').addEventListener('change',e=>$('nri-rate-wrap').hidden=e.target.value!=='nonresident');
$('reset').addEventListener('click',()=>{form.reset();$('tds-result').classList.remove('show');$('tds-error').classList.remove('show');$('paymentType').dispatchEvent(new Event('change'));});
$('print').addEventListener('click',()=>window.print());
$('paymentType').dispatchEvent(new Event('change'));
$('tds-form').addEventListener('change',e=>{if(e.target.id!=='paymentType')return;});
/* Salary TDS estimate reuses the existing, separately maintained income-tax rules engine. */
$('salary-form').addEventListener('submit',e=>{e.preventDefault();const annual=Number($('salary-income').value),already=Number($('salary-deducted').value)||0,months=Math.max(1,Math.min(12,Number($('months-left').value)||1)),age=Number($('salary-age').value)||30,regime=$('salary-regime').value;
 if(!annual||annual<0){$('salary-error').textContent='Enter a valid annual salary.';$('salary-error').classList.add('show');return;}
 const taxRules=window.INCOMETAX_RULES?.['TY2026-27'];if(!taxRules||!window.IncomeTaxEngine){$('salary-error').textContent='Salary tax rules could not be loaded.';$('salary-error').classList.add('show');return;}
 const calc=window.IncomeTaxEngine.calculate({salary:annual,age,resident:'resident',basic:0,hra:0,rent:0,metro:'no',otherIncome:0,houseIncome:0,c80c:$('salary-80c').value||0,c80d:0,npsSelf:0,homeInterest:0,employerNps:0,otherDeductions:0},taxRules);
 const total=(regime==='old'?calc.old:calc.newer).total,remaining=Math.max(0,total-already),monthly=remaining/months;
 $('salary-tax').textContent=fmt(total);$('salary-monthly').textContent=fmt(monthly);$('salary-remaining').textContent=fmt(remaining);$('salary-result').classList.add('show');$('salary-error').classList.remove('show');
});
const rateSearch=$('rate-search'),rateBody=$('rate-body');
function thresholdLabel(i){if(i.thresholdType==='none')return 'No general threshold';if(i.thresholdType==='monthly')return fmt(i.threshold)+' / month';if(i.thresholdType==='single')return fmt(i.threshold)+' / transaction';if(i.thresholdType==='single-or-annual')return '₹30,000 single / ₹1 lakh annual';if(i.thresholdType==='interest')return '₹10,000–₹1 lakh (payer/age based)';if(i.thresholdType==='goods')return '₹50 lakh aggregate + turnover test';if(i.thresholdType==='vda')return '₹10,000 / ₹50,000 exception test';if(i.thresholdType==='property')return '₹50 lakh (higher value)';return fmt(i.threshold)+' annual';}
function renderRates(q=''){const query=q.toLowerCase();const rows=rules.items.filter(i=>(i.name+' '+i.oldSection+' '+i.newSection+' '+i.group+' '+i.description).toLowerCase().includes(query));rateBody.innerHTML=rows.map(i=>'<tr><td><strong>'+i.name+'</strong><small>'+i.description+'</small></td><td>'+i.oldSection+'</td><td>'+i.newSection+'</td><td>'+(i.rateType==='contractor'?'1% / 2%':i.rate+'%')+'</td><td>'+thresholdLabel(i)+'</td></tr>').join('')||'<tr><td colspan="5">No matching payment type found.</td></tr>';}
rateSearch.addEventListener('input',()=>renderRates(rateSearch.value));renderRates();
})();