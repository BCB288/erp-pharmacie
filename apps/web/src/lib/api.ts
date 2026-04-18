import { supabase } from './supabase'

/**
 * Drop-in replacement for the Express API fetch layer.
 * Routes each path/method to a direct Supabase client call so the app
 * can be deployed as a static site without a backend server.
 */
export async function apiFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const [pathname, qs] = path.split('?')
  const segments = pathname.split('/').filter(Boolean) // ['api', ...]
  const params = Object.fromEntries(new URLSearchParams(qs ?? ''))
  const method = init?.method ?? 'GET'
  const body = init?.body ? JSON.parse(init.body as string) : undefined

  const section = segments[1] // 'inventory' | 'pos' | 'reports' | 'auth'
  const resource = segments[2] // 'drugs' | 'sales' | ...
  const id = segments[3]

  if (section === 'inventory') {
    if (resource === 'drugs' && method === 'GET' && !id) return listDrugs(params) as T
    if (resource === 'drugs' && method === 'GET' && id) return getDrug(id) as T
    if (resource === 'drugs' && method === 'POST') return createDrug(body) as T
    if (resource === 'drugs' && method === 'PATCH' && id) return updateDrug(id, body) as T
    if (resource === 'categories') return listCategories() as T
    if (resource === 'alerts') return getAlerts() as T
    if (resource === 'stock' && method === 'GET') return listStock(params) as T
    if (resource === 'stock' && method === 'POST') return createStockBatch(body) as T
  }

  if (section === 'pos') {
    if (resource === 'sales' && method === 'GET' && !id) return listSales(params) as T
    if (resource === 'sales' && method === 'GET' && id) return getSale(id) as T
    if (resource === 'sales' && method === 'POST') return createSale(body) as T
  }

  if (section === 'reports') {
    if (resource === 'daily-sales') return getDailySales(params) as T
    if (resource === 'margins') return getMargins(params) as T
    if (resource === 'tax-summary') return getTaxSummary(params) as T
  }

  if (section === 'suppliers') {
    // /api/suppliers/orders/list
    if (resource === 'orders' && id === 'list' && method === 'GET') return listPurchaseOrders(params) as T
    // /api/suppliers/orders/:id/send
    if (resource === 'orders' && segments[4] === 'send' && method === 'POST') return sendPO(id!) as T
    // /api/suppliers/orders/:id/receive
    if (resource === 'orders' && segments[4] === 'receive' && method === 'POST') return receivePO(id!, body) as T
    // /api/suppliers/orders/:id (GET detail)
    if (resource === 'orders' && id && method === 'GET') return getPurchaseOrder(id) as T
    // /api/suppliers/orders (POST create)
    if (resource === 'orders' && method === 'POST') return createPurchaseOrder(body) as T
    // /api/suppliers (CRUD)
    if (method === 'GET' && !resource) return { data: await listSuppliers() } as T
    if (method === 'GET' && resource) return getSupplier(resource) as T
    if (method === 'POST' && !resource) return createSupplier(body) as T
    if (method === 'PATCH' && resource) return updateSupplier(resource, body) as T
  }

  if (section === 'patients') {
    if (resource === 'prescriptions' && method === 'GET') return listPrescriptions(params) as T
    if (method === 'GET' && !resource) return listPatients(params) as T
    if (method === 'GET' && resource) return getPatient(resource) as T
    if (method === 'POST' && !resource) return createPatient(body) as T
    if (method === 'PATCH' && resource) return updatePatient(resource, body) as T
  }

  throw new Error(`API route not implemented: ${method} ${path}`)
}

/* ------------------------------------------------------------------ */
/*  Inventory                                                          */
/* ------------------------------------------------------------------ */

async function listDrugs(params: Record<string, string>) {
  const page = parseInt(params.page ?? '1')
  const limit = parseInt(params.limit ?? '50')
  const from = (page - 1) * limit
  const to = from + limit - 1

  let query = supabase
    .from('drugs')
    .select('*, categories(name)', { count: 'exact' })

  if (params.search) {
    const term = `%${params.search}%`
    query = query.or(`name.ilike.${term},generic_name.ilike.${term},barcode.eq.${params.search}`)
  }
  if (params.category_id) query = query.eq('category_id', params.category_id)
  if (params.is_active !== undefined) query = query.eq('is_active', params.is_active === 'true')

  const { data, error, count } = await query.order('name').range(from, to)
  if (error) throw new Error(error.message)
  return { data: data ?? [], total: count ?? 0, page, limit }
}

