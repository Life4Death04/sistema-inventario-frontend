import type { ProductRow } from '@/features/products/lib/productRows'

export type InventoryAlertLevel = 'critical' | 'out'

export interface InventoryAlertRow {
  id: string
  /** Stable semantic key. Never store a translated label here: branch and sort on this, translate only at render time. */
  level: InventoryAlertLevel
  generatedAt: string
  product: ProductRow
}

function alertSortComparator(left: InventoryAlertRow, right: InventoryAlertRow) {
  if (left.level !== right.level) {
    return left.level === 'out' ? -1 : 1
  }

  if (left.product.stock !== right.product.stock) {
    return left.product.stock - right.product.stock
  }

  return left.product.name.localeCompare(right.product.name)
}

function isAlertWorthy(product: ProductRow) {
  return product.stock === 0 || (product.stock > 0 && product.stock <= product.minStock)
}

export function toInventoryAlertRows(products: ProductRow[], generatedAt: string): InventoryAlertRow[] {
  return products
    .filter(isAlertWorthy)
    .map((product) => ({
      id: `alert-${product.id}`,
      level: product.stock === 0 ? ('out' as const) : ('critical' as const),
      generatedAt,
      product,
    }))
    .sort(alertSortComparator)
}
