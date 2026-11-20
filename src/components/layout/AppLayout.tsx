import { Outlet } from 'react-router'
import { AppHeader } from '@/components/layout/AppHeader'

/** Shell for every authenticated screen: header on top, page content below. */
export function AppLayout() {
  return (
    <div className="min-h-svh">
      <AppHeader />
      <main className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6">
        <Outlet />
      </main>
    </div>
  )
}
