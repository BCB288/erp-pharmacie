import { useEffect, useState, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useAuth } from '../../hooks/useAuth'
import { apiFetch } from '../../lib/api'

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
/*  Status badge                                                       */
/* ------------------------------------------------------------------ */

const RX_STATUS_COLORS: Record<string, string> = {
  active: 'bg-blue-100 text-blue-700',
  dispensed: 'bg-green-100 text-green-700',
  expired: 'bg-red-100 text-red-700',
  cancelled: 'bg-gray-100 text-gray-700',
}

const RX_STATUS_DOT: Record<string, string> = {
  active: 'bg-blue-500',
  dispensed: 'bg-green-500',
  expired: 'bg-red-500',
  cancelled: 'bg-gray-400',
}

function StatusBadge({ status }: { status: string }) {
  return (
    <span className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${RX_STATUS_COLORS[status] ?? 'bg-gray-100 text-gray-700'}`}>
      {status}
    </span>
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
/*  Prescription history timeline                                      */
/* ------------------------------------------------------------------ */

function PrescriptionTimeline({
  prescriptions,
  loading,
  canDispense,
  onDispensed,
}: {
  prescriptions: Prescription[]
  loading: boolean
  canDispense: boolean
  onDispensed: () => void
}) {
  const [viewingRx, setViewingRx] = useState<Prescription | null>(null)

  if (loading) {
    return <p className="text-sm text-gray-500 py-4">Chargement des ordonnances...</p>
  }

  if (prescriptions.length === 0) {
    return (
      <div className="rounded-lg border border-dashed border-gray-300 p-8 text-center">
        <p className="text-sm text-gray-500">Aucune ordonnance pour ce patient.</p>
      </div>
    )
  }

  // Group prescriptions by month/year
  const grouped: Record<string, Prescription[]> = {}
  for (const rx of prescriptions) {
    const date = new Date(rx.prescribed_date)
    const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
    if (!grouped[key]) grouped[key] = []
    grouped[key].push(rx)
  }

  const sortedMonths = Object.keys(grouped).sort((a, b) => b.localeCompare(a))

  const formatMonth = (key: string) => {
    const [year, month] = key.split('-')
    const date = new Date(Number(year), Number(month) - 1)
    return date.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })
  }

  return (
    <>
      <div className="space-y-6">
        {sortedMonths.map(monthKey => (
          <div key={monthKey}>
            <h4 className="mb-3 text-xs font-semibold uppercase tracking-wider text-gray-400">
              {formatMonth(monthKey)}
            </h4>
            <div className="relative ml-3 border-l-2 border-gray-200 pl-6 space-y-4">
              {grouped[monthKey].map(rx => {
                const rxItems: any[] = (() => {
                  try {
                    return typeof rx.items === 'string' ? JSON.parse(rx.items) : rx.items
                  } catch {
                    return []
                  }
                })()

                return (
                  <div key={rx.id} className="relative">
                    {/* Timeline dot */}
                    <div className={`absolute -left-[31px] top-1 h-3 w-3 rounded-full border-2 border-white ${RX_STATUS_DOT[rx.status] ?? 'bg-gray-400'}`} />

                    <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm hover:shadow-md transition-shadow">
                      <div className="flex items-start justify-between">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-semibold text-gray-900">{rx.prescription_number}</span>
                            <StatusBadge status={rx.status} />
                          </div>
                          <p className="mt-1 text-xs text-gray-500">
                            Dr. {rx.prescriber_name} &middot; {new Date(rx.prescribed_date).toLocaleDateString('fr-FR')}
                          </p>
                        </div>
                        <button
                          onClick={() => setViewingRx(rx)}
                          className="text-xs text-blue-600 hover:underline"
                        >
                          Details
                        </button>
                      </div>

                      {/* Drug summary */}
                      {rxItems.length > 0 && (
                        <div className="mt-2 flex flex-wrap gap-1.5">
                          {rxItems.map((item: any, idx: number) => (
                            <span key={idx} className="inline-block rounded bg-gray-100 px-2 py-0.5 text-xs text-gray-700">
                              {item.drug_name} {item.dosage ? `(${item.dosage})` : ''} x{item.quantity}
                            </span>
                          ))}
                        </div>
                      )}

                      {rx.dispensed_at && (
                        <p className="mt-2 text-xs text-green-600">
                          Dispense le {new Date(rx.dispensed_at).toLocaleDateString('fr-FR')}
                        </p>
                      )}
                      {rx.expiry_date && rx.status === 'active' && (
                        <p className="mt-1 text-xs text-amber-600">
                          Expire le {new Date(rx.expiry_date).toLocaleDateString('fr-FR')}
                        </p>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        ))}
      </div>

      {viewingRx && (
        <PrescriptionDetailModal
          prescription={viewingRx}
          canDispense={canDispense}
          onClose={() => setViewingRx(null)}
          onDispensed={() => { setViewingRx(null); onDispensed() }}
        />
      )}
    </>
  )
}

/* ------------------------------------------------------------------ */
/*  Patient detail page                                                */
/* ------------------------------------------------------------------ */

export function PatientDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { profile } = useAuth()
  const canEdit = profile?.role === 'admin' || profile?.role === 'pharmacist'

  const [patient, setPatient] = useState<Patient | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const [prescriptions, setPrescriptions] = useState<Prescription[]>([])
  const [rxLoading, setRxLoading] = useState(true)
  const [rxStatusFilter, setRxStatusFilter] = useState('')

  const loadPatient = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const res = await apiFetch<{ data: Patient }>(`/api/patients/${id}`)
      setPatient(res.data)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [id])

  const loadPrescriptions = useCallback(async () => {
    setRxLoading(true)
    try {
      const params = new URLSearchParams({ patient_id: id! })
      if (rxStatusFilter) params.set('status', rxStatusFilter)
      params.set('limit', '100')
      const res = await apiFetch<{ data: Prescription[] }>(`/api/patients/prescriptions/list?${params}`)
      setPrescriptions(res.data)
    } catch {
      // ignore
    } finally {
      setRxLoading(false)
    }
  }, [id, rxStatusFilter])

  useEffect(() => {
    loadPatient()
    loadPrescriptions()
  }, [loadPatient, loadPrescriptions])

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <p className="text-sm text-gray-500">Chargement...</p>
      </div>
    )
  }

  if (error || !patient) {
    return (
      <div className="py-10 text-center">
        <p className="text-sm text-red-600">{error || 'Patient introuvable.'}</p>
        <button onClick={() => navigate('/patients')} className="mt-4 text-sm text-blue-600 hover:underline">
          Retour a la liste
        </button>
      </div>
    )
  }

  const age = patient.date_of_birth
    ? Math.floor((Date.now() - new Date(patient.date_of_birth).getTime()) / (365.25 * 24 * 60 * 60 * 1000))
    : null

  const activeRxCount = prescriptions.filter(rx => rx.status === 'active').length
  const totalRxCount = prescriptions.length

  return (
    <div>
      {/* Back link */}
      <button
        onClick={() => navigate('/patients')}
        className="mb-4 inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700"
      >
        &larr; Retour aux patients
      </button>

      {/* Patient header */}
      <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              {patient.last_name} {patient.first_name}
            </h1>
            <div className="mt-1 flex flex-wrap items-center gap-3 text-sm text-gray-500">
              {patient.date_of_birth && (
                <span>
                  Ne(e) le {new Date(patient.date_of_birth).toLocaleDateString('fr-FR')}
                  {age !== null && <span className="ml-1 text-gray-400">({age} ans)</span>}
                </span>
              )}
              {patient.phone && <span>Tel: {patient.phone}</span>}
              {patient.email && <span>{patient.email}</span>}
            </div>
            {patient.address && (
              <p className="mt-1 text-sm text-gray-500">{patient.address}</p>
            )}
          </div>

          {/* Quick stats */}
          <div className="flex gap-4 text-center">
            <div className="rounded-lg bg-blue-50 px-4 py-2">
              <p className="text-lg font-bold text-blue-700">{totalRxCount}</p>
              <p className="text-xs text-blue-600">Ordonnances</p>
            </div>
            <div className="rounded-lg bg-green-50 px-4 py-2">
              <p className="text-lg font-bold text-green-700">{activeRxCount}</p>
              <p className="text-xs text-green-600">Actives</p>
            </div>
          </div>
        </div>

        {/* Allergies */}
        {patient.allergies && patient.allergies.length > 0 && (
          <div className="mt-4 rounded-lg border border-red-200 bg-red-50 p-3">
            <p className="text-xs font-semibold uppercase tracking-wider text-red-700 mb-1">Allergies</p>
            <div className="flex flex-wrap gap-2">
              {patient.allergies.map((allergy, idx) => (
                <span key={idx} className="inline-block rounded-full bg-red-100 px-3 py-1 text-sm font-medium text-red-800">
                  {allergy}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Notes */}
        {patient.notes && (
          <div className="mt-3 rounded-lg bg-amber-50 border border-amber-200 p-3">
            <p className="text-xs font-semibold uppercase tracking-wider text-amber-700 mb-1">Notes</p>
            <p className="text-sm text-amber-900">{patient.notes}</p>
          </div>
        )}

        {/* Meta */}
        <div className="mt-3 flex items-center gap-4 text-xs text-gray-400">
          <span>Cree le {new Date(patient.created_at).toLocaleDateString('fr-FR')}</span>
          <span>Mis a jour le {new Date(patient.updated_at).toLocaleDateString('fr-FR')}</span>
        </div>
      </div>

      {/* Prescription history section */}
      <div className="mt-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900">Historique des ordonnances</h2>
          <div className="flex items-center gap-3">
            <select
              className="rounded border px-3 py-1.5 text-sm"
              value={rxStatusFilter}
              onChange={e => setRxStatusFilter(e.target.value)}
            >
              <option value="">Tous les statuts</option>
              <option value="active">Active</option>
              <option value="dispensed">Dispensee</option>
              <option value="expired">Expiree</option>
              <option value="cancelled">Annulee</option>
            </select>
          </div>
        </div>

        <PrescriptionTimeline
          prescriptions={prescriptions}
          loading={rxLoading}
          canDispense={canEdit}
          onDispensed={loadPrescriptions}
        />
      </div>
    </div>
  )
}
