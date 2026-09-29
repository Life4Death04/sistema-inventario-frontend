import { Search } from 'lucide-react'
import { MetricCard } from '@/components/ui/MetricCard'
import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'

import { useCategories } from '@/features/categories/api/useCategories'
import { InventoryModals, type InventoryModalType } from '@/features/inventory/components/InventoryModals'
import { InventoryTanStackTable } from '@/features/inventory/components/InventoryTanStackTable'
import { type InventoryRow, toInventoryRow } from '@/features/inventory/lib/inventoryRows'
import { useProducts } from '@/features/products/api/useProducts'
import { getStockStatusLabel, type StockStatus } from '@/lib/stockStatus'

export function InventoryPage() {
  const { t } = useTranslation(['inventory', 'common'])
  const [query, setQuery] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('')
  const [statusFilter, setStatusFilter] = useState<'all' | StockStatus>('all')
  const [activeModal, setActiveModal] = useState<InventoryModalType | null>(null)
  const [selectedProduct, setSelectedProduct] = useState<InventoryRow | null>(null)
  const { data: productsResponse, error: productsError, isLoading: isLoadingProducts } = useProducts({ active: true, pageSize: 100 })
  const { data: categoriesResponse, error: categoriesError, isLoading: isLoadingCategories } = useCategories({ limit: 100 })

  const categories = categoriesResponse?.data ?? []

  const inventory = useMemo(() => {
    const categoriesById = new Map(categories.map((category) => [category.id, category]))

    return (productsResponse?.data ?? []).map((product) => toInventoryRow(product, categoriesById, t))
  }, [categories, productsResponse, t])

  const filteredInventory = useMemo(
    () =>
      inventory.filter((product) => {
        const matchesCategory = !categoryFilter || product.categoryId === categoryFilter
        const matchesStatus = statusFilter === 'all' || product.status === statusFilter
        const normalizedQuery = query.trim().toLowerCase()
        const matchesQuery =
          !normalizedQuery ||
          [product.code, product.name, product.category, product.activeIngredient ?? product.activeIngredientLabel].some((value) =>
            value.toLowerCase().includes(normalizedQuery),
          )

        return matchesCategory && matchesStatus && matchesQuery
      }),
    [categoryFilter, inventory, query, statusFilter],
  )

  const isLoading = isLoadingProducts || isLoadingCategories
  const hasError = Boolean(productsError || categoriesError)

  const stats = {
    total: inventory.length,
    normal: inventory.filter((product) => product.status === 'healthy').length,
    critical: inventory.filter((product) => product.status === 'low').length,
    out: inventory.filter((product) => product.status === 'out').length,
  }

  const openModal = (modalType: InventoryModalType, product: InventoryRow) => {
    setSelectedProduct(product)
    setActiveModal(modalType)
  }

  return (
    <>
      <section className="space-y-6">
        <div>
          <h2 className="text-[30px] font-semibold leading-[38px] text-[var(--color-text)]">{t('inventory:page.title')}</h2>
          <p className="mt-1 text-sm text-[var(--color-text-secondary)]">{t('inventory:page.subtitle')}</p>
        </div>

        <section className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
          <MetricCard label={t('inventory:page.metrics.total')} tone="default" value={stats.total} />
          <MetricCard label={t('inventory:page.metrics.normal')} tone="success" value={stats.normal} />
          <MetricCard label={t('inventory:page.metrics.critical')} tone="warning" value={stats.critical} />
          <MetricCard label={t('inventory:page.metrics.out')} tone="danger" value={stats.out} />
        </section>

        <section className="flex flex-col gap-4 rounded-[var(--radius-panel)] border border-[var(--color-border)] bg-[var(--color-surface)] p-3 xl:flex-row xl:items-center xl:justify-between">
          <div className="flex flex-wrap items-center gap-3">
            <label className="relative block w-full max-w-xs">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--color-text-muted)]" />
              <input
                className="block w-full rounded-[var(--radius-control)] border border-[var(--color-border)] bg-[var(--color-surface)] py-2 pl-10 pr-3 text-sm outline-none transition focus:border-[var(--color-primary)] focus:ring-2 focus:ring-[color:rgba(0,71,130,0.10)]"
                onChange={(event) => setQuery(event.target.value)}
                placeholder={t('inventory:page.filters.searchPlaceholder')}
                type="text"
                value={query}
              />
            </label>

            <select
              className="rounded-[var(--radius-control)] border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-2 text-sm text-[var(--color-text)] outline-none transition focus:border-[var(--color-primary)] focus:ring-2 focus:ring-[color:rgba(0,71,130,0.10)]"
              onChange={(event) => setCategoryFilter(event.target.value)}
              value={categoryFilter}
            >
              <option value="">{t('inventory:page.filters.categoryDefaultOption')}</option>
              {categories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </select>

            <div className="flex rounded-[var(--radius-control)] border border-[var(--color-border)] bg-[var(--color-page-bg)] p-1">
              {[
                { label: t('inventory:page.filters.statusAll'), value: 'all' },
                { label: getStockStatusLabel('healthy', t), value: 'healthy' },
                { label: getStockStatusLabel('low', t), value: 'low' },
                { label: getStockStatusLabel('out', t), value: 'out' },
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

        </section>

        {isLoading ? <InventoryStateMessage label={t('inventory:page.loading')} /> : null}
        {!isLoading && hasError ? <InventoryStateMessage label={t('inventory:page.loadError')} tone="error" /> : null}
        {!isLoading && !hasError ? (
          <InventoryTanStackTable
            globalFilter={query}
            onOpenDetail={(product) => openModal('detail', product)}
            onOpenSalida={(product) => openModal('output', product)}
            rows={filteredInventory}
          />
        ) : null}
      </section>

      <InventoryModals modalType={activeModal} onClose={() => setActiveModal(null)} product={selectedProduct} />
    </>
  )
}

function InventoryStateMessage({ label, tone = 'muted' }: { label: string; tone?: 'error' | 'muted' }) {
  return (
    <div className={`rounded-[var(--radius-panel)] border border-[var(--color-border)] bg-[var(--color-surface)] px-4 py-6 text-sm ${tone === 'error' ? 'text-[var(--color-danger-text)]' : 'text-[var(--color-text-secondary)]'}`}>
      {label}
    </div>
  )
}


