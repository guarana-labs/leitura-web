-- =============================================================================
-- Initial schema: books, chapters, pages and reading progress.
--
-- A book's text is stored already split into "pages" of roughly
-- `words_per_page` words (never cutting a paragraph), so the reader can load
-- one page at a time. The original PDF is never stored.
--
-- Every row belongs (directly or through its book) to one user, and Row Level
-- Security makes sure users can only see and change their own data.
-- =============================================================================

-- -----------------------------------------------------------------------------
-- books
-- -----------------------------------------------------------------------------
create table public.books (
  id              uuid primary key default gen_random_uuid(),
  user_id         uuid not null default auth.uid() references auth.users (id) on delete cascade,
  title           text not null check (char_length(btrim(title)) between 1 and 500),
  author          text check (author is null or char_length(author) <= 300),
  description     text check (description is null or char_length(description) <= 5000),
  language        text check (language is null or char_length(language) <= 35),
  -- Path inside the `covers` storage bucket: "<user_id>/<book_id>.webp".
  cover_path      text,
  words_per_page  integer not null check (words_per_page between 50 and 5000),
  total_words     integer not null default 0 check (total_words >= 0),
  total_pages     integer not null default 0 check (total_pages >= 0),
  total_chapters  integer not null default 0 check (total_chapters >= 0),
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

comment on table public.books is 'A book imported from a PDF. Holds metadata only; the text lives in pages.';

create index books_user_id_created_at_idx on public.books (user_id, created_at desc);

-- -----------------------------------------------------------------------------
-- chapters
-- -----------------------------------------------------------------------------
create table public.chapters (
  id          uuid primary key default gen_random_uuid(),
  book_id     uuid not null references public.books (id) on delete cascade,
  -- 1-based order of the chapter inside the book.
  position    integer not null check (position >= 1),
  title       text not null check (char_length(btrim(title)) between 1 and 500),
  -- Range of the book's own page numbers (not PDF pages) covered by the chapter.
  first_page  integer not null check (first_page >= 1),
  last_page   integer not null,
  word_count  integer not null default 0 check (word_count >= 0),
  unique (book_id, position),
  check (last_page >= first_page)
);

comment on table public.chapters is 'Chapter index of a book, with the page range it covers.';

-- -----------------------------------------------------------------------------
-- pages
-- -----------------------------------------------------------------------------
create table public.pages (
  id           uuid primary key default gen_random_uuid(),
  book_id      uuid not null references public.books (id) on delete cascade,
  chapter_id   uuid not null references public.chapters (id) on delete cascade,
  -- 1-based page number across the whole book.
  page_number  integer not null check (page_number >= 1),
  -- The page text, one array item per paragraph.
  paragraphs   text[] not null check (cardinality(paragraphs) >= 1),
  word_count   integer not null check (word_count >= 0),
  -- Also serves as the index for "page N of book X" lookups.
  unique (book_id, page_number)
);

comment on table public.pages is 'A book''s text split into pages of about words_per_page words.';

create index pages_chapter_id_idx on public.pages (chapter_id);

-- -----------------------------------------------------------------------------
-- reading_progress
-- -----------------------------------------------------------------------------
create table public.reading_progress (
  user_id      uuid not null default auth.uid() references auth.users (id) on delete cascade,
  book_id      uuid not null references public.books (id) on delete cascade,
  page_number  integer not null check (page_number >= 1),
  updated_at   timestamptz not null default now(),
  primary key (user_id, book_id)
);

comment on table public.reading_progress is 'Last page a user read in a book.';

create index reading_progress_book_id_idx on public.reading_progress (book_id);

-- -----------------------------------------------------------------------------
-- updated_at maintenance
-- -----------------------------------------------------------------------------
create function public.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

create trigger books_set_updated_at
  before update on public.books
  for each row execute function public.set_updated_at();

create trigger reading_progress_set_updated_at
  before update on public.reading_progress
  for each row execute function public.set_updated_at();

-- -----------------------------------------------------------------------------
-- Row Level Security
-- `(select auth.uid())` is evaluated once per query instead of once per row.
-- -----------------------------------------------------------------------------
alter table public.books            enable row level security;
alter table public.chapters         enable row level security;
alter table public.pages            enable row level security;
alter table public.reading_progress enable row level security;

-- books: full control over your own books.
create policy "Users can read their own books"
  on public.books for select to authenticated
  using (user_id = (select auth.uid()));

create policy "Users can create their own books"
  on public.books for insert to authenticated
  with check (user_id = (select auth.uid()));

create policy "Users can update their own books"
  on public.books for update to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));

create policy "Users can delete their own books"
  on public.books for delete to authenticated
  using (user_id = (select auth.uid()));

-- chapters: access follows the parent book. Deleting happens through the
-- book's ON DELETE CASCADE, so no delete policy is needed.
create policy "Users can read chapters of their own books"
  on public.chapters for select to authenticated
  using (exists (
    select 1 from public.books b
    where b.id = chapters.book_id and b.user_id = (select auth.uid())
  ));

create policy "Users can add chapters to their own books"
  on public.chapters for insert to authenticated
  with check (exists (
    select 1 from public.books b
    where b.id = chapters.book_id and b.user_id = (select auth.uid())
  ));

create policy "Users can update chapters of their own books"
  on public.chapters for update to authenticated
  using (exists (
    select 1 from public.books b
    where b.id = chapters.book_id and b.user_id = (select auth.uid())
  ))
  with check (exists (
    select 1 from public.books b
    where b.id = chapters.book_id and b.user_id = (select auth.uid())
  ));

-- pages: read and insert only; pages are rebuilt, never edited in place.
create policy "Users can read pages of their own books"
  on public.pages for select to authenticated
  using (exists (
    select 1 from public.books b
    where b.id = pages.book_id and b.user_id = (select auth.uid())
  ));

create policy "Users can add pages to their own books"
  on public.pages for insert to authenticated
  with check (exists (
    select 1 from public.books b
    where b.id = pages.book_id and b.user_id = (select auth.uid())
  ));

-- reading_progress: your own rows, and only for your own books.
create policy "Users can read their own progress"
  on public.reading_progress for select to authenticated
  using (user_id = (select auth.uid()));

create policy "Users can create their own progress"
  on public.reading_progress for insert to authenticated
  with check (
    user_id = (select auth.uid())
    and exists (
      select 1 from public.books b
      where b.id = reading_progress.book_id and b.user_id = (select auth.uid())
    )
  );

create policy "Users can update their own progress"
  on public.reading_progress for update to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));

create policy "Users can delete their own progress"
  on public.reading_progress for delete to authenticated
  using (user_id = (select auth.uid()));
