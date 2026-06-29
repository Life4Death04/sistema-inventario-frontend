import { Badge } from '@/components/ui/Badge'
import { Card } from '@/components/ui/Card'
import { Table } from '@/components/ui/Table'
import { getSupplierRows } from '@/data/mockSelectors'

export function SuppliersPage() {
  const suppliers = getSupplierRows()

  return (
    <Card>
      <div className="mb-5">
        <p className="text-sm text-slate-500">Gestion de terceros</p>
        <h2 className="text-2xl font-semibold text-slate-950">Proveedores</h2>
      </div>

      <Table
        columns={[
          { key: 'name', header: 'Proveedor' },
          { key: 'rif', header: 'RIF' },
          { key: 'whatsapp', header: 'WhatsApp' },
          { key: 'address', header: 'Direccion' },
          { key: 'products', header: 'Productos asociados' },
          {
            key: 'active',
            header: 'Estado',
            render: (row) => <Badge tone={row.active ? 'success' : 'danger'}>{row.active ? 'Activo' : 'Inactivo'}</Badge>,
          },
        ]}
        data={suppliers}
      />
    </Card>
  )
}
