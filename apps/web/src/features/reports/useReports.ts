import { useState, useEffect, useCallback } from 'react'
import { apiFetch } from '../../lib/api'
import type {
  DailySalesResponse,
  MarginsResponse,
  TaxSummaryResponse,
} from '../../types/reports'

function todayStr() {
  return new Date().toISOString().slice(0, 10)
}

function weekAgoStr() {
  const d = new Date()
  d.setDate(d.getDate() - 7)
  return d.toISOString().slice(0, 10)
}

export function useReports() {
  const [dateFrom, setDateFrom] = useState(weekAgoStr)
  const [dateTo, setDateTo] = useState(todayStr)

  const [sales, setSales] = useState<DailySalesResponse | null>(null)
  const [margins, setMargins] = useState<MarginsResponse | null>(null)
  const [tax, setTax] = useState<TaxSummaryResponse | null>(null)

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchAll = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const qs = `date_from=${dateFrom}&date_to=${dateTo}`
      const [s, m, t] = await Promise.all([
        apiFetch<DailySalesResponse>(`/api/reports/daily-sales?${qs}`),
        apiFetch<MarginsResponse>(`/api/reports/margins?${qs}`),
        apiFetch<TaxSummaryResponse>(`/api/reports/tax-summary?${qs}`),
      ])
      setSales(s)
      setMargins(m)
      setTax(t)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [dateFrom, dateTo])

  useEffect(() => {
    fetchAll()
  }, [fetchAll])

  return {
    dateFrom,
    dateTo,
    setDateFrom,
    setDateTo,
    sales,
    margins,
    tax,
    loading,
    error,
    refresh: fetchAll,
  }
}
