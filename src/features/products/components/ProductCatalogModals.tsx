import { useMutation, useQueryClient } from '@tanstack/react-query'
import { isAxiosError } from 'axios'
import type { TFunction } from 'i18next'
import {
  ArrowDown,
  ArrowLeftRight,
  ArrowUp,
  CircleAlert,
  Info,
  LoaderCircle,
  Package2,
  Pill,
  Plus,
  SquarePen,
  Trash2,
  TriangleAlert,
  X,
} from 'lucide-react'
import { useEffect, useState, type ReactNode } from 'react'
import toast from 'react-hot-toast'
import { Trans, useTranslation } from 'react-i18next'

import { Button } from '@/components/ui/Button'
import { canCreateMovementType, canManageProducts, hasPermission } from '@/features/auth/lib/permissions'
import { useCategories } from '@/features/categories/api/useCategories'
import { useCreateInventoryMovement, useProductInventoryMovements } from '@/features/inventory-movements/api/useInventoryMovements'
import {
  attachProductSupplier,
  createProduct,
  deleteProduct,
  detachProductSupplier,
  updateProduct,
  type CreateProductInput,
  type UpdateProductInput,
} from '@/features/products/api/products.api'
import { useProductDetail } from '@/features/products/api/useProducts'
import { getStockStatusLabel, type StockStatus } from '@/lib/stockStatus'
import type { ProductRow } from '@/features/products/lib/productRows'
import { GenerateReplenishmentModal } from '@/features/replenishment/components/ReplenishmentModals'
import { useSuppliers } from '@/features/suppliers/api/useSuppliers'
import { queryKeys } from '@/lib/queryKeys'
import { formatCurrency, formatDate } from '@/lib/utils'
import type {
  ApiErrorEnvelope,
  InventoryMovement,
  ProductDetail,
  ProductUnit,
  UserRole,
} from '@/types/api.types'

type ProductsTFunction = TFunction<['products', 'common']>

export type ProductModalType = 'create' | 'detail' | 'edit' | 'movement' | 'replenishment' | 'deactivate'

interface ProductCatalogModalsProps {
  modalType: ProductModalType | null
  product: ProductRow | null
  onClose: () => void
  onOpenModal: (modalType: ProductModalType, product: ProductRow | null) => void
  role: UserRole | undefined
}

interface ProductFormValues {
  code: string
  name: string
  activeIngredient: string
  description: string
  presentation: string
  brand: string
  unit: ProductUnit
  unitContent: string
  categoryId: string
  stock: string
  minStock: string
  price: string
  supplierId: string
}

type MovementType = 'IN' | 'OUT' | 'ADJUSTMENT'

const MOVEMENT_REASON_KEYS: Record<MovementType, readonly string[]> = {
  IN: ['supplierReceipt', 'customerReturn', 'inventoryAdjustmentIncrease'],
  OUT: ['counterDispensing', 'lossOrExpiration', 'transferToOtherSite'],
  ADJUSTMENT: ['physicalCount', 'manualCorrection', 'internalAudit'],
}

// Stable, locale-independent values persisted to the backend. Display labels are
// resolved separately via t() so the stored audit trail never changes meaning
// depending on which UI language was active when the movement was submitted
// (same key/label split established in src/features/inventory/components/InventoryModals.tsx).
const MOVEMENT_REASON_BACKEND_VALUES: Record<MovementType, Record<string, string>> = {
  IN: {
    supplierReceipt: 'Recepcion de proveedor',
    customerReturn: 'Devolucion de cliente',
    inventoryAdjustmentIncrease: 'Ajuste de inventario (+)',
  },
  OUT: {
    counterDispensing: 'Dispensacion en ventanilla',
    lossOrExpiration: 'Merma o vencimiento',
    transferToOtherSite: 'Traslado a otra sede',
  },
  ADJUSTMENT: {
    physicalCount: 'Conteo fisico',
    manualCorrection: 'Correccion manual',
    internalAudit: 'Auditoria interna',
  },
}

function getUnitOptions(t: ProductsTFunction): Array<{ label: string; value: ProductUnit }> {
  return [
    { label: t('products:units.UNIT'), value: 'UNIT' },
    { label: t('products:units.MG'), value: 'MG' },
    { label: t('products:units.G'), value: 'G' },
    { label: t('products:units.KG'), value: 'KG' },
    { label: t('products:units.ML'), value: 'ML' },
    { label: t('products:units.L'), value: 'L' },
  ]
}

export function ProductCatalogModals({ modalType, product, onClose, onOpenModal, role }: ProductCatalogModalsProps) {
  if (!modalType) {
    return null
  }

  if (modalType === 'create') {
    if (!canManageProducts(role)) {
      return null
    }

    return <NewProductModal onClose={onClose} />
  }

  if (!product) {
    return null
  }

  if (modalType === 'detail') {
    return <ProductDetailModal onClose={onClose} onOpenModal={onOpenModal} product={product} role={role} />
  }

  if (modalType === 'edit') {
    if (!canManageProducts(role)) {
      return null
    }

    return <EditProductModal onClose={onClose} product={product} />
  }

  if (modalType === 'movement') {
    if (!canCreateMovementType(role, 'OUT')) {
      return null
    }

    return <RegisterMovementModal onClose={onClose} product={product} role={role} />
  }

  if (modalType === 'replenishment') {
    if (!hasPermission(role, 'manage:replenishment')) {
      return null
    }

    return <ReplenishmentModal onClose={onClose} product={product} />
  }

  if (!canManageProducts(role)) {
    return null
  }

  return <DeactivateProductModal onClose={onClose} product={product} />
}

