import { useCallback, useEffect, useState } from 'react'
import { apiFetch } from '../../lib/api'
import type {
  Drug,
  Category,
  AlertsResponse,
  PaginatedResponse,
  DrugFormData,
} from '../../types/inventory'

export function useDrugs() {
  const [drugs, setDrugs] = useState<Drug[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('')
  const limit = 20

  const fetchDrugs = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const params = new URLSearchParams()
      params.set('page', String(page))
      params.set('limit', String(limit))
      if (search) params.set('search', search)
      if (categoryFilter) params.set('category_id', categoryFilter)
      const res = await apiFetch<PaginatedResponse<Drug>>(
        `/api/inventory/drugs?${params}`
      )
      setDrugs(res.data)
      setTotal(res.total)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [page, search, categoryFilter])

  useEffect(() => {
    fetchDrugs()
  }, [fetchDrugs])

  async function createDrug(data: DrugFormData) {
    const payload = {
      name: data.name,
      generic_name: data.generic_name || undefined,
      category_id: data.category_id || undefined,
      dosage_form: data.dosage_form || undefined,
      strength: data.strength || undefined,
      barcode: data.barcode || undefined,
      unit_price: parseFloat(data.unit_price),
      cost_price: parseFloat(data.cost_price),
      reorder_level: parseInt(data.reorder_level) || 10,
      requires_prescription: data.requires_prescription,
    }
    await apiFetch<Drug>('/api/inventory/drugs', {
      method: 'POST',
      body: JSON.stringify(payload),
    })
    await fetchDrugs()
  }

  async function updateDrug(id: string, data: DrugFormData) {
    const payload = {
      name: data.name,
      generic_name: data.generic_name || undefined,
      category_id: data.category_id || undefined,
      dosage_form: data.dosage_form || undefined,
      strength: data.strength || undefined,
      barcode: data.barcode || undefined,
      unit_price: parseFloat(data.unit_price),
      cost_price: parseFloat(data.cost_price),
      reorder_level: parseInt(data.reorder_level) || 10,
      requires_prescription: data.requires_prescription,
    }
    await apiFetch<Drug>(`/api/inventory/drugs/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(payload),
    })
    await fetchDrugs()
  }

  return {
    drugs,
    total,
    page,
    setPage,
    loading,
    error,
    search,
    setSearch,
    categoryFilter,
    setCategoryFilter,
    totalPages: Math.ceil(total / limit),
    createDrug,
    updateDrug,
    refetch: fetchDrugs,
  }
}

export function useCategories() {
  const [categories, setCategories] = useState<Category[]>([])

  useEffect(() => {
    apiFetch<Category[]>('/api/inventory/categories')
      .then(setCategories)
      .catch(() => {})
  }, [])

  return categories
}

export function useAlerts() {
  const [alerts, setAlerts] = useState<AlertsResponse>({
    low_stock: [],
    expiring: [],
    expired: [],
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    apiFetch<AlertsResponse>('/api/inventory/alerts')
      .then(setAlerts)
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  return { alerts, loading }
}
