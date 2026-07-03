import { useQuery } from '@tanstack/react-query'

import { listUsers, type ListUsersParams } from '@/features/users/api/users.api'
import { queryKeys } from '@/lib/queryKeys'

export function useUsers(params?: ListUsersParams) {
  return useQuery({
    queryKey: queryKeys.users.list(params),
    queryFn: () => listUsers(params),
  })
}
