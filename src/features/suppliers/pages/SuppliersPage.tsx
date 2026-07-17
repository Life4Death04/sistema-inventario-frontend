import { LoaderCircle, Plus, Search } from 'lucide-react'
import { MetricCard } from '@/components/ui/MetricCard'
import { useState } from 'react'

import { canManageSuppliers } from '@/features/auth/lib/permissions'
import { useAuthStore } from '@/features/auth/store/auth.store'
import { useSuppliers } from '@/features/suppliers/api/useSuppliers'
import { SupplierModals, type SupplierModalType } from '@/features/suppliers/components/SupplierModals'
import { SuppliersTanStackTable } from '@/features/suppliers/components/SuppliersTanStackTable'
import { mergeSupplierRows, type SupplierRow } from '@/features/suppliers/lib/supplierRows'

export function SuppliersPage() {
  const user = useAuthStore((state) => state.user)
  const canManage = canManageSuppliers(user?.role)
  const [query, setQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'ACTIVE' | 'INACTIVE'>('ALL')
  const [activeModal, setActiveModal] = useState<SupplierModalType | null>(null)
  const [selectedSupplier, setSelectedSupplier] = useState<SupplierRow | null>(null)

  const activeSuppliersQuery = useSuppliers({ limit: 100, active: true })
  const inactiveSuppliersQuery = useSuppliers({ limit: 100, active: false })

  const activeSuppliers = activeSuppliersQuery.data?.data ?? []
  const inactiveSuppliers = inactiveSuppliersQuery.data?.data ?? []
  const allSuppliers = mergeSupplierRows(activeSuppliers, inactiveSuppliers)

  const suppliers =
    statusFilter === 'ACTIVE'
      ? allSuppliers.filter((supplier) => supplier.active)
      : statusFilter === 'INACTIVE'
        ? allSuppliers.filter((supplier) => !supplier.active)
        : allSuppliers

  const isLoading = activeSuppliersQuery.isLoading || inactiveSuppliersQuery.isLoading
  const isError = activeSuppliersQuery.isError || inactiveSuppliersQuery.isError
  const isRefreshing = activeSuppliersQuery.isFetching || inactiveSuppliersQuery.isFetching

  const metrics = {
    active: allSuppliers.filter((supplier) => supplier.active).length,
    total: allSuppliers.length,
    inactive: allSuppliers.filter((supplier) => !supplier.active).length,
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
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <MetricCard label="Proveedores activos" tone="success" value={metrics.active} />
          <MetricCard label="Total de proveedores" tone="default" value={metrics.total} />
          <MetricCard label="Proveedores inactivos" tone="warning" value={metrics.inactive} />
        </div>

        <div className="flex flex-col gap-4 rounded-[var(--radius-panel)] border border-[var(--color-border)] bg-[var(--color-surface)] p-4 lg:flex-row lg:items-center lg:justify-between">
          <label className="relative w-full lg:w-80">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-[var(--color-text-muted)]" />
            <input
              className="w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] py-2 pl-10 pr-4 text-sm outline-none transition focus:border-[var(--color-primary)] focus:ring-2 focus:ring-[color:rgba(0,71,130,0.10)]"
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Buscar proveedor, RIF o direccion..."
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

            {canManage ? (
              <button
                className="inline-flex items-center justify-center gap-2 rounded-lg bg-[var(--color-primary)] px-4 py-2.5 text-sm font-medium text-white transition hover:bg-[var(--color-primary-strong)]"
                onClick={() => openModal('create')}
                type="button"
              >
                <Plus className="h-4 w-4" />
                Nuevo proveedor
              </button>
            ) : null}
          </div>
        </div>

        {isLoading ? (
          <div className="flex min-h-56 items-center justify-center rounded-[var(--radius-panel)] border border-[var(--color-border)] bg-[var(--color-surface)] text-sm text-[var(--color-text-secondary)]">
            <LoaderCircle className="mr-2 h-4 w-4 animate-spin" />
            Cargando proveedores...
          </div>
        ) : isError ? (
          <div className="space-y-3 rounded-[var(--radius-panel)] border border-[var(--color-border)] bg-[var(--color-surface)] p-6">
            <p className="text-sm font-medium text-[var(--color-text)]">No fue posible cargar los proveedores reales.</p>
            <p className="text-sm text-[var(--color-text-secondary)]">Verifique la conexion con el backend e intente nuevamente.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {isRefreshing ? (
              <div className="inline-flex items-center rounded-full bg-[var(--color-surface-strong)] px-3 py-1 text-xs text-[var(--color-text-secondary)]">
                <LoaderCircle className="mr-2 h-3.5 w-3.5 animate-spin" />
                Actualizando listado...
              </div>
            ) : null}
            <SuppliersTanStackTable
              canManage={canManage}
              globalFilter={query}
              onAssociateProducts={(supplier) => openModal('associate-products', supplier)}
              onEditSupplier={(supplier) => openModal('edit', supplier)}
              onViewSupplier={(supplier) => openModal('detail', supplier)}
              rows={suppliers}
            />
          </div>
        )}
      </section>

      <SupplierModals modalType={activeModal} onClose={closeModal} onOpenModal={openModal} role={user?.role} supplier={selectedSupplier} />
    </>
  )
}


