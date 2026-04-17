import type { Drug, Category } from '../../types/inventory'

interface DrugTableProps {
  drugs: Drug[]
  loading: boolean
  search: string
  onSearchChange: (value: string) => void
  categoryFilter: string
  onCategoryChange: (value: string) => void
  categories: Category[]
  page: number
  totalPages: number
  total: number
  onPageChange: (page: number) => void
  onEdit: (drug: Drug) => void
}

export function DrugTable({
  drugs,
  loading,
  search,
  onSearchChange,
  categoryFilter,
  onCategoryChange,
  categories,
  page,
  totalPages,
  total,
  onPageChange,
  onEdit,
}: DrugTableProps) {
  return (
    <div className="rounded-lg border border-gray-200 bg-white">
      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3 border-b border-gray-200 p-4">
        <div className="relative flex-1" style={{ minWidth: '200px' }}>
          <input
            type="text"
            placeholder="Rechercher par nom, DCI ou code-barre..."
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            className="w-full rounded-md border border-gray-300 py-2 pl-9 pr-3 text-sm placeholder-gray-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
          <svg
            className="absolute left-3 top-2.5 h-4 w-4 text-gray-400"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
            />
          </svg>
        </div>
        <select
          value={categoryFilter}
          onChange={(e) => onCategoryChange(e.target.value)}
          className="rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
        >
          <option value="">Toutes les categories</option>
          {categories.map((cat) => (
            <option key={cat.id} value={cat.id}>
              {cat.name}
            </option>
          ))}
        </select>
        <span className="text-sm text-gray-500">{total} medicament(s)</span>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-gray-200 bg-gray-50 text-xs font-medium uppercase tracking-wider text-gray-500">
              <th className="px-4 py-3">Nom</th>
              <th className="px-4 py-3">DCI</th>
              <th className="px-4 py-3">Categorie</th>
              <th className="px-4 py-3">Forme</th>
              <th className="px-4 py-3 text-right">Prix vente</th>
              <th className="px-4 py-3 text-right">Prix achat</th>
              <th className="px-4 py-3 text-center">Ordonnance</th>
              <th className="px-4 py-3 text-center">Statut</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {loading ? (
              <tr>
                <td colSpan={9} className="px-4 py-8 text-center text-gray-400">
                  Chargement...
                </td>
              </tr>
            ) : drugs.length === 0 ? (
              <tr>
                <td colSpan={9} className="px-4 py-8 text-center text-gray-400">
                  Aucun medicament trouve.
                </td>
              </tr>
            ) : (
              drugs.map((drug) => (
                <tr
                  key={drug.id}
                  className="hover:bg-gray-50 cursor-pointer"
                  onClick={() => onEdit(drug)}
                >
                  <td className="px-4 py-3 font-medium text-gray-900">
                    {drug.name}
                    {drug.strength && (
                      <span className="ml-1 text-gray-500">{drug.strength}</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-gray-600">
                    {drug.generic_name ?? '-'}
                  </td>
                  <td className="px-4 py-3 text-gray-600">
                    {drug.categories?.name ?? '-'}
                  </td>
                  <td className="px-4 py-3 text-gray-600">
                    {drug.dosage_form ?? '-'}
                  </td>
                  <td className="px-4 py-3 text-right tabular-nums text-gray-900">
                    {drug.unit_price.toLocaleString('fr-FR')} F
                  </td>
                  <td className="px-4 py-3 text-right tabular-nums text-gray-600">
                    {drug.cost_price.toLocaleString('fr-FR')} F
                  </td>
                  <td className="px-4 py-3 text-center">
                    {drug.requires_prescription ? (
                      <span className="inline-block rounded bg-purple-100 px-2 py-0.5 text-xs font-medium text-purple-700">
                        Oui
                      </span>
                    ) : (
                      <span className="text-xs text-gray-400">Non</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-center">
                    {drug.is_active ? (
                      <span className="inline-block h-2 w-2 rounded-full bg-green-500" title="Actif" />
                    ) : (
                      <span className="inline-block h-2 w-2 rounded-full bg-gray-300" title="Inactif" />
                    )}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        onEdit(drug)
                      }}
                      className="text-blue-600 hover:text-blue-800 text-xs font-medium"
                    >
                      Modifier
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between border-t border-gray-200 px-4 py-3">
          <button
            onClick={() => onPageChange(page - 1)}
            disabled={page <= 1}
            className="rounded border border-gray-300 px-3 py-1.5 text-sm disabled:opacity-40"
          >
            Precedent
          </button>
          <span className="text-sm text-gray-600">
            Page {page} / {totalPages}
          </span>
          <button
            onClick={() => onPageChange(page + 1)}
            disabled={page >= totalPages}
            className="rounded border border-gray-300 px-3 py-1.5 text-sm disabled:opacity-40"
          >
            Suivant
          </button>
        </div>
      )}
    </div>
  )
}
