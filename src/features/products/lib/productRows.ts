import type { TFunction } from 'i18next'

import { getStockStatus, type StockStatus } from '@/lib/stockStatus'
import type { Product } from '@/types/api.types'

export type ProductsTFunction = TFunction<['products', 'common']>

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
  status: StockStatus
}

export function toProductRow(product: Product, t: ProductsTFunction, categoryName?: string): ProductRow {
  return {
    id: product.id,
    code: product.code,
    name: product.name,
    activeIngredient: product.activeIngredient,
    activeIngredientLabel: product.activeIngredient ?? t('products:fallback.noActiveIngredient'),
    description: product.description,
    descriptionLabel: product.description ?? t('products:fallback.noDescription'),
    categoryId: product.categoryId,
    category: categoryName ?? t('products:fallback.noCategory'),
    stock: product.stock,
    minStock: product.minStock,
    presentation: product.presentation,
    presentationLabel: product.presentation ?? t('products:fallback.noPresentation'),
    brand: product.brand,
    brandLabel: product.brand ?? t('products:fallback.noBrand'),
    unit: product.unit,
    unitContent: product.unitContent,
    price: product.price,
    active: product.active,
    suppliers: [],
    createdAt: product.createdAt,
    updatedAt: product.updatedAt,
    status: getStockStatus(product.stock, product.minStock),
  }
}
