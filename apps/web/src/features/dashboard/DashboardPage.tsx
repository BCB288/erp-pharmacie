import { useDashboard } from './useDashboard'
import type { AlertsResponse } from '../../types/inventory'
import type { Sale } from '../../types/pos'

/* ------------------------------------------------------------------ */
/*  Formatting helpers                                                 */
/* ------------------------------------------------------------------ */

function fmtCurrency(v: number) {
  return v.toLocaleString('fr-FR', { style: 'currency', currency: 'XOF', maximumFractionDigits: 0 })
}

function fmtDate(iso: string) {
  return new Date(iso).toLocaleString('fr-FR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

function fmtExpiryDate(iso: string) {
  return new Date(iso).toLocaleDateString('fr-FR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  })
}

/* ------------------------------------------------------------------ */
/*  KPI Card                                                           */
/* ------------------------------------------------------------------ */

function KpiCard({
  title,
  value,
  subtitle,
  icon,
  color,
}: {
  title: string
  value: string
  subtitle?: string
  icon: React.ReactNode
  color: 'blue' | 'amber' | 'red' | 'green'
}) {
  const colors = {
    blue: 'bg-blue-50 text-blue-600',
    amber: 'bg-amber-50 text-amber-600',
    red: 'bg-red-50 text-red-600',
    green: 'bg-green-50 text-green-600',
  }

  return (
    <div className="rounded-lg border border-gray-200 bg-white p-5">
      <div className="flex items-center gap-3">
        <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${colors[color]}`}>
          {icon}
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium text-gray-500">{title}</p>
          <p className="mt-1 text-2xl font-semibold text-gray-900">{value}</p>
          {subtitle && <p className="mt-0.5 text-xs text-gray-400">{subtitle}</p>}
        </div>
      </div>
    </div>
  )
}

/* ------------------------------------------------------------------ */
/*  Alerts Panel                                                       */
/* ------------------------------------------------------------------ */

function AlertsPanel({ alerts }: { alerts: AlertsResponse }) {
  const hasAlerts =
    alerts.low_stock.length > 0 ||
    alerts.expiring.length > 0 ||
    alerts.expired.length > 0

  if (!hasAlerts) {
    return (
      <div className="rounded-lg border border-gray-200 bg-white p-5">
        <h2 className="text-lg font-semibold text-gray-900">Alertes stock</h2>
        <p className="mt-3 text-sm text-gray-500">Aucune alerte pour le moment.</p>
      </div>
    )
  }

  return (
    <div className="rounded-lg border border-gray-200 bg-white p-5">
      <h2 className="text-lg font-semibold text-gray-900">Alertes stock</h2>

      <div className="mt-4 space-y-4">
        {/* Expired batches */}
        {alerts.expired.length > 0 && (
          <div>
            <h3 className="flex items-center gap-1.5 text-sm font-medium text-red-700">
              <span className="inline-block h-2 w-2 rounded-full bg-red-500" />
              Lots expir&eacute;s ({alerts.expired.length})
            </h3>
            <ul className="mt-2 space-y-1">
              {alerts.expired.slice(0, 5).map((a) => (
                <li
                  key={a.id}
                  className="flex items-center justify-between rounded bg-red-50 px-3 py-2 text-sm"
                >
                  <span className="font-medium text-red-800">
                    {a.drugs?.name ?? 'Produit inconnu'}{' '}
                    <span className="font-normal text-red-600">
                      — lot {a.batch_number}
                    </span>
                  </span>
                  <span className="text-xs text-red-600">
                    {fmtExpiryDate(a.expiry_date)} &middot; {a.quantity} unit.
                  </span>
                </li>
              ))}
              {alerts.expired.length > 5 && (
                <li className="px-3 text-xs text-red-500">
                  +{alerts.expired.length - 5} autres
                </li>
              )}
            </ul>
          </div>
        )}

        {/* Expiring soon */}
        {alerts.expiring.length > 0 && (
          <div>
            <h3 className="flex items-center gap-1.5 text-sm font-medium text-amber-700">
              <span className="inline-block h-2 w-2 rounded-full bg-amber-500" />
              Expiration proche ({alerts.expiring.length})
            </h3>
            <ul className="mt-2 space-y-1">
              {alerts.expiring.slice(0, 5).map((a) => (
                <li
                  key={a.id}
                  className="flex items-center justify-between rounded bg-amber-50 px-3 py-2 text-sm"
                >
                  <span className="font-medium text-amber-800">
                    {a.drugs?.name ?? 'Produit inconnu'}{' '}
                    <span className="font-normal text-amber-600">
                      — lot {a.batch_number}
                    </span>
                  </span>
                  <span className="text-xs text-amber-600">
                    {fmtExpiryDate(a.expiry_date)} &middot; {a.days_until_expiry}j restants
                  </span>
                </li>
              ))}
              {alerts.expiring.length > 5 && (
                <li className="px-3 text-xs text-amber-500">
                  +{alerts.expiring.length - 5} autres
                </li>
              )}
            </ul>
          </div>
        )}

        {/* Low stock */}
        {alerts.low_stock.length > 0 && (
          <div>
            <h3 className="flex items-center gap-1.5 text-sm font-medium text-blue-700">
              <span className="inline-block h-2 w-2 rounded-full bg-blue-500" />
              Stock faible ({alerts.low_stock.length})
            </h3>
            <ul className="mt-2 space-y-1">
              {alerts.low_stock.slice(0, 5).map((a) => (
                <li
                  key={a.id}
                  className="flex items-center justify-between rounded bg-blue-50 px-3 py-2 text-sm"
                >
                  <span className="font-medium text-blue-800">{a.name}</span>
                  <span className="text-xs text-blue-600">
                    {a.total_stock} / {a.reorder_level} min
                  </span>
                </li>
              ))}
              {alerts.low_stock.length > 5 && (
                <li className="px-3 text-xs text-blue-500">
                  +{alerts.low_stock.length - 5} autres
                </li>
              )}
            </ul>
          </div>
        )}
      </div>
    </div>
  )
}

/* ------------------------------------------------------------------ */
/*  Recent Activity Feed                                               */
/* ------------------------------------------------------------------ */

function RecentActivity({ sales }: { sales: Sale[] }) {
  if (sales.length === 0) {
    return (
      <div className="rounded-lg border border-gray-200 bg-white p-5">
        <h2 className="text-lg font-semibold text-gray-900">Activit&eacute; r&eacute;cente</h2>
        <p className="mt-3 text-sm text-gray-500">Aucune vente enregistr&eacute;e.</p>
      </div>
    )
  }

  return (
    <div className="rounded-lg border border-gray-200 bg-white p-5">
      <h2 className="text-lg font-semibold text-gray-900">Activit&eacute; r&eacute;cente</h2>

      <div className="mt-4 space-y-3">
        {sales.map((sale) => (
          <div
            key={sale.id}
            className="flex items-center justify-between rounded border border-gray-100 px-4 py-3"
          >
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-gray-900">
                  {sale.sale_number}
                </span>
                <StatusBadge status={sale.status} />
              </div>
              <p className="mt-0.5 text-xs text-gray-500">
                {fmtDate(sale.created_at)}
                {sale.profiles && <> &middot; {sale.profiles.full_name}</>}
                {sale.patients && (
                  <> &middot; Patient: {sale.patients.first_name} {sale.patients.last_name}</>
                )}
              </p>
              {sale.sale_items.length > 0 && (
                <p className="mt-1 truncate text-xs text-gray-400">
                  {sale.sale_items
                    .slice(0, 3)
                    .map((i) => i.drugs.name)
                    .join(', ')}
                  {sale.sale_items.length > 3 && ` +${sale.sale_items.length - 3}`}
                </p>
              )}
            </div>
            <div className="ml-4 text-right">
              <p className="text-sm font-semibold text-gray-900">
                {fmtCurrency(sale.total)}
              </p>
              <p className="text-xs text-gray-400">
                {sale.sale_items.length} article{sale.sale_items.length > 1 ? 's' : ''}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    completed: 'bg-green-100 text-green-700',
    voided: 'bg-red-100 text-red-700',
  }
  const labels: Record<string, string> = {
    completed: 'Termin\u00e9e',
    voided: 'Annul\u00e9e',
  }

  return (
    <span
      className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${styles[status] ?? 'bg-gray-100 text-gray-600'}`}
    >
      {labels[status] ?? status}
    </span>
  )
}

/* ------------------------------------------------------------------ */
/*  SVG Icons (inline, no extra deps)                                  */
/* ------------------------------------------------------------------ */

const IconSales = (
  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
)

const IconLowStock = (
  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
  </svg>
)

const IconExpiry = (
  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
)

/* ------------------------------------------------------------------ */
/*  Dashboard Page                                                     */
/* ------------------------------------------------------------------ */

export function DashboardPage() {
  const {
    todaySalesTotal,
    todaySalesCount,
    lowStockCount,
    expiringCount,
    alerts,
    recentSales,
    loading,
    error,
    refresh,
  } = useDashboard()

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Tableau de bord</h1>
          <p className="mt-1 text-sm text-gray-500">
            Vue d'ensemble de votre pharmacie
          </p>
        </div>
        <button
          onClick={refresh}
          disabled={loading}
          className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
        >
          Actualiser
        </button>
      </div>

      {/* Error banner */}
      {error && (
        <div className="mt-4 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">
          Erreur : {error}
        </div>
      )}

      {/* Loading spinner */}
      {loading ? (
        <div className="mt-12 flex justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent" />
        </div>
      ) : (
        <>
          {/* KPI Cards */}
          <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <KpiCard
              title="Ventes du jour"
              value={fmtCurrency(todaySalesTotal)}
              subtitle={`${todaySalesCount} vente${todaySalesCount > 1 ? 's' : ''}`}
              icon={IconSales}
              color="green"
            />
            <KpiCard
              title="Stock faible"
              value={String(lowStockCount)}
              subtitle="produits sous le seuil"
              icon={IconLowStock}
              color={lowStockCount > 0 ? 'amber' : 'blue'}
            />
            <KpiCard
              title="Lots expir\u00e9s / proches"
              value={String(expiringCount)}
              subtitle={`${alerts.expired.length} expir\u00e9(s), ${alerts.expiring.length} \u00e0 surveiller`}
              icon={IconExpiry}
              color={alerts.expired.length > 0 ? 'red' : expiringCount > 0 ? 'amber' : 'blue'}
            />
          </div>

          {/* Two-column layout: Alerts + Recent Activity */}
          <div className="mt-6 grid gap-6 lg:grid-cols-2">
            <AlertsPanel alerts={alerts} />
            <RecentActivity sales={recentSales} />
          </div>
        </>
      )}
    </div>
  )
}