function NewProductModal({ onClose }: { onClose: () => void }) {
  const { t } = useTranslation(['products', 'common'])
  const queryClient = useQueryClient()
  const { data: categoriesResponse } = useCategories({ limit: 100 })
  const { data: suppliersResponse } = useSuppliers({ limit: 100, active: true })
  const [values, setValues] = useState<ProductFormValues>({
    code: '',
    name: '',
    activeIngredient: '',
    description: '',
    presentation: '',
    brand: '',
    unit: 'UNIT',
    unitContent: '',
    categoryId: '',
    stock: '0',
    minStock: '0',
    price: '',
    supplierId: '',
  })

  const createMutation = useMutation({
    mutationFn: async () => {
      const createdProduct = await createProduct(toCreateProductInput(values))

      if (values.supplierId) {
        await attachProductSupplier(createdProduct.id, { supplierId: values.supplierId })
      }
    },
    onSuccess: async () => {
      await invalidateProductCollections(queryClient)
      toast.success(t('products:toasts.productCreated'))
      onClose()
    },
    onError: (error: unknown) => {
      toast.error(getProductErrorMessage(error, 'create', t))
    },
  })

  const handleSubmit = () => {
    const validationError = validateProductForm(values, { requireStock: true }, t)

    if (validationError) {
      toast.error(validationError)
      return
    }

    createMutation.mutate()
  }

  return (
    <ModalFrame maxWidth="max-w-[620px]" onClose={onClose} title={t('products:modals.new.title')}>
      <div className="flex-1 space-y-6 overflow-y-auto px-5 py-5 sm:px-6">
        <ProductIdentitySection showError={!values.name.trim()} values={values} onChange={setValues} />

        <ProductCommercialSection
          categories={categoriesResponse?.data ?? []}
          suppliers={suppliersResponse?.data ?? []}
          values={values}
          onChange={setValues}
        />

        <div className="border-t border-[var(--color-border)] pt-6">
          <div className="space-y-4">
            <h4 className="text-sm font-semibold text-[var(--color-text)]">{t('products:modals.new.inventorySectionHeading')}</h4>
            <div className="grid gap-4 sm:grid-cols-2">
              <FieldGroup label={t('products:modals.new.fields.initialStock.label')}>
                <NumberField onChange={(value) => setValues((current) => ({ ...current, stock: value }))} placeholder={t('products:modals.new.fields.initialStock.placeholder')} value={values.stock} />
              </FieldGroup>
              <FieldGroup label={t('products:modals.new.fields.minStock.label')}>
                <NumberField onChange={(value) => setValues((current) => ({ ...current, minStock: value }))} placeholder={t('products:modals.new.fields.minStock.placeholder')} value={values.minStock} />
              </FieldGroup>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <FieldGroup label={t('products:modals.new.fields.unit.label')}>
                <SelectField
                  onChange={(value) => setValues((current) => ({ ...current, unit: value as ProductUnit }))}
                  options={getUnitOptions(t)}
                  placeholder={t('products:placeholders.select')}
                  value={values.unit}
                />
              </FieldGroup>
              <FieldGroup label={t('products:modals.new.fields.unitContent.label')}>
                <TextField mono onChange={(value) => setValues((current) => ({ ...current, unitContent: value }))} placeholder={t('products:modals.new.fields.unitContent.placeholder')} value={values.unitContent} />
              </FieldGroup>
            </div>
            <FieldGroup label={t('products:modals.new.fields.description.label')}>
              <TextAreaField onChange={(value) => setValues((current) => ({ ...current, description: value }))} placeholder={t('products:modals.new.fields.description.placeholder')} value={values.description} />
            </FieldGroup>
          </div>
        </div>
      </div>

      <ModalFooter
        cancelLabel={t('products:modals.new.cancelButton')}
        isPending={createMutation.isPending}
        onClose={onClose}
        onConfirm={handleSubmit}
        primaryLabel={t('products:modals.new.submitButton')}
      />
    </ModalFrame>
  )
}

