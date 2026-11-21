import { Outlet } from 'react-router'
import { AppFooter } from '@/components/layout/AppFooter'
import { AppHeader } from '@/components/layout/AppHeader'

/** Shell for every authenticated screen except the reader: header, page content, footer. */
export function AppLayout() {
  return (
    <div className="flex min-h-svh flex-col">
      <AppHeader />
      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-8 sm:px-6">
        <Outlet />
      </main>
      <AppFooter />
    </div>
  )
}
