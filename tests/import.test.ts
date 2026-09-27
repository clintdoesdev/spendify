import { describe, expect, it } from "vitest";

import { parseAlerts } from "@/lib/import/alerts";
import { parseStatementCsv } from "@/lib/import/csv";
import { counterpartyFrom, parseAmount, parseDate } from "@/lib/import/fields";
import { fingerprintLines } from "@/lib/import/fingerprint";

describe("parseDate", () => {
  it.each([
    ["2026-09-25", "2026-09-25"],
    ["25/09/2026", "2026-09-25"],
    ["05/03/2026", "2026-03-05"],
    ["5-Mar-2026", "2026-03-05"],
    ["05-MAR-26", "2026-03-05"],
    ["25 Sept 2026 10:14", "2026-09-25"],
    ["Sep 25, 2026", "2026-09-25"],
    ["2026/09/25 14:02:11", "2026-09-25"],
  ])("%s → %s", (raw, expected) => expect(parseDate(raw)).toBe(expected));

  it("reads month-first when asked", () => expect(parseDate("03/05/2026", "mdy")).toBe("2026-03-05"));
  it("rejects impossible dates", () => expect(parseDate("31/02/2026")).toBeNull());
  it("rejects text", () => expect(parseDate("Opening Balance")).toBeNull());
});

describe("parseAmount", () => {
  it.each([
    ["₦1,250.50", 1250.5],
    ["NGN 50,000.00", 50000],
    ["(3,000.00)", -3000],
    ["12,000.00 DR", -12000],
    ["12,000.00CR", 12000],
    ["-450", -450],
    ["", null],
    ["-", null],
    ["abc", null],
  ])("%s → %s", (raw, expected) => expect(parseAmount(raw)).toBe(expected));
});

describe("counterpartyFrom", () => {
  it("pulls the sender from a transfer narration", () =>
    expect(counterpartyFrom("NIP TRF FROM ADA OBI/GTBANK")).toBe("Ada Obi"));
  it("pulls the recipient", () => expect(counterpartyFrom("TRF TO CHIDI MOTORS")).toBe("Chidi Motors"));
});

describe("parseStatementCsv", () => {
  const gtbStyle = [
    "Account Name,CLINTON K",
    "Account Number,0123456789",
    "Period,01-Sep-2026 to 30-Sep-2026",
    "",
    "Trans. Date,Value Date,Reference,Debits,Credits,Balance,Remarks",
    "01-Sep-2026,01-Sep-2026,,,,120000.00,Opening Balance",
    '25-Sep-2026,25-Sep-2026,S123,,"850,000.00","970,000.00",SALARY SEP 2026 BRIGHTWAVE TECH LTD',
    '26-Sep-2026,26-Sep-2026,S124,"340,000.00",,"630,000.00",NIP TRF TO CLINTON K/KUDA',
    "28-Sep-2026,28-Sep-2026,S125,150.00,,629850.00,SMS ALERT CHARGES",
  ].join("\n");

  it("finds the table below the account details", () => {
    const result = parseStatementCsv(gtbStyle);
    expect(result.mapping).not.toBeNull();
    expect(result.lines).toEqual([
      expect.objectContaining({ date: "2026-09-25", amount: 850000, type: "credit", narration: "SALARY SEP 2026 BRIGHTWAVE TECH LTD" }),
      expect.objectContaining({ date: "2026-09-26", amount: 340000, type: "debit", counterparty: "Clinton K" }),
      expect.objectContaining({ date: "2026-09-28", amount: 150, type: "debit" }),
    ]);
  });

  it("skips the opening balance row", () => {
    const result = parseStatementCsv(gtbStyle);
    expect(result.skipped).toEqual([{ row: 6, reason: "No amount" }]);
  });

  it("handles a signed single amount column", () => {
    const csv = "Date;Description;Amount\n2026-09-01;BOLT RIDE;-3500\n2026-09-02;TRF FROM AMAKA E;20000";
    const { lines } = parseStatementCsv(csv);
    expect(lines.map((l) => [l.type, l.amount])).toEqual([
      ["debit", 3500],
      ["credit", 20000],
    ]);
  });

  it("uses a Dr/Cr column when present", () => {
    const csv = "Date,Narration,Amount,Dr/Cr\n02/09/2026,DSTV COMPACT,12500,DR\n03/09/2026,REFUND,500,CR";
    expect(parseStatementCsv(csv).lines.map((l) => l.type)).toEqual(["debit", "credit"]);
  });

  it("returns no mapping for an unrelated file", () => {
    expect(parseStatementCsv("name,email\nada,ada@example.com").mapping).toBeNull();
  });
});

describe("parseAlerts", () => {
  it("reads several alert styles", () => {
    const text = [
      "Acct: 012****821\nAmt: NGN850,000.00 CR\nDesc: SALARY SEP 2026 BRIGHTWAVE\nDate: 25-Sep-2026 10:14\nAvail Bal: NGN970,000.00",
      "Debit Alert! Amt: NGN 3,500.00 Desc: BOLT RIDE LAGOS Date: 2026-09-26",
      "You have received ₦20,000.00 from AMAKA EZE on 27/09/2026.",
      "Your OTP is 123456",
    ].join("\n\n");
    const { lines, unparsed } = parseAlerts(text, "2026-09-30");
    expect(lines).toEqual([
      expect.objectContaining({ date: "2026-09-25", amount: 850000, type: "credit", narration: "SALARY SEP 2026 BRIGHTWAVE" }),
      expect.objectContaining({ date: "2026-09-26", amount: 3500, type: "debit", narration: "BOLT RIDE LAGOS" }),
      expect.objectContaining({ date: "2026-09-27", amount: 20000, type: "credit", counterparty: "Amaka Eze", narration: "from AMAKA EZE" }),
    ]);
    expect(unparsed).toEqual(["Your OTP is 123456"]);
  });

  it("falls back to the given date", () => {
    expect(parseAlerts("Credit: NGN 5,000.00 from TUNDE", "2026-09-30").lines[0].date).toBe("2026-09-30");
  });
});

describe("fingerprintLines", () => {
  const line = { date: "2026-09-01", amount: 500, type: "debit" as const, narration: "TRF TO TUNDE", counterparty: "" };

  it("is stable across imports", () => {
    expect(fingerprintLines("acc", [line])[0].hash).toBe(fingerprintLines("acc", [line])[0].hash);
  });
  it("keeps identical same-day lines apart", () => {
    const [a, b] = fingerprintLines("acc", [line, { ...line }]);
    expect(a.hash).not.toBe(b.hash);
  });
  it("differs per account", () => {
    expect(fingerprintLines("a", [line])[0].hash).not.toBe(fingerprintLines("b", [line])[0].hash);
  });
  it("stores kobo", () => expect(fingerprintLines("a", [{ ...line, amount: 12.345 }])[0].amountKobo).toBe(1235));
});
