import { useEffect, useState, useCallback } from 'react'
import { useAuth } from '../../hooks/useAuth'
import { apiFetch } from '../../lib/api'

type Tab = 'suppliers' | 'orders'

interface Supplier {
  id: string
  name: string
  contact_person: string | null
  email: string | null
  phone: string | null
  address: string | null
  is_active: boolean
  created_at: string
}

interface Drug {
  id: string
  name: string
  generic_name: string | null
  barcode: string | null
  cost_price: number
}

interface PurchaseOrder {
  id: string
  order_number: string
  supplier_id: string
  status: string
  total_amount: number | null
  expected_delivery: string | null
  notes: string | null
  created_at: string
  suppliers?: { name: string }
  profiles?: { full_name: string }
}

interface POItem {
  id: string
  drug_id: string
  quantity_ordered: number
  quantity_received: number
  unit_cost: number
  total: number
  drugs?: { name: string; generic_name: string | null; barcode: string | null }
}

interface PODetail extends PurchaseOrder {
  purchase_order_items: POItem[]
  suppliers?: { name: string; contact_person: string | null; email: string | null; phone: string | null }
  profiles?: { full_name: string }
}

interface POLineItem {
  drug_id: string
  drug_name: string
  quantity_ordered: number
  unit_cost: number
}

/* ------------------------------------------------------------------ */
/*  Status badge                                                       */
/* ------------------------------------------------------------------ */

const STATUS_COLORS: Record<string, string> = {
  draft: 'bg-gray-100 text-gray-700',
  sent: 'bg-blue-100 text-blue-700',
  partial: 'bg-yellow-100 text-yellow-700',
  received: 'bg-green-100 text-green-700',
}

const STATUS_LABELS: Record<string, string> = {
  draft: 'Brouillon',
  sent: 'Envoye',
  partial: 'Partiel',
  received: 'Recu',
}

