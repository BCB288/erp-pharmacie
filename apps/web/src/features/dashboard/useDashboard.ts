import { useState, useEffect, useCallback } from 'react'
import { apiFetch } from '../../lib/api'
import type { AlertsResponse } from '../../types/inventory'
import type { Sale } from '../../types/pos'
import type { PaginatedResponse } from '../../types/inventory'

interface DashboardData {
  todaySalesTotal: number
  todaySalesCount: number
  lowStockCount: number
  expiringCount: number
  alerts: AlertsResponse
  recentSales: Sale[]
}

const emptyAlerts: AlertsResponse = { low_stock: [], expiring: [], expired: [] }

export function useDashboard() {
  const [data, setData] = useState<DashboardData>({
    todaySalesTotal: 0,
    todaySalesCount: 0,
    lowStockCount: 0,
    expiringCount: 0,
    alerts: emptyAlerts,
    recentSales: [],
  })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const today = new Date().toISOString().slice(0, 10)

  const fetchAll = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const [alerts, todaySales, recentSales] = await Promise.all([
        apiFetch<AlertsResponse>('/api/inventory/alerts'),
        apiFetch<PaginatedResponse<Sale>>(
          `/api/pos/sales?date_from=${today}&date_to=${today}&limit=1000`
        ),
        apiFetch<PaginatedResponse<Sale>>(
          '/api/pos/sales?limit=10'
        ),
      ])

      const completedSales = todaySales.data.filter(s => s.status === 'completed')
      const todaySalesTotal = completedSales.reduce((sum, s) => sum + s.total, 0)

      setData({
        todaySalesTotal,
        todaySalesCount: completedSales.length,
        lowStockCount: alerts.low_stock.length,
        expiringCount: alerts.expiring.length + alerts.expired.length,
        alerts,
        recentSales: recentSales.data,
      })
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [today])

  useEffect(() => {
    fetchAll()
  }, [fetchAll])

  return { ...data, loading, error, refresh: fetchAll }
}