function ProductDetailModal({
  onClose,
  onOpenModal,
  product,
  role,
}: {
  onClose: () => void
  onOpenModal: (modalType: ProductModalType, product: ProductRow | null) => void
  product: ProductRow
  role: UserRole | undefined
}) {
  const { t } = useTranslation(['products', 'common'])
  const canManage = canManageProducts(role)
  const canOpenMovement = canCreateMovementType(role, 'OUT')
  const canUseReplenishment = hasPermission(role, 'manage:replenishment')
  const detailQuery = useProductDetail(product.id)
  const movementsQuery = useProductInventoryMovements(product.id, { limit: 3 })
  const movementHistory = movementsQuery.data?.data ?? []

  if (detailQuery.isLoading) {
    return (
      <ModalFrame maxWidth="max-w-[620px]" onClose={onClose} title={t('products:modals.detail.title')}>
        <LoadingState label={t('products:modals.detail.loadingLabel')} />
      </ModalFrame>
    )
  }

  if (detailQuery.isError || !detailQuery.data) {
    return (
      <ModalFrame maxWidth="max-w-[620px]" onClose={onClose} title={t('products:modals.detail.title')}>
        <InlineError label={t('products:modals.detail.loadErrorLabel')} />
      </ModalFrame>
    )
  }

  const detail = detailQuery.data
  const supplierNames = detail.suppliers.map((entry) => entry.supplier.name)
  const noCategoryLabel = t('products:fallback.noCategory')

  return (
    <ModalFrame maxWidth="max-w-[620px]" onClose={onClose} title={t('products:modals.detail.title')}>
      <div className="flex-1 space-y-6 overflow-y-auto px-5 py-5 sm:px-6">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h4 className="text-lg font-medium text-[var(--color-text)]">{detail.name}</h4>
            <span className="rounded-[4px] bg-[var(--color-surface-tint)] px-2 py-0.5 text-xs font-semibold uppercase tracking-[0.05em] text-[var(--color-primary)]">
              {detail.category?.name ?? noCategoryLabel}
            </span>
            <span className={`rounded-[4px] px-2 py-0.5 text-xs font-semibold uppercase tracking-[0.05em] ${getStatusClasses(product.status)}`}>
              {getStockStatusLabel(product.status, t)}
            </span>
          </div>
          <p className="mt-1 font-data-mono text-sm text-[var(--color-text-muted)]">{detail.code}</p>
        </div>

        <div className="grid gap-4 sm:grid-cols-3">
          <SummaryCard label={t('products:modals.detail.summary.stock')} value={detail.stock.toLocaleString('es-VE')} />
          <SummaryCard label={t('products:modals.detail.summary.minStock')} value={detail.minStock.toLocaleString('es-VE')} />
          <SummaryCard badge label={t('products:modals.detail.summary.status')} value={getStockStatusLabel(product.status, t)} valueClassName={getStatusClasses(product.status)} />
        </div>

        <div className="grid gap-x-8 gap-y-5 sm:grid-cols-2">
          <DetailItem label={t('products:modals.detail.fields.category')} value={detail.category?.name ?? noCategoryLabel} />
          <DetailItem label={t('products:modals.detail.fields.unitPrice')} mono value={detail.price != null ? formatCurrency(Number(detail.price)) : t('products:fallback.noPrice')} />
          <DetailItem label={t('products:modals.detail.fields.supplier')} value={supplierNames.join(', ') || t('products:fallback.notAssigned')} />
          <DetailItem label={t('products:modals.detail.fields.lastUpdate')} mono value={formatDate(detail.updatedAt)} />
          <DetailItem label={t('products:modals.detail.fields.presentation')} value={`${detail.brand ?? t('products:fallback.noBrand')} · ${detail.presentation ?? t('products:fallback.noPresentation')}`} />
          <DetailItem label={t('products:modals.detail.fields.content')} mono value={`${detail.unitContent} ${detail.unit}`} />
          <DetailItem label={t('products:modals.detail.fields.activeIngredient')} value={detail.activeIngredient ?? t('products:fallback.noActiveIngredient')} />
          <DetailItem label={t('products:modals.detail.fields.description')} value={detail.description ?? t('products:fallback.noDescription')} />
        </div>

        <div className="space-y-3">
          <h5 className="text-xs font-semibold uppercase tracking-[0.05em] text-[var(--color-text-secondary)]">{t('products:modals.detail.recentMovements.heading')}</h5>
          <div className="space-y-2">
            {movementsQuery.isLoading ? <MovementStateMessage label={t('products:modals.detail.recentMovements.loading')} /> : null}
            {!movementsQuery.isLoading && movementsQuery.error ? <MovementStateMessage label={t('products:modals.detail.recentMovements.loadError')} tone="error" /> : null}
            {!movementsQuery.isLoading && !movementsQuery.error && movementHistory.length === 0 ? <MovementStateMessage label={t('products:modals.detail.recentMovements.empty')} /> : null}
            {!movementsQuery.isLoading && !movementsQuery.error
              ? movementHistory.map((movement) => (
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

      <div className="flex flex-col gap-3 border-t border-[var(--color-border)] bg-[var(--color-surface-strong)] px-5 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
        <div className="flex gap-3">
          {canOpenMovement ? (
            <Button onClick={() => onOpenModal('movement', product)} type="button" variant="secondary">
              <ArrowLeftRight className="mr-2 h-4 w-4" />
              {t('products:modals.detail.actions.registerMovement')}
            </Button>
          ) : null}
          {canUseReplenishment ? (
            <Button onClick={() => onOpenModal('replenishment', product)} type="button" variant="secondary">
              <Package2 className="mr-2 h-4 w-4" />
              {t('products:modals.detail.actions.generateReplenishment')}
            </Button>
          ) : null}
        </div>
        <div className="flex justify-end gap-3">
          <Button onClick={onClose} type="button" variant="ghost">
            {t('products:modals.detail.closeButton')}
          </Button>
          {canManage ? (
            <Button onClick={() => onOpenModal('edit', product)} type="button">
              <SquarePen className="mr-2 h-4 w-4" />
              {t('products:modals.detail.editButton')}
            </Button>
          ) : null}
        </div>
      </div>
    </ModalFrame>
  )
}

function EditProductModal({ onClose, product }: { onClose: () => void; product: ProductRow }) {
  const { t } = useTranslation(['products', 'common'])
  const queryClient = useQueryClient()
  const detailQuery = useProductDetail(product.id)
  const { data: categoriesResponse } = useCategories({ limit: 100 })
  const { data: suppliersResponse } = useSuppliers({ limit: 100, active: true })
  const [values, setValues] = useState<ProductFormValues | null>(null)
  const [selectedSupplierId, setSelectedSupplierId] = useState('')

  useEffect(() => {
    if (!detailQuery.data) {
      return
    }

    setValues(toProductFormValues(detailQuery.data))
  }, [detailQuery.data])

  const updateMutation = useMutation({
    mutationFn: () => updateProduct(product.id, toUpdateProductInput(values!)),
    onSuccess: async () => {
      await invalidateProductCollections(queryClient, product.id)
      toast.success(t('products:toasts.productUpdated'))
      onClose()
    },
    onError: (error: unknown) => {
      toast.error(getProductErrorMessage(error, 'update', t))
    },
  })

  const attachSupplierMutation = useMutation({
    mutationFn: (supplierId: string) => attachProductSupplier(product.id, { supplierId }),
    onSuccess: async () => {
      await invalidateProductCollections(queryClient, product.id, true)
      setSelectedSupplierId('')
      toast.success(t('products:toasts.supplierAttached'))
    },
    onError: (error: unknown) => {
      toast.error(getProductErrorMessage(error, 'attach-supplier', t))
    },
  })

  const detachSupplierMutation = useMutation({
    mutationFn: (supplierId: string) => detachProductSupplier(product.id, supplierId),
    onSuccess: async () => {
      await invalidateProductCollections(queryClient, product.id, true)
      toast.success(t('products:toasts.supplierDetached'))
    },
    onError: (error: unknown) => {
      toast.error(getProductErrorMessage(error, 'detach-supplier', t))
    },
  })

  if (detailQuery.isLoading || !values) {
    return (
      <ModalFrame maxWidth="max-w-[620px]" onClose={onClose} title={t('products:modals.edit.title')}>
        <LoadingState label={t('products:modals.edit.loadingLabel')} />
      </ModalFrame>
    )
  }

  if (detailQuery.isError || !detailQuery.data) {
    return (
      <ModalFrame maxWidth="max-w-[620px]" onClose={onClose} title={t('products:modals.edit.title')}>
        <InlineError label={t('products:modals.edit.loadErrorLabel')} />
      </ModalFrame>
    )
  }

  const detail = detailQuery.data
  const associatedSupplierIds = new Set(detail.suppliers.map((entry) => entry.supplier.id))
  const availableSuppliers = (suppliersResponse?.data ?? []).filter((supplierOption) => !associatedSupplierIds.has(supplierOption.id))
  const isPending = updateMutation.isPending || attachSupplierMutation.isPending || detachSupplierMutation.isPending

  const handleSubmit = () => {
    const validationError = validateProductForm(values, { requireStock: false }, t)

    if (validationError) {
      toast.error(validationError)
      return
    }

    updateMutation.mutate()
  }

  return (
    <ModalFrame maxWidth="max-w-[620px]" onClose={onClose} title={t('products:modals.edit.title')}>
      <div className="flex-1 space-y-6 overflow-y-auto px-5 py-5 sm:px-6">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-[4px] bg-[var(--color-surface-tint)] px-2 py-0.5 text-xs font-semibold uppercase tracking-[0.05em] text-[var(--color-primary)]">
              {detail.category?.name ?? t('products:fallback.noCategory')}
            </span>
            <span className={`rounded-[4px] px-2 py-0.5 text-xs font-semibold uppercase tracking-[0.05em] ${getStatusClasses(product.status)}`}>
              {getStockStatusLabel(product.status, t)}
            </span>
          </div>
          <p className="mt-2 font-data-mono text-sm text-[var(--color-text-muted)]">{detail.code}</p>
        </div>

        <div className="grid gap-4">
          <FieldGroup label={t('products:modals.edit.fields.name.label')}>
            <TextField onChange={(value) => setValues((current) => ({ ...current!, name: value }))} value={values.name} />
          </FieldGroup>
          <FieldGroup label={t('products:modals.edit.fields.code.label')}>
            <TextField mono onChange={(value) => setValues((current) => ({ ...current!, code: value }))} value={values.code} />
          </FieldGroup>
          <FieldGroup label={t('products:modals.edit.fields.brand.label')}>
            <TextField onChange={(value) => setValues((current) => ({ ...current!, brand: value }))} value={values.brand} />
          </FieldGroup>
          <FieldGroup label={t('products:modals.edit.fields.presentation.label')}>
            <TextField onChange={(value) => setValues((current) => ({ ...current!, presentation: value }))} value={values.presentation} />
          </FieldGroup>
          <FieldGroup label={t('products:modals.edit.fields.activeIngredient.label')}>
            <TextField onChange={(value) => setValues((current) => ({ ...current!, activeIngredient: value }))} value={values.activeIngredient} />
          </FieldGroup>
          <FieldGroup label={t('products:modals.edit.fields.description.label')}>
            <TextAreaField onChange={(value) => setValues((current) => ({ ...current!, description: value }))} value={values.description} />
          </FieldGroup>
          <FieldGroup label={t('products:modals.edit.fields.currentStock.label')}>
            <div className="rounded-[var(--radius-control)] border border-[var(--color-border)] bg-[var(--color-surface-strong)] px-3 py-2 font-data-mono text-sm text-[var(--color-text)]">
              {detail.stock}
            </div>
          </FieldGroup>
          <FieldGroup label={t('products:modals.edit.fields.minStock.label')}>
            <NumberField onChange={(value) => setValues((current) => ({ ...current!, minStock: value }))} value={values.minStock} />
          </FieldGroup>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <FieldGroup label={t('products:modals.edit.fields.category.label')}>
            <SelectField
              onChange={(value) => setValues((current) => ({ ...current!, categoryId: value }))}
              options={(categoriesResponse?.data ?? []).map((category) => ({ label: category.name, value: category.id }))}
              placeholder={t('products:placeholders.select')}
              value={values.categoryId}
            />
          </FieldGroup>
          <FieldGroup label={t('products:modals.edit.fields.unitPrice.label')}>
            <NumberField onChange={(value) => setValues((current) => ({ ...current!, price: value }))} value={values.price} />
          </FieldGroup>
          <FieldGroup label={t('products:modals.edit.fields.unit.label')}>
            <SelectField
              onChange={(value) => setValues((current) => ({ ...current!, unit: value as ProductUnit }))}
              options={getUnitOptions(t)}
              placeholder={t('products:placeholders.select')}
              value={values.unit}
            />
          </FieldGroup>
          <FieldGroup label={t('products:modals.edit.fields.content.label')}>
            <TextField mono onChange={(value) => setValues((current) => ({ ...current!, unitContent: value }))} value={values.unitContent} />
          </FieldGroup>
          <FieldGroup label={t('products:modals.edit.fields.lastUpdate.label')}>
            <div className="rounded-[var(--radius-control)] border border-[var(--color-border)] bg-[var(--color-surface-strong)] px-3 py-2 font-data-mono text-sm text-[var(--color-text-secondary)]">
              {formatDate(detail.updatedAt)}
            </div>
          </FieldGroup>
        </div>

        <div className="space-y-4 rounded-[var(--radius-panel)] border border-[var(--color-border)] bg-[var(--color-surface-strong)] p-4">
          <div>
            <h4 className="text-sm font-semibold text-[var(--color-text)]">{t('products:modals.edit.suppliers.heading')}</h4>
            <p className="mt-1 text-sm text-[var(--color-text-secondary)]">{t('products:modals.edit.suppliers.description')}</p>
          </div>

          <div className="space-y-2">
            {detail.suppliers.length === 0 ? (
              <p className="text-sm text-[var(--color-text-secondary)]">{t('products:modals.edit.suppliers.empty')}</p>
            ) : (
              detail.suppliers.map((entry) => (
                <div key={entry.supplier.id} className="flex items-center justify-between rounded-[var(--radius-control)] border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-2">
                  <div>
                    <p className="text-sm font-medium text-[var(--color-text)]">{entry.supplier.name}</p>
                    <p className="text-xs text-[var(--color-text-secondary)]">
                      {t('products:modals.edit.suppliers.referencePrice', {
                        price: entry.referencePrice ? formatCurrency(Number(entry.referencePrice)) : t('products:modals.edit.suppliers.pricePending'),
                      })}
                    </p>
                  </div>
                  <button
                    className="inline-flex items-center gap-2 rounded-[var(--radius-control)] px-3 py-2 text-sm font-medium text-[var(--color-danger-text)] transition hover:bg-[var(--color-danger-bg)] disabled:cursor-not-allowed disabled:opacity-50"
                    disabled={isPending}
                    onClick={() => detachSupplierMutation.mutate(entry.supplier.id)}
                    type="button"
                  >
                    <Trash2 className="h-4 w-4" />
                    {t('products:modals.edit.suppliers.removeButton')}
                  </button>
                </div>
              ))
            )}
          </div>

          <div className="grid gap-3 sm:grid-cols-[1fr_auto] sm:items-end">
            <FieldGroup label={t('products:modals.edit.suppliers.associateLabel')}>
              <SelectField
                onChange={(value) => setSelectedSupplierId(value)}
                options={availableSuppliers.map((supplierOption) => ({ label: supplierOption.name, value: supplierOption.id }))}
                placeholder={t('products:modals.edit.suppliers.associatePlaceholder')}
                value={selectedSupplierId}
              />
            </FieldGroup>
            <Button
              disabled={!selectedSupplierId || isPending}
              onClick={() => attachSupplierMutation.mutate(selectedSupplierId)}
              type="button"
              variant="secondary"
            >
              <Plus className="mr-2 h-4 w-4" />
              {t('products:modals.edit.suppliers.associateButton')}
            </Button>
          </div>
        </div>
      </div>

      <div className="flex flex-col gap-3 border-t border-[var(--color-border)] bg-[var(--color-surface-strong)] px-5 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
        <button
          className="inline-flex items-center gap-2 rounded-[var(--radius-control)] px-4 py-2 text-sm font-medium text-[var(--color-danger-text)] transition hover:bg-[var(--color-danger-bg)] disabled:cursor-not-allowed disabled:opacity-50"
          disabled={isPending}
          onClick={() => onClose()}
          type="button"
        >
          <TriangleAlert className="h-4 w-4" />
          {t('products:modals.edit.deactivateFromMenuButton')}
        </button>
        <div className="flex justify-end gap-3">
          <Button disabled={isPending} onClick={onClose} type="button" variant="ghost">
            {t('products:modals.edit.cancelButton')}
          </Button>
          <Button disabled={isPending} onClick={handleSubmit} type="button">
            {updateMutation.isPending ? <LoaderCircle className="mr-2 h-4 w-4 animate-spin" /> : null}
            {t('products:modals.edit.saveButton')}
          </Button>
        </div>
      </div>
    </ModalFrame>
  )
}

function RegisterMovementModal({ onClose, product, role }: { onClose: () => void; product: ProductRow; role: UserRole | undefined }) {
  const { t } = useTranslation(['products', 'common'])
  const availableMovementTypes = (['IN', 'OUT', 'ADJUSTMENT'] as const).filter((type) => canCreateMovementType(role, type))
  const [movementType, setMovementType] = useState<MovementType>(availableMovementTypes[0] ?? 'OUT')
  const [adjustmentDirection, setAdjustmentDirection] = useState<'INCREASE' | 'DECREASE'>('INCREASE')
  const [quantity, setQuantity] = useState(10)
  const [reasonKey, setReasonKey] = useState<string>(MOVEMENT_REASON_KEYS[availableMovementTypes[0] ?? 'OUT'][0])
  const reason = MOVEMENT_REASON_BACKEND_VALUES[movementType][reasonKey] ?? MOVEMENT_REASON_BACKEND_VALUES[movementType][MOVEMENT_REASON_KEYS[movementType][0]]
  const createMovementMutation = useCreateInventoryMovement()

  useEffect(() => {
    setReasonKey(MOVEMENT_REASON_KEYS[movementType][0])
  }, [movementType])

  if (availableMovementTypes.length === 0) {
    return null
  }

  const resultingStock =
    movementType === 'IN'
      ? product.stock + quantity
      : movementType === 'OUT'
        ? Math.max(product.stock - quantity, 0)
        : adjustmentDirection === 'INCREASE'
          ? product.stock + quantity
          : Math.max(product.stock - quantity, 0)

  return (
    <ModalFrame maxWidth="max-w-[420px]" onClose={onClose} title={t('products:modals.registerMovement.title')}>
      <div className="space-y-6 px-5 py-5 sm:px-6">
        <div className="flex items-start gap-4">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-[var(--radius-control)] border border-[var(--color-border)] bg-[#e1f5ee] text-[#086b53]">
            <Pill className="h-5 w-5" />
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.05em] text-[var(--color-text-secondary)]">{t('products:modals.registerMovement.codeLabel', { code: product.code })}</p>
            <p className="text-sm font-medium text-[var(--color-text)]">{product.name}</p>
          </div>
        </div>

        <div className="flex rounded-[var(--radius-control)] border border-[var(--color-border)] bg-[var(--color-surface-strong)] p-1">
          {availableMovementTypes.map((type) => (
            <button
              key={type}
              className={`flex-1 rounded-[6px] px-3 py-2 text-sm font-medium transition ${
                movementType === type ? 'border border-[var(--color-border)] bg-white text-[var(--color-primary)]' : 'text-[var(--color-text-secondary)]'
              }`}
              onClick={() => setMovementType(type)}
              type="button"
            >
              {t(`products:modals.registerMovement.types.${type}`)}
            </button>
          ))}
        </div>

        <div className="space-y-4">
          {movementType === 'ADJUSTMENT' ? (
            <div className="space-y-1.5">
              <FieldLabel>{t('products:modals.registerMovement.adjustmentDirection.label')}</FieldLabel>
              <div className="flex rounded-[var(--radius-control)] border border-[var(--color-border)] bg-[var(--color-surface-strong)] p-1">
                {([
                  { value: 'INCREASE', label: t('products:modals.registerMovement.adjustmentDirection.increase') },
                  { value: 'DECREASE', label: t('products:modals.registerMovement.adjustmentDirection.decrease') },
                ] as const).map((option) => (
                  <button
                    key={option.value}
                    className={`flex-1 rounded-[6px] px-3 py-2 text-sm font-medium transition ${
                      adjustmentDirection === option.value ? 'border border-[var(--color-border)] bg-white text-[var(--color-primary)]' : 'text-[var(--color-text-secondary)]'
                    }`}
                    onClick={() => setAdjustmentDirection(option.value)}
                    type="button"
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            </div>
          ) : null}

          <FieldGroup label={t('products:modals.registerMovement.fields.quantity.label')}>
            <NumberField onChange={(value) => setQuantity(Number(value) || 0)} value={String(quantity)} />
          </FieldGroup>

           <FieldGroup label={t('products:modals.registerMovement.fields.reason.label')}>
            <SelectField
              onChange={(value) => setReasonKey(value)}
              options={MOVEMENT_REASON_KEYS[movementType].map((key) => ({
                label: t(`products:modals.registerMovement.reasons.${movementType}.${key}`),
                value: key,
              }))}
              placeholder={t('products:placeholders.select')}
              value={reasonKey}
            />
           </FieldGroup>
         </div>

        <div className="flex items-center gap-3 rounded-[var(--radius-control)] border border-[var(--color-border)] bg-[var(--color-surface-strong)] p-3">
          <Info className="h-4 w-4 text-[var(--color-text-secondary)]" />
          <p className="text-sm text-[var(--color-text-secondary)]">
            <Trans
              components={{
                mono: <span className="font-data-mono" />,
                result: <span className="font-data-mono font-semibold text-[var(--color-primary)]" />,
              }}
              i18nKey="products:modals.registerMovement.resultingStock"
              values={{ current: product.stock, result: resultingStock }}
            />
          </p>
        </div>
      </div>

      <div className="flex items-center justify-end gap-3 border-t border-[var(--color-border)] bg-[var(--color-surface)] px-5 py-4 sm:px-6">
        <Button disabled={createMovementMutation.isPending} onClick={onClose} type="button" variant="secondary">
          {t('products:modals.registerMovement.cancelButton')}
        </Button>
        <Button
          disabled={createMovementMutation.isPending}
          onClick={() => {
            if (quantity <= 0) {
              toast.error(t('products:validation.quantityPositive'))
              return
            }

            if (!reason.trim()) {
              toast.error(t('products:validation.reasonRequired'))
              return
            }

            createMovementMutation.mutate(
              {
                productId: product.id,
                quantity: toMovementQuantity(quantity, movementType, adjustmentDirection),
                reason,
                type: movementType,
              },
              {
                onError: (error: unknown) => {
                  toast.error(getInventoryMovementErrorMessage(error, t))
                },
                onSuccess: () => {
                  toast.success(t('products:toasts.movementRegistered'))
                  onClose()
                },
              },
            )
          }}
          type="button"
        >
          {createMovementMutation.isPending ? <LoaderCircle className="mr-2 h-4 w-4 animate-spin" /> : null}
          {t('products:modals.registerMovement.submitButton')}
        </Button>
      </div>
    </ModalFrame>
  )
}

function ReplenishmentModal({ onClose, product }: { onClose: () => void; product: ProductRow }) {
  return <GenerateReplenishmentModal initialProduct={product} onClose={onClose} />
}

function DeactivateProductModal({ onClose, product }: { onClose: () => void; product: ProductRow }) {
  const { t } = useTranslation(['products', 'common'])
  const queryClient = useQueryClient()

  const deleteMutation = useMutation({
    mutationFn: () => deleteProduct(product.id),
    onSuccess: async () => {
      await invalidateProductCollections(queryClient, product.id)
      toast.success(t('products:toasts.productDeactivated'))
      onClose()
    },
    onError: (error: unknown) => {
      toast.error(getProductErrorMessage(error, 'delete', t))
    },
  })

  return (
    <ModalFrame maxWidth="max-w-[420px]" onClose={onClose} title={t('products:modals.deactivate.title')}>
      <div className="space-y-5 px-5 py-5 sm:px-6">
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[var(--color-danger-bg)] text-[var(--color-danger-text)]">
            <TriangleAlert className="h-5 w-5" />
          </div>
          <p className="text-sm leading-6 text-[var(--color-text-secondary)]">
            <Trans
              components={{ bold: <span className="font-semibold text-[var(--color-text)]" /> }}
              i18nKey="products:modals.deactivate.confirmMessage"
              values={{ name: product.name }}
            />
          </p>
        </div>
      </div>
      <div className="flex items-center justify-end gap-3 px-5 pb-5 sm:px-6">
        <Button disabled={deleteMutation.isPending} onClick={onClose} type="button" variant="secondary">
          {t('products:modals.deactivate.cancelButton')}
        </Button>
        <button
          className="inline-flex min-h-10 items-center justify-center rounded-[var(--radius-control)] bg-[var(--color-danger-text)] px-4 py-2 text-sm font-medium text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-70"
          disabled={deleteMutation.isPending}
          onClick={() => deleteMutation.mutate()}
          type="button"
        >
          {deleteMutation.isPending ? <LoaderCircle className="mr-2 h-4 w-4 animate-spin" /> : null}
          {t('products:modals.deactivate.deactivateButton')}
        </button>
      </div>
    </ModalFrame>
  )
}

function ProductIdentitySection({
  onChange,
  showError,
  values,
}: {
  onChange: React.Dispatch<React.SetStateAction<ProductFormValues>>
  showError: boolean
  values: ProductFormValues
}) {
  const { t } = useTranslation('products')

  return (
    <div className="space-y-4">
      <FieldGroup label={t('products:modals.new.fields.name.label')}>
        <input
          className={`w-full rounded-[var(--radius-control)] border px-3 py-2 text-sm text-[var(--color-text)] outline-none ${showError ? 'border-[var(--color-danger-text)] bg-[color:rgba(176,48,31,0.04)]' : 'border-[var(--color-border)] bg-[var(--color-surface)]'}`}
          onChange={(event) => onChange((current) => ({ ...current, name: event.target.value }))}
          placeholder={t('products:modals.new.fields.name.placeholder')}
          type="text"
          value={values.name}
        />
        {showError ? (
          <p className="flex items-center gap-1 text-xs text-[var(--color-danger-text)]">
            <CircleAlert className="h-3.5 w-3.5" />
            {t('products:modals.new.fields.name.requiredError')}
          </p>
        ) : null}
      </FieldGroup>

      <div className="grid gap-4 sm:grid-cols-2">
        <FieldGroup label={t('products:modals.new.fields.sku.label')}>
          <TextField mono onChange={(value) => onChange((current) => ({ ...current, code: value }))} placeholder={t('products:modals.new.fields.sku.placeholder')} value={values.code} />
        </FieldGroup>
        <FieldGroup label={t('products:modals.new.fields.activeIngredient.label')}>
          <TextField onChange={(value) => onChange((current) => ({ ...current, activeIngredient: value }))} placeholder={t('products:modals.new.fields.activeIngredient.placeholder')} value={values.activeIngredient} />
        </FieldGroup>
      </div>
    </div>
  )
}

function ProductCommercialSection({
  categories,
  onChange,
  suppliers,
  values,
}: {
  categories: Array<{ id: string; name: string }>
  onChange: React.Dispatch<React.SetStateAction<ProductFormValues>>
  suppliers: Array<{ id: string; name: string }>
  values: ProductFormValues
}) {
  const { t } = useTranslation('products')

  return (
    <div className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <FieldGroup label={t('products:modals.new.fields.category.label')}>
          <SelectField
            onChange={(value) => onChange((current) => ({ ...current, categoryId: value }))}
            options={categories.map((category) => ({ label: category.name, value: category.id }))}
            placeholder={t('products:placeholders.select')}
            value={values.categoryId}
          />
        </FieldGroup>
        <FieldGroup label={t('products:modals.new.fields.price.label')}>
          <NumberField onChange={(value) => onChange((current) => ({ ...current, price: value }))} placeholder={t('products:modals.new.fields.price.placeholder')} value={values.price} />
        </FieldGroup>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <FieldGroup label={t('products:modals.new.fields.initialSupplier.label')}>
          <SelectField
            onChange={(value) => onChange((current) => ({ ...current, supplierId: value }))}
            options={suppliers.map((supplierOption) => ({ label: supplierOption.name, value: supplierOption.id }))}
            placeholder={t('products:placeholders.select')}
            value={values.supplierId}
          />
        </FieldGroup>
        <FieldGroup label={t('products:modals.new.fields.brand.label')}>
          <TextField onChange={(value) => onChange((current) => ({ ...current, brand: value }))} value={values.brand} />
        </FieldGroup>
      </div>

      <FieldGroup label={t('products:modals.new.fields.presentation.label')}>
        <TextField onChange={(value) => onChange((current) => ({ ...current, presentation: value }))} value={values.presentation} />
      </FieldGroup>
    </div>
  )
}

function ModalFrame({
  children,
  title,
  onClose,
  maxWidth = 'max-w-[560px]',
}: {
  children: ReactNode
  title: string
  onClose: () => void
  maxWidth?: string
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-5">
      <button className="absolute inset-0 bg-[#0e1d27]/40 backdrop-blur-[2px]" onClick={onClose} type="button" />
      <div aria-label={title} aria-modal="true" className={`relative flex max-h-[90vh] w-full flex-col overflow-hidden rounded-[var(--radius-panel)] border border-[var(--color-border)] bg-[var(--color-surface)] shadow-[0_8px_30px_rgba(0,0,0,0.12)] ${maxWidth}`} role="dialog">
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

function FieldLabel({ children }: { children: ReactNode }) {
  return <label className="text-xs font-semibold uppercase tracking-[0.05em] text-[var(--color-text-secondary)]">{children}</label>
}

function FieldGroup({ children, label }: { children: ReactNode; label: string }) {
  return (
    <div className="space-y-1.5">
      <FieldLabel>{label}</FieldLabel>
      {children}
    </div>
  )
}

function TextField({
  mono = false,
  onChange,
  placeholder,
  value,
}: {
  mono?: boolean
  onChange?: (value: string) => void
  placeholder?: string
  value: string
}) {
  return (
    <input
      className={`w-full rounded-[var(--radius-control)] border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-2 text-sm text-[var(--color-text)] outline-none transition focus:border-[var(--color-primary)] focus:ring-2 focus:ring-[color:rgba(0,71,130,0.10)] ${mono ? 'font-data-mono' : ''}`}
      onChange={(event) => onChange?.(event.target.value)}
      placeholder={placeholder}
      type="text"
      value={value}
    />
  )
}

function NumberField({
  onChange,
  placeholder,
  value,
}: {
  onChange?: (value: string) => void
  placeholder?: string
  value: string
}) {
  return (
    <input
      className="w-full rounded-[var(--radius-control)] border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-2 font-data-mono text-sm text-[var(--color-text)] outline-none transition focus:border-[var(--color-primary)] focus:ring-2 focus:ring-[color:rgba(0,71,130,0.10)]"
      onChange={(event) => onChange?.(event.target.value)}
      placeholder={placeholder}
      type="number"
      value={value}
    />
  )
}

function TextAreaField({
  onChange,
  placeholder,
  value,
}: {
  onChange?: (value: string) => void
  placeholder?: string
  value: string
}) {
  return (
    <textarea
      className="min-h-24 w-full resize-none rounded-[var(--radius-control)] border border-[var(--color-border)] bg-[var(--color-surface)] p-3 text-sm text-[var(--color-text)] outline-none transition focus:border-[var(--color-primary)] focus:ring-2 focus:ring-[color:rgba(0,71,130,0.10)]"
      onChange={(event) => onChange?.(event.target.value)}
      placeholder={placeholder}
      value={value}
    />
  )
}

function SelectField({
  onChange,
  options,
  placeholder,
  value,
}: {
  onChange?: (value: string) => void
  options: Array<{ label: string; value: string }>
  placeholder?: string
  value: string
}) {
  return (
    <select
      className="w-full rounded-[var(--radius-control)] border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-2 text-sm text-[var(--color-text)] outline-none transition focus:border-[var(--color-primary)] focus:ring-2 focus:ring-[color:rgba(0,71,130,0.10)]"
      onChange={(event) => onChange?.(event.target.value)}
      value={value}
    >
      <option value="">{placeholder}</option>
      {options.map((option) => (
        <option key={option.value} value={option.value}>
          {option.label}
        </option>
      ))}
    </select>
  )
}

function ModalFooter({
  cancelLabel,
  isPending,
  onClose,
  onConfirm,
  primaryLabel,
}: {
  cancelLabel: string
  isPending: boolean
  onClose: () => void
  onConfirm: () => void
  primaryLabel: string
}) {
  return (
    <div className="flex items-center justify-end gap-3 border-t border-[var(--color-border)] bg-[var(--color-surface-strong)] px-5 py-4 sm:px-6">
      <Button disabled={isPending} onClick={onClose} type="button" variant="ghost">
        {cancelLabel}
      </Button>
      <Button disabled={isPending} onClick={onConfirm} type="button">
        {isPending ? <LoaderCircle className="mr-2 h-4 w-4 animate-spin" /> : null}
        {primaryLabel}
      </Button>
    </div>
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

function MovementStateMessage({ label, tone = 'muted' }: { label: string; tone?: 'error' | 'muted' }) {
  return <div className={`rounded-[var(--radius-control)] border border-[var(--color-border)] px-3 py-4 text-sm ${tone === 'error' ? 'text-[var(--color-danger-text)]' : 'text-[var(--color-text-secondary)]'}`}>{label}</div>
}

function MovementIcon({ type }: { type: InventoryMovement['type'] }) {
  if (type === 'IN') {
    return (
      <div className="flex h-8 w-8 items-center justify-center rounded-[6px] bg-[var(--color-success-bg)] text-[var(--color-success-text)]">
        <ArrowUp className="h-4 w-4" />
      </div>
    )
  }

  if (type === 'OUT') {
    return (
      <div className="flex h-8 w-8 items-center justify-center rounded-[6px] bg-[var(--color-danger-bg)] text-[var(--color-danger-text)]">
        <ArrowDown className="h-4 w-4" />
      </div>
    )
  }

  return (
    <div className="flex h-8 w-8 items-center justify-center rounded-[6px] bg-[var(--color-surface-tint)] text-[var(--color-primary)]">
      <ArrowLeftRight className="h-4 w-4" />
    </div>
  )
}

function LoadingState({ label }: { label: string }) {
  return (
    <div className="flex min-h-56 items-center justify-center px-5 py-6 text-sm text-[var(--color-text-secondary)]">
      <LoaderCircle className="mr-2 h-4 w-4 animate-spin" />
      {label}
    </div>
  )
}

function InlineError({ label }: { label: string }) {
  return (
    <div className="px-5 py-6">
      <div className="rounded-[var(--radius-panel)] border border-[var(--color-danger-text)]/20 bg-[var(--color-danger-bg)] px-4 py-3 text-sm text-[var(--color-danger-text)]">
        {label}
      </div>
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

function getMovementLabel(type: InventoryMovement['type'], t: ProductsTFunction) {
  if (type === 'IN') {
    return t('products:modals.detail.recentMovements.types.in')
  }

  if (type === 'OUT') {
    return t('products:modals.detail.recentMovements.types.out')
  }

  return t('products:modals.detail.recentMovements.types.adjustment')
}

function getMovementSubtitle(movement: InventoryMovement, t: ProductsTFunction) {
  const userLabel = t('products:modals.detail.recentMovements.userLabel', { id: shortId(movement.userId) })

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

function shortId(value: string) {
  return value.length > 8 ? value.slice(0, 8) : value
}

function toCreateProductInput(values: ProductFormValues): CreateProductInput {
  return {
    code: values.code.trim(),
    name: values.name.trim(),
    activeIngredient: normalizeOptionalText(values.activeIngredient),
    description: normalizeOptionalText(values.description),
    presentation: normalizeOptionalText(values.presentation),
    brand: normalizeOptionalText(values.brand),
    unit: values.unit,
    unitContent: values.unitContent.trim(),
    categoryId: values.categoryId,
    stock: Number(values.stock || 0),
    minStock: Number(values.minStock || 0),
    price: values.price.trim() ? normalizePrice(values.price) : undefined,
  }
}

function toUpdateProductInput(values: ProductFormValues): UpdateProductInput {
  return {
    code: values.code.trim(),
    name: values.name.trim(),
    activeIngredient: normalizeOptionalText(values.activeIngredient),
    description: normalizeOptionalText(values.description),
    presentation: normalizeOptionalText(values.presentation),
    brand: normalizeOptionalText(values.brand),
    unit: values.unit,
    unitContent: values.unitContent.trim(),
    categoryId: values.categoryId,
    minStock: Number(values.minStock || 0),
    price: values.price.trim() ? normalizePrice(values.price) : null,
  }
}

function toProductFormValues(detail: ProductDetail): ProductFormValues {
  return {
    code: detail.code,
    name: detail.name,
    activeIngredient: detail.activeIngredient ?? '',
    description: detail.description ?? '',
    presentation: detail.presentation ?? '',
    brand: detail.brand ?? '',
    unit: detail.unit,
    unitContent: detail.unitContent,
    categoryId: detail.categoryId,
    stock: String(detail.stock),
    minStock: String(detail.minStock),
    price: detail.price ?? '',
    supplierId: '',
  }
}

function validateProductForm(values: ProductFormValues, options: { requireStock: boolean }, t: ProductsTFunction) {
  if (!values.name.trim()) {
    return t('products:validation.nameRequired')
  }

  if (!values.code.trim()) {
    return t('products:validation.codeRequired')
  }

  if (!values.categoryId) {
    return t('products:validation.categoryRequired')
  }

  if (!values.unitContent.trim()) {
    return t('products:validation.unitContentRequired')
  }

  if (values.price.trim() && Number(values.price) < 0) {
    return t('products:validation.pricePositive')
  }

  if (Number(values.minStock || 0) < 0) {
    return t('products:validation.minStockPositive')
  }

  if (options.requireStock && Number(values.stock || 0) < 0) {
    return t('products:validation.initialStockPositive')
  }

  return null
}

function normalizeOptionalText(value: string) {
  const normalized = value.trim()
  return normalized ? normalized : undefined
}

function normalizePrice(value: string) {
  return String(Number(value || 0).toFixed(2))
}

async function invalidateProductCollections(
  queryClient: ReturnType<typeof useQueryClient>,
  productId?: string,
  includeSuppliers = false,
) {
  const invalidations: Array<Promise<unknown>> = [
    queryClient.invalidateQueries({ queryKey: queryKeys.products.all }),
  ]

  if (includeSuppliers) {
    invalidations.push(queryClient.invalidateQueries({ queryKey: queryKeys.suppliers.all }))
  }

  if (productId) {
    invalidations.push(queryClient.invalidateQueries({ queryKey: queryKeys.products.detail(productId) }))
    invalidations.push(queryClient.invalidateQueries({ queryKey: queryKeys.products.suppliers(productId) }))
  }

  await Promise.all(invalidations)
}

function getProductErrorMessage(
  error: unknown,
  action: 'create' | 'update' | 'delete' | 'attach-supplier' | 'detach-supplier',
  t: ProductsTFunction,
) {
  if (!isAxiosError<ApiErrorEnvelope>(error)) {
    return t('products:errors.unexpected')
  }

  const apiError = error.response?.data
  const status = error.response?.status
  const code = apiError?.error?.toUpperCase() ?? ''
  const message = apiError?.message?.trim()
  const normalizedMessage = message?.toLowerCase() ?? ''

  if (
    code.includes('CODE') ||
    code.includes('SKU') ||
    normalizedMessage.includes('codigo') ||
    normalizedMessage.includes('sku')
  ) {
    if (code.includes('DUPLICATE') || code.includes('ALREADY_EXISTS') || normalizedMessage.includes('ya existe') || normalizedMessage.includes('duplicate')) {
      return t('products:errors.duplicateCode')
    }
  }

  if (
    code.includes('CATEGORY') ||
    normalizedMessage.includes('categor')
  ) {
    return t('products:errors.categoryNotFound')
  }

  if (
    code.includes('SUPPLIER') ||
    normalizedMessage.includes('proveedor')
  ) {
    return action === 'attach-supplier' || action === 'detach-supplier'
      ? t('products:errors.supplierAssociationFailed')
      : t('products:errors.supplierNotFound')
  }

  if (status === 409) {
    return t('products:errors.deactivateConflict')
  }

  if (status === 404 || code.includes('NOT_FOUND')) {
    return t('products:errors.notFound')
  }

  if (message) {
    return message
  }

  if (action === 'attach-supplier' || action === 'detach-supplier') {
    return t('products:errors.supplierUpdateFailed')
  }

  return t('products:errors.operationFailed')
}

function getInventoryMovementErrorMessage(error: unknown, t: ProductsTFunction) {
  if (!isAxiosError<ApiErrorEnvelope>(error)) {
    return t('products:errors.registerMovementFailed')
  }

  return error.response?.data.message?.trim() || t('products:errors.registerMovementFailed')
}

function toMovementQuantity(
  quantity: number,
  movementType: 'IN' | 'OUT' | 'ADJUSTMENT',
  adjustmentDirection: 'INCREASE' | 'DECREASE',
) {
  if (movementType !== 'ADJUSTMENT') {
    return quantity
  }

  return adjustmentDirection === 'DECREASE' ? -quantity : quantity
}
