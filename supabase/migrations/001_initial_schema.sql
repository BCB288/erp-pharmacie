-- ============================================================
-- ERP Pharmacie — Initial Schema + RLS Policies
-- ============================================================

-- --------------------------------------------------------
-- 0. Custom Types
-- --------------------------------------------------------
CREATE TYPE user_role AS ENUM ('admin', 'pharmacist', 'cashier');

-- --------------------------------------------------------
-- 1. Profiles (linked to auth.users)
-- --------------------------------------------------------
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  role user_role NOT NULL DEFAULT 'cashier',
  phone TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- --------------------------------------------------------
-- 2. Categories
-- --------------------------------------------------------
CREATE TABLE categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  description TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- --------------------------------------------------------
-- 3. Suppliers (before drugs, because stock_batches references both)
-- --------------------------------------------------------
CREATE TABLE suppliers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  contact_person TEXT,
  email TEXT,
  phone TEXT,
  address TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- --------------------------------------------------------
-- 4. Drugs
-- --------------------------------------------------------
CREATE TABLE drugs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  generic_name TEXT,
  category_id UUID REFERENCES categories(id),
  dosage_form TEXT,
  strength TEXT,
  barcode TEXT UNIQUE,
  unit_price NUMERIC(12,2) NOT NULL,
  cost_price NUMERIC(12,2) NOT NULL,
  reorder_level INTEGER NOT NULL DEFAULT 10,
  requires_prescription BOOLEAN NOT NULL DEFAULT false,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- --------------------------------------------------------
-- 5. Purchase Orders
-- --------------------------------------------------------
CREATE TABLE purchase_orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_number TEXT NOT NULL UNIQUE,
  supplier_id UUID NOT NULL REFERENCES suppliers(id),
  ordered_by UUID NOT NULL REFERENCES profiles(id),
  status TEXT NOT NULL DEFAULT 'draft',
  total_amount NUMERIC(12,2),
  notes TEXT,
  expected_delivery DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE purchase_order_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  purchase_order_id UUID NOT NULL REFERENCES purchase_orders(id) ON DELETE CASCADE,
  drug_id UUID NOT NULL REFERENCES drugs(id),
  quantity_ordered INTEGER NOT NULL,
  quantity_received INTEGER NOT NULL DEFAULT 0,
  unit_cost NUMERIC(12,2) NOT NULL,
  total NUMERIC(12,2) NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- --------------------------------------------------------
-- 6. Stock Batches
-- --------------------------------------------------------
CREATE TABLE stock_batches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  drug_id UUID NOT NULL REFERENCES drugs(id),
  batch_number TEXT NOT NULL,
  quantity INTEGER NOT NULL,
  expiry_date DATE NOT NULL,
  supplier_id UUID REFERENCES suppliers(id),
  purchase_order_id UUID REFERENCES purchase_orders(id),
  received_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(drug_id, batch_number)
);

CREATE INDEX idx_stock_batches_expiry ON stock_batches(expiry_date) WHERE quantity > 0;

