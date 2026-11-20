-- =============================================================================
-- Storage bucket for book covers.
--
-- Covers are cropped to 2:3 and converted to WebP in the browser before upload.
-- The bucket is private: the app shows covers through short-lived signed URLs.
-- Files live at "<user_id>/<book_id>.webp", and users can only touch files
-- inside their own "<user_id>/" folder.
-- =============================================================================

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'covers',
  'covers',
  false,
  2097152, -- 2 MB; a processed cover is usually well under 200 KB.
  array['image/webp', 'image/jpeg', 'image/png']
)
on conflict (id) do nothing;

create policy "Users can read their own covers"
  on storage.objects for select to authenticated
  using (
    bucket_id = 'covers'
    and (storage.foldername(name))[1] = (select auth.uid())::text
  );

create policy "Users can upload their own covers"
  on storage.objects for insert to authenticated
  with check (
    bucket_id = 'covers'
    and (storage.foldername(name))[1] = (select auth.uid())::text
  );

-- Needed to replace an existing cover (upload with upsert).
create policy "Users can replace their own covers"
  on storage.objects for update to authenticated
  using (
    bucket_id = 'covers'
    and (storage.foldername(name))[1] = (select auth.uid())::text
  )
  with check (
    bucket_id = 'covers'
    and (storage.foldername(name))[1] = (select auth.uid())::text
  );

create policy "Users can delete their own covers"
  on storage.objects for delete to authenticated
  using (
    bucket_id = 'covers'
    and (storage.foldername(name))[1] = (select auth.uid())::text
  );
