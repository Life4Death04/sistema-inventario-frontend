import type { TFunction } from 'i18next'

import type { Supplier } from '@/types/api.types'

export interface SupplierRow {
  id: string
  name: string
  rif: string | null
  whatsapp: string | null
  address: string | null
  active: boolean
  productsCount: number
  productsLabel: string
  createdAt: string
  updatedAt: string
}

export function toSupplierRow(supplier: Supplier, t: TFunction): SupplierRow {
  const count = supplier.productsCount
  return {
    id: supplier.id,
    name: supplier.name,
    rif: supplier.rif,
    whatsapp: supplier.whatsapp,
    address: supplier.address,
    active: supplier.active,
    productsCount: count,
    productsLabel: t('suppliers:productsCount', { count }),
    createdAt: supplier.createdAt,
    updatedAt: supplier.updatedAt,
  }
}

export function mergeSupplierRows(activeSuppliers: Supplier[], inactiveSuppliers: Supplier[], t: TFunction) {
  const rowsById = new Map<string, SupplierRow>()

  for (const supplier of [...activeSuppliers, ...inactiveSuppliers]) {
    rowsById.set(supplier.id, toSupplierRow(supplier, t))
  }

  return [...rowsById.values()].sort((left, right) => left.name.localeCompare(right.name, 'es'))
}
