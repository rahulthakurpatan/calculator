/* InvestCalc Gold Jewellery Resale & Break-Even Calculator
 * Static offline financial assumptions, no API, no automatic real-time price.
 * Original transaction GST estimate is distinct from personal capital gains tax.
 */
(() => {
  'use strict';
  const $ = id => document.getElementById(id);
  const FINENESS = Object.freeze({'14K':.585,'18K':.750,'20K':.833,'22K':.916,'23K':.958,'24KS':.995,'24KF':.999});
  const DEFAULTS = Object.freeze({
    rateBuy:'125000',rateSell:'125000',grade:'22K',gross:'12',nonGold:'2',
    makingMode:'percent',making:'12',wastage:'3',stones:'12000',extras:'500',gst:'3',
    paidOverride:'',deduct:'3',assay:'300',stoneRecovery:'0',growth:'8',horizon:'10'
  });
  const NUMERIC = Object.freeze({
    rateBuy:[.01,1e9],rateSell:[0,1e9],gross:[.01,1000000],nonGold:[0,1000000],
    making:[0,1e8],wastage:[0,100],stones:[0,1e10],extras:[0,1e10],
    gst:[0,28],paidOverride:[0,1e12],deduct:[0,99.99],assay:[0,1e10],
    stoneRecovery:[0,1e10],growth:[-90,100],horizon:[1,30]
  });
  const REQUIRED = Object.keys(DEFAULTS);
  const nf = n => new Intl.NumberFormat('en-IN',{maximumFractionDigits:2}).format(n);
  const rupee = n => new Intl.NumberFormat('en-IN',{style:'currency',currency:'INR',maximumFractionDigits:0}).format(n);
  const percent = n => new Intl.NumberFormat('en-IN',{maximumFractionDigits:2,minimumFractionDigits:2}).format(n)+'%';
  const clamp = (v,a,b) => Math.max(a,Math.min(b,v));
  const validAmount = v => Number.isFinite(v)&&v>=0;
  function read() {
    const v = {};
    for (const k of REQUIRED) {
      const el=$(k),s=el.value.trim();
      if (k==='grade') {
        if(!Object.hasOwn(FINENESS,s))throw Error('Select a valid BIS hallmark fineness.');
        v[k]=s;continue;
      }
      if(k==='makingMode'){
        if(!['percent','pergram','flat'].includes(s))throw Error('Select a valid making-charge mode.');
        v[k]=s;continue;
      }
      if(k==='paidOverride' && s===''){v[k]=null;continue;}
      if(s==='')throw Error('Please enter '+(el.dataset.label||k)+'.');
      const n=Number(s),lim=NUMERIC[k];
      if(!Number.isFinite(n)||n<lim[0]||n>lim[1])throw Error((el.dataset.label||k)+' must be between '+nf(lim[0])+' and '+nf(lim[1])+'.');
      if(k==='horizon'&&!Number.isInteger(n))throw Error('Projection horizon must be a whole number of years.');
      if(k==='making'&&v.makingMode==='percent'&&n>100)throw Error('Percentage making charge must not exceed 100%.');
      v[k]=n;
    }
    if(v.nonGold>=v.gross)throw Error('Non-gold / stone weight must be less than gross weight, leaving some actual gold.');
    return v;
  }
  function calculate(v) {
    const netWeight=v.gross-v.nonGold,purity=FINENESS[v.grade];
    if(!validAmount(netWeight)||netWeight<=0||!purity)throw Error('Invalid net gold weight or fineness.');
    const pureGoldGrams=netWeight*purity;
    const purchaseMetal=pureGoldGrams*v.rateBuy/10;
    const making=v.makingMode==='percent'?purchaseMetal*v.making/100:
      v.makingMode==='pergram'?netWeight*v.making:v.making;
    const wastage=purchaseMetal*v.wastage/100;
    const taxable=purchaseMetal+making+wastage+v.stones+v.extras;
    const tax=taxable*v.gst/100;
    const modeledBill=taxable+tax;
    const paid=v.paidOverride===null?modeledBill:v.paidOverride;
    const resaleMetal=pureGoldGrams*v.rateSell/10;
    const resaleDeduction=resaleMetal*v.deduct/100;
    const beforeFloor=resaleMetal-resaleDeduction-v.assay+v.stoneRecovery;
    const payout=Math.max(0,beforeFloor);
    const pnl=payout-paid,roi=paid>0?pnl/paid*100:null;
    const loss=Math.max(0,paid-payout);
    const lossPct=paid>0?loss/paid*100:null;
    const recovery=paid>0?payout/paid*100:null;
    const effectiveGram=purchaseMetal/netWeight;
    const payablePerTenGrams=pureGoldGrams/10*(1-v.deduct/100);
    const thresholdNumerator=paid-v.stoneRecovery+v.assay;
    const requiredRate=payablePerTenGrams>0?Math.max(0,thresholdNumerator/payablePerTenGrams):Infinity;
    const neededChange=v.rateSell>0?(requiredRate/v.rateSell-1)*100:(requiredRate<=0?0:Infinity);
    let yearsToBreakEven=Infinity;
    if(payout>=paid) yearsToBreakEven=0;
    else if(v.rateSell>0 && v.growth>0 && Number.isFinite(requiredRate)) {
      yearsToBreakEven=Math.log(requiredRate/v.rateSell)/Math.log1p(v.growth/100);
      if(!Number.isFinite(yearsToBreakEven)||yearsToBreakEven<0)yearsToBreakEven=Infinity;
    }
    const projection=[];
    for(let year=0;year<=v.horizon;year++){
      const rate=v.rateSell*Math.pow(1+v.growth/100,year);
      const metal= pureGoldGrams*rate/10;
      const futurePayout=Math.max(0,metal*(1-v.deduct/100)-v.assay+v.stoneRecovery);
      projection.push({year,rate,payout:futurePayout,cost:paid,profit:futurePayout-paid});
    }
    return {netWeight,purity,pureGoldGrams,purchaseMetal,making,wastage,taxable,tax,modeledBill,paid,
      resaleMetal,resaleDeduction,payout,pnl,roi,loss,lossPct,recovery,effectiveGram,
      requiredRate,neededChange,yearsToBreakEven,projection};
  }
  window.GoldJewelleryResaleMath={FINENESS,calculate};
  function set(id,content){$(id).textContent=content;}
  const sNS='http://www.w3.org/2000/svg';
  function sv(tag,attrs={},label){const n=document.createElementNS(sNS,tag);for(const [key,value] of Object.entries(attrs))n.setAttribute(key,String(value));if(label!==undefined)n.textContent=label;return n;}
  function plot(v,r) {
    const svg=$('growth-chart');svg.replaceChildren();
    svg.append(sv('title',{id:'growth-title'},'Illustrative gold resale payout compared with your purchase cost'));
    svg.append(sv('desc',{id:'growth-desc'},'Projected yearly net resale value at an assumed gold growth rate, compared with original purchase price. Not a forecast.'));
    const pts=r.projection, maxY=Math.max(1,r.paid*1.15,...pts.map(x=>x.payout*1.12));
    const left=86,right=624,top=20,bottom=227;
    const x=t=>left+(t/v.horizon)*(right-left),y=value=>bottom-value/maxY*(bottom-top);
    for(let k=0;k<=4;k++){
      const val=maxY*k/4,yy=y(val);
      svg.append(sv('line',{x1:left,y1:yy,x2:right,y2:yy,stroke:'#e5eaf5','stroke-width':1}));
      svg.append(sv('text',{x:left-10,y:yy+4,'text-anchor':'end','font-size':11,fill:'#738399'},
        new Intl.NumberFormat('en-IN',{notation:'compact',maximumFractionDigits:1}).format(val)));
    }
    const line=(key,color,dash)=>{
      const path=pts.map((p,i)=>(i?'L':'M')+x(p.year).toFixed(2)+','+y(p[key]).toFixed(2)).join(' ');
      svg.append(sv('path',{d:path,fill:'none',stroke:color,'stroke-width':3,'stroke-linecap':'round',...dash?{'stroke-dasharray':dash}:{}}));
    };
    line('cost','#a98fe3','6 5');line('payout','#1769e0');
    const maxMarks=Math.min(v.horizon,10),step=Math.max(1,Math.ceil(v.horizon/maxMarks));
    for(let yr=0;yr<=v.horizon;yr+=step)svg.append(sv('text',{x:x(yr),y:248,'text-anchor':'middle','font-size':11,fill:'#70819a'},String(yr)));
    if(v.horizon%step!==0)svg.append(sv('text',{x:x(v.horizon),y:248,'text-anchor':'middle','font-size':11,fill:'#70819a'},String(v.horizon)));
    svg.append(sv('text',{x:(left+right)/2,y:270,'text-anchor':'middle','font-size':11,fill:'#70819a'},'Years from today (hypothetical growth)'));
    if(Number.isFinite(r.yearsToBreakEven)&&r.yearsToBreakEven>0&&r.yearsToBreakEven<=v.horizon){
      const xx=x(r.yearsToBreakEven);
      svg.append(sv('line',{x1:xx,x2:xx,y1:top,y2:bottom,stroke:'#09a78c','stroke-width':2,'stroke-dasharray':'4 4'}));
      svg.append(sv('circle',{cx:xx,cy:y(r.paid),r:5,fill:'#09a78c',stroke:'#fff','stroke-width':2}));
    }
  }
  function billPlot(r) {
    const svg=$('cost-chart');svg.replaceChildren();
    svg.append(sv('title',{id:'cost-title'},'Jewellery purchase bill breakdown'));
    svg.append(sv('desc',{id:'cost-desc'},'Metal, making charges, wastage, stones, extras and GST as proportions of the modeled purchase bill.'));
    const total=Math.max(.01,r.modeledBill);
    // The original invoice override is never treated as another modeled bill component.
    const rows=[['Metal',r.purchaseMetal,'#2a71e8'],['Making',r.making,'#9272e6'],['Wastage',r.wastage,'#dfaa4c'],
      ['Stones & other',r.taxable-r.purchaseMetal-r.making-r.wastage,'#22a59b'],['GST',r.tax,'#de7594']];
    let pos=18;for(const [label,val,color] of rows){
      const w=Math.max(0,val/total*580);svg.append(sv('rect',{x:pos,y:20,width:w,height:32,fill:color,rx:0}));pos+=w;
    }
    rows.forEach(([label,val,color],i)=>{
      const col=i%3,row=Math.floor(i/3),left=18+col*200,y=78+row*36;
      svg.append(sv('rect',{x:left,y:y-10,width:10,height:10,rx:2,fill:color}));
      svg.append(sv('text',{x:left+16,y:y,fill:'#51617b','font-size':12},label));
      svg.append(sv('text',{x:left+16,y:y+15,fill:'#1f344e','font-size':12,'font-weight':700},rupee(val)));
    });
  }
  function clearOutput(){
    ['purchase','resale','immediate','breakEven','uplift','period','roi','pureWeight','goldWeight',
      'goldPaid','makingPaid','wastagePaid','stonesPaid','extrasPaid','gstPaid','metalToday','deductionNow',
      'deductionFlat','stoneRecovered','estimatedBill','savings'].forEach(id=>set(id,'—'));
    $('growth-chart').replaceChildren();$('cost-chart').replaceChildren();
    $('result-banner').className='result-banner';
    set('banner-head','Correct the inputs to calculate.');
    set('banner-note','Purchase and resale estimates will appear here.');
  }
  let latest=null;
  function render(){
    try {
      const v=read(),r=calculate(v);
      if(!Number.isFinite(r.modeledBill)||!Number.isFinite(r.paid)||!Number.isFinite(r.payout)||!Number.isFinite(r.requiredRate)||!Number.isFinite(r.projection.at(-1).payout))throw Error('Scenario is too large. Reduce the entered values.');
      latest={v,r};set('error','');
      set('purchase',rupee(r.paid));set('resale',rupee(r.payout));set('immediate',(r.pnl>=0?'+':'−')+rupee(Math.abs(r.pnl)));
      set('breakEven',rupee(r.requiredRate)+' / 10 g');
      set('uplift',Number.isFinite(r.neededChange)?(r.neededChange>=0?'+':'')+percent(r.neededChange):'Not calculable');
      set('period',!Number.isFinite(r.yearsToBreakEven)?'Not reached':r.yearsToBreakEven===0?'Already break-even':nf(r.yearsToBreakEven)+' years*');
      set('roi',r.roi===null?'Not applicable':percent(r.roi));
      set('pureWeight',nf(r.pureGoldGrams)+' g');set('goldWeight',nf(r.netWeight)+' g');
      set('goldPaid',rupee(r.purchaseMetal));set('makingPaid',rupee(r.making));
      set('wastagePaid',rupee(r.wastage));set('stonesPaid',rupee(v.stones));set('extrasPaid',rupee(v.extras));set('gstPaid',rupee(r.tax));
      set('estimatedBill',rupee(r.modeledBill));set('metalToday',rupee(r.resaleMetal));
      set('deductionNow',rupee(r.resaleDeduction));set('deductionFlat',rupee(v.assay));set('stoneRecovered',rupee(v.stoneRecovery));
      set('savings',r.loss>0?'Estimated immediate shortfall: '+rupee(r.loss)+' ('+percent(r.lossPct)+')':'No modeled immediate loss at these price assumptions.');
      $('result-banner').className='result-banner '+(r.pnl>=0?'positive':'negative');
      set('banner-head',r.pnl>=0?'AT OR ABOVE PURCHASE COST':'RESALE BELOW PURCHASE COST');
      set('banner-note',r.pnl>=0?'Your estimated resale payout meets or exceeds the selected purchase amount.':'Making charges, GST and buyback deductions can create a substantial resale gap even if the market gold rate has not changed.');
      $('override-note').textContent=v.paidOverride===null?'Purchase total is modeled from inputs and 3% default GST (editable).':'Your entered original invoice amount overrides the modeled bill as the break-even cost. The modeled bill is still shown for comparison.';
      plot(v,r);billPlot(r);
    } catch (e) {latest=null;set('error',e.message);clearOutput();}
  }
  const report=()=>{
    const {v,r}=latest;
    return [['Metric','Value'],['Purity grade',v.grade],['Fineness',r.purity],['Gross weight grams',v.gross],
      ['Non-gold weight grams',v.nonGold],['Net gold grams',r.netWeight],['Pure gold-equivalent grams',r.pureGoldGrams],
      ['Purchase 24K rate per 10g INR',v.rateBuy],['Resale 24K rate per 10g INR',v.rateSell],
      ['Gold metal in purchase estimate',r.purchaseMetal],['Making charge',r.making],['Wastage/value addition',r.wastage],
      ['Stones at purchase',v.stones],['Other purchase fees',v.extras],['Modeled purchase GST',r.tax],
      ['Modeled purchase bill',r.modeledBill],['Original paid invoice override',v.paidOverride===null?'None':v.paidOverride],
      ['Purchase cost used',r.paid],['Resale metal value',r.resaleMetal],['Buyback deduction',r.resaleDeduction],
      ['Resale testing/fees',v.assay],['Stone resale recovery',v.stoneRecovery],['Expected cash payout',r.payout],
      ['Immediate gain/loss',r.pnl],['Breakeven 24K rate per 10g',r.requiredRate],
      ['Required change in gold rate percent',r.neededChange],['Assumed annual growth percent',v.growth],
      ['Hypothetical years to break even',Number.isFinite(r.yearsToBreakEven)?r.yearsToBreakEven:'Not reached'],
      ['Disclaimer','Manual inputs, not live rates; excludes capital gains tax, income tax and buying/selling contract specifics']];
  };
  function csv(){
    if(!latest)return;
    const data=report().map(row=>row.map(x=>'"'+String(x).replace(/"/g,'""')+'"').join(',')).join('\r\n');
    const url=URL.createObjectURL(new Blob(['\ufeff'+data],{type:'text/csv;charset=utf-8'}));
    const a=document.createElement('a');a.href=url;a.download='gold-jewellery-resale-break-even.csv';
    document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),1000);
  }
  function copy(){
    if(!latest)return;const {v,r}=latest;
    const s=['Gold Jewellery Resale & Break-Even Calculator','https://returnoninvestmentcalculator.in/gold-jewellery-resale-break-even-calculator/',
      'Purity: '+v.grade,'Net gold weight: '+nf(r.netWeight)+' g','Purchase cost: '+rupee(r.paid),
      'Current resale estimate: '+rupee(r.payout),'Net gain/loss: '+rupee(r.pnl),
      '24K rate required for break-even: '+rupee(r.requiredRate)+' per 10 g',
      'Example-only assumptions. Not real-time prices or financial/tax advice.'].join('\n');
    if(navigator.clipboard?.writeText)navigator.clipboard.writeText(s).then(()=>set('error','Summary copied.')).catch(()=>set('error','Clipboard access denied.'));
    else set('error','Clipboard unavailable in this browser.');
  }
  $('gold-form').addEventListener('input',render);
  $('gold-form').addEventListener('change',render);
  $('gold-form').addEventListener('submit',e=>{e.preventDefault();render();});
  $('reset').addEventListener('click',()=>{REQUIRED.forEach(id=>$(id).value=DEFAULTS[id]);render();});
  $('copy').addEventListener('click',copy);
  $('download').addEventListener('click',csv);
  $('print').addEventListener('click',()=>window.print());
  render();
})();