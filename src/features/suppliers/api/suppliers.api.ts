import { apiClient } from '@/lib/axios'
import type { PaginatedResponse, Supplier } from '@/types/api.types'

export interface ListSuppliersParams {
  page?: number
  limit?: number
  search?: string
  active?: boolean
}

export interface CreateSupplierInput {
  name: string
  rif?: string | null
  whatsapp?: string | null
  address?: string | null
}

export interface UpdateSupplierInput {
  name?: string
  rif?: string | null
  whatsapp?: string | null
  address?: string | null
}

interface SupplierEnvelope {
  supplier: Supplier
}

export async function listSuppliers(params?: ListSuppliersParams): Promise<PaginatedResponse<Supplier>> {
  const normalizedParams = params?.active === undefined ? params : { ...params, active: String(params.active) }
  const { data } = await apiClient.get<PaginatedResponse<Supplier>>('/suppliers', { params: normalizedParams })

  return data
}

export async function getSupplier(id: string): Promise<Supplier> {
  const { data } = await apiClient.get<SupplierEnvelope>(`/suppliers/${id}`)

  return data.supplier
}

export async function createSupplier(input: CreateSupplierInput): Promise<Supplier> {
  const { data } = await apiClient.post<SupplierEnvelope>('/suppliers', input)

  return data.supplier
}

export async function updateSupplier(id: string, input: UpdateSupplierInput): Promise<Supplier> {
  const { data } = await apiClient.patch<SupplierEnvelope>(`/suppliers/${id}`, input)

  return data.supplier
}

export async function deleteSupplier(id: string): Promise<void> {
  await apiClient.delete(`/suppliers/${id}`)
}
