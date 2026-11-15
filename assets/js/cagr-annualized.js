(()=>{'use strict';
const $=id=>document.getElementById(id);
const defaults={currency:'USD',start:'10000',end:'25000',years:'5',inflation:'3',benchmark:'8',future:'5',goal:'50000'};
const currencies=['USD','GBP','EUR','INR','CAD','AUD','JPY','SGD','AED'];
const fmt=(n,d=2)=>new Intl.NumberFormat('en-US',{maximumFractionDigits:d,minimumFractionDigits:d}).format(n);
const money=(n,c)=>new Intl.NumberFormat('en-US',{style:'currency',currency:c,maximumFractionDigits:2}).format(n);
function calc(v){
 for(const key of ['start','end','years','inflation','benchmark','future','goal'])if(!Number.isFinite(v[key]))throw Error('All numerical fields must contain finite values.');
 if(v.start<=0||v.start>1e12)throw Error('Beginning value must be greater than zero and no more than 1 trillion.');
 if(v.end<0||v.end>1e12)throw Error('Ending value must be nonnegative and no more than 1 trillion.');
 if(v.years<=0||v.years>100)throw Error('Holding period must be greater than zero and no more than 100 years.');
 if(v.inflation<=-100||v.inflation>100)throw Error('Inflation must be greater than −100% and at most 100%.');
 if(v.benchmark<=-100||v.benchmark>100)throw Error('Benchmark return must be greater than −100% and at most 100%.');
 if(v.future<0||v.future>100)throw Error('Forward scenario must be between 0 and 100 years.');
 if(v.goal<=0||v.goal>1e14)throw Error('Target value must be positive.');
 if(!currencies.includes(v.currency))throw Error('Choose a supported currency.');
 const rate=Math.pow(v.end/v.start,1/v.years)-1,real=(1+rate)/(1+v.inflation/100)-1;
 const total=(v.end/v.start-1)*100,profit=v.end-v.start;
 const benchmarkEnd=v.start*Math.pow(1+v.benchmark/100,v.years);
 const projected=v.end*Math.pow(1+rate,v.future);
 const targetRate=Math.pow(v.goal/v.end,1/v.future)-1;
 const futureNeeded=v.future===0?(v.goal===v.end?0:null):v.end===0?null:targetRate;
 const doubling=rate>0?Math.log(2)/Math.log(1+rate):null;
 const points=Array.from({length:11},(_,i)=>{const t=v.years*i/10;return {t,actual:v.start*Math.pow(1+rate,t),benchmark:v.start*Math.pow(1+v.benchmark/100,t)}});
 if([rate,real,total,profit,benchmarkEnd,projected,...points.flatMap(p=>[p.actual,p.benchmark])].some(n=>!Number.isFinite(n)))throw Error('Values exceed calculation limits.');
 return {rate,real,total,profit,benchmarkEnd,projected,futureNeeded,doubling,points};
}
window.CAGRCalculatorMath={calc};
function draw(v,r){
 const s=$('growthChart');s.replaceChildren();
 const NS='http://www.w3.org/2000/svg',mk=(tag,a={},txt)=>{const e=document.createElementNS(NS,tag);Object.entries(a).forEach(([k,val])=>e.setAttribute(k,String(val)));if(txt!==undefined)e.textContent=txt;return e};
 s.append(mk('title',{id:'chartTitle'},'Smoothed CAGR path compared with benchmark'));
 s.append(mk('desc',{id:'chartDesc'},'Two model lines from the starting amount over the observed period. The CAGR line is not the actual year-by-year investment history.'));
 const W=650,H=260,L=70,R=625,T=18,B=217,max=Math.max(...r.points.flatMap(p=>[p.actual,p.benchmark]),1)*1.12;
 const x=t=>L+t/v.years*(R-L),y=z=>B-z/max*(B-T);
 for(let i=0;i<=4;i++){const val=max*i/4,Y=y(val);s.append(mk('line',{x1:L,x2:R,y1:Y,y2:Y,stroke:'#e4eaf3'}));s.append(mk('text',{x:L-9,y:Y+4,'text-anchor':'end','font-size':11,fill:'#687c99'},fmt(val,0)))}
 for(let i=0;i<=5;i++){const t=v.years*i/5;s.append(mk('text',{x:x(t),y:242,'text-anchor':'middle','font-size':11,fill:'#6a7d96'},fmt(t,1)))}
 for(const [key,color]of [['actual','#176ce5'],['benchmark','#19a18a']]){
 const d=r.points.map((p,i)=>(i?'L':'M')+x(p.t).toFixed(2)+','+y(p[key]).toFixed(2)).join(' ');
 s.append(mk('path',{d,fill:'none',stroke:color,'stroke-width':3.5,'stroke-linecap':'round'}));
 }
}
let latest=null;
function render(){
 try{
 const v={currency:$('currency').value};for(const k of ['start','end','years','inflation','benchmark','future','goal']){if($(k).value.trim()==='')throw Error('Please fill in '+k+'.');v[k]=Number($(k).value);}
 const r=calc(v);latest={v,r};$('error').textContent='';
 const out={cagr:fmt(r.rate*100)+'%',real:fmt(r.real*100)+'%',total:fmt(r.total)+'%',profit:money(r.profit,v.currency),benchmarkEnd:money(r.benchmarkEnd,v.currency),projected:money(r.projected,v.currency),doubling:r.doubling===null?'Not applicable':fmt(r.doubling)+' years',targetRate:r.futureNeeded===null?'Not applicable':fmt(r.futureNeeded*100)+'%',starting:money(v.start,v.currency),ending:money(v.end,v.currency),growthMultiple:fmt(v.end/v.start)+'×'};
 for(const [id,value]of Object.entries(out))$(id).textContent=value;
 $('status').textContent=r.rate>0?'Positive compounded growth':r.rate<0?'Annualized decline':'No compounded growth';
 $('context').textContent='CAGR smooths the two endpoints into a hypothetical constant annual rate. It does not show interim losses, volatility, dividends, fees, or taxes. Use XIRR when cash flows occur between the endpoints.';
 draw(v,r);
 }catch(e){latest=null;$('error').textContent=e.message;for(const id of ['cagr','real','total','profit','benchmarkEnd','projected','doubling','targetRate','starting','ending','growthMultiple'])$(id).textContent='—';$('growthChart').replaceChildren();$('status').textContent='Check inputs';}
}
$('cagrForm').addEventListener('input',render);$('cagrForm').addEventListener('change',render);$('cagrForm').addEventListener('submit',e=>{e.preventDefault();render()});
$('reset').addEventListener('click',()=>{Object.entries(defaults).forEach(([k,val])=>$(k).value=val);render()});
$('copy').addEventListener('click',()=>{if(!latest)return;const {v,r}=latest;const s='CAGR: '+fmt(r.rate*100)+'%; Real CAGR: '+fmt(r.real*100)+'%; Total return: '+fmt(r.total)+'%; '+money(v.start,v.currency)+' to '+money(v.end,v.currency)+' over '+fmt(v.years)+' years. https://returnoninvestmentcalculator.in/cagr-calculator/';navigator.clipboard?.writeText(s).then(()=>$('error').textContent='Copied summary.').catch(()=>$('error').textContent='Clipboard permission unavailable.')});
$('csv').addEventListener('click',()=>{if(!latest)return;const {v,r}=latest;const rows=[['Metric','Value'],['Currency',v.currency],['Start',v.start],['End',v.end],['Years',v.years],['CAGR (%)',r.rate*100],['Total return (%)',r.total],['Real CAGR (%)',r.real*100],['Benchmark ending value',r.benchmarkEnd],['Future scenario',r.projected],['Assumption','CAGR is a smoothed endpoint rate, not actual yearly returns']];const csv=rows.map(row=>row.map(x=>'"'+String(x).replace(/"/g,'""')+'"').join(',')).join('\r\n');const u=URL.createObjectURL(new Blob(['\ufeff'+csv],{type:'text/csv;charset=utf-8'}));const a=document.createElement('a');a.href=u;a.download='cagr-annualized-return.csv';document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(u),1000)});
$('print').addEventListener('click',()=>window.print());render();
})();