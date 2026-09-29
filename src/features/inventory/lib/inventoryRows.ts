import type { TFunction } from 'i18next'

import { getStockStatus, type StockStatus } from '@/lib/stockStatus'
import type { Category, Product } from '@/types/api.types'

export type InventoryTFunction = TFunction<['inventory', 'common']>

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
  status: StockStatus
}

export function toInventoryRow(product: Product, categoriesById: Map<string, Category>, t: InventoryTFunction): InventoryRow {
  return {
    id: product.id,
    code: product.code,
    name: product.name,
    activeIngredient: product.activeIngredient,
    activeIngredientLabel: product.activeIngredient ?? t('inventory:fallback.noActiveIngredient'),
    categoryId: product.categoryId,
    category: categoriesById.get(product.categoryId)?.name ?? t('inventory:fallback.noCategory'),
    stock: product.stock,
    minStock: product.minStock,
    presentation: product.presentation,
    presentationLabel: product.presentation ?? t('inventory:fallback.noPresentation'),
    brand: product.brand,
    brandLabel: product.brand ?? t('inventory:fallback.noBrand'),
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
