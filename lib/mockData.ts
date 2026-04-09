export type TransactionCategory =
  | "Income"
  | "Food & Dining"
  | "Transport"
  | "Entertainment"
  | "Utilities"
  | "Shopping"
  | "Health"
  | "Savings";

export type TransactionStatus = "Completed" | "Pending";

export type Transaction = {
  id: string;
  merchant: string;
  category: TransactionCategory;
  amount: number;
  status: TransactionStatus;
  date: string;
  relativeDate: string;
};

export type Budget = {
  id: string;
  category: Exclude<TransactionCategory, "Income" | "Savings">;
  limit: number;
  spent: number;
  color: string;
  status: "On track" | "Over budget";
  trend: number[];
};

export type Goal = {
  id: string;
  name: string;
  icon: "shield" | "laptop" | "plane";
  target: number;
  saved: number;
  deadline: string;
  monthlyContribution: number;
  color: string;
  status: "On track" | "Needs boost";
};

export type MonthData = {
  month: string;
  income: number;
  expenses: number;
};

export type CategoryBreakdown = {
  name: string;
  value: number;
  color: string;
};

export const monthlyOverview: MonthData[] = [
  { month: "Jan", income: 750_000, expenses: 380_000 },
  { month: "Feb", income: 820_000, expenses: 420_000 },
  { month: "Mar", income: 780_000, expenses: 350_000 },
  { month: "Apr", income: 850_000, expenses: 390_000 },
  { month: "May", income: 810_000, expenses: 410_000 },
  { month: "Jun", income: 870_000, expenses: 380_000 },
  { month: "Jul", income: 830_000, expenses: 440_000 },
  { month: "Aug", income: 890_000, expenses: 390_000 },
  { month: "Sep", income: 820_000, expenses: 420_000 },
  { month: "Oct", income: 850_000, expenses: 380_000 },
  { month: "Nov", income: 880_000, expenses: 410_000 },
  { month: "Dec", income: 850_000, expenses: 423_000 },
];

export const categoryBreakdown: CategoryBreakdown[] = [
  { name: "Food & Dining", value: 32, color: "#7C6FFF" },
  { name: "Transport", value: 18, color: "#4FEFB0" },
  { name: "Entertainment", value: 14, color: "#FFD966" },
  { name: "Utilities", value: 12, color: "#FF5C5C" },
  { name: "Shopping", value: 15, color: "#FF9F43" },
  { name: "Others", value: 9, color: "#A8A8B3" },
];

export const summaryStats = [
  {
    id: "total-balance",
    label: "Total Balance",
    value: "₦2,847,500",
    trend: "+2.4% this month",
    trendTone: "positive" as const,
    icon: "wallet" as const,
  },
  {
    id: "monthly-income",
    label: "Monthly Income",
    value: "₦850,000",
    trend: "+₦50k vs last month",
    trendTone: "positive" as const,
    icon: "arrow-up" as const,
  },
  {
    id: "monthly-expenses",
    label: "Monthly Expenses",
    value: "₦423,750",
    trend: "-₦12k vs last month",
    trendTone: "negative" as const,
    icon: "arrow-down" as const,
  },
  {
    id: "savings-rate",
    label: "Savings Rate",
    value: "50.1%",
    trend: "+3.2% vs last month",
    trendTone: "positive" as const,
    icon: "target" as const,
  },
];

export const budgets: Budget[] = [
  {
    id: "budget-food",
    category: "Food & Dining",
    limit: 120_000,
    spent: 85_000,
    color: "#FFD966",
    status: "On track",
    trend: [
      1, 2, 1, 4, 3, 5, 4, 6, 4, 7, 8, 6, 7, 8, 6, 9, 10, 12, 11, 14, 12, 13,
      15, 14, 17, 18, 19, 18, 20, 22,
    ],
  },
  {
    id: "budget-transport",
    category: "Transport",
    limit: 50_000,
    spent: 38_200,
    color: "#4FEFB0",
    status: "On track",
    trend: [
      0, 1, 0, 2, 2, 1, 3, 4, 4, 5, 3, 6, 5, 6, 7, 8, 6, 9, 9, 10, 11, 10, 12,
      13, 12, 13, 14, 15, 16, 18,
    ],
  },
  {
    id: "budget-entertainment",
    category: "Entertainment",
    limit: 40_000,
    spent: 42_000,
    color: "#FF5C5C",
    status: "Over budget",
    trend: [
      0, 0, 2, 1, 3, 4, 6, 7, 6, 8, 10, 9, 11, 12, 13, 12, 15, 18, 19, 21, 23,
      24, 24, 26, 27, 29, 30, 31, 33, 34,
    ],
  },
  {
    id: "budget-utilities",
    category: "Utilities",
    limit: 45_000,
    spent: 28_000,
    color: "#7C6FFF",
    status: "On track",
    trend: [
      0, 0, 1, 1, 1, 2, 2, 4, 3, 5, 5, 5, 6, 6, 7, 7, 9, 9, 10, 11, 12, 12, 14,
      14, 15, 16, 16, 17, 18, 19,
    ],
  },
  {
    id: "budget-shopping",
    category: "Shopping",
    limit: 80_000,
    spent: 28_500,
    color: "#FF9F43",
    status: "On track",
    trend: [
      0, 0, 0, 2, 1, 1, 3, 3, 2, 4, 4, 4, 5, 5, 6, 7, 6, 8, 8, 9, 10, 11, 12,
      12, 12, 13, 13, 14, 14, 15,
    ],
  },
  {
    id: "budget-health",
    category: "Health",
    limit: 30_000,
    spent: 0,
    color: "#4FEFB0",
    status: "On track",
    trend: Array.from({ length: 30 }, (_, index) => (index < 27 ? 0 : index - 26)),
  },
];

