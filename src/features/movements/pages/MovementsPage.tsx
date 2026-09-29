import type { TFunction } from 'i18next'
import { ArrowDownLeft, ArrowUpRight, RefreshCcw, Search } from 'lucide-react'
import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'

import { useInventoryMovements } from '@/features/inventory-movements/api/useInventoryMovements'
import { MovementsTanStackTable, type MovementTableRow } from '@/features/movements/components/MovementsTanStackTable'
import type { InventoryMovement } from '@/types/api.types'

type MovementsTFunction = TFunction<['movements', 'common']>

export function MovementsPage() {
  const { t } = useTranslation(['movements', 'common'])
  const [query, setQuery] = useState('')
  const [typeFilter, setTypeFilter] = useState<'Todos' | 'IN' | 'OUT' | 'ADJUSTMENT'>('Todos')
  const { data, error, isLoading } = useInventoryMovements({ limit: 100 })

  const movementRows: MovementTableRow[] = useMemo(
    () => (data?.data ?? []).map((movement) => toMovementTableRow(movement, t)),
    [data, t],
  )

  const filteredRows = useMemo(
    () => movementRows.filter((movement) => (typeFilter === 'Todos' ? true : movement.type === typeFilter)),
    [movementRows, typeFilter],
  )

  const metrics = {
    entries: movementRows.filter((movement) => movement.type === 'IN').length,
    outputs: movementRows.filter((movement) => movement.type === 'OUT').length,
    adjustments: movementRows.filter((movement) => movement.type === 'ADJUSTMENT').length,
  }

  return (
    <section className="space-y-8">
      <div>
        <h2 className="text-[30px] font-semibold leading-[38px] text-[var(--color-text)]">{t('movements:title')}</h2>
        <p className="mt-1 text-sm text-[var(--color-text-secondary)]">{t('movements:subtitle')}</p>
      </div>

      <section className="grid grid-cols-1 gap-6 md:grid-cols-3">
        <MovementMetricCard accent="success" icon="entry" label={t('movements:metrics.entries')} value={metrics.entries} />
        <MovementMetricCard accent="danger" icon="output" label={t('movements:metrics.outputs')} value={metrics.outputs} />
        <MovementMetricCard accent="info" icon="adjustment" label={t('movements:metrics.adjustments')} value={metrics.adjustments} />
      </section>

      <section className="rounded-[var(--radius-panel)] border border-[var(--color-border)] bg-[var(--color-surface)] shadow-sm">
        <div className="flex flex-col gap-4 border-b border-[var(--color-border)] p-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex flex-1 flex-col gap-4 md:flex-row">
            <label className="relative w-full md:max-w-md">
              <Search className="pointer-events-none absolute left-3 top-2.5 h-5 w-5 text-[var(--color-text-secondary)]" />
              <input
                className="w-full rounded-[var(--radius-control)] border border-[var(--color-border)] bg-[var(--color-surface)] pl-10 pr-4 py-2 text-sm outline-none transition focus:border-[var(--color-primary)] focus:ring-1 focus:ring-[var(--color-primary)]"
                onChange={(event) => setQuery(event.target.value)}
                placeholder={t('movements:filters.searchPlaceholder')}
                type="text"
                value={query}
              />
            </label>

            <div className="w-full md:w-auto shrink-0">
              <input
                className="w-full md:w-40 rounded-[var(--radius-control)] border border-[var(--color-border)] bg-[var(--color-surface)] px-4 py-2 text-sm text-[var(--color-text-secondary)] outline-none"
                readOnly
                type="text"
                value="01/06 - 08/06"
              />
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="hidden rounded-[var(--radius-control)] border border-[var(--color-border)] bg-[var(--color-page-bg)] p-1 md:flex">
              {([
                { key: 'Todos', label: t('movements:filters.all') },
                { key: 'IN', label: t('movements:types.IN') },
                { key: 'OUT', label: t('movements:types.OUT') },
                { key: 'ADJUSTMENT', label: t('movements:types.ADJUSTMENT') },
              ] as const).map((item) => (
                <button
                  key={item.key}
                  className={`rounded-[6px] px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.05em] transition ${
                    typeFilter === item.key ? 'bg-[var(--color-surface-tint)] text-[var(--color-primary)] shadow-sm' : 'text-[var(--color-text-secondary)] hover:text-[var(--color-text)]'
                  }`}
                  onClick={() => setTypeFilter(item.key)}
                  type="button"
                >
                  {item.label}
                </button>
              ))}
            </div>


          </div>
        </div>

        {isLoading ? <MovementStateMessage label={t('movements:state.loading')} /> : null}
        {!isLoading && error ? <MovementStateMessage label={t('movements:errors.loadFailed')} tone="error" /> : null}
        {!isLoading && !error ? <MovementsTanStackTable globalFilter={query} rows={filteredRows} /> : null}
      </section>
    </section>
  )
}

