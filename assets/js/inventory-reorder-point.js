/* Inventory Reorder Point & Safety Stock Calculator - InvestCalc, 2026.
   Pure calculation methods exposed for QA; no network or external chart dependencies. */
(function(){
'use strict';
const Z={90:1.2815515655446004,95:1.6448536269514722,97.5:1.959963984540054,98:2.053748910631823,99:2.3263478740408408,99.5:2.5758293035489004};
const DEFAULTS={currency:'USD',mean:'35',sd:'12',lead:'9',leadSd:'2',service:'95',onHand:'360',onOrder:'60',backorders:'15',committed:'0',coverage:'14',pack:'12',unitCost:'18',history:''};
const CONTROLS=Object.keys(DEFAULTS);
const $=id=>document.getElementById(id);
const svgNS='http://www.w3.org/2000/svg';
function parseHistory(raw){
 const str=raw.trim();if(!str)return null;
 const cells=str.split(/[\s,;]+/).filter(Boolean);
 if(cells.length<2||cells.length>3660)throw Error('Historical sales must contain 2–3,660 daily quantities (no headings or dates).');
 const nums=cells.map(s=>{if(!/^(?:\d+(?:\.\d*)?|\.\d+)$/.test(s))throw Error('Daily sales history must contain numbers only, separated by commas, spaces or new lines.');const n=Number(s);if(!Number.isFinite(n)||n>10000000)throw Error('Historical daily units must be between 0 and 10 million.');return n;});
 const mean=nums.reduce((s,n)=>s+n,0)/nums.length;
 const variance=nums.reduce((s,n)=>s+(n-mean)*(n-mean),0)/(nums.length-1);
 return {count:nums.length,mean:mean,sd:Math.sqrt(variance)};
}
function compute(v){
 const mean=v.history? v.history.mean:v.mean;
 const sd=v.history? v.history.sd:v.sd;
 const z=Z[v.service];
 if(!Number.isFinite(mean)||!Number.isFinite(sd)||mean<0||sd<0||!Number.isFinite(z))throw Error('Invalid demand or service level.');
 const ltDemand=mean*v.lead;
 const ltSigma=Math.sqrt(v.lead*sd*sd+mean*mean*v.leadSd*v.leadSd);
 const rawSafety=z*ltSigma;
 const safety=Math.ceil(rawSafety-1e-10);
 const rop=Math.ceil(ltDemand+rawSafety-1e-10);
 const position=v.onHand+v.onOrder-v.backorders-v.committed;
 const trigger=position<=rop&&(mean>0||sd>0);
 const target=Math.ceil(rop+mean*v.coverage-1e-10);
 const shortfall=Math.max(0,target-position);
 const quantity=trigger?Math.ceil(Math.max(v.pack,shortfall)/v.pack)*v.pack:0;
 const inventoryAvailable=Math.max(0,v.onHand-v.backorders-v.committed);
 const daysCover=mean>0?inventoryAvailable/mean:null;
 const daysToReorder=mean>0?Math.max(0,(position-rop)/mean):null;
 return {mean:mean,sd:sd,z:z,ltDemand:ltDemand,ltSigma:ltSigma,rawSafety:rawSafety,safety:safety,rop:rop,position:position,trigger:trigger,target:target,shortfall:shortfall,quantity:quantity,inventoryAvailable:inventoryAvailable,daysCover:daysCover,daysToReorder:daysToReorder,safetyValue:safety*v.unitCost};
}
window.InventoryReorderMath={Z:Z,compute:compute,parseHistory:parseHistory};
function read(){
 const v={};for(const k of CONTROLS){const el=$(k);if(!el)throw Error('A calculator field is missing: '+k);if(k==='history'||k==='currency'||k==='service'){v[k]=el.value;continue;}
 const txt=el.value.trim();if(!txt)throw Error('Please enter '+(el.getAttribute('data-label')||k)+'.');
 const n=Number(txt);if(!Number.isFinite(n)||n<Number(el.min)||n>Number(el.max))throw Error('Check '+(el.getAttribute('data-label')||k)+': enter a number between '+el.min+' and '+el.max+'.');
 if(el.step==='1'&&!Number.isInteger(n))throw Error((el.getAttribute('data-label')||k)+' must be a whole number.');
 v[k]=n;
 }
 if(!Object.hasOwn(Z,v.service))throw Error('Choose a valid cycle service level.');
 v.history=parseHistory(v.history);
 return v;
}
const numericFormat=(n,d=0)=>new Intl.NumberFormat('en-US',{maximumFractionDigits:d,minimumFractionDigits:d}).format(n);
const cash=(v,n)=>new Intl.NumberFormat('en-US',{style:'currency',currency:v.currency,maximumFractionDigits:2}).format(n);
function display(id,text){$(id).textContent=text;}
function svg(tag,attrs,label){
 const el=document.createElementNS(svgNS,tag);
 Object.keys(attrs||{}).forEach(k=>el.setAttribute(k,String(attrs[k])));
 if(label!==undefined)el.textContent=label;
 return el;
}
function drawInventory(v,m){
 const root=$('stock-chart');root.replaceChildren();
 root.appendChild(svg('title',{id:'stock-chart-title'},'Lead-time demand and safety stock compared with inventory position'));
 root.appendChild(svg('desc',{id:'stock-chart-desc'},'Expected lead-time demand '+numericFormat(m.ltDemand,1)+' units, safety stock '+numericFormat(m.safety)+' units, reorder point '+numericFormat(m.rop)+' units and inventory position '+numericFormat(m.position)+' units.'));
 const left=28,width=550,startY=55,height=27;
 const max=Math.max(20,m.rop*1.3,m.position>0?m.position*1.2:0);
 const x=n=>left+Math.max(0,n)/max*width;
 const lineColor='#d9e5f1';
 root.appendChild(svg('text',{x:left,y:24,fill:'#566983','font-size':13,'font-weight':700},'Reorder threshold components'));
 root.appendChild(svg('rect',{x:left,y:startY,width:width,height:height,rx:8,fill:'#eff3fa'}));
 root.appendChild(svg('rect',{x:left,y:startY,width:x(m.ltDemand)-left,height:height,rx:6,fill:'#3377f1'}));
 root.appendChild(svg('rect',{x:x(m.ltDemand),y:startY,width:Math.max(0,x(m.rop)-x(m.ltDemand)),height:height,fill:'#9c83f4'}));
 const marker=Math.max(left,Math.min(left+width,x(m.position)));
 root.appendChild(svg('line',{x1:marker,y1:startY-15,x2:marker,y2:startY+height+13,stroke:m.trigger?'#cb3f52':'#0f987e','stroke-width':3}));
 root.appendChild(svg('circle',{cx:marker,cy:startY-15,r:5,fill:m.trigger?'#cb3f52':'#0f987e'}));
 root.appendChild(svg('text',{x:marker,y:startY-22,'text-anchor':marker>460?'end':'start',fill:m.trigger?'#ae3449':'#0c846f','font-size':12,'font-weight':800},'Inventory position: '+numericFormat(m.position)));
 for(let i=0;i<=4;i++){const val=max*i/4;const px=left+i*width/4;root.appendChild(svg('line',{x1:px,y1:99,x2:px,y2:106,stroke:lineColor,'stroke-width':1}));root.appendChild(svg('text',{x:px,y:124,'text-anchor':'middle',fill:'#697993','font-size':11},numericFormat(val,0)));}
 root.appendChild(svg('text',{x:left,y:148,fill:'#3377f1','font-size':12},'● Expected demand  '+numericFormat(m.ltDemand,1)));
 root.appendChild(svg('text',{x:left+230,y:148,fill:'#7b5ad3','font-size':12},'● Safety stock  '+numericFormat(m.safety)));
 root.appendChild(svg('text',{x:left,y:173,fill:'#506481','font-size':12},'Reorder at '+numericFormat(m.rop)+' units of inventory position.'));
}
function drawSensitivity(v,m){
 const root=$('service-chart');root.replaceChildren();
 root.appendChild(svg('title',{id:'service-chart-title'},'Reorder point by cycle service level'));
 root.appendChild(svg('desc',{id:'service-chart-desc'},'Higher service level targets generally require higher safety stock and reorder points.'));
 const levels=[90,95,97.5,98,99,99.5];
 const rops=levels.map(level=>({level:level,point:Math.ceil(m.ltDemand+Z[level]*m.ltSigma-1e-10)}));
 const top=35,step=35,left=76,w=440,max=Math.max(1,Math.max(...rops.map(r=>r.point))*1.14);
 root.appendChild(svg('text',{x:9,y:20,fill:'#61738d','font-size':12,'font-weight':750},'Cycle service level'));
 rops.forEach((r,i)=>{
   const cy=top+i*step,selected=Number(v.service)===r.level;
   root.appendChild(svg('text',{x:left-12,y:cy+13,'text-anchor':'end',fill:selected?'#183b8c':'#61738d','font-size':13,'font-weight':selected?850:500},r.level+'%'));
   root.appendChild(svg('rect',{x:left,y:cy,width:w,height:22,rx:6,fill:'#eff3f9'}));
   root.appendChild(svg('rect',{x:left,y:cy,width:w*r.point/max,height:22,rx:6,fill:selected?'#1769e0':'#8aa7ed'}));
   root.appendChild(svg('text',{x:left+w+8,y:cy+15,fill:'#435775','font-size':12,'font-weight':selected?850:600},numericFormat(r.point)));
 });
}
let last=null;
function blank(){
 for(const id of ['rop','safety','order','position','expected','lt-sigma','status-head','target','cover','buffer-value','days-until','history-note'])display(id,'—');
 $('stock-chart').replaceChildren();$('service-chart').replaceChildren();$('status-box').className='status-box';display('status-desc','Correct the inputs above to see accurate results.');$('feedback').textContent='';
}
function render(){
 try{
 const v=read(),m=compute(v);
 if(!Object.values(m).filter(x=>typeof x==='number').every(Number.isFinite))throw Error('Calculation overflow. Reduce very large numbers.');
 last={v:v,m:m};display('error','');
 display('rop',numericFormat(m.rop)+' units');
 display('safety',numericFormat(m.safety)+' units');
 display('order',numericFormat(m.quantity)+' units');
 display('position',numericFormat(m.position)+' units');
 display('expected',numericFormat(m.ltDemand,1)+' units');
 display('lt-sigma',numericFormat(m.ltSigma,1)+' units');
 display('target',numericFormat(m.target)+' units');
 display('cover',m.daysCover===null?'No forecast':numericFormat(m.daysCover,1)+' days');
 display('buffer-value',cash(v,m.safetyValue));
 display('days-until',m.daysToReorder===null?'No forecast':numericFormat(m.daysToReorder,1)+' days*');
 display('history-note',v.history?'Using '+v.history.count+' historical days · average '+numericFormat(m.mean,2)+' / day · sample SD '+numericFormat(m.sd,2):'Using your manual daily demand and standard deviation inputs.');
 $('status-box').className='status-box '+(m.trigger?'is-urgent':'is-safe');
 display('status-head',m.trigger?'REORDER NOW':'STOCK POSITION ABOVE THRESHOLD');
 display('status-desc',m.trigger?'Inventory position is at or below your reorder point. Suggested order: '+numericFormat(m.quantity)+' units to reach the selected coverage target, rounded to '+numericFormat(v.pack)+'-unit packs.':'Your inventory position is '+numericFormat(Math.round(m.position-m.rop))+' units above the reorder threshold. Monitor demand and incoming order timing.');
 display('feedback',m.mean===0&&m.sd===0?'No demand was recorded: no new purchase is suggested.':m.position<0?'Inventory position is negative because backorders and commitments exceed available and incoming units. Confirm urgent orders and delivery dates.':v.onOrder>0?'Inventory position includes '+numericFormat(v.onOrder)+' units on order. Confirm they will arrive when needed; this model does not simulate receipt dates.':'Calculated as a continuous-review reorder point. Adjust input history for seasonal peaks and abnormal demand.');
 drawInventory(v,m);drawSensitivity(v,m);
 }catch(e){last=null;display('error',e.message);blank();}
}
function rows(){
 const {v,m}=last;
 return [['Metric','Value'],['Currency',v.currency],['Average demand / day',m.mean],['Daily demand SD',m.sd],['Mean lead days',v.lead],['Lead-time SD days',v.leadSd],['Cycle service level %',v.service],['Safety stock (units)',m.safety],['Lead-time demand (units)',m.ltDemand],['Lead-time demand SD',m.ltSigma],['Reorder point (units)',m.rop],['On-hand (units)',v.onHand],['On-order (units)',v.onOrder],['Backorders (units)',v.backorders],['Committed stock (units)',v.committed],['Inventory position',m.position],['Recommended order quantity (units)',m.quantity],['Target stock position (units)',m.target],['Order pack multiple',v.pack],['Estimated safety stock cost',m.safetyValue],['Selected coverage beyond lead time (days)',v.coverage],['History days (if used)',v.history?v.history.count:0],['Methodology','Normal lead-time-demand approximation; cycle service level, not fill rate']];
}
function download(){
 if(!last)return;const csv=rows().map(r=>r.map(v=>'"'+String(v).replace(/"/g,'""')+'"').join(',')).join('\r\n');
 const url=URL.createObjectURL(new Blob(['\ufeff'+csv],{type:'text/csv;charset=utf-8'}));
 const a=document.createElement('a');a.href=url;a.download='inventory-reorder-point-report.csv';document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),1000);
}
function copySummary(){
 if(!last)return;const {v,m}=last;const summary=[
 'Inventory Reorder Point & Safety Stock', 'https://returnoninvestmentcalculator.in/inventory-reorder-point-calculator/',
 'Cycle service level: '+v.service+'%',
 'Average daily demand: '+numericFormat(m.mean,2),
 'Safety stock: '+numericFormat(m.safety)+' units',
 'Reorder point: '+numericFormat(m.rop)+' units',
 'Inventory position: '+numericFormat(m.position)+' units',
 'Status: '+(m.trigger?'REORDER NOW':'ABOVE REORDER POINT'),
 'Suggested order quantity: '+numericFormat(m.quantity)+' units',
 'Target inventory position: '+numericFormat(m.target)+' units',
 'Normal-model estimates, not a guarantee of no stockouts.'
 ].join('\n');
 if(navigator.clipboard&&navigator.clipboard.writeText){navigator.clipboard.writeText(summary).then(()=>display('error','Summary copied to clipboard.')).catch(()=>display('error','Clipboard permission denied.'));}else{display('error','Clipboard not available in this browser.');}
}
$('inventory-form').addEventListener('input',render);
$('inventory-form').addEventListener('change',render);
$('inventory-form').addEventListener('submit',e=>{e.preventDefault();render();});
$('reset').addEventListener('click',()=>{CONTROLS.forEach(k=>{$(k).value=DEFAULTS[k];});render();});
$('load-sample').addEventListener('click',()=>{$('history').value='30, 42, 34, 39, 36, 50, 25, 38, 26, 41, 35, 49, 22, 34, 40, 29, 44, 27, 36, 35, 51, 28, 40, 37, 24, 38, 33, 46';render();});
$('export').addEventListener('click',download);
$('copy').addEventListener('click',copySummary);
$('print').addEventListener('click',()=>window.print());
render();
})();
