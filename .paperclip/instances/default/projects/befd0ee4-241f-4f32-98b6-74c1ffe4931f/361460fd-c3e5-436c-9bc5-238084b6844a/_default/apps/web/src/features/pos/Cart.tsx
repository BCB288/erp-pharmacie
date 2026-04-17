import type { CartItem } from '../../types/pos'

interface CartProps {
  items: CartItem[]
  subtotal: number
  totalDiscount: number
  total: number
  onSetQuantity: (drugId: string, quantity: number) => void
  onSetDiscount: (drugId: string, discount: number) => void
  onRemove: (drugId: string) => void
  onClear: () => void
  onPay: () => void
}

export function Cart({
  items,
  subtotal,
  totalDiscount,
  total,
  onSetQuantity,
  onSetDiscount,
  onRemove,
  onClear,
  onPay,
}: CartProps) {
  if (items.length === 0) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center rounded-lg border-2 border-dashed border-gray-200 p-8 text-center">
        <svg className="mx-auto h-12 w-12 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 100 4 2 2 0 000-4z" />
        </svg>
        <p className="mt-2 text-sm text-gray-500">Le panier est vide</p>
        <p className="text-xs text-gray-400">
          Recherchez un produit pour commencer
        </p>
      </div>
    )
  }

  return (
    <div className="flex flex-1 flex-col">
      {/* Cart items */}
      <div className="flex-1 overflow-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-200 text-left text-xs font-medium uppercase text-gray-500">
              <th className="pb-2 pr-2">Produit</th>
              <th className="pb-2 px-2 text-center w-24">Qte</th>
              <th className="pb-2 px-2 text-right w-24">P.U.</th>
              <th className="pb-2 px-2 text-right w-28">Remise</th>
              <th className="pb-2 px-2 text-right w-24">Total</th>
              <th className="pb-2 pl-2 w-8"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {items.map((item) => (
              <tr key={item.drug.id} className="group">
                <td className="py-2 pr-2">
                  <div className="font-medium text-gray-900 leading-tight">
                    {item.drug.name}
                  </div>
                  {item.drug.strength && (
                    <div className="text-xs text-gray-400">{item.drug.strength}</div>
                  )}
                </td>
                <td className="py-2 px-2">
                  <div className="flex items-center justify-center gap-1">
                    <button
                      type="button"
                      onClick={() => onSetQuantity(item.drug.id, item.quantity - 1)}
                      disabled={item.quantity <= 1}
                      className="flex h-6 w-6 items-center justify-center rounded border border-gray-300 text-gray-600 hover:bg-gray-100 disabled:opacity-30"
                    >
                      -
                    </button>
                    <input
                      type="number"
                      min={1}
                      value={item.quantity}
                      onChange={(e) =>
                        onSetQuantity(item.drug.id, parseInt(e.target.value) || 1)
                      }
                      className="w-10 rounded border border-gray-200 px-1 py-0.5 text-center text-sm"
                    />
                    <button
                      type="button"
                      onClick={() => onSetQuantity(item.drug.id, item.quantity + 1)}
                      className="flex h-6 w-6 items-center justify-center rounded border border-gray-300 text-gray-600 hover:bg-gray-100"
                    >
                      +
                    </button>
                  </div>
                </td>
                <td className="py-2 px-2 text-right whitespace-nowrap text-gray-700">
                  {item.drug.unit_price.toLocaleString('fr-FR')}
                </td>
                <td className="py-2 px-2">
                  <input
                    type="number"
                    min={0}
                    step={100}
                    value={item.discount || ''}
                    onChange={(e) =>
                      onSetDiscount(item.drug.id, parseFloat(e.target.value) || 0)
                    }
                    placeholder="0"
                    className="w-full rounded border border-gray-200 px-2 py-0.5 text-right text-sm"
                  />
                </td>
                <td className="py-2 px-2 text-right whitespace-nowrap font-medium text-gray-900">
                  {item.lineTotal.toLocaleString('fr-FR')}
                </td>
                <td className="py-2 pl-2">
                  <button
                    type="button"
                    onClick={() => onRemove(item.drug.id)}
                    className="text-gray-300 hover:text-red-500"
                    title="Retirer"
                  >
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Totals + actions */}
      <div className="mt-4 border-t border-gray-200 pt-4 space-y-2">
        <div className="flex justify-between text-sm text-gray-600">
          <span>Sous-total</span>
          <span>{subtotal.toLocaleString('fr-FR')} F</span>
        </div>
        {totalDiscount > 0 && (
          <div className="flex justify-between text-sm text-green-600">
            <span>Remise</span>
            <span>-{totalDiscount.toLocaleString('fr-FR')} F</span>
          </div>
        )}
        <div className="flex justify-between text-lg font-bold text-gray-900">
          <span>Total</span>
          <span>{total.toLocaleString('fr-FR')} F CFA</span>
        </div>
        <div className="flex gap-2 pt-2">
          <button
            type="button"
            onClick={onClear}
            className="rounded-md border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            Vider
          </button>
          <button
            type="button"
            onClick={onPay}
            className="flex-1 rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
          >
            Payer ({total.toLocaleString('fr-FR')} F)
          </button>
        </div>
      </div>
    </div>
  )
}
