/* Short-term rental occupancy break-even | InvestCalc | model and UX
 No external chart library, pricing API or storage. Financial projections are estimates. */
(() => {
'use strict';
const defaults={currency:'USD',nights:'28',adr:'180',occupancy:'70',stay:'3',guestCleaning:'50',cleaner:'70',supplies:'12',nightVariable:'12',platform:'15.5',management:'0',rent:'1300',utilities:'220',insurance:'180',overhead:'100',offMonths:'4',offOccupancy:'40',offPrice:'80',peakMonths:'3',peakOccupancy:'90',peakPrice:'120'};
const ids=Object.keys(defaults);const $=id=>document.getElementById(id);
const categories={
 currency:[],nights:[1,31],adr:[0,1e8],occupancy:[0,100],stay:[.1,31],
 guestCleaning:[0,1e7],cleaner:[0,1e7],supplies:[0,1e7],nightVariable:[0,1e7],
 platform:[0,95],management:[0,95],rent:[0,1e8],utilities:[0,1e8],insurance:[0,1e8],overhead:[0,1e8],
 offMonths:[0,12],offOccupancy:[0,100],offPrice:[1,400],peakMonths:[0,12],peakOccupancy:[0,100],peakPrice:[1,400]
};
const validCurrencies=new Set(['USD','GBP','EUR','INR','CAD','AUD']);
function read(){
 const v={};for(const id of ids){const el=$(id),val=el.value.trim();if(id==='currency'){if(!validCurrencies.has(val))throw Error('Choose a valid currency.');v[id]=val;continue;}
 if(val==='')throw Error('Enter a value for '+el.dataset.label+'.');
 const n=Number(val),bounds=categories[id];if(!Number.isFinite(n)||n<bounds[0]||n>bounds[1])throw Error(el.dataset.label+' must be between '+bounds[0]+' and '+bounds[1]+'.');
 if(el.step==='1'&&!Number.isInteger(n))throw Error(el.dataset.label+' must be a whole number.');
 v[id]=n;
 }
 if(v.platform+v.management>=100)throw Error('Combined platform and management fees must be below 100%.');
 if(v.offMonths+v.peakMonths>12)throw Error('Off-season and peak-season months cannot exceed 12.');
 return v;
}
/* Cleaning fees and cleaning expenses are spread over average stay length. Monthly fixed costs
 are paid even at 0% occupancy. Percentage fees apply to nighttime revenue AND guest cleaning revenue. */
function contribution(v,nightly){
 const grossPerNight=nightly+v.guestCleaning/v.stay;
 const feesPerNight=grossPerNight*(v.platform+v.management)/100;
 const variablePerNight=v.nightVariable+(v.cleaner+v.supplies)/v.stay;
 return {grossPerNight,feesPerNight,variablePerNight,netPerNight:grossPerNight-feesPerNight-variablePerNight};
}
function atOccupancy(v,rate,occupancy){
 const booked=v.nights*occupancy/100;
 const n=contribution(v,rate),gross=booked*n.grossPerNight;
 const fees=booked*n.feesPerNight,variable=booked*n.variablePerNight;
 const fixed=v.rent+v.utilities+v.insurance+v.overhead;
 const profit=gross-fees-variable-fixed;
 return {booked,stays:booked/v.stay,gross,fees,variable,fixed,profit,netContribution:booked*n.netPerNight,perNight:n.netPerNight};
}
function calculate(v){
 if(v.platform+v.management>=100||v.offMonths+v.peakMonths>12||v.stay<=0||v.nights<=0)throw Error('Invalid scenario. Check availability, fees, and season months.');
 const base=atOccupancy(v,v.adr,v.occupancy),c=contribution(v,v.adr),fixed=base.fixed;
 const viable=c.netPerNight>0;
 const rawNights=viable?fixed/c.netPerNight:Infinity;
 const exactOccupancy=viable?rawNights/v.nights*100:Infinity;
 const roundedNights=viable?Math.ceil(rawNights-1e-10):Infinity;
 const feasible=viable&&roundedNights<=v.nights;
 const breakEvenNightly=v.occupancy>0 ? Math.max(0,(
   fixed/(v.nights*v.occupancy/100)+v.nightVariable+(v.cleaner+v.supplies)/v.stay
 )/(1-(v.platform+v.management)/100)-v.guestCleaning/v.stay) : Infinity;
 const off=atOccupancy(v,v.adr*v.offPrice/100,v.offOccupancy);
 const peak=atOccupancy(v,v.adr*v.peakPrice/100,v.peakOccupancy);
 const normalMonths=12-v.offMonths-v.peakMonths;
 const annualProfit=off.profit*v.offMonths+base.profit*normalMonths+peak.profit*v.peakMonths;
 const annualGross=off.gross*v.offMonths+base.gross*normalMonths+peak.gross*v.peakMonths;
 const annualBooked=off.booked*v.offMonths+base.booked*normalMonths+peak.booked*v.peakMonths;
 return {base,c,fixed,viable,rawNights,exactOccupancy,roundedNights,feasible,breakEvenNightly,off,peak,normalMonths,annualProfit,annualGross,annualBooked};
}
window.STROccupancyMath={contribution,atOccupancy,calculate};
const fmt=(n,dec=0)=>new Intl.NumberFormat('en-US',{maximumFractionDigits:dec,minimumFractionDigits:dec}).format(n);
const money=(v,n)=>new Intl.NumberFormat('en-US',{style:'currency',currency:v.currency,maximumFractionDigits:0}).format(n);
const svgNS='http://www.w3.org/2000/svg';
function node(tag,attrs={},txt){
 const x=document.createElementNS(svgNS,tag);
 for(const [k,v] of Object.entries(attrs))x.setAttribute(k,String(v));
 if(txt!==undefined)x.textContent=txt;return x;
}
function text(id,t){$(id).textContent=t;}
function drawProfitGraph(v,out){
 const el=$('profit-chart');el.replaceChildren();
 el.append(node('title',{id:'profitChartTitle'},'Monthly profit versus booked-night occupancy'));
 el.append(node('desc',{id:'profitChartDesc'},'Estimated monthly operating profit from zero to 100 percent occupancy using selected nightly rate and costs.'));
 const xy=[];for(let occ=0;occ<=100;occ+=5)xy.push({occ,profit:atOccupancy(v,v.adr,occ).profit});
 const min=Math.min(0,...xy.map(a=>a.profit)),max=Math.max(0,...xy.map(a=>a.profit));
 const low=min===max?min-1:min,high=min===max?max+1:max;
 const left=78,right=598,top=20,bottom=208;
 const px=occ=>left+occ/100*(right-left);
 const py=profit=>bottom-(profit-low)/(high-low)*(bottom-top);
 for(let i=0;i<=4;i++){const val=low+(high-low)*i/4;const y=py(val);el.append(node('line',{x1:left,y1:y,x2:right,y2:y,stroke:'#e4eafa','stroke-width':'1'}));el.append(node('text',{x:left-11,y:y+4,'text-anchor':'end',fill:'#70809a','font-size':'11'},fmt(val,0)));}
 el.append(node('line',{x1:left,x2:right,y1:py(0),y2:py(0),stroke:'#8098be','stroke-dasharray':'4 4'}));
 const path=xy.map((a,i)=>(i?'L':'M')+px(a.occ).toFixed(2)+','+py(a.profit).toFixed(2)).join(' ');
 el.append(node('path',{d:path,stroke:'#296eec','stroke-width':'4','stroke-linejoin':'round','stroke-linecap':'round',fill:'none'}));
 const base=out.base;
 el.append(node('circle',{cx:px(v.occupancy),cy:py(base.profit),r:'6',fill:base.profit>=0?'#059a83':'#c33d58',stroke:'#fff','stroke-width':'2.5'}));
 if(out.feasible){const breakX=px(out.exactOccupancy);el.append(node('line',{x1:breakX,x2:breakX,y1:top,y2:bottom,stroke:'#7558d3','stroke-dasharray':'6 5','stroke-width':'2'}));el.append(node('text',{x:Math.min(right-10,breakX+6),y:30,'text-anchor':breakX>485?'end':'start',fill:'#7251d1','font-size':'11','font-weight':'750'},'Break-even '+fmt(out.exactOccupancy,1)+'%'));}
 for(let occ=0;occ<=100;occ+=20)el.append(node('text',{x:px(occ),y:230,'text-anchor':'middle',fill:'#6f7d92','font-size':'11'},occ+'%'));
 el.append(node('text',{x:338,y:251,'text-anchor':'middle',fill:'#718199','font-size':'11'},'Occupancy of rentable nights'));
}
function drawSeason(v,r){
 const el=$('season-chart');el.replaceChildren();el.append(node('title',{id:'seasonChartTitle'},'Monthly contribution to yearly operating profit by season'));
 el.append(node('desc',{id:'seasonChartDesc'},'Monthly profit or loss for off-season, normal season and peak season at specified rates and occupancy.'));
 const rows=[['Off-season',r.off.profit,v.offMonths],['Normal',r.base.profit,r.normalMonths],['Peak',r.peak.profit,v.peakMonths]];
 const peak=Math.max(1,...rows.map(x=>Math.abs(x[1]))),half=180,center=316,barMax=half-15;
 el.append(node('line',{x1:center,x2:center,y1:14,y2:159,stroke:'#bac6d9','stroke-width':'1.8'}));
 rows.forEach((row,i)=>{
  const y=24+i*49,positive=row[1]>=0,w=Math.abs(row[1])/peak*barMax;
  el.append(node('text',{x:10,y:y+11,fill:'#62758b','font-size':'12','font-weight':650},row[0]));
  el.append(node('text',{x:10,y:y+27,fill:'#94a2b5','font-size':'10'},row[2]+' months / year'));
  el.append(node('rect',{x:positive?center:center-w,y:y-2,width:w,height:24,rx:4,fill:positive?'#10a390':'#d65468'}));
  el.append(node('text',{x:positive?center+w+8:center-w-8,y:y+14,'text-anchor':positive?'start':'end',fill:positive?'#108977':'#b63a52','font-size':'12','font-weight':800},money(v,row[1])));
 });
}
function errorReset(){
 ['monthly','percent','nightsReq','available','bookingCount','netPerNight','fees','fixed','gross','variable','nightlyBreak','annualProfit','annualGross','annualNights','normalMonths'].forEach(id=>text(id,'—'));
 ['profit-chart','season-chart'].forEach(id=>$(id).replaceChildren());
 $('feedback').textContent='Correct the input to see a valid result.';$('status').className='status';
}
let last;
function render(){
 try{
  const v=read(),r=calculate(v),b=r.base;
  if(!Number.isFinite(r.annualProfit)||!Number.isFinite(r.annualGross)||!Number.isFinite(b.profit))throw Error('Calculation overflow. Reduce large values.');
  last={v,r};text('error','');text('monthly',money(v,b.profit));text('percent',!r.viable?'Not achievable':fmt(r.exactOccupancy,1)+'%');
  text('nightsReq',!r.viable?'Not achievable':fmt(r.roundedNights)+' booked nights');
  text('available',fmt(v.nights)+' rentable nights');
  text('bookingCount',fmt(b.stays,1)+' stays');text('netPerNight',money(v,r.c.netPerNight));
  text('fees',money(v,b.fees));text('fixed',money(v,b.fixed));text('gross',money(v,b.gross));text('variable',money(v,b.variable));
  text('nightlyBreak',Number.isFinite(r.breakEvenNightly)?money(v,r.breakEvenNightly):'No booked nights');
  text('annualProfit',money(v,r.annualProfit));text('annualGross',money(v,r.annualGross));
  text('annualNights',fmt(r.annualBooked,1)+' nights');text('normalMonths',r.normalMonths+' normal months');
  const status=$('status');
  status.className='status '+(b.profit>=0?'positive':'negative');
  text('statusHeading',!r.viable?'BREAK-EVEN IMPOSSIBLE':!r.feasible?'BREAK-EVEN EXCEEDS AVAILABLE NIGHTS':b.profit>=0?'PROFITABLE AT SELECTED OCCUPANCY':'BELOW BREAK-EVEN OCCUPANCY');
  text('statusSummary',!r.viable?'Your costs per booked night are at least as high as revenue after fees. Raise pricing or reduce variable costs.':!r.feasible?'At this rate and cost structure, even selling every available night would not cover fixed expenses.':b.profit>=0?'Your chosen occupancy covers estimated monthly operating cash costs.':'To cover monthly operating cash costs, you need approximately '+fmt(r.roundedNights)+' of '+v.nights+' rentable nights booked.');
  const warn=$('feedback');
  warn.textContent='This is a cash-flow occupancy model, not rental investment ROI. The forecast assumes cleaning fees and turnover scale with booked nights and average stay; season periods add to 12 months. VAT/GST, income tax, capex, financing principal versus interest, and regulatory limits need separate review.';
  drawProfitGraph(v,r);drawSeason(v,r);
 }catch(e){last=null;text('error',e.message);errorReset();}
}
const rows=()=>{
 const {v,r}=last,b=r.base;
 return [['Metric','Value'],['Currency',v.currency],['Available nights per month',v.nights],['Nightly price',v.adr],['Base occupancy %',v.occupancy],['Average stay length',v.stay],['Cleaning fee paid by guest per stay',v.guestCleaning],['Cleaner cost per stay',v.cleaner],['Supplies per stay',v.supplies],['Variable cost per booked night',v.nightVariable],['Platform host fee %',v.platform],['Management fee %',v.management],['Monthly fixed costs',r.fixed],['Estimated monthly gross revenue',b.gross],['Estimated monthly operating profit',b.profit],['Contribution per booked night',r.c.netPerNight],['Break-even occupancy percent',r.viable?r.exactOccupancy:'Not achievable'],['Break-even booked nights',r.viable?r.roundedNights:'Not achievable'],['Break-even feasible',r.feasible],['Minimum nightly price at base occupancy',r.breakEvenNightly],['Off season months',v.offMonths],['Off season occupancy',v.offOccupancy],['Off season rate multiplier %',v.offPrice],['Peak season months',v.peakMonths],['Peak season occupancy',v.peakOccupancy],['Peak season rate multiplier %',v.peakPrice],['Estimated annual revenue',r.annualGross],['Estimated annual operating profit',r.annualProfit],['Method','Fractional stays and booked nights used for average expected values; linearized fees and costs']];
};
function exportCSV(){
 if(!last)return;const csv=rows().map(row=>row.map(value=>'"'+String(value).replace(/"/g,'""')+'"').join(',')).join('\r\n');
 const uri=URL.createObjectURL(new Blob(['\ufeff'+csv],{type:'text/csv;charset=utf-8'})),a=document.createElement('a');a.href=uri;a.download='short-term-rental-occupancy-break-even.csv';document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(uri),1000);
}
function copy(){
 if(!last)return;const {v,r}=last;
 const s=['Short-Term Rental Break-Even Calculator','https://returnoninvestmentcalculator.in/airbnb-occupancy-break-even-calculator/','Nightly price: '+money(v,v.adr),'Base occupancy: '+v.occupancy+'%','Break-even occupancy: '+(r.viable?fmt(r.exactOccupancy,1)+'%':'Not achievable'),'Break-even nights: '+(r.viable?r.roundedNights:'Not achievable'),'Estimated monthly profit: '+money(v,r.base.profit),'Estimated annual profit: '+money(v,r.annualProfit),'Educational assumptions; not investment advice.'].join('\n');
 if(navigator.clipboard?.writeText)navigator.clipboard.writeText(s).then(()=>text('error','Summary copied.')).catch(()=>text('error','Clipboard permission denied.'));else text('error','Clipboard unavailable in this browser.');
}
$('rental-form').addEventListener('input',render);
$('rental-form').addEventListener('change',render);
$('rental-form').addEventListener('submit',e=>{e.preventDefault();render();});
$('reset').addEventListener('click',()=>{ids.forEach(id=>$(id).value=defaults[id]);render();});
$('csv').addEventListener('click',exportCSV);
$('copy').addEventListener('click',copy);
$('print').addEventListener('click',()=>window.print());
render();
})();