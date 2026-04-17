import { useRef } from 'react'
import type { Sale } from '../../types/pos'

interface ReceiptPreviewProps {
  sale: Sale
  onClose: () => void
  onNewSale: () => void
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleString('fr-FR', {
    dateStyle: 'short',
    timeStyle: 'short',
  })
}

function paymentMethodLabel(method: string): string {
  switch (method) {
    case 'cash': return 'Especes'
    case 'card': return 'Carte bancaire'
    case 'mobile': return 'Mobile Money'
    default: return method
  }
}

export function ReceiptPreview({ sale, onClose, onNewSale }: ReceiptPreviewProps) {
  const receiptRef = useRef<HTMLDivElement>(null)

  function handlePrint() {
    if (!receiptRef.current) return
    const printWindow = window.open('', '_blank', 'width=400,height=600')
    if (!printWindow) return

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Recu ${sale.sale_number}</title>
        <style>
          body { font-family: 'Courier New', monospace; font-size: 12px; padding: 10px; margin: 0; max-width: 300px; }
          .center { text-align: center; }
          .right { text-align: right; }
          .bold { font-weight: bold; }
          .line { border-top: 1px dashed #000; margin: 8px 0; }
          table { width: 100%; border-collapse: collapse; }
          td { padding: 2px 0; vertical-align: top; }
          .total-row td { padding-top: 4px; font-weight: bold; font-size: 14px; }
          @media print { body { padding: 0; } }
        </style>
      </head>
      <body>
        ${receiptRef.current.innerHTML}
        <script>window.print(); window.close();</script>
      </body>
      </html>
    `)
    printWindow.document.close()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative w-full max-w-sm rounded-lg bg-white shadow-xl">
        <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4">
          <h2 className="text-lg font-semibold text-gray-900">Recu de vente</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Printable receipt content */}
        <div className="p-6">
          <div
            ref={receiptRef}
            className="rounded-md border border-gray-200 bg-gray-50 p-4 font-mono text-xs"
          >
            <div className="text-center">
              <p className="text-sm font-bold">PHARMACIE</p>
              <div className="my-2 border-t border-dashed border-gray-400" />
              <p className="font-bold">RECU DE VENTE</p>
              <p>N&deg; {sale.sale_number}</p>
              <p>{formatDate(sale.created_at)}</p>
            </div>

            <div className="my-2 border-t border-dashed border-gray-400" />

            {sale.profiles && (
              <p>Caissier: {sale.profiles.full_name}</p>
            )}
            {sale.patients && (
              <p>Patient: {sale.patients.first_name} {sale.patients.last_name}</p>
            )}
            {sale.prescription_number && (
              <p>Ordonnance: {sale.prescription_number}</p>
            )}

            <div className="my-2 border-t border-dashed border-gray-400" />

            <table>
              <thead>
                <tr className="text-left">
                  <td className="font-bold">Article</td>
                  <td className="font-bold text-right">Total</td>
                </tr>
              </thead>
              <tbody>
                {sale.sale_items.map((item) => (
                  <tr key={item.id}>
                    <td>
                      <div>{item.drugs.name}</div>
                      <div className="text-gray-500">
                        {item.quantity} x {item.unit_price.toLocaleString('fr-FR')} F
                        {item.discount > 0 && ` (-${item.discount.toLocaleString('fr-FR')})`}
                      </div>
                    </td>
                    <td className="text-right align-top">
                      {item.total.toLocaleString('fr-FR')} F
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            <div className="my-2 border-t border-dashed border-gray-400" />

            <table>
              <tbody>
                <tr>
                  <td>Sous-total</td>
                  <td className="text-right">{sale.subtotal.toLocaleString('fr-FR')} F</td>
                </tr>
                {sale.discount_amount > 0 && (
                  <tr>
                    <td>Remise</td>
                    <td className="text-right">-{sale.discount_amount.toLocaleString('fr-FR')} F</td>
                  </tr>
                )}
                {sale.tax_amount > 0 && (
                  <tr>
                    <td>Taxe</td>
                    <td className="text-right">{sale.tax_amount.toLocaleString('fr-FR')} F</td>
                  </tr>
                )}
                <tr className="text-sm font-bold">
                  <td className="pt-1">TOTAL</td>
                  <td className="pt-1 text-right">{sale.total.toLocaleString('fr-FR')} F CFA</td>
                </tr>
              </tbody>
            </table>

            <div className="my-2 border-t border-dashed border-gray-400" />

            <p>Paiement: {paymentMethodLabel(sale.payment_method)}</p>
            {sale.notes && <p>Notes: {sale.notes}</p>}

            <div className="my-2 border-t border-dashed border-gray-400" />

            <p className="text-center">Merci pour votre achat!</p>
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-3 border-t border-gray-200 px-6 py-4">
          <button
            type="button"
            onClick={handlePrint}
            className="flex items-center gap-2 rounded-md border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
            </svg>
            Imprimer
          </button>
          <button
            type="button"
            onClick={onNewSale}
            className="flex-1 rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
          >
            Nouvelle vente
          </button>
        </div>
      </div>
    </div>
  )
}
