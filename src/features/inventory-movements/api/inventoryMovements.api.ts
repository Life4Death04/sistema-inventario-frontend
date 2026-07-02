import { apiClient } from '@/lib/axios'
import type { InventoryMovement, MovementType, PaginatedResponse } from '@/types/api.types'

export interface ListInventoryMovementsParams {
  page?: number
  limit?: number
  productId?: string
  type?: MovementType
  from?: string
  to?: string
}

export type CreateInventoryMovementInput =
  | {
      productId: string
      type: 'IN'
      quantity: number
      reason: string
    }
  | {
      productId: string
      type: 'OUT'
      quantity: number
      reason: string
    }
  | {
      productId: string
      type: 'ADJUSTMENT'
      quantity: number
      reason: string
    }

interface InventoryMovementEnvelope {
  movement: InventoryMovement
}

export async function listInventoryMovements(params?: ListInventoryMovementsParams): Promise<PaginatedResponse<InventoryMovement>> {
  const { data } = await apiClient.get<PaginatedResponse<InventoryMovement>>('/inventory-movements', { params })

  return data
}

export async function getInventoryMovement(id: string): Promise<InventoryMovement> {
  const { data } = await apiClient.get<InventoryMovementEnvelope>(`/inventory-movements/${id}`)

  return data.movement
}

export async function createInventoryMovement(input: CreateInventoryMovementInput): Promise<InventoryMovement> {
  const { data } = await apiClient.post<InventoryMovementEnvelope>('/inventory-movements', input)

  return data.movement
}

export async function listInventoryMovementsByProduct(
  productId: string,
  params?: Omit<ListInventoryMovementsParams, 'productId'>,
): Promise<PaginatedResponse<InventoryMovement>> {
  const { data } = await apiClient.get<PaginatedResponse<InventoryMovement>>(`/products/${productId}/inventory-movements`, { params })

  return data
}
