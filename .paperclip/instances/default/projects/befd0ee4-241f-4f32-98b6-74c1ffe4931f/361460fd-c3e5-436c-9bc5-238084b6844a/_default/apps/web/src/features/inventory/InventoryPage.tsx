import { useState } from 'react'
import type { Drug, DrugFormData } from '../../types/inventory'
import { useDrugs, useCategories, useAlerts } from './useInventory'
import { DrugTable } from './DrugTable'
import { DrugFormModal } from './DrugFormModal'
import { StockAlerts } from './StockAlerts'

export function InventoryPage() {
  const {
    drugs,
    total,
    page,
    setPage,
    loading,
    search,
    setSearch,
    categoryFilter,
    setCategoryFilter,
    totalPages,
    createDrug,
    updateDrug,
  } = useDrugs()

  const categories = useCategories()
  const { alerts, loading: alertsLoading } = useAlerts()

  const [modalOpen, setModalOpen] = useState(false)
  const [editingDrug, setEditingDrug] = useState<Drug | null>(null)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  function handleAdd() {
    setEditingDrug(null)
    setModalOpen(true)
  }

  function handleEdit(drug: Drug) {
    setEditingDrug(drug)
    setModalOpen(true)
  }

  async function handleSave(data: DrugFormData) {
    setSaving(true)
    setError(null)
    try {
      if (editingDrug) {
        await updateDrug(editingDrug.id, data)
      } else {
        await createDrug(data)
      }
      setModalOpen(false)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }

  // Debounced search
  const [searchInput, setSearchInput] = useState('')
  const [searchTimer, setSearchTimer] = useState<ReturnType<typeof setTimeout> | null>(null)

  function handleSearchChange(value: string) {
    setSearchInput(value)
    if (searchTimer) clearTimeout(searchTimer)
    const timer = setTimeout(() => {
      setSearch(value)
      setPage(1)
    }, 350)
    setSearchTimer(timer)
  }

  function handleCategoryChange(value: string) {
    setCategoryFilter(value)
    setPage(1)
  }

  const totalAlerts =
    alerts.low_stock.length + alerts.expiring.length + alerts.expired.length

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Inventaire</h1>
          <p className="mt-1 text-sm text-gray-600">
            Gestion des medicaments et stocks.
          </p>
        </div>
        <button
          onClick={handleAdd}
          className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
        >
          + Ajouter un medicament
        </button>
      </div>

      {/* Error banner */}
      {error && (
        <div className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
          <button
            onClick={() => setError(null)}
            className="ml-3 font-medium underline"
          >
            Fermer
          </button>
        </div>
      )}

      {/* Stock alerts summary */}
      {totalAlerts > 0 && (
        <details className="group">
          <summary className="cursor-pointer list-none">
            <div className="flex items-center gap-2 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3">
              <span className="inline-block h-2 w-2 rounded-full bg-amber-500" />
              <span className="text-sm font-medium text-amber-800">
                {totalAlerts} alerte(s) de stock
              </span>
              <svg
                className="ml-auto h-4 w-4 text-amber-600 transition-transform group-open:rotate-180"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </div>
          </summary>
          <div className="mt-3">
            <StockAlerts alerts={alerts} loading={alertsLoading} />
          </div>
        </details>
      )}

      {/* Drug table */}
      <DrugTable
        drugs={drugs}
        loading={loading}
        search={searchInput}
        onSearchChange={handleSearchChange}
        categoryFilter={categoryFilter}
        onCategoryChange={handleCategoryChange}
        categories={categories}
        page={page}
        totalPages={totalPages}
        total={total}
        onPageChange={setPage}
        onEdit={handleEdit}
      />

      {/* Add/Edit modal */}
      <DrugFormModal
        open={modalOpen}
        drug={editingDrug}
        categories={categories}
        saving={saving}
        onClose={() => setModalOpen(false)}
        onSave={handleSave}
      />
    </div>
  )
}
