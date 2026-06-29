export type UserRole = 'ADMIN' | 'MANAGER' | 'OPERATOR'

export interface User {
  id: string
  fullName: string
  email: string
  password: string
  role: UserRole
  active: boolean
  phone: string
  createdAt: string
  lastAccess?: string
}

export interface Category {
  id: string
  name: string
  description: string
}

export interface Supplier {
  id: string
  name: string
  rif: string
  whatsapp: string
  address: string
  active: boolean
}

export interface Product {
  id: string
  code: string
  name: string
  activeIngredient: string
  description: string
  presentation: string
  categoryId: string
  stock: number
  minStock: number
  price: number
  active: boolean
}

export interface ProductSupplier {
  id: string
  productId: string
  supplierId: string
  referencePrice: number
}

export type MovementType = 'IN' | 'OUT' | 'ADJUSTMENT'

export interface InventoryMovement {
  id: string
  productId: string
  userId: string
  type: MovementType
  reason: string
  quantity: number
  resultingStock: number
  createdAt: string
}

export type ReplenishmentStatus = 'PENDING' | 'SENT' | 'RECEIVED' | 'CANCELLED'

export interface ReplenishmentRequestItem {
  id: string
  productId: string
  requestedQuantity: number
  unitPrice: number
}

export interface ReplenishmentRequest {
  id: string
  supplierId: string
  requestedByUserId: string
  status: ReplenishmentStatus
  requestedAt: string
  sentAt?: string
  notes: string
  items: ReplenishmentRequestItem[]
}

export interface LoginFormValues {
  email: string
  password: string
}
