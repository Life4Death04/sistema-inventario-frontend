import { Plus, Search } from 'lucide-react'
import { useMemo, useState } from 'react'

import { Button } from '@/components/ui/Button'
import { getReplenishmentRows, type ReplenishmentRow } from '@/data/mockSelectors'
import { ReplenishmentModals, type ReplenishmentModalType } from '@/features/replenishment/components/ReplenishmentModals'
import { ReplenishmentTanStackTable } from '@/features/replenishment/components/ReplenishmentTanStackTable'

export function ReplenishmentPage() {
  const requests = getReplenishmentRows()
  const [query, setQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<'Todas' | 'Pendiente' | 'Enviada' | 'Recibida' | 'Cancelada'>('Todas')
  const [activeModal, setActiveModal] = useState<ReplenishmentModalType | null>(null)
  const [selectedRequest, setSelectedRequest] = useState<ReplenishmentRow | null>(null)
  const [openMenuId, setOpenMenuId] = useState<string | null>(null)

  const filteredRequests = useMemo(
    () => requests.filter((request) => (statusFilter === 'Todas' ? true : request.status === statusFilter)),
    [requests, statusFilter],
  )

  const metrics = {
    pending: requests.filter((request) => request.status === 'Pendiente').length,
    sent: requests.filter((request) => request.status === 'Enviada').length,
    received: requests.filter((request) => request.status === 'Recibida').length,
    cancelled: requests.filter((request) => request.status === 'Cancelada').length,
  }

  const openModal = (modalType: ReplenishmentModalType, request: ReplenishmentRow | null = null) => {
    setSelectedRequest(request)
    setOpenMenuId(null)
    setActiveModal(modalType)
  }

  const renderActionsMenu = (request: ReplenishmentRow) => (
    <div className="absolute right-0 top-full mt-1 w-44 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] shadow-lg z-20">
      <div className="p-1 flex flex-col">
        <button
          className="flex items-center gap-2 rounded px-3 py-2 text-left hover:bg-[var(--color-page-bg)]"
          onClick={(event) => {
            event.stopPropagation()
            openModal('detail', request)
          }}
          type="button"
        >
          <span className="h-2 w-2 rounded-full bg-[var(--color-text-muted)]" />
          <span className="text-sm font-medium text-[var(--color-text)]">Ver detalle</span>
        </button>
        <button
          className="flex items-center gap-2 rounded px-3 py-2 text-left hover:bg-[rgba(232,241,250,0.30)]"
          onClick={(event) => {
            event.stopPropagation()
            openModal('change-status', request)
          }}
          type="button"
        >
          <span className="h-2 w-2 rounded-full bg-[var(--color-primary)]" />
          <span className="text-sm font-medium text-[var(--color-primary)]">Cambiar estado</span>
        </button>
      </div>
    </div>
  )

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

          <Button onClick={() => openModal('generate')} type="button">
            <Plus className="mr-2 h-4 w-4" />
            Nueva solicitud
          </Button>
        </section>

        <ReplenishmentTanStackTable
          globalFilter={query}
          onMenuToggle={(requestId) => setOpenMenuId((current) => (current === requestId ? null : requestId))}
          onOpenDetail={(request) => openModal('detail', request)}
          openMenuId={openMenuId}
          renderActionsMenu={renderActionsMenu}
          rows={filteredRequests}
        />
      </section>

      <ReplenishmentModals modalType={activeModal} onClose={() => setActiveModal(null)} onOpenModal={openModal} request={selectedRequest} />
    </>
  )
}

function MetricCard({ label, value, tone }: { label: string; value: number; tone: 'default' | 'info' | 'success' | 'danger' }) {
  const toneClass = {
    default: 'text-[var(--color-text)]',
    info: 'text-[var(--color-primary)]',
    success: 'text-[var(--color-success-text)]',
    danger: 'text-[var(--color-danger-text)]',
  }

  return (
    <div className="bg-[var(--color-surface)] rounded-xl border border-[var(--color-border)] p-5">
      <p className="mb-2 text-xs font-semibold uppercase tracking-[0.05em] text-[var(--color-text-secondary)]">{label}</p>
      <p className={`text-[30px] font-semibold leading-[38px] ${toneClass[tone]}`}>{value}</p>
    </div>
  )
}
