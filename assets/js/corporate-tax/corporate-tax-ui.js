(function(){
"use strict";
const $=id=>document.getElementById(id),form=$("corp-form"),year=$("taxYear"),type=$("companyType"),regime=$("regime");
const fmt=n=>"₹"+Math.round(n).toLocaleString("en-IN");
function toggle(){
 const foreign=type.value==="foreign",s201=regime.value==="s201";
 $("regime-wrap").hidden=foreign;$("turnover-wrap").hidden=foreign||regime.value!=="standard";
 $("s201-fields").hidden=foreign||!s201;$("profit-wrap").hidden=!foreign&&!s201;
 $("mat-fields").hidden=foreign&&false;
 $("mat-head").hidden=foreign===false&&regime.value!=="standard"&&regime.value!=="s199";
 $("bookProfit").disabled=foreign?false:regime.value==="s200"||regime.value==="s201";
 $("matCredit").disabled=foreign||!(regime.value==="s200"||regime.value==="s201")||year.value!=="TY2026-27";
 if(foreign)regime.value="standard";
 const legacy=year.value==="AY2026-27";
 const opts=regime.options;
 opts[1].text=legacy?"Concessional domestic regime – 22% (Section 115BAA)":"Concessional domestic regime – 22% (Section 200)";
 opts[2].text=legacy?"Eligible new manufacturing company – Section 115BAB":"Eligible new manufacturing company – Section 201";
 opts[3].text=legacy?"Eligible manufacturing company – 25% (Section 115BA)":"Eligible manufacturing company – 25% (Section 199)";
 $("regime-hint").textContent=year.value==="TY2026-27"?"Section 200: 22%; Section 201: qualifying new manufacturing companies; Section 199: qualifying manufacturing companies.":"Legacy equivalents: Sections 115BAA (22%), 115BAB (eligible manufacturing) and 115BA (25% manufacturing). MAT is 15% for this period.";
}
function row(label,value){return "<tr><td>"+label+"</td><td>"+fmt(value)+"</td></tr>";}
type.addEventListener("change",toggle);regime.addEventListener("change",toggle);year.addEventListener("change",toggle);
form.addEventListener("submit",e=>{
 e.preventDefault();const err=$("error");err.classList.remove("show");
 try{
  const key=year.value,rules=window.CORPORATE_TAX_RULES[key];
  const data=window.CorporateTaxEngine.calculate({companyType:type.value,regime:regime.value,taxableIncome:$("taxableIncome").value,turnover:$("turnover").value,bookProfit:$("bookProfit").value,matCredit:$("matCredit").value,manufacturingIncome:$("manufacturingIncome").value,otherIncome201:$("otherIncome201").value},rules);
  const t=data.selected,base=t.baseTax,sur=t.surcharge,cess=t.cess,total=t.total;
  $("total-tax").textContent=fmt(total);$("effective-rate").textContent="Applicable basic rate: "+data.rateLabel+" · "+data.period+" · "+data.act;
  $("base-tax").textContent=fmt(base);$("surcharge").textContent=fmt(sur);$("cess").textContent=fmt(cess);$("mat-tax").textContent=data.matApplicable&&data.mat?fmt(data.mat.total):"Not applicable";
  $("mat-used").textContent=fmt(data.matCreditUsed);$("effective").textContent=(total/data.taxableIncome*100).toFixed(2)+"%";
  let html=row("Taxable income",data.taxableIncome)+row("Basic income tax",base)+row("Surcharge ("+t.surchargeRate+"%)",sur);
  if(t.surchargeRelief)html+=row("Marginal relief on surcharge",-t.surchargeRelief);
  html+=row("Health & Education Cess ("+data.cessRate+"%)",cess);
  if(data.matApplicable&&data.mat){html+=row("MAT rate",data.matRate)+"<tr><td>MAT liability including surcharge and cess</td><td>"+fmt(data.mat.total)+"</td></tr>";html+="<tr><td>Tax selected after normal tax vs MAT comparison</td><td>"+fmt(Math.max(data.normal.total,data.mat.total))+"</td></tr>";}
  if(data.matCreditUsed)html+=row("Eligible brought-forward MAT credit used",-data.matCreditUsed);
  if(data.rateBreakdown.length)data.rateBreakdown.forEach(x=>html+=row(x.label,x.value));
  html+="<tr><th>Estimated tax payable</th><th>"+fmt(total)+"</th></tr>";
  $("breakdown").innerHTML=html;$("result").classList.add("show");$("result").scrollIntoView({behavior:"smooth",block:"nearest"});
 }catch(ex){err.textContent=ex.message||"Please check the entered values.";err.classList.add("show");$("result").classList.remove("show");}
});
$("reset").addEventListener("click",()=>{setTimeout(()=>{toggle();$("result").classList.remove("show");$("error").classList.remove("show");},0);});
$("print").addEventListener("click",()=>window.print());
toggle();
})();