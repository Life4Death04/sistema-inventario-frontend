import { isAxiosError } from 'axios'
import type { TFunction } from 'i18next'
import { ArrowDown, ArrowLeftRight, ArrowUp, Lock, TriangleAlert, X } from 'lucide-react'
import { useMemo, useState } from 'react'
import toast from 'react-hot-toast'
import { Trans, useTranslation } from 'react-i18next'

import { Button } from '@/components/ui/Button'
import {
  useCreateInventoryMovement,
  useProductInventoryMovements,
} from '@/features/inventory-movements/api/useInventoryMovements'
import type { InventoryRow } from '@/features/inventory/lib/inventoryRows'
import { getStockStatusLabel, type StockStatus } from '@/lib/stockStatus'
import { formatCurrency, formatDate } from '@/lib/utils'
import type { ApiErrorEnvelope, InventoryMovement } from '@/types/api.types'

type InventoryTFunction = TFunction<['inventory', 'common']>

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
  const { t } = useTranslation(['inventory', 'common'])
  const { data, error, isLoading } = useProductInventoryMovements(product.id, { limit: 3 })
  const history = data?.data ?? []
  const latestUpdate = history[0]?.createdAt
  const notAvailable = t('common:state.notAvailable')

  return (
    <ModalFrame maxWidth="max-w-[560px]" onClose={onClose} title={t('inventory:modals.detail.title')}>
      <div className="flex-1 space-y-6 overflow-y-auto px-5 py-5 sm:px-6">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h4 className="text-lg font-medium text-[var(--color-text)]">{product.name}</h4>
            <span className="rounded-[4px] bg-[var(--color-surface-tint)] px-2 py-0.5 text-xs font-semibold uppercase tracking-[0.05em] text-[var(--color-primary)]">{product.category}</span>
            <span className={`rounded-[4px] px-2 py-0.5 text-xs font-semibold uppercase tracking-[0.05em] ${getStatusClasses(product.status)}`}>{getStockStatusLabel(product.status, t)}</span>
          </div>
          <p className="mt-1 font-data-mono text-sm text-[var(--color-text-muted)]">{product.code}</p>
        </div>

        <div className="grid gap-4 sm:grid-cols-3">
          <SummaryCard label={t('inventory:modals.detail.summary.stock')} value={product.stock.toLocaleString('es-VE')} />
          <SummaryCard label={t('inventory:modals.detail.summary.minStock')} value={product.minStock.toLocaleString('es-VE')} />
          <SummaryCard badge label={t('inventory:modals.detail.summary.status')} value={getStockStatusLabel(product.status, t)} valueClassName={getStatusClasses(product.status)} />
        </div>

        <div className="grid gap-x-8 gap-y-5 sm:grid-cols-2">
          <DetailItem label={t('inventory:modals.detail.fields.category')} value={product.category} />
          <DetailItem label={t('inventory:modals.detail.fields.unitPrice')} mono value={product.price != null ? formatCurrency(Number(product.price)) : notAvailable} />
          <DetailItem label={t('inventory:modals.detail.fields.supplier')} value={product.suppliers.join(', ') || notAvailable} />
          <DetailItem label={t('inventory:modals.detail.fields.lastUpdate')} mono value={latestUpdate ? formatDate(latestUpdate) : notAvailable} />
          <DetailItem label={t('inventory:modals.detail.fields.presentation')} value={`${product.brandLabel} · ${product.presentationLabel}`} />
          <DetailItem label={t('inventory:modals.detail.fields.content')} mono value={`${product.unitContent} ${product.unit}`} />
          <DetailItem label={t('inventory:modals.detail.fields.activeIngredient')} value={product.activeIngredientLabel} />
        </div>

        <div className="space-y-3">
          <h5 className="text-xs font-semibold uppercase tracking-[0.05em] text-[var(--color-text-secondary)]">{t('inventory:modals.detail.recentMovements.heading')}</h5>
          <div className="space-y-2">
            {isLoading ? <MovementStateMessage label={t('inventory:modals.detail.recentMovements.loading')} /> : null}
            {!isLoading && error ? <MovementStateMessage label={t('inventory:modals.detail.recentMovements.loadError')} tone="error" /> : null}
            {!isLoading && !error && history.length === 0 ? <MovementStateMessage label={t('inventory:modals.detail.recentMovements.empty')} /> : null}
            {!isLoading && !error
              ? history.map((movement) => (
                  <div key={movement.id} className="flex items-center justify-between gap-3 rounded-[var(--radius-control)] border border-[var(--color-border)] bg-[var(--color-surface)] p-3">
                    <div className="flex min-w-0 items-center gap-3">
                      <MovementIcon type={movement.type} />
                      <div>
                        <p className="text-sm font-medium text-[var(--color-text)]">{getMovementLabel(movement.type, t)}</p>
                        <p className="text-xs text-[var(--color-text-secondary)]">{getMovementSubtitle(movement, t)}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-data-mono text-sm text-[var(--color-text)]">
                        {getMovementSignal(movement)}
                        {movement.quantity}
                      </p>
                      <p className="font-data-mono text-xs text-[var(--color-text-secondary)]">{formatDate(movement.createdAt)}</p>
                    </div>
                  </div>
                ))
              : null}
          </div>
        </div>
      </div>

      <div className="flex items-center justify-end gap-3 border-t border-[var(--color-border)] bg-[var(--color-surface-strong)] px-5 py-4 sm:px-6">
        <Button onClick={onClose} type="button" variant="ghost">
          {t('inventory:modals.detail.closeButton')}
        </Button>
      </div>
    </ModalFrame>
  )
}

