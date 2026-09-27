import { randomUUID } from "node:crypto";

import { drizzle } from "drizzle-orm/postgres-js";
import { migrate } from "drizzle-orm/postgres-js/migrator";
import postgres from "postgres";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

import * as repo from "@/lib/data/repo";
import * as schema from "@/lib/db/schema";
import { fingerprintLines } from "@/lib/import/fingerprint";

// Runs against a real Postgres when TEST_DATABASE_URL points at a server we may create
// databases on, e.g. postgres://postgres@127.0.0.1:5432/postgres. Skipped otherwise.
const adminUrl = process.env.TEST_DATABASE_URL;
const dbName = `spendify_test_${Date.now()}`;

describe.skipIf(!adminUrl)("repository (Postgres)", () => {
  let admin: postgres.Sql;
  let client: postgres.Sql;
  let db: repo.Db;
  const alice = randomUUID();
  const bob = randomUUID();

  beforeAll(async () => {
    admin = postgres(adminUrl!, { max: 1 });
    await admin.unsafe(`create database ${dbName}`);
    const url = new URL(adminUrl!);
    url.pathname = `/${dbName}`;
    client = postgres(url.toString(), { max: 1, onnotice: () => {} });
    db = drizzle(client, { schema });
    await migrate(db, { migrationsFolder: "drizzle" });
  });

  afterAll(async () => {
    await client?.end();
    await admin?.unsafe(`drop database if exists ${dbName}`);
    await admin?.end();
  });

  it("imports lines once, no matter how often the statement is uploaded", async () => {
    const accountId = await repo.createAccount(db, alice, { institution: "GTBank", label: "Salary", last4: "4821" });
    const lines = fingerprintLines(accountId, [
      { date: "2026-09-25", amount: 850000, type: "credit", narration: "SALARY", counterparty: "Brightwave" },
      { date: "2026-09-26", amount: 500, type: "debit", narration: "TRF TO TUNDE", counterparty: "Tunde" },
      { date: "2026-09-26", amount: 500, type: "debit", narration: "TRF TO TUNDE", counterparty: "Tunde" },
    ]);

    expect(await repo.insertLines(db, alice, accountId, "csv", lines)).toEqual({ inserted: 3, skipped: 0 });
    expect(await repo.insertLines(db, alice, accountId, "csv", lines)).toEqual({ inserted: 0, skipped: 3 });

    const stored = await repo.listLines(db, alice);
    expect(stored).toHaveLength(3);
    expect(stored[0]).toMatchObject({ date: "2026-09-25", amount: 850000, type: "credit", accountId });
  });

  it("keeps each user's data to themselves", async () => {
    expect(await repo.listLines(db, bob)).toEqual([]);
    expect(await repo.listAccounts(db, bob)).toEqual([]);
    const [account] = await repo.listAccounts(db, alice);
    expect(await repo.accountBelongsTo(db, bob, account.id)).toBe(false);

    await repo.deleteAccount(db, bob, account.id);
    expect(await repo.listAccounts(db, alice)).toHaveLength(1);
  });

  it("stores kobo exactly", async () => {
    const [account] = await repo.listAccounts(db, alice);
    await repo.insertLines(db, alice, account.id, "manual", fingerprintLines(account.id, [
      { date: "2026-09-27", amount: 1234.56, type: "debit", narration: "POS", counterparty: "" },
    ]));
    const line = (await repo.listLines(db, alice)).find((l) => l.narration === "POS");
    expect(line?.amount).toBe(1234.56);
  });

  it("saves True Inflow preferences", async () => {
    expect(await repo.getPrefs(db, alice)).toEqual({ ownNames: [], countedReasons: [], overrides: {} });
    await repo.savePrefs(db, alice, { ownNames: ["ADA OBI"], countedReasons: ["refund"] });
    await repo.savePrefs(db, alice, { overrides: { x: "include" } });
    expect(await repo.getPrefs(db, alice)).toEqual({
      ownNames: ["ADA OBI"],
      countedReasons: ["refund"],
      overrides: { x: "include" },
    });
  });

  it("upserts budgets by category", async () => {
    await repo.upsertBudget(db, alice, "Transport", 50000);
    await repo.upsertBudget(db, alice, "Transport", 65000);
    expect(await repo.listBudgets(db, alice)).toEqual([expect.objectContaining({ category: "Transport", monthlyLimit: 65000 })]);
    await repo.deleteBudget(db, bob, (await repo.listBudgets(db, alice))[0].id);
    expect(await repo.listBudgets(db, alice)).toHaveLength(1);
  });

  it("tracks goal contributions and never goes below zero", async () => {
    await repo.createGoal(db, alice, { name: "Rent", target: 1_500_000, saved: 100_000, deadline: "2027-02-28" });
    const [goal] = await repo.listGoals(db, alice);
    await repo.addToGoal(db, alice, goal.id, 50_000);
    await repo.addToGoal(db, bob, goal.id, 999_999);
    expect((await repo.listGoals(db, alice))[0].saved).toBe(150_000);
    await repo.addToGoal(db, alice, goal.id, -1_000_000);
    expect((await repo.listGoals(db, alice))[0].saved).toBe(0);
  });

  it("deleting an account removes its lines", async () => {
    const [account] = await repo.listAccounts(db, alice);
    await repo.deleteAccount(db, alice, account.id);
    expect(await repo.listLines(db, alice)).toEqual([]);
  });
});
