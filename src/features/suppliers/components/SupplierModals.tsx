import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { isAxiosError } from 'axios'
import type { TFunction } from 'i18next'
import {
  CircleAlert,
  LoaderCircle,
  MessageCircle,
  Plus,
  Search,
  Store,
  Trash2,
  X,
} from 'lucide-react'
import { type ReactNode, useEffect, useState } from 'react'
import toast from 'react-hot-toast'
import { useTranslation } from 'react-i18next'

import { Button } from '@/components/ui/Button'
import { useCategories } from '@/features/categories/api/useCategories'
import { canManageSuppliers } from '@/features/auth/lib/permissions'
import { GenerateReplenishmentModal } from '@/features/replenishment/components/ReplenishmentModals'
import {
  attachProductSupplier,
  detachProductSupplier,
  listProductSuppliers,
  listProducts,
  type AttachProductSupplierInput,
} from '@/features/products/api/products.api'
import {
  createSupplier,
  deleteSupplier,
  updateSupplier,
  type CreateSupplierInput,
  type UpdateSupplierInput,
} from '@/features/suppliers/api/suppliers.api'
import type { SupplierRow } from '@/features/suppliers/lib/supplierRows'
import { queryKeys } from '@/lib/queryKeys'
import { formatDate } from '@/lib/utils'
import type { ApiErrorEnvelope, Product, ProductSupplierEntry, UserRole } from '@/types/api.types'

type SuppliersTFunction = TFunction<['suppliers', 'common']>

export type SupplierModalType = 'create' | 'detail' | 'edit' | 'associate-products'

interface SupplierModalsProps {
  modalType: SupplierModalType | null
  supplier: SupplierRow | null
  onClose: () => void
  onOpenModal: (modalType: SupplierModalType, supplier: SupplierRow | null) => void
  role: UserRole | undefined
}

interface SupplierFormValues {
  name: string
  rif: string
  whatsapp: string
  address: string
}

interface SupplierProductDraft {
  id: string
  code: string
  name: string
  categoryName: string
  referencePrice: string
  stock: number
  minStock: number
  isNew: boolean
  originalReferencePrice: string
}


const CATEGORY_QUERY_PARAMS = { limit: 100 }
const PRODUCT_PAGE_SIZE = 100

export function SupplierModals({ modalType, supplier, onClose, onOpenModal, role }: SupplierModalsProps) {
  const { t } = useTranslation(['suppliers', 'common'])
  const canManage = canManageSuppliers(role)
  const queryClient = useQueryClient()

  const invalidateSupplierViews = async () => {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: queryKeys.suppliers.all }),
      queryClient.invalidateQueries({ queryKey: queryKeys.products.all }),
      queryClient.invalidateQueries({ queryKey: queryKeys.replenishmentRequests.all }),
    ])
  }

  const createMutation = useMutation({
    mutationFn: (input: CreateSupplierInput) => createSupplier(input),
    onSuccess: async () => {
      await invalidateSupplierViews()
      toast.success(t('suppliers:toasts.created'))
      onClose()
    },
    onError: (error: unknown) => {
      toast.error(getSupplierErrorMessage(error, 'create', t))
    },
  })

  const updateMutation = useMutation({
    mutationFn: ({ supplierId, input }: { supplierId: string; input: UpdateSupplierInput }) =>
      updateSupplier(supplierId, input),
    onSuccess: async () => {
      await invalidateSupplierViews()
      toast.success(t('suppliers:toasts.updated'))
      onClose()
    },
    onError: (error: unknown) => {
      toast.error(getSupplierErrorMessage(error, 'update', t))
    },
  })

  const deactivateMutation = useMutation({
    mutationFn: (supplierId: string) => deleteSupplier(supplierId),
    onSuccess: async () => {
      await invalidateSupplierViews()
      toast.success(t('suppliers:toasts.deactivated'))
      onClose()
    },
    onError: (error: unknown) => {
      toast.error(getSupplierErrorMessage(error, 'deactivate', t))
    },
  })

  if (modalType === 'create') {
    return (
      <CreateSupplierModal
        isSubmitting={createMutation.isPending}
        onClose={onClose}
        onSubmit={(values) => createMutation.mutate(normalizeSupplierPayload(values))}
      />
    )
  }

  if (!supplier) {
    return null
  }

  if (modalType === 'detail') {
    return (
      <SupplierDetailModal
        canManage={canManage}
        isDeactivating={deactivateMutation.isPending}
        onClose={onClose}
        onDeactivate={() => deactivateMutation.mutate(supplier.id)}
        onEdit={() => onOpenModal('edit', supplier)}
        supplier={supplier}
      />
    )
  }

  if (modalType === 'edit') {
    return (
      <EditSupplierModal
        isDeactivating={deactivateMutation.isPending}
        isSubmitting={updateMutation.isPending}
        onClose={onClose}
        onDeactivate={() => deactivateMutation.mutate(supplier.id)}
        onSubmit={(values) =>
          updateMutation.mutate({
            supplierId: supplier.id,
            input: normalizeSupplierPayload(values),
          })
        }
        supplier={supplier}
      />
    )
  }

  if (modalType === 'associate-products') {
    return <AssociateProductsModal onClose={onClose} supplier={supplier} />
  }

  return null
}

