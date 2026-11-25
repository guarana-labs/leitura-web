import { useMutation, useQueryClient } from '@tanstack/react-query'
import { bookKeys } from '@/hooks/useBooks'
import { useAuth } from '@/hooks/useAuth'
import type { ImageProgressCallback } from '@/services/bookImageService'
import { saveImportedBook } from '@/services/importService'
import type { BookImport } from '@/types/book'

interface ImportVariables {
  book: BookImport
  cover: Blob | null
  onImageProgress?: ImageProgressCallback
}

export function useImportBook() {
  const { user } = useAuth()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ book, cover, onImageProgress }: ImportVariables) => saveImportedBook(book, cover, onImageProgress),
    onSuccess: () => {
      if (user) void queryClient.invalidateQueries({ queryKey: bookKeys.all(user.id) })
    },
  })
}
