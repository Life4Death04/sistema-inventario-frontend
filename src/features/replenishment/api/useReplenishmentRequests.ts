import { useQuery } from '@tanstack/react-query'

import { listReplenishmentRequests, type ListReplenishmentRequestsParams } from '@/features/replenishment/api/replenishmentRequests.api'
import { queryKeys } from '@/lib/queryKeys'

export function useReplenishmentRequests(params?: ListReplenishmentRequestsParams) {
  return useQuery({
    queryKey: queryKeys.replenishmentRequests.list(params),
    queryFn: () => listReplenishmentRequests(params),
  })
}
