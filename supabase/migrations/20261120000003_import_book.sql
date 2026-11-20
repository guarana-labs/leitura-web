-- =============================================================================
-- import_book: saves a whole book (metadata, chapters and pages) in a single
-- transaction, so a failed import never leaves a half-saved book behind.
--
-- The browser extracts and paginates the PDF, then calls:
--
--   supabase.rpc('import_book', {
--     p_book: {
--       title: 'Der Traum',            -- required
--       author: 'Jane Doe',            -- optional
--       description: '...',            -- optional
--       language: 'de',                -- optional
--       words_per_page: 400            -- required
--     },
--     p_chapters: [
--       { title: 'Kapitel 1', pages: [ ['paragraph 1', 'paragraph 2'], ['paragraph 3'] ] },
--       { title: 'Kapitel 2', pages: [ ... ] }
--     ]
--   })
--
-- Each page is an array of paragraphs. Page numbers and word counts are
-- computed here, so the stored totals are always consistent.
--
-- SECURITY INVOKER: runs with the caller's permissions, so all RLS policies
-- apply exactly as if the rows were inserted directly.
-- =============================================================================

-- Counts whitespace-separated words across a list of paragraphs.
create function public.count_words(p_paragraphs text[])
returns integer
language sql
immutable
set search_path = ''
as $$
  select coalesce(sum(
    case when btrim(p) = '' then 0
         else cardinality(regexp_split_to_array(btrim(p), '\s+'))
    end
  ), 0)::integer
  from unnest(p_paragraphs) as p;
$$;

create function public.import_book(p_book jsonb, p_chapters jsonb)
returns uuid
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_user_id       uuid := auth.uid();
  v_book_id       uuid;
  v_chapter       jsonb;
  v_chapter_id    uuid;
  v_position      integer := 0;
  v_last_page     integer := 0;
  v_first_page    integer;
  v_page_count    integer;
  v_chapter_words integer;
  v_total_words   integer := 0;
begin
  if v_user_id is null then
    raise exception 'Not authenticated' using errcode = '42501';
  end if;

  if p_book is null or jsonb_typeof(p_book) <> 'object' then
    raise exception 'p_book must be an object' using errcode = '22023';
  end if;

  if p_chapters is null or jsonb_typeof(p_chapters) <> 'array' or jsonb_array_length(p_chapters) = 0 then
    raise exception 'p_chapters must be a non-empty array' using errcode = '22023';
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

  for v_chapter in select value from jsonb_array_elements(p_chapters)
  loop
    v_position   := v_position + 1;
    v_first_page := v_last_page + 1;

    if jsonb_typeof(v_chapter -> 'pages') <> 'array' or jsonb_array_length(v_chapter -> 'pages') = 0 then
      raise exception 'Chapter % has no pages', v_position using errcode = '22023';
    end if;

    v_page_count := jsonb_array_length(v_chapter -> 'pages');

    insert into public.chapters (book_id, position, title, first_page, last_page)
    values (
      v_book_id,
      v_position,
      btrim(v_chapter ->> 'title'),
      v_first_page,
      v_first_page + v_page_count - 1
    )
    returning id into v_chapter_id;

    -- Insert all pages of the chapter at once, numbered continuously across the book.
    insert into public.pages (book_id, chapter_id, page_number, paragraphs, word_count)
    select
      v_book_id,
      v_chapter_id,
      v_last_page + page.ordinality::integer,
      paragraphs.list,
      public.count_words(paragraphs.list)
    from jsonb_array_elements(v_chapter -> 'pages') with ordinality as page (content, ordinality)
    cross join lateral (
      select array(
        select btrim(item)
        from jsonb_array_elements_text(page.content) as item
        where btrim(item) <> ''
      ) as list
    ) as paragraphs;

    select coalesce(sum(word_count), 0)::integer
      into v_chapter_words
      from public.pages
     where chapter_id = v_chapter_id;

    update public.chapters set word_count = v_chapter_words where id = v_chapter_id;

    v_total_words := v_total_words + v_chapter_words;
    v_last_page   := v_last_page + v_page_count;
  end loop;

  update public.books
     set total_words    = v_total_words,
         total_pages    = v_last_page,
         total_chapters = v_position
   where id = v_book_id;

  return v_book_id;
end;
$$;

comment on function public.import_book(jsonb, jsonb) is
  'Creates a book with its chapters and pages in one transaction. Returns the new book id.';

-- Only signed-in users may call these functions.
revoke execute on function public.import_book(jsonb, jsonb) from public, anon;
grant execute on function public.import_book(jsonb, jsonb) to authenticated;

revoke execute on function public.count_words(text[]) from public, anon;
grant execute on function public.count_words(text[]) to authenticated;
