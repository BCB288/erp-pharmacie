import { useReports } from './useReports'
import { DateRangeFilter } from './DateRangeFilter'
import { DailySalesChart } from './DailySalesChart'
import { MarginsTable } from './MarginsTable'
import { TaxSummary } from './TaxSummary'

export function ReportsPage() {
  const {
    dateFrom,
    dateTo,
    setDateFrom,
    setDateTo,
    sales,
    margins,
    tax,
    loading,
    error,
  } = useReports()

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Rapports</h1>
          <p className="mt-1 text-sm text-gray-600">
            Ventes, marges et fiscalite.
          </p>
        </div>
        <DateRangeFilter
          dateFrom={dateFrom}
          dateTo={dateTo}
          onDateFromChange={setDateFrom}
          onDateToChange={setDateTo}
        />
      </div>

      {/* Error banner */}
      {error && (
        <div className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          Erreur lors du chargement des rapports: {error}
        </div>
      )}

      {/* Loading state */}
      {loading && (
        <div className="flex items-center justify-center py-12">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-500 border-t-transparent" />
          <span className="ml-3 text-sm text-gray-500">Chargement des rapports...</span>
        </div>
      )}

      {/* Content */}
      {!loading && !error && (
        <>
          {sales && <DailySalesChart data={sales} />}
          {margins && <MarginsTable data={margins} />}
          {tax && <TaxSummary data={tax} />}
        </>
      )}
    </div>
  )
}
