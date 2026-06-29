import { Badge } from '@/components/ui/Badge'
import { Card } from '@/components/ui/Card'
import { Table } from '@/components/ui/Table'
import { getUserRows } from '@/data/mockSelectors'
import { formatDate } from '@/lib/utils'

export function UsersPage() {
  const users = getUserRows()

  return (
    <Card>
      <div className="mb-5">
        <p className="text-sm text-slate-500">Control de acceso</p>
        <h2 className="text-2xl font-semibold text-slate-950">Usuarios y roles</h2>
      </div>

      <Table
        columns={[
          { key: 'fullName', header: 'Nombre' },
          { key: 'email', header: 'Correo' },
          { key: 'phone', header: 'Telefono' },
          { key: 'role', header: 'Rol' },
          {
            key: 'active',
            header: 'Estado',
            render: (row) => <Badge tone={row.active ? 'success' : 'danger'}>{row.active ? 'Activo' : 'Inactivo'}</Badge>,
          },
          {
            key: 'createdAt',
            header: 'Creado',
            render: (row) => formatDate(row.createdAt),
          },
        ]}
        data={users}
      />
    </Card>
  )
}
