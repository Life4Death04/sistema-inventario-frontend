import { Plus, Search } from 'lucide-react'
import { useState } from 'react'

import { getUserRows, type UserRow } from '@/data/mockSelectors'
import { UserModals, type UserModalType } from '@/features/users/components/UserModals'
import { UsersTanStackTable } from '@/features/users/components/UsersTanStackTable'

export function UsersPage() {
  const users = getUserRows()
  const [query, setQuery] = useState('')
  const [roleFilter, setRoleFilter] = useState<'ALL' | UserRow['roleKey']>('ALL')
  const [activeModal, setActiveModal] = useState<UserModalType | null>(null)
  const [selectedUser, setSelectedUser] = useState<UserRow | null>(null)

  const filteredUsers = users.filter((user) => (roleFilter === 'ALL' ? true : user.roleKey === roleFilter))

  const metrics = {
    active: users.filter((user) => user.active).length,
    admins: users.filter((user) => user.roleKey === 'ADMIN').length,
    managers: users.filter((user) => user.roleKey === 'MANAGER').length,
    operators: users.filter((user) => user.roleKey === 'OPERATOR').length,
  }

  const openModal = (modalType: UserModalType, user: UserRow | null = null) => {
    setSelectedUser(user)
    setActiveModal(modalType)
  }

  const closeModal = () => {
    setActiveModal(null)
    setSelectedUser(null)
  }

  return (
    <>
      <section className="space-y-6">
        <div className="grid gap-4 md:grid-cols-4">
          <MetricCard label="Usuarios activos" value={metrics.active} />
          <MetricCard label="Administradores" value={metrics.admins} />
          <MetricCard label="Encargados" value={metrics.managers} />
          <MetricCard label="Operativos" value={metrics.operators} />
        </div>

        <section className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
          <div className="flex flex-1 flex-col gap-4 lg:flex-row lg:items-center">
            <label className="relative block w-full max-w-md">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--color-text-muted)]" />
              <input
                className="h-10 w-full rounded-[8px] border border-[var(--color-border)] bg-[var(--color-surface)] pl-10 pr-4 text-sm outline-none transition focus:border-[var(--color-primary)] focus:ring-1 focus:ring-[var(--color-primary)]"
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Buscar por nombre o correo"
                type="text"
                value={query}
              />
            </label>

            <div className="flex flex-wrap rounded-[8px] border border-[var(--color-border)] bg-[var(--color-surface)] p-1">
              {[
                { key: 'ALL', label: 'Todos' },
                { key: 'ADMIN', label: 'Administradores' },
                { key: 'MANAGER', label: 'Encargados' },
                { key: 'OPERATOR', label: 'Operativos' },
              ].map((item) => (
                <button
                  key={item.key}
                  className={`rounded-lg px-4 py-1.5 text-sm font-medium transition ${roleFilter === item.key ? 'bg-[var(--color-surface-tint)]/18 text-[var(--color-primary)]' : 'text-[var(--color-text-secondary)] hover:text-[var(--color-primary)]'}`}
                  onClick={() => setRoleFilter(item.key as 'ALL' | UserRow['roleKey'])}
                  type="button"
                >
                  {item.label}
                </button>
              ))}
            </div>
          </div>

          <button
            className="inline-flex min-h-10 items-center justify-center gap-2 rounded-[8px] bg-[var(--color-primary)] px-6 py-2.5 text-sm font-medium text-white transition hover:bg-[var(--color-primary-strong)]"
            onClick={() => openModal('create')}
            type="button"
          >
            <Plus className="h-4 w-4" />
            Nuevo usuario
          </button>
        </section>

        <UsersTanStackTable globalFilter={query} onEditUser={(user) => openModal('edit', user)} rows={filteredUsers} />
      </section>

      <UserModals modalType={activeModal} onClose={closeModal} user={selectedUser} />
    </>
  )
}

function MetricCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-[var(--radius-panel)] bg-[var(--color-surface)] p-5 transition hover:border hover:border-[var(--color-primary)]/20">
      <p className="text-xs font-semibold uppercase tracking-[0.05em] text-[var(--color-text-secondary)]">{label}</p>
      <p className="mt-1 font-data-mono text-[28px] text-[var(--color-text)]">{value}</p>
    </div>
  )
}
