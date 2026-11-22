-- =============================================================================
-- [dictionary branch only] Inflected word forms and the base word(s) they come
-- from, e.g. "fängt" → fangen, "Häusern" → Haus. Used to show a base word's
-- translations when the clicked form has few or none.
-- Applied with `bun run dictionary:db`; filled with `bun run dictionary:import-forms`.
-- Safe to re-run.
-- =============================================================================

create table if not exists public.word_forms (
  language  text not null,     -- book language code, e.g. 'de'
  form      text not null,     -- normalized form (lowercase), the clicked word's key
  bases     text[] not null,   -- base words as written in the dictionary, e.g. {fangen}
  primary key (language, form)
);

comment on table public.word_forms is 'Inflected form → base word(s), per language.';

alter table public.word_forms enable row level security;

-- Readable by any signed-in user; written only by the import script (no write policies).
drop policy if exists "Signed-in users can read word forms" on public.word_forms;
create policy "Signed-in users can read word forms"
  on public.word_forms for select to authenticated
  using (true);
