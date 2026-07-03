export const queryKeys = {
  categories: {
    all: ['categories'] as const,
    lists: () => [...queryKeys.categories.all, 'list'] as const,
    list: (params?: unknown) => [...queryKeys.categories.lists(), params ?? {}] as const,
    details: () => [...queryKeys.categories.all, 'detail'] as const,
    detail: (id: string) => [...queryKeys.categories.details(), id] as const,
  },
  suppliers: {
    all: ['suppliers'] as const,
    lists: () => [...queryKeys.suppliers.all, 'list'] as const,
    list: (params?: unknown) => [...queryKeys.suppliers.lists(), params ?? {}] as const,
    details: () => [...queryKeys.suppliers.all, 'detail'] as const,
    detail: (id: string) => [...queryKeys.suppliers.details(), id] as const,
    replenishmentRequests: (supplierId: string, params?: unknown) =>
      [...queryKeys.suppliers.detail(supplierId), 'replenishment-requests', params ?? {}] as const,
  },
  users: {
    all: ['users'] as const,
    lists: () => [...queryKeys.users.all, 'list'] as const,
    list: (params?: unknown) => [...queryKeys.users.lists(), params ?? {}] as const,
    details: () => [...queryKeys.users.all, 'detail'] as const,
    detail: (id: string) => [...queryKeys.users.details(), id] as const,
  },
  products: {
    all: ['products'] as const,
    lists: () => [...queryKeys.products.all, 'list'] as const,
    list: (params?: unknown) => [...queryKeys.products.lists(), params ?? {}] as const,
    details: () => [...queryKeys.products.all, 'detail'] as const,
    detail: (id: string) => [...queryKeys.products.details(), id] as const,
    stockViews: () => [...queryKeys.products.all, 'stock'] as const,
    suppliers: (productId: string) => [...queryKeys.products.detail(productId), 'suppliers'] as const,
    movements: (productId: string, params?: unknown) => [...queryKeys.products.detail(productId), 'movements', params ?? {}] as const,
  },
  inventory: {
    all: ['inventory'] as const,
    lists: () => [...queryKeys.inventory.all, 'list'] as const,
    list: (params?: unknown) => [...queryKeys.inventory.lists(), params ?? {}] as const,
    stockViews: () => [...queryKeys.inventory.all, 'stock'] as const,
  },
  inventoryMovements: {
    all: ['inventory-movements'] as const,
    lists: () => [...queryKeys.inventoryMovements.all, 'list'] as const,
    list: (params?: unknown) => [...queryKeys.inventoryMovements.lists(), params ?? {}] as const,
    details: () => [...queryKeys.inventoryMovements.all, 'detail'] as const,
    detail: (id: string) => [...queryKeys.inventoryMovements.details(), id] as const,
  },
  alerts: {
    all: ['alerts'] as const,
    lists: () => [...queryKeys.alerts.all, 'list'] as const,
    list: (params?: unknown) => [...queryKeys.alerts.lists(), params ?? {}] as const,
  },
  replenishmentRequests: {
    all: ['replenishment-requests'] as const,
    lists: () => [...queryKeys.replenishmentRequests.all, 'list'] as const,
    list: (params?: unknown) => [...queryKeys.replenishmentRequests.lists(), params ?? {}] as const,
    details: () => [...queryKeys.replenishmentRequests.all, 'detail'] as const,
    detail: (id: string) => [...queryKeys.replenishmentRequests.details(), id] as const,
    bySupplier: (supplierId: string, params?: unknown) =>
      [...queryKeys.replenishmentRequests.all, 'by-supplier', supplierId, params ?? {}] as const,
  },
} as const

// Future receive flow should invalidate these groups because receiving a replenishment
// impacts the request lifecycle, product stock-facing views, inventory history, and alerts.
export const receiveReplenishmentInvalidationKeys = [
  queryKeys.replenishmentRequests.all,
  queryKeys.products.all,
  queryKeys.products.stockViews(),
  queryKeys.inventory.all,
  queryKeys.inventory.stockViews(),
  queryKeys.inventoryMovements.all,
  queryKeys.alerts.all,
] as const
