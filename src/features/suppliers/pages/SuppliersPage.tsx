import { Building2, ClipboardList, Plus, Search, ShieldCheck, TriangleAlert } from 'lucide-react'
import { useState } from 'react'

import { getProductRows, getSupplierRows, type SupplierRow } from '@/data/mockSelectors'
import { SupplierModals, type SupplierModalType } from '@/features/suppliers/components/SupplierModals'
import { SuppliersTanStackTable } from '@/features/suppliers/components/SuppliersTanStackTable'

export function SuppliersPage() {
  const suppliers = getSupplierRows()
  const products = getProductRows()
  const [query, setQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'ACTIVE' | 'INACTIVE'>('ALL')
  const [activeModal, setActiveModal] = useState<SupplierModalType | null>(null)
  const [selectedSupplier, setSelectedSupplier] = useState<SupplierRow | null>(null)

  const filteredSuppliers = suppliers.filter((supplier) => {
    if (statusFilter === 'ACTIVE') {
      return supplier.active
    }

    if (statusFilter === 'INACTIVE') {
      return !supplier.active
    }

    return true
  })

  const metrics = {
    active: suppliers.filter((supplier) => supplier.active).length,
    total: suppliers.length,
    productsWithoutSupplier: products.filter((product) => product.suppliers.length === 0).length,
    requestsThisMonth: 17,
  }

  const openModal = (modalType: SupplierModalType, supplier: SupplierRow | null = null) => {
    setSelectedSupplier(supplier)
    setActiveModal(modalType)
  }

  const closeModal = () => {
    setActiveModal(null)
    setSelectedSupplier(null)
  }

  return (
    <>
      <section className="space-y-6">
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
          <MetricCard icon={<ShieldCheck className="h-[18px] w-[18px]" />} iconClassName="bg-[var(--color-success-bg)] text-[var(--color-success-text)]" label="Proveedores activos" value={metrics.active} />
          <MetricCard icon={<Building2 className="h-[18px] w-[18px]" />} iconClassName="bg-[var(--color-surface-variant)] text-[var(--color-primary)]" label="Total de proveedores" value={metrics.total} />
          <MetricCard icon={<TriangleAlert className="h-[18px] w-[18px]" />} iconClassName="bg-[var(--color-warning-bg)] text-[var(--color-warning-text)]" label="Productos sin proveedor" tone="warning" value={metrics.productsWithoutSupplier} />
          <MetricCard icon={<ClipboardList className="h-[18px] w-[18px]" />} iconClassName="bg-[var(--color-surface-tint)]/18 text-[var(--color-primary)]" label="Solicitudes este mes" value={metrics.requestsThisMonth} />
        </div>

        <div className="flex flex-col gap-4 rounded-[var(--radius-panel)] border border-[var(--color-border)] bg-[var(--color-surface)] p-4 lg:flex-row lg:items-center lg:justify-between">
          <label className="relative w-full lg:w-80">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-[var(--color-text-muted)]" />
            <input
              className="w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] py-2 pl-10 pr-4 text-sm outline-none transition focus:border-[var(--color-primary)] focus:ring-2 focus:ring-[color:rgba(0,71,130,0.10)]"
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Buscar proveedor, RIF o contacto..."
              type="text"
              value={query}
            />
          </label>

          <div className="flex w-full flex-col gap-4 sm:flex-row sm:items-center sm:justify-end lg:w-auto">
            <div className="flex rounded-lg border border-[var(--color-border)] bg-[var(--color-surface-variant)] p-1">
              {[
                { key: 'ALL', label: 'Todos' },
                { key: 'ACTIVE', label: 'Activos' },
                { key: 'INACTIVE', label: 'Inactivos' },
              ].map((item) => (
                <button
                  key={item.key}
                  className={`rounded px-4 py-1.5 text-sm transition ${statusFilter === item.key ? 'border border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-primary)] shadow-sm' : 'text-[var(--color-text-secondary)] hover:text-[var(--color-text)]'}`}
                  onClick={() => setStatusFilter(item.key as 'ALL' | 'ACTIVE' | 'INACTIVE')}
                  type="button"
                >
                  {item.label}
                </button>
              ))}
            </div>

            <button
              className="inline-flex items-center justify-center gap-2 rounded-lg bg-[var(--color-primary)] px-4 py-2.5 text-sm font-medium text-white transition hover:bg-[var(--color-primary-strong)]"
              onClick={() => openModal('create')}
              type="button"
            >
              <Plus className="h-4 w-4" />
              Nuevo proveedor
            </button>
          </div>
        </div>

        <SuppliersTanStackTable globalFilter={query} onEditSupplier={(supplier) => openModal('edit', supplier)} rows={filteredSuppliers} />
      </section>

      <SupplierModals modalType={activeModal} onClose={closeModal} supplier={selectedSupplier} />
    </>
  )
}

function MetricCard({
  icon,
  iconClassName,
  label,
  value,
  tone = 'default',
}: {
  icon: React.ReactNode
  iconClassName: string
  label: string
  value: number
  tone?: 'default' | 'warning'
}) {
  return (
    <div className={`relative flex flex-col justify-between rounded-[var(--radius-panel)] border border-[var(--color-border)] bg-[var(--color-surface)] p-5 ${tone === 'warning' ? 'overflow-hidden' : ''}`}>
      {tone === 'warning' ? <div className="pointer-events-none absolute inset-0 bg-[var(--color-warning-bg)] opacity-20" /> : null}
      <div className="relative z-10 mb-3 flex items-center gap-2">
        <div className={`flex h-8 w-8 items-center justify-center rounded ${iconClassName}`}>{icon}</div>
        <span className="text-sm text-[var(--color-text-secondary)]">{label}</span>
      </div>
      <div className={`relative z-10 font-data-mono text-[30px] ${tone === 'warning' ? 'text-[var(--color-warning-text)]' : 'text-[var(--color-text)]'}`}>{value}</div>
    </div>
  )
}
