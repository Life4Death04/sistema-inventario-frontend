import { useQuery } from '@tanstack/react-query'

import { getReplenishmentRequest } from '@/features/replenishment/api/replenishmentRequests.api'
import { queryKeys } from '@/lib/queryKeys'

export function useReplenishmentRequest(id: string | null) {
  return useQuery({
    queryKey: id ? queryKeys.replenishmentRequests.detail(id) : queryKeys.replenishmentRequests.details(),
    queryFn: () => getReplenishmentRequest(id as string),
    enabled: Boolean(id),
  })
}
