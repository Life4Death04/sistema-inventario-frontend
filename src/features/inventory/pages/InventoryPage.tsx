import { Badge } from '@/components/ui/Badge'
import { Card } from '@/components/ui/Card'
import { Table } from '@/components/ui/Table'
import { getInventoryRows } from '@/data/mockSelectors'

export function InventoryPage() {
  const inventory = getInventoryRows()

  return (
    <Card>
      <div className="mb-5">
        <p className="text-sm text-slate-500">Seguimiento operativo</p>
        <h2 className="text-2xl font-semibold text-slate-950">Existencias e inventario</h2>
      </div>

      <Table
        columns={[
          { key: 'name', header: 'Producto' },
          { key: 'category', header: 'Categoria' },
          { key: 'stock', header: 'Stock actual' },
          { key: 'minStock', header: 'Minimo' },
          {
            key: 'difference',
            header: 'Diferencia',
            render: (row) => <span className={row.difference < 0 ? 'font-semibold text-rose-700' : 'font-semibold text-emerald-700'}>{row.difference}</span>,
          },
          {
            key: 'status',
            header: 'Estado',
            render: (row) => <Badge tone={row.status === 'Disponible' ? 'success' : row.status === 'Critico' ? 'warning' : 'danger'}>{row.status}</Badge>,
          },
        ]}
        data={inventory}
      />
    </Card>
  )
}
