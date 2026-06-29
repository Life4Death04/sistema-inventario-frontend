import { ArrowDown, ArrowLeftRight, ArrowUp, Lock, TriangleAlert, X } from 'lucide-react'
import { useMemo, useState } from 'react'

import { Button } from '@/components/ui/Button'
import { getProductMovementHistory, type InventoryRow } from '@/data/mockSelectors'
import { formatCurrency, formatDate } from '@/lib/utils'

export type InventoryModalType = 'detail' | 'output'

interface InventoryModalsProps {
  modalType: InventoryModalType | null
  product: InventoryRow | null
  onClose: () => void
}

export function InventoryModals({ modalType, product, onClose }: InventoryModalsProps) {
  if (!modalType || !product) {
    return null
  }

  if (modalType === 'detail') {
    return <InventoryDetailModal onClose={onClose} product={product} />
  }

  return <RegisterOutputModal onClose={onClose} product={product} />
}

function ModalFrame({ children, title, onClose, maxWidth = 'max-w-[560px]' }: { children: React.ReactNode; title: string; onClose: () => void; maxWidth?: string }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-5">
      <button className="absolute inset-0 bg-[#0e1d27]/40 backdrop-blur-[2px]" onClick={onClose} type="button" />
      <div className={`relative flex max-h-[90vh] w-full flex-col overflow-hidden rounded-[var(--radius-panel)] border border-[var(--color-border)] bg-[var(--color-surface)] shadow-[0_8px_30px_rgba(0,0,0,0.12)] ${maxWidth}`}>
        <div className="flex items-center justify-between border-b border-[var(--color-border)] px-5 py-4 sm:px-6">
          <h3 className="pr-4 text-[20px] font-semibold leading-7 text-[var(--color-text)]">{title}</h3>
          <button className="rounded-[var(--radius-control)] p-1 text-[var(--color-text-muted)] transition hover:bg-[var(--color-surface-strong)] hover:text-[var(--color-text)]" onClick={onClose} type="button">
            <X className="h-5 w-5" />
          </button>
        </div>
        {children}
      </div>
    </div>
  )
}

