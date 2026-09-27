import type { ExclusionReason, InflowSource } from "@/lib/inflow/types";

export const sourceLabel: Record<InflowSource, string> = {
  salary: "Salary",
  business: "Business & freelance",
  family: "Family & gifts",
  returns: "Interest & returns",
  other: "Other inflows",
};

export const reasonMeta: Record<ExclusionReason, { label: string; hint: string }> = {
  self_transfer: {
    label: "Transfers between your accounts",
    hint: "Matched to the same amount leaving another bank you linked, within 2 days.",
  },
  unlinked_own_account: {
    label: "From your own unlinked banks",
    hint: "Sent in your name from a bank you haven't added to Spendify yet.",
  },
  savings_return: {
    label: "Savings & ajo payouts",
    hint: "Your own money coming back from PiggyVest, ajo or esusu.",
  },
  reversal: { label: "Reversals", hint: "Failed transfers that bounced back to you." },
  refund: { label: "Refunds", hint: "Money merchants returned for orders." },
  loan: { label: "Loan disbursements", hint: "Borrowed money. It has to go back." },
};

/** Bank marks keep their own colour, the one place colour is allowed outside violet. */
export const bankTint: Record<string, string> = {
  gtb: "#e35205",
  kuda: "#40196d",
  opay: "#12b886",
  moniepoint: "#0357ee",
};
