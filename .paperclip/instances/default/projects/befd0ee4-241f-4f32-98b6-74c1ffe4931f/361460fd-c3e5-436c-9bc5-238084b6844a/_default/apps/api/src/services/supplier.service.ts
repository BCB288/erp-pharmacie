import { supabase } from "../lib/supabase.js";

/* ------------------------------------------------------------------ */
/*  Supplier CRUD                                                      */
/* ------------------------------------------------------------------ */

export interface SupplierFilters {
  search?: string;
  is_active?: boolean;
  page?: number;
  limit?: number;
}

export async function listSuppliers(filters: SupplierFilters) {
  const page = filters.page ?? 1;
  const limit = filters.limit ?? 50;
  const from = (page - 1) * limit;
  const to = from + limit - 1;

  let query = supabase
    .from("suppliers")
    .select("*", { count: "exact" });

  if (filters.search) {
    const term = `%${filters.search}%`;
    query = query.or(`name.ilike.${term},contact_person.ilike.${term},email.ilike.${term}`);
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

export async function getSupplier(id: string) {
  const { data, error } = await supabase
    .from("suppliers")
    .select("*")
    .eq("id", id)
    .single();

  if (error) throw error;
  return data;
}

export interface CreateSupplierPayload {
  name: string;
  contact_person?: string;
  email?: string;
  phone?: string;
  address?: string;
}

export async function createSupplier(payload: CreateSupplierPayload) {
  const { data, error } = await supabase
    .from("suppliers")
    .insert(payload)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function updateSupplier(
  id: string,
  payload: Partial<CreateSupplierPayload> & { is_active?: boolean }
) {
  const { data, error } = await supabase
    .from("suppliers")
    .update({ ...payload, updated_at: new Date().toISOString() })
    .eq("id", id)
    .select()
    .single();

  if (error) throw error;
  return data;
}

/* ------------------------------------------------------------------ */
/*  Purchase Order Number Generation                                   */
/* ------------------------------------------------------------------ */

async function generateOrderNumber(): Promise<string> {
  const today = new Date().toISOString().slice(0, 10).replace(/-/g, "");
  const { count, error } = await supabase
    .from("purchase_orders")
    .select("*", { count: "exact", head: true })
    .gte("created_at", new Date().toISOString().slice(0, 10));

  if (error) throw error;
  const seq = ((count ?? 0) + 1).toString().padStart(4, "0");
  return `PO-${today}-${seq}`;
}

/* ------------------------------------------------------------------ */
/*  Purchase Order CRUD                                                */
/* ------------------------------------------------------------------ */

export interface POItemInput {
  drug_id: string;
  quantity_ordered: number;
  unit_cost: number;
}

export interface CreatePOPayload {
  supplier_id: string;
  ordered_by: string;
  items: POItemInput[];
  notes?: string;
  expected_delivery?: string;
}

export interface POFilters {
  supplier_id?: string;
  status?: string;
  page?: number;
  limit?: number;
}

export async function listPurchaseOrders(filters: POFilters) {
  const page = filters.page ?? 1;
  const limit = filters.limit ?? 50;
  const from = (page - 1) * limit;
  const to = from + limit - 1;

  let query = supabase
    .from("purchase_orders")
    .select("*, suppliers(name), profiles:ordered_by(full_name)", { count: "exact" });

  if (filters.supplier_id) {
    query = query.eq("supplier_id", filters.supplier_id);
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

export async function getPurchaseOrder(id: string) {
  const { data, error } = await supabase
    .from("purchase_orders")
    .select(
      "*, suppliers(name, contact_person, email, phone), profiles:ordered_by(full_name), purchase_order_items(*, drugs(name, generic_name, barcode))"
    )
    .eq("id", id)
    .single();

  if (error) throw error;
  return data;
}

export async function createPurchaseOrder(payload: CreatePOPayload) {
  const { supplier_id, ordered_by, items, notes, expected_delivery } = payload;

  if (!items || items.length === 0) {
    throw new Error("Purchase order must contain at least one item");
  }

  const order_number = await generateOrderNumber();

  const total_amount = items.reduce(
    (sum, i) => sum + i.quantity_ordered * i.unit_cost,
    0
  );

  // Insert PO header
  const { data: po, error: poErr } = await supabase
    .from("purchase_orders")
    .insert({
      order_number,
      supplier_id,
      ordered_by,
      status: "draft",
      total_amount,
      notes: notes ?? null,
      expected_delivery: expected_delivery ?? null,
    })
    .select()
    .single();

  if (poErr) throw poErr;

  // Insert PO items
  const poItems = items.map((i) => ({
    purchase_order_id: po.id,
    drug_id: i.drug_id,
    quantity_ordered: i.quantity_ordered,
    quantity_received: 0,
    unit_cost: i.unit_cost,
    total: i.quantity_ordered * i.unit_cost,
  }));

  const { error: itemsErr } = await supabase
    .from("purchase_order_items")
    .insert(poItems);

  if (itemsErr) throw itemsErr;

  return getPurchaseOrder(po.id);
}

/* ------------------------------------------------------------------ */
/*  PO Status Transitions: draft -> sent -> partial -> received        */
/* ------------------------------------------------------------------ */

export async function sendPurchaseOrder(id: string) {
  const { data: po, error: fetchErr } = await supabase
    .from("purchase_orders")
    .select("status")
    .eq("id", id)
    .single();

  if (fetchErr) throw fetchErr;
  if (po.status !== "draft") {
    throw new Error(`Cannot send PO in status "${po.status}". Must be "draft".`);
  }

  const { data, error } = await supabase
    .from("purchase_orders")
    .update({ status: "sent", updated_at: new Date().toISOString() })
    .eq("id", id)
    .select()
    .single();

  if (error) throw error;
  return data;
}

/* ------------------------------------------------------------------ */
/*  Receive Stock against a PO                                         */
/* ------------------------------------------------------------------ */

export interface ReceiveItemInput {
  purchase_order_item_id: string;
  quantity_received: number;
  batch_number: string;
  expiry_date: string;
}

export async function receivePurchaseOrder(
  id: string,
  receivedItems: ReceiveItemInput[]
) {
  if (!receivedItems || receivedItems.length === 0) {
    throw new Error("Must provide at least one item to receive");
  }

  // Fetch PO with items
  const { data: po, error: poErr } = await supabase
    .from("purchase_orders")
    .select("*, purchase_order_items(*)")
    .eq("id", id)
    .single();

  if (poErr) throw poErr;

  if (po.status !== "sent" && po.status !== "partial") {
    throw new Error(
      `Cannot receive against PO in status "${po.status}". Must be "sent" or "partial".`
    );
  }

  const poItemMap = new Map(
    po.purchase_order_items.map((i: any) => [i.id, i])
  );

  // Process each received item
  for (const ri of receivedItems) {
    const poItem = poItemMap.get(ri.purchase_order_item_id) as any;
    if (!poItem) {
      throw new Error(
        `PO item not found: ${ri.purchase_order_item_id}`
      );
    }

    const maxReceivable =
      poItem.quantity_ordered - poItem.quantity_received;
    if (ri.quantity_received > maxReceivable) {
      throw new Error(
        `Cannot receive ${ri.quantity_received} for item ${ri.purchase_order_item_id}. Max receivable: ${maxReceivable}`
      );
    }

    // Update quantity_received on PO item
    const { error: updItemErr } = await supabase
      .from("purchase_order_items")
      .update({
        quantity_received: poItem.quantity_received + ri.quantity_received,
      })
      .eq("id", ri.purchase_order_item_id);

    if (updItemErr) throw updItemErr;

    // Create stock_batch entry
    const { error: batchErr } = await supabase
      .from("stock_batches")
      .insert({
        drug_id: poItem.drug_id,
        batch_number: ri.batch_number,
        quantity: ri.quantity_received,
        expiry_date: ri.expiry_date,
        supplier_id: po.supplier_id,
        purchase_order_id: po.id,
      });

    if (batchErr) throw batchErr;
  }

  // Determine new PO status: check if all items fully received
  const { data: updatedItems, error: refetchErr } = await supabase
    .from("purchase_order_items")
    .select("quantity_ordered, quantity_received")
    .eq("purchase_order_id", id);

  if (refetchErr) throw refetchErr;

  const allReceived = (updatedItems ?? []).every(
    (i) => i.quantity_received >= i.quantity_ordered
  );

  const newStatus = allReceived ? "received" : "partial";

  const { error: statusErr } = await supabase
    .from("purchase_orders")
    .update({ status: newStatus, updated_at: new Date().toISOString() })
    .eq("id", id);

  if (statusErr) throw statusErr;

  return getPurchaseOrder(id);
}
