import { Badge } from '@/components/ui/Badge'
import { Card } from '@/components/ui/Card'
import { getAlertItems } from '@/data/mockSelectors'

export function AlertsPage() {
  const alerts = getAlertItems()

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      {alerts.map((alert) => (
        <Card key={alert.id}>
          <div className="mb-3">
            <Badge tone={alert.level === 'danger' ? 'danger' : alert.level === 'warning' ? 'warning' : 'info'}>
              {alert.level === 'danger' ? 'Critica' : alert.level === 'warning' ? 'Preventiva' : 'Seguimiento'}
            </Badge>
          </div>
          <h2 className="text-xl font-semibold text-slate-950">{alert.title}</h2>
          <p className="mt-2 text-sm text-slate-600">{alert.message}</p>
        </Card>
      ))}
    </div>
  )
}
