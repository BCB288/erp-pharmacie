import { supabase } from "../lib/supabase.js";

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

export interface SaleItemInput {
  drug_id: string;
  quantity: number;
  discount?: number;
}

export interface CreateSalePayload {
  cashier_id: string;
  patient_id?: string;
  prescription_number?: string;
  items: SaleItemInput[];
  payment_method?: string;
  tax_rate?: number;
  notes?: string;
}

export interface SaleFilters {
  cashier_id?: string;
  status?: string;
  date_from?: string;
  date_to?: string;
  page?: number;
  limit?: number;
}

/* ------------------------------------------------------------------ */
/*  Sale Number Generation                                             */
/* ------------------------------------------------------------------ */

async function generateSaleNumber(): Promise<string> {
  const today = new Date().toISOString().slice(0, 10).replace(/-/g, "");
  const { count, error } = await supabase
    .from("sales")
    .select("*", { count: "exact", head: true })
    .gte("created_at", new Date().toISOString().slice(0, 10));

  if (error) throw error;
  const seq = ((count ?? 0) + 1).toString().padStart(4, "0");
  return `VNT-${today}-${seq}`;
}

/* ------------------------------------------------------------------ */
/*  FIFO Stock Deduction                                               */
/* ------------------------------------------------------------------ */

interface BatchDeduction {
  batch_id: string;
  quantity: number;
  cost_price: number;
}

/**
 * Picks batches for a drug using FIFO by expiry date (nearest expiry first).
 * Returns the list of batch deductions needed to fulfill the requested quantity.
 * Throws if insufficient stock.
 */
async function pickBatchesFIFO(
  drug_id: string,
  quantity: number
): Promise<BatchDeduction[]> {
  const today = new Date().toISOString().slice(0, 10);

  const { data: batches, error } = await supabase
    .from("stock_batches")
    .select("id, quantity, expiry_date")
    .eq("drug_id", drug_id)
    .gt("quantity", 0)
    .gte("expiry_date", today)
    .order("expiry_date", { ascending: true });

  if (error) throw error;

  const deductions: BatchDeduction[] = [];
  let remaining = quantity;

  // Fetch drug cost_price for recording on sale items
  const { data: drug, error: drugErr } = await supabase
    .from("drugs")
    .select("cost_price")
    .eq("id", drug_id)
    .single();

  if (drugErr) throw drugErr;

  for (const batch of batches ?? []) {
    if (remaining <= 0) break;

    const take = Math.min(remaining, batch.quantity);
    deductions.push({
      batch_id: batch.id,
      quantity: take,
      cost_price: drug.cost_price,
    });
    remaining -= take;
  }

  if (remaining > 0) {
    throw new Error(
      `Insufficient stock for drug ${drug_id}. Short by ${remaining} units.`
    );
  }

  return deductions;
}

/* ------------------------------------------------------------------ */
/*  Create Sale                                                        */
/* ------------------------------------------------------------------ */

