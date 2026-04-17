import type { Drug } from './inventory'

export interface CartItem {
  drug: Drug
  quantity: number
  discount: number
  lineTotal: number
}

export interface SaleItemInput {
  drug_id: string
  quantity: number
  discount?: number
}

export interface CreateSalePayload {
  items: SaleItemInput[]
  patient_id?: string
  prescription_number?: string
  payment_method: string
  tax_rate?: number
  notes?: string
}

export interface SaleItem {
  id: string
  sale_id: string
  drug_id: string
  batch_id: string
  quantity: number
  unit_price: number
  cost_price: number
  discount: number
  total: number
  drugs: { name: string; generic_name: string | null; barcode: string | null }
}

export interface Sale {
  id: string
  sale_number: string
  cashier_id: string
  patient_id: string | null
  prescription_number: string | null
  subtotal: number
  tax_amount: number
  discount_amount: number
  total: number
  payment_method: string
  status: string
  notes: string | null
  created_at: string
  sale_items: SaleItem[]
  profiles: { full_name: string } | null
  patients: { first_name: string; last_name: string } | null
}

export type PaymentMethod = 'cash' | 'card' | 'mobile'
