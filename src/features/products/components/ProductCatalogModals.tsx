import { ArrowDown, ArrowLeftRight, ArrowUp, CircleAlert, Info, Package2, Pill, SquarePen, TriangleAlert, X } from 'lucide-react'
import { useMemo, useState } from 'react'

import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import {
  getCategoryOptions,
  getProductMovementHistory,
  getSupplierOptions,
  type ProductRow,
} from '@/data/mockSelectors'
import { formatCurrency, formatDate } from '@/lib/utils'

export type ProductModalType = 'create' | 'detail' | 'edit' | 'movement' | 'replenishment' | 'deactivate'

interface ProductCatalogModalsProps {
  modalType: ProductModalType | null
  product: ProductRow | null
  onClose: () => void
  onOpenModal: (modalType: ProductModalType, product: ProductRow | null) => void
}

const movementTypeOptions = {
  IN: ['Recepcion de proveedor', 'Devolucion de cliente', 'Ajuste de inventario (+)'],
  OUT: ['Dispensacion en ventanilla', 'Merma o vencimiento', 'Traslado a otra sede'],
  ADJUSTMENT: ['Conteo fisico', 'Correccion manual', 'Auditoria interna'],
} as const

export function ProductCatalogModals({ modalType, product, onClose, onOpenModal }: ProductCatalogModalsProps) {
  if (!modalType) {
    return null
  }

  if (modalType === 'create') {
    return <NewProductModal onClose={onClose} />
  }

  if (!product) {
    return null
  }

  if (modalType === 'detail') {
    return <ProductDetailModal onClose={onClose} onOpenModal={onOpenModal} product={product} />
  }

  if (modalType === 'edit') {
    return <EditProductModal onClose={onClose} product={product} />
  }

  if (modalType === 'movement') {
    return <RegisterMovementModal onClose={onClose} product={product} />
  }

  if (modalType === 'replenishment') {
    return <ReplenishmentModal onClose={onClose} product={product} />
  }

  return <DeactivateProductModal onClose={onClose} product={product} />
}

function ModalFrame({
  children,
  title,
  onClose,
  maxWidth = 'max-w-[560px]',
}: {
  children: React.ReactNode
  title: string
  onClose: () => void
  maxWidth?: string
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-5">
      <button className="absolute inset-0 bg-[#0e1d27]/40 backdrop-blur-[2px]" onClick={onClose} type="button" />
      <div className={`relative flex max-h-[90vh] w-full flex-col overflow-hidden rounded-[var(--radius-panel)] border border-[var(--color-border)] bg-[var(--color-surface)] shadow-[0_8px_30px_rgba(0,0,0,0.12)] ${maxWidth}`}>
        <div className="flex items-center justify-between border-b border-[var(--color-border)] px-5 py-4 sm:px-6">
          <h3 className="pr-4 text-[20px] font-semibold leading-7 text-[var(--color-text)]">{title}</h3>
          <button
            className="rounded-[var(--radius-control)] p-1 text-[var(--color-text-muted)] transition hover:bg-[var(--color-surface-strong)] hover:text-[var(--color-text)]"
            onClick={onClose}
            type="button"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        {children}
      </div>
    </div>
  )
}

function FieldLabel({ children }: { children: React.ReactNode }) {
  return <label className="text-xs font-semibold uppercase tracking-[0.05em] text-[var(--color-text-secondary)]">{children}</label>
}

function TextField({ defaultValue = '', placeholder, mono = false }: { defaultValue?: string; placeholder?: string; mono?: boolean }) {
  return (
    <input
      className={`w-full rounded-[var(--radius-control)] border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-2 text-sm text-[var(--color-text)] outline-none transition focus:border-[var(--color-primary)] focus:ring-2 focus:ring-[color:rgba(0,71,130,0.10)] ${mono ? 'font-data-mono' : ''}`}
      defaultValue={defaultValue}
      placeholder={placeholder}
      type="text"
    />
  )
}

function NumberField({ defaultValue, placeholder }: { defaultValue?: number; placeholder?: string }) {
  return (
    <input
      className="w-full rounded-[var(--radius-control)] border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-2 font-data-mono text-sm text-[var(--color-text)] outline-none transition focus:border-[var(--color-primary)] focus:ring-2 focus:ring-[color:rgba(0,71,130,0.10)]"
      defaultValue={defaultValue}
      placeholder={placeholder}
      type="number"
    />
  )
}