export async function createSale(payload: CreateSalePayload) {
  const { cashier_id, patient_id, prescription_number, items, payment_method, tax_rate, notes } = payload;

  if (!items || items.length === 0) {
    throw new Error("Sale must contain at least one item");
  }

  // 1. Fetch unit prices for all drugs in the sale
  const drugIds = [...new Set(items.map((i) => i.drug_id))];
  const { data: drugs, error: drugsErr } = await supabase
    .from("drugs")
    .select("id, unit_price, cost_price, name")
    .in("id", drugIds);

  if (drugsErr) throw drugsErr;

  const drugMap = new Map(drugs!.map((d) => [d.id, d]));

  // Validate all drugs exist
  for (const item of items) {
    if (!drugMap.has(item.drug_id)) {
      throw new Error(`Drug not found: ${item.drug_id}`);
    }
  }

  // 2. Pick batches FIFO for each item and build sale_items
  const saleItems: Array<{
    drug_id: string;
    batch_id: string;
    quantity: number;
    unit_price: number;
    cost_price: number;
    discount: number;
    total: number;
  }> = [];

  const batchUpdates: Array<{ id: string; newQuantity: number }> = [];

  for (const item of items) {
    const deductions = await pickBatchesFIFO(item.drug_id, item.quantity);
    const drug = drugMap.get(item.drug_id)!;
    const itemDiscount = item.discount ?? 0;

    for (const ded of deductions) {
      const lineTotal = ded.quantity * drug.unit_price - itemDiscount;
      saleItems.push({
        drug_id: item.drug_id,
        batch_id: ded.batch_id,
        quantity: ded.quantity,
        unit_price: drug.unit_price,
        cost_price: ded.cost_price,
        discount: itemDiscount,
        total: lineTotal > 0 ? lineTotal : 0,
      });

      // Track batch quantity updates
      batchUpdates.push({ id: ded.batch_id, newQuantity: -ded.quantity });
    }
  }

  // 3. Calculate totals
  const subtotal = saleItems.reduce((sum, si) => sum + si.quantity * si.unit_price, 0);
  const discountAmount = saleItems.reduce((sum, si) => sum + si.discount, 0);
  const effectiveTaxRate = tax_rate ?? 0;
  const taxAmount = (subtotal - discountAmount) * effectiveTaxRate;
  const total = subtotal - discountAmount + taxAmount;

  // 4. Generate sale number
  const sale_number = await generateSaleNumber();

  // 5. Insert sale
  const { data: sale, error: saleErr } = await supabase
    .from("sales")
    .insert({
      sale_number,
      cashier_id,
      patient_id: patient_id ?? null,
      prescription_number: prescription_number ?? null,
      subtotal,
      tax_amount: taxAmount,
      discount_amount: discountAmount,
      total,
      payment_method: payment_method ?? "cash",
      status: "completed",
      notes: notes ?? null,
    })
    .select()
    .single();

  if (saleErr) throw saleErr;

  // 6. Insert sale items
  const saleItemRows = saleItems.map((si) => ({
    sale_id: sale.id,
    ...si,
  }));

  const { error: itemsErr } = await supabase
    .from("sale_items")
    .insert(saleItemRows);

  if (itemsErr) throw itemsErr;

  // 7. Deduct stock from batches
  for (const upd of batchUpdates) {
    // We need current quantity to compute new value
    const { data: batch, error: batchErr } = await supabase
      .from("stock_batches")
      .select("quantity")
      .eq("id", upd.id)
      .single();

    if (batchErr) throw batchErr;

    const { error: updErr } = await supabase
      .from("stock_batches")
      .update({ quantity: batch.quantity + upd.newQuantity })
      .eq("id", upd.id);

    if (updErr) throw updErr;
  }

  // 8. Return the full sale with items
  return getSale(sale.id);
}

/* ------------------------------------------------------------------ */
/*  Get Sale                                                           */
/* ------------------------------------------------------------------ */

export async function getSale(id: string) {
  const { data, error } = await supabase
    .from("sales")
    .select(
      "*, sale_items(*, drugs(name, generic_name, barcode)), profiles:cashier_id(full_name), patients:patient_id(first_name, last_name)"
    )
    .eq("id", id)
    .single();

  if (error) throw error;
  return data;
}

/* ------------------------------------------------------------------ */
/*  List Sales                                                         */
/* ------------------------------------------------------------------ */

export async function listSales(filters: SaleFilters) {
  const page = filters.page ?? 1;
  const limit = filters.limit ?? 50;
  const from = (page - 1) * limit;
  const to = from + limit - 1;

  let query = supabase
    .from("sales")
    .select(
      "*, profiles:cashier_id(full_name)",
      { count: "exact" }
    );

  if (filters.cashier_id) {
    query = query.eq("cashier_id", filters.cashier_id);
  }
  if (filters.status) {
    query = query.eq("status", filters.status);
  }
  if (filters.date_from) {
    query = query.gte("created_at", filters.date_from);
  }
  if (filters.date_to) {
    query = query.lte("created_at", filters.date_to + "T23:59:59.999Z");
  }

  const { data, error, count } = await query
    .order("created_at", { ascending: false })
    .range(from, to);

  if (error) throw error;
  return { data, total: count ?? 0, page, limit };
}

/* ------------------------------------------------------------------ */
/*  Void Sale (Admin Only) — restores stock                            */
/* ------------------------------------------------------------------ */

export async function voidSale(id: string) {
  // 1. Get the sale and its items
  const { data: sale, error: saleErr } = await supabase
    .from("sales")
    .select("*, sale_items(*)")
    .eq("id", id)
    .single();

  if (saleErr) throw saleErr;

  if (sale.status === "voided") {
    throw new Error("Sale is already voided");
  }

  // 2. Restore stock for each sale item
  for (const item of sale.sale_items) {
    const { data: batch, error: batchErr } = await supabase
      .from("stock_batches")
      .select("quantity")
      .eq("id", item.batch_id)
      .single();

    if (batchErr) throw batchErr;

    const { error: updErr } = await supabase
      .from("stock_batches")
      .update({ quantity: batch.quantity + item.quantity })
      .eq("id", item.batch_id);

    if (updErr) throw updErr;
  }

  // 3. Mark the sale as voided
  const { data: updated, error: updSaleErr } = await supabase
    .from("sales")
    .update({ status: "voided" })
    .eq("id", id)
    .select()
    .single();

  if (updSaleErr) throw updSaleErr;

  return updated;
}