export const goals: Goal[] = [
  {
    id: "goal-emergency",
    name: "Emergency Fund",
    icon: "shield",
    target: 1_500_000,
    saved: 987_500,
    deadline: "Dec 2025",
    monthlyContribution: 85_000,
    color: "#7C6FFF",
    status: "On track",
  },
  {
    id: "goal-macbook",
    name: "MacBook Pro",
    icon: "laptop",
    target: 850_000,
    saved: 212_500,
    deadline: "Mar 2026",
    monthlyContribution: 50_000,
    color: "#FFD966",
    status: "Needs boost",
  },
  {
    id: "goal-dubai",
    name: "Dubai Trip",
    icon: "plane",
    target: 2_200_000,
    saved: 440_000,
    deadline: "Dec 2026",
    monthlyContribution: 120_000,
    color: "#7C6FFF",
    status: "On track",
  },
];

const rawTransactions: Array<
  [
    string,
    string,
    TransactionCategory,
    number,
    TransactionStatus,
    string,
    string,
  ]
> = [
  ["txn-001", "Shoprite", "Food & Dining", -18_500, "Completed", "2025-06-22", "Today"],
  ["txn-002", "Flutterwave Salary", "Income", 850_000, "Completed", "2025-06-21", "Yesterday"],
  ["txn-003", "Uber Nigeria", "Transport", -3_200, "Completed", "2025-06-21", "Yesterday"],
  ["txn-004", "Netflix", "Entertainment", -4_600, "Completed", "2025-06-20", "2 days ago"],
  ["txn-005", "DSTV", "Utilities", -18_000, "Completed", "2025-06-19", "3 days ago"],
  ["txn-006", "Zara", "Shopping", -42_000, "Completed", "2025-06-18", "4 days ago"],
  ["txn-007", "Chicken Republic", "Food & Dining", -7_200, "Completed", "2025-06-18", "4 days ago"],
  ["txn-008", "Bolt", "Transport", -5_400, "Completed", "2025-06-17", "5 days ago"],
  ["txn-009", "MTN Airtime", "Utilities", -9_500, "Completed", "2025-06-17", "5 days ago"],
  ["txn-010", "Jumia", "Shopping", -24_000, "Completed", "2025-06-16", "6 days ago"],
  ["txn-011", "Sterling Bank", "Savings", -85_000, "Completed", "2025-06-15", "1 week ago"],
  ["txn-012", "EKEDC", "Utilities", -28_000, "Pending", "2025-06-14", "1 week ago"],
  ["txn-013", "Konga", "Shopping", -14_500, "Completed", "2025-06-14", "1 week ago"],
  ["txn-014", "Genesis Cinema", "Entertainment", -12_000, "Completed", "2025-06-13", "1 week ago"],
  ["txn-015", "Meds Plus", "Health", -16_800, "Completed", "2025-06-12", "10 days ago"],
  ["txn-016", "Shoprite", "Food & Dining", -13_200, "Completed", "2025-06-11", "11 days ago"],
  ["txn-017", "Flutterwave Bonus", "Income", 50_000, "Completed", "2025-06-10", "12 days ago"],
  ["txn-018", "Uber Nigeria", "Transport", -4_900, "Pending", "2025-06-10", "12 days ago"],
  ["txn-019", "iMax Lekki", "Entertainment", -15_500, "Completed", "2025-06-09", "13 days ago"],
  ["txn-020", "Chicken Republic", "Food & Dining", -5_800, "Completed", "2025-06-09", "13 days ago"],
  ["txn-021", "DSTV", "Utilities", -18_000, "Completed", "2025-06-08", "2 weeks ago"],
  ["txn-022", "Sterling Bank Interest", "Income", 12_500, "Completed", "2025-06-08", "2 weeks ago"],
  ["txn-023", "Jumia Food", "Food & Dining", -11_750, "Completed", "2025-06-07", "2 weeks ago"],
  ["txn-024", "Bolt", "Transport", -7_400, "Completed", "2025-06-06", "2 weeks ago"],
  ["txn-025", "PlayStation Store", "Entertainment", -9_200, "Completed", "2025-06-05", "2 weeks ago"],
  ["txn-026", "EKEDC", "Utilities", -10_000, "Completed", "2025-06-05", "2 weeks ago"],
  ["txn-027", "Konga", "Shopping", -31_000, "Completed", "2025-06-04", "2 weeks ago"],
  ["txn-028", "CarePoint Pharmacy", "Health", -8_300, "Completed", "2025-06-03", "3 weeks ago"],
  ["txn-029", "Flutterwave Salary", "Income", 850_000, "Pending", "2025-06-01", "3 weeks ago"],
  ["txn-030", "Zara", "Shopping", -19_000, "Completed", "2025-05-31", "3 weeks ago"],
];

export const transactions: Transaction[] = rawTransactions.map(
  ([id, merchant, category, amount, status, date, relativeDate]) => ({
  id,
  merchant,
  category,
  amount,
  status,
  date,
  relativeDate,
  })
);

export function formatCurrency(amount: number) {
  return new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: "NGN",
    maximumFractionDigits: 0,
  }).format(amount);
}
