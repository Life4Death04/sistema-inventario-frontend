import { useMutation, useQueryClient } from '@tanstack/react-query'
import { isAxiosError } from 'axios'
import { AlertTriangle, Circle, CircleDot, LoaderCircle, MessageCircle, Plus, Send, X } from 'lucide-react'
import { useState, type ReactNode } from 'react'
import toast from 'react-hot-toast'

import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { Loading } from '@/components/ui/Loading'
import { hasPermission } from '@/features/auth/lib/permissions'
import { useAuthStore } from '@/features/auth/store/auth.store'
import { useProducts } from '@/features/products/api/useProducts'
import { toProductRow, type ProductRow } from '@/features/products/lib/productRows'
import {
  createReplenishmentRequest,
  cancelReplenishmentRequest,
  receiveReplenishmentRequest,
  sendReplenishmentRequest,
  type CreateReplenishmentRequestInput,
  type ReceiveReplenishmentRequestInput,
} from '@/features/replenishment/api/replenishmentRequests.api'
import { useReplenishmentRequest } from '@/features/replenishment/api/useReplenishmentRequest'
import { useSuppliers } from '@/features/suppliers/api/useSuppliers'
import { queryKeys, receiveReplenishmentInvalidationKeys } from '@/lib/queryKeys'
import { formatCurrency, formatDate } from '@/lib/utils'
import type { ApiErrorEnvelope, ReplenishmentStatus } from '@/types/api.types'
import { type ReplenishmentDetail, type ReplenishmentRow, toReplenishmentDetail } from '@/features/replenishment/lib/replenishmentView'

export type ReplenishmentModalType = 'generate' | 'detail' | 'change-status'

interface ReplenishmentModalsProps {
  modalType: ReplenishmentModalType | null
  request: ReplenishmentRow | null
  onClose: () => void
  onOpenModal: (modalType: ReplenishmentModalType, request: ReplenishmentRow | null) => void
}

export function ReplenishmentModals({ modalType, request, onClose, onOpenModal }: ReplenishmentModalsProps) {
  if (!modalType) {
    return null
  }

  if (modalType === 'generate') {
    return <GenerateReplenishmentModal onClose={onClose} />
  }

  if (!request) {
    return null
  }

  if (modalType === 'detail') {
    return <ReplenishmentDetailModal onClose={onClose} onOpenModal={onOpenModal} request={request} />
  }

  return <ChangeStatusModal onClose={onClose} request={request} />
}

