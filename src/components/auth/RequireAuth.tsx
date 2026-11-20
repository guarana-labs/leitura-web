import { Navigate, Outlet, useLocation } from 'react-router'
import { paths } from '@/app/paths'
import { FullPageSpinner } from '@/components/layout/FullPageSpinner'
import { useAuth } from '@/hooks/useAuth'

/** Renders child routes only for signed-in users; otherwise sends them to login. */
export function RequireAuth() {
  const { session, isLoading } = useAuth()
  const location = useLocation()

  if (isLoading) return <FullPageSpinner />

  if (!session) {
    // Remember where the user was going, so login can send them back there.
    return <Navigate to={paths.login} replace state={{ from: location.pathname + location.search }} />
  }

  return <Outlet />
}
