import { AlertTriangle, CircleAlert, Eye, Package2 } from 'lucide-react'
import { MetricCard } from '@/components/ui/MetricCard'
import { useMemo, useState } from 'react'

import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { Loading } from '@/components/ui/Loading'
import { useCategories } from '@/features/categories/api/useCategories'
import { type InventoryAlertRow, toInventoryAlertRows } from '@/features/alerts/lib/alertRows'
import { hasPermission } from '@/features/auth/lib/permissions'
import { useAuthStore } from '@/features/auth/store/auth.store'
import { useProducts } from '@/features/products/api/useProducts'
import { ProductCatalogModals, type ProductModalType } from '@/features/products/components/ProductCatalogModals'
import { toProductRow, type ProductRow } from '@/features/products/lib/productRows'

export function AlertsPage() {
  const user = useAuthStore((state) => state.user)
  const [activeModal, setActiveModal] = useState<ProductModalType | null>(null)
  const [selectedProduct, setSelectedProduct] = useState<ProductRow | null>(null)
  const { data: categoriesResponse, isError: isCategoriesError, isLoading: isLoadingCategories } = useCategories({ limit: 100 })
  const { data: activeProductsResponse, dataUpdatedAt, isError: isActiveProductsError, isLoading: isLoadingActiveProducts } = useProducts({ active: true, pageSize: 100 })

  const categoryNames = useMemo(
    () => new Map((categoriesResponse?.data ?? []).map((category) => [category.id, category.name])),
    [categoriesResponse],
  )

  const activeProducts = useMemo(
    () => (activeProductsResponse?.data ?? []).map((product) => toProductRow(product, categoryNames.get(product.categoryId))),
    [categoryNames, activeProductsResponse],
  )

  const generatedAt = new Date(dataUpdatedAt || Date.now()).toISOString()
  const activeAlerts = useMemo(() => toInventoryAlertRows(activeProducts, generatedAt), [generatedAt, activeProducts])

  const isLoading = isLoadingActiveProducts || isLoadingCategories
  const isError = isActiveProductsError || isCategoriesError

  const metrics = {
    active: activeAlerts.length,
    critical: activeAlerts.filter((alert) => alert.level === 'critical').length,
    out: activeAlerts.filter((alert) => alert.level === 'out').length,
  }

  const openModal = (modalType: ProductModalType, product: ProductRow | null = null) => {
    setSelectedProduct(product)
    setActiveModal(modalType)
  }

  const closeModal = () => {
    setActiveModal(null)
    setSelectedProduct(null)
  }

  return (
    <>
      <section className="space-y-6">
        <div>
          <h2 className="text-[30px] font-semibold leading-[38px] text-[var(--color-text)]">Alertas de inventario</h2>
        </div>

        <div className="grid grid-cols-2 gap-4 lg:grid-cols-3">
          <MetricCard label="Alertas activas" tone="default" value={metrics.active} />
          <MetricCard label="Criticas" tone="warning" value={metrics.critical} />
          <MetricCard label="Agotadas" tone="danger" value={metrics.out} />
        </div>

        <div className="space-y-4">
          {isLoading ? <Loading /> : null}
          {!isLoading && isError ? <AlertsStateMessage label="No fue posible cargar las alertas desde productos reales." tone="error" /> : null}
          {!isLoading && !isError && activeAlerts.length === 0 ? (
            <AlertsStateMessage label="No hay alertas activas. Todos los productos están por encima del stock mínimo." />
          ) : null}
          {!isLoading && !isError
            ? activeAlerts.map((alert) => (
                <AlertCard key={alert.id} alert={alert} canUseReplenishment={hasPermission(user?.role, 'manage:replenishment')} onOpenModal={openModal} />
              ))
            : null}
        </div>
      </section>

      <ProductCatalogModals modalType={activeModal} onClose={closeModal} onOpenModal={openModal} product={selectedProduct} role={user?.role} />
    </>
  )
}

function AlertCard({
  alert,
  canUseReplenishment,
  onOpenModal,
}: {
  alert: InventoryAlertRow
  canUseReplenishment: boolean
  onOpenModal: (modalType: ProductModalType, product: ProductRow | null) => void
}) {
  const statusClasses = getStatusClasses(alert)
  const Icon = statusClasses.icon

  return (
    <Card className="transition-colors hover:border-[color:var(--color-outline)]">
      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div className="flex gap-4">
          <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-[8px] ${statusClasses.iconWrapperClassName}`}>
            <Icon className={`h-5 w-5 ${statusClasses.iconClassName}`} />
          </div>

          <div className="min-w-0 space-y-2">
            <div className="flex flex-wrap items-center gap-2 md:gap-3">
              <h3 className="text-base font-semibold text-[var(--color-text)] sm:text-lg">{alert.product.name}</h3>
              <span className="font-data-mono text-xs text-[var(--color-text-secondary)]">{alert.product.code}</span>
              <span className={`rounded-[4px] px-2 py-0.5 text-xs font-semibold uppercase tracking-[0.05em] ${statusClasses.badgeClassName}`}>
                {alert.label}
              </span>
            </div>

            <p className="text-sm text-[var(--color-text-secondary)]">Generada: {formatAlertDate(alert.generatedAt)}</p>

            <div className="flex flex-wrap items-center gap-2 text-sm">
              <span className="text-[var(--color-text-secondary)]">Stock actual:</span>
              <span className={`font-data-mono text-base font-semibold ${statusClasses.stockClassName}`}>{alert.product.stock}</span>
              <span className="text-[var(--color-text-secondary)]">/ {alert.product.minStock}</span>
            </div>
          </div>
        </div>

        <div className="flex w-full flex-row gap-2 md:w-auto md:min-w-[182px] md:flex-col">
          {canUseReplenishment ? (
            <Button className="flex-1 md:flex-none" onClick={() => onOpenModal('replenishment', alert.product)} type="button">
              <Package2 className="mr-2 h-4 w-4" />
              Generar reposicion
            </Button>
          ) : null}
          <Button className="flex-1 md:flex-none" onClick={() => onOpenModal('detail', alert.product)} type="button" variant="secondary">
            <Eye className="mr-2 h-4 w-4" />
            Ver producto
          </Button>
        </div>
      </div>
    </Card>
  )
}

function AlertsStateMessage({ label, tone = 'muted' }: { label: string; tone?: 'error' | 'muted' }) {
  return (
    <div className={`rounded-[var(--radius-panel)] border border-[var(--color-border)] bg-[var(--color-surface)] px-4 py-6 text-sm ${tone === 'error' ? 'text-[var(--color-danger-text)]' : 'text-[var(--color-text-secondary)]'}`}>
      {label}
    </div>
  )
}

function getStatusClasses(alert: InventoryAlertRow) {
  if (alert.level === 'out') {
    return {
      badgeClassName: 'bg-[var(--color-danger-bg)] text-[var(--color-danger-text)]',
      icon: CircleAlert,
      iconClassName: 'text-[var(--color-danger-text)]',
      iconWrapperClassName: 'bg-[var(--color-danger-bg)]',
      stockClassName: 'text-[var(--color-danger-text)]',
    }
  }

  return {
    badgeClassName: 'bg-[var(--color-warning-bg)] text-[var(--color-warning-text)]',
    icon: AlertTriangle,
    iconClassName: 'text-[var(--color-warning-text)]',
    iconWrapperClassName: 'bg-[var(--color-warning-bg)]',
    stockClassName: 'text-[var(--color-warning-text)]',
  }
}

function formatAlertDate(value: string) {
  return new Intl.DateTimeFormat('es-VE', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(value))
}
