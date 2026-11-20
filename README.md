# Leitura

Import your PDF books and read them in a clean, paginated reader.
The PDF itself is never stored: its text is extracted in the browser, split
into pages of about _N_ words (never cutting a paragraph) and saved to Supabase.

Stack: React + Vite + TypeScript, shadcn/ui, Tailwind CSS, Supabase, Bun.
The UI is in Brazilian Portuguese (`src/locales/pt-BR.json`); code and comments are in English.

## Getting started

```bash
bun install
bun run dev
```

## Supabase setup

1. **Environment variables.** Copy `.env.example` to `.env.local` and fill in the
   values from _Project Settings → API Keys_ (Project URL and the **publishable** key, `sb_publishable_…`).
   Never put the secret key (`sb_secret_…`) in a `VITE_` variable: those are bundled into the public JavaScript.
2. **Database.** Apply the files in `supabase/migrations/` **in order**. Either:
   - paste each file into the dashboard's _SQL Editor_ and run it, or
   - with the Supabase CLI: `bun x supabase link --project-ref <ref>` then `bun x supabase db push`.
3. **Auth.** In _Authentication → Sign In / Providers → Email_:
   - keep **Email** enabled;
   - turn **off** "Confirm email" (users can sign in right after signing up).

### What the migrations create

| File | Contents |
| --- | --- |
| `…_initial_schema.sql` | `books`, `chapters`, `pages`, `reading_progress` + Row Level Security |
| `…_covers_storage.sql` | private `covers` bucket (`<user_id>/<book_id>.webp`) + storage policies |
| `…_import_book.sql` | `import_book(p_book, p_chapters)`: saves a whole book in one transaction |

Every user only sees their own books, covers and progress.

## Project structure

```
src/
  app/          entry, router, route paths, providers (theme)
  pages/        route screens; compose components, no data logic
  components/
    ui/         shadcn/ui components (generated)
    layout/     header, page shell
    books/      library table, cover, chapter index
    reader/     reader view and controls
    import/     PDF dropzone, preview, details form, cover cropper
  services/     all Supabase access (auth, books, pages, progress, covers)
  lib/
    pdf/        PDF text extraction (Web Worker) and text cleanup
    pagination/ splits chapters into pages of ~N words
    supabase.ts Supabase client
    i18n.ts     translations setup
  hooks/        React hooks
  types/        domain and database types
  locales/      UI translations (pt-BR)
  utils/        small helpers
supabase/
  migrations/   SQL migrations
```
