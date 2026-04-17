import { supabase } from "../lib/supabase.js";

/* ------------------------------------------------------------------ */
/*  Drug CRUD                                                         */
/* ------------------------------------------------------------------ */

export interface DrugFilters {
  search?: string;
  category_id?: string;
  is_active?: boolean;
  page?: number;
  limit?: number;
}

export async function listDrugs(filters: DrugFilters) {
  const page = filters.page ?? 1;
  const limit = filters.limit ?? 50;
  const from = (page - 1) * limit;
  const to = from + limit - 1;

  let query = supabase
    .from("drugs")
    .select("*, categories(name)", { count: "exact" });

  if (filters.search) {
    const term = `%${filters.search}%`;
    query = query.or(`name.ilike.${term},generic_name.ilike.${term},barcode.eq.${filters.search}`);
  }
  if (filters.category_id) {
    query = query.eq("category_id", filters.category_id);
  }
  if (filters.is_active !== undefined) {
    query = query.eq("is_active", filters.is_active);
  }

  const { data, error, count } = await query
    .order("name")
    .range(from, to);

  if (error) throw error;
  return { data, total: count ?? 0, page, limit };
}

export async function getDrug(id: string) {
  const { data, error } = await supabase
    .from("drugs")
    .select("*, categories(name)")
    .eq("id", id)
    .single();

  if (error) throw error;
  return data;
}

export interface CreateDrugPayload {
  name: string;
  generic_name?: string;
  category_id?: string;
  dosage_form?: string;
  strength?: string;
  barcode?: string;
  unit_price: number;
  cost_price: number;
  reorder_level?: number;
  requires_prescription?: boolean;
}

export async function createDrug(payload: CreateDrugPayload) {
  const { data, error } = await supabase
    .from("drugs")
    .insert(payload)
    .select("*, categories(name)")
    .single();

  if (error) throw error;
  return data;
}

export async function updateDrug(id: string, payload: Partial<CreateDrugPayload> & { is_active?: boolean }) {
  const { data, error } = await supabase
    .from("drugs")
    .update({ ...payload, updated_at: new Date().toISOString() })
    .eq("id", id)
    .select("*, categories(name)")
    .single();

  if (error) throw error;
  return data;
}

/* ------------------------------------------------------------------ */
/*  Stock Batches                                                     */
/* ------------------------------------------------------------------ */

export interface StockFilters {
  drug_id?: string;
  include_expired?: boolean;
  include_empty?: boolean;
  page?: number;
  limit?: number;
}

export async function listStock(filters: StockFilters) {
  const page = filters.page ?? 1;
  const limit = filters.limit ?? 50;
  const from = (page - 1) * limit;
  const to = from + limit - 1;

  let query = supabase
    .from("stock_batches")
    .select("*, drugs(name, generic_name, barcode)", { count: "exact" });

  if (filters.drug_id) {
    query = query.eq("drug_id", filters.drug_id);
  }
  if (!filters.include_expired) {
    query = query.gte("expiry_date", new Date().toISOString().slice(0, 10));
  }
  if (!filters.include_empty) {
    query = query.gt("quantity", 0);
  }

  const { data, error, count } = await query
    .order("expiry_date", { ascending: true })
    .range(from, to);

  if (error) throw error;
  return { data, total: count ?? 0, page, limit };
}

export interface CreateBatchPayload {
  drug_id: string;
  batch_number: string;
  quantity: number;
  expiry_date: string;
  supplier_id?: string;
  purchase_order_id?: string;
}

export async function createStockBatch(payload: CreateBatchPayload) {
  const { data, error } = await supabase
    .from("stock_batches")
    .insert(payload)
    .select("*, drugs(name)")
    .single();

  if (error) throw error;
  return data;
}

export async function updateStockBatch(id: string, payload: { quantity?: number; expiry_date?: string }) {
  const { data, error } = await supabase
    .from("stock_batches")
    .update(payload)
    .eq("id", id)
    .select("*, drugs(name)")
    .single();

  if (error) throw error;
  return data;
}

/* ------------------------------------------------------------------ */
/*  Alerts                                                            */
/* ------------------------------------------------------------------ */

export async function getLowStockAlerts() {
  // Aggregate total quantity per drug, compare against reorder_level
  const { data, error } = await supabase.rpc("get_low_stock_drugs");

  // Fallback: if the RPC doesn't exist, use a manual query
  if (error) {
    const { data: drugs, error: drugsErr } = await supabase
      .from("drugs")
      .select("id, name, generic_name, reorder_level, is_active")
      .eq("is_active", true);

    if (drugsErr) throw drugsErr;

    const { data: batches, error: batchErr } = await supabase
      .from("stock_batches")
      .select("drug_id, quantity")
      .gte("expiry_date", new Date().toISOString().slice(0, 10))
      .gt("quantity", 0);

    if (batchErr) throw batchErr;

    // Sum quantities per drug
    const stockMap = new Map<string, number>();
    for (const b of batches ?? []) {
      stockMap.set(b.drug_id, (stockMap.get(b.drug_id) ?? 0) + b.quantity);
    }

    return (drugs ?? [])
      .map((d) => ({
        ...d,
        total_stock: stockMap.get(d.id) ?? 0,
      }))
      .filter((d) => d.total_stock < d.reorder_level);
  }

  return data;
}

export async function getExpiryAlerts(withinDays: number = 90) {
  const today = new Date();
  const cutoff = new Date(today);
  cutoff.setDate(cutoff.getDate() + withinDays);

  const { data, error } = await supabase
    .from("stock_batches")
    .select("*, drugs(name, generic_name)")
    .gt("quantity", 0)
    .lte("expiry_date", cutoff.toISOString().slice(0, 10))
    .order("expiry_date", { ascending: true });

  if (error) throw error;

  const todayStr = today.toISOString().slice(0, 10);
  return (data ?? []).map((batch) => ({
    ...batch,
    is_expired: batch.expiry_date < todayStr,
    days_until_expiry: Math.ceil(
      (new Date(batch.expiry_date).getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
    ),
  }));
}

/* ------------------------------------------------------------------ */
/*  Categories (helper)                                               */
/* ------------------------------------------------------------------ */

export async function listCategories() {
  const { data, error } = await supabase
    .from("categories")
    .select("*")
    .order("name");

  if (error) throw error;
  return data;
}
