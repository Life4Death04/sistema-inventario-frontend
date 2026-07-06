import { ArrowLeftRight, FolderTree, Package2, Plus, Search, SquarePen, TriangleAlert, View } from 'lucide-react'
import { useState } from 'react'

import { Loading } from '@/components/ui/Loading'
import { CategoryManagementModal } from '@/features/categories/components/CategoryManagementModal'
import { useCategories } from '@/features/categories/api/useCategories'
import { useProducts } from '@/features/products/api/useProducts'
import { ProductCatalogModals, type ProductModalType } from '@/features/products/components/ProductCatalogModals'
import { ProductsTanStackTable } from '@/features/products/components/ProductsTanStackTable'
import { canCreateMovementType, canManageProducts, hasPermission } from '@/features/auth/lib/permissions'
import { useAuthStore } from '@/features/auth/store/auth.store'
import { toProductRow, type ProductRow } from '@/features/products/lib/productRows'

export function ProductsPage() {
  const user = useAuthStore((state) => state.user)
  const [query, setQuery] = useState('')
  const [openMenuId, setOpenMenuId] = useState<string | null>(null)
  const [activeModal, setActiveModal] = useState<ProductModalType | null>(null)
  const [selectedProduct, setSelectedProduct] = useState<ProductRow | null>(null)
  const [isCategoryManagerOpen, setIsCategoryManagerOpen] = useState(false)
  const canManage = canManageProducts(user?.role)
  const canUseReplenishment = hasPermission(user?.role, 'manage:replenishment')
  const canOpenMovement = canCreateMovementType(user?.role, 'OUT')
  const { data: categoriesResponse } = useCategories({ limit: 100 })
  const { data: productsResponse, isError, isLoading } = useProducts({
    active: true,
    pageSize: 100,
    search: query.trim() || undefined,
  })
  const categoryNames = new Map((categoriesResponse?.data ?? []).map((category) => [category.id, category.name]))
  const products = (productsResponse?.data ?? []).map((product) =>
    toProductRow(product, categoryNames.get(product.categoryId)),
  )
  const criticalCount = products.filter((product) => product.status === 'Critico').length
  const outCount = products.filter((product) => product.status === 'Agotado').length

  const openModal = (modalType: ProductModalType, product: ProductRow | null = null) => {
    setSelectedProduct(product)
    setOpenMenuId(null)
    setActiveModal(modalType)
  }

  const closeModal = () => {
    setActiveModal(null)
    setSelectedProduct(null)
  }

  const handleQueryChange = (value: string) => {
    setQuery(value)
  }

  const renderActionsMenu = (product: ProductRow) => (
    <div className="w-52 overflow-hidden rounded-[8px] border border-[#e5ecf1] bg-white shadow-[0_4px_12px_rgba(0,0,0,0.05)]">
      <button
        className="flex w-full items-center gap-3 px-4 py-2 text-sm text-[#0e1d27] transition hover:bg-[#f6faff]"
        onClick={(event) => {
          event.stopPropagation()
          openModal('detail', product)
        }}
        type="button"
      >
        <View className="h-4 w-4 text-[#5c6b78]" />
        Ver detalle
      </button>
      {canManage ? (
        <button
          className="flex w-full items-center gap-3 px-4 py-2 text-sm text-[#0e1d27] transition hover:bg-[#f6faff]"
          onClick={(event) => {
            event.stopPropagation()
            openModal('edit', product)
          }}
          type="button"
        >
          <SquarePen className="h-4 w-4 text-[#5c6b78]" />
          Editar
        </button>
      ) : null}
      {canOpenMovement ? (
        <button
          className="flex w-full items-center gap-3 px-4 py-2 text-sm text-[#0e1d27] transition hover:bg-[#f6faff]"
          onClick={(event) => {
            event.stopPropagation()
            openModal('movement', product)
          }}
          type="button"
        >
          <ArrowLeftRight className="h-4 w-4 text-[#5c6b78]" />
          Registrar movimiento
        </button>
      ) : null}
      {canUseReplenishment ? (
        <button
          className="flex w-full items-center gap-3 px-4 py-2 text-sm text-[#0e1d27] transition hover:bg-[#f6faff]"
          onClick={(event) => {
            event.stopPropagation()
            openModal('replenishment', product)
          }}
          type="button"
        >
          <Package2 className="h-4 w-4 text-[#5c6b78]" />
          Generar reposicion
        </button>
      ) : null}
      {canManage ? <div className="mx-4 h-px bg-[#e5ecf1]" /> : null}
      {canManage ? (
        <button
          className="flex w-full items-center gap-3 px-4 py-2 text-sm text-[#ba1a1a] transition hover:bg-[#fbe7e4]"
          onClick={(event) => {
            event.stopPropagation()
            openModal('deactivate', product)
          }}
          type="button"
        >
          <TriangleAlert className="h-4 w-4" />
          Desactivar
        </button>
      ) : null}
    </div>
  )

  return (
    <>
      <section className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div>
          <h2 className="text-[30px] font-semibold leading-[38px] text-[#0e1d27]">Catalogo de Productos</h2>
          <p className="mt-1 text-sm text-[#5c6b78]">Gestione y visualice el inventario general.</p>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row">
          <label className="relative block">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#95a3ae]" />
            <input
              className="h-10 w-full rounded-[8px] border border-[#e5ecf1] bg-white pl-10 pr-4 text-sm outline-none transition focus:border-[#004782] focus:ring-1 focus:ring-[#004782] sm:w-80"
              onChange={(event) => handleQueryChange(event.target.value)}
              placeholder="Buscar por codigo, nombre o principio activo..."
              type="text"
              value={query}
            />
          </label>

          {canManage ? (
            <button
              className="inline-flex h-10 items-center justify-center gap-2 rounded-[8px] border border-[#d7e4ee] bg-white px-4 text-xs font-semibold uppercase tracking-[0.05em] text-[#004782] transition hover:border-[#b8d0e2] hover:bg-[#f6faff]"
              onClick={() => setIsCategoryManagerOpen(true)}
              type="button"
            >
              <FolderTree className="h-4 w-4" />
              Categorias
            </button>
          ) : null}

          {canManage ? (
            <button
              className="inline-flex h-10 items-center justify-center gap-2 rounded-[8px] bg-[#004782] px-4 text-xs font-semibold uppercase tracking-[0.05em] text-white transition hover:bg-[#1960a6]"
              onClick={() => openModal('create')}
              type="button"
            >
              <Plus className="h-4 w-4" />
              Nuevo producto
            </button>
          ) : null}
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <div className="rounded-[12px] border border-[#e5ecf1] bg-white p-4">
          <p className="text-xs font-semibold uppercase tracking-[0.05em] text-[#5c6b78]">Productos</p>
          <p className="mt-2 text-2xl font-semibold text-[#0e1d27]">{products.length}</p>
        </div>
        <div className="rounded-[12px] border border-[#e5ecf1] bg-white p-4">
          <p className="text-xs font-semibold uppercase tracking-[0.05em] text-[#5c6b78]">Criticos</p>
          <p className="mt-2 text-2xl font-semibold text-[#9a5b00]">{criticalCount}</p>
        </div>
        <div className="rounded-[12px] border border-[#e5ecf1] bg-white p-4">
          <p className="text-xs font-semibold uppercase tracking-[0.05em] text-[#5c6b78]">Agotados</p>
          <p className="mt-2 text-2xl font-semibold text-[#b0301f]">{outCount}</p>
        </div>
      </div>

      <div className="overflow-hidden rounded-[12px] border border-[#e5ecf1] bg-white">
        {isLoading ? <Loading /> : null}
        {isError ? <ProductsLoadError /> : null}
        {!isLoading && !isError ? (
          <ProductsTanStackTable
            globalFilter={query}
            onMenuToggle={(productId) => setOpenMenuId((current) => (current === productId ? null : productId))}
            onProductSelect={(product) => openModal('detail', product)}
            openMenuId={openMenuId}
            products={products}
            renderActionsMenu={renderActionsMenu}
          />
        ) : null}
      </div>
      </section>

      <ProductCatalogModals modalType={activeModal} onClose={closeModal} onOpenModal={openModal} product={selectedProduct} role={user?.role} />
      <CategoryManagementModal onClose={() => setIsCategoryManagerOpen(false)} open={isCategoryManagerOpen && canManage} />
    </>
  )
}

function ProductsLoadError() {
  return (
    <div className="rounded-[var(--radius-panel)] border border-[var(--color-danger-text)]/20 bg-[var(--color-danger-bg)] px-4 py-3 text-sm text-[var(--color-danger-text)]">
      No se pudieron cargar los productos reales en este momento.
    </div>
  )
}
