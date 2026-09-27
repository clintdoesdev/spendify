import type { ExclusionReason, InflowSource } from "@/lib/inflow/types";

// Validated as a set against the dark surface (#16161e): adjacent CVD ΔE ≥ 8.4,
// normal-vision ΔE ≥ 19.3, all ≥ 3:1 contrast. Keep this order — colour follows the source.
export const sourceMeta: Record<InflowSource, { label: string; short: string; color: string }> = {
  salary: { label: "Salary", short: "Salary", color: "#7c6fff" },
  business: { label: "Business & freelance", short: "Business", color: "#d95926" },
  family: { label: "Family & gifts", short: "Family", color: "#199e70" },
  returns: { label: "Interest & returns", short: "Returns", color: "#c98500" },
  other: { label: "Other inflows", short: "Other", color: "#d55181" },
};

export const reasonMeta: Record<ExclusionReason, { label: string; hint: string }> = {
  self_transfer: {
    label: "Transfers between your accounts",
    hint: "Matched to a debit on another bank you linked",
  },
  unlinked_own_account: {
    label: "From your unlinked accounts",
    hint: "Sent in your own name from a bank you haven't added",
  },
  savings_return: {
    label: "Savings & ajo payouts",
    hint: "Your own money coming back from PiggyVest, ajo, esusu",
  },
  reversal: { label: "Reversals", hint: "Failed transfers that bounced back" },
  refund: { label: "Refunds", hint: "Money returned by merchants" },
  loan: { label: "Loan disbursements", hint: "Borrowed money — it has to go back" },
};
