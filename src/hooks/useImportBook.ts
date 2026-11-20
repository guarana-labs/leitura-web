import { useMutation, useQueryClient } from '@tanstack/react-query'
import { bookKeys } from '@/hooks/useBooks'
import { useAuth } from '@/hooks/useAuth'
import { saveImportedBook } from '@/services/importService'
import type { BookImport } from '@/types/book'

export function useImportBook() {
  const { user } = useAuth()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ book, cover }: { book: BookImport; cover: Blob | null }) => saveImportedBook(book, cover),
    onSuccess: () => {
      if (user) void queryClient.invalidateQueries({ queryKey: bookKeys.all(user.id) })
    },
  })
}
