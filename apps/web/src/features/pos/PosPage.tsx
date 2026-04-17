import { useState } from 'react'
import { useProductSearch, useCart, useSale } from './usePos'
import { ProductSearch } from './ProductSearch'
import { Cart } from './Cart'
import { PaymentModal } from './PaymentModal'
import { ReceiptPreview } from './ReceiptPreview'
import type { PaymentMethod } from '../../types/pos'

export function PosPage() {
  const { results, loading: searchLoading, search, clear: clearSearch } = useProductSearch()
  const cart = useCart()
  const sale = useSale()

  const [paymentOpen, setPaymentOpen] = useState(false)

  function handlePay() {
    if (cart.isEmpty) return
    setPaymentOpen(true)
  }

  async function handleConfirmPayment(method: PaymentMethod, notes?: string) {
    try {
      await sale.submitSale(cart.items, method, notes)
      setPaymentOpen(false)
      cart.clearCart()
    } catch {
      // error is set in the sale hook
    }
  }

  function handleNewSale() {
    sale.clearLastSale()
    cart.clearCart()
  }

  return (
    <div className="flex h-[calc(100vh-8rem)] flex-col gap-6 lg:flex-row">
      {/* Left panel: search + cart */}
      <div className="flex flex-1 flex-col gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Point de vente</h1>
          <p className="mt-1 text-sm text-gray-600">
            Terminal de vente — recherchez un produit pour l'ajouter au panier.
          </p>
        </div>

        {/* Error banner */}
        {sale.error && (
          <div className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {sale.error}
            <button
              onClick={() => sale.setError(null)}
              className="ml-3 font-medium underline"
            >
              Fermer
            </button>
          </div>
        )}

        {/* Product search */}
        <ProductSearch
          results={results}
          loading={searchLoading}
          onSearch={search}
          onClear={clearSearch}
          onSelect={cart.addItem}
        />

        {/* Cart */}
        <Cart
          items={cart.items}
          subtotal={cart.subtotal}
          totalDiscount={cart.totalDiscount}
          total={cart.total}
          onSetQuantity={cart.setQuantity}
          onSetDiscount={cart.setDiscount}
          onRemove={cart.removeItem}
          onClear={cart.clearCart}
          onPay={handlePay}
        />
      </div>

      {/* Right panel: summary sidebar */}
      <div className="w-full lg:w-72 space-y-4">
        <div className="rounded-lg border border-gray-200 bg-white p-4">
          <h3 className="text-sm font-medium text-gray-500 uppercase">Resume</h3>
          <div className="mt-3 space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Articles</span>
              <span className="font-medium text-gray-900">{cart.items.length}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Quantite totale</span>
              <span className="font-medium text-gray-900">
                {cart.items.reduce((s, i) => s + i.quantity, 0)}
              </span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Sous-total</span>
              <span className="font-medium text-gray-900">
                {cart.subtotal.toLocaleString('fr-FR')} F
              </span>
            </div>
            {cart.totalDiscount > 0 && (
              <div className="flex justify-between text-sm">
                <span className="text-green-600">Remise</span>
                <span className="font-medium text-green-600">
                  -{cart.totalDiscount.toLocaleString('fr-FR')} F
                </span>
              </div>
            )}
            <div className="border-t border-gray-200 pt-2 flex justify-between">
              <span className="font-semibold text-gray-900">Total</span>
              <span className="font-bold text-gray-900">
                {cart.total.toLocaleString('fr-FR')} F
              </span>
            </div>
          </div>
        </div>

        <div className="rounded-lg border border-gray-200 bg-white p-4">
          <h3 className="text-sm font-medium text-gray-500 uppercase">Raccourcis</h3>
          <div className="mt-3 space-y-1 text-xs text-gray-500">
            <p>Tapez un code-barre ou un nom dans la barre de recherche pour trouver un produit.</p>
            <p>Utilisez +/- pour ajuster les quantites.</p>
            <p>Cliquez "Payer" pour finaliser la vente.</p>
          </div>
        </div>
      </div>

      {/* Payment modal */}
      <PaymentModal
        open={paymentOpen}
        total={cart.total}
        submitting={sale.submitting}
        onClose={() => setPaymentOpen(false)}
        onConfirm={handleConfirmPayment}
      />

      {/* Receipt preview */}
      {sale.lastSale && (
        <ReceiptPreview
          sale={sale.lastSale}
          onClose={() => sale.clearLastSale()}
          onNewSale={handleNewSale}
        />
      )}
    </div>
  )
}