const OUTPUT_REASON_KEYS = ['dispensing', 'expiration', 'damage', 'lossOrShrinkage', 'inventoryAdjustment', 'supplierReturn'] as const

type OutputReasonKey = (typeof OUTPUT_REASON_KEYS)[number]

// Stable, locale-independent values persisted to the backend. Display labels are
// resolved separately via t() so the stored audit trail never changes meaning
// depending on which UI language was active when the movement was submitted
// (same key/label split already established in src/lib/stockStatus.ts).
const OUTPUT_REASON_BACKEND_VALUES: Record<OutputReasonKey, string> = {
  dispensing: 'Dispensación por Ventanilla',
  expiration: 'Vencimiento',
  damage: 'Daño',
  lossOrShrinkage: 'Pérdida/Merma',
  inventoryAdjustment: 'Ajuste de inventario',
  supplierReturn: 'Devolución a proveedor',
}

function RegisterOutputModal({ onClose, product }: { onClose: () => void; product: InventoryRow }) {
  const { t } = useTranslation(['inventory', 'common'])
  const [quantity, setQuantity] = useState(0)
  const [reasonKey, setReasonKey] = useState<OutputReasonKey>('dispensing')
  const reason = OUTPUT_REASON_BACKEND_VALUES[reasonKey]
  const createMovementMutation = useCreateInventoryMovement()
  const resultingStock = Math.max(product.stock - quantity, 0)
  const warning = resultingStock < product.minStock

  return (
    <ModalFrame maxWidth="max-w-[480px]" onClose={onClose} title={t('inventory:modals.output.title')}>
      <div className="space-y-6 overflow-y-auto px-5 py-5 sm:px-6">
        <div className="flex flex-col gap-1">
          <label className="text-xs font-semibold uppercase tracking-[0.05em] text-[var(--color-text-secondary)]">{t('inventory:modals.output.fields.product')}</label>
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
            <label className="text-xs font-semibold uppercase tracking-[0.05em] text-[var(--color-text-secondary)]">{t('inventory:modals.output.fields.quantity')}</label>
            <input
              className="w-full rounded-[var(--radius-control)] border border-[var(--color-border)] px-3 py-2 font-data-mono text-sm text-[var(--color-text)] outline-none transition focus:border-[var(--color-primary)] focus:ring-2 focus:ring-[color:rgba(0,71,130,0.10)]"
              onChange={(event) => setQuantity(Number(event.target.value) || 0)}
              type="number"
              value={quantity}
            />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-xs font-semibold uppercase tracking-[0.05em] text-[var(--color-text-secondary)]">{t('inventory:modals.output.fields.reason')}</label>
            <select
              className="w-full rounded-[var(--radius-control)] border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-2 text-sm text-[var(--color-text)] outline-none transition focus:border-[var(--color-primary)] focus:ring-2 focus:ring-[color:rgba(0,71,130,0.10)]"
              onChange={(event) => setReasonKey(event.target.value as OutputReasonKey)}
              value={reasonKey}
            >
              {OUTPUT_REASON_KEYS.map((key) => (
                <option key={key} value={key}>
                  {t(`inventory:modals.output.reasons.${key}`)}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="rounded-[var(--radius-control)] border border-[var(--color-border)] bg-[var(--color-surface-strong)] p-4">
          <div className="flex items-center justify-between gap-3">
            <span className="text-sm text-[var(--color-text-secondary)]">
              <Trans
                components={{
                  mono: <span className="font-data-mono" />,
                  result: <span className="font-data-mono font-medium text-[var(--color-text)]" />,
                }}
                i18nKey="inventory:modals.output.resultingStock"
                values={{ current: product.stock, result: resultingStock }}
              />
            </span>
            <span className="font-data-mono text-sm font-medium text-[var(--color-danger-text)]">-{quantity}</span>
          </div>

          {warning ? (
            <div className="mt-3 flex items-start gap-2 rounded-[6px] bg-[var(--color-warning-bg)] p-3">
              <TriangleAlert className="mt-0.5 h-4 w-4 shrink-0 text-[var(--color-warning-text)]" />
              <span className="text-sm text-[var(--color-warning-text)]">{t('inventory:modals.output.belowMinimumWarning', { minStock: product.minStock })}</span>
            </div>
          ) : null}
        </div>
      </div>

      <div className="flex items-center justify-end gap-3 border-t border-[var(--color-border)] bg-[var(--color-surface)] px-5 py-4 sm:px-6">
        <Button disabled={createMovementMutation.isPending} onClick={onClose} type="button" variant="ghost">
          {t('inventory:modals.output.cancelButton')}
        </Button>
        <Button
          disabled={createMovementMutation.isPending}
          onClick={() => {
            if (quantity <= 0) {
              toast.error(t('inventory:validation.quantityPositive'))
              return
            }

            if (!reason.trim()) {
              toast.error(t('inventory:validation.reasonRequired'))
              return
            }

            createMovementMutation.mutate(
              {
                productId: product.id,
                type: 'OUT',
                quantity,
                reason,
              },
              {
                onError: (error: unknown) => {
                  toast.error(getInventoryMovementErrorMessage(error, t))
                },
                onSuccess: () => {
                  toast.success(t('inventory:toasts.outputRegistered'))
                  onClose()
                },
              },
            )
          }}
          type="button"
        >
          {createMovementMutation.isPending ? t('inventory:modals.output.submitting') : t('inventory:modals.output.submitButton')}
        </Button>
      </div>
    </ModalFrame>
  )
}

function MovementStateMessage({ label, tone = 'muted' }: { label: string; tone?: 'error' | 'muted' }) {
  return <div className={`rounded-[var(--radius-control)] border border-[var(--color-border)] px-3 py-4 text-sm ${tone === 'error' ? 'text-[var(--color-danger-text)]' : 'text-[var(--color-text-secondary)]'}`}>{label}</div>
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

function getStatusClasses(status: StockStatus) {
  if (status === 'healthy') {
    return 'bg-[var(--color-success-bg)] text-[var(--color-success-text)]'
  }

  if (status === 'low') {
    return 'bg-[var(--color-warning-bg)] text-[var(--color-warning-text)]'
  }

  return 'bg-[var(--color-danger-bg)] text-[var(--color-danger-text)]'
}

function getMovementLabel(type: InventoryMovement['type'], t: InventoryTFunction) {
  if (type === 'IN') {
    return t('inventory:modals.detail.recentMovements.types.in')
  }

  if (type === 'OUT') {
    return t('inventory:modals.detail.recentMovements.types.out')
  }

  return t('inventory:modals.detail.recentMovements.types.adjustment')
}

function getMovementSubtitle(movement: InventoryMovement, t: InventoryTFunction) {
  const userLabel = t('inventory:modals.detail.recentMovements.userLabel', { id: shortId(movement.userId) })

  return movement.reason ? `${movement.reason} · ${userLabel}` : userLabel
}

function getMovementSignal(movement: InventoryMovement) {
  if (movement.type === 'IN') {
    return '+'
  }

  if (movement.type === 'OUT') {
    return '-'
  }

  return movement.adjustmentDirection === 'DECREASE' ? '-' : '+'
}

function getInventoryMovementErrorMessage(error: unknown, t: InventoryTFunction) {
  if (!isAxiosError<ApiErrorEnvelope>(error)) {
    return t('inventory:errors.registerOutputFailed')
  }

  return error.response?.data.message?.trim() || t('inventory:errors.registerOutputFailed')
}

function shortId(value: string) {
  return value.length > 8 ? value.slice(0, 8) : value
}
