import { useEffect } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { bookKeys } from '@/hooks/useBooks'
import { useAuth } from '@/hooks/useAuth'
import { getBookImageUrls, IMAGE_URL_TTL_SECONDS } from '@/services/bookImageService'
import { getPage, listPageSummaries } from '@/services/pageService'
import { saveProgress } from '@/services/progressService'
import type { BookPage, BookSummary, PageSummary } from '@/types/book'

const pageKey = (userId: string, bookId: string, pageNumber: number) =>
  [...bookKeys.all(userId), 'page', bookId, pageNumber] as const

/** The book's index (page numbers and word counts). Never changes after import. */
export function usePageSummaries(bookId: string) {
  const userId = useAuth().user?.id ?? 'anonymous'
  return useQuery<PageSummary[]>({
    queryKey: [...bookKeys.all(userId), 'pageList', bookId],
    queryFn: () => listPageSummaries(bookId),
    staleTime: Infinity,
    enabled: userId !== 'anonymous',
  })
}

/** One page of a book. Pages never change, so they are cached for the whole session. */
export function usePage(bookId: string, pageNumber: number) {
  const userId = useAuth().user?.id ?? 'anonymous'
  return useQuery<BookPage | null>({
    queryKey: pageKey(userId, bookId, pageNumber),
    queryFn: () => getPage(bookId, pageNumber),
    staleTime: Infinity,
    enabled: pageNumber >= 1,
  })
}

/**
 * Signed URLs for a page's images. Pages are cached for the whole session but
 * signed URLs expire, so these are refreshed a bit before they do.
 */
export function useBookImageUrls(paths: string[]) {
  const userId = useAuth().user?.id ?? 'anonymous'
  const key = [...new Set(paths)].sort()
  return useQuery<Map<string, string>>({
    queryKey: [...bookKeys.all(userId), 'imageUrls', ...key],
    queryFn: () => getBookImageUrls(key),
    staleTime: (IMAGE_URL_TTL_SECONDS - 10 * 60) * 1000,
    refetchInterval: (IMAGE_URL_TTL_SECONDS - 10 * 60) * 1000,
    enabled: key.length > 0,
  })
}

/** Loads the neighbouring pages in the background, so turning a page feels instant. */
export function usePrefetchPages(bookId: string, pageNumbers: number[]) {
  const userId = useAuth().user?.id ?? 'anonymous'
  const queryClient = useQueryClient()
  const key = pageNumbers.join(',')

  useEffect(() => {
    for (const pageNumber of key.split(',').map(Number)) {
      if (!Number.isInteger(pageNumber) || pageNumber < 1) continue
      void queryClient.prefetchQuery({
        queryKey: pageKey(userId, bookId, pageNumber),
        queryFn: () => getPage(bookId, pageNumber),
        staleTime: Infinity,
      })
    }
  }, [queryClient, userId, bookId, key])
}

/** Saves reading progress and updates the cached book data, so the library shows it right away. */
export function useSaveProgress(bookId: string) {
  const userId = useAuth().user?.id ?? 'anonymous'
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (pageNumber: number) => saveProgress(bookId, pageNumber),
    onSuccess: ({ updatedAt }, pageNumber) => {
      const update = (book: BookSummary): BookSummary =>
        book.id === bookId ? { ...book, currentPage: pageNumber, lastReadAt: updatedAt } : book

      queryClient.setQueryData<BookSummary | null>(bookKeys.detail(userId, bookId), (book) =>
        book ? update(book) : book,
      )
      queryClient.setQueryData<BookSummary[]>(bookKeys.list(userId), (books) => books?.map(update))
      // The list is sorted by last read; refetch it next time it's shown.
      void queryClient.invalidateQueries({ queryKey: bookKeys.list(userId), refetchType: 'none' })
    },
  })
}