function ModalFrame({ children, title, onClose, maxWidth = 'max-w-[620px]' }: { children: ReactNode; title: string; onClose: () => void; maxWidth?: string }) {
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

export function GenerateReplenishmentModal({
  initialProduct,
  initialSupplierId = '',
  onClose,
}: {
  initialProduct?: ProductRow
  initialSupplierId?: string
  onClose: () => void
}) {
  const user = useAuthStore((state) => state.user)
  const canManage = hasPermission(user?.role, 'manage:replenishment')
  const queryClient = useQueryClient()
  const [selectedProducts, setSelectedProducts] = useState<SelectedReplenishmentProduct[]>(
    initialProduct ? [buildSelectedProduct(initialProduct)] : [],
  )
  const [isAssociateOpen, setIsAssociateOpen] = useState(false)
  const [selectedSupplierId, setSelectedSupplierId] = useState(initialSupplierId)
  const [note, setNote] = useState('')
  const [submitMode, setSubmitMode] = useState<'pending' | 'send' | null>(null)

  const { data: suppliersResponse, isLoading: isLoadingSuppliers } = useSuppliers({ active: true, limit: 100 })
  const { data: productsResponse, isLoading: isLoadingProducts } = useProducts({
    active: true,
    pageSize: 100,
    supplierId: selectedSupplierId || undefined,
  })
  const supplierOptions = suppliersResponse?.data ?? []
  const productOptions = (productsResponse?.data ?? []).map((product) => toProductRow(product))

  const handleSupplierChange = (supplierId: string) => {
    setSelectedSupplierId(supplierId)
    setSelectedProducts([])
    setIsAssociateOpen(false)
  }

  const totalUnits = selectedProducts.reduce((acc, item) => acc + item.requestedQuantity, 0)

  const createMutation = useMutation({
    mutationFn: async (mode: 'pending' | 'send') => {
      const created = await createReplenishmentRequest(toCreateReplenishmentInput(selectedSupplierId, note, selectedProducts))

      if (mode === 'send') {
        return sendReplenishmentRequest(created.id)
      }

      return created
    },
    onSuccess: async (request) => {
      await invalidateReplenishmentQueries(queryClient, request.id)
      toast.success(submitMode === 'send' ? 'Solicitud enviada correctamente' : 'Solicitud creada correctamente')
      onClose()
    },
    onError: (error: unknown) => {
      toast.error(getReplenishmentErrorMessage(error, 'create'))
    },
    onSettled: () => {
      setSubmitMode(null)
    },
  })

  const handleSubmit = (mode: 'pending' | 'send') => {
    if (!canManage) {
      return
    }

    const validationError = validateCreateReplenishment(selectedSupplierId, selectedProducts)

    if (validationError) {
      toast.error(validationError)
      return
    }

    setSubmitMode(mode)
    createMutation.mutate(mode)
  }

  return (
    <ModalFrame maxWidth="max-w-[880px]" onClose={onClose} title="Nueva solicitud de reposición">
      <div className="relative flex-1 overflow-y-auto bg-[var(--color-page-bg)] p-6 space-y-6">
        <div>
          <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.05em] text-[var(--color-text-secondary)]">Proveedor</label>
          <select className="w-full rounded-[var(--radius-control)] border border-[var(--color-border)] bg-white py-2.5 pl-3 pr-10 text-sm text-[var(--color-text)] outline-none transition focus:border-[var(--color-primary)] focus:ring-2 focus:ring-[color:rgba(0,71,130,0.10)]" onChange={(event) => handleSupplierChange(event.target.value)} value={selectedSupplierId}>
            <option value="">Seleccionar proveedor</option>
            {supplierOptions.map((supplier) => (
              <option key={supplier.id} value={supplier.id}>
                {supplier.name}
              </option>
            ))}
          </select>
          <p className="mt-1 text-xs text-[var(--color-text-muted)]">
            {selectedSupplierId
              ? 'Mostrando solo productos asociados a este proveedor. Si omite el precio unitario, el backend lo resolverá desde la referencia.'
              : 'Seleccione un proveedor para ver sus productos asociados.'}
          </p>
        </div>

        {(isLoadingSuppliers || (isLoadingProducts && selectedSupplierId)) && selectedProducts.length === 0 ? <Loading /> : null}

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
                    <th className="border-b border-[var(--color-border)] px-4 py-3 text-right text-xs font-semibold uppercase tracking-[0.05em] text-[var(--color-text-secondary)]">Precio unit.</th>
                    <th className="border-b border-[var(--color-border)] px-4 py-3 text-center text-xs font-semibold uppercase tracking-[0.05em] text-[var(--color-text-secondary)]"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--color-border)]">
                  {selectedProducts.map((product) => (
                    <tr key={product.id} className="transition-colors hover:bg-[rgba(232,241,250,0.20)]">
                      <td className="px-4 py-3 text-sm text-[var(--color-text)]">
                        <div>{product.name}</div>
                        <div className="mt-1 font-data-mono text-xs text-[var(--color-text-secondary)]">{product.code}</div>
                      </td>
                      <td className={`px-4 py-3 text-right font-data-mono text-sm ${product.stock === 0 ? 'text-[var(--color-danger-text)]' : product.stock <= product.minStock ? 'text-[var(--color-warning-text)]' : 'text-[var(--color-text)]'}`}>{product.stock}</td>
                      <td className="px-4 py-3 text-right">
                        <input className="w-16 rounded border border-[var(--color-border)] px-2 py-1 text-right font-data-mono text-sm outline-none focus:border-[var(--color-primary)] focus:ring-2 focus:ring-[color:rgba(0,71,130,0.10)]" min="1" onChange={(event) => updateSelectedProduct(setSelectedProducts, product.id, { requestedQuantity: Number(event.target.value) || 0 })} type="number" value={product.requestedQuantity} />
                      </td>
                      <td className="px-4 py-3 text-right">
                        <input className="w-24 rounded border border-[var(--color-border)] px-2 py-1 text-right font-data-mono text-sm outline-none focus:border-[var(--color-primary)] focus:ring-2 focus:ring-[color:rgba(0,71,130,0.10)]" min="0" onChange={(event) => updateSelectedProduct(setSelectedProducts, product.id, { unitPrice: event.target.value })} placeholder="Auto" type="number" value={product.unitPrice} />
                      </td>
                      <td className="px-4 py-3 text-center">
                        <button className="text-[var(--color-text-muted)] transition hover:text-[var(--color-danger-text)]" onClick={() => setSelectedProducts((current) => current.filter((item) => item.id !== product.id))} type="button">
                          <X className="mx-auto h-4 w-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                  {selectedProducts.length === 0 ? (
                    <tr>
                      <td className="px-4 py-4 text-sm text-[var(--color-text-secondary)]" colSpan={5}>
                        No hay productos seleccionados.
                      </td>
                    </tr>
                  ) : null}
                </tbody>
              </table>
            </div>
          </Card>
          <div className="mt-3">
            <button className="inline-flex items-center gap-2 px-2 py-1 text-sm font-medium text-[var(--color-primary-strong)] transition hover:text-[var(--color-primary)]" onClick={() => setIsAssociateOpen(true)} type="button">
              <Plus className="h-4 w-4" />
              Añadir producto
            </button>
          </div>
        </div>

        <div>
          <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.05em] text-[var(--color-text-secondary)]">Nota para el proveedor (Opcional)</label>
          <textarea className="min-h-24 w-full resize-none rounded-[var(--radius-control)] border border-[var(--color-border)] bg-white p-3 text-sm text-[var(--color-text)] outline-none transition focus:border-[var(--color-primary)] focus:ring-2 focus:ring-[color:rgba(0,71,130,0.10)]" onChange={(event) => setNote(event.target.value)} placeholder="Escriba aquí instrucciones adicionales..." value={note} />
        </div>

        <div className="rounded-[var(--radius-control)] border border-[var(--color-surface-tint)]/50 bg-[var(--color-surface-tint)] p-4">
          <div className="flex flex-col gap-2 text-sm text-[var(--color-text)] sm:flex-row sm:items-center sm:justify-between">
            <span>Total de líneas: <span className="font-data-mono font-semibold">{selectedProducts.length}</span></span>
            <span>Unidades: <span className="font-data-mono font-semibold">{totalUnits}</span></span>
          </div>
        </div>

        {isAssociateOpen ? (
          <AssociateProductsOverlay
            onAdd={(products) => {
              setSelectedProducts((current) => mergeSelectedProducts(current, products))
              setIsAssociateOpen(false)
            }}
            onClose={() => setIsAssociateOpen(false)}
            products={productOptions}
            selectedProducts={selectedProducts}
          />
        ) : null}
      </div>

      <div className="flex items-center justify-end gap-3 border-t border-[var(--color-border)] bg-[var(--color-surface)] px-6 py-4">
        <Button disabled={createMutation.isPending} onClick={onClose} type="button" variant="ghost">Cancelar</Button>
        <Button disabled={!canManage || createMutation.isPending} onClick={() => handleSubmit('pending')} type="button" variant="secondary">
          {createMutation.isPending && submitMode === 'pending' ? <LoaderCircle className="mr-2 h-4 w-4 animate-spin" /> : null}
          Guardar como pendiente
        </Button>
        <Button disabled={!canManage || createMutation.isPending} onClick={() => handleSubmit('send')} type="button">
          {createMutation.isPending && submitMode === 'send' ? <LoaderCircle className="mr-2 h-4 w-4 animate-spin" /> : <Send className="mr-2 h-4 w-4" />}
          Generar y enviar
        </Button>
      </div>
    </ModalFrame>
  )
}

