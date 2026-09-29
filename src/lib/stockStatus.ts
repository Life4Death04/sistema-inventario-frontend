import type { TFunction } from 'i18next'

export type StockStatus = 'healthy' | 'low' | 'out'

export function getStockStatus(stock: number, minStock: number): StockStatus {
  if (stock === 0) {
    return 'out'
  }

  if (stock <= minStock) {
    return 'low'
  }

  return 'healthy'
}

export function getStockStatusLabel(status: StockStatus, t: TFunction<'common'>): string {
  return t(`common:stockStatus.${status}`)
}
