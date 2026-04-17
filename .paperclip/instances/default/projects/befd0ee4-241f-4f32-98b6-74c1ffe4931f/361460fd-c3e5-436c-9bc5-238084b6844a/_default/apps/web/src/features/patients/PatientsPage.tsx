import { useEffect, useState, useCallback } from 'react'
import { useAuth } from '../../hooks/useAuth'
import { supabase } from '../../lib/supabase'

const API = import.meta.env.VITE_API_URL || 'http://localhost:3001'

type Tab = 'patients' | 'prescriptions'

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

interface Patient {
  id: string
  first_name: string
  last_name: string
  date_of_birth: string | null
  phone: string | null
  email: string | null
  address: string | null
  allergies: string[] | null
  notes: string | null
  created_at: string
  updated_at: string
}

interface Prescription {
  id: string
  patient_id: string
  prescription_number: string
  prescriber_name: string
  prescriber_license: string | null
  sale_id: string | null
  items: any
  status: string
  prescribed_date: string
  expiry_date: string | null
  dispensed_at: string | null
  created_at: string
  patients?: { first_name: string; last_name: string }
}

/* ------------------------------------------------------------------ */
/*  API helpers                                                        */
/* ------------------------------------------------------------------ */

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

const RX_STATUS_COLORS: Record<string, string> = {
  active: 'bg-blue-100 text-blue-700',
  dispensed: 'bg-green-100 text-green-700',
  expired: 'bg-red-100 text-red-700',
  cancelled: 'bg-gray-100 text-gray-700',
}

