-- Shared stars for the private recipes site (yonisync-recipes).
-- Accessed only from Next.js route handlers (after the password-cookie check) with a server-only key.
create table if not exists public.recipe_stars (
  recipe_id text primary key,
  starred_at timestamptz not null default now()
);
alter table public.recipe_stars enable row level security;
-- Intentionally no policies: anon/authenticated roles get no access; the service key bypasses RLS.
revoke all on table public.recipe_stars from anon, authenticated;
comment on table public.recipe_stars is 'Starred recipes for yonisync-recipes (shared across devices). Server-only access.';

-- Least-privilege login role used by the Next.js route handlers (password set out-of-band and stored
-- only in Vercel env RECIPES_DB_URL; never committed). It can touch nothing but this table.
-- create role recipes_app login noinherit nocreatedb nocreaterole nobypassrls password '<set out-of-band>';
grant usage on schema public to recipes_app;
grant select, insert, delete on table public.recipe_stars to recipes_app;
drop policy if exists recipe_stars_app on public.recipe_stars;
create policy recipe_stars_app on public.recipe_stars for all to recipes_app using (true) with check (true);
alter role recipes_app set statement_timeout = '5s';
