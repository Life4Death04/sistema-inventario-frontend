import {
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  useReactTable,
  type ColumnDef,
  type PaginationState,
} from '@tanstack/react-table'
import { ArrowLeft, ArrowRight, ArrowDownLeft, ArrowUpRight, RefreshCcw } from 'lucide-react'
import { useEffect, useState } from 'react'

import { formatDate } from '@/lib/utils'

export interface MovementTableRow {
  id: string
  product: string
  code: string
  type: 'Entrada' | 'Salida' | 'Ajuste'
  quantity: number
  resultingStock: number
  reason: string
  user: string
  createdAt: string
  initials: string
}

interface MovementsTanStackTableProps {
  rows: MovementTableRow[]
  globalFilter: string
}

export function MovementsTanStackTable({ rows, globalFilter }: MovementsTanStackTableProps) {
  const [pagination, setPagination] = useState<PaginationState>({
    pageIndex: 0,
    pageSize: 6,
  })

  useEffect(() => {
    setPagination((current) => ({ ...current, pageIndex: 0 }))
  }, [globalFilter])

  const columns: ColumnDef<MovementTableRow>[] = [
    {
      accessorKey: 'createdAt',
      header: 'Fecha y hora',
      cell: ({ row }) => <span className="font-data-mono text-sm text-[var(--color-text)]">{formatDate(row.original.createdAt)}</span>,
    },
    {
      accessorKey: 'product',
      header: 'Producto',
      cell: ({ row }) => (
        <div>
          <div className="text-sm text-[var(--color-text)]">{row.original.product}</div>
          <div className="mt-0.5 font-data-mono text-xs text-[var(--color-text-muted)]">{row.original.code}</div>
        </div>
      ),
    },
    {
      accessorKey: 'type',
      header: 'Tipo',
      cell: ({ row }) => <MovementTypeBadge type={row.original.type} />,
    },
    {
      accessorKey: 'quantity',
      header: 'Cantidad',
      cell: ({ row }) => <QuantityValue quantity={row.original.quantity} type={row.original.type} />,
    },
    {
      accessorKey: 'resultingStock',
      header: 'Resultante',
      cell: ({ row }) => <span className="font-data-mono text-sm text-[var(--color-text)]">{row.original.resultingStock}</span>,
    },
    {
      accessorKey: 'user',
      header: 'Responsable',
      cell: ({ row }) => (
        <div className="flex items-center gap-2">
          <div className="flex h-6 w-6 items-center justify-center rounded-full bg-[var(--color-surface-tint)] text-[10px] font-semibold text-[var(--color-primary)]">
            {row.original.initials}
          </div>
          <span className="text-sm text-[var(--color-text)]">{row.original.user}</span>
        </div>
      ),
    },
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

      return [row.original.product, row.original.user, row.original.code, row.original.reason, row.original.type].some((value) =>
        value.toLowerCase().includes(query),
      )
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
    <section className="overflow-hidden rounded-[var(--radius-panel)] border border-[var(--color-border)] bg-[var(--color-surface)] shadow-sm">
      <div className="overflow-x-auto">
        <table className="min-w-[860px] w-full border-collapse text-left">
          <thead>
            {table.getHeaderGroups().map((headerGroup) => (
              <tr key={headerGroup.id} className="border-b border-[var(--color-border)] bg-[color:rgba(245,248,251,0.55)]">
                {headerGroup.headers.map((header) => (
                  <th
                    key={header.id}
                    className={`px-6 py-4 text-xs font-semibold uppercase tracking-[0.05em] text-[var(--color-text-secondary)] ${
                      header.column.id === 'quantity' || header.column.id === 'resultingStock' ? 'text-right' : ''
                    }`}
                  >
                    {header.isPlaceholder ? null : flexRender(header.column.columnDef.header, header.getContext())}
                  </th>
                ))}
              </tr>
            ))}
          </thead>
          <tbody>
            {pageRows.map((row) => (
              <tr key={row.id} className={`${getRowBackground(row.original.type)} transition-colors hover:brightness-[0.98]`}>
                {row.getVisibleCells().map((cell) => (
                  <td
                    key={cell.id}
                    className={`px-6 py-4 ${cell.column.id === 'quantity' || cell.column.id === 'resultingStock' ? 'text-right' : ''}`}
                  >
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="flex flex-col gap-4 border-t border-[var(--color-border)] bg-[color:rgba(245,248,251,0.2)] p-4 sm:flex-row sm:items-center sm:justify-between">
        <span className="text-sm text-[var(--color-text-secondary)]">
          Mostrando {pageStart}-{pageEnd} de {totalRows} movimientos
        </span>
        <div className="flex items-center gap-1">
          <button
            className="p-1.5 text-[var(--color-text-muted)] transition hover:text-[var(--color-text)] disabled:opacity-50"
            disabled={!table.getCanPreviousPage()}
            onClick={() => table.previousPage()}
            type="button"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          {Array.from({ length: table.getPageCount() }, (_, index) => (
            <button
              key={index}
              className={`flex h-8 w-8 items-center justify-center rounded-[6px] text-xs font-medium transition ${
                index === pagination.pageIndex
                  ? 'bg-[var(--color-primary-strong)] text-white shadow-sm'
                  : 'text-[var(--color-text-secondary)] hover:bg-[var(--color-page-bg)] hover:text-[var(--color-text)]'
              }`}
              onClick={() => table.setPageIndex(index)}
              type="button"
            >
              {index + 1}
            </button>
          ))}
          <button
            className="p-1.5 text-[var(--color-text-secondary)] transition hover:text-[var(--color-text)] disabled:opacity-50"
            disabled={!table.getCanNextPage()}
            onClick={() => table.nextPage()}
            type="button"
          >
            <ArrowRight className="h-5 w-5" />
          </button>
        </div>
      </div>
    </section>
  )
}

function MovementTypeBadge({ type }: { type: MovementTableRow['type'] }) {
  if (type === 'Entrada') {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-[4px] bg-[var(--color-success-bg)] px-2 py-1 text-xs font-semibold uppercase tracking-[0.05em] text-[var(--color-success-text)]">
        <ArrowDownLeft className="h-3.5 w-3.5" />
        Entrada
      </span>
    )
  }

  if (type === 'Salida') {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-[4px] bg-[var(--color-danger-bg)] px-2 py-1 text-xs font-semibold uppercase tracking-[0.05em] text-[var(--color-danger-text)]">
        <ArrowUpRight className="h-3.5 w-3.5" />
        Salida
      </span>
    )
  }

  return (
    <span className="inline-flex items-center gap-1.5 rounded-[4px] bg-[var(--color-surface-tint)] px-2 py-1 text-xs font-semibold uppercase tracking-[0.05em] text-[var(--color-primary)]">
      <RefreshCcw className="h-3.5 w-3.5" />
      Ajuste
    </span>
  )
}

function QuantityValue({ quantity, type }: { quantity: number; type: MovementTableRow['type'] }) {
  const signal = type === 'Entrada' ? '+' : '-'
  const tone = type === 'Entrada' ? 'text-[var(--color-success-text)]' : type === 'Salida' ? 'text-[var(--color-danger-text)]' : 'text-[var(--color-primary)]'

  return <span className={`font-data-mono text-sm ${tone}`}>{signal}{quantity}</span>
}

function getRowBackground(type: MovementTableRow['type']) {
  if (type === 'Entrada') {
    return 'bg-[rgba(226,244,238,0.30)]'
  }

  if (type === 'Salida') {
    return 'bg-[rgba(251,231,228,0.30)]'
  }

  return 'bg-[rgba(232,241,250,0.30)]'
}
