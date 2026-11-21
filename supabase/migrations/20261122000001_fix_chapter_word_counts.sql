-- =============================================================================
-- Fix: chapters were saved with word_count = 0.
--
-- import_book inserted each chapter and then UPDATEd its word count, but the
-- previous migration removed the policy allowing chapter updates, so RLS
-- silently skipped that update. The function now counts the words before
-- inserting the chapter, so no update is needed.
-- =============================================================================

-- Repair chapters that were already imported (migrations run without RLS).
update public.chapters c
   set word_count = totals.words
  from (
    select chapter_id, sum(word_count)::integer as words
      from public.pages
     group by chapter_id
  ) as totals
 where totals.chapter_id = c.id
   and c.word_count <> totals.words;

create or replace function public.import_book(p_book jsonb, p_chapters jsonb)
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

    -- Count the chapter's words up front, so the chapter is inserted complete.
    select coalesce(sum(public.count_words(array(
             select item from jsonb_array_elements_text(page.content) as item
           ))), 0)::integer
      into v_chapter_words
      from jsonb_array_elements(v_chapter -> 'pages') as page (content);

    insert into public.chapters (book_id, position, first_page, last_page, word_count)
    values (v_book_id, v_position, v_first_page, v_first_page + v_page_count - 1, v_chapter_words)
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

    v_total_words := v_total_words + v_chapter_words;
    v_last_page   := v_last_page + v_page_count;
  end loop;

  -- The owner may update their own books, so this update is allowed by RLS.
  update public.books
     set total_words    = v_total_words,
         total_pages    = v_last_page,
         total_chapters = v_position
   where id = v_book_id;

  return v_book_id;
end;
$$;
