import { AlertTriangle, CheckCircle2, CircleAlert, Eye, Package2 } from 'lucide-react'
import { useState } from 'react'

import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { getInventoryAlertRows, type InventoryAlertRow, type ProductRow } from '@/data/mockSelectors'
import { ProductCatalogModals, type ProductModalType } from '@/features/products/components/ProductCatalogModals'

const tabs = [
  { key: 'active', label: 'Activas' },
  { key: 'attended', label: 'Atendidas' },
  { key: 'all', label: 'Todas' },
] as const

type AlertFilter = (typeof tabs)[number]['key']

export function AlertsPage() {
  const alerts = getInventoryAlertRows()
  const [filter, setFilter] = useState<AlertFilter>('active')
  const [activeModal, setActiveModal] = useState<ProductModalType | null>(null)
  const [selectedProduct, setSelectedProduct] = useState<ProductRow | null>(null)

  const visibleAlerts = alerts.filter((alert) => {
    if (filter === 'all') {
      return true
    }

    return filter === 'active' ? alert.kind === 'active' : alert.kind === 'attended'
  })

  const metrics = {
    active: alerts.filter((alert) => alert.kind === 'active').length,
    critical: alerts.filter((alert) => alert.kind === 'active' && alert.level === 'critical').length,
    out: alerts.filter((alert) => alert.kind === 'active' && alert.level === 'out').length,
    attended: alerts.filter((alert) => alert.kind === 'attended' && isWithinLastSevenDays(alert.generatedAt)).length,
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

        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          <MetricCard label="Alertas activas" tone="default" value={metrics.active} />
          <MetricCard label="Criticas" tone="critical" value={metrics.critical} />
          <MetricCard label="Agotadas" tone="out" value={metrics.out} />
          <MetricCard label="Atendidas (7 dias)" tone="success" value={metrics.attended} />
        </div>

        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="inline-flex w-full flex-wrap rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] p-1 sm:w-auto">
            {tabs.map((tab) => (
              <button
                key={tab.key}
                className={`rounded-md px-4 py-1.5 text-sm font-medium transition ${filter === tab.key ? 'bg-[var(--color-surface-tint)]/18 text-[var(--color-primary)]' : 'text-[var(--color-text-secondary)] hover:text-[var(--color-text)]'}`}
                onClick={() => setFilter(tab.key)}
                type="button"
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-4">
          {visibleAlerts.map((alert) => (
            <AlertCard key={alert.id} alert={alert} onOpenModal={openModal} />
          ))}
        </div>
      </section>

      <ProductCatalogModals modalType={activeModal} onClose={closeModal} onOpenModal={openModal} product={selectedProduct} />
    </>
  )
}

function AlertCard({
  alert,
  onOpenModal,
}: {
  alert: InventoryAlertRow
  onOpenModal: (modalType: ProductModalType, product: ProductRow | null) => void
}) {
  const statusClasses = getStatusClasses(alert)
  const Icon = statusClasses.icon

  return (
    <Card className={alert.kind === 'attended' ? 'bg-[var(--color-surface)]/70' : 'hover:border-[color:var(--color-outline)] transition-colors'}>
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

            {alert.kind === 'attended' && alert.requestCode ? (
              <div className="inline-flex items-center gap-1.5 rounded-[8px] border border-[var(--color-border)] bg-[var(--color-surface)] px-2.5 py-1 text-sm text-[var(--color-text-secondary)]">
                <CheckCircle2 className="h-4 w-4 text-[var(--color-success-text)]" />
                <span>
                  Solicitud <span className="font-data-mono text-xs">#{alert.requestCode}</span> enviada
                </span>
              </div>
            ) : null}
          </div>
        </div>

        <div className="flex w-full flex-row gap-2 md:w-auto md:min-w-[182px] md:flex-col">
          {alert.kind === 'active' ? (
            <>
              <Button className="flex-1 md:flex-none" onClick={() => onOpenModal('replenishment', alert.product)} type="button">
                <Package2 className="mr-2 h-4 w-4" />
                Generar reposicion
              </Button>
              <Button className="flex-1 md:flex-none" onClick={() => onOpenModal('detail', alert.product)} type="button" variant="secondary">
                <Eye className="mr-2 h-4 w-4" />
                Ver producto
              </Button>
            </>
          ) : (
            <button
              className="inline-flex min-h-10 flex-1 items-center justify-center rounded-[var(--radius-control)] border border-[var(--color-border)] bg-[var(--color-surface)] px-4 py-2 text-sm font-medium text-[var(--color-text-secondary)] md:flex-none"
              disabled
              type="button"
            >
              Ver reposicion
            </button>
          )}
        </div>
      </div>
    </Card>
  )
}

function MetricCard({
  label,
  value,
  tone,
}: {
  label: string
  value: number
  tone: 'default' | 'critical' | 'out' | 'success'
}) {
  const valueClassName = {
    default: 'text-[var(--color-text)]',
    critical: 'text-[var(--color-warning-text)]',
    out: 'text-[var(--color-danger-text)]',
    success: 'text-[var(--color-success-text)]',
  }

  return (
    <div className="flex min-h-24 flex-col justify-between rounded-[var(--radius-panel)] border border-[var(--color-border)] bg-[var(--color-surface)] p-4">
      <p className="text-sm text-[var(--color-text-secondary)]">{label}</p>
      <p className={`font-data-mono text-[30px] font-bold ${valueClassName[tone]}`}>{value}</p>
    </div>
  )
}

function getStatusClasses(alert: InventoryAlertRow) {
  if (alert.kind === 'attended') {
    return {
      badgeClassName: 'bg-[var(--color-success-bg)] text-[var(--color-success-text)]',
      icon: CheckCircle2,
      iconClassName: 'text-[var(--color-success-text)]',
      iconWrapperClassName: 'bg-[var(--color-success-bg)]',
      stockClassName: 'text-[var(--color-text-secondary)]',
    }
  }

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

function isWithinLastSevenDays(value: string) {
  const sevenDaysInMs = 7 * 24 * 60 * 60 * 1000

  return Date.now() - new Date(value).getTime() <= sevenDaysInMs
}
