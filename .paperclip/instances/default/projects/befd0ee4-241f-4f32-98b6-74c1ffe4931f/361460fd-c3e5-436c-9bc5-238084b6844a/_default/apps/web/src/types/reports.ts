export interface DailySalesDay {
  date: string
  sale_count: number
  total_revenue: number
  total_subtotal: number
  total_tax: number
  total_discount: number
  by_payment_method: Record<string, { count: number; total: number }>
}

export interface DailySalesSummary {
  total_revenue: number
  total_subtotal: number
  total_tax: number
  total_discount: number
  sale_count: number
}

export interface DailySalesResponse {
  summary: DailySalesSummary
  days: DailySalesDay[]
}

export interface MarginProduct {
  drug_id: string
  drug_name: string
  generic_name: string | null
  barcode: string | null
  units_sold: number
  total_revenue: number
  total_cost: number
  total_margin: number
  avg_unit_price: number
  avg_cost_price: number
  margin_percentage: number
}

export interface MarginsResponse {
  products: MarginProduct[]
}

export interface TaxDay {
  date: string
  sale_count: number
  taxable_amount: number
  tax_collected: number
}

export interface TaxSummaryTotals {
  total_taxable_amount: number
  total_tax_collected: number
  sale_count: number
  effective_tax_rate: number
}

export interface TaxSummaryResponse {
  summary: TaxSummaryTotals
  days: TaxDay[]
}
