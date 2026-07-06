import { useQuery } from '@tanstack/react-query'

import {
  getProduct,
  listProductSuppliers,
  listProducts,
  type ListProductsParams,
} from '@/features/products/api/products.api'
import { queryKeys } from '@/lib/queryKeys'

export function useProducts(params?: ListProductsParams) {
  return useQuery({
    queryKey: queryKeys.products.list(params),
    queryFn: () => listProducts(params),
  })
}

export function useProductDetail(id: string | null) {
  return useQuery({
    enabled: Boolean(id),
    queryKey: id ? queryKeys.products.detail(id) : queryKeys.products.details(),
    queryFn: () => getProduct(id!),
  })
}

export function useProductSuppliers(productId: string | null) {
  return useQuery({
    enabled: Boolean(productId),
    queryKey: productId ? queryKeys.products.suppliers(productId) : queryKeys.products.all,
    queryFn: () => listProductSuppliers(productId!),
  })
}
