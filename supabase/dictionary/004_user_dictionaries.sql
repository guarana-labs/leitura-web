-- =============================================================================
-- [dictionary branch only] The dictionary each user picked for each book
-- language (Settings page). Applied with `bun run dictionary:db`. Safe to re-run.
--
-- No row means the language's default dictionary (the first one the app lists).
-- `dictionary` is an id from the app's dictionary list, e.g. 'wikdict-de-pt'.
-- =============================================================================

create table if not exists public.user_dictionaries (
  user_id     uuid not null default auth.uid() references auth.users (id) on delete cascade,
  language    text not null check (char_length(language) between 1 and 35),
  dictionary  text not null check (char_length(dictionary) between 1 and 100),
  updated_at  timestamptz not null default now(),
  primary key (user_id, language)
);

comment on table public.user_dictionaries is 'Per-user dictionary choice for each book language.';

drop trigger if exists user_dictionaries_set_updated_at on public.user_dictionaries;
create trigger user_dictionaries_set_updated_at
  before update on public.user_dictionaries
  for each row execute function public.set_updated_at();

alter table public.user_dictionaries enable row level security;

drop policy if exists "Users can read their own dictionary choices" on public.user_dictionaries;
create policy "Users can read their own dictionary choices"
  on public.user_dictionaries for select to authenticated
  using (user_id = (select auth.uid()));

drop policy if exists "Users can add their own dictionary choices" on public.user_dictionaries;
create policy "Users can add their own dictionary choices"
  on public.user_dictionaries for insert to authenticated
  with check (user_id = (select auth.uid()));

drop policy if exists "Users can update their own dictionary choices" on public.user_dictionaries;
create policy "Users can update their own dictionary choices"
  on public.user_dictionaries for update to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));

drop policy if exists "Users can delete their own dictionary choices" on public.user_dictionaries;
create policy "Users can delete their own dictionary choices"
  on public.user_dictionaries for delete to authenticated
  using (user_id = (select auth.uid()));
