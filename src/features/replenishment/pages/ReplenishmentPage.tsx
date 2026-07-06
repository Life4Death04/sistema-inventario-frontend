import { Plus, Search } from 'lucide-react'
import { MetricCard } from '@/components/ui/MetricCard'
import { useState } from 'react'

import { Button } from '@/components/ui/Button'
import { Loading } from '@/components/ui/Loading'
import { hasPermission } from '@/features/auth/lib/permissions'
import { useAuthStore } from '@/features/auth/store/auth.store'
import { ReplenishmentModals, type ReplenishmentModalType } from '@/features/replenishment/components/ReplenishmentModals'
import { ReplenishmentTanStackTable } from '@/features/replenishment/components/ReplenishmentTanStackTable'
import { useReplenishmentRequests } from '@/features/replenishment/api/useReplenishmentRequests'
import { type ReplenishmentRow, toReplenishmentRow } from '@/features/replenishment/lib/replenishmentView'

export function ReplenishmentPage() {
  const user = useAuthStore((state) => state.user)
  const [query, setQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<'Todas' | 'Pendiente' | 'Enviada' | 'Recibida' | 'Cancelada'>('Todas')
  const [activeModal, setActiveModal] = useState<ReplenishmentModalType | null>(null)
  const [selectedRequest, setSelectedRequest] = useState<ReplenishmentRow | null>(null)
  const canManage = hasPermission(user?.role, 'manage:replenishment')
  const { data, isError, isLoading } = useReplenishmentRequests({ pageSize: 100 })

  const requests = (data?.data ?? []).map(toReplenishmentRow)
  const filteredRequests = requests.filter((request) => {
    const matchesStatus = statusFilter === 'Todas' ? true : request.status === statusFilter
    const normalizedQuery = query.trim().toLowerCase()
    const matchesQuery =
      !normalizedQuery ||
      [request.id, request.supplier, request.requestedBy, request.status, request.notes].some((value) => value.toLowerCase().includes(normalizedQuery))

    return matchesStatus && matchesQuery
  })

  const metrics = {
    pending: requests.filter((request) => request.rawStatus === 'PENDING').length,
    sent: requests.filter((request) => request.rawStatus === 'SENT').length,
    received: requests.filter((request) => request.rawStatus === 'RECEIVED').length,
    cancelled: requests.filter((request) => request.rawStatus === 'CANCELLED').length,
  }

  const openModal = (modalType: ReplenishmentModalType, request: ReplenishmentRow | null = null) => {
    setSelectedRequest(request)
    setActiveModal(modalType)
  }


  return (
    <>
      <section className="space-y-8">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
          <MetricCard label="Pendientes" tone="default" value={metrics.pending} />
          <MetricCard label="Enviadas" tone="info" value={metrics.sent} />
          <MetricCard label="Recibidas (mes)" tone="success" value={metrics.received} />
          <MetricCard label="Canceladas (mes)" tone="danger" value={metrics.cancelled} />
        </div>

        <section className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="flex bg-[var(--color-surface-container)] rounded-lg p-1 flex-wrap">
            {(['Todas', 'Pendiente', 'Enviada', 'Recibida', 'Cancelada'] as const).map((item) => (
              <button
                key={item}
                className={`px-4 py-1.5 rounded-md text-sm font-medium transition ${statusFilter === item ? 'bg-[var(--color-surface)] text-[var(--color-primary)] shadow-sm' : 'text-[var(--color-text-secondary)] hover:text-[var(--color-primary)]'}`}
                onClick={() => setStatusFilter(item)}
                type="button"
              >
                {item}
              </button>
            ))}
          </div>

          <div className="flex-1 max-w-md mx-0 md:mx-4 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[var(--color-text-muted)]" />
            <input className="w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] pl-10 pr-4 py-2 text-sm outline-none transition focus:border-[var(--color-primary)] focus:ring-1 focus:ring-[var(--color-primary)]" onChange={(event) => setQuery(event.target.value)} placeholder="Buscar por n.º, producto o proveedor" type="text" value={query} />
          </div>

          {canManage ? (
            <Button onClick={() => openModal('generate')} type="button">
              <Plus className="mr-2 h-4 w-4" />
              Nueva solicitud
            </Button>
          ) : null}
        </section>

        {isLoading ? <Loading /> : null}
        {!isLoading && isError ? <ReplenishmentStateMessage label="No fue posible cargar las solicitudes reales de reposición." tone="error" /> : null}
        {!isLoading && !isError && filteredRequests.length === 0 ? <ReplenishmentStateMessage label="No hay solicitudes de reposición para mostrar." /> : null}
        {!isLoading && !isError && filteredRequests.length > 0 ? (
          <ReplenishmentTanStackTable
            canShowMenu={(request) => canManage && canChangeReplenishmentStatus(request.rawStatus)}
            globalFilter={query}
            onChangeStatus={(request) => openModal('change-status', request)}
            onOpenDetail={(request) => openModal('detail', request)}
            rows={filteredRequests}
          />
        ) : null}
      </section>

      <ReplenishmentModals modalType={activeModal} onClose={() => setActiveModal(null)} onOpenModal={openModal} request={selectedRequest} />
    </>
  )
}

function ReplenishmentStateMessage({ label, tone = 'muted' }: { label: string; tone?: 'error' | 'muted' }) {
  return (
    <div className={`rounded-[var(--radius-panel)] border border-[var(--color-border)] bg-[var(--color-surface)] px-4 py-6 text-sm ${tone === 'error' ? 'text-[var(--color-danger-text)]' : 'text-[var(--color-text-secondary)]'}`}>
      {label}
    </div>
  )
}

function canChangeReplenishmentStatus(status: ReplenishmentRow['rawStatus']) {
  return status === 'PENDING' || status === 'SENT'
}


