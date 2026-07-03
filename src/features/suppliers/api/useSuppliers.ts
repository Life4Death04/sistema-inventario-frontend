import { useQuery } from '@tanstack/react-query'

import { listSuppliers, type ListSuppliersParams } from '@/features/suppliers/api/suppliers.api'
import { queryKeys } from '@/lib/queryKeys'

export function useSuppliers(params?: ListSuppliersParams) {
  return useQuery({
    queryKey: queryKeys.suppliers.list(params),
    queryFn: () => listSuppliers(params),
  })
}
