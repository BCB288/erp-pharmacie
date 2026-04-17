import { useEffect, useState, useCallback } from 'react'
import { useAuth } from '../../hooks/useAuth'
import { supabase } from '../../lib/supabase'

const API = import.meta.env.VITE_API_URL || 'http://localhost:3001'

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

interface PurchaseOrder {
  id: string
  order_number: string
  supplier_id: string
  status: string
  total_amount: number | null
  expected_delivery: string | null
  created_at: string
  suppliers?: { name: string }
  profiles?: { full_name: string }
}

async function authHeaders(): Promise<Record<string, string>> {
  const { data } = await supabase.auth.getSession()
  return {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${data.session?.access_token ?? ''}`,
  }
}

async function apiFetch<T>(path: string, opts?: RequestInit): Promise<T> {
  const headers = await authHeaders()
  const res = await fetch(`${API}${path}`, { ...opts, headers: { ...headers, ...opts?.headers } })
  if (!res.ok) {
    const body = await res.json().catch(() => ({}))
    throw new Error(body.error || `API error ${res.status}`)
  }
  return res.json()
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

function StatusBadge({ status }: { status: string }) {
  return (
    <span className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_COLORS[status] ?? 'bg-gray-100 text-gray-700'}`}>
      {status}
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
                  {canEdit && <th className="pb-2 font-medium"></th>}
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
                    {canEdit && (
                      <td className="py-2">
                        {o.status === 'draft' && (
                          <button onClick={() => handleSendPO(o.id)} className="text-blue-600 hover:underline">Envoyer</button>
                        )}
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}
    </div>
  )
}
