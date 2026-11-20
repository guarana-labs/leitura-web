import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useAuth } from '@/hooks/useAuth'
import {
  deleteBook,
  getBook,
  listBooks,
  listChapters,
  updateBook,
  type BookMetadataUpdate,
  type CoverUpdate,
} from '@/services/bookService'
import type { Book, BookSummary, Chapter } from '@/types/book'

/** Query keys in one place, so invalidation never misses a cache entry. */
export const bookKeys = {
  all: (userId: string) => ['books', userId] as const,
  list: (userId: string) => [...bookKeys.all(userId), 'list'] as const,
  detail: (userId: string, bookId: string) => [...bookKeys.all(userId), 'detail', bookId] as const,
  chapters: (userId: string, bookId: string) => [...bookKeys.all(userId), 'chapters', bookId] as const,
}

function useUserId(): string | null {
  return useAuth().user?.id ?? null
}

export function useBooks() {
  const userId = useUserId()

  return useQuery<BookSummary[]>({
    queryKey: bookKeys.list(userId ?? 'anonymous'),
    queryFn: listBooks,
    enabled: userId !== null,
  })
}

export function useBook(bookId: string) {
  const userId = useUserId()

  return useQuery<BookSummary | null>({
    queryKey: bookKeys.detail(userId ?? 'anonymous', bookId),
    queryFn: () => getBook(bookId),
    enabled: userId !== null,
  })
}

export function useChapters(bookId: string) {
  const userId = useUserId()

  return useQuery<Chapter[]>({
    queryKey: bookKeys.chapters(userId ?? 'anonymous', bookId),
    queryFn: () => listChapters(bookId),
    enabled: userId !== null,
    // Chapters never change after import.
    staleTime: Infinity,
  })
}

export function useUpdateBook() {
  const userId = useUserId() ?? 'anonymous'
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({
      book,
      metadata,
      cover,
    }: {
      book: Pick<Book, 'id' | 'coverPath'>
      metadata: BookMetadataUpdate
      cover: CoverUpdate
    }) => updateBook(book, metadata, cover),
    // Refetch even after a partial failure (details saved, cover not), so the page shows what was saved.
    onSettled: (_result, _error, { book }) => {
      void queryClient.invalidateQueries({ queryKey: bookKeys.detail(userId, book.id) })
      void queryClient.invalidateQueries({ queryKey: bookKeys.list(userId) })
    },
  })
}

export function useDeleteBook() {
  const userId = useUserId() ?? 'anonymous'
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (book: Pick<Book, 'id' | 'coverPath'>) => deleteBook(book),
    onSuccess: (_result, book) => {
      // Drop the book's own cache entries (refetching them would just return "not found"),
      // remove it from the list right away, then refetch the list to stay in sync.
      queryClient.removeQueries({ queryKey: bookKeys.detail(userId, book.id) })
      queryClient.removeQueries({ queryKey: bookKeys.chapters(userId, book.id) })
      queryClient.setQueryData<BookSummary[]>(bookKeys.list(userId), (books) =>
        books?.filter((item) => item.id !== book.id),
      )
      void queryClient.invalidateQueries({ queryKey: bookKeys.list(userId) })
    },
  })
}
