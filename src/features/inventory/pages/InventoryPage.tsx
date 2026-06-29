import { Download, Search } from 'lucide-react'
import { useMemo, useState } from 'react'

import { Button } from '@/components/ui/Button'
import { getCategoryOptions, getInventoryRows, type InventoryRow } from '@/data/mockSelectors'
import { InventoryModals, type InventoryModalType } from '@/features/inventory/components/InventoryModals'
import { InventoryTanStackTable } from '@/features/inventory/components/InventoryTanStackTable'

export function InventoryPage() {
  const inventory = getInventoryRows()
  const categories = getCategoryOptions()
  const [query, setQuery] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('')
  const [statusFilter, setStatusFilter] = useState<'all' | 'Optimo' | 'Critico' | 'Agotado'>('all')
  const [activeModal, setActiveModal] = useState<InventoryModalType | null>(null)
  const [selectedProduct, setSelectedProduct] = useState<InventoryRow | null>(null)

  const filteredInventory = useMemo(
    () =>
      inventory.filter((product) => {
        const matchesCategory = !categoryFilter || product.category === categoryFilter
        const matchesStatus = statusFilter === 'all' || product.status === statusFilter
        const normalizedQuery = query.trim().toLowerCase()
        const matchesQuery =
          !normalizedQuery ||
          [product.code, product.name, product.category, product.activeIngredient].some((value) => value.toLowerCase().includes(normalizedQuery))

        return matchesCategory && matchesStatus && matchesQuery
      }),
    [categoryFilter, inventory, query, statusFilter],
  )

  const stats = {
    total: inventory.length,
    normal: inventory.filter((product) => product.status === 'Optimo').length,
    critical: inventory.filter((product) => product.status === 'Critico').length,
    out: inventory.filter((product) => product.status === 'Agotado').length,
  }

  const openModal = (modalType: InventoryModalType, product: InventoryRow) => {
    setSelectedProduct(product)
    setActiveModal(modalType)
  }

  return (
    <>
      <section className="space-y-6">
        <div>
          <h2 className="text-[30px] font-semibold leading-[38px] text-[var(--color-text)]">Existencias</h2>
          <p className="mt-1 text-sm text-[var(--color-text-secondary)]">Monitoree stock, minimos y salidas operativas del inventario.</p>
        </div>

        <section className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
          <MetricCard label="Productos en inventario" tone="default" value={stats.total} />
          <MetricCard label="Stock normal" tone="success" value={stats.normal} />
          <MetricCard label="Stock crítico" tone="warning" value={stats.critical} />
          <MetricCard label="Agotados" tone="danger" value={stats.out} />
        </section>

        <section className="flex flex-col gap-4 rounded-[var(--radius-panel)] border border-[var(--color-border)] bg-[var(--color-surface)] p-3 xl:flex-row xl:items-center xl:justify-between">
          <div className="flex flex-wrap items-center gap-3">
            <label className="relative block w-full max-w-xs">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--color-text-muted)]" />
              <input
                className="block w-full rounded-[var(--radius-control)] border border-[var(--color-border)] bg-[var(--color-surface)] py-2 pl-10 pr-3 text-sm outline-none transition focus:border-[var(--color-primary)] focus:ring-2 focus:ring-[color:rgba(0,71,130,0.10)]"
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Buscar producto"
                type="text"
                value={query}
              />
            </label>

            <select
              className="rounded-[var(--radius-control)] border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-2 text-sm text-[var(--color-text)] outline-none transition focus:border-[var(--color-primary)] focus:ring-2 focus:ring-[color:rgba(0,71,130,0.10)]"
              onChange={(event) => setCategoryFilter(event.target.value)}
              value={categoryFilter}
            >
              <option value="">Categoría</option>
              {categories.map((category) => (
                <option key={category} value={category}>
                  {category}
                </option>
              ))}
            </select>

            <div className="flex rounded-[var(--radius-control)] border border-[var(--color-border)] bg-[var(--color-page-bg)] p-1">
              {[
                { label: 'Todos', value: 'all' },
                { label: 'Normal', value: 'Optimo' },
                { label: 'Crítico', value: 'Critico' },
                { label: 'Agotado', value: 'Agotado' },
              ].map((item) => (
                <button
                  key={item.value}
                  className={`rounded-[6px] px-3 py-1 text-sm font-medium transition ${statusFilter === item.value ? 'bg-[var(--color-surface)] text-[var(--color-text)] shadow-sm' : 'text-[var(--color-text-secondary)] hover:text-[var(--color-text)]'}`}
                  onClick={() => setStatusFilter(item.value as typeof statusFilter)}
                  type="button"
                >
                  {item.label}
                </button>
              ))}
            </div>
          </div>

          <Button type="button" variant="secondary">
            <Download className="mr-2 h-4 w-4" />
            Exportar
          </Button>
        </section>

        <InventoryTanStackTable
          globalFilter={query}
          onOpenDetail={(product) => openModal('detail', product)}
          onOpenSalida={(product) => openModal('output', product)}
          rows={filteredInventory}
        />
      </section>

      <InventoryModals modalType={activeModal} onClose={() => setActiveModal(null)} product={selectedProduct} />
    </>
  )
}

function MetricCard({ label, value, tone }: { label: string; value: number; tone: 'default' | 'success' | 'warning' | 'danger' }) {
  const toneClass = {
    default: 'text-[var(--color-text)]',
    success: 'text-[var(--color-success-text)]',
    warning: 'text-[var(--color-warning-text)]',
    danger: 'text-[var(--color-danger-text)]',
  }

  return (
    <div className="flex h-24 flex-col justify-between rounded-[var(--radius-panel)] border border-[var(--color-border)] bg-[var(--color-surface)] p-5">
      <h3 className="text-sm text-[var(--color-text-secondary)]">{label}</h3>
      <p className={`font-data-mono text-[24px] font-semibold ${toneClass[tone]}`}>{value}</p>
    </div>
  )
}
