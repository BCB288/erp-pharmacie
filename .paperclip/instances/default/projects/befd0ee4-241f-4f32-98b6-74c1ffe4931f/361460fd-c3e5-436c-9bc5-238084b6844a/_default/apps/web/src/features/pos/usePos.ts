import { useCallback, useReducer, useState } from 'react'
import { apiFetch } from '../../lib/api'
import type { Drug, PaginatedResponse } from '../../types/inventory'
import type { CartItem, Sale, CreateSalePayload, PaymentMethod } from '../../types/pos'

/* ------------------------------------------------------------------ */
/*  Product Search                                                     */
/* ------------------------------------------------------------------ */

export function useProductSearch() {
  const [results, setResults] = useState<Drug[]>([])
  const [loading, setLoading] = useState(false)

  const search = useCallback(async (query: string) => {
    if (!query.trim()) {
      setResults([])
      return
    }
    setLoading(true)
    try {
      const params = new URLSearchParams({ search: query, limit: '20', page: '1' })
      const res = await apiFetch<PaginatedResponse<Drug>>(
        `/api/inventory/drugs?${params}`
      )
      // Only show active drugs with stock info
      setResults(res.data.filter((d) => d.is_active))
    } catch {
      setResults([])
    } finally {
      setLoading(false)
    }
  }, [])

  const clear = useCallback(() => setResults([]), [])

  return { results, loading, search, clear }
}

/* ------------------------------------------------------------------ */
/*  Cart Reducer                                                       */
/* ------------------------------------------------------------------ */

type CartAction =
  | { type: 'ADD'; drug: Drug }
  | { type: 'REMOVE'; drugId: string }
  | { type: 'SET_QUANTITY'; drugId: string; quantity: number }
  | { type: 'SET_DISCOUNT'; drugId: string; discount: number }
  | { type: 'CLEAR' }

function computeLineTotal(item: CartItem): number {
  const gross = item.quantity * item.drug.unit_price
  return Math.max(gross - item.discount, 0)
}

function cartReducer(state: CartItem[], action: CartAction): CartItem[] {
  switch (action.type) {
    case 'ADD': {
      const existing = state.find((i) => i.drug.id === action.drug.id)
      if (existing) {
        return state.map((i) =>
          i.drug.id === action.drug.id
            ? { ...i, quantity: i.quantity + 1, lineTotal: computeLineTotal({ ...i, quantity: i.quantity + 1 }) }
            : i
        )
      }
      const item: CartItem = { drug: action.drug, quantity: 1, discount: 0, lineTotal: action.drug.unit_price }
      return [...state, item]
    }
    case 'REMOVE':
      return state.filter((i) => i.drug.id !== action.drugId)
    case 'SET_QUANTITY': {
      const qty = Math.max(1, action.quantity)
      return state.map((i) =>
        i.drug.id === action.drugId
          ? { ...i, quantity: qty, lineTotal: computeLineTotal({ ...i, quantity: qty }) }
          : i
      )
    }
    case 'SET_DISCOUNT': {
      const disc = Math.max(0, action.discount)
      return state.map((i) =>
        i.drug.id === action.drugId
          ? { ...i, discount: disc, lineTotal: computeLineTotal({ ...i, discount: disc }) }
          : i
      )
    }
    case 'CLEAR':
      return []
  }
}

/* ------------------------------------------------------------------ */
/*  useCart                                                             */
/* ------------------------------------------------------------------ */

export function useCart() {
  const [items, dispatch] = useReducer(cartReducer, [])

  const addItem = useCallback((drug: Drug) => dispatch({ type: 'ADD', drug }), [])
  const removeItem = useCallback((drugId: string) => dispatch({ type: 'REMOVE', drugId }), [])
  const setQuantity = useCallback((drugId: string, quantity: number) =>
    dispatch({ type: 'SET_QUANTITY', drugId, quantity }), [])
  const setDiscount = useCallback((drugId: string, discount: number) =>
    dispatch({ type: 'SET_DISCOUNT', drugId, discount }), [])
  const clearCart = useCallback(() => dispatch({ type: 'CLEAR' }), [])

  const subtotal = items.reduce((sum, i) => sum + i.quantity * i.drug.unit_price, 0)
  const totalDiscount = items.reduce((sum, i) => sum + i.discount, 0)
  const total = Math.max(subtotal - totalDiscount, 0)

  return {
    items,
    subtotal,
    totalDiscount,
    total,
    addItem,
    removeItem,
    setQuantity,
    setDiscount,
    clearCart,
    isEmpty: items.length === 0,
  }
}

/* ------------------------------------------------------------------ */
/*  Sale Submission                                                     */
/* ------------------------------------------------------------------ */

export function useSale() {
  const [submitting, setSubmitting] = useState(false)
  const [lastSale, setLastSale] = useState<Sale | null>(null)
  const [error, setError] = useState<string | null>(null)

  const submitSale = useCallback(
    async (items: CartItem[], paymentMethod: PaymentMethod, notes?: string) => {
      setSubmitting(true)
      setError(null)
      try {
        const payload: CreateSalePayload = {
          items: items.map((i) => ({
            drug_id: i.drug.id,
            quantity: i.quantity,
            discount: i.discount > 0 ? i.discount : undefined,
          })),
          payment_method: paymentMethod,
          notes,
        }
        const sale = await apiFetch<Sale>('/api/pos/sales', {
          method: 'POST',
          body: JSON.stringify(payload),
        })
        setLastSale(sale)
        return sale
      } catch (err: any) {
        setError(err.message)
        throw err
      } finally {
        setSubmitting(false)
      }
    },
    []
  )

  const clearLastSale = useCallback(() => {
    setLastSale(null)
    setError(null)
  }, [])

  return { submitting, lastSale, error, submitSale, clearLastSale, setError }
}
