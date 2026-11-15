/* InvestCalc: HELOC vs fixed home-equity loan
   Cash-flow simulation with transparent assumptions; no lender data or rate API.
   Figures are educational, not a regulatory APR disclosure or loan offer. */
(() => {
  'use strict';
  const $=id=>document.getElementById(id);
  const defaults={homeValue:'450000',mortgage:'250000',maxCltv:'85',amount:'75000',
    fixedRate:'8',fixedYears:'15',fixedFees:'1700',
    drawRate:'8.75',drawYears:'10',repayRate:'10.25',repayYears:'15',
    helocFees:'650',annualFee:'75',extraDraw:'0',horizon:'10'};
  const ranges={
    homeValue:[1,1e10],mortgage:[0,1e10],maxCltv:[1,100],amount:[1,1e9],
    fixedRate:[0,40],fixedYears:[1,30],fixedFees:[0,1e8],
    drawRate:[0,40],drawYears:[1,20],repayRate:[0,40],repayYears:[1,30],
    helocFees:[0,1e8],annualFee:[0,1e6],extraDraw:[0,1e7],horizon:[1,40]};
  const intFields=new Set(['fixedYears','drawYears','repayYears','horizon']);
  const keys=Object.keys(defaults);
  function input(){
    const v={};
    for(const id of keys){
      const el=$(id),raw=el.value.trim(),bounds=ranges[id];
      if(raw==='')throw Error('Enter '+(el.dataset.label||id)+'.');
      const n=Number(raw);
      if(!Number.isFinite(n)||n<bounds[0]||n>bounds[1])throw Error((el.dataset.label||id)+' must be between '+bounds[0]+' and '+bounds[1]+'.');
      if(intFields.has(id)&&!Number.isInteger(n))throw Error((el.dataset.label||id)+' must be a whole number.');
      v[id]=n;
    }
    if(v.mortgage>v.homeValue)throw Error('Existing mortgage balance cannot exceed the entered property value in this equity estimate. Adjust to model negative equity separately.');
    if(v.extraDraw>v.amount)throw Error('Monthly extra draw principal must not exceed the initial advance.');
    return v;
  }
  function monthlyPayment(principal,rate,n){
    if(!Number.isFinite(principal)||principal<0||!Number.isFinite(rate)||rate<0||!Number.isInteger(n)||n<1)throw Error('Invalid payment parameters.');
    if(!principal)return 0;
    const r=rate/1200;
    if(r===0)return principal/n;
    return principal*r/(-Math.expm1(-n*Math.log1p(r)));
  }
  const makeRow=(month,phase,balance,interest,principal,payment,fees,cumulativeInterest,cumulativeFees,cumulativePaid)=>
    ({month,phase,balance,interest,principal,payment,fees,cumulativeInterest,cumulativeFees,cumulativePaid,financeCost:cumulativeInterest+cumulativeFees});
  function fixedLoan(v){
    let b=v.amount,paid=v.fixedFees,interestTotal=0,fees=v.fixedFees;
    const months=v.fixedYears*12,pmt=monthlyPayment(v.amount,v.fixedRate,months);
    const schedule=[makeRow(0,'Closing',b,0,0,0,v.fixedFees,0,fees,paid)];
    for(let m=1;m<=months;m++){
      if(b<1e-7){b=0;break;}
      const interest=b*v.fixedRate/1200;
      const principal=m===months?b:Math.min(b,Math.max(0,pmt-interest));
      const pay=principal+interest;b=Math.max(0,b-principal);
      interestTotal+=interest;paid+=pay;
      schedule.push(makeRow(m,'Amortizing',b,interest,principal,pay,0,interestTotal,fees,paid));
    }
    return {schedule,firstPayment:pmt,drawPayment:null,repayPayment:pmt,interest:interestTotal,fees,totalFinance:interestTotal+fees,totalPaid:paid,months:schedule.at(-1).month};
  }
  function heloc(v,rateReset=v.repayRate){
    let b=v.amount,paid=v.helocFees,interestTotal=0,fees=v.helocFees,drawInitial=0;
    const drawMonths=v.drawYears*12, repayMonths=v.repayYears*12, rows=[makeRow(0,'Opening',b,0,0,0,v.helocFees,0,fees,paid)];
    let repaymentPayment=0,paidOffDuringDraw=false;
    for(let m=1;m<=drawMonths;m++){
      if(b<1e-7){paidOffDuringDraw=true;b=0;break;}
      const interest=b*v.drawRate/1200,principal=Math.min(v.extraDraw,b),payment=interest+principal;
      const fee=(m-1)%12===0?v.annualFee:0;
      if(m===1)drawInitial=payment;
      b=Math.max(0,b-principal);interestTotal+=interest;fees+=fee;paid+=payment+fee;
      rows.push(makeRow(m,'Interest-only draw + optional principal',b,interest,principal,payment,fee,interestTotal,fees,paid));
    }
    if(b>1e-7){
      repaymentPayment=monthlyPayment(b,rateReset,repayMonths);
      for(let m=1;m<=repayMonths;m++){
        const month=drawMonths+m,interest=b*rateReset/1200;
        const principal=m===repayMonths?b:Math.min(b,Math.max(0,repaymentPayment-interest));
        const payment=principal+interest,fee=(month-1)%12===0?v.annualFee:0;
        b=Math.max(0,b-principal);interestTotal+=interest;fees+=fee;paid+=payment+fee;
        rows.push(makeRow(month,'Repayment amortization',b,interest,principal,payment,fee,interestTotal,fees,paid));
      }
    }else if(paidOffDuringDraw){repaymentPayment=0;}
    return {schedule:rows,firstPayment:drawInitial,drawPayment:drawInitial,
      repayPayment:repaymentPayment,interest:interestTotal,fees,totalFinance:interestTotal+fees,
      totalPaid:paid,months:rows.at(-1).month,atDrawEndBalance:rows.findLast(r=>r.month<=drawMonths)?.balance??0};
  }
  function atMonth(schedule,month){
    if(month<=0)return schedule[0];let lo=0,hi=schedule.length-1;
    if(month>=schedule[hi].month)return schedule[hi];
    while(lo<=hi){let mid=Math.floor((lo+hi)/2),val=schedule[mid].month;
      if(val===month)return schedule[mid];if(val<month)lo=mid+1;else hi=mid-1;}
    return schedule[Math.max(0,hi)];
  }
  function calc(v){
    const homeEquity=v.homeValue-v.mortgage,capacity=Math.max(0,v.homeValue*v.maxCltv/100-v.mortgage);
    const cltv=(v.mortgage+v.amount)/v.homeValue*100;
    const fixed=fixedLoan(v),line=heloc(v),horizonMonths=v.horizon*12;
    const fixedH=atMonth(fixed.schedule,horizonMonths),helocH=atMonth(line.schedule,horizonMonths);
    const stress=[-2,0,2,4].map(change=>{
      const rate=Math.max(0,v.repayRate+change),model=heloc(v,rate);
      return {change,rate,payment:model.repayPayment,cost:model.totalFinance};
    });
    return {homeEquity,capacity,cltv,qualifies:capacity>=v.amount,fixed,line,horizonMonths,
      fixedH,helocH,stress,
      shock:line.repayPayment-line.drawPayment,
      lifetimeGap:line.totalFinance-fixed.totalFinance,
      horizonGap:helocH.financeCost-fixedH.financeCost,
      remainingGap:helocH.balance-fixedH.balance};
  }
  window.HELOCCompareMath={monthlyPayment,fixedLoan,heloc,atMonth,calc};
  const dollars=n=>new Intl.NumberFormat('en-US',{style:'currency',currency:'USD',maximumFractionDigits:0}).format(n);
  const precise=n=>new Intl.NumberFormat('en-US',{style:'currency',currency:'USD',minimumFractionDigits:2,maximumFractionDigits:2}).format(n);
  const number=(n,d=0)=>new Intl.NumberFormat('en-US',{minimumFractionDigits:d,maximumFractionDigits:d}).format(n);
  const pct=n=>number(n,1)+'%';
  const set=(id,v)=>{$(id).textContent=v;};
  const svgNS='http://www.w3.org/2000/svg';
  function elt(tag,attrs={},val){const n=document.createElementNS(svgNS,tag);for(const [k,v] of Object.entries(attrs))n.setAttribute(k,String(v));if(val!==undefined)n.textContent=val;return n;}
  function drawBalance(v,r){
    const svg=$('balance-graph');svg.replaceChildren();
    svg.append(elt('title',{id:'balance-title'},'Remaining principal balance for fixed home equity loan and HELOC'));
    svg.append(elt('desc',{id:'balance-desc'},'Monthly balances show fixed home-equity amortization and interest-only HELOC draw followed by principal repayment.'));
    const months=Math.max(r.fixed.months,r.line.months),P=v.amount,left=70,right=614,top=17,bottom=205;
    const x=m=>left+(m/months)*(right-left),y=b=>bottom-b/Math.max(1,P)*(bottom-top);
    for(let i=0;i<=4;i++){
      const dollar=P*i/4,yy=y(dollar);svg.append(elt('line',{x1:left,x2:right,y1:yy,y2:yy,stroke:'#e5ecf6'}));
      svg.append(elt('text',{x:left-8,y:yy+4,'text-anchor':'end','font-size':11,fill:'#70829c'},new Intl.NumberFormat('en-US',{notation:'compact',maximumFractionDigits:1}).format(dollar)));
    }
    function path(schedule,color){
      const points=schedule.map((s,i)=>(i?'L':'M')+x(s.month).toFixed(2)+','+y(s.balance).toFixed(2)).join(' ');
      svg.append(elt('path',{d:points,stroke:color,'stroke-width':3.2,fill:'none','stroke-linecap':'round','stroke-linejoin':'round'}));
    }
    path(r.fixed.schedule,'#166de2');path(r.line.schedule,'#8862da');
    for(let k=0;k<=4;k++){const m=Math.round(months*k/4);svg.append(elt('text',{x:x(m),y:229,'text-anchor':'middle',fill:'#71839d','font-size':11},number(m/12,1)+'y'));}
    const dx=x(v.drawYears*12);
    svg.append(elt('line',{x1:dx,x2:dx,y1:top,y2:bottom,stroke:'#e3ac50','stroke-width':1.8,'stroke-dasharray':'5 4'}));
    svg.append(elt('text',{x:Math.min(dx+4,right-4),y:12,'text-anchor':dx>right-95?'end':'start',fill:'#a97b30','font-size':10},'HELOC draw ends'));
  }
  function drawStress(v,r){
    const svg=$('stress-graph');svg.replaceChildren();
    svg.append(elt('title',{id:'stress-title'},'HELOC monthly repayment by end-of-draw interest-rate scenario'));
    svg.append(elt('desc',{id:'stress-desc'},'Illustrative repayment payment at minus two, unchanged, plus two and plus four percentage points relative to the entered reset rate.'));
    const max=Math.max(1,...r.stress.map(x=>x.payment))*1.18;
    const left=150,right=550,top=22,step=42;
    r.stress.forEach((item,i)=>{
      const y=top+i*step,selected=item.change===0,label=(item.change>0?'+':'')+item.change+'pp = '+pct(item.rate);
      svg.append(elt('text',{x:left-10,y:y+16,'text-anchor':'end',fill:selected?'#315da6':'#70809a','font-size':11,'font-weight':selected?800:500},label));
      svg.append(elt('rect',{x:left,y:y,width:right-left,height:25,rx:6,fill:'#edf2fb'}));
      svg.append(elt('rect',{x:left,y:y,width:(right-left)*item.payment/max,height:25,rx:6,fill:selected?'#1769e0':'#a48add'}));
      svg.append(elt('text',{x:right+7,y:y+17,fill:'#3b5273','font-size':11,'font-weight':750},dollars(item.payment)));
    });
  }
  let last=null;
  function blank(){
    ['equity','capacity','cltv','loanPay','drawPay','repayPay','shock','loanInterest','helocInterest','loanFees',
      'helocFeeTotal','loanFinance','helocFinance','loanYears','helocYears','loanAtH','helocAtH','loanDebtH','helocDebtH',
      'savings','horizonLabel','helocDrawBalance'].forEach(id=>set(id,'—'));
    $('balance-graph').replaceChildren();$('stress-graph').replaceChildren();
    $('verdict').className='verdict';set('verdictTitle','Correct the inputs to calculate.');
    set('verdictNote','Monthly and total cost estimates will appear here.');
    set('eligibility','');
  }
  function render(){
    try{
      const v=input(),r=calc(v);
      if(!Number.isFinite(r.fixed.totalPaid)||!Number.isFinite(r.line.totalPaid)||!Number.isFinite(r.capacity))throw Error('Input values cause calculation overflow.');
      last={v,r};set('error','');
      set('equity',dollars(r.homeEquity));set('capacity',dollars(r.capacity));set('cltv',pct(r.cltv));
      set('loanPay',precise(r.fixed.firstPayment));set('drawPay',precise(r.line.drawPayment));
      set('repayPay',precise(r.line.repayPayment));set('shock',(r.shock>0?'+':'')+precise(r.shock));
      set('loanInterest',dollars(r.fixed.interest));set('helocInterest',dollars(r.line.interest));
      set('loanFees',dollars(r.fixed.fees));set('helocFeeTotal',dollars(r.line.fees));
      set('loanFinance',dollars(r.fixed.totalFinance));set('helocFinance',dollars(r.line.totalFinance));
      set('loanYears',number(r.fixed.months/12,1)+' years');set('helocYears',number(r.line.months/12,1)+' years');
      set('loanAtH',dollars(r.fixedH.financeCost));set('helocAtH',dollars(r.helocH.financeCost));
      set('loanDebtH',dollars(r.fixedH.balance));set('helocDebtH',dollars(r.helocH.balance));
      set('helocDrawBalance',dollars(r.line.atDrawEndBalance));set('horizonLabel',v.horizon+'-year same-horizon comparison');
      let eligible=r.qualifies?'Under the illustrative '+pct(v.maxCltv)+' CLTV ceiling, the requested advance fits within estimated collateral capacity.':'Requested amount exceeds estimated borrowing capacity under the illustrative CLTV ceiling. This is not an approval or decline decision.';
      set('eligibility',eligible);
      const cheaper=r.horizonGap>0?'Fixed loan':r.horizonGap<0?'HELOC':'Tie';
      $('verdict').className='verdict '+(r.horizonGap>0?'loan':r.horizonGap<0?'line':'');
      set('verdictTitle',cheaper==='Tie'?'SAME MODELED FINANCING COST':cheaper+' HAS LOWER '+v.horizon+'-YEAR FINANCE COST');
      set('verdictNote',cheaper==='Tie'?'Both options have the same modeled interest plus fees through the selected horizon.':'By the end of year '+v.horizon+', the modeled difference in interest plus disclosed fees is '+dollars(Math.abs(r.horizonGap))+'. Remaining principal and monthly payment timing differ. Early payoff charges are not included.');
      set('savings',(r.shock>=0?'Repayment payment increases by ':'Repayment payment changes by ')+dollars(Math.abs(r.shock))+' per month relative to first draw payment (excluding annual account fees). If rates move differently during the draw period, actual payments will also change.');
      drawBalance(v,r);drawStress(v,r);
    }catch(e){last=null;set('error',e.message);blank();}
  }
  const scheduleCSV=()=>{
    if(!last)return;
    const {v,r}=last;
    const lines=[['Scenario','Month','Phase','Payment excluding fees','Interest','Principal','Fees this month','Ending balance','Cumulative financing cost']];
    function add(label,schedule){schedule.forEach(o=>lines.push([label,o.month,o.phase,o.payment.toFixed(2),o.interest.toFixed(2),o.principal.toFixed(2),o.fees.toFixed(2),o.balance.toFixed(2),o.financeCost.toFixed(2)]));}
    add('Fixed home-equity loan',r.fixed.schedule);add('HELOC',r.line.schedule);
    const csv=lines.map(x=>x.map(v=>'"'+String(v).replace(/"/g,'""')+'"').join(',')).join('\r\n');
    const url=URL.createObjectURL(new Blob(['\ufeff'+csv],{type:'text/csv;charset=utf-8'})),link=document.createElement('a');
    link.href=url;link.download='heloc-vs-home-equity-loan-monthly-schedule.csv';document.body.appendChild(link);link.click();link.remove();setTimeout(()=>URL.revokeObjectURL(url),1500);
  };
  const copySummary=()=>{
    if(!last)return;
    const {v,r}=last;
    const content=['HELOC vs Home Equity Loan Calculator',
      'https://returnoninvestmentcalculator.in/heloc-vs-home-equity-loan-calculator/',
      'Initial funding: '+dollars(v.amount),'Fixed loan payment: '+precise(r.fixed.firstPayment)+'/mo',
      'HELOC initial draw payment: '+precise(r.line.drawPayment)+'/mo',
      'HELOC repayment payment: '+precise(r.line.repayPayment)+'/mo (reset rate '+pct(v.repayRate)+')',
      'Fixed loan lifetime interest+fees: '+dollars(r.fixed.totalFinance),
      'HELOC lifetime interest+fees: '+dollars(r.line.totalFinance),
      'Same '+v.horizon+'-year cost, fixed: '+dollars(r.fixedH.financeCost)+', HELOC: '+dollars(r.helocH.financeCost),
      'Illustrative calculation; taxes, other fees, eligibility and rate path excluded.'].join('\n');
    if(navigator.clipboard?.writeText)navigator.clipboard.writeText(content).then(()=>set('error','Summary copied.')).catch(()=>set('error','Clipboard blocked by browser.'));
    else set('error','Clipboard unavailable.');
  };
  $('compare-form').addEventListener('input',render);$('compare-form').addEventListener('change',render);
  $('compare-form').addEventListener('submit',e=>{e.preventDefault();render();});
  $('reset').addEventListener('click',()=>{keys.forEach(id=>$(id).value=defaults[id]);render();});
  $('csv').addEventListener('click',scheduleCSV);$('copy').addEventListener('click',copySummary);
  $('print').addEventListener('click',()=>window.print());
  render();
})();