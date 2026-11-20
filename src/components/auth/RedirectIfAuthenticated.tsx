import { Navigate, Outlet, useLocation } from 'react-router'
import { paths } from '@/app/paths'
import { FullPageSpinner } from '@/components/layout/FullPageSpinner'
import { useAuth } from '@/hooks/useAuth'

/** Keeps signed-in users away from the login screen. */
export function RedirectIfAuthenticated() {
  const { session, isLoading } = useAuth()
  const location = useLocation()

  if (isLoading) return <FullPageSpinner />

  if (session) {
    const from = (location.state as { from?: string } | null)?.from
    return <Navigate to={from ?? paths.dashboard} replace />
  }

  return <Outlet />
}
