import { useMutation, useQueryClient } from '@tanstack/react-query'
import { isAxiosError } from 'axios'
import {
  ArrowLeftRight,
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

import { Button } from '@/components/ui/Button'
import { canCreateMovementType, canManageProducts, hasPermission } from '@/features/auth/lib/permissions'
import { useCategories } from '@/features/categories/api/useCategories'
import { useCreateInventoryMovement } from '@/features/inventory-movements/api/useInventoryMovements'
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
import type { ProductRow } from '@/features/products/lib/productRows'
import { GenerateReplenishmentModal } from '@/features/replenishment/components/ReplenishmentModals'
import { useSuppliers } from '@/features/suppliers/api/useSuppliers'
import { queryKeys } from '@/lib/queryKeys'
import { formatCurrency, formatDate } from '@/lib/utils'
import type {
  ApiErrorEnvelope,
  ProductDetail,
  ProductUnit,
  UserRole,
} from '@/types/api.types'

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

const movementTypeOptions = {
  IN: ['Recepcion de proveedor', 'Devolucion de cliente', 'Ajuste de inventario (+)'],
  OUT: ['Dispensacion en ventanilla', 'Merma o vencimiento', 'Traslado a otra sede'],
  ADJUSTMENT: ['Conteo fisico', 'Correccion manual', 'Auditoria interna'],
} as const

const unitOptions: Array<{ label: string; value: ProductUnit }> = [
  { label: 'Unidad', value: 'UNIT' },
  { label: 'Miligramos', value: 'MG' },
  { label: 'Gramos', value: 'G' },
  { label: 'Kilogramos', value: 'KG' },
  { label: 'Mililitros', value: 'ML' },
  { label: 'Litros', value: 'L' },
]

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
      toast.success('Producto creado correctamente')
      onClose()
    },
    onError: (error: unknown) => {
      toast.error(getProductErrorMessage(error, 'create'))
    },
  })

  const handleSubmit = () => {
    const validationError = validateProductForm(values, { requireStock: true })

    if (validationError) {
      toast.error(validationError)
      return
    }

    createMutation.mutate()
  }

  return (
    <ModalFrame maxWidth="max-w-[620px]" onClose={onClose} title="Nuevo Producto">
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
            <h4 className="text-sm font-semibold text-[var(--color-text)]">Inventario</h4>
            <div className="grid gap-4 sm:grid-cols-2">
              <FieldGroup label="Stock inicial">
                <NumberField onChange={(value) => setValues((current) => ({ ...current, stock: value }))} placeholder="0" value={values.stock} />
              </FieldGroup>
              <FieldGroup label="Stock minimo">
                <NumberField onChange={(value) => setValues((current) => ({ ...current, minStock: value }))} placeholder="10" value={values.minStock} />
              </FieldGroup>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <FieldGroup label="Unidad">
                <SelectField
                  onChange={(value) => setValues((current) => ({ ...current, unit: value as ProductUnit }))}
                  options={unitOptions}
                  value={values.unit}
                />
              </FieldGroup>
              <FieldGroup label="Contenido por unidad">
                <TextField mono onChange={(value) => setValues((current) => ({ ...current, unitContent: value }))} placeholder="Ej. 500" value={values.unitContent} />
              </FieldGroup>
            </div>
            <FieldGroup label="Descripcion">
              <TextAreaField onChange={(value) => setValues((current) => ({ ...current, description: value }))} placeholder="Detalles adicionales del producto" value={values.description} />
            </FieldGroup>
          </div>
        </div>
      </div>

      <ModalFooter
        isPending={createMutation.isPending}
        onClose={onClose}
        onConfirm={handleSubmit}
        primaryLabel="Guardar producto"
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
  const canManage = canManageProducts(role)
  const canOpenMovement = canCreateMovementType(role, 'OUT')
  const canUseReplenishment = hasPermission(role, 'manage:replenishment')
  const detailQuery = useProductDetail(product.id)

  if (detailQuery.isLoading) {
    return (
      <ModalFrame maxWidth="max-w-[620px]" onClose={onClose} title="Detalle del producto">
        <LoadingState label="Cargando detalle del producto..." />
      </ModalFrame>
    )
  }

  if (detailQuery.isError || !detailQuery.data) {
    return (
      <ModalFrame maxWidth="max-w-[620px]" onClose={onClose} title="Detalle del producto">
        <InlineError label="No fue posible cargar el detalle real del producto." />
      </ModalFrame>
    )
  }

  const detail = detailQuery.data
  const supplierNames = detail.suppliers.map((entry) => entry.supplier.name)

  return (
    <ModalFrame maxWidth="max-w-[620px]" onClose={onClose} title="Detalle del producto">
      <div className="flex-1 space-y-6 overflow-y-auto px-5 py-5 sm:px-6">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h4 className="text-lg font-medium text-[var(--color-text)]">{detail.name}</h4>
            <span className="rounded-[4px] bg-[var(--color-surface-tint)] px-2 py-0.5 text-xs font-semibold uppercase tracking-[0.05em] text-[var(--color-primary)]">
              {detail.category?.name ?? 'Sin categoria'}
            </span>
            <span className={`rounded-[4px] px-2 py-0.5 text-xs font-semibold uppercase tracking-[0.05em] ${getStatusClasses(product.status)}`}>
              {product.status}
            </span>
          </div>
          <p className="mt-1 font-data-mono text-sm text-[var(--color-text-muted)]">{detail.code}</p>
        </div>

        <div className="grid gap-4 sm:grid-cols-3">
          <SummaryCard label="Existencias" value={detail.stock.toLocaleString('es-VE')} />
          <SummaryCard label="Stock minimo" value={detail.minStock.toLocaleString('es-VE')} />
          <SummaryCard badge label="Estado" value={product.status} valueClassName={getStatusClasses(product.status)} />
        </div>

        <div className="grid gap-x-8 gap-y-5 sm:grid-cols-2">
          <DetailItem label="Categoria" value={detail.category?.name ?? 'Sin categoria'} />
          <DetailItem label="Precio unitario" mono value={detail.price != null ? formatCurrency(Number(detail.price)) : 'Sin precio'} />
          <DetailItem label="Proveedor" value={supplierNames.join(', ') || 'No asignado'} />
          <DetailItem label="Ultima actualizacion" mono value={formatDate(detail.updatedAt)} />
          <DetailItem label="Presentacion" value={`${detail.brand ?? 'Sin marca'} · ${detail.presentation ?? 'Sin presentacion'}`} />
          <DetailItem label="Contenido" mono value={`${detail.unitContent} ${detail.unit}`} />
          <DetailItem label="Principio activo" value={detail.activeIngredient ?? 'Sin principio activo'} />
          <DetailItem label="Descripcion" value={detail.description ?? 'Sin descripcion'} />
        </div>

        <div className="space-y-3">
          <h5 className="text-xs font-semibold uppercase tracking-[0.05em] text-[var(--color-text-secondary)]">Movimientos recientes</h5>
          <div className="rounded-[var(--radius-control)] border border-[var(--color-border)] bg-[var(--color-surface-strong)] p-4 text-sm text-[var(--color-text-secondary)]">
            Los movimientos reales se conectarán en la siguiente fase. Por ahora este detalle usa exclusivamente backend para producto, categoría y proveedores.
          </div>
        </div>
      </div>

      <div className="flex flex-col gap-3 border-t border-[var(--color-border)] bg-[var(--color-surface-strong)] px-5 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
        <div className="flex gap-3">
          {canOpenMovement ? (
            <Button onClick={() => onOpenModal('movement', product)} type="button" variant="secondary">
              <ArrowLeftRight className="mr-2 h-4 w-4" />
              Registrar movimiento
            </Button>
          ) : null}
          {canUseReplenishment ? (
            <Button onClick={() => onOpenModal('replenishment', product)} type="button" variant="secondary">
              <Package2 className="mr-2 h-4 w-4" />
              Generar reposicion
            </Button>
          ) : null}
        </div>
        <div className="flex justify-end gap-3">
          <Button onClick={onClose} type="button" variant="ghost">
            Cerrar
          </Button>
          {canManage ? (
            <Button onClick={() => onOpenModal('edit', product)} type="button">
              <SquarePen className="mr-2 h-4 w-4" />
              Editar
            </Button>
          ) : null}
        </div>
      </div>
    </ModalFrame>
  )
}

