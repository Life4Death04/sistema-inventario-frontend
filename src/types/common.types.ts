import type {
  AdjustmentDirection as ApiAdjustmentDirection,
  Category as ApiCategory,
  InventoryMovement as ApiInventoryMovement,
  PaginatedResponse as ApiPaginatedResponse,
  PaginationMeta as ApiPaginationMeta,
  Product as ApiProduct,
  ProductUnit as ApiProductUnit,
  Supplier as ApiSupplier,
  User as ApiUser,
  UserRole,
} from '@/types/api.types'

export type {
  UserRole,
}

export type ProductUnit = ApiProductUnit

export type AdjustmentDirection = ApiAdjustmentDirection

export type PaginationMeta = ApiPaginationMeta

export type PaginatedResponse<T> = ApiPaginatedResponse<T>

export type User = ApiUser

export type Category = ApiCategory

export type Supplier = ApiSupplier

export type Product = ApiProduct

export interface ProductSupplier {
  id: string
  productId: string
  supplierId: string
  referencePrice: string | null
}

export type MovementType = ApiInventoryMovement['type']

export type InventoryMovement = ApiInventoryMovement

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

export interface CreateUserInput {
  fullName: string
  email: string
  password: string
  role?: UserRole
  phone?: string
}
