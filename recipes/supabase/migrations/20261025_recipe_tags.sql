-- Editable tags for the private recipes site (yonisync-recipes), read later by the Yoni Sync app
-- to plan daily meals by cycle phase, fertility type and condition.
-- Same access model as recipe_stars: RLS on, no anon/authenticated access; only the least-privilege
-- role recipes_app (used by the password-gated Next.js route handlers) can read/write.

create table if not exists public.tags (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique check (slug ~ '^[a-z0-9_]{1,60}$'),  -- stable key for the app; never changes on rename
  name text not null check (length(btrim(name)) between 1 and 60),
  color text not null default '#f6c6dc' check (color ~ '^#[0-9a-fA-F]{6}$'),
  category text not null default 'other' check (category in ('phase', 'fertility_type', 'condition', 'other')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create unique index if not exists tags_name_lower_key on public.tags (lower(btrim(name)));

create table if not exists public.recipe_tags (
  recipe_id text not null,           -- id from recipes/recipes_en.json
  tag_id uuid not null references public.tags (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (recipe_id, tag_id)
);
create index if not exists recipe_tags_tag_idx on public.recipe_tags (tag_id);

alter table public.tags enable row level security;
alter table public.recipe_tags enable row level security;
revoke all on table public.tags, public.recipe_tags from anon, authenticated;

grant select, insert, update, delete on table public.tags to recipes_app;
grant select, insert, delete on table public.recipe_tags to recipes_app;
drop policy if exists tags_app on public.tags;
create policy tags_app on public.tags for all to recipes_app using (true) with check (true);
drop policy if exists recipe_tags_app on public.recipe_tags;
create policy recipe_tags_app on public.recipe_tags for all to recipes_app using (true) with check (true);

comment on table public.tags is 'Recipe tags Susana manages on yonisync-recipes (phase, fertility type, condition, other). Server-only access.';
comment on table public.recipe_tags is 'Recipe-to-tag assignments for yonisync-recipes; recipe_id matches recipes_en.json. Server-only access.';

-- Seed: phases + the six fertility types from quiz/lib/scoring-matrix.json (slugs match the quiz type ids).
insert into public.tags (slug, name, color, category) values
  ('follicular', 'Follicular', '#bfe3d0', 'phase'),
  ('luteal', 'Luteal', '#f3d1a8', 'phase'),
  ('blood_deficiency', 'Blood Deficiency', '#f6c6dc', 'fertility_type'),
  ('kidney_yin', 'Kidney Yin', '#c9d8f2', 'fertility_type'),
  ('kidney_yang', 'Kidney Yang', '#f7d6c4', 'fertility_type'),
  ('liver_qi_stagnation', 'Liver Qi Stagnation', '#d4ecc4', 'fertility_type'),
  ('dampness_accumulation', 'Dampness Accumulation', '#e2d4f0', 'fertility_type'),
  ('blood_stasis', 'Blood Stasis', '#f2c4c4', 'fertility_type')
on conflict (slug) do nothing;
