import { useQuery } from '@tanstack/react-query'

import { listCategories, type ListCategoriesParams } from '@/features/categories/api/categories.api'
import { queryKeys } from '@/lib/queryKeys'

export function useCategories(params?: ListCategoriesParams) {
  return useQuery({
    queryKey: queryKeys.categories.list(params),
    queryFn: () => listCategories(params),
  })
}
