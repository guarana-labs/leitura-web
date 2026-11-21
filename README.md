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
2. **Database.** Add `DATABASE_URL` to `.env` (dashboard → _Connect_ → **Session pooler** string;
   the direct `db.<ref>.supabase.co` host needs IPv6). Then apply pending migrations:

   ```bash
   bun run db:push
   ```

   Only migrations not yet applied are run; the history is stored in the database.
   New schema changes go in a new file in `supabase/migrations/` (`<timestamp>_<name>.sql`).
3. **Auth.** In _Authentication → Sign In / Providers → Email_:
   - keep **Email** enabled;
   - turn **off** "Confirm email" (users can sign in right after signing up).

### Data model

- `books`: metadata, cover path, `words_per_page` and totals.
- `pages`: the text, one row per page (about `words_per_page` words, never cutting
  a paragraph), numbered 1..N across the book.
- `reading_progress`: the last page each user read in each book.
- `covers` storage bucket (private): `<user_id>/<book_id>-<timestamp>.webp`.
- `import_book(p_book, p_pages)`: saves a whole book in one transaction.

Every user only sees their own books, covers and progress (Row Level Security).
The files in `supabase/migrations/` are the history of how this schema evolved.

## Project structure

```
src/
  app/          entry, router, route paths, providers (theme)
  pages/        route screens; compose components, no data logic
  components/
    ui/         shadcn/ui components (generated)
    layout/     header, page shell
    books/      library table, cover, book form, go-to-page
    reader/     reader view and controls
    import/     file dropzone, extraction progress, review and preview
  services/     all Supabase access (auth, books, pages, progress, covers)
  lib/
    import/     shared entry point for reading book files
    pdf/        PDF text extraction (pdf.js Web Worker) and text cleanup
    epub/       EPUB text extraction (unzip + XHTML)
    pagination/ splits the text into pages of ~N words
    supabase.ts Supabase client
    i18n.ts     translations setup
  hooks/        React hooks
  types/        domain and database types
  locales/      UI translations (pt-BR)
  utils/        small helpers
supabase/
  migrations/   SQL migrations
```
