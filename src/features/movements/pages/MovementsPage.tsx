import { ArrowDownLeft, ArrowUpRight, Download, RefreshCcw, Search } from 'lucide-react'
import { useMemo, useState } from 'react'

import { Button } from '@/components/ui/Button'
import { getMovementRows } from '@/data/mockSelectors'
import { MovementsTanStackTable, type MovementTableRow } from '@/features/movements/components/MovementsTanStackTable'

export function MovementsPage() {
  const movements = getMovementRows()
  const [query, setQuery] = useState('')
  const [typeFilter, setTypeFilter] = useState<'Todos' | 'Entrada' | 'Salida' | 'Ajuste'>('Todos')

  const movementRows: MovementTableRow[] = useMemo(
    () =>
      movements.map((movement) => ({
        ...movement,
        code: extractCode(movement.reason, movement.product),
        type: movement.type as MovementTableRow['type'],
        initials: getInitials(movement.user),
      })),
    [movements],
  )

  const filteredRows = useMemo(
    () => movementRows.filter((movement) => (typeFilter === 'Todos' ? true : movement.type === typeFilter)),
    [movementRows, typeFilter],
  )

  const metrics = {
    entries: movementRows.filter((movement) => movement.type === 'Entrada').length,
    outputs: movementRows.filter((movement) => movement.type === 'Salida').length,
    adjustments: movementRows.filter((movement) => movement.type === 'Ajuste').length,
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
              {(['Todos', 'Entrada', 'Salida', 'Ajuste'] as const).map((item) => (
                <button
                  key={item}
                  className={`rounded-[6px] px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.05em] transition ${
                    typeFilter === item ? 'bg-[var(--color-surface-tint)] text-[var(--color-primary)] shadow-sm' : 'text-[var(--color-text-secondary)] hover:text-[var(--color-text)]'
                  }`}
                  onClick={() => setTypeFilter(item)}
                  type="button"
                >
                  {item}
                </button>
              ))}
            </div>

            <Button type="button" variant="ghost">
              <Download className="mr-2 h-4 w-4" />
              Exportar
            </Button>
          </div>
        </div>

        <MovementsTanStackTable globalFilter={query} rows={filteredRows} />
      </section>
    </section>
  )
}

function extractCode(reason: string, product: string) {
  const normalized = `${product}-${reason}`

  return normalized
    .split(' ')
    .map((part) => part.slice(0, 3).toUpperCase())
    .slice(0, 2)
    .join('-')
}

function getInitials(fullName: string) {
  return fullName
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? '')
    .join('')
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
