import type { ReplenishmentRequestView, ReplenishmentRequestWithItemsView } from '@/features/replenishment/api/replenishmentRequests.api'
import type { ReplenishmentStatus } from '@/types/api.types'

export type ReplenishmentStatusLabel = 'Pendiente' | 'Enviada' | 'Recibida' | 'Cancelada'

export interface ReplenishmentRow {
  id: string
  supplier: string
  requestedBy: string
  status: ReplenishmentStatusLabel
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
  unitPrice: number
  subtotal: number
  stock: number
  minStock: number
}

export interface ReplenishmentDetail {
  id: string
  supplier: string
  requestedBy: string
  status: ReplenishmentStatusLabel
  rawStatus: ReplenishmentStatus
  requestedAt: string
  sentAt: string | null
  receivedAt: string | null
  notes: string
  items: ReplenishmentDetailItem[]
}

export function getReplenishmentStatusLabel(status: ReplenishmentStatus): ReplenishmentStatusLabel {
  if (status === 'PENDING') {
    return 'Pendiente'
  }

  if (status === 'SENT') {
    return 'Enviada'
  }

  if (status === 'RECEIVED') {
    return 'Recibida'
  }

  return 'Cancelada'
}

export function toReplenishmentRow(request: ReplenishmentRequestView): ReplenishmentRow {
  return {
    id: request.id,
    supplier: request.supplier.name,
    requestedBy: request.requestedByUser.fullName,
    status: getReplenishmentStatusLabel(request.status),
    rawStatus: request.status,
    requestedAt: request.requestedAt,
    sentAt: request.sentAt ?? 'No enviada',
    receivedAt: request.receivedAt ?? null,
    items: null,
    estimatedTotal: null,
    notes: request.notes ?? '',
  }
}

export function toReplenishmentDetail(request: ReplenishmentRequestWithItemsView): ReplenishmentDetail {
  return {
    id: request.id,
    supplier: request.supplier.name,
    requestedBy: request.requestedByUser.fullName,
    status: getReplenishmentStatusLabel(request.status),
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
      subtotal: item.requestedQuantity * item.unitPrice,
      stock: item.product.stock,
      minStock: item.product.minStock,
    })),
  }
}