function StatusBadge({ status }: { status: string }) {
  return (
    <span className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_COLORS[status] ?? 'bg-gray-100 text-gray-700'}`}>
      {STATUS_LABELS[status] ?? status}
    </span>
  )
}

/* ------------------------------------------------------------------ */
/*  Supplier form modal                                                */
/* ------------------------------------------------------------------ */

function SupplierModal({
  supplier,
  onClose,
  onSaved,
}: {
  supplier: Supplier | null
  onClose: () => void
  onSaved: () => void
}) {
  const [form, setForm] = useState({
    name: supplier?.name ?? '',
    contact_person: supplier?.contact_person ?? '',
    email: supplier?.email ?? '',
    phone: supplier?.phone ?? '',
    address: supplier?.address ?? '',
  })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setError('')
    try {
      if (supplier) {
        await apiFetch(`/api/suppliers/${supplier.id}`, { method: 'PATCH', body: JSON.stringify(form) })
      } else {
        await apiFetch('/api/suppliers', { method: 'POST', body: JSON.stringify(form) })
      }
      onSaved()
    } catch (err: any) {
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <form onSubmit={handleSubmit} className="w-full max-w-md rounded-lg bg-white p-6 shadow-xl">
        <h2 className="mb-4 text-lg font-semibold">{supplier ? 'Modifier le fournisseur' : 'Nouveau fournisseur'}</h2>
        {error && <p className="mb-3 text-sm text-red-600">{error}</p>}

        <label className="mb-1 block text-sm font-medium">Nom *</label>
        <input className="mb-3 w-full rounded border px-3 py-2 text-sm" required value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} />

        <label className="mb-1 block text-sm font-medium">Personne de contact</label>
        <input className="mb-3 w-full rounded border px-3 py-2 text-sm" value={form.contact_person} onChange={e => setForm({ ...form, contact_person: e.target.value })} />

        <label className="mb-1 block text-sm font-medium">Email</label>
        <input className="mb-3 w-full rounded border px-3 py-2 text-sm" type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} />

        <label className="mb-1 block text-sm font-medium">Telephone</label>
        <input className="mb-3 w-full rounded border px-3 py-2 text-sm" value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} />

        <label className="mb-1 block text-sm font-medium">Adresse</label>
        <input className="mb-3 w-full rounded border px-3 py-2 text-sm" value={form.address} onChange={e => setForm({ ...form, address: e.target.value })} />

        <div className="mt-4 flex justify-end gap-2">
          <button type="button" onClick={onClose} className="rounded border px-4 py-2 text-sm">Annuler</button>
          <button type="submit" disabled={saving} className="rounded bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50">
            {saving ? 'Enregistrement...' : 'Enregistrer'}
          </button>
        </div>
      </form>
    </div>
  )
}

/* ------------------------------------------------------------------ */
/*  Purchase Order form modal                                          */
/* ------------------------------------------------------------------ */

function PurchaseOrderFormModal({
  suppliers,
  onClose,
  onSaved,
}: {
  suppliers: Supplier[]
  onClose: () => void
  onSaved: () => void
}) {
  const [supplierId, setSupplierId] = useState('')
  const [notes, setNotes] = useState('')
  const [expectedDelivery, setExpectedDelivery] = useState('')
  const [items, setItems] = useState<POLineItem[]>([])
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  // Drug search
  const [drugSearch, setDrugSearch] = useState('')
  const [drugResults, setDrugResults] = useState<Drug[]>([])
  const [drugsLoading, setDrugsLoading] = useState(false)

  const searchDrugs = useCallback(async (term: string) => {
    if (term.length < 2) { setDrugResults([]); return }
    setDrugsLoading(true)
    try {
      const res = await apiFetch<{ data: Drug[] }>(`/api/inventory/drugs?search=${encodeURIComponent(term)}&limit=10`)
      setDrugResults(res.data)
    } catch {
      setDrugResults([])
    } finally {
      setDrugsLoading(false)
    }
  }, [])

  useEffect(() => {
    const timer = setTimeout(() => searchDrugs(drugSearch), 300)
    return () => clearTimeout(timer)
  }, [drugSearch, searchDrugs])

  const addItem = (drug: Drug) => {
    if (items.some(i => i.drug_id === drug.id)) return
    setItems([...items, {
      drug_id: drug.id,
      drug_name: drug.name,
      quantity_ordered: 1,
      unit_cost: drug.cost_price,
    }])
    setDrugSearch('')
    setDrugResults([])
  }

  const updateItem = (index: number, field: 'quantity_ordered' | 'unit_cost', value: number) => {
    const updated = [...items]
    updated[index] = { ...updated[index], [field]: value }
    setItems(updated)
  }

  const removeItem = (index: number) => {
    setItems(items.filter((_, i) => i !== index))
  }

  const total = items.reduce((sum, i) => sum + i.quantity_ordered * i.unit_cost, 0)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!supplierId) { setError('Veuillez selectionner un fournisseur.'); return }
    if (items.length === 0) { setError('Veuillez ajouter au moins un article.'); return }
    setSaving(true)
    setError('')
    try {
      await apiFetch('/api/suppliers/orders', {
        method: 'POST',
        body: JSON.stringify({
          supplier_id: supplierId,
          items: items.map(i => ({ drug_id: i.drug_id, quantity_ordered: i.quantity_ordered, unit_cost: i.unit_cost })),
          notes: notes || undefined,
          expected_delivery: expectedDelivery || undefined,
        }),
      })
      onSaved()
    } catch (err: any) {
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 overflow-y-auto py-8">
      <form onSubmit={handleSubmit} className="w-full max-w-2xl rounded-lg bg-white p-6 shadow-xl">
        <h2 className="mb-4 text-lg font-semibold">Nouveau bon de commande</h2>
        {error && <p className="mb-3 text-sm text-red-600">{error}</p>}

        <div className="mb-4 grid grid-cols-2 gap-4">
          <div>
            <label className="mb-1 block text-sm font-medium">Fournisseur *</label>
            <select
              className="w-full rounded border px-3 py-2 text-sm"
              required
              value={supplierId}
              onChange={e => setSupplierId(e.target.value)}
            >
              <option value="">-- Selectionner --</option>
              {suppliers.filter(s => s.is_active).map(s => (
                <option key={s.id} value={s.id}>{s.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium">Livraison prevue</label>
            <input
              type="date"
              className="w-full rounded border px-3 py-2 text-sm"
              value={expectedDelivery}
              onChange={e => setExpectedDelivery(e.target.value)}
            />
          </div>
        </div>

        <label className="mb-1 block text-sm font-medium">Notes</label>
        <textarea className="mb-4 w-full rounded border px-3 py-2 text-sm" rows={2} value={notes} onChange={e => setNotes(e.target.value)} />

        {/* Drug search & add */}
        <label className="mb-1 block text-sm font-medium">Ajouter un article</label>
        <div className="relative mb-4">
          <input
            className="w-full rounded border px-3 py-2 text-sm"
            placeholder="Rechercher un medicament par nom..."
            value={drugSearch}
            onChange={e => setDrugSearch(e.target.value)}
          />
          {(drugResults.length > 0 || drugsLoading) && (
            <div className="absolute z-10 mt-1 w-full rounded border bg-white shadow-lg max-h-48 overflow-y-auto">
              {drugsLoading && <p className="px-3 py-2 text-sm text-gray-500">Recherche...</p>}
              {drugResults.map(d => (
                <button
                  key={d.id}
                  type="button"
                  className="w-full px-3 py-2 text-left text-sm hover:bg-blue-50 flex justify-between"
                  onClick={() => addItem(d)}
                >
                  <span>{d.name}{d.generic_name ? ` (${d.generic_name})` : ''}</span>
                  <span className="text-gray-500">{d.cost_price.toFixed(2)} FCFA</span>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Items table */}
        {items.length > 0 && (
          <table className="mb-4 w-full text-sm">
            <thead>
              <tr className="border-b text-left text-gray-500">
                <th className="pb-2 font-medium">Medicament</th>
                <th className="pb-2 font-medium w-28">Quantite</th>
                <th className="pb-2 font-medium w-32">Cout unitaire</th>
                <th className="pb-2 font-medium w-28 text-right">Sous-total</th>
                <th className="pb-2 w-10"></th>
              </tr>
            </thead>
            <tbody>
              {items.map((item, idx) => (
                <tr key={item.drug_id} className="border-b">
                  <td className="py-2">{item.drug_name}</td>
                  <td className="py-2">
                    <input
                      type="number"
                      min={1}
                      className="w-24 rounded border px-2 py-1 text-sm"
                      value={item.quantity_ordered}
                      onChange={e => updateItem(idx, 'quantity_ordered', Math.max(1, parseInt(e.target.value) || 1))}
                    />
                  </td>
                  <td className="py-2">
                    <input
                      type="number"
                      min={0}
                      step={0.01}
                      className="w-28 rounded border px-2 py-1 text-sm"
                      value={item.unit_cost}
                      onChange={e => updateItem(idx, 'unit_cost', Math.max(0, parseFloat(e.target.value) || 0))}
                    />
                  </td>
                  <td className="py-2 text-right">{(item.quantity_ordered * item.unit_cost).toFixed(2)}</td>
                  <td className="py-2 text-center">
                    <button type="button" onClick={() => removeItem(idx)} className="text-red-500 hover:text-red-700">&times;</button>
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="font-semibold">
                <td colSpan={3} className="pt-2 text-right">Total:</td>
                <td className="pt-2 text-right">{total.toFixed(2)} FCFA</td>
                <td></td>
              </tr>
            </tfoot>
          </table>
        )}

        <div className="mt-4 flex justify-end gap-2">
          <button type="button" onClick={onClose} className="rounded border px-4 py-2 text-sm">Annuler</button>
          <button type="submit" disabled={saving || items.length === 0} className="rounded bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50">
            {saving ? 'Enregistrement...' : 'Creer le bon de commande'}
          </button>
        </div>
      </form>
    </div>
  )
}

/* ------------------------------------------------------------------ */
/*  PO Detail & Receive Stock modal                                    */
/* ------------------------------------------------------------------ */

interface ReceiveEntry {
  purchase_order_item_id: string
  quantity_received: number
  batch_number: string
  expiry_date: string
}

function PODetailModal({
  orderId,
  canEdit,
  onClose,
  onUpdated,
}: {
  orderId: string
  canEdit: boolean
  onClose: () => void
  onUpdated: () => void
}) {
  const [po, setPo] = useState<PODetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [receiving, setReceiving] = useState(false)
  const [receiveEntries, setReceiveEntries] = useState<ReceiveEntry[]>([])
  const [submitting, setSubmitting] = useState(false)

  const loadPO = useCallback(async () => {
    setLoading(true)
    try {
      const data = await apiFetch<PODetail>(`/api/suppliers/orders/${orderId}`)
      setPo(data)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [orderId])

  useEffect(() => { loadPO() }, [loadPO])

  const canReceive = po && (po.status === 'sent' || po.status === 'partial')

  const startReceiving = () => {
    if (!po) return
    setReceiveEntries(
      po.purchase_order_items
        .filter(i => i.quantity_received < i.quantity_ordered)
        .map(i => ({
          purchase_order_item_id: i.id,
          quantity_received: 0,
          batch_number: '',
          expiry_date: '',
        }))
    )
    setReceiving(true)
  }

  const updateEntry = (index: number, field: keyof ReceiveEntry, value: string | number) => {
    const updated = [...receiveEntries]
    updated[index] = { ...updated[index], [field]: value }
    setReceiveEntries(updated)
  }

  const handleReceive = async () => {
    const toReceive = receiveEntries.filter(e => e.quantity_received > 0)
    if (toReceive.length === 0) { setError('Veuillez saisir au moins une quantite recue.'); return }
    for (const entry of toReceive) {
      if (!entry.batch_number.trim()) { setError('Le numero de lot est obligatoire pour chaque article recu.'); return }
      if (!entry.expiry_date) { setError("La date d'expiration est obligatoire pour chaque article recu."); return }
    }
    setSubmitting(true)
    setError('')
    try {
      await apiFetch(`/api/suppliers/orders/${orderId}/receive`, {
        method: 'POST',
        body: JSON.stringify({ items: toReceive }),
      })
      setReceiving(false)
      await loadPO()
      onUpdated()
    } catch (err: any) {
      setError(err.message)
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
        <div className="rounded-lg bg-white p-8 shadow-xl"><p className="text-sm text-gray-500">Chargement...</p></div>
      </div>
    )
  }

  if (!po) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
        <div className="rounded-lg bg-white p-6 shadow-xl">
          <p className="text-sm text-red-600">{error || 'Bon de commande introuvable.'}</p>
          <button onClick={onClose} className="mt-4 rounded border px-4 py-2 text-sm">Fermer</button>
        </div>
      </div>
    )
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 overflow-y-auto py-8">
      <div className="w-full max-w-3xl rounded-lg bg-white p-6 shadow-xl">
        <div className="mb-4 flex items-start justify-between">
          <div>
            <h2 className="text-lg font-semibold">Bon de commande {po.order_number}</h2>
            <p className="mt-1 text-sm text-gray-600">
              Fournisseur: <span className="font-medium">{po.suppliers?.name ?? '-'}</span>
              {' '}&bull;{' '}
              Commande par: <span className="font-medium">{po.profiles?.full_name ?? '-'}</span>
            </p>
          </div>
          <StatusBadge status={po.status} />
        </div>

        {po.notes && <p className="mb-3 text-sm text-gray-600"><span className="font-medium">Notes:</span> {po.notes}</p>}

        <div className="mb-4 flex gap-4 text-sm text-gray-600">
          {po.expected_delivery && <p>Livraison prevue: <span className="font-medium">{po.expected_delivery}</span></p>}
          <p>Date: <span className="font-medium">{new Date(po.created_at).toLocaleDateString('fr-FR')}</span></p>
          {po.total_amount != null && <p>Total: <span className="font-medium">{po.total_amount.toFixed(2)} FCFA</span></p>}
        </div>

        {error && <p className="mb-3 text-sm text-red-600">{error}</p>}

        {/* Items table */}
        <table className="mb-4 w-full text-sm">
          <thead>
            <tr className="border-b text-left text-gray-500">
              <th className="pb-2 font-medium">Medicament</th>
              <th className="pb-2 font-medium text-center">Commande</th>
              <th className="pb-2 font-medium text-center">Recu</th>
              <th className="pb-2 font-medium">Cout unitaire</th>
              <th className="pb-2 font-medium text-right">Total</th>
            </tr>
          </thead>
          <tbody>
            {po.purchase_order_items.map(item => (
              <tr key={item.id} className="border-b">
                <td className="py-2">
                  {item.drugs?.name ?? 'Medicament inconnu'}
                  {item.drugs?.generic_name && <span className="text-gray-500 ml-1">({item.drugs.generic_name})</span>}
                </td>
                <td className="py-2 text-center">{item.quantity_ordered}</td>
                <td className="py-2 text-center">
                  <span className={item.quantity_received >= item.quantity_ordered ? 'text-green-600 font-medium' : item.quantity_received > 0 ? 'text-yellow-600 font-medium' : ''}>
                    {item.quantity_received}
                  </span>
                  /{item.quantity_ordered}
                </td>
                <td className="py-2">{item.unit_cost.toFixed(2)} FCFA</td>
                <td className="py-2 text-right">{item.total.toFixed(2)} FCFA</td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* Receive stock form */}
        {receiving && (
          <div className="mb-4 rounded border border-blue-200 bg-blue-50 p-4">
            <h3 className="mb-3 text-sm font-semibold text-blue-800">Reception de stock</h3>
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-gray-600">
                  <th className="pb-2 font-medium">Medicament</th>
                  <th className="pb-2 font-medium w-20">Qte recue</th>
                  <th className="pb-2 font-medium">N. lot</th>
                  <th className="pb-2 font-medium">Expiration</th>
                </tr>
              </thead>
              <tbody>
                {receiveEntries.map((entry, idx) => {
                  const poItem = po.purchase_order_items.find(i => i.id === entry.purchase_order_item_id)
                  const maxQty = poItem ? poItem.quantity_ordered - poItem.quantity_received : 0
                  return (
                    <tr key={entry.purchase_order_item_id} className="border-b">
                      <td className="py-2">
                        {poItem?.drugs?.name ?? '?'}
                        <span className="ml-1 text-xs text-gray-500">(max: {maxQty})</span>
                      </td>
                      <td className="py-2">
                        <input
                          type="number"
                          min={0}
                          max={maxQty}
                          className="w-16 rounded border px-2 py-1 text-sm"
                          value={entry.quantity_received}
                          onChange={e => updateEntry(idx, 'quantity_received', Math.min(maxQty, Math.max(0, parseInt(e.target.value) || 0)))}
                        />
                      </td>
                      <td className="py-2">
                        <input
                          className="w-full rounded border px-2 py-1 text-sm"
                          placeholder="N. lot"
                          value={entry.batch_number}
                          onChange={e => updateEntry(idx, 'batch_number', e.target.value)}
                        />
                      </td>
                      <td className="py-2">
                        <input
                          type="date"
                          className="w-full rounded border px-2 py-1 text-sm"
                          value={entry.expiry_date}
                          onChange={e => updateEntry(idx, 'expiry_date', e.target.value)}
                        />
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
            <div className="mt-3 flex justify-end gap-2">
              <button type="button" onClick={() => setReceiving(false)} className="rounded border px-3 py-1.5 text-sm">Annuler</button>
              <button
                type="button"
                disabled={submitting}
                onClick={handleReceive}
                className="rounded bg-green-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-green-700 disabled:opacity-50"
              >
                {submitting ? 'Enregistrement...' : 'Confirmer la reception'}
              </button>
            </div>
          </div>
        )}

        <div className="flex justify-end gap-2">
          {canEdit && canReceive && !receiving && (
            <button onClick={startReceiving} className="rounded bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700">
              Recevoir du stock
            </button>
          )}
          <button onClick={onClose} className="rounded border px-4 py-2 text-sm">Fermer</button>
        </div>
      </div>
    </div>
  )
}

/* ------------------------------------------------------------------ */
/*  Main page                                                          */
/* ------------------------------------------------------------------ */

export function SuppliersPage() {
  const { profile } = useAuth()
  const canEdit = profile?.role === 'admin' || profile?.role === 'pharmacist'

  const [tab, setTab] = useState<Tab>('suppliers')

  // Suppliers state
  const [suppliers, setSuppliers] = useState<Supplier[]>([])
  const [suppliersLoading, setSuppliersLoading] = useState(true)
  const [supplierSearch, setSupplierSearch] = useState('')
  const [editingSupplier, setEditingSupplier] = useState<Supplier | null | 'new'>(null)

  // Orders state
  const [orders, setOrders] = useState<PurchaseOrder[]>([])
  const [ordersLoading, setOrdersLoading] = useState(true)
  const [orderStatusFilter, setOrderStatusFilter] = useState('')
  const [showPOForm, setShowPOForm] = useState(false)
  const [viewingPOId, setViewingPOId] = useState<string | null>(null)

  const loadSuppliers = useCallback(async () => {
    setSuppliersLoading(true)
    try {
      const params = new URLSearchParams()
      if (supplierSearch) params.set('search', supplierSearch)
      const res = await apiFetch<{ data: Supplier[] }>(`/api/suppliers?${params}`)
      setSuppliers(res.data)
    } catch {
      // ignore
    } finally {
      setSuppliersLoading(false)
    }
  }, [supplierSearch])

  const loadOrders = useCallback(async () => {
    setOrdersLoading(true)
    try {
      const params = new URLSearchParams()
      if (orderStatusFilter) params.set('status', orderStatusFilter)
      const res = await apiFetch<{ data: PurchaseOrder[] }>(`/api/suppliers/orders/list?${params}`)
      setOrders(res.data)
    } catch {
      // ignore
    } finally {
      setOrdersLoading(false)
    }
  }, [orderStatusFilter])

  useEffect(() => {
    if (tab === 'suppliers') loadSuppliers()
    else loadOrders()
  }, [tab, loadSuppliers, loadOrders])

  // Pre-load suppliers for PO form when switching to orders tab
  useEffect(() => {
    if (tab === 'orders' && suppliers.length === 0) {
      apiFetch<{ data: Supplier[] }>('/api/suppliers').then(res => setSuppliers(res.data)).catch(() => {})
    }
  }, [tab, suppliers.length])

  const handleSendPO = async (id: string) => {
    try {
      await apiFetch(`/api/suppliers/orders/${id}/send`, { method: 'POST' })
      loadOrders()
    } catch (err: any) {
      alert(err.message)
    }
  }

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900">Fournisseurs</h1>
      <p className="mt-1 text-sm text-gray-600">Gestion des fournisseurs et bons de commande.</p>

      {/* Tabs */}
      <div className="mt-4 flex gap-4 border-b">
        <button
          className={`pb-2 text-sm font-medium ${tab === 'suppliers' ? 'border-b-2 border-blue-600 text-blue-600' : 'text-gray-500 hover:text-gray-700'}`}
          onClick={() => setTab('suppliers')}
        >
          Fournisseurs
        </button>
        <button
          className={`pb-2 text-sm font-medium ${tab === 'orders' ? 'border-b-2 border-blue-600 text-blue-600' : 'text-gray-500 hover:text-gray-700'}`}
          onClick={() => setTab('orders')}
        >
          Bons de commande
        </button>
      </div>

      {/* ---- Suppliers tab ---- */}
      {tab === 'suppliers' && (
        <div className="mt-4">
          <div className="mb-4 flex items-center gap-3">
            <input
              className="w-64 rounded border px-3 py-2 text-sm"
              placeholder="Rechercher un fournisseur..."
              value={supplierSearch}
              onChange={e => setSupplierSearch(e.target.value)}
            />
            {canEdit && (
              <button onClick={() => setEditingSupplier('new')} className="ml-auto rounded bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700">
                + Nouveau fournisseur
              </button>
            )}
          </div>

          {suppliersLoading ? (
            <p className="text-sm text-gray-500">Chargement...</p>
          ) : suppliers.length === 0 ? (
            <p className="text-sm text-gray-500">Aucun fournisseur trouve.</p>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-left text-gray-500">
                  <th className="pb-2 font-medium">Nom</th>
                  <th className="pb-2 font-medium">Contact</th>
                  <th className="pb-2 font-medium">Email</th>
                  <th className="pb-2 font-medium">Telephone</th>
                  <th className="pb-2 font-medium">Statut</th>
                  {canEdit && <th className="pb-2 font-medium"></th>}
                </tr>
              </thead>
              <tbody>
                {suppliers.map(s => (
                  <tr key={s.id} className="border-b hover:bg-gray-50">
                    <td className="py-2 font-medium">{s.name}</td>
                    <td className="py-2">{s.contact_person ?? '-'}</td>
                    <td className="py-2">{s.email ?? '-'}</td>
                    <td className="py-2">{s.phone ?? '-'}</td>
                    <td className="py-2">
                      <span className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${s.is_active ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                        {s.is_active ? 'Actif' : 'Inactif'}
                      </span>
                    </td>
                    {canEdit && (
                      <td className="py-2">
                        <button onClick={() => setEditingSupplier(s)} className="text-blue-600 hover:underline">Modifier</button>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          )}

          {editingSupplier && (
            <SupplierModal
              supplier={editingSupplier === 'new' ? null : editingSupplier}
              onClose={() => setEditingSupplier(null)}
              onSaved={() => { setEditingSupplier(null); loadSuppliers() }}
            />
          )}
        </div>
      )}

      {/* ---- Purchase Orders tab ---- */}
      {tab === 'orders' && (
        <div className="mt-4">
          <div className="mb-4 flex items-center gap-3">
            <select
              className="rounded border px-3 py-2 text-sm"
              value={orderStatusFilter}
              onChange={e => setOrderStatusFilter(e.target.value)}
            >
              <option value="">Tous les statuts</option>
              <option value="draft">Brouillon</option>
              <option value="sent">Envoye</option>
              <option value="partial">Partiel</option>
              <option value="received">Recu</option>
            </select>
            {canEdit && (
              <button onClick={() => setShowPOForm(true)} className="ml-auto rounded bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700">
                + Nouveau bon de commande
              </button>
            )}
          </div>

          {ordersLoading ? (
            <p className="text-sm text-gray-500">Chargement...</p>
          ) : orders.length === 0 ? (
            <p className="text-sm text-gray-500">Aucun bon de commande trouve.</p>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-left text-gray-500">
                  <th className="pb-2 font-medium">N. commande</th>
                  <th className="pb-2 font-medium">Fournisseur</th>
                  <th className="pb-2 font-medium">Montant</th>
                  <th className="pb-2 font-medium">Statut</th>
                  <th className="pb-2 font-medium">Livraison prevue</th>
                  <th className="pb-2 font-medium">Date</th>
                  <th className="pb-2 font-medium"></th>
                </tr>
              </thead>
              <tbody>
                {orders.map(o => (
                  <tr key={o.id} className="border-b hover:bg-gray-50">
                    <td className="py-2 font-medium">{o.order_number}</td>
                    <td className="py-2">{(o.suppliers as any)?.name ?? '-'}</td>
                    <td className="py-2">{o.total_amount != null ? `${o.total_amount.toFixed(2)} FCFA` : '-'}</td>
                    <td className="py-2"><StatusBadge status={o.status} /></td>
                    <td className="py-2">{o.expected_delivery ?? '-'}</td>
                    <td className="py-2">{new Date(o.created_at).toLocaleDateString('fr-FR')}</td>
                    <td className="py-2 flex gap-2 justify-end">
                      <button onClick={() => setViewingPOId(o.id)} className="text-blue-600 hover:underline">Voir</button>
                      {canEdit && o.status === 'draft' && (
                        <button onClick={() => handleSendPO(o.id)} className="text-blue-600 hover:underline">Envoyer</button>
                      )}
                      {canEdit && (o.status === 'sent' || o.status === 'partial') && (
                        <button onClick={() => setViewingPOId(o.id)} className="text-green-600 hover:underline">Recevoir</button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}

          {showPOForm && (
            <PurchaseOrderFormModal
              suppliers={suppliers}
              onClose={() => setShowPOForm(false)}
              onSaved={() => { setShowPOForm(false); loadOrders() }}
            />
          )}

          {viewingPOId && (
            <PODetailModal
              orderId={viewingPOId}
              canEdit={canEdit}
              onClose={() => setViewingPOId(null)}
              onUpdated={loadOrders}
            />
          )}
        </div>
      )}
    </div>
  )
}
