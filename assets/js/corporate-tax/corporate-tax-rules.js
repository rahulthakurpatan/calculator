/* India corporate tax rules. Reviewed 7 Nov 2026 against Income-tax Act 2025 and Finance Act 2026. */
window.CORPORATE_TAX_RULES={
 "TY2026-27":{
  label:"Tax Year 2026–27",period:"1 April 2026 – 31 March 2027",act:"Income-tax Act, 2025",
  domestic:{standard:{rateLow:25,rateHigh:30,turnoverLimit:4000000000,turnoverYear:"previous year 2023–24",mat:14,surcharge:[[10000000,0],[100000000,7],[Infinity,12]]},s199:{rate:25,mat:14,surcharge:[[10000000,0],[100000000,7],[Infinity,12]]},s200:{rate:22,mat:0,surcharge:10},s201:{manufacturingRate:15,otherRate:22,mat:0,surcharge:10}},
  foreign:{rate:35,mat:14,surcharge:[[10000000,0],[100000000,2],[Infinity,5]]},
  cess:4,matCreditLimit:.25
 },
 "AY2026-27":{
  label:"FY 2025–26 / AY 2026–27",period:"1 April 2025 – 31 March 2026",act:"Income-tax Act, 1961",
  domestic:{standard:{rateLow:25,rateHigh:30,turnoverLimit:4000000000,turnoverYear:"previous year 2023–24",mat:15,surcharge:[[10000000,0],[100000000,7],[Infinity,12]]},s199:{rate:25,mat:15,surcharge:[[10000000,0],[100000000,7],[Infinity,12]]},s200:{rate:22,mat:0,surcharge:10},s201:{manufacturingRate:15,otherRate:22,mat:0,surcharge:10}},
  foreign:{rate:35,mat:15,surcharge:[[10000000,0],[100000000,2],[Infinity,5]]},
  cess:4,matCreditLimit:0
 }
};