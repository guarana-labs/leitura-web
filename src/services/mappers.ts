import type { Book } from '@/types/book'
import type { TableRow } from '@/types/database'

export function mapBookRow(row: TableRow<'books'>): Book {
  return {
    id: row.id,
    title: row.title,
    author: row.author,
    description: row.description,
    language: row.language,
    coverPath: row.cover_path,
    wordsPerPage: row.words_per_page,
    totalWords: row.total_words,
    totalPages: row.total_pages,
    totalChapters: row.total_chapters,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
}
