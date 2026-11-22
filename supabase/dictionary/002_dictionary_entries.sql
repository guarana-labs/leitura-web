-- =============================================================================
-- [dictionary branch only] Dictionary data imported on the server (dict.cc).
-- Applied with `bun run dictionary:db`; filled with `bun run dictionary:import`.
-- Safe to re-run.
--
-- One row per lookup key (the normalized headword, e.g. "sagen"), holding all
-- of that word's senses. A click on a word reads exactly one row.
--
--   entries: [[german, english, wordType, subjectTags], ...]
--            e.g. [["(jdm.) etw. [Akk.] sagen", "to say sth. (to sb.)", "verb", ""], ...]
-- =============================================================================

create table if not exists public.dictionary_entries (
  dictionary  text not null,   -- source id, e.g. 'dictcc-de-en'
  key         text not null,   -- normalized headword (lowercase, annotations removed)
  entries     jsonb not null,
  primary key (dictionary, key)
);

comment on table public.dictionary_entries is 'Imported dictionary data, one row per (dictionary, lookup key).';

alter table public.dictionary_entries enable row level security;

-- Readable by any signed-in user; written only by the import script (no write policies).
drop policy if exists "Signed-in users can read dictionaries" on public.dictionary_entries;
create policy "Signed-in users can read dictionaries"
  on public.dictionary_entries for select to authenticated
  using (true);
