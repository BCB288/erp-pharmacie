import type { TaxSummaryResponse } from '../../types/reports'

interface TaxSummaryProps {
  data: TaxSummaryResponse
}

function fmt(n: number) {
  return n.toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

function fmtDate(iso: string) {
  const [y, m, d] = iso.split('-')
  return `${d}/${m}/${y}`
}

export function TaxSummary({ data }: TaxSummaryProps) {
  const { summary, days } = data

  return (
    <div className="rounded-lg border border-gray-200 bg-white p-6">
      <h2 className="text-lg font-semibold text-gray-900">Resume fiscal</h2>

      {/* Summary cards */}
      <div className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-4">
        <div className="rounded-md bg-indigo-50 p-3">
          <p className="text-xs font-medium text-indigo-600">Base taxable</p>
          <p className="mt-1 text-lg font-bold text-indigo-900">{fmt(summary.total_taxable_amount)} F</p>
        </div>
        <div className="rounded-md bg-orange-50 p-3">
          <p className="text-xs font-medium text-orange-600">Taxes collectees</p>
          <p className="mt-1 text-lg font-bold text-orange-900">{fmt(summary.total_tax_collected)} F</p>
        </div>
        <div className="rounded-md bg-gray-50 p-3">
          <p className="text-xs font-medium text-gray-600">Taux effectif</p>
          <p className="mt-1 text-lg font-bold text-gray-900">{fmt(summary.effective_tax_rate)}%</p>
        </div>
        <div className="rounded-md bg-gray-50 p-3">
          <p className="text-xs font-medium text-gray-600">Nb. ventes</p>
          <p className="mt-1 text-lg font-bold text-gray-900">{summary.sale_count}</p>
        </div>
      </div>

      {/* Daily breakdown table */}
      {days.length === 0 ? (
        <p className="mt-6 text-center text-sm text-gray-500">Aucune donnee fiscale sur cette periode.</p>
      ) : (
        <div className="mt-6 overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200 text-left text-xs font-medium uppercase text-gray-500">
                <th className="pb-3 pr-4">Date</th>
                <th className="pb-3 pr-4 text-right">Ventes</th>
                <th className="pb-3 pr-4 text-right">Base taxable</th>
                <th className="pb-3 text-right">Taxes</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {days.map((day) => (
                <tr key={day.date} className="hover:bg-gray-50">
                  <td className="py-2.5 pr-4 font-medium text-gray-900">{fmtDate(day.date)}</td>
                  <td className="py-2.5 pr-4 text-right text-gray-700">{day.sale_count}</td>
                  <td className="py-2.5 pr-4 text-right text-gray-700">{fmt(day.taxable_amount)}</td>
                  <td className="py-2.5 text-right font-medium text-orange-700">{fmt(day.tax_collected)}</td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="border-t-2 border-gray-300 font-semibold text-gray-900">
                <td className="py-2.5 pr-4">Total</td>
                <td className="py-2.5 pr-4 text-right">{summary.sale_count}</td>
                <td className="py-2.5 pr-4 text-right">{fmt(summary.total_taxable_amount)}</td>
                <td className="py-2.5 text-right text-orange-700">{fmt(summary.total_tax_collected)}</td>
              </tr>
            </tfoot>
          </table>
        </div>
      )}
    </div>
  )
}
