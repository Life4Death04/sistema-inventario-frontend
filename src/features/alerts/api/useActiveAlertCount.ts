import { useMemo } from 'react'

import { useProducts } from '@/features/products/api/useProducts'

const ACTIVE_PRODUCTS_PARAMS = { active: true, pageSize: 100 }

/**
 * Returns the count of active alerts derived from active products with low/no stock.
 * Reuses the TanStack Query cache shared with AlertsPage when it has been visited.
 */
export function useActiveAlertCount(): number {
  const { data } = useProducts(ACTIVE_PRODUCTS_PARAMS)

  return useMemo(() => {
    const products = data?.data ?? []
    return products.filter((p) => p.stock === 0 || (p.stock > 0 && p.stock <= p.minStock)).length
  }, [data])
}