function SelectField({ options, defaultValue }: { options: string[]; defaultValue?: string }) {
  return (
    <select
      className="w-full rounded-[var(--radius-control)] border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-2 text-sm text-[var(--color-text)] outline-none transition focus:border-[var(--color-primary)] focus:ring-2 focus:ring-[color:rgba(0,71,130,0.10)]"
      defaultValue={defaultValue}
    >
      {defaultValue ? null : <option value="">Seleccionar</option>}
      {options.map((option) => (
        <option key={option} value={option}>
          {option}
        </option>
      ))}
    </select>
  )
}

function NewProductModal({ onClose }: { onClose: () => void }) {
  const categories = getCategoryOptions()
  const suppliers = getSupplierOptions()

  return (
    <ModalFrame maxWidth="max-w-[560px]" onClose={onClose} title="Nuevo Producto">
      <div className="flex-1 space-y-6 overflow-y-auto px-5 py-5 sm:px-6">
        <div className="space-y-4">
          <div className="space-y-1.5">
            <FieldLabel>Nombre del producto</FieldLabel>
            <input
              className="w-full rounded-[var(--radius-control)] border border-[var(--color-danger-text)] bg-[color:rgba(176,48,31,0.04)] px-3 py-2 text-sm text-[var(--color-text)] outline-none"
              placeholder="Ej. Amoxicilina 500mg"
              type="text"
            />
            <p className="flex items-center gap-1 text-xs text-[var(--color-danger-text)]">
              <CircleAlert className="h-3.5 w-3.5" />
              El nombre es obligatorio
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <FieldLabel>SKU / Codigo</FieldLabel>
              <TextField mono placeholder="SKU-" />
            </div>
            <div className="space-y-1.5">
              <FieldLabel>Categoria</FieldLabel>
              <SelectField options={categories} />
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <FieldLabel>Precio (USD)</FieldLabel>
              <NumberField placeholder="0.00" />
            </div>
            <div className="space-y-1.5">
              <FieldLabel>Proveedor</FieldLabel>
              <SelectField options={suppliers} />
            </div>
          </div>
        </div>

        <div className="border-t border-[var(--color-border)] pt-6">
          <div className="space-y-4">
            <h4 className="text-sm font-semibold text-[var(--color-text)]">Inventario</h4>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <FieldLabel>Stock inicial</FieldLabel>
                <NumberField placeholder="0" />
              </div>
              <div className="space-y-1.5">
                <FieldLabel>Stock minimo</FieldLabel>
                <NumberField placeholder="10" />
              </div>
            </div>
            <div className="space-y-1.5">
              <FieldLabel>Ubicacion</FieldLabel>
              <TextField placeholder="Ej. A1-F3" />
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between rounded-[var(--radius-panel)] border border-[var(--color-border)] bg-[var(--color-surface-strong)] p-4">
          <div>
            <p className="text-sm font-medium text-[var(--color-text)]">Activo en catalogo</p>
            <p className="text-xs text-[var(--color-text-secondary)]">El producto sera visible para facturacion</p>
          </div>
          <div className="flex h-6 w-11 items-center rounded-full bg-[var(--color-primary)] p-0.5">
            <div className="ml-auto h-5 w-5 rounded-full bg-white" />
          </div>
        </div>
      </div>

      <div className="flex items-center justify-end gap-3 border-t border-[var(--color-border)] bg-[var(--color-surface-strong)] px-5 py-4 sm:px-6">
        <Button onClick={onClose} type="button" variant="ghost">
          Cancelar
        </Button>
        <Button type="button">Guardar producto</Button>
      </div>
    </ModalFrame>
  )
}

function ProductDetailModal({
  onClose,
  onOpenModal,
  product,
}: {
  onClose: () => void
  onOpenModal: (modalType: ProductModalType, product: ProductRow | null) => void
  product: ProductRow
}) {
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
          <SummaryCard label="Estado" value={product.status} valueClassName={getStatusClasses(product.status)} badge />
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

      <div className="flex flex-col gap-3 border-t border-[var(--color-border)] bg-[var(--color-surface-strong)] px-5 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
        <Button onClick={() => onOpenModal('replenishment', product)} type="button" variant="secondary">
          <Package2 className="mr-2 h-4 w-4" />
          Generar reposicion
        </Button>
        <div className="flex justify-end gap-3">
          <Button onClick={onClose} type="button" variant="ghost">
            Cerrar
          </Button>
          <Button onClick={() => onOpenModal('edit', product)} type="button">
            <SquarePen className="mr-2 h-4 w-4" />
            Editar
          </Button>
        </div>
      </div>
    </ModalFrame>
  )
}

