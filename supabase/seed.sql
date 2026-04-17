-- ============================================================
-- ERP Pharmacie — Seed Data (dev only)
-- ============================================================
-- Note: Run AFTER the migration. Auth users should be created
-- via Supabase Auth (supabase.auth.admin.createUser) or the
-- /api/auth/register endpoint. The on_auth_user_created trigger
-- will auto-create profiles rows.

-- Categories
INSERT INTO categories (id, name, description) VALUES
  ('a0000000-0000-0000-0000-000000000001', 'Analgesiques', 'Medicaments anti-douleur'),
  ('a0000000-0000-0000-0000-000000000002', 'Antibiotiques', 'Medicaments anti-infectieux'),
  ('a0000000-0000-0000-0000-000000000003', 'Antipaludeens', 'Traitement du paludisme'),
  ('a0000000-0000-0000-0000-000000000004', 'Vitamines', 'Supplements vitaminiques'),
  ('a0000000-0000-0000-0000-000000000005', 'Dermatologie', 'Soins de la peau');

-- Suppliers
INSERT INTO suppliers (id, name, contact_person, phone, email) VALUES
  ('b0000000-0000-0000-0000-000000000001', 'PharmaDistrib SARL', 'Mamadou Diallo', '+224 621 00 00 01', 'contact@pharmadistrib.gn'),
  ('b0000000-0000-0000-0000-000000000002', 'MediSource International', 'Aissatou Barry', '+224 621 00 00 02', 'info@medisource.com');

-- Drugs
INSERT INTO drugs (id, name, generic_name, category_id, dosage_form, strength, barcode, unit_price, cost_price, reorder_level, requires_prescription) VALUES
  ('c0000000-0000-0000-0000-000000000001', 'Paracetamol 500mg', 'Paracetamol', 'a0000000-0000-0000-0000-000000000001', 'comprime', '500mg', '3001234500001', 500.00, 250.00, 20, false),
  ('c0000000-0000-0000-0000-000000000002', 'Amoxicilline 500mg', 'Amoxicilline', 'a0000000-0000-0000-0000-000000000002', 'gelule', '500mg', '3001234500002', 1500.00, 800.00, 15, true),
  ('c0000000-0000-0000-0000-000000000003', 'Artemether-Lumefantrine', 'ACT', 'a0000000-0000-0000-0000-000000000003', 'comprime', '20/120mg', '3001234500003', 3000.00, 1500.00, 10, true),
  ('c0000000-0000-0000-0000-000000000004', 'Vitamine C 1000mg', 'Acide ascorbique', 'a0000000-0000-0000-0000-000000000004', 'comprime effervescent', '1000mg', '3001234500004', 2000.00, 1000.00, 25, false),
  ('c0000000-0000-0000-0000-000000000005', 'Ibuprofene 400mg', 'Ibuprofene', 'a0000000-0000-0000-0000-000000000001', 'comprime', '400mg', '3001234500005', 750.00, 350.00, 20, false);
