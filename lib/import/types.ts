/** One transaction read from a statement or alert, before it is saved. Amount in naira. */
export type ParsedLine = {
  date: string;
  amount: number;
  type: "credit" | "debit";
  narration: string;
  counterparty: string;
};
