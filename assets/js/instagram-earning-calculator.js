(() => {
'use strict';
const $ = id => document.getElementById(id);
const ids = ['currency','followers','reelViews','postReach','storyReach','avgLikes','avgComments','brandCpm','reelDeals','photoDeals','carouselDeals','storyDeals','usageRights','exclusivity','partnershipAds','productionFee','revisionFee','affiliateClicks','affiliateConversion','orderValue','commission','giftsIncome','subscribers','subscriptionPrice','subscriptionShare','productSales','productProfit','bonusIncome','otherIncome'];
const num = id => {
  const el=$(id); if(!el) return 0;
  const value=Number(el.value);
  return Number.isFinite(value) && value>=0 ? value : 0;
};
const clamp=(v,min,max)=>Math.min(max,Math.max(min,v));
const money=(value)=>{
  const currency=$('currency').value;
  try{return new Intl.NumberFormat(currency==='INR'?'en-IN':'en-US',{style:'currency',currency:currency,maximumFractionDigits:0}).format(Number.isFinite(value)?value:0);}
  catch(e){return (currency==='INR'?'₹':'$')+Math.round(value).toLocaleString();}
};
const pct=v=>(Number.isFinite(v)?v:0).toFixed(2)+'%';
const set=(id,value)=>{const el=$(id);if(el)el.textContent=value;};
const safeNum=id=>Math.max(0,num(id));
function calculate(){
  const followers=safeNum('followers');
  const engagement=followers>0?((safeNum('avgLikes')+safeNum('avgComments'))/followers)*100:0;
  const engagementFactor=clamp(1+((engagement-2)*0.05),0.8,1.3);
  const cpm=safeNum('brandCpm');
  const rights=(safeNum('usageRights')+safeNum('exclusivity')+safeNum('partnershipAds'))/100;
  const fixed=safeNum('productionFee')+safeNum('revisionFee');
  const quote=(reach)=>((reach/1000)*cpm*engagementFactor*(1+rights))+fixed;
  const rates={
    'Sponsored Reel':quote(safeNum('reelViews')),
    'Sponsored photo post':quote(safeNum('postReach')),
    'Sponsored carousel':quote(safeNum('postReach')),
    'Sponsored Story set':quote(safeNum('storyReach'))
  };
  const brand={
    'Sponsored Reels':rates['Sponsored Reel']*safeNum('reelDeals'),
    'Sponsored photo posts':rates['Sponsored photo post']*safeNum('photoDeals'),
    'Sponsored carousels':rates['Sponsored carousel']*safeNum('carouselDeals'),
    'Sponsored Story sets':rates['Sponsored Story set']*safeNum('storyDeals')
  };
  const brandTotal=Object.values(brand).reduce((a,b)=>a+b,0);
  const affiliate=safeNum('affiliateClicks')*(safeNum('affiliateConversion')/100)*safeNum('orderValue')*(safeNum('commission')/100);
  const gifts=safeNum('giftsIncome');
  const subscriptions=safeNum('subscribers')*safeNum('subscriptionPrice')*(safeNum('subscriptionShare')/100);
  const ownProducts=safeNum('productSales')*safeNum('productProfit');
  const bonus=safeNum('bonusIncome');
  const other=safeNum('otherIncome');
  const breakdown=[
    ['Brand collaborations',brandTotal],
    ['Affiliate commissions',affiliate],
    ['Gifts / fan support',gifts],
    ['Subscriptions',subscriptions],
    ['Own products / services',ownProducts],
    ['Bonuses / other eligible payouts',bonus],
    ['Other creator income',other]
  ];
  const nonBrand=affiliate+gifts+subscriptions+ownProducts+bonus+other;
  const expected=brandTotal+nonBrand;
  const low=brandTotal*0.8+nonBrand;
  const high=brandTotal*1.2+nonBrand;
  set('monthlyTotal',money(expected));
  set('annualTotal','Annualised estimate: '+money(expected*12)+' · before taxes and business expenses');
  set('lowTotal',money(low));set('expectedTotal',money(expected));set('highTotal',money(high));
  set('engagementRate',pct(engagement));set('brandTotal',money(brandTotal));set('otherTotal',money(nonBrand));
  $('breakdownBody').innerHTML=breakdown.map(row=>'<tr><td>'+row[0]+'</td><td>'+money(row[1])+'</td></tr>').join('')+
    '<tr><td><strong>Total expected income</strong></td><td><strong>'+money(expected)+'</strong></td></tr>';
  $('rateCardBody').innerHTML=Object.entries(rates).map(row=>'<tr><td>'+row[0]+'</td><td>'+money(row[1])+'</td></tr>').join('');
  const positive=breakdown.filter(row=>row[1]>0);
  const max=Math.max(1,...positive.map(row=>row[1]));
  $('incomeBars').innerHTML=positive.length?positive.map(row=>'<div class="bar-row"><span>'+row[0]+'</span><div class="bar-track"><div class="bar-fill" style="width:'+((row[1]/max)*100).toFixed(1)+'%"></div></div><span class="bar-value">'+money(row[1])+'</span></div>').join(''):'<p class="muted">Enter your income assumptions to see the income mix.</p>';
  let notes=[];
  if(followers===0)notes.push('Add your follower count to calculate follower-based engagement.');
  if(cpm===0)notes.push('Brand-deal estimates are zero until you enter a brand CPM assumption.');
  if(brandTotal===0)notes.push('Add typical reach, a brand CPM and monthly sponsored deliverables to estimate brand income.');
  notes.push('Low/high scenarios change only estimated brand-deal income by ±20%; other sources use the values you entered.');
  notes.push('Feature availability and eligibility are account-specific. Confirm Gifts, Subscriptions and any bonus inside your Professional Dashboard.');
  set('resultNote',notes.join(' '));
  window.__instagramEarningSummary={currency:$('currency').value,expected:expected,low:low,high:high,breakdown:breakdown,rates:rates,engagement:engagement};
}
function reset(){
  const defaults={
    currency:'INR',followers:'10000',reelViews:'8000',postReach:'3000',storyReach:'1500',avgLikes:'500',avgComments:'35',brandCpm:'500',
    reelDeals:'2',photoDeals:'0',carouselDeals:'1',storyDeals:'2',usageRights:'20',exclusivity:'15',partnershipAds:'20',productionFee:'0',revisionFee:'0',
    affiliateClicks:'500',affiliateConversion:'2',orderValue:'1500',commission:'8',giftsIncome:'0',subscribers:'0',subscriptionPrice:'0',subscriptionShare:'100',
    productSales:'0',productProfit:'0',bonusIncome:'0',otherIncome:'0'
  };
  Object.entries(defaults).forEach(([id,value])=>$(id).value=value);
  calculate();
}
ids.forEach(id=>{
  const el=$(id);
  if(el)el.addEventListener('input',calculate);
  if(el && el.tagName==='SELECT')el.addEventListener('change',calculate);
});
$('copyResults').addEventListener('click',()=>{
  const s=window.__instagramEarningSummary;
  const textOut='Instagram income estimate\nExpected monthly: '+money(s.expected)+'\nLow monthly: '+money(s.low)+'\nHigh monthly: '+money(s.high)+'\nFollower-based engagement: '+pct(s.engagement)+'\n\n'+s.breakdown.map(r=>r[0]+': '+money(r[1])).join('\n')+'\n\nEstimates only; not guaranteed income or an official Instagram payout rate.';
  if(navigator.clipboard && navigator.clipboard.writeText){
    navigator.clipboard.writeText(textOut).then(()=>{set('copyResults','Copied!');setTimeout(()=>set('copyResults','Copy income summary'),1800);}).catch(()=>window.prompt('Copy your summary:',textOut));
  }else window.prompt('Copy your summary:',textOut);
});
$('printResults').addEventListener('click',()=>window.print());
$('resetAll').addEventListener('click',reset);
calculate();
})();