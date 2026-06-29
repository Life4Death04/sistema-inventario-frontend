import { Badge } from '@/components/ui/Badge'
import { Card } from '@/components/ui/Card'
import { Table } from '@/components/ui/Table'
import { getReplenishmentRows } from '@/data/mockSelectors'
import { formatCurrency, formatDate } from '@/lib/utils'

export function ReplenishmentPage() {
  const requests = getReplenishmentRows()

  return (
    <Card>
      <div className="mb-5">
        <p className="text-sm text-slate-500">Solicitudes a proveedores</p>
        <h2 className="text-2xl font-semibold text-slate-950">Reposicion</h2>
      </div>

      <Table
        columns={[
          { key: 'id', header: 'Solicitud' },
          { key: 'supplier', header: 'Proveedor' },
          { key: 'requestedBy', header: 'Solicitada por' },
          {
            key: 'status',
            header: 'Estado',
            render: (row) => <Badge tone={row.status === 'Pendiente' ? 'warning' : row.status === 'Enviada' ? 'info' : 'success'}>{row.status}</Badge>,
          },
          { key: 'items', header: 'Items' },
          {
            key: 'estimatedTotal',
            header: 'Total estimado',
            render: (row) => formatCurrency(row.estimatedTotal),
          },
          {
            key: 'requestedAt',
            header: 'Fecha',
            render: (row) => formatDate(row.requestedAt),
          },
        ]}
        data={requests}
      />
    </Card>
  )
}
