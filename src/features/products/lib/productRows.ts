import type { Product } from '@/types/api.types'

export interface ProductRow {
  id: string
  code: string
  name: string
  activeIngredient: string | null
  activeIngredientLabel: string
  description: string | null
  descriptionLabel: string
  categoryId?: string
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
  status: string
}

export function toProductRow(product: Product, categoryName?: string): ProductRow {
  return {
    id: product.id,
    code: product.code,
    name: product.name,
    activeIngredient: product.activeIngredient,
    activeIngredientLabel: product.activeIngredient ?? 'Sin principio activo',
    description: product.description,
    descriptionLabel: product.description ?? 'Sin descripcion',
    categoryId: product.categoryId,
    category: categoryName ?? 'Sin categoria',
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
    status: getProductStatus(product.stock, product.minStock),
  }
}

function getProductStatus(stock: number, minStock: number): ProductRow['status'] {
  if (stock === 0) {
    return 'Agotado'
  }

  if (stock <= minStock) {
    return 'Critico'
  }

  return 'Optimo'
}
