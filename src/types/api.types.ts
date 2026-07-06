export type UserRole = 'ADMIN' | 'MANAGER' | 'OPERATOR'

export type ProductUnit = 'MG' | 'G' | 'KG' | 'ML' | 'L' | 'UNIT'

export type MovementType = 'IN' | 'OUT' | 'ADJUSTMENT'

export type AdjustmentDirection = 'INCREASE' | 'DECREASE'

export interface PaginationMeta {
  page: number
  limit: number
  total: number
  totalPages: number
}

export interface PageSizePaginationMeta {
  page: number
  pageSize: number
  total: number
  totalPages: number
}

export interface PaginatedResponse<T> {
  data: T[]
  meta: PaginationMeta
}

export interface PageSizePaginatedResponse<T> {
  data: T[]
  meta: PageSizePaginationMeta
}

export interface AuthUser {
  id: string
  fullName: string
  email: string
  role: UserRole
  active: boolean
  phone: string | null
  createdAt: string
}

export interface User extends AuthUser {
  updatedAt: string
}

export interface Supplier {
  id: string
  name: string
  rif: string | null
  whatsapp: string | null
  address: string | null
  active: boolean
  productsCount: number
  createdAt: string
  updatedAt: string
}

export interface ProductSupplierSummary {
  id: string
  name: string
  rif: string | null
  whatsapp: string | null
  address: string | null
  active: boolean
}

export interface Category {
  id: string
  name: string
  description: string | null
  createdAt: string
  updatedAt: string
}

export interface Product {
  id: string
  code: string
  name: string
  activeIngredient: string | null
  description: string | null
  presentation: string | null
  brand: string | null
  unit: ProductUnit
  unitContent: string
  categoryId: string
  stock: number
  minStock: number
  price: string | null
  active: boolean
  createdAt: string
  updatedAt: string
}

export interface ProductSupplierEntry {
  supplier: ProductSupplierSummary
  referencePrice: string | null
}

export interface ProductSupplierLink {
  id: string
  supplierId: string
  referencePrice: string | null
}

export interface ProductCategorySummary {
  id: string
  name: string
  description: string | null
}

export interface ProductDetail extends Product {
  category: ProductCategorySummary | null
  suppliers: ProductSupplierEntry[]
}

export interface MovementProductSummary {
  id: string
  name: string
  code: string
}

export interface MovementUserSummary {
  id: string
  fullName: string
}

export interface InventoryMovement {
  id: string
  productId: string
  userId: string
  product: MovementProductSummary
  user: MovementUserSummary
  type: MovementType
  adjustmentDirection: AdjustmentDirection | null
  quantity: number
  resultingStock: number
  reason: string
  createdAt: string
}

export type ReplenishmentStatus = 'PENDING' | 'SENT' | 'RECEIVED' | 'CANCELLED'

export interface ReplenishmentSupplierSummary {
  id: string
  name: string
  rif: string | null
  whatsapp: string | null
  address: string | null
  active: boolean
}

export interface ReplenishmentUserSummary {
  id: string
  fullName: string
  email: string
  role: UserRole
  active: boolean
}

export interface ReplenishmentProductSummary {
  id: string
  code: string
  name: string
  activeIngredient: string | null
  presentation: string | null
  brand: string | null
  unit: ProductUnit
  unitContent: string
  stock: number
  minStock: number
  active: boolean
}

export interface ReplenishmentRequestItem {
  id: string
  productId: string
  requestedQuantity: number
  unitPrice: number | null
  receivedQuantity?: number | null
  product?: ReplenishmentProductSummary | null
}

export interface ReplenishmentRequest {
  id: string
  supplierId: string
  requestedByUserId: string
  supplier?: ReplenishmentSupplierSummary | null
  requestedByUser?: ReplenishmentUserSummary | null
  status: ReplenishmentStatus
  requestedAt: string
  sentAt?: string | null
  receivedAt?: string | null
  receivedByUserId?: string | null
  cancelledAt?: string | null
  cancelledByUserId?: string | null
  notes: string | null
  itemsCount: number
  estimatedTotal: string
}

export interface ReplenishmentRequestWithItems extends ReplenishmentRequest {
  items: ReplenishmentRequestItem[]
}

export interface LoginResponse {
  user: AuthUser
  token: string
}

export interface RefreshResponse {
  token: string
}

export interface MeResponse {
  user: AuthUser
}

export interface ApiErrorEnvelope {
  error: string
  message: string
  statusCode: number
  details?: unknown
}
