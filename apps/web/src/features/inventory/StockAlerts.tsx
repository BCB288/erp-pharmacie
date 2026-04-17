import type { AlertsResponse } from '../../types/inventory'

interface StockAlertsProps {
  alerts: AlertsResponse
  loading: boolean
}

export function StockAlerts({ alerts, loading }: StockAlertsProps) {
  const totalAlerts =
    alerts.low_stock.length + alerts.expiring.length + alerts.expired.length

  if (loading) {
    return (
      <div className="rounded-lg border border-gray-200 bg-white p-4">
        <p className="text-sm text-gray-400">Chargement des alertes...</p>
      </div>
    )
  }

  if (totalAlerts === 0) {
    return (
      <div className="rounded-lg border border-gray-200 bg-white p-4">
        <h3 className="text-sm font-semibold text-gray-700">Alertes stock</h3>
        <p className="mt-2 text-sm text-green-600">
          Aucune alerte en cours.
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Expired batches */}
      {alerts.expired.length > 0 && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4">
          <h3 className="flex items-center gap-2 text-sm font-semibold text-red-800">
            <span className="inline-block h-2 w-2 rounded-full bg-red-500" />
            Lots expires ({alerts.expired.length})
          </h3>
          <ul className="mt-2 space-y-1">
            {alerts.expired.map((a) => (
              <li key={a.id} className="text-sm text-red-700">
                <span className="font-medium">{a.drugs?.name ?? 'N/A'}</span>
                {' '}— Lot {a.batch_number}, {a.quantity} unites,
                expire le {new Date(a.expiry_date).toLocaleDateString('fr-FR')}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Expiring soon */}
      {alerts.expiring.length > 0 && (
        <div className="rounded-lg border border-amber-200 bg-amber-50 p-4">
          <h3 className="flex items-center gap-2 text-sm font-semibold text-amber-800">
            <span className="inline-block h-2 w-2 rounded-full bg-amber-500" />
            Expiration proche ({alerts.expiring.length})
          </h3>
          <ul className="mt-2 space-y-1">
            {alerts.expiring.map((a) => (
              <li key={a.id} className="text-sm text-amber-700">
                <span className="font-medium">{a.drugs?.name ?? 'N/A'}</span>
                {' '}— Lot {a.batch_number}, {a.quantity} unites,
                expire dans {a.days_until_expiry} jour(s)
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Low stock */}
      {alerts.low_stock.length > 0 && (
        <div className="rounded-lg border border-blue-200 bg-blue-50 p-4">
          <h3 className="flex items-center gap-2 text-sm font-semibold text-blue-800">
            <span className="inline-block h-2 w-2 rounded-full bg-blue-500" />
            Stock bas ({alerts.low_stock.length})
          </h3>
          <ul className="mt-2 space-y-1">
            {alerts.low_stock.map((a) => (
              <li key={a.id} className="text-sm text-blue-700">
                <span className="font-medium">{a.name}</span>
                {' '}— {a.total_stock} / {a.reorder_level} (seuil)
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}
