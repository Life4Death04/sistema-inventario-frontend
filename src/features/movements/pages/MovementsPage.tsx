import { Badge } from '@/components/ui/Badge'
import { Card } from '@/components/ui/Card'
import { Table } from '@/components/ui/Table'
import { getMovementRows } from '@/data/mockSelectors'
import { formatDate } from '@/lib/utils'

export function MovementsPage() {
  const movements = getMovementRows()

  return (
    <Card>
      <div className="mb-5">
        <p className="text-sm text-slate-500">Trazabilidad</p>
        <h2 className="text-2xl font-semibold text-slate-950">Movimientos de inventario</h2>
      </div>

      <Table
        columns={[
          { key: 'product', header: 'Producto' },
          {
            key: 'type',
            header: 'Tipo',
            render: (row) => <Badge tone={row.type === 'Entrada' ? 'success' : row.type === 'Salida' ? 'warning' : 'info'}>{row.type}</Badge>,
          },
          { key: 'quantity', header: 'Cantidad' },
          { key: 'resultingStock', header: 'Stock resultante' },
          { key: 'reason', header: 'Motivo' },
          { key: 'user', header: 'Responsable' },
          {
            key: 'createdAt',
            header: 'Fecha',
            render: (row) => formatDate(row.createdAt),
          },
        ]}
        data={movements}
      />
    </Card>
  )
}
