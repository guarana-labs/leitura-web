-- =============================================================================
-- [dictionary branch only] Vocabulary: the status of each word a user has
-- marked, per language. Applied with `bun run dictionary:db` (not a regular
-- migration, so `main`'s migration history stays unchanged). Safe to re-run.
--
-- A word without a row is NEW (the default), so untouched words are never stored.
-- Words are tracked per language (not per book): learning "sagen" in one German
-- book marks it in every German book.
--
-- `word` is the normalized form (lowercase, cleaned) produced by the app's
-- language profiles; `meaning` is the user's own optional note/translation.
-- =============================================================================

create table if not exists public.user_words (
  user_id     uuid not null default auth.uid() references auth.users (id) on delete cascade,
  language    text not null check (char_length(language) between 1 and 35),
  word        text not null check (char_length(word) between 1 and 200),
  status      text not null default 'new'
                check (status in ('new', 'familiar', 'learned', 'ignored')),
  meaning     text check (meaning is null or char_length(meaning) <= 2000),
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),
  primary key (user_id, language, word)
);

comment on table public.user_words is 'Per-user, per-language word status (new/familiar/learned/ignored) and optional meaning.';

drop trigger if exists user_words_set_updated_at on public.user_words;
create trigger user_words_set_updated_at
  before update on public.user_words
  for each row execute function public.set_updated_at();

alter table public.user_words enable row level security;

drop policy if exists "Users can read their own words" on public.user_words;
create policy "Users can read their own words"
  on public.user_words for select to authenticated
  using (user_id = (select auth.uid()));

drop policy if exists "Users can add their own words" on public.user_words;
create policy "Users can add their own words"
  on public.user_words for insert to authenticated
  with check (user_id = (select auth.uid()));

drop policy if exists "Users can update their own words" on public.user_words;
create policy "Users can update their own words"
  on public.user_words for update to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));

drop policy if exists "Users can delete their own words" on public.user_words;
create policy "Users can delete their own words"
  on public.user_words for delete to authenticated
  using (user_id = (select auth.uid()));
