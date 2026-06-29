import { Menu } from 'lucide-react'
import { useLocation } from 'react-router-dom'

import { getRouteMeta } from '@/components/layout/navigation'
import { useAuthStore } from '@/features/auth/store/auth.store'

const roleLabels = {
  ADMIN: 'Administrador',
  MANAGER: 'Encargado de inventario',
  OPERATOR: 'Personal operativo',
}

interface HeaderProps {
  isChromeVisible: boolean
  onMenuToggle: () => void
}

export function Header({ isChromeVisible, onMenuToggle }: HeaderProps) {
  const user = useAuthStore((state) => state.user)
  const location = useLocation()
  const routeMeta = getRouteMeta(location.pathname)

  return (
    <header
      className={`fixed inset-x-0 top-0 z-30 border-b border-[var(--color-border)] bg-[var(--color-surface)] transition-transform duration-200 md:left-[232px] ${
        isChromeVisible ? 'translate-y-0' : '-translate-y-full md:translate-y-0'
      }`}
    >
      <div className="px-4 py-4 sm:px-5 md:px-6">
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-start gap-3">
          <button
            className="mt-0.5 rounded-[var(--radius-control)] border border-[var(--color-border)] p-2 text-[var(--color-text-secondary)] transition hover:bg-[var(--color-surface-strong)] md:hidden"
            onClick={onMenuToggle}
            type="button"
          >
            <Menu className="h-5 w-5" />
          </button>

          <div className="min-w-0">
            <p className="truncate text-[22px] font-semibold leading-7 text-[var(--color-primary)] sm:text-[24px] sm:leading-8">{routeMeta.label}</p>
            <p className="mt-1 text-sm text-[var(--color-text-secondary)]">{routeMeta.description}</p>
          </div>
        </div>

        <div className="flex shrink-0 items-center gap-3">
          <div className="hidden text-right sm:block">
            <p className="text-sm font-semibold text-[var(--color-text)]">{user?.fullName}</p>
            <p className="text-xs text-[var(--color-text-secondary)]">{user ? roleLabels[user.role] : ''}</p>
          </div>

          <div className="flex h-10 w-10 items-center justify-center rounded-full border border-[var(--color-border)] bg-[var(--color-surface-tint)] text-sm font-semibold text-[var(--color-primary)]">
            {user?.fullName?.charAt(0) ?? 'U'}
          </div>
        </div>
      </div>
      </div>
    </header>
  )
}
