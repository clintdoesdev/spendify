import type {
  BankAccount,
  ClassifiedCredit,
  ExclusionReason,
  InflowSettings,
  InflowSource,
  StatementLine,
} from "./types";

const DAY_MS = 86_400_000;

const reasonRules: [ExclusionReason, RegExp][] = [
  ["reversal", /\bREVERSAL\b|\bREV\b|FAILED TRF|RETURNED/],
  ["refund", /\bREFUND\b|CHARGEBACK/],
  ["loan", /\bLOAN\b|DISBURS/],
  ["savings_return", /PIGGYVEST|COWRYWISE|AJO|ESUSU|SAVINGS? WITHDRAWAL|TARGET SAVINGS/],
];

const sourceRules: [InflowSource, RegExp][] = [
  ["salary", /SALARY|PAYROLL|WAGES|13TH MONTH/],
  ["returns", /INTEREST|DIVIDEND|\bROI\b|COUPON/],
  ["business", /INVOICE|PAYONEER|UPWORK|VENDOR PAYMENT|PAYMENT FOR/],
  ["family", /GIFT|FAMILY|UPKEEP|FROM MUM|FROM DAD/],
];

function daysBetween(a: string, b: string) {
  return Math.abs(Date.parse(a) - Date.parse(b)) / DAY_MS;
}

function detectSource(narration: string): InflowSource {
  for (const [source, pattern] of sourceRules) if (pattern.test(narration)) return source;
  return "other";
}

function mentionsOwnName(narration: string, ownNames: string[]) {
  return ownNames.some((name) => narration.includes(name.toUpperCase()));
}

/**
 * Pair each credit with a debit of the same amount on a *different* account the user
 * owns, within the transfer window. Runs across every linked account — never a filtered
 * subset — otherwise hiding a bank would turn its transfers into fake income.
 */
function matchSelfTransfers(lines: StatementLine[], windowDays: number) {
  const debitsByAmount = new Map<number, StatementLine[]>();
  for (const line of lines) {
    if (line.type !== "debit") continue;
    const bucket = debitsByAmount.get(line.amount) ?? [];
    bucket.push(line);
    debitsByAmount.set(line.amount, bucket);
  }

  const used = new Set<string>();
  const matches = new Map<string, StatementLine>();

  for (const credit of lines) {
    if (credit.type !== "credit") continue;
    const candidates = debitsByAmount.get(credit.amount);
    if (!candidates) continue;

    let best: StatementLine | undefined;
    let bestGap = Infinity;
    for (const debit of candidates) {
      if (used.has(debit.id) || debit.accountId === credit.accountId) continue;
      const gap = daysBetween(debit.date, credit.date);
      if (gap <= windowDays && debit.date <= credit.date && gap < bestGap) {
        best = debit;
        bestGap = gap;
      }
    }
    if (best) {
      used.add(best.id);
      matches.set(credit.id, best);
    }
  }
  return matches;
}

export function classifyCredits(
  lines: StatementLine[],
  accounts: BankAccount[],
  settings: InflowSettings
): ClassifiedCredit[] {
  const ownAccountIds = new Set(accounts.map((a) => a.id));
  const ownLines = lines.filter((line) => ownAccountIds.has(line.accountId));
  const selfTransfers = matchSelfTransfers(ownLines, settings.transferWindowDays);
  const counted = new Set(settings.countedReasons);

  return ownLines
    .filter((line) => line.type === "credit")
    .map((line) => {
      const narration = line.narration.toUpperCase();
      const matchedDebit = selfTransfers.get(line.id);

      let reason: ExclusionReason | undefined;
      if (matchedDebit) reason = "self_transfer";
      else if (mentionsOwnName(narration, settings.ownNames)) reason = "unlinked_own_account";
      else reason = reasonRules.find(([, pattern]) => pattern.test(narration))?.[0];

      const ruleIncluded = !reason || counted.has(reason);
      const override = settings.overrides[line.id];
      const included = override ? override === "include" : ruleIncluded;

      return {
        line,
        included,
        reason,
        matchedDebit,
        source: detectSource(narration),
        overridden: override !== undefined && included !== ruleIncluded,
      };
    });
}