function EditProductModal({ onClose, product }: { onClose: () => void; product: ProductRow }) {
  const categories = getCategoryOptions()
  const suppliers = getSupplierOptions()
  const latestUpdate = getProductMovementHistory(product.id)[0]?.createdAt

  return (
    <ModalFrame maxWidth="max-w-[560px]" onClose={onClose} title="Editar Producto">
      <div className="flex-1 space-y-6 overflow-y-auto px-5 py-5 sm:px-6">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-[4px] bg-[var(--color-surface-tint)] px-2 py-0.5 text-xs font-semibold uppercase tracking-[0.05em] text-[var(--color-primary)]">{product.category}</span>
            <span className={`rounded-[4px] px-2 py-0.5 text-xs font-semibold uppercase tracking-[0.05em] ${getStatusClasses(product.status)}`}>{product.status}</span>
          </div>
          <p className="mt-2 font-data-mono text-sm text-[var(--color-text-muted)]">{product.code}</p>
        </div>

        <div className="grid gap-4">
          <div className="space-y-1.5">
            <FieldLabel>Nombre del producto</FieldLabel>
            <TextField defaultValue={product.name} />
          </div>
          <div className="space-y-1.5">
            <FieldLabel>Stock actual</FieldLabel>
            <div className="rounded-[var(--radius-control)] border border-[var(--color-border)] bg-[var(--color-surface-strong)] px-3 py-2 font-data-mono text-sm text-[var(--color-text)]">{product.stock}</div>
          </div>
          <div className="space-y-1.5">
            <FieldLabel>Stock minimo</FieldLabel>
            <NumberField defaultValue={product.minStock} />
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <FieldLabel>Categoria</FieldLabel>
            <SelectField defaultValue={product.category} options={categories} />
          </div>
          <div className="space-y-1.5">
            <FieldLabel>Precio unitario</FieldLabel>
            <NumberField defaultValue={product.price} />
          </div>
          <div className="space-y-1.5">
            <FieldLabel>Proveedor</FieldLabel>
            <SelectField defaultValue={product.suppliers[0]} options={suppliers} />
          </div>
          <div className="space-y-1.5">
            <FieldLabel>Ultima actualizacion</FieldLabel>
            <div className="rounded-[var(--radius-control)] border border-[var(--color-border)] bg-[var(--color-surface-strong)] px-3 py-2 font-data-mono text-sm text-[var(--color-text-secondary)]">
              {latestUpdate ? formatDate(latestUpdate) : 'Sin movimientos'}
            </div>
          </div>
        </div>
      </div>

      <div className="flex flex-col gap-3 border-t border-[var(--color-border)] bg-[var(--color-surface-strong)] px-5 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
        <button className="inline-flex items-center gap-2 rounded-[var(--radius-control)] px-4 py-2 text-sm font-medium text-[var(--color-danger-text)] transition hover:bg-[var(--color-danger-bg)]" type="button">
          <TriangleAlert className="h-4 w-4" />
          Eliminar producto
        </button>
        <div className="flex justify-end gap-3">
          <Button onClick={onClose} type="button" variant="ghost">
            Cancelar
          </Button>
          <Button type="button">Guardar cambios</Button>
        </div>
      </div>
    </ModalFrame>
  )
}

