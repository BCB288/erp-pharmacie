import { useEffect, useState } from 'react'
import type { Drug, DrugFormData, Category } from '../../types/inventory'

interface DrugFormModalProps {
  open: boolean
  drug: Drug | null
  categories: Category[]
  saving: boolean
  onClose: () => void
  onSave: (data: DrugFormData) => void
}

const emptyForm: DrugFormData = {
  name: '',
  generic_name: '',
  category_id: '',
  dosage_form: '',
  strength: '',
  barcode: '',
  unit_price: '',
  cost_price: '',
  reorder_level: '10',
  requires_prescription: false,
}

export function DrugFormModal({
  open,
  drug,
  categories,
  saving,
  onClose,
  onSave,
}: DrugFormModalProps) {
  const [form, setForm] = useState<DrugFormData>(emptyForm)

  useEffect(() => {
    if (drug) {
      setForm({
        name: drug.name,
        generic_name: drug.generic_name ?? '',
        category_id: drug.category_id ?? '',
        dosage_form: drug.dosage_form ?? '',
        strength: drug.strength ?? '',
        barcode: drug.barcode ?? '',
        unit_price: String(drug.unit_price),
        cost_price: String(drug.cost_price),
        reorder_level: String(drug.reorder_level),
        requires_prescription: drug.requires_prescription,
      })
    } else {
      setForm(emptyForm)
    }
  }, [drug, open])

  if (!open) return null

  function handleChange(
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) {
    const { name, value, type } = e.target
    setForm((prev) => ({
      ...prev,
      [name]:
        type === 'checkbox' ? (e.target as HTMLInputElement).checked : value,
    }))
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    onSave(form)
  }

  const isEdit = !!drug

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div
        className="absolute inset-0 bg-black/40"
        onClick={onClose}
      />
      <div className="relative w-full max-w-lg rounded-lg bg-white shadow-xl">
        <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4">
          <h2 className="text-lg font-semibold text-gray-900">
            {isEdit ? 'Modifier le medicament' : 'Ajouter un medicament'}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 p-6">
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <label className="mb-1 block text-sm font-medium text-gray-700">
                Nom *
              </label>
              <input
                name="name"
                value={form.name}
                onChange={handleChange}
                required
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>

            <div className="col-span-2">
              <label className="mb-1 block text-sm font-medium text-gray-700">
                DCI (nom generique)
              </label>
              <input
                name="generic_name"
                value={form.generic_name}
                onChange={handleChange}
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">
                Categorie
              </label>
              <select
                name="category_id"
                value={form.category_id}
                onChange={handleChange}
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              >
                <option value="">-- Aucune --</option>
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">
                Forme
              </label>
              <input
                name="dosage_form"
                value={form.dosage_form}
                onChange={handleChange}
                placeholder="Comprime, sirop..."
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">
                Dosage
              </label>
              <input
                name="strength"
                value={form.strength}
                onChange={handleChange}
                placeholder="500mg, 10ml..."
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">
                Code-barre
              </label>
              <input
                name="barcode"
                value={form.barcode}
                onChange={handleChange}
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">
                Prix de vente (F CFA) *
              </label>
              <input
                name="unit_price"
                type="number"
                step="0.01"
                min="0"
                value={form.unit_price}
                onChange={handleChange}
                required
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">
                Prix d'achat (F CFA) *
              </label>
              <input
                name="cost_price"
                type="number"
                step="0.01"
                min="0"
                value={form.cost_price}
                onChange={handleChange}
                required
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">
                Seuil de reappro.
              </label>
              <input
                name="reorder_level"
                type="number"
                min="0"
                value={form.reorder_level}
                onChange={handleChange}
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>

            <div className="flex items-center pt-6">
              <input
                id="requires_prescription"
                name="requires_prescription"
                type="checkbox"
                checked={form.requires_prescription}
                onChange={handleChange}
                className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <label
                htmlFor="requires_prescription"
                className="ml-2 text-sm text-gray-700"
              >
                Ordonnance requise
              </label>
            </div>
          </div>

          <div className="flex justify-end gap-3 border-t border-gray-200 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="rounded-md border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={saving}
              className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
            >
              {saving
                ? 'Enregistrement...'
                : isEdit
                  ? 'Mettre a jour'
                  : 'Ajouter'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
