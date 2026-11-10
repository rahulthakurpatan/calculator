(() => {
'use strict';
const $=id=>document.getElementById(id), form=$('ef-form');
let result=null;
const n=id=>Number($(id).value), valid=id=>$(id).value.trim()!==''&&Number.isFinite(n(id))&&n(id)>=0;
const money=x=>new Intl.NumberFormat(undefined,{style:'currency',currency:$('currency').value,maximumFractionDigits:0}).format(x);
function run(){
 const ids=['expenses','savings','contribution','runway-cash','runway-expenses','continuing-income','oneoff'];
 if(ids.some(id=>!valid(id))||n('expenses')<=0||n('runway-expenses')<=0||n('target-months')<1||n('target-months')>120||n('savings-rate')<0||n('savings-rate')>30||n('cut-percent')<0||n('cut-percent')>90){$('error').hidden=false;$('results').hidden=true;return;}
 const expenses=n('expenses'),savings=n('savings'),months=n('target-months'),contribution=n('contribution'),rate=n('savings-rate')/1200;
 const target=expenses*months,shortfall=Math.max(0,target-savings),coverage=savings/expenses;
 let goalBalance=savings,goalMonths=0;while(goalBalance<target&&goalMonths<1200){goalBalance=goalBalance*(1+rate)+contribution;goalMonths++;}
 const required=shortfall===0?0:(rate===0?shortfall/(months*2):shortfall*rate/(Math.pow(1+rate,months*2)-1));
 const cash=n('runway-cash'),cost=n('oneoff'),out=n('runway-expenses'),income=n('continuing-income'),cut=n('cut-percent');
 const burn=out-income,reduced=out*(1-cut/100)-income;
 let balance=cash,rows=[];
 for(let m=1;m<=600;m++){balance=Math.max(0,balance*(1+rate)-out-income*-1-(m===1?cost:0));rows.push({m,balance,expense:out+(m===1?cost:0)});if(balance<=0)break;}
 const depletion=rows.find(x=>x.balance<=0);
 result={target,shortfall,coverage,goalMonths,required,cash,out,income,cost,cut,burn,reduced,rows};
 $('target').textContent=money(target);$('shortfall').textContent=money(shortfall);$('coverage').textContent=coverage.toFixed(1)+' months';
 $('funded').textContent=Math.min(100,savings/target*100).toFixed(0)+'% funded';$('bar').style.width=Math.min(100,savings/target*100)+'%';
 $('goal-time').textContent=shortfall===0?'Already funded':goalMonths>=1200?'Over 100 years':goalMonths+' months';
 $('monthly').textContent=money(required);$('burn').textContent=money(Math.max(0,burn));
 $('runway').textContent=burn<=0?'No depletion under assumptions':Math.max(0,(cash-cost)/burn).toFixed(1)+' months';
 $('reduced-runway').textContent=reduced<=0?'No depletion':Math.max(0,(cash-cost)/reduced).toFixed(1)+' months';
 $('depletion').textContent=depletion?'Month '+depletion.m:'Not within 600 months';
 $('runway-note').textContent=burn<=0?'Continuing income covers entered expenses.': 'Estimated from accessible cash, continuing income and one-time cost.';
 $('tbody').innerHTML=rows.slice(0,24).map(x=>'<tr><td>'+x.m+'</td><td>'+money(x.expense)+'</td><td>'+money(x.balance)+'</td></tr>').join('');
 const max=Math.max(1,...rows.slice(0,24).map(x=>x.balance)),w=620,h=180,p=25;
 const pts=rows.slice(0,24).map((x,i)=>(p+i*(w-2*p)/Math.max(1,Math.min(23,rows.length-1)))+','+(h-p-x.balance/max*(h-2*p))).join(' ');
 $('chart').innerHTML='<svg viewBox="0 0 '+w+' '+h+'" role="img" aria-label="Projected savings balance chart"><line x1="'+p+'" y1="'+(h-p)+'" x2="'+(w-p)+'" y2="'+(h-p)+'" stroke="#dce4f1"/><polyline points="'+pts+'" fill="none" stroke="#365eea" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/></svg>';
 $('results').hidden=false;$('error').hidden=true;
}
form.addEventListener('submit',e=>{e.preventDefault();run();});
$('same').addEventListener('change',e=>{if(e.target.checked){$('runway-cash').value=$('savings').value;$('runway-expenses').value=$('expenses').value;}});
['savings','expenses'].forEach(id=>$(id).addEventListener('input',()=>{if($('same').checked){$('runway-cash').value=$('savings').value;$('runway-expenses').value=$('expenses').value;}}));
$('currency').addEventListener('change',()=>{if(result)run();});
$('reset').addEventListener('click',()=>{form.reset();$('results').hidden=true;$('error').hidden=true;});
$('print').addEventListener('click',()=>window.print());
$('csv').addEventListener('click',()=>{if(!result)return;const lines=[['Month','Expenses','Ending cash'],...result.rows.map(x=>[x.m,x.expense.toFixed(2),x.balance.toFixed(2)])];const blob=new Blob([lines.map(r=>r.join(',')).join('\n')],{type:'text/csv'});const a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download='emergency-fund-runway.csv';a.click();URL.revokeObjectURL(a.href);});
const region=(()=>{try{return new Intl.Locale(Intl.NumberFormat().resolvedOptions().locale).maximize().region}catch(e){return 'US'}})();
$('currency').value=({GB:'GBP',CA:'CAD',AU:'AUD',IN:'INR',US:'USD'}[region]||'USD');
run();
})();