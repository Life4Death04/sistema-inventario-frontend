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

const STOCK_STATUS_LABELS: Record<StockStatus, string> = {
  healthy: 'Normal',
  low: 'Crítico',
  out: 'Agotado',
}

export function getStockStatusLabel(status: StockStatus): string {
  return STOCK_STATUS_LABELS[status]
}
