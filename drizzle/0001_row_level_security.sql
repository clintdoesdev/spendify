-- Defence in depth. The app talks to Postgres as the table owner and always filters by
-- user_id, but Supabase also exposes tables through its public API. Row level security
-- makes sure that API can only ever touch the signed-in user's own rows.
-- The policies need Supabase's auth.uid(), so they are skipped on a plain Postgres.
DO $$
DECLARE
  t text;
BEGIN
  FOREACH t IN ARRAY ARRAY['bank_accounts', 'statement_lines', 'inflow_preferences', 'budgets', 'goals'] LOOP
    EXECUTE format('ALTER TABLE %I ENABLE ROW LEVEL SECURITY', t);
    IF to_regprocedure('auth.uid()') IS NOT NULL THEN
      EXECUTE format(
        'CREATE POLICY %I ON %I FOR ALL TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid())',
        t || '_owner', t
      );
    END IF;
  END LOOP;
END $$;