function EditProductModal({ onClose, product }: { onClose: () => void; product: ProductRow }) {
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
      toast.success('Producto actualizado correctamente')
      onClose()
    },
    onError: (error: unknown) => {
      toast.error(getProductErrorMessage(error, 'update'))
    },
  })

  const attachSupplierMutation = useMutation({
    mutationFn: (supplierId: string) => attachProductSupplier(product.id, { supplierId }),
    onSuccess: async () => {
      await invalidateProductCollections(queryClient, product.id, true)
      setSelectedSupplierId('')
      toast.success('Proveedor asociado correctamente')
    },
    onError: (error: unknown) => {
      toast.error(getProductErrorMessage(error, 'attach-supplier'))
    },
  })

  const detachSupplierMutation = useMutation({
    mutationFn: (supplierId: string) => detachProductSupplier(product.id, supplierId),
    onSuccess: async () => {
      await invalidateProductCollections(queryClient, product.id, true)
      toast.success('Proveedor desasociado correctamente')
    },
    onError: (error: unknown) => {
      toast.error(getProductErrorMessage(error, 'detach-supplier'))
    },
  })

  if (detailQuery.isLoading || !values) {
    return (
      <ModalFrame maxWidth="max-w-[620px]" onClose={onClose} title="Editar Producto">
        <LoadingState label="Cargando datos del producto..." />
      </ModalFrame>
    )
  }

  if (detailQuery.isError || !detailQuery.data) {
    return (
      <ModalFrame maxWidth="max-w-[620px]" onClose={onClose} title="Editar Producto">
        <InlineError label="No fue posible cargar los datos reales del producto." />
      </ModalFrame>
    )
  }

  const detail = detailQuery.data
  const associatedSupplierIds = new Set(detail.suppliers.map((entry) => entry.supplier.id))
  const availableSuppliers = (suppliersResponse?.data ?? []).filter((supplierOption) => !associatedSupplierIds.has(supplierOption.id))
  const isPending = updateMutation.isPending || attachSupplierMutation.isPending || detachSupplierMutation.isPending

  const handleSubmit = () => {
    const validationError = validateProductForm(values, { requireStock: false })

    if (validationError) {
      toast.error(validationError)
      return
    }

    updateMutation.mutate()
  }

  return (
    <ModalFrame maxWidth="max-w-[620px]" onClose={onClose} title="Editar Producto">
      <div className="flex-1 space-y-6 overflow-y-auto px-5 py-5 sm:px-6">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-[4px] bg-[var(--color-surface-tint)] px-2 py-0.5 text-xs font-semibold uppercase tracking-[0.05em] text-[var(--color-primary)]">
              {detail.category?.name ?? 'Sin categoria'}
            </span>
            <span className={`rounded-[4px] px-2 py-0.5 text-xs font-semibold uppercase tracking-[0.05em] ${getStatusClasses(product.status)}`}>
              {product.status}
            </span>
          </div>
          <p className="mt-2 font-data-mono text-sm text-[var(--color-text-muted)]">{detail.code}</p>
        </div>

        <div className="grid gap-4">
          <FieldGroup label="Nombre del producto">
            <TextField onChange={(value) => setValues((current) => ({ ...current!, name: value }))} value={values.name} />
          </FieldGroup>
          <FieldGroup label="Codigo">
            <TextField mono onChange={(value) => setValues((current) => ({ ...current!, code: value }))} value={values.code} />
          </FieldGroup>
          <FieldGroup label="Marca">
            <TextField onChange={(value) => setValues((current) => ({ ...current!, brand: value }))} value={values.brand} />
          </FieldGroup>
          <FieldGroup label="Presentacion">
            <TextField onChange={(value) => setValues((current) => ({ ...current!, presentation: value }))} value={values.presentation} />
          </FieldGroup>
          <FieldGroup label="Principio activo">
            <TextField onChange={(value) => setValues((current) => ({ ...current!, activeIngredient: value }))} value={values.activeIngredient} />
          </FieldGroup>
          <FieldGroup label="Descripcion">
            <TextAreaField onChange={(value) => setValues((current) => ({ ...current!, description: value }))} value={values.description} />
          </FieldGroup>
          <FieldGroup label="Stock actual">
            <div className="rounded-[var(--radius-control)] border border-[var(--color-border)] bg-[var(--color-surface-strong)] px-3 py-2 font-data-mono text-sm text-[var(--color-text)]">
              {detail.stock}
            </div>
          </FieldGroup>
          <FieldGroup label="Stock minimo">
            <NumberField onChange={(value) => setValues((current) => ({ ...current!, minStock: value }))} value={values.minStock} />
          </FieldGroup>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <FieldGroup label="Categoria">
            <SelectField
              onChange={(value) => setValues((current) => ({ ...current!, categoryId: value }))}
              options={(categoriesResponse?.data ?? []).map((category) => ({ label: category.name, value: category.id }))}
              value={values.categoryId}
            />
          </FieldGroup>
          <FieldGroup label="Precio unitario">
            <NumberField onChange={(value) => setValues((current) => ({ ...current!, price: value }))} value={values.price} />
          </FieldGroup>
          <FieldGroup label="Unidad">
            <SelectField
              onChange={(value) => setValues((current) => ({ ...current!, unit: value as ProductUnit }))}
              options={unitOptions}
              value={values.unit}
            />
          </FieldGroup>
          <FieldGroup label="Contenido">
            <TextField mono onChange={(value) => setValues((current) => ({ ...current!, unitContent: value }))} value={values.unitContent} />
          </FieldGroup>
          <FieldGroup label="Ultima actualizacion">
            <div className="rounded-[var(--radius-control)] border border-[var(--color-border)] bg-[var(--color-surface-strong)] px-3 py-2 font-data-mono text-sm text-[var(--color-text-secondary)]">
              {formatDate(detail.updatedAt)}
            </div>
          </FieldGroup>
        </div>

        <div className="space-y-4 rounded-[var(--radius-panel)] border border-[var(--color-border)] bg-[var(--color-surface-strong)] p-4">
          <div>
            <h4 className="text-sm font-semibold text-[var(--color-text)]">Proveedores asociados</h4>
            <p className="mt-1 text-sm text-[var(--color-text-secondary)]">Las asociaciones reales se guardan por `supplierId`.</p>
          </div>

          <div className="space-y-2">
            {detail.suppliers.length === 0 ? (
              <p className="text-sm text-[var(--color-text-secondary)]">No hay proveedores asociados todavía.</p>
            ) : (
              detail.suppliers.map((entry) => (
                <div key={entry.supplier.id} className="flex items-center justify-between rounded-[var(--radius-control)] border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-2">
                  <div>
                    <p className="text-sm font-medium text-[var(--color-text)]">{entry.supplier.name}</p>
                    <p className="text-xs text-[var(--color-text-secondary)]">
                      Precio de referencia: {entry.referencePrice ? formatCurrency(Number(entry.referencePrice)) : 'Pendiente'}
                    </p>
                  </div>
                  <button
                    className="inline-flex items-center gap-2 rounded-[var(--radius-control)] px-3 py-2 text-sm font-medium text-[var(--color-danger-text)] transition hover:bg-[var(--color-danger-bg)] disabled:cursor-not-allowed disabled:opacity-50"
                    disabled={isPending}
                    onClick={() => detachSupplierMutation.mutate(entry.supplier.id)}
                    type="button"
                  >
                    <Trash2 className="h-4 w-4" />
                    Quitar
                  </button>
                </div>
              ))
            )}
          </div>

          <div className="grid gap-3 sm:grid-cols-[1fr_auto] sm:items-end">
            <FieldGroup label="Asociar proveedor">
              <SelectField
                onChange={(value) => setSelectedSupplierId(value)}
                options={availableSuppliers.map((supplierOption) => ({ label: supplierOption.name, value: supplierOption.id }))}
                placeholder="Seleccionar proveedor"
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
              Asociar
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
          Desactivar desde menu
        </button>
        <div className="flex justify-end gap-3">
          <Button disabled={isPending} onClick={onClose} type="button" variant="ghost">
            Cancelar
          </Button>
          <Button disabled={isPending} onClick={handleSubmit} type="button">
            {updateMutation.isPending ? <LoaderCircle className="mr-2 h-4 w-4 animate-spin" /> : null}
            Guardar cambios
          </Button>
        </div>
      </div>
    </ModalFrame>
  )
}

