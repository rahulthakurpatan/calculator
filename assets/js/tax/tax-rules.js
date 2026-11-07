/* Tax rules are isolated by period so future Finance Act changes do not require UI rewrites.
 * Verified against Income Tax Department guidance available on 7 November 2026.
 * This release covers individual taxpayers with ordinary-rate income; special-rate income is excluded.
 */
window.INCOMETAX_RULES = {
  "TY2026-27": {
    label: "Tax Year 2026–27",
    period: "1 April 2026 – 31 March 2027",
    act: "Income-tax Act, 2025",
    newRegime: {
      slabs: [[400000,0],[800000,0.05],[1200000,0.10],[1600000,0.15],[2000000,0.20],[2400000,0.25],[Infinity,0.30]],
      rebateLimit: 1200000, rebateMax: 60000, standardDeduction: 75000, surchargeCap: 0.25
    },
    oldRegime: {
      slabs: {
        below60: [[250000,0],[500000,0.05],[1000000,0.20],[Infinity,0.30]],
        senior: [[300000,0],[500000,0.05],[1000000,0.20],[Infinity,0.30]],
        superSenior: [[500000,0],[1000000,0.20],[Infinity,0.30]]
      },
      rebateLimit: 500000, rebateMax: 12500, standardDeduction: 50000, surchargeCap: 0.37
    },
    cess: 0.04,
    surcharge: [[5000000,0],[10000000,0.10],[20000000,0.15],[50000000,0.25],[Infinity,0.25]],
    oldSurcharge: [[5000000,0],[10000000,0.10],[20000000,0.15],[50000000,0.25],[Infinity,0.37]]
  },
  "AY2026-27": {
    label: "FY 2025–26 / AY 2026–27",
    period: "1 April 2025 – 31 March 2026",
    act: "Income-tax Act, 1961",
    newRegime: {
      slabs: [[400000,0],[800000,0.05],[1200000,0.10],[1600000,0.15],[2000000,0.20],[2400000,0.25],[Infinity,0.30]],
      rebateLimit: 1200000, rebateMax: 60000, standardDeduction: 75000, surchargeCap: 0.25
    },
    oldRegime: {
      slabs: {
        below60: [[250000,0],[500000,0.05],[1000000,0.20],[Infinity,0.30]],
        senior: [[300000,0],[500000,0.05],[1000000,0.20],[Infinity,0.30]],
        superSenior: [[500000,0],[1000000,0.20],[Infinity,0.30]]
      },
      rebateLimit: 500000, rebateMax: 12500, standardDeduction: 50000, surchargeCap: 0.37
    },
    cess: 0.04,
    surcharge: [[5000000,0],[10000000,0.10],[20000000,0.15],[50000000,0.25],[Infinity,0.25]]
  }
};