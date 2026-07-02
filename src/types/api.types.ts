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

export interface PaginatedResponse<T> {
  data: T[]
  meta: PaginationMeta
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
  price: string
  active: boolean
  createdAt: string
  updatedAt: string
}

export interface ProductSupplierEntry {
  supplier: ProductSupplierSummary
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

export interface InventoryMovement {
  id: string
  productId: string
  userId: string
  type: MovementType
  adjustmentDirection: AdjustmentDirection | null
  quantity: number
  resultingStock: number
  reason: string
  createdAt: string
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