function InventoryDetailModal({ onClose, product }: { onClose: () => void; product: InventoryRow }) {
  const history = getProductMovementHistory(product.id).slice(0, 3)
  const latestUpdate = history[0]?.createdAt

  return (
    <ModalFrame maxWidth="max-w-[560px]" onClose={onClose} title="Detalle del producto">
      <div className="flex-1 space-y-6 overflow-y-auto px-5 py-5 sm:px-6">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h4 className="text-lg font-medium text-[var(--color-text)]">{product.name}</h4>
            <span className="rounded-[4px] bg-[var(--color-surface-tint)] px-2 py-0.5 text-xs font-semibold uppercase tracking-[0.05em] text-[var(--color-primary)]">{product.category}</span>
            <span className={`rounded-[4px] px-2 py-0.5 text-xs font-semibold uppercase tracking-[0.05em] ${getStatusClasses(product.status)}`}>{product.status}</span>
          </div>
          <p className="mt-1 font-data-mono text-sm text-[var(--color-text-muted)]">{product.code}</p>
        </div>

        <div className="grid gap-4 sm:grid-cols-3">
          <SummaryCard label="Existencias" value={product.stock.toLocaleString('es-VE')} />
          <SummaryCard label="Stock minimo" value={product.minStock.toLocaleString('es-VE')} />
          <SummaryCard badge label="Estado" value={product.status} valueClassName={getStatusClasses(product.status)} />
        </div>

        <div className="grid gap-x-8 gap-y-5 sm:grid-cols-2">
          <DetailItem label="Categoria" value={product.category} />
          <DetailItem label="Precio unitario" mono value={formatCurrency(product.price)} />
          <DetailItem label="Proveedor" value={product.suppliers.join(', ') || 'No asignado'} />
          <DetailItem label="Ultima actualizacion" mono value={latestUpdate ? formatDate(latestUpdate) : 'Sin movimientos'} />
          <DetailItem label="Presentacion" value={product.presentation} />
          <DetailItem label="Principio activo" value={product.activeIngredient} />
        </div>

        <div className="space-y-3">
          <h5 className="text-xs font-semibold uppercase tracking-[0.05em] text-[var(--color-text-secondary)]">Movimientos recientes</h5>
          <div className="space-y-2">
            {history.map((movement) => (
              <div key={movement.id} className="flex items-center justify-between gap-3 rounded-[var(--radius-control)] border border-[var(--color-border)] bg-[var(--color-surface)] p-3">
                <div className="flex min-w-0 items-center gap-3">
                  <MovementIcon type={movement.type} />
                  <div>
                    <p className="text-sm font-medium text-[var(--color-text)]">{movement.typeLabel}</p>
                    <p className="text-xs text-[var(--color-text-secondary)]">{movement.user}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-data-mono text-sm text-[var(--color-text)]">
                    {movement.type === 'IN' ? '+' : '-'}
                    {movement.quantity}
                  </p>
                  <p className="font-data-mono text-xs text-[var(--color-text-secondary)]">{formatDate(movement.createdAt)}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="flex items-center justify-end gap-3 border-t border-[var(--color-border)] bg-[var(--color-surface-strong)] px-5 py-4 sm:px-6">
        <Button onClick={onClose} type="button" variant="ghost">
          Cerrar
        </Button>
      </div>
    </ModalFrame>
  )
}

function RegisterOutputModal({ onClose, product }: { onClose: () => void; product: InventoryRow }) {
  const [quantity, setQuantity] = useState(3)
  const [reason, setReason] = useState('Vencimiento')
  const resultingStock = Math.max(product.stock - quantity, 0)
  const warning = resultingStock < product.minStock

  return (
    <ModalFrame maxWidth="max-w-[480px]" onClose={onClose} title="Registrar salida">
      <div className="space-y-6 overflow-y-auto px-5 py-5 sm:px-6">
        <div className="flex flex-col gap-1">
          <label className="text-xs font-semibold uppercase tracking-[0.05em] text-[var(--color-text-secondary)]">Producto</label>
          <div className="flex items-center justify-between rounded-[var(--radius-control)] border border-[var(--color-border)] bg-[var(--color-surface-strong)] p-3">
            <div>
              <div className="text-sm font-medium text-[var(--color-text)]">{product.name}</div>
              <div className="font-data-mono text-xs text-[var(--color-text-secondary)]">{product.code}</div>
            </div>
            <Lock className="h-4 w-4 text-[var(--color-text-muted)]" />
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="flex flex-col gap-1">
            <label className="text-xs font-semibold uppercase tracking-[0.05em] text-[var(--color-text-secondary)]">Cantidad</label>
            <input
              className="w-full rounded-[var(--radius-control)] border border-[var(--color-border)] px-3 py-2 font-data-mono text-sm text-[var(--color-text)] outline-none transition focus:border-[var(--color-primary)] focus:ring-2 focus:ring-[color:rgba(0,71,130,0.10)]"
              onChange={(event) => setQuantity(Number(event.target.value) || 0)}
              type="number"
              value={quantity}
            />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-xs font-semibold uppercase tracking-[0.05em] text-[var(--color-text-secondary)]">Motivo</label>
            <select
              className="w-full rounded-[var(--radius-control)] border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-2 text-sm text-[var(--color-text)] outline-none transition focus:border-[var(--color-primary)] focus:ring-2 focus:ring-[color:rgba(0,71,130,0.10)]"
              onChange={(event) => setReason(event.target.value)}
              value={reason}
            >
              <option>Vencimiento</option>
              <option>Daño</option>
              <option>Pérdida/Merma</option>
              <option>Ajuste de inventario</option>
              <option>Devolución a proveedor</option>
            </select>
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="flex flex-col gap-1">
            <label className="text-xs font-semibold uppercase tracking-[0.05em] text-[var(--color-text-secondary)]">Lote afectado</label>
            <input className="w-full rounded-[var(--radius-control)] border border-[var(--color-border)] px-3 py-2 font-data-mono text-sm text-[var(--color-text)] outline-none transition focus:border-[var(--color-primary)] focus:ring-2 focus:ring-[color:rgba(0,71,130,0.10)]" defaultValue="L-9021" type="text" />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-xs font-semibold uppercase tracking-[0.05em] text-[var(--color-text-secondary)]">Fecha</label>
            <input className="w-full rounded-[var(--radius-control)] border border-[var(--color-border)] px-3 py-2 font-data-mono text-sm text-[var(--color-text-secondary)] outline-none transition focus:border-[var(--color-primary)] focus:ring-2 focus:ring-[color:rgba(0,71,130,0.10)]" defaultValue="2026-06-29" type="date" />
          </div>
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-xs font-semibold uppercase tracking-[0.05em] text-[var(--color-text-secondary)]">Nota / justificación</label>
          <textarea className="min-h-20 w-full resize-none rounded-[var(--radius-control)] border border-[var(--color-border)] px-3 py-2 text-sm text-[var(--color-text)] outline-none transition focus:border-[var(--color-primary)] focus:ring-2 focus:ring-[color:rgba(0,71,130,0.10)]" placeholder="Opcional" />
        </div>

        <div className="rounded-[var(--radius-control)] border border-[var(--color-border)] bg-[var(--color-surface-strong)] p-4">
          <div className="flex items-center justify-between gap-3">
            <span className="text-sm text-[var(--color-text-secondary)]">
              Existencias actuales: <span className="font-data-mono">{product.stock}</span> {'->'} resultado:{' '}
              <span className="font-data-mono font-medium text-[var(--color-text)]">{resultingStock}</span>
            </span>
            <span className="font-data-mono text-sm font-medium text-[var(--color-danger-text)]">-{quantity}</span>
          </div>

          {warning ? (
            <div className="mt-3 flex items-start gap-2 rounded-[6px] bg-[var(--color-warning-bg)] p-3">
              <TriangleAlert className="mt-0.5 h-4 w-4 shrink-0 text-[var(--color-warning-text)]" />
              <span className="text-sm text-[var(--color-warning-text)]">El resultado quedará por debajo del stock mínimo ({product.minStock})</span>
            </div>
          ) : null}
        </div>
      </div>

      <div className="flex items-center justify-end gap-3 border-t border-[var(--color-border)] bg-[var(--color-surface)] px-5 py-4 sm:px-6">
        <Button onClick={onClose} type="button" variant="ghost">
          Cancelar
        </Button>
        <Button type="button">Registrar salida</Button>
      </div>
    </ModalFrame>
  )
}

function SummaryCard({ label, value, valueClassName, badge = false }: { label: string; value: string; valueClassName?: string; badge?: boolean }) {
  return (
    <div className="rounded-[var(--radius-control)] bg-[var(--color-surface-strong)] p-4">
      <p className="text-xs font-semibold uppercase tracking-[0.05em] text-[var(--color-text-secondary)]">{label}</p>
      {badge ? (
        <span className={`mt-3 inline-flex rounded-[4px] px-2 py-1 text-xs font-semibold uppercase tracking-[0.05em] ${valueClassName ?? ''}`}>{value}</span>
      ) : (
        <p className={`mt-3 font-data-mono text-[24px] font-semibold text-[var(--color-text)] ${valueClassName ?? ''}`}>{value}</p>
      )}
    </div>
  )
}

function DetailItem({ label, value, mono = false }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="space-y-1">
      <p className="text-sm text-[var(--color-text-secondary)]">{label}</p>
      <p className={`${mono ? 'font-data-mono' : 'font-medium'} text-sm text-[var(--color-text)]`}>{value}</p>
    </div>
  )
}

function MovementIcon({ type }: { type: 'IN' | 'OUT' | 'ADJUSTMENT' }) {
  const config = useMemo(() => {
    if (type === 'IN') {
      return { icon: ArrowUp, className: 'bg-[var(--color-success-bg)] text-[var(--color-success-text)]' }
    }

    if (type === 'OUT') {
      return { icon: ArrowDown, className: 'bg-[var(--color-danger-bg)] text-[var(--color-danger-text)]' }
    }

    return { icon: ArrowLeftRight, className: 'bg-[var(--color-surface-tint)] text-[var(--color-primary)]' }
  }, [type])

  const Icon = config.icon

  return (
    <div className={`flex h-8 w-8 items-center justify-center rounded-[6px] ${config.className}`}>
      <Icon className="h-4 w-4" />
    </div>
  )
}

function getStatusClasses(status: string) {
  if (status === 'Optimo') {
    return 'bg-[var(--color-success-bg)] text-[var(--color-success-text)]'
  }

  if (status === 'Critico') {
    return 'bg-[var(--color-warning-bg)] text-[var(--color-warning-text)]'
  }

  return 'bg-[var(--color-danger-bg)] text-[var(--color-danger-text)]'
}
