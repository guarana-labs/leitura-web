import type { Book, Chapter } from '@/types/book'
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

export function mapChapterRow(row: TableRow<'chapters'>): Chapter {
  return {
    id: row.id,
    bookId: row.book_id,
    position: row.position,
    firstPage: row.first_page,
    lastPage: row.last_page,
    wordCount: row.word_count,
  }
}