-- --------------------------------------------------------
-- 7. Patients
-- --------------------------------------------------------
CREATE TABLE patients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  date_of_birth DATE,
  phone TEXT,
  email TEXT,
  address TEXT,
  allergies TEXT[],
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- --------------------------------------------------------
-- 8. Sales
-- --------------------------------------------------------
CREATE TABLE sales (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sale_number TEXT NOT NULL UNIQUE,
  cashier_id UUID NOT NULL REFERENCES profiles(id),
  patient_id UUID REFERENCES patients(id),
  prescription_number TEXT,
  subtotal NUMERIC(12,2) NOT NULL,
  tax_amount NUMERIC(12,2) NOT NULL DEFAULT 0,
  discount_amount NUMERIC(12,2) NOT NULL DEFAULT 0,
  total NUMERIC(12,2) NOT NULL,
  payment_method TEXT NOT NULL DEFAULT 'cash',
  status TEXT NOT NULL DEFAULT 'completed',
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE sale_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sale_id UUID NOT NULL REFERENCES sales(id) ON DELETE CASCADE,
  drug_id UUID NOT NULL REFERENCES drugs(id),
  batch_id UUID NOT NULL REFERENCES stock_batches(id),
  quantity INTEGER NOT NULL,
  unit_price NUMERIC(12,2) NOT NULL,
  cost_price NUMERIC(12,2) NOT NULL,
  discount NUMERIC(12,2) NOT NULL DEFAULT 0,
  total NUMERIC(12,2) NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- --------------------------------------------------------
-- 9. Prescriptions
-- --------------------------------------------------------
CREATE TABLE prescriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id UUID NOT NULL REFERENCES patients(id),
  prescription_number TEXT NOT NULL UNIQUE,
  prescriber_name TEXT NOT NULL,
  prescriber_license TEXT,
  sale_id UUID REFERENCES sales(id),
  items JSONB NOT NULL,
  status TEXT NOT NULL DEFAULT 'active',
  prescribed_date DATE NOT NULL,
  expiry_date DATE,
  dispensed_by UUID REFERENCES profiles(id),
  dispensed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================================
-- Helper: get the current user's role from profiles
-- ============================================================
CREATE OR REPLACE FUNCTION public.current_user_role()
RETURNS user_role
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT role FROM profiles WHERE id = auth.uid();
$$;

-- ============================================================
-- RLS Policies
-- ============================================================

-- --------------------------------------------------------
-- profiles
-- --------------------------------------------------------
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "profiles_select_own"
  ON profiles FOR SELECT
  USING (id = auth.uid());

CREATE POLICY "profiles_select_admin"
  ON profiles FOR SELECT
  USING (current_user_role() = 'admin');

CREATE POLICY "profiles_insert_admin"
  ON profiles FOR INSERT
  WITH CHECK (current_user_role() = 'admin');

CREATE POLICY "profiles_update_admin"
  ON profiles FOR UPDATE
  USING (current_user_role() = 'admin');

CREATE POLICY "profiles_delete_admin"
  ON profiles FOR DELETE
  USING (current_user_role() = 'admin');

-- --------------------------------------------------------
-- categories — all auth read, admin+pharmacist write
-- --------------------------------------------------------
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "categories_select_auth"
  ON categories FOR SELECT
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "categories_insert_admin_pharm"
  ON categories FOR INSERT
  WITH CHECK (current_user_role() IN ('admin', 'pharmacist'));

CREATE POLICY "categories_update_admin_pharm"
  ON categories FOR UPDATE
  USING (current_user_role() IN ('admin', 'pharmacist'));

CREATE POLICY "categories_delete_admin_pharm"
  ON categories FOR DELETE
  USING (current_user_role() IN ('admin', 'pharmacist'));

-- --------------------------------------------------------
-- drugs — all auth read, admin+pharmacist write
-- --------------------------------------------------------
ALTER TABLE drugs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "drugs_select_auth"
  ON drugs FOR SELECT
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "drugs_insert_admin_pharm"
  ON drugs FOR INSERT
  WITH CHECK (current_user_role() IN ('admin', 'pharmacist'));

CREATE POLICY "drugs_update_admin_pharm"
  ON drugs FOR UPDATE
  USING (current_user_role() IN ('admin', 'pharmacist'));

CREATE POLICY "drugs_delete_admin_pharm"
  ON drugs FOR DELETE
  USING (current_user_role() IN ('admin', 'pharmacist'));

-- --------------------------------------------------------
-- suppliers — all auth read, admin+pharmacist write
-- --------------------------------------------------------
ALTER TABLE suppliers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "suppliers_select_auth"
  ON suppliers FOR SELECT
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "suppliers_insert_admin_pharm"
  ON suppliers FOR INSERT
  WITH CHECK (current_user_role() IN ('admin', 'pharmacist'));

CREATE POLICY "suppliers_update_admin_pharm"
  ON suppliers FOR UPDATE
  USING (current_user_role() IN ('admin', 'pharmacist'));

CREATE POLICY "suppliers_delete_admin_pharm"
  ON suppliers FOR DELETE
  USING (current_user_role() IN ('admin', 'pharmacist'));

-- --------------------------------------------------------
-- stock_batches — all auth read, admin+pharmacist write
-- --------------------------------------------------------
ALTER TABLE stock_batches ENABLE ROW LEVEL SECURITY;

CREATE POLICY "stock_batches_select_auth"
  ON stock_batches FOR SELECT
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "stock_batches_insert_admin_pharm"
  ON stock_batches FOR INSERT
  WITH CHECK (current_user_role() IN ('admin', 'pharmacist'));

CREATE POLICY "stock_batches_update_admin_pharm"
  ON stock_batches FOR UPDATE
  USING (current_user_role() IN ('admin', 'pharmacist'));

CREATE POLICY "stock_batches_delete_admin_pharm"
  ON stock_batches FOR DELETE
  USING (current_user_role() IN ('admin', 'pharmacist'));

-- --------------------------------------------------------
-- purchase_orders — all auth read, admin+pharmacist write
-- --------------------------------------------------------
ALTER TABLE purchase_orders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "purchase_orders_select_auth"
  ON purchase_orders FOR SELECT
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "purchase_orders_insert_admin_pharm"
  ON purchase_orders FOR INSERT
  WITH CHECK (current_user_role() IN ('admin', 'pharmacist'));

CREATE POLICY "purchase_orders_update_admin_pharm"
  ON purchase_orders FOR UPDATE
  USING (current_user_role() IN ('admin', 'pharmacist'));

CREATE POLICY "purchase_orders_delete_admin_pharm"
  ON purchase_orders FOR DELETE
  USING (current_user_role() IN ('admin', 'pharmacist'));

-- --------------------------------------------------------
-- purchase_order_items — same as purchase_orders
-- --------------------------------------------------------
ALTER TABLE purchase_order_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "po_items_select_auth"
  ON purchase_order_items FOR SELECT
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "po_items_insert_admin_pharm"
  ON purchase_order_items FOR INSERT
  WITH CHECK (current_user_role() IN ('admin', 'pharmacist'));

CREATE POLICY "po_items_update_admin_pharm"
  ON purchase_order_items FOR UPDATE
  USING (current_user_role() IN ('admin', 'pharmacist'));

CREATE POLICY "po_items_delete_admin_pharm"
  ON purchase_order_items FOR DELETE
  USING (current_user_role() IN ('admin', 'pharmacist'));

-- --------------------------------------------------------
-- patients — admin+pharmacist full CRUD, cashier read-only
-- --------------------------------------------------------
ALTER TABLE patients ENABLE ROW LEVEL SECURITY;

CREATE POLICY "patients_select_auth"
  ON patients FOR SELECT
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "patients_insert_admin_pharm"
  ON patients FOR INSERT
  WITH CHECK (current_user_role() IN ('admin', 'pharmacist'));

CREATE POLICY "patients_update_admin_pharm"
  ON patients FOR UPDATE
  USING (current_user_role() IN ('admin', 'pharmacist'));

CREATE POLICY "patients_delete_admin_pharm"
  ON patients FOR DELETE
  USING (current_user_role() IN ('admin', 'pharmacist'));

-- --------------------------------------------------------
-- sales — all auth can insert (any staff processes sales),
--          all auth can read, admin can update (void/refund)
-- --------------------------------------------------------
ALTER TABLE sales ENABLE ROW LEVEL SECURITY;

CREATE POLICY "sales_select_auth"
  ON sales FOR SELECT
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "sales_insert_auth"
  ON sales FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "sales_update_admin"
  ON sales FOR UPDATE
  USING (current_user_role() = 'admin');

CREATE POLICY "sales_delete_admin"
  ON sales FOR DELETE
  USING (current_user_role() = 'admin');

-- --------------------------------------------------------
-- sale_items — all auth can insert + read, admin can update/delete
-- --------------------------------------------------------
ALTER TABLE sale_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "sale_items_select_auth"
  ON sale_items FOR SELECT
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "sale_items_insert_auth"
  ON sale_items FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "sale_items_update_admin"
  ON sale_items FOR UPDATE
  USING (current_user_role() = 'admin');

CREATE POLICY "sale_items_delete_admin"
  ON sale_items FOR DELETE
  USING (current_user_role() = 'admin');

-- --------------------------------------------------------
-- prescriptions — admin+pharmacist full CRUD
-- --------------------------------------------------------
ALTER TABLE prescriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "prescriptions_select_admin_pharm"
  ON prescriptions FOR SELECT
  USING (current_user_role() IN ('admin', 'pharmacist'));

CREATE POLICY "prescriptions_insert_admin_pharm"
  ON prescriptions FOR INSERT
  WITH CHECK (current_user_role() IN ('admin', 'pharmacist'));

CREATE POLICY "prescriptions_update_admin_pharm"
  ON prescriptions FOR UPDATE
  USING (current_user_role() IN ('admin', 'pharmacist'));

CREATE POLICY "prescriptions_delete_admin_pharm"
  ON prescriptions FOR DELETE
  USING (current_user_role() IN ('admin', 'pharmacist'));

-- ============================================================
-- Trigger: auto-update updated_at on tables that have it
-- ============================================================
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER set_updated_at BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION handle_updated_at();

CREATE TRIGGER set_updated_at BEFORE UPDATE ON drugs
  FOR EACH ROW EXECUTE FUNCTION handle_updated_at();

CREATE TRIGGER set_updated_at BEFORE UPDATE ON suppliers
  FOR EACH ROW EXECUTE FUNCTION handle_updated_at();

CREATE TRIGGER set_updated_at BEFORE UPDATE ON patients
  FOR EACH ROW EXECUTE FUNCTION handle_updated_at();

CREATE TRIGGER set_updated_at BEFORE UPDATE ON purchase_orders
  FOR EACH ROW EXECUTE FUNCTION handle_updated_at();

-- ============================================================
-- Trigger: auto-create profile on auth.users insert
-- ============================================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, role)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data ->> 'full_name', NEW.email),
    COALESCE((NEW.raw_user_meta_data ->> 'role')::user_role, 'cashier')
  );
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();
