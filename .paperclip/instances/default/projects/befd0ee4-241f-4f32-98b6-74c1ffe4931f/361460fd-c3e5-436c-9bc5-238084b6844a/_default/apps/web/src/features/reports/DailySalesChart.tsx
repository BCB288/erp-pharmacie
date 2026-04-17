import type { DailySalesResponse } from '../../types/reports'

interface DailySalesChartProps {
  data: DailySalesResponse
}

function fmt(n: number) {
  return n.toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

function fmtDate(iso: string) {
  const [, m, d] = iso.split('-')
  return `${d}/${m}`
}

const METHOD_COLORS: Record<string, string> = {
  cash: 'bg-green-500',
  card: 'bg-blue-500',
  mobile: 'bg-purple-500',
}

const METHOD_LABELS: Record<string, string> = {
  cash: 'Especes',
  card: 'Carte',
  mobile: 'Mobile',
}

export function DailySalesChart({ data }: DailySalesChartProps) {
  const { summary, days } = data
  const maxRevenue = Math.max(...days.map((d) => d.total_revenue), 1)

  return (
    <div className="rounded-lg border border-gray-200 bg-white p-6">
      <h2 className="text-lg font-semibold text-gray-900">Ventes journalieres</h2>

      {/* Summary cards */}
      <div className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-4">
        <div className="rounded-md bg-blue-50 p-3">
          <p className="text-xs font-medium text-blue-600">Chiffre d'affaires</p>
          <p className="mt-1 text-lg font-bold text-blue-900">{fmt(summary.total_revenue)} F</p>
        </div>
        <div className="rounded-md bg-green-50 p-3">
          <p className="text-xs font-medium text-green-600">Ventes</p>
          <p className="mt-1 text-lg font-bold text-green-900">{summary.sale_count}</p>
        </div>
        <div className="rounded-md bg-amber-50 p-3">
          <p className="text-xs font-medium text-amber-600">Taxes</p>
          <p className="mt-1 text-lg font-bold text-amber-900">{fmt(summary.total_tax)} F</p>
        </div>
        <div className="rounded-md bg-red-50 p-3">
          <p className="text-xs font-medium text-red-600">Remises</p>
          <p className="mt-1 text-lg font-bold text-red-900">{fmt(summary.total_discount)} F</p>
        </div>
      </div>

      {/* Bar chart */}
      {days.length === 0 ? (
        <p className="mt-6 text-center text-sm text-gray-500">Aucune vente sur cette periode.</p>
      ) : (
        <div className="mt-6">
          <div className="flex items-end gap-1" style={{ height: 200 }}>
            {days.map((day) => {
              const pct = (day.total_revenue / maxRevenue) * 100
              return (
                <div
                  key={day.date}
                  className="group relative flex flex-1 flex-col items-center justify-end"
                  style={{ height: '100%' }}
                >
                  {/* Tooltip */}
                  <div className="pointer-events-none absolute bottom-full mb-2 hidden rounded bg-gray-800 px-2 py-1 text-xs text-white shadow-lg group-hover:block">
                    <p className="font-medium">{fmtDate(day.date)}</p>
                    <p>{fmt(day.total_revenue)} F</p>
                    <p>{day.sale_count} vente(s)</p>
                  </div>
                  <div
                    className="w-full rounded-t bg-blue-500 transition-all hover:bg-blue-600"
                    style={{ height: `${Math.max(pct, 2)}%`, minHeight: 4 }}
                  />
                  <span className="mt-1 text-[10px] text-gray-500">{fmtDate(day.date)}</span>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Payment method legend */}
      {days.length > 0 && (
        <div className="mt-4 flex flex-wrap gap-4">
          {Object.entries(METHOD_LABELS).map(([key, label]) => {
            const total = days.reduce(
              (s, d) => s + (d.by_payment_method[key]?.total ?? 0),
              0,
            )
            if (total === 0) return null
            return (
              <div key={key} className="flex items-center gap-2 text-sm text-gray-600">
                <span className={`inline-block h-3 w-3 rounded ${METHOD_COLORS[key]}`} />
                {label}: {fmt(total)} F
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
