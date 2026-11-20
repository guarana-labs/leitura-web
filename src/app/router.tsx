import { createBrowserRouter, Navigate } from 'react-router'
import { paths } from '@/app/paths'
import { RedirectIfAuthenticated } from '@/components/auth/RedirectIfAuthenticated'
import { RequireAuth } from '@/components/auth/RequireAuth'
import { AppLayout } from '@/components/layout/AppLayout'
import { BookDetailsPage } from '@/pages/BookDetailsPage'
import { DashboardPage } from '@/pages/DashboardPage'
import { ImportBookPage } from '@/pages/ImportBookPage'
import { LoginPage } from '@/pages/LoginPage'
import { NotFoundPage } from '@/pages/NotFoundPage'
import { ReaderPage } from '@/pages/ReaderPage'

export const router = createBrowserRouter([
  {
    element: <RedirectIfAuthenticated />,
    children: [{ path: paths.login, element: <LoginPage /> }],
  },
  {
    element: <RequireAuth />,
    children: [
      {
        element: <AppLayout />,
        children: [
          { path: '/', element: <Navigate to={paths.dashboard} replace /> },
          { path: paths.dashboard, element: <DashboardPage /> },
          { path: paths.importBook, element: <ImportBookPage /> },
          { path: '/books/:bookId', element: <BookDetailsPage /> },
          { path: '/books/:bookId/read/:pageNumber', element: <ReaderPage /> },
        ],
      },
    ],
  },
  { path: '*', element: <NotFoundPage /> },
])
