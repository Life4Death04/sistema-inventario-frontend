import {
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  useReactTable,
  type ColumnDef,
  type PaginationState,
} from '@tanstack/react-table'
import { ArrowLeft, ArrowRight, MoreVertical, SquarePen } from 'lucide-react'
import { useEffect, useState } from 'react'

import type { UserRow } from '@/data/mockSelectors'

interface UsersTanStackTableProps {
  rows: UserRow[]
  globalFilter: string
  onEditUser: (user: UserRow) => void
}

export function UsersTanStackTable({ rows, globalFilter, onEditUser }: UsersTanStackTableProps) {
  const [pagination, setPagination] = useState<PaginationState>({
    pageIndex: 0,
    pageSize: 6,
  })
  const [openMenuId, setOpenMenuId] = useState<string | null>(null)

  useEffect(() => {
    setPagination((current) => ({ ...current, pageIndex: 0 }))
  }, [globalFilter, rows])

  const columns: ColumnDef<UserRow>[] = [
    {
      accessorKey: 'fullName',
      header: 'Usuario',
      cell: ({ row }) => <UserIdentityCell user={row.original} />,
    },
    {
      accessorKey: 'role',
      header: 'Rol',
      cell: ({ row }) => <RoleBadge role={row.original.role} roleKey={row.original.roleKey} />,
    },
    {
      accessorKey: 'lastAccess',
      header: 'Ultimo acceso',
      cell: ({ row }) => <LastAccessCell lastAccess={row.original.lastAccess} />,
    },
    {
      accessorKey: 'active',
      header: 'Estado',
      cell: ({ row }) => <StatusCell active={row.original.active} />,
    },
    {
      id: 'actions',
      header: 'Acciones',
      cell: ({ row }) => (
        <ActionsCell
          isMenuOpen={openMenuId === row.original.id}
          onEdit={() => onEditUser(row.original)}
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

      return [row.original.fullName, row.original.email, row.original.role].some((value) => value.toLowerCase().includes(query))
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
              <tr key={headerGroup.id} className="border-b border-[var(--color-border)] bg-[color:rgba(245,248,251,0.55)]">
                {headerGroup.headers.map((header) => (
                  <th
                    key={header.id}
                    className={`px-6 py-4 text-xs font-semibold uppercase tracking-[0.05em] text-[var(--color-text-secondary)] ${header.column.id === 'actions' ? 'text-right' : ''}`}
                  >
                    {header.isPlaceholder ? null : flexRender(header.column.columnDef.header, header.getContext())}
                  </th>
                ))}
              </tr>
            ))}
          </thead>
          <tbody className="divide-y divide-[var(--color-border)]">
            {pageRows.map((row) => (
              <tr key={row.id} className="transition-colors hover:bg-[color:rgba(245,248,251,0.55)]">
                {row.getVisibleCells().map((cell) => (
                  <td key={cell.id} className={`px-6 py-4 ${cell.column.id === 'actions' ? 'text-right' : ''}`}>
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="flex flex-col gap-4 border-t border-[var(--color-border)] bg-[color:rgba(245,248,251,0.2)] px-6 py-4 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-[var(--color-text-secondary)]">
          Mostrando <span className="font-medium text-[var(--color-text)]">{pageStart}-{pageEnd}</span> de{' '}
          <span className="font-medium text-[var(--color-text)]">{totalRows}</span> usuarios
        </p>
        <div className="flex items-center gap-1">
          <button
            className="flex h-8 w-8 items-center justify-center rounded-[8px] border border-[var(--color-border)] text-[var(--color-text-muted)] transition hover:bg-[var(--color-surface)] disabled:opacity-50"
            disabled={!table.getCanPreviousPage()}
            onClick={() => table.previousPage()}
            type="button"
          >
            <ArrowLeft className="h-4 w-4" />
          </button>
          {Array.from({ length: table.getPageCount() }, (_, index) => (
            <button
              key={index}
              className={`flex h-8 w-8 items-center justify-center rounded-[8px] border text-sm font-medium transition ${
                index === pagination.pageIndex
                  ? 'border-[var(--color-primary)] bg-[var(--color-primary)] text-white'
                  : 'border-[var(--color-border)] text-[var(--color-text-secondary)] hover:bg-[var(--color-surface)]'
              }`}
              onClick={() => table.setPageIndex(index)}
              type="button"
            >
              {index + 1}
            </button>
          ))}
          <button
            className="flex h-8 w-8 items-center justify-center rounded-[8px] border border-[var(--color-border)] text-[var(--color-text-muted)] transition hover:bg-[var(--color-surface)] disabled:opacity-50"
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

function UserIdentityCell({ user }: { user: UserRow }) {
  return (
    <div className="flex items-center gap-3">
      <div className={`flex h-10 w-10 items-center justify-center rounded-full text-sm font-semibold ${getAvatarClasses(user.roleKey)}`}>
        {user.initials}
      </div>
      <div className="flex flex-col">
        <span className="text-sm font-medium text-[var(--color-text)]">{user.fullName}</span>
        <span className="text-sm text-[var(--color-text-muted)]">{user.email}</span>
      </div>
    </div>
  )
}

function RoleBadge({ role, roleKey }: { role: string; roleKey: UserRow['roleKey'] }) {
  return <span className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${getRoleBadgeClasses(roleKey)}`}>{role}</span>
}

function LastAccessCell({ lastAccess }: { lastAccess: string | null }) {
  if (!lastAccess) {
    return (
      <div className="flex flex-col font-data-mono text-sm text-[var(--color-text-muted)]">
        <span>—</span>
        <span>—</span>
      </div>
    )
  }

  const { date, time } = formatLastAccess(lastAccess)

  return (
    <div className="flex flex-col font-data-mono text-sm text-[var(--color-text)]">
      <span>{date}</span>
      <span className="text-[var(--color-text-muted)]">{time}</span>
    </div>
  )
}

function StatusCell({ active }: { active: boolean }) {
  return (
    <div className="flex items-center gap-2">
      <span className={`h-2 w-2 rounded-full ${active ? 'bg-[var(--color-success-text)]' : 'bg-[var(--color-text-muted)]'}`} />
      <span className={`text-sm font-medium ${active ? 'text-[var(--color-text)]' : 'text-[var(--color-text-muted)]'}`}>{active ? 'Activo' : 'Inactivo'}</span>
    </div>
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
    <div className="relative inline-flex items-center justify-end gap-1 text-[var(--color-text-muted)]">
      <button className="rounded-[8px] p-1 transition hover:text-[var(--color-primary)]" onClick={onEdit} type="button">
        <SquarePen className="h-5 w-5" />
      </button>
      <button className="rounded-[8px] p-1 transition hover:text-[var(--color-primary)]" onClick={onToggleMenu} type="button">
        <MoreVertical className="h-5 w-5" />
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

function getAvatarClasses(role: UserRow['roleKey']) {
  if (role === 'ADMIN') {
    return 'bg-[var(--color-surface-tint)]/18 text-[var(--color-primary)]'
  }

  if (role === 'MANAGER') {
    return 'bg-[var(--color-success-bg)] text-[var(--color-success-text)]'
  }

  return 'bg-[var(--color-surface-strong)] text-[var(--color-text-secondary)]'
}

function getRoleBadgeClasses(role: UserRow['roleKey']) {
  if (role === 'ADMIN') {
    return 'bg-[var(--color-surface-tint)]/18 text-[var(--color-primary)]'
  }

  if (role === 'MANAGER') {
    return 'bg-[var(--color-success-bg)] text-[var(--color-success-text)]'
  }

  return 'bg-[var(--color-surface-strong)] text-[var(--color-text-secondary)]'
}

function formatLastAccess(value: string) {
  const date = new Date(value)

  return {
    date: new Intl.DateTimeFormat('es-VE', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    }).format(date),
    time: new Intl.DateTimeFormat('es-VE', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    }).format(date),
  }
}
