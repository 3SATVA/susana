-- OPTIONAL, NOT APPLIED. Suggested shape if recipes_en.json is later loaded into Supabase for the fertility app.
create table if not exists public.recipes (
  id text primary key,
  title_es text not null,
  title_en text not null,
  subtitle text,
  section text not null,                 -- Entradas | Sopas | Segundos | Postres
  course text not null check (course in ('starter','soup','main','dessert')),
  source jsonb not null,                 -- {book, publisher_brand, pages[], photos[]}
  ingredients jsonb not null,            -- [{group, items[]}]
  steps text[] not null,
  notes text[] not null default '{}',
  uncertain text[] not null default '{}',
  translator_notes text[] not null default '{}',
  cycle_phases text[] not null default '{}' check (cycle_phases <@ array['Menstrual','Follicular','Ovulatory','Luteal']),
  fertility_types text[] not null default '{}' check (fertility_types <@ array['blood_deficiency','kidney_yin','kidney_yang','liver_qi_stagnation','dampness_accumulation','blood_stasis']),
  tags text[] not null default '{}',
  original_es jsonb,
  updated_at timestamptz not null default now()
);
create index if not exists recipes_cycle_phases_idx on public.recipes using gin (cycle_phases);
create index if not exists recipes_fertility_types_idx on public.recipes using gin (fertility_types);
alter table public.recipes enable row level security;  -- private: no anon policies
