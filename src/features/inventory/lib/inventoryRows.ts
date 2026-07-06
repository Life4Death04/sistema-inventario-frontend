import type { Category, Product } from '@/types/api.types'

export interface InventoryRow {
  id: string
  code: string
  name: string
  activeIngredient: string | null
  activeIngredientLabel: string
  categoryId: string
  category: string
  stock: number
  minStock: number
  presentation: string | null
  presentationLabel: string
  brand: string | null
  brandLabel: string
  unit: Product['unit']
  unitContent: string
  price: string | null
  active: boolean
  suppliers: string[]
  createdAt: string
  updatedAt: string
  status: 'Optimo' | 'Critico' | 'Agotado'
}

export function toInventoryRow(product: Product, categoriesById: Map<string, Category>): InventoryRow {
  return {
    id: product.id,
    code: product.code,
    name: product.name,
    activeIngredient: product.activeIngredient,
    activeIngredientLabel: product.activeIngredient ?? 'Sin principio activo',
    categoryId: product.categoryId,
    category: categoriesById.get(product.categoryId)?.name ?? 'Sin categoria',
    stock: product.stock,
    minStock: product.minStock,
    presentation: product.presentation,
    presentationLabel: product.presentation ?? 'Sin presentacion',
    brand: product.brand,
    brandLabel: product.brand ?? 'Sin marca',
    unit: product.unit,
    unitContent: product.unitContent,
    price: product.price,
    active: product.active,
    suppliers: [],
    createdAt: product.createdAt,
    updatedAt: product.updatedAt,
    status: getInventoryStatus(product.stock, product.minStock),
  }
}

export function getInventoryStatus(stock: number, minStock: number): InventoryRow['status'] {
  if (stock === 0) {
    return 'Agotado'
  }

  if (stock <= minStock) {
    return 'Critico'
  }

  return 'Optimo'
}