function toMovementTableRow(movement: InventoryMovement, t: MovementsTFunction): MovementTableRow {
  const productName = movement.product.name
  const productCode = movement.product.code
  const userFullName = movement.user.fullName

  return {
    id: movement.id,
    product: productName,
    code: productCode,
    type: movement.type,
    typeLabel: t(`movements:types.${movement.type}`),
    adjustmentDirection: movement.adjustmentDirection,
    adjustmentLabel: getAdjustmentLabel(movement.adjustmentDirection, t),
    quantity: movement.quantity,
    resultingStock: movement.resultingStock,
    reason: translateMovementReason(movement.reason, t),
    user: userFullName,
    createdAt: movement.createdAt,
    initials: getInitials(userFullName),
  }
}

type MovementReasonKey =
  | 'receivedFromReplenishmentRequest'
  | 'replenishmentReceived'
  | 'stockAdjustment'
  | 'manualEntry'
  | 'manualOutput'

const MOVEMENT_REASON_KEYS: Record<string, MovementReasonKey> = {
  'Received from replenishment request': 'receivedFromReplenishmentRequest',
  'Replenishment received': 'replenishmentReceived',
  'Stock adjustment': 'stockAdjustment',
  'Manual entry': 'manualEntry',
  'Manual output': 'manualOutput',
}

function translateMovementReason(reason: string, t: MovementsTFunction): string {
  const reasonKey = MOVEMENT_REASON_KEYS[reason]

  return reasonKey ? t(`movements:reasons.${reasonKey}`) : reason
}

function getAdjustmentLabel(direction: InventoryMovement['adjustmentDirection'], t: MovementsTFunction) {
  if (direction === null) {
    return null
  }

  return t(`movements:adjustmentDirections.${direction}`)
}

function getInitials(fullName: string) {
  return fullName
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? '')
    .join('')
}


function MovementStateMessage({ label, tone = 'muted' }: { label: string; tone?: 'error' | 'muted' }) {
  return (
    <div
      className={`px-6 py-8 text-sm ${tone === 'error' ? 'text-[var(--color-danger-text)]' : 'text-[var(--color-text-secondary)]'}`}
    >
      {label}
    </div>
  )
}

function MovementMetricCard({
  accent,
  icon,
  label,
  value,
}: {
  accent: 'success' | 'danger' | 'info'
  icon: 'entry' | 'output' | 'adjustment'
  label: string
  value: number
}) {
  const { t } = useTranslation(['movements', 'common'])
  const palette = {
    success: {
      border: 'border-l-[var(--color-success-text)]',
      text: 'text-[var(--color-success-text)]',
    },
    danger: {
      border: 'border-l-[var(--color-danger-text)]',
      text: 'text-[var(--color-danger-text)]',
    },
    info: {
      border: 'border-l-[var(--color-primary)]',
      text: 'text-[var(--color-primary)]',
    },
  }

  return (
    <div className={`rounded-[var(--radius-panel)] border-l-4 bg-[var(--color-surface)]  p-6 shadow-sm ${palette[accent].border}`}>
      <div className="mb-1 flex items-start justify-between">
        <div className="text-sm text-[var(--color-text-secondary)]">{label}</div>
        {icon === 'entry' ? <ArrowDownLeft className={`h-4.5 w-4.5 ${palette[accent].text}`} /> : null}
        {icon === 'output' ? <ArrowUpRight className={`h-4.5 w-4.5 ${palette[accent].text}`} /> : null}
        {icon === 'adjustment' ? <RefreshCcw className={`h-4.5 w-4.5 ${palette[accent].text}`} /> : null}
      </div>
      <div className="flex items-baseline gap-2">
        <span className={`text-[30px] font-semibold leading-[38px] ${palette[accent].text}`}>{value}</span>
      </div>
      <div className="mt-2 font-data-mono text-xs text-[var(--color-text-muted)]">{t('movements:metrics.period')}</div>
    </div>
  )
}