function RegisterMovementModal({ onClose, product }: { onClose: () => void; product: ProductRow }) {
  const [movementType, setMovementType] = useState<'IN' | 'OUT' | 'ADJUSTMENT'>('IN')
  const [quantity, setQuantity] = useState(10)
  const resultingStock = movementType === 'IN' ? product.stock + quantity : Math.max(product.stock - quantity, 0)

  return (
    <ModalFrame maxWidth="max-w-[420px]" onClose={onClose} title="Registrar movimiento">
      <div className="space-y-6 px-5 py-5 sm:px-6">
        <div className="flex items-start gap-4">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-[var(--radius-control)] border border-[var(--color-border)] bg-[#e1f5ee] text-[#086b53]">
            <Pill className="h-5 w-5" />
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.05em] text-[var(--color-text-secondary)]">COD: {product.code}</p>
            <p className="text-sm font-medium text-[var(--color-text)]">{product.name}</p>
          </div>
        </div>

        <div className="flex rounded-[var(--radius-control)] border border-[var(--color-border)] bg-[var(--color-surface-strong)] p-1">
          {(['IN', 'OUT', 'ADJUSTMENT'] as const).map((type) => (
            <button
              key={type}
              className={`flex-1 rounded-[6px] px-3 py-2 text-sm font-medium transition ${
                movementType === type ? 'border border-[var(--color-border)] bg-white text-[var(--color-primary)]' : 'text-[var(--color-text-secondary)]'
              }`}
              onClick={() => setMovementType(type)}
              type="button"
            >
              {type === 'IN' ? 'Entrada' : type === 'OUT' ? 'Salida' : 'Ajuste'}
            </button>
          ))}
        </div>

        <div className="space-y-4">
          <div className="space-y-1.5">
            <FieldLabel>Cantidad</FieldLabel>
            <input
              className="w-full rounded-[var(--radius-control)] border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-2 font-data-mono text-sm text-[var(--color-text)] outline-none transition focus:border-[var(--color-primary)] focus:ring-2 focus:ring-[color:rgba(0,71,130,0.10)]"
              onChange={(event) => setQuantity(Number(event.target.value) || 0)}
              type="number"
              value={quantity}
            />
          </div>

          <div className="space-y-1.5">
            <FieldLabel>Motivo</FieldLabel>
            <SelectField defaultValue={movementTypeOptions[movementType][0]} options={[...movementTypeOptions[movementType]]} />
          </div>
        </div>

        <div className="flex items-center gap-3 rounded-[var(--radius-control)] border border-[var(--color-border)] bg-[var(--color-surface-strong)] p-3">
          <Info className="h-4 w-4 text-[var(--color-text-secondary)]" />
          <p className="text-sm text-[var(--color-text-secondary)]">
            Existencias actuales: <span className="font-data-mono">{product.stock}</span> {'->'} resultado:{' '}
            <span className="font-data-mono font-semibold text-[var(--color-primary)]">{resultingStock}</span>
          </p>
        </div>
      </div>

      <div className="flex items-center justify-end gap-3 border-t border-[var(--color-border)] bg-[var(--color-surface)] px-5 py-4 sm:px-6">
        <Button onClick={onClose} type="button" variant="secondary">
          Cancelar
        </Button>
        <Button type="button">Registrar</Button>
      </div>
    </ModalFrame>
  )
}