function RegisterMovementModal({ onClose, product, role }: { onClose: () => void; product: ProductRow; role: UserRole | undefined }) {
  const availableMovementTypes = (['IN', 'OUT', 'ADJUSTMENT'] as const).filter((type) => canCreateMovementType(role, type))
  const [movementType, setMovementType] = useState<'IN' | 'OUT' | 'ADJUSTMENT'>(availableMovementTypes[0] ?? 'OUT')
  const [adjustmentDirection, setAdjustmentDirection] = useState<'INCREASE' | 'DECREASE'>('INCREASE')
  const [quantity, setQuantity] = useState(10)
  const [reason, setReason] = useState<string>(movementTypeOptions[availableMovementTypes[0] ?? 'OUT'][0])
  const createMovementMutation = useCreateInventoryMovement()

  useEffect(() => {
    setReason(movementTypeOptions[movementType][0])
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
          {availableMovementTypes.map((type) => (
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
          {movementType === 'ADJUSTMENT' ? (
            <div className="space-y-1.5">
              <FieldLabel>Direccion del ajuste</FieldLabel>
              <div className="flex rounded-[var(--radius-control)] border border-[var(--color-border)] bg-[var(--color-surface-strong)] p-1">
                {([
                  { value: 'INCREASE', label: 'Incrementar' },
                  { value: 'DECREASE', label: 'Disminuir' },
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

          <FieldGroup label="Cantidad">
            <NumberField onChange={(value) => setQuantity(Number(value) || 0)} value={String(quantity)} />
          </FieldGroup>

           <FieldGroup label="Motivo">
            <SelectField
              onChange={(value) => setReason(value)}
              options={[...movementTypeOptions[movementType]].map((option) => ({ label: option, value: option }))}
              value={reason}
            />
           </FieldGroup>
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
        <Button disabled={createMovementMutation.isPending} onClick={onClose} type="button" variant="secondary">
          Cancelar
        </Button>
        <Button
          disabled={createMovementMutation.isPending}
          onClick={() => {
            if (quantity <= 0) {
              toast.error('La cantidad debe ser mayor que cero')
              return
            }

            if (!reason.trim()) {
              toast.error('Seleccione un motivo para el movimiento')
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
                  toast.error(getInventoryMovementErrorMessage(error))
                },
                onSuccess: () => {
                  toast.success('Movimiento registrado correctamente')
                  onClose()
                },
              },
            )
          }}
          type="button"
        >
          {createMovementMutation.isPending ? <LoaderCircle className="mr-2 h-4 w-4 animate-spin" /> : null}
          Registrar
        </Button>
      </div>
    </ModalFrame>
  )
}

function ReplenishmentModal({ onClose, product }: { onClose: () => void; product: ProductRow }) {
  return <GenerateReplenishmentModal initialProduct={product} onClose={onClose} />
}

function DeactivateProductModal({ onClose, product }: { onClose: () => void; product: ProductRow }) {
  const queryClient = useQueryClient()

  const deleteMutation = useMutation({
    mutationFn: () => deleteProduct(product.id),
    onSuccess: async () => {
      await invalidateProductCollections(queryClient, product.id)
      toast.success('Producto desactivado correctamente')
      onClose()
    },
    onError: (error: unknown) => {
      toast.error(getProductErrorMessage(error, 'delete'))
    },
  })

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
        <Button disabled={deleteMutation.isPending} onClick={onClose} type="button" variant="secondary">
          Cancelar
        </Button>
        <button
          className="inline-flex min-h-10 items-center justify-center rounded-[var(--radius-control)] bg-[var(--color-danger-text)] px-4 py-2 text-sm font-medium text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-70"
          disabled={deleteMutation.isPending}
          onClick={() => deleteMutation.mutate()}
          type="button"
        >
          {deleteMutation.isPending ? <LoaderCircle className="mr-2 h-4 w-4 animate-spin" /> : null}
          Desactivar
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
  return (
    <div className="space-y-4">
      <FieldGroup label="Nombre del producto">
        <input
          className={`w-full rounded-[var(--radius-control)] border px-3 py-2 text-sm text-[var(--color-text)] outline-none ${showError ? 'border-[var(--color-danger-text)] bg-[color:rgba(176,48,31,0.04)]' : 'border-[var(--color-border)] bg-[var(--color-surface)]'}`}
          onChange={(event) => onChange((current) => ({ ...current, name: event.target.value }))}
          placeholder="Ej. Amoxicilina 500mg"
          type="text"
          value={values.name}
        />
        {showError ? (
          <p className="flex items-center gap-1 text-xs text-[var(--color-danger-text)]">
            <CircleAlert className="h-3.5 w-3.5" />
            El nombre es obligatorio
          </p>
        ) : null}
      </FieldGroup>

      <div className="grid gap-4 sm:grid-cols-2">
        <FieldGroup label="SKU / Codigo">
          <TextField mono onChange={(value) => onChange((current) => ({ ...current, code: value }))} placeholder="SKU-" value={values.code} />
        </FieldGroup>
        <FieldGroup label="Principio activo">
          <TextField onChange={(value) => onChange((current) => ({ ...current, activeIngredient: value }))} placeholder="Ej. Ibuprofeno" value={values.activeIngredient} />
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
  return (
    <div className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <FieldGroup label="Categoria">
          <SelectField
            onChange={(value) => onChange((current) => ({ ...current, categoryId: value }))}
            options={categories.map((category) => ({ label: category.name, value: category.id }))}
            placeholder="Seleccionar"
            value={values.categoryId}
          />
        </FieldGroup>
        <FieldGroup label="Precio (USD)">
          <NumberField onChange={(value) => onChange((current) => ({ ...current, price: value }))} placeholder="0.00" value={values.price} />
        </FieldGroup>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <FieldGroup label="Proveedor inicial">
          <SelectField
            onChange={(value) => onChange((current) => ({ ...current, supplierId: value }))}
            options={suppliers.map((supplierOption) => ({ label: supplierOption.name, value: supplierOption.id }))}
            placeholder="Seleccionar"
            value={values.supplierId}
          />
        </FieldGroup>
        <FieldGroup label="Marca">
          <TextField onChange={(value) => onChange((current) => ({ ...current, brand: value }))} value={values.brand} />
        </FieldGroup>
      </div>

      <FieldGroup label="Presentacion">
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
      <option value="">{placeholder ?? 'Seleccionar'}</option>
      {options.map((option) => (
        <option key={option.value} value={option.value}>
          {option.label}
        </option>
      ))}
    </select>
  )
}

function ModalFooter({
  isPending,
  onClose,
  onConfirm,
  primaryLabel,
}: {
  isPending: boolean
  onClose: () => void
  onConfirm: () => void
  primaryLabel: string
}) {
  return (
    <div className="flex items-center justify-end gap-3 border-t border-[var(--color-border)] bg-[var(--color-surface-strong)] px-5 py-4 sm:px-6">
      <Button disabled={isPending} onClick={onClose} type="button" variant="ghost">
        Cancelar
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

function getStatusClasses(status: string) {
  if (status === 'Optimo') {
    return 'bg-[var(--color-success-bg)] text-[var(--color-success-text)]'
  }

  if (status === 'Critico') {
    return 'bg-[var(--color-warning-bg)] text-[var(--color-warning-text)]'
  }

  return 'bg-[var(--color-danger-bg)] text-[var(--color-danger-text)]'
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

function validateProductForm(values: ProductFormValues, options: { requireStock: boolean }) {
  if (!values.name.trim()) {
    return 'El nombre del producto es obligatorio'
  }

  if (!values.code.trim()) {
    return 'El código del producto es obligatorio'
  }

  if (!values.categoryId) {
    return 'Seleccione una categoría válida'
  }

  if (!values.unitContent.trim()) {
    return 'El contenido por unidad es obligatorio'
  }

  if (values.price.trim() && Number(values.price) < 0) {
    return 'El precio no puede ser negativo'
  }

  if (Number(values.minStock || 0) < 0) {
    return 'El stock mínimo no puede ser negativo'
  }

  if (options.requireStock && Number(values.stock || 0) < 0) {
    return 'El stock inicial no puede ser negativo'
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
) {
  if (!isAxiosError<ApiErrorEnvelope>(error)) {
    return 'Ocurrió un error inesperado al gestionar productos'
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
      return 'Ya existe un producto con ese código'
    }
  }

  if (
    code.includes('CATEGORY') ||
    normalizedMessage.includes('categor')
  ) {
    return 'La categoría seleccionada ya no existe'
  }

  if (
    code.includes('SUPPLIER') ||
    normalizedMessage.includes('proveedor')
  ) {
    return action === 'attach-supplier' || action === 'detach-supplier'
      ? 'El proveedor seleccionado ya no existe o no se pudo asociar'
      : 'El proveedor seleccionado ya no existe'
  }

  if (status === 409) {
    return 'No se pudo desactivar el producto por una restricción del backend'
  }

  if (status === 404 || code.includes('NOT_FOUND')) {
    return 'El producto ya no existe o no pudo encontrarse'
  }

  if (message) {
    return message
  }

  if (action === 'attach-supplier' || action === 'detach-supplier') {
    return 'No fue posible actualizar los proveedores asociados del producto'
  }

  return 'No fue posible completar la operación sobre productos'
}

function getInventoryMovementErrorMessage(error: unknown) {
  if (!isAxiosError<ApiErrorEnvelope>(error)) {
    return 'No fue posible registrar el movimiento'
  }

  return error.response?.data.message?.trim() || 'No fue posible registrar el movimiento'
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
