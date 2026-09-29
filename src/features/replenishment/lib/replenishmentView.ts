import type { TFunction } from 'i18next'

import type { ReplenishmentRequestView, ReplenishmentRequestWithItemsView } from '@/features/replenishment/api/replenishmentRequests.api'
import type { ReplenishmentStatus } from '@/types/api.types'

export type ReplenishmentTFunction = TFunction<['replenishment', 'common']>

export interface ReplenishmentRow {
  id: string
  supplier: string
  requestedBy: string
  status: string
  rawStatus: ReplenishmentStatus
  requestedAt: string
  sentAt: string
  receivedAt: string | null
  items: number | null
  estimatedTotal: number | null
  notes: string
}

export interface ReplenishmentDetailItem {
  id: string
  productId: string
  name: string
  code: string
  requestedQuantity: number
  receivedQuantity: number
  unitPrice: number | null
  subtotal: number | null
  stock: number
  minStock: number
}

export interface ReplenishmentDetail {
  id: string
  supplier: string
  requestedBy: string
  status: string
  rawStatus: ReplenishmentStatus
  requestedAt: string
  sentAt: string | null
  receivedAt: string | null
  notes: string
  items: ReplenishmentDetailItem[]
}

export function getReplenishmentStatusLabel(status: ReplenishmentStatus, t: ReplenishmentTFunction): string {
  return t(`replenishment:status.${status}`)
}

export function toReplenishmentRow(request: ReplenishmentRequestView, t: ReplenishmentTFunction): ReplenishmentRow {
  return {
    id: request.id,
    supplier: request.supplier.name,
    requestedBy: request.requestedByUser.fullName,
    status: getReplenishmentStatusLabel(request.status, t),
    rawStatus: request.status,
    requestedAt: request.requestedAt,
    sentAt: request.sentAt ?? t('replenishment:fallback.notSent'),
    receivedAt: request.receivedAt ?? null,
    items: request.itemsCount,
    estimatedTotal: Number(request.estimatedTotal),
    notes: request.notes ?? '',
  }
}

export function toReplenishmentDetail(request: ReplenishmentRequestWithItemsView, t: ReplenishmentTFunction): ReplenishmentDetail {
  return {
    id: request.id,
    supplier: request.supplier.name,
    requestedBy: request.requestedByUser.fullName,
    status: getReplenishmentStatusLabel(request.status, t),
    rawStatus: request.status,
    requestedAt: request.requestedAt,
    sentAt: request.sentAt ?? null,
    receivedAt: request.receivedAt ?? null,
    notes: request.notes ?? '',
    items: request.items.map((item) => ({
      id: item.id,
      productId: item.productId,
      name: item.product.name,
      code: item.product.code,
      requestedQuantity: item.requestedQuantity,
      receivedQuantity: item.receivedQuantity ?? item.requestedQuantity,
      unitPrice: item.unitPrice,
      subtotal: item.unitPrice != null ? item.requestedQuantity * item.unitPrice : null,
      stock: item.product.stock,
      minStock: item.product.minStock,
    })),
  }
}
