import {
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  useReactTable,
  type ColumnDef,
  type PaginationState,
} from '@tanstack/react-table'
import { ArrowLeft, ArrowRight, Eye, Link2, MessageCircle, SquarePen } from 'lucide-react'
import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'

import type { SupplierRow } from '@/features/suppliers/lib/supplierRows'

interface SuppliersTanStackTableProps {
  canManage: boolean
  rows: SupplierRow[]
  globalFilter: string
  onAssociateProducts: (supplier: SupplierRow) => void
  onEditSupplier: (supplier: SupplierRow) => void
  onViewSupplier: (supplier: SupplierRow) => void
}

export function SuppliersTanStackTable({
  canManage,
  onAssociateProducts,
  onEditSupplier,
  onViewSupplier,
  rows,
  globalFilter,
}: SuppliersTanStackTableProps) {
  const { t } = useTranslation(['suppliers', 'common'])
  const [pagination, setPagination] = useState<PaginationState>({
    pageIndex: 0,
    pageSize: 6,
  })

  useEffect(() => {
    setPagination((current) => ({ ...current, pageIndex: 0 }))
  }, [globalFilter, rows])

  const columns: ColumnDef<SupplierRow>[] = [
    {
      accessorKey: 'name',
      header: t('suppliers:table.columns.supplier'),
      cell: ({ row }) => <SupplierIdentityCell supplier={row.original} />,
    },
    {
      accessorKey: 'rif',
      header: t('suppliers:table.columns.rif'),
      cell: ({ row }) => <span className="font-data-mono text-sm text-[var(--color-text-secondary)]">{row.original.rif ?? t('suppliers:table.fallback.noRif')}</span>,
    },
    {
      accessorKey: 'whatsapp',
      header: t('suppliers:table.columns.whatsapp'),
      cell: ({ row }) => <WhatsappCell whatsapp={row.original.whatsapp} />,
    },
    {
      accessorKey: 'productsLabel',
      header: t('suppliers:table.columns.products'),
      cell: ({ row }) => <ProductsCell label={row.original.productsLabel} />,
    },
    {
      accessorKey: 'active',
      header: t('suppliers:table.columns.status'),
      cell: ({ row }) => <StatusBadge active={row.original.active} />,
    },
    {
      id: 'actions',
      header: t('suppliers:table.columns.actions'),
      cell: ({ row }: { row: { original: SupplierRow } }) => (
        <ActionsCell
          canManage={canManage}
          onAssociateProducts={() => onAssociateProducts(row.original)}
          onEdit={() => onEditSupplier(row.original)}
          onView={() => onViewSupplier(row.original)}
        />
      ),
    } satisfies ColumnDef<SupplierRow>,
  ]

  const table = useReactTable({
    columns,
    data: rows,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    globalFilterFn: (row, _columnId, filterValue) => {
      const query = String(filterValue).trim().toLowerCase()

      if (!query) {
        return true
      }

      return [row.original.name, row.original.rif ?? '', row.original.whatsapp ?? '', row.original.address ?? ''].some((value) => value.toLowerCase().includes(query))
    },
    onPaginationChange: setPagination,
    state: {
      globalFilter,
      pagination,
    },
  })

  const pageRows = table.getRowModel().rows
  const totalRows = table.getFilteredRowModel().rows.length
  const pageStart = totalRows === 0 ? 0 : pagination.pageIndex * pagination.pageSize + 1
  const pageEnd = totalRows === 0 ? 0 : Math.min(pageStart + pageRows.length - 1, totalRows)

  return (
    <section className="overflow-hidden rounded-[var(--radius-panel)] border border-[var(--color-border)] bg-[var(--color-surface)]">
      <div className="overflow-x-auto">
        <table className="min-w-[900px] w-full border-collapse text-left">
          <thead>
            {table.getHeaderGroups().map((headerGroup) => (
              <tr key={headerGroup.id} className="border-b border-[var(--color-border)] bg-[color:rgba(245,248,251,0.55)]">
                {headerGroup.headers.map((header) => (
                  <th
                    key={header.id}
                    className={`px-4 py-3 text-xs font-semibold uppercase tracking-[0.05em] text-[var(--color-text-secondary)] ${
                      header.column.id === 'productsLabel' ? 'text-center' : header.column.id === 'actions' ? 'text-right' : ''
                    }`}
                  >
                    {header.isPlaceholder ? null : flexRender(header.column.columnDef.header, header.getContext())}
                  </th>
                ))}
              </tr>
            ))}
          </thead>
          <tbody className="divide-y divide-[var(--color-border)]">
            {pageRows.map((row) => (
              <tr key={row.id} className="cursor-pointer transition-colors hover:bg-[color:rgba(245,248,251,0.55)]" onClick={() => onViewSupplier(row.original)}>
                {row.getVisibleCells().map((cell) => (
                  <td
                    key={cell.id}
                      className={`px-4 py-3 ${cell.column.id === 'productsLabel' ? 'text-center' : cell.column.id === 'actions' ? 'text-right' : ''}`}
                  >
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="flex items-center justify-between border-t border-[var(--color-border)] bg-[var(--color-surface)] px-4 py-3">
        <span className="text-sm text-[var(--color-text-secondary)]">
          {t('suppliers:table.pagination.summary', { start: pageStart, end: pageEnd, total: totalRows })}
        </span>
        <div className="flex items-center gap-1">
          <button
            className="flex h-8 w-8 items-center justify-center rounded text-[var(--color-text-muted)] transition hover:bg-[var(--color-surface-strong)] disabled:opacity-50"
            disabled={!table.getCanPreviousPage()}
            onClick={() => table.previousPage()}
            type="button"
          >
            <ArrowLeft className="h-4 w-4" />
          </button>
          {Array.from({ length: table.getPageCount() }, (_, index) => (
            <button
              key={index}
              className={`flex h-8 w-8 items-center justify-center rounded text-sm font-medium transition ${
                index === pagination.pageIndex
                  ? 'bg-[var(--color-surface-tint)]/18 text-[var(--color-primary)]'
                  : 'text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-strong)]'
              }`}
              onClick={() => table.setPageIndex(index)}
              type="button"
            >
              {index + 1}
            </button>
          ))}
          <button
            className="flex h-8 w-8 items-center justify-center rounded text-[var(--color-text-secondary)] transition hover:bg-[var(--color-surface-strong)] disabled:opacity-50"
            disabled={!table.getCanNextPage()}
            onClick={() => table.nextPage()}
            type="button"
          >
            <ArrowRight className="h-4 w-4" />
          </button>
        </div>
      </div>
    </section>
  )
}

function SupplierIdentityCell({ supplier }: { supplier: SupplierRow }) {
  const { t } = useTranslation(['suppliers', 'common'])

  return (
    <div className="flex flex-col">
      <span className="text-sm font-medium text-[var(--color-text)]">{supplier.name}</span>
      <span className="mt-0.5 font-data-mono text-xs text-[var(--color-text-muted)]">
        {t('suppliers:table.identityRifPrefix', { rif: supplier.rif ?? t('suppliers:table.fallback.noRif') })}
      </span>
    </div>
  )
}

function WhatsappCell({ whatsapp }: { whatsapp: string | null }) {
  const { t } = useTranslation('common')

  if (!whatsapp) {
    return <span className="text-sm italic text-[var(--color-text-muted)]">{t('common:state.notAvailable')}</span>
  }

  return (
    <div className="flex items-center gap-1.5">
      <MessageCircle className="h-4 w-4 text-[var(--color-success-text)]" />
      <span className="font-data-mono text-xs text-[var(--color-text-secondary)]">{formatPhone(whatsapp)}</span>
    </div>
  )
}

function ProductsCell({ label }: { label: string }) {
  return (
    <span className="inline-flex items-center justify-center rounded-full bg-[var(--color-surface-strong)] px-2.5 py-1 text-sm text-[var(--color-text-secondary)]">
      {label}
    </span>
  )
}

function StatusBadge({ active }: { active: boolean }) {
  const { t } = useTranslation('suppliers')

  return (
    <span
      className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold uppercase tracking-[0.05em] ${
        active ? 'bg-[var(--color-success-bg)] text-[var(--color-success-text)]' : 'bg-[var(--color-surface-strong)] text-[var(--color-text-secondary)]'
      }`}
    >
      {active ? t('suppliers:status.active') : t('suppliers:status.inactive')}
    </span>
  )
}

function ActionsCell({
  canManage,
  onAssociateProducts,
  onEdit,
  onView,
}: {
  canManage: boolean
  onAssociateProducts: () => void
  onEdit: () => void
  onView: () => void
}) {
  const { t } = useTranslation('suppliers')

  return (
    <div className="inline-flex items-center justify-end gap-1">
      <button
        className="rounded p-1.5 text-[var(--color-text-muted)] transition hover:bg-[var(--color-surface-tint)]/18 hover:text-[var(--color-primary)]"
        onClick={(event) => { event.stopPropagation(); onView() }}
        title={t('suppliers:table.actions.viewDetailTitle')}
        type="button"
      >
        <Eye className="h-5 w-5" />
      </button>
      {canManage ? (
        <button
          className="rounded p-1.5 text-[var(--color-text-muted)] transition hover:bg-[var(--color-surface-tint)]/18 hover:text-[var(--color-primary)]"
          onClick={(event) => { event.stopPropagation(); onAssociateProducts() }}
          title={t('suppliers:table.actions.associateProductsTitle')}
          type="button"
        >
          <Link2 className="h-5 w-5" />
        </button>
      ) : null}
      {canManage ? (
        <button
          className="rounded p-1.5 text-[var(--color-text-muted)] transition hover:bg-[var(--color-surface-strong)] hover:text-[var(--color-primary)]"
          onClick={(event) => { event.stopPropagation(); onEdit() }}
          title={t('suppliers:table.actions.editTitle')}
          type="button"
        >
          <SquarePen className="h-5 w-5" />
        </button>
      ) : null}
    </div>
  )
}

function formatPhone(value: string) {
  const normalized = value.replace(/\D/g, '')

  if (normalized.length !== 12 || !normalized.startsWith('58')) {
    return value
  }

  return `+58 ${normalized.slice(2, 5)}-${normalized.slice(5, 8)}-${normalized.slice(8)}`
}
