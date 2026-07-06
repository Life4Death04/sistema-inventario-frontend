import { ArrowDownLeft, ArrowUpRight, RefreshCcw, Search } from 'lucide-react'
import { useMemo, useState } from 'react'

import { useInventoryMovements } from '@/features/inventory-movements/api/useInventoryMovements'
import { MovementsTanStackTable, type MovementTableRow } from '@/features/movements/components/MovementsTanStackTable'
import type { InventoryMovement } from '@/types/api.types'

export function MovementsPage() {
  const [query, setQuery] = useState('')
  const [typeFilter, setTypeFilter] = useState<'Todos' | 'IN' | 'OUT' | 'ADJUSTMENT'>('Todos')
  const { data, error, isLoading } = useInventoryMovements({ limit: 100 })

  const movementRows: MovementTableRow[] = useMemo(
    () => (data?.data ?? []).map(toMovementTableRow),
    [data],
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
        <h2 className="text-[30px] font-semibold leading-[38px] text-[var(--color-text)]">Historial de Movimientos</h2>
        <p className="mt-1 text-sm text-[var(--color-text-secondary)]">Registro de transacciones e inventario general.</p>
      </div>

      <section className="grid grid-cols-1 gap-6 md:grid-cols-3">
        <MovementMetricCard accent="success" icon="entry" label="Entradas" value={metrics.entries} />
        <MovementMetricCard accent="danger" icon="output" label="Salidas" value={metrics.outputs} />
        <MovementMetricCard accent="info" icon="adjustment" label="Ajustes" value={metrics.adjustments} />
      </section>

      <section className="rounded-[var(--radius-panel)] border border-[var(--color-border)] bg-[var(--color-surface)] shadow-sm">
        <div className="flex flex-col gap-4 border-b border-[var(--color-border)] p-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex flex-1 flex-col gap-4 md:flex-row">
            <label className="relative w-full md:max-w-md">
              <Search className="pointer-events-none absolute left-3 top-2.5 h-5 w-5 text-[var(--color-text-secondary)]" />
              <input
                className="w-full rounded-[var(--radius-control)] border border-[var(--color-border)] bg-[var(--color-surface)] pl-10 pr-4 py-2 text-sm outline-none transition focus:border-[var(--color-primary)] focus:ring-1 focus:ring-[var(--color-primary)]"
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Buscar por producto o responsable..."
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
                { key: 'Todos', label: 'Todos' },
                { key: 'IN', label: 'Entrada' },
                { key: 'OUT', label: 'Salida' },
                { key: 'ADJUSTMENT', label: 'Ajuste' },
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

        {isLoading ? <MovementStateMessage label="Cargando movimientos reales..." /> : null}
        {!isLoading && error ? <MovementStateMessage label="No fue posible cargar los movimientos reales." tone="error" /> : null}
        {!isLoading && !error ? <MovementsTanStackTable globalFilter={query} rows={filteredRows} /> : null}
      </section>
    </section>
  )
}

function toMovementTableRow(movement: InventoryMovement): MovementTableRow {
  const productName = movement.product.name
  const productCode = movement.product.code
  const userFullName = movement.user.fullName

  return {
    id: movement.id,
    product: productName,
    code: productCode,
    type: movement.type,
    typeLabel: getMovementTypeLabel(movement.type),
    adjustmentDirection: movement.adjustmentDirection,
    adjustmentLabel: getAdjustmentLabel(movement.adjustmentDirection),
    quantity: movement.quantity,
    resultingStock: movement.resultingStock,
    reason: translateMovementReason(movement.reason),
    user: userFullName,
    createdAt: movement.createdAt,
    initials: getInitials(userFullName),
  }
}

const MOVEMENT_REASON_TRANSLATIONS: Record<string, string> = {
  'Received from replenishment request': 'Recibido por solicitud de reposicion',
  'Replenishment received': 'Reposicion recibida',
  'Stock adjustment': 'Ajuste de stock',
  'Manual entry': 'Entrada manual',
  'Manual output': 'Salida manual',
}

function translateMovementReason(reason: string): string {
  return MOVEMENT_REASON_TRANSLATIONS[reason] ?? reason
}

function getMovementTypeLabel(type: InventoryMovement['type']): MovementTableRow['typeLabel'] {
  if (type === 'IN') {
    return 'Entrada'
  }

  if (type === 'OUT') {
    return 'Salida'
  }

  return 'Ajuste'
}

function getAdjustmentLabel(direction: InventoryMovement['adjustmentDirection']) {
  if (direction === 'INCREASE') {
    return 'Incremento'
  }

  if (direction === 'DECREASE') {
    return 'Disminucion'
  }

  return null
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
      <div className="mt-2 font-data-mono text-xs text-[var(--color-text-muted)]">en los ultimos 7 dias</div>
    </div>
  )
}