async function getDrug(id: string) {
  const { data, error } = await supabase
    .from('drugs')
    .select('*, categories(name)')
    .eq('id', id)
    .single()
  if (error) throw new Error(error.message)
  return data
}

async function createDrug(body: any) {
  const { data, error } = await supabase
    .from('drugs')
    .insert(body)
    .select('*, categories(name)')
    .single()
  if (error) throw new Error(error.message)
  return data
}

async function updateDrug(id: string, body: any) {
  const { data, error } = await supabase
    .from('drugs')
    .update({ ...body, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select('*, categories(name)')
    .single()
  if (error) throw new Error(error.message)
  return data
}

async function listCategories() {
  const { data, error } = await supabase.from('categories').select('*').order('name')
  if (error) throw new Error(error.message)
  return data ?? []
}

async function listStock(params: Record<string, string>) {
  const page = parseInt(params.page ?? '1')
  const limit = parseInt(params.limit ?? '50')
  const from = (page - 1) * limit
  const to = from + limit - 1

  let query = supabase
    .from('stock_batches')
    .select('*, drugs(name, generic_name, barcode)', { count: 'exact' })

  if (params.drug_id) query = query.eq('drug_id', params.drug_id)
  if (params.include_expired !== 'true') {
    query = query.gte('expiry_date', new Date().toISOString().slice(0, 10))
  }
  if (params.include_empty !== 'true') query = query.gt('quantity', 0)

  const { data, error, count } = await query.order('expiry_date', { ascending: true }).range(from, to)
  if (error) throw new Error(error.message)
  return { data: data ?? [], total: count ?? 0, page, limit }
}

async function createStockBatch(body: any) {
  const { data, error } = await supabase
    .from('stock_batches')
    .insert(body)
    .select('*, drugs(name)')
    .single()
  if (error) throw new Error(error.message)
  return data
}

async function getAlerts() {
  const today = new Date().toISOString().slice(0, 10)
  const cutoff90 = new Date()
  cutoff90.setDate(cutoff90.getDate() + 90)
  const cutoffStr = cutoff90.toISOString().slice(0, 10)

  // Low stock: aggregate batches per drug, compare to reorder_level
  const { data: drugs } = await supabase
    .from('drugs')
    .select('id, name, generic_name, reorder_level, is_active')
    .eq('is_active', true)

  const { data: batches } = await supabase
    .from('stock_batches')
    .select('drug_id, quantity')
    .gte('expiry_date', today)
    .gt('quantity', 0)

  const stockMap = new Map<string, number>()
  for (const b of batches ?? []) {
    stockMap.set(b.drug_id, (stockMap.get(b.drug_id) ?? 0) + b.quantity)
  }

  const low_stock = (drugs ?? [])
    .map((d) => ({ ...d, total_stock: stockMap.get(d.id) ?? 0 }))
    .filter((d) => d.total_stock < d.reorder_level)

  // Expiry alerts
  const { data: expiringBatches } = await supabase
    .from('stock_batches')
    .select('*, drugs(name, generic_name)')
    .gt('quantity', 0)
    .lte('expiry_date', cutoffStr)
    .order('expiry_date', { ascending: true })

  const expiring = (expiringBatches ?? [])
    .filter((b) => b.expiry_date >= today)
    .map((b) => ({
      ...b,
      is_expired: false,
      days_until_expiry: Math.ceil(
        (new Date(b.expiry_date).getTime() - new Date().getTime()) / (86400000)
      ),
    }))

  const expired = (expiringBatches ?? [])
    .filter((b) => b.expiry_date < today)
    .map((b) => ({
      ...b,
      is_expired: true,
      days_until_expiry: Math.ceil(
        (new Date(b.expiry_date).getTime() - new Date().getTime()) / (86400000)
      ),
    }))

  return { low_stock, expiring, expired }
}

/* ------------------------------------------------------------------ */
/*  POS                                                                */
/* ------------------------------------------------------------------ */

async function listSales(params: Record<string, string>) {
  const page = parseInt(params.page ?? '1')
  const limit = parseInt(params.limit ?? '50')
  const from = (page - 1) * limit
  const to = from + limit - 1

  let query = supabase
    .from('sales')
    .select('*, profiles:cashier_id(full_name)', { count: 'exact' })

  if (params.cashier_id) query = query.eq('cashier_id', params.cashier_id)
  if (params.status) query = query.eq('status', params.status)
  if (params.date_from) query = query.gte('created_at', params.date_from)
  if (params.date_to) query = query.lte('created_at', params.date_to + 'T23:59:59.999Z')

  const { data, error, count } = await query
    .order('created_at', { ascending: false })
    .range(from, to)

  if (error) throw new Error(error.message)
  return { data: data ?? [], total: count ?? 0, page, limit }
}

async function getSale(id: string) {
  const { data, error } = await supabase
    .from('sales')
    .select('*, sale_items(*, drugs(name, generic_name, barcode)), profiles:cashier_id(full_name), patients:patient_id(first_name, last_name)')
    .eq('id', id)
    .single()
  if (error) throw new Error(error.message)
  return data
}

async function createSale(body: any) {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  const { items, payment_method, notes } = body
  if (!items?.length) throw new Error('Sale must contain at least one item')

  // Fetch drug prices
  const drugIds = [...new Set(items.map((i: any) => i.drug_id))]
  const { data: drugs, error: drugsErr } = await supabase
    .from('drugs')
    .select('id, unit_price, cost_price, name')
    .in('id', drugIds)
  if (drugsErr) throw new Error(drugsErr.message)

  const drugMap = new Map((drugs ?? []).map((d) => [d.id, d]))
  const today = new Date().toISOString().slice(0, 10)

  // FIFO batch picks + build sale items
  const saleItems: any[] = []
  const batchUpdates: { id: string; newQty: number }[] = []

  for (const item of items) {
    const drug = drugMap.get(item.drug_id)
    if (!drug) throw new Error(`Drug not found: ${item.drug_id}`)

    const { data: batches } = await supabase
      .from('stock_batches')
      .select('id, quantity')
      .eq('drug_id', item.drug_id)
      .gt('quantity', 0)
      .gte('expiry_date', today)
      .order('expiry_date', { ascending: true })

    let remaining = item.quantity
    for (const batch of batches ?? []) {
      if (remaining <= 0) break
      const take = Math.min(remaining, batch.quantity)
      saleItems.push({
        drug_id: item.drug_id,
        batch_id: batch.id,
        quantity: take,
        unit_price: drug.unit_price,
        cost_price: drug.cost_price,
        discount: item.discount ?? 0,
        total: Math.max(take * drug.unit_price - (item.discount ?? 0), 0),
      })
      batchUpdates.push({ id: batch.id, newQty: batch.quantity - take })
      remaining -= take
    }
    if (remaining > 0) throw new Error(`Insufficient stock for ${drug.name}. Short by ${remaining} units.`)
  }

  const subtotal = saleItems.reduce((s, i) => s + i.quantity * i.unit_price, 0)
  const discountAmount = saleItems.reduce((s, i) => s + i.discount, 0)
  const total = Math.max(subtotal - discountAmount, 0)

  // Generate sale number
  const todayCompact = today.replace(/-/g, '')
  const { count } = await supabase
    .from('sales')
    .select('*', { count: 'exact', head: true })
    .gte('created_at', today)
  const seq = ((count ?? 0) + 1).toString().padStart(4, '0')
  const sale_number = `VNT-${todayCompact}-${seq}`

  // Insert sale
  const { data: sale, error: saleErr } = await supabase
    .from('sales')
    .insert({
      sale_number,
      cashier_id: user.id,
      subtotal,
      tax_amount: 0,
      discount_amount: discountAmount,
      total,
      payment_method: payment_method ?? 'cash',
      status: 'completed',
      notes: notes ?? null,
    })
    .select()
    .single()
  if (saleErr) throw new Error(saleErr.message)

  // Insert sale items
  const { error: itemsErr } = await supabase
    .from('sale_items')
    .insert(saleItems.map((si) => ({ sale_id: sale.id, ...si })))
  if (itemsErr) throw new Error(itemsErr.message)

  // Deduct stock
  for (const upd of batchUpdates) {
    await supabase.from('stock_batches').update({ quantity: upd.newQty }).eq('id', upd.id)
  }

  return getSale(sale.id)
}

/* ------------------------------------------------------------------ */
/*  Reports                                                            */
/* ------------------------------------------------------------------ */

async function getDailySales(params: Record<string, string>) {
  let query = supabase
    .from('sales')
    .select('id, total, subtotal, tax_amount, discount_amount, payment_method, created_at')
    .eq('status', 'completed')

  if (params.date_from) query = query.gte('created_at', params.date_from)
  if (params.date_to) query = query.lte('created_at', params.date_to + 'T23:59:59.999Z')

  const { data: sales, error } = await query.order('created_at', { ascending: true })
  if (error) throw new Error(error.message)

  const dailyMap = new Map<string, any>()
  for (const sale of sales ?? []) {
    const date = sale.created_at.slice(0, 10)
    let day = dailyMap.get(date)
    if (!day) {
      day = { date, sale_count: 0, total_revenue: 0, total_subtotal: 0, total_tax: 0, total_discount: 0, by_payment_method: {} }
      dailyMap.set(date, day)
    }
    day.sale_count++
    day.total_revenue += Number(sale.total)
    day.total_subtotal += Number(sale.subtotal)
    day.total_tax += Number(sale.tax_amount)
    day.total_discount += Number(sale.discount_amount)
    const m = sale.payment_method ?? 'cash'
    if (!day.by_payment_method[m]) day.by_payment_method[m] = { count: 0, total: 0 }
    day.by_payment_method[m].count++
    day.by_payment_method[m].total += Number(sale.total)
  }

  const days = Array.from(dailyMap.values())
  return {
    summary: {
      total_revenue: days.reduce((s, d) => s + d.total_revenue, 0),
      total_subtotal: days.reduce((s, d) => s + d.total_subtotal, 0),
      total_tax: days.reduce((s, d) => s + d.total_tax, 0),
      total_discount: days.reduce((s, d) => s + d.total_discount, 0),
      sale_count: days.reduce((s, d) => s + d.sale_count, 0),
    },
    days,
  }
}

async function getMargins(params: Record<string, string>) {
  let salesQuery = supabase.from('sales').select('id').eq('status', 'completed')
  if (params.date_from) salesQuery = salesQuery.gte('created_at', params.date_from)
  if (params.date_to) salesQuery = salesQuery.lte('created_at', params.date_to + 'T23:59:59.999Z')

  const { data: salesData } = await salesQuery
  const saleIds = (salesData ?? []).map((s) => s.id)
  if (!saleIds.length) return { products: [] }

  const { data: items } = await supabase
    .from('sale_items')
    .select('drug_id, quantity, unit_price, cost_price, total, drugs(name, generic_name, barcode)')
    .in('sale_id', saleIds)

  const drugMap = new Map<string, any>()
  for (const item of items ?? []) {
    const drug = item.drugs as any
    let entry = drugMap.get(item.drug_id)
    if (!entry) {
      entry = {
        drug_id: item.drug_id,
        drug_name: drug?.name ?? 'Unknown',
        generic_name: drug?.generic_name ?? null,
        barcode: drug?.barcode ?? null,
        units_sold: 0,
        total_revenue: 0,
        total_cost: 0,
        total_margin: 0,
      }
      drugMap.set(item.drug_id, entry)
    }
    const qty = Number(item.quantity)
    const revenue = Number(item.total)
    const cost = Number(item.cost_price) * qty
    entry.units_sold += qty
    entry.total_revenue += revenue
    entry.total_cost += cost
    entry.total_margin += revenue - cost
  }

  const products = Array.from(drugMap.values()).map((p) => ({
    ...p,
    avg_unit_price: p.units_sold > 0 ? p.total_revenue / p.units_sold : 0,
    avg_cost_price: p.units_sold > 0 ? p.total_cost / p.units_sold : 0,
    margin_percentage: p.total_revenue > 0 ? (p.total_margin / p.total_revenue) * 100 : 0,
  }))
  products.sort((a, b) => b.total_margin - a.total_margin)
  return { products }
}

async function getTaxSummary(params: Record<string, string>) {
  let query = supabase
    .from('sales')
    .select('id, subtotal, tax_amount, discount_amount, total, created_at')
    .eq('status', 'completed')

  if (params.date_from) query = query.gte('created_at', params.date_from)
  if (params.date_to) query = query.lte('created_at', params.date_to + 'T23:59:59.999Z')

  const { data: sales, error } = await query.order('created_at', { ascending: true })
  if (error) throw new Error(error.message)

  const dailyMap = new Map<string, any>()
  for (const sale of sales ?? []) {
    const date = sale.created_at.slice(0, 10)
    let day = dailyMap.get(date)
    if (!day) { day = { date, sale_count: 0, taxable_amount: 0, tax_collected: 0 }; dailyMap.set(date, day) }
    day.sale_count++
    day.taxable_amount += Number(sale.subtotal) - Number(sale.discount_amount)
    day.tax_collected += Number(sale.tax_amount)
  }

  const days = Array.from(dailyMap.values())
  const summary = {
    total_taxable_amount: days.reduce((s, d) => s + d.taxable_amount, 0),
    total_tax_collected: days.reduce((s, d) => s + d.tax_collected, 0),
    sale_count: days.reduce((s, d) => s + d.sale_count, 0),
    effective_tax_rate: 0,
  }
  if (summary.total_taxable_amount > 0) {
    summary.effective_tax_rate = (summary.total_tax_collected / summary.total_taxable_amount) * 100
  }
  return { summary, days }
}

/* ------------------------------------------------------------------ */
/*  Suppliers                                                          */
/* ------------------------------------------------------------------ */

async function listSuppliers() {
  const { data, error } = await supabase.from('suppliers').select('*').order('name')
  if (error) throw new Error(error.message)
  return data ?? []
}

async function getSupplier(id: string) {
  const { data, error } = await supabase.from('suppliers').select('*').eq('id', id).single()
  if (error) throw new Error(error.message)
  return data
}

async function updateSupplier(id: string, body: any) {
  const { data, error } = await supabase
    .from('suppliers')
    .update({ ...body, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single()
  if (error) throw new Error(error.message)
  return data
}

async function createSupplier(body: any) {
  const { data, error } = await supabase.from('suppliers').insert(body).select().single()
  if (error) throw new Error(error.message)
  return data
}

async function listPurchaseOrders(params: Record<string, string>) {
  let query = supabase
    .from('purchase_orders')
    .select('*, suppliers(name), profiles:ordered_by(full_name)')
  if (params.status) query = query.eq('status', params.status)
  const { data, error } = await query.order('created_at', { ascending: false })
  if (error) throw new Error(error.message)
  return { data: data ?? [] }
}

async function getPurchaseOrder(id: string) {
  const { data, error } = await supabase
    .from('purchase_orders')
    .select('*, purchase_order_items(*, drugs(name, generic_name, barcode)), suppliers(name, contact_person, email, phone), profiles:ordered_by(full_name)')
    .eq('id', id)
    .single()
  if (error) throw new Error(error.message)
  return data
}

async function createPurchaseOrder(body: any) {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  const todayCompact = new Date().toISOString().slice(0, 10).replace(/-/g, '')
  const { count } = await supabase.from('purchase_orders').select('*', { count: 'exact', head: true })
  const seq = ((count ?? 0) + 1).toString().padStart(4, '0')
  const order_number = `PO-${todayCompact}-${seq}`

  const totalAmount = (body.items ?? []).reduce((s: number, i: any) => s + i.quantity_ordered * i.unit_cost, 0)

  const { data: po, error: poErr } = await supabase
    .from('purchase_orders')
    .insert({
      order_number,
      supplier_id: body.supplier_id,
      ordered_by: user.id,
      notes: body.notes ?? null,
      expected_delivery: body.expected_delivery ?? null,
      total_amount: totalAmount,
    })
    .select()
    .single()
  if (poErr) throw new Error(poErr.message)

  if (body.items?.length) {
    const items = body.items.map((i: any) => ({
      purchase_order_id: po.id,
      drug_id: i.drug_id,
      quantity_ordered: i.quantity_ordered,
      unit_cost: i.unit_cost,
      total: i.quantity_ordered * i.unit_cost,
    }))
    const { error: itemsErr } = await supabase.from('purchase_order_items').insert(items)
    if (itemsErr) throw new Error(itemsErr.message)
  }

  return getPurchaseOrder(po.id)
}

async function sendPO(id: string) {
  const { data, error } = await supabase
    .from('purchase_orders')
    .update({ status: 'sent', updated_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single()
  if (error) throw new Error(error.message)
  return data
}

async function receivePO(id: string, body: any) {
  const po = await getPurchaseOrder(id)
  for (const entry of body.items ?? []) {
    if (entry.quantity_received <= 0) continue
    // Update PO item received quantity
    const poItem = (po as any).purchase_order_items?.find((i: any) => i.id === entry.purchase_order_item_id)
    if (poItem) {
      await supabase
        .from('purchase_order_items')
        .update({ quantity_received: poItem.quantity_received + entry.quantity_received })
        .eq('id', entry.purchase_order_item_id)
      // Create stock batch
      await supabase.from('stock_batches').insert({
        drug_id: poItem.drug_id,
        batch_number: entry.batch_number,
        quantity: entry.quantity_received,
        expiry_date: entry.expiry_date,
        supplier_id: (po as any).supplier_id,
        purchase_order_id: id,
      })
    }
  }
  // Check if all items fully received
  const updated = await getPurchaseOrder(id)
  const allReceived = (updated as any).purchase_order_items?.every(
    (i: any) => i.quantity_received >= i.quantity_ordered
  )
  const anyReceived = (updated as any).purchase_order_items?.some(
    (i: any) => i.quantity_received > 0
  )
  const newStatus = allReceived ? 'received' : anyReceived ? 'partial' : (po as any).status
  if (newStatus !== (po as any).status) {
    await supabase.from('purchase_orders').update({ status: newStatus, updated_at: new Date().toISOString() }).eq('id', id)
  }
  return getPurchaseOrder(id)
}

/* ------------------------------------------------------------------ */
/*  Patients                                                           */
/* ------------------------------------------------------------------ */

async function listPatients(params: Record<string, string>) {
  const page = parseInt(params.page ?? '1')
  const limit = parseInt(params.limit ?? '50')
  const from = (page - 1) * limit
  const to = from + limit - 1

  let query = supabase.from('patients').select('*', { count: 'exact' })

  if (params.search) {
    const term = `%${params.search}%`
    query = query.or(`first_name.ilike.${term},last_name.ilike.${term},phone.ilike.${term}`)
  }

  const { data, error, count } = await query.order('created_at', { ascending: false }).range(from, to)
  if (error) throw new Error(error.message)
  return { data: data ?? [], total: count ?? 0, page, limit }
}

async function getPatient(id: string) {
  const { data, error } = await supabase.from('patients').select('*').eq('id', id).single()
  if (error) throw new Error(error.message)
  return data
}

async function updatePatient(id: string, body: any) {
  const { data, error } = await supabase
    .from('patients')
    .update({ ...body, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single()
  if (error) throw new Error(error.message)
  return data
}

async function createPatient(body: any) {
  const { data, error } = await supabase.from('patients').insert(body).select().single()
  if (error) throw new Error(error.message)
  return data
}

async function listPrescriptions(params: Record<string, string>) {
  let query = supabase
    .from('prescriptions')
    .select('*, patients(first_name, last_name)')
  if (params.patient_id) query = query.eq('patient_id', params.patient_id)
  if (params.status) query = query.eq('status', params.status)
  const { data, error } = await query.order('created_at', { ascending: false })
  if (error) throw new Error(error.message)
  return data ?? []
}
