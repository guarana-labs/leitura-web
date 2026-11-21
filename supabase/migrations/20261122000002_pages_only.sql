-- =============================================================================
-- Single level: a book is a sequence of pages (about `words_per_page` words
-- each, never cutting a paragraph). Chapters are removed.
--
-- Existing books keep working: their pages are already numbered 1..N.
-- =============================================================================

-- Removes the table, its policies, and the pages → chapters foreign key.
drop table public.chapters cascade;

alter table public.pages drop column chapter_id;
alter table public.books drop column total_chapters;

-- The parameters change (p_chapters → p_pages), so the function is recreated.
drop function public.import_book(jsonb, jsonb);

-- import_book: saves a whole book in one transaction.
--
--   supabase.rpc('import_book', {
--     p_book:  { title, author?, description?, language?, words_per_page },
--     p_pages: [ ['paragraph 1', 'paragraph 2'], ['paragraph 3'], ... ]
--   })
--
-- Page numbers and word counts are computed here, so the totals always match.
-- SECURITY INVOKER: runs with the caller's permissions, so RLS applies as usual.
create function public.import_book(p_book jsonb, p_pages jsonb)
returns uuid
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_user_id     uuid := auth.uid();
  v_book_id     uuid;
  v_total_pages integer;
  v_total_words integer;
begin
  if v_user_id is null then
    raise exception 'Not authenticated' using errcode = '42501';
  end if;

  if p_book is null or jsonb_typeof(p_book) <> 'object' then
    raise exception 'p_book must be an object' using errcode = '22023';
  end if;

  if p_pages is null or jsonb_typeof(p_pages) <> 'array' or jsonb_array_length(p_pages) = 0 then
    raise exception 'p_pages must be a non-empty array' using errcode = '22023';
  end if;

  insert into public.books (user_id, title, author, description, language, words_per_page)
  values (
    v_user_id,
    btrim(p_book ->> 'title'),
    nullif(btrim(p_book ->> 'author'), ''),
    nullif(btrim(p_book ->> 'description'), ''),
    nullif(btrim(p_book ->> 'language'), ''),
    (p_book ->> 'words_per_page')::integer
  )
  returning id into v_book_id;

  insert into public.pages (book_id, page_number, paragraphs, word_count)
  select
    v_book_id,
    page.ordinality::integer,
    paragraphs.list,
    public.count_words(paragraphs.list)
  from jsonb_array_elements(p_pages) with ordinality as page (content, ordinality)
  cross join lateral (
    select array(
      select btrim(item)
      from jsonb_array_elements_text(page.content) as item
      where btrim(item) <> ''
    ) as list
  ) as paragraphs;

  select count(*)::integer, coalesce(sum(word_count), 0)::integer
    into v_total_pages, v_total_words
    from public.pages
   where book_id = v_book_id;

  -- The owner may update their own books, so RLS allows this update.
  update public.books
     set total_words = v_total_words,
         total_pages = v_total_pages
   where id = v_book_id;

  return v_book_id;
end;
$$;

comment on function public.import_book(jsonb, jsonb) is
  'Creates a book with its pages in one transaction. Returns the new book id.';

revoke execute on function public.import_book(jsonb, jsonb) from public, anon;
grant execute on function public.import_book(jsonb, jsonb) to authenticated;
