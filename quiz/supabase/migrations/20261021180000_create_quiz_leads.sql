-- YoniSync "Fertility Type" quiz leads.
-- RLS is ON with NO policies for anon/authenticated: the public API cannot read or write.
-- Inserts happen server-side only (Next.js route handler) with the service-role/secret key,
-- which bypasses RLS, or via the insert-only `quiz_writer` role (see next migration).

create table if not exists public.quiz_leads (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  submitted_at timestamptz not null default now(),
  client_submitted_at timestamptz,
  first_name text,
  email text not null check (char_length(email) between 3 and 254),
  result_type text not null check (result_type in (
    'blood_deficiency', 'kidney_yin', 'kidney_yang',
    'liver_qi_stagnation', 'dampness_accumulation', 'blood_stasis'
  )),
  score_blood_deficiency smallint not null check (score_blood_deficiency between 0 and 12),
  score_kidney_yin smallint not null check (score_kidney_yin between 0 and 12),
  score_kidney_yang smallint not null check (score_kidney_yang between 0 and 12),
  score_liver_qi_stagnation smallint not null check (score_liver_qi_stagnation between 0 and 12),
  score_dampness_accumulation smallint not null check (score_dampness_accumulation between 0 and 12),
  score_blood_stasis smallint not null check (score_blood_stasis between 0 and 12),
  -- [{ "q": 1, "answer": "RARELY/NEVER" | "SOMETIMES" | "ALWAYS" }, ... 12 items]
  answers jsonb not null check (jsonb_typeof(answers) = 'array' and jsonb_array_length(answers) = 12),
  -- every utm_* query param that was on the quiz URL
  utm jsonb not null default '{}'::jsonb,
  utm_source text,
  utm_medium text,
  utm_campaign text,
  user_agent text
);

comment on table public.quiz_leads is 'Leads from the YoniSync Fertility Type quiz (server-side inserts only).';

create index if not exists quiz_leads_created_at_idx on public.quiz_leads (created_at desc);
create index if not exists quiz_leads_email_idx on public.quiz_leads (lower(email));
create index if not exists quiz_leads_result_type_idx on public.quiz_leads (result_type);

alter table public.quiz_leads enable row level security;
-- Intentionally no policies for anon / authenticated.
revoke all on table public.quiz_leads from anon, authenticated;