function CreateSupplierModal({
  isSubmitting,
  onClose,
  onSubmit,
}: {
  isSubmitting: boolean
  onClose: () => void
  onSubmit: (values: SupplierFormValues) => void
}) {
  const { t } = useTranslation(['suppliers', 'common'])

  return (
    <ModalFrame onClose={onClose} title={t('suppliers:modals.create.title')}>
      <div className="max-h-[614px] flex-1 space-y-6 overflow-y-auto px-6 py-6">
        <SupplierForm isSubmitting={isSubmitting} onClose={onClose} onSubmit={onSubmit} />
      </div>
    </ModalFrame>
  )
}

function EditSupplierModal({
  isDeactivating,
  isSubmitting,
  onClose,
  onDeactivate,
  onSubmit,
  supplier,
}: {
  isDeactivating: boolean
  isSubmitting: boolean
  onClose: () => void
  onDeactivate: () => void
  onSubmit: (values: SupplierFormValues) => void
  supplier: SupplierRow
}) {
  const { t } = useTranslation(['suppliers', 'common'])

  return (
    <ModalFrame
      onClose={onClose}
      title={t('suppliers:modals.edit.title')}
      titleSuffix={t('suppliers:modals.edit.titleSuffix', {
        name: supplier.name,
        status: supplier.active ? t('suppliers:status.activeLower') : t('suppliers:status.inactiveLower'),
      })}
    >
      <div className="max-h-[614px] flex-1 space-y-6 overflow-y-auto px-6 py-6">
        <SupplierForm
          isSubmitting={isSubmitting || isDeactivating}
          onClose={onClose}
          onDeactivate={onDeactivate}
          onSubmit={onSubmit}
          supplier={supplier}
        />
      </div>
    </ModalFrame>
  )
}

function SupplierDetailModal({
  canManage,
  isDeactivating,
  onClose,
  onDeactivate,
  onEdit,
  supplier,
}: {
  canManage: boolean
  isDeactivating: boolean
  onClose: () => void
  onDeactivate: () => void
  onEdit: () => void
  supplier: SupplierRow
}) {
  const { t } = useTranslation(['suppliers', 'common'])
  const [showReplenishment, setShowReplenishment] = useState(false)

  return (
    <>
    <ModalFrame maxWidth="max-w-[640px]" onClose={onClose} paddingless>
      <div className="border-b border-[var(--color-border)] px-6 py-5">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-start gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-[10px] bg-[var(--color-success-bg)] text-[var(--color-success-text)]">
              <Store className="h-6 w-6" />
            </div>
            <div>
              <div className="mb-1 flex items-center gap-3">
                <h2 className="text-[18px] font-medium text-[var(--color-text)]">{supplier.name}</h2>
                <span className={`rounded-[4px] px-2 py-0.5 text-xs font-semibold uppercase tracking-[0.05em] ${supplier.active ? 'bg-[var(--color-success-bg)] text-[var(--color-success-text)]' : 'bg-[var(--color-surface-strong)] text-[var(--color-text-secondary)]'}`}>
                  {supplier.active ? t('suppliers:status.active') : t('suppliers:status.inactive')}
                </span>
              </div>
              <p className="font-data-mono text-sm text-[var(--color-text-muted)]">{supplier.rif ?? t('suppliers:modals.detail.noRifRegistered')}</p>
            </div>
          </div>
          <div className="flex items-center gap-2 text-[var(--color-text-secondary)]">
            <button
              className="rounded-lg p-2 transition hover:bg-[var(--color-surface-strong)] hover:text-[var(--color-text)]"
              onClick={onClose}
              type="button"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>
      </div>

      <div className="max-h-[70vh] space-y-6 overflow-y-auto p-6">
        <div className="grid gap-4 md:grid-cols-3">
          <MetricPanel label={t('suppliers:modals.detail.metrics.associatedProducts')} value={String(supplier.productsCount)} />
          <MetricPanel label={t('suppliers:modals.detail.metrics.requestsThisMonth')} value={t('suppliers:modals.detail.metrics.pending')} />
          <MetricPanel label={t('suppliers:modals.detail.metrics.lastReplenishment')} value={t('suppliers:modals.detail.metrics.pending')} />
        </div>

        <div>
          <h3 className="mb-3 text-xs font-semibold uppercase tracking-[0.05em] text-[var(--color-text)]">{t('suppliers:modals.detail.contact.heading')}</h3>
          <div className="grid gap-x-6 gap-y-4 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface-strong)] p-4 md:grid-cols-2">
            <ContactField label={t('suppliers:modals.detail.contact.mainContact')} value={t('suppliers:modals.detail.contact.mainContactValue')} />
            <div className="space-y-1">
              <span className="text-sm text-[var(--color-text-muted)]">{t('suppliers:modals.detail.contact.whatsapp')}</span>
              {supplier.whatsapp ? (
                <>
                  <div className="flex items-center gap-2">
                    <MessageCircle className="h-4 w-4 text-[var(--color-success-text)]" />
                    <span className="font-data-mono text-sm text-[var(--color-text)]">{formatSupplierPhone(supplier.whatsapp)}</span>
                  </div>
                  <a className="inline-block text-sm text-[var(--color-success-text)] hover:underline" href={toWhatsappHref(supplier.whatsapp)} rel="noreferrer" target="_blank">
                    {t('suppliers:modals.detail.contact.sendMessage')}
                  </a>
                </>
              ) : (
                <span className="text-sm text-[var(--color-text-secondary)]">{t('common:state.notAvailable')}</span>
              )}
            </div>
            <ContactField label={t('suppliers:modals.detail.contact.email')} value={t('common:state.notAvailable')} />
            <ContactField label={t('suppliers:modals.detail.contact.address')} value={supplier.address ?? t('common:state.notAvailable')} fullWidth />
            <ContactField label={t('suppliers:modals.detail.contact.registeredOn')} mono value={formatDate(supplier.createdAt)} fullWidth secondaryDivider />
          </div>
        </div>

      </div>

      <div className="flex flex-col items-center justify-between gap-4 border-t border-[var(--color-border)] bg-[var(--color-surface-strong)] px-6 py-4 sm:flex-row">
        {canManage ? (
          <button
            className="inline-flex w-full items-center justify-center gap-2 rounded-lg px-4 py-2 text-sm font-medium text-[var(--color-danger-text)] transition hover:bg-[var(--color-danger-bg)] sm:w-auto disabled:cursor-not-allowed disabled:opacity-60"
            disabled={isDeactivating}
            onClick={onDeactivate}
            type="button"
          >
            {isDeactivating ? <LoaderCircle className="h-4 w-4 animate-spin" /> : null}
            {t('suppliers:modals.detail.deactivateButton')}
          </button>
        ) : <div />}

        <div className="flex w-full flex-col gap-3 sm:w-auto sm:flex-row">
          <Button onClick={onClose} type="button" variant="ghost">
            {t('suppliers:modals.detail.closeButton')}
          </Button>
          {canManage ? (
            <Button onClick={onEdit} type="button" variant="secondary">
              {t('suppliers:modals.detail.editButton')}
            </Button>
          ) : null}
          {canManage ? (
            <Button onClick={() => setShowReplenishment(true)} type="button">
              {t('suppliers:modals.detail.newRequestButton')}
            </Button>
          ) : null}
        </div>
      </div>
    </ModalFrame>
    {showReplenishment ? (
      <GenerateReplenishmentModal
        initialSupplierId={supplier.id}
        onClose={() => setShowReplenishment(false)}
      />
    ) : null}
    </>
  )
}

