import { useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { LogOut } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { useAuth } from '@/hooks/useAuth'
import { signOut } from '@/services/authService'

/** Avatar button showing the signed-in email, with a sign-out action. */
export function UserMenu() {
  const { t } = useTranslation()
  const { user } = useAuth()
  const queryClient = useQueryClient()
  const [isSigningOut, setIsSigningOut] = useState(false)

  const email = user?.email ?? ''
  const initial = email.charAt(0).toUpperCase() || '?'

  async function handleSignOut() {
    setIsSigningOut(true)
    try {
      // The route guard sends the user to the login screen once the session is gone.
      await signOut()
      // Drop cached data so the next user on this browser never sees it.
      queryClient.clear()
    } finally {
      setIsSigningOut(false)
    }
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="rounded-full" aria-label={t('nav.accountMenu')}>
          <span className="flex size-7 items-center justify-center rounded-full border bg-gradient-to-br from-muted to-background font-mono text-xs font-medium">
            {initial}
          </span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel className="truncate font-normal text-muted-foreground">{email}</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem onSelect={handleSignOut} disabled={isSigningOut}>
          <LogOut aria-hidden />
          {t('nav.signOut')}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
