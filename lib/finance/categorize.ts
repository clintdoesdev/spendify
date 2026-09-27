export const SPEND_CATEGORIES = [
  "Food & groceries",
  "Transport",
  "Data & airtime",
  "Bills & utilities",
  "Rent & home",
  "Shopping",
  "Health",
  "Entertainment",
  "Family & giving",
  "Savings & investments",
  "Loan repayments",
  "Cash withdrawals",
  "Bank charges",
  "Transfers out",
  "Other",
] as const;

export type SpendCategory = (typeof SPEND_CATEGORIES)[number];

/** Categories that are money moving to the user's own pots, not consumption. */
export const NON_SPEND_CATEGORIES: SpendCategory[] = ["Savings & investments"];

// First match wins, so more specific rules sit above broad ones like "TRF TO".
const rules: [SpendCategory, RegExp][] = [
  ["Bank charges", /SMS ALERT|STAMP DUTY|\bVAT\b|\bFEE\b|CHARGES?\b|COMMISSION|MAINTENANCE FEE|COT\b/],
  ["Savings & investments", /PIGGYVEST|COWRYWISE|RISEVEST|BAMBOO|CHAKA|AJO|ESUSU|TARGET SAVINGS|T-?BILL|MUTUAL FUND/],
  ["Loan repayments", /LOAN REPAY|REPAYMENT|FAIRMONEY|CARBON|PALMCREDIT|RENMONEY|BRANCH INT/],
  ["Data & airtime", /\bMTN\b|AIRTEL|\bGLO\b|9MOBILE|AIRTIME|DATA BUNDLE|\bDATA\b|SPECTRANET|SMILE/],
  ["Bills & utilities", /DSTV|GOTV|STARTIMES|IKEDC|EKEDC|AEDC|PHED|KEDCO|IBEDC|ELECTRIC|PREPAID|LAWMA|WATER BILL|\bNEPA\b|PHCN/],
  ["Rent & home", /\bRENT\b|LANDLORD|CAUTION FEE|AGENCY FEE|SERVICE CHARGE|GAS REFILL|DIESEL/],
  ["Transport", /\bUBER\b|\bBOLT\b|INDRIVE|RIDA|\bFUEL\b|PETROL|NNPC|TOTALENERGIES|\bMOBIL\b|CONOIL|ARDOVA|OANDO|BRT|COWRY CARD|TOLL/],
  ["Food & groceries", /SHOPRITE|SPAR\b|JUSTRITE|MARKET|CHOWDECK|GLOVO|JUMIA FOOD|CHICKEN REPUBLIC|\bKFC\b|DOMINO|CHOPS|RESTAURANT|EATERY|FOOD|KITCHEN|SUPERMARKET|BUKKA/],
  ["Health", /PHARM|HOSPITAL|CLINIC|\bHMO\b|MEDPLUS|HEALTH|LAB\b|DENTAL/],
  ["Entertainment", /NETFLIX|SPOTIFY|APPLE\.COM|YOUTUBE|SHOWMAX|PRIME VIDEO|CINEMA|FILMHOUSE|GENESIS|BET9JA|SPORTYBET|GAME/],
  ["Shopping", /JUMIA|KONGA|AMAZON|ALIEXPRESS|TEMU|SHEIN|\bSHOP\b|STORE|MALL|BOUTIQUE|POS PURCHASE|WEB PURCHASE/],
  ["Cash withdrawals", /\bATM\b|CASH WITHDRAWAL|POS WDL|POS WITHDRAWAL/],
  ["Family & giving", /UPKEEP|\bMUM\b|\bDAD\b|MOTHER|FATHER|FAMILY|SCHOOL FEES|TITHE|OFFERING|DONATION|CHURCH|MOSQUE|GIFT/],
  ["Transfers out", /\bTRF\b|TRANSFER|NIP\b|\bTO\b/],
];

export function categorizeDebit(narration: string): SpendCategory {
  const text = narration.toUpperCase();
  for (const [category, pattern] of rules) if (pattern.test(text)) return category;
  return "Other";
}