function StatusBadge({ status }: { status: string }) {
  return (
    <span className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${RX_STATUS_COLORS[status] ?? 'bg-gray-100 text-gray-700'}`}>
      {status}
    </span>
  )
}

/* ------------------------------------------------------------------ */
/*  Patient form modal                                                 */
/* ------------------------------------------------------------------ */

function PatientModal({
  patient,
  onClose,
  onSaved,
}: {
  patient: Patient | null
  onClose: () => void
  onSaved: () => void
}) {
  const [form, setForm] = useState({
    first_name: patient?.first_name ?? '',
    last_name: patient?.last_name ?? '',
    date_of_birth: patient?.date_of_birth ?? '',
    phone: patient?.phone ?? '',
    email: patient?.email ?? '',
    address: patient?.address ?? '',
    allergies: (patient?.allergies ?? []).join(', '),
    notes: patient?.notes ?? '',
  })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setError('')
    try {
      const payload = {
        ...form,
        date_of_birth: form.date_of_birth || null,
        phone: form.phone || null,
        email: form.email || null,
        address: form.address || null,
        allergies: form.allergies
          ? form.allergies.split(',').map(a => a.trim()).filter(Boolean)
          : [],
        notes: form.notes || null,
      }
      if (patient) {
        await apiFetch(`/api/patients/${patient.id}`, { method: 'PATCH', body: JSON.stringify(payload) })
      } else {
        await apiFetch('/api/patients', { method: 'POST', body: JSON.stringify(payload) })
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
      <form onSubmit={handleSubmit} className="w-full max-w-lg rounded-lg bg-white p-6 shadow-xl max-h-[90vh] overflow-y-auto">
        <h2 className="mb-4 text-lg font-semibold">{patient ? 'Modifier le patient' : 'Nouveau patient'}</h2>
        {error && <p className="mb-3 text-sm text-red-600">{error}</p>}

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="mb-1 block text-sm font-medium">Prenom *</label>
            <input className="w-full rounded border px-3 py-2 text-sm" required value={form.first_name} onChange={e => setForm({ ...form, first_name: e.target.value })} />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium">Nom *</label>
            <input className="w-full rounded border px-3 py-2 text-sm" required value={form.last_name} onChange={e => setForm({ ...form, last_name: e.target.value })} />
          </div>
        </div>

        <label className="mt-3 mb-1 block text-sm font-medium">Date de naissance</label>
        <input className="w-full rounded border px-3 py-2 text-sm" type="date" value={form.date_of_birth} onChange={e => setForm({ ...form, date_of_birth: e.target.value })} />

        <div className="mt-3 grid grid-cols-2 gap-3">
          <div>
            <label className="mb-1 block text-sm font-medium">Telephone</label>
            <input className="w-full rounded border px-3 py-2 text-sm" value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium">Email</label>
            <input className="w-full rounded border px-3 py-2 text-sm" type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} />
          </div>
        </div>

        <label className="mt-3 mb-1 block text-sm font-medium">Adresse</label>
        <input className="w-full rounded border px-3 py-2 text-sm" value={form.address} onChange={e => setForm({ ...form, address: e.target.value })} />

        <label className="mt-3 mb-1 block text-sm font-medium">Allergies (separees par des virgules)</label>
        <input className="w-full rounded border px-3 py-2 text-sm" placeholder="Penicilline, Aspirine" value={form.allergies} onChange={e => setForm({ ...form, allergies: e.target.value })} />

        <label className="mt-3 mb-1 block text-sm font-medium">Notes</label>
        <textarea className="w-full rounded border px-3 py-2 text-sm" rows={2} value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} />

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
/*  Prescription form modal                                            */
/* ------------------------------------------------------------------ */

function PrescriptionModal({
  patients,
  preselectedPatientId,
  onClose,
  onSaved,
}: {
  patients: Patient[]
  preselectedPatientId?: string
  onClose: () => void
  onSaved: () => void
}) {
  const [form, setForm] = useState({
    patient_id: preselectedPatientId ?? '',
    prescriber_name: '',
    prescriber_license: '',
    prescribed_date: new Date().toISOString().slice(0, 10),
    expiry_date: '',
  })
  const [items, setItems] = useState([{ drug_name: '', dosage: '', quantity: 1, instructions: '' }])
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const addItem = () => setItems([...items, { drug_name: '', dosage: '', quantity: 1, instructions: '' }])
  const removeItem = (idx: number) => setItems(items.filter((_, i) => i !== idx))
  const updateItem = (idx: number, field: string, value: string | number) =>
    setItems(items.map((it, i) => (i === idx ? { ...it, [field]: value } : it)))

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setError('')
    try {
      await apiFetch('/api/patients/prescriptions', {
        method: 'POST',
        body: JSON.stringify({
          ...form,
          prescriber_license: form.prescriber_license || null,
          expiry_date: form.expiry_date || null,
          items,
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <form onSubmit={handleSubmit} className="w-full max-w-2xl rounded-lg bg-white p-6 shadow-xl max-h-[90vh] overflow-y-auto">
        <h2 className="mb-4 text-lg font-semibold">Nouvelle ordonnance</h2>
        {error && <p className="mb-3 text-sm text-red-600">{error}</p>}

        <label className="mb-1 block text-sm font-medium">Patient *</label>
        <select className="mb-3 w-full rounded border px-3 py-2 text-sm" required value={form.patient_id} onChange={e => setForm({ ...form, patient_id: e.target.value })}>
          <option value="">-- Selectionner un patient --</option>
          {patients.map(p => (
            <option key={p.id} value={p.id}>{p.last_name} {p.first_name}</option>
          ))}
        </select>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="mb-1 block text-sm font-medium">Prescripteur *</label>
            <input className="w-full rounded border px-3 py-2 text-sm" required value={form.prescriber_name} onChange={e => setForm({ ...form, prescriber_name: e.target.value })} />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium">N. licence</label>
            <input className="w-full rounded border px-3 py-2 text-sm" value={form.prescriber_license} onChange={e => setForm({ ...form, prescriber_license: e.target.value })} />
          </div>
        </div>

        <div className="mt-3 grid grid-cols-2 gap-3">
          <div>
            <label className="mb-1 block text-sm font-medium">Date de prescription *</label>
            <input className="w-full rounded border px-3 py-2 text-sm" type="date" required value={form.prescribed_date} onChange={e => setForm({ ...form, prescribed_date: e.target.value })} />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium">Date d'expiration</label>
            <input className="w-full rounded border px-3 py-2 text-sm" type="date" value={form.expiry_date} onChange={e => setForm({ ...form, expiry_date: e.target.value })} />
          </div>
        </div>

        <h3 className="mt-4 mb-2 text-sm font-semibold">Medicaments</h3>
        {items.map((item, idx) => (
          <div key={idx} className="mb-2 rounded border p-3">
            <div className="grid grid-cols-3 gap-2">
              <div>
                <label className="mb-1 block text-xs font-medium">Medicament *</label>
                <input className="w-full rounded border px-2 py-1.5 text-sm" required value={item.drug_name} onChange={e => updateItem(idx, 'drug_name', e.target.value)} />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium">Dosage *</label>
                <input className="w-full rounded border px-2 py-1.5 text-sm" required value={item.dosage} onChange={e => updateItem(idx, 'dosage', e.target.value)} />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium">Quantite *</label>
                <input className="w-full rounded border px-2 py-1.5 text-sm" type="number" min={1} required value={item.quantity} onChange={e => updateItem(idx, 'quantity', Number(e.target.value))} />
              </div>
            </div>
            <div className="mt-2 flex items-end gap-2">
              <div className="flex-1">
                <label className="mb-1 block text-xs font-medium">Instructions</label>
                <input className="w-full rounded border px-2 py-1.5 text-sm" value={item.instructions} onChange={e => updateItem(idx, 'instructions', e.target.value)} />
              </div>
              {items.length > 1 && (
                <button type="button" onClick={() => removeItem(idx)} className="rounded border border-red-300 px-2 py-1.5 text-xs text-red-600 hover:bg-red-50">
                  Supprimer
                </button>
              )}
            </div>
          </div>
        ))}
        <button type="button" onClick={addItem} className="mt-1 text-sm text-blue-600 hover:underline">+ Ajouter un medicament</button>

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
/*  Prescription detail modal                                          */
/* ------------------------------------------------------------------ */

function PrescriptionDetailModal({
  prescription,
  onClose,
  onDispensed,
  canDispense,
}: {
  prescription: Prescription
  onClose: () => void
  onDispensed: () => void
  canDispense: boolean
}) {
  const [dispensing, setDispensing] = useState(false)

  const rxItems: any[] = (() => {
    try {
      return typeof prescription.items === 'string' ? JSON.parse(prescription.items) : prescription.items
    } catch {
      return []
    }
  })()

  const handleDispense = async () => {
    setDispensing(true)
    try {
      await apiFetch(`/api/patients/prescriptions/${prescription.id}/dispense`, { method: 'POST' })
      onDispensed()
    } catch (err: any) {
      alert(err.message)
    } finally {
      setDispensing(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="w-full max-w-lg rounded-lg bg-white p-6 shadow-xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">Ordonnance {prescription.prescription_number}</h2>
          <StatusBadge status={prescription.status} />
        </div>

        <div className="space-y-2 text-sm">
          <p><span className="font-medium">Patient:</span> {prescription.patients?.last_name} {prescription.patients?.first_name}</p>
          <p><span className="font-medium">Prescripteur:</span> {prescription.prescriber_name}</p>
          {prescription.prescriber_license && <p><span className="font-medium">Licence:</span> {prescription.prescriber_license}</p>}
          <p><span className="font-medium">Date:</span> {prescription.prescribed_date}</p>
          {prescription.expiry_date && <p><span className="font-medium">Expiration:</span> {prescription.expiry_date}</p>}
          {prescription.dispensed_at && <p><span className="font-medium">Dispense le:</span> {new Date(prescription.dispensed_at).toLocaleString('fr-FR')}</p>}
        </div>

        <h3 className="mt-4 mb-2 text-sm font-semibold">Medicaments</h3>
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b text-left text-gray-500">
              <th className="pb-1 font-medium">Medicament</th>
              <th className="pb-1 font-medium">Dosage</th>
              <th className="pb-1 font-medium">Qte</th>
              <th className="pb-1 font-medium">Instructions</th>
            </tr>
          </thead>
          <tbody>
            {rxItems.map((item: any, idx: number) => (
              <tr key={idx} className="border-b">
                <td className="py-1">{item.drug_name}</td>
                <td className="py-1">{item.dosage}</td>
                <td className="py-1">{item.quantity}</td>
                <td className="py-1">{item.instructions || '-'}</td>
              </tr>
            ))}
          </tbody>
        </table>

        <div className="mt-4 flex justify-end gap-2">
          {canDispense && prescription.status === 'active' && (
            <button
              onClick={handleDispense}
              disabled={dispensing}
              className="rounded bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700 disabled:opacity-50"
            >
              {dispensing ? 'Dispensation...' : 'Marquer comme dispense'}
            </button>
          )}
          <button type="button" onClick={onClose} className="rounded border px-4 py-2 text-sm">Fermer</button>
        </div>
      </div>
    </div>
  )
}

/* ------------------------------------------------------------------ */
/*  Main page                                                          */
/* ------------------------------------------------------------------ */

export function PatientsPage() {
  const { profile } = useAuth()
  const canEdit = profile?.role === 'admin' || profile?.role === 'pharmacist'

  const [tab, setTab] = useState<Tab>('patients')

  // Patients state
  const [patients, setPatients] = useState<Patient[]>([])
  const [patientsLoading, setPatientsLoading] = useState(true)
  const [patientSearch, setPatientSearch] = useState('')
  const [editingPatient, setEditingPatient] = useState<Patient | null | 'new'>(null)
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null)

  // Prescriptions state
  const [prescriptions, setPrescriptions] = useState<Prescription[]>([])
  const [prescriptionsLoading, setPrescriptionsLoading] = useState(true)
  const [rxStatusFilter, setRxStatusFilter] = useState('')
  const [rxPatientFilter, setRxPatientFilter] = useState('')
  const [showRxModal, setShowRxModal] = useState(false)
  const [viewingRx, setViewingRx] = useState<Prescription | null>(null)

  const loadPatients = useCallback(async () => {
    setPatientsLoading(true)
    try {
      const params = new URLSearchParams()
      if (patientSearch) params.set('search', patientSearch)
      const res = await apiFetch<{ data: Patient[] }>(`/api/patients?${params}`)
      setPatients(res.data)
    } catch {
      // ignore
    } finally {
      setPatientsLoading(false)
    }
  }, [patientSearch])

  const loadPrescriptions = useCallback(async () => {
    setPrescriptionsLoading(true)
    try {
      const params = new URLSearchParams()
      if (rxStatusFilter) params.set('status', rxStatusFilter)
      if (rxPatientFilter) params.set('patient_id', rxPatientFilter)
      const res = await apiFetch<{ data: Prescription[] }>(`/api/patients/prescriptions/list?${params}`)
      setPrescriptions(res.data)
    } catch {
      // ignore
    } finally {
      setPrescriptionsLoading(false)
    }
  }, [rxStatusFilter, rxPatientFilter])

  useEffect(() => {
    if (tab === 'patients') loadPatients()
    else loadPrescriptions()
  }, [tab, loadPatients, loadPrescriptions])

  // Also load patients list when on prescriptions tab (for the patient filter dropdown + prescription modal)
  useEffect(() => {
    if (tab === 'prescriptions' && patients.length === 0) {
      apiFetch<{ data: Patient[] }>('/api/patients').then(res => setPatients(res.data)).catch(() => {})
    }
  }, [tab, patients.length])

  const handleViewHistory = (patient: Patient) => {
    setSelectedPatient(patient)
    setRxPatientFilter(patient.id)
    setTab('prescriptions')
  }

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900">Patients</h1>
      <p className="mt-1 text-sm text-gray-600">Dossiers patients et ordonnances.</p>

      {/* Tabs */}
      <div className="mt-4 flex gap-4 border-b">
        <button
          className={`pb-2 text-sm font-medium ${tab === 'patients' ? 'border-b-2 border-blue-600 text-blue-600' : 'text-gray-500 hover:text-gray-700'}`}
          onClick={() => { setTab('patients'); setRxPatientFilter(''); setSelectedPatient(null) }}
        >
          Patients
        </button>
        <button
          className={`pb-2 text-sm font-medium ${tab === 'prescriptions' ? 'border-b-2 border-blue-600 text-blue-600' : 'text-gray-500 hover:text-gray-700'}`}
          onClick={() => setTab('prescriptions')}
        >
          Ordonnances
          {selectedPatient && <span className="ml-1 text-xs text-gray-400">({selectedPatient.last_name})</span>}
        </button>
      </div>

      {/* ---- Patients tab ---- */}
      {tab === 'patients' && (
        <div className="mt-4">
          <div className="mb-4 flex items-center gap-3">
            <input
              className="w-64 rounded border px-3 py-2 text-sm"
              placeholder="Rechercher un patient..."
              value={patientSearch}
              onChange={e => setPatientSearch(e.target.value)}
            />
            {canEdit && (
              <button onClick={() => setEditingPatient('new')} className="ml-auto rounded bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700">
                + Nouveau patient
              </button>
            )}
          </div>

          {patientsLoading ? (
            <p className="text-sm text-gray-500">Chargement...</p>
          ) : patients.length === 0 ? (
            <p className="text-sm text-gray-500">Aucun patient trouve.</p>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-left text-gray-500">
                  <th className="pb-2 font-medium">Nom</th>
                  <th className="pb-2 font-medium">Date de naissance</th>
                  <th className="pb-2 font-medium">Telephone</th>
                  <th className="pb-2 font-medium">Email</th>
                  <th className="pb-2 font-medium">Allergies</th>
                  <th className="pb-2 font-medium"></th>
                </tr>
              </thead>
              <tbody>
                {patients.map(p => (
                  <tr key={p.id} className="border-b hover:bg-gray-50">
                    <td className="py-2 font-medium">{p.last_name} {p.first_name}</td>
                    <td className="py-2">{p.date_of_birth ?? '-'}</td>
                    <td className="py-2">{p.phone ?? '-'}</td>
                    <td className="py-2">{p.email ?? '-'}</td>
                    <td className="py-2">
                      {p.allergies && p.allergies.length > 0 ? (
                        <span className="inline-block rounded-full bg-red-100 px-2 py-0.5 text-xs font-medium text-red-700">
                          {p.allergies.join(', ')}
                        </span>
                      ) : '-'}
                    </td>
                    <td className="py-2 space-x-2 text-right">
                      <button onClick={() => handleViewHistory(p)} className="text-blue-600 hover:underline text-xs">Ordonnances</button>
                      {canEdit && (
                        <button onClick={() => setEditingPatient(p)} className="text-blue-600 hover:underline text-xs">Modifier</button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}

          {editingPatient && (
            <PatientModal
              patient={editingPatient === 'new' ? null : editingPatient}
              onClose={() => setEditingPatient(null)}
              onSaved={() => { setEditingPatient(null); loadPatients() }}
            />
          )}
        </div>
      )}

      {/* ---- Prescriptions tab ---- */}
      {tab === 'prescriptions' && (
        <div className="mt-4">
          <div className="mb-4 flex items-center gap-3">
            <select
              className="rounded border px-3 py-2 text-sm"
              value={rxPatientFilter}
              onChange={e => { setRxPatientFilter(e.target.value); if (!e.target.value) setSelectedPatient(null) }}
            >
              <option value="">Tous les patients</option>
              {patients.map(p => (
                <option key={p.id} value={p.id}>{p.last_name} {p.first_name}</option>
              ))}
            </select>
            <select
              className="rounded border px-3 py-2 text-sm"
              value={rxStatusFilter}
              onChange={e => setRxStatusFilter(e.target.value)}
            >
              <option value="">Tous les statuts</option>
              <option value="active">Active</option>
              <option value="dispensed">Dispensee</option>
              <option value="expired">Expiree</option>
              <option value="cancelled">Annulee</option>
            </select>
            {canEdit && (
              <button onClick={() => setShowRxModal(true)} className="ml-auto rounded bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700">
                + Nouvelle ordonnance
              </button>
            )}
          </div>

          {prescriptionsLoading ? (
            <p className="text-sm text-gray-500">Chargement...</p>
          ) : prescriptions.length === 0 ? (
            <p className="text-sm text-gray-500">Aucune ordonnance trouvee.</p>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-left text-gray-500">
                  <th className="pb-2 font-medium">N. ordonnance</th>
                  <th className="pb-2 font-medium">Patient</th>
                  <th className="pb-2 font-medium">Prescripteur</th>
                  <th className="pb-2 font-medium">Statut</th>
                  <th className="pb-2 font-medium">Date</th>
                  <th className="pb-2 font-medium"></th>
                </tr>
              </thead>
              <tbody>
                {prescriptions.map(rx => (
                  <tr key={rx.id} className="border-b hover:bg-gray-50">
                    <td className="py-2 font-medium">{rx.prescription_number}</td>
                    <td className="py-2">{rx.patients ? `${rx.patients.last_name} ${rx.patients.first_name}` : '-'}</td>
                    <td className="py-2">{rx.prescriber_name}</td>
                    <td className="py-2"><StatusBadge status={rx.status} /></td>
                    <td className="py-2">{rx.prescribed_date}</td>
                    <td className="py-2">
                      <button onClick={() => setViewingRx(rx)} className="text-blue-600 hover:underline text-xs">Details</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}

          {showRxModal && (
            <PrescriptionModal
              patients={patients}
              preselectedPatientId={rxPatientFilter || undefined}
              onClose={() => setShowRxModal(false)}
              onSaved={() => { setShowRxModal(false); loadPrescriptions() }}
            />
          )}

          {viewingRx && (
            <PrescriptionDetailModal
              prescription={viewingRx}
              canDispense={canEdit}
              onClose={() => setViewingRx(null)}
              onDispensed={() => { setViewingRx(null); loadPrescriptions() }}
            />
          )}
        </div>
      )}
    </div>
  )
}
