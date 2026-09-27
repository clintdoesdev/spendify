import { sql } from "drizzle-orm";
import {
  bigint,
  check,
  date,
  index,
  jsonb,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";

// Every row belongs to a Supabase auth user (auth.users.id). Money is stored in kobo.

export const bankAccounts = pgTable(
  "bank_accounts",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id").notNull(),
    institution: text("institution").notNull(),
    label: text("label").notNull().default(""),
    last4: text("last4").notNull().default(""),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("bank_accounts_user_idx").on(t.userId)]
);

export const statementLines = pgTable(
  "statement_lines",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id").notNull(),
    accountId: uuid("account_id")
      .notNull()
      .references(() => bankAccounts.id, { onDelete: "cascade" }),
    date: date("date", { mode: "string" }).notNull(),
    amountKobo: bigint("amount_kobo", { mode: "number" }).notNull(),
    type: text("type", { enum: ["credit", "debit"] }).notNull(),
    narration: text("narration").notNull(),
    counterparty: text("counterparty").notNull().default(""),
    source: text("source", { enum: ["csv", "alert", "manual"] }).notNull(),
    /** Stable fingerprint of the line so re-importing a statement never duplicates it. */
    hash: text("hash").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    uniqueIndex("statement_lines_user_hash_idx").on(t.userId, t.hash),
    index("statement_lines_user_date_idx").on(t.userId, t.date),
    check("statement_lines_amount_positive", sql`${t.amountKobo} > 0`),
  ]
);

export const inflowPreferences = pgTable("inflow_preferences", {
  userId: uuid("user_id").primaryKey(),
  /** Names the user's own transfers show up under in narrations. */
  ownNames: text("own_names").array().notNull().default(sql`'{}'::text[]`),
  countedReasons: text("counted_reasons").array().notNull().default(sql`'{}'::text[]`),
  overrides: jsonb("overrides").$type<Record<string, "include" | "exclude">>().notNull().default({}),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const budgets = pgTable(
  "budgets",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id").notNull(),
    category: text("category").notNull(),
    monthlyLimitKobo: bigint("monthly_limit_kobo", { mode: "number" }).notNull(),
  },
  (t) => [uniqueIndex("budgets_user_category_idx").on(t.userId, t.category)]
);

export const goals = pgTable(
  "goals",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id").notNull(),
    name: text("name").notNull(),
    targetKobo: bigint("target_kobo", { mode: "number" }).notNull(),
    savedKobo: bigint("saved_kobo", { mode: "number" }).notNull().default(0),
    deadline: date("deadline", { mode: "string" }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("goals_user_idx").on(t.userId)]
);
