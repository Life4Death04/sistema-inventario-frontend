import {
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  useReactTable,
  type ColumnDef,
  type PaginationState,
} from '@tanstack/react-table'
import { ArrowLeft, ArrowRight, Minus, View } from 'lucide-react'
import { useEffect, useState } from 'react'

import type { InventoryRow } from '@/data/mockSelectors'

interface InventoryTanStackTableProps {
  rows: InventoryRow[]
  globalFilter: string
  onOpenDetail: (product: InventoryRow) => void
  onOpenSalida: (product: InventoryRow) => void
}

export function InventoryTanStackTable({ rows, globalFilter, onOpenDetail, onOpenSalida }: InventoryTanStackTableProps) {
  const [pagination, setPagination] = useState<PaginationState>({
    pageIndex: 0,
    pageSize: 6,
  })

  useEffect(() => {
    setPagination((current) => ({ ...current, pageIndex: 0 }))
  }, [globalFilter])

  const columns: ColumnDef<InventoryRow>[] = [
    {
      accessorKey: 'name',
      header: 'Producto',
      cell: ({ row }) => (
        <div>
          <div className="font-medium text-[var(--color-text)]">{row.original.name}</div>
          <div className="mt-1 font-data-mono text-xs text-[var(--color-text-muted)]">{row.original.code}</div>
        </div>
      ),
    },
    {
      accessorKey: 'category',
      header: 'Categoria',
      cell: ({ row }) => <span className="text-sm text-[var(--color-text-secondary)]">{row.original.category}</span>,
    },
    {
      accessorKey: 'stock',
      header: 'Existencias',
      cell: ({ row }) => (
        <span className={`font-data-mono text-sm ${row.original.status === 'Agotado' ? 'text-[var(--color-danger-text)]' : 'text-[var(--color-text)]'}`}>
          {row.original.stock.toLocaleString('es-VE')}
        </span>
      ),
    },
    {
      accessorKey: 'minStock',
      header: 'Stock min.',
      cell: ({ row }) => <span className="font-data-mono text-sm text-[var(--color-text-muted)]">{row.original.minStock.toLocaleString('es-VE')}</span>,
    },
    {
      accessorKey: 'status',
      header: 'Estado',
      cell: ({ row }) => <StatusBadge status={row.original.status} />,
    },
    {
      id: 'actions',
      header: 'Accion',
      enableColumnFilter: false,
      cell: ({ row }) => (
        <div className="flex items-center justify-center gap-2">
          <button
            className="flex h-8 w-8 items-center justify-center rounded-[var(--radius-control)] border border-[var(--color-border)] text-[var(--color-text-secondary)] transition hover:bg-[var(--color-surface-strong)] hover:text-[var(--color-primary)]"
            onClick={(event) => {
              event.stopPropagation()
              onOpenSalida(row.original)
            }}
            title="Registrar salida"
            type="button"
          >
            <Minus className="h-4 w-4" />
          </button>
          <button
            className="flex h-8 w-8 items-center justify-center rounded-[var(--radius-control)] border border-[var(--color-border)] text-[var(--color-text-secondary)] transition hover:bg-[var(--color-surface-strong)] hover:text-[var(--color-primary)]"
            onClick={(event) => {
              event.stopPropagation()
              onOpenDetail(row.original)
            }}
            title="Ver detalle"
            type="button"
          >
            <View className="h-4 w-4" />
          </button>
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

      return [row.original.code, row.original.name, row.original.category, row.original.activeIngredient].some((value) =>
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
    <section className="overflow-hidden rounded-[var(--radius-panel)] border border-[var(--color-border)] bg-[var(--color-surface)]">
      <div className="overflow-x-auto">
        <table className="min-w-[820px] w-full border-collapse text-left">
          <thead>
            {table.getHeaderGroups().map((headerGroup) => (
              <tr key={headerGroup.id} className="border-b border-[var(--color-border)] bg-[var(--color-surface)] text-xs font-semibold uppercase tracking-[0.05em] text-[var(--color-text-secondary)]">
                {headerGroup.headers.map((header) => (
                  <th key={header.id} className={`px-4 py-3 ${header.column.id === 'stock' || header.column.id === 'minStock' ? 'text-right' : header.column.id === 'actions' ? 'text-center' : ''}`}>
                    {header.isPlaceholder ? null : flexRender(header.column.columnDef.header, header.getContext())}
                  </th>
                ))}
              </tr>
            ))}
          </thead>
          <tbody>
            {pageRows.map((row) => (
              <tr key={row.id} className="transition hover:bg-[var(--color-page-bg)]">
                {row.getVisibleCells().map((cell) => (
                  <td key={cell.id} className={`px-4 py-3 ${cell.column.id === 'stock' || cell.column.id === 'minStock' ? 'text-right' : cell.column.id === 'actions' ? 'text-center' : ''}`}>
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="flex flex-col gap-3 border-t border-[var(--color-border)] bg-[var(--color-surface)] px-4 py-3 text-sm text-[var(--color-text-secondary)] md:flex-row md:items-center md:justify-between">
        <span>
          Mostrando <span className="font-medium text-[var(--color-text)]">{pageStart}-{pageEnd}</span> de <span className="font-medium text-[var(--color-text)]">{totalRows}</span> productos
        </span>
        <div className="flex items-center gap-1 self-end md:self-auto">
          <button
            className="flex h-8 w-8 items-center justify-center rounded-[var(--radius-control)] text-[var(--color-text-muted)] transition hover:bg-[var(--color-surface-strong)] disabled:opacity-50"
            disabled={!table.getCanPreviousPage()}
            onClick={() => table.previousPage()}
            type="button"
          >
            <ArrowLeft className="h-4 w-4" />
          </button>
          {Array.from({ length: table.getPageCount() }, (_, index) => (
            <button
              key={index}
              className={`flex h-8 w-8 items-center justify-center rounded-[var(--radius-control)] text-sm font-medium transition ${
                index === pagination.pageIndex ? 'bg-[var(--color-primary)] text-white' : 'text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-strong)]'
              }`}
              onClick={() => table.setPageIndex(index)}
              type="button"
            >
              {index + 1}
            </button>
          ))}
          <button
            className="flex h-8 w-8 items-center justify-center rounded-[var(--radius-control)] text-[var(--color-text-secondary)] transition hover:bg-[var(--color-surface-strong)] disabled:opacity-50"
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

function StatusBadge({ status }: { status: string }) {
  if (status === 'Optimo') {
    return <span className="inline-flex rounded-[4px] bg-[var(--color-success-bg)] px-3 py-1 text-sm font-semibold uppercase text-[var(--color-success-text)]">Normal</span>
  }

  if (status === 'Critico') {
    return <span className="inline-flex rounded-[4px] bg-[var(--color-warning-bg)] px-3 py-1 text-sm font-semibold uppercase text-[var(--color-warning-text)]">Critico</span>
  }

  return <span className="inline-flex rounded-[4px] bg-[var(--color-danger-bg)] px-3 py-1 text-sm font-semibold uppercase text-[var(--color-danger-text)]">Agotado</span>
}
