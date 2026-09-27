"use client";

import Link from "next/link";
import { useMemo, useRef, useState, useTransition } from "react";
import { ArrowRight, FileUp } from "lucide-react";

import { importLinesAction } from "@/app/actions";
import { BankAvatar, Card, Container, EmptyState, Notice, PageHeading, PillButton, Segmented, SelectField } from "@/components/ui/kit";
import type { Workspace } from "@/lib/data/types";
import { parseAlerts } from "@/lib/import/alerts";
import { parseStatementCsv, type CsvParseResult } from "@/lib/import/csv";
import type { ParsedLine } from "@/lib/import/types";
import { formatNaira, formatNairaCompact } from "@/lib/money";
import { cn } from "@/lib/utils";

const MAX_BYTES = 10 * 1024 * 1024;

const ALERT_EXAMPLE = `Acct: 012****821
Amt: NGN850,000.00 CR
Desc: SALARY SEP 2026 BRIGHTWAVE
Date: 25-Sep-2026 10:14

Debit Alert! Amt: NGN 3,500.00 Desc: BOLT RIDE LAGOS Date: 26-Sep-2026`;

export function ImportView({ workspace }: { workspace: Workspace }) {
  const { accounts, mode, asOf } = workspace;
  const [accountId, setAccountId] = useState(accounts[0]?.id ?? "");
  const [source, setSource] = useState<"csv" | "alert">("csv");
  const [order, setOrder] = useState<"dmy" | "mdy">("dmy");
  const [fileName, setFileName] = useState<string | null>(null);
  const [csvText, setCsvText] = useState<string | null>(null);
  const [alertText, setAlertText] = useState("");
  const [fileError, setFileError] = useState<string | null>(null);
  const [result, setResult] = useState<{ tone: "success" | "error" | "info"; text: string } | null>(null);
  const [pending, startTransition] = useTransition();
  const [dragging, setDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const csv: CsvParseResult | null = useMemo(
    () => (source === "csv" && csvText !== null ? parseStatementCsv(csvText, order) : null),
    [source, csvText, order]
  );
  const alerts = useMemo(
    () => (source === "alert" && alertText.trim() ? parseAlerts(alertText, asOf) : null),
    [source, alertText, asOf]
  );
  const lines: ParsedLine[] = (source === "csv" ? csv?.lines : alerts?.lines) ?? [];

  const readFile = async (file: File) => {
    setResult(null);
    setFileError(null);
    if (file.size > MAX_BYTES) {
      setFileError("That file is over 10 MB. Export a shorter date range.");
      return;
    }
    if (!/\.(csv|txt|tsv)$/i.test(file.name) && !file.type.includes("csv") && !file.type.startsWith("text/")) {
      setFileError("Upload a CSV file. Most banks offer CSV or Excel export; save Excel files as CSV first.");
      return;
    }
    setFileName(file.name);
    setCsvText(await file.text());
  };

  const submit = () => {
    if (!accountId || lines.length === 0) return;
    if (mode !== "live") {
      setResult({ tone: "info", text: `Demo mode: ${lines.length} transactions read correctly, but nothing is saved.` });
      return;
    }
    startTransition(async () => {
      const response = await importLinesAction({ accountId, source, lines });
      if (!response.ok) return setResult({ tone: "error", text: response.error });
      const { inserted, skipped } = response.data!;
      setResult({
        tone: "success",
        text:
          `Imported ${inserted} new transaction${inserted === 1 ? "" : "s"}` +
          (skipped ? `, skipped ${skipped} already imported.` : "."),
      });
      setCsvText(null);
      setFileName(null);
      setAlertText("");
    });
  };

  if (accounts.length === 0) {
    return (
      <Container>
        <PageHeading eyebrow="Import" title="Bring in your statements" />
        <EmptyState
          title="Add a bank first"
          body="Tell us which banks and wallets you use, then import a statement for each one."
          action={
            <Link href="/accounts" className="inline-flex h-11 items-center gap-2 rounded-full bg-violet px-6 text-[15px] font-medium text-white">
              Add a bank <ArrowRight className="size-4" />
            </Link>
          }
        />
      </Container>
    );
  }

  const credits = lines.filter((l) => l.type === "credit");
  const debits = lines.filter((l) => l.type === "debit");
  const dates = lines.map((l) => l.date).sort();

  return (
    <Container>
      <PageHeading
        eyebrow="Import"
        title="Bring in your statements"
        description="Import every bank you use. Re-importing the same statement, or one that overlaps, never creates duplicates."
      />

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)]">
        {/* Step 1 + 2 */}
        <Card className="space-y-6">
          <Step n={1} title="Which account is this for?">
            <SelectField label="Account" className="[&>span]:sr-only" value={accountId} onChange={(e) => setAccountId(e.target.value)}>
              {accounts.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.institution}
                  {a.label ? ` · ${a.label}` : ""}
                  {a.last4 ? ` ··${a.last4}` : ""}
                </option>
              ))}
            </SelectField>
            <Link href="/accounts" className="mt-2 inline-block text-[14px] text-violet">
              Add another bank
            </Link>
          </Step>

          <Step n={2} title="What are you importing?">
            <Segmented
              label="Import type"
              value={source}
              onChange={(v) => {
                setSource(v);
                setResult(null);
              }}
              options={[
                { value: "csv", label: "CSV statement" },
                { value: "alert", label: "Paste alerts" },
              ]}
            />

            {source === "csv" ? (
              <div className="mt-4 space-y-3">
                <button
                  type="button"
                  onClick={() => inputRef.current?.click()}
                  onDragOver={(e) => {
                    e.preventDefault();
                    setDragging(true);
                  }}
                  onDragLeave={() => setDragging(false)}
                  onDrop={(e) => {
                    e.preventDefault();
                    setDragging(false);
                    const file = e.dataTransfer.files[0];
                    if (file) readFile(file);
                  }}
                  className={cn(
                    "flex w-full flex-col items-center gap-3 rounded-2xl border border-dashed px-6 py-10 text-center transition-colors",
                    dragging ? "border-violet bg-violet-wash" : "border-ash/70 bg-white hover:border-violet"
                  )}
                >
                  <span className="flex size-11 items-center justify-center rounded-full bg-cloud">
                    <FileUp className="size-5 text-ink" />
                  </span>
                  <span className="text-[16px] text-ink">{fileName ?? "Drop a CSV statement or choose a file"}</span>
                  <span className="text-[13px] text-ink-faint">We read it in your browser first; you confirm before anything is saved.</span>
                </button>
                <input
                  ref={inputRef}
                  type="file"
                  accept=".csv,.txt,.tsv,text/csv"
                  className="sr-only"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) readFile(file);
                    e.target.value = "";
                  }}
                />
                <SelectField label="Dates like 05/03/2026 mean" value={order} onChange={(e) => setOrder(e.target.value as "dmy" | "mdy")}>
                  <option value="dmy">5 March (day first, most Nigerian banks)</option>
                  <option value="mdy">May 3 (month first)</option>
                </SelectField>
                {fileError && <Notice tone="error">{fileError}</Notice>}
                {csv && !csv.mapping && (
                  <Notice tone="error">
                    Couldn&apos;t find the date, description and amount columns in this file.
                    {csv.headers.length > 0 && <> First row: {csv.headers.slice(0, 6).join(", ")}.</>}
                  </Notice>
                )}
              </div>
            ) : (
              <div className="mt-4">
                <label className="block">
                  <span className="text-[14px] text-ink-soft">Paste SMS or email alerts, one per paragraph</span>
                  <textarea
                    value={alertText}
                    onChange={(e) => {
                      setAlertText(e.target.value);
                      setResult(null);
                    }}
                    rows={10}
                    placeholder={ALERT_EXAMPLE}
                    className="mt-1.5 block w-full rounded-2xl border border-hairline bg-white px-4 py-3 font-mono text-[13px] leading-relaxed text-ink placeholder:text-ash focus:border-violet focus:ring-2 focus:ring-violet/20 focus:outline-none"
                  />
                </label>
                {alerts && alerts.unparsed.length > 0 && (
                  <Notice tone="warn" className="mt-3">
                    {alerts.unparsed.length} paragraph{alerts.unparsed.length === 1 ? "" : "s"} didn&apos;t look like a debit or credit alert and
                    will be skipped.
                  </Notice>
                )}
              </div>
            )}
          </Step>
        </Card>

        {/* Step 3 */}
        <Card className="flex flex-col">
          <Step n={3} title="Check and import">
            {lines.length === 0 ? (
              <p className="text-[15px] text-ink-soft">Your transactions will appear here to check before you import.</p>
            ) : (
              <>
                <dl className="grid grid-cols-2 gap-4 sm:grid-cols-4">
                  <Mini label="Transactions" value={lines.length.toLocaleString("en-NG")} />
                  <Mini label="Money in" value={formatNairaCompact(credits.reduce((s, l) => s + l.amount, 0))} />
                  <Mini label="Money out" value={formatNairaCompact(debits.reduce((s, l) => s + l.amount, 0))} />
                  <Mini label="Dates" value={dates.length ? `${short(dates[0])} – ${short(dates[dates.length - 1])}` : "—"} small />
                </dl>
                {csv && csv.skipped.length > 0 && (
                  <details className="mt-4 text-[14px] text-ink-soft">
                    <summary className="cursor-pointer">
                      {csv.skipped.length} row{csv.skipped.length === 1 ? "" : "s"} skipped (balances, totals, blank amounts)
                    </summary>
                    <p className="mt-2 text-ink-faint">
                      {csv.skipped.slice(0, 12).map((s) => `row ${s.row}: ${s.reason.toLowerCase()}`).join(" · ")}
                      {csv.skipped.length > 12 && " · …"}
                    </p>
                  </details>
                )}
                <ul className="mt-5 divide-y divide-hairline rounded-2xl bg-white px-4">
                  {lines.slice(0, 8).map((l, i) => (
                    <li key={i} className="flex items-center gap-3 py-3">
                      <span className="w-20 shrink-0 text-[13px] text-ink-faint tabular-nums">{short(l.date)}</span>
                      <span className="min-w-0 flex-1 truncate font-mono text-[12px] tracking-tight text-ink">{l.narration}</span>
                      <span className={cn("shrink-0 text-[15px] font-semibold tabular-nums", l.type === "credit" ? "text-gain" : "text-ink")}>
                        {l.type === "credit" ? "+" : "−"}
                        {formatNaira(l.amount)}
                      </span>
                    </li>
                  ))}
                </ul>
                {lines.length > 8 && <p className="mt-2 text-[13px] text-ink-faint">and {lines.length - 8} more</p>}
              </>
            )}
          </Step>

          <div className="mt-auto space-y-4 pt-6">
            {result && <Notice tone={result.tone}>{result.text}</Notice>}
            {result?.tone === "success" && (
              <div className="flex flex-wrap gap-4 text-[15px] font-medium text-violet">
                <Link href="/inflow" className="inline-flex items-center gap-1">
                  See True Inflow <ArrowRight className="size-4" />
                </Link>
                <Link href="/transactions" className="inline-flex items-center gap-1">
                  Transactions <ArrowRight className="size-4" />
                </Link>
              </div>
            )}
            <div className="flex items-center gap-3">
              {accounts.find((a) => a.id === accountId) && <BankAvatar account={accounts.find((a) => a.id === accountId)!} size={36} />}
              <PillButton className="h-12 flex-1 text-[16px] sm:flex-none sm:px-8" disabled={lines.length === 0 || pending} onClick={submit}>
                {pending ? "Importing…" : lines.length ? `Import ${lines.length.toLocaleString("en-NG")} transactions` : "Import"}
              </PillButton>
            </div>
          </div>
        </Card>
      </div>
    </Container>
  );
}

function Step({ n, title, children }: { n: number; title: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="flex items-center gap-3 text-[18px] font-bold tracking-[-0.01em]">
        <span className="flex size-7 items-center justify-center rounded-full bg-ink text-[13px] text-white">{n}</span>
        {title}
      </p>
      <div className="mt-4">{children}</div>
    </div>
  );
}

function Mini({ label, value, small }: { label: string; value: string; small?: boolean }) {
  return (
    <div>
      <dt className="text-[13px] text-ink-faint">{label}</dt>
      <dd className={cn("mt-1 font-bold tracking-[-0.01em] tabular-nums", small ? "text-[15px]" : "text-[22px]")}>{value}</dd>
    </div>
  );
}

function short(iso: string) {
  return new Date(`${iso}T00:00:00Z`).toLocaleDateString("en-NG", { day: "numeric", month: "short", year: "2-digit", timeZone: "UTC" });
}
