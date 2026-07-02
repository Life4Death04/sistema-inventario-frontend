import { apiClient } from '@/lib/axios'
import type {
  InventoryMovement,
  PaginatedResponse,
  Product,
  ProductDetail,
  ProductSupplierEntry,
  ProductSupplierLink,
  ProductUnit,
} from '@/types/api.types'

export interface ListProductsParams {
  page?: number
  pageSize?: number
  search?: string
  categoryId?: string
  active?: boolean
  lowStock?: boolean
  supplierId?: string
  orderBy?: 'name' | 'stock' | 'price' | 'createdAt'
  order?: 'asc' | 'desc'
}

export interface CreateProductInput {
  code: string
  name: string
  activeIngredient?: string
  description?: string
  presentation?: string
  brand?: string
  unit: ProductUnit
  unitContent: string
  categoryId: string
  stock?: number
  minStock?: number
  price: string
}

export interface UpdateProductInput {
  code?: string
  name?: string
  activeIngredient?: string | null
  description?: string | null
  presentation?: string | null
  brand?: string | null
  unit?: ProductUnit
  unitContent?: string
  categoryId?: string
  minStock?: number
  price?: string
}

export interface AttachProductSupplierInput {
  supplierId: string
  referencePrice?: string | null
}

export interface ListProductMovementsParams {
  page?: number
  limit?: number
  type?: InventoryMovement['type']
  from?: string
  to?: string
}

interface ProductEnvelope {
  product: Product
}

interface ProductDetailEnvelope {
  product: ProductDetail
}

interface ProductSuppliersEnvelope {
  suppliers: ProductSupplierEntry[]
}

interface ProductSupplierLinkEnvelope {
  link: ProductSupplierLink
}

export async function listProducts(params?: ListProductsParams): Promise<PaginatedResponse<Product>> {
  const normalizedParams = {
    ...params,
    ...(params?.active !== undefined ? { active: String(params.active) } : {}),
    ...(params?.lowStock !== undefined ? { lowStock: String(params.lowStock) } : {}),
  }

  const { data } = await apiClient.get<PaginatedResponse<Product>>('/products', { params: normalizedParams })

  return data
}

export async function getProduct(id: string): Promise<ProductDetail> {
  const { data } = await apiClient.get<ProductDetailEnvelope>(`/products/${id}`)

  return data.product
}

export async function createProduct(input: CreateProductInput): Promise<Product> {
  const { data } = await apiClient.post<ProductEnvelope>('/products', input)

  return data.product
}

export async function updateProduct(id: string, input: UpdateProductInput): Promise<Product> {
  const { data } = await apiClient.patch<ProductEnvelope>(`/products/${id}`, input)

  return data.product
}

export async function deleteProduct(id: string): Promise<void> {
  await apiClient.delete(`/products/${id}`)
}

export async function listProductSuppliers(productId: string): Promise<ProductSupplierEntry[]> {
  const { data } = await apiClient.get<ProductSuppliersEnvelope>(`/products/${productId}/suppliers`)

  return data.suppliers
}

export async function attachProductSupplier(productId: string, input: AttachProductSupplierInput): Promise<ProductSupplierLink> {
  const { data } = await apiClient.post<ProductSupplierLinkEnvelope>(`/products/${productId}/suppliers`, input)

  return data.link
}

export async function detachProductSupplier(productId: string, supplierId: string): Promise<void> {
  await apiClient.delete(`/products/${productId}/suppliers/${supplierId}`)
}

export async function listProductMovements(productId: string, params?: ListProductMovementsParams): Promise<PaginatedResponse<InventoryMovement>> {
  const { data } = await apiClient.get<PaginatedResponse<InventoryMovement>>(`/products/${productId}/inventory-movements`, { params })

  return data
}
