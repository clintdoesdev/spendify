"use client";

import Link from "next/link";
import { useEffect, useMemo, useState, useTransition } from "react";
import { Trash2, X } from "lucide-react";

import { createAccountAction, deleteAccountAction, savePrefsAction } from "@/app/actions";
import { BankAvatar, Card, CardTitle, Container, Notice, PageHeading, PillButton, TextField } from "@/components/ui/kit";
import type { Workspace } from "@/lib/data/types";
import { monthLabel } from "@/lib/finance/analyze";
import { KNOWN_BANKS } from "@/lib/finance/banks";
import type { BankAccount } from "@/lib/inflow/types";

export function AccountsView({ workspace }: { workspace: Workspace }) {
  const { mode, lines } = workspace;
  const [accounts, setAccounts] = useState<BankAccount[]>(workspace.accounts);
  const [names, setNames] = useState<string[]>(workspace.prefs.ownNames);
  useEffect(() => setAccounts(workspace.accounts), [workspace.accounts]);
  useEffect(() => setNames(workspace.prefs.ownNames), [workspace.prefs.ownNames]);

  const [notice, setNotice] = useState<{ tone: "error" | "success" | "info"; text: string } | null>(null);
  const [pending, startTransition] = useTransition();
  const [confirming, setConfirming] = useState<string | null>(null);

  const coverage = useMemo(() => {
    const map = new Map<string, { count: number; first: string; last: string }>();
    for (const l of lines) {
      const c = map.get(l.accountId);
      if (!c) map.set(l.accountId, { count: 1, first: l.date, last: l.date });
      else {
        c.count++;
        if (l.date < c.first) c.first = l.date;
        if (l.date > c.last) c.last = l.date;
      }
    }
    return map;
  }, [lines]);

  const demoOnly = () => {
    setNotice({ tone: "info", text: "Demo mode: changes stay in this tab and aren't saved." });
  };

  const addAccount = (input: { institution: string; label: string; last4: string }) => {
    if (mode !== "live") {
      setAccounts((a) => [...a, { id: `local-${Date.now()}`, ...input }]);
      return demoOnly();
    }
    startTransition(async () => {
      const result = await createAccountAction(input);
      setNotice(result.ok ? { tone: "success", text: `${input.institution} added. Import its statement next.` } : { tone: "error", text: result.error });
    });
  };

  const removeAccount = (account: BankAccount) => {
    setConfirming(null);
    if (mode !== "live") {
      setAccounts((a) => a.filter((x) => x.id !== account.id));
      return demoOnly();
    }
    startTransition(async () => {
      const result = await deleteAccountAction(account.id);
      setNotice(result.ok ? { tone: "success", text: `${account.institution} removed.` } : { tone: "error", text: result.error });
    });
  };

  const saveNames = (next: string[]) => {
    const previous = names;
    setNames(next);
    if (mode !== "live") return demoOnly();
    startTransition(async () => {
      const result = await savePrefsAction({ ownNames: next });
      if (!result.ok) {
        setNames(previous);
        setNotice({ tone: "error", text: result.error });
      }
    });
  };

  return (
    <Container>
      <PageHeading
        eyebrow="Bank accounts"
        title="Every bank you use"
        description="Add all of them, including wallets and business accounts. The more we can see, the better we spot money moving between them."
      />

      {notice && <Notice tone={notice.tone} className="mb-4">{notice.text}</Notice>}

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[minmax(0,7fr)_minmax(0,5fr)]">
        <Card>
          <CardTitle title={`${accounts.length} account${accounts.length === 1 ? "" : "s"}`} subtitle="Deleting an account also deletes its imported transactions." />
          {accounts.length === 0 ? (
            <p className="mt-6 text-[15px] text-ink-soft">No banks yet. Add your first one on the right.</p>
          ) : (
            <ul className="mt-6 divide-y divide-hairline">
              {accounts.map((account) => {
                const c = coverage.get(account.id);
                return (
                  <li key={account.id} className="flex items-center gap-4 py-4 first:pt-0 last:pb-0">
                    <BankAvatar account={account} size={40} />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-[16px] text-ink">
                        {account.institution}
                        {account.label && <span className="text-ink-faint"> · {account.label}</span>}
                        {account.last4 && <span className="text-ink-faint"> ··{account.last4}</span>}
                      </p>
                      <p className="text-[14px] text-ink-faint">
                        {c
                          ? `${c.count.toLocaleString("en-NG")} transactions · ${monthLabel(c.first.slice(0, 7), true)} – ${monthLabel(c.last.slice(0, 7), true)}`
                          : "No statements yet"}
                      </p>
                    </div>
                    {!c && (
                      <Link href="/import" className="hidden text-[14px] font-medium text-violet sm:inline">
                        Import
                      </Link>
                    )}
                    {confirming === account.id ? (
                      <span className="flex items-center gap-2">
                        <PillButton className="h-9 bg-loss px-4 text-[14px] hover:bg-loss/90" onClick={() => removeAccount(account)} disabled={pending}>
                          Delete
                        </PillButton>
                        <button type="button" aria-label="Cancel" onClick={() => setConfirming(null)} className="flex size-9 items-center justify-center rounded-full hover:bg-white">
                          <X className="size-4" />
                        </button>
                      </span>
                    ) : (
                      <button
                        type="button"
                        aria-label={`Delete ${account.institution}`}
                        onClick={() => setConfirming(account.id)}
                        className="flex size-9 items-center justify-center rounded-full text-ink-soft hover:bg-white hover:text-ink"
                      >
                        <Trash2 className="size-4" />
                      </button>
                    )}
                  </li>
                );
              })}
            </ul>
          )}
        </Card>

        <div className="space-y-4">
          <AddAccount onAdd={addAccount} disabled={pending} />
          <OwnNames names={names} onChange={saveNames} />
        </div>
      </div>
    </Container>
  );
}

