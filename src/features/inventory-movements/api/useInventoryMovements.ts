import { useMutation, useQuery, useQueryClient, type QueryClient } from '@tanstack/react-query'

import {
  createInventoryMovement,
  listInventoryMovements,
  type CreateInventoryMovementInput,
  type ListInventoryMovementsParams,
} from '@/features/inventory-movements/api/inventoryMovements.api'
import { listProductMovements, type ListProductMovementsParams } from '@/features/products/api/products.api'
import { queryKeys } from '@/lib/queryKeys'

export function useInventoryMovements(params?: ListInventoryMovementsParams) {
  return useQuery({
    queryKey: queryKeys.inventoryMovements.list(params),
    queryFn: () => listInventoryMovements(params),
  })
}

export function useCreateInventoryMovement() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (input: CreateInventoryMovementInput) => createInventoryMovement(input),
    onSuccess: async (movement) => {
      await invalidateMovementRelatedQueries(queryClient, movement.productId)
    },
  })
}

export function useProductInventoryMovements(productId: string | null, params?: ListProductMovementsParams) {
  return useQuery({
    enabled: Boolean(productId),
    queryKey: productId ? queryKeys.products.movements(productId, params) : queryKeys.products.all,
    queryFn: () => listProductMovements(productId!, params),
  })
}

async function invalidateMovementRelatedQueries(queryClient: QueryClient, productId: string) {
  await Promise.all([
    queryClient.invalidateQueries({ queryKey: queryKeys.inventoryMovements.all }),
    queryClient.invalidateQueries({ queryKey: queryKeys.products.all }),
    queryClient.invalidateQueries({ queryKey: queryKeys.products.detail(productId) }),
    queryClient.invalidateQueries({ queryKey: queryKeys.inventory.all }),
    queryClient.invalidateQueries({ queryKey: queryKeys.alerts.all }),
  ])
}
