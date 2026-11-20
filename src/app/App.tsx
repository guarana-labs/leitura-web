import { RouterProvider } from 'react-router'
import { AuthProvider } from '@/app/providers/AuthProvider'
import { QueryProvider } from '@/app/providers/QueryProvider'
import { ThemeProvider } from '@/app/providers/ThemeProvider'
import { router } from '@/app/router'
import { Toaster } from '@/components/ui/sonner'

export function App() {
  return (
    <ThemeProvider>
      <QueryProvider>
        <AuthProvider>
          <RouterProvider router={router} />
        </AuthProvider>
      </QueryProvider>
      {/* Action feedback (saved, deleted, ...) shown at the bottom right. */}
      <Toaster position="bottom-right" />
    </ThemeProvider>
  )
}