function AssociateProductsOverlay({
  onAdd,
  onClose,
  products,
  selectedProducts,
}: {
  onAdd: (products: SelectedReplenishmentProduct[]) => void
  onClose: () => void
  products: ProductRow[]
  selectedProducts: SelectedReplenishmentProduct[]
}) {
  const [onlyLowStock, setOnlyLowStock] = useState(true)
  const [query, setQuery] = useState('')
  const [draftSelection, setDraftSelection] = useState<SelectedReplenishmentProduct[]>([])

  const visibleProducts = products.filter((product) => {
    const matchesLowStock = !onlyLowStock || product.stock <= product.minStock
    const normalizedQuery = query.trim().toLowerCase()
    const matchesQuery =
      !normalizedQuery ||
      [product.name, product.code, product.activeIngredient ?? product.activeIngredientLabel].some((value) => value.toLowerCase().includes(normalizedQuery))

    return matchesLowStock && matchesQuery
  })

  return (
    <div className="absolute inset-0 z-10 flex items-center justify-center p-4">
      <div className="absolute inset-0 rounded-[var(--radius-panel)] bg-[#0e1d27]/20 backdrop-blur-[2px]" />
      <div className="relative z-10 flex max-h-[82vh] w-full max-w-[520px] flex-col overflow-hidden rounded-[var(--radius-panel)] border border-[var(--color-border)] bg-[var(--color-surface)] shadow-2xl">
        <div className="flex items-start justify-between border-b border-[var(--color-border)] px-6 py-4">
          <div>
            <h4 className="text-[20px] font-medium leading-tight text-[var(--color-text)]">Añadir productos</h4>
            <p className="mt-1 text-sm text-[var(--color-text-secondary)]">La validación proveedor-producto se resuelve al guardar la solicitud.</p>
          </div>
          <button className="flex h-8 w-8 items-center justify-center rounded-full text-[var(--color-text-muted)] transition hover:bg-[var(--color-page-bg)] hover:text-[var(--color-text-secondary)]" onClick={onClose} type="button">
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="flex flex-col gap-4 border-b border-[var(--color-border)] px-6 py-4">
          <input className="w-full rounded-[var(--radius-control)] border border-[var(--color-border)] bg-white px-4 py-2 text-sm outline-none transition focus:border-[var(--color-primary)] focus:ring-2 focus:ring-[color:rgba(0,71,130,0.10)]" onChange={(event) => setQuery(event.target.value)} placeholder="Buscar por nombre, SKU o principio activo..." type="text" value={query} />
          <div className="flex items-center justify-between">
            <span className="text-sm text-[var(--color-text-secondary)]">Mostrando {visibleProducts.length} productos</span>
            <label className="group flex cursor-pointer items-center gap-2">
              <span className="text-sm text-[var(--color-text)] transition group-hover:text-[var(--color-primary)]">Solo bajo stock</span>
              <button className={`relative inline-flex h-5 w-9 items-center rounded-full transition ${onlyLowStock ? 'bg-[var(--color-primary)]' : 'bg-[var(--color-text-muted)]'}`} onClick={() => setOnlyLowStock((current) => !current)} type="button">
                <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition ${onlyLowStock ? 'translate-x-4' : 'translate-x-1'}`} />
              </button>
            </label>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-2">
          <div className="flex flex-col gap-1">
            {visibleProducts.map((product) => {
              const alreadyAdded = selectedProducts.some((item) => item.productId === product.id)
              const selected = draftSelection.some((item) => item.productId === product.id)
              const suggested = Math.max(product.minStock - product.stock, 1)

              return (
                <button
                  key={product.id}
                  className={`flex items-start gap-3 rounded-lg border p-3 text-left transition-colors ${alreadyAdded ? 'cursor-not-allowed border-transparent bg-[rgba(245,248,251,0.50)] opacity-60' : selected ? 'border-[var(--color-primary)]/30 bg-[var(--color-surface-tint)]' : 'border-transparent hover:bg-[var(--color-page-bg)]'}`}
                  disabled={alreadyAdded}
                  onClick={() =>
                    setDraftSelection((current) =>
                      current.some((item) => item.productId === product.id)
                        ? current.filter((item) => item.productId !== product.id)
                        : [...current, buildSelectedProduct(product, suggested)],
                    )
                  }
                  type="button"
                >
                  <input checked={alreadyAdded || selected} className="mt-0.5 h-4 w-4 rounded border-[var(--color-border)] text-[var(--color-primary)]" disabled={alreadyAdded} readOnly type="checkbox" />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-start justify-between gap-2">
                      <span className="truncate text-sm font-medium text-[var(--color-text)]">{product.name}</span>
                      {alreadyAdded ? <span className="rounded bg-[var(--color-surface-dim)] px-2 py-0.5 text-[12px] text-[var(--color-text-muted)]">Ya añadido</span> : selected ? <div className="flex items-center gap-1 rounded border border-[var(--color-border)] bg-white px-2 py-0.5"><span className="text-[11px] uppercase text-[var(--color-text-secondary)]">Sugerido:</span><span className="font-data-mono text-sm text-[var(--color-primary)]">{suggested}</span></div> : null}
                    </div>
                    <div className="mt-1 flex flex-wrap items-center gap-2 font-data-mono text-xs text-[var(--color-text-secondary)]">
                      <span>{product.code}</span>
                      <span className="h-1 w-1 rounded-full bg-[var(--color-outline-variant,#c2c6d2)]" />
                      <span className={product.stock === 0 ? 'text-[var(--color-danger-text)]' : product.stock <= product.minStock ? 'text-[var(--color-warning-text)]' : 'text-[var(--color-success-text)]'}>Stock: {product.stock}</span>
                      <span className="h-1 w-1 rounded-full bg-[var(--color-outline-variant,#c2c6d2)]" />
                      <span>Mín: {product.minStock}</span>
                    </div>
                  </div>
                </button>
              )
            })}
          </div>
        </div>

        <div className="flex items-center justify-between border-t border-[var(--color-border)] bg-[var(--color-surface)] px-6 py-4">
          <span className="text-sm font-medium text-[var(--color-text-secondary)]">{draftSelection.length} productos seleccionados</span>
          <div className="flex gap-3">
            <Button onClick={onClose} type="button" variant="ghost">Cancelar</Button>
            <Button onClick={() => onAdd(draftSelection)} type="button">Añadir ({draftSelection.length})</Button>
          </div>
        </div>
      </div>
    </div>
  )
}

function ReplenishmentDetailModal({
  onClose,
  onOpenModal,
  request,
}: {
  onClose: () => void
  onOpenModal: (modalType: ReplenishmentModalType, request: ReplenishmentRow | null) => void
  request: ReplenishmentRow
}) {
  const user = useAuthStore((state) => state.user)
  const canManage = hasPermission(user?.role, 'manage:replenishment')
  const detailQuery = useReplenishmentRequest(request.id)

  if (detailQuery.isLoading) {
    return (
      <ModalFrame maxWidth="max-w-[720px]" onClose={onClose} title="Detalle de reposición">
        <div className="p-6">
          <Loading />
        </div>
      </ModalFrame>
    )
  }

  if (detailQuery.isError || !detailQuery.data) {
    return (
      <ModalFrame maxWidth="max-w-[720px]" onClose={onClose} title="Detalle de reposición">
        <div className="p-6 text-sm text-[var(--color-danger-text)]">No fue posible cargar el detalle real de la solicitud.</div>
      </ModalFrame>
    )
  }

  const details = toReplenishmentDetail(detailQuery.data)
  const canChange = canManage && canChangeStatus(details.rawStatus)

  return (
    <ModalFrame maxWidth="max-w-[720px]" onClose={onClose} title={`Solicitud ${formatRequestCode(details.id)}`}>
      <div className="flex-1 overflow-y-auto p-6 flex flex-col gap-6">
        <div className="flex items-start justify-between gap-4">
          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-3">
              <h4 className="font-data-mono text-[20px] font-semibold text-[var(--color-text)]">Solicitud {formatRequestCode(details.id)}</h4>
              <StatusTag status={details.status} />
            </div>
            <div className="flex items-center gap-2 text-sm text-[var(--color-text-secondary)]">
              <span>{details.supplier}</span>
              <div className="h-1 w-1 rounded-full bg-[var(--color-text-muted)]" />
              <div className="flex items-center gap-1 rounded-[4px] bg-[#E1F5EE] px-1.5 py-0.5 text-[#0F6E56]">
                <MessageCircle className="h-3.5 w-3.5" />
                <span className="font-data-mono text-xs">WhatsApp</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-1 text-[var(--color-text-secondary)]">
            <button className="rounded-[8px] p-2 transition hover:bg-[var(--color-page-bg)]" onClick={onClose} type="button">
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 rounded-[8px] border border-[var(--color-border)] bg-[var(--color-page-bg)] p-4 sm:grid-cols-2">
          <MetadataItem label="Creada por" value={`${details.requestedBy} · ${formatDate(details.requestedAt)}`} />
          <MetadataItem label="Enviada" value={details.sentAt ? `${formatDate(details.sentAt)} · por WhatsApp` : 'No enviada'} />
          <MetadataItem label="Recibida" value={details.receivedAt ? formatDate(details.receivedAt) : '—'} />
          <MetadataItem label="Notas" value={details.notes || 'Sin notas'} />
        </div>

        <div className="flex flex-col gap-3">
          <h5 className="text-[20px] font-semibold text-[var(--color-text)]">Productos solicitados</h5>
          <div className="overflow-hidden rounded-[8px] border border-[var(--color-border)]">
            <table className="min-w-full border-collapse text-left">
              <thead className="bg-[var(--color-page-bg)] border-b border-[var(--color-border)]">
                <tr>
                  <th className="px-3 py-2 text-xs font-semibold uppercase tracking-[0.05em] text-[var(--color-text-secondary)]">Producto</th>
                  <th className="px-3 py-2 text-right text-xs font-semibold uppercase tracking-[0.05em] text-[var(--color-text-secondary)]">Cantidad</th>
                  <th className="px-3 py-2 text-right text-xs font-semibold uppercase tracking-[0.05em] text-[var(--color-text-secondary)]">Precio unitario</th>
                  <th className="px-3 py-2 text-right text-xs font-semibold uppercase tracking-[0.05em] text-[var(--color-text-secondary)]">Subtotal</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--color-border)] text-sm">
                {details.items.map((item) => (
                  <tr key={item.id} className="transition-colors hover:bg-[var(--color-page-bg)]">
                    <td className="px-3 py-2 text-[var(--color-text)]">
                      <div>{item.name}</div>
                      <div className="mt-1 font-data-mono text-xs text-[var(--color-text-secondary)]">{item.code}</div>
                    </td>
                    <td className="px-3 py-2 text-right font-data-mono text-[var(--color-text)]">{item.requestedQuantity}</td>
                    <td className="px-3 py-2 text-right font-data-mono text-[var(--color-text-secondary)]">{item.unitPrice != null ? formatCurrency(item.unitPrice) : '–'}</td>
                    <td className="px-3 py-2 text-right font-data-mono text-[var(--color-text)]">{item.subtotal != null ? formatCurrency(item.subtotal) : '–'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div className="bg-[var(--color-page-bg)] p-3 border-t border-[var(--color-border)] flex flex-col items-end gap-1">
              <div className="flex gap-4 font-data-mono text-sm text-[var(--color-text)]">
                <span>Total estimado:</span>
                <span>{formatCurrency(details.items.reduce((acc, item) => acc + (item.subtotal ?? 0), 0))}</span>
              </div>
              <span className="text-[11px] text-[var(--color-text-muted)]">Precios registrados al momento de la solicitud</span>
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-3">
          <h5 className="text-[20px] font-semibold text-[var(--color-text)]">Historial de estados</h5>
          <div className="ml-2 border-l-2 border-[var(--color-border)] pl-4 flex flex-col gap-4 py-2">
            <TimelineItem active label="Pendiente" meta={`${details.requestedBy} · ${shortDate(details.requestedAt)}`} />
            <TimelineItem active={details.rawStatus !== 'PENDING'} label="Enviada" meta={details.sentAt ? shortDate(details.sentAt) : 'pendiente'} primary={details.rawStatus !== 'PENDING'} />
            <TimelineItem active={details.rawStatus === 'RECEIVED'} label="Recibida" meta={details.receivedAt ? shortDate(details.receivedAt) : 'pendiente'} success={details.rawStatus === 'RECEIVED'} />
            <TimelineItem active={details.rawStatus === 'CANCELLED'} cancel label="Cancelada" meta={details.rawStatus === 'CANCELLED' ? 'cerrada' : 'pendiente'} />
          </div>
        </div>
      </div>

      <div className="flex flex-col gap-3 border-t border-[var(--color-border)] bg-[var(--color-page-bg)] p-6 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap items-center gap-3">
          {canChange ? (
            <button className="inline-flex items-center gap-2 rounded-[8px] border border-transparent px-3 py-2 text-sm text-[var(--color-text-secondary)] transition hover:border-[var(--color-outline-variant,#c2c6d2)] hover:bg-[var(--color-surface-variant)]" onClick={() => onOpenModal('change-status', request)} type="button">
              Cambiar estado
            </button>
          ) : null}
        </div>
        {canManage && details.rawStatus === 'SENT' ? <Button onClick={() => onOpenModal('change-status', request)} type="button">Confirmar recepción</Button> : null}
      </div>
    </ModalFrame>
  )
}

function ChangeStatusModal({ onClose, request }: { onClose: () => void; request: ReplenishmentRow }) {
  const user = useAuthStore((state) => state.user)
  const canManage = hasPermission(user?.role, 'manage:replenishment')
  const queryClient = useQueryClient()
  const detailQuery = useReplenishmentRequest(request.id)
  const [selectedAction, setSelectedAction] = useState<StatusAction>(request.rawStatus === 'PENDING' ? 'send' : 'receive')
  const [receivedQuantities, setReceivedQuantities] = useState<Record<string, number>>({})

  const sendMutation = useMutation({
    mutationFn: () => sendReplenishmentRequest(request.id),
    onSuccess: async (updated) => {
      await invalidateReplenishmentQueries(queryClient, updated.id, true)
      toast.success('Solicitud enviada correctamente')
      onClose()
    },
    onError: (error: unknown) => {
      toast.error(getReplenishmentErrorMessage(error, 'send'))
    },
  })

  const cancelMutation = useMutation({
    mutationFn: () => cancelReplenishmentRequest(request.id),
    onSuccess: async (updated) => {
      await invalidateReplenishmentQueries(queryClient, updated.id, true)
      toast.success('Solicitud cancelada correctamente')
      onClose()
    },
    onError: (error: unknown) => {
      toast.error(getReplenishmentErrorMessage(error, 'cancel'))
    },
  })

  const receiveMutation = useMutation({
    mutationFn: (input: ReceiveReplenishmentRequestInput) => receiveReplenishmentRequest(request.id, input),
    onSuccess: async (updated) => {
      await invalidateReplenishmentReceiveQueries(queryClient, updated.id)
      toast.success('Recepción confirmada correctamente')
      onClose()
    },
    onError: (error: unknown) => {
      toast.error(getReplenishmentErrorMessage(error, 'receive'))
    },
  })

  if (detailQuery.isLoading) {
    return (
      <ModalFrame maxWidth="max-w-[460px]" onClose={onClose} title="Cambiar estado">
        <div className="p-6">
          <Loading />
        </div>
      </ModalFrame>
    )
  }

  if (detailQuery.isError || !detailQuery.data) {
    return (
      <ModalFrame maxWidth="max-w-[460px]" onClose={onClose} title="Cambiar estado">
        <div className="p-6 text-sm text-[var(--color-danger-text)]">No fue posible cargar la solicitud real.</div>
      </ModalFrame>
    )
  }

  const details = toReplenishmentDetail(detailQuery.data)
  const availableActions = getAvailableActions(details.rawStatus)

  if (!canManage || availableActions.length === 0) {
    return null
  }

  const isPending = sendMutation.isPending || cancelMutation.isPending || receiveMutation.isPending

  return (
    <ModalFrame maxWidth="max-w-[460px]" onClose={onClose} title="Cambiar estado">
      <div className="p-6 flex flex-col gap-6">
        <div>
          <div className="mb-4 flex items-center gap-3">
            <span className="text-sm text-[var(--color-text-secondary)]">Estado actual:</span>
            <StatusTag status={details.status} />
          </div>

          <div className="mt-2 flex items-center justify-between relative before:absolute before:left-4 before:right-[30%] before:top-1/2 before:h-[2px] before:-translate-y-1/2 before:bg-[var(--color-border)] before:content-['']">
            <StepperStatusNode active label="Pendiente" />
            <StepperStatusNode active={details.rawStatus !== 'PENDING'} label="Enviada" primary={details.rawStatus !== 'PENDING'} />
            <StepperStatusNode active={details.rawStatus === 'RECEIVED' || selectedAction === 'receive'} label="Recibida" success={details.rawStatus === 'RECEIVED' || selectedAction === 'receive'} />
            <div className="mx-2 hidden h-6 border-l border-[var(--color-border)] sm:block" />
            <StepperStatusNode active={details.rawStatus === 'CANCELLED' || selectedAction === 'cancel'} cancel label="Cancelada" />
          </div>
        </div>

        <div className="flex flex-col gap-2">
          <label className="mb-1 text-xs font-semibold uppercase tracking-[0.05em] text-[var(--color-text-secondary)]">Nuevo Estado</label>
          <div className="grid grid-cols-2 gap-3">
            {availableActions.includes('send') ? <StatusOption checked={selectedAction === 'send'} label="Enviada" onClick={() => setSelectedAction('send')} /> : null}
            {availableActions.includes('receive') ? <StatusOption checked={selectedAction === 'receive'} label="Recibida" success onClick={() => setSelectedAction('receive')} /> : null}
            {availableActions.includes('cancel') ? <StatusOption checked={selectedAction === 'cancel'} danger label="Cancelada" onClick={() => setSelectedAction('cancel')} /> : null}
          </div>
        </div>

        {selectedAction === 'receive' ? (
          <>
            <div className="flex flex-col gap-3">
              <label className="text-xs font-semibold uppercase tracking-[0.05em] text-[var(--color-text-secondary)]">Productos recibidos</label>
              <div className="overflow-hidden rounded-lg border border-[var(--color-border)]">
                <div className="flex items-center justify-between border-b border-[var(--color-border)] bg-[rgba(213,229,242,0.30)] p-3">
                  <span className="text-sm text-[var(--color-text-secondary)]">Producto</span>
                  <span className="text-sm text-[var(--color-text-secondary)]">Cant. Recibida</span>
                </div>
                {details.items.map((item) => (
                  <div key={item.id} className="flex items-center justify-between border-b border-[var(--color-border)] p-3 last:border-b-0">
                    <span className="text-sm text-[var(--color-text)]">{item.name}</span>
                    <input className="w-20 rounded border border-[var(--color-border)] p-1 text-right font-data-mono text-sm outline-none focus:border-[var(--color-primary)] focus:ring-1 focus:ring-[var(--color-primary)]" min="0" onChange={(event) => setReceivedQuantities((current) => ({ ...current, [item.id]: Number(event.target.value) || 0 }))} type="number" value={receivedQuantities[item.id] ?? item.receivedQuantity} />
                  </div>
                ))}
              </div>
            </div>
          </>
        ) : null}

        {selectedAction === 'cancel' ? (
          <div className="flex items-start gap-2 rounded border border-[var(--color-danger-bg)] bg-[rgba(251,231,228,0.40)] p-3">
            <AlertTriangle className="mt-0.5 h-4 w-4 text-[var(--color-danger-text)]" />
            <p className="text-sm text-[var(--color-danger-text)]">La solicitud se cerrará y <strong>no afectará el inventario</strong>. Esta acción no se puede deshacer.</p>
          </div>
        ) : null}
      </div>

      <div className="flex items-center justify-end gap-3 border-t border-[var(--color-border)] bg-[var(--color-surface-container-lowest,#ffffff)] p-4">
        <Button disabled={isPending} onClick={onClose} type="button" variant="secondary">Cancelar</Button>
        <button
          className={`inline-flex min-h-10 items-center justify-center rounded-[var(--radius-control)] px-4 py-2 text-sm font-semibold text-white transition ${selectedAction === 'cancel' ? 'bg-[var(--color-danger-text)] hover:opacity-90' : 'bg-[var(--color-primary)] hover:opacity-90'} disabled:cursor-not-allowed disabled:opacity-70`}
          disabled={isPending}
          onClick={() => {
            if (selectedAction === 'send') {
              sendMutation.mutate()
              return
            }

            if (selectedAction === 'cancel') {
              cancelMutation.mutate()
              return
            }

            const validationError = validateReceivedQuantities(details, receivedQuantities)

            if (validationError) {
              toast.error(validationError)
              return
            }

            receiveMutation.mutate({
              items: details.items.map((item) => ({
                id: item.id,
                receivedQuantity: receivedQuantities[item.id] ?? item.receivedQuantity,
              })),
            })
          }}
          type="button"
        >
          {isPending ? <LoaderCircle className="mr-2 h-4 w-4 animate-spin" /> : null}
          {selectedAction === 'cancel' ? 'Cancelar solicitud' : selectedAction === 'receive' ? 'Confirmar recepción' : 'Marcar como enviada'}
        </button>
      </div>
    </ModalFrame>
  )
}

function MetadataItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col gap-1">
      <span className="text-xs font-semibold uppercase tracking-[0.05em] text-[var(--color-text-secondary)]">{label}</span>
      <div className="text-sm text-[var(--color-text)]">{value}</div>
    </div>
  )
}

function StepperStatusNode({ active, label, primary = false, success = false, cancel = false }: { active: boolean; label: string; primary?: boolean; success?: boolean; cancel?: boolean }) {
  const dotClass = cancel
    ? 'bg-[var(--color-danger-bg)] border border-[var(--color-danger-text)]'
    : primary
      ? 'bg-[var(--color-primary)]'
      : success
        ? 'bg-[var(--color-success-text)]'
        : 'bg-[var(--color-border)]'

  const labelClass = cancel
    ? 'text-[var(--color-danger-text)]'
    : primary
      ? 'text-[var(--color-primary)]'
      : success
        ? 'text-[var(--color-success-text)]'
        : 'text-[var(--color-text-muted)]'

  return (
    <div className={`relative z-10 flex flex-col items-center gap-2 ${!active && !primary && !success && !cancel ? 'opacity-70' : ''}`}>
      <div className={`h-3 w-3 rounded-full outline outline-4 outline-white ${dotClass}`} />
      <span className={`text-[11px] ${primary || success || cancel || active ? 'font-medium' : ''} ${labelClass}`}>{label}</span>
    </div>
  )
}

function TimelineItem({ active, label, meta, primary = false, success = false, cancel = false }: { active: boolean; label: string; meta: string; primary?: boolean; success?: boolean; cancel?: boolean }) {
  const dotClass = cancel
    ? 'bg-[var(--color-danger-bg)] border border-[var(--color-danger-text)]'
    : primary
      ? 'bg-[var(--color-primary)]'
      : success
        ? 'bg-[var(--color-success-text)]'
        : active
          ? 'bg-[var(--color-text-secondary)]'
          : 'bg-[var(--color-border)]'
  const labelClass = cancel
    ? 'text-[var(--color-danger-text)]'
    : primary
      ? 'text-[var(--color-primary)]'
      : success
        ? 'text-[var(--color-success-text)]'
        : active
          ? 'text-[var(--color-text-secondary)]'
          : 'text-[var(--color-text-muted)]'

  return (
    <div className={`relative flex items-start gap-4 ${!active && !primary && !success && !cancel ? 'opacity-50' : ''}`}>
      <div className={`absolute -left-[23px] top-1 h-3 w-3 rounded-full border-2 border-white ${dotClass}`} />
      <div className="flex flex-col">
        <div className="flex items-center gap-2">
          <span className={`text-xs font-semibold uppercase tracking-[0.05em] ${labelClass}`}>{label}</span>
          <span className="text-[var(--color-text-muted)]">·</span>
          <span className="font-data-mono text-xs text-[var(--color-text-secondary)]">{meta}</span>
        </div>
      </div>
    </div>
  )
}

function StatusOption({ checked, label, onClick, success = false, danger = false }: { checked: boolean; label: string; onClick: () => void; success?: boolean; danger?: boolean }) {
  const activeClass = success
    ? 'border-[var(--color-success-text)]/30 bg-[rgba(226,244,238,0.40)]'
    : danger
      ? 'border-[var(--color-danger-text)]/30 bg-[rgba(251,231,228,0.20)]'
      : 'border-[var(--color-primary)]/30 bg-[rgba(232,241,250,0.50)]'

  return (
    <button className={`flex items-center gap-3 rounded-lg border p-3 text-left transition-colors ${checked ? activeClass : 'border-[var(--color-border)] hover:bg-[rgba(213,229,242,0.30)]'}`} onClick={onClick} type="button">
      {checked ? <CircleDot className={`h-4 w-4 ${success ? 'text-[var(--color-success-text)]' : danger ? 'text-[var(--color-danger-text)]' : 'text-[var(--color-primary)]'}`} /> : <Circle className="h-4 w-4 text-[var(--color-text-muted)]" />}
      <span className="text-sm text-[var(--color-text)]">{label}</span>
    </button>
  )
}

function StatusTag({ status }: { status: string }) {
  if (status === 'Pendiente') {
    return <span className="inline-flex items-center rounded-[4px] bg-[var(--color-surface-container)] px-2 py-1 text-xs font-semibold uppercase tracking-[0.05em] text-[var(--color-text-secondary)]">Pendiente</span>
  }
  if (status === 'Enviada') {
    return <span className="inline-flex items-center rounded-[4px] bg-[var(--color-surface-tint)] px-2 py-1 text-xs font-semibold uppercase tracking-[0.05em] text-[var(--color-primary)]">Enviada</span>
  }
  if (status === 'Recibida') {
    return <span className="inline-flex items-center rounded-[4px] bg-[var(--color-success-bg)] px-2 py-1 text-xs font-semibold uppercase tracking-[0.05em] text-[var(--color-success-text)]">Recibida</span>
  }
  return <span className="inline-flex items-center rounded-[4px] bg-[var(--color-danger-bg)] px-2 py-1 text-xs font-semibold uppercase tracking-[0.05em] text-[var(--color-danger-text)]">Cancelada</span>
}

type SelectedReplenishmentProduct = {
  id: string
  productId: string
  name: string
  code: string
  requestedQuantity: number
  stock: number
  minStock: number
  unitPrice: string
}

type StatusAction = 'cancel' | 'receive' | 'send'

function buildSelectedProduct(product: ProductRow, quantity?: number): SelectedReplenishmentProduct {
  return {
    id: `${product.id}-selected`,
    productId: product.id,
    name: product.name,
    code: product.code,
    requestedQuantity: quantity ?? Math.max(product.minStock - product.stock, 1),
    stock: product.stock,
    minStock: product.minStock,
    unitPrice: '',
  }
}

function mergeSelectedProducts(current: SelectedReplenishmentProduct[], incoming: SelectedReplenishmentProduct[]) {
  const currentIds = new Set(current.map((item) => item.productId))
  return [...current, ...incoming.filter((item) => !currentIds.has(item.productId))]
}

function updateSelectedProduct(
  setSelectedProducts: React.Dispatch<React.SetStateAction<SelectedReplenishmentProduct[]>>,
  id: string,
  patch: Partial<SelectedReplenishmentProduct>,
) {
  setSelectedProducts((current) => current.map((item) => (item.id === id ? { ...item, ...patch } : item)))
}

function toCreateReplenishmentInput(
  supplierId: string,
  note: string,
  selectedProducts: SelectedReplenishmentProduct[],
): CreateReplenishmentRequestInput {
  return {
    supplierId,
    notes: note.trim() || undefined,
    items: selectedProducts.map((product) => ({
      productId: product.productId,
      requestedQuantity: product.requestedQuantity,
      unitPrice: product.unitPrice.trim() ? Number(product.unitPrice) : undefined,
    })),
  }
}

function validateCreateReplenishment(supplierId: string, selectedProducts: SelectedReplenishmentProduct[]) {
  if (!supplierId) {
    return 'Seleccione un proveedor válido'
  }

  if (selectedProducts.length === 0) {
    return 'Debe seleccionar al menos un producto'
  }

  for (const product of selectedProducts) {
    if (product.requestedQuantity <= 0) {
      return `La cantidad solicitada para ${product.name} debe ser mayor que cero`
    }

    if (product.unitPrice.trim() && Number(product.unitPrice) <= 0) {
      return `El precio unitario de ${product.name} debe ser mayor que cero`
    }
  }

  return null
}

function validateReceivedQuantities(details: ReplenishmentDetail, receivedQuantities: Record<string, number>) {
  for (const item of details.items) {
    const quantity = receivedQuantities[item.id] ?? item.receivedQuantity

    if (quantity < 0) {
      return `La cantidad recibida de ${item.name} no puede ser negativa`
    }
  }

  return null
}

function getAvailableActions(status: ReplenishmentStatus): StatusAction[] {
  if (status === 'PENDING') {
    return ['send', 'cancel']
  }

  if (status === 'SENT') {
    return ['receive', 'cancel']
  }

  return []
}

function canChangeStatus(status: ReplenishmentStatus) {
  return getAvailableActions(status).length > 0
}

async function invalidateReplenishmentQueries(
  queryClient: ReturnType<typeof useQueryClient>,
  requestId?: string,
  includeSuppliers = false,
) {
  const invalidations: Array<Promise<unknown>> = [
    queryClient.invalidateQueries({ queryKey: queryKeys.replenishmentRequests.all }),
  ]

  if (includeSuppliers) {
    invalidations.push(queryClient.invalidateQueries({ queryKey: queryKeys.suppliers.all }))
  }

  if (requestId) {
    invalidations.push(queryClient.invalidateQueries({ queryKey: queryKeys.replenishmentRequests.detail(requestId) }))
  }

  await Promise.all(invalidations)
}

async function invalidateReplenishmentReceiveQueries(queryClient: ReturnType<typeof useQueryClient>, requestId: string) {
  const invalidations = receiveReplenishmentInvalidationKeys.map((queryKey) => queryClient.invalidateQueries({ queryKey }))

  invalidations.push(queryClient.invalidateQueries({ queryKey: queryKeys.replenishmentRequests.detail(requestId) }))

  await Promise.all(invalidations)
}

function getReplenishmentErrorMessage(error: unknown, action: 'cancel' | 'create' | 'receive' | 'send') {
  if (!isAxiosError<ApiErrorEnvelope>(error)) {
    return 'No fue posible completar la operación de reposición'
  }

  const message = error.response?.data.message?.trim()
  const code = error.response?.data.error?.toUpperCase() ?? ''

  if (message) {
    return message
  }

  if (code.includes('UNIT_PRICE_REQUIRED')) {
    return 'Debe indicar el precio unitario o configurar una referencia para ese proveedor'
  }

  if (code.includes('INVALID_STATE_TRANSITION')) {
    return 'La solicitud ya no está en un estado válido para esa acción'
  }

  if (action === 'send') {
    return 'No fue posible enviar la solicitud'
  }

  if (action === 'receive') {
    return 'No fue posible confirmar la recepción'
  }

  if (action === 'cancel') {
    return 'No fue posible cancelar la solicitud'
  }

  return 'No fue posible crear la solicitud'
}

function shortDate(value: string) {
  const date = new Date(value)
  return `${String(date.getDate()).padStart(2, '0')}/${String(date.getMonth() + 1).padStart(2, '0')} ${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`
}

function formatRequestCode(id: string) {
  return `R-${id}`
}
