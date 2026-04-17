import { supabase } from "../lib/supabase.js";

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

export interface DateRangeFilter {
  date_from?: string; // YYYY-MM-DD
  date_to?: string;   // YYYY-MM-DD
}

/* ------------------------------------------------------------------ */
/*  Daily Sales Summary                                                */
/* ------------------------------------------------------------------ */

/**
 * Returns daily sales aggregation: total revenue, sale count, and
 * breakdown by payment method for completed sales within the date range.
 */
export async function getDailySalesSummary(filters: DateRangeFilter) {
  let query = supabase
    .from("sales")
    .select("id, total, subtotal, tax_amount, discount_amount, payment_method, created_at")
    .eq("status", "completed");

  if (filters.date_from) {
    query = query.gte("created_at", filters.date_from);
  }
  if (filters.date_to) {
    query = query.lte("created_at", filters.date_to + "T23:59:59.999Z");
  }

  const { data: sales, error } = await query.order("created_at", { ascending: true });
  if (error) throw error;

  // Group by date (YYYY-MM-DD)
  const dailyMap = new Map<
    string,
    {
      date: string;
      sale_count: number;
      total_revenue: number;
      total_subtotal: number;
      total_tax: number;
      total_discount: number;
      by_payment_method: Record<string, { count: number; total: number }>;
    }
  >();

  for (const sale of sales ?? []) {
    const date = sale.created_at.slice(0, 10);
    let day = dailyMap.get(date);
    if (!day) {
      day = {
        date,
        sale_count: 0,
        total_revenue: 0,
        total_subtotal: 0,
        total_tax: 0,
        total_discount: 0,
        by_payment_method: {},
      };
      dailyMap.set(date, day);
    }

    day.sale_count += 1;
    day.total_revenue += Number(sale.total);
    day.total_subtotal += Number(sale.subtotal);
    day.total_tax += Number(sale.tax_amount);
    day.total_discount += Number(sale.discount_amount);

    const method = sale.payment_method ?? "cash";
    if (!day.by_payment_method[method]) {
      day.by_payment_method[method] = { count: 0, total: 0 };
    }
    day.by_payment_method[method].count += 1;
    day.by_payment_method[method].total += Number(sale.total);
  }

  const days = Array.from(dailyMap.values());

  // Grand totals
  const summary = {
    total_revenue: days.reduce((s, d) => s + d.total_revenue, 0),
    total_subtotal: days.reduce((s, d) => s + d.total_subtotal, 0),
    total_tax: days.reduce((s, d) => s + d.total_tax, 0),
    total_discount: days.reduce((s, d) => s + d.total_discount, 0),
    sale_count: days.reduce((s, d) => s + d.sale_count, 0),
  };

  return { summary, days };
}

/* ------------------------------------------------------------------ */
/*  Product Margins                                                    */
/* ------------------------------------------------------------------ */

/**
 * Returns margin analysis per product: unit_price vs cost_price from
 * actual sale_items, plus total units sold and total margin.
 */
export async function getProductMargins(filters: DateRangeFilter) {
  // Fetch completed sale IDs within date range
  let salesQuery = supabase
    .from("sales")
    .select("id")
    .eq("status", "completed");

  if (filters.date_from) {
    salesQuery = salesQuery.gte("created_at", filters.date_from);
  }
  if (filters.date_to) {
    salesQuery = salesQuery.lte("created_at", filters.date_to + "T23:59:59.999Z");
  }

  const { data: salesData, error: salesErr } = await salesQuery;
  if (salesErr) throw salesErr;

  const saleIds = (salesData ?? []).map((s) => s.id);

  if (saleIds.length === 0) {
    return { products: [] };
  }

  // Fetch sale items with drug info
  const { data: items, error: itemsErr } = await supabase
    .from("sale_items")
    .select("drug_id, quantity, unit_price, cost_price, total, drugs(name, generic_name, barcode)")
    .in("sale_id", saleIds);

  if (itemsErr) throw itemsErr;

  // Aggregate by drug
  const drugMap = new Map<
    string,
    {
      drug_id: string;
      drug_name: string;
      generic_name: string | null;
      barcode: string | null;
      units_sold: number;
      total_revenue: number;
      total_cost: number;
      total_margin: number;
      avg_unit_price: number;
      avg_cost_price: number;
    }
  >();

  for (const item of items ?? []) {
    const drug = item.drugs as any;
    let entry = drugMap.get(item.drug_id);
    if (!entry) {
      entry = {
        drug_id: item.drug_id,
        drug_name: drug?.name ?? "Unknown",
        generic_name: drug?.generic_name ?? null,
        barcode: drug?.barcode ?? null,
        units_sold: 0,
        total_revenue: 0,
        total_cost: 0,
        total_margin: 0,
        avg_unit_price: 0,
        avg_cost_price: 0,
      };
      drugMap.set(item.drug_id, entry);
    }

    const qty = Number(item.quantity);
    const revenue = Number(item.total);
    const cost = Number(item.cost_price) * qty;

    entry.units_sold += qty;
    entry.total_revenue += revenue;
    entry.total_cost += cost;
    entry.total_margin += revenue - cost;
  }

  // Compute averages and margin percentage
  const products = Array.from(drugMap.values()).map((p) => ({
    ...p,
    avg_unit_price: p.units_sold > 0 ? p.total_revenue / p.units_sold : 0,
    avg_cost_price: p.units_sold > 0 ? p.total_cost / p.units_sold : 0,
    margin_percentage:
      p.total_revenue > 0
        ? ((p.total_margin / p.total_revenue) * 100)
        : 0,
  }));

  // Sort by total margin descending
  products.sort((a, b) => b.total_margin - a.total_margin);

  return { products };
}

/* ------------------------------------------------------------------ */
/*  Tax Summary                                                        */
/* ------------------------------------------------------------------ */

/**
 * Returns tax aggregation: total taxable amount, total tax collected,
 * grouped by date for the given range.
 */
export async function getTaxSummary(filters: DateRangeFilter) {
  let query = supabase
    .from("sales")
    .select("id, subtotal, tax_amount, discount_amount, total, created_at")
    .eq("status", "completed");

  if (filters.date_from) {
    query = query.gte("created_at", filters.date_from);
  }
  if (filters.date_to) {
    query = query.lte("created_at", filters.date_to + "T23:59:59.999Z");
  }

  const { data: sales, error } = await query.order("created_at", { ascending: true });
  if (error) throw error;

  // Group by date
  const dailyMap = new Map<
    string,
    {
      date: string;
      sale_count: number;
      taxable_amount: number;
      tax_collected: number;
    }
  >();

  for (const sale of sales ?? []) {
    const date = sale.created_at.slice(0, 10);
    let day = dailyMap.get(date);
    if (!day) {
      day = { date, sale_count: 0, taxable_amount: 0, tax_collected: 0 };
      dailyMap.set(date, day);
    }

    day.sale_count += 1;
    day.taxable_amount += Number(sale.subtotal) - Number(sale.discount_amount);
    day.tax_collected += Number(sale.tax_amount);
  }

  const days = Array.from(dailyMap.values());

  const summary = {
    total_taxable_amount: days.reduce((s, d) => s + d.taxable_amount, 0),
    total_tax_collected: days.reduce((s, d) => s + d.tax_collected, 0),
    sale_count: days.reduce((s, d) => s + d.sale_count, 0),
    effective_tax_rate: 0,
  };

  if (summary.total_taxable_amount > 0) {
    summary.effective_tax_rate =
      (summary.total_tax_collected / summary.total_taxable_amount) * 100;
  }

  return { summary, days };
}
