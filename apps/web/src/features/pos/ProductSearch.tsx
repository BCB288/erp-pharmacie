import { useEffect, useRef, useState } from 'react'
import type { Drug } from '../../types/inventory'

interface ProductSearchProps {
  results: Drug[]
  loading: boolean
  onSearch: (query: string) => void
  onClear: () => void
  onSelect: (drug: Drug) => void
}

export function ProductSearch({
  results,
  loading,
  onSearch,
  onClear,
  onSelect,
}: ProductSearchProps) {
  const [query, setQuery] = useState('')
  const [open, setOpen] = useState(false)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  function handleChange(value: string) {
    setQuery(value)
    if (timerRef.current) clearTimeout(timerRef.current)
    if (!value.trim()) {
      onClear()
      setOpen(false)
      return
    }
    timerRef.current = setTimeout(() => {
      onSearch(value)
      setOpen(true)
    }, 300)
  }

  function handleSelect(drug: Drug) {
    onSelect(drug)
    setQuery('')
    onClear()
    setOpen(false)
    inputRef.current?.focus()
  }

  // Close dropdown on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  // Show results when they arrive
  useEffect(() => {
    if (results.length > 0 && query.trim()) setOpen(true)
  }, [results, query])

  return (
    <div ref={containerRef} className="relative">
      <label className="mb-1 block text-sm font-medium text-gray-700">
        Rechercher un produit
      </label>
      <div className="relative">
        <svg
          className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => handleChange(e.target.value)}
          placeholder="Nom, DCI ou code-barre..."
          className="w-full rounded-md border border-gray-300 py-2 pl-10 pr-3 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          autoFocus
        />
        {loading && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2">
            <div className="h-4 w-4 animate-spin rounded-full border-2 border-gray-300 border-t-blue-600" />
          </div>
        )}
      </div>

      {open && (
        <div className="absolute z-20 mt-1 max-h-72 w-full overflow-auto rounded-md border border-gray-200 bg-white shadow-lg">
          {results.length === 0 && !loading && (
            <div className="px-4 py-3 text-sm text-gray-500">
              Aucun produit trouve.
            </div>
          )}
          {results.map((drug) => (
            <button
              key={drug.id}
              type="button"
              onClick={() => handleSelect(drug)}
              className="flex w-full items-center justify-between px-4 py-2 text-left text-sm hover:bg-blue-50"
            >
              <div>
                <div className="font-medium text-gray-900">{drug.name}</div>
                <div className="text-xs text-gray-500">
                  {drug.generic_name && <span>{drug.generic_name} &middot; </span>}
                  {drug.dosage_form && <span>{drug.dosage_form} </span>}
                  {drug.strength && <span>{drug.strength} </span>}
                  {drug.barcode && <span>&middot; {drug.barcode}</span>}
                </div>
              </div>
              <div className="ml-4 whitespace-nowrap text-right">
                <div className="font-medium text-gray-900">
                  {drug.unit_price.toLocaleString('fr-FR')} F
                </div>
                {drug.requires_prescription && (
                  <span className="text-xs text-amber-600">Ordonnance</span>
                )}
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