function AddAccount({ onAdd, disabled }: { onAdd: (a: { institution: string; label: string; last4: string }) => void; disabled: boolean }) {
  const [institution, setInstitution] = useState("");
  const [label, setLabel] = useState("");
  const [last4, setLast4] = useState("");

  return (
    <Card as="div">
      <form
        className="space-y-4"
        onSubmit={(e) => {
          e.preventDefault();
          if (!institution.trim()) return;
          onAdd({ institution: institution.trim(), label: label.trim(), last4 });
          setInstitution("");
          setLabel("");
          setLast4("");
        }}
      >
        <p className="text-[18px] font-bold tracking-[-0.01em]">Add a bank</p>
        <TextField label="Bank or wallet" list="known-banks" placeholder="GTBank, Kuda, OPay…" value={institution} onChange={(e) => setInstitution(e.target.value)} required />
        <datalist id="known-banks">
          {KNOWN_BANKS.map((b) => (
            <option key={b.name} value={b.name} />
          ))}
        </datalist>
        <div className="grid grid-cols-[minmax(0,1fr)_7rem] gap-3">
          <TextField label="Nickname" placeholder="Salary" value={label} onChange={(e) => setLabel(e.target.value)} />
          <TextField
            label="Last 4"
            inputMode="numeric"
            maxLength={4}
            placeholder="4821"
            value={last4}
            onChange={(e) => setLast4(e.target.value.replace(/\D/g, "").slice(0, 4))}
          />
        </div>
        <PillButton type="submit" disabled={disabled || !institution.trim()}>
          Add bank
        </PillButton>
      </form>
    </Card>
  );
}

function OwnNames({ names, onChange }: { names: string[]; onChange: (names: string[]) => void }) {
  const [value, setValue] = useState("");
  const add = () => {
    const name = value.trim().toUpperCase();
    if (name.length >= 2 && !names.includes(name)) onChange([...names, name]);
    setValue("");
  };

  return (
    <Card as="div">
      <p className="text-[18px] font-bold tracking-[-0.01em]">Names you go by</p>
      <p className="mt-2 text-[15px] leading-relaxed text-ink-soft">
        When you send money to yourself, the narration shows your name, e.g. <span className="font-mono text-[13px]">TRF FROM ADA OBI/ACCESS</span>. Add
        how banks write your name so we can spot transfers from accounts you haven&apos;t added.
      </p>
      <div className="mt-4 flex flex-wrap gap-2">
        {names.map((name) => (
          <span key={name} className="inline-flex h-9 items-center gap-1 rounded-full bg-white pr-1.5 pl-3.5 text-[14px] text-ink">
            {name}
            <button
              type="button"
              aria-label={`Remove ${name}`}
              onClick={() => onChange(names.filter((n) => n !== name))}
              className="flex size-6 items-center justify-center rounded-full hover:bg-cloud"
            >
              <X className="size-3.5" />
            </button>
          </span>
        ))}
      </div>
      <form
        className="mt-4 flex gap-2"
        onSubmit={(e) => {
          e.preventDefault();
          add();
        }}
      >
        <label className="flex-1">
          <span className="sr-only">Name as it appears on transfers</span>
          <input
            value={value}
            onChange={(e) => setValue(e.target.value)}
            placeholder="ADA OBI"
            className="block h-11 w-full rounded-full border border-hairline bg-white px-4 text-[15px] uppercase placeholder:text-ash placeholder:normal-case focus:border-violet focus:ring-2 focus:ring-violet/20 focus:outline-none"
          />
        </label>
        <PillButton type="submit" variant="ghost" className="h-11 px-5">
          Add
        </PillButton>
      </form>
    </Card>
  );
}
