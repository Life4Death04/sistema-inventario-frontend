import type {
  AdjustmentDirection as ApiAdjustmentDirection,
  Category as ApiCategory,
  InventoryMovement as ApiInventoryMovement,
  PaginatedResponse as ApiPaginatedResponse,
  PaginationMeta as ApiPaginationMeta,
  PageSizePaginatedResponse as ApiPageSizePaginatedResponse,
  PageSizePaginationMeta as ApiPageSizePaginationMeta,
  Product as ApiProduct,
  ProductUnit as ApiProductUnit,
  ReplenishmentRequestItem as ApiReplenishmentRequestItem,
  ReplenishmentRequestWithItems as ApiReplenishmentRequestWithItems,
  ReplenishmentStatus as ApiReplenishmentStatus,
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

export type PageSizePaginationMeta = ApiPageSizePaginationMeta

export type PageSizePaginatedResponse<T> = ApiPageSizePaginatedResponse<T>

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

export type ReplenishmentStatus = ApiReplenishmentStatus

export type ReplenishmentRequestItem = ApiReplenishmentRequestItem

export type ReplenishmentRequestWithItems = ApiReplenishmentRequestWithItems

export type ReplenishmentRequest = ApiReplenishmentRequestWithItems

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
