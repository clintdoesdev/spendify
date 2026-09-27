import type { BankAccount, StatementLine } from "./types";

/** Fixed "today" so server and client render the same mock data. */
export const AS_OF = "2026-09-27";

export const OWN_NAMES = ["CLINTON K"];

export const bankAccounts: BankAccount[] = [
  { id: "gtb", institution: "GTBank", label: "Salary", last4: "4821", openedOn: "2019-03-01" },
  { id: "kuda", institution: "Kuda", label: "Spend & Save", last4: "0193", openedOn: "2020-06-01" },
  { id: "opay", institution: "OPay", label: "Wallet", last4: "7750", openedOn: "2021-01-01" },
  {
    id: "moniepoint",
    institution: "Moniepoint",
    label: "Business",
    last4: "3302",
    openedOn: "2023-06-01",
  },
];

// Deterministic PRNG so the mock statements are stable across renders.
function mulberry32(seed: number) {
  return () => {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const MONTHS = ["JAN", "FEB", "MAR", "APR", "MAY", "JUN", "JUL", "AUG", "SEP", "OCT", "NOV", "DEC"];

const salaryByPeriod: [string, number][] = [
  ["2021-01", 320_000],
  ["2022-01", 380_000],
  ["2023-01", 450_000],
  ["2023-07", 520_000],
  ["2024-01", 600_000],
  ["2025-01", 720_000],
  ["2026-01", 850_000],
];

const clients = [
  { name: "Lagos Creative Hub", narration: "PAYMENT INVOICE" },
  { name: "Upwork via Payoneer", narration: "PAYONEER UPWORK PAYOUT" },
  { name: "Kemi Adeyemi Studio", narration: "PAYMENT FOR DESIGN INVOICE" },
  { name: "Fintrak Solutions", narration: "VENDOR PAYMENT INVOICE" },
];

function salaryFor(month: string) {
  let amount = salaryByPeriod[0][1];
  for (const [from, value] of salaryByPeriod) if (month >= from) amount = value;
  return amount;
}

function pad(n: number) {
  return String(n).padStart(2, "0");
}

function addDays(date: string, days: number) {
  const d = new Date(`${date}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

function roundTo(value: number, step: number) {
  return Math.round(value / step) * step;
}

function generate(): StatementLine[] {
  const rand = mulberry32(20260927);
  const between = (min: number, max: number) => min + rand() * (max - min);
  const lines: StatementLine[] = [];
  let seq = 0;

  const push = (line: Omit<StatementLine, "id">) => {
    if (line.date > AS_OF) return;
    lines.push({ ...line, id: `stl_${(seq++).toString(36)}` });
  };

  const selfTransfer = (from: string, to: string, date: string, amount: number, lagDays = 0) => {
    const fromBank = bankAccounts.find((a) => a.id === from)!.institution.toUpperCase();
    const toBank = bankAccounts.find((a) => a.id === to)!.institution.toUpperCase();
    push({
      accountId: from,
      date,
      amount,
      type: "debit",
      narration: `NIP TRF TO CLINTON K/${toBank}`,
      counterparty: "Clinton K.",
    });
    push({
      accountId: to,
      date: addDays(date, lagDays),
      amount,
      type: "credit",
      narration: `NIP TRF FROM CLINTON K/${fromBank}`,
      counterparty: "Clinton K.",
    });
  };

  for (let year = 2021; year <= 2026; year++) {
    for (let m = 1; m <= 12; m++) {
      const month = `${year}-${pad(m)}`;
      const day = (d: number) => `${month}-${pad(d)}`;
      const salary = salaryFor(month);
      const businessAccount = month >= "2023-06" ? "moniepoint" : "kuda";

      // Salary lands in GTBank on the 25th, plus a 13th-month bonus in December.
      push({
        accountId: "gtb",
        date: day(25),
        amount: salary,
        type: "credit",
        narration: `SALARY ${MONTHS[m - 1]} ${year} BRIGHTWAVE TECH LTD`,
        counterparty: "Brightwave Tech Ltd",
      });
      if (m === 12) {
        push({
          accountId: "gtb",
          date: day(20),
          amount: salary,
          type: "credit",
          narration: `13TH MONTH SALARY ${year} BRIGHTWAVE TECH LTD`,
          counterparty: "Brightwave Tech Ltd",
        });
      }

      // Moving salary around own accounts — the classic double-count trap.
      selfTransfer("gtb", "kuda", day(26), roundTo(salary * between(0.35, 0.5), 1000), rand() > 0.6 ? 1 : 0);
      const walletTopUps = 2 + Math.floor(rand() * 3);
      for (let i = 0; i < walletTopUps; i++) {
        selfTransfer("kuda", "opay", day(2 + Math.floor(rand() * 26)), roundTo(between(5_000, 45_000), 500));
      }
      if (rand() > 0.7) selfTransfer("opay", "gtb", day(10 + Math.floor(rand() * 15)), roundTo(between(10_000, 60_000), 1000));
      if (businessAccount === "moniepoint" && rand() > 0.4) {
        selfTransfer("moniepoint", "gtb", day(15), roundTo(between(80_000, 250_000), 5000), 2);
      }

      // Freelance / business income, growing over time.
      if (month >= "2021-09") {
        const growth = 1 + (year - 2021) * 0.35;
        const jobs = Math.floor(rand() * 3.2);
        for (let i = 0; i < jobs; i++) {
          const client = clients[Math.floor(rand() * clients.length)];
          push({
            accountId: businessAccount,
            date: day(1 + Math.floor(rand() * 27)),
            amount: roundTo(between(45_000, 260_000) * growth, 500),
            type: "credit",
            narration: `${client.narration} #${1000 + seq}`,
            counterparty: client.name,
          });
        }
      }

      // Family & gifts: Christmas, birthday month, the odd "urgent 2k".
      if (m === 12) {
        push({
          accountId: "opay",
          date: day(23),
          amount: roundTo(between(40_000, 120_000), 5000),
          type: "credit",
          narration: "TRF FROM NGOZI O CHRISTMAS GIFT",
          counterparty: "Mum",
        });
      }
      if (m === 4) {
        push({
          accountId: "kuda",
          date: day(11),
          amount: roundTo(between(20_000, 80_000), 5000),
          type: "credit",
          narration: "BIRTHDAY GIFT FROM EMEKA",
          counterparty: "Emeka (brother)",
        });
      }

      // One-off personal sales and odd jobs.
      if (rand() > 0.8) {
        const buyer = ["TUNDE A", "AMAKA E", "SEGUN O", "HALIMA B"][Math.floor(rand() * 4)];
        push({
          accountId: "opay",
          date: day(1 + Math.floor(rand() * 27)),
          amount: roundTo(between(15_000, 120_000), 500),
          type: "credit",
          narration: `TRF FROM ${buyer}`,
          counterparty: buyer.replace(/ (\w)$/, " $1.").replace(/\b(\w)(\w*)/g, (_, a, b) => a + b.toLowerCase()),
        });
      }

      // Returns: Kuda savings interest monthly, dividend every May.
      push({
        accountId: "kuda",
        date: day(28),
        amount: roundTo(between(600, 1_800) * (1 + (year - 2021) * 0.8), 10),
        type: "credit",
        narration: "INTEREST ON SAVINGS",
        counterparty: "Kuda MFB",
      });
      if (m === 5 && year >= 2022) {
        push({
          accountId: "gtb",
          date: day(18),
          amount: roundTo(between(15_000, 45_000) * (year - 2020), 100),
          type: "credit",
          narration: "DIVIDEND ZENITH BANK PLC",
          counterparty: "Zenith Bank PLC (Registrar)",
        });
      }

      // Own savings coming back: PiggyVest breaks and a yearly ajo payout.
      if (m === 6 || m === 12) {
        push({
          accountId: "kuda",
          date: day(3),
          amount: roundTo(between(150_000, 420_000), 5000),
          type: "credit",
          narration: "PIGGYVEST WITHDRAWAL",
          counterparty: "PiggyVest",
        });
      }
      if (m === 9) {
        push({
          accountId: "opay",
          date: day(5),
          amount: 12 * 25_000,
          type: "credit",
          narration: "AJO PAYOUT OFFICE ESUSU GROUP",
          counterparty: "Office Esusu Group",
        });
      }

      // Failed transfers that bounce back.
      if (rand() > 0.72) {
        const amount = roundTo(between(8_000, 90_000), 500);
        const date = day(3 + Math.floor(rand() * 20));
        push({
          accountId: "opay",
          date,
          amount,
          type: "debit",
          narration: "TRF TO CHIDI MOTORS",
          counterparty: "Chidi Motors",
        });
        push({
          accountId: "opay",
          date: addDays(date, 1),
          amount,
          type: "credit",
          narration: "REVERSAL FAILED TRF TO CHIDI MOTORS",
          counterparty: "OPay",
        });
      }

      if (rand() > 0.85) {
        push({
          accountId: "gtb",
          date: day(9 + Math.floor(rand() * 15)),
          amount: roundTo(between(6_000, 55_000), 100),
          type: "credit",
          narration: "JUMIA ORDER REFUND",
          counterparty: "Jumia",
        });
      }

      // Money from an own account the user hasn't linked yet (Access Bank).
      if (month >= "2024-02" && m % 3 === 2) {
        push({
          accountId: "gtb",
          date: day(7),
          amount: roundTo(between(50_000, 150_000), 5000),
          type: "credit",
          narration: "NIP TRF FROM CLINTON K/ACCESS BANK",
          counterparty: "Clinton K.",
        });
      }
    }
  }

  // A quick loan in 2022 that must not look like income.
  push({
    accountId: "opay",
    date: "2022-08-14",
    amount: 150_000,
    type: "credit",
    narration: "FAIRMONEY LOAN DISBURSEMENT",
    counterparty: "FairMoney MFB",
  });
  push({
    accountId: "gtb",
    date: "2024-11-02",
    amount: 400_000,
    type: "credit",
    narration: "CARBON LOAN DISBURSEMENT",
    counterparty: "Carbon",
  });

  return lines.sort((a, b) => (a.date === b.date ? a.id.localeCompare(b.id) : a.date.localeCompare(b.date)));
}

export const statementLines = generate();

/**
 * Illustrative year-on-year headline inflation, used to show "real" growth.
 * Replace with an official CPI feed before shipping.
 */
export const inflationByYear: Record<number, number> = {
  2021: 0.17,
  2022: 0.188,
  2023: 0.247,
  2024: 0.33,
  2025: 0.21,
  2026: 0.16,
};
