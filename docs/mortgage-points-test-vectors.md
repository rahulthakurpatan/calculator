# Mortgage discount points QA vectors
- Principal $120,000; 0% annual rate; 10 years => $1,000 monthly payment, $0 ending balance after 120 payments.
- Principal $300,000; 30 years; 6.75% baseline and 6.25% points option; 2 points => $6,000 upfront, lower monthly payment and smaller remaining principal at a fixed horizon.
- Identical interest rates and positive points cost => no payment-only break-even.
- Identical rates with no net upfront cost => break-even at month 0.
- Negative rates, negative cash amounts, zero loan, term above 50 years and horizon exceeding term are rejected.
- Payments-only and balance-adjusted comparison are separately labeled; both exclude tax and time value of money.

Research references: https://www.consumerfinance.gov/owning-a-home/loan-estimate/ ; https://www.consumerfinance.gov/ask-cfpb/what-are-discount-points-and-lender-credits-and-how-do-they-work-en-136/