function AssociateProductsModal({ onClose, supplier }: { onClose: () => void; supplier: SupplierRow }) {
  const { t } = useTranslation(['suppliers', 'common'])
  const [catalogSearch, setCatalogSearch] = useState('')
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const [draftRows, setDraftRows] = useState<SupplierProductDraft[]>([])
  const [isDraftReady, setIsDraftReady] = useState(false)
  const { data: categoriesResponse } = useCategories(CATEGORY_QUERY_PARAMS)
  const queryClient = useQueryClient()

  const categoryNames = new Map(
    (categoriesResponse?.data ?? []).map((category) => [category.id, category.name]),
  )

  const associatedProductsQuery = useQuery({
    queryKey: ['suppliers', supplier.id, 'associate-products', 'current-links'],
    queryFn: async () => {
      const response = await listProducts({ pageSize: PRODUCT_PAGE_SIZE, supplierId: supplier.id })

      return Promise.all(
        response.data.map(async (product) => {
          const suppliers = await listProductSuppliers(product.id)
          const currentLink = suppliers.find((entry) => entry.supplier.id === supplier.id) ?? null

          return toSupplierDraftRow(product, categoryNames.get(product.categoryId), currentLink, false, t)
        }),
      )
    },
  })

  const catalogProductsQuery = useQuery({
    queryKey: ['suppliers', supplier.id, 'associate-products', 'catalog', catalogSearch],
    queryFn: async () => {
      const response = await listProducts({
        active: true,
        pageSize: PRODUCT_PAGE_SIZE,
        search: catalogSearch.trim() || undefined,
      })

      return response.data
    },
  })

  useEffect(() => {
    if (!associatedProductsQuery.data || isDraftReady) {
      return
    }

    setDraftRows(associatedProductsQuery.data)
    setIsDraftReady(true)
  }, [associatedProductsQuery.data, isDraftReady])

  const saveAssociationsMutation = useMutation({
    mutationFn: async () => {
      const originalRows = associatedProductsQuery.data ?? []
      const originalMap = new Map(originalRows.map((row) => [row.id, row]))
      const currentMap = new Map(draftRows.map((row) => [row.id, row]))

      const removedRows = originalRows.filter((row) => !currentMap.has(row.id))
      const newRows = draftRows.filter((row) => !originalMap.has(row.id))
      const repricedRows = draftRows.filter((row) => {
        const originalRow = originalMap.get(row.id)
        return Boolean(originalRow) && originalRow?.referencePrice !== row.referencePrice
      })

      for (const row of removedRows) {
        await detachProductSupplier(row.id, supplier.id)
      }

      for (const row of repricedRows) {
        await detachProductSupplier(row.id, supplier.id)
        await attachProductSupplier(row.id, buildProductSupplierPayload(supplier.id, row.referencePrice))
      }

      for (const row of newRows) {
        await attachProductSupplier(row.id, buildProductSupplierPayload(supplier.id, row.referencePrice))
      }
    },
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: queryKeys.suppliers.all }),
        queryClient.invalidateQueries({ queryKey: queryKeys.products.all }),
        queryClient.invalidateQueries({ queryKey: ['suppliers', supplier.id, 'linked-products'] }),
        queryClient.invalidateQueries({ queryKey: ['suppliers', supplier.id, 'associate-products'] }),
      ])

      toast.success(t('suppliers:toasts.associationsSaved'))
      onClose()
    },
    onError: (error: unknown) => {
      toast.error(getProductAssociationErrorMessage(error, t))
    },
  })

  const draftIds = new Set(draftRows.map((row) => row.id))
  const catalogRows = (catalogProductsQuery.data ?? []).map((product) => {
    const alreadyAssociated = draftIds.has(product.id)

    return {
      ...product,
      alreadyAssociated,
      categoryName: categoryNames.get(product.categoryId) ?? t('suppliers:fallback.noCategory'),
    }
  })

  const handleAddSelected = () => {
    const selectedProducts = (catalogProductsQuery.data ?? []).filter((product) => selectedIds.includes(product.id))

    if (selectedProducts.length === 0) {
      toast.error(t('suppliers:validation.selectAtLeastOneProduct'))
      return
    }

    setDraftRows((current) => {
      const currentIds = new Set(current.map((row) => row.id))
      const incomingRows = selectedProducts
        .filter((product) => !currentIds.has(product.id))
        .map((product) => toSupplierDraftRow(product, categoryNames.get(product.categoryId), null, true, t))

      return [...current, ...incomingRows]
    })
    setSelectedIds([])
  }

  return (
    <ModalFrame maxWidth="max-w-[620px]" onClose={onClose} paddingless>
      <div className="flex items-start justify-between border-b border-[var(--color-border)] px-6 py-6">
        <div>
          <h2 className="text-[20px] font-semibold text-[var(--color-text)]">{t('suppliers:modals.associateProducts.title')}</h2>
          <p className="mt-1 text-sm text-[var(--color-text-secondary)]">{supplier.name}</p>
        </div>
        <button className="text-[var(--color-text-muted)] transition hover:text-[var(--color-text)]" onClick={onClose} type="button">
          <X className="h-6 w-6" />
        </button>
      </div>

      <div className="max-h-[75vh] space-y-6 overflow-y-auto px-6 py-6">
        <div className="space-y-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <label className="relative flex-1">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--color-text-muted)]" />
              <input
                className="w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] py-2 pl-10 pr-4 text-sm text-[var(--color-text)] outline-none transition focus:border-[var(--color-primary)] focus:ring-1 focus:ring-[var(--color-primary)]"
                onChange={(event) => setCatalogSearch(event.target.value)}
                placeholder={t('suppliers:modals.associateProducts.searchPlaceholder')}
                type="text"
                value={catalogSearch}
              />
            </label>
            <button
              className="inline-flex items-center gap-2 rounded-lg border border-[var(--color-primary)] px-4 py-2 text-sm font-medium text-[var(--color-primary)] transition hover:bg-[var(--color-surface-strong)]"
              onClick={() => toast(t('suppliers:modals.associateProducts.newProductToast'))}
              type="button"
            >
              <Plus className="h-4 w-4" />
              {t('suppliers:modals.associateProducts.newProductButton')}
            </button>
          </div>

          <div>
            <h3 className="mb-2 text-xs font-semibold uppercase tracking-[0.05em] text-[var(--color-text-secondary)]">{t('suppliers:modals.associateProducts.catalogHeading')}</h3>
            <div className="max-h-[160px] overflow-y-auto rounded border border-[var(--color-border)] bg-[var(--color-page-bg)]/30">
              {catalogProductsQuery.isLoading ? (
                <LoadingState label={t('suppliers:modals.associateProducts.loadingCatalog')} compact />
              ) : catalogProductsQuery.isError ? (
                <InlineError label={t('suppliers:modals.associateProducts.catalogLoadError')} compact />
              ) : catalogRows.length === 0 ? (
                <EmptyState label={t('suppliers:modals.associateProducts.catalogEmpty')} compact />
              ) : (
                catalogRows.map((product) => {
                  const isChecked = selectedIds.includes(product.id)

                  return (
                    <label
                      key={product.id}
                      className={`flex cursor-pointer items-center border-b border-[var(--color-border)] p-3 last:border-b-0 ${product.alreadyAssociated ? 'cursor-not-allowed bg-[var(--color-surface)] opacity-50' : 'hover:bg-[var(--color-surface-strong)]'}`}
                    >
                      <input
                        checked={isChecked}
                        className="mr-3 h-4 w-4 rounded border-[var(--color-border)] text-[var(--color-primary)] focus:ring-[var(--color-primary)]"
                        disabled={product.alreadyAssociated}
                        onChange={() => {
                          setSelectedIds((current) =>
                            current.includes(product.id)
                              ? current.filter((id) => id !== product.id)
                              : [...current, product.id],
                          )
                        }}
                        type="checkbox"
                      />
                      <div className="flex flex-1 items-center justify-between gap-4">
                        <span className="text-sm font-medium text-[var(--color-text)]">{product.name}</span>
                        <div className="flex items-center gap-4">
                          <span className="font-data-mono text-xs text-[var(--color-text-secondary)]">SKU: {product.code}</span>
                          {product.alreadyAssociated ? (
                            <span className="text-sm italic text-[var(--color-text-secondary)]">{t('suppliers:modals.associateProducts.alreadyAssociated')}</span>
                          ) : (
                            <span className={`rounded px-2 py-0.5 font-data-mono text-xs ${product.stock <= product.minStock ? 'bg-[var(--color-warning-bg)] text-[var(--color-warning-text)]' : 'bg-[var(--color-success-bg)] text-[var(--color-success-text)]'}`}>
                              {t('suppliers:modals.associateProducts.stockCount', { count: product.stock })}
                            </span>
                          )}
                        </div>
                      </div>
                    </label>
                  )
                })
              )}
            </div>
          </div>

          <div className="flex justify-end">
            <Button onClick={handleAddSelected} type="button" variant="secondary">
              {t('suppliers:modals.associateProducts.addSelectedButton')}
            </Button>
          </div>
        </div>

        <div className="h-px w-full bg-[var(--color-border)]" />

        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-semibold uppercase tracking-[0.05em] text-[var(--color-text-secondary)]">{t('suppliers:modals.associateProducts.draftHeading')}</h3>
            <span className="font-data-mono text-xs text-[var(--color-primary)]">{t('suppliers:modals.associateProducts.draftCount', { count: draftRows.length })}</span>
          </div>

          <div className="overflow-hidden rounded border border-[var(--color-border)]">
            <table className="w-full border-collapse text-left">
              <thead className="border-b border-[var(--color-border)] bg-[var(--color-page-bg)]">
                <tr>
                  <th className="p-3 text-xs font-semibold text-[var(--color-text-secondary)]">{t('suppliers:modals.associateProducts.table.product')}</th>
                  <th className="p-3 text-xs font-semibold text-[var(--color-text-secondary)]">{t('suppliers:modals.associateProducts.table.supplierCode')}</th>
                  <th className="p-3 text-xs font-semibold text-[var(--color-text-secondary)]">{t('suppliers:modals.associateProducts.table.price')}</th>
                  <th className="p-3 text-right text-xs font-semibold text-[var(--color-text)]">{t('suppliers:modals.associateProducts.table.action')}</th>
                </tr>
              </thead>
              <tbody>
                {draftRows.length === 0 ? (
                  <tr>
                    <td className="p-4 text-sm text-[var(--color-text-secondary)]" colSpan={4}>
                      {t('suppliers:modals.associateProducts.empty')}
                    </td>
                  </tr>
                ) : (
                  draftRows.map((row) => (
                    <tr key={row.id} className={`${row.isNew ? 'bg-[var(--color-surface-tint)]/12' : ''} border-b border-[var(--color-border)] last:border-b-0`}>
                      <td className={`p-3 text-sm ${row.isNew ? 'font-medium text-[var(--color-primary)]' : 'text-[var(--color-text)]'}`}>
                        {row.name}
                      </td>
                      <td className="p-3">
                        <input
                          className={`w-full border-none bg-transparent p-0 font-data-mono text-sm outline-none ${row.isNew ? 'border-b border-dashed border-[var(--color-primary)]/30 pb-1 text-[var(--color-primary)] placeholder:text-[var(--color-primary)]/50' : 'text-[var(--color-text-secondary)]'}`}
                          placeholder={t('suppliers:modals.associateProducts.pricePendingPlaceholder')}
                          readOnly
                          value=""
                        />
                      </td>
                      <td className="p-3">
                        <input
                          className={`w-full border-none bg-transparent p-0 font-data-mono text-sm outline-none ${row.isNew ? 'text-[var(--color-primary)]' : 'text-[var(--color-text)]'}`}
                          onChange={(event) =>
                            setDraftRows((current) =>
                              current.map((currentRow) =>
                                currentRow.id === row.id
                                  ? { ...currentRow, referencePrice: event.target.value }
                                  : currentRow,
                              ),
                            )
                          }
                          placeholder={t('suppliers:modals.associateProducts.priceInputPlaceholder')}
                          type="text"
                          value={row.referencePrice}
                        />
                      </td>
                      <td className="p-3 text-right">
                        <button
                          className="text-[var(--color-danger-text)] transition hover:opacity-80"
                          onClick={() => setDraftRows((current) => current.filter((currentRow) => currentRow.id !== row.id))}
                          type="button"
                        >
                          <Trash2 className="ml-auto h-4 w-4" />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          <p className="flex items-start gap-2 text-sm text-[var(--color-text-secondary)]">
            <CircleAlert className="mt-0.5 h-4 w-4 shrink-0" />
            {t('suppliers:modals.associateProducts.priceInfo')}
          </p>
        </div>
      </div>

      <div className="flex items-center justify-end gap-3 border-t border-[var(--color-border)] bg-[var(--color-page-bg)]/50 px-6 py-6">
        <Button onClick={onClose} type="button" variant="ghost">
          {t('suppliers:modals.associateProducts.cancelButton')}
        </Button>
        <Button disabled={saveAssociationsMutation.isPending || associatedProductsQuery.isLoading} onClick={() => saveAssociationsMutation.mutate()} type="button">
          {saveAssociationsMutation.isPending ? <LoaderCircle className="mr-2 h-4 w-4 animate-spin" /> : null}
          {t('suppliers:modals.associateProducts.saveButton')}
        </Button>
      </div>
    </ModalFrame>
  )
}

function SupplierForm({
  isSubmitting,
  onClose,
  onDeactivate,
  onSubmit,
  supplier,
}: {
  isSubmitting: boolean
  onClose: () => void
  onDeactivate?: () => void
  onSubmit: (values: SupplierFormValues) => void
  supplier?: SupplierRow
}) {
  const { t } = useTranslation(['suppliers', 'common'])
  const [name, setName] = useState(supplier?.name ?? '')
  const [rif, setRif] = useState(supplier?.rif ?? '')
  const [whatsapp, setWhatsapp] = useState(stripCountryCode(supplier?.whatsapp))
  const [address, setAddress] = useState(supplier?.address ?? '')

  const handleSubmit = () => {
    if (!name.trim()) {
      toast.error(t('suppliers:validation.nameRequired'))
      return
    }

    onSubmit({
      name,
      rif,
      whatsapp,
      address,
    })
  }

  return (
    <div className="space-y-6">
      <form
        className="space-y-6"
        onSubmit={(event) => {
          event.preventDefault()
          handleSubmit()
        }}
      >
        <Field>
          <FieldLabel>{t('suppliers:form.nameLabel')}</FieldLabel>
          <TextInput onChange={setName} placeholder={t('suppliers:form.namePlaceholder')} value={name} />
        </Field>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <Field>
            <FieldLabel>{t('suppliers:form.rifLabel')}</FieldLabel>
            <TextInput mono onChange={setRif} placeholder={t('suppliers:form.rifPlaceholder')} value={rif} />
          </Field>
          {supplier ? <ReadonlyStatusField active={supplier.active} /> : null}
        </div>

        <Field>
          <FieldLabel icon={<MessageCircle className="h-4 w-4 text-[var(--color-success-text)]" />}>{t('suppliers:form.whatsappLabel')}</FieldLabel>
          <PhoneInput helper={t('suppliers:form.whatsappHelper')} onChange={setWhatsapp} value={whatsapp} />
        </Field>

        <Field>
          <FieldLabel>{t('suppliers:form.addressLabel')}</FieldLabel>
          <textarea
            className="w-full resize-none rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-2 text-sm text-[var(--color-text)] outline-none transition focus:border-[var(--color-primary)] focus:ring-1 focus:ring-[var(--color-primary)]"
            onChange={(event) => setAddress(event.target.value)}
            placeholder={t('suppliers:form.addressPlaceholder')}
            rows={2}
            value={address}
          />
        </Field>
      </form>

      <div className="flex items-center justify-between border-t border-[var(--color-border)] bg-[var(--color-surface)] pt-4">
        <div>
          {supplier ? (
            <button
              className="rounded-lg px-2 py-1.5 text-sm font-medium text-[var(--color-danger-text)] transition hover:bg-[var(--color-danger-bg)] disabled:cursor-not-allowed disabled:opacity-50"
              disabled={isSubmitting}
              onClick={onDeactivate}
              type="button"
            >
              {t('suppliers:form.deactivateButton')}
            </button>
          ) : null}
        </div>
        <div className="flex gap-3">
          <Button disabled={isSubmitting} onClick={onClose} type="button" variant="ghost">
            {t('suppliers:form.cancelButton')}
          </Button>
          <button
            className="inline-flex min-h-10 items-center rounded-lg bg-[var(--color-primary)] px-4 py-2 text-sm font-medium text-white transition hover:bg-[var(--color-primary-strong)] disabled:cursor-not-allowed disabled:opacity-70"
            disabled={isSubmitting}
            onClick={handleSubmit}
            type="button"
          >
            {isSubmitting ? <LoaderCircle className="mr-2 h-4 w-4 animate-spin" /> : null}
            {supplier ? t('suppliers:form.saveButton') : t('suppliers:form.createButton')}
          </button>
        </div>
      </div>
    </div>
  )
}

function ModalFrame({
  children,
  maxWidth = 'max-w-[520px]',
  onClose,
  paddingless = false,
  title,
  titleSuffix,
}: {
  children: ReactNode
  maxWidth?: string
  onClose: () => void
  paddingless?: boolean
  title?: string
  titleSuffix?: string
}) {
  const { t } = useTranslation(['suppliers', 'common'])

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <button className="absolute inset-0 bg-[#23323d]/60 backdrop-blur-sm" onClick={onClose} type="button" />
      <div aria-label={title ?? t('suppliers:modalFrame.defaultAriaLabel')} aria-modal="true" className={`relative z-10 flex w-full ${maxWidth} flex-col rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] shadow-lg`} role="dialog">
        {paddingless ? null : (
          <div className="flex items-start justify-between border-b border-[var(--color-border)] px-6 py-5">
            <div>
              {title ? <h2 className="text-[20px] font-medium text-[var(--color-text)]">{title}</h2> : null}
              {titleSuffix ? <p className="mt-1 text-sm text-[var(--color-text-muted)]">{titleSuffix}</p> : null}
            </div>
            <button className="rounded-full p-1 text-[var(--color-text-secondary)] transition hover:bg-[var(--color-surface-strong)] hover:text-[var(--color-text)]" onClick={onClose} type="button">
              <X className="h-5 w-5" />
            </button>
          </div>
        )}
        {children}
      </div>
    </div>
  )
}

function Field({ children }: { children: ReactNode }) {
  return <div>{children}</div>
}

function FieldLabel({ children, icon }: { children: ReactNode; icon?: ReactNode }) {
  return (
    <label className="mb-1.5 flex items-center text-sm text-[var(--color-text-secondary)]">
      {icon ? <span className="mr-1.5">{icon}</span> : null}
      {children}
    </label>
  )
}

function TextInput({
  mono = false,
  onChange,
  placeholder,
  type = 'text',
  value,
}: {
  mono?: boolean
  onChange: (value: string) => void
  placeholder?: string
  type?: string
  value: string
}) {
  return (
    <input
      className={`w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-2 text-sm text-[var(--color-text)] outline-none transition focus:border-[var(--color-primary)] focus:ring-1 focus:ring-[var(--color-primary)] ${mono ? 'font-data-mono' : ''}`}
      onChange={(event) => onChange(event.target.value)}
      placeholder={placeholder}
      type={type}
      value={value}
    />
  )
}

function PhoneInput({
  helper,
  onChange,
  value,
}: {
  helper?: string
  onChange: (value: string) => void
  value: string
}) {
  return (
    <div>
      <div className="flex rounded-lg shadow-sm">
        <span className="inline-flex items-center rounded-l-lg border border-r-0 border-[var(--color-border)] bg-[var(--color-surface-strong)] px-3 font-data-mono text-sm text-[var(--color-text-secondary)]">
          +58
        </span>
        <input
          className="block w-full flex-1 rounded-none rounded-r-lg border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-2 font-data-mono text-sm text-[var(--color-text)] outline-none transition focus:border-[var(--color-primary)] focus:ring-1 focus:ring-[var(--color-primary)]"
          onChange={(event) => onChange(event.target.value)}
          placeholder="412-000-0000"
          type="text"
          value={value}
        />
      </div>
      {helper ? <p className="mt-1.5 text-[11px] text-[var(--color-text-muted)]">{helper}</p> : null}
    </div>
  )
}

function ReadonlyStatusField({ active }: { active: boolean }) {
  const { t } = useTranslation(['suppliers', 'common'])

  return (
    <Field>
      <FieldLabel>{t('suppliers:form.statusLabel')}</FieldLabel>
      <span
        className={`inline-flex rounded-full px-3 py-2 text-sm font-semibold ${
          active ? 'bg-[var(--color-success-bg)] text-[var(--color-success-text)]' : 'bg-[var(--color-surface-strong)] text-[var(--color-text-secondary)]'
        }`}
      >
        {active ? t('suppliers:status.active') : t('suppliers:status.inactive')}
      </span>
    </Field>
  )
}

function MetricPanel({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] p-4">
      <span className="text-sm text-[var(--color-text-secondary)]">{label}</span>
      <div className="mt-1 font-data-mono text-[28px] font-medium text-[var(--color-text)]">{value}</div>
    </div>
  )
}

function ContactField({
  fullWidth = false,
  label,
  mono = false,
  secondaryDivider = false,
  value,
}: {
  fullWidth?: boolean
  label: string
  mono?: boolean
  secondaryDivider?: boolean
  value: string
}) {
  return (
    <div className={`${fullWidth ? 'md:col-span-2' : ''} ${secondaryDivider ? 'mt-2 border-t border-dashed border-[var(--color-border)] pt-2' : ''}`}>
      <span className="text-sm text-[var(--color-text-muted)]">{label}</span>
      <div className={`${mono ? 'font-data-mono text-sm' : 'text-base'} mt-1 text-[var(--color-text)]`}>{value}</div>
    </div>
  )
}

function LoadingState({ compact = false, label }: { compact?: boolean; label: string }) {
  return (
    <div className={`flex items-center justify-center text-sm text-[var(--color-text-secondary)] ${compact ? 'p-4' : 'min-h-32 p-6'}`}>
      <LoaderCircle className="mr-2 h-4 w-4 animate-spin" />
      {label}
    </div>
  )
}

function InlineError({ compact = false, label }: { compact?: boolean; label: string }) {
  return (
    <div className={`rounded-lg border border-[var(--color-danger-text)]/20 bg-[var(--color-danger-bg)] text-sm text-[var(--color-danger-text)] ${compact ? 'm-3 p-3' : 'p-4'}`}>
      {label}
    </div>
  )
}

function EmptyState({ compact = false, label }: { compact?: boolean; label: string }) {
  return (
    <div className={`text-sm text-[var(--color-text-secondary)] ${compact ? 'p-4' : 'p-6'}`}>{label}</div>
  )
}

function normalizeSupplierPayload(values: SupplierFormValues): CreateSupplierInput {
  return {
    name: values.name.trim(),
    rif: normalizeOptionalText(values.rif),
    whatsapp: normalizeWhatsapp(values.whatsapp),
    address: normalizeOptionalText(values.address),
  }
}

function normalizeOptionalText(value: string) {
  const normalized = value.trim()
  return normalized ? normalized : null
}

function normalizeWhatsapp(value: string) {
  const digits = value.replace(/\D/g, '')

  if (!digits) {
    return null
  }

  const nationalNumber = digits.startsWith('58') ? digits.slice(2) : digits

  return `+58${nationalNumber}`
}

function stripCountryCode(value?: string | null) {
  if (!value) {
    return ''
  }

  const normalized = value.replace(/\D/g, '')

  if (normalized.startsWith('58')) {
    return `${normalized.slice(2, 5)}-${normalized.slice(5, 8)}-${normalized.slice(8)}`
  }

  return value
}

function formatSupplierPhone(value: string) {
  const normalized = value.replace(/\D/g, '')

  if (!normalized.startsWith('58') || normalized.length !== 12) {
    return value
  }

  return `+58 ${normalized.slice(2, 5)}-${normalized.slice(5, 8)}-${normalized.slice(8)}`
}

function toWhatsappHref(whatsapp: string) {
  return `https://wa.me/${whatsapp.replace(/\D/g, '')}`
}


function toSupplierDraftRow(
  product: Product,
  categoryName: string | undefined,
  currentLink: ProductSupplierEntry | null,
  isNew: boolean,
  t: SuppliersTFunction,
): SupplierProductDraft {
  const referencePrice = currentLink?.referencePrice ?? product.price ?? ''

  return {
    id: product.id,
    code: product.code,
    name: product.name,
    categoryName: categoryName ?? t('suppliers:fallback.noCategory'),
    referencePrice,
    stock: product.stock,
    minStock: product.minStock,
    isNew,
    originalReferencePrice: currentLink?.referencePrice ?? referencePrice,
  }
}

function buildProductSupplierPayload(supplierId: string, referencePrice: string): AttachProductSupplierInput {
  const normalizedPrice = referencePrice.trim()

  return {
    supplierId,
    referencePrice: normalizedPrice ? normalizedPrice : null,
  }
}

function getSupplierErrorMessage(
  error: unknown,
  action: 'create' | 'update' | 'deactivate',
  t: SuppliersTFunction,
) {
  if (!isAxiosError<ApiErrorEnvelope>(error)) {
    return t('suppliers:errors.unexpected')
  }

  const apiError = error.response?.data
  const status = error.response?.status
  const code = apiError?.error?.toUpperCase() ?? ''
  const message = apiError?.message?.trim()
  const normalizedMessage = message?.toLowerCase() ?? ''

  if (
    code.includes('RIF') &&
    (code.includes('DUPLICATE') ||
      code.includes('ALREADY_EXISTS') ||
      normalizedMessage.includes('ya existe') ||
      normalizedMessage.includes('duplicate'))
  ) {
    return t('suppliers:errors.duplicateRif')
  }

  if (status === 404 || code.includes('NOT_FOUND')) {
    return t('suppliers:errors.notFound')
  }

  if (message) {
    return message
  }

  if (status === 400) {
    return action === 'deactivate'
      ? t('suppliers:errors.deactivateFailed')
      : t('suppliers:errors.invalidData')
  }

  return t('suppliers:errors.operationFailed')
}

function getProductAssociationErrorMessage(error: unknown, t: SuppliersTFunction) {
  if (!isAxiosError<ApiErrorEnvelope>(error)) {
    return t('suppliers:errors.associationSaveFailed')
  }

  return error.response?.data.message ?? t('suppliers:errors.associationSaveFailed')
}
