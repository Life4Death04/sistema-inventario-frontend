import { LogOut, X } from 'lucide-react'
import { NavLink } from 'react-router-dom'

import { navigation, profileNavigationItem } from '@/components/layout/navigation'
import { useAuthStore } from '@/features/auth/store/auth.store'

interface SidebarProps {
  isChromeVisible: boolean
  isOpen: boolean
  onClose: () => void
}

export function Sidebar({ isChromeVisible, isOpen, onClose }: SidebarProps) {
  const logout = useAuthStore((state) => state.logout)

  return (
    <>
      <div
        className={`fixed inset-0 z-40 bg-[#0e1d27]/32 transition lg:hidden ${isOpen ? 'pointer-events-auto opacity-100' : 'pointer-events-none opacity-0'}`}
        onClick={onClose}
      />

      <aside
        className={`fixed inset-y-0 left-0 z-50 flex w-[286px] max-w-[100vw] flex-col overflow-hidden border-r border-[var(--color-border)] bg-[var(--color-surface)] transition-transform duration-200 md:w-[232px] ${
          isOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
        } ${
          isChromeVisible ? 'translate-y-0' : '-translate-y-full md:translate-y-0'
        }`}
      >
        <div className="flex items-start justify-between border-b border-[var(--color-border)] p-5 sm:p-6">
          <div>
            <h2 className="text-[20px] font-semibold text-[var(--color-primary)]">High Meds C.A.</h2>
            <p className="mt-1 text-[13px] text-[var(--color-text-secondary)]">Gestion farmaceutica</p>
          </div>

          <button className="rounded-[var(--radius-control)] p-2 text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-strong)] md:hidden" onClick={onClose} type="button">
            <X className="h-5 w-5" />
          </button>
        </div>

        <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-4">
          {navigation.map((item) => {
            const Icon = item.icon

            return (
              <NavLink
                key={item.to}
                className={({ isActive }) =>
                  `flex items-center gap-3 rounded-[var(--radius-control)] px-4 py-3 text-sm transition ${
                    isActive
                      ? 'bg-[var(--color-surface-tint)] font-semibold text-[var(--color-primary)]'
                      : 'text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-strong)] hover:text-[var(--color-primary)]'
                  }`
                }
                onClick={onClose}
                to={item.to}
              >
                <Icon className="h-4 w-4 shrink-0" />
                {item.label}
              </NavLink>
            )
          })}
        </nav>

        <div className="border-t border-[var(--color-border)] p-3">
          <NavLink
            className={({ isActive }) =>
              `mb-1 flex items-center gap-3 rounded-[var(--radius-control)] px-4 py-3 text-sm transition ${
                isActive
                  ? 'bg-[var(--color-surface-tint)] font-semibold text-[var(--color-primary)]'
                  : 'text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-strong)] hover:text-[var(--color-primary)]'
              }`
            }
            onClick={onClose}
            to={profileNavigationItem.to}
          >
            <profileNavigationItem.icon className="h-4 w-4 shrink-0" />
            {profileNavigationItem.label}
          </NavLink>

          <button
            className="flex w-full items-center gap-3 rounded-[var(--radius-control)] px-4 py-3 text-sm text-[var(--color-text-secondary)] transition hover:bg-[var(--color-surface-strong)] hover:text-[var(--color-primary)]"
            onClick={logout}
            type="button"
          >
            <LogOut className="h-4 w-4 shrink-0" />
            Cerrar sesion
          </button>
        </div>
      </aside>
    </>
  )
}
