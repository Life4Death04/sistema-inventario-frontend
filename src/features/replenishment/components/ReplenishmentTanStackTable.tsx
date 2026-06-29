import {
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  useReactTable,
  type ColumnDef,
  type PaginationState,
} from '@tanstack/react-table'
import { ArrowLeft, ArrowRight, MoreVertical, View } from 'lucide-react'
import { useEffect, useState } from 'react'

import type { ReplenishmentRow } from '@/data/mockSelectors'

interface ReplenishmentTanStackTableProps {
  rows: ReplenishmentRow[]
  globalFilter: string
  openMenuId: string | null
  onMenuToggle: (requestId: string) => void
  onOpenDetail: (request: ReplenishmentRow) => void
  renderActionsMenu: (request: ReplenishmentRow) => React.ReactNode
}

export function ReplenishmentTanStackTable({
  rows,
  globalFilter,
  openMenuId,
  onMenuToggle,
  onOpenDetail,
  renderActionsMenu,
}: ReplenishmentTanStackTableProps) {
  const [pagination, setPagination] = useState<PaginationState>({
    pageIndex: 0,
    pageSize: 6,
  })

  useEffect(() => {
    setPagination((current) => ({ ...current, pageIndex: 0 }))
  }, [globalFilter])

  const columns: ColumnDef<ReplenishmentRow>[] = [
    {
      accessorKey: 'id',
      header: 'N.º',
      cell: ({ row }) => <span className="font-data-mono text-sm text-[var(--color-text)]">{row.original.id.toUpperCase().replace('REQ-', 'R-')}</span>,
    },
    {
      accessorKey: 'items',
      header: 'Productos',
      cell: ({ row }) => (
        <div className="flex items-center gap-2">
          <span className="font-medium text-[var(--color-text)]">{row.original.items === 1 ? '1 producto' : `${row.original.items} productos`}</span>
        </div>
      ),
    },
    {
      accessorKey: 'supplier',
      header: 'Proveedor',
      cell: ({ row }) => <span className="text-sm text-[var(--color-text)]">{row.original.supplier}</span>,
    },
    {
      accessorKey: 'estimatedTotal',
      header: 'Cantidad',
      cell: ({ row }) => <span className="font-data-mono text-sm text-[var(--color-primary)]">{Math.round(row.original.estimatedTotal / Math.max(row.original.items, 1))}</span>,
    },
    {
      accessorKey: 'requestedAt',
      header: 'Fecha',
      cell: ({ row }) => <span className="text-sm text-[var(--color-text-secondary)]">{new Date(row.original.requestedAt).toLocaleDateString('es-VE')}</span>,
    },
    {
      accessorKey: 'status',
      header: 'Estado',
      cell: ({ row }) => <StatusBadge status={row.original.status} />,
    },
    {
      id: 'actions',
      header: 'Acciones',
      cell: ({ row }) => {
        const isOpen = openMenuId === row.original.id

        return (
          <div className="relative flex items-center gap-2">
            <button
              className="flex h-8 w-8 items-center justify-center text-[var(--color-text-muted)] transition hover:text-[var(--color-primary)]"
              onClick={(event) => {
                event.stopPropagation()
                onOpenDetail(row.original)
              }}
              type="button"
            >
              <View className="h-4 w-4" />
            </button>
            <button
              className={`flex h-8 w-8 items-center justify-center rounded-full transition ${isOpen ? 'bg-[var(--color-surface-strong)] text-[var(--color-primary)]' : 'text-[var(--color-text-muted)] hover:bg-[var(--color-surface-strong)] hover:text-[var(--color-primary)]'}`}
              onClick={(event) => {
                event.stopPropagation()
                onMenuToggle(row.original.id)
              }}
              type="button"
            >
              <MoreVertical className="h-4 w-4" />
            </button>
            {isOpen ? renderActionsMenu(row.original) : null}
          </div>
        )
      },
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

      return [row.original.id, row.original.supplier, row.original.status, row.original.notes].some((value) => value.toLowerCase().includes(query))
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
        <table className="min-w-[920px] w-full border-collapse">
          <thead className="bg-[var(--color-page-bg)] border-b border-[var(--color-border)]">
            {table.getHeaderGroups().map((group) => (
              <tr key={group.id}>
                {group.headers.map((header) => (
                  <th key={header.id} className={`px-6 py-4 text-left text-xs font-semibold uppercase tracking-[0.05em] text-[var(--color-text-secondary)] ${header.column.id === 'estimatedTotal' ? 'text-right' : ''}`}>
                    {header.isPlaceholder ? null : flexRender(header.column.columnDef.header, header.getContext())}
                  </th>
                ))}
              </tr>
            ))}
          </thead>
          <tbody className="divide-y divide-[var(--color-border)]">
            {pageRows.map((row) => (
              <tr key={row.id} className="cursor-pointer transition-colors hover:bg-[rgba(232,241,250,0.30)]" onClick={() => onOpenDetail(row.original)}>
                {row.getVisibleCells().map((cell) => (
                  <td key={cell.id} className={`px-6 py-4 ${cell.column.id === 'estimatedTotal' ? 'text-right' : ''} ${cell.column.id === 'actions' ? 'relative' : ''}`}>
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="flex items-center justify-between border-t border-[var(--color-border)] bg-[rgba(245,248,251,0.5)] px-6 py-4">
        <p className="text-sm text-[var(--color-text-secondary)]">
          Mostrando <span className="font-medium text-[var(--color-text)]">{pageStart}-{pageEnd}</span> de <span className="font-medium text-[var(--color-text)]">{totalRows}</span> solicitudes
        </p>
        <div className="flex items-center gap-1">
          <button className="flex h-8 w-8 items-center justify-center rounded border border-[var(--color-border)] text-[var(--color-text-secondary)] transition hover:bg-[var(--color-surface)] disabled:opacity-50" disabled={!table.getCanPreviousPage()} onClick={() => table.previousPage()} type="button">
            <ArrowLeft className="h-4 w-4" />
          </button>
          {Array.from({ length: table.getPageCount() }, (_, index) => (
            <button
              key={index}
              className={`flex h-8 w-8 items-center justify-center rounded text-sm font-medium transition ${index === pagination.pageIndex ? 'bg-[var(--color-primary)] text-white' : 'border border-[var(--color-border)] text-[var(--color-text-secondary)] hover:bg-[var(--color-surface)]'}`}
              onClick={() => table.setPageIndex(index)}
              type="button"
            >
              {index + 1}
            </button>
          ))}
          <button className="flex h-8 w-8 items-center justify-center rounded border border-[var(--color-border)] text-[var(--color-text-secondary)] transition hover:bg-[var(--color-surface)] disabled:opacity-50" disabled={!table.getCanNextPage()} onClick={() => table.nextPage()} type="button">
            <ArrowRight className="h-4 w-4" />
          </button>
        </div>
      </div>
    </section>
  )
}

function StatusBadge({ status }: { status: string }) {
  if (status === 'Pendiente') {
    return <span className="rounded-md bg-[var(--color-surface-container)] px-2 py-1 text-[11px] font-bold uppercase text-[var(--color-text-secondary)]">Pendiente</span>
  }
  if (status === 'Enviada') {
    return <span className="rounded-md bg-[var(--color-surface-tint)] px-2 py-1 text-[11px] font-bold uppercase text-[var(--color-primary)]">Enviada</span>
  }
  if (status === 'Recibida') {
    return <span className="rounded-md bg-[var(--color-success-bg)] px-2 py-1 text-[11px] font-bold uppercase text-[var(--color-success-text)]">Recibida</span>
  }
  return <span className="rounded-md bg-[var(--color-danger-bg)] px-2 py-1 text-[11px] font-bold uppercase text-[var(--color-danger-text)]">Cancelada</span>
}
