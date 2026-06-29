import { mockDb } from '@/data/mockDatabase'
import type { Product, ReplenishmentRequest, UserRole } from '@/types/common.types'

const roleLabels: Record<UserRole, string> = {
  ADMIN: 'Administrador',
  MANAGER: 'Encargado',
  OPERATOR: 'Operativo',
}

const movementLabels = {
  IN: 'Entrada',
  OUT: 'Salida',
  ADJUSTMENT: 'Ajuste',
}

const statusLabels = {
  PENDING: 'Pendiente',
  SENT: 'Enviada',
  RECEIVED: 'Recibida',
  CANCELLED: 'Cancelada',
}

const getCategoryName = (categoryId: string) =>
  mockDb.categories.find((category) => category.id === categoryId)?.name ?? 'Sin categoria'

const getUserName = (userId: string) =>
  mockDb.users.find((user) => user.id === userId)?.fullName ?? 'Usuario no encontrado'

const getSupplierName = (supplierId: string) =>
  mockDb.suppliers.find((supplier) => supplier.id === supplierId)?.name ?? 'Proveedor no encontrado'

const getSuppliersForProduct = (productId: string) =>
  mockDb.productSuppliers
    .filter((relation) => relation.productId === productId)
    .map((relation) => getSupplierName(relation.supplierId))

export const getLowStockProducts = () =>
  mockDb.products.filter((product) => product.stock > 0 && product.stock <= product.minStock)

export const getOutOfStockProducts = () =>
  mockDb.products.filter((product) => product.stock === 0)

export const getPendingReplenishmentRequests = () =>
  mockDb.replenishmentRequests.filter((request) => request.status === 'PENDING')

export const getProductRows = () =>
  mockDb.products.map((product) => ({
    id: product.id,
    code: product.code,
    name: product.name,
    activeIngredient: product.activeIngredient,
    description: product.description,
    category: getCategoryName(product.categoryId),
    stock: product.stock,
    minStock: product.minStock,
    presentation: product.presentation,
    price: product.price,
    active: product.active,
    suppliers: getSuppliersForProduct(product.id),
    status: getProductStatus(product),
  }))

export type ProductRow = ReturnType<typeof getProductRows>[number]

export const getCategoryOptions = () => mockDb.categories.map((category) => category.name)

export const getSupplierOptions = () => mockDb.suppliers.map((supplier) => supplier.name)

export const getProductMovementHistory = (productId: string) =>
  [...mockDb.movements]
    .filter((movement) => movement.productId === productId)
    .sort((left, right) => right.createdAt.localeCompare(left.createdAt))
    .map((movement) => ({
      id: movement.id,
      type: movement.type,
      typeLabel: movementLabels[movement.type],
      quantity: movement.quantity,
      resultingStock: movement.resultingStock,
      reason: movement.reason,
      user: getUserName(movement.userId),
      createdAt: movement.createdAt,
    }))

export const getInventoryRows = () =>
  getProductRows().map((product) => ({
    ...product,
    difference: product.stock - product.minStock,
  }))

export type InventoryRow = ReturnType<typeof getInventoryRows>[number]

export const getMovementRows = () =>
  [...mockDb.movements]
    .sort((left, right) => right.createdAt.localeCompare(left.createdAt))
    .map((movement) => ({
      id: movement.id,
      product: mockDb.products.find((product) => product.id === movement.productId)?.name ?? 'Producto no encontrado',
      type: movementLabels[movement.type],
      quantity: movement.quantity,
      resultingStock: movement.resultingStock,
      reason: movement.reason,
      user: getUserName(movement.userId),
      createdAt: movement.createdAt,
    }))

export const getAlertItems = () => {
  const lowStockAlerts = getLowStockProducts().map((product) => ({
    id: `low-${product.id}`,
    level: 'warning' as const,
    title: `${product.name} en nivel minimo`,
    message: `El producto ${product.code} esta por debajo o igual al stock minimo permitido.`,
  }))

  const outOfStockAlerts = getOutOfStockProducts().map((product) => ({
    id: `out-${product.id}`,
    level: 'danger' as const,
    title: `${product.name} agotado`,
    message: `No hay existencias disponibles para ${product.name}.`,
  }))

  const requestAlerts = getPendingReplenishmentRequests().map((request) => ({
    id: `req-${request.id}`,
    level: 'info' as const,
    title: `Solicitud ${request.id} pendiente`,
    message: `Existe una solicitud de reposicion pendiente con ${getSupplierName(request.supplierId)}.`,
  }))

  return [...outOfStockAlerts, ...lowStockAlerts, ...requestAlerts]
}

export const getSupplierRows = () =>
  mockDb.suppliers.map((supplier) => ({
    id: supplier.id,
    name: supplier.name,
    rif: supplier.rif,
    whatsapp: supplier.whatsapp,
    address: supplier.address,
    active: supplier.active,
    products: mockDb.productSuppliers.filter((relation) => relation.supplierId === supplier.id).length,
  }))

export const getUserRows = () =>
  mockDb.users.map((user) => ({
    id: user.id,
    fullName: user.fullName,
    email: user.email,
    phone: user.phone,
    role: roleLabels[user.role],
    active: user.active,
    createdAt: user.createdAt,
  }))

export const getReplenishmentRows = () =>
  [...mockDb.replenishmentRequests]
    .sort((left, right) => right.requestedAt.localeCompare(left.requestedAt))
    .map((request) => ({
      id: request.id,
      supplier: getSupplierName(request.supplierId),
      requestedBy: getUserName(request.requestedByUserId),
      status: statusLabels[request.status],
      requestedAt: request.requestedAt,
      sentAt: request.sentAt ?? 'No enviada',
      items: request.items.length,
      estimatedTotal: getRequestTotal(request),
      notes: request.notes,
    }))

export const getCredentialsHint = () => ({
  email: mockDb.users[0]?.email ?? '',
  password: mockDb.users[0]?.password ?? '',
})

const getProductStatus = (product: Product) => {
  if (product.stock === 0) {
    return 'Agotado'
  }

  if (product.stock <= product.minStock) {
    return 'Critico'
  }

  return 'Optimo'
}

const getRequestTotal = (request: ReplenishmentRequest) =>
  request.items.reduce((accumulator, item) => accumulator + item.requestedQuantity * item.unitPrice, 0)
