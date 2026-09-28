import { drizzle } from "drizzle-orm/postgres-js";
import { migrate } from "drizzle-orm/postgres-js/migrator";
import postgres from "postgres";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

import { hashPassword, verifyPassword } from "@/lib/auth/password";
import { createSession, createUser, deleteSession, findSessionUser, findUserByEmail } from "@/lib/auth/store";
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
  let alice: string;
  let bob: string;

  beforeAll(async () => {
    admin = postgres(adminUrl!, { max: 1 });
    await admin.unsafe(`create database ${dbName}`);
    const url = new URL(adminUrl!);
    url.pathname = `/${dbName}`;
    client = postgres(url.toString(), { max: 1, onnotice: () => {} });
    db = drizzle(client, { schema });
    await migrate(db, { migrationsFolder: "drizzle" });
    alice = (await createUser(db, { email: "Alice@Example.com", name: "Alice", passwordHash: "x" }))!;
    bob = (await createUser(db, { email: "bob@example.com", name: "Bob", passwordHash: "x" }))!;
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

  it("treats emails case-insensitively and refuses duplicates", async () => {
    expect((await findUserByEmail(db, "  alice@EXAMPLE.com "))?.id).toBe(alice);
    expect(await createUser(db, { email: "ALICE@example.com", name: "", passwordHash: "x" })).toBeNull();
  });

  it("finds a session's user until it's deleted or expired", async () => {
    const { token } = await createSession(db, alice);
    expect(await findSessionUser(db, token)).toEqual({ id: alice, email: "Alice@Example.com", name: "Alice" });
    expect(await findSessionUser(db, token + "x")).toBeNull();
    await deleteSession(db, token);
    expect(await findSessionUser(db, token)).toBeNull();

    const expired = await createSession(db, bob);
    await client`update sessions set expires_at = now() - interval '1 minute'`;
    expect(await findSessionUser(db, expired.token)).toBeNull();
  });

  it("stores only a hash of the session token", async () => {
    const { token } = await createSession(db, alice);
    const rows = await client`select token_hash from sessions`;
    expect(rows.map((r) => r.token_hash)).not.toContain(token);
  });

  it("deleting an account removes its lines", async () => {
    const [account] = await repo.listAccounts(db, alice);
    await repo.deleteAccount(db, alice, account.id);
    expect(await repo.listLines(db, alice)).toEqual([]);
  });

  it("deleting a user removes everything they own", async () => {
    await repo.createAccount(db, bob, { institution: "Kuda", label: "", last4: "" });
    await client`delete from users where id = ${bob}`;
    expect(await repo.listAccounts(db, bob)).toEqual([]);
    const [{ count }] = await client`select count(*)::int as count from sessions where user_id = ${bob}`;
    expect(count).toBe(0);
  });
});

describe("passwords", () => {
  it("verifies the right password only", async () => {
    const hash = await hashPassword("correct horse battery");
    expect(hash.startsWith("scrypt$")).toBe(true);
    expect(await verifyPassword("correct horse battery", hash)).toBe(true);
    expect(await verifyPassword("correct horse batterY", hash)).toBe(false);
  });

  it("salts every hash", async () => {
    expect(await hashPassword("same")).not.toBe(await hashPassword("same"));
  });

  it("rejects malformed hashes", async () => {
    expect(await verifyPassword("x", "not-a-hash")).toBe(false);
  });
});
