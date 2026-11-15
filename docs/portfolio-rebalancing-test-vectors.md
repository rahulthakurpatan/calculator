# Portfolio rebalancing independent test vectors (2026-11-15)

- Full mode: $7,000 stocks / $3,000 bonds, 60/40 targets, no cash -> sell $1,000 stocks; buy $1,000 bonds; after $6,000 / $4,000.
- Full mode with $2,000 cash -> buy $200 stocks; buy $1,800 bonds; after $7,200 / $4,800.
- Buy-only mode with $2,000 cash -> buy $200 stocks; buy $1,800 bonds; after 60/40.
- Buy-only with $500 cash -> buy $0 stocks; buy $500 bonds; after $7,000 / $3,500, remaining drift 6.6667 pp.
- Target percentages must sum to 100; negative holdings, negative cash, blank values and zero-value portfolio are rejected.
- Full-mode net trades sum to new cash; buy-only trades are non-negative and sum to new cash.

Competitor references: https://gosuoo.com/tools/portfolio-rebalancing-calculator and https://www.gngresearch.com/tools/portfolio-rebalancing-calculator/ . No keyword volumes or CPC assumed.
