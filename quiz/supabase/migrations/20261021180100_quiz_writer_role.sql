-- Optional least-privilege role for the quiz app: INSERT on quiz_leads only (no read/update/delete).
-- Used only when the app is configured with SUPABASE_DB_URL instead of a service-role key.
-- The role is created NOLOGIN here; a password is set out-of-band (never committed):
--   alter role quiz_writer with login password '<generated>';
do $$
begin
  if not exists (select 1 from pg_roles where rolname = 'quiz_writer') then
    create role quiz_writer nologin noinherit;
  end if;
end
$$;

grant usage on schema public to quiz_writer;
grant insert on table public.quiz_leads to quiz_writer;

drop policy if exists "quiz_writer can insert leads" on public.quiz_leads;
create policy "quiz_writer can insert leads"
  on public.quiz_leads
  for insert
  to quiz_writer
  with check (true);
