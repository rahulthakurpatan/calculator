/* GST rate presets and effective-date notes.
 * Presets are calculation shortcuts, not HSN/SAC classification advice.
 * Current rate rationalisation generally effective 22-Sep-2025; verify product-specific
 * entries and later notifications before issuing an invoice.
 */
(() => {
'use strict';
window.GST_RULES={
 reviewed:'2026-11-07',
 generalEffectiveDate:'2025-09-22',
 currentRates:[
  {value:0,label:'0% — Nil / exempt (verify classification)'},
  {value:0.25,label:'0.25% — Specified goods'},
  {value:1,label:'1% — Specified goods'},
  {value:1.5,label:'1.5% — Specified goods'},
  {value:3,label:'3% — Specified goods'},
  {value:5,label:'5% — Merit rate'},
  {value:18,label:'18% — Standard rate'},
  {value:20,label:'20% — Specific notified entries'},
  {value:40,label:'40% — Select demerit goods'}
 ],
 historicalRates:[
  {value:12,label:'12% — Historical / specified classification'},
  {value:28,label:'28% — Historical / specified classification'}
 ],
 cessNote:'Compensation cess is separate from the GST rate and applies only to notified supplies. Enter the applicable cess rate only after checking the relevant notification.',
 rateNote:'GST rate depends on the exact HSN/SAC, description, conditions, exemptions and effective date. The rate presets do not identify the legal rate for a product or service.'
};
})();