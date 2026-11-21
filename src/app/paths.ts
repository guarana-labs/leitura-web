/** Central place for route paths, so links never hardcode URLs. */
export const paths = {
  login: '/login',
  resetPassword: '/reset-password',
  dashboard: '/books',
  importBook: '/books/import',
  book: (bookId: string) => `/books/${bookId}`,
  reader: (bookId: string, pageNumber: number) => `/books/${bookId}/read/${pageNumber}`,
} as const
