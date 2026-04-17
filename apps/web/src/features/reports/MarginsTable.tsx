import type { MarginsResponse } from '../../types/reports'

interface MarginsTableProps {
  data: MarginsResponse
}

function fmt(n: number) {
  return n.toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

export function MarginsTable({ data }: MarginsTableProps) {
  const { products } = data

  const totals = products.reduce(
    (acc, p) => ({
      units: acc.units + p.units_sold,
      revenue: acc.revenue + p.total_revenue,
      cost: acc.cost + p.total_cost,
      margin: acc.margin + p.total_margin,
    }),
    { units: 0, revenue: 0, cost: 0, margin: 0 },
  )

  const overallMarginPct = totals.revenue > 0 ? (totals.margin / totals.revenue) * 100 : 0

  return (
    <div className="rounded-lg border border-gray-200 bg-white p-6">
      <h2 className="text-lg font-semibold text-gray-900">Marges par produit</h2>

      {/* Summary */}
      <div className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-4">
        <div className="rounded-md bg-emerald-50 p-3">
          <p className="text-xs font-medium text-emerald-600">Marge totale</p>
          <p className="mt-1 text-lg font-bold text-emerald-900">{fmt(totals.margin)} F</p>
        </div>
        <div className="rounded-md bg-blue-50 p-3">
          <p className="text-xs font-medium text-blue-600">Taux moyen</p>
          <p className="mt-1 text-lg font-bold text-blue-900">{fmt(overallMarginPct)}%</p>
        </div>
        <div className="rounded-md bg-gray-50 p-3">
          <p className="text-xs font-medium text-gray-600">Produits vendus</p>
          <p className="mt-1 text-lg font-bold text-gray-900">{products.length}</p>
        </div>
        <div className="rounded-md bg-gray-50 p-3">
          <p className="text-xs font-medium text-gray-600">Unites vendues</p>
          <p className="mt-1 text-lg font-bold text-gray-900">{totals.units}</p>
        </div>
      </div>

      {products.length === 0 ? (
        <p className="mt-6 text-center text-sm text-gray-500">Aucune donnee de marge sur cette periode.</p>
      ) : (
        <div className="mt-6 overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200 text-left text-xs font-medium uppercase text-gray-500">
                <th className="pb-3 pr-4">Produit</th>
                <th className="pb-3 pr-4 text-right">Qty</th>
                <th className="pb-3 pr-4 text-right">CA</th>
                <th className="pb-3 pr-4 text-right">Cout</th>
                <th className="pb-3 pr-4 text-right">Marge</th>
                <th className="pb-3 text-right">%</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {products.map((p) => (
                <tr key={p.drug_id} className="hover:bg-gray-50">
                  <td className="py-2.5 pr-4">
                    <p className="font-medium text-gray-900">{p.drug_name}</p>
                    {p.generic_name && (
                      <p className="text-xs text-gray-500">{p.generic_name}</p>
                    )}
                  </td>
                  <td className="py-2.5 pr-4 text-right text-gray-700">{p.units_sold}</td>
                  <td className="py-2.5 pr-4 text-right text-gray-700">{fmt(p.total_revenue)}</td>
                  <td className="py-2.5 pr-4 text-right text-gray-700">{fmt(p.total_cost)}</td>
                  <td className="py-2.5 pr-4 text-right font-medium text-emerald-700">
                    {fmt(p.total_margin)}
                  </td>
                  <td className="py-2.5 text-right">
                    <span
                      className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${
                        p.margin_percentage >= 30
                          ? 'bg-emerald-100 text-emerald-800'
                          : p.margin_percentage >= 15
                            ? 'bg-amber-100 text-amber-800'
                            : 'bg-red-100 text-red-800'
                      }`}
                    >
                      {fmt(p.margin_percentage)}%
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="border-t-2 border-gray-300 font-semibold text-gray-900">
                <td className="py-2.5 pr-4">Total</td>
                <td className="py-2.5 pr-4 text-right">{totals.units}</td>
                <td className="py-2.5 pr-4 text-right">{fmt(totals.revenue)}</td>
                <td className="py-2.5 pr-4 text-right">{fmt(totals.cost)}</td>
                <td className="py-2.5 pr-4 text-right text-emerald-700">{fmt(totals.margin)}</td>
                <td className="py-2.5 text-right">{fmt(overallMarginPct)}%</td>
              </tr>
            </tfoot>
          </table>
        </div>
      )}
    </div>
  )
}
