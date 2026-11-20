import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useAuth } from '@/hooks/useAuth'
import { deleteBook, listBooks } from '@/services/bookService'
import type { Book, BookSummary } from '@/types/book'

/** Query keys in one place, so invalidation never misses a cache entry. */
export const bookKeys = {
  all: (userId: string) => ['books', userId] as const,
  list: (userId: string) => [...bookKeys.all(userId), 'list'] as const,
}

export function useBooks() {
  const { user } = useAuth()
  const userId = user?.id ?? 'anonymous'

  return useQuery<BookSummary[]>({
    queryKey: bookKeys.list(userId),
    queryFn: listBooks,
    enabled: user !== null,
  })
}

export function useDeleteBook() {
  const { user } = useAuth()
  const queryClient = useQueryClient()
  const userId = user?.id ?? 'anonymous'

  return useMutation({
    mutationFn: (book: Pick<Book, 'id' | 'coverPath'>) => deleteBook(book),
    onSuccess: (_result, book) => {
      // Remove it from the list right away, then refetch to stay in sync.
      queryClient.setQueryData<BookSummary[]>(bookKeys.list(userId), (books) =>
        books?.filter((item) => item.id !== book.id),
      )
      void queryClient.invalidateQueries({ queryKey: bookKeys.all(userId) })
    },
  })
}
