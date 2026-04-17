export interface Category {
  id: string
  name: string
  description: string | null
  created_at: string
}

export interface Drug {
  id: string
  name: string
  generic_name: string | null
  category_id: string | null
  dosage_form: string | null
  strength: string | null
  barcode: string | null
  unit_price: number
  cost_price: number
  reorder_level: number
  requires_prescription: boolean
  is_active: boolean
  created_at: string
  updated_at: string
  categories: { name: string } | null
}

export interface DrugFormData {
  name: string
  generic_name: string
  category_id: string
  dosage_form: string
  strength: string
  barcode: string
  unit_price: string
  cost_price: string
  reorder_level: string
  requires_prescription: boolean
}

export interface StockBatch {
  id: string
  drug_id: string
  batch_number: string
  quantity: number
  expiry_date: string
  supplier_id: string | null
  purchase_order_id: string | null
  received_at: string
  created_at: string
  drugs: { name: string; generic_name: string | null; barcode: string | null } | null
}

export interface LowStockAlert {
  id: string
  name: string
  generic_name: string | null
  reorder_level: number
  total_stock: number
  is_active: boolean
}

export interface ExpiryAlert {
  id: string
  drug_id: string
  batch_number: string
  quantity: number
  expiry_date: string
  is_expired: boolean
  days_until_expiry: number
  drugs: { name: string; generic_name: string | null } | null
}

export interface AlertsResponse {
  low_stock: LowStockAlert[]
  expiring: ExpiryAlert[]
  expired: ExpiryAlert[]
}

export interface PaginatedResponse<T> {
  data: T[]
  total: number
  page: number
  limit: number
}
