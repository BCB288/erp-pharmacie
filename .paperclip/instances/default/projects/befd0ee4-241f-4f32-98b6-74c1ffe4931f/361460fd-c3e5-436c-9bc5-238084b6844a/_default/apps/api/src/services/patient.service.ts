import { supabase } from "../lib/supabase.js";

/* ------------------------------------------------------------------ */
/*  Patient CRUD                                                       */
/* ------------------------------------------------------------------ */

export interface PatientFilters {
  search?: string;
  page?: number;
  limit?: number;
}

export async function listPatients(filters: PatientFilters) {
  const page = filters.page ?? 1;
  const limit = filters.limit ?? 50;
  const from = (page - 1) * limit;
  const to = from + limit - 1;

  let query = supabase
    .from("patients")
    .select("*", { count: "exact" });

  if (filters.search) {
    const term = `%${filters.search}%`;
    query = query.or(
      `first_name.ilike.${term},last_name.ilike.${term},phone.ilike.${term},email.ilike.${term}`
    );
  }

  const { data, error, count } = await query
    .order("last_name")
    .order("first_name")
    .range(from, to);

  if (error) throw error;
  return { data, total: count ?? 0, page, limit };
}

export async function getPatient(id: string) {
  const { data, error } = await supabase
    .from("patients")
    .select("*")
    .eq("id", id)
    .single();

  if (error) throw error;
  return data;
}

export interface CreatePatientPayload {
  first_name: string;
  last_name: string;
  date_of_birth?: string;
  phone?: string;
  email?: string;
  address?: string;
  allergies?: string[];
  notes?: string;
}

export async function createPatient(payload: CreatePatientPayload) {
  const { data, error } = await supabase
    .from("patients")
    .insert(payload)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function updatePatient(
  id: string,
  payload: Partial<CreatePatientPayload>
) {
  const { data, error } = await supabase
    .from("patients")
    .update({ ...payload, updated_at: new Date().toISOString() })
    .eq("id", id)
    .select()
    .single();

  if (error) throw error;
  return data;
}

/* ------------------------------------------------------------------ */
/*  Prescription Number Generation                                     */
/* ------------------------------------------------------------------ */

async function generatePrescriptionNumber(): Promise<string> {
  const today = new Date().toISOString().slice(0, 10).replace(/-/g, "");
  const { count, error } = await supabase
    .from("prescriptions")
    .select("*", { count: "exact", head: true })
    .gte("created_at", new Date().toISOString().slice(0, 10));

  if (error) throw error;
  const seq = ((count ?? 0) + 1).toString().padStart(4, "0");
  return `RX-${today}-${seq}`;
}

/* ------------------------------------------------------------------ */
/*  Prescription CRUD                                                  */
/* ------------------------------------------------------------------ */

export interface PrescriptionFilters {
  patient_id?: string;
  status?: string;
  page?: number;
  limit?: number;
}

export async function listPrescriptions(filters: PrescriptionFilters) {
  const page = filters.page ?? 1;
  const limit = filters.limit ?? 50;
  const from = (page - 1) * limit;
  const to = from + limit - 1;

  let query = supabase
    .from("prescriptions")
    .select("*, patients(first_name, last_name)", { count: "exact" });

  if (filters.patient_id) {
    query = query.eq("patient_id", filters.patient_id);
  }
  if (filters.status) {
    query = query.eq("status", filters.status);
  }

  const { data, error, count } = await query
    .order("created_at", { ascending: false })
    .range(from, to);

  if (error) throw error;
  return { data, total: count ?? 0, page, limit };
}

export async function getPrescription(id: string) {
  const { data, error } = await supabase
    .from("prescriptions")
    .select(
      "*, patients(first_name, last_name, allergies), profiles:dispensed_by(full_name)"
    )
    .eq("id", id)
    .single();

  if (error) throw error;
  return data;
}

export interface PrescriptionItemInput {
  drug_name: string;
  dosage: string;
  quantity: number;
  instructions?: string;
}

export interface CreatePrescriptionPayload {
  patient_id: string;
  prescriber_name: string;
  prescriber_license?: string;
  items: PrescriptionItemInput[];
  prescribed_date: string;
  expiry_date?: string;
}

export async function createPrescription(payload: CreatePrescriptionPayload) {
  const {
    patient_id,
    prescriber_name,
    prescriber_license,
    items,
    prescribed_date,
    expiry_date,
  } = payload;

  if (!items || items.length === 0) {
    throw new Error("Prescription must contain at least one item");
  }

  const prescription_number = await generatePrescriptionNumber();

  const { data, error } = await supabase
    .from("prescriptions")
    .insert({
      patient_id,
      prescription_number,
      prescriber_name,
      prescriber_license: prescriber_license ?? null,
      items: JSON.stringify(items),
      status: "active",
      prescribed_date,
      expiry_date: expiry_date ?? null,
    })
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function dispensePrescription(
  id: string,
  dispensedBy: string,
  saleId?: string
) {
  const { data: rx, error: fetchErr } = await supabase
    .from("prescriptions")
    .select("status")
    .eq("id", id)
    .single();

  if (fetchErr) throw fetchErr;
  if (rx.status !== "active") {
    throw new Error(
      `Cannot dispense prescription in status "${rx.status}". Must be "active".`
    );
  }

  const updatePayload: Record<string, unknown> = {
    status: "dispensed",
    dispensed_by: dispensedBy,
    dispensed_at: new Date().toISOString(),
  };
  if (saleId) {
    updatePayload.sale_id = saleId;
  }

  const { data, error } = await supabase
    .from("prescriptions")
    .update(updatePayload)
    .eq("id", id)
    .select()
    .single();

  if (error) throw error;
  return data;
}