function ReplenishmentModal({ onClose, product }: { onClose: () => void; product: ProductRow }) {
  const [requestedUnits, setRequestedUnits] = useState(Math.max(product.minStock - product.stock, 25))

  return (
    <ModalFrame maxWidth="max-w-[620px]" onClose={onClose} title="Nueva solicitud de reposicion">
      <div className="flex-1 space-y-6 overflow-y-auto px-5 py-5 sm:px-6">
        <div className="space-y-1.5">
          <FieldLabel>Proveedor</FieldLabel>
          <SelectField defaultValue={product.suppliers[0]} options={product.suppliers.length ? product.suppliers : getSupplierOptions()} />
          <p className="text-xs text-[var(--color-text-muted)]">Solo se listan productos asociados a este proveedor</p>
        </div>

        <div>
          <h4 className="mb-3 text-[20px] font-semibold text-[var(--color-text)]">Productos a solicitar</h4>
          <Card className="overflow-hidden p-0">
            <div className="overflow-x-auto">
              <table className="min-w-full border-collapse text-left">
                <thead className="bg-[var(--color-surface-tint)]/50">
                  <tr>
                    <th className="border-b border-[var(--color-border)] px-4 py-3 text-xs font-semibold uppercase tracking-[0.05em] text-[var(--color-text-secondary)]">Producto</th>
                    <th className="border-b border-[var(--color-border)] px-4 py-3 text-right text-xs font-semibold uppercase tracking-[0.05em] text-[var(--color-text-secondary)]">Existencias</th>
                    <th className="border-b border-[var(--color-border)] px-4 py-3 text-right text-xs font-semibold uppercase tracking-[0.05em] text-[var(--color-text-secondary)]">Cantidad</th>
                    <th className="border-b border-[var(--color-border)] px-4 py-3" />
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-b border-[var(--color-border)]">
                    <td className="px-4 py-3 text-sm text-[var(--color-text)]">{product.name}</td>
                    <td className="px-4 py-3 text-right font-data-mono text-sm text-[var(--color-danger-text)]">{product.stock}</td>
                    <td className="px-4 py-3 text-right">
                      <input
                        className="w-20 rounded-[var(--radius-control)] border border-[var(--color-border)] px-2 py-1 text-right font-data-mono text-sm"
                        onChange={(event) => setRequestedUnits(Number(event.target.value) || 0)}
                        type="number"
                        value={requestedUnits}
                      />
                    </td>
                    <td className="px-4 py-3 text-right text-[var(--color-text-muted)]">1 linea</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </Card>
        </div>

        <div className="space-y-1.5">
          <FieldLabel>Nota para el proveedor</FieldLabel>
          <textarea
            className="min-h-24 w-full resize-none rounded-[var(--radius-control)] border border-[var(--color-border)] bg-[var(--color-surface)] p-3 text-sm text-[var(--color-text)] outline-none transition focus:border-[var(--color-primary)] focus:ring-2 focus:ring-[color:rgba(0,71,130,0.10)]"
            placeholder="Escriba aqui instrucciones adicionales..."
          />
        </div>

        <div className="rounded-[var(--radius-control)] border border-[var(--color-border)] bg-[var(--color-surface-tint)] p-4">
          <div className="flex flex-col gap-2 text-sm text-[var(--color-text)] sm:flex-row sm:items-center sm:justify-between">
            <span>
              Total de lineas: <span className="font-data-mono font-semibold">1</span>
            </span>
            <span>
              Unidades: <span className="font-data-mono font-semibold">{requestedUnits}</span>
            </span>
          </div>
          <div className="mt-3 flex items-start gap-2 text-sm text-[var(--color-success-text)]">
            <Info className="mt-0.5 h-4 w-4 shrink-0" />
            <p>Al enviar, la solicitud se mandara por WhatsApp al proveedor.</p>
          </div>
        </div>
      </div>

      <div className="flex flex-col gap-3 border-t border-[var(--color-border)] bg-[var(--color-surface)] px-5 py-4 sm:flex-row sm:items-center sm:justify-end sm:px-6">
        <Button onClick={onClose} type="button" variant="ghost">
          Cancelar
        </Button>
        <Button type="button" variant="secondary">
          Guardar como pendiente
        </Button>
        <Button type="button">Generar y enviar</Button>
      </div>
    </ModalFrame>
  )
}

function DeactivateProductModal({ onClose, product }: { onClose: () => void; product: ProductRow }) {
  return (
    <ModalFrame maxWidth="max-w-[420px]" onClose={onClose} title="Desactivar producto">
      <div className="space-y-5 px-5 py-5 sm:px-6">
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[var(--color-danger-bg)] text-[var(--color-danger-text)]">
            <TriangleAlert className="h-5 w-5" />
          </div>
          <p className="text-sm leading-6 text-[var(--color-text-secondary)]">
            ¿Desactivar <span className="font-semibold text-[var(--color-text)]">{product.name}</span>? Dejara de aparecer en el catalogo activo, pero se conservara su historial de movimientos.
          </p>
        </div>
      </div>
      <div className="flex items-center justify-end gap-3 px-5 pb-5 sm:px-6">
        <Button onClick={onClose} type="button" variant="secondary">
          Cancelar
        </Button>
        <button className="inline-flex min-h-10 items-center justify-center rounded-[var(--radius-control)] bg-[var(--color-danger-text)] px-4 py-2 text-sm font-medium text-white transition hover:opacity-90" type="button">
          Desactivar
        </button>
      </div>
    </ModalFrame>
  )
}

function SummaryCard({
  label,
  value,
  valueClassName,
  badge = false,
}: {
  label: string
  value: string
  valueClassName?: string
  badge?: boolean
}) {
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
      return {
        icon: ArrowUp,
        className: 'bg-[var(--color-success-bg)] text-[var(--color-success-text)]',
      }
    }

    if (type === 'OUT') {
      return {
        icon: ArrowDown,
        className: 'bg-[var(--color-danger-bg)] text-[var(--color-danger-text)]',
      }
    }

    return {
      icon: ArrowLeftRight,
      className: 'bg-[var(--color-surface-tint)] text-[var(--color-primary)]',
    }
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
