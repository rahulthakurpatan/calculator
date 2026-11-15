# Rental property independent QA vectors
- Cash purchase $100,000; monthly rent $1,000; vacancy 0%; no operating expenses; no mortgage; upfront cash $100,000 => NOI $12,000, cap rate 12%, cash-on-cash 12%, annual cash flow $12,000, DSCR N/A.
- Same property with 10% vacancy => NOI $10,800, cap rate 10.8% before expenses.
- $120,000 financed at 0% over 10 years => monthly payment $1,000; annual debt service $12,000.
- Operating expenses exclude financing. Closing costs and renovation are included in initial cash invested only.
- All percentage expenses are assessed against gross scheduled income before vacancy; this is stated visibly.
- Zero upfront cash invested produces an explicit validation error, rather than a misleading infinite cash-on-cash return.
- Invalid negative prices, rents, terms, percentage values and blank inputs are rejected.

Competitor research: https://www.dealquanta.com/rental-calculator and https://rent-forms.com/landlord-tools/cap-rate-calculator . Do not invent search volume/CPC.
