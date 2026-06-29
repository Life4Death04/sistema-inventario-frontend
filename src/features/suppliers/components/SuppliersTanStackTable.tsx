import {
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  useReactTable,
  type ColumnDef,
  type PaginationState,
} from '@tanstack/react-table'
import { ArrowLeft, ArrowRight, EllipsisVertical, Eye, MessageCircle } from 'lucide-react'
import { useEffect, useState } from 'react'

import type { SupplierRow } from '@/data/mockSelectors'

interface SuppliersTanStackTableProps {
  rows: SupplierRow[]
  globalFilter: string
  onEditSupplier: (supplier: SupplierRow) => void
}

export function SuppliersTanStackTable({ rows, globalFilter, onEditSupplier }: SuppliersTanStackTableProps) {
  const [pagination, setPagination] = useState<PaginationState>({
    pageIndex: 0,
    pageSize: 6,
  })
  const [openMenuId, setOpenMenuId] = useState<string | null>(null)

  useEffect(() => {
    setPagination((current) => ({ ...current, pageIndex: 0 }))
  }, [globalFilter, rows])

  const columns: ColumnDef<SupplierRow>[] = [
    {
      accessorKey: 'name',
      header: 'Proveedor',
      cell: ({ row }) => <SupplierIdentityCell supplier={row.original} />,
    },
    {
      accessorKey: 'contactName',
      header: 'Contacto',
      cell: ({ row }) => <span className="text-sm text-[var(--color-text-secondary)]">{row.original.contactName}</span>,
    },
    {
      accessorKey: 'whatsapp',
      header: 'WhatsApp',
      cell: ({ row }) => <WhatsappCell whatsapp={row.original.whatsapp} />,
    },
    {
      accessorKey: 'products',
      header: 'Productos',
      cell: ({ row }) => <ProductsCell count={row.original.products} />,
    },
    {
      accessorKey: 'active',
      header: 'Estado',
      cell: ({ row }) => <StatusBadge active={row.original.active} />,
    },
    {
      id: 'actions',
      header: 'Acciones',
      cell: ({ row }) => (
        <ActionsCell
          isMenuOpen={openMenuId === row.original.id}
          onEdit={() => onEditSupplier(row.original)}
          onToggleMenu={() => setOpenMenuId((current) => (current === row.original.id ? null : row.original.id))}
        />
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

      return [row.original.name, row.original.rif, row.original.contactName, row.original.whatsapp].some((value) =>
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
        <table className="min-w-[900px] w-full border-collapse text-left">
          <thead>
            {table.getHeaderGroups().map((headerGroup) => (
              <tr key={headerGroup.id} className="border-b border-[var(--color-border)] bg-[color:rgba(245,248,251,0.55)]">
                {headerGroup.headers.map((header) => (
                  <th
                    key={header.id}
                    className={`px-4 py-3 text-xs font-semibold uppercase tracking-[0.05em] text-[var(--color-text-secondary)] ${
                      header.column.id === 'products' ? 'text-center' : header.column.id === 'actions' ? 'text-right' : ''
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
              <tr key={row.id} className="group transition-colors hover:bg-[color:rgba(245,248,251,0.55)]">
                {row.getVisibleCells().map((cell) => (
                  <td
                    key={cell.id}
                    className={`px-4 py-3 ${cell.column.id === 'products' ? 'text-center' : cell.column.id === 'actions' ? 'text-right' : ''}`}
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
          Mostrando {pageStart}-{pageEnd} de {totalRows} proveedores
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
  return (
    <div className="flex flex-col">
      <span className="text-sm font-medium text-[var(--color-text)]">{supplier.name}</span>
      <span className="mt-0.5 font-data-mono text-xs text-[var(--color-text-muted)]">RIF: {supplier.rif}</span>
    </div>
  )
}

function WhatsappCell({ whatsapp }: { whatsapp: string }) {
  return (
    <div className="flex items-center gap-1.5">
      <MessageCircle className="h-4 w-4 text-[var(--color-success-text)]" />
      <span className="font-data-mono text-xs text-[var(--color-text-secondary)]">{formatPhone(whatsapp)}</span>
    </div>
  )
}

function ProductsCell({ count }: { count: number }) {
  if (count === 0) {
    return <span className="text-sm italic text-[var(--color-text-muted)]">Sin productos</span>
  }

  return (
    <button className="inline-flex items-center justify-center rounded-full bg-[var(--color-surface-tint)]/18 px-2.5 py-1 text-sm text-[var(--color-primary)] transition hover:bg-[var(--color-primary)] hover:text-white" type="button">
      {count} productos
    </button>
  )
}

function StatusBadge({ active }: { active: boolean }) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold uppercase tracking-[0.05em] ${
        active ? 'bg-[var(--color-success-bg)] text-[var(--color-success-text)]' : 'bg-[var(--color-surface-strong)] text-[var(--color-text-secondary)]'
      }`}
    >
      {active ? 'Activo' : 'Inactivo'}
    </span>
  )
}

function ActionsCell({
  isMenuOpen,
  onEdit,
  onToggleMenu,
}: {
  isMenuOpen: boolean
  onEdit: () => void
  onToggleMenu: () => void
}) {
  return (
    <div className="relative inline-flex items-center justify-end gap-1 opacity-0 transition-opacity group-hover:opacity-100">
      <button className="rounded p-1.5 text-[var(--color-text-muted)] transition hover:bg-[var(--color-surface-tint)]/18 hover:text-[var(--color-primary)]" onClick={onEdit} type="button">
        <Eye className="h-5 w-5" />
      </button>
      <button className="rounded p-1.5 text-[var(--color-text-muted)] transition hover:bg-[var(--color-surface-strong)] hover:text-[var(--color-text)]" onClick={onToggleMenu} type="button">
        <EllipsisVertical className="h-5 w-5" />
      </button>
      {isMenuOpen ? (
        <div className="absolute right-0 top-full z-20 mt-2 w-56 rounded-[8px] border border-[var(--color-border)] bg-[var(--color-surface)] py-1 text-left shadow-lg">
          <button className="block w-full px-4 py-2 text-sm text-[var(--color-text-secondary)] hover:bg-[var(--color-page-bg)]" type="button">
            Acciones disponibles proximamente
          </button>
          <div className="mx-4 my-1 h-px bg-[var(--color-border)]" />
          <button className="block w-full px-4 py-2 text-sm text-[var(--color-text-muted)]" type="button">
            Menu de acciones pendiente
          </button>
        </div>
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
