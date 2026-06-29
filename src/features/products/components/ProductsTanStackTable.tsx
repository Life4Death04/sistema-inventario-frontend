import {
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
  type ColumnDef,
  type PaginationState,
  type SortingState,
} from '@tanstack/react-table'
import { ArrowLeft, ArrowRight, ArrowUpDown, MoreVertical, Pill } from 'lucide-react'
import { useState } from 'react'

import type { ProductRow } from '@/data/mockSelectors'

interface ProductsTanStackTableProps {
  products: ProductRow[]
  globalFilter: string
  openMenuId: string | null
  onMenuToggle: (productId: string) => void
  onProductSelect: (product: ProductRow) => void
  renderActionsMenu: (product: ProductRow) => React.ReactNode
}

export function ProductsTanStackTable({
  products,
  globalFilter,
  openMenuId,
  onMenuToggle,
  onProductSelect,
  renderActionsMenu,
}: ProductsTanStackTableProps) {
  const [sorting, setSorting] = useState<SortingState>([])
  const [pagination, setPagination] = useState<PaginationState>({
    pageIndex: 0,
    pageSize: 3,
  })

  const columns: ColumnDef<ProductRow>[] = [
    {
      accessorKey: 'code',
      header: 'Codigo',
      cell: ({ row }) => <span className="font-data-mono text-sm text-[var(--color-text)]">{row.original.code}</span>,
    },
    {
      accessorKey: 'name',
      header: 'Producto',
      cell: ({ row }) => (
        <div>
          <div className="font-medium text-[var(--color-text)]">{row.original.name}</div>
          <div className="mt-1 text-sm text-[var(--color-text-secondary)]">{row.original.presentation}</div>
        </div>
      ),
    },
    {
      accessorKey: 'activeIngredient',
      header: 'Principio activo',
    },
    {
      accessorKey: 'category',
      header: 'Categoria',
      cell: ({ row }) => (
        <div className="inline-flex items-center gap-2 rounded-[4px] bg-[#e1f5ee] px-2 py-1 text-[#086b53]">
          <Pill className="h-3.5 w-3.5" />
          <span className="text-xs font-semibold uppercase tracking-[0.05em]">{row.original.category}</span>
        </div>
      ),
    },
    {
      accessorKey: 'stock',
      header: 'Stock',
      cell: ({ row }) => (
        <div className="text-right text-sm text-[var(--color-text)]">
          <div className="font-data-mono font-medium">{row.original.stock.toLocaleString('es-VE')}</div>
          <div className="mt-1 text-xs text-[var(--color-text-muted)]">Min. {row.original.minStock.toLocaleString('es-VE')}</div>
        </div>
      ),
    },
    {
      accessorKey: 'status',
      header: 'Estado',
      cell: ({ row }) => <StatusBadge status={row.original.status} />,
    },
    {
      id: 'actions',
      header: '',
      enableSorting: false,
      cell: ({ row }) => {
        const isMenuOpen = openMenuId === row.original.id

        return (
          <div className="relative text-right">
            <button
              className={`rounded-[8px] p-1 transition ${isMenuOpen ? 'bg-[#d5e5f2] text-[#004782]' : 'text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-strong)] hover:text-[var(--color-primary)]'}`}
              onClick={(event) => {
                event.stopPropagation()
                onMenuToggle(row.original.id)
              }}
              type="button"
            >
              <MoreVertical className="h-4 w-4" />
            </button>
            {isMenuOpen ? renderActionsMenu(row.original) : null}
          </div>
        )
      },
    },
  ]

  const table = useReactTable({
    columns,
    data: products,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    globalFilterFn: (row, _columnId, filterValue) => {
      const query = String(filterValue).trim().toLowerCase()

      if (!query) {
        return true
      }

      return [row.original.code, row.original.name, row.original.activeIngredient, row.original.category].some((value) =>
        value.toLowerCase().includes(query),
      )
    },
    onPaginationChange: setPagination,
    onSortingChange: setSorting,
    state: {
      globalFilter,
      pagination,
      sorting,
    },
  })

  const rows = table.getRowModel().rows
  const totalRows = table.getFilteredRowModel().rows.length
  const pageStart = totalRows === 0 ? 0 : pagination.pageIndex * pagination.pageSize + 1
  const pageEnd = totalRows === 0 ? 0 : Math.min(pageStart + rows.length - 1, totalRows)

  return (
    <>
      <div className="overflow-x-auto">
        <table className="min-w-[980px] w-full border-collapse text-left">
          <thead>
            {table.getHeaderGroups().map((headerGroup) => (
              <tr key={headerGroup.id} className="border-b border-[var(--color-border)] bg-[var(--color-surface-strong)] text-xs font-semibold uppercase tracking-[0.05em] text-[var(--color-text-secondary)]">
                {headerGroup.headers.map((header) => {
                  const canSort = header.column.getCanSort()

                  return (
                    <th key={header.id} className={`px-4 py-3 ${header.column.id === 'stock' ? 'text-right' : ''}`}>
                      {header.isPlaceholder ? null : canSort ? (
                        <button
                          className={`inline-flex items-center gap-1 ${header.column.id === 'stock' ? 'ml-auto flex' : ''}`}
                          onClick={header.column.getToggleSortingHandler()}
                          type="button"
                        >
                          {flexRender(header.column.columnDef.header, header.getContext())}
                          <ArrowUpDown className="h-3.5 w-3.5" />
                        </button>
                      ) : (
                        flexRender(header.column.columnDef.header, header.getContext())
                      )}
                    </th>
                  )
                })}
              </tr>
            ))}
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr
                key={row.id}
                className={`cursor-pointer border-b border-[var(--color-border)] align-top transition hover:bg-[var(--color-surface-strong)] ${openMenuId === row.original.id ? 'bg-[var(--color-surface-tint)]/30' : ''}`}
                onClick={() => onProductSelect(row.original)}
              >
                {row.getVisibleCells().map((cell) => (
                  <td key={cell.id} className={`px-4 py-4 ${cell.column.id === 'stock' ? 'text-right' : ''} ${cell.column.id === 'actions' ? 'relative' : ''}`}>
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="flex flex-col gap-3 border-t border-[var(--color-border)] bg-[var(--color-surface-strong)] px-6 py-4 text-sm text-[var(--color-text-secondary)] md:flex-row md:items-center md:justify-between">
        <span>
          Mostrando {pageStart} a {pageEnd} de {totalRows} productos
        </span>
        <div className="flex items-center gap-2 self-end md:self-auto">
          <button
            className="flex h-8 w-8 items-center justify-center rounded-[var(--radius-control)] border border-[var(--color-border)] bg-white text-[var(--color-text-secondary)] transition disabled:cursor-not-allowed disabled:opacity-50"
            disabled={!table.getCanPreviousPage()}
            onClick={() => table.previousPage()}
            type="button"
          >
            <ArrowLeft className="h-4 w-4" />
          </button>
          {Array.from({ length: table.getPageCount() }, (_, index) => (
            <button
              key={index}
              className={`flex h-8 min-w-8 items-center justify-center rounded-[var(--radius-control)] border px-2 text-xs font-medium transition ${
                index === pagination.pageIndex
                  ? 'border-[var(--color-primary)] bg-[var(--color-surface-tint)] text-[var(--color-primary)]'
                  : 'border-[var(--color-border)] bg-white text-[var(--color-text-secondary)]'
              }`}
              onClick={() => table.setPageIndex(index)}
              type="button"
            >
              {index + 1}
            </button>
          ))}
          <button
            className="flex h-8 w-8 items-center justify-center rounded-[var(--radius-control)] border border-[var(--color-border)] bg-white text-[var(--color-text-secondary)] transition disabled:cursor-not-allowed disabled:opacity-50"
            disabled={!table.getCanNextPage()}
            onClick={() => table.nextPage()}
            type="button"
          >
            <ArrowRight className="h-4 w-4" />
          </button>
        </div>
      </div>
    </>
  )
}

function StatusBadge({ status }: { status: string }) {
  if (status === 'Optimo') {
    return <span className="inline-flex rounded-[4px] bg-[var(--color-success-bg)] px-2 py-1 text-xs font-semibold uppercase tracking-[0.05em] text-[var(--color-success-text)]">{status}</span>
  }

  if (status === 'Critico') {
    return <span className="inline-flex rounded-[4px] bg-[var(--color-warning-bg)] px-2 py-1 text-xs font-semibold uppercase tracking-[0.05em] text-[var(--color-warning-text)]">{status}</span>
  }

  return <span className="inline-flex rounded-[4px] bg-[var(--color-danger-bg)] px-2 py-1 text-xs font-semibold uppercase tracking-[0.05em] text-[var(--color-danger-text)]">{status}</span>
}
