-- =============================================================================
-- Images inside books (from EPUBs).
--
-- Each page keeps its text in `paragraphs` and gets an `images` list saying which
-- image goes before which paragraph:
--
--   [{ "path": "<user_id>/<book_id>/3.webp", "alt": "...", "width": 566, "height": 410, "before": 2 }]
--
-- `before` is the index of the paragraph the image comes before; it equals the
-- number of paragraphs when the image is at the end of the page. A page can be
-- only images (for example a full-page illustration), so it no longer needs text.
--
-- The image files live in the private `book-images` bucket, one folder per book.
-- =============================================================================

alter table public.pages
  add column images jsonb not null default '[]'::jsonb
  check (jsonb_typeof(images) = 'array');

-- A page needs text or at least one image.
alter table public.pages drop constraint pages_paragraphs_check;
alter table public.pages add constraint pages_has_content
  check (cardinality(paragraphs) >= 1 or jsonb_array_length(images) >= 1);

comment on column public.pages.images is
  'Images on the page: [{ path, alt, width, height, before }], "before" being the paragraph index.';

-- -----------------------------------------------------------------------------
-- import_book: now also accepts images.
--
--   supabase.rpc('import_book', {
--     p_book:  { id?, title, author?, description?, language?, words_per_page },
--     p_pages: [ { paragraphs: ['...'], images: [...] }, ... ]
--   })
--
-- The id is optional: the browser picks it when it uploads the book's images
-- first, so their folder already has the book's id. Pages may also be plain
-- arrays of paragraphs (the previous format), so older clients keep working.
-- -----------------------------------------------------------------------------
create or replace function public.import_book(p_book jsonb, p_pages jsonb)
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

  insert into public.books (id, user_id, title, author, description, language, words_per_page)
  values (
    coalesce((p_book ->> 'id')::uuid, gen_random_uuid()),
    v_user_id,
    btrim(p_book ->> 'title'),
    nullif(btrim(p_book ->> 'author'), ''),
    nullif(btrim(p_book ->> 'description'), ''),
    nullif(btrim(p_book ->> 'language'), ''),
    (p_book ->> 'words_per_page')::integer
  )
  returning id into v_book_id;

  insert into public.pages (book_id, page_number, paragraphs, images, word_count)
  select
    v_book_id,
    page.ordinality::integer,
    paragraphs.list,
    page.images,
    public.count_words(paragraphs.list)
  from (
    select
      item.ordinality,
      case jsonb_typeof(item.content) when 'array' then item.content else coalesce(item.content -> 'paragraphs', '[]') end
        as paragraphs,
      case jsonb_typeof(item.content) when 'object' then coalesce(item.content -> 'images', '[]') else '[]' end
        as images
    from jsonb_array_elements(p_pages) with ordinality as item (content, ordinality)
  ) as page
  cross join lateral (
    select array(
      select btrim(text_item)
      from jsonb_array_elements_text(page.paragraphs) as text_item
      where btrim(text_item) <> ''
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

-- -----------------------------------------------------------------------------
-- Storage bucket for book images.
--
-- Images are resized and converted to WebP in the browser before upload (an
-- original JPEG/PNG is kept when it's already smaller). The bucket is private:
-- the reader shows images through short-lived signed URLs. Files live at
-- "<user_id>/<book_id>/<n>.webp", and users can only touch their own folder.
-- -----------------------------------------------------------------------------
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'book-images',
  'book-images',
  false,
  5242880, -- 5 MB; a processed image is usually well under 300 KB.
  array['image/webp', 'image/jpeg', 'image/png']
)
on conflict (id) do nothing;

create policy "Users can read their own book images"
  on storage.objects for select to authenticated
  using (
    bucket_id = 'book-images'
    and (storage.foldername(name))[1] = (select auth.uid())::text
  );

create policy "Users can upload their own book images"
  on storage.objects for insert to authenticated
  with check (
    bucket_id = 'book-images'
    and (storage.foldername(name))[1] = (select auth.uid())::text
  );

create policy "Users can delete their own book images"
  on storage.objects for delete to authenticated
  using (
    bucket_id = 'book-images'
    and (storage.foldername(name))[1] = (select auth.uid())::text
  );
